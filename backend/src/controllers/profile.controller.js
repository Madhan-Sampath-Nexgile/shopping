import pool from '../config/db.js'

// GET /api/profile
export const getProfile = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, name, preferences, price_range, shopping_frequency, variant, created_at, updated_at 
       FROM users WHERE id=$1`,
      [req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
}

// PUT /api/profile
export const updateProfile = async (req, res) => {
  const { name, preferences, price_range, shopping_frequency } = req.body || {}
  try {
    const { rows } = await pool.query(
      `UPDATE users 
       SET name=$1, preferences=$2, price_range=$3, shopping_frequency=$4, updated_at=NOW()
       WHERE id=$5 
       RETURNING id, email, name, preferences, price_range, shopping_frequency, variant, updated_at`,
      [name, preferences, price_range, shopping_frequency, req.user.id]
    )

    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}


export const getPurchaseHistory = async (req, res) => {
  try {
    const q = `
      SELECT o.id as order_id, o.total, o.status, o.created_at,
             json_agg(json_build_object('name', p.name, 'price', oi.price, 'quantity', oi.quantity)) as items
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC`
    const { rows } = await pool.query(q, [req.user.id])
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch purchase history' })
  }
}

export const getBrowsingHistory = async (req, res) => {
  try {
    const q = `
      SELECT id, action_type, details, created_at
      FROM browsing_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50`
    const { rows } = await pool.query(q, [req.user.id])
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch browsing history' })
  }
}

export const deleteAccount = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.user.id])
    res.json({ message: 'Account deleted successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete account' })
  }
}

export const updateNotifications = async (req, res) => {
  try {
    const { notifications } = req.body
    const q = `UPDATE users SET notifications=$1, updated_at=NOW() WHERE id=$2 RETURNING notifications`
    const { rows } = await pool.query(q, [notifications, req.user.id])
    res.json({ success: true, notifications: rows[0].notifications })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update notification settings' })
  }
}
