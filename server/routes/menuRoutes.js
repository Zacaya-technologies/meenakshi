const express = require('express');
const router = express.Router();
const db = require('../db');

const ALL_PRODUCTS_SLUG = 'all-products';
const MENU_ITEM_LIMIT = 14; // per-column cap in the mega menu dropdown; full lists live on the category page

function formatPrice(p) {
    return {
        ...p,
        display_price: p.offer_price || p.price,
        original_price: p.offer_price ? p.price : null,
        discount_pct: p.offer_price ? Math.round((1 - p.offer_price / Math.max(p.price, 0.01)) * 100) : 0
    };
}

// GET /api/v1/menu - top nav, 100% table-driven from `categories`.
router.get('/', async (req, res) => {
    try {
        const categories = await db.query(`
            SELECT id, name, slug, image, icon, description
            FROM categories
            WHERE parent_id IS NULL AND status = 'active'
            ORDER BY display_order ASC, name ASC
        `);

        const topNav = categories.map(c => ({ name: c.name, slug: c.slug, url: `/tiles/${c.slug}`, icon: c.icon || 'grid', image: c.image, hasMegaMenu: true }));

        res.json({ success: true, topNav, categories });
    } catch (err) {
        console.error('Menu Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/v1/menu/:categorySlug - the dynamic mega menu for one nav trigger.
// Every column (By Area / Size / Design / Type / Finish / Color) is read
// directly from the categories table (always complete, even for facet values
// with zero products yet) — nothing here is hardcoded on the frontend.
router.get('/:categorySlug', async (req, res) => {
    try {
        const slug = req.params.categorySlug;
        const groups = await db.query(`SELECT * FROM category_groups ORDER BY display_order ASC`);

        let category, mainIds;
        if (slug === ALL_PRODUCTS_SLUG) {
            category = { id: 0, name: 'All Products', slug: ALL_PRODUCTS_SLUG };
            mainIds = (await db.query(`SELECT id FROM categories WHERE parent_id IS NULL`)).map(r => r.id);
        } else {
            category = await db.queryOne(`SELECT * FROM categories WHERE parent_id IS NULL AND slug = ?`, [slug]);
            if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
            mainIds = [category.id];
        }

        const children = await db.query(`
            SELECT c.*,
                   (SELECT COUNT(*) FROM product_categories pc WHERE pc.category_id = c.id) as product_count
            FROM categories c
            WHERE c.parent_id IN (${mainIds.map(() => '?').join(',')}) AND c.status = 'active'
            ORDER BY c.display_order ASC, product_count DESC, c.name ASC
        `, mainIds);

        // Room mains (Bedroom / Hallway / Pooja / Drawing / Dining) are separate
        // top-level categories linked to this main via `parent_main_id` — they
        // surface in the "By Area" column and deep-link to /<room-slug>.
        let linkedMains = [];
        if (slug !== ALL_PRODUCTS_SLUG) {
            linkedMains = await db.query(`
                SELECT c.*,
                       (SELECT COUNT(*) FROM product_categories pc WHERE pc.category_id = c.id) as product_count
                FROM categories c
                WHERE c.parent_id IS NULL AND c.parent_main_id = ? AND c.status = 'active'
                ORDER BY c.display_order ASC, c.name ASC
            `, [category.id]);
        }

        // Only groups the main category actually has children in are shown —
        // Kitchen/Bathroom use "Application" instead of "Area", for example,
        // so an empty "By Area" column never renders for them.
        const columns = groups
            .filter(g => children.some(c => c.group_id === g.id))
            .map(g => {
                const items = children.filter(c => c.group_id === g.id).slice(0, MENU_ITEM_LIMIT).map(c => ({
                    id: c.id, name: c.name, slug: c.slug, image: c.image,
                    url: slug === ALL_PRODUCTS_SLUG
                        ? `/shop?${g.group_key}=${c.slug}`
                        : `/tiles/${slug}/${c.slug}`
                }));
                // Append linked room mains to the "area" column (deep-link to
                // their own top-level pages so the room taxonomy stays whole).
                if (g.group_key === 'area' && linkedMains.length) {
                    linkedMains.forEach(c => items.push({
                        id: c.id, name: c.name, slug: c.slug, image: c.image,
                        url: `/tiles/${c.slug}`
                    }));
                }
                return { key: g.group_key, label: g.name, icon: g.icon, param: g.group_key, items };
            });

        const published = `(published = 1 OR published = true) AND (is_archived = 0 OR is_archived = false)`;
        const scopeExists = `EXISTS (SELECT 1 FROM product_categories pc WHERE pc.product_id = p.id AND pc.category_id IN (${mainIds.map(() => '?').join(',')}))`;
        const scopeParams = mainIds;

        const [latest, recommended] = await Promise.all([
            db.query(`
                SELECT p.id, p.name, p.slug, p.sku, p.price, p.offer_price,
                       (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1) as image_url
                FROM products p
                WHERE ${published} AND ${slug === ALL_PRODUCTS_SLUG ? '1=1' : scopeExists}
                ORDER BY p.created_at DESC LIMIT 5
            `, slug === ALL_PRODUCTS_SLUG ? [] : scopeParams),
            db.query(`
                SELECT p.id, p.name, p.slug, p.sku, p.price, p.offer_price,
                       (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1) as image_url
                FROM products p
                WHERE ${published} AND ((p.is_featured = 1 OR p.is_featured = true) OR (p.is_trending = 1 OR p.is_trending = true))
                      AND ${slug === ALL_PRODUCTS_SLUG ? '1=1' : scopeExists}
                ORDER BY p.rating_avg DESC LIMIT 5
            `, slug === ALL_PRODUCTS_SLUG ? [] : scopeParams)
        ]);

        res.json({
            success: true,
            category: { id: category.id, name: category.name, slug: category.slug },
            columns,
            latestProducts: (latest || []).map(formatPrice),
            recommendedProducts: (recommended.length ? recommended : latest).map(formatPrice)
        });
    } catch (err) {
        console.error('Category Menu Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
