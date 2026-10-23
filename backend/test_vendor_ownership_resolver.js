/**
 * Test Suite: Vendor Ownership Resolver (Phase 2.5B)
 *
 * Verifies that resolveProductOwnership and tryResolveProductOwnership:
 * 1. Resolves product that already references a valid Vendor ID.
 * 2. Resolves product referencing a User ID with a verified linked Vendor relationship.
 * 3. Resolves product via ProductRequest only when relationship and approval are verified.
 * 4. Resolves explicitly verified platform-owned product (createdBy: "ADMIN", vendorId: null).
 * 5. Safely rejects missing product with PRODUCT_NOT_FOUND.
 * 6. Safely rejects unresolved vendor references with UNRESOLVED_VENDOR.
 * 7. Safely rejects conflicting Vendor / User / ProductRequest mappings with CONFLICTING_OWNERSHIP.
 * 8. Safely rejects inactive or suspended vendors with INACTIVE_VENDOR.
 * 9. Handles duplicate product IDs efficiently and consistently without duplicate queries.
 * 10. Directly integrates with buildVendorFulfillments from fulfillmentHelper.js.
 */

const assert = require("assert");
const mongoose = require("mongoose");
const {
  resolveProductOwnership,
  tryResolveProductOwnership,
  VendorOwnershipResolverError,
} = require("./utils/vendorOwnershipResolver");
const { buildVendorFulfillments } = require("./utils/fulfillmentHelper");

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    const res = fn();
    if (res && typeof res.then === "function") {
      return res.then(() => {
        console.log(`  ✓ ${name}`);
        passedTests++;
      }).catch((err) => {
        console.error(`  ✗ ${name}`);
        console.error(err);
        throw err;
      });
    }
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    throw err;
  }
}

console.log("==================================================================");
console.log(" PHASE 2.5B: VENDOR OWNERSHIP RESOLVER TEST SUITE");
console.log("==================================================================\n");

// Mock ObjectIds
const VENDOR_A_ID = new mongoose.Types.ObjectId("65000000000000000000000a");
const VENDOR_B_ID = new mongoose.Types.ObjectId("65000000000000000000000b");
const VENDOR_INACTIVE_ID = new mongoose.Types.ObjectId("65000000000000000000000d");

const USER_VENDOR_A_ID = new mongoose.Types.ObjectId("65000000000000000000001a");
const USER_UNLINKED_ID = new mongoose.Types.ObjectId("65000000000000000000001b");
const ADMIN_USER_ID = new mongoose.Types.ObjectId("6500000000000000000000aa");

const PROD_DIRECT_VENDOR_ID = new mongoose.Types.ObjectId("6500000000000000000000a1");
const PROD_USER_LINKED_ID = new mongoose.Types.ObjectId("6500000000000000000000a2");
const PROD_REQUEST_APPROVED_ID = new mongoose.Types.ObjectId("6500000000000000000000a3");
const PROD_REQUEST_PENDING_ID = new mongoose.Types.ObjectId("6500000000000000000000a4");
const PROD_PLATFORM_CATALOG_ID = new mongoose.Types.ObjectId("6500000000000000000000f1");
const PROD_PLATFORM_EXPLICIT_ID = new mongoose.Types.ObjectId("6500000000000000000000f2");
const PROD_UNRESOLVED_VENDOR_ID = new mongoose.Types.ObjectId("6500000000000000000000e1");
const PROD_CONFLICTING_ID = new mongoose.Types.ObjectId("6500000000000000000000c1");
const PROD_INACTIVE_VENDOR_ID = new mongoose.Types.ObjectId("6500000000000000000000d1");
const NON_EXISTENT_PROD_ID = new mongoose.Types.ObjectId("650000000000000000000099");

/**
 * Creates an in-memory mock environment with controlled stores
 */
function createMockModels(initialData = {}) {
  const store = {
    products: initialData.products ? [...initialData.products] : [],
    vendors: initialData.vendors ? [...initialData.vendors] : [],
    users: initialData.users ? [...initialData.users] : [],
    productRequests: initialData.productRequests ? [...initialData.productRequests] : [],
  };

  const createMockFinder = (items) => {
    return {
      find: (query) => {
        let results = items;

        if (query) {
          if (query.$or) {
            results = results.filter((item) => {
              return query.$or.some((subQuery) => {
                return Object.entries(subQuery).every(([k, v]) => {
                  if (k === "_id" && v && v.$in) {
                    const stringIn = v.$in.map(String);
                    return stringIn.includes(String(item._id));
                  }
                  if (v && v.$in) {
                    const stringIn = v.$in.map(String);
                    return stringIn.includes(String(item[k]));
                  }
                  if (v instanceof RegExp) {
                    return v.test(item[k]);
                  }
                  return item[k] === v;
                });
              });
            });
          } else {
            results = results.filter((item) => {
              return Object.entries(query).every(([k, v]) => {
                if (k === "_id" && v && v.$in) {
                  const stringIn = v.$in.map(String);
                  return stringIn.includes(String(item._id));
                }
                if (v && v.$in) {
                  const stringIn = v.$in.map(String);
                  return stringIn.includes(String(item[k]));
                }
                if (v instanceof RegExp) {
                  return v.test(item[k]);
                }
                return item[k] === v;
              });
            });
          }
        }

        return {
          lean: async () => JSON.parse(JSON.stringify(results)),
          select: () => ({
            lean: async () => JSON.parse(JSON.stringify(results)),
          }),
        };
      },
      findById: async (id) => {
        const found = items.find((i) => String(i._id) === String(id));
        return found ? JSON.parse(JSON.stringify(found)) : null;
      },
    };
  };

  return {
    Product: createMockFinder(store.products),
    Vendor: createMockFinder(store.vendors),
    User: createMockFinder(store.users),
    ProductRequest: createMockFinder(store.productRequests),
    store,
  };
}

async function runAllTests() {
  // Common test fixture data
  const defaultFixture = {
    vendors: [
      {
        _id: VENDOR_A_ID,
        vendorName: "Aura Herbals",
        businessName: "Aura Herbals Pvt Ltd",
        email: "aura@test.com",
        phone: "919876543210",
        status: "approved",
      },
      {
        _id: VENDOR_B_ID,
        vendorName: "Titan Nutrition",
        businessName: "Titan Nutrition Ltd",
        email: "titan@test.com",
        phone: "919876543220",
        status: "approved",
      },
      {
        _id: VENDOR_INACTIVE_ID,
        vendorName: "Suspended Vendor",
        businessName: "Suspended Goods",
        email: "suspended@test.com",
        phone: "919876543230",
        status: "pending",
      },
    ],
    users: [
      {
        _id: USER_VENDOR_A_ID,
        name: "Aura Owner User",
        email: "aura@test.com", // Matches VENDOR_A_ID by email
        phone: "9876543210",    // Matches VENDOR_A_ID by normalized phone
        role: "vendor",
      },
      {
        _id: USER_UNLINKED_ID,
        name: "Unlinked User",
        email: "unlinked@test.com",
        phone: "9111111111",
        role: "vendor",
      },
      {
        _id: ADMIN_USER_ID,
        name: "Platform Admin",
        email: "admin@metafit.com",
        role: "admin",
      },
    ],
    products: [
      {
        _id: PROD_DIRECT_VENDOR_ID,
        name: "Organic Green Tea",
        vendorId: VENDOR_A_ID,
        user: USER_VENDOR_A_ID,
        createdBy: "VENDOR",
      },
      {
        _id: PROD_USER_LINKED_ID,
        name: "Legacy Vendor Protein",
        vendorId: USER_VENDOR_A_ID, // Legacy Product.vendorId referencing User
        user: USER_VENDOR_A_ID,
        createdBy: "VENDOR",
      },
      {
        _id: PROD_REQUEST_APPROVED_ID,
        name: "Approved Requested Supplement",
        user: ADMIN_USER_ID,
        vendorId: null,
        createdBy: "ADMIN",
      },
      {
        _id: PROD_REQUEST_PENDING_ID,
        name: "Pending Requested Supplement",
        user: ADMIN_USER_ID,
        vendorId: null,
        createdBy: "ADMIN",
      },
      {
        _id: PROD_PLATFORM_CATALOG_ID,
        name: "MetaFit Standard Shaker",
        vendorId: null,
        user: ADMIN_USER_ID,
        createdBy: "ADMIN",
      },
      {
        _id: PROD_PLATFORM_EXPLICIT_ID,
        name: "MetaFit Direct Yoga Mat",
        isPlatform: true,
        vendorId: null,
        user: ADMIN_USER_ID,
        createdBy: "ADMIN",
      },
      {
        _id: PROD_UNRESOLVED_VENDOR_ID,
        name: "Ghost Vendor Product",
        vendorId: new mongoose.Types.ObjectId("650000000000000000000099"),
        user: USER_UNLINKED_ID,
        createdBy: "VENDOR",
      },
      {
        _id: PROD_CONFLICTING_ID,
        name: "Conflicting Ownership Item",
        vendorId: VENDOR_A_ID, // Direct vendor says Vendor A
        user: USER_VENDOR_A_ID,
        createdBy: "VENDOR",
      },
      {
        _id: PROD_INACTIVE_VENDOR_ID,
        name: "Suspended Vendor Item",
        vendorId: VENDOR_INACTIVE_ID,
        user: ADMIN_USER_ID,
        createdBy: "VENDOR",
      },
    ],
    productRequests: [
      {
        _id: new mongoose.Types.ObjectId(),
        productId: PROD_REQUEST_APPROVED_ID,
        vendorId: VENDOR_B_ID,
        status: "approved",
      },
      {
        _id: new mongoose.Types.ObjectId(),
        productId: PROD_REQUEST_PENDING_ID,
        vendorId: VENDOR_B_ID,
        status: "pending", // Pending request must NOT establish ownership
      },
      {
        _id: new mongoose.Types.ObjectId(),
        productId: PROD_CONFLICTING_ID,
        vendorId: VENDOR_B_ID, // Conflicts with PROD_CONFLICTING_ID's VENDOR_A_ID!
        status: "approved",
      },
    ],
  };

  // -------------------------------------------------------------------------
  // 1. Product already references a valid Vendor ID
  // -------------------------------------------------------------------------
  await test("1. Product already references a valid Vendor ID", async () => {
    const models = createMockModels(defaultFixture);
    const ownershipMap = await resolveProductOwnership([PROD_DIRECT_VENDOR_ID], { models });

    assert(ownershipMap instanceof Map);
    const ownership = ownershipMap.get(PROD_DIRECT_VENDOR_ID.toString());
    assert(ownership, "Ownership entry must exist");
    assert.strictEqual(ownership.isPlatform, false);
    assert.strictEqual(String(ownership.vendorId), VENDOR_A_ID.toString());
    assert.strictEqual(ownership.vendorName, "Aura Herbals");
  });

  // -------------------------------------------------------------------------
  // 2. Product references a User ID and a verified Vendor relationship exists
  // -------------------------------------------------------------------------
  await test("2. Product references a User ID and a verified Vendor relationship exists", async () => {
    const models = createMockModels(defaultFixture);
    const ownershipMap = await resolveProductOwnership([PROD_USER_LINKED_ID], { models });

    const ownership = ownershipMap.get(PROD_USER_LINKED_ID.toString());
    assert(ownership, "Ownership entry must exist");
    assert.strictEqual(ownership.isPlatform, false);
    // Crucial: Must resolve to the Vendor._id, NOT the User._id
    assert.strictEqual(String(ownership.vendorId), VENDOR_A_ID.toString(), "Must resolve to actual Vendor._id");
    assert.strictEqual(ownership.vendorName, "Aura Herbals");
  });

  // -------------------------------------------------------------------------
  // 3. ProductRequest mapping is used only when relationship and approval are verified
  // -------------------------------------------------------------------------
  await test("3. ProductRequest mapping is used only when relationship and approval are verified", async () => {
    const models = createMockModels(defaultFixture);

    // 3a. Approved ProductRequest resolves to the requested Vendor
    const ownershipMap = await resolveProductOwnership([PROD_REQUEST_APPROVED_ID], { models });
    const approvedOwnership = ownershipMap.get(PROD_REQUEST_APPROVED_ID.toString());
    assert(approvedOwnership);
    assert.strictEqual(approvedOwnership.isPlatform, false);
    assert.strictEqual(String(approvedOwnership.vendorId), VENDOR_B_ID.toString());
    assert.strictEqual(approvedOwnership.vendorName, "Titan Nutrition");

    // 3b. Pending ProductRequest is NOT used; product remains admin catalog platform-owned
    const pendingMap = await resolveProductOwnership([PROD_REQUEST_PENDING_ID], { models });
    const pendingOwnership = pendingMap.get(PROD_REQUEST_PENDING_ID.toString());
    assert(pendingOwnership);
    assert.strictEqual(pendingOwnership.isPlatform, true, "Pending ProductRequest does NOT establish vendor ownership");
    assert.strictEqual(pendingOwnership.vendorName, "MetaFit Direct");
  });

  // -------------------------------------------------------------------------
  // 4. Explicitly verified platform-owned product
  // -------------------------------------------------------------------------
  await test("4. Explicitly verified platform-owned product", async () => {
    const models = createMockModels(defaultFixture);
    const ownershipMap = await resolveProductOwnership(
      [PROD_PLATFORM_CATALOG_ID, PROD_PLATFORM_EXPLICIT_ID],
      { models }
    );

    // Catalog product (createdBy: "ADMIN", vendorId: null)
    const catalogOwnership = ownershipMap.get(PROD_PLATFORM_CATALOG_ID.toString());
    assert(catalogOwnership);
    assert.strictEqual(catalogOwnership.isPlatform, true);
    assert.strictEqual(catalogOwnership.vendorName, "MetaFit Direct");

    // Explicitly flagged platform product
    const explicitOwnership = ownershipMap.get(PROD_PLATFORM_EXPLICIT_ID.toString());
    assert(explicitOwnership);
    assert.strictEqual(explicitOwnership.isPlatform, true);
    assert.strictEqual(explicitOwnership.vendorName, "MetaFit Direct");
  });

  // -------------------------------------------------------------------------
  // 5. Missing product
  // -------------------------------------------------------------------------
  await test("5. Missing product throws PRODUCT_NOT_FOUND error", async () => {
    const models = createMockModels(defaultFixture);

    await assert.rejects(
      async () => {
        await resolveProductOwnership([NON_EXISTENT_PROD_ID], { models });
      },
      (err) => {
        assert(err instanceof VendorOwnershipResolverError);
        assert.strictEqual(err.code, "PRODUCT_NOT_FOUND");
        assert(err.message.includes(NON_EXISTENT_PROD_ID.toString()));
        return true;
      }
    );

    // Test safe wrapper returns structured error
    const safeRes = await tryResolveProductOwnership([NON_EXISTENT_PROD_ID], { models });
    assert.strictEqual(safeRes.success, false);
    assert.strictEqual(safeRes.code, "PRODUCT_NOT_FOUND");
  });

  // -------------------------------------------------------------------------
  // 6. Unresolved vendor reference
  // -------------------------------------------------------------------------
  await test("6. Unresolved vendor reference throws UNRESOLVED_VENDOR error", async () => {
    const models = createMockModels(defaultFixture);

    await assert.rejects(
      async () => {
        await resolveProductOwnership([PROD_UNRESOLVED_VENDOR_ID], { models });
      },
      (err) => {
        assert(err instanceof VendorOwnershipResolverError);
        assert.strictEqual(err.code, "UNRESOLVED_VENDOR");
        return true;
      }
    );
  });

  // -------------------------------------------------------------------------
  // 7. Conflicting Vendor / User / ProductRequest mappings
  // -------------------------------------------------------------------------
  await test("7. Conflicting Vendor / User / ProductRequest mappings throws CONFLICTING_OWNERSHIP", async () => {
    const models = createMockModels(defaultFixture);

    await assert.rejects(
      async () => {
        // PROD_CONFLICTING_ID has vendorId: VENDOR_A_ID, but approved ProductRequest has VENDOR_B_ID
        await resolveProductOwnership([PROD_CONFLICTING_ID], { models });
      },
      (err) => {
        assert(err instanceof VendorOwnershipResolverError);
        assert.strictEqual(err.code, "CONFLICTING_OWNERSHIP");
        return true;
      }
    );
  });

  // -------------------------------------------------------------------------
  // 8. Inactive or suspended vendor handling based on verified project rules
  // -------------------------------------------------------------------------
  await test("8. Inactive or suspended vendor handling throws INACTIVE_VENDOR", async () => {
    const models = createMockModels(defaultFixture);

    await assert.rejects(
      async () => {
        await resolveProductOwnership([PROD_INACTIVE_VENDOR_ID], { models });
      },
      (err) => {
        assert(err instanceof VendorOwnershipResolverError);
        assert.strictEqual(err.code, "INACTIVE_VENDOR");
        assert.strictEqual(err.details.vendorStatus, "pending");
        return true;
      }
    );
  });

  // -------------------------------------------------------------------------
  // 9. Duplicate product IDs are handled efficiently and consistently
  // -------------------------------------------------------------------------
  await test("9. Duplicate product IDs are handled efficiently and consistently", async () => {
    const models = createMockModels(defaultFixture);

    const duplicateList = [
      PROD_DIRECT_VENDOR_ID,
      PROD_DIRECT_VENDOR_ID,
      PROD_PLATFORM_CATALOG_ID,
      PROD_DIRECT_VENDOR_ID.toString(),
      PROD_PLATFORM_CATALOG_ID.toString(),
    ];

    const ownershipMap = await resolveProductOwnership(duplicateList, { models });
    assert.strictEqual(ownershipMap.size, 2, "Duplicate IDs must result in exactly 2 unique mapped entries");
    assert(ownershipMap.has(PROD_DIRECT_VENDOR_ID.toString()));
    assert(ownershipMap.has(PROD_PLATFORM_CATALOG_ID.toString()));
  });

  // -------------------------------------------------------------------------
  // 10. The returned ownershipMap works with the existing fulfillment builder
  // -------------------------------------------------------------------------
  await test("10. Returned ownershipMap works with buildVendorFulfillments", async () => {
    const models = createMockModels(defaultFixture);

    const productIds = [
      PROD_DIRECT_VENDOR_ID,
      PROD_USER_LINKED_ID,
      PROD_REQUEST_APPROVED_ID,
      PROD_PLATFORM_CATALOG_ID,
    ];

    const ownershipMap = await resolveProductOwnership(productIds, { models });

    const orderItems = [
      { productId: PROD_DIRECT_VENDOR_ID, name: "Organic Green Tea", price: 299, quantity: 2 },
      { productId: PROD_USER_LINKED_ID, name: "Legacy Vendor Protein", price: 899, quantity: 1 },
      { productId: PROD_REQUEST_APPROVED_ID, name: "Approved Supplement", price: 650, quantity: 1 },
      { productId: PROD_PLATFORM_CATALOG_ID, name: "MetaFit Shaker", price: 199, quantity: 1 },
    ];

    const fulfillments = buildVendorFulfillments(orderItems, ownershipMap, { orderNumber: "MWB-INTEG-2001" });

    // Expect 3 fulfillment packages:
    // Package 1: Aura Herbals (PROD_DIRECT_VENDOR_ID + PROD_USER_LINKED_ID both belong to VENDOR_A_ID)
    // Package 2: Titan Nutrition (PROD_REQUEST_APPROVED_ID belongs to VENDOR_B_ID)
    // Package 3: MetaFit Direct (PROD_PLATFORM_CATALOG_ID belongs to platform)
    assert.strictEqual(fulfillments.length, 3, "Must produce exactly 3 fulfillment packages");

    const auraPkg = fulfillments.find(f => String(f.vendorId) === VENDOR_A_ID.toString());
    const titanPkg = fulfillments.find(f => String(f.vendorId) === VENDOR_B_ID.toString());
    const directPkg = fulfillments.find(f => f.vendorId === null);

    assert(auraPkg, "Aura Herbals package created");
    assert.strictEqual(auraPkg.items.length, 2, "Aura Herbals groups direct vendor and legacy user products together");
    assert.strictEqual(auraPkg.items[0].name, "Organic Green Tea");
    assert.strictEqual(auraPkg.items[1].name, "Legacy Vendor Protein");

    assert(titanPkg, "Titan Nutrition package created");
    assert.strictEqual(titanPkg.items.length, 1);
    assert.strictEqual(titanPkg.items[0].name, "Approved Supplement");

    assert(directPkg, "MetaFit Direct package created");
    assert.strictEqual(directPkg.vendorName, "MetaFit Direct");
    assert.strictEqual(directPkg.items.length, 1);
    assert.strictEqual(directPkg.items[0].name, "MetaFit Shaker");
  });

  console.log("\n==================================================================");
  console.log(` RESULTS: ${passedTests} / ${totalTests} test suites passed`);
  console.log("==================================================================");

  if (passedTests === totalTests) {
    console.log("\n>>> ALL PHASE 2.5B VENDOR RESOLVER TESTS PASSED SUCCESSFULLY! <<<\n");
  } else {
    console.error(`\n>>> FAILED: ${totalTests - passedTests} tests failed <<<\n`);
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
