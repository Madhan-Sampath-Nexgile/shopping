import { Router } from 'express'
import pool from '../config/db.js'
import { auth } from '../middlewares/auth.middleware.js'

const r = Router()

r.get('/health', (req,res)=> res.json({ ok:true }))

/* -------------------------------------------------------------------------- */
/*  Product Management (Simple CRUD) */
/* -------------------------------------------------------------------------- */

// Create Product
r.post('/products', auth, async (req, res) => {
  const {
    name,
    description,
    category,
    price,
    stock,
    specifications = {},
    images = [],
    accessories = []
  } = req.body

  if (!name || !price || price < 0) {
    return res.status(400).json({ error: 'Name and valid price required' })
  }

  try {
    const query = `
      INSERT INTO products (name, description, category, price, stock, specifications, images, accessories)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `
    const { rows } = await pool.query(query, [
      name,
      description || '',
      category || 'General',
      price,
      stock || 0,
      specifications,
      images,
      accessories
    ])

    return res.status(201).json(rows[0])
  } catch (err) {
    console.error('Create product error:', err)
    return res.status(500).json({ error: 'Failed to create product' })
  }
})

// Update Product
r.put('/products/:id', auth, async (req, res) => {
  const { id } = req.params
  const {
    name,
    description,
    category,
    price,
    stock,
    specifications,
    images,
    accessories
  } = req.body

  try {
    const updates = []
    const values = []
    let paramCount = 1

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`)
      values.push(name)
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`)
      values.push(description)
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`)
      values.push(category)
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount++}`)
      values.push(price)
    }
    if (stock !== undefined) {
      updates.push(`stock = $${paramCount++}`)
      values.push(stock)
    }
    if (specifications !== undefined) {
      updates.push(`specifications = $${paramCount++}`)
      values.push(specifications)
    }
    if (images !== undefined) {
      updates.push(`images = $${paramCount++}`)
      values.push(images)
    }
    if (accessories !== undefined) {
      updates.push(`accessories = $${paramCount++}`)
      values.push(accessories)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    values.push(id)
    const query = `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`

    const { rows } = await pool.query(query, values)

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    return res.json(rows[0])
  } catch (err) {
    console.error('Update product error:', err)
    return res.status(500).json({ error: 'Failed to update product' })
  }
})

// Delete Product
r.delete('/products/:id', auth, async (req, res) => {
  const { id } = req.params

  try {
    const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [id])

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    return res.json({ success: true, message: 'Product deleted successfully' })
  } catch (err) {
    console.error('Delete product error:', err)
    return res.status(500).json({ error: 'Failed to delete product' })
  }
})

// Update Order Status
r.put('/orders/:id/status', auth, async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  const validStatuses = ['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  try {
    const { rows } = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' })
    }

    return res.json(rows[0])
  } catch (err) {
    console.error('Update order status error:', err)
    return res.status(500).json({ error: 'Failed to update order status' })
  }
})

export default r
