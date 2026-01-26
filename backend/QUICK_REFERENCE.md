# 🚀 Quick Reference - Blue Dart Integration

## All Endpoints at a Glance

### USER TRACKING (2 endpoints)
```
GET /api/shipment/:orderId
GET /api/shipment/:orderId/track[?forceRefresh=true]
```

### ADMIN SHIPMENT (8 endpoints)
```
GET    /api/admin/shipment/pending
POST   /api/admin/shipment/:orderId/generate-awb
POST   /api/admin/shipment/:orderId/retry
GET    /api/admin/shipment/:orderId
GET    /api/admin/shipment/:orderId/error
GET    /api/admin/shipment/:orderId/track
PUT    /api/admin/shipment/:orderId/address
POST   /api/admin/shipment/:orderId/cancel
```

---

## Headers (All Requests)

```javascript
{
  "Authorization": "Bearer {JWT_TOKEN}",
  "Content-Type": "application/json"  // For POST/PUT
}
```

---

## Common Response Format

### Success
```json
{
  "success": true,
  "code": "AWB_GENERATED",
  "message": "Human readable message",
  "data": {}  // Endpoint-specific
}
```

### Error
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "shippingError": "Specific error if shipping-related"
}
```

---

## Generate AWB (Most Important)

```
POST /api/admin/shipment/:orderId/generate-awb
Authorization: Bearer {ADMIN_TOKEN}

{
  "consigneeName": "John Doe",
  "consigneePhone": "9876543210",
  "consigneeEmail": "john@example.com",
  "weight": "1.5"
}
```

**Success (202):**
```json
{
  "success": true,
  "awbNo": "8918123456",
  "trackingId": "8918123456",
  "order": {
    "status": "Shipped",
    "shippingStatus": "In-Transit"
  }
}
```

**Common Errors:**
- `ORDER_NOT_PAID` (400) - Payment pending
- `AWB_ALREADY_EXISTS` (400) - Already generated
- `BLUEDART_INSUFFICIENT_BALANCE` (402) - Add balance
- `BLUEDART_UNAVAILABLE` (503) - Try again later

---

## Track Order

```
GET /api/shipment/:orderId/track[?forceRefresh=true]
Authorization: Bearer {TOKEN}
```

**Response:**
```json
{
  "success": true,
  "awbNo": "8918123456",
  "shippingStatus": "In-Transit",
  
  "tracking": {
    "status": "Out for Delivery",
    "description": "Package out for delivery",
    "location": { "city": "Mumbai", "state": "MH" },
    "eventDate": "2026-01-24T10:30:00Z"
  },
  
  "dataSource": {
    "isLive": false,
    "isCached": true,
    "unavailable": false
  }
}
```

---

## List Pending Shipments (Admin)

```
GET /api/admin/shipment/pending?page=1&limit=20
Authorization: Bearer {ADMIN_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "order123",
      "status": "Processing",
      "totalPrice": 1998,
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

## Retry Failed Shipment

```
POST /api/admin/shipment/:orderId/retry
Authorization: Bearer {ADMIN_TOKEN}

{
  "consigneeName": "Corrected Name",
  "consigneePhone": "9999999999"
}
```

---

## Update Address (Before AWB)

```
PUT /api/admin/shipment/:orderId/address
Authorization: Bearer {ADMIN_TOKEN}

{
  "address": "123 New Street",
  "city": "Delhi",
  "postalCode": "110001",
  "state": "DL",
  "country": "IN"
}
```

---

## Error Codes (All Possible)

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Missing fields |
| `ORDER_NOT_FOUND` | 404 | Order doesn't exist |
| `ORDER_NOT_PAID` | 400 | Payment pending |
| `ORDER_ALREADY_SHIPPED` | 400 | Already shipped |
| `ORDER_CANCELLED` | 400 | Can't process |
| `AWB_ALREADY_EXISTS` | 400 | Already has tracking |
| `INCOMPLETE_ADDRESS` | 400 | Missing details |
| `NO_AWB` | 400 | Shipment not initiated |
| `BLUEDART_INSUFFICIENT_BALANCE` | 402 | Add balance |
| `BLUEDART_AUTH_ERROR` | 503 | Check credentials |
| `BLUEDART_UNAVAILABLE` | 503 | Try later |
| `BLUEDART_ERROR` | 500 | Other error |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Configuration (.env)

```bash
# Blue Dart API
BLUEDART_API_KEY=oTGxtPZICkfe4dMRz4LeimZtU2c8Kyl3
BLUEDART_API_SECRET=LjiIAfVGbJxEO25l
BLUEDART_LOGIN_ID=GG940111
BLUEDART_LICENSE_KEY=kh7mnhqkmgegoksipxr0urmqesessup
BLUEDART_CUSTOMER_CODE=940111
BLUEDART_ORIGIN_AREA=GGN

# Shipper
SHIPPER_ADDRESS=Your Address
SHIPPER_CITY=Gurugram
SHIPPER_STATE=HR
SHIPPER_PINCODE=122002
SHIPPER_PHONE=9999999999
SHIPPER_EMAIL=support@example.com

# Server
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
```

---

## Files Created

```
backend/
├── models/
│   └── TrackingHistory.js              # Cache model
├── utils/
│   ├── bluedart.service.js             # API service
│   └── tracking-sync.js                # Background sync
├── routes/
│   ├── shipmentRoutes.js               # User routes
│   └── adminShipmentRoutes.js          # Admin routes
├── controllers/
│   └── bluedart.controller.js          # All logic
├── api/
│   └── server.js                       # Integration
└── docs/
    ├── STEP_1_COMPLETE.md
    ├── STEP_2_COMPLETE.md
    ├── STEP_3_COMPLETE.md
    ├── STEP_4_FRONTEND_API.md
    └── COMPLETE_IMPLEMENTATION_SUMMARY.md
```

---

## Testing

### Quick Test
```bash
node test-bluedart.js
```

### Full Flow Test
```bash
bash TEST_WITH_CURL.sh
```

### Manual Test (Postman)
Import: `POSTMAN_COLLECTION.json`

---

## Admin Workflow

```
1. GET /api/admin/shipment/pending
   └─ See orders to ship

2. PUT /api/admin/shipment/:id/address
   └─ Verify address (optional)

3. POST /api/admin/shipment/:id/generate-awb
   └─ Generate AWB

4. GET /api/admin/shipment/:id
   └─ Check details

5. If error → POST /api/admin/shipment/:id/retry
   └─ Retry with corrections
```

---

## User Workflow

```
1. Place order + Pay

2. Wait for admin to ship

3. GET /api/shipment/:id/track
   └─ See tracking

4. (Optional) ?forceRefresh=true
   └─ Get live update
```

---

## Key Numbers

- JWT token: Valid 45 minutes
- Background sync: Every 1 hour
- Batch sync: 10 orders at a time
- API timeout: ~30 seconds
- Cache: Forever (or until new sync)

---

## No Blue Dart? No Problem

If Blue Dart API is down:
- ✅ Tracking still works (uses cache)
- ✅ Old statuses shown with timestamp
- ✅ Tells user it's cached data
- ✅ Auto-syncs when API comes back up

---

## Need Help?

- API errors → Check `error.code`
- Blue Dart issues → Check `shippingError`
- DB issues → Check MongoDB
- Sync issues → Check logs for `[TRACKING SYNC]`

---

**Everything is ready. Deploy with confidence! 🚀**
