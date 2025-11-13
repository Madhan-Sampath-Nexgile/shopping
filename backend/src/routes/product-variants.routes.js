import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Get all variants for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM product_variants
       WHERE product_id = $1 AND is_available = TRUE
       ORDER BY variant_type, variant_value`,
      [req.params.productId]
    );

    res.json({
      success: true,
      variants: result.rows
    });
  } catch (error) {
    console.error('Error fetching product variants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product variants'
    });
  }
});

// Get single variant
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM product_variants WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }

    res.json({
      success: true,
      variant: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching variant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch variant'
    });
  }
});

// Admin: Create product variant
router.post('/', authenticateToken, async (req, res) => {
  const {
    product_id,
    variant_type,
    variant_value,
    price_adjustment = 0,
    stock_quantity = 0,
    sku,
    is_available = true
  } = req.body;

  if (!product_id || !variant_type || !variant_value) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: product_id, variant_type, variant_value'
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO product_variants
       (product_id, variant_type, variant_value, price_adjustment,
        stock_quantity, sku, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [product_id, variant_type, variant_value, price_adjustment,
       stock_quantity, sku, is_available]
    );

    res.status(201).json({
      success: true,
      message: 'Variant created successfully',
      variant: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        message: 'SKU already exists'
      });
    }

    console.error('Error creating variant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create variant'
    });
  }
});

// Admin: Update product variant
router.put('/:id', authenticateToken, async (req, res) => {
  const {
    variant_value,
    price_adjustment,
    stock_quantity,
    sku,
    is_available
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE product_variants
       SET variant_value = COALESCE($1, variant_value),
           price_adjustment = COALESCE($2, price_adjustment),
           stock_quantity = COALESCE($3, stock_quantity),
           sku = COALESCE($4, sku),
           is_available = COALESCE($5, is_available)
       WHERE id = $6
       RETURNING *`,
      [variant_value, price_adjustment, stock_quantity, sku, is_available, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }

    res.json({
      success: true,
      message: 'Variant updated successfully',
      variant: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating variant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update variant'
    });
  }
});

// Admin: Delete product variant
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM product_variants
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }

    res.json({
      success: true,
      message: 'Variant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting variant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete variant'
    });
  }
});

export default router;
