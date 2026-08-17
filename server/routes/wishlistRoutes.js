const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/v1/wishlist - Get user's wishlist items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM wishlists WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/wishlist - Add product to wishlist
router.post('/', authenticateToken, async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId required' });
  try {
    await db.query(
      'INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, productId]
    );
    res.json({ message: 'Added to wishlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/v1/wishlist/:id - Remove wishlist item
router.delete('/:id', authenticateToken, async (req, res) => {
  const wishlistId = req.params.id;
  try {
    await db.query('DELETE FROM wishlists WHERE id = $1 AND user_id = $2', [wishlistId, req.user.id]);
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
