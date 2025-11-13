import { Router } from 'express';
import pool from '../config/db.js';
import { auth } from '../middlewares/auth.middleware.js';
import { validateUUID, validateProductId } from '../middlewares/validation.middleware.js';

const r = Router();

/* -------------------------------------------------------------------------- */
/* Get User's Wishlist */
/* -------------------------------------------------------------------------- */
r.get('/', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.images, p.stock, p.category,
              COALESCE(AVG(r.rating), 0) AS avg_rating
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       LEFT JOIN reviews r ON p.id = r.product_id
       WHERE w.user_id = $1
       GROUP BY p.id, w.created_at
       ORDER BY w.created_at DESC`,
      [userId]
    );

    res.json({ items: rows });
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ error: 'Failed to load wishlist' });
  }
});

/* -------------------------------------------------------------------------- */
/* Add Product to Wishlist */
/* -------------------------------------------------------------------------- */
r.post('/add', auth, async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'productId is required' });
  }

  try {
    // Check if product exists
    const productCheck = await pool.query(
      'SELECT id FROM products WHERE id = $1',
      [productId]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Add to wishlist (will be ignored if already exists due to UNIQUE constraint)
    await pool.query(
      `INSERT INTO wishlist (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [userId, productId]
    );

    res.status(201).json({ message: 'Added to wishlist' });
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

/* -------------------------------------------------------------------------- */
/* Remove Product from Wishlist */
/* -------------------------------------------------------------------------- */
r.delete('/:productId', auth, validateProductId, async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Item not in wishlist' });
    }

    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error('Error removing from wishlist:', err);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

/* -------------------------------------------------------------------------- */
/* Check if Product is in Wishlist */
/* -------------------------------------------------------------------------- */
r.get('/check/:productId', auth, validateProductId, async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    res.json({ inWishlist: rows.length > 0 });
  } catch (err) {
    console.error('Error checking wishlist:', err);
    res.status(500).json({ error: 'Failed to check wishlist' });
  }
});

export default r;
