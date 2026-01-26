# ✅ STEP 4: Frontend Integration - Complete API Reference

## Overview

All Blue Dart shipping endpoints are production-ready. This guide covers every API endpoint needed for frontend integration.

---

## 📋 Complete Endpoint List

### USER ENDPOINTS (Customer Tracking)

#### 1. Get Shipping Info
```
GET /api/shipment/:orderId
Authorization: Bearer {JWT_TOKEN}
```

**Purpose:** Get current shipping details for an order (no live Blue Dart call)

**Response:**
```json
{
  "success": true,
  "orderId": "64abc123...",
  "courier": "bluedart",
  "awbNo": "8918123456",
  "trackingId": "8918123456",
  "shippingStatus": "In-Transit",
  "shippingError": null,
  "status": "Shipped",
  "bluedartGeneratedAt": "2026-01-23T12:30:00Z",
  "shippingAddress": {
    "address": "123 Customer Street",
    "city": "Mumbai",
    "postalCode": "400001",
    "country": "IN"
  }
}
```

**Use Case:** Display shipping info on order detail page

---

#### 2. Track Order
```
GET /api/shipment/:orderId/track[?forceRefresh=true]
Authorization: Bearer {JWT_TOKEN}
```

**Purpose:** Get tracking status (cached or live)

**Query Params:**
- `forceRefresh=true` - Force refresh from Blue Dart (optional)

**Response:**
```json
{
  "success": true,
  "orderId": "64abc123...",
  "awbNo": "8918123456",
  "courier": "bluedart",
  "orderStatus": "Shipped",
  "orderCreatedAt": "2026-01-23T10:00:00Z",
  "shippingStatus": "In-Transit",
  "shippingError": null,
  
  "tracking": {
    "status": "Out for Delivery",
    "description": "Package out for delivery",
    "location": {
      "city": "Mumbai",
      "state": "MH",
      "country": "IN"
    },
    "eventDate": "2026-01-24T10:30:00Z",
    "lastSyncedAt": "2026-01-24T10:35:00Z"
  },
  
  "dataSource": {
    "isLive": false,
    "isCached": true,
    "unavailable": false
  }
}
```

**Use Case:** Show detailed tracking on tracking page

---

### ADMIN ENDPOINTS (Shipment Management)

#### 1. List Pending Shipments
```
GET /api/admin/shipment/pending[?page=1&limit=20&status=Processing]
Authorization: Bearer {ADMIN_TOKEN}
```

**Purpose:** Get all orders waiting to be shipped

**Query Params:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `status` - Order status to filter (default: "Processing")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64abc123...",
      "status": "Processing",
      "totalPrice": 1998,
      "shippingStatus": "Pending",
      "isPaid": true,
      "createdAt": "2026-01-23T10:00:00Z",
      "user": {
        "_id": "user123",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "9876543210"
      },
      "shippingAddress": {
        "address": "123 Street",
        "city": "Mumbai",
        "postalCode": "400001"
      },
      "orderItems": [...]
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

**Use Case:** Admin dashboard - list of orders to ship

---

#### 2. Generate AWB
```
POST /api/admin/shipment/:orderId/generate-awb
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "consigneeName": "John Doe",
  "consigneePhone": "9876543210",
  "consigneeEmail": "john@example.com",
  "weight": "1.5"
}
```

**Purpose:** Generate shipping waybill (trigger from admin)

**Request Body:**
- `consigneeName` (required) - Customer name
- `consigneePhone` (required) - Customer phone
- `consigneeEmail` (optional) - Customer email
- `weight` (optional) - Package weight in kg (default: "1")

**Success Response:**
```json
{
  "success": true,
  "message": "AWB generated successfully",
  "code": "AWB_GENERATED",
  "awbNo": "8918123456",
  "trackingId": "8918123456",
  "order": {
    "orderId": "64abc123...",
    "status": "Shipped",
    "shippingStatus": "In-Transit",
    "bluedartGeneratedAt": "2026-01-24T12:30:00Z"
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
  "orderId": "64abc123..."
}
```

**Error Response (Not Paid):**
```json
{
  "success": false,
  "message": "Order must be paid before generating AWB",
  "code": "ORDER_NOT_PAID",
  "paymentStatus": "Pending"
}
```

**Use Case:** Admin clicks "Ship Order" button

---

#### 3. Retry Failed Shipment
```
POST /api/admin/shipment/:orderId/retry
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "consigneeName": "Corrected Name",
  "consigneePhone": "9999999999",
  "consigneeEmail": "new@email.com",
  "weight": "2.5"
}
```

**Purpose:** Retry AWB generation for failed orders

**Request Body:** All fields optional (uses previous data if not provided)

**Response:** Same as Generate AWB

**Use Case:** Admin retries failed shipment with corrected details

---

#### 4. Get Shipping Info (Admin)
```
GET /api/admin/shipment/:orderId
Authorization: Bearer {ADMIN_TOKEN}
```

**Purpose:** Get complete shipping details including errors

**Response:**
```json
{
  "success": true,
  "orderId": "64abc123...",
  "courier": "bluedart",
  "awbNo": "8918123456",
  "trackingId": "8918123456",
  "shippingStatus": "In-Transit",
  "shippingError": null,
  "status": "Shipped",
  "bluedartGeneratedAt": "2026-01-24T12:30:00Z",
  "shippingAddress": {
    "address": "123 Street",
    "city": "Mumbai",
    "postalCode": "400001",
    "country": "IN"
  }
}
```

**Use Case:** Admin views order shipping details

---

#### 5. Get Shipping Error Details
```
GET /api/admin/shipment/:orderId/error
Authorization: Bearer {ADMIN_TOKEN}
```

**Purpose:** Troubleshoot failed shipments

**Response (with error):**
```json
{
  "success": true,
  "orderId": "64abc123...",
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

**Use Case:** Admin clicks "View Error" on failed shipment

---

#### 6. Update Shipping Address
```
PUT /api/admin/shipment/:orderId/address
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "address": "123 New Street",
  "city": "Delhi",
  "postalCode": "110001",
  "state": "DL",
  "country": "IN"
}
```

**Purpose:** Correct customer address BEFORE generating AWB

**Request Body:**
- `address` (required)
- `city` (required)
- `postalCode` (required)
- `state` (optional)
- `country` (optional, default: "IN")

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

**Error (AWB already generated):**
```json
{
  "success": false,
  "message": "Cannot update address after AWB is generated",
  "awbNo": "8918123456"
}
```

**Use Case:** Admin corrects address before shipping

---

#### 7. Track Order (Admin)
```
GET /api/admin/shipment/:orderId/track
Authorization: Bearer {ADMIN_TOKEN}
```

**Purpose:** Get live tracking from Blue Dart

**Response:** Same as user track endpoint

**Use Case:** Admin checks live tracking status

---

#### 8. Cancel Shipment
```
POST /api/admin/shipment/:orderId/cancel
Authorization: Bearer {ADMIN_TOKEN}
```

**Purpose:** Cancel a generated AWB

**Response:**
```json
{
  "success": true,
  "message": "Shipment cancelled successfully",
  "orderId": "64abc123...",
  "awbNo": "8918123456"
}
```

**Use Case:** Admin cancels shipment if needed

---

## 🔑 Error Codes Reference

| Code | HTTP | Meaning | Action |
|------|------|---------|--------|
| `VALIDATION_ERROR` | 400 | Missing required fields | Check request body |
| `ORDER_NOT_FOUND` | 404 | Order doesn't exist | Verify order ID |
| `ORDER_NOT_PAID` | 400 | Order not yet paid | Wait for payment |
| `ORDER_ALREADY_SHIPPED` | 400 | Order already shipped | Already processed |
| `ORDER_CANCELLED` | 400 | Order is cancelled | Can't process |
| `AWB_ALREADY_EXISTS` | 400 | AWB already generated | Already has tracking |
| `INCOMPLETE_ADDRESS` | 400 | Missing address details | Update address first |
| `NO_AWB` | 400 | Shipment not initiated | Generate AWB first |
| `BLUEDART_INSUFFICIENT_BALANCE` | 402 | Account has no balance | Contact Blue Dart |
| `BLUEDART_AUTH_ERROR` | 503 | Auth failed | Check credentials |
| `BLUEDART_UNAVAILABLE` | 503 | API is down | Retry later |
| `BLUEDART_ERROR` | 500 | Other BD error | Check logs |
| `INTERNAL_ERROR` | 500 | Server error | Check logs |

---

## 📱 Frontend Integration Examples

### React: Get Tracking
```javascript
// hooks/useTracking.js
import { useState, useEffect } from 'react';

export const useTracking = (orderId, token) => {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTracking = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = `/api/shipment/${orderId}/track${
        forceRefresh ? '?forceRefresh=true' : ''
      }`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setTracking(data);
    } catch (err) {
      setError(err.message);
      setTracking(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    if (orderId && token) {
      fetchTracking();
    }
  }, [orderId, token]);

  return {
    tracking,
    loading,
    error,
    refetch: () => fetchTracking(true),
  };
};
```

**Usage in Component:**
```javascript
// pages/TrackOrder.jsx
import { useTracking } from '@/hooks/useTracking';

export default function TrackOrder({ orderId, token }) {
  const { tracking, loading, error, refetch } = useTracking(orderId, token);

  if (loading) return <div>Loading tracking...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!tracking?.success) return <div>No tracking available</div>;

  const { tracking: trackData, dataSource } = tracking;

  return (
    <div className="tracking-container">
      <h2>Order {orderId}</h2>
      
      {/* Data source indicator */}
      <div className="data-source">
        {dataSource.isLive && <span className="badge live">Live Tracking</span>}
        {dataSource.isCached && <span className="badge cached">Cached Data</span>}
        {dataSource.unavailable && <span className="badge unavailable">No Data</span>}
      </div>

      {/* Tracking details */}
      {trackData ? (
        <div className="tracking-details">
          <div>Status: {trackData.status}</div>
          <div>Description: {trackData.description}</div>
          {trackData.location && (
            <div>Location: {trackData.location.city}, {trackData.location.state}</div>
          )}
          <div>Last Updated: {new Date(trackData.lastSyncedAt).toLocaleString()}</div>
        </div>
      ) : (
        <div className="no-tracking">Shipment not yet initiated</div>
      )}

      {/* Refresh button */}
      <button onClick={refetch} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh Tracking'}
      </button>
    </div>
  );
}
```

---

### Admin: Generate AWB
```javascript
// components/GenerateAWBModal.jsx
import { useState } from 'react';

export default function GenerateAWBModal({ orderId, token, onSuccess }) {
  const [formData, setFormData] = useState({
    consigneeName: '',
    consigneePhone: '',
    consigneeEmail: '',
    weight: '1',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/shipment/${orderId}/generate-awb`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.shippingError || data.message);
      }

      // Success
      alert(`AWB Generated: ${data.awbNo}`);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="awb-form">
      <input
        type="text"
        placeholder="Customer Name"
        value={formData.consigneeName}
        onChange={(e) => setFormData({
          ...formData,
          consigneeName: e.target.value
        })}
        required
      />
      
      <input
        type="tel"
        placeholder="Phone Number"
        value={formData.consigneePhone}
        onChange={(e) => setFormData({
          ...formData,
          consigneePhone: e.target.value
        })}
        required
      />
      
      <input
        type="email"
        placeholder="Email (optional)"
        value={formData.consigneeEmail}
        onChange={(e) => setFormData({
          ...formData,
          consigneeEmail: e.target.value
        })}
      />
      
      <input
        type="number"
        placeholder="Weight (kg)"
        value={formData.weight}
        onChange={(e) => setFormData({
          ...formData,
          weight: e.target.value
        })}
        step="0.1"
      />

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Generating...' : 'Generate AWB'}
      </button>
    </form>
  );
}
```

---

### Admin: List Pending Orders
```javascript
// hooks/usePendingShipments.js
import { useState, useEffect } from 'react';

export const usePendingShipments = (token, page = 1) => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/admin/shipment/pending?page=${page}&limit=20`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          }
        );

        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        setOrders(data.data);
        setPagination(data.pagination);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, page]);

  return { orders, pagination, loading, error };
};
```

**Component Usage:**
```javascript
// pages/AdminOrders.jsx
import { usePendingShipments } from '@/hooks/usePendingShipments';
import GenerateAWBModal from '@/components/GenerateAWBModal';

export default function AdminOrders({ token }) {
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const { orders, pagination, loading } = usePendingShipments(token, page);

  return (
    <div className="admin-orders">
      <h1>Pending Shipments</h1>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order._id.slice(0, 8)}...</td>
                  <td>{order.user?.name}</td>
                  <td>₹{order.totalPrice}</td>
                  <td>{order.shippingStatus}</td>
                  <td>
                    <button onClick={() => setSelectedOrder(order._id)}>
                      Generate AWB
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            {Array.from({ length: pagination?.pages || 0 }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={page === i + 1 ? 'active' : ''}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {selectedOrder && (
        <GenerateAWBModal
          orderId={selectedOrder}
          token={token}
          onSuccess={() => {
            setSelectedOrder(null);
            // Refresh list
          }}
        />
      )}
    </div>
  );
}
```

---

## ✅ Testing Checklist

Before deploying to production:

- [ ] GET `/api/shipment/:orderId` works
- [ ] GET `/api/shipment/:orderId/track` works
- [ ] GET `/api/shipment/:orderId/track?forceRefresh=true` works
- [ ] POST `/api/admin/shipment/:orderId/generate-awb` with admin token works
- [ ] POST `/api/admin/shipment/:orderId/generate-awb` with user token returns 403
- [ ] GET `/api/admin/shipment/pending` with admin token works
- [ ] Tracking shows cached data when Blue Dart is down
- [ ] Error messages are clear and actionable
- [ ] Admin can retry failed shipments
- [ ] Address can be updated before AWB
- [ ] AWB cannot be generated twice
- [ ] AWB cannot be generated for unpaid orders

---

## 🚀 Deployment Checklist

- [ ] All Blue Dart credentials in `.env`
- [ ] `NODE_ENV=production` set
- [ ] Background tracking sync will auto-start
- [ ] MongoDB indexes created
- [ ] CORS domain includes frontend URL
- [ ] JWT secret configured
- [ ] Error logging set up
- [ ] Database backups configured

**Status: All endpoints ready for frontend integration**
