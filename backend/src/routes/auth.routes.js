import { Router } from 'express'
import { register, login, me } from '../controllers/auth.controller.js'
import { auth } from '../middlewares/auth.middleware.js'
import { validateRegistration, validateLogin } from '../middlewares/validation.middleware.js'
import bcrypt from 'bcrypt'
import pool from '../config/db.js'
import crypto from 'crypto'

const r = Router()

r.post('/register', validateRegistration, register)
r.post('/login', validateLogin, login)
r.get('/me', auth, me)

// Request password reset (generates token, logs to console instead of email)
r.post('/request-reset', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    )

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0) {
      console.log(`⚠️  Password reset requested for non-existent email: ${email}`)
      return res.json({ message: 'If that email exists, a reset link has been sent' })
    }

    const user = userResult.rows[0]

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    const expiresAt = new Date(Date.now() + 3600000) // 1 hour

    // Store token in database
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, hashedToken, expiresAt]
    )

    // In a real app, send email. For personal project, log to console
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 PASSWORD RESET EMAIL (Console Only)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`To: ${user.email}`)
    console.log(`Reset Token: ${resetToken}`)
    console.log(`Expires: ${expiresAt.toLocaleString()}`)
    console.log(`\nUse this token to reset password at: /reset-password`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    res.json({
      message: 'If that email exists, a reset link has been sent',
      // For development/testing only - remove in production
      devToken: resetToken
    })
  } catch (error) {
    console.error('Error requesting password reset:', error)
    res.status(500).json({ error: 'Failed to process password reset request' })
  }
})

// Reset password with token
r.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' })
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Hash the provided token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    // Find valid token
    const tokenResult = await client.query(
      `SELECT user_id FROM password_reset_tokens
       WHERE token = $1 AND expires_at > NOW() AND used = FALSE`,
      [hashedToken]
    )

    if (tokenResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Invalid or expired reset token' })
    }

    const userId = tokenResult.rows[0].user_id

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update user password
    await client.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    )

    // Mark token as used
    await client.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE token = $1',
      [hashedToken]
    )

    await client.query('COMMIT')

    res.json({ message: 'Password reset successfully' })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error resetting password:', error)
    res.status(500).json({ error: 'Failed to reset password' })
  } finally {
    client.release()
  }
})

export default r
