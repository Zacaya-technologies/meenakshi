const express = require('express');
const router = express.Router();
const db = require('../db');

// Product attributes like room_application can hold multiple comma-separated
// values ("Living Room, Bedroom, Hotel Lobby") — split them into individual tags.
function splitMulti(value) {
    if (!value) return [];
    return value.split(',').map(v => v.trim()).filter(Boolean);
}

function uniqueSorted(set, limit) {
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b)).slice(0, limit);
}

// All Products is a virtual catalog root: facets + latest are aggregated across
// every published product rather than a single category tree.
const ALL_PRODUCTS_SLUG = 'all-products';

// GET /api/v1/menu - Second navigation row, built entirely from the categories table.
// The first item is always "All Products" (a mega-menu trigger) followed by every
// top-level category. Each entry is a mega-menu trigger with identical behavior.
router.get('/', async (req, res) => {
    try {
        const categories = await db.query(`
            SELECT id, name, slug, banner_url, thumbnail_url, icon_url, description
            FROM categories
            WHERE parent_id IS NULL AND (in_mega_menu = 1 OR in_mega_menu = true) AND status = 'active'
            ORDER BY display_order ASC, name ASC
        `);

        const topNav = [
            { name: 'All Products', slug: ALL_PRODUCTS_SLUG, url: '/shop', hasMegaMenu: true },
            ...categories.map(c => ({
                name: c.name,
                slug: c.slug,
                url: `/category/${c.slug}`,
                hasMegaMenu: true
            }))
        ];

        res.json({ success: true, topNav, categories });
    } catch (err) {
        console.error('Menu Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/v1/menu/:categorySlug - The dynamic mega menu for one nav trigger.
// Every column (Space / Size / Design / Type / Finish / Color) is computed live
// from the DISTINCT attribute values of published products inside that category
// tree (or across all products for the "All Products" trigger). Nothing is hardcoded.
router.get('/:categorySlug', async (req, res) => {
    try {
        const slug = req.params.categorySlug;
        let category = null;
        let categoryIds = null;

        if (slug === ALL_PRODUCTS_SLUG) {
            category = { id: 0, name: 'All Products', slug: ALL_PRODUCTS_SLUG };
        } else {
            category = await db.queryOne(`SELECT * FROM categories WHERE slug = ?`, [slug]);
            if (!category) {
                return res.status(404).json({ success: false, message: 'Category not found' });
            }
            const children = await db.query(`SELECT id FROM categories WHERE parent_id = ?`, [category.id]);
            categoryIds = [category.id, ...children.map(c => c.id)];
        }

        const published = `(published = 1 OR published = true) AND (is_archived = 0 OR is_archived = false)`;
        const scopeWhere = categoryIds
            ? `category_id IN (${categoryIds.map(() => '?').join(',')}) AND ${published}`
            : published;
        const scopeParams = categoryIds || [];

        const rows = await db.query(`
            SELECT room_application, tile_size, pattern, material, finish, color
            FROM products
            WHERE ${scopeWhere}
        `, scopeParams);

        // Tile Size is intentionally NOT scoped to the current category — every
        // "By Size" mega-menu column (Floor Tiles, Wall Tiles, ...) shows the same
        // full size range that "All Products" does, not just sizes that category's
        // own products happen to use yet.
        const sizeRows = await db.query(`SELECT tile_size FROM products WHERE ${published}`);

        const areaSet = new Set(), sizeSet = new Set(), designSet = new Set(),
              typeSet = new Set(), finishSet = new Set(), colorSet = new Set();

        rows.forEach(r => {
            splitMulti(r.room_application).forEach(v => areaSet.add(v));
            if (r.pattern) designSet.add(r.pattern.trim());
            if (r.material) typeSet.add(r.material.trim());
            if (r.finish) finishSet.add(r.finish.trim());
            if (r.color) colorSet.add(r.color.trim());
        });
        sizeRows.forEach(r => { if (r.tile_size) sizeSet.add(r.tile_size.trim()); });

        const [latest, recommended] = await Promise.all([
            db.query(`
                SELECT p.id, p.name, p.slug, p.sku, p.price, p.offer_price, p.tile_size,
                       pi.image_url
                FROM products p
                LEFT JOIN product_images pi ON pi.product_id = p.id AND (pi.is_primary = 1 OR pi.is_primary = true)
                WHERE ${scopeWhere}
                ORDER BY p.created_at DESC LIMIT 5
            `, scopeParams),
            db.query(`
                SELECT p.id, p.name, p.slug, p.sku, p.price, p.offer_price, p.tile_size,
                       pi.image_url
                FROM products p
                LEFT JOIN product_images pi ON pi.product_id = p.id AND (pi.is_primary = 1 OR pi.is_primary = true)
                WHERE ${scopeWhere} AND ((p.is_featured = 1 OR p.is_featured = true) OR (p.is_trending = 1 OR p.is_trending = true))
                ORDER BY p.rating_avg DESC LIMIT 5
            `, scopeParams)
        ]);

        // Decorate every product card with a ready-to-render price + discount.
        const formatPrice = p => ({
            ...p,
            display_price: p.offer_price || p.price,
            original_price: p.offer_price ? p.price : null,
            discount_pct: p.offer_price ? Math.round((1 - p.offer_price / Math.max(p.price, 0.01)) * 100) : 0
        });

        res.json({
            success: true,
            category: { id: category.id, name: category.name, slug: category.slug },
            columns: {
                bySpace: uniqueSorted(areaSet, 14),
                bySize: uniqueSorted(sizeSet, 14),
                byDesign: uniqueSorted(designSet, 14),
                byType: uniqueSorted(typeSet, 14),
                byFinish: uniqueSorted(finishSet, 14),
                byColor: uniqueSorted(colorSet, 14)
            },
            latestProducts: (latest || []).map(formatPrice),
            recommendedProducts: (recommended.length ? recommended : latest).map(formatPrice)
        });
    } catch (err) {
        console.error('Category Menu Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;