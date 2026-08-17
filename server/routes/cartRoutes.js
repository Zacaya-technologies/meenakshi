const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/v1/cart - Retrieve user's cart items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM carts WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/cart - Add item to cart (or update quantity)
router.post('/', authenticateToken, async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity) return res.status(400).json({ error: 'productId and quantity required' });
  try {
    // Upsert cart item
    await db.query(
      `INSERT INTO carts (user_id, product_id, quantity) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
      [req.user.id, productId, quantity]
    );
    res.json({ message: 'Cart updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/v1/cart/:productId - Remove item from cart
router.delete('/:productId', authenticateToken, async (req, res) => {
  const productId = req.params.productId;
  try {
    await db.query('DELETE FROM carts WHERE user_id = $1 AND product_id = $2', [req.user.id, productId]);
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
