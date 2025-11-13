import jwt from 'jsonwebtoken'

// Simplified auth middleware for testing - auto-creates a guest user if no valid token
export const auth = (req, res, next) => {
  const authHeader = req.headers.authorization

  // If no auth header, use a default guest user for testing
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = {
      id: '00000000-0000-0000-0000-000000000000', // Guest user ID
      email: 'guest@test.com',
      variant: 'A'
    }
    return next()
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // includes id, email, and variant
    next()
  } catch (err) {
    // If token is invalid, use guest user instead of rejecting
    req.user = {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'guest@test.com',
      variant: 'A'
    }
    next()
  }
}
