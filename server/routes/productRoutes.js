const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

function slugify(text) {
    return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

function toArray(v) {
    if (v === undefined || v === null || v === '') return [];
    return Array.isArray(v) ? v.filter(Boolean) : [v];
}

// "area" (Floor/Wall) and "application" (Kitchen/Bathroom) are mutually
// exclusive per main category — a product only ever has one or the other.
const FACET_GROUP_KEYS = ['area', 'application', 'size', 'design', 'type', 'finish', 'color', 'surface'];

// Correlated subqueries that flatten each product's linked taxonomy + main
// category into convenience string fields, reused by both the list and
// detail endpoints so the frontend doesn't need to know about the M2M shape.
const FLATTENED_FIELDS = FACET_GROUP_KEYS.map(key => `
    (SELECT cc.name FROM product_categories pcx JOIN categories cc ON pcx.category_id = cc.id
     JOIN category_groups gg ON cc.group_id = gg.id
     WHERE pcx.product_id = p.id AND gg.group_key = '${key}' LIMIT 1) as ${key}
`).join(',');
const MAIN_CATEGORY_FIELDS = `
    (SELECT cc.name FROM product_categories pcx JOIN categories cc ON pcx.category_id = cc.id
     WHERE pcx.product_id = p.id AND cc.parent_id IS NULL LIMIT 1) as category_name,
    (SELECT cc.slug FROM product_categories pcx JOIN categories cc ON pcx.category_id = cc.id
     WHERE pcx.product_id = p.id AND cc.parent_id IS NULL LIMIT 1) as category_slug
`;

// GET /api/v1/products - faceted search & filter
router.get('/', async (req, res) => {
    try {
        const {
            q, category, area, application, size, design, type, finish, color, brand, collection,
            min_price, max_price, sort, featured, trending, in_stock, page = 1, limit = 12
        } = req.query;

        const conditions = ["(p.published = 1 OR p.published = true)", "(p.is_archived = 0 OR p.is_archived = false)"];
        const params = [];

        if (q) {
            conditions.push(`(
                p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ? OR
                EXISTS (SELECT 1 FROM product_categories pcq JOIN categories ccq ON pcq.category_id = ccq.id
                        WHERE pcq.product_id = p.id AND ccq.name LIKE ?) OR
                EXISTS (SELECT 1 FROM brands bq WHERE bq.id = p.brand_id AND bq.name LIKE ?) OR
                EXISTS (SELECT 1 FROM collections colq WHERE colq.id = p.collection_id AND colq.name LIKE ?)
            )`);
            const like = `%${q}%`;
            params.push(like, like, like, like, like, like);
        }

        if (category) {
            conditions.push(`EXISTS (
                SELECT 1 FROM product_categories pcm JOIN categories ccm ON pcm.category_id = ccm.id
                WHERE pcm.product_id = p.id AND ccm.parent_id IS NULL AND ccm.slug = ?
            )`);
            params.push(category);
        }

        const facetFilters = { area, application, size, design, type, finish, color };
        for (const key of FACET_GROUP_KEYS) {
            const values = toArray(facetFilters[key]);
            if (!values.length) continue;
            conditions.push(`EXISTS (
                SELECT 1 FROM product_categories pcf JOIN categories ccf ON pcf.category_id = ccf.id
                WHERE pcf.product_id = p.id AND ccf.slug IN (${values.map(() => '?').join(',')})
            )`);
            params.push(...values);
        }

        if (brand) {
            const brands = toArray(brand);
            conditions.push(`EXISTS (SELECT 1 FROM brands bb WHERE bb.id = p.brand_id AND bb.slug IN (${brands.map(() => '?').join(',')}))`);
            params.push(...brands);
        }
        if (collection) {
            conditions.push(`EXISTS (SELECT 1 FROM collections colf WHERE colf.id = p.collection_id AND colf.slug = ?)`);
            params.push(collection);
        }
        if (min_price) { conditions.push('COALESCE(p.offer_price, p.price) >= ?'); params.push(parseFloat(min_price)); }
        if (max_price) { conditions.push('COALESCE(p.offer_price, p.price) <= ?'); params.push(parseFloat(max_price)); }
        if (featured) conditions.push('(p.is_featured = 1 OR p.is_featured = true)');
        if (trending) conditions.push('(p.is_trending = 1 OR p.is_trending = true)');
        if (in_stock) conditions.push('p.stock > 0');

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        let orderClause = 'ORDER BY p.id DESC';
        if (sort === 'price_asc') orderClause = 'ORDER BY COALESCE(p.offer_price, p.price) ASC';
        if (sort === 'price_desc') orderClause = 'ORDER BY COALESCE(p.offer_price, p.price) DESC';
        if (sort === 'rating') orderClause = 'ORDER BY p.rating_avg DESC';
        if (sort === 'popular') orderClause = 'ORDER BY p.views_count DESC';

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const sql = `
            SELECT p.*, b.name as brand_name, b.logo_url as brand_logo, col.name as collection_name,
                   ${FLATTENED_FIELDS}, ${MAIN_CATEGORY_FIELDS},
                   (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1) as primary_image
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN collections col ON p.collection_id = col.id
            ${whereClause}
            ${orderClause}
            LIMIT ${parseInt(limit)} OFFSET ${offset}
        `;
        const products = await db.query(sql, params);

        const countSql = `SELECT COUNT(*) as total FROM products p ${whereClause}`;
        const countRes = await db.queryOne(countSql, params);
        const total = countRes ? parseInt(countRes.total) : 0;

        res.json({
            success: true,
            products,
            pagination: { total, page: parseInt(page), pages: Math.max(1, Math.ceil(total / parseInt(limit))) }
        });
    } catch (err) {
        console.error('Products API Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/v1/products/facets - fully dynamic filter/menu data.
// Every active category under the 6 groups is always returned (even with 0
// matching products yet) so new taxonomy entries appear in filters/menu the
// instant an admin creates them — live product counts are layered on top.
router.get('/facets', async (req, res) => {
    try {
        const { category } = req.query;

        let mainCategory = null;
        let mainIds;
        if (category) {
            mainCategory = await db.queryOne(`SELECT * FROM categories WHERE parent_id IS NULL AND slug = ?`, [category]);
            if (!mainCategory) return res.status(404).json({ success: false, message: 'Category not found' });
            mainIds = [mainCategory.id];
        } else {
            mainIds = (await db.query(`SELECT id FROM categories WHERE parent_id IS NULL`)).map(r => r.id);
        }

        const groups = await db.query(`SELECT * FROM category_groups ORDER BY display_order ASC`);
        const children = await db.query(`
            SELECT c.*,
                   (SELECT COUNT(*) FROM product_categories pc JOIN products pp ON pc.product_id = pp.id
                    WHERE pc.category_id = c.id AND (pp.published = 1 OR pp.published = true)) as product_count
            FROM categories c
            WHERE c.parent_id IN (${mainIds.map(() => '?').join(',')}) AND c.status = 'active'
            ORDER BY c.display_order ASC, c.name ASC
        `, mainIds);

        // A "composite" category (e.g. "Anti Skid Terrace Tiles") is never
        // directly tagged to a product — its page is a live AND of atomic
        // filters (composite_filters). Its badge count must reflect that same
        // AND, not a direct-tag lookup (which would always read 0).
        for (const child of children) {
            if (!child.composite_filters) continue;
            let filters;
            try { filters = JSON.parse(child.composite_filters); } catch { continue; }
            const entries = Object.entries(filters);
            if (!entries.length) continue;
            const existsClauses = entries.map(() => `
                EXISTS (SELECT 1 FROM product_categories pcf JOIN categories ccf ON pcf.category_id = ccf.id
                        WHERE pcf.product_id = pp.id AND ccf.slug = ?)
            `).join(' AND ');
            const row = await db.queryOne(`
                SELECT COUNT(*) as c FROM products pp
                WHERE (pp.published = 1 OR pp.published = true) AND ${existsClauses}
            `, entries.map(([, slug]) => slug));
            child.product_count = row ? row.c : 0;
        }

        // Room mains linked via parent_main_id are facet-filterable too — e.g.
        // filtering a Living Room page by "Bedroom" deep-links to /bedroom-tiles.
        let linkedMains = [];
        if (mainCategory) {
            linkedMains = await db.query(`
                SELECT c.*,
                       (SELECT COUNT(*) FROM product_categories pc JOIN products pp ON pc.product_id = pp.id
                        WHERE pc.category_id = c.id AND (pp.published = 1 OR pp.published = true)) as product_count
                FROM categories c
                WHERE c.parent_id IS NULL AND c.parent_main_id = ? AND c.status = 'active'
                ORDER BY c.display_order ASC, c.name ASC
            `, [mainCategory.id]);
        }

        // Only groups the scoped main categories actually have children in are
        // shown — e.g. Kitchen/Bathroom use "Application" instead of "Area".
        const groupPayload = groups
            .filter(g => children.some(c => c.group_id === g.id))
            .map(g => {
                const items = children.filter(c => c.group_id === g.id).map(c => ({
                    id: c.id, name: c.name, slug: c.slug, image: c.image, count: parseInt(c.product_count) || 0
                }));
                if (g.group_key === 'area' && linkedMains.length) {
                    linkedMains.forEach(c => items.push({
                        id: c.id, name: c.name, slug: c.slug, image: c.image, count: parseInt(c.product_count) || 0
                    }));
                }
                return { id: g.id, key: g.group_key, name: g.name, slug: g.slug, icon: g.icon, items };
            });

        const [brands, collections, priceRow] = await Promise.all([
            db.query(`SELECT id, name, slug FROM brands ORDER BY name ASC`),
            db.query(`SELECT id, name, slug FROM collections ORDER BY name ASC`),
            db.queryOne(`
                SELECT MIN(COALESCE(offer_price, price)) as min, MAX(COALESCE(offer_price, price)) as max
                FROM products p WHERE (p.published = 1 OR p.published = true)
                ${category ? `AND EXISTS (SELECT 1 FROM product_categories pc WHERE pc.product_id = p.id AND pc.category_id = ?)` : ''}
            `, category ? [mainCategory.id] : [])
        ]);

        res.json({
            success: true,
            category: mainCategory,
            groups: groupPayload,
            brands,
            collections,
            priceRange: { min: priceRow?.min || 0, max: priceRow?.max || 500 }
        });
    } catch (err) {
        console.error('Facets API Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/v1/products/suggest - live instant search suggestions across
// products AND the taxonomy (design/type/finish/color/size/area names).
router.get('/suggest', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) return res.json({ success: true, suggestions: [] });
        const like = `%${q}%`;

        const products = await db.query(`
            SELECT p.id, p.name, p.slug, p.price, p.offer_price,
                   (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1) as image,
                   (SELECT cc.name FROM product_categories pcx JOIN categories cc ON pcx.category_id = cc.id
                    JOIN category_groups gg ON cc.group_id = gg.id
                    WHERE pcx.product_id = p.id AND gg.group_key = 'size' LIMIT 1) as size
            FROM products p
            WHERE (p.published = 1 OR p.published = true) AND (p.name LIKE ? OR p.sku LIKE ?)
            LIMIT 5
        `, [like, like]);

        const categories = await db.query(`
            SELECT c.id, c.name, c.slug, c.image, pr.slug as parent_slug, g.name as group_name
            FROM categories c
            JOIN categories pr ON c.parent_id = pr.id
            LEFT JOIN category_groups g ON c.group_id = g.id
            WHERE c.status = 'active' AND c.name LIKE ?
            LIMIT 5
        `, [like]);

        // Top-level categories (rooms, etc.) are searchable targets too.
        const mainCategories = await db.query(`
            SELECT id, name, slug, image
            FROM categories
            WHERE parent_id IS NULL AND status = 'active' AND name LIKE ?
            LIMIT 5
        `, [like]);

        const suggestions = [
            ...products.map(p => ({ kind: 'product', ...p, url: `/product/${p.slug}` })),
            ...mainCategories.map(c => ({ kind: 'category', ...c, parent_slug: null, group_name: 'Main Category', url: `/${c.slug}` })),
            ...categories.map(c => ({ kind: 'category', ...c, url: `/${c.parent_slug}/${c.slug}` }))
        ];

        res.json({ success: true, suggestions });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/v1/products/:slug - full product detail (also accepts a numeric id,
// used by the admin edit form which only has the id on hand)
router.get('/:slug', async (req, res) => {
    try {
        const isNumeric = /^\d+$/.test(req.params.slug);
        const product = await db.queryOne(`
            SELECT p.*, b.name as brand_name, b.logo_url as brand_logo, b.slug as brand_slug,
                   col.name as collection_name, col.slug as collection_slug,
                   ${FLATTENED_FIELDS}, ${MAIN_CATEGORY_FIELDS}
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN collections col ON p.collection_id = col.id
            WHERE p.slug = ? ${isNumeric ? 'OR p.id = ?' : ''}
        `, isNumeric ? [req.params.slug, req.params.slug] : [req.params.slug]);

        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        // Best-effort view counter: on read-only serverless filesystems
        // (e.g. Vercel) SQLite writes throw — never let analytics break
        // the product detail response.
        db.query(`UPDATE products SET views_count = views_count + 1 WHERE id = ?`, [product.id]).catch(err => {
            console.warn('[Products] views_count increment skipped (read-only FS?):', err.message);
        });

        const [images, reviews, variants, attributeRows, related, categoryIdRows, rawAttributeRows] = await Promise.all([
            db.query(`SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, display_order ASC`, [product.id]),
            db.query(`SELECT * FROM reviews WHERE product_id = ? ORDER BY id DESC LIMIT 10`, [product.id]),
            db.query(`
                SELECT v.*, c.name as size_name, i.quantity_boxes, i.reserved_boxes, i.warehouse_location
                FROM product_variants v
                LEFT JOIN categories c ON v.size_category_id = c.id
                LEFT JOIN inventory i ON i.variant_id = v.id
                WHERE v.product_id = ? ORDER BY v.is_default DESC, v.id ASC
            `, [product.id]),
            db.query(`
                SELECT pa.custom_value, ca.name as attribute_name, ca.unit, av.value as attribute_value
                FROM product_attributes pa
                JOIN category_attributes ca ON pa.attribute_id = ca.id
                LEFT JOIN attribute_values av ON pa.attribute_value_id = av.id
                WHERE pa.product_id = ?
                ORDER BY ca.display_order ASC
            `, [product.id]),
            db.query(`
                SELECT p2.id, p2.name, p2.slug, p2.price, p2.offer_price, p2.rating_avg,
                       (SELECT image_url FROM product_images WHERE product_id = p2.id ORDER BY is_primary DESC LIMIT 1) as primary_image,
                       COUNT(*) as overlap
                FROM product_categories pc1
                JOIN product_categories pc2 ON pc1.category_id = pc2.category_id AND pc2.product_id != pc1.product_id
                JOIN products p2 ON p2.id = pc2.product_id
                WHERE pc1.product_id = ? AND (p2.published = 1 OR p2.published = true)
                GROUP BY p2.id, p2.name, p2.slug, p2.price, p2.offer_price, p2.rating_avg
                ORDER BY overlap DESC
                LIMIT 4
            `, [product.id]),
            db.query(`SELECT category_id FROM product_categories WHERE product_id = ?`, [product.id]),
            db.query(`SELECT attribute_id, attribute_value_id, custom_value FROM product_attributes WHERE product_id = ?`, [product.id])
        ]);

        const specifications = attributeRows.map(r => ({
            name: r.unit ? `${r.attribute_name} (${r.unit})` : r.attribute_name,
            value: r.custom_value || r.attribute_value || '—'
        }));

        res.json({
            success: true, product, images, reviews, variants, specifications, related,
            category_ids: categoryIdRows.map(r => r.category_id),
            attribute_assignments: rawAttributeRows
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ---------------------------------------------------------------------
// Admin: create / edit / duplicate / delete
// ---------------------------------------------------------------------

async function tagCategories(productId, categoryIds) {
    for (const catId of categoryIds) {
        await db.query(`INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)`, [productId, catId]).catch(async () => {
            // Postgres has no "INSERT OR IGNORE" — fall back to a plain insert guarded by existence check.
            const dupe = await db.queryOne(`SELECT id FROM product_categories WHERE product_id = ? AND category_id = ?`, [productId, catId]);
            if (!dupe) await db.query(`INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`, [productId, catId]);
        });
    }
}

async function createDefaultVariant(productId, sku, price, offer_price, dealer_price, stock, categoryIds) {
    const sizeCat = await db.query(`SELECT c.id FROM categories c JOIN category_groups g ON c.group_id = g.id WHERE g.group_key = 'size' AND c.id IN (${categoryIds.map(() => '?').join(',') || 'NULL'})`, categoryIds);
    const isSqlite = db.getMode() === 'sqlite';
    const variantSku = `${sku}-V1`;
    const vRes = await db.query(`
        INSERT INTO product_variants (product_id, sku, size_category_id, price, offer_price, dealer_price, stock, is_default, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'active')
    `, [productId, variantSku, sizeCat[0]?.id || null, price, offer_price || null, dealer_price || null, stock]);
    const variantId = isSqlite ? vRes.insertId : (await db.queryOne(`SELECT id FROM product_variants WHERE sku = ?`, [variantSku])).id;
    await db.query(`INSERT INTO inventory (variant_id, quantity_boxes, reserved_boxes, reorder_level) VALUES (?, ?, 0, 20)`, [variantId, stock]);
}

// POST /api/v1/products - admin create
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const {
            name, sku, brand_id, collection_id, price, offer_price, dealer_price, stock,
            description, is_featured, is_trending, published, seo_title, seo_description,
            category_ids, images, attributes, variants
        } = req.body;

        if (!name || !price || !category_ids || !category_ids.length) {
            return res.status(400).json({ success: false, message: 'name, price and category_ids (main + facet tags) are required' });
        }

        const generatedSku = sku || `MBW-${Math.floor(100000 + Math.random() * 900000)}`;
        const slug = `${slugify(name)}-${generatedSku.toLowerCase()}`;
        const isSqlite = db.getMode() === 'sqlite';

        const resDb = await db.query(`
            INSERT INTO products (name, sku, slug, brand_id, collection_id, price, offer_price, dealer_price, stock, description, is_featured, is_trending, published, seo_title, seo_description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, generatedSku, slug, brand_id || null, collection_id || null,
            parseFloat(price), offer_price ? parseFloat(offer_price) : null, dealer_price ? parseFloat(dealer_price) : null,
            parseInt(stock || 100), description || '', is_featured ? 1 : 0, is_trending ? 1 : 0,
            published === false ? 0 : 1, seo_title || `${name} | Meenakshi Build World`, seo_description || description || ''
        ]);
        const productId = isSqlite ? resDb.insertId : (await db.queryOne(`SELECT id FROM products WHERE slug = ?`, [slug])).id;

        await tagCategories(productId, category_ids);

        if (images && images.length) {
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                await db.query(`INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order) VALUES (?, ?, ?, ?, ?)`, [
                    productId, img.url || img, img.alt || name, (img.is_primary || i === 0) ? 1 : 0, i
                ]);
            }
        } else {
            await db.query(`INSERT INTO product_images (product_id, image_url, alt_text, is_primary) VALUES (?, 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80', ?, 1)`, [productId, name]);
        }

        if (attributes && attributes.length) {
            for (const a of attributes) {
                await db.query(`INSERT INTO product_attributes (product_id, attribute_id, attribute_value_id, custom_value) VALUES (?, ?, ?, ?)`, [
                    productId, a.attribute_id, a.attribute_value_id || null, a.custom_value || null
                ]);
            }
        }

        if (variants && variants.length) {
            for (const v of variants) {
                const variantSku = v.sku || `${generatedSku}-${slugify(v.label || 'V')}`;
                const vRes = await db.query(`
                    INSERT INTO product_variants (product_id, sku, size_category_id, price, offer_price, dealer_price, stock, is_default, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
                `, [productId, variantSku, v.size_category_id || null, v.price || price, v.offer_price || null, v.dealer_price || null, v.stock || stock || 100, v.is_default ? 1 : 0]);
                const variantId = isSqlite ? vRes.insertId : (await db.queryOne(`SELECT id FROM product_variants WHERE sku = ?`, [variantSku])).id;
                await db.query(`INSERT INTO inventory (variant_id, quantity_boxes, reserved_boxes, reorder_level) VALUES (?, ?, 0, 20)`, [variantId, v.stock || stock || 100]);
            }
        } else {
            await createDefaultVariant(productId, generatedSku, parseFloat(price), offer_price, dealer_price, parseInt(stock || 100), category_ids);
        }

        res.json({ success: true, message: `Product '${name}' published. Live at /product/${slug}`, id: productId, slug });
    } catch (err) {
        console.error('Product Create Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/v1/products/:id - admin edit
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const existing = await db.queryOne(`SELECT * FROM products WHERE id = ?`, [req.params.id]);
        if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });

        const {
            name, brand_id, collection_id, price, offer_price, dealer_price, stock,
            description, is_featured, is_trending, published, seo_title, seo_description,
            category_ids, attributes
        } = req.body;

        await db.query(`
            UPDATE products SET
                name = COALESCE(?, name), brand_id = COALESCE(?, brand_id), collection_id = COALESCE(?, collection_id),
                price = COALESCE(?, price), offer_price = ?, dealer_price = COALESCE(?, dealer_price),
                stock = COALESCE(?, stock), description = COALESCE(?, description),
                is_featured = COALESCE(?, is_featured), is_trending = COALESCE(?, is_trending),
                published = COALESCE(?, published), seo_title = COALESCE(?, seo_title), seo_description = COALESCE(?, seo_description),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            name, brand_id, collection_id, price, offer_price !== undefined ? offer_price : existing.offer_price,
            dealer_price, stock, description, is_featured !== undefined ? (is_featured ? 1 : 0) : undefined,
            is_trending !== undefined ? (is_trending ? 1 : 0) : undefined, published !== undefined ? (published ? 1 : 0) : undefined,
            seo_title, seo_description, req.params.id
        ]);

        if (category_ids && category_ids.length) {
            await db.query(`DELETE FROM product_categories WHERE product_id = ?`, [req.params.id]);
            await tagCategories(req.params.id, category_ids);
        }

        if (attributes) {
            await db.query(`DELETE FROM product_attributes WHERE product_id = ?`, [req.params.id]);
            for (const a of attributes) {
                await db.query(`INSERT INTO product_attributes (product_id, attribute_id, attribute_value_id, custom_value) VALUES (?, ?, ?, ?)`, [
                    req.params.id, a.attribute_id, a.attribute_value_id || null, a.custom_value || null
                ]);
            }
        }

        res.json({ success: true, message: 'Product updated' });
    } catch (err) {
        console.error('Product Update Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/v1/products/:id/duplicate - admin
router.post('/:id/duplicate', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const source = await db.queryOne(`SELECT * FROM products WHERE id = ?`, [req.params.id]);
        if (!source) return res.status(404).json({ success: false, message: 'Product not found' });

        const isSqlite = db.getMode() === 'sqlite';
        const newSku = `${source.sku}-COPY${Math.floor(10 + Math.random() * 90)}`;
        const newName = `${source.name} (Copy)`;
        const newSlug = `${slugify(newName)}-${newSku.toLowerCase()}`;

        const resDb = await db.query(`
            INSERT INTO products (name, sku, slug, brand_id, collection_id, price, offer_price, dealer_price, stock, description, seo_title, seo_description, published)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `, [newName, newSku, newSlug, source.brand_id, source.collection_id, source.price, source.offer_price, source.dealer_price, source.stock, source.description, `${newName} | Meenakshi Build World`, source.seo_description]);
        const newId = isSqlite ? resDb.insertId : (await db.queryOne(`SELECT id FROM products WHERE slug = ?`, [newSlug])).id;

        const cats = await db.query(`SELECT category_id FROM product_categories WHERE product_id = ?`, [source.id]);
        await tagCategories(newId, cats.map(c => c.category_id));

        const imgs = await db.query(`SELECT * FROM product_images WHERE product_id = ?`, [source.id]);
        for (const img of imgs) {
            await db.query(`INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order) VALUES (?, ?, ?, ?, ?)`, [newId, img.image_url, img.alt_text, img.is_primary, img.display_order]);
        }

        const attrs = await db.query(`SELECT * FROM product_attributes WHERE product_id = ?`, [source.id]);
        for (const a of attrs) {
            await db.query(`INSERT INTO product_attributes (product_id, attribute_id, attribute_value_id, custom_value) VALUES (?, ?, ?, ?)`, [newId, a.attribute_id, a.attribute_value_id, a.custom_value]);
        }

        await createDefaultVariant(newId, newSku, source.price, source.offer_price, source.dealer_price, source.stock, cats.map(c => c.category_id));

        res.json({ success: true, message: `Duplicated as '${newName}' (unpublished — edit before going live)`, id: newId, slug: newSlug });
    } catch (err) {
        console.error('Product Duplicate Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/v1/products/:id - admin
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        await db.query(`DELETE FROM products WHERE id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
