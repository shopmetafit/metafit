# 📋 Frontend Team - Integration Tasks

## Overview

Backend is complete. Frontend team needs to integrate these endpoints into the UI.

---

## 🎯 Your Tasks (Step 5)

### A. User Pages (Customer Facing)

#### 1. **Order Detail Page**
Show shipping information when order is shipped.

**Endpoint:** `GET /api/shipment/:orderId`

**Display:**
```
┌─────────────────────────────────────────┐
│ Order #123456                           │
├─────────────────────────────────────────┤
│ Courier:     Blue Dart                  │
│ AWB Number:  8918123456                 │
│ Status:      Shipped                    │
│ Generated:   23 Jan, 2026 12:30 PM      │
│                                         │
│ [Track Order Button]                    │
└─────────────────────────────────────────┘
```

**What to show:**
- `awbNo` - The tracking number
- `shippingStatus` - Current status
- `bluedartGeneratedAt` - When shipped
- Link to tracking page

---

#### 2. **Tracking Page**
Detailed tracking with live updates.

**Endpoint:** `GET /api/shipment/:orderId/track[?forceRefresh=true]`

**Display:**
```
┌─────────────────────────────────────────┐
│ Track Your Order                        │
│ AWB: 8918123456                         │
├─────────────────────────────────────────┤
│ 
│ ● Shipped (Jan 23)
│   Order placed and paid
│
│ ● In Transit (Jan 24)
│   Package left warehouse
│
│ ● Out for Delivery (Jan 24) ← Current
│   Out for delivery to you
│
│ ○ Delivered (Pending)
│   Delivery pending
│
├─────────────────────────────────────────┤
│ Last Updated: Jan 24, 10:35 AM          │
│ Data: Cached (offline)                  │
│ [Refresh Tracking]                      │
└─────────────────────────────────────────┘
```

**What to show:**
- `tracking.status` - Current status
- `tracking.description` - What's happening
- `tracking.location` - City/State
- `tracking.eventDate` - When it happened
- `dataSource.isCached` / `isLive` - Data source
- Refresh button → uses `?forceRefresh=true`

---

### B. Admin Pages (Internal)

#### 1. **Pending Shipments Dashboard**
List orders waiting to be shipped.

**Endpoint:** `GET /api/admin/shipment/pending?page=1&limit=20`

**Display:**
```
┌─────────────────────────────────────────────────────┐
│ Pending Shipments                                   │
├──────┬───────────┬────────┬──────────┬──────────────┤
│ ID   │ Customer  │ Amount │ Status   │ Action       │
├──────┼───────────┼────────┼──────────┼──────────────┤
│ 1234 │ John Doe  │ ₹1998  │ Pending  │ Ship Order   │
│ 1235 │ Jane Doe  │ ₹2500  │ Pending  │ Ship Order   │
│ 1236 │ Bob Smith │ ₹999   │ Pending  │ Ship Order   │
└──────┴───────────┴────────┴──────────┴──────────────┘

Page 1 of 3  [< Previous] [1] [2] [3] [Next >]
```

**What to show:**
- Order ID
- Customer name + phone
- Total price
- Shipping status
- "Ship Order" button

---

#### 2. **Generate AWB Modal**
When admin clicks "Ship Order".

**Endpoint:** `POST /api/admin/shipment/:orderId/generate-awb`

**Display:**
```
┌─────────────────────────────────────────┐
│ Generate Shipping                       │
├─────────────────────────────────────────┤
│                                         │
│ Customer Name: [_________________]     │
│                                         │
│ Phone Number: [_________________]      │
│                                         │
│ Email:        [_________________]      │
│                                         │
│ Weight (kg):  [_____]                  │
│                                         │
│ [Cancel]  [Generate Shipping]          │
│                                         │
└─────────────────────────────────────────┘
```

**On Success:**
```
✅ AWB Generated: 8918123456
Order marked as Shipped
```

**On Error:**
```
❌ Insufficient Blue Dart Balance
Try again later or contact support
[Retry] [Cancel]
```

---

#### 3. **Order Shipping Details**
Click order to see details.

**Endpoint:** `GET /api/admin/shipment/:orderId`

**Display:**
```
┌─────────────────────────────────────────┐
│ Order Shipping Details                  │
│ Order ID: 64abc123...                   │
├─────────────────────────────────────────┤
│ Courier:         Blue Dart              │
│ AWB Number:      8918123456             │
│ Status:          Shipped                │
│ Shipping Status: In-Transit             │
│ Generated:       23 Jan, 12:30 PM       │
│ Address:         123 Street, Mumbai     │
│                                         │
│ [View Error]  [Track]  [Cancel]        │
└─────────────────────────────────────────┘
```

---

#### 4. **View Error & Troubleshoot**
When shipment fails.

**Endpoint:** `GET /api/admin/shipment/:orderId/error`

**Display:**
```
┌─────────────────────────────────────────┐
│ Shipping Error Details                  │
├─────────────────────────────────────────┤
│ Status:  FAILED                         │
│ Error:   Insufficient Blue Dart         │
│          Account Balance                │
│                                         │
│ Actions:                                │
│ - Add balance to Blue Dart account      │
│ - Contact Blue Dart support             │
│ - [Retry]                               │
│                                         │
│ Can Retry: YES                          │
│ [Retry with Same Details]               │
│ [Update Address & Retry]                │
│                                         │
└─────────────────────────────────────────┘
```

---

#### 5. **Update Address**
Correct address before shipping.

**Endpoint:** `PUT /api/admin/shipment/:orderId/address`

**Display:**
```
┌─────────────────────────────────────────┐
│ Update Shipping Address                 │
├─────────────────────────────────────────┤
│ Address:     [_____________________]   │
│ City:        [_____________________]   │
│ Postal Code: [_____________________]   │
│ State:       [_____________________]   │
│ Country:     [IN_______________]       │
│                                         │
│ [Cancel]  [Update Address]             │
└─────────────────────────────────────────┘
```

**Restrictions:**
- ❌ Cannot update after AWB generated
- ✅ Only for "Processing" status orders

---

#### 6. **Retry Failed Shipment**
When shipment generation fails.

**Endpoint:** `POST /api/admin/shipment/:orderId/retry`

**Flow:**
```
1. User sees error
2. User clicks "Retry"
3. Show same modal as Generate AWB
4. But with option to change details
5. Submit retry
```

---

### C. React Hooks to Create

#### 1. **useTracking**
```javascript
// hooks/useTracking.js
export const useTracking = (orderId, token) => {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTracking = async (forceRefresh = false) => { ... };
  
  useEffect(() => { ... }, [orderId, token]);

  return { tracking, loading, error, refetch: () => fetchTracking(true) };
};
```

**Usage:**
```javascript
const { tracking, loading, error, refetch } = useTracking(orderId, token);
```

---

#### 2. **usePendingShipments**
```javascript
// hooks/usePendingShipments.js
export const usePendingShipments = (token, page = 1) => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch on mount and when page changes
  useEffect(() => { ... }, [token, page]);

  return { orders, pagination, loading, error };
};
```

**Usage:**
```javascript
const { orders, pagination, loading } = usePendingShipments(token, page);
```

---

#### 3. **useGenerateAWB**
```javascript
// hooks/useGenerateAWB.js
export const useGenerateAWB = (orderId, token) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async (formData) => {
    // POST to /api/admin/shipment/:orderId/generate-awb
  };

  return { generate, loading, error };
};
```

---

### D. Components to Create

#### 1. **TrackingDisplay**
Shows tracking info with data source indicator.

**Props:**
```javascript
{
  tracking: Object,    // From useTracking
  loading: Boolean,
  error: String,
  onRefresh: Function
}
```

---

#### 2. **PendingOrdersList**
Table of orders awaiting shipment.

**Props:**
```javascript
{
  orders: Array,
  pagination: Object,
  onShipClick: Function(orderId)
}
```

---

#### 3. **GenerateAWBModal**
Form to generate AWB.

**Props:**
```javascript
{
  orderId: String,
  token: String,
  onSuccess: Function,
  onCancel: Function
}
```

---

#### 4. **ShippingDetails**
Display shipping info.

**Props:**
```javascript
{
  orderId: String,
  token: String
}
```

---

### E. Integration Points

#### 1. **In Checkout Success**
After payment succeeds:
```javascript
// Order created
// Show success message
// Redirect to order detail page
// (Don't auto-generate AWB - admin does it)
```

#### 2. **In Order List**
Add "Track" link to orders with awbNo:
```javascript
{order.awbNo && <a href={`/track/${order._id}`}>Track Order</a>}
```

#### 3. **In Admin Dashboard**
Add "Pending Shipments" section:
```javascript
<PendingShipmentsDashboard token={adminToken} />
```

---

## 📋 Implementation Checklist

### User-Facing
- [ ] Order detail page shows shipping info
- [ ] Tracking page implemented
- [ ] Tracking page shows status timeline
- [ ] Refresh button works
- [ ] Data source indicator shown (live/cached)
- [ ] Error states handled
- [ ] Loading states shown
- [ ] Empty states handled
- [ ] Mobile responsive

### Admin-Facing
- [ ] Pending shipments list
- [ ] Pagination works
- [ ] Ship Order button opens modal
- [ ] Generate AWB modal with form validation
- [ ] Error handling shows specific errors
- [ ] View Details link works
- [ ] View Error link works
- [ ] Retry button works
- [ ] Update Address form works
- [ ] Mobile responsive

### Hooks
- [ ] useTracking hook works
- [ ] usePendingShipments hook works
- [ ] useGenerateAWB hook works
- [ ] Error handling in hooks
- [ ] Loading states in hooks

### Error Handling
- [ ] Show error messages from backend
- [ ] Handle 403 (not admin) gracefully
- [ ] Handle 404 (order not found)
- [ ] Handle 400 (validation errors)
- [ ] Handle 503 (Blue Dart down)
- [ ] Handle network errors
- [ ] Suggest actions for each error

### Testing
- [ ] Test flow: Create order → Pay → Ship → Track
- [ ] Test with Order Status (Processing, Shipped, Delivered)
- [ ] Test with Shipping Status (Pending, In-Transit, Delivered, FAILED)
- [ ] Test retry on failure
- [ ] Test address update
- [ ] Test tracking with and without live data
- [ ] Test on mobile
- [ ] Test loading states
- [ ] Test error states

---

## 🔍 Data You'll Receive

### From `/api/shipment/:orderId/track`
```javascript
{
  awbNo: "8918123456",
  shippingStatus: "In-Transit",
  tracking: {
    status: "Out for Delivery",
    description: "Package out for delivery",
    location: { city: "Mumbai", state: "MH" },
    eventDate: "2026-01-24T10:30:00Z",
    lastSyncedAt: "2026-01-24T10:35:00Z"
  },
  dataSource: {
    isLive: false,
    isCached: true,
    unavailable: false
  }
}
```

### From `/api/admin/shipment/pending`
```javascript
[
  {
    _id: "order123",
    status: "Processing",
    totalPrice: 1998,
    shippingStatus: "Pending",
    user: {
      name: "John Doe",
      email: "john@example.com",
      phone: "9876543210"
    },
    shippingAddress: { ... },
    orderItems: [ ... ]
  }
]
```

---

## 🚀 Ready to Start?

1. **Read docs:**
   - `STEP_4_FRONTEND_API.md` - Complete API reference
   - `QUICK_REFERENCE.md` - Quick lookup

2. **Set up hooks:**
   - useTracking.js
   - usePendingShipments.js
   - useGenerateAWB.js

3. **Build components:**
   - TrackingDisplay
   - PendingOrdersList
   - GenerateAWBModal

4. **Integrate pages:**
   - Order detail
   - Tracking page
   - Admin dashboard

5. **Test everything:**
   - Use TEST_WITH_CURL.sh to create test orders
   - Test each flow thoroughly
   - Fix edge cases

---

## 💡 Pro Tips

1. **Always check `dataSource` indicator:**
   - If `isCached: true`, show "Last updated X minutes ago"
   - If `isLive: true`, show "Live tracking"
   - If `unavailable: true`, show "Tracking not available yet"

2. **Use error codes to guide users:**
   - `ORDER_NOT_PAID` → "Please complete payment first"
   - `BLUEDART_INSUFFICIENT_BALANCE` → "Admin needs to add balance"
   - `AWB_ALREADY_EXISTS` → "Order already has tracking number"

3. **Optional force refresh:**
   - Only show "Refresh" button to admin or on explicit request
   - Use `?forceRefresh=true` for manual refresh
   - Don't force refresh on every page load (saves API calls)

4. **Admin workflow is strict:**
   - Must exist: Order, Payment
   - Optional: Address update
   - Then: Generate AWB
   - Then: Can view error, retry, cancel

5. **Graceful degradation:**
   - If Blue Dart is down, show cached data
   - Tell user when last update was
   - Let them retry when service is back

---

## 📞 Questions?

- **API unclear?** → Check `STEP_4_FRONTEND_API.md`
- **Error code meaning?** → Check `QUICK_REFERENCE.md`
- **Architecture?** → Check `COMPLETE_IMPLEMENTATION_SUMMARY.md`
- **Step-by-step?** → Check `STEP_1`, `STEP_2`, `STEP_3` docs

---

**Backend is production-ready. Let's build a great frontend! 🚀**
