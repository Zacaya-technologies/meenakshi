const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

function slugify(text) {
    return text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
}

// Filter values can arrive as a single string or (from checkbox groups) an
// array of repeated query params — normalize to an array either way.
function toArray(v) {
    if (v === undefined || v === null || v === '') return [];
    return Array.isArray(v) ? v.filter(Boolean) : [v];
}

function addMultiLike(conditions, params, field, values) {
    const arr = toArray(values);
    if (!arr.length) return;
    conditions.push('(' + arr.map(() => `${field} LIKE ?`).join(' OR ') + ')');
    arr.forEach(v => params.push(`%${v}%`));
}

// GET /api/v1/products - Multi-faceted Search & Filter
router.get('/', async (req, res) => {
    try {
        const {
            q, category, brand, collection, material, finish, color, pattern,
            size, area, min_price, max_price, sort, featured, trending, in_stock, page = 1, limit = 12
        } = req.query;

        let conditions = ["(p.published = 1 OR p.published = true) AND (p.is_archived = 0 OR p.is_archived = false)"];
        let params = [];

        if (q) {
            conditions.push("(p.name LIKE ? OR p.description LIKE ? OR p.material LIKE ? OR p.finish LIKE ? OR p.pattern LIKE ? OR p.color LIKE ? OR p.sku LIKE ?)");
            const searchPattern = `%${q}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        }

        if (category) {
            conditions.push("(c.slug = ? OR p.category_id = ?)");
            params.push(category, isNaN(category) ? -1 : parseInt(category));
        }

        if (brand) {
            const brandArr = toArray(brand);
            const brandClauses = [];
            brandArr.forEach(v => {
                brandClauses.push('(b.slug = ? OR p.brand_id = ?)');
                params.push(v, isNaN(v) ? -1 : parseInt(v));
            });
            if (brandClauses.length) conditions.push('(' + brandClauses.join(' OR ') + ')');
        }

        if (collection) {
            conditions.push("(col.slug = ? OR p.collection_id = ?)");
            params.push(collection, isNaN(collection) ? -1 : parseInt(collection));
        }

        addMultiLike(conditions, params, 'p.material', material);
        addMultiLike(conditions, params, 'p.finish', finish);
        addMultiLike(conditions, params, 'p.color', color);
        addMultiLike(conditions, params, 'p.pattern', pattern);
        addMultiLike(conditions, params, 'p.tile_size', size);
        addMultiLike(conditions, params, 'p.room_application', area);

        if (min_price) {
            conditions.push("p.price >= ?");
            params.push(parseFloat(min_price));
        }

        if (max_price) {
            conditions.push("p.price <= ?");
            params.push(parseFloat(max_price));
        }

        if (featured) conditions.push("p.is_featured = 1");
        if (trending) conditions.push("p.is_trending = 1");
        if (in_stock) conditions.push("p.stock > 0");

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        let orderClause = "ORDER BY p.id DESC";
        if (sort === 'price_asc') orderClause = "ORDER BY COALESCE(p.offer_price, p.price) ASC";
        if (sort === 'price_desc') orderClause = "ORDER BY COALESCE(p.offer_price, p.price) DESC";
        if (sort === 'rating') orderClause = "ORDER BY p.rating_avg DESC";
        if (sort === 'popular') orderClause = "ORDER BY p.views_count DESC";

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const sql = `
            SELECT 
                p.*, 
                c.name as category_name, c.slug as category_slug,
                b.name as brand_name, b.logo_url as brand_logo,
                col.name as collection_name,
                (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1) as primary_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN collections col ON p.collection_id = col.id
            ${whereClause}
            ${orderClause}
            LIMIT ${parseInt(limit)} OFFSET ${offset}
        `;

        const products = await db.query(sql, params);

        const countSql = `
            SELECT COUNT(*) as total 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN collections col ON p.collection_id = col.id
            ${whereClause}
        `;
        const countRes = await db.queryOne(countSql, params);

        res.json({
            success: true,
            products,
            pagination: {
                total: countRes ? parseInt(countRes.total) : 0,
                page: parseInt(page),
                pages: countRes ? Math.ceil(parseInt(countRes.total) / parseInt(limit)) : 1
            }
        });
    } catch (err) {
        console.error('Products API Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/v1/products/facets - Fully dynamic filter sidebar data.
// Computes every filter option (materials, finishes, colors, designs, sizes,
// price range) live from whatever products are actually published, optionally
// scoped to a category. No filter option is ever hand-maintained.
router.get('/facets', async (req, res) => {
    try {
        const { category } = req.query;

        let categoryIds = null;
        if (category) {
            const cat = await db.queryOne(`SELECT id FROM categories WHERE slug = ?`, [category]);
            if (cat) {
                const children = await db.query(`SELECT id FROM categories WHERE parent_id = ?`, [cat.id]);
                categoryIds = [cat.id, ...children.map(c => c.id)];
            }
        }

        const where = ["(published = 1 OR published = true)", "(is_archived = 0 OR is_archived = false)"];
        const params = [];
        if (categoryIds) {
            where.push(`category_id IN (${categoryIds.map(() => '?').join(',')})`);
            params.push(...categoryIds);
        }

        const rows = await db.query(`
            SELECT material, finish, color, pattern, tile_size, price, room_application
            FROM products
            WHERE ${where.join(' AND ')}
        `, params);

        // Tile Size is intentionally NOT scoped to the current category — shoppers
        // expect the same full size range (e.g. "600x600 mm (2x2 ft)") to be offered
        // everywhere, not just on categories that happen to have a matching product yet.
        const [categories, brands, sizeRows] = await Promise.all([
            db.query(`SELECT id, name, slug FROM categories WHERE parent_id IS NULL ORDER BY display_order ASC, name ASC`),
            db.query(`SELECT id, name, slug FROM brands ORDER BY name ASC`),
            db.query(`
                SELECT tile_size FROM products
                WHERE (published = 1 OR published = true) AND (is_archived = 0 OR is_archived = false)
            `)
        ]);

        const materialSet = new Set(), finishSet = new Set(), colorSet = new Set(), patternSet = new Set(), sizeSet = new Set(), appSet = new Set();
        let minPrice = null, maxPrice = null;

        rows.forEach(r => {
            if (r.material) materialSet.add(r.material.trim());
            if (r.finish) finishSet.add(r.finish.trim());
            if (r.color) colorSet.add(r.color.trim());
            if (r.pattern) patternSet.add(r.pattern.trim());
            (r.room_application || '').split(',').map(v => v.trim()).filter(Boolean).forEach(v => appSet.add(v));
            const price = parseFloat(r.price);
            if (!isNaN(price)) {
                minPrice = minPrice === null ? price : Math.min(minPrice, price);
                maxPrice = maxPrice === null ? price : Math.max(maxPrice, price);
            }
        });
        sizeRows.forEach(r => { if (r.tile_size) sizeSet.add(r.tile_size.trim()); });

        const sortAsc = set => Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));

        res.json({
            success: true,
            categories,
            brands,
            materials: sortAsc(materialSet),
            finishes: sortAsc(finishSet),
            colors: sortAsc(colorSet),
            patterns: sortAsc(patternSet),
            sizes: sortAsc(sizeSet),
            applications: sortAsc(appSet),
            availability: ['In Stock'],
            priceRange: { min: minPrice || 0, max: maxPrice || 500 }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/v1/products/suggest - Live Instant Auto Suggestions
router.get('/suggest', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) return res.json({ success: true, suggestions: [] });
        
        const suggestions = await db.query(`
            SELECT p.id, p.name, p.slug, p.price, p.offer_price, p.tile_size,
            (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as image
            FROM products p
            WHERE p.name LIKE ? OR p.material LIKE ? OR p.color LIKE ? OR p.sku LIKE ?
            LIMIT 6
        `, [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]);

        res.json({ success: true, suggestions });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/v1/products/:slug - Single Product Details
router.get('/:slug', async (req, res) => {
    try {
        const product = await db.queryOne(`
            SELECT p.*, 
                   c.name as category_name, c.slug as category_slug,
                   b.name as brand_name, b.logo_url as brand_logo, b.slug as brand_slug,
                   col.name as collection_name, col.slug as collection_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN collections col ON p.collection_id = col.id
            WHERE p.slug = ? OR p.id = ?
        `, [req.params.slug, isNaN(req.params.slug) ? -1 : parseInt(req.params.slug)]);

        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        // Increment views count
        await db.query(`UPDATE products SET views_count = views_count + 1 WHERE id = ?`, [product.id]);

        // Get images gallery
        const images = await db.query(`SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, display_order ASC`, [product.id]);

        // Get reviews
        const reviews = await db.query(`SELECT * FROM reviews WHERE product_id = ? ORDER BY id DESC LIMIT 10`, [product.id]);

        // Get related products
        const related = await db.query(`
            SELECT p.id, p.name, p.slug, p.price, p.offer_price, p.tile_size, p.rating_avg,
            (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as primary_image
            FROM products p
            WHERE p.category_id = ? AND p.id != ?
            LIMIT 4
        `, [product.category_id || 1, product.id]);

        res.json({
            success: true,
            product,
            images,
            reviews,
            related
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/v1/products - Admin Create Product
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const {
            name, sku, category_id, brand_id, collection_id, price, offer_price, dealer_price,
            stock, material, finish, pattern, color, tile_size, thickness_mm, coverage_sqft_per_box,
            pieces_per_box, weight_kg_per_box, room_application, description, image_urls
        } = req.body;

        if (!name || !price || !material || !finish || !tile_size) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        const generatedSku = sku || `LUXE-${Math.floor(100000 + Math.random() * 900000)}`;
        const slug = slugify(name) + '-' + Math.floor(100 + Math.random() * 900);

        const isSqlite = db.getMode() === 'sqlite';
        const resDb = await db.query(`
            INSERT INTO products (name, sku, slug, category_id, brand_id, collection_id, price, offer_price, dealer_price, stock, material, finish, pattern, color, tile_size, thickness_mm, coverage_sqft_per_box, pieces_per_box, weight_kg_per_box, room_application, description, published)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
            name, generatedSku, slug, category_id || 1, brand_id || 1, collection_id || 1,
            parseFloat(price), offer_price ? parseFloat(offer_price) : null, dealer_price ? parseFloat(dealer_price) : null,
            parseInt(stock || 100), material, finish, pattern || 'Marble', color || 'White', tile_size,
            parseFloat(thickness_mm || 9.0), parseFloat(coverage_sqft_per_box || 15.5), parseInt(pieces_per_box || 4),
            parseFloat(weight_kg_per_box || 28.0), room_application || 'Living Room', description || ''
        ]);

        const productId = isSqlite ? resDb.insertId : (await db.queryOne(`SELECT id FROM products WHERE slug = ?`, [slug])).id;

        // Insert Image URLs if provided
        if (image_urls && Array.isArray(image_urls)) {
            for (let i = 0; i < image_urls.length; i++) {
                await db.query(`
                    INSERT INTO product_images (product_id, image_url, is_primary, display_order)
                    VALUES (?, ?, ?, ?)
                `, [productId, image_urls[i], i === 0 ? 1 : 0, i]);
            }
        } else {
            await db.query(`
                INSERT INTO product_images (product_id, image_url, is_primary)
                VALUES (?, 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80', 1)
            `, [productId]);
        }

        res.json({
            success: true,
            message: `Product '${name}' published! Live public route /product/${slug}`,
            slug
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/v1/products/:id - Admin Delete Product
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        await db.query(`DELETE FROM products WHERE id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
