# Discount Code Management Guide

## Overview

The SmartShop AI platform includes a comprehensive discount code management system that allows administrators to create, manage, and track promotional discount codes.

---

## Features

### ✅ Admin Discount Management
- Create unlimited discount codes
- Percentage or fixed amount discounts
- Usage limits and tracking
- Expiration dates (start and end)
- Minimum order requirements
- Maximum discount caps
- Activate/deactivate codes
- Real-time status indicators

### ✅ Customer Discount Application
- Apply discount codes at checkout
- Real-time validation
- Clear discount amount display
- Automatic total calculation

---

## Access

### Admin Interface
**URL:** `/admin/discounts`
**Access:** Admin users only (protected route)
**Navigation:** Admin Dashboard → "Discount Codes" tab

### Customer Interface
**URL:** `/checkout`
**Feature:** Discount code input field
**Access:** All logged-in users

---

## Creating Discount Codes

### Step-by-Step

1. **Navigate to Admin Dashboard**
   - Go to `/admin`
   - Click on "Discount Codes" tab
   - Or directly visit `/admin/discounts`

2. **Click "Create Discount Code"**
   - Opens modal form

3. **Fill in Required Fields:**
   - **Code** (Required): Uppercase alphanumeric code
     - Example: `SAVE20`, `WELCOME50`, `FLASH100`
     - Cannot be changed after creation

   - **Discount Type** (Required):
     - `Percentage (%)` - Discount as percentage of order total
     - `Fixed Amount ($)` - Flat dollar discount

   - **Value** (Required):
     - For percentage: 1-100
     - For fixed: Any positive number

4. **Optional Settings:**
   - **Description**: Internal note about the discount
   - **Min Order Amount**: Minimum cart total required
   - **Max Discount Amount**: Cap for percentage discounts
   - **Usage Limit**: Maximum number of uses (unlimited if empty)
   - **Valid From**: Start date/time (immediate if empty)
   - **Valid Until**: Expiration date/time (never expires if empty)
   - **Active**: Check to enable immediately

5. **Click "Create Discount"**

---

## Discount Code Examples

### Example 1: Simple Percentage Discount
```
Code: SAVE10
Type: Percentage
Value: 10
Description: 10% off entire order
Active: Yes
```
**Result:** 10% off any order, unlimited uses, never expires

### Example 2: Limited-Time Fixed Discount
```
Code: FLASH20
Type: Fixed
Value: 20
Min Order Amount: 100
Usage Limit: 100
Valid From: 2025-01-15 00:00
Valid Until: 2025-01-20 23:59
Active: Yes
```
**Result:** $20 off orders over $100, limited to 100 uses, expires on Jan 20

### Example 3: First-Time Customer Discount
```
Code: WELCOME50
Type: Percentage
Value: 50
Max Discount Amount: 25
Usage Limit: 1
Description: First-time customer discount
Active: Yes
```
**Result:** 50% off up to $25 discount, one-time use per account

### Example 4: VIP Customer Discount
```
Code: VIP100
Type: Fixed
Value: 100
Min Order Amount: 500
Description: VIP customer exclusive
Valid Until: 2025-12-31 23:59
Active: Yes
```
**Result:** $100 off orders over $500, expires end of year

---

## Managing Existing Codes

### View All Codes
- Navigate to `/admin/discounts`
- View cards showing all discount codes
- Status indicators show: Active, Inactive, Expired, Scheduled, Limit Reached

### Edit Discount Code
1. Click the pencil (edit) icon on the discount card
2. Modify any field except the code itself
3. Click "Update Discount"

**Note:** The discount code cannot be changed after creation. If you need a different code, create a new one.

### Activate/Deactivate Code
- Click the "Activate" or "Deactivate" button on the discount card
- Deactivated codes cannot be used by customers
- Can be reactivated at any time

### Delete Discount Code
1. Click the trash icon on the discount card
2. Confirm deletion
3. Code is permanently removed (cannot be undone)

**Warning:** Deleting a code that has been used will not affect historical orders.

---

## Status Indicators

### Active (Green)
- Code is active and can be used
- Not expired
- Usage limit not reached

### Scheduled (Blue)
- Code is created but start date is in the future
- Will become active automatically

### Expired (Red)
- End date has passed
- Cannot be used

### Limit Reached (Orange)
- Usage limit has been met
- Cannot be used until limit is increased

### Inactive (Gray)
- Manually deactivated by admin
- Can be reactivated

---

## Customer Usage

### How Customers Apply Discounts

1. **At Checkout:**
   - Navigate to `/checkout`
   - Fill in shipping information
   - Enter discount code in the "Discount Code" field
   - Click "Apply"

2. **Validation:**
   - System validates code in real-time
   - Shows success message if valid
   - Shows error message if invalid/expired

3. **Discount Applied:**
   - Discount amount displayed in order summary
   - Total automatically recalculated
   - Can remove discount and try another code

---

## Validation Rules

The system validates discount codes against these criteria:

### 1. **Code Exists**
- Code must be in the database
- Case-insensitive matching

### 2. **Active Status**
- Code must be marked as active

### 3. **Date Range**
- Current time must be after `valid_from` (if set)
- Current time must be before `valid_until` (if set)

### 4. **Usage Limit**
- `used_count` must be less than `usage_limit` (if set)

### 5. **Minimum Order Amount**
- Order total must meet or exceed `min_order_amount` (if set)

### 6. **Discount Calculation**
- For percentage: `(order_total * value) / 100`
- Apply `max_discount_amount` cap if set
- For fixed: Use `value` directly
- Ensure discount doesn't exceed order total

---

## API Endpoints

### Customer Endpoints

#### Validate Discount Code
```
POST /api/discount/validate
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "SAVE10",
  "orderTotal": 150.00
}

Response:
{
  "success": true,
  "message": "Discount code applied successfully",
  "discount": {
    "code": "SAVE10",
    "description": "10% off entire order",
    "type": "percentage",
    "value": 10,
    "discountAmount": "15.00"
  }
}
```

### Admin Endpoints

#### Get All Discount Codes
```
GET /api/discount/admin/all
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "discounts": [...]
}
```

#### Create Discount Code
```
POST /api/discount/admin/create
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "code": "SAVE10",
  "description": "10% off",
  "discount_type": "percentage",
  "discount_value": 10,
  "min_order_amount": 0,
  "max_discount_amount": null,
  "usage_limit": null,
  "valid_from": null,
  "valid_until": null,
  "is_active": true
}
```

#### Update Discount Code
```
PUT /api/discount/admin/:id
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "discount_value": 15,
  "is_active": false
}
```

#### Delete Discount Code
```
DELETE /api/discount/admin/:id
Authorization: Bearer {admin_token}
```

---

## Database Schema

### discount_codes Table
```sql
CREATE TABLE discount_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Usage Tracking

### Automatic Tracking
- System automatically increments `used_count` when an order is placed with a discount code
- Tracked at order creation, not at validation
- Usage count persists even if order is cancelled

### Viewing Usage
- Admin interface shows usage as a progress bar: "5 / 100"
- Visual indicator when limit is reached

---

## Best Practices

### Naming Conventions
- Use ALL CAPS for codes: `SAVE10` not `save10`
- Keep codes short and memorable: 6-10 characters
- Make codes descriptive: `WELCOME50`, `FLASH20`, `VIP100`

### Discount Strategies
1. **Welcome Discounts**: One-time 50% off for new customers
2. **Flash Sales**: Limited quantity, time-sensitive
3. **Minimum Order**: Encourage larger purchases
4. **Seasonal**: Holiday-themed codes with expiration
5. **VIP**: Exclusive codes for loyal customers

### Security
- Don't use easily guessable codes like `DISCOUNT` or `SAVE`
- Set usage limits for high-value discounts
- Set expiration dates for time-limited offers
- Monitor usage regularly

---

## Common Issues

### Issue: Code Not Working
**Solutions:**
1. Check if code is active (not deactivated)
2. Verify current date is within valid range
3. Check if usage limit has been reached
4. Ensure order total meets minimum amount
5. Verify code is entered correctly (case-insensitive)

### Issue: Discount Amount Incorrect
**Solutions:**
1. For percentage discounts, check `max_discount_amount` cap
2. Verify discount doesn't exceed order total
3. Check if discount is applied before or after shipping

### Issue: Can't Edit Code
**Reason:** Code field is locked after creation for data integrity
**Solution:** Create a new code with the desired name

---

## Testing

### Test Discount Codes

Create these codes for testing:

```sql
INSERT INTO discount_codes (code, discount_type, discount_value, description, is_active)
VALUES
  ('SAVE10', 'percentage', 10, '10% off - Test', true),
  ('FLAT20', 'fixed', 20, '$20 off - Test', true),
  ('WELCOME50', 'percentage', 50, '50% off - Test (max $25)', true);

-- Add max discount cap to WELCOME50
UPDATE discount_codes
SET max_discount_amount = 25
WHERE code = 'WELCOME50';
```

### Test Scenarios
1. ✅ Apply SAVE10 to $100 order → $10 discount
2. ✅ Apply FLAT20 to $50 order → $20 discount
3. ✅ Apply WELCOME50 to $100 order → $25 discount (capped)
4. ✅ Try expired code → Error message
5. ✅ Try code with usage limit reached → Error message
6. ✅ Try code with min order not met → Error message

---

## Future Enhancements

Potential features for Phase 2+:
- [ ] Stackable discount codes
- [ ] Auto-apply best discount
- [ ] Customer-specific codes
- [ ] First-time customer detection
- [ ] Discount code analytics dashboard
- [ ] Email discount code campaigns
- [ ] BOGO (Buy One Get One) discounts
- [ ] Product-specific discounts
- [ ] Category-specific discounts

---

## Support

For questions or issues:
1. Check this guide first
2. Review `QUICK_REFERENCE.md`
3. Check backend logs for validation errors
4. Create a GitHub issue if needed

---

**Version:** 1.0.0
**Last Updated:** January 13, 2025
**Feature Status:** ✅ Production Ready
