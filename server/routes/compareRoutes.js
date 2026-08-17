const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/v1/compare - Get user's comparison list
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM comparisons WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/compare - Add product to compare list (max 4 items)
router.post('/', authenticateToken, async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId required' });
  try {
    const countResult = await db.query('SELECT COUNT(*) FROM comparisons WHERE user_id = $1', [req.user.id]);
    if (parseInt(countResult.rows[0].count) >= 4) {
      return res.status(400).json({ error: 'Maximum 4 items can be compared' });
    }
    await db.query(
      'INSERT INTO comparisons (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, productId]
    );
    res.json({ message: 'Product added to comparison list' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/v1/compare/:id - Remove from comparison list
router.delete('/:id', authenticateToken, async (req, res) => {
  const compareId = req.params.id;
  try {
    await db.query('DELETE FROM comparisons WHERE id = $1 AND user_id = $2', [compareId, req.user.id]);
    res.json({ message: 'Removed from comparison list' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
