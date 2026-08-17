const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Helper to send email (placeholder, configure with real credentials)
async function sendEmail(to, subject, html) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'user@example.com',
      pass: process.env.SMTP_PASS || 'password',
    },
  });

  await transporter.sendMail({ from: process.env.SMTP_FROM || 'no-reply@example.com', to, subject, html });
}

// POST /api/v1/inquiry/whatsapp - request a WhatsApp quote
router.post('/whatsapp', async (req, res) => {
  const { name, phone, productId, message } = req.body;
  if (!name || !phone || !productId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // Save inquiry (optional)
    await db.query(
      'INSERT INTO inquiries (type, name, phone, product_id, message) VALUES ($1, $2, $3, $4, $5)',
      ['whatsapp', name, phone, productId, message || '']
    );
    // Send WhatsApp link via email (placeholder)
    const whatsappLink = `https://wa.me/${phone}?text=I%20am%20interested%20in%20product%20${productId}`;
    await sendEmail(
      process.env.SALES_EMAIL || 'sales@meenkashi.com',
      'New WhatsApp Quote Request',
      `<p><strong>${name}</strong> requested a WhatsApp quote for product ID ${productId}.</p><p>Link: <a href="${whatsappLink}">${whatsappLink}</a></p>`
    );
    res.json({ message: 'WhatsApp quote request received' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/inquiry/sample - request a sample product
router.post('/sample', async (req, res) => {
  const { userId, productId, address } = req.body;
  if (!userId || !productId || !address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    await db.query(
      'INSERT INTO inquiries (type, user_id, product_id, address) VALUES ($1, $2, $3, $4)',
      ['sample', userId, productId, address]
    );
    // Notify sales team
    await sendEmail(
      process.env.SALES_EMAIL || 'sales@meenkashi.com',
      'Sample Request Received',
      `<p>User ${userId} requested a sample for product ${productId}.</p><p>Shipping address: ${address}</p>`
    );
    res.json({ message: 'Sample request submitted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/inquiry/bulk - bulk quote request (CSV upload not implemented yet)
router.post('/bulk', authenticateToken, async (req, res) => {
  const { items } = req.body; // Expect array of { productId, quantity }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items provided' });
  }
  try {
    // Store bulk inquiry for later processing
    await db.query(
      'INSERT INTO inquiries (type, user_id, data) VALUES ($1, $2, $3)',
      ['bulk', req.user.id, JSON.stringify(items)]
    );
    await sendEmail(
      process.env.SALES_EMAIL || 'sales@meenkashi.com',
      'Bulk Quote Request',
      `<p>User ${req.user.id} submitted a bulk quote request.</p><pre>${JSON.stringify(items, null, 2)}</pre>`
    );
    res.json({ message: 'Bulk quote request received' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
