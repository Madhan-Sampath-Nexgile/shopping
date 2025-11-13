-- Migration: Add cart table
-- Created: 2025-11-12
-- Description: Adds cart table for managing user shopping carts

CREATE TABLE IF NOT EXISTS cart (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Add index for faster cart lookups
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
