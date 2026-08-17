// Meenakshi Build World — taxonomy completion migration
// Extends the existing Floor Tiles / Wall Tiles category structure with the
// full subcategory spec. It is idempotent and additive:
//   - adds missing categories under the Area/Size/Design/Type/Finish/Color groups
//   - renames a handful of near-duplicate design/type values so the storefront
//     matches the authoritative spec exactly (e.g. Flower -> Floral)
//   - normalises any category created by an earlier draft of this migration that
//     used the wrong display-name convention (sizes/designs/finishes are bare)
//   - ensures categories.banner_url exists for admin banner uploads
// Nothing is deleted; existing products and their category tags are untouched.
//
// Naming convention (matches the rest of the catalogue):
//   Area      -> suffixed : "Living Room Floor Tiles"  ("Feature Wall Tiles" is literal)
//   Size      -> bare     : "600x600 mm"  (URL slug /floor-tiles/600x600)
//   Design    -> bare     : "Marble"      (URL slug /floor-tiles/marble)
//   Type      -> bare     : "Vitrified"
//   Finish    -> bare     : "Matt"
//   Color     -> bare     : "Grey"
const db = require('./db');

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/&/g, ' and ')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Sizes are written "600x1200 mm" in the taxonomy but their URLs are clean
// (/floor-tiles/600x1200) — the unit suffix is stripped from the slug only.
function slugifySize(value) {
    return slugify(value.replace(/\s*mm\b/gi, '').trim());
}

const TILE_IMAGES = [
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1615529162924-f8605388461d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=80'
];

// ---------------------------------------------------------------------------
// Missing values, keyed by main-category slug then group_key.
// ---------------------------------------------------------------------------
const TAXONOMY = {
    'floor-tiles': {
        area: ['Patio', 'Garage', 'Office', 'Hotel', 'Industrial'],
        size: ['150x150 mm'],
        design: ['Concrete'],
        finish: ['High Gloss']
    },
    'wall-tiles': {
        area: [
            'Terrace', 'Exterior', 'Interior', 'Feature Wall Tiles', 'Accent Wall Tiles',
            'Staircase', 'Hospital', 'School', 'Reception', 'Lobby'
        ],
        size: ['75x200 mm', '150x250 mm', '200x300 mm', '200x600 mm', '300x900 mm', '300x1200 mm', '400x400 mm'],
        design: [
            'Pattern', 'Plain', 'Octagon', 'Herringbone', 'Travertine', 'Slate', 'Concrete',
            'Cement', 'Fluted', 'Onyx', 'Book Match', 'Carrara', 'Statuario',
            'Stone Effect', 'Marble Effect', 'Wood Effect'
        ],
        finish: ['High Gloss', 'Carving', 'Lappato', 'Polished', 'Sugar Finish']
    }
};

// Existing values whose names differ from the spec. [mainSlug, groupKey, oldName, newName, preferredSlug]
const RENAMES = [
    ['floor-tiles', 'design', 'Flower', 'Floral', 'floral'],
    ['floor-tiles', 'design', 'Hexagonal', 'Hexagon', 'hexagon'],
    ['floor-tiles', 'design', 'Carpet', 'Carpet Design', 'carpet-design'],
    ['floor-tiles', 'design', 'Kota', 'Kota Design', 'kota-design'],
    ['floor-tiles', 'design', 'Blue Pottery', 'Blue Pottery Design', 'blue-pottery-design'],
    // "Terracotta" already exists in the colour group, so the design slug stays unique.
    ['floor-tiles', 'design', 'Terracotta Clay Jali', 'Terracotta', 'terracotta-design'],
    ['wall-tiles', 'type', 'Double Charge', 'Double Charge Vitrified', 'double-charge-vitrified']
];

// Categories an earlier draft of this migration inserted with the suffixed
// naming ("Concrete Floor Tiles") that should be bare ("Concrete"). Only applies
// to rows that still carry the wrong convention; area rows are never touched.
// [mainSlug, groupKey, currentName, newName]
const NORMALIZE = [
    ['floor-tiles', 'size', '150x150 mm Floor Tiles', '150x150 mm'],
    ['floor-tiles', 'design', 'Concrete Floor Tiles', 'Concrete'],
    ['floor-tiles', 'finish', 'High Gloss Floor Tiles', 'High Gloss'],
    ['wall-tiles', 'size', '75x200 mm Wall Tiles', '75x200 mm'],
    ['wall-tiles', 'size', '150x250 mm Wall Tiles', '150x250 mm'],
    ['wall-tiles', 'size', '200x300 mm Wall Tiles', '200x300 mm'],
    ['wall-tiles', 'size', '200x600 mm Wall Tiles', '200x600 mm'],
    ['wall-tiles', 'size', '300x900 mm Wall Tiles', '300x900 mm'],
    ['wall-tiles', 'size', '300x1200 mm Wall Tiles', '300x1200 mm'],
    ['wall-tiles', 'size', '400x400 mm Wall Tiles', '400x400 mm'],
    ['wall-tiles', 'design', 'Pattern Wall Tiles', 'Pattern'],
    ['wall-tiles', 'design', 'Plain Wall Tiles', 'Plain'],
    ['wall-tiles', 'design', 'Octagon Wall Tiles', 'Octagon'],
    ['wall-tiles', 'design', 'Herringbone Wall Tiles', 'Herringbone'],
    ['wall-tiles', 'design', 'Travertine Wall Tiles', 'Travertine'],
    ['wall-tiles', 'design', 'Slate Wall Tiles', 'Slate'],
    ['wall-tiles', 'design', 'Concrete Wall Tiles', 'Concrete'],
    ['wall-tiles', 'design', 'Cement Wall Tiles', 'Cement'],
    ['wall-tiles', 'design', 'Fluted Wall Tiles', 'Fluted'],
    ['wall-tiles', 'design', 'Onyx Wall Tiles', 'Onyx'],
    ['wall-tiles', 'design', 'Book Match Wall Tiles', 'Book Match'],
    ['wall-tiles', 'design', 'Carrara Wall Tiles', 'Carrara'],
    ['wall-tiles', 'design', 'Statuario Wall Tiles', 'Statuario'],
    ['wall-tiles', 'design', 'Stone Effect Wall Tiles', 'Stone Effect'],
    ['wall-tiles', 'design', 'Marble Effect Wall Tiles', 'Marble Effect'],
    ['wall-tiles', 'design', 'Wood Effect Wall Tiles', 'Wood Effect'],
    ['wall-tiles', 'finish', 'High Gloss Wall Tiles', 'High Gloss'],
    ['wall-tiles', 'finish', 'Carving Wall Tiles', 'Carving'],
    ['wall-tiles', 'finish', 'Lappato Wall Tiles', 'Lappato'],
    ['wall-tiles', 'finish', 'Polished Wall Tiles', 'Polished'],
    ['wall-tiles', 'finish', 'Sugar Finish Wall Tiles', 'Sugar Finish']
];

async function ensureBannerColumn() {
    const cols = await db.query(`PRAGMA table_info(categories)`);
    const hasBanner = cols.some(c => c.name === 'banner_url');
    if (!hasBanner) {
        await db.query(`ALTER TABLE categories ADD COLUMN banner_url TEXT`);
        console.log('[Migration] Added categories.banner_url column');
    }
}

async function run() {
    await ensureBannerColumn();

    const mainIdBySlug = {};
    for (const row of await db.query(`SELECT id, slug FROM categories WHERE parent_id IS NULL`)) {
        mainIdBySlug[row.slug] = row.id;
    }
    const groupIdByKey = {};
    for (const row of await db.query(`SELECT id, group_key FROM category_groups`)) {
        groupIdByKey[row.group_key] = row.id;
    }

    // Slug must stay unique among siblings (parent_id, slug unique index).
    async function siblingSlugExists(parentId, slug) {
        const row = await db.queryOne(`SELECT id FROM categories WHERE parent_id = ? AND slug = ?`, [parentId, slug]);
        return !!row;
    }
    async function uniqueSlug(parentId, groupKey, base) {
        let slug = base;
        if (await siblingSlugExists(parentId, slug)) slug = groupKey ? `${slug}-${groupKey}` : `${slug}-2`;
        let n = 2;
        while (await siblingSlugExists(parentId, slug)) slug = `${base}-${n++}`;
        return slug;
    }

    const mainNameOf = (mainSlug) => (mainSlug === 'floor-tiles' ? 'Floor Tiles' : 'Wall Tiles');

    // ---- 1. Renames -----------------------------------------------------
    for (const [mainSlug, groupKey, oldName, newName, prefSlug] of RENAMES) {
        const mainId = mainIdBySlug[mainSlug];
        const groupId = groupIdByKey[groupKey];
        if (!mainId || !groupId) continue;
        const cat = await db.queryOne(
            `SELECT * FROM categories WHERE parent_id = ? AND group_id = ? AND name = ?`,
            [mainId, groupId, oldName]
        );
        if (!cat) { console.log(`[Migration] Rename target already updated, skipped: ${oldName}`); continue; }
        const slug = await uniqueSlug(mainId, groupKey, prefSlug);
        const composedName = `${newName} ${mainNameOf(mainSlug)}`;
        const seoTitle = `${composedName} | Meenakshi Build World`;
        await db.query(
            `UPDATE categories SET name = ?, slug = ?, seo_title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [newName, slug, seoTitle, cat.id]
        );
        console.log(`[Migration] Renamed "${oldName}" -> "${newName}" (${mainSlug}/${groupKey}, slug=${slug})`);
    }

    // ---- 2. Normalise bare-name conventions ------------------------------
    for (const [mainSlug, groupKey, wrongName, rightName] of NORMALIZE) {
        const mainId = mainIdBySlug[mainSlug];
        const groupId = groupIdByKey[groupKey];
        if (!mainId || !groupId) continue;
        const cat = await db.queryOne(
            `SELECT * FROM categories WHERE parent_id = ? AND group_id = ? AND name = ?`,
            [mainId, groupId, wrongName]
        );
        if (!cat) { console.log(`[Migration] Nothing to normalise, skipped: ${wrongName}`); continue; }
        const baseSlug = groupKey === 'size' ? slugifySize(rightName) : slugify(rightName);
        const slug = await uniqueSlug(mainId, groupKey, baseSlug);
        const composedName = `${rightName} ${mainNameOf(mainSlug)}`;
        const seoTitle = `${composedName} | Meenakshi Build World`;
        await db.query(
            `UPDATE categories SET name = ?, slug = ?, seo_title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [rightName, slug, seoTitle, cat.id]
        );
        console.log(`[Migration] Normalised "${wrongName}" -> "${rightName}" (slug=${slug})`);
    }

    // ---- 3. Insert missing categories -----------------------------------
    let added = 0;
    for (const mainSlug of Object.keys(TAXONOMY)) {
        const mainId = mainIdBySlug[mainSlug];
        if (!mainId) continue;
        const mainName = mainNameOf(mainSlug);
        const existingOrder = await db.queryOne(
            `SELECT COALESCE(MAX(display_order), 0) as maxOrder FROM categories WHERE parent_id = ?`,
            [mainId]
        );
        let order = parseInt(existingOrder.maxOrder) + 1;

        for (const groupKey of Object.keys(TAXONOMY[mainSlug])) {
            const groupId = groupIdByKey[groupKey];
            if (!groupId) continue;
            for (const value of TAXONOMY[mainSlug][groupKey]) {
                // Area group composes a suffix ("Patio" -> "Patio Floor Tiles"),
                // but a value that is already a full name ("Feature Wall Tiles")
                // is used literally. All other groups are bare.
                const suffixMode = groupKey === 'area';
                const literal = / Tiles$/i.test(value);
                const displayName = (suffixMode && !literal) ? `${value} ${mainName}` : value;
                const composedName = literal ? value : `${value} ${mainName}`;

                const exists = await db.queryOne(
                    `SELECT id FROM categories WHERE parent_id = ? AND group_id = ? AND name = ?`,
                    [mainId, groupId, displayName]
                );
                if (exists) { console.log(`[Migration] Already present, skipped: ${displayName}`); continue; }

                const baseSlug = groupKey === 'size'
                    ? slugifySize(value)
                    : slugify(displayName);
                const slug = await uniqueSlug(mainId, groupKey, baseSlug);

                const seoTitle = `${composedName} | Meenakshi Build World`;
                const seoDesc = `Shop ${composedName.toLowerCase()} online. Compare designs, sizes and prices at Meenakshi Build World.`;
                const description = `${composedName} — premium quality, competitively priced, ready for fast delivery.`;
                const image = TILE_IMAGES[order % TILE_IMAGES.length];

                await db.query(`
                    INSERT INTO categories (name, slug, parent_id, group_id, description, image, icon, seo_title, seo_description, status, display_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
                `, [displayName, slug, mainId, groupId, description, image, 'grid', seoTitle, seoDesc, order]);
                console.log(`[Migration] Added "${displayName}" (${mainSlug}/${groupKey}, slug=${slug})`);
                added++;
                order++;
            }
        }
    }

    console.log(`[Migration] Complete. Added ${added} categories.`);
    process.exit(0);
}

run().catch(err => { console.error('[Migration] Failed:', err); process.exit(1); });
