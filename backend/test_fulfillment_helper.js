/**
 * Test Suite: Vendor Fulfillment Builder (Phase 2.5A)
 *
 * Verifies that buildVendorFulfillments and tryBuildVendorFulfillments:
 * 1. Correctly groups multiple items for a single vendor.
 * 2. Correctly splits and groups items across multiple vendors.
 * 3. Handles verified platform-owned products (vendorId: null, vendorName: "MetaFit Direct").
 * 4. Preserves distinct variants of the same product (different sizes/colors).
 * 5. Preserves repeated line items with identical product IDs without collapsing them.
 * 6. Safely detects and reports missing or invalid ownership information.
 * 7. Safely rejects contradictory or unresolved vendor ownership (never defaults silently to platform).
 * 8. Safely handles empty order items ([] and null/undefined).
 * 9. Guarantees strict immutability of input objects (items and ownership map).
 * 10. Generates unique fulfillment IDs and schema-compatible initial statuses.
 * 11. Validates schema compatibility directly against Mongoose Order model.
 */

const assert = require("assert");
const mongoose = require("mongoose");
const Order = require("./models/Order");
const {
  buildVendorFulfillments,
  tryBuildVendorFulfillments,
  FulfillmentBuilderError,
  INITIAL_FULFILLMENT_STATUS,
  INITIAL_SHIPPING_STATUS,
  DEFAULT_COURIER,
  PLATFORM_VENDOR_NAME,
} = require("./utils/fulfillmentHelper");

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    throw err;
  }
}

console.log("==================================================================");
console.log(" PHASE 2.5A: VENDOR FULFILLMENT BUILDER TEST SUITE");
console.log("==================================================================\n");

// Mock ObjectIds
const VENDOR_A_ID = new mongoose.Types.ObjectId("65000000000000000000000a");
const VENDOR_B_ID = new mongoose.Types.ObjectId("65000000000000000000000b");
const VENDOR_C_ID = new mongoose.Types.ObjectId("65000000000000000000000c");

const PROD_A1_ID = new mongoose.Types.ObjectId("6500000000000000000000a1");
const PROD_A2_ID = new mongoose.Types.ObjectId("6500000000000000000000a2");
const PROD_B1_ID = new mongoose.Types.ObjectId("6500000000000000000000b1");
const PROD_C1_ID = new mongoose.Types.ObjectId("6500000000000000000000c1");
const PROD_PLATFORM_ID = new mongoose.Types.ObjectId("6500000000000000000000f1");

// -------------------------------------------------------------------------
// 1. One vendor with multiple items
// -------------------------------------------------------------------------
test("1. One vendor with multiple items is grouped into a single fulfillment", () => {
  const orderItems = [
    { productId: PROD_A1_ID, name: "Organic Green Tea", price: 299, quantity: 2, image: "tea.jpg" },
    { productId: PROD_A2_ID, name: "Herbal Chamomile", price: 349, quantity: 1, image: "chamomile.jpg" },
  ];

  const ownershipMap = new Map([
    [PROD_A1_ID.toString(), { isPlatform: false, vendorId: VENDOR_A_ID, vendorName: "Aura Herbals" }],
    [PROD_A2_ID.toString(), { isPlatform: false, vendorId: VENDOR_A_ID, vendorName: "Aura Herbals" }],
  ]);

  const fulfillments = buildVendorFulfillments(orderItems, ownershipMap, { orderNumber: "MWB-1001" });

  assert.strictEqual(fulfillments.length, 1, "Should create exactly 1 fulfillment group");
  const f = fulfillments[0];
  assert.strictEqual(f.vendorId, VENDOR_A_ID, "Vendor ID should match VENDOR_A_ID");
  assert.strictEqual(f.vendorName, "Aura Herbals", "Vendor name matches");
  assert.strictEqual(f.items.length, 2, "Fulfillment must contain both line items");
  assert.strictEqual(f.items[0].name, "Organic Green Tea");
  assert.strictEqual(f.items[0].quantity, 2);
  assert.strictEqual(f.items[1].name, "Herbal Chamomile");
  assert.strictEqual(f.items[1].quantity, 1);
});

// -------------------------------------------------------------------------
// 2. Multiple vendors in one order
// -------------------------------------------------------------------------
test("2. Multiple vendors in one order are split into distinct fulfillment groups", () => {
  const orderItems = [
    { productId: PROD_A1_ID, name: "Organic Green Tea", price: 299, quantity: 1, image: "tea.jpg" },
    { productId: PROD_B1_ID, name: "Whey Protein 1kg", price: 1899, quantity: 2, image: "whey.jpg" },
    { productId: PROD_C1_ID, name: "Cold Pressed Coconut Oil", price: 450, quantity: 1, image: "oil.jpg" },
  ];

  const ownershipMap = {
    [PROD_A1_ID.toString()]: { isPlatform: false, vendorId: VENDOR_A_ID, vendorName: "Aura Herbals" },
    [PROD_B1_ID.toString()]: { isPlatform: false, vendorId: VENDOR_B_ID, vendorName: "Titan Nutrition" },
    [PROD_C1_ID.toString()]: { isPlatform: false, vendorId: VENDOR_C_ID, vendorName: "Zen Organics" },
  };

  const fulfillments = buildVendorFulfillments(orderItems, ownershipMap, { orderNumber: "MWB-1002" });

  assert.strictEqual(fulfillments.length, 3, "Must create 3 distinct fulfillment packages");

  const vA = fulfillments.find(f => String(f.vendorId) === VENDOR_A_ID.toString());
  const vB = fulfillments.find(f => String(f.vendorId) === VENDOR_B_ID.toString());
  const vC = fulfillments.find(f => String(f.vendorId) === VENDOR_C_ID.toString());

  assert(vA, "Fulfillment for Vendor A exists");
  assert.strictEqual(vA.vendorName, "Aura Herbals");
  assert.strictEqual(vA.items.length, 1);
  assert.strictEqual(vA.items[0].name, "Organic Green Tea");

  assert(vB, "Fulfillment for Vendor B exists");
  assert.strictEqual(vB.vendorName, "Titan Nutrition");
  assert.strictEqual(vB.items.length, 1);
  assert.strictEqual(vB.items[0].quantity, 2);

  assert(vC, "Fulfillment for Vendor C exists");
  assert.strictEqual(vC.vendorName, "Zen Organics");
  assert.strictEqual(vC.items.length, 1);
});

// -------------------------------------------------------------------------
// 3. Verified platform-owned item
// -------------------------------------------------------------------------
test("3. Verified platform-owned item has vendorId: null and vendorName: 'MetaFit Direct'", () => {
  const orderItems = [
    { productId: PROD_PLATFORM_ID, name: "MetaFit Branded Shaker", price: 199, quantity: 1, image: "shaker.jpg" },
    { productId: PROD_A1_ID, name: "Organic Green Tea", price: 299, quantity: 1, image: "tea.jpg" },
  ];

  const ownershipMap = new Map([
    [PROD_PLATFORM_ID.toString(), { isPlatform: true }],
    [PROD_A1_ID.toString(), { isPlatform: false, vendorId: VENDOR_A_ID, vendorName: "Aura Herbals" }],
  ]);

  const fulfillments = buildVendorFulfillments(orderItems, ownershipMap, { orderNumber: "MWB-1003" });

  assert.strictEqual(fulfillments.length, 2, "Should create 1 platform package and 1 vendor package");

  const platformPkg = fulfillments.find(f => f.vendorId === null);
  const vendorPkg = fulfillments.find(f => f.vendorId !== null);

  assert(platformPkg, "Platform fulfillment exists");
  assert.strictEqual(platformPkg.vendorId, null, "Platform package vendorId must strictly be null");
  assert.strictEqual(platformPkg.vendorName, PLATFORM_VENDOR_NAME, "Platform package vendorName is 'MetaFit Direct'");
  assert.strictEqual(platformPkg.items.length, 1);
  assert.strictEqual(platformPkg.items[0].name, "MetaFit Branded Shaker");

  assert(vendorPkg, "Vendor package exists");
  assert.strictEqual(String(vendorPkg.vendorId), VENDOR_A_ID.toString());
});

// -------------------------------------------------------------------------
// 4. Same product appearing in different variants
// -------------------------------------------------------------------------
test("4. The same product in different variants is preserved as separate line items", () => {
  const orderItems = [
    { productId: PROD_B1_ID, name: "Titan T-Shirt", size: "M", color: "Black", price: 599, quantity: 1, image: "shirt.jpg" },
    { productId: PROD_B1_ID, name: "Titan T-Shirt", size: "XL", color: "Blue", price: 649, quantity: 2, image: "shirt.jpg" },
  ];

  const ownershipMap = {
    [PROD_B1_ID.toString()]: { isPlatform: false, vendorId: VENDOR_B_ID, vendorName: "Titan Nutrition" },
  };

  const fulfillments = buildVendorFulfillments(orderItems, ownershipMap, { orderNumber: "MWB-1004" });

  assert.strictEqual(fulfillments.length, 1, "Both variants belong to same vendor fulfillment");
  const f = fulfillments[0];
  assert.strictEqual(f.items.length, 2, "Variants must remain 2 separate line items");
  assert.strictEqual(f.items[0].size, "M");
  assert.strictEqual(f.items[0].color, "Black");
  assert.strictEqual(f.items[0].quantity, 1);
  assert.strictEqual(f.items[1].size, "XL");
  assert.strictEqual(f.items[1].color, "Blue");
  assert.strictEqual(f.items[1].quantity, 2);
});

// -------------------------------------------------------------------------
// 5. Repeated items with the same product ID remaining separate
// -------------------------------------------------------------------------
test("5. Repeated items with the exact same product ID remain separate line items (not collapsed)", () => {
  const orderItems = [
    { productId: PROD_A1_ID, name: "Organic Green Tea", price: 299, quantity: 1, image: "tea.jpg" },
    { productId: PROD_A1_ID, name: "Organic Green Tea", price: 299, quantity: 1, image: "tea.jpg" },
  ];

  const ownershipMap = {
    [PROD_A1_ID.toString()]: { isPlatform: false, vendorId: VENDOR_A_ID, vendorName: "Aura Herbals" },
  };

  const fulfillments = buildVendorFulfillments(orderItems, ownershipMap, { orderNumber: "MWB-1005" });

  assert.strictEqual(fulfillments.length, 1);
  const f = fulfillments[0];
  assert.strictEqual(f.items.length, 2, "Items must NOT be collapsed into quantity 2; line items remain distinct");
  assert.strictEqual(f.items[0].quantity, 1);
  assert.strictEqual(f.items[1].quantity, 1);
});

// -------------------------------------------------------------------------
// 6. Missing or invalid ownership information
// -------------------------------------------------------------------------
test("6. Missing or invalid ownership information throws or returns clear validation error", () => {
  const orderItems = [
    { productId: PROD_A1_ID, name: "Organic Green Tea", price: 299, quantity: 1 },
  ];

  // 6a: Unresolved ownership for product
  assert.throws(
    () => buildVendorFulfillments(orderItems, {}),
    (err) => {
      assert(err instanceof FulfillmentBuilderError);
      assert.strictEqual(err.code, "UNRESOLVED_OWNERSHIP");
      return true;
    },
    "Should throw UNRESOLVED_OWNERSHIP when product ID is missing from map"
  );

  // 6b: Safe wrapper returns structured error
  const safeResult = tryBuildVendorFulfillments(orderItems, {});
  assert.strictEqual(safeResult.success, false);
  assert.strictEqual(safeResult.code, "UNRESOLVED_OWNERSHIP");
  assert(safeResult.error.includes(PROD_A1_ID.toString()));

  // 6c: Item missing productId
  const badItem = [{ name: "Orphan Item", price: 100, quantity: 1 }];
  assert.throws(
    () => buildVendorFulfillments(badItem, { [PROD_A1_ID.toString()]: { isPlatform: true } }),
    (err) => {
      assert.strictEqual(err.code, "MISSING_PRODUCT_ID");
      return true;
    }
  );

  // 6d: Invalid ownershipMap argument
  assert.throws(
    () => buildVendorFulfillments(orderItems, "not-a-map"),
    (err) => {
      assert.strictEqual(err.code, "INVALID_OWNERSHIP_MAP");
      return true;
    }
  );
});

// -------------------------------------------------------------------------
// 7. Contradictory or unresolved vendor mapping
// -------------------------------------------------------------------------
test("7. Contradictory or unresolved vendor mapping is strictly rejected (never silently platform)", () => {
  // 7a: Contradictory ownership: isPlatform: true with a vendorId
  const contradictoryOwnership = {
    [PROD_A1_ID.toString()]: {
      isPlatform: true,
      vendorId: VENDOR_A_ID,
      vendorName: "Aura Herbals",
    },
  };
  const orderItems = [{ productId: PROD_A1_ID, name: "Tea", price: 299, quantity: 1 }];

  assert.throws(
    () => buildVendorFulfillments(orderItems, contradictoryOwnership),
    (err) => {
      assert(err instanceof FulfillmentBuilderError);
      assert.strictEqual(err.code, "CONTRADICTORY_OWNERSHIP");
      return true;
    },
    "Should throw CONTRADICTORY_OWNERSHIP when both isPlatform and vendorId are set"
  );

  // 7b: Unresolved vendor ownership: isPlatform is false but vendorId is missing or empty
  const missingVendorIdOwnership = {
    [PROD_A1_ID.toString()]: {
      isPlatform: false,
      vendorId: null,
      vendorName: "Aura Herbals",
    },
  };

  assert.throws(
    () => buildVendorFulfillments(orderItems, missingVendorIdOwnership),
    (err) => {
      assert(err instanceof FulfillmentBuilderError);
      assert.strictEqual(err.code, "MISSING_VENDOR_ID");
      return true;
    },
    "Should throw MISSING_VENDOR_ID rather than defaulting to platform"
  );

  // 7c: Blank string vendorId is also rejected
  const blankVendorIdOwnership = {
    [PROD_A1_ID.toString()]: {
      isPlatform: false,
      vendorId: "   ",
    },
  };

  assert.throws(
    () => buildVendorFulfillments(orderItems, blankVendorIdOwnership),
    (err) => {
      assert.strictEqual(err.code, "MISSING_VENDOR_ID");
      return true;
    }
  );
});

// -------------------------------------------------------------------------
// 8. Empty order items
// -------------------------------------------------------------------------
test("8. Empty order items returns an empty fulfillments array safely", () => {
  assert.deepStrictEqual(buildVendorFulfillments([], {}), []);
  assert.deepStrictEqual(buildVendorFulfillments(null, {}), []);
  assert.deepStrictEqual(buildVendorFulfillments(undefined, {}), []);

  assert.throws(
    () => buildVendorFulfillments("not-an-array", {}),
    (err) => {
      assert.strictEqual(err.code, "INVALID_ORDER_ITEMS");
      return true;
    }
  );
});

// -------------------------------------------------------------------------
// 9. Input objects remain unchanged after building (Immutability)
// -------------------------------------------------------------------------
test("9. Input objects (order items and ownership map) remain strictly unmodified", () => {
  const originalItem = {
    productId: PROD_A1_ID,
    name: "Organic Green Tea",
    price: 299,
    quantity: 2,
    size: "250g",
    color: "Natural",
    image: "tea.jpg",
  };

  const orderItems = [originalItem];
  const itemCloneBefore = { ...originalItem };

  const ownershipObj = {
    isPlatform: false,
    vendorId: VENDOR_A_ID,
    vendorName: "Aura Herbals",
  };
  const ownershipMap = {
    [PROD_A1_ID.toString()]: ownershipObj,
  };
  const ownershipCloneBefore = { ...ownershipObj };

  const fulfillments = buildVendorFulfillments(orderItems, ownershipMap, { orderNumber: "MWB-1009" });

  // Verify inputs were not modified during execution
  assert.strictEqual(originalItem.productId, PROD_A1_ID, "Original productId must remain the same reference");
  assert.deepStrictEqual(originalItem, itemCloneBefore, "Original item object must not be mutated");
  assert.strictEqual(ownershipObj.vendorId, VENDOR_A_ID, "Original vendorId must remain the same reference");
  assert.deepStrictEqual(ownershipObj, ownershipCloneBefore, "Original ownership object must not be mutated");

  // Mutate output to ensure deep decoupling
  fulfillments[0].items[0].name = "MUTATED NAME";
  fulfillments[0].items[0].quantity = 999;
  fulfillments[0].items.push({ name: "NEW INJECTED ITEM" });

  assert.strictEqual(originalItem.name, "Organic Green Tea", "Mutating fulfillment item does not mutate input item");
  assert.strictEqual(originalItem.quantity, 2, "Mutating fulfillment quantity does not mutate input item");
  assert.strictEqual(orderItems.length, 1, "Pushing to fulfillment items does not modify orderItems");
});

// -------------------------------------------------------------------------
// 10. Every generated fulfillment has a unique ID and schema-compatible initial status
// -------------------------------------------------------------------------
test("10. Every generated fulfillment has a unique ID and schema-compatible initial status", () => {
  const fixedDate = new Date("2026-10-22T10:00:00.000Z");
  const orderItems = [
    { productId: PROD_A1_ID, name: "Tea", price: 200, quantity: 1 },
    { productId: PROD_B1_ID, name: "Protein", price: 800, quantity: 1 },
    { productId: PROD_PLATFORM_ID, name: "Shaker", price: 150, quantity: 1 },
  ];

  const ownershipMap = {
    [PROD_A1_ID.toString()]: { isPlatform: false, vendorId: VENDOR_A_ID, vendorName: "Aura Herbals" },
    [PROD_B1_ID.toString()]: { isPlatform: false, vendorId: VENDOR_B_ID, vendorName: "Titan Nutrition" },
    [PROD_PLATFORM_ID.toString()]: { isPlatform: true },
  };

  const fulfillments = buildVendorFulfillments(orderItems, ownershipMap, {
    orderNumber: "MWB-20261022-9999",
    now: fixedDate,
  });

  assert.strictEqual(fulfillments.length, 3);

  // Check unique IDs
  const idSet = new Set(fulfillments.map(f => f.fulfillmentId));
  assert.strictEqual(idSet.size, 3, "All fulfillmentIds must be strictly unique");

  fulfillments.forEach((f, idx) => {
    assert(typeof f.fulfillmentId === "string" && f.fulfillmentId.startsWith("FUL-MWB-20261022-9999"), "ID format starts with FUL-orderNumber");
    assert.strictEqual(f.status, INITIAL_FULFILLMENT_STATUS, "status is 'Processing'");
    assert.strictEqual(f.shippingStatus, INITIAL_SHIPPING_STATUS, "shippingStatus is 'Pending'");
    assert.strictEqual(f.courier, DEFAULT_COURIER, "courier is 'standard'");
    assert.strictEqual(f.awbNo, null, "awbNo is initialized as null");
    assert.strictEqual(f.trackingId, null, "trackingId is initialized as null");
    assert.strictEqual(f.pickupAddressSnapshot, null, "pickupAddressSnapshot is initialized as null");
    assert.strictEqual(f.statusHistory.length, 1, "Initial status history has 1 entry");
    assert.strictEqual(f.statusHistory[0].status, "Processing");
    assert.strictEqual(f.statusHistory[0].updatedBy, "System");
    assert.strictEqual(f.statusHistory[0].note, "Order placed");
    assert.strictEqual(f.statusHistory[0].timestamp, fixedDate);
    assert.strictEqual(f.createdAt, fixedDate);
    assert.strictEqual(f.updatedAt, fixedDate);
  });
});

// -------------------------------------------------------------------------
// 11. Schema Compatibility with Mongoose Order Model
// -------------------------------------------------------------------------
test("11. Generated fulfillments validate cleanly against Order Mongoose Schema", () => {
  const orderItems = [
    { productId: PROD_A1_ID, name: "Tea", price: 200, quantity: 1, image: "tea.jpg" },
    { productId: PROD_PLATFORM_ID, name: "Shaker", price: 150, quantity: 1, image: "shaker.jpg" },
  ];

  const ownershipMap = {
    [PROD_A1_ID.toString()]: { isPlatform: false, vendorId: VENDOR_A_ID, vendorName: "Aura Herbals" },
    [PROD_PLATFORM_ID.toString()]: { isPlatform: true },
  };

  const fulfillments = buildVendorFulfillments(orderItems, ownershipMap, { orderNumber: "MWB-SCHEMA-1" });

  const orderDoc = new Order({
    orderNumber: "MWB-SCHEMA-1",
    user: new mongoose.Types.ObjectId(),
    customerName: "Test Buyer",
    customerEmail: "buyer@test.com",
    customerPhone: "919999999999",
    orderItems: [
      { productId: PROD_A1_ID, name: "Tea", price: 200, quantity: 1, image: "tea.jpg" },
      { productId: PROD_PLATFORM_ID, name: "Shaker", price: 150, quantity: 1, image: "shaker.jpg" },
    ],
    totalPrice: 350,
    paymentMethod: "Razorpay",
    paymentId: "pay_test_fulfillment_12345",
    shippingAddress: {
      address: "123 Green Ave",
      city: "Mumbai",
      postalCode: "400001",
      country: "India",
    },
    status: "Processing",
    shippingStatus: "Pending",
    vendorFulfillments: fulfillments,
  });

  const validationError = orderDoc.validateSync();
  assert.strictEqual(
    validationError,
    undefined,
    `Mongoose schema validation must pass without errors: ${validationError?.message}`
  );
  assert.strictEqual(orderDoc.vendorFulfillments.length, 2);
  assert.strictEqual(orderDoc.vendorFulfillments[0].status, "Processing");
  assert.strictEqual(orderDoc.vendorFulfillments[1].status, "Processing");
  assert.strictEqual(orderDoc.vendorFulfillments[0].shippingStatus, "Pending");
  assert.strictEqual(orderDoc.vendorFulfillments[1].shippingStatus, "Pending");
});

console.log("\n==================================================================");
console.log(` RESULTS: ${passedTests} / ${totalTests} test suites passed`);
console.log("==================================================================");

if (passedTests === totalTests) {
  console.log("\n>>> ALL PHASE 2.5A FULFILLMENT BUILDER TESTS PASSED SUCCESSFULLY! <<<\n");
} else {
  console.error(`\n>>> FAILED: ${totalTests - passedTests} tests failed <<<\n`);
  process.exit(1);
}
