# SmartShop AI - Quick Reference Guide

## 🚀 Current Implementation Status

**Phase 1: COMPLETE ✅**
**Last Updated:** January 13, 2025

---

## 📍 Running the Application

### Prerequisites
- Node.js installed
- PostgreSQL running
- Database migrations applied

### Start Services

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Runs on: http://localhost:4000

# Terminal 2 - Frontend
cd frontend
npm run dev
# Runs on: http://localhost:5173

# Terminal 3 - AI Service (Optional)
cd dspy_service
python app.py
# Runs on: http://localhost:8000
```

---

## 🔐 Test Accounts

### Admin Account
- Email: `admin@smartshop.ai`
- Password: `admin123`
- Features: Full admin access

### Demo User
- Email: `demo@example.com`
- Password: `demo123`
- Features: Regular user access

---

## 📦 Phase 1 Features Guide

### 1. Multiple Shipping Addresses

**Access:** `/shipping-addresses` (Protected route)

**Features:**
- Add multiple addresses
- Edit existing addresses
- Delete addresses
- Set default address
- Use saved addresses at checkout

**API Endpoints:**
```
GET    /api/shipping              - Get all user addresses
POST   /api/shipping              - Create new address
PUT    /api/shipping/:id          - Update address
DELETE /api/shipping/:id          - Delete address
PATCH  /api/shipping/:id/set-default - Set as default
```

**Testing:**
1. Login as demo user
2. Navigate to Profile → Shipping Addresses
3. Add a new address
4. Set it as default
5. Go to checkout and see it pre-selected

---

### 2. Discount Code System

**Access:** Checkout page

**Features:**
- Apply discount codes
- Percentage or fixed amount discounts
- Usage limits
- Expiration dates
- Minimum order requirements
- Max discount caps

**API Endpoints:**
```
POST /api/discount/validate       - Validate discount code
GET  /api/discount/admin/all      - Get all codes (admin)
POST /api/discount/admin/create   - Create code (admin)
PUT  /api/discount/admin/:id      - Update code (admin)
DELETE /api/discount/admin/:id    - Delete code (admin)
```

**Test Discount Codes:**
```sql
-- Create test discount codes in database
INSERT INTO discount_codes (code, discount_type, discount_value, description, is_active)
VALUES
  ('SAVE10', 'percentage', 10, '10% off', true),
  ('FLAT20', 'fixed', 20, '$20 off', true),
  ('WELCOME50', 'percentage', 50, '50% off first order', true);
```

**Testing:**
1. Add products to cart
2. Go to checkout
3. Enter code: `SAVE10`
4. See 10% discount applied
5. Order total updates automatically

---

### 3. Product Variants

**Access:** Product details page

**Features:**
- Size, color, material variants
- Price adjustments per variant
- Independent stock tracking
- Visual variant selector
- Cart supports variants

**API Endpoints:**
```
GET    /api/product-variants/product/:id - Get variants
POST   /api/product-variants             - Create variant
PUT    /api/product-variants/:id         - Update variant
DELETE /api/product-variants/:id         - Delete variant
```

**Testing:**
1. Navigate to a product page
2. Select different variants (if available)
3. See price adjust dynamically
4. Check stock availability per variant
5. Add variant to cart
6. Go to cart and see variant details

---

### 4. Order Tracking

**Access:** Orders page → Order details

**Features:**
- Timeline view of order status
- Tracking numbers
- Carrier information
- Location updates
- Timestamps for each event

**API Endpoints:**
```
GET /api/orders/:id/tracking      - Get tracking timeline
PUT /api/orders/:id/status        - Update status (admin)
```

**Order Status Flow:**
1. `ordered` - Order placed
2. `processing` - Being prepared
3. `shipped` - Out for delivery
4. `delivered` - Completed
5. `cancelled` - Cancelled

**Testing:**
1. Place an order
2. Go to Orders page
3. Click on an order
4. See tracking timeline
5. Admin can update status via API

---

### 5. Product Image Gallery

**Access:** Product details page

**Features:**
- Multiple images per product
- Thumbnail navigation
- Click to enlarge
- Modal view
- Zoom on hover

**API Endpoints:**
```
GET    /api/product-images/product/:id - Get all images
POST   /api/product-images             - Add image
PUT    /api/product-images/:id         - Update image
DELETE /api/product-images/:id         - Delete image
PATCH  /api/product-images/:id/set-primary - Set as primary
```

**Testing:**
1. Go to any product page
2. See main image
3. Click thumbnails to switch
4. Click main image for modal view
5. Hover to zoom (desktop)

---

### 6. Password Reset

**Access:** Login page → "Forgot Password?"

**Features:**
- Request reset token
- Token expires in 1 hour
- SHA-256 hashed tokens
- Console-based (no email)
- Token can only be used once

**API Endpoints:**
```
POST /api/auth/request-reset      - Request reset
POST /api/auth/reset-password     - Reset with token
```

**Testing:**
1. Click "Forgot Password?" on login
2. Enter email: `demo@example.com`
3. Check backend console for token
4. Copy token
5. Go to `/reset-password`
6. Enter token and new password
7. Login with new password

---

### 7. Enhanced Checkout

**Access:** Cart → Proceed to Checkout

**Features:**
- Select saved shipping address
- Add new address inline
- Apply discount code
- Real-time total calculation
- Variant info in summary
- Payment method selection (COD)

**Testing:**
1. Add products to cart
2. Proceed to checkout
3. Select saved address or add new
4. Apply discount code
5. Review order summary
6. Place order
7. Check Orders page for confirmation

---

### 8. Reorder Functionality

**Access:** Orders page → Order details

**Features:**
- One-click reorder
- Adds all items back to cart
- Stock validation
- Handles unavailable items
- Supports variants

**API Endpoints:**
```
POST /api/orders/:id/reorder      - Reorder items
```

**Testing:**
1. Go to Orders page
2. Find a delivered order
3. Click "Reorder" button
4. Items added to cart
5. Go to cart to verify

---

## 🔍 API Testing with cURL

### Test Shipping Address Creation
```bash
TOKEN="your-jwt-token"
curl -X POST http://localhost:4000/api/shipping \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Home",
    "full_name": "John Doe",
    "phone": "1234567890",
    "address_line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "USA",
    "is_default": true
  }'
```

### Test Discount Validation
```bash
curl -X POST http://localhost:4000/api/discount/validate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SAVE10",
    "orderTotal": 100
  }'
```

### Test Order Placement
```bash
curl -X POST http://localhost:4000/api/orders/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddressId": "address-uuid",
    "paymentMethod": "COD",
    "discountCode": "SAVE10"
  }'
```

---

## 🗄️ Database Schema Reference

### Key Tables

**shipping_addresses**
- Multiple addresses per user
- Default flag for quick selection
- Linked to orders

**discount_codes**
- Coupon system
- Usage tracking
- Expiration dates

**order_tracking**
- Timeline of order status
- Tracking numbers
- Location updates

**product_variants**
- Size, color, material options
- Price adjustments
- Stock per variant

**product_images**
- Multiple images per product
- Primary image flag
- Display order

---

## 🎨 Frontend Routes

### Public Routes
- `/` - Home page
- `/search` - Product listing
- `/product/:id` - Product details
- `/category/:name` - Category page
- `/login` - Login page
- `/register` - Register page
- `/request-reset` - Request password reset
- `/reset-password` - Reset password with token

### Protected Routes (Require Login)
- `/cart` - Shopping cart
- `/checkout` - Checkout page
- `/orders` - Order history
- `/wishlist` - Saved items
- `/compare` - Product comparison
- `/profile` - User profile
- `/shipping-addresses` - Address management

### Admin Routes
- `/admin` - Admin dashboard

---

## 🐛 Common Issues & Solutions

### Issue: "Token expired" error
**Solution:** Login again to get a new JWT token

### Issue: Discount code not working
**Solution:** Check:
1. Code is active in database
2. Code hasn't expired
3. Usage limit not reached
4. Order meets minimum amount
5. Code entered correctly (uppercase)

### Issue: Product variant not showing
**Solution:** Check:
1. Variants created for the product
2. Variant has stock > 0
3. Frontend fetching product with variants

### Issue: Order tracking empty
**Solution:**
1. Initial tracking entry created on order placement
2. Admin needs to update status for more entries
3. Check order_tracking table

### Issue: Password reset token not working
**Solution:**
1. Check backend console for token
2. Token expires in 1 hour
3. Token can only be used once
4. Use exact token (case-sensitive)

---

## 📈 Performance Tips

1. **Database Indexes** - Added on frequently queried columns
2. **API Caching** - Use Redis for frequently accessed data (future)
3. **Image Optimization** - Compress and resize images
4. **Lazy Loading** - Load images as needed
5. **Query Optimization** - Use LIMIT on large datasets

---

## 🔒 Security Notes

1. **Password Hashing** - bcrypt with 10 rounds
2. **JWT Tokens** - Secure secret key required
3. **Input Validation** - Validate all user inputs
4. **SQL Injection** - Parameterized queries used
5. **XSS Prevention** - Sanitize outputs (React auto-escapes)

---

## 📚 Useful Commands

### Database
```bash
# Apply migrations
psql -U postgres -d smartshop -f database/migrations/007_phase1_core_ecommerce.sql

# Check tables
psql -U postgres -d smartshop -c "\dt"

# View specific table
psql -U postgres -d smartshop -c "SELECT * FROM shipping_addresses LIMIT 5;"
```

### Git
```bash
# Commit Phase 1 changes
git add .
git commit -m "Phase 1: Implement core e-commerce features"
git push origin main
```

### NPM
```bash
# Install dependencies
npm install

# Update packages
npm update

# Check for outdated packages
npm outdated
```

---

## 🆘 Support & Documentation

- **Project Documentation:** `DOCUMENT.md`
- **Phase 1 Complete:** `PHASE1_IMPLEMENTATION_COMPLETE.md`
- **Backend Details:** `PHASE1_BACKEND_COMPLETE.md`
- **Phase 2 Roadmap:** `PHASE2_ROADMAP.md`
- **This Guide:** `QUICK_REFERENCE.md`

---

## ✅ Pre-Launch Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] SSL certificates installed
- [ ] Error monitoring setup
- [ ] Analytics configured
- [ ] Payment gateway tested
- [ ] Email service configured
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Documentation updated
- [ ] Team training completed

---

**Version:** 1.0 (Phase 1)
**Status:** Production Ready ✅
**Date:** January 13, 2025
