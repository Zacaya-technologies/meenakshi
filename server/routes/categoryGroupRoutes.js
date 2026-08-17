const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

function slugify(text) {
    return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

// GET /api/v1/category-groups - the 6 facet dimensions (Area/Size/Design/Type/Finish/Color)
router.get('/', async (req, res) => {
    try {
        const groups = await db.query(`SELECT * FROM category_groups ORDER BY display_order ASC, name ASC`);
        res.json({ success: true, groups });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/v1/category-groups - admin: add a new facet dimension
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { key, name, icon, display_order } = req.body;
        if (!key || !name) return res.status(400).json({ success: false, message: 'key and name are required' });
        const slug = slugify(key);
        await db.query(`INSERT INTO category_groups (group_key, name, slug, icon, display_order) VALUES (?, ?, ?, ?, ?)`, [
            slugify(key), name, slug, icon || 'grid', display_order || 0
        ]);
        res.json({ success: true, message: `Group '${name}' created.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/v1/category-groups/:id - admin: rename / reorder / re-icon a group
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { name, icon, display_order } = req.body;
        await db.query(`
            UPDATE category_groups
            SET name = COALESCE(?, name), icon = COALESCE(?, icon), display_order = COALESCE(?, display_order)
            WHERE id = ?
        `, [name, icon, display_order, req.params.id]);
        res.json({ success: true, message: 'Group updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/v1/category-groups/:id - admin
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        await db.query(`DELETE FROM category_groups WHERE id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Group deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
