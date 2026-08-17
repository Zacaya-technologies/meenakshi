const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

function slugify(text) {
    return text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
}

router.get('/', async (req, res) => {
    try {
        const brands = await db.query(`SELECT * FROM brands ORDER BY is_featured DESC, name ASC`);
        res.json({ success: true, brands });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/:slug', async (req, res) => {
    try {
        const brand = await db.queryOne(`SELECT * FROM brands WHERE slug = ?`, [req.params.slug]);
        if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
        res.json({ success: true, brand });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { name, logo_url, banner_url, description, is_featured } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Brand name required' });
        const slug = slugify(name);
        await db.query(`
            INSERT INTO brands (name, slug, logo_url, banner_url, description, is_featured)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [name, slug, logo_url || '', banner_url || '', description || '', is_featured ? 1 : 0]);
        res.json({ success: true, message: `Brand '${name}' created. URL: /brand/${slug}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        await db.query(`DELETE FROM brands WHERE id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Brand deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
