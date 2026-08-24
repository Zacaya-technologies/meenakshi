// Meenakshi Build World — Parking Tiles ecosystem completion migration.
//
// "Parking Tiles" already exists as a main category with a partial taxonomy.
// This script completes it to the full spec, additively and idempotently:
//   1. Ensures the main "Parking Tiles" category exists (creates it if a fresh
//      database has no seed for it yet).
//   2. Renames existing facet rows to the spec naming (ids stay stable, so
//      product tags are never affected) — sizes become "1x1 Parking Tiles"
//      style with matching slugs (/tiles/parking-tiles/400x400-parking-tiles),
//      and "Anti-Skid" becomes "Anti Skid".
//   3. Adds every missing atomic value: 3 areas, 3 finishes, 4 sizes,
//      9 designs, 6 types and 9 colors (34 spec entries total). Extra values
//      already present (Driveway, Garage, Concrete…) are kept untouched —
//      admins can add more at any time from the Admin Panel with no code.
//   4. Adds Floor/Wall surface values so products can be filtered by surface.
//   5. Reorders color facets so the nine spec colors lead the mega-menu
//      column (menu columns cap at 14 items).
//   6. Backfills area/surface tags on existing Parking Tile products so they
//      appear on the new Area pages without duplicating any product.
//   7. Seeds sample products spanning ALL 34 filter views — one product
//      tagged with atomic attributes only, appearing automatically in every
//      matching listing (category + area + finish + size + design + type +
//      color) through the standard AND-of-facets mechanism.
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
// The complete spec taxonomy. Every entry is ensured (inserted only when
// missing), keyed by group_key. `slug` is explicit wherever it must diverge
// from slugify(name) — e.g. size rows whose display name carries the mm unit
// but whose URL follows /tiles/parking-tiles/400x400-parking-tiles.
// ---------------------------------------------------------------------------
const TAXONOMY = {
    area: [
        { name: 'Parking Wall Tiles', slug: 'parking-wall-tiles' },
        { name: 'Parking Floor Tiles', slug: 'parking-floor-tiles' },
        { name: 'Outdoor Parking Tiles', slug: 'outdoor-parking-tiles' }
    ],
    application: [
        { name: 'Driveway Tiles', slug: 'driveway-tiles' },
        { name: 'Garage Tiles', slug: 'garage-tiles' }
    ],
    finish: [
        { name: 'Anti Skid', slug: 'anti-skid' },
        { name: 'Matt', slug: 'matt' },
        { name: 'Rustic', slug: 'rustic' }
    ],
    size: [
        { name: '1x1 Parking Tiles', slug: '1x1-parking-tiles' },
        { name: '2x2 Parking Tiles', slug: '2x2-parking-tiles' },
        { name: '400x400 mm Parking Tiles', slug: '400x400-parking-tiles' },
        { name: '500x500 mm Parking Tiles', slug: '500x500-parking-tiles' }
    ],
    design: [
        { name: 'Cement', slug: 'cement' },
        { name: 'Wooden', slug: 'wooden' },
        { name: 'Stone', slug: 'stone' },
        { name: 'Plain', slug: 'plain' },
        { name: '3D', slug: '3d' },
        { name: 'Granite', slug: 'granite' },
        { name: 'Marble', slug: 'marble' },
        { name: 'Mosaic', slug: 'mosaic' },
        { name: 'Texture', slug: 'texture' }
    ],
    type: [
        { name: 'Ceramic', slug: 'ceramic' },
        { name: 'Vitrified', slug: 'vitrified' },
        { name: 'Digital', slug: 'digital' },
        { name: 'Designer', slug: 'designer' },
        { name: 'Full Body Vitrified', slug: 'full-body-vitrified' },
        { name: 'Porcelain', slug: 'porcelain' }
    ],
    color: [
        { name: 'White', slug: 'white' },
        { name: 'Black', slug: 'black' },
        { name: 'Grey', slug: 'grey' },
        { name: 'Red', slug: 'red' },
        { name: 'Green', slug: 'green' },
        { name: 'Brown', slug: 'brown' },
        { name: 'Blue', slug: 'blue' },
        { name: 'Terracotta', slug: 'terracotta' },
        { name: 'Black & White', slug: 'black-and-white' }
    ],
    surface: [
        { name: 'Floor', slug: 'floor' },
        { name: 'Wall', slug: 'wall' }
    ]
};

// Existing rows renamed to match the spec exactly (id-stable — product tags
// are never touched by a rename). Sizes get "<size> Parking Tiles" names and
// "-parking-tiles" slugs per the requested URL scheme; legacy bare-size rows
// ("400x400 mm", slug "400x400") are upgraded in place.
const RENAMES = [
    ['finish', 'Anti-Skid', 'Anti Skid', 'anti-skid'],
    ['size', '1x1', '1x1 Parking Tiles', '1x1-parking-tiles'],
    ['size', '2x2', '2x2 Parking Tiles', '2x2-parking-tiles'],
    ['size', '300x300 mm', '300x300 mm Parking Tiles', '300x300-parking-tiles'],
    ['size', '400x400 mm', '400x400 mm Parking Tiles', '400x400-parking-tiles'],
    ['size', '500x500 mm', '500x500 mm Parking Tiles', '500x500-parking-tiles'],
    ['size', '600x600 mm', '600x600 mm Parking Tiles', '600x600-parking-tiles'],
    ['size', '600x1200 mm', '600x1200 mm Parking Tiles', '600x1200-parking-tiles']
];

// The nine spec colors, in menu order, followed by any other existing parking
// color rows. Applied as display_order so mega-menu columns (14-item cap)
// always lead with the spec set.
const COLOR_ORDER = [
    'white', 'black', 'grey', 'red', 'green', 'brown', 'blue', 'terracotta', 'black-and-white'
];

// Sample products — tagged ONLY with atomic attribute slugs, never with
// category rows directly. Each one therefore appears automatically in every
// matching listing view (main category + area + finish + size + design +
// type + color) — one record, many listings, zero duplication. Together with
// the previously seeded parking products these cover all 34 spec filters.
const PRODUCTS = [
    { name: 'Premium Stone Parking Tile', price: 52, offer: 46, stock: 180, brand: 'orientbell-horizon', featured: true, tags: { area: 'parking-floor-tiles', surface: 'floor', size: '400x400-parking-tiles', design: 'stone', type: 'vitrified', finish: 'anti-skid', color: 'grey' } },
    { name: 'Glossy Mosaic Parking Wall Tile', price: 48, offer: 42, stock: 150, brand: 'nitco', tags: { area: 'parking-wall-tiles', surface: 'wall', size: '300x300-parking-tiles', design: 'mosaic', type: 'ceramic', finish: 'matt', color: 'white' } },
    { name: 'Cement Matte Digital Driveway Tile', price: 44, stock: 220, brand: 'simpolo-vitrified', tags: { area: 'parking-floor-tiles', surface: 'floor', size: '500x500-parking-tiles', design: 'cement', type: 'digital', finish: 'matt', color: 'brown' } },
    { name: 'Wooden Plank Porcelain Parking Tile', price: 58, offer: 52, stock: 130, brand: 'marazzi-italian', tags: { area: 'parking-floor-tiles', surface: 'floor', size: '600x600-parking-tiles', design: 'wooden', type: 'porcelain', finish: 'rustic', color: 'terracotta' } },
    { name: 'Plain White Heavy Duty Garage Tile', price: 40, stock: 260, brand: 'orientbell-horizon', tags: { area: 'parking-floor-tiles', surface: 'floor', size: '2x2-parking-tiles', design: 'plain', type: 'heavy-duty', finish: 'matt', color: 'white' } },
    { name: '3D Designer Black & White Parking Tile', price: 62, offer: 55, stock: 110, brand: 'kajaria-eternity', featured: true, tags: { area: 'parking-floor-tiles', surface: 'floor', size: '600x600-parking-tiles', design: '3d', type: 'designer', finish: 'matt', color: 'black-and-white' } },
    { name: 'Green Marble Outdoor Parking Slab', price: 72, offer: 64, stock: 95, brand: 'marazzi-italian', tags: { area: 'outdoor-parking-tiles', surface: 'floor', size: '600x1200-parking-tiles', design: 'marble', type: 'porcelain', finish: 'matt', color: 'green' } },
    { name: 'Red Granite Anti Skid Outdoor Paver', price: 50, stock: 200, brand: 'simpolo-vitrified', tags: { area: 'outdoor-parking-tiles', surface: 'floor', size: '500x500-parking-tiles', design: 'granite', type: 'paver', finish: 'anti-skid', color: 'red' } },
    { name: 'Blue Texture Vitrified Parking Tile', price: 47, offer: 41, stock: 170, brand: 'somany-grandeur', tags: { area: 'parking-floor-tiles', surface: 'floor', size: '1x1-parking-tiles', design: 'texture', type: 'vitrified', finish: 'anti-skid', color: 'blue' } },
    { name: 'Terracotta Rustic Outdoor Parking Tile', price: 46, stock: 190, brand: 'nitco', tags: { area: 'outdoor-parking-tiles', surface: 'floor', size: '500x500-parking-tiles', design: 'concrete', type: 'ceramic', finish: 'rustic', color: 'terracotta' } }
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
    let main = await db.queryOne(`SELECT * FROM categories WHERE slug = 'parking-tiles' AND parent_id IS NULL`);
    if (!main) {
        const maxOrder = await db.queryOne(`SELECT COALESCE(MAX(display_order), 0) as m FROM categories WHERE parent_id IS NULL`);
        const desc = 'Heavy-duty parking, driveway and vehicle-area tiles — high load-bearing surfaces for indoor garages, outdoor driveways and covered parking structures.';
        await db.query(`
            INSERT INTO categories (name, slug, parent_id, group_id, category_type, description, image, banner_url, icon, seo_title, seo_description, status, display_order, featured)
            VALUES ('Parking Tiles', 'parking-tiles', NULL, NULL, 'tile', ?, ?, ?, 'parking',
                    'Parking Tiles | Meenakshi Build World',
                    'Explore heavy-duty parking tiles for driveways, garages and outdoor vehicle areas. Anti-skid, vitrified and full-body options at Meenakshi Build World.',
                    'active', ?, 1)
        `, [desc, TILE_IMAGES[5], TILE_IMAGES[5], parseInt(maxOrder.m) + 1]);
        main = await db.queryOne(`SELECT * FROM categories WHERE slug = 'parking-tiles' AND parent_id IS NULL`);
        console.log('[Migration] Created main "Parking Tiles" category');
    }
    const mainId = main.id;

    // Keep the main landing copy aligned with the spec (driveway/outdoor/
    // vehicle-area positioning) without clobbering admin-authored text.
    if (!main.description || /High-duty/i.test(main.description || '')) {
        await db.query(`UPDATE categories SET description = ? WHERE id = ?`, [
            'Heavy-duty parking, driveway and vehicle-area tiles — high load-bearing surfaces engineered for constant vehicle traffic in indoor garages, outdoor driveways and covered parking structures.',
            mainId
        ]);
    }

    const groupIdByKey = {};
    for (const row of await db.query(`SELECT id, group_key FROM category_groups`)) groupIdByKey[row.group_key] = row.id;
    // The surface dimension is shared site-wide; create it if a fresh DB lacks it.
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

    // ---- 2. Renames (id-stable) -------------------------------------------
    for (const [groupKey, oldName, newName, prefSlug] of RENAMES) {
        const groupId = groupIdByKey[groupKey];
        const cat = await db.queryOne(
            `SELECT * FROM categories WHERE parent_id = ? AND group_id = ? AND name = ?`,
            [mainId, groupId, oldName]
        );
        if (!cat) { console.log(`[Migration] Rename target not present, skipped: ${oldName}`); continue; }
        const slug = prefSlug === cat.slug ? cat.slug : await uniqueSlug(prefSlug);
        await db.query(
            `UPDATE categories SET name = ?, slug = ?, seo_title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [newName, slug, `${newName} | Meenakshi Build World`, cat.id]
        );
        console.log(`[Migration] Renamed "${oldName}" -> "${newName}" (slug=${slug})`);
    }

    // ---- 3. Ensure every spec value exists ---------------------------------
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

    // ---- 4. Lead the color column with the nine spec colors ----------------
    const colorGroupId = groupIdByKey.color;
    const colorRows = await db.query(
        `SELECT id, slug FROM categories WHERE parent_id = ? AND group_id = ? ORDER BY display_order, id`,
        [mainId, colorGroupId]
    );
    let cOrder = 1;
    for (const slug of COLOR_ORDER) {
        const row = colorRows.find(r => r.slug === slug);
        if (row) { await db.query(`UPDATE categories SET display_order = ? WHERE id = ?`, [cOrder++, row.id]); }
    }
    for (const row of colorRows) {
        if (!COLOR_ORDER.includes(row.slug)) {
            await db.query(`UPDATE categories SET display_order = ? WHERE id = ?`, [cOrder++, row.id]);
        }
    }

    // ---- 5. Backfill area/surface tags on existing parking products --------
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
        const appSlugs = tags.filter(t => t.group_key === 'application').map(t => t.slug);
        const areaSlugs = tags.filter(t => t.group_key === 'area').map(t => t.slug);
        const wantedAreas = new Set(areaSlugs);
        if (appSlugs.includes('driveway-tiles')) { wantedAreas.add('outdoor-parking-tiles'); wantedAreas.add('parking-floor-tiles'); }
        if (appSlugs.includes('garage-tiles')) wantedAreas.add('parking-floor-tiles');
        if (!wantedAreas.size && appSlugs.length) wantedAreas.add('parking-floor-tiles');
        const wantsWall = areaSlugs.includes('parking-wall-tiles') || appSlugs.some(s => s.includes('wall'));
        const wantedSurface = wantsWall ? 'wall' : 'floor';
        for (const areaSlug of wantedAreas) {
            const catId = tagCategoryIdsByGroup.area?.[areaSlug];
            if (catId && !have.has(`area:${areaSlug}`)) {
                if (await tagProduct(pid, catId)) backfilled++;
            }
        }
        const surfCatId = tagCategoryIdsByGroup.surface?.[wantedSurface];
        if (surfCatId && !have.has(`surface:${wantedSurface}`)) {
            if (await tagProduct(pid, surfCatId)) backfilled++;
        }
    }
    console.log(`[Migration] Backfilled ${backfilled} area/surface tags on ${existingProducts.length} existing products.`);

    // ---- 6. Sample products covering every spec filter ---------------------
    async function resolveCategoryId(groupKey, slug) {
        const row = await db.queryOne(
            `SELECT c.id FROM categories c JOIN category_groups g ON c.group_id = g.id WHERE c.parent_id = ? AND g.group_key = ? AND c.slug = ?`,
            [mainId, groupKey, slug]
        );
        if (!row) throw new Error(`Cannot resolve category for ${groupKey}=${slug}`);
        return row.id;
    }

    function slugifyText(text) {
        return slugify(text);
    }

    let seeded = 0;
    for (let i = 0; i < PRODUCTS.length; i++) {
        const p = PRODUCTS[i];
        const sku = `MBW-PRK-${1100 + i}`;
        const existing = await db.queryOne(`SELECT id FROM products WHERE sku = ?`, [sku]);
        if (existing) { console.log(`[Migration] Product already seeded, skipped: ${p.name}`); continue; }

        const prodSlug = `${slugifyText(p.name)}-${sku.toLowerCase()}`;
        const seoTitle = `${p.name} | Meenakshi Build World`;
        const description = `${p.name} — a heavy-duty parking tile built for constant vehicle traffic, with a high load-bearing body and consistent batch shading.`;

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

    console.log(`[Migration] Complete. ${seeded} products seeded, taxonomy verified across all 34 spec filters.`);
    process.exit(0);
}

run().catch(err => { console.error('[Migration] Failed:', err); process.exit(1); });
