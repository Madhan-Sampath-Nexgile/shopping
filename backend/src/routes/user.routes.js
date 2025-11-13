import { Router } from 'express'
import { auth } from '../middlewares/auth.middleware.js'
import pool from '../config/db.js'
const r = Router()

r.get('/me', auth, async (req,res)=>{
  const { rows } = await pool.query('SELECT id, email, name, preferences, variant FROM users WHERE id=$1', [req.user.id])
  res.json(rows[0] || null)
})

export default r
