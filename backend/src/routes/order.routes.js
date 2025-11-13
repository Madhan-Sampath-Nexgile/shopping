import { Router } from 'express';
import pool from '../config/db.js';
import { auth } from '../middlewares/auth.middleware.js';

const r = Router();

/* -------------------------------------------------------------------------- */
/* Get User's Orders */
/* -------------------------------------------------------------------------- */
r.get('/', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const { rows } = await pool.query(
      `SELECT
        o.id,
        o.total,
        o.status,
        o.payment_method,
        o.payment_status,
        o.shipping_address,
        o.created_at,
        o.updated_at,
        COUNT(oi.id) AS item_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json({ orders: rows });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

/* -------------------------------------------------------------------------- */
/* Get Single Order Details */
/* -------------------------------------------------------------------------- */
r.get('/:orderId', auth, async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;

  try {
    // Get order details
    const orderResult = await pool.query(
      `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Get order items with product details
    const itemsResult = await pool.query(
      `SELECT
        oi.id,
        oi.quantity,
        oi.price,
        p.id AS product_id,
        p.name,
        p.images,
        p.category
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    res.json({
      ...order,
      items: itemsResult.rows
    });
  } catch (err) {
    console.error('Error fetching order details:', err);
    res.status(500).json({ error: 'Failed to load order details' });
  }
});

/* -------------------------------------------------------------------------- */
/* Create Order (Checkout) */
/* -------------------------------------------------------------------------- */
r.post('/checkout', auth, async (req, res) => {
  const userId = req.user.id;
  const { shippingAddress, paymentMethod = 'COD' } = req.body;

  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address) {
    return res.status(400).json({ error: 'Valid shipping address is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get cart items with product details
    const cartResult = await client.query(
      `SELECT
        c.product_id,
        c.quantity,
        p.price,
        p.stock,
        p.name
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const cartItems = cartResult.rows;

    // Verify stock availability
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Insufficient stock for ${item.name}. Available: ${item.stock}, Requested: ${item.quantity}`
        });
      }
    }

    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total, status, shipping_address, payment_method, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [userId, total, 'PLACED', JSON.stringify(shippingAddress), paymentMethod, 'PENDING']
    );

    const orderId = orderResult.rows[0].id;

    // Create order items and update stock
    for (const item of cartItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.price]
      );

      await client.query(
        `UPDATE products SET stock = stock - $1 WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // Clear cart
    await client.query('DELETE FROM cart WHERE user_id = $1', [userId]);

    await client.query('COMMIT');

    res.status(201).json({
      orderId,
      total,
      message: 'Order placed successfully',
      created_at: orderResult.rows[0].created_at
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

/* -------------------------------------------------------------------------- */
/* Cancel Order */
/* -------------------------------------------------------------------------- */
r.put('/:orderId/cancel', auth, async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get order
    const orderResult = await client.query(
      `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Only allow cancellation of PLACED orders
    if (order.status !== 'PLACED') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Cannot cancel order with status: ${order.status}` });
    }

    // Restore stock
    const itemsResult = await client.query(
      `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
      [orderId]
    );

    for (const item of itemsResult.rows) {
      await client.query(
        `UPDATE products SET stock = stock + $1 WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // Update order status
    await client.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
      ['CANCELLED', orderId]
    );

    await client.query('COMMIT');

    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error cancelling order:', err);
    res.status(500).json({ error: 'Failed to cancel order' });
  } finally {
    client.release();
  }
});

/* -------------------------------------------------------------------------- */
/* Get All Orders (Admin) */
/* -------------------------------------------------------------------------- */
r.get('/all', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        o.id,
        o.total,
        o.status,
        o.payment_method,
        o.payment_status,
        o.shipping_address,
        o.created_at,
        o.updated_at,
        u.email AS user_email,
        COUNT(oi.id) AS item_count
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id, u.email
       ORDER BY o.created_at DESC`
    );

    res.json({ orders: rows });
  } catch (err) {
    console.error('Error fetching all orders:', err);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

export default r;
