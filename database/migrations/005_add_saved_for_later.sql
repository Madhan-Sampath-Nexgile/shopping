-- Migration: Add saved_for_later table
-- Created: 2025-01-12
-- Description: Adds saved_for_later table for managing user's saved items from cart

CREATE TABLE IF NOT EXISTS saved_for_later (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_for_later_user_id ON saved_for_later(user_id);

-- Comment on table
COMMENT ON TABLE saved_for_later IS 'Stores products that users have saved from cart for later purchase';
