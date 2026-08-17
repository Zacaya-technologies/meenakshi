const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// POST /api/v1/orders/checkout - Process Checkout & Create Order
router.post('/checkout', async (req, res) => {
    try {
        const {
            customer_name, customer_email, customer_phone, shipping_address,
            city, state, pincode, gstin, payment_method = 'UPI', items = [], user_id = null
        } = req.body;

        if (!customer_name || !customer_email || !customer_phone || !shipping_address || !items.length) {
            return res.status(400).json({ success: false, message: 'Customer details and order items are required.' });
        }

        let totalSubtotal = 0;
        const processedItems = [];

        for (let item of items) {
            const product = await db.queryOne(`SELECT * FROM products WHERE id = ?`, [item.product_id]);
            if (!product) continue;

            const unitPrice = parseFloat(product.offer_price || product.price);
            const boxes = parseInt(item.quantity_boxes || 1);
            const sqft = boxes * parseFloat(product.coverage_sqft_per_box || 15.5);
            const subtotal = unitPrice * sqft;

            totalSubtotal += subtotal;
            processedItems.push({
                product_id: product.id,
                product_name: product.name,
                sku: product.sku,
                price_per_box: unitPrice * parseFloat(product.coverage_sqft_per_box || 15.5),
                quantity_boxes: boxes,
                total_sqft: sqft,
                subtotal: subtotal
            });
        }

        const gstAmount = totalSubtotal * 0.18; // 18% GST standard on Vitrified & Ceramic tiles
        const netPayable = totalSubtotal + gstAmount;
        const orderNumber = 'ORD-' + Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);
        const trackingNumber = 'TRK-LUXE-' + Math.floor(100000 + Math.random() * 900000);

        const isSqlite = db.getMode() === 'sqlite';
        const resDb = await db.query(`
            INSERT INTO orders (order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, city, state, pincode, gstin, total_amount, gst_amount, net_payable, payment_status, payment_method, order_status, tracking_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, 'Processing', ?)
        `, [
            orderNumber, user_id || null, customer_name, customer_email, customer_phone,
            shipping_address, city || '', state || '', pincode || '', gstin || '',
            totalSubtotal, gstAmount, netPayable, payment_method, trackingNumber
        ]);

        const orderId = isSqlite ? resDb.insertId : (await db.queryOne(`SELECT id FROM orders WHERE order_number = ?`, [orderNumber])).id;

        for (let item of processedItems) {
            await db.query(`
                INSERT INTO order_items (order_id, product_id, product_name, sku, price_per_box, quantity_boxes, total_sqft, subtotal)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [orderId, item.product_id, item.product_name, item.sku, item.price_per_box, item.quantity_boxes, item.total_sqft, item.subtotal]);

            // Deduct inventory
            await db.query(`UPDATE products SET stock = stock - ? WHERE id = ?`, [item.quantity_boxes, item.product_id]);
        }

        res.json({
            success: true,
            message: 'Order placed successfully!',
            order: {
                order_number: orderNumber,
                tracking_number: trackingNumber,
                total_amount: totalSubtotal,
                gst_amount: gstAmount,
                net_payable: netPayable,
                payment_method,
                status: 'Processing'
            }
        });
    } catch (err) {
        console.error('Checkout Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/v1/orders - Admin/User List Orders
router.get('/', authenticateToken, async (req, res) => {
    try {
        let orders = [];
        if (req.user.role === 'admin') {
            orders = await db.query(`SELECT * FROM orders ORDER BY id DESC`);
        } else {
            orders = await db.query(`SELECT * FROM orders WHERE user_id = ? OR customer_email = ? ORDER BY id DESC`, [req.user.id, req.user.email]);
        }
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/v1/orders/:id/status - Admin Status Update
router.put('/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { order_status } = req.body;
        await db.query(`UPDATE orders SET order_status = ? WHERE id = ?`, [order_status, req.params.id]);
        res.json({ success: true, message: `Order status updated to ${order_status}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
