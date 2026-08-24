// Meenakshi Build World — Other Tile Areas ecosystem completion migration.
//
// "Other Tile Areas" already exists as a main category with 14 application
// subcategories and 5 products. This script completes it to the spec,
// additively and idempotently:
//   1. Ensures the main "Other Tile Areas" category exists and carries a
//      professional description of the section's scope.
//   2. Ensures all 7 spec subcategories exist with their EXACT names
//     (TV Unit Tiles, Commercial Tiles, Swimming Pool Tiles, Hospital Tiles,
//     School Tiles, Bar Tiles, Restaurant Tiles) and reorders them to lead
//     the mega-menu column; pre-existing specialty rows (Staircase, Pooja
//     Room, Hotel…) are kept untouched and follow after.
//   3. Adds a new global "material" category_group (By Material) — a first-
//      class filter dimension like area/finish/size/design/type/color — with
//      Vitrified / Ceramic / Porcelain / Glass / Natural Stone values under
//      this main. Admins can add more materials at any time.
//   4. Adds Floor/Wall surface values.
//   5. Adds a dynamic "Application" select attribute on the main category
//      (Admin → Attributes) seeded with every spec application value
//      (Office, Showroom, Pool Wall, Classroom, Bar Counter, Dining Area…)
//      so each product can record its specific application — fully editable
//      from the Admin Panel without code changes.
//   6. Backfills surface tags on existing products.
//   7. Seeds sample products spanning ALL 7 spec subcategories AND every
//      material value — one record per product, tagged with atomic
//      attributes only, appearing automatically in every matching listing.
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

// The 7 spec subcategories in menu order (application group).
const SUBCATEGORIES = [
    { name: 'TV Unit Tiles', slug: 'tv-unit-tiles' },
    { name: 'Commercial Tiles', slug: 'commercial-tiles' },
    { name: 'Swimming Pool Tiles', slug: 'swimming-pool-tiles' },
    { name: 'Hospital Tiles', slug: 'hospital-tiles' },
    { name: 'School Tiles', slug: 'school-tiles' },
    { name: 'Bar Tiles', slug: 'bar-tiles' },
    { name: 'Restaurant Tiles', slug: 'restaurant-tiles' }
];

// New first-class Material dimension (global group; values scoped per-main).
// Slugs carry a "-material" suffix where the plain word is already taken by a
// same-parent row in another facet group (per-parent slug uniqueness).
const MATERIALS = [
    { name: 'Vitrified', slug: 'vitrified-material' },
    { name: 'Ceramic', slug: 'ceramic-material' },
    { name: 'Porcelain', slug: 'porcelain-material' },
    { name: 'Glass', slug: 'glass' },
    { name: 'Natural Stone', slug: 'natural-stone' }
];

const SIZES = [{ name: '300x600 mm', slug: '300x600' }];

// Extra designs used by sample products that a partial taxonomy may lack.
const DESIGNS = [{ name: 'Mosaic', slug: 'mosaic' }];

// Extra finishes used by sample products that a partial taxonomy may lack.
const FINISHES = [{ name: 'Rustic', slug: 'rustic' }];

const SURFACE = [
    { name: 'Floor', slug: 'floor' },
    { name: 'Wall', slug: 'wall' }
];

// Dynamic "Application" select attribute values (union of every spec list).
const APPLICATION_VALUES = [
    // Commercial
    'Office', 'Showroom', 'Retail', 'Mall', 'Corporate', 'Commercial Building', 'Public Space',
    // Swimming Pool
    'Swimming Pool', 'Pool Wall', 'Pool Floor', 'Water Feature',
    // Hospital
    'Hospital Floor', 'Hospital Wall', 'Corridor', 'Reception', 'Waiting Area', 'Healthcare Facility',
    // School
    'Classroom', 'School Floor', 'School Wall', 'Laboratory', 'Play Area',
    // Bar
    'Bar Counter', 'Bar Wall', 'Backsplash', 'Decorative Wall',
    // Restaurant
    'Restaurant Floor', 'Restaurant Wall', 'Kitchen', 'Dining Area', 'Counter', 'Outdoor Dining',
    // TV Unit
    'TV Unit Wall', 'Feature Wall'
];

// Sample products — tagged ONLY with atomic attribute slugs. Each appears
// automatically in every matching listing view. Together these cover all 7
// spec subcategories and all 5 materials.
const PRODUCTS = [
    { name: 'Premium Grey Commercial Tile', price: 62, offer: 54, stock: 200, brand: 'simpolo-vitrified', featured: true, application_value: 'Office', tags: { application: 'commercial-tiles', surface: 'floor', size: '600x600', design: 'stone', material: 'vitrified-material', finish: 'matt', color: 'grey' } },
    { name: 'Marble TV Unit Feature Wall Tile', price: 95, offer: 84, stock: 110, brand: 'kajaria-eternity', featured: true, application_value: 'TV Unit Wall', tags: { application: 'tv-unit-tiles', surface: 'wall', size: '600x1200', design: 'marble', material: 'vitrified-material', finish: 'glossy', color: 'white' } },
    { name: 'Glass Mosaic Swimming Pool Tile', price: 78, offer: 69, stock: 150, brand: 'nitco', application_value: 'Pool Wall', tags: { application: 'swimming-pool-tiles', surface: 'wall', size: '300x300', design: 'mosaic', material: 'glass', finish: 'glossy', color: 'blue' } },
    { name: 'Anti Skid Hospital Floor Tile', price: 58, stock: 240, brand: 'orientbell-horizon', application_value: 'Hospital Floor', tags: { application: 'hospital-tiles', surface: 'floor', size: '600x600', design: 'plain', material: 'porcelain-material', finish: 'anti-skid', color: 'white' } },
    { name: 'Classroom Ceramic School Tile', price: 40, stock: 260, brand: 'orientbell-horizon', application_value: 'Classroom', tags: { application: 'school-tiles', surface: 'wall', size: '300x300', design: 'plain', material: 'ceramic-material', finish: 'matt', color: 'cream' } },
    { name: 'Rustic Brick Bar Counter Tile', price: 66, offer: 58, stock: 130, brand: 'somany-grandeur', application_value: 'Bar Counter', tags: { application: 'bar-tiles', surface: 'wall', size: '300x300', design: 'designer', material: 'ceramic-material', finish: 'rustic', color: 'brown' } },
    { name: 'Wood-Look Restaurant Floor Tile', price: 72, offer: 63, stock: 170, brand: 'marazzi-italian', featured: true, application_value: 'Restaurant Floor', tags: { application: 'restaurant-tiles', surface: 'floor', size: '600x1200', design: 'wooden', material: 'porcelain-material', finish: 'rustic', color: 'brown' } },
    { name: 'Stone-Look Hotel Lobby Tile', price: 88, offer: 77, stock: 120, brand: 'marazzi-italian', application_value: 'Reception', tags: { application: 'hotel-tiles', surface: 'floor', size: '600x1200', design: 'stone', material: 'natural-stone', finish: 'polished', color: 'beige' } },
    { name: 'Mosaic Bar Backsplash Tile', price: 70, offer: 61, stock: 140, brand: 'nitco', application_value: 'Backsplash', tags: { application: 'bar-tiles', surface: 'wall', size: '300x300', design: 'mosaic', material: 'glass', finish: 'glossy', color: 'blue-and-white' } },
    { name: 'Matt Porcelain Restaurant Wall Tile', price: 48, stock: 220, brand: 'simpolo-vitrified', application_value: 'Dining Area', tags: { application: 'restaurant-tiles', surface: 'wall', size: '300x600', design: 'plain', material: 'porcelain-material', finish: 'matt', color: 'ivory' } },
    { name: 'Anti-Skid School Corridor Tile', price: 52, offer: 46, stock: 210, brand: 'orientbell-horizon', application_value: 'Corridor', tags: { application: 'school-tiles', surface: 'floor', size: '600x600', design: 'stone', material: 'ceramic-material', finish: 'anti-skid', color: 'grey' } },
    { name: 'Plain White Hospital Wall Tile', price: 44, stock: 250, brand: 'kajaria-eternity', application_value: 'Hospital Wall', tags: { application: 'hospital-tiles', surface: 'wall', size: '300x300', design: 'plain', material: 'ceramic-material', finish: 'matt', color: 'white' } }
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

    // ---- 1. Main category --------------------------------------------------
    let main = await db.queryOne(`SELECT * FROM categories WHERE slug = 'other-tile-areas' AND parent_id IS NULL`);
    if (!main) {
        const maxOrder = await db.queryOne(`SELECT COALESCE(MAX(display_order), 0) as m FROM categories WHERE parent_id IS NULL`);
        const desc = 'Specialty tile solutions for specialized residential, commercial and institutional spaces — TV units, showrooms, pools, hospitals, schools, bars and restaurants.';
        await db.query(`
            INSERT INTO categories (name, slug, parent_id, group_id, category_type, description, image, banner_url, icon, seo_title, seo_description, status, display_order, featured)
            VALUES ('Other Tile Areas', 'other-tile-areas', NULL, NULL, 'tile', ?, ?, ?, 'building',
                    'Other Tile Areas | Meenakshi Build World',
                    'Explore specialized tiles for TV units, commercial spaces, swimming pools, hospitals, schools, bars and restaurants at Meenakshi Build World.',
                    'active', ?, 1)
        `, [desc, TILE_IMAGES[1], TILE_IMAGES[1], parseInt(maxOrder.m) + 1]);
        main = await db.queryOne(`SELECT * FROM categories WHERE slug = 'other-tile-areas' AND parent_id IS NULL`);
        console.log('[Migration] Created main "Other Tile Areas" category');
    }
    const mainId = main.id;

    // Keep the landing copy aligned with the spec positioning.
    if (!/specialized residential/i.test(main.description || '')) {
        await db.query(`UPDATE categories SET description = ? WHERE id = ?`, [
            'Professional tile solutions for specialized residential, commercial and institutional spaces — designer TV unit walls, high-traffic commercial floors, swimming pools, hospitals, schools, bars and restaurants.',
            mainId
        ]);
        console.log('[Migration] Updated main category description');
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

    // ---- 2. Global groups (material is new site-wide) ----------------------
    if (!groupIdByKey.material) {
        const maxOrder = await db.queryOne(`SELECT COALESCE(MAX(display_order), 0) as m FROM category_groups`);
        await db.query(
            `INSERT INTO category_groups (group_key, name, slug, icon, display_order) VALUES (?, ?, ?, ?, ?)`,
            ['material', 'By Material', 'material', 'grid', parseInt(maxOrder.m) + 1]
        );
        groupIdByKey.material = (await db.queryOne(`SELECT id FROM category_groups WHERE group_key = 'material'`)).id;
        console.log('[Migration] Added category_groups "material" (By Material)');
    }
    if (!groupIdByKey.surface) {
        const maxOrder = await db.queryOne(`SELECT COALESCE(MAX(display_order), 0) as m FROM category_groups`);
        await db.query(
            `INSERT INTO category_groups (group_key, name, slug, icon, display_order) VALUES (?, ?, ?, ?, ?)`,
            ['surface', 'By Surface', 'surface', 'layers', parseInt(maxOrder.m) + 1]
        );
        groupIdByKey.surface = (await db.queryOne(`SELECT id FROM category_groups WHERE group_key = 'surface'`)).id;
        console.log('[Migration] Added category_groups "surface" (By Surface)');
    }

    // ---- 3. Ensure facet values --------------------------------------------
    let order = parseInt((await db.queryOne(`SELECT COALESCE(MAX(display_order), 0) as m FROM categories WHERE parent_id = ?`, [mainId])).m) + 1;

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
        console.log(`[Migration] Added "${name}" (${groupKey}, slug=${finalSlug})`);
        return db.getMode() === 'sqlite' ? res.insertId : (await db.queryOne(`SELECT id FROM categories WHERE parent_id = ? AND slug = ?`, [mainId, finalSlug])).id;
    }

    for (const item of SUBCATEGORIES) await ensureCategory({ ...item, groupKey: 'application' });
    for (const item of MATERIALS) await ensureCategory({ ...item, groupKey: 'material' });
    for (const item of SIZES) await ensureCategory({ ...item, groupKey: 'size' });
    for (const item of DESIGNS) await ensureCategory({ ...item, groupKey: 'design' });
    for (const item of FINISHES) await ensureCategory({ ...item, groupKey: 'finish' });
    for (const item of SURFACE) await ensureCategory({ ...item, groupKey: 'surface' });

    // Lead the application column with the 7 spec subcategories, then extras.
    const appRows = await db.query(
        `SELECT id, slug FROM categories WHERE parent_id = ? AND group_id = ? ORDER BY display_order, id`,
        [mainId, groupIdByKey.application]
    );
    let ord = 1;
    for (const item of SUBCATEGORIES) {
        const row = appRows.find(r => r.slug === item.slug);
        if (row) { await db.query(`UPDATE categories SET display_order = ? WHERE id = ?`, [ord++, row.id]); }
    }
    for (const row of appRows) {
        if (!SUBCATEGORIES.some(s => s.slug === row.slug)) {
            await db.query(`UPDATE categories SET display_order = ? WHERE id = ?`, [ord++, row.id]);
        }
    }
    console.log('[Migration] Taxonomy complete.');

    // ---- 4. Dynamic Application technical attribute -------------------------
    let attr = await db.queryOne(`SELECT * FROM category_attributes WHERE category_id = ? AND slug = 'application'`, [mainId]);
    if (!attr) {
        const res = await db.query(
            `INSERT INTO category_attributes (category_id, name, slug, input_type, unit, display_order) VALUES (?, 'Application', 'application', 'select', NULL, 1)`,
            [mainId]
        );
        const attrId = db.getMode() === 'sqlite' ? res.insertId : (await db.queryOne(`SELECT id FROM category_attributes WHERE category_id = ? AND slug = 'application'`, [mainId])).id;
        attr = { id: attrId };
        console.log('[Migration] Added dynamic "Application" attribute (Admin-editable)');
    }
    let vOrder = parseInt((await db.queryOne(`SELECT COALESCE(MAX(display_order), 0) as m FROM attribute_values WHERE attribute_id = ?`, [attr.id])).m);
    const existingValues = new Set((await db.query(`SELECT value FROM attribute_values WHERE attribute_id = ?`, [attr.id])).map(r => r.value));
    let addedValues = 0;
    for (const v of APPLICATION_VALUES) {
        if (existingValues.has(v)) continue;
        await db.query(`INSERT INTO attribute_values (attribute_id, value, display_order) VALUES (?, ?, ?)`, [attr.id, v, ++vOrder]);
        addedValues++;
    }
    console.log(`[Migration] Application attribute ready (${addedValues} values added).`);

    // ---- 5. Backfill surface + resolve helpers ------------------------------
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
        const haveSurface = await db.queryOne(`
            SELECT pc.id FROM product_categories pc JOIN categories c ON c.id = pc.category_id
            JOIN category_groups g ON g.id = c.group_id
            WHERE pc.product_id = ? AND g.group_key = 'surface'
        `, [pid]);
        if (!haveSurface && tagCategoryIdsByGroup.surface?.floor) {
            if (await tagProduct(pid, tagCategoryIdsByGroup.surface.floor)) backfilled++;
        }
    }
    console.log(`[Migration] Backfilled ${backfilled} surface tags on ${existingProducts.length} existing products.`);

    // ---- 6. Sample products --------------------------------------------------
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
        const sku = `MBW-OTA-${1100 + i}`;
        const existing = await db.queryOne(`SELECT id FROM products WHERE sku = ?`, [sku]);
        if (existing) { console.log(`[Migration] Product already seeded, skipped: ${p.name}`); continue; }

        const prodSlug = `${slugify(p.name)}-${sku.toLowerCase()}`;
        const seoTitle = `${p.name} | Meenakshi Build World`;
        const description = `${p.name} — purpose-built tiling for demanding spaces, with a durable body, easy-clean surface and consistent batch shading.`;

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

        // Answer the dynamic Application attribute for this product.
        if (p.application_value) {
            await db.query(
                `INSERT INTO product_attributes (product_id, attribute_id, custom_value) VALUES (?, ?, ?)`,
                [productId, attr.id, p.application_value]
            );
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

    console.log(`[Migration] Complete. ${seeded} products seeded across all 7 spec subcategories.`);
    process.exit(0);
}

run().catch(err => { console.error('[Migration] Failed:', err); process.exit(1); });
