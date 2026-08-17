// Meenakshi Build World — Kitchen Tiles completion + Kitchen Countertops
// Idempotent, additive migration:
//   1. Adds the values missing from the Kitchen Tiles spec
//      (Anti Skid finish; 1x1 / 2x2 / 2x4 sizes; Granite, Cup n Saucer,
//      Flower, Hexagonal, Border, Carpet designs) — renaming the existing
//      Floral/Hexagon rows to the exact display names requested rather than
//      duplicating them.
//   2. Moves Kitchen Floor/Wall Tiles to the "By Area" group so the mega
//      menu renders a BY AREA column exactly as specified.
//   3. Creates the separate main category Kitchen Countertops with its four
//      subcategories + Color / Finish / Size facets + Material & Thickness
//      spec attributes.
// Nothing is deleted; existing products and category tags are untouched.
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
function slugifySize(value) {
    return slugify(value.replace(/\s*mm\b/gi, '').trim());
}

const TILE_IMAGES = [
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1615529162924-f8605388461d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?auto=format&fit=crop&w=1000&q=80'
];

const KITCHEN_DESIGNS = ['Granite', 'Cup n Saucer', 'Border', 'Carpet'];
const KITCHEN_FINISHES = ['Anti Skid'];
const KITCHEN_SIZES = ['1x1', '2x2', '2x4'];

const COUNTERTOP_TYPES = ['Kitchen Countertops', 'Quartz Countertops', 'Breakfast Countertops', 'Granite Countertops'];
const COUNTERTOP_COLORS = [
    'White', 'Black', 'Brown', 'Beige', 'Ivory', 'Cream', 'Grey', 'Green', 'Blue', 'Red',
    'Yellow', 'Orange', 'Pink', 'Terracotta', 'Black & White', 'Grey & White', 'Blue & White', 'Gold'
];
const COUNTERTOP_FINISHES = ['Glossy', 'Matt', 'Polished', 'High Gloss', 'Honed', 'Rustic', 'Anti Skid', 'Satin'];
const COUNTERTOP_SIZES = [
    '600x600 mm', '600x1200 mm', '800x1600 mm', '800x2400 mm', '1200x2400 mm',
    '1200x3000 mm', '1600x3200 mm', '2000x2400 mm'
];

async function run() {
    const mainIdBySlug = {};
    for (const row of await db.query(`SELECT id, slug FROM categories WHERE parent_id IS NULL`)) mainIdBySlug[row.slug] = row.id;
    const groupIdByKey = {};
    for (const row of await db.query(`SELECT id, group_key FROM category_groups`)) groupIdByKey[row.group_key] = row.id;

    async function exists(parentId, groupId, name) {
        return !!(await db.queryOne(`SELECT id FROM categories WHERE parent_id = ? AND group_id = ? AND name = ?`, [parentId, groupId, name]));
    }
    async function siblingSlugExists(parentId, slug) {
        return !!(await db.queryOne(`SELECT id FROM categories WHERE parent_id = ? AND slug = ?`, [parentId, slug]));
    }
    async function uniqueSlug(parentId, groupKey, base) {
        let slug = base;
        if (await siblingSlugExists(parentId, slug)) slug = groupKey ? `${slug}-${groupKey}` : `${slug}-2`;
        let n = 2;
        while (await siblingSlugExists(parentId, slug)) slug = `${base}-${n++}`;
        return slug;
    }
    async function insert(parentId, groupKey, displayName, composedName, order) {
        const groupId = groupIdByKey[groupKey];
        const baseSlug = groupKey === 'size' ? slugifySize(displayName) : slugify(displayName);
        const slug = await uniqueSlug(parentId, groupKey, baseSlug);
        await db.query(`
            INSERT INTO categories (name, slug, parent_id, group_id, description, image, icon, seo_title, seo_description, status, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
        `, [
            displayName, slug, parentId, groupId,
            `${composedName} — premium quality, competitively priced, ready for fast delivery.`,
            TILE_IMAGES[order % TILE_IMAGES.length], 'grid',
            `${composedName} | Meenakshi Build World`,
            `Shop ${composedName.toLowerCase()} online. Compare designs, sizes and prices at Meenakshi Build World.`,
            order
        ]);
        return slug;
    }

    const kitchenId = mainIdBySlug['kitchen-tiles'];
    if (!kitchenId) throw new Error('kitchen-tiles main category not found');

    // ---- 1a. Rename Floral -> Flower, Hexagon -> Hexagonal (kitchen only) --
    for (const [oldName, newName, newSlug] of [['Floral', 'Flower', 'flower'], ['Hexagon', 'Hexagonal', 'hexagonal']]) {
        const cat = await db.queryOne(
            `SELECT id FROM categories WHERE parent_id = ? AND group_id = ? AND name = ?`,
            [kitchenId, groupIdByKey['design'], oldName]
        );
        if (cat) {
            const slug = await uniqueSlug(kitchenId, 'design', newSlug);
            await db.query(`UPDATE categories SET name = ?, slug = ?, seo_title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [newName, slug, `${newName} Kitchen Tiles | Meenakshi Build World`, cat.id]);
            console.log(`[Migration] Renamed kitchen design "${oldName}" -> "${newName}" (slug=${slug})`);
        } else {
            console.log(`[Migration] Kitchen design already renamed, skipped: ${newName}`);
        }
    }

    // ---- 1b. Move Kitchen Floor/Wall Tiles into the By Area group ----------
    const areaGroupId = groupIdByKey['area'];
    const moves = await db.query(`SELECT id, name FROM categories WHERE parent_id = ? AND name IN ('Kitchen Floor Tiles', 'Kitchen Wall Tiles')`, [kitchenId]);
    for (const c of moves) {
        if (c && c.id) {
            await db.query(`UPDATE categories SET group_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [areaGroupId, c.id]);
            console.log(`[Migration] Moved "${c.name}" to By Area group`);
        }
    }

    // ---- 1c. Insert missing Kitchen Tiles values --------------------------
    let order = (await db.queryOne(`SELECT COALESCE(MAX(display_order), 0) as maxOrder FROM categories WHERE parent_id = ?`, [kitchenId])).maxOrder;
    order = parseInt(order) + 1;
    for (const design of KITCHEN_DESIGNS) {
        if (await exists(kitchenId, groupIdByKey['design'], design)) { console.log(`[Migration] Already present, skipped: ${design}`); continue; }
        const slug = await insert(kitchenId, 'design', design, `${design} Kitchen Tiles`, order++);
        console.log(`[Migration] Added kitchen design "${design}" (slug=${slug})`);
    }
    for (const finish of KITCHEN_FINISHES) {
        if (await exists(kitchenId, groupIdByKey['finish'], finish)) { console.log(`[Migration] Already present, skipped: ${finish}`); continue; }
        const slug = await insert(kitchenId, 'finish', finish, `${finish} Kitchen Tiles`, order++);
        console.log(`[Migration] Added kitchen finish "${finish}" (slug=${slug})`);
    }
    for (const size of KITCHEN_SIZES) {
        if (await exists(kitchenId, groupIdByKey['size'], size)) { console.log(`[Migration] Already present, skipped: ${size}`); continue; }
        const slug = await insert(kitchenId, 'size', size, `${size} Kitchen Tiles`, order++);
        console.log(`[Migration] Added kitchen size "${size}" (slug=${slug})`);
    }

    // ---- 2. Kitchen Countertops main category -----------------------------
    let countertopMain = await db.queryOne(`SELECT id FROM categories WHERE parent_id IS NULL AND slug = 'kitchen-countertops'`);
    if (!countertopMain) {
        const res = await db.query(`
            INSERT INTO categories (name, slug, parent_id, group_id, category_type, description, image, banner_url, icon, seo_title, seo_description, status, display_order, featured)
            VALUES ('Kitchen Countertops', 'kitchen-countertops', NULL, NULL, 'utility', 'Premium kitchen countertops — quartz, granite, breakfast and engineered stone surfaces for modern kitchens.', ?, ?, 'grid', 'Kitchen Countertops | Meenakshi Build World', 'Shop kitchen countertops online — quartz, granite, breakfast and engineered surfaces at Meenakshi Build World.', 'active', 14, 1)
        `, [TILE_IMAGES[3], TILE_IMAGES[3]]);
        countertopMain = { id: res.insertId };
        console.log(`[Migration] Created main category "Kitchen Countertops" (id=${countertopMain.id})`);
    } else {
        console.log(`[Migration] Kitchen Countertops main already exists (id=${countertopMain.id})`);
    }
    const ctId = countertopMain.id;

    // ---- 3. Countertop subcategories + facets -----------------------------
    let ctOrder = (await db.queryOne(`SELECT COALESCE(MAX(display_order), 0) as maxOrder FROM categories WHERE parent_id = ?`, [ctId])).maxOrder;
    ctOrder = parseInt(ctOrder) + 1;
    for (const type of COUNTERTOP_TYPES) {
        if (await exists(ctId, groupIdByKey['type'], type)) { console.log(`[Migration] Already present, skipped: ${type}`); continue; }
        const slug = await insert(ctId, 'type', type, type, ctOrder++);
        console.log(`[Migration] Added countertop type "${type}" (slug=${slug})`);
    }
    for (const color of COUNTERTOP_COLORS) {
        if (await exists(ctId, groupIdByKey['color'], color)) { console.log(`[Migration] Already present, skipped: ${color}`); continue; }
        const slug = await insert(ctId, 'color', color, `${color} Countertop`, ctOrder++);
        console.log(`[Migration] Added countertop color "${color}" (slug=${slug})`);
    }
    for (const finish of COUNTERTOP_FINISHES) {
        if (await exists(ctId, groupIdByKey['finish'], finish)) { console.log(`[Migration] Already present, skipped: ${finish}`); continue; }
        const slug = await insert(ctId, 'finish', finish, `${finish} Finish`, ctOrder++);
        console.log(`[Migration] Added countertop finish "${finish}" (slug=${slug})`);
    }
    for (const size of COUNTERTOP_SIZES) {
        if (await exists(ctId, groupIdByKey['size'], size)) { console.log(`[Migration] Already present, skipped: ${size}`); continue; }
        const slug = await insert(ctId, 'size', size, `${size} Countertop`, ctOrder++);
        console.log(`[Migration] Added countertop size "${size}" (slug=${slug})`);
    }

    // ---- 4. Countertop spec attributes (Material / Thickness) -------------
    const attrDefs = [
        { name: 'Material', slug: 'material', values: ['Quartz', 'Granite', 'Marble', 'Engineered Stone', 'Solid Surface', 'Wood'] },
        { name: 'Thickness', slug: 'thickness', values: ['15 mm', '20 mm', '25 mm', '30 mm', '40 mm'] }
    ];
    for (const def of attrDefs) {
        let attr = await db.queryOne(`SELECT id FROM category_attributes WHERE category_id = ? AND slug = ?`, [ctId, def.slug]);
        if (!attr) {
            const res = await db.query(`INSERT INTO category_attributes (category_id, name, slug, input_type, unit, display_order) VALUES (?, ?, ?, 'select', NULL, ?)`, [ctId, def.name, def.slug, 1]);
            attr = { id: res.insertId };
            console.log(`[Migration] Added countertop attribute "${def.name}"`);
        }
        for (const v of def.values) {
            const existing = await db.queryOne(`SELECT id FROM attribute_values WHERE attribute_id = ? AND value = ?`, [attr.id, v]);
            if (!existing) {
                await db.query(`INSERT INTO attribute_values (attribute_id, value, display_order) VALUES (?, ?, 1)`, [attr.id, v]);
                console.log(`[Migration]   + ${def.name}: ${v}`);
            }
        }
    }

    console.log('[Migration] Kitchen Tiles + Kitchen Countertops complete.');
    process.exit(0);
}

run().catch(err => { console.error('[Migration] Failed:', err); process.exit(1); });