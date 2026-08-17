const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Helper to send email (placeholder, configure with real credentials)
async function sendEmail(to, subject, html) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASS || 'password',
      },
    });
    await transporter.sendMail({ from: process.env.SMTP_FROM || 'no-reply@meenakshibuildworld.com', to, subject, html });
  } catch (err) {
    // Email is best-effort in dev (no real SMTP configured) — never fail the request over it.
    console.warn('[Inquiry] Email notification skipped:', err.message);
  }
}

// GET /api/v1/inquiries - Admin lead list
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const inquiries = await db.query(`SELECT * FROM inquiries ORDER BY id DESC LIMIT 200`);
    res.json({ success: true, inquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/inquiries/whatsapp - request a WhatsApp quote
router.post('/whatsapp', async (req, res) => {
  const { name, phone, productId, message } = req.body;
  if (!name || !phone || !productId) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  try {
    const product = await db.queryOne(`SELECT name FROM products WHERE id = ?`, [productId]);
    await db.query(
      'INSERT INTO inquiries (type, name, phone, product_id, product_name, message) VALUES (?, ?, ?, ?, ?, ?)',
      ['whatsapp', name, phone, productId, product ? product.name : null, message || '']
    );
    const whatsappLink = `https://wa.me/${phone}?text=I%20am%20interested%20in%20product%20${productId}`;
    await sendEmail(
      process.env.SALES_EMAIL || 'sales@meenakshibuildworld.com',
      'New WhatsApp Quote Request',
      `<p><strong>${name}</strong> requested a WhatsApp quote for product ID ${productId}.</p><p>Link: <a href="${whatsappLink}">${whatsappLink}</a></p>`
    );
    res.json({ success: true, message: 'WhatsApp quote request received' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/v1/inquiries/sample - request a sample product
router.post('/sample', async (req, res) => {
  const { userId, productId, address, name, phone } = req.body;
  if (!productId || !address) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  try {
    const product = await db.queryOne(`SELECT name FROM products WHERE id = ?`, [productId]);
    await db.query(
      'INSERT INTO inquiries (type, user_id, name, phone, product_id, product_name, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['sample', userId || null, name || null, phone || null, productId, product ? product.name : null, address]
    );
    await sendEmail(
      process.env.SALES_EMAIL || 'sales@meenakshibuildworld.com',
      'Sample Request Received',
      `<p>Sample requested for product ${productId}.</p><p>Shipping address: ${address}</p>`
    );
    res.json({ success: true, message: 'Sample request submitted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/v1/inquiries/bulk - bulk quote request
router.post('/bulk', authenticateToken, async (req, res) => {
  const { items } = req.body; // Expect array of { productId, quantity }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items provided' });
  }
  try {
    await db.query(
      'INSERT INTO inquiries (type, user_id, data) VALUES (?, ?, ?)',
      ['bulk', req.user.id, JSON.stringify(items)]
    );
    await sendEmail(
      process.env.SALES_EMAIL || 'sales@meenakshibuildworld.com',
      'Bulk Quote Request',
      `<p>User ${req.user.id} submitted a bulk quote request.</p><pre>${JSON.stringify(items, null, 2)}</pre>`
    );
    res.json({ success: true, message: 'Bulk quote request received' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
