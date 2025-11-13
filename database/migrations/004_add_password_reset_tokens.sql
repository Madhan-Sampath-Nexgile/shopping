-- Migration: Add password reset token fields to users table
-- Created: 2025-01-12

-- Add reset_token and reset_token_expiry columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Comment on columns
COMMENT ON COLUMN users.reset_token IS 'Token for password reset (hashed)';
COMMENT ON COLUMN users.reset_token_expiry IS 'Expiry timestamp for reset token';
