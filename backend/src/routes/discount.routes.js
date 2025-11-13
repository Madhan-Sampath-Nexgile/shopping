import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Validate and apply discount code
router.post('/validate', authenticateToken, async (req, res) => {
  const { code, orderTotal } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Discount code is required'
    });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM discount_codes
       WHERE code = $1 AND is_active = TRUE`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid discount code'
      });
    }

    const discount = result.rows[0];

    // Check if code is expired
    if (discount.valid_until && new Date(discount.valid_until) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This discount code has expired'
      });
    }

    // Check if code hasn't started yet
    if (discount.valid_from && new Date(discount.valid_from) > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This discount code is not yet active'
      });
    }

    // Check usage limit
    if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
      return res.status(400).json({
        success: false,
        message: 'This discount code has reached its usage limit'
      });
    }

    // Check minimum order amount
    if (orderTotal && discount.min_order_amount && orderTotal < parseFloat(discount.min_order_amount)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of $${discount.min_order_amount} required for this discount`
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.discount_type === 'percentage') {
      discountAmount = (orderTotal * parseFloat(discount.discount_value)) / 100;
      // Apply max discount cap if exists
      if (discount.max_discount_amount && discountAmount > parseFloat(discount.max_discount_amount)) {
        discountAmount = parseFloat(discount.max_discount_amount);
      }
    } else if (discount.discount_type === 'fixed') {
      discountAmount = parseFloat(discount.discount_value);
    }

    // Ensure discount doesn't exceed order total
    if (orderTotal && discountAmount > orderTotal) {
      discountAmount = orderTotal;
    }

    res.json({
      success: true,
      message: 'Discount code applied successfully',
      discount: {
        code: discount.code,
        description: discount.description,
        type: discount.discount_type,
        value: discount.discount_value,
        discountAmount: discountAmount.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error validating discount code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate discount code'
    });
  }
});

// Admin: Get all discount codes
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM discount_codes
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      discounts: result.rows
    });
  } catch (error) {
    console.error('Error fetching discount codes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discount codes'
    });
  }
});

// Admin: Create discount code
router.post('/admin/create', authenticateToken, async (req, res) => {
  const {
    code,
    description,
    discount_type,
    discount_value,
    min_order_amount = 0,
    max_discount_amount,
    usage_limit,
    valid_from,
    valid_until,
    is_active = true
  } = req.body;

  // Validation
  if (!code || !discount_type || !discount_value) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: code, discount_type, discount_value'
    });
  }

  if (!['percentage', 'fixed'].includes(discount_type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid discount_type. Must be "percentage" or "fixed"'
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO discount_codes
       (code, description, discount_type, discount_value, min_order_amount,
        max_discount_amount, usage_limit, valid_from, valid_until, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [code.toUpperCase(), description, discount_type, discount_value,
       min_order_amount, max_discount_amount, usage_limit,
       valid_from, valid_until, is_active]
    );

    res.status(201).json({
      success: true,
      message: 'Discount code created successfully',
      discount: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        message: 'Discount code already exists'
      });
    }

    console.error('Error creating discount code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create discount code'
    });
  }
});

// Admin: Update discount code
router.put('/admin/:id', authenticateToken, async (req, res) => {
  const {
    description,
    discount_type,
    discount_value,
    min_order_amount,
    max_discount_amount,
    usage_limit,
    valid_from,
    valid_until,
    is_active
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE discount_codes
       SET description = COALESCE($1, description),
           discount_type = COALESCE($2, discount_type),
           discount_value = COALESCE($3, discount_value),
           min_order_amount = COALESCE($4, min_order_amount),
           max_discount_amount = COALESCE($5, max_discount_amount),
           usage_limit = COALESCE($6, usage_limit),
           valid_from = COALESCE($7, valid_from),
           valid_until = COALESCE($8, valid_until),
           is_active = COALESCE($9, is_active)
       WHERE id = $10
       RETURNING *`,
      [description, discount_type, discount_value, min_order_amount,
       max_discount_amount, usage_limit, valid_from, valid_until, is_active,
       req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Discount code not found'
      });
    }

    res.json({
      success: true,
      message: 'Discount code updated successfully',
      discount: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating discount code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update discount code'
    });
  }
});

// Admin: Delete discount code
router.delete('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM discount_codes
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Discount code not found'
      });
    }

    res.json({
      success: true,
      message: 'Discount code deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting discount code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete discount code'
    });
  }
});

// Increment usage count (called internally by order creation)
export async function incrementDiscountUsage(code, client = pool) {
  try {
    await client.query(
      `UPDATE discount_codes
       SET used_count = used_count + 1
       WHERE code = $1`,
      [code]
    );
  } catch (error) {
    console.error('Error incrementing discount usage:', error);
    throw error;
  }
}

export default router;
