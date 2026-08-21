// Meenakshi Build World — Outdoor Tiles ecosystem completion migration.
//
// "Outdoor Tiles" already exists as a main category (id 507) with a partial
// taxonomy (8 areas, 5 sizes, 4 designs, 4 types, 23 colors) built by an
// earlier pass. This script extends it to the full spec, additively:
//   1. Adds a `composite_filters` column to `categories` — a nullable JSON
//      object of {group_key: slug} pairs. A normal category row is untouched
//      (still resolves by matching its own slug). A "composite" row (e.g.
//      "Anti Skid Terrace Tiles") instead applies ALL of the filters named
//      in this column, so the page it powers is a live, always-in-sync AND
//      of two existing atomic values — never a real product tag, never a
//      duplicate product. This is the mechanism behind every "<Area> <X>
//      Tiles" combination in the taxonomy (Balcony Wall Tiles, Stone
//      Elevation Tiles, Anti Skid Terrace Tiles, Terracotta Terrace Tiles…).
//   2. Adds a new `surface` category_group (Floor / Wall) — a first-class
//      filter dimension alongside area/size/design/type/finish/color.
//   3. Renames a couple of existing rows to match the target taxonomy's
//      naming exactly (ids are stable, so this never touches product tags).
//   4. Adds the missing atomic area/size/design/type/finish/surface values.
//   5. Adds every composite ("<Area> <X> Tiles") category from the spec.
//   6. Seeds ~15 real products spanning the new areas/composites so the
//      storefront isn't empty the moment this ships.
// Nothing is deleted; existing categories, products and their tags are
// untouched. Idempotent — safe to re-run.
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
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1615529162924-f8605388461d?auto=format&fit=crop&w=1000&q=80'
];

// ---------------------------------------------------------------------------
// Missing atomic values, keyed by group_key. `slug` is only given when it
// must diverge from slugify(name) (e.g. the spec's explicit
// "elevation-wall-tiles" slug, or size values whose display name carries a
// unit).
// ---------------------------------------------------------------------------
const ATOMIC = {
    application: [
        { name: 'Elevation Tiles', slug: 'elevation-wall-tiles' },
        { name: 'Paving Tiles' },
        { name: 'Sitout Passage Tiles' },
        { name: 'Outdoor Parking Tiles' }
    ],
    size: [
        { name: '1x1' }, { name: '2x2' }, { name: '2x4' },
        { name: '300x450 mm', slug: '300x450' },
        { name: '300x600 mm', slug: '300x600' },
        { name: '500x500 mm', slug: '500x500' }
    ],
    design: [
        { name: 'Brick' }, { name: 'Travertine' }, { name: 'Marble' },
        { name: 'Moroccan' }, { name: 'Mosaic' }, { name: '3D', slug: '3d' }
    ],
    type: [
        { name: 'Cool Terrace' }, { name: 'Porcelain' }
    ],
    finish: [
        { name: 'Glossy' }
    ],
    surface: [
        { name: 'Floor' }, { name: 'Wall' }
    ]
};

// Existing rows renamed to match the spec exactly. Ids stay stable so no
// product tag is ever affected by a rename.
const RENAMES = [
    ['finish', 'Anti-Skid', 'Anti Skid', 'anti-skid'],
    ['design', 'Stone Finish', 'Stone', 'stone']
];

// Composite ("<Area/Design/Finish/Type/Color> combo") categories. Each lives
// in ONE group (matching where the spec's mega menu places it) and carries
// composite_filters — the full set of atomic filters its page applies.
// `application`/`size`/`design`/`type`/`finish`/`color`/`surface` values here
// reference the *slugs* of atomic rows (existing or freshly added above).
const COMPOSITES = [
    { name: 'Balcony Wall Tiles', group: 'surface', slug: 'balcony-wall-tiles', filters: { application: 'balcony-tiles', surface: 'wall' } },
    { name: 'Balcony Floor Tiles', group: 'surface', slug: 'balcony-floor-tiles', filters: { application: 'balcony-tiles', surface: 'floor' } },
    { name: 'Terrace Wall Tiles', group: 'surface', slug: 'terrace-wall-tiles', filters: { application: 'terrace-tiles', surface: 'wall' } },
    { name: 'Terrace Floor Tiles', group: 'surface', slug: 'terrace-floor-tiles', filters: { application: 'terrace-tiles', surface: 'floor' } },
    { name: 'Porch Wall Tiles', group: 'surface', slug: 'porch-wall-tiles', filters: { application: 'porch-tiles', surface: 'wall' } },
    { name: 'Porch Floor Tiles', group: 'surface', slug: 'porch-floor-tiles', filters: { application: 'porch-tiles', surface: 'floor' } },

    { name: 'Anti Skid Terrace Tiles', group: 'finish', slug: 'anti-skid-terrace', filters: { application: 'terrace-tiles', finish: 'anti-skid' } },
    { name: 'Glossy Elevation Tiles', group: 'finish', slug: 'glossy-elevation', filters: { application: 'elevation-wall-tiles', finish: 'glossy' } },

    { name: 'Stone Elevation Tiles', group: 'design', slug: 'stone-elevation', filters: { application: 'elevation-wall-tiles', design: 'stone' } },
    { name: 'Wooden Elevation Tiles', group: 'design', slug: 'wooden-elevation', filters: { application: 'elevation-wall-tiles', design: 'wooden' } },
    { name: '3D Elevation Tiles', group: 'design', slug: '3d-elevation', filters: { application: 'elevation-wall-tiles', design: '3d' } },
    { name: 'Brick Elevation Tiles', group: 'design', slug: 'brick-elevation', filters: { application: 'elevation-wall-tiles', design: 'brick' } },
    { name: 'Moroccan Balcony Tiles', group: 'design', slug: 'moroccan-balcony', filters: { application: 'balcony-tiles', design: 'moroccan' } },
    { name: 'Wooden Balcony Tiles', group: 'design', slug: 'wooden-balcony', filters: { application: 'balcony-tiles', design: 'wooden' } },

    { name: 'Ceramic Elevation Tiles', group: 'type', slug: 'ceramic-elevation', filters: { application: 'elevation-wall-tiles', type: 'ceramic' } },
    { name: 'Ceramic Terrace Tiles', group: 'type', slug: 'ceramic-terrace', filters: { application: 'terrace-tiles', type: 'ceramic' } },
    { name: 'Vitrified Terrace Tiles', group: 'type', slug: 'vitrified-terrace', filters: { application: 'terrace-tiles', type: 'vitrified' } },

    { name: 'Terracotta Elevation Tiles', group: 'color', slug: 'terracotta-elevation', filters: { application: 'elevation-wall-tiles', color: 'terracotta' } },
    { name: 'Terracotta Terrace Tiles', group: 'color', slug: 'terracotta-terrace', filters: { application: 'terrace-tiles', color: 'terracotta' } }
];

// Sample products — each one tagged with real atomic attributes only, never
// tagged to a composite row directly. Every composite above is reachable
// through at least one of these purely via the AND-of-atomic-filters
// mechanism, demonstrating "one product, many listings, zero duplication."
const PRODUCTS = [
    { name: 'Sandstone Elevation Cladding Tile', price: 85, offer: 75, stock: 140, color: 'beige', tags: { application: 'elevation-wall-tiles', surface: 'wall', size: '300x600', design: 'stone', type: 'ceramic', finish: 'rustic', color: 'beige' } },
    { name: '3D Wave Elevation Panel Tile', price: 120, offer: 105, stock: 90, tags: { application: 'elevation-wall-tiles', surface: 'wall', size: '300x600', design: '3d', type: 'ceramic', finish: 'matt', color: 'white' } },
    { name: 'Charcoal Brick Elevation Tile', price: 78, stock: 160, tags: { application: 'elevation-wall-tiles', surface: 'wall', size: '300x450', design: 'brick', type: 'ceramic', finish: 'textured', color: 'brown' } },
    { name: 'Ivory Wooden Elevation Strip Tile', price: 95, offer: 85, stock: 110, tags: { application: 'elevation-wall-tiles', surface: 'wall', size: '300x600', design: 'wooden', type: 'vitrified', finish: 'matt', color: 'ivory' } },
    { name: 'Golden Terracotta Elevation Tile', price: 88, stock: 130, tags: { application: 'elevation-wall-tiles', surface: 'wall', size: '300x450', design: 'brick', type: 'ceramic', finish: 'rustic', color: 'terracotta' } },
    { name: 'Moroccan Pattern Balcony Tile', price: 65, offer: 58, stock: 180, tags: { application: 'balcony-tiles', surface: 'floor', size: '2x2', design: 'moroccan', type: 'ceramic', finish: 'glossy', color: 'blue' } },
    { name: 'Teak Wooden Balcony Deck Tile', price: 72, stock: 150, tags: { application: 'balcony-tiles', surface: 'floor', size: '2x4', design: 'wooden', type: 'vitrified', finish: 'anti-skid', color: 'brown' } },
    { name: 'Grey Ceramic Terrace Paver', price: 55, offer: 49, stock: 220, tags: { application: 'terrace-tiles', surface: 'floor', size: '400x400', design: 'granite', type: 'ceramic', finish: 'anti-skid', color: 'grey' } },
    { name: 'White Vitrified Terrace Slab', price: 68, stock: 175, tags: { application: 'terrace-tiles', surface: 'floor', size: '500x500', design: 'marble', type: 'vitrified', finish: 'glossy', color: 'white' } },
    { name: 'Anti Skid Terrace Wall Cladding Tile', price: 60, offer: 54, stock: 140, tags: { application: 'terrace-tiles', surface: 'wall', size: '300x600', design: 'stone', type: 'ceramic', finish: 'anti-skid', color: 'grey' } },
    { name: 'Beige Stone Paving Slab', price: 92, stock: 200, tags: { application: 'paving-tiles', surface: 'floor', size: '300x600', design: 'stone', type: 'porcelain', finish: 'rustic', color: 'beige' } },
    { name: 'Charcoal Anti Skid Sitout Passage Tile', price: 58, offer: 52, stock: 160, tags: { application: 'sitout-passage-tiles', surface: 'floor', size: '400x400', design: 'granite', type: 'ceramic', finish: 'anti-skid', color: 'black' } },
    { name: 'Grey Textured Outdoor Parking Tile', price: 45, stock: 260, tags: { application: 'outdoor-parking-tiles', surface: 'floor', size: '600x600', design: 'granite', type: 'ceramic', finish: 'textured', color: 'grey' } },
    { name: 'Rustic Stone Porch Wall Tile', price: 70, stock: 120, tags: { application: 'porch-tiles', surface: 'wall', size: '300x450', design: 'stone', type: 'ceramic', finish: 'rustic', color: 'brown' } },
    { name: 'Sandstone Porch Floor Tile', price: 64, offer: 57, stock: 150, tags: { application: 'porch-tiles', surface: 'floor', size: '1x1', design: 'stone', type: 'porcelain', finish: 'anti-skid', color: 'beige' } }
];

async function ensureColumn(table, column, ddlType) {
    if (db.getMode() === 'sqlite') {
        const cols = await db.query(`PRAGMA table_info(${table})`);
        if (!cols.some(c => c.name === column)) {
            await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddlType}`);
            console.log(`[Migration] Added ${table}.${column} column`);
        }
    } else {
        const cols = await db.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = ? AND column_name = ?`,
            [table, column]
        );
        if (!cols.length) {
            await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddlType}`);
            console.log(`[Migration] Added ${table}.${column} column`);
        }
    }
}

async function run() {
    await ensureColumn('categories', 'composite_filters', 'TEXT');

    const main = await db.queryOne(`SELECT * FROM categories WHERE slug = 'outdoor-tiles' AND parent_id IS NULL`);
    if (!main) throw new Error('Outdoor Tiles main category not found — aborting.');
    const mainId = main.id;
    const mainName = 'Outdoor Tiles';

    let surfaceGroup = await db.queryOne(`SELECT * FROM category_groups WHERE group_key = 'surface'`);
    if (!surfaceGroup) {
        const maxOrder = await db.queryOne(`SELECT COALESCE(MAX(display_order), 0) as m FROM category_groups`);
        await db.query(
            `INSERT INTO category_groups (group_key, name, slug, icon, display_order) VALUES (?, ?, ?, ?, ?)`,
            ['surface', 'By Surface', 'surface', 'layers', parseInt(maxOrder.m) + 1]
        );
        console.log('[Migration] Added category_groups "surface" (By Surface)');
    }

    const groupIdByKey = {};
    for (const row of await db.query(`SELECT id, group_key FROM category_groups`)) groupIdByKey[row.group_key] = row.id;

    async function siblingSlugExists(slug) {
        const row = await db.queryOne(`SELECT id FROM categories WHERE parent_id = ? AND slug = ?`, [mainId, slug]);
        return !!row;
    }
    async function uniqueSlug(base) {
        let slug = base, n = 2;
        while (await siblingSlugExists(slug)) slug = `${base}-${n++}`;
        return slug;
    }

    // ---- 1. Renames -------------------------------------------------------
    for (const [groupKey, oldName, newName, prefSlug] of RENAMES) {
        const groupId = groupIdByKey[groupKey];
        const cat = await db.queryOne(
            `SELECT * FROM categories WHERE parent_id = ? AND group_id = ? AND name = ?`,
            [mainId, groupId, oldName]
        );
        if (!cat) { console.log(`[Migration] Rename target already applied, skipped: ${oldName}`); continue; }
        const slug = prefSlug === cat.slug ? cat.slug : await uniqueSlug(prefSlug);
        await db.query(
            `UPDATE categories SET name = ?, slug = ?, seo_title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [newName, slug, `${newName} | Meenakshi Build World`, cat.id]
        );
        console.log(`[Migration] Renamed "${oldName}" -> "${newName}" (slug=${slug})`);
    }

    // ---- 2. Atomic values ---------------------------------------------------
    let order = (await db.queryOne(`SELECT COALESCE(MAX(display_order), 0) as m FROM categories WHERE parent_id = ?`, [mainId])).m;
    order = parseInt(order) + 1;
    let addedAtomic = 0;

    async function insertCategory({ name, groupKey, slug, description, seoDesc, compositeFilters }) {
        const groupId = groupIdByKey[groupKey];
        const exists = await db.queryOne(
            `SELECT id FROM categories WHERE parent_id = ? AND group_id = ? AND name = ?`,
            [mainId, groupId, name]
        );
        if (exists) { console.log(`[Migration] Already present, skipped: ${name}`); return exists.id; }

        const finalSlug = await uniqueSlug(slug || slugify(name));
        const seoTitle = `${name} | Meenakshi Build World`;
        const desc = description || `${name} — premium quality, competitively priced, ready for fast delivery.`;
        const image = TILE_IMAGES[order % TILE_IMAGES.length];
        const res = await db.query(`
            INSERT INTO categories (name, slug, parent_id, group_id, description, image, icon, seo_title, seo_description, status, display_order, composite_filters)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
        `, [
            name, finalSlug, mainId, groupId, desc, image, 'grid', seoTitle,
            seoDesc || `Shop ${name.toLowerCase()} online. Compare designs, sizes and prices at Meenakshi Build World.`,
            order, compositeFilters ? JSON.stringify(compositeFilters) : null
        ]);
        order++;
        addedAtomic++;
        console.log(`[Migration] Added "${name}" (${groupKey}, slug=${finalSlug})${compositeFilters ? ' [composite]' : ''}`);
        const isSqlite = db.getMode() === 'sqlite';
        return isSqlite ? res.insertId : (await db.queryOne(`SELECT id FROM categories WHERE parent_id = ? AND slug = ?`, [mainId, finalSlug])).id;
    }

    for (const groupKey of Object.keys(ATOMIC)) {
        for (const item of ATOMIC[groupKey]) {
            const slug = groupKey === 'size' ? (item.slug || slugifySize(item.name)) : item.slug;
            await insertCategory({ name: item.name, groupKey, slug });
        }
    }

    // ---- 3. Composites ------------------------------------------------------
    let addedComposite = 0;
    for (const c of COMPOSITES) {
        const before = await db.queryOne(`SELECT id FROM categories WHERE parent_id = ? AND group_id = ? AND name = ?`, [mainId, groupIdByKey[c.group], c.name]);
        const id = await insertCategory({
            name: c.name,
            groupKey: c.group,
            slug: c.slug,
            compositeFilters: c.filters
        });
        if (!before) addedComposite++;
    }

    console.log(`[Migration] Categories complete. ${addedAtomic} atomic + composite rows added (${addedComposite} composites).`);

    // ---- 4. Sample products ---------------------------------------------
    const isSqlite = db.getMode() === 'sqlite';
    let addedProducts = 0;

    async function resolveCategoryId(groupKey, slug) {
        const row = await db.queryOne(
            `SELECT c.id FROM categories c JOIN category_groups g ON c.group_id = g.id WHERE c.parent_id = ? AND g.group_key = ? AND c.slug = ?`,
            [mainId, groupKey, slug]
        );
        if (!row) throw new Error(`Cannot resolve category for ${groupKey}=${slug}`);
        return row.id;
    }

    for (const p of PRODUCTS) {
        const sku = `MBW-OUT-${1100 + PRODUCTS.indexOf(p)}`;
        const existing = await db.queryOne(`SELECT id FROM products WHERE sku = ?`, [sku]);
        if (existing) { console.log(`[Migration] Product already seeded, skipped: ${p.name}`); continue; }

        const slug = `${slugify(p.name)}-${sku.toLowerCase()}`;
        const seoTitle = `${p.name} | Meenakshi Build World`;
        const description = `${p.name} — a premium outdoor tile built for the elements, with anti-weathering finish and consistent batch shading.`;

        const resDb = await db.query(`
            INSERT INTO products (name, sku, slug, price, offer_price, stock, description, is_featured, is_trending, published, seo_title, seo_description)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 1, ?, ?)
        `, [p.name, sku, slug, p.price, p.offer || null, p.stock, description, seoTitle, description]);
        const productId = isSqlite ? resDb.insertId : (await db.queryOne(`SELECT id FROM products WHERE sku = ?`, [sku])).id;

        await db.query(
            `INSERT INTO product_images (product_id, image_url, alt_text, is_primary) VALUES (?, ?, ?, 1)`,
            [productId, TILE_IMAGES[addedProducts % TILE_IMAGES.length], p.name]
        );

        const categoryIds = [mainId];
        for (const [groupKey, slugVal] of Object.entries(p.tags)) {
            categoryIds.push(await resolveCategoryId(groupKey, slugVal));
        }
        for (const catId of categoryIds) {
            await db.query(`INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)`, [productId, catId]).catch(async () => {
                const dupe = await db.queryOne(`SELECT id FROM product_categories WHERE product_id = ? AND category_id = ?`, [productId, catId]);
                if (!dupe) await db.query(`INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`, [productId, catId]);
            });
        }

        const sizeCatId = await resolveCategoryId('size', p.tags.size);
        const variantSku = `${sku}-V1`;
        const vRes = await db.query(`
            INSERT INTO product_variants (product_id, sku, size_category_id, price, offer_price, stock, is_default, status)
            VALUES (?, ?, ?, ?, ?, ?, 1, 'active')
        `, [productId, variantSku, sizeCatId, p.price, p.offer || null, p.stock]);
        const variantId = isSqlite ? vRes.insertId : (await db.queryOne(`SELECT id FROM product_variants WHERE sku = ?`, [variantSku])).id;
        await db.query(`INSERT INTO inventory (variant_id, quantity_boxes, reserved_boxes, reorder_level) VALUES (?, ?, 0, 20)`, [variantId, p.stock]);

        addedProducts++;
        console.log(`[Migration] Seeded product "${p.name}" (${sku})`);
    }

    console.log(`[Migration] Complete. ${addedProducts} products seeded.`);
    process.exit(0);
}

run().catch(err => { console.error('[Migration] Failed:', err); process.exit(1); });
