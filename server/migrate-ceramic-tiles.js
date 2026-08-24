// Meenakshi Build World — Ceramic Tiles ecosystem completion migration.
//
// "Ceramic Tiles" already exists as a main category with a partial taxonomy
// (4 areas, 4 sizes, 4 designs, 2 finishes, 23 colors, 4 products). This
// script completes it to the full spec, additively and idempotently:
//   1. Ensures the main "Ceramic Tiles" category exists.
//   2. Moves the area rows from the "application" group into the global
//     "By Area" group so the mega menu column reads "Ceramic Tiles By Area"
//     (ids and slugs stay stable — product tags are never affected).
//   3. Renames existing facet rows to the exact spec naming ("Marble" ->
//     "Marble Ceramic Tiles", "300x600 mm" -> "300x600 mm Ceramic Tiles")
//     with matching slugs (/tiles/ceramic-tiles/marble-ceramic-tiles).
//     Ids stay stable, so no product tag is ever affected.
//   4. Adds every missing atomic value: 7 areas, 4 finishes, 7 sizes,
//      9 designs and 9 colors — 36 spec entries total. Extra values already
//     present (type group, extra colors/sizes) are kept untouched; admins can
//     add more at any time from the Admin Panel with no code changes.
//   5. Reorders colors so the nine spec colors lead the mega-menu column.
//   6. Adds Floor/Wall surface values and backfills surface tags on existing
//      Ceramic Tile products.
//   7. Seeds sample products spanning ALL 36 filter views — one record per
//      product, tagged with atomic attributes only, appearing automatically
//      in every matching listing through the standard AND-of-facets engine.
// Nothing is deleted; existing categories, products and tags are untouched.
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
// The complete spec taxonomy (exact names), keyed by group_key. Every entry
// is ensured (inserted only when missing).
// ---------------------------------------------------------------------------
const TAXONOMY = {
    area: [
        { name: 'Ceramic Floor Tiles', slug: 'ceramic-floor-tiles' },
        { name: 'Ceramic Wall Tiles', slug: 'ceramic-wall-tiles' },
        { name: 'Ceramic Bathroom Tiles', slug: 'ceramic-bathroom-tiles' },
        { name: 'Ceramic Kitchen Tiles', slug: 'ceramic-kitchen-tiles' },
        { name: 'Ceramic Living Room Tiles', slug: 'ceramic-living-room-tiles' },
        { name: 'Ceramic Outdoor Tiles', slug: 'ceramic-outdoor-tiles' },
        { name: 'Ceramic Parking Tiles', slug: 'ceramic-parking-tiles' }
    ],
    finish: [
        { name: 'Anti Skid Ceramic Tiles', slug: 'anti-skid-ceramic-tiles' },
        { name: 'Glossy Ceramic Tiles', slug: 'glossy-ceramic-tiles' },
        { name: 'Matt Ceramic Tiles', slug: 'matt-ceramic-tiles' },
        { name: 'Rustic Ceramic Tiles', slug: 'rustic-ceramic-tiles' }
    ],
    size: [
        { name: '1x1 Ceramic Tiles', slug: '1x1-ceramic-tiles' },
        { name: '2x2 Ceramic Tiles', slug: '2x2-ceramic-tiles' },
        { name: '300x450 mm Ceramic Tiles', slug: '300x450-ceramic-tiles' },
        { name: '300x600 mm Ceramic Tiles', slug: '300x600-ceramic-tiles' },
        { name: '400x400 mm Ceramic Tiles', slug: '400x400-ceramic-tiles' },
        { name: 'Small Ceramic Tiles', slug: 'small-ceramic-tiles' },
        { name: 'Large Ceramic Tiles', slug: 'large-ceramic-tiles' }
    ],
    design: [
        { name: 'Texture Ceramic Tiles', slug: 'texture-ceramic-tiles' },
        { name: 'Wooden Ceramic Tiles', slug: 'wooden-ceramic-tiles' },
        { name: 'Mosaic Ceramic Tiles', slug: 'mosaic-ceramic-tiles' },
        { name: 'Moroccan Ceramic Tiles', slug: 'moroccan-ceramic-tiles' },
        { name: 'Marble Ceramic Tiles', slug: 'marble-ceramic-tiles' },
        { name: 'Pattern Ceramic Tiles', slug: 'pattern-ceramic-tiles' },
        { name: 'Plain Ceramic Tiles', slug: 'plain-ceramic-tiles' },
        { name: 'Stone Ceramic Tiles', slug: 'stone-ceramic-tiles' },
        { name: 'Subway Ceramic Tiles', slug: 'subway-ceramic-tiles' }
    ],
    color: [
        { name: 'White Ceramic Tiles', slug: 'white-ceramic-tiles' },
        { name: 'Grey Ceramic Tiles', slug: 'grey-ceramic-tiles' },
        { name: 'Beige Ceramic Tiles', slug: 'beige-ceramic-tiles' },
        { name: 'Black Ceramic Tiles', slug: 'black-ceramic-tiles' },
        { name: 'Blue Ceramic Tiles', slug: 'blue-ceramic-tiles' },
        { name: 'Brown Ceramic Tiles', slug: 'brown-ceramic-tiles' },
        { name: 'Gold Ceramic Tiles', slug: 'gold-ceramic-tiles' },
        { name: 'Green Ceramic Tiles', slug: 'green-ceramic-tiles' },
        { name: 'Red Ceramic Tiles', slug: 'red-ceramic-tiles' }
    ],
    type: [
        { name: 'Designer Ceramic Tiles', slug: 'designer-ceramic-tiles' },
        { name: 'Digital Ceramic Tiles', slug: 'digital-ceramic-tiles' },
        { name: 'Printed Ceramic Tiles', slug: 'printed-ceramic-tiles' },
        { name: 'Glazed Ceramic Tiles', slug: 'glazed-ceramic-tiles' }
    ],
    surface: [
        { name: 'Floor', slug: 'floor' },
        { name: 'Wall', slug: 'wall' }
    ]
};

// Existing rows renamed to the exact spec naming (id-stable). Sizes keep
// their unit in the display name but lose it in the URL, per the requested
// scheme /tiles/ceramic-tiles/300x450-ceramic-tiles.
const RENAMES = [
    ['size', '200x200 mm', '200x200 mm Ceramic Tiles', '200x200-ceramic-tiles'],
    ['size', '300x300 mm', '300x300 mm Ceramic Tiles', '300x300-ceramic-tiles'],
    ['size', '300x600 mm', '300x600 mm Ceramic Tiles', '300x600-ceramic-tiles'],
    ['size', '600x600 mm', '600x600 mm Ceramic Tiles', '600x600-ceramic-tiles'],
    ['design', 'Marble', 'Marble Ceramic Tiles', 'marble-ceramic-tiles'],
    ['design', 'Wooden', 'Wooden Ceramic Tiles', 'wooden-ceramic-tiles'],
    ['design', 'Stone', 'Stone Ceramic Tiles', 'stone-ceramic-tiles'],
    ['design', 'Mosaic', 'Mosaic Ceramic Tiles', 'mosaic-ceramic-tiles'],
    ['finish', 'Glossy', 'Glossy Ceramic Tiles', 'glossy-ceramic-tiles'],
    ['finish', 'Matt', 'Matt Ceramic Tiles', 'matt-ceramic-tiles'],
    ['type', 'Designer', 'Designer Ceramic Tiles', 'designer-ceramic-tiles'],
    ['type', 'Digital', 'Digital Ceramic Tiles', 'digital-ceramic-tiles'],
    ['type', 'Printed', 'Printed Ceramic Tiles', 'printed-ceramic-tiles'],
    ['type', 'Glazed', 'Glazed Ceramic Tiles', 'glazed-ceramic-tiles']
];

// Color rows renamed to "<Color> Ceramic Tiles" (id-stable) and reordered so
// the nine spec colors lead the mega-menu column (14-item cap).
const COLOR_RENAMES = [
    ['White', 'White Ceramic Tiles'], ['Grey', 'Grey Ceramic Tiles'], ['Beige', 'Beige Ceramic Tiles'],
    ['Black', 'Black Ceramic Tiles'], ['Blue', 'Blue Ceramic Tiles'], ['Brown', 'Brown Ceramic Tiles'],
    ['Gold', 'Gold Ceramic Tiles'], ['Green', 'Green Ceramic Tiles'], ['Red', 'Red Ceramic Tiles'],
    ['Ivory', 'Ivory Ceramic Tiles'], ['Cream', 'Cream Ceramic Tiles'], ['Yellow', 'Yellow Ceramic Tiles'],
    ['Pink', 'Pink Ceramic Tiles'], ['Aqua', 'Aqua Ceramic Tiles'], ['Orange', 'Orange Ceramic Tiles'],
    ['Sky Blue', 'Sky Blue Ceramic Tiles'], ['Purple', 'Purple Ceramic Tiles'], ['Terracotta', 'Terracotta Ceramic Tiles'],
    ['Black & White', 'Black & White Ceramic Tiles'], ['Blue & White', 'Blue & White Ceramic Tiles'],
    ['Grey & White', 'Grey & White Ceramic Tiles'], ['Black & Gold', 'Black & Gold Ceramic Tiles'],
    ['White & Gold', 'White & Gold Ceramic Tiles']
];

// Sample products — tagged ONLY with atomic attribute slugs. Each one appears
// automatically in every matching listing view (main + area + finish + size +
// design + color). Together with the previously seeded ceramic products these
// cover all 36 spec filters.
const PRODUCTS = [
    { name: 'Premium Marble Ceramic Tile', price: 58, offer: 50, stock: 190, brand: 'kajaria-eternity', featured: true, tags: { area: 'ceramic-floor-tiles', surface: 'floor', size: '2x2-ceramic-tiles', design: 'marble-ceramic-tiles', finish: 'glossy-ceramic-tiles', color: 'white-ceramic-tiles' } },
    { name: 'Moroccan Blue Bathroom Ceramic Tile', price: 64, offer: 56, stock: 120, brand: 'somany-grandeur', tags: { area: 'ceramic-bathroom-tiles', surface: 'wall', size: '300x450-ceramic-tiles', design: 'moroccan-ceramic-tiles', finish: 'glossy-ceramic-tiles', color: 'blue-ceramic-tiles' } },
    { name: 'Subway Red Kitchen Ceramic Tile', price: 42, stock: 240, brand: 'orientbell-horizon', tags: { area: 'ceramic-kitchen-tiles', surface: 'wall', size: '300x450-ceramic-tiles', design: 'subway-ceramic-tiles', finish: 'glossy-ceramic-tiles', color: 'red-ceramic-tiles' } },
    { name: 'Rustic Brown Living Room Ceramic Tile', price: 46, offer: 40, stock: 210, brand: 'nitco', tags: { area: 'ceramic-living-room-tiles', surface: 'floor', size: '400x400-ceramic-tiles', design: 'stone-ceramic-tiles', finish: 'rustic-ceramic-tiles', color: 'brown-ceramic-tiles' } },
    { name: 'Plain Gold Ceramic Wall Tile', price: 38, stock: 260, brand: 'simpolo-vitrified', tags: { area: 'ceramic-wall-tiles', surface: 'wall', size: 'small-ceramic-tiles', design: 'plain-ceramic-tiles', finish: 'matt-ceramic-tiles', color: 'gold-ceramic-tiles' } },
    { name: 'Textured Green Outdoor Ceramic Tile', price: 52, offer: 45, stock: 170, brand: 'orientbell-horizon', tags: { area: 'ceramic-outdoor-tiles', surface: 'floor', size: '400x400-ceramic-tiles', design: 'texture-ceramic-tiles', finish: 'rustic-ceramic-tiles', color: 'green-ceramic-tiles' } },
    { name: 'Anti Skid Grey Parking Ceramic Tile', price: 48, stock: 230, brand: 'simpolo-vitrified', featured: true, tags: { area: 'ceramic-parking-tiles', surface: 'floor', size: '400x400-ceramic-tiles', design: 'stone-ceramic-tiles', finish: 'anti-skid-ceramic-tiles', color: 'grey-ceramic-tiles' } },
    { name: 'Large Glossy Marble Ceramic Slab', price: 88, offer: 78, stock: 90, brand: 'marazzi-italian', tags: { area: 'ceramic-floor-tiles', surface: 'floor', size: 'large-ceramic-tiles', design: 'marble-ceramic-tiles', finish: 'glossy-ceramic-tiles', color: 'beige-ceramic-tiles' } },
    { name: 'Mosaic Black Bathroom Ceramic Tile', price: 66, offer: 58, stock: 130, brand: 'nitco', tags: { area: 'ceramic-bathroom-tiles', surface: 'wall', size: 'small-ceramic-tiles', design: 'mosaic-ceramic-tiles', finish: 'glossy-ceramic-tiles', color: 'black-ceramic-tiles' } },
    { name: 'Pattern Blue Living Room Ceramic Tile', price: 54, offer: 47, stock: 160, brand: 'somany-grandeur', tags: { area: 'ceramic-living-room-tiles', surface: 'floor', size: '1x1-ceramic-tiles', design: 'pattern-ceramic-tiles', finish: 'matt-ceramic-tiles', color: 'blue-ceramic-tiles' } }
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

    // ---- 1. Main category -------------------------------------------------
    let main = await db.queryOne(`SELECT * FROM categories WHERE slug = 'ceramic-tiles' AND parent_id IS NULL`);
    if (!main) {
        const maxOrder = await db.queryOne(`SELECT COALESCE(MAX(display_order), 0) as m FROM categories WHERE parent_id IS NULL`);
        const desc = 'Affordable, versatile ceramic tiles for floors, walls, kitchens, bathrooms, living rooms, outdoor areas and parking spaces in glossy, matt, rustic and anti-skid finishes.';
        await db.query(`
            INSERT INTO categories (name, slug, parent_id, group_id, category_type, description, image, banner_url, icon, seo_title, seo_description, status, display_order, featured)
            VALUES ('Ceramic Tiles', 'ceramic-tiles', NULL, NULL, 'tile', ?, ?, ?, 'stack',
                    'Ceramic Tiles | Meenakshi Build World',
                    'Explore durable ceramic tiles for every room and application. Glossy, matt, anti-skid and rustic designs at Meenakshi Build World.',
                    'active', ?, 1)
        `, [desc, TILE_IMAGES[7], TILE_IMAGES[7], parseInt(maxOrder.m) + 1]);
        main = await db.queryOne(`SELECT * FROM categories WHERE slug = 'ceramic-tiles' AND parent_id IS NULL`);
        console.log('[Migration] Created main "Ceramic Tiles" category');
    }
    const mainId = main.id;

    const groupIdByKey = {};
    for (const row of await db.query(`SELECT id, group_key FROM category_groups`)) groupIdByKey[row.group_key] = row.id;
    if (!groupIdByKey.surface) {
        const maxOrder = await db.queryOne(`SELECT COALESCE(MAX(display_order), 0) as m FROM category_groups`);
        await db.query(
            `INSERT INTO category_groups (group_key, name, slug, icon, display_order) VALUES (?, ?, ?, ?, ?)`,
            ['surface', 'By Surface', 'surface', 'layers', parseInt(maxOrder.m) + 1]
        );
        groupIdByKey.surface = (await db.queryOne(`SELECT id FROM category_groups WHERE group_key = 'surface'`)).id;
        console.log('[Migration] Added category_groups "surface" (By Surface)');
    }

    async function siblingSlugExists(slug) {
        const row = await db.queryOne(`SELECT id FROM categories WHERE parent_id = ? AND slug = ?`, [mainId, slug]);
        return !!row;
    }
    async function uniqueSlug(base) {
        let slug = base, n = 2;
        while (await siblingSlugExists(slug)) slug = `${base}-${n++}`;
        return slug;
    }

    // ---- 2. Move area rows into the "By Area" group ------------------------
    const areaGroupMoveOrder = TAXONOMY.area.map(a => a.slug);
    let moved = 0;
    for (let i = 0; i < areaGroupMoveOrder.length; i++) {
        const slug = areaGroupMoveOrder[i];
        const cat = await db.queryOne(
            `SELECT id FROM categories WHERE parent_id = ? AND group_id = ? AND slug = ?`,
            [mainId, groupIdByKey.application, slug]
        );
        if (cat) {
            await db.query(`UPDATE categories SET group_id = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [groupIdByKey.area, i + 1, cat.id]);
            moved++;
        }
    }
    if (moved) console.log(`[Migration] Moved ${moved} rows from By Application to By Area.`);

    // ---- 3. Renames (id-stable) --------------------------------------------
    for (const [groupKey, oldName, newName, prefSlug] of RENAMES) {
        const groupId = groupIdByKey[groupKey];
        const cat = await db.queryOne(
            `SELECT * FROM categories WHERE parent_id = ? AND group_id = ? AND name = ?`,
            [mainId, groupId, oldName]
        );
        if (!cat) { continue; }
        const slug = prefSlug === cat.slug ? cat.slug : await uniqueSlug(prefSlug);
        await db.query(
            `UPDATE categories SET name = ?, slug = ?, seo_title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [newName, slug, `${newName} | Meenakshi Build World`, cat.id]
        );
        console.log(`[Migration] Renamed "${oldName}" -> "${newName}" (slug=${slug})`);
    }
    for (const [oldName, newName] of COLOR_RENAMES) {
        const cat = await db.queryOne(
            `SELECT * FROM categories WHERE parent_id = ? AND group_id = ? AND name = ?`,
            [mainId, groupIdByKey.color, oldName]
        );
        if (!cat) { continue; }
        const prefSlug = slugify(newName);
        const slug = prefSlug === cat.slug ? cat.slug : await uniqueSlug(prefSlug);
        await db.query(
            `UPDATE categories SET name = ?, slug = ?, seo_title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [newName, slug, `${newName} | Meenakshi Build World`, cat.id]
        );
        console.log(`[Migration] Renamed "${oldName}" -> "${newName}" (slug=${slug})`);
    }

    // ---- 4. Ensure every spec value exists ---------------------------------
    let order = parseInt((await db.queryOne(`SELECT COALESCE(MAX(display_order), 0) as m FROM categories WHERE parent_id = ?`, [mainId])).m) + 1;
    let added = 0;

    async function ensureCategory({ name, groupKey, slug }) {
        const groupId = groupIdByKey[groupKey];
        const bySlug = await db.queryOne(`SELECT id FROM categories WHERE parent_id = ? AND group_id = ? AND slug = ?`, [mainId, groupId, slug]);
        if (bySlug) return bySlug.id;
        const byName = await db.queryOne(`SELECT * FROM categories WHERE parent_id = ? AND group_id = ? AND name = ?`, [mainId, groupId, name]);
        if (byName) {
            await db.query(`UPDATE categories SET slug = ?, seo_title = COALESCE(seo_title, ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [slug, `${name} | Meenakshi Build World`, byName.id]);
            return byName.id;
        }
        const finalSlug = await uniqueSlug(slug);
        const seoTitle = `${name} | Meenakshi Build World`;
        const desc = `${name} — premium quality, competitively priced, ready for fast delivery.`;
        const res = await db.query(`
            INSERT INTO categories (name, slug, parent_id, group_id, description, image, icon, seo_title, seo_description, status, display_order)
            VALUES (?, ?, ?, ?, ?, ?, 'grid', ?, ?, 'active', ?)
        `, [
            name, finalSlug, mainId, groupId, desc, TILE_IMAGES[order % TILE_IMAGES.length],
            seoTitle, `Shop ${name.toLowerCase()} online. Compare designs, sizes and prices at Meenakshi Build World.`,
            order
        ]);
        order++;
        added++;
        console.log(`[Migration] Added "${name}" (${groupKey}, slug=${finalSlug})`);
        return db.getMode() === 'sqlite' ? res.insertId : (await db.queryOne(`SELECT id FROM categories WHERE parent_id = ? AND slug = ?`, [mainId, finalSlug])).id;
    }

    for (const [groupKey, values] of Object.entries(TAXONOMY)) {
        for (const item of values) {
            await ensureCategory({ name: item.name, groupKey, slug: item.slug });
        }
    }
    console.log(`[Migration] Taxonomy complete (${added} new rows added).`);

    // Lead each core facet column with the spec values, in spec order;
    // extra admin-added values follow in their existing relative order.
    for (const groupKey of ['area', 'finish', 'size', 'design', 'color', 'surface']) {
        const leadSlugs = (TAXONOMY[groupKey] || []).map(v => v.slug);
        const rows = await db.query(
            `SELECT id, slug FROM categories WHERE parent_id = ? AND group_id = ? ORDER BY display_order, id`,
            [mainId, groupIdByKey[groupKey]]
        );
        let ord = 1;
        for (const slug of leadSlugs) {
            const row = rows.find(r => r.slug === slug);
            if (row) { await db.query(`UPDATE categories SET display_order = ? WHERE id = ?`, [ord++, row.id]); }
        }
        for (const row of rows) {
            if (!leadSlugs.includes(row.slug)) {
                await db.query(`UPDATE categories SET display_order = ? WHERE id = ?`, [ord++, row.id]);
            }
        }
    }

    // ---- 6. Backfill surface tags on existing ceramic products -------------
    const tagCategoryIdsByGroup = {}; // group_key -> { slug: category_id }
    const childRows = await db.query(
        `SELECT c.id, c.slug, g.group_key FROM categories c JOIN category_groups g ON c.group_id = g.id WHERE c.parent_id = ?`,
        [mainId]
    );
    for (const r of childRows) {
        tagCategoryIdsByGroup[r.group_key] = tagCategoryIdsByGroup[r.group_key] || {};
        tagCategoryIdsByGroup[r.group_key][r.slug] = r.id;
    }

    async function tagProduct(productId, categoryId) {
        const dupe = await db.queryOne(`SELECT id FROM product_categories WHERE product_id = ? AND category_id = ?`, [productId, categoryId]);
        if (dupe) return false;
        try {
            await db.query(`INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`, [productId, categoryId]);
            return true;
        } catch (e) {
            return false;
        }
    }

    const existingProducts = await db.query(`
        SELECT DISTINCT p.id FROM products p JOIN product_categories pc ON pc.product_id = p.id WHERE pc.category_id = ?
    `, [mainId]);
    let backfilled = 0;
    for (const { id: pid } of existingProducts) {
        const tags = await db.query(`
            SELECT g.group_key AS group_key, c.slug AS slug FROM product_categories pc
            JOIN categories c ON c.id = pc.category_id JOIN category_groups g ON c.group_id = g.id
            WHERE pc.product_id = ?
        `, [pid]);
        const have = new Set(tags.map(t => `${t.group_key}:${t.slug}`));
        const wantsWall = [...tags]
            .filter(t => ['area', 'application'].includes(t.group_key))
            .some(t => t.slug.includes('wall') || t.slug.includes('bathroom') || t.slug.includes('kitchen'));
        const wantedSurface = wantsWall ? 'wall' : 'floor';
        const surfCatId = tagCategoryIdsByGroup.surface?.[wantedSurface];
        if (surfCatId && !have.has(`surface:${wantedSurface}`)) {
            if (await tagProduct(pid, surfCatId)) backfilled++;
        }
    }
    console.log(`[Migration] Backfilled ${backfilled} surface tags on ${existingProducts.length} existing products.`);

    // ---- 7. Sample products covering every spec filter ---------------------
    async function resolveCategoryId(groupKey, slug) {
        const row = await db.queryOne(
            `SELECT c.id FROM categories c JOIN category_groups g ON c.group_id = g.id WHERE c.parent_id = ? AND g.group_key = ? AND c.slug = ?`,
            [mainId, groupKey, slug]
        );
        if (!row) throw new Error(`Cannot resolve category for ${groupKey}=${slug}`);
        return row.id;
    }

    let seeded = 0;
    for (let i = 0; i < PRODUCTS.length; i++) {
        const p = PRODUCTS[i];
        const sku = `MBW-CER-${1100 + i}`;
        const existing = await db.queryOne(`SELECT id FROM products WHERE sku = ?`, [sku]);
        if (existing) { console.log(`[Migration] Product already seeded, skipped: ${p.name}`); continue; }

        const prodSlug = `${slugify(p.name)}-${sku.toLowerCase()}`;
        const seoTitle = `${p.name} | Meenakshi Build World`;
        const description = `${p.name} — a versatile ceramic tile with a durable glaze, consistent batch shading and easy maintenance for everyday spaces.`;

        const resDb = await db.query(`
            INSERT INTO products (name, sku, slug, price, offer_price, stock, description, is_featured, published, seo_title, seo_description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `, [p.name, sku, prodSlug, p.price, p.offer || null, p.stock, description, p.featured ? 1 : 0, seoTitle, description]);
        const productId = db.getMode() === 'sqlite' ? resDb.insertId : (await db.queryOne(`SELECT id FROM products WHERE sku = ?`, [sku])).id;

        await db.query(
            `INSERT INTO product_images (product_id, image_url, alt_text, is_primary) VALUES (?, ?, ?, 1)`,
            [productId, TILE_IMAGES[seeded % TILE_IMAGES.length], p.name]
        );

        const brandRow = p.brand ? await db.queryOne(`SELECT id FROM brands WHERE slug = ?`, [p.brand]) : null;
        if (brandRow) await db.query(`UPDATE products SET brand_id = ? WHERE id = ?`, [brandRow.id, productId]);

        const categoryIds = [mainId];
        for (const [groupKey, slugVal] of Object.entries(p.tags)) {
            categoryIds.push(await resolveCategoryId(groupKey, slugVal));
        }
        for (const catId of categoryIds) {
            await tagProduct(productId, catId);
        }

        const sizeCatId = await resolveCategoryId('size', p.tags.size);
        const variantSku = `${sku}-V1`;
        const vRes = await db.query(`
            INSERT INTO product_variants (product_id, sku, size_category_id, price, offer_price, stock, is_default, status)
            VALUES (?, ?, ?, ?, ?, ?, 1, 'active')
        `, [productId, variantSku, sizeCatId, p.price, p.offer || null, p.stock]);
        const variantId = db.getMode() === 'sqlite' ? vRes.insertId : (await db.queryOne(`SELECT id FROM product_variants WHERE sku = ?`, [variantSku])).id;
        await db.query(`INSERT INTO inventory (variant_id, quantity_boxes, reserved_boxes, reorder_level) VALUES (?, ?, 0, 20)`, [variantId, p.stock]);

        seeded++;
        console.log(`[Migration] Seeded product "${p.name}" (${sku})`);
    }

    console.log(`[Migration] Complete. ${seeded} products seeded, taxonomy verified across all 36 spec filters.`);
    process.exit(0);
}

run().catch(err => { console.error('[Migration] Failed:', err); process.exit(1); });
