const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

function slugify(text) {
    return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

// GET /api/v1/category-attributes?category_id=1 - spec-sheet fields for a main category
router.get('/', async (req, res) => {
    try {
        const { category_id } = req.query;
        const where = category_id ? `WHERE category_id = ?` : '';
        const params = category_id ? [category_id] : [];
        const attributes = await db.query(`SELECT * FROM category_attributes ${where} ORDER BY display_order ASC, name ASC`, params);

        const ids = attributes.map(a => a.id);
        let values = [];
        if (ids.length) {
            values = await db.query(`SELECT * FROM attribute_values WHERE attribute_id IN (${ids.map(() => '?').join(',')}) ORDER BY display_order ASC, value ASC`, ids);
        }
        const attributesWithValues = attributes.map(a => ({
            ...a,
            values: values.filter(v => v.attribute_id === a.id)
        }));

        res.json({ success: true, attributes: attributesWithValues });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/v1/category-attributes - admin: create a spec field for a category
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { category_id, name, input_type, unit, display_order } = req.body;
        if (!category_id || !name) return res.status(400).json({ success: false, message: 'category_id and name are required' });
        const slug = slugify(name);
        const isSqlite = db.getMode() === 'sqlite';
        const resDb = await db.query(`
            INSERT INTO category_attributes (category_id, name, slug, input_type, unit, display_order)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [category_id, name, slug, input_type || 'text', unit || null, display_order || 0]);
        const id = isSqlite ? resDb.insertId : (await db.queryOne(`SELECT id FROM category_attributes WHERE category_id = ? AND slug = ?`, [category_id, slug])).id;
        res.json({ success: true, message: `Attribute '${name}' created`, id });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/v1/category-attributes/:id - admin: edit
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { name, input_type, unit, display_order } = req.body;
        const slug = name ? slugify(name) : undefined;
        await db.query(`
            UPDATE category_attributes
            SET name = COALESCE(?, name), slug = COALESCE(?, slug), input_type = COALESCE(?, input_type),
                unit = COALESCE(?, unit), display_order = COALESCE(?, display_order)
            WHERE id = ?
        `, [name, slug, input_type, unit, display_order, req.params.id]);
        res.json({ success: true, message: 'Attribute updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/v1/category-attributes/:id - admin
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        await db.query(`DELETE FROM category_attributes WHERE id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Attribute deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/v1/category-attributes/:id/values - admin: add a controlled value (e.g. "R11")
router.post('/:id/values', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { value, display_order } = req.body;
        if (!value) return res.status(400).json({ success: false, message: 'value is required' });
        await db.query(`INSERT INTO attribute_values (attribute_id, value, display_order) VALUES (?, ?, ?)`, [req.params.id, value, display_order || 0]);
        res.json({ success: true, message: `Value '${value}' added` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/v1/category-attributes/values/:id - admin: edit a value
router.put('/values/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { value, display_order } = req.body;
        await db.query(`UPDATE attribute_values SET value = COALESCE(?, value), display_order = COALESCE(?, display_order) WHERE id = ?`, [value, display_order, req.params.id]);
        res.json({ success: true, message: 'Value updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/v1/category-attributes/values/:id - admin
router.delete('/values/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        await db.query(`DELETE FROM attribute_values WHERE id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Value deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
