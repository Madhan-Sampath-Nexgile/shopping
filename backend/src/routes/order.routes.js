import { Router } from 'express';
import pool from '../config/db.js';
import { auth } from '../middlewares/auth.middleware.js';
import { incrementDiscountUsage } from './discount.routes.js';

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
        o.discount_code,
        o.discount_amount,
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

    // Get order items with product details and variants
    const itemsResult = await pool.query(
      `SELECT
        oi.id,
        oi.quantity,
        oi.price,
        oi.variant_id,
        oi.gift_wrap,
        oi.gift_wrap_fee,
        p.id AS product_id,
        p.name,
        p.images,
        p.category,
        pv.variant_type,
        pv.variant_value
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       LEFT JOIN product_variants pv ON oi.variant_id = pv.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    // Get order tracking timeline
    const trackingResult = await pool.query(
      `SELECT * FROM order_tracking
       WHERE order_id = $1
       ORDER BY created_at ASC`,
      [orderId]
    );

    res.json({
      ...order,
      items: itemsResult.rows,
      tracking: trackingResult.rows
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
  const {
    shippingAddress,
    shippingAddressId,
    paymentMethod = 'COD',
    discountCode
  } = req.body;

  // Either shippingAddress object or shippingAddressId is required
  if (!shippingAddress && !shippingAddressId) {
    return res.status(400).json({ error: 'Shipping address is required' });
  }

  if (shippingAddress && (!shippingAddress.fullName || !shippingAddress.address)) {
    return res.status(400).json({ error: 'Valid shipping address is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get cart items with product details and variants
    const cartResult = await client.query(
      `SELECT
        c.product_id,
        c.quantity,
        c.variant_id,
        p.price,
        p.stock,
        p.name,
        pv.price_adjustment,
        pv.variant_type,
        pv.variant_value,
        pv.stock_quantity AS variant_stock
       FROM cart c
       JOIN products p ON c.product_id = p.id
       LEFT JOIN product_variants pv ON c.variant_id = pv.id
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
      const stockToCheck = item.variant_id ? item.variant_stock : item.stock;
      if (stockToCheck < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Insufficient stock for ${item.name}${item.variant_value ? ` (${item.variant_value})` : ''}. Available: ${stockToCheck}, Requested: ${item.quantity}`
        });
      }
    }

    // Calculate subtotal (including variant price adjustments)
    let subtotal = 0;
    for (const item of cartItems) {
      const itemPrice = parseFloat(item.price) + (item.price_adjustment ? parseFloat(item.price_adjustment) : 0);
      subtotal += itemPrice * item.quantity;
    }

    // Apply discount if provided
    let discountAmount = 0;
    if (discountCode) {
      const discountResult = await client.query(
        `SELECT * FROM discount_codes
         WHERE code = $1 AND is_active = TRUE`,
        [discountCode.toUpperCase()]
      );

      if (discountResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Invalid discount code' });
      }

      const discount = discountResult.rows[0];

      // Validate discount
      if (discount.valid_until && new Date(discount.valid_until) < new Date()) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Discount code has expired' });
      }

      if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Discount code usage limit reached' });
      }

      if (discount.min_order_amount && subtotal < parseFloat(discount.min_order_amount)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Minimum order amount of $${discount.min_order_amount} required`
        });
      }

      // Calculate discount
      if (discount.discount_type === 'percentage') {
        discountAmount = (subtotal * parseFloat(discount.discount_value)) / 100;
        if (discount.max_discount_amount && discountAmount > parseFloat(discount.max_discount_amount)) {
          discountAmount = parseFloat(discount.max_discount_amount);
        }
      } else {
        discountAmount = parseFloat(discount.discount_value);
      }

      if (discountAmount > subtotal) {
        discountAmount = subtotal;
      }

      // Increment usage count
      await incrementDiscountUsage(discountCode.toUpperCase(), client);
    }

    const total = subtotal - discountAmount;

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total, status, shipping_address, shipping_address_id,
                          payment_method, payment_status, discount_code, discount_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, created_at`,
      [
        userId,
        total,
        'PLACED',
        shippingAddress ? JSON.stringify(shippingAddress) : null,
        shippingAddressId || null,
        paymentMethod,
        'PENDING',
        discountCode ? discountCode.toUpperCase() : null,
        discountAmount
      ]
    );

    const orderId = orderResult.rows[0].id;

    // Create initial order tracking entry
    await client.query(
      `INSERT INTO order_tracking (order_id, status, message)
       VALUES ($1, $2, $3)`,
      [orderId, 'ordered', 'Order has been placed successfully']
    );

    // Create order items and update stock
    for (const item of cartItems) {
      const itemPrice = parseFloat(item.price) + (item.price_adjustment ? parseFloat(item.price_adjustment) : 0);

      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, variant_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.product_id, item.quantity, itemPrice, item.variant_id]
      );

      // Update stock (either variant stock or product stock)
      if (item.variant_id) {
        await client.query(
          `UPDATE product_variants SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
          [item.quantity, item.variant_id]
        );
      } else {
        await client.query(
          `UPDATE products SET stock = stock - $1 WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }
    }

    // Clear cart
    await client.query('DELETE FROM cart WHERE user_id = $1', [userId]);

    await client.query('COMMIT');

    res.status(201).json({
      orderId,
      subtotal,
      discountAmount,
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
/* Reorder - Add order items back to cart */
/* -------------------------------------------------------------------------- */
r.post('/:orderId/reorder', auth, async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify order belongs to user
    const orderResult = await client.query(
      `SELECT id FROM orders WHERE id = $1 AND user_id = $2`,
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const itemsResult = await client.query(
      `SELECT oi.product_id, oi.quantity, oi.variant_id, p.stock, pv.stock_quantity AS variant_stock
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       LEFT JOIN product_variants pv ON oi.variant_id = pv.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    if (itemsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No items found in order' });
    }

    let addedCount = 0;
    const unavailable = [];

    // Add items to cart
    for (const item of itemsResult.rows) {
      const stockToCheck = item.variant_id ? item.variant_stock : item.stock;

      // Check stock availability
      if (stockToCheck < item.quantity) {
        unavailable.push({
          product_id: item.product_id,
          available: stockToCheck
        });
        continue;
      }

      // Check if item already in cart
      const existingResult = await client.query(
        `SELECT id, quantity FROM cart
         WHERE user_id = $1 AND product_id = $2 AND (variant_id = $3 OR (variant_id IS NULL AND $3 IS NULL))`,
        [userId, item.product_id, item.variant_id]
      );

      if (existingResult.rows.length > 0) {
        // Update quantity
        await client.query(
          `UPDATE cart SET quantity = quantity + $1 WHERE id = $2`,
          [item.quantity, existingResult.rows[0].id]
        );
      } else {
        // Insert new cart item
        await client.query(
          `INSERT INTO cart (user_id, product_id, quantity, variant_id)
           VALUES ($1, $2, $3, $4)`,
          [userId, item.product_id, item.quantity, item.variant_id]
        );
      }

      addedCount++;
    }

    await client.query('COMMIT');

    res.json({
      message: `${addedCount} item(s) added to cart`,
      addedCount,
      unavailable: unavailable.length > 0 ? unavailable : null
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error reordering:', err);
    res.status(500).json({ error: 'Failed to reorder' });
  } finally {
    client.release();
  }
});

/* -------------------------------------------------------------------------- */
/* Get Order Tracking Timeline */
/* -------------------------------------------------------------------------- */
r.get('/:orderId/tracking', auth, async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;

  try {
    // Verify order belongs to user
    const orderResult = await pool.query(
      `SELECT id FROM orders WHERE id = $1 AND user_id = $2`,
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get tracking timeline
    const trackingResult = await pool.query(
      `SELECT * FROM order_tracking
       WHERE order_id = $1
       ORDER BY created_at ASC`,
      [orderId]
    );

    res.json({
      orderId,
      timeline: trackingResult.rows
    });
  } catch (err) {
    console.error('Error fetching order tracking:', err);
    res.status(500).json({ error: 'Failed to load tracking information' });
  }
});

/* -------------------------------------------------------------------------- */
/* Update Order Status (Admin) */
/* -------------------------------------------------------------------------- */
r.put('/:orderId/status', auth, async (req, res) => {
  const { orderId } = req.params;
  const { status, message, trackingNumber, carrier, location } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update order status
    await client.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, orderId]
    );

    // Add tracking entry
    await client.query(
      `INSERT INTO order_tracking (order_id, status, message, tracking_number, carrier, location)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orderId, status, message, trackingNumber, carrier, location]
    );

    await client.query('COMMIT');

    res.json({ message: 'Order status updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
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
