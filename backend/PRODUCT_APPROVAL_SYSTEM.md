# Product Approval System - Step 3

## Overview
Multi-vendor marketplace with admin product approval system. Products created by vendors must be approved by admin before being published.

---

## Updated Product Schema

### New Fields Added to Product Model

```javascript
// Vendor/Creator Reference
vendorId: ObjectId               // Vendor who created product
createdBy: "ADMIN" | "VENDOR"    // Who created it
user: ObjectId                   // Original user reference (kept for backward compatibility)

// Approval Workflow
productApprovalStatus: "pending" | "approved" | "rejected"
approvedBy: ObjectId             // Admin who approved
approvedAt: Date                 // When it was approved
rejectionReason: String          // Why it was rejected

// Display Control
isPublished: Boolean              // Visible to customers only if approved
```

---

## Product Lifecycle

### 1. Vendor Creates Product
```
Vendor creates product → createdBy: "VENDOR"
                      → vendorId: vendor_user_id
                      → productApprovalStatus: "pending"
                      → isPublished: false (hidden from customers)
```

### 2. Admin Reviews
```
Admin views pending products → GET /api/admin/products/pending

Options:
a) Approve  → productApprovalStatus: "approved"
           → isPublished: true (visible to customers)
           → approvedBy: admin_user_id
           → approvedAt: Date.now()

b) Reject   → productApprovalStatus: "rejected"
           → isPublished: false (hidden)
           → rejectionReason: "..."
```

### 3. Customer Views Products
```
Customers see only: isPublished: true AND productApprovalStatus: "approved"
```

---

## Admin Product Approval APIs

### Get All Pending Products
```bash
GET /api/admin/products/pending
Authorization: Bearer <admin_token>

Query Parameters:
- status: "pending" | "approved" | "rejected" (optional)

Response:
{
  "count": 5,
  "products": [
    {
      "_id": "...",
      "name": "Protein Bar",
      "vendorId": {
        "_id": "...",
        "name": "John Doe",
        "vendorName": "Fitnes Supplies Inc"
      },
      "productApprovalStatus": "pending",
      "createdBy": "VENDOR",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Approve Single Product
```bash
PUT /api/admin/products/:productId/approve
Authorization: Bearer <admin_token>

Response:
{
  "message": "Product approved successfully",
  "product": {
    "_id": "...",
    "productApprovalStatus": "approved",
    "isPublished": true,
    "approvedBy": "<admin_id>",
    "approvedAt": "2024-01-15T11:00:00Z"
  }
}
```

### Reject Single Product
```bash
PUT /api/admin/products/:productId/reject
Authorization: Bearer <admin_token>

Body:
{
  "rejectionReason": "Images are low quality. Please resubmit with better quality."
}

Response:
{
  "message": "Product rejected",
  "product": {
    "productApprovalStatus": "rejected",
    "isPublished": false,
    "rejectionReason": "Images are low quality..."
  }
}
```

### Bulk Approve Products
```bash
PUT /api/admin/products/bulk/approve
Authorization: Bearer <admin_token>

Body:
{
  "productIds": ["id1", "id2", "id3"]
}

Response:
{
  "message": "3 products approved",
  "modifiedCount": 3
}
```

### Get Vendor's Products (Admin View)
```bash
GET /api/admin/vendors/:vendorId/products
Authorization: Bearer <admin_token>

Query Parameters:
- status: "pending" | "approved" | "rejected" (optional)

Response:
{
  "total": 10,
  "approved": 7,
  "pending": 2,
  "rejected": 1,
  "products": [...]
}
```

### Get Approval Stats Dashboard
```bash
GET /api/admin/products/approval/stats
Authorization: Bearer <admin_token>

Response:
{
  "totalVendorProducts": 50,
  "pendingApproval": 5,
  "approvedProducts": 40,
  "rejectedProducts": 5
}
```

---

## Vendor Product Controller

### Create Product (Vendor)
```javascript
// Automatically sets:
createdBy: "VENDOR"
vendorId: req.user._id
productApprovalStatus: "pending"
isPublished: false
```

### Get Vendor's Products (Vendor Dashboard)
```bash
GET /api/vendor/products
Authorization: Bearer <vendor_token>

Response shows all vendor's products with approval status:
{
  "count": 3,
  "products": [
    {
      "name": "Protein Bar",
      "productApprovalStatus": "pending",    // Not approved yet
      "isPublished": false
    },
    {
      "name": "Whey Protein",
      "productApprovalStatus": "approved",   // Live
      "isPublished": true
    }
  ]
}
```

### Update Product (Vendor)
- Vendor can update products anytime
- Changes to approved products: `productApprovalStatus` resets to "pending"
- Admin must re-approve changes

---

## Database Queries

### Filter Products by Approval Status

```javascript
// Get all approved products (for customers)
Product.find({
  productApprovalStatus: "approved",
  isPublished: true
})

// Get all pending vendor products (for admin)
Product.find({
  createdBy: "VENDOR",
  productApprovalStatus: "pending"
})

// Get all products by specific vendor
Product.find({
  vendorId: vendor_user_id
})

// Get vendor's pending products
Product.find({
  vendorId: vendor_user_id,
  productApprovalStatus: "pending"
})

// Get rejected products
Product.find({
  productApprovalStatus: "rejected"
})
```

---

## Admin Dashboard Data Flow

### 1. Approval Queue Widget
```
GET /api/admin/products/approval/stats
→ Show: "5 pending | 40 approved | 2 rejected"
```

### 2. Pending Products List
```
GET /api/admin/products/pending
→ Show: Product cards with vendor info, created date
→ Actions: Approve | Reject | View Details
```

### 3. Vendor Inspection
```
GET /api/admin/vendors/:vendorId/products
→ Show: Vendor's products breakdown (approved/pending/rejected)
```

### 4. Bulk Actions
```
POST /api/admin/products/bulk/approve
→ Select multiple → Approve all at once
```

---

## Key Features

✅ **Vendor Isolation**
- Vendors only see/manage their own products
- `vendorId` explicitly links product to vendor

✅ **Approval Workflow**
- Products start in "pending" state
- Admin can approve or reject with reason
- Rejected products can be resubmitted

✅ **Customer View**
- Only approved & published products visible
- Filter: `isPublished: true && productApprovalStatus: "approved"`

✅ **Admin Control**
- Complete visibility of all vendor products
- Bulk approval for efficiency
- Rejection reasons tracked

✅ **Audit Trail**
- `approvedBy` - tracks which admin approved
- `approvedAt` - timestamp of approval
- `rejectionReason` - why product was rejected

---

## Implementation Checklist

- ✅ Product schema updated with approval fields
- ✅ Vendor product controller sets correct fields
- ✅ Product approval controller created
- ✅ Admin routes for approval workflow
- ✅ Get pending products endpoint
- ✅ Approve/reject single product
- ✅ Bulk approve endpoint
- ✅ Approval stats dashboard
- ✅ Vendor product filtering by status

---

## Example: Complete Flow

### Step 1: Vendor Creates Product
```bash
POST /api/vendor/products
{
  "name": "Protein Bar",
  "price": 299,
  ...
}

Database stores:
{
  name: "Protein Bar",
  vendorId: "vendor_123",
  createdBy: "VENDOR",
  productApprovalStatus: "pending",
  isPublished: false
}
```

### Step 2: Admin Reviews
```bash
GET /api/admin/products/pending
→ Shows "Protein Bar" in review queue
```

### Step 3: Admin Approves
```bash
PUT /api/admin/products/product_id/approve

Database updates to:
{
  productApprovalStatus: "approved",
  approvedBy: "admin_456",
  approvedAt: "2024-01-15T12:00:00Z",
  isPublished: true
}
```

### Step 4: Customer Sees It
```bash
GET /api/products
→ "Protein Bar" now visible in public catalog
```

---

## Security Notes

✅ Only admins can approve/reject products
✅ Only vendors can see their own product status
✅ Customers see only approved products
✅ Vendor cannot change productApprovalStatus
✅ Rejection reason visible to vendor (for improvement)

---

## Next Steps

1. **Frontend**: Vendor dashboard showing product approval status
2. **Frontend**: Admin panel for product approval queue
3. **Email Notifications**: Notify vendors of approval/rejection
4. **Product Metrics**: Track approval rate, average approval time
5. **Commission Calculation**: Factor in approved product count
