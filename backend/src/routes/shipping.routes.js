import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Get all shipping addresses for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM shipping_addresses
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [req.user.userId]
    );

    res.json({
      success: true,
      addresses: result.rows
    });
  } catch (error) {
    console.error('Error fetching shipping addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping addresses'
    });
  }
});

// Get single shipping address
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM shipping_addresses
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.json({
      success: true,
      address: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching shipping address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping address'
    });
  }
});

// Create new shipping address
router.post('/', authenticateToken, async (req, res) => {
  const {
    label,
    full_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country = 'USA',
    is_default = false
  } = req.body;

  // Validation
  if (!label || !full_name || !phone || !address_line1 || !city || !state || !postal_code) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // If this is set as default, unset all other defaults
    if (is_default) {
      await client.query(
        `UPDATE shipping_addresses
         SET is_default = FALSE
         WHERE user_id = $1`,
        [req.user.userId]
      );
    }

    // Insert new address
    const result = await client.query(
      `INSERT INTO shipping_addresses
       (user_id, label, full_name, phone, address_line1, address_line2,
        city, state, postal_code, country, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [req.user.userId, label, full_name, phone, address_line1, address_line2,
       city, state, postal_code, country, is_default]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      address: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating shipping address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create shipping address'
    });
  } finally {
    client.release();
  }
});

// Update shipping address
router.put('/:id', authenticateToken, async (req, res) => {
  const {
    label,
    full_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country,
    is_default
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if address belongs to user
    const checkResult = await client.query(
      `SELECT id FROM shipping_addresses
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.userId]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // If setting as default, unset all other defaults
    if (is_default) {
      await client.query(
        `UPDATE shipping_addresses
         SET is_default = FALSE
         WHERE user_id = $1 AND id != $2`,
        [req.user.userId, req.params.id]
      );
    }

    // Update address
    const result = await client.query(
      `UPDATE shipping_addresses
       SET label = COALESCE($1, label),
           full_name = COALESCE($2, full_name),
           phone = COALESCE($3, phone),
           address_line1 = COALESCE($4, address_line1),
           address_line2 = COALESCE($5, address_line2),
           city = COALESCE($6, city),
           state = COALESCE($7, state),
           postal_code = COALESCE($8, postal_code),
           country = COALESCE($9, country),
           is_default = COALESCE($10, is_default),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 AND user_id = $12
       RETURNING *`,
      [label, full_name, phone, address_line1, address_line2,
       city, state, postal_code, country, is_default,
       req.params.id, req.user.userId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Address updated successfully',
      address: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating shipping address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shipping address'
    });
  } finally {
    client.release();
  }
});

// Delete shipping address
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM shipping_addresses
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting shipping address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete shipping address'
    });
  }
});

// Set default shipping address
router.patch('/:id/set-default', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if address belongs to user
    const checkResult = await client.query(
      `SELECT id FROM shipping_addresses
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.userId]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Unset all defaults for this user
    await client.query(
      `UPDATE shipping_addresses
       SET is_default = FALSE
       WHERE user_id = $1`,
      [req.user.userId]
    );

    // Set this address as default
    const result = await client.query(
      `UPDATE shipping_addresses
       SET is_default = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.userId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Default address set successfully',
      address: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting default address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default address'
    });
  } finally {
    client.release();
  }
});

export default router;
