# Vendor Onboarding Implementation

## Overview
Multi-vendor marketplace setup with vendor registration, admin approval, and vendor-specific product management.

---

## Step 1: RBAC (Role-Based Access Control)

### User Model Updates (models/User.js)
- **Added role enum**: `"customer" | "admin" | "vendor"`
- **Added vendor fields**:
  - `vendorName` - Shop/Brand name
  - `vendorDescription` - Vendor bio
  - `vendorLogo` - Logo URL
  - `vendorBanner` - Banner image
  - `isApproved` - Admin approval status
  - `commissionRate` - Commission percentage (default 10%)
  - `bankDetails` - Bank account info

### Auth Middleware Updates (middleware/authMiddleware.js)
- **`vendor()`** - Checks if user role is "vendor"
- **`authorize(...roles)`** - Flexible RBAC middleware
  - Usage: `authorize("vendor", "admin")` - allows multiple roles

---

## Step 2: Vendor Onboarding

### Vendor Model (models/Vendor.js)
Complete vendor profile with required fields:
- Company details (name, GST, PAN)
- Bank details (account name, number, bank name, IFSC)
- Pickup address (street, city, state, pincode)
- Contact person details
- Commission rate
- Approval status (pending, approved, rejected, suspended)

### Vendor Controller (controllers/vendorController.js)

#### Public Routes
```
GET /api/vendors/details/:vendorId - Get vendor public profile
```

#### Vendor Routes (Protected)
```
POST /api/vendors/register - Register as vendor
GET /api/vendors/profile - Get vendor's own profile
PUT /api/vendors/profile - Update vendor profile
```

#### Admin Routes
```
GET /api/vendors - Get all vendors (filter by status)
PUT /api/vendors/:vendorId/approve - Approve vendor (set commissionRate)
PUT /api/vendors/:vendorId/reject - Reject vendor (with reason)
```

### Vendor Registration Flow
1. Customer clicks "Register as Vendor"
2. Fills form:
   - Company name
   - GST Number (15 digits)
   - PAN Number (10 chars: AAAAA0000A)
   - Bank details
   - Pickup address
   - Contact person
3. Status: `pending` → Admin reviews
4. Admin approves → Status: `approved` → Vendor can add products
5. If rejected → Status: `rejected` → Vendor cannot add products

---

## Step 3: Vendor Product Management

### Vendor Product Controller (controllers/vendorProductController.js)

#### Key Features
- ✅ Vendors can ONLY manage their own products
- ✅ Vendor must be approved before adding products
- ✅ Products created as `isPublished: false` (need admin approval)
- ✅ Vendors can edit/update stock and price
- ✅ Vendors cannot delete approved products (admin only)

#### Vendor Product Routes
```
POST /api/vendor/products - Create product
GET /api/vendor/products - Get vendor's products
PUT /api/vendor/products/:productId - Update product
DELETE /api/vendor/products/:productId - Delete product
GET /api/vendor/products/stats - Get vendor dashboard stats
```

### Approval Check
```javascript
// checkVendorApproval() - ensures vendor is approved
// Throws: "Your vendor account is not approved yet"
```

---

## API Endpoints Summary

### Vendor Registration & Profile
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/vendors/register` | `protect` | Register as vendor |
| GET | `/api/vendors/profile` | `protect, vendor` | Get own profile |
| PUT | `/api/vendors/profile` | `protect, vendor` | Update profile |
| GET | `/api/vendors/details/:id` | Public | View vendor public profile |

### Admin Vendor Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/vendors` | `protect, admin` | List all vendors |
| PUT | `/api/vendors/:id/approve` | `protect, admin` | Approve vendor |
| PUT | `/api/vendors/:id/reject` | `protect, admin` | Reject vendor |

### Vendor Product Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/vendor/products` | `protect, vendor` | Create product |
| GET | `/api/vendor/products` | `protect, vendor` | Get vendor's products |
| PUT | `/api/vendor/products/:id` | `protect, vendor` | Update product |
| DELETE | `/api/vendor/products/:id` | `protect, vendor` | Delete product |
| GET | `/api/vendor/products/stats` | `protect, vendor` | Get stats |

---

## Request/Response Examples

### Register as Vendor
```bash
POST /api/vendors/register
Authorization: Bearer <token>

{
  "companyName": "Fresh Foods Inc",
  "gstNo": "27AABCT6055K1Z0",
  "panNo": "AAAPK1234A",
  "businessDescription": "Organic food supplier",
  "bankDetails": {
    "accountName": "Fresh Foods Inc",
    "accountNumber": "1234567890",
    "bankName": "HDFC Bank",
    "ifscCode": "HDFC0001234"
  },
  "pickupAddress": {
    "street": "123 Market St",
    "city": "Delhi",
    "state": "Delhi",
    "pincode": "110001"
  },
  "contactPerson": {
    "name": "John Doe",
    "phone": "+91-9999999999",
    "email": "john@freshfoods.com"
  }
}

Response:
{
  "message": "Vendor registration submitted. Awaiting admin approval.",
  "vendor": {
    "_id": "...",
    "userId": "...",
    "companyName": "Fresh Foods Inc",
    "status": "pending",
    "isApproved": false,
    "createdAt": "..."
  }
}
```

### Admin Approve Vendor
```bash
PUT /api/vendors/:vendorId/approve
Authorization: Bearer <admin_token>

{
  "commissionRate": 15
}

Response:
{
  "message": "Vendor approved successfully",
  "vendor": {
    "status": "approved",
    "isApproved": true,
    "commissionRate": 15,
    "approvedAt": "..."
  }
}
```

### Create Product (Vendor)
```bash
POST /api/vendor/products
Authorization: Bearer <vendor_token>

{
  "name": "Organic Tomatoes",
  "description": "Fresh organic tomatoes",
  "price": 50,
  "countInStock": 100,
  "sku": "ORG-TOMATO-001",
  "category": "Vegetables",
  "brand": "Fresh Foods Inc",
  "collection": "Organic",
  "gender": "Unisex"
}

Response:
{
  "message": "Product created. Awaiting admin approval for publishing.",
  "product": {
    "_id": "...",
    "user": "<vendor_id>",
    "isPublished": false,
    ...
  }
}
```

---

## Database Schema Reference

### Vendor Collection
```javascript
{
  userId: ObjectId,        // Reference to User
  companyName: String,
  gstNo: String (unique),
  panNo: String (unique),
  businessDescription: String,
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String
  },
  pickupAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String (default: "India")
  },
  contactPerson: {
    name: String,
    phone: String,
    email: String
  },
  isApproved: Boolean (default: false),
  rejectionReason: String,
  approvedAt: Date,
  commissionRate: Number (default: 10),
  status: "pending" | "approved" | "rejected" | "suspended",
  createdAt: Date,
  updatedAt: Date
}
```

---

## Security Features

✅ **Vendor Isolation**
- Vendors can only view/edit their own products
- API checks `product.user === req.user._id`

✅ **Approval Gate**
- Products cannot be created without vendor approval
- Admin must explicitly approve vendors

✅ **Role-Based Access**
- `authorize("vendor")` - vendor-only routes
- `authorize("admin")` - admin-only routes
- `authorize("vendor", "admin")` - both roles

✅ **Data Validation**
- GST: 15-digit format validation
- PAN: 10-character format validation (AAAAA0000A)
- IFSC: Converted to uppercase
- Email: Standard email validation

---

## Next Steps

1. **Frontend**: Create vendor registration form
2. **Admin Panel**: Create vendor approval dashboard
3. **Product Publishing**: Admin product approval system
4. **Commission Calculation**: Calculate commissions in order settlement
5. **Vendor Payments**: Automated payout system
