import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Get all images for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM product_images
       WHERE product_id = $1
       ORDER BY is_primary DESC, display_order ASC`,
      [req.params.productId]
    );

    res.json({
      success: true,
      images: result.rows
    });
  } catch (error) {
    console.error('Error fetching product images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product images'
    });
  }
});

// Admin: Add product image
router.post('/', authenticateToken, async (req, res) => {
  const {
    product_id,
    image_url,
    alt_text,
    display_order = 0,
    is_primary = false
  } = req.body;

  if (!product_id || !image_url) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: product_id, image_url'
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // If this is set as primary, unset all other primaries for this product
    if (is_primary) {
      await client.query(
        `UPDATE product_images
         SET is_primary = FALSE
         WHERE product_id = $1`,
        [product_id]
      );
    }

    // Insert new image
    const result = await client.query(
      `INSERT INTO product_images
       (product_id, image_url, alt_text, display_order, is_primary)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [product_id, image_url, alt_text, display_order, is_primary]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Image added successfully',
      image: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding product image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product image'
    });
  } finally {
    client.release();
  }
});

// Admin: Update product image
router.put('/:id', authenticateToken, async (req, res) => {
  const {
    image_url,
    alt_text,
    display_order,
    is_primary
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get product_id for this image
    const imageResult = await client.query(
      `SELECT product_id FROM product_images WHERE id = $1`,
      [req.params.id]
    );

    if (imageResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    const productId = imageResult.rows[0].product_id;

    // If setting as primary, unset all other primaries for this product
    if (is_primary) {
      await client.query(
        `UPDATE product_images
         SET is_primary = FALSE
         WHERE product_id = $1 AND id != $2`,
        [productId, req.params.id]
      );
    }

    // Update image
    const result = await client.query(
      `UPDATE product_images
       SET image_url = COALESCE($1, image_url),
           alt_text = COALESCE($2, alt_text),
           display_order = COALESCE($3, display_order),
           is_primary = COALESCE($4, is_primary)
       WHERE id = $5
       RETURNING *`,
      [image_url, alt_text, display_order, is_primary, req.params.id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Image updated successfully',
      image: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating product image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product image'
    });
  } finally {
    client.release();
  }
});

// Admin: Delete product image
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM product_images
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product image'
    });
  }
});

// Admin: Set primary image
router.patch('/:id/set-primary', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get product_id for this image
    const imageResult = await client.query(
      `SELECT product_id FROM product_images WHERE id = $1`,
      [req.params.id]
    );

    if (imageResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    const productId = imageResult.rows[0].product_id;

    // Unset all primaries for this product
    await client.query(
      `UPDATE product_images
       SET is_primary = FALSE
       WHERE product_id = $1`,
      [productId]
    );

    // Set this image as primary
    const result = await client.query(
      `UPDATE product_images
       SET is_primary = TRUE
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Primary image set successfully',
      image: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting primary image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set primary image'
    });
  } finally {
    client.release();
  }
});

export default router;
