const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

function slugify(text) {
    return text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
}

router.get('/', async (req, res) => {
    try {
        const blogs = await db.query(`SELECT * FROM blogs ORDER BY id DESC`);
        res.json({ success: true, blogs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/:slug', async (req, res) => {
    try {
        const blog = await db.queryOne(`SELECT * FROM blogs WHERE slug = ?`, [req.params.slug]);
        if (!blog) return res.status(404).json({ success: false, message: 'Blog post not found' });
        res.json({ success: true, blog });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { title, category, banner_url, excerpt, content, author } = req.body;
        if (!title) return res.status(400).json({ success: false, message: 'Title is required' });
        const slug = slugify(title);
        await db.query(`
            INSERT INTO blogs (title, slug, category, banner_url, excerpt, content, author)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [title, slug, category || 'Design & Trends', banner_url || '', excerpt || '', content || '', author || 'Meenakshi Editorial Desk']);
        res.json({ success: true, message: `Blog published! URL: /blog/${slug}`, slug });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
