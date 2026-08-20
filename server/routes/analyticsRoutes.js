const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const PUBLISHED = `(pp.published = 1 OR pp.published = true)`;

// GET /api/v1/admin/analytics - admin-only category analytics. Returns, per
// main category, its live published product count + taxonomy size, plus a
// full breakdown of every facet value (Design/Type/Finish/Color/Size/Area)
// across the catalog. Everything is computed from the categories table at
// request time, so new categories/products show up immediately.
router.get('/analytics', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const mains = await db.query(`
            SELECT c.id, c.name, c.slug, c.parent_main_id,
                   (SELECT COUNT(DISTINCT pc.product_id)
                    FROM product_categories pc JOIN products pp ON pc.product_id = pp.id
                    WHERE pc.category_id = c.id AND ${PUBLISHED}) as product_count,
                   (SELECT COUNT(*) FROM categories ch WHERE ch.parent_id = c.id) as subcategory_count
            FROM categories c
            WHERE c.parent_id IS NULL
            ORDER BY c.display_order ASC, c.name ASC
        `);

        const mainIds = (await db.query(`SELECT id FROM categories WHERE parent_id IS NULL`)).map(r => r.id);
        const placeholders = mainIds.map(() => '?').join(',');
        const rows = await db.query(`
            SELECT g.group_key, g.name as group_name, g.display_order as g_order,
                   c.id as cat_id, c.name as cat_name, c.slug as cat_slug,
                   COUNT(DISTINCT CASE WHEN ${PUBLISHED} THEN pc.product_id END) as count
            FROM category_groups g
            JOIN categories c ON c.group_id = g.id
            LEFT JOIN product_categories pc ON pc.category_id = c.id
            LEFT JOIN products pp ON pc.product_id = pp.id
            WHERE c.parent_id IN (${placeholders}) AND c.status = 'active'
            GROUP BY g.id, c.id
            ORDER BY g.display_order ASC, count DESC, c.name ASC
        `, mainIds);

        const groupsMap = new Map();
        for (const r of rows) {
            if (!groupsMap.has(r.group_key)) groupsMap.set(r.group_key, { group_key: r.group_key, group_name: r.group_name, items: [] });
            groupsMap.get(r.group_key).items.push({ name: r.cat_name, slug: r.cat_slug, count: parseInt(r.count) || 0 });
        }

        res.json({
            success: true,
            mains: mains.map(m => ({ id: m.id, name: m.name, slug: m.slug, parent_main_id: m.parent_main_id, product_count: parseInt(m.product_count) || 0, subcategory_count: parseInt(m.subcategory_count) || 0 })),
            groups: Array.from(groupsMap.values())
        });
    } catch (err) {
        console.error('Analytics Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;