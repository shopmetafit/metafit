# 🚀 Shipping Integration - Frontend Implementation

Everything is ready to use! Follow this guide to integrate shipping into your app.

---

## 📁 What's Been Created

### Hooks (3)
- `src/hooks/useTracking.js` - Fetch tracking data
- `src/hooks/usePendingShipments.js` - Fetch pending orders (admin)
- `src/hooks/useGenerateAWB.js` - Generate AWB (admin)

### Components (4)
- `src/components/Shipping/TrackingDisplay.jsx` - Show tracking info
- `src/components/Shipping/GenerateAWBModal.jsx` - Generate AWB form
- `src/components/Shipping/PendingOrdersList.jsx` - List pending orders
- `src/components/Shipping/ShippingDetails.jsx` - Show shipping details

### Pages (2)
- `src/pages/ShippingDashboard.jsx` - Admin dashboard
- `src/pages/TrackOrder.jsx` - User tracking page

### Styles
- CSS files for all components (responsive, mobile-friendly)

---

## 🎯 Integration Steps

### Step 1: Add Routes

Update your `App.jsx` or routing file:

```javascript
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ShippingDashboard from "./pages/ShippingDashboard";
import TrackOrder from "./pages/TrackOrder";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Your existing routes */}
        
        {/* Admin: Shipping dashboard */}
        <Route path="/admin/shipping" element={<ShippingDashboard />} />
        
        {/* User: Track order */}
        <Route path="/track/:orderId" element={<TrackOrder />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Step 2: Add Tracking Link to Order Detail Page

In your order detail component, add:

```javascript
import { TrackingDisplay, ShippingDetails } from "../components/Shipping";

export default function OrderDetail({ orderId, token }) {
  return (
    <div>
      {/* Your existing order details */}
      
      {/* Add tracking section */}
      <section className="tracking-section">
        <h2>Tracking</h2>
        <TrackingDisplay orderId={orderId} token={token} />
      </section>
      
      {/* Add shipping details section */}
      <section className="shipping-section">
        <h2>Shipping Details</h2>
        <ShippingDetails orderId={orderId} token={token} />
      </section>
    </div>
  );
}
```

### Step 3: Add Tracking Button to Order List

In your order list, add a tracking link:

```javascript
{order.awbNo && (
  <Link to={`/track/${order._id}`} className="btn-track">
    Track Order
  </Link>
)}
```

### Step 4: Add Admin Navigation

Update your admin menu to include:

```javascript
<nav className="admin-nav">
  {/* Your existing admin links */}
  
  {/* Add shipping link */}
  <Link to="/admin/shipping">Shipping Management</Link>
</nav>
```

---

## 📋 How to Use Each Component

### TrackingDisplay
Shows tracking info with live/cached indicator and refresh button.

```javascript
import { TrackingDisplay } from "../components/Shipping";

<TrackingDisplay orderId={orderId} token={token} />
```

**Props:**
- `orderId` (string, required) - The order ID
- `token` (string, required) - JWT token for authentication

---

### GenerateAWBModal
Modal form to generate AWB. Opens when admin clicks "Ship Order".

```javascript
import { GenerateAWBModal } from "../components/Shipping";

<GenerateAWBModal
  orderId={orderId}
  token={token}
  customerName="John Doe"
  customerPhone="9876543210"
  customerEmail="john@example.com"
  onSuccess={() => console.log("AWB generated!")}
  onCancel={() => console.log("Cancelled")}
/>
```

**Props:**
- `orderId` (string, required)
- `token` (string, required)
- `customerName` (string, optional) - Pre-fills name
- `customerPhone` (string, optional) - Pre-fills phone
- `customerEmail` (string, optional) - Pre-fills email
- `onSuccess` (function, optional) - Called after successful generation
- `onCancel` (function, optional) - Called when cancelled

---

### PendingOrdersList
Table of orders pending shipment with pagination.

```javascript
import { PendingOrdersList } from "../components/Shipping";

<PendingOrdersList token={token} onRefresh={() => console.log("Refreshed")} />
```

**Props:**
- `token` (string, required) - JWT token
- `onRefresh` (function, optional) - Called after AWB generation

---

### ShippingDetails
Shows shipping info and delivery address.

```javascript
import { ShippingDetails } from "../components/Shipping";

<ShippingDetails orderId={orderId} token={token} />
```

**Props:**
- `orderId` (string, required)
- `token` (string, required)

---

## 🎣 How to Use Each Hook

### useTracking
Fetches tracking data for an order.

```javascript
import { useTracking } from "../hooks/useTracking";

const { tracking, loading, error, forceRefresh } = useTracking(orderId, token);

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;

return (
  <div>
    <p>Status: {tracking.shippingStatus}</p>
    <button onClick={forceRefresh}>Refresh</button>
  </div>
);
```

**Returns:**
- `tracking` - Tracking data object
- `loading` - Loading state
- `error` - Error message
- `refetch()` - Function to manually fetch
- `forceRefresh()` - Function to force refresh from Blue Dart

---

### usePendingShipments
Fetches list of orders pending shipment (admin only).

```javascript
import { usePendingShipments } from "../hooks/usePendingShipments";

const [page, setPage] = useState(1);
const { orders, pagination, loading, error } = usePendingShipments(token, page);

return (
  <div>
    {orders.map(order => (
      <div key={order._id}>{order._id}</div>
    ))}
    
    {/* Pagination */}
    <button onClick={() => setPage(page - 1)}>Previous</button>
    <button onClick={() => setPage(page + 1)}>Next</button>
  </div>
);
```

**Returns:**
- `orders` - Array of order objects
- `pagination` - Pagination info {total, page, limit, pages}
- `loading` - Loading state
- `error` - Error message

---

### useGenerateAWB
Generates AWB for an order (admin only).

```javascript
import { useGenerateAWB } from "../hooks/useGenerateAWB";

const { generateAWB, retry, loading, error, success } = useGenerateAWB(token);

const handleSubmit = async (formData) => {
  try {
    const result = await generateAWB(orderId, formData);
    console.log("AWB:", result.awbNo);
  } catch (err) {
    console.error("Failed:", err);
  }
};
```

**Methods:**
- `generateAWB(orderId, formData)` - Generate new AWB
- `retry(orderId, formData)` - Retry failed generation

**Returns:**
- `loading` - Loading state
- `error` - Error message
- `success` - Success info {awbNo, message}

---

## 📱 Responsive Design

All components are fully responsive:
- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)
- ✅ Mobile (< 768px)

CSS is optimized for mobile with:
- Touch-friendly buttons
- Readable font sizes
- Proper spacing
- Horizontal scroll on tables

---

## 🎨 Styling

All components use a clean, professional design:
- Blue primary color (#007bff)
- Clean white backgrounds
- Proper spacing and padding
- Smooth transitions
- Clear visual hierarchy

To customize colors, update the CSS files:
```css
.btn-primary {
  background: #007bff;  /* Change this */
}
```

---

## 🔒 Authentication

All hooks expect a JWT token. Get it from your auth system:

```javascript
const token = localStorage.getItem("token");
// or
const token = useAuth().token;
```

---

## 🧪 Testing

Test each component:

```javascript
// Test TrackingDisplay
<TrackingDisplay
  orderId="64abc123def456"
  token="your_jwt_token"
/>

// Test GenerateAWBModal
<GenerateAWBModal
  orderId="64abc123def456"
  token="your_jwt_token"
  customerName="Test User"
  customerPhone="9876543210"
  onSuccess={() => alert("Success!")}
  onCancel={() => alert("Cancelled")}
/>

// Test PendingOrdersList
<PendingOrdersList token="your_jwt_token" />

// Test ShippingDetails
<ShippingDetails
  orderId="64abc123def456"
  token="your_jwt_token"
/>
```

---

## ✅ Checklist

- [ ] Created `src/hooks/` directory
- [ ] Created `src/components/Shipping/` directory
- [ ] Added hooks
- [ ] Added components
- [ ] Added pages
- [ ] Updated routing
- [ ] Added tracking link to order detail
- [ ] Added admin navigation
- [ ] Tested all components
- [ ] Styled to match your design
- [ ] Mobile responsive

---

## 🚀 You're Ready!

Everything is built and ready to integrate. Just:

1. Copy the code above
2. Add routes
3. Update your pages
4. Test
5. Deploy!

---

## 📞 Need Help?

Check the backend documentation:
- `STEP_4_FRONTEND_API.md` - API reference
- `QUICK_REFERENCE.md` - API cheat sheet
- Component comments in the code

---

**All set! Happy shipping! 🚀**
