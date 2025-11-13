import { Router } from 'express';
import pool from '../config/db.js';
import { auth } from '../middlewares/auth.middleware.js';

const r = Router();

/* -------------------------------------------------------------------------- */
/* Get User's Cart with Product Details */
/* -------------------------------------------------------------------------- */
r.get('/', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const { rows } = await pool.query(
      `SELECT
        c.id AS cart_id,
        c.quantity,
        c.created_at AS added_at,
        p.id AS product_id,
        p.name,
        p.description,
        p.price,
        p.images,
        p.stock,
        p.category
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );

    // Calculate totals
    const subtotal = rows.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = rows.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      items: rows,
      summary: {
        itemCount,
        subtotal,
        shipping: 0, // Free shipping for now
        total: subtotal
      }
    });
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ error: 'Failed to load cart' });
  }
});

/* -------------------------------------------------------------------------- */
/* Add Product to Cart */
/* -------------------------------------------------------------------------- */
r.post('/add', auth, async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'productId is required' });
  }

  if (quantity < 1) {
    return res.status(400).json({ error: 'quantity must be at least 1' });
  }

  try {
    // Check if product exists and has stock
    const productCheck = await pool.query(
      'SELECT id, stock, name FROM products WHERE id = $1',
      [productId]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productCheck.rows[0];

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Add or update cart item
    await pool.query(
      `INSERT INTO cart (user_id, product_id, quantity, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET
         quantity = cart.quantity + EXCLUDED.quantity,
         updated_at = NOW()`,
      [userId, productId, quantity]
    );

    res.status(201).json({ message: `Added ${product.name} to cart` });
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

/* -------------------------------------------------------------------------- */
/* Update Cart Item Quantity */
/* -------------------------------------------------------------------------- */
r.put('/:productId', auth, async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: 'Valid quantity is required' });
  }

  try {
    // Check product stock
    const productCheck = await pool.query(
      'SELECT stock FROM products WHERE id = $1',
      [productId]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (productCheck.rows[0].stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const result = await pool.query(
      `UPDATE cart
       SET quantity = $1, updated_at = NOW()
       WHERE user_id = $2 AND product_id = $3`,
      [quantity, userId, productId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Item not in cart' });
    }

    res.json({ message: 'Cart updated' });
  } catch (err) {
    console.error('Error updating cart:', err);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

/* -------------------------------------------------------------------------- */
/* Remove Product from Cart */
/* -------------------------------------------------------------------------- */
r.delete('/:productId', auth, async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Item not in cart' });
    }

    res.json({ message: 'Removed from cart' });
  } catch (err) {
    console.error('Error removing from cart:', err);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});

/* -------------------------------------------------------------------------- */
/* Clear Entire Cart */
/* -------------------------------------------------------------------------- */
r.delete('/', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    console.error('Error clearing cart:', err);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

/* -------------------------------------------------------------------------- */
/* Save for Later - Get Saved Items */
/* -------------------------------------------------------------------------- */
r.get('/saved', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const { rows } = await pool.query(
      `SELECT
        s.id AS saved_id,
        s.quantity,
        s.created_at AS saved_at,
        p.id AS product_id,
        p.name,
        p.description,
        p.price,
        p.images,
        p.stock,
        p.category
       FROM saved_for_later s
       JOIN products p ON s.product_id = p.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );

    res.json({ items: rows });
  } catch (err) {
    console.error('Error fetching saved items:', err);
    res.status(500).json({ error: 'Failed to load saved items' });
  }
});

/* -------------------------------------------------------------------------- */
/* Move Item from Cart to Saved */
/* -------------------------------------------------------------------------- */
r.post('/save/:productId', auth, async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  try {
    // Get cart item
    const cartItem = await pool.query(
      'SELECT quantity FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    if (cartItem.rows.length === 0) {
      return res.status(404).json({ error: 'Item not in cart' });
    }

    const quantity = cartItem.rows[0].quantity;

    // Begin transaction
    await pool.query('BEGIN');

    // Add to saved_for_later
    await pool.query(
      `INSERT INTO saved_for_later (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = saved_for_later.quantity + EXCLUDED.quantity`,
      [userId, productId, quantity]
    );

    // Remove from cart
    await pool.query(
      'DELETE FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    await pool.query('COMMIT');

    res.json({ message: 'Saved for later' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error saving for later:', err);
    res.status(500).json({ error: 'Failed to save for later' });
  }
});

/* -------------------------------------------------------------------------- */
/* Move Item from Saved to Cart */
/* -------------------------------------------------------------------------- */
r.post('/move-to-cart/:productId', auth, async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  try {
    // Get saved item
    const savedItem = await pool.query(
      'SELECT quantity FROM saved_for_later WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    if (savedItem.rows.length === 0) {
      return res.status(404).json({ error: 'Item not in saved list' });
    }

    const quantity = savedItem.rows[0].quantity;

    // Check product stock
    const productCheck = await pool.query(
      'SELECT stock FROM products WHERE id = $1',
      [productId]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (productCheck.rows[0].stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Begin transaction
    await pool.query('BEGIN');

    // Add to cart
    await pool.query(
      `INSERT INTO cart (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity`,
      [userId, productId, quantity]
    );

    // Remove from saved_for_later
    await pool.query(
      'DELETE FROM saved_for_later WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    await pool.query('COMMIT');

    res.json({ message: 'Moved to cart' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error moving to cart:', err);
    res.status(500).json({ error: 'Failed to move to cart' });
  }
});

/* -------------------------------------------------------------------------- */
/* Remove Item from Saved */
/* -------------------------------------------------------------------------- */
r.delete('/saved/:productId', auth, async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM saved_for_later WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Item not in saved list' });
    }

    res.json({ message: 'Removed from saved list' });
  } catch (err) {
    console.error('Error removing from saved:', err);
    res.status(500).json({ error: 'Failed to remove from saved list' });
  }
});

export default r;
