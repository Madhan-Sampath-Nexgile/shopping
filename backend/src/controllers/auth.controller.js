import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import pool from '../config/db.js'

export const register = async (req, res) => {
  const {
    email,
    password,
    name,
    preferences = [],
    price_range = { min: 0, max: 0 },
    shopping_frequency = 'Occasional'
  } = req.body || {}

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' })

  try {
    const hash = await bcrypt.hash(password, 10)

    // Random variant assignment
    const variant = Math.random() < 0.5 ? 'A' : 'B'

    const q = `
      INSERT INTO users (email, password, name, preferences, price_range, shopping_frequency, variant)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, name, preferences, price_range, shopping_frequency, variant
    `
    const { rows } = await pool.query(q, [
      email,
      hash,
      name,
      preferences,
      price_range,
      shopping_frequency,
      variant
    ])

    // Create token with variant info
    const token = jwt.sign(
      { id: rows[0].id, email, variant },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.status(201).json({ user: rows[0], token })
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Email already exists' })

    console.error(err)
    return res.status(500).json({ error: 'Registration failed' })
  }
}

export const login = async (req, res) => {
  const { email, password, remember = false } = req.body || {}
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' })

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email])
    const user = rows[0]
    if (!user) return res.status(404).json({ error: 'User not found' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ error: 'Invalid password' })

    // Set expiry dynamically
    const expiry = remember ? '30d' : '7d'

    const token = jwt.sign(
      { id: user.id, email: user.email, variant: user.variant },
      process.env.JWT_SECRET,
      { expiresIn: expiry }
    )

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        variant: user.variant
      },
      remember
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Login failed' })
  }
}

export const me = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, preferences, price_range, shopping_frequency, variant FROM users WHERE id=$1',
      [req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    return res.json(rows[0])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to load profile' })
  }
}