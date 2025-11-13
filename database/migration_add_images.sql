-- Migration: Add images, specifications, and accessories columns to products table
-- Run this if the database already exists

ALTER TABLE products
ADD COLUMN IF NOT EXISTS images TEXT[],
ADD COLUMN IF NOT EXISTS specifications JSONB,
ADD COLUMN IF NOT EXISTS accessories UUID[];

-- Update existing products with sample images
UPDATE products SET
  images = ARRAY['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500'],
  specifications = '{"ram":"16GB","storage":"512GB","processor":"Intel i7","display":"14 inch Retina"}'::jsonb
WHERE name = 'Laptop Pro 14';

UPDATE products SET
  images = ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500'],
  specifications = '{"connectivity":"Bluetooth 5.0","battery":"30 hours","type":"Over-ear"}'::jsonb
WHERE name = 'Noise Cancelling Headphones';

UPDATE products SET
  images = ARRAY['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=500', 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500'],
  specifications = '{"material":"Mesh","adjustable":"Yes","weight_capacity":"150kg"}'::jsonb
WHERE name = 'Ergo Chair';

-- Add more products if they don't exist
INSERT INTO products (name, description, category, price, stock, images, specifications, metadata) VALUES
('Wireless Mouse','Ergonomic design mouse','Electronics', 1999, 100,
 ARRAY['https://images.unsplash.com/photo-1527814050087-3793815479db?w=500'],
 '{"dpi":"4000","battery":"6 months","buttons":"6"}'::jsonb,
 '{"brand":"TechGear"}'::jsonb),
('Yoga Mat','Premium non-slip yoga mat','Sports', 2499, 75,
 ARRAY['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500'],
 '{"thickness":"6mm","material":"TPE","size":"183cm x 61cm"}'::jsonb,
 '{"brand":"FitLife"}'::jsonb),
('Smart Watch','Fitness tracking smartwatch','Electronics', 15999, 30,
 ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500'],
 '{"display":"AMOLED","battery":"7 days","water_resistant":"5ATM"}'::jsonb,
 '{"brand":"FitTech"}'::jsonb),
('Coffee Maker','Programmable coffee machine','Home & Garden', 8999, 40,
 ARRAY['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500'],
 '{"capacity":"12 cups","features":"Timer, Auto-shutoff","type":"Drip"}'::jsonb,
 '{"brand":"BrewMaster"}'::jsonb),
('Running Shoes','Lightweight running shoes','Fashion', 6999, 60,
 ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500'],
 '{"size_range":"6-12","material":"Mesh upper","sole":"Rubber"}'::jsonb,
 '{"brand":"RunFast"}'::jsonb),
('Desk Lamp','LED adjustable desk lamp','Home & Garden', 3499, 85,
 ARRAY['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500'],
 '{"brightness_levels":"5","color_temp":"3000K-6000K","power":"12W"}'::jsonb,
 '{"brand":"LightUp"}'::jsonb),
('Backpack','Water-resistant laptop backpack','Fashion', 4999, 55,
 ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=500'],
 '{"capacity":"30L","laptop_size":"15.6 inch","material":"Polyester"}'::jsonb,
 '{"brand":"TravelPro"}'::jsonb),
('Fiction Novel','Bestselling fiction book','Books', 599, 200,
 ARRAY['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500'],
 '{"pages":"350","author":"Jane Smith","language":"English"}'::jsonb,
 '{"brand":"ReadMore Publishing"}'::jsonb),
('Cooking Book','Professional cooking recipes','Books', 899, 150,
 ARRAY['https://images.unsplash.com/photo-1589998059171-988d887df646?w=500'],
 '{"pages":"280","author":"Chef John","cuisine":"International"}'::jsonb,
 '{"brand":"Culinary Press"}'::jsonb)
ON CONFLICT DO NOTHING;
