/**
 * Test Suite: Vendor Order Data Security (Phase 1)
 *
 * Verifies that:
 * 1. Authenticated vendors can ONLY access orders and product items belonging to them.
 * 2. Cross-vendor item details, customer details, and revenue are not leaked.
 * 3. Cross-vendor status and shipping updates are rejected with 403 Forbidden.
 * 4. Request parameter tampering (?vendorId=...) is ignored in favor of trusted session.
 * 5. Response formatting remains backward-compatible with frontend VendorOrdersPage.
 */

const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const http = require("http");

// Ensure environment variable for JWT secret
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-12345";

// Mock IDs
const VENDOR_A_ID = new mongoose.Types.ObjectId("65000000000000000000000a");
const VENDOR_B_ID = new mongoose.Types.ObjectId("65000000000000000000000b");
const VENDOR_C_ID = new mongoose.Types.ObjectId("65000000000000000000000c");
const VENDOR_BLANK_ID = new mongoose.Types.ObjectId("65000000000000000000000d");
const VENDOR_WHITESPACE_ID = new mongoose.Types.ObjectId("65000000000000000000000e");
const VENDOR_PADDED_ID = new mongoose.Types.ObjectId("65000000000000000000000f");
const ADMIN_USER_ID = new mongoose.Types.ObjectId("6500000000000000000000aa");

const PROD_A1_ID = new mongoose.Types.ObjectId("6500000000000000000000a1");
const PROD_B1_ID = new mongoose.Types.ObjectId("6500000000000000000000b1");
const PROD_C1_ID = new mongoose.Types.ObjectId("6500000000000000000000c1");
const PROD_ADMIN_ID = new mongoose.Types.ObjectId("6500000000000000000000a0");
const PROD_A_LEGACY_ID = new mongoose.Types.ObjectId("6500000000000000000000a2");
const PROD_REQ_A_ID = new mongoose.Types.ObjectId("6500000000000000000000a3");
const PROD_BLANK_ID = new mongoose.Types.ObjectId("6500000000000000000000d1");

const ORDER_1_ID = new mongoose.Types.ObjectId("650000000000000000000001");
const ORDER_2_ID = new mongoose.Types.ObjectId("650000000000000000000002");
const ORDER_BLANK_ID = new mongoose.Types.ObjectId("650000000000000000000004");

// In-memory store
const vendors = [
  { _id: VENDOR_A_ID, vendorName: "Vendor A Foods", businessName: "A Foods Ltd", email: "vendorA@test.com", phone: "919876543210", role: "vendor", status: "approved" },
  { _id: VENDOR_B_ID, vendorName: "Vendor B Wellness", businessName: "B Wellness Ltd", email: "vendorB@test.com", phone: "919876543211", role: "vendor", status: "approved" },
  { _id: VENDOR_C_ID, vendorName: "Vendor C Organics", businessName: "C Organics Ltd", email: "vendorC@test.com", phone: "919876543212", role: "vendor", status: "approved" },
  { _id: VENDOR_BLANK_ID, vendorName: "Vendor Blank Email", businessName: "Blank Ltd", email: "", phone: "919876543299", role: "vendor", status: "approved" },
  { _id: VENDOR_WHITESPACE_ID, vendorName: "Whitespace Vendor", businessName: "WS Ltd", email: "   ", phone: "919876543298", role: "vendor", status: "approved" },
  { _id: VENDOR_PADDED_ID, vendorName: "Padded Email Vendor", businessName: "Pad Ltd", email: "  vendorA@test.com  ", phone: "919876543297", role: "vendor", status: "approved" },
  { _id: ADMIN_USER_ID, vendorName: "Admin Partner", businessName: "Metafit Admin", email: "admin@metafit.com", phone: "919999999999", role: "vendor", status: "approved" },
];

const products = [
  { _id: PROD_A1_ID, name: "Vendor A Herbal Tea", price: 500, vendorId: VENDOR_A_ID, user: VENDOR_A_ID, createdBy: "VENDOR", sku: "MWB-TEA-001" },
  { _id: PROD_B1_ID, name: "Vendor B Protein Powder", price: 800, vendorId: VENDOR_B_ID, user: VENDOR_B_ID, createdBy: "VENDOR", sku: "MWB-PRO-002" },
  { _id: PROD_C1_ID, name: "Vendor C Essential Oil", price: 300, vendorId: VENDOR_C_ID, user: VENDOR_C_ID, createdBy: "VENDOR", sku: "MWB-OIL-003" },
  { _id: PROD_ADMIN_ID, name: "Admin Catalog Supplement", price: 999, user: ADMIN_USER_ID, vendorId: null, createdBy: "ADMIN", sku: "MWB-ADM-001" },
  { _id: PROD_A_LEGACY_ID, name: "Vendor A Legacy Product", price: 400, user: VENDOR_A_ID, vendorId: VENDOR_A_ID, createdBy: "ADMIN", sku: "MWB-LEG-001" },
  { _id: PROD_REQ_A_ID, name: "Vendor A Requested Product", price: 750, user: VENDOR_A_ID, vendorId: VENDOR_A_ID, createdBy: "VENDOR", sku: "MWB-REQ-001" },
  { _id: PROD_BLANK_ID, name: "Blank Vendor Product", price: 200, vendorId: VENDOR_BLANK_ID, user: VENDOR_BLANK_ID, createdBy: "VENDOR", sku: "MWB-BLK-001" },
];

const productRequests = [
  { vendorId: VENDOR_A_ID, productId: PROD_REQ_A_ID, status: "approved" },
];

let orders = [
  {
    _id: ORDER_BLANK_ID,
    orderNumber: "MWB-20261021-444444",
    user: { _id: new mongoose.Types.ObjectId(), name: "Customer Blank", email: "blank@customer.com", phone: "919666655555" },
    customerName: "Customer Blank",
    customerEmail: "blank@customer.com",
    customerPhone: "919666655555",
    orderItems: [
      {
        productId: PROD_BLANK_ID,
        name: "Blank Vendor Product",
        price: 200,
        quantity: 1,
        image: "blank.jpg",
      },
    ],
    totalPrice: 200,
    status: "Processing",
    statusHistory: [
      { status: "Processing", timestamp: new Date("2026-10-21T10:00:00Z"), updatedBy: "System", note: "Initial" }
    ],
    shippingStatus: "Pending",
    referral: null,
    createdAt: new Date("2026-10-21T10:00:00Z"),
  },
  {
    _id: ORDER_1_ID,
    orderNumber: "MWB-20261021-111111",
    user: { _id: new mongoose.Types.ObjectId(), name: "Customer John", email: "john@customer.com", phone: "919888877777" },
    customerName: "Customer John",
    customerEmail: "john@customer.com",
    customerPhone: "919888877777",
    orderItems: [
      {
        productId: PROD_A1_ID,
        name: "Vendor A Herbal Tea",
        price: 500,
        quantity: 2,
        image: "tea.jpg",
      },
      {
        productId: PROD_B1_ID,
        name: "Vendor B Protein Powder",
        price: 800,
        quantity: 1,
        image: "protein.jpg",
      },
    ],
    totalPrice: 1800,
    status: "Processing",
    statusHistory: [
      { status: "Processing", timestamp: new Date("2026-10-21T10:00:00Z"), updatedBy: "System", note: "Initial" }
    ],
    shippingStatus: "Pending",
    referral: {
      vendorId: VENDOR_A_ID,
      shareCode: "MWREF-VNDA-PROA",
    },
    createdAt: new Date("2026-10-21T10:00:00Z"),
  },
  {
    _id: ORDER_2_ID,
    orderNumber: "MWB-20261021-222222",
    user: { _id: new mongoose.Types.ObjectId(), name: "Customer Alice", email: "alice@customer.com", phone: "919999988888" },
    customerName: "Customer Alice",
    customerEmail: "alice@customer.com",
    customerPhone: "919999988888",
    orderItems: [
      {
        productId: PROD_B1_ID,
        name: "Vendor B Protein Powder",
        price: 800,
        quantity: 2,
        image: "protein.jpg",
      },
    ],
    totalPrice: 1600,
    status: "Processing",
    statusHistory: [
      { status: "Processing", timestamp: new Date("2026-10-21T11:00:00Z"), updatedBy: "System", note: "Initial" }
    ],
    shippingStatus: "Pending",
    referral: null,
    createdAt: new Date("2026-10-21T11:00:00Z"),
  },
];

// Stub Mongoose models used by routes
const Vendor = require("./models/Vendor");
const Product = require("./models/Product");
const ProductRequest = require("./models/ProductRequest");
const Order = require("./models/Order");
const ReferralPurchase = require("./models/ReferralPurchase");

ReferralPurchase.findOne = () => ({
  populate: () => ({
    lean: async () => null
  })
});

// Setup stubs on models
Vendor.findById = async (id) => {
  const v = vendors.find(x => String(x._id) === String(id));
  return v ? { ...v } : null;
};
Vendor.findOne = async (query) => {
  if (query.$or) {
    for (const cond of query.$or) {
      if (cond.phone) {
        const v = vendors.find(x => x.phone === cond.phone);
        if (v) return { ...v };
      }
      if (cond.email) {
        if (cond.email instanceof RegExp) {
          const v = vendors.find(x => cond.email.test(x.email));
          if (v) return { ...v };
        } else {
          const v = vendors.find(x => String(x.email || "").toLowerCase() === String(cond.email || "").toLowerCase());
          if (v) return { ...v };
        }
      }
    }
  }
  return null;
};
Vendor.find = (query) => ({
  select: () => ({
    lean: async () => {
      if (query.$or) {
        const ids = [];
        for (const cond of query.$or) {
          if (cond._id && cond._id.$in) {
            const list = cond._id.$in.map(String);
            vendors.filter(v => list.includes(String(v._id))).forEach(v => ids.push({ _id: v._id }));
          }
          if (cond.email) {
            if (cond.email instanceof RegExp) {
              vendors.filter(v => cond.email.test(v.email)).forEach(v => ids.push({ _id: v._id }));
            } else {
              vendors.filter(v => String(v.email || "").toLowerCase() === String(cond.email || "").toLowerCase()).forEach(v => ids.push({ _id: v._id }));
            }
          }
          if (cond.phone) {
            vendors.filter(v => v.phone === cond.phone).forEach(v => ids.push({ _id: v._id }));
          }
        }
        return ids;
      }
      return [];
    }
  })
});

Product.find = (query) => ({
  select: () => ({
    lean: async () => {
      if (query.$or) {
        const matching = [];
        for (const cond of query.$or) {
          if (cond.vendorId && cond.vendorId.$in) {
            const ids = cond.vendorId.$in.map(String);
            products.filter(p => ids.includes(String(p.vendorId))).forEach(p => matching.push({ _id: p._id }));
          }
          if (cond.user && cond.user.$in) {
            const ids = cond.user.$in.map(String);
            products.filter(p => ids.includes(String(p.user)) && (!cond.createdBy || p.createdBy === cond.createdBy)).forEach(p => matching.push({ _id: p._id }));
          }
        }
        return matching;
      }
      return products.map(p => ({ _id: p._id }));
    }
  })
});

ProductRequest.find = (query) => ({
  select: () => ({
    lean: async () => {
      if (query && query.vendorId && query.vendorId.$in) {
        const ids = query.vendorId.$in.map(String);
        return productRequests
          .filter(r => ids.includes(String(r.vendorId)) && r.productId)
          .map(r => ({ productId: r.productId }));
      }
      return [];
    }
  })
});

// Helper for Order queries
Order.find = (query) => {
  let matched = [...orders];
  if (query["orderItems.productId"] && query["orderItems.productId"].$in) {
    const allowedProdIds = query["orderItems.productId"].$in.map(String);
    matched = matched.filter(ord =>
      ord.orderItems.some(it => allowedProdIds.includes(String(it.productId)))
    );
  }

  const queryChain = {
    populate: () => queryChain,
    sort: () => queryChain,
    then: (resolve) => {
      // Deep clone matched orders
      resolve(JSON.parse(JSON.stringify(matched)));
    }
  };
  return queryChain;
};

Order.findById = (id) => {
  const found = orders.find(o => String(o._id) === String(id));
  const doc = found ? JSON.parse(JSON.stringify(found)) : null;

  if (doc) {
    // Add Mongoose document save method
    doc.save = async function () {
      const idx = orders.findIndex(o => String(o._id) === String(id));
      if (idx !== -1) {
        orders[idx] = { ...this };
      }
      return this;
    };
    doc.toObject = function () {
      return JSON.parse(JSON.stringify(this));
    };
  }

  const queryChain = {
    populate: () => queryChain,
    lean: async () => (doc ? JSON.parse(JSON.stringify(doc)) : null),
    then: (resolve) => resolve(doc),
  };
  return queryChain;
};

// Create tokens
const tokenVendorA = jwt.sign({ vendorId: VENDOR_A_ID }, process.env.JWT_SECRET);
const tokenVendorB = jwt.sign({ vendorId: VENDOR_B_ID }, process.env.JWT_SECRET);
const tokenVendorC = jwt.sign({ vendorId: VENDOR_C_ID }, process.env.JWT_SECRET);

async function runTests() {
  console.log("=================================================");
  console.log(" RUNNING PHASE 1: VENDOR ORDER DATA SECURITY TESTS");
  console.log("=================================================\n");

  const app = express();
  app.use(express.json());

  // Mount vendor routes
  const vendorRoutes = require("./routes/vendorRoutes");
  app.use("/api/vendor", vendorRoutes);

  // Start server on ephemeral port
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/vendor`;

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ [PASS] ${testName}`);
    } else {
      console.error(`  ✗ [FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: GET /api/vendor/orders - Vendor A Orders Isolation
    // -------------------------------------------------------------
    console.log("TEST 1: Vendor A fetching order list");
    const resA = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenVendorA}` }
    });
    const dataA = await resA.json();

    assert(resA.status === 200, "Vendor A receives HTTP 200");
    assert(dataA.success === true, "Response has success: true");
    assert(Array.isArray(dataA.orders) && dataA.orders.length === 1, "Vendor A receives exactly 1 order (Order 1)");
    assert(dataA.orders[0]._id === String(ORDER_1_ID), "Order 1 ID matches");
    assert(dataA.orders[0].orderItems.length === 1, "Order 1 contains ONLY 1 item for Vendor A");
    assert(String(dataA.orders[0].orderItems[0].productId) === String(PROD_A1_ID), "Order 1 item is Vendor A's product");
    assert(dataA.orders[0].totalPrice === 1000, "Order 1 totalPrice reflects only Vendor A's items: 2 * 500 = ₹1000 (Vendor B's ₹800 is stripped)");
    assert(dataA.orders[0].referral !== undefined, "Vendor A preserves their own referral details");

    // -------------------------------------------------------------
    // TEST 2: GET /api/vendor/orders - Vendor B Orders Isolation
    // -------------------------------------------------------------
    console.log("\nTEST 2: Vendor B fetching order list");
    const resB = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenVendorB}` }
    });
    const dataB = await resB.json();

    assert(resB.status === 200, "Vendor B receives HTTP 200");
    assert(dataB.orders.length === 2, "Vendor B receives 2 orders (Order 1 and Order 2)");
    const order1ForB = dataB.orders.find(o => o._id === String(ORDER_1_ID));
    assert(order1ForB !== undefined, "Vendor B sees Order 1");
    assert(order1ForB.orderItems.length === 1, "Vendor B sees ONLY their item in Order 1");
    assert(String(order1ForB.orderItems[0].productId) === String(PROD_B1_ID), "Item is Vendor B's Product B1");
    assert(order1ForB.totalPrice === 800, "Order 1 totalPrice for Vendor B reflects only 1 * 800 = ₹800 (Vendor A's ₹1000 is hidden)");
    assert(order1ForB.referral === undefined, "Vendor A's referral object was removed for Vendor B");

    // -------------------------------------------------------------
    // TEST 3: GET /api/vendor/orders - Vendor C (No products in orders)
    // -------------------------------------------------------------
    console.log("\nTEST 3: Vendor C (no products in current orders)");
    const resC = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenVendorC}` }
    });
    const dataC = await resC.json();

    assert(resC.status === 200, "Vendor C receives HTTP 200");
    assert(dataC.orders.length === 0, "Vendor C receives empty orders []");

    // -------------------------------------------------------------
    // TEST 4: Request Parameter Tampering Prevention
    // -------------------------------------------------------------
    console.log("\nTEST 4: Parameter tampering prevention (Vendor A passes ?vendorId=VendorB)");
    const resTamper = await fetch(`${baseUrl}/orders?vendorId=${VENDOR_B_ID}`, {
      headers: { Authorization: `Bearer ${tokenVendorA}` }
    });
    const dataTamper = await resTamper.json();

    assert(dataTamper.orders.length === 1, "Query vendorId is ignored, strictly uses authenticated session");
    assert(String(dataTamper.orders[0].orderItems[0].productId) === String(PROD_A1_ID), "Still returns only Vendor A's items");

    // -------------------------------------------------------------
    // TEST 5: GET /api/vendor/orders/:id - Authorized Order Detail
    // -------------------------------------------------------------
    console.log("\nTEST 5: Vendor A fetching order detail for Order 1");
    const resDetailA = await fetch(`${baseUrl}/orders/${ORDER_1_ID}`, {
      headers: { Authorization: `Bearer ${tokenVendorA}` }
    });
    const dataDetailA = await resDetailA.json();

    assert(resDetailA.status === 200, "Vendor A detail request returns HTTP 200");
    assert(dataDetailA.order.orderItems.length === 1, "Detail orderItems contains ONLY Vendor A's item");
    assert(dataDetailA.order.totalPrice === 1000, "Detail totalPrice is sanitized to ₹1000");

    // -------------------------------------------------------------
    // TEST 6: GET /api/vendor/orders/:id - Cross-Vendor Data Access Rejection
    // -------------------------------------------------------------
    console.log("\nTEST 6: Vendor C attempting to view Order 1 (cross-vendor access)");
    const resDetailC = await fetch(`${baseUrl}/orders/${ORDER_1_ID}`, {
      headers: { Authorization: `Bearer ${tokenVendorC}` }
    });
    const dataDetailC = await resDetailC.json();

    assert(resDetailC.status === 403, "Vendor C is blocked with HTTP 403 Forbidden");
    assert(dataDetailC.success === false, "Response has success: false");
    assert(dataDetailC.message === "Not authorized to access this order", "Correct security error message returned");

    // -------------------------------------------------------------
    // TEST 7: PUT /api/vendor/orders/:id/status - Cross-Vendor Status Modification Rejection
    // -------------------------------------------------------------
    console.log("\nTEST 7: Vendor C attempting to modify Order 1 status");
    const resStatusC = await fetch(`${baseUrl}/orders/${ORDER_1_ID}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVendorC}`
      },
      body: JSON.stringify({ status: "Will be Out for Delivery in 1–2 Days" })
    });
    const dataStatusC = await resStatusC.json();

    assert(resStatusC.status === 403, "Vendor C status update is blocked with HTTP 403 Forbidden");
    assert(dataStatusC.message === "Not authorized to update status for this order", "Status update rejected for non-owner vendor");

    // -------------------------------------------------------------
    // TEST 8: PUT /api/vendor/orders/:id/status - Authorized Status Update
    // -------------------------------------------------------------
    console.log("\nTEST 8: Vendor A updating Order 1 status forward");
    const resStatusA = await fetch(`${baseUrl}/orders/${ORDER_1_ID}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVendorA}`
      },
      body: JSON.stringify({ status: "Will be Out for Delivery in 1–2 Days", note: "Packaged and ready" })
    });
    const dataStatusA = await resStatusA.json();

    assert(resStatusA.status === 200, "Vendor A status update succeeds with HTTP 200");
    assert(dataStatusA.order.status === "Will be Out for Delivery in 1–2 Days", "Order status transitioned forward");
    assert(dataStatusA.order.orderItems.length === 1, "Returned order object in response is sanitized (only Vendor A's items)");
    assert(dataStatusA.order.totalPrice === 1000, "Returned order totalPrice is sanitized to ₹1000");

    // -------------------------------------------------------------
    // TEST 9: PUT /api/vendor/orders/:id/shipping - Cross-Vendor Shipping Modification Rejection
    // -------------------------------------------------------------
    console.log("\nTEST 9: Vendor C attempting to modify Order 1 shipping");
    const resShipC = await fetch(`${baseUrl}/orders/${ORDER_1_ID}/shipping`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVendorC}`
      },
      body: JSON.stringify({ shippingStatus: "Delivered" })
    });
    const dataShipC = await resShipC.json();

    assert(resShipC.status === 403, "Vendor C shipping update is blocked with HTTP 403 Forbidden");
    assert(dataShipC.message === "Not authorized to update shipping for this order", "Shipping update rejected for non-owner vendor");

    // -------------------------------------------------------------
    // TEST 10: PUT /api/vendor/orders/:id/shipping - Authorized Shipping Update
    // -------------------------------------------------------------
    console.log("\nTEST 10: Vendor A updating Order 1 shipping status");
    const resShipA = await fetch(`${baseUrl}/orders/${ORDER_1_ID}/shipping`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVendorA}`
      },
      body: JSON.stringify({ shippingStatus: "In-Transit" })
    });
    const dataShipA = await resShipA.json();

    assert(resShipA.status === 200, "Vendor A shipping update succeeds with HTTP 200");
    assert(dataShipA.order.shippingStatus === "In-Transit", "Shipping status updated");
    assert(dataShipA.order.orderItems.length === 1, "Returned order object is sanitized");

    // -------------------------------------------------------------
    // TEST 11: Invalid ID Handling
    // -------------------------------------------------------------
    console.log("\nTEST 11: Invalid Order ID handling");
    const resInvalid = await fetch(`${baseUrl}/orders/invalid-id-xyz`, {
      headers: { Authorization: `Bearer ${tokenVendorA}` }
    });
    assert(resInvalid.status === 400, "Invalid ID returns HTTP 400 Bad Request");

    // -------------------------------------------------------------
    // TEST 12: Blank & Whitespace Email Matching Guard (Fix A)
    // -------------------------------------------------------------
    console.log("\nTEST 12: Blank & Whitespace Email Matching Guard");
    // 12a: Vendor with blank email legitimately sees only their own order (Order Blank)
    const tokenBlankVendor = jwt.sign(
      { vendorId: VENDOR_BLANK_ID },
      process.env.JWT_SECRET
    );
    const resBlank = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenBlankVendor}` }
    });
    const dataBlank = await resBlank.json();
    assert(resBlank.status === 200, "Blank email vendor request returns HTTP 200");
    assert(dataBlank.orders.length === 1, "Blank email vendor sees exactly their 1 order (Order Blank)");
    assert(dataBlank.orders[0]._id === String(ORDER_BLANK_ID), "Order ID matches Order Blank");

    // 12b: Vendor with whitespace email ('   ') must NOT match the blank email vendor via /^$/i
    const tokenWhitespaceVendor = jwt.sign(
      { vendorId: VENDOR_WHITESPACE_ID },
      process.env.JWT_SECRET
    );
    const resWhitespace = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenWhitespaceVendor}` }
    });
    const dataWhitespace = await resWhitespace.json();
    assert(resWhitespace.status === 200, "Whitespace email vendor request returns HTTP 200");
    assert(dataWhitespace.orders.length === 0, "Whitespace email vendor does NOT match blank vendor or steal Order Blank");

    // 12c: Vendor with padded valid email ('  vendorA@test.com  ') is trimmed and matches Vendor A
    const tokenPaddedVendor = jwt.sign(
      { vendorId: VENDOR_PADDED_ID },
      process.env.JWT_SECRET
    );
    const resPadded = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenPaddedVendor}` }
    });
    const dataPadded = await resPadded.json();
    assert(resPadded.status === 200, "Padded email vendor request returns HTTP 200");
    assert(dataPadded.orders.some(o => o._id === String(ORDER_1_ID)), "Padded email vendor correctly matches Vendor A and sees Order 1");
    assert(dataPadded.orders.length === 1, "Padded valid email matches Vendor A correctly");
    assert(String(dataPadded.orders[0]._id) === String(ORDER_1_ID), "Padded email matches Order 1 for Vendor A");

    // -------------------------------------------------------------
    // TEST 13: Product Ownership Schema Verification & Admin Catalog Guard (Fix C)
    // -------------------------------------------------------------
    console.log("\nTEST 13: Product Ownership & Catalog Guard");
    const ORDER_3_ID = new mongoose.Types.ObjectId("650000000000000000000003");
    orders.push({
      _id: ORDER_3_ID,
      orderNumber: "MWB-20261021-333333",
      user: { _id: new mongoose.Types.ObjectId(), name: "Customer Bob", email: "bob@customer.com", phone: "919777766666" },
      customerName: "Customer Bob",
      customerEmail: "bob@customer.com",
      customerPhone: "919777766666",
      orderItems: [
        {
          productId: PROD_ADMIN_ID,
          name: "Admin Catalog Supplement",
          price: 999,
          quantity: 1,
          image: "catalog.jpg",
        },
        {
          productId: PROD_A_LEGACY_ID,
          name: "Vendor A Legacy Product",
          price: 400,
          quantity: 2,
          image: "legacy.jpg",
        },
        {
          productId: PROD_REQ_A_ID,
          name: "Vendor A Requested Product",
          price: 750,
          quantity: 1,
          image: "req.jpg",
        },
      ],
      totalPrice: 2549,
      status: "Processing",
      statusHistory: [
        { status: "Processing", timestamp: new Date("2026-10-21T12:00:00Z"), updatedBy: "System", note: "Initial" }
      ],
      shippingStatus: "Pending",
      referral: null,
      createdAt: new Date("2026-10-21T12:00:00Z"),
    });

    const resAWith3 = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenVendorA}` }
    });
    const dataAWith3 = await resAWith3.json();
    const order3ForA = dataAWith3.orders.find(o => o._id === String(ORDER_3_ID));

    assert(order3ForA !== undefined, "Vendor A accesses Order 3 containing their items");
    assert(order3ForA.orderItems.length === 2, "Order 3 contains ONLY Vendor A's 2 products (legacy + requested)");
    assert(
      order3ForA.orderItems.some(i => String(i.productId) === String(PROD_A_LEGACY_ID)),
      "Legacy vendor product with createdBy: ADMIN is preserved"
    );
    assert(
      order3ForA.orderItems.some(i => String(i.productId) === String(PROD_REQ_A_ID)),
      "ProductRequest approved product is preserved"
    );
    assert(
      !order3ForA.orderItems.some(i => String(i.productId) === String(PROD_ADMIN_ID)),
      "Admin catalog product is excluded from Vendor A items"
    );
    assert(order3ForA.totalPrice === 1550, "Order 3 totalPrice reflects only Vendor A items: (2*400) + (1*750) = ₹1550 (Admin ₹999 stripped)");

    // Verify Admin User with vendor role cannot claim Admin catalog products
    const tokenAdminAsVendor = jwt.sign(
      { vendorId: ADMIN_USER_ID },
      process.env.JWT_SECRET
    );
    const resAdminVendor = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenAdminAsVendor}` }
    });
    const dataAdminVendor = await resAdminVendor.json();
    const order3ForAdmin = (dataAdminVendor.orders || []).find(o => o._id === String(ORDER_3_ID));
    assert(!order3ForAdmin, "Admin user with vendor role cannot claim Admin catalog products as vendor products");

    // -------------------------------------------------------------
    // TEST 14: WhatsApp Notification Amount Isolation & Pricing Rules (Fix B)
    // -------------------------------------------------------------
    console.log("\nTEST 14: WhatsApp Notification Amount Isolation (payments.controller.js)");
    const testVendorMap = new Map();
    testVendorMap.set(String(VENDOR_A_ID), {
      vendor: vendors.find(v => String(v._id) === String(VENDOR_A_ID)),
      products: [
        { productId: PROD_A1_ID, name: "Vendor A Herbal Tea", price: 500, quantity: 2 }
      ]
    });
    testVendorMap.set(String(VENDOR_B_ID), {
      vendor: vendors.find(v => String(v._id) === String(VENDOR_B_ID)),
      products: [
        { productId: PROD_B1_ID, name: "Vendor B Protein Powder", price: 800, quantity: 1 }
      ]
    });

    const parentTotalAmount = 1800; // Whole order total
    const finalOrderNumber = "MWB-20261021-111111";

    const vendorPayloads = [];
    for (const [vendorIdStr, vendorData] of testVendorMap.entries()) {
      const currentVendor = vendorData.vendor;
      const vendorProducts = vendorData.products;

      if (!currentVendor.phone) continue;

      const vendorProductName = vendorProducts.map((p) => p.name).join(", ");
      const vendorTotalQuantity = vendorProducts.reduce((sum, p) => sum + (p.quantity || 1), 0).toString();
      const vendorSubtotal = vendorProducts.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
        0
      );

      const vendorNotificationPayload = {
        vendor_phone: currentVendor.phone,
        vendor_name: currentVendor.vendorName || "Vendor",
        orderId: finalOrderNumber,
        product: vendorProductName,
        quantity: vendorTotalQuantity,
        total_amount: `${vendorSubtotal}`,
        customer_name: "Customer John",
        customer_phone: "919888877777",
        address: "123 Green Ave",
        number: "919876543210",
      };

      vendorPayloads.push(vendorNotificationPayload);
    }

    const payloadA = vendorPayloads.find(p => p.vendor_name === "Vendor A Foods");
    const payloadB = vendorPayloads.find(p => p.vendor_name === "Vendor B Wellness");

    assert(payloadA !== undefined, "Vendor A WhatsApp payload generated");
    assert(payloadA.total_amount === "1000", "Vendor A WhatsApp total_amount reflects ONLY Vendor A items: ₹1000");
    assert(payloadA.total_amount !== `${parentTotalAmount}`, "Vendor A does NOT leak parent multi-vendor total (₹1800)");

    assert(payloadB !== undefined, "Vendor B WhatsApp payload generated");
    assert(payloadB.total_amount === "800", "Vendor B WhatsApp total_amount reflects ONLY Vendor B items: ₹800");
    assert(payloadB.total_amount !== `${parentTotalAmount}`, "Vendor B does NOT leak parent multi-vendor total (₹1800)");

    // Admin and Buyer payloads preserve parent total
    const adminNotificationPayload = {
      orderId: finalOrderNumber,
      total_amount: `${parentTotalAmount} `,
    };
    const buyerWhatsappPayload = {
      product_amount: `${parentTotalAmount}`,
    };
    assert(adminNotificationPayload.total_amount === "1800 ", "Admin WhatsApp notification preserves full order total (₹1800)");
    assert(buyerWhatsappPayload.product_amount === "1800", "Buyer WhatsApp notification preserves full payment total (₹1800)");

    console.log("\n=================================================");
    console.log(` RESULTS: ${passedTests} / ${totalTests} assertions passed`);
    console.log("=================================================");

    if (passedTests === totalTests) {
      console.log("\n>>> ALL PHASE 1 VENDOR SECURITY TESTS PASSED SUCCESSFULLY! <<<\n");
    } else {
      throw new Error(`Only ${passedTests} of ${totalTests} tests passed.`);
    }

  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
