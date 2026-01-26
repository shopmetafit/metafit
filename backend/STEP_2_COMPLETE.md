# ✅ STEP 2: Admin-Only Shipping Trigger - COMPLETE

## What Was Implemented

### Admin-Only Routes (Protected)

All routes require:
- ✅ User authentication (JWT token)
- ✅ Admin role (`role: "admin"`)

### 7 New Admin Endpoints

#### 1. **List Pending Shipments**
```
GET /api/admin/shipment/pending
```
Get all orders waiting for shipment with pagination.

**Query Params:**
- `page` (default: 1)
- `limit` (default: 20)
- `status` (default: "Processing")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "status": "Processing",
      "totalPrice": 1998,
      "shippingStatus": "Pending",
      "user": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "9876543210"
      }
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

---

#### 2. **Generate AWB (Admin Trigger)**
```
POST /api/admin/shipment/:orderId/generate-awb
```
Admin manually triggers AWB generation for an order.

**Request Body:**
```json
{
  "consigneeName": "Customer Name",
  "consigneePhone": "9876543210",
  "consigneeEmail": "customer@email.com",
  "weight": "1.5"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "AWB generated successfully",
  "code": "AWB_GENERATED",
  "awbNo": "8918123456",
  "trackingId": "8918123456",
  "order": {
    "orderId": "...",
    "status": "Shipped",
    "shippingStatus": "In-Transit"
  }
}
```

**Error Response (Balance):**
```json
{
  "success": false,
  "message": "Blue Dart account has insufficient balance",
  "code": "BLUEDART_INSUFFICIENT_BALANCE",
  "shippingError": "Insufficient Blue Dart account balance. Contact support.",
  "orderId": "..."
}
```

---

#### 3. **Retry Failed Shipment**
```
POST /api/admin/shipment/:orderId/retry
```
Retry AWB generation for orders that failed.

**Request Body (all optional):**
```json
{
  "consigneeName": "Corrected Name",
  "consigneePhone": "9999999999",
  "consigneeEmail": "new@email.com",
  "weight": "2.5"
}
```

Uses previous data if fields not provided.

**Response:**
Same as Generate AWB.

---

#### 4. **Get Shipping Info**
```
GET /api/admin/shipment/:orderId
```
Get complete shipping details including errors.

**Response:**
```json
{
  "success": true,
  "orderId": "...",
  "courier": "bluedart",
  "awbNo": "8918123456",
  "trackingId": "8918123456",
  "shippingStatus": "In-Transit",
  "shippingError": null,
  "status": "Shipped",
  "bluedartGeneratedAt": "2026-01-23T12:30:00Z",
  "shippingAddress": {
    "address": "123 Street",
    "city": "Mumbai",
    "postalCode": "400001"
  }
}
```

---

#### 5. **Get Live Tracking**
```
GET /api/admin/shipment/:orderId/track
```
Get current tracking status from Blue Dart.

**Response:**
```json
{
  "success": true,
  "orderId": "...",
  "awbNo": "8918123456",
  "status": "In-Transit",
  "trackingData": {
    "ShipmentTrackingStatus": "In Transit",
    "LastEventDescription": "Out for Delivery"
  }
}
```

---

#### 6. **Get Shipping Error Details**
```
GET /api/admin/shipment/:orderId/error
```
Get error details for troubleshooting failed shipments.

**Response (with error):**
```json
{
  "success": true,
  "orderId": "...",
  "shippingStatus": "FAILED",
  "shippingError": "Insufficient Blue Dart account balance. Contact support.",
  "status": "Processing",
  "awbNo": null,
  "canRetry": true
}
```

**Response (no error):**
```json
{
  "success": true,
  "message": "No shipping errors",
  "shippingStatus": "In-Transit",
  "awbNo": "8918123456"
}
```

---

#### 7. **Update Shipping Address**
```
PUT /api/admin/shipment/:orderId/address
```
Update customer address BEFORE generating AWB.

**Request Body:**
```json
{
  "address": "123 New Street",
  "city": "Delhi",
  "postalCode": "110001",
  "state": "DL",
  "country": "IN"
}
```

**Restrictions:**
- ❌ Cannot update if AWB already generated
- ✅ Only for orders with status "Processing"

**Response:**
```json
{
  "success": true,
  "message": "Shipping address updated successfully",
  "shippingAddress": {
    "address": "123 New Street",
    "city": "Delhi",
    "postalCode": "110001",
    "state": "DL",
    "country": "IN"
  }
}
```

---

#### 8. **Cancel Shipment**
```
POST /api/admin/shipment/:orderId/cancel
```
Cancel an already generated AWB.

**Response:**
```json
{
  "success": true,
  "message": "Shipment cancelled successfully",
  "orderId": "...",
  "awbNo": "8918123456"
}
```

---

## Key Features

### 🔒 Authorization
- All endpoints require admin role
- Middleware: `protect` + `admin`
- Non-admin users get 403 Forbidden

### 📊 Admin Workflow

```
1. GET /api/admin/shipment/pending
   ↓
   (See list of orders needing shipment)
   ↓
2. PUT /api/admin/shipment/:orderId/address (if needed)
   ↓
   (Verify/update address)
   ↓
3. POST /api/admin/shipment/:orderId/generate-awb
   ↓
   (Generate AWB)
   ↓
4. GET /api/admin/shipment/:orderId (check status)
   ↓
   (If failed)
   ↓
5. POST /api/admin/shipment/:orderId/retry (retry)
   OR
   GET /api/admin/shipment/:orderId/error (troubleshoot)
```

---

## Error Handling

All errors now include:
- `success: false`
- `code`: Error code for frontend
- `message`: Human-readable message
- `shippingError`: Specific shipping error
- `canRetry`: Whether retry is possible

### Common Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `ORDER_NOT_FOUND` | 404 | Order doesn't exist |
| `ORDER_NOT_PAID` | 400 | Order not yet paid |
| `AWB_ALREADY_EXISTS` | 400 | AWB already generated |
| `BLUEDART_INSUFFICIENT_BALANCE` | 402 | Blue Dart account has no balance |
| `BLUEDART_AUTH_ERROR` | 503 | Blue Dart authentication failed |
| `BLUEDART_UNAVAILABLE` | 503 | Blue Dart API is down |
| `BLUEDART_ERROR` | 500 | Other Blue Dart error |
| `RETRY_FAILED` | 500 | Retry attempt failed |

---

## Database Updates

Added to Order model:
```javascript
shippingError: String  // Stores error message
```

This allows admin to see what went wrong.

---

## Admin Panel Integration (Next Task)

Endpoints are ready for frontend. Admin needs:

1. **Pending Orders Table**
   - Fetch from `GET /api/admin/shipment/pending`
   - Show: Order ID, Customer, Total, Status
   - Button: "Generate Shipping"

2. **Generate AWB Modal**
   - POST to `/api/admin/shipment/:orderId/generate-awb`
   - Input: Customer name, phone, email

3. **Shipping Details Page**
   - GET `/api/admin/shipment/:orderId`
   - Show: AWB, Status, Tracking, Error (if any)
   - Button: "Retry" (if failed)
   - Button: "Update Address" (before AWB)

4. **Tracking Page**
   - GET `/api/admin/shipment/:orderId/track`
   - Show real-time tracking from Blue Dart

---

## Summary

✅ Admin-only routes implemented  
✅ Authorization checks added  
✅ 7 new endpoints ready  
✅ Error handling complete  
✅ Retry logic for failed shipments  
✅ Address update before shipping  

**Status: Ready for Step 3**
