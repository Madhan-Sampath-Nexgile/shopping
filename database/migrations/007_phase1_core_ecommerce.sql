-- Migration 007: Phase 1 Core E-commerce Features
-- Tables: shipping_addresses, discount_codes, order_tracking, product_variants, product_images

-- Multiple shipping addresses per user
CREATE TABLE IF NOT EXISTS shipping_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL, -- 'Home', 'Work', 'Other'
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'USA',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Discount codes system
CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2), -- for percentage discounts
    usage_limit INTEGER, -- NULL for unlimited
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order tracking timeline
CREATE TABLE IF NOT EXISTS order_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- 'ordered', 'processing', 'shipped', 'delivered', 'cancelled'
    message TEXT,
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product variants (sizes, colors, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_type VARCHAR(50) NOT NULL, -- 'size', 'color', 'material'
    variant_value VARCHAR(100) NOT NULL,
    price_adjustment DECIMAL(10, 2) DEFAULT 0, -- additional cost for this variant
    stock_quantity INTEGER DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Multiple product images
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add discount_code column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_id UUID REFERENCES shipping_addresses(id);

-- Add gift_wrap option to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS gift_wrap BOOLEAN DEFAULT FALSE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS gift_wrap_fee DECIMAL(10, 2) DEFAULT 0;

-- Add variant reference to cart and order_items
ALTER TABLE cart ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON shipping_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- Insert default tracking status for existing orders
INSERT INTO order_tracking (order_id, status, message)
SELECT id, status, CONCAT('Order ', status)
FROM orders
WHERE id NOT IN (SELECT DISTINCT order_id FROM order_tracking);

-- Migrate existing product images to product_images table
INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, unnest(images), name, 0, TRUE
FROM products
WHERE images IS NOT NULL AND array_length(images, 1) > 0;

COMMENT ON TABLE shipping_addresses IS 'Multiple shipping addresses per user';
COMMENT ON TABLE discount_codes IS 'Discount/coupon codes with validation rules';
COMMENT ON TABLE order_tracking IS 'Order status timeline and tracking';
COMMENT ON TABLE product_variants IS 'Product variants like size, color, material';
COMMENT ON TABLE product_images IS 'Multiple images per product';
