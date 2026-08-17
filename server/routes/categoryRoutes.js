const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Helper to create slug
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

// GET /api/v1/categories - Public list
router.get('/', async (req, res) => {
    try {
        const categories = await db.query(`
            SELECT c.*, p.name as parent_name 
            FROM categories c 
            LEFT JOIN categories p ON c.parent_id = p.id 
            ORDER BY c.display_order ASC, c.name ASC
        `);
        res.json({ success: true, categories });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/v1/categories/:slug - Single category with items count
router.get('/:slug', async (req, res) => {
    try {
        const category = await db.queryOne(`SELECT * FROM categories WHERE slug = ?`, [req.params.slug]);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.json({ success: true, category });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/v1/categories - Admin Add Category (Auto generates /category/slug)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { name, parent_id, description, banner_url, thumbnail_url, icon_url, display_order, is_featured, in_mega_menu, mega_menu_section, seo_title, seo_description } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }

        const slug = slugify(name);
        const resDb = await db.query(`
            INSERT INTO categories (name, slug, parent_id, description, banner_url, thumbnail_url, icon_url, display_order, is_featured, in_mega_menu, mega_menu_section, seo_title, seo_description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, slug, parent_id || null, description || '', banner_url || '', thumbnail_url || '', icon_url || '',
            display_order || 0, is_featured ? 1 : 0, in_mega_menu ? 1 : 0, mega_menu_section || 'category',
            seo_title || name, seo_description || description || ''
        ]);

        res.json({
            success: true,
            message: `Category '${name}' created successfully. Public route /category/${slug} live!`,
            slug
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/v1/categories/:id - Admin Edit Category
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { name, description, banner_url, is_featured, in_mega_menu, display_order } = req.body;
        const slug = name ? slugify(name) : undefined;

        await db.query(`
            UPDATE categories 
            SET name = COALESCE(?, name),
                slug = COALESCE(?, slug),
                description = COALESCE(?, description),
                banner_url = COALESCE(?, banner_url),
                is_featured = COALESCE(?, is_featured),
                in_mega_menu = COALESCE(?, in_mega_menu),
                display_order = COALESCE(?, display_order)
            WHERE id = ?
        `, [name, slug, description, banner_url, is_featured ? 1 : 0, in_mega_menu ? 1 : 0, display_order, req.params.id]);

        res.json({ success: true, message: 'Category updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/v1/categories/:id - Admin Delete Category
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        await db.query(`DELETE FROM categories WHERE id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
