const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/v1/product-variants?product_id=5
router.get('/', async (req, res) => {
    try {
        const { product_id } = req.query;
        if (!product_id) return res.status(400).json({ success: false, message: 'product_id is required' });
        const variants = await db.query(`
            SELECT v.*, c.name as size_name, c.slug as size_slug,
                   i.quantity_boxes, i.reserved_boxes, i.reorder_level, i.warehouse_location
            FROM product_variants v
            LEFT JOIN categories c ON v.size_category_id = c.id
            LEFT JOIN inventory i ON i.variant_id = v.id
            WHERE v.product_id = ?
            ORDER BY v.is_default DESC, v.id ASC
        `, [product_id]);
        res.json({ success: true, variants });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/v1/product-variants - admin: add a size/price variant to a product
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const {
            product_id, sku, size_category_id, price, offer_price, dealer_price, stock,
            thickness_mm, coverage_sqft_per_box, weight_kg_per_box, pieces_per_box, is_default
        } = req.body;
        if (!product_id || !price) return res.status(400).json({ success: false, message: 'product_id and price are required' });

        const isSqlite = db.getMode() === 'sqlite';
        const generatedSku = sku || `VAR-${Date.now()}`;

        if (is_default) {
            await db.query(`UPDATE product_variants SET is_default = 0 WHERE product_id = ?`, [product_id]);
        }

        const resDb = await db.query(`
            INSERT INTO product_variants (product_id, sku, size_category_id, price, offer_price, dealer_price, stock, thickness_mm, coverage_sqft_per_box, weight_kg_per_box, pieces_per_box, is_default, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `, [
            product_id, generatedSku, size_category_id || null, price, offer_price || null, dealer_price || null,
            stock || 100, thickness_mm || 9.0, coverage_sqft_per_box || 15.5, weight_kg_per_box || 28.0,
            pieces_per_box || 4, is_default ? 1 : 0
        ]);
        const variantId = isSqlite ? resDb.insertId : (await db.queryOne(`SELECT id FROM product_variants WHERE sku = ?`, [generatedSku])).id;
        await db.query(`INSERT INTO inventory (variant_id, quantity_boxes, reserved_boxes, reorder_level) VALUES (?, ?, 0, 20)`, [variantId, stock || 100]);

        res.json({ success: true, message: 'Variant added', id: variantId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/v1/product-variants/:id - admin: edit a variant
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { sku, size_category_id, price, offer_price, dealer_price, stock, is_default, status } = req.body;
        const existing = await db.queryOne(`SELECT * FROM product_variants WHERE id = ?`, [req.params.id]);
        if (!existing) return res.status(404).json({ success: false, message: 'Variant not found' });

        if (is_default) {
            await db.query(`UPDATE product_variants SET is_default = 0 WHERE product_id = ?`, [existing.product_id]);
        }

        await db.query(`
            UPDATE product_variants SET
                sku = COALESCE(?, sku), size_category_id = COALESCE(?, size_category_id),
                price = COALESCE(?, price), offer_price = ?, dealer_price = COALESCE(?, dealer_price),
                stock = COALESCE(?, stock), is_default = COALESCE(?, is_default), status = COALESCE(?, status)
            WHERE id = ?
        `, [sku, size_category_id, price, offer_price, dealer_price, stock, is_default !== undefined ? (is_default ? 1 : 0) : undefined, status, req.params.id]);

        res.json({ success: true, message: 'Variant updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/v1/product-variants/:id/inventory - admin: adjust stock/warehouse
router.put('/:id/inventory', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { quantity_boxes, reserved_boxes, reorder_level, warehouse_location } = req.body;
        await db.query(`
            UPDATE inventory SET
                quantity_boxes = COALESCE(?, quantity_boxes),
                reserved_boxes = COALESCE(?, reserved_boxes),
                reorder_level = COALESCE(?, reorder_level),
                warehouse_location = COALESCE(?, warehouse_location),
                last_updated = CURRENT_TIMESTAMP
            WHERE variant_id = ?
        `, [quantity_boxes, reserved_boxes, reorder_level, warehouse_location, req.params.id]);
        res.json({ success: true, message: 'Inventory updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/v1/product-variants/:id - admin
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        await db.query(`DELETE FROM product_variants WHERE id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Variant deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
