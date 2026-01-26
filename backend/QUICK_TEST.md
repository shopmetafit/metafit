# Quick Testing Guide

## 🚀 Fastest Way to Test

### Method 1: Node.js Test Script (Simplest)
```bash
node test-bluedart.js
```
This will:
- ✓ Check all .env variables
- ✓ Test JWT token generation
- ✓ Test Order schema
- ✓ Verify routes are loaded
- ✓ Show available endpoints

### Method 2: Bash Script with Curl (Complete Flow)
```bash
chmod +x TEST_WITH_CURL.sh
bash TEST_WITH_CURL.sh
```
This will:
- ✓ Create full order flow (cart → checkout → payment → order)
- ✓ Generate actual AWB
- ✓ Test tracking
- ✓ Show real Blue Dart responses

### Method 3: Postman Collection (Manual Testing)
1. Open Postman
2. Click Import → Choose `POSTMAN_COLLECTION.json`
3. Click through endpoints 1-8 in order
4. Replace placeholders (YOUR_TOKEN, PRODUCT_ID, etc.)

---

## 📋 Pre-Test Checklist

- [ ] MongoDB is running
- [ ] .env has Blue Dart credentials
- [ ] Server is running (`npm run dev`)
- [ ] You have a valid user token (from login)
- [ ] You have at least one product in database

---

## 🔑 Required Information

You'll need these before testing:

```
TOKEN          → Get from login endpoint (JWT)
PRODUCT_ID     → Get from MongoDB or products list
USER_ID        → Your user ID (from login)
```

---

## ✨ Expected Responses

### ✓ Generate AWB Success
```json
{
  "success": true,
  "message": "AWB generated successfully",
  "awbNo": "8918123456",
  "trackingId": "8918123456",
  "order": {
    "orderId": "64abc123def456",
    "status": "Shipped",
    "shippingStatus": "In-Transit"
  }
}
```

### ✓ Track Order Success
```json
{
  "success": true,
  "orderId": "64abc123def456",
  "awbNo": "8918123456",
  "status": "In-Transit",
  "trackingData": {
    "ShipmentTrackingStatus": "In Transit",
    "LastEventDescription": "Out for Delivery",
    ...
  }
}
```

### ✗ Common Errors

**Missing credentials:**
```json
{
  "success": false,
  "message": "Failed to generate JWT token from Blue Dart"
}
```
→ Fix: Add all BLUEDART_* vars to .env

**Order not paid:**
```json
{
  "success": false,
  "message": "Order must be paid before generating AWB"
}
```
→ Fix: Mark checkout as paid first (step 3)

**AWB already generated:**
```json
{
  "success": false,
  "message": "AWB already generated for this order",
  "awbNo": "8918123456"
}
```
→ Expected: Don't generate twice for same order

---

## 🧪 Manual Testing Steps

### Without Bash Script:

**Step 1: Get Token**
```bash
# Login to get JWT token
curl -X POST http://localhost:9000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"password"}'

# Copy the token from response
```

**Step 2: Create Checkout**
```bash
curl -X POST http://localhost:9000/api/checkout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "checkoutItems": [...],
    "shippingAddress": {...},
    "paymentMethod": "razorpay",
    "totalPrice": 1998
  }'

# Save CHECKOUT_ID from response
```

**Step 3: Mark as Paid**
```bash
curl -X PUT http://localhost:9000/api/checkout/CHECKOUT_ID/pay \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentStatus": "paid",
    "paymentDetails": {"razorpay_payment_id": "test"}
  }'
```

**Step 4: Finalize → Create Order**
```bash
curl -X POST http://localhost:9000/api/checkout/CHECKOUT_ID/finalize \
  -H "Authorization: Bearer YOUR_TOKEN"

# Save ORDER_ID from response
```

**Step 5: Generate AWB**
```bash
curl -X POST http://localhost:9000/api/shipment/ORDER_ID/generate-awb \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "consigneeName": "Customer Name",
    "consigneePhone": "9876543210",
    "consigneeEmail": "customer@email.com",
    "weight": "1.5"
  }'

# You should get AWB number in response!
```

**Step 6: Track Order**
```bash
curl -X GET http://localhost:9000/api/shipment/ORDER_ID/track \
  -H "Authorization: Bearer YOUR_TOKEN"

# Returns tracking status from Blue Dart
```

---

## 📊 Check Database

After generating AWB, verify in MongoDB:

```bash
# In MongoDB shell:
use metafit_db  # your database name
db.orders.findOne({awbNo: {$exists: true}})

# Should show:
{
  _id: ObjectId(...),
  awbNo: "8918123456",
  trackingId: "8918123456",
  shippingStatus: "In-Transit",
  status: "Shipped",
  bluedartGeneratedAt: ISODate(...)
}
```

---

## 🔍 Check Logs

Watch server logs for Blue Dart calls:

```bash
# In terminal running npm run dev:

✓ JWT Token generated successfully
✓ Sending waybill request to Blue Dart...
✓ Waybill generated successfully: 8918123456
```

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot find module" | Run `npm install` |
| BLUEDART_* not found | Add to .env |
| MongoDB connection error | Start MongoDB |
| "Order not paid" | Complete payment flow first |
| Blue Dart API fails | Check network/credentials |
| AWB not generating | Check server logs |

---

## 📝 Test Data Template

```json
{
  "consigneeName": "Rajesh Kumar",
  "consigneePhone": "9876543210",
  "consigneeEmail": "rajesh@example.com",
  "weight": "1.5",
  "shippingAddress": {
    "address": "123 Business Street, Apt 456",
    "city": "Mumbai",
    "postalCode": "400001",
    "state": "MH",
    "country": "IN"
  }
}
```

---

## ✅ Validation Checklist

After complete test:

- [ ] Server starts without errors
- [ ] JWT token generated successfully
- [ ] Order created with payment
- [ ] AWB number generated
- [ ] Order status changed to "Shipped"
- [ ] Tracking info retrieved
- [ ] Database shows awbNo in order

---

**All passing? You're ready for production! 🎉**
