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
        res.json({ success: true, message: `Collection '${name}' created. URL: /collection/${slug}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        await db.query(`DELETE FROM collections WHERE id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Collection deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
