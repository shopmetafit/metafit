# Quick Integration Steps

## ✅ What's Already Created

1. **Order Model** - Added AWB fields
2. **Blue Dart Service** - JWT token + AWB generation + tracking
3. **Shipment Controller** - All shipment logic
4. **Shipment Routes** - API endpoints
5. **Server.js** - Routes integrated
6. **.env.example** - Credentials template

## 🔧 What You Need to Do

### Step 1: Update Your `.env` File

Add these lines to your existing `.env`:

```bash
# Blue Dart API Credentials (Demo - for testing)
BLUEDART_API_KEY=oTGxtPZICkfe4dMRz4LeimZtU2c8Kyl3
BLUEDART_API_SECRET=LjiIAfVGbJxEO25l
BLUEDART_LOGIN_ID=GG940111
BLUEDART_LICENSE_KEY=kh7mnhqkmgegoksipxr0urmqesessup
BLUEDART_CUSTOMER_CODE=940111
BLUEDART_ORIGIN_AREA=GGN

# Shipper Details
SHIPPER_ADDRESS=Your Warehouse Address
SHIPPER_CITY=Gurugram
SHIPPER_STATE=HR
SHIPPER_PINCODE=122002
SHIPPER_PHONE=9876543210
SHIPPER_EMAIL=support@wellnessbazaar.com
```

### Step 2: Test Basic Setup

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Restart server
npm run dev
```

### Step 3: Call AWB Generation After Payment

**Option A: From Checkout (Recommended)**

Edit `routes/checkoutRoutes.js` - After order creation:

```javascript
// At the end of the finalize endpoint, add:
router.post("/:id/finalize", protect, async (req, res) => {
  try {
    // ... existing code ...
    
    if (checkout.isPaid) {
      const finalOrder = await Order.create({
        // ... existing order creation ...
      });
      
      // 🆕 NEW: Auto-generate AWB after order creation
      try {
        const bluedartService = require("../utils/bluedart.service");
        const user = await User.findById(checkout.user);
        
        const awbResult = await bluedartService.generateWayBill({
          consigneeName: user.name,
          consigneePhone: user.phone || "9999999999",
          consigneeEmail: user.email,
          weight: "1", // Update based on product weight
          totalPrice: finalOrder.totalPrice,
          shippingAddress: checkout.shippingAddress,
        });
        
        if (awbResult.success) {
          finalOrder.awbNo = awbResult.awbNo;
          finalOrder.trackingId = awbResult.trackingId;
          finalOrder.shippingStatus = "In-Transit";
          finalOrder.status = "Shipped";
          finalOrder.bluedartGeneratedAt = new Date();
          await finalOrder.save();
        }
      } catch (bdError) {
        console.warn("Blue Dart AWB generation failed:", bdError.message);
        // Order still created, AWB can be generated manually later
      }
      
      await Cart.findOneAndDelete({ user: checkout.user });
      res.status(201).json(finalOrder);
    }
  } catch (error) {
    // ... error handling ...
  }
});
```

**Option B: From Frontend (Manual)**

```javascript
// After payment success in frontend:
const generateAWB = async (orderId) => {
  const response = await fetch(`/api/shipment/${orderId}/generate-awb`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      consigneeName: orderData.customerName,
      consigneePhone: orderData.phone,
      consigneeEmail: orderData.email,
      weight: orderData.weight || "1"
    })
  });
  
  return response.json();
};
```

### Step 4: Display Tracking on Frontend

```javascript
// Get tracking info:
const getTracking = async (orderId) => {
  const response = await fetch(`/api/shipment/${orderId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Show tracking status:
const trackOrder = async (orderId) => {
  const response = await fetch(`/api/shipment/${orderId}/track`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

## 🧪 Quick Test

### 1. Create Test Order
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "checkoutItems": [...],
    "shippingAddress": {...},
    "paymentMethod": "razorpay",
    "totalPrice": 5000
  }'
```

### 2. Mark as Paid
```bash
curl -X PUT http://localhost:3000/api/checkout/:checkoutId/pay \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentStatus": "paid", "paymentDetails": {...}}'
```

### 3. Finalize (Creates Order)
```bash
curl -X POST http://localhost:3000/api/checkout/:checkoutId/finalize \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Generate AWB
```bash
curl -X POST http://localhost:3000/api/shipment/:orderId/generate-awb \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "consigneeName": "Test Customer",
    "consigneePhone": "9876543210",
    "consigneeEmail": "test@email.com",
    "weight": "1"
  }'
```

### 5. Track Order
```bash
curl -X GET http://localhost:3000/api/shipment/:orderId/track \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Database Fields Added to Order

Your orders now have:
```javascript
courier: "bluedart",              // Logistics company
awbNo: "8918xxx",                 // Tracking number
trackingId: "8918xxx",            // Same as AWB
shippingStatus: "In-Transit",     // Order delivery status
bluedartGeneratedAt: Date         // When shipment created
```

## 🚀 Production Checklist

- [ ] Update `.env` with production Blue Dart credentials
- [ ] Change `SANDBOX_URL` to `PRODUCTION_URL` in `bluedart.service.js`
- [ ] Test end-to-end with production credentials
- [ ] Update shipper details (address, phone, email)
- [ ] Monitor logs for Blue Dart API responses
- [ ] Train team on tracking features

## ❓ Common Questions

**Q: Can I generate AWB before payment is confirmed?**  
A: No - code checks `isPaid` first. Prevents false shipments.

**Q: What if Blue Dart API fails?**  
A: Order is still created. You can generate AWB later via API or manually.

**Q: Can I generate AWB multiple times?**  
A: No - code prevents duplicate AWB generation for same order.

**Q: How long is JWT token valid?**  
A: 45 minutes (cached). Auto-refreshes on next API call.

**Q: Can users cancel shipments?**  
A: Yes - via `POST /api/shipment/:orderId/cancel`

## 📝 Files Created/Modified

```
✅ Created:
  - utils/bluedart.service.js        (Blue Dart API calls)
  - controllers/bluedart.controller.js (Shipment logic)
  - routes/shipmentRoutes.js         (Shipment endpoints)
  - BLUEDART_INTEGRATION.md          (Full documentation)

✏️ Modified:
  - models/Order.js                  (Added AWB fields)
  - api/server.js                    (Added routes)
  - .env.example                     (Added env vars)
```

---

**Everything is ready to go. Just add your .env variables and test!**
