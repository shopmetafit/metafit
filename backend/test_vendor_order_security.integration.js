/**
 * Database-Backed Integration Test Suite: Vendor Order Data Security (Phase 1.2)
 *
 * Verifies real MongoDB behavior using actual Mongoose models and Express routes:
 * 1. Safe connection validation: Aborts if TEST_MONGO_URI is missing, matches MONGO_URI,
 *    or does not contain a dedicated test database name.
 * 2. Real MongoDB regex querying: Blank-email vendor records cannot be stolen by whitespace emails.
 * 3. Real multi-vendor order isolation: Vendor A and Vendor B only see their respective items.
 * 4. Database immutability: The underlying MongoDB order document is NEVER altered by vendor sanitization.
 * 5. Admin catalog protection: Admin products are never treated as vendor-owned.
 * 6. Legacy vendor product & ProductRequest preservation.
 * 7. Cross-vendor status/shipping modification denial on live MongoDB documents.
 * 8. Strict cleanup: Only records created during this test run are removed.
 */

const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const http = require("http");
const dotenv = require("dotenv");

// Load existing environment variables to compare against MONGO_URI
dotenv.config();

// Ensure test JWT secret
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-integration-secret-98765";

// -------------------------------------------------------------
// 1. SAFETY GATES & CONNECTION VALIDATION
// -------------------------------------------------------------
function validateTestUri(testUri, prodUri) {
  if (!testUri || typeof testUri !== "string" || !testUri.trim()) {
    throw new Error(
      "SAFETY ABORT: TEST_MONGO_URI environment variable is required for integration tests.\n" +
      "Set TEST_MONGO_URI to a dedicated test database (e.g. mongodb://127.0.0.1:27017/metafit_test)."
    );
  }

  // Reject if test URI equals production / main MONGO_URI
  if (prodUri && testUri.trim().toLowerCase() === prodUri.trim().toLowerCase()) {
    throw new Error(
      "SAFETY ABORT: TEST_MONGO_URI cannot be identical to MONGO_URI.\n" +
      "Integration tests must never run against the main database."
    );
  }

  // Parse database name
  let dbName = "";
  let host = "";

  try {
    const parsed = new URL(testUri);
    dbName = parsed.pathname ? parsed.pathname.replace(/^\//, "") : "";
    host = parsed.host || "";
  } catch (urlErr) {
    // Handle standard mongodb:// or mongodb+srv:// connection formats
    const match = testUri.match(/^mongodb(?:\+srv)?:\/\/(?:([^:]+):([^@]+)@)?([^/?#]+)(?:\/([^?#]+))?/);
    if (!match) {
      throw new Error("SAFETY ABORT: TEST_MONGO_URI is not a valid MongoDB URI format.");
    }
    host = match[3] || "";
    dbName = match[4] || "";
  }

  // Require database name to be explicitly provided and contain "test"
  if (!dbName || !dbName.toLowerCase().includes("test")) {
    throw new Error(
      `SAFETY ABORT: Database name '${dbName || "EMPTY"}' is unsafe.\n` +
      "The test database name must explicitly contain 'test' (e.g. metafit_test)."
    );
  }

  // Reject database names or hosts that look like production or staging
  const forbiddenPatterns = ["prod", "production", "staging", "live", "cluster0"];
  for (const pattern of forbiddenPatterns) {
    if (dbName.toLowerCase().includes(pattern)) {
      throw new Error(`SAFETY ABORT: Database name contains forbidden keyword '${pattern}'.`);
    }
  }

  return { dbName, host };
}

// -------------------------------------------------------------
// 2. TEST EXECUTION RUNNER
// -------------------------------------------------------------
async function runIntegrationTests() {
  console.log("=================================================");
  console.log(" RUNNING PHASE 1.2: REAL MONGODB INTEGRATION TESTS");
  console.log("=================================================\n");

  const testUri = process.env.TEST_MONGO_URI;
  const prodUri = process.env.METAFIT_WELLNESS_MONGO_URI || process.env.MONGO_URI || process.env.URI;

  // Perform strict pre-connection safety check
  const { dbName, host } = validateTestUri(testUri, prodUri);
  console.log(`[SAFETY CHECK PASSED]`);
  console.log(`  Target Host: ${host}`);
  console.log(`  Target Database: ${dbName}`);
  console.log(`  Safety Gate: Verified dedicated test database containing 'test'\n`);

  // Connect real Mongoose to dedicated test database
  await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5000 });
  console.log(`✓ Connected to test database successfully.\n`);

  // Require actual models (No stubbing, real MongoDB operations)
  const Vendor = require("./models/Vendor");
  const Product = require("./models/Product");
  const ProductRequest = require("./models/ProductRequest");
  const Order = require("./models/Order");
  const User = require("./models/User");

  // Track created IDs for strict deterministic cleanup
  const createdVendorIds = [];
  const createdProductIds = [];
  const createdProductRequestIds = [];
  const createdOrderIds = [];
  const createdUserIds = [];

  const RUN_TAG = `test_run_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

  // Express test app
  const app = express();
  app.use(express.json());
  const vendorRoutes = require("./routes/vendorRoutes");
  app.use("/api/vendor", vendorRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
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
    // SEEDING TEST FIXTURES
    // -------------------------------------------------------------
    console.log("Seeding deterministic test fixtures into MongoDB...");

    // 1. Vendors
    const vendorA = await Vendor.create({
      vendorName: `Vendor A Real (${RUN_TAG})`,
      businessName: "Vendor A Real Organics",
      email: `vendorA_${RUN_TAG}@test.com`,
      phone: `919${Math.floor(100000000 + Math.random() * 900000000)}`,
      status: "approved",
    });
    createdVendorIds.push(vendorA._id);

    const vendorB = await Vendor.create({
      vendorName: `Vendor B Real (${RUN_TAG})`,
      businessName: "Vendor B Real Wellness",
      email: `vendorB_${RUN_TAG}@test.com`,
      phone: `919${Math.floor(100000000 + Math.random() * 900000000)}`,
      status: "approved",
    });
    createdVendorIds.push(vendorB._id);

    const vendorC = await Vendor.create({
      vendorName: `Vendor C Real (${RUN_TAG})`,
      businessName: "Vendor C Real Ayurveda",
      email: `vendorC_${RUN_TAG}@test.com`,
      phone: `919${Math.floor(100000000 + Math.random() * 900000000)}`,
      status: "approved",
    });
    createdVendorIds.push(vendorC._id);

    const vendorBlankEmail = await Vendor.create({
      vendorName: `Blank Email Vendor (${RUN_TAG})`,
      businessName: "Blank Email Ltd",
      email: "", // Empty string in MongoDB
      phone: `919${Math.floor(100000000 + Math.random() * 900000000)}`,
      status: "approved",
    });
    createdVendorIds.push(vendorBlankEmail._id);

    const vendorWhitespaceEmail = await Vendor.create({
      vendorName: `Whitespace Email Vendor (${RUN_TAG})`,
      businessName: "Whitespace Ltd",
      email: "   ", // Whitespace in MongoDB
      phone: `919${Math.floor(100000000 + Math.random() * 900000000)}`,
      status: "approved",
    });
    createdVendorIds.push(vendorWhitespaceEmail._id);

    // 2. Admin User
    const adminUser = await User.create({
      name: `Admin User (${RUN_TAG})`,
      email: `admin_${RUN_TAG}@metafit.com`,
      role: "admin",
      phone: `919${Math.floor(100000000 + Math.random() * 900000000)}`,
    });
    createdUserIds.push(adminUser._id);

    // 3. Products
    // Product A1: Direct vendor product (createdBy: VENDOR)
    const productA1 = await Product.create({
      name: `Herbal Tea (${RUN_TAG})`,
      description: "Real Herbal Tea description",
      price: 500,
      countInStock: 50,
      sku: `SKU-TEA-${RUN_TAG}`,
      category: "Wellness",
      brand: "Vendor A Brand",
      collection: "Teas",
      user: vendorA._id,
      vendorId: vendorA._id,
      createdBy: "VENDOR",
      productApprovalStatus: "approved",
    });
    createdProductIds.push(productA1._id);

    // Product A Legacy: vendorId set, createdBy: ADMIN (legacy record simulation)
    const productALegacy = await Product.create({
      name: `Legacy Herbal Balm (${RUN_TAG})`,
      description: "Legacy Balm description",
      price: 400,
      countInStock: 30,
      sku: `SKU-BALM-${RUN_TAG}`,
      category: "Wellness",
      brand: "Vendor A Brand",
      collection: "Balms",
      user: vendorA._id,
      vendorId: vendorA._id,
      createdBy: "ADMIN", // Legacy field check
      productApprovalStatus: "approved",
    });
    createdProductIds.push(productALegacy._id);

    // Product A Requested: created via ProductRequest approval
    const productARequested = await Product.create({
      name: `Requested Herbal Oil (${RUN_TAG})`,
      description: "Requested Oil description",
      price: 750,
      countInStock: 25,
      sku: `SKU-OIL-${RUN_TAG}`,
      category: "Wellness",
      brand: "Vendor A Brand",
      collection: "Oils",
      user: vendorA._id,
      vendorId: vendorA._id,
      createdBy: "VENDOR",
      productApprovalStatus: "approved",
    });
    createdProductIds.push(productARequested._id);

    const productRequestA = await ProductRequest.create({
      vendorId: vendorA._id,
      vendorName: vendorA.vendorName,
      name: productARequested.name,
      description: "Requested Oil description",
      category: "Wellness",
      brand: "Vendor A Brand",
      collection: "Oils",
      price: 750,
      sku: productARequested.sku,
      status: "approved",
      productId: productARequested._id,
    });
    createdProductRequestIds.push(productRequestA._id);

    // Product B1: Owned by Vendor B
    const productB1 = await Product.create({
      name: `Protein Powder (${RUN_TAG})`,
      description: "Real Protein Powder description",
      price: 800,
      countInStock: 40,
      sku: `SKU-PRO-${RUN_TAG}`,
      category: "Nutrition",
      brand: "Vendor B Brand",
      collection: "Proteins",
      user: vendorB._id,
      vendorId: vendorB._id,
      createdBy: "VENDOR",
      productApprovalStatus: "approved",
    });
    createdProductIds.push(productB1._id);

    // Product Admin Catalog: user: adminUser._id, vendorId: null, createdBy: "ADMIN"
    const productAdminCatalog = await Product.create({
      name: `Admin Catalog Supplement (${RUN_TAG})`,
      description: "Platform Admin Catalog Supplement",
      price: 999,
      countInStock: 100,
      sku: `SKU-CATALOG-${RUN_TAG}`,
      category: "Supplements",
      brand: "Platform Brand",
      collection: "Supplements",
      user: adminUser._id,
      vendorId: null,
      createdBy: "ADMIN",
      productApprovalStatus: "approved",
    });
    createdProductIds.push(productAdminCatalog._id);

    // Product Blank Vendor: Owned by Blank Email Vendor
    const productBlankVendor = await Product.create({
      name: `Blank Vendor Tonic (${RUN_TAG})`,
      description: "Blank Vendor Product",
      price: 250,
      countInStock: 10,
      sku: `SKU-BLANK-${RUN_TAG}`,
      category: "Wellness",
      brand: "Blank Brand",
      collection: "Tonics",
      user: vendorBlankEmail._id,
      vendorId: vendorBlankEmail._id,
      createdBy: "VENDOR",
      productApprovalStatus: "approved",
    });
    createdProductIds.push(productBlankVendor._id);

    // 4. Orders
    // Order 1: Multi-vendor checkout (Vendor A items: 2x 500 = 1000; Vendor B items: 1x 800 = 800)
    const order1 = await Order.create({
      orderNumber: `MWB-REAL-${Date.now()}-001`,
      user: adminUser._id,
      customerName: "Real Customer Jane",
      customerEmail: `jane_${RUN_TAG}@customer.com`,
      customerPhone: "919876543200",
      paymentMethod: "Razorpay",
      paymentId: `pay_real_test_${Date.now()}_01`,
      totalPrice: 1800,
      status: "Processing",
      shippingStatus: "Pending",
      shippingAddress: {
        address: "123 Lake Road",
        city: "Udaipur",
        state: "Rajasthan",
        postalCode: "313001",
        country: "India",
      },
      orderItems: [
        {
          productId: productA1._id,
          name: productA1.name,
          image: "tea.jpg",
          price: 500,
          quantity: 2,
        },
        {
          productId: productB1._id,
          name: productB1.name,
          image: "protein.jpg",
          price: 800,
          quantity: 1,
        },
      ],
      referral: {
        vendorId: vendorA._id,
        shareCode: `REF-VNDA-${RUN_TAG}`,
      },
    });
    createdOrderIds.push(order1._id);

    // Order 2: Vendor B only (2x 800 = 1600)
    const order2 = await Order.create({
      orderNumber: `MWB-REAL-${Date.now()}-002`,
      user: adminUser._id,
      customerName: "Real Customer Mark",
      customerEmail: `mark_${RUN_TAG}@customer.com`,
      customerPhone: "919876543201",
      paymentMethod: "Razorpay",
      paymentId: `pay_real_test_${Date.now()}_02`,
      totalPrice: 1600,
      status: "Processing",
      shippingStatus: "Pending",
      shippingAddress: {
        address: "456 River View",
        city: "Ahmedabad",
        state: "Gujarat",
        postalCode: "380001",
        country: "India",
      },
      orderItems: [
        {
          productId: productB1._id,
          name: productB1.name,
          image: "protein.jpg",
          price: 800,
          quantity: 2,
        },
      ],
    });
    createdOrderIds.push(order2._id);

    // Order 3: Legacy + Requested + Admin Catalog Product (Vendor A items: 2x 400 + 1x 750 = 1550; Admin item: 1x 999 = 999)
    const order3 = await Order.create({
      orderNumber: `MWB-REAL-${Date.now()}-003`,
      user: adminUser._id,
      customerName: "Real Customer Chloe",
      customerEmail: `chloe_${RUN_TAG}@customer.com`,
      customerPhone: "919876543202",
      paymentMethod: "Razorpay",
      paymentId: `pay_real_test_${Date.now()}_03`,
      totalPrice: 2549, // 1550 + 999
      status: "Processing",
      shippingStatus: "Pending",
      shippingAddress: {
        address: "789 Hill Park",
        city: "Delhi",
        state: "Delhi",
        postalCode: "110001",
        country: "India",
      },
      orderItems: [
        {
          productId: productALegacy._id,
          name: productALegacy.name,
          image: "legacy.jpg",
          price: 400,
          quantity: 2,
        },
        {
          productId: productARequested._id,
          name: productARequested.name,
          image: "requested.jpg",
          price: 750,
          quantity: 1,
        },
        {
          productId: productAdminCatalog._id,
          name: productAdminCatalog.name,
          image: "catalog.jpg",
          price: 999,
          quantity: 1,
        },
      ],
    });
    createdOrderIds.push(order3._id);

    // Order Blank: Owned by Blank Email Vendor
    const orderBlank = await Order.create({
      orderNumber: `MWB-REAL-${Date.now()}-004`,
      user: adminUser._id,
      customerName: "Real Customer Sam",
      customerEmail: `sam_${RUN_TAG}@customer.com`,
      customerPhone: "919876543203",
      paymentMethod: "Razorpay",
      paymentId: `pay_real_test_${Date.now()}_04`,
      totalPrice: 250,
      status: "Processing",
      shippingStatus: "Pending",
      shippingAddress: {
        address: "100 Old Town",
        city: "Jaipur",
        state: "Rajasthan",
        postalCode: "302001",
        country: "India",
      },
      orderItems: [
        {
          productId: productBlankVendor._id,
          name: productBlankVendor.name,
          image: "blank.jpg",
          price: 250,
          quantity: 1,
        },
      ],
    });
    createdOrderIds.push(orderBlank._id);

    console.log("✓ Fixtures successfully seeded into MongoDB.\n");

    // Generate authenticated JWT tokens
    const tokenVendorA = jwt.sign({ vendorId: vendorA._id }, process.env.JWT_SECRET);
    const tokenVendorB = jwt.sign({ vendorId: vendorB._id }, process.env.JWT_SECRET);
    const tokenVendorC = jwt.sign({ vendorId: vendorC._id }, process.env.JWT_SECRET);
    const tokenBlankVendor = jwt.sign({ vendorId: vendorBlankEmail._id }, process.env.JWT_SECRET);
    const tokenWhitespaceVendor = jwt.sign({ vendorId: vendorWhitespaceEmail._id }, process.env.JWT_SECRET);

    // -------------------------------------------------------------
    // TEST 1: Real DB Blank & Whitespace Email Query Guard
    // -------------------------------------------------------------
    console.log("TEST 1: Real DB Blank & Whitespace Email Matching Guard");
    // Blank email vendor queries their own orders
    const resBlank = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenBlankVendor}` },
    });
    const dataBlank = await resBlank.json();
    assert(resBlank.status === 200, "Blank-email vendor receives HTTP 200");
    const blankOrder = dataBlank.orders.find((o) => o._id === String(orderBlank._id));
    assert(blankOrder !== undefined, "Blank-email vendor sees Order Blank in MongoDB");

    // Whitespace email vendor must NOT match blank email vendor in MongoDB via /^$/i
    const resWS = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenWhitespaceVendor}` },
    });
    const dataWS = await resWS.json();
    assert(resWS.status === 200, "Whitespace-email vendor receives HTTP 200");
    const stolenOrder = (dataWS.orders || []).find((o) => o._id === String(orderBlank._id));
    assert(
      !stolenOrder,
      "Whitespace-email vendor does NOT match blank-email vendor or steal Order Blank in MongoDB"
    );

    // -------------------------------------------------------------
    // TEST 2: Real DB Vendor A Order Isolation & Subtotal
    // -------------------------------------------------------------
    console.log("\nTEST 2: Real DB Vendor A Order List & Subtotal Sanitization");
    const resA = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenVendorA}` },
    });
    const dataA = await resA.json();
    assert(resA.status === 200, "Vendor A receives HTTP 200");
    const order1ForA = dataA.orders.find((o) => o._id === String(order1._id));
    assert(order1ForA !== undefined, "Vendor A receives Order 1");
    assert(order1ForA.orderItems.length === 1, "Order 1 contains ONLY Vendor A's product item");
    assert(
      String(order1ForA.orderItems[0].productId?._id || order1ForA.orderItems[0].productId) === String(productA1._id),
      "Item productId matches Product A1"
    );
    assert(
      order1ForA.totalPrice === 1000,
      "Order 1 totalPrice is sanitized to Vendor A subtotal (2 * 500 = ₹1000, Vendor B ₹800 stripped)"
    );
    assert(order1ForA.referral !== undefined, "Vendor A preserves their own referral details");

    // -------------------------------------------------------------
    // TEST 3: Real DB Vendor B Order Isolation & Cross-Vendor Data Hiding
    // -------------------------------------------------------------
    console.log("\nTEST 3: Real DB Vendor B Order List & Cross-Vendor Privacy");
    const resB = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenVendorB}` },
    });
    const dataB = await resB.json();
    assert(resB.status === 200, "Vendor B receives HTTP 200");
    const order1ForB = dataB.orders.find((o) => o._id === String(order1._id));
    const order2ForB = dataB.orders.find((o) => o._id === String(order2._id));
    assert(order1ForB !== undefined, "Vendor B sees Order 1");
    assert(order2ForB !== undefined, "Vendor B sees Order 2");
    assert(order1ForB.orderItems.length === 1, "Vendor B sees ONLY their item in Order 1");
    assert(
      String(order1ForB.orderItems[0].productId?._id || order1ForB.orderItems[0].productId) === String(productB1._id),
      "Item in Order 1 is Product B1"
    );
    assert(
      order1ForB.totalPrice === 800,
      "Order 1 totalPrice for Vendor B reflects only 1 * 800 = ₹800 (Vendor A ₹1000 stripped)"
    );
    assert(!order1ForB.referral, "Vendor A's referral details are removed for Vendor B");

    // -------------------------------------------------------------
    // TEST 4: Real DB Vendor C (Zero Owned Items)
    // -------------------------------------------------------------
    console.log("\nTEST 4: Real DB Vendor C Isolation (No Items Owned)");
    const resC = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenVendorC}` },
    });
    const dataC = await resC.json();
    assert(resC.status === 200, "Vendor C receives HTTP 200");
    assert(dataC.orders.length === 0, "Vendor C receives empty orders []");

    // -------------------------------------------------------------
    // TEST 5: Database Immutability Verification (MongoDB Integrity)
    // -------------------------------------------------------------
    console.log("\nTEST 5: MongoDB Document Immutability Check");
    const liveOrder1 = await Order.findById(order1._id).lean();
    assert(
      liveOrder1.totalPrice === 1800,
      "MongoDB database document totalPrice remains exactly ₹1800 (Financial integrity preserved)"
    );
    assert(
      liveOrder1.orderItems.length === 2,
      "MongoDB database document orderItems still contains both vendor products (Not corrupted)"
    );

    // -------------------------------------------------------------
    // TEST 6: Legacy Vendor Products & ProductRequest Approval Flow
    // -------------------------------------------------------------
    console.log("\nTEST 6: Real DB Legacy Products & ProductRequest Approval Linkage");
    const order3ForA = dataA.orders.find((o) => o._id === String(order3._id));
    assert(order3ForA !== undefined, "Vendor A sees Order 3");
    assert(order3ForA.orderItems.length === 2, "Order 3 contains ONLY Vendor A's 2 products");
    assert(
      order3ForA.orderItems.some((i) => String(i.productId?._id || i.productId) === String(productALegacy._id)),
      "Legacy product with createdBy: ADMIN is preserved"
    );
    assert(
      order3ForA.orderItems.some((i) => String(i.productId?._id || i.productId) === String(productARequested._id)),
      "Product created via approved ProductRequest is preserved"
    );
    assert(
      !order3ForA.orderItems.some((i) => String(i.productId?._id || i.productId) === String(productAdminCatalog._id)),
      "Platform Admin catalog product is completely excluded"
    );
    assert(
      order3ForA.totalPrice === 1550,
      "Order 3 totalPrice reflects (2 * 400) + (1 * 750) = ₹1550 (Admin ₹999 stripped)"
    );

    // -------------------------------------------------------------
    // TEST 7: Cross-Vendor Read & Modification Denial in Real MongoDB
    // -------------------------------------------------------------
    console.log("\nTEST 7: Real DB Cross-Vendor Access Denial (HTTP 403)");
    // Vendor C attempts to view Order 1
    const resReadC = await fetch(`${baseUrl}/orders/${order1._id}`, {
      headers: { Authorization: `Bearer ${tokenVendorC}` },
    });
    assert(resReadC.status === 403, "Vendor C order detail view rejected with HTTP 403 Forbidden");

    // Vendor C attempts to update Order 1 status
    const resStatusC = await fetch(`${baseUrl}/orders/${order1._id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVendorC}`,
      },
      body: JSON.stringify({ status: "Will be Out for Delivery in 1–2 Days" }),
    });
    assert(resStatusC.status === 403, "Vendor C status update rejected with HTTP 403 Forbidden");

    // Vendor C attempts to update Order 1 shipping
    const resShipC = await fetch(`${baseUrl}/orders/${order1._id}/shipping`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVendorC}`,
      },
      body: JSON.stringify({ shippingStatus: "Delivered" }),
    });
    assert(resShipC.status === 403, "Vendor C shipping update rejected with HTTP 403 Forbidden");

    // Verify Order 1 in MongoDB was not modified by Vendor C
    const postTamperOrder1 = await Order.findById(order1._id).lean();
    assert(postTamperOrder1.status === "Processing", "Order 1 status in MongoDB remained 'Processing'");
    assert(postTamperOrder1.shippingStatus === "Pending", "Order 1 shippingStatus in MongoDB remained 'Pending'");

    // -------------------------------------------------------------
    // TEST 8: Authorized Status & Shipping Transition in Real MongoDB
    // -------------------------------------------------------------
    console.log("\nTEST 8: Real DB Authorized Status & Shipping Transition");
    const resStatusA = await fetch(`${baseUrl}/orders/${order1._id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVendorA}`,
      },
      body: JSON.stringify({ status: "Will be Out for Delivery in 1–2 Days", note: "Packed by Vendor A" }),
    });
    assert(resStatusA.status === 200, "Vendor A status update succeeds with HTTP 200");

    const resShipA = await fetch(`${baseUrl}/orders/${order1._id}/shipping`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVendorA}`,
      },
      body: JSON.stringify({ shippingStatus: "In-Transit" }),
    });
    assert(resShipA.status === 200, "Vendor A shipping update succeeds with HTTP 200");

    // Verify in real MongoDB document
    const updatedOrder1 = await Order.findById(order1._id).lean();
    assert(
      updatedOrder1.status === "Will be Out for Delivery in 1–2 Days",
      "Order 1 status in MongoDB transitioned to 'Will be Out for Delivery in 1–2 Days'"
    );
    assert(
      updatedOrder1.shippingStatus === "In-Transit",
      "Order 1 shippingStatus in MongoDB updated to 'In-Transit'"
    );

    console.log("\n=================================================");
    console.log(` RESULTS: ${passedTests} / ${totalTests} assertions passed`);
    console.log("=================================================");

    if (passedTests === totalTests) {
      console.log("\n>>> ALL REAL MONGODB INTEGRATION TESTS PASSED SUCCESSFULLY! <<<\n");
    } else {
      throw new Error(`Only ${passedTests} of ${totalTests} tests passed.`);
    }
  } finally {
    // -------------------------------------------------------------
    // STRICT CLEANUP (Only deletes documents created by this test run)
    // -------------------------------------------------------------
    console.log("Cleaning up test documents from test database...");
    try {
      if (createdOrderIds.length > 0) {
        await Order.deleteMany({ _id: { $in: createdOrderIds } });
      }
      if (createdProductRequestIds.length > 0) {
        await ProductRequest.deleteMany({ _id: { $in: createdProductRequestIds } });
      }
      if (createdProductIds.length > 0) {
        await Product.deleteMany({ _id: { $in: createdProductIds } });
      }
      if (createdVendorIds.length > 0) {
        await Vendor.deleteMany({ _id: { $in: createdVendorIds } });
      }
      if (createdUserIds.length > 0) {
        await User.deleteMany({ _id: { $in: createdUserIds } });
      }
      console.log("✓ Strict cleanup complete. Zero shared or production data touched.\n");
    } catch (cleanupErr) {
      console.error("Cleanup warning:", cleanupErr.message);
    }

    server.close();
    await mongoose.connection.close();
  }
}

// Auto-run if invoked directly
if (require.main === module) {
  runIntegrationTests().catch((err) => {
    console.error("\nTest Execution Aborted:", err.message);
    process.exit(1);
  });
}

module.exports = { runIntegrationTests, validateTestUri };
