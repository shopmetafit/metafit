# Blue Dart Shipping Integration Guide

## Overview

This document explains how the Blue Dart shipping integration works in the WellnessBazaar backend.

## Architecture

```
User Places Order → Payment Success → Order Created → AWB Generated → Tracking Active
                                           ↓
                                    /api/shipment/:orderId/generate-awb
                                           ↓
                                  Blue Dart Sandbox API
                                           ↓
                                  Returns AWB + Tracking ID
```

## Setup Instructions

### 1. Add Environment Variables

Update your `.env` file with these credentials (from the demo credentials provided):

```bash
# Blue Dart API Credentials
BLUEDART_API_KEY=oTGxtPZICkfe4dMRz4LeimZtU2c8Kyl3
BLUEDART_API_SECRET=LjiIAfVGbJxEO25l
BLUEDART_LOGIN_ID=GG940111
BLUEDART_LICENSE_KEY=kh7mnhqkmgegoksipxr0urmqesessup
BLUEDART_CUSTOMER_CODE=940111
BLUEDART_ORIGIN_AREA=GGN

# Shipper Details (Your Company Info)
SHIPPER_ADDRESS=Wellness Bazaar, 123 Business Street
SHIPPER_CITY=Gurugram
SHIPPER_STATE=HR
SHIPPER_PINCODE=122002
SHIPPER_PHONE=9876543210
SHIPPER_EMAIL=support@wellnessbazaar.com
```

## API Endpoints

### 1. Generate AWB (Waybill)

**Endpoint:** `POST /api/shipment/:orderId/generate-awb`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "consigneeName": "Customer Name",
  "consigneePhone": "9999999999",
  "consigneeEmail": "customer@email.com",
  "weight": "1.5"
}
```

**Response:**
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

**When to Call:**
- After payment is confirmed (in checkout finalization)
- When admin initiates shipment
- Can be called manually by frontend when needed

---

### 2. Track Shipment

**Endpoint:** `GET /api/shipment/:orderId/track`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "orderId": "64abc123def456",
  "awbNo": "8918123456",
  "status": "In-Transit",
  "trackingData": {
    "ShipmentTrackingStatus": "In Transit",
    "LastEventDescription": "Out for Delivery",
    "LastEventDate": "2024-01-23",
    ...
  }
}
```

**When to Call:**
- When user clicks "Track Order" on order page
- Real-time tracking updates

---

### 3. Get Shipping Info

**Endpoint:** `GET /api/shipment/:orderId`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "orderId": "64abc123def456",
  "courier": "bluedart",
  "awbNo": "8918123456",
  "trackingId": "8918123456",
  "shippingStatus": "In-Transit",
  "status": "Shipped",
  "bluedartGeneratedAt": "2024-01-23T10:30:00Z",
  "shippingAddress": {
    "address": "Customer Address",
    "city": "Mumbai",
    "postalCode": "400001",
    "country": "IN"
  }
}
```

**When to Call:**
- Load order details page
- Display shipping information on dashboard

---

### 4. Cancel Shipment (Optional)

**Endpoint:** `POST /api/shipment/:orderId/cancel`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "Shipment cancelled successfully",
  "orderId": "64abc123def456",
  "awbNo": "8918123456"
}
```

---

## Complete Order Flow

### Step 1: Order Creation (Existing - No Changes)
```
POST /api/checkout/:checkoutId/finalize
→ Creates Order document
→ Saves payment details
→ Clears cart
```

### Step 2: Generate AWB (NEW - Call after payment success)
```
POST /api/shipment/:orderId/generate-awb
→ Validates order is paid
→ Calls Blue Dart JWT API
→ Generates Waybill
→ Saves AWB in database
→ Updates order status → "Shipped"
```

### Step 3: Track Order (NEW - Call when user requests)
```
GET /api/shipment/:orderId/track
→ Retrieves AWB from database
→ Calls Blue Dart Tracking API
→ Returns live tracking status
```

---

## Integration with Checkout Flow

### Current Flow (Works As-Is)
```
1. POST /api/checkout               → Create checkout session
2. PUT /api/checkout/:id/pay        → Mark as paid
3. POST /api/checkout/:id/finalize  → Create Order
```

### Enhanced Flow (Add This)
```
4. POST /api/shipment/:orderId/generate-awb  → Generate AWB
```

**When to Integrate:**
- Automatically after payment success
- OR manually from admin panel
- OR on user request from frontend

---

## Database Changes

### Order Model Updated Fields

```javascript
// New fields added to Order schema:
courier: "bluedart",           // Courier company
awbNo: "8918123456",           // Waybill number (tracking number)
trackingId: "8918123456",      // Same as awbNo for Blue Dart
shippingStatus: "In-Transit",  // Pending, In-Transit, Delivered, Failed
bluedartGeneratedAt: Date      // When AWB was created
```

---

## File Structure

```
backend/
├── controllers/
│   └── bluedart.controller.js      ← Shipment logic
├── routes/
│   └── shipmentRoutes.js           ← Shipment endpoints
├── utils/
│   └── bluedart.service.js         ← Blue Dart API calls
└── models/
    └── Order.js                    ← Updated with AWB fields
```

---

## Key Concepts

### JWT Token
- Generated automatically before each API call
- Cached for 45 minutes to reduce API calls
- Handled internally by `bluedart.service.js`

### Waybill (AWB)
- Unique tracking number
- Generated once per order
- Required for tracking
- Can be cancelled if needed

### Tracking
- Always requires AWB number
- Returns current shipment status
- Updated by Blue Dart in real-time

---

## Error Handling

All errors are caught and returned as:
```json
{
  "success": false,
  "message": "Error description"
}
```

Common errors:
- "Order not found" → Invalid orderId
- "Order must be paid before generating AWB" → Payment pending
- "AWB already generated" → Multiple generation attempts
- "Blue Dart API error" → Network/API issue

---

## Testing

### Test Credentials (Already Provided)
```
API Key: oTGxtPZICkfe4dMRz4LeimZtU2c8Kyl3
Secret: LjiIAfVGbJxEO25l
Login ID: GG940111
License Key: kh7mnhqkmgegoksipxr0urmqesessup
Customer Code: 940111
Origin Area: GGN
```

### Test Endpoints

1. **Create a paid order first:**
   ```bash
   POST http://localhost:3000/api/checkout/:checkoutId/finalize
   ```

2. **Generate AWB:**
   ```bash
   POST http://localhost:3000/api/shipment/:orderId/generate-awb
   Content-Type: application/json
   Authorization: Bearer <token>
   
   {
     "consigneeName": "Test Customer",
     "consigneePhone": "9876543210",
     "consigneeEmail": "test@email.com",
     "weight": "1"
   }
   ```

3. **Track Order:**
   ```bash
   GET http://localhost:3000/api/shipment/:orderId/track
   Authorization: Bearer <token>
   ```

---

## Sandbox vs Production

### Current Setup (Sandbox)
- Using: `https://apigateway-sandbox.bluedart.com`
- Demo credentials
- For testing only

### Switch to Production
Edit `utils/bluedart.service.js`:
```javascript
// Change from:
const BASE_URL = SANDBOX_URL;
// To:
const BASE_URL = PRODUCTION_URL;
```

Then update `.env` with production credentials from Blue Dart.

---

## Important Security Notes

❌ **Never expose in frontend:**
- API Keys
- API Secrets
- License Keys
- Customer Codes

✅ **All API calls must go through backend**

✅ **All credentials stored in `.env` (never in code)**

---

## Next Steps

1. ✅ Update `.env` with Blue Dart credentials
2. ✅ Test AWB generation with test order
3. ✅ Integrate into checkout success flow
4. ✅ Build tracking UI in frontend
5. ✅ Switch to production when ready

---

## Support

For Blue Dart API documentation: https://www.bluedart.com/
