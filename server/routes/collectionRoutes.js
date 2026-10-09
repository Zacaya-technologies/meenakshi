const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

function slugify(text) {
    return text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
}

router.get('/', async (req, res) => {
    try {
        const collections = await db.query(`SELECT * FROM collections ORDER BY is_featured DESC, name ASC`);
        res.json({ success: true, collections });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/:slug', async (req, res) => {
    try {
        const collection = await db.queryOne(`SELECT * FROM collections WHERE slug = ?`, [req.params.slug]);
        if (!collection) return res.status(404).json({ success: false, message: 'Collection not found' });
        res.json({ success: true, collection });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { name, tagline, banner_url, description, is_featured } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Collection name required' });
        const slug = slugify(name);
        await db.query(`
            INSERT INTO collections (name, slug, tagline, banner_url, description, is_featured)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [name, slug, tagline || '', banner_url || '', description || '', is_featured ? 1 : 0]);
        // Return the new record (its id is needed to edit/delete it); there is no
        // /collection/<slug> page, so don't advertise one.
        const created = await db.queryOne(`SELECT * FROM collections WHERE slug = ? ORDER BY id DESC`, [slug]);
        res.json({ success: true, message: `Collection '${name}' created.`, collection: created });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const existing = await db.queryOne(`SELECT id FROM collections WHERE id = ?`, [req.params.id]);
        if (!existing) return res.status(404).json({ success: false, message: 'Collection not found' });
        await db.query(`DELETE FROM collections WHERE id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Collection deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
