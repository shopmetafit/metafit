/**
 * Test Suite: Vendor Pickup Address Implementation (Phase 2.8A)
 *
 * Verifies:
 * 1. Vendor model supports structured pickupAddress schema.
 * 2. Registration with streetAddress persists pickupAddress properly.
 * 3. Registration without streetAddress leaves pickupAddress null without error.
 * 4. GET /api/vendor/profile returns the authenticated vendor's profile and pickup address.
 * 5. PUT /api/vendor/profile updates pickupAddress and synchronizes root city/state/pincode.
 * 6. PUT /api/vendor/profile supports flat address field payload (streetAddress, city, state, pincode).
 * 7. Validation rejects incomplete street address (< 5 chars).
 * 8. Validation rejects invalid PIN code (non-6-digit).
 * 9. Validation rejects invalid contact phone (< 10 digits).
 * 10. Cross-vendor authorization: Session req.user is authoritative; Vendor A cannot modify Vendor B.
 * 11. Unauthenticated requests to /profile return HTTP 401.
 * 12. Unapproved vendor requests to /profile return HTTP 403.
 */

const assert = require("assert");
const mongoose = require("mongoose");
const Vendor = require("./models/Vendor");
const {
  registerVendor,
  getVendorProfile,
  updateVendorProfile,
} = require("./controllers/vendorController");

let totalTests = 0;
let passedTests = 0;

async function test(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    throw err;
  }
}

console.log("==================================================================");
console.log(" PHASE 2.8A: VENDOR PICKUP ADDRESS TEST SUITE");
console.log("==================================================================\n");

// Mock response creator
function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

const VENDOR_1_ID = new mongoose.Types.ObjectId("650000000000000000000001");
const VENDOR_2_ID = new mongoose.Types.ObjectId("650000000000000000000002");

async function runTests() {
  // -------------------------------------------------------------------------
  // 1. Vendor Model Schema Validation
  // -------------------------------------------------------------------------
  await test("1. Vendor document with structured pickupAddress validates cleanly", async () => {
    const vendor = new Vendor({
      businessName: "Himalaya Herbal Lab",
      vendorName: "Dr. Rajesh Sharma",
      email: "rajesh@himalaya.com",
      phone: "919876543210",
      password: "hashed_password_123",
      state: "Uttarakhand",
      city: "Dehradun",
      pincode: "248001",
      pickupAddress: {
        street: "Plot 12, Industrial Area, Patel Nagar",
        city: "Dehradun",
        state: "Uttarakhand",
        pincode: "248001",
        contactPerson: "Dr. Rajesh Sharma",
        contactPhone: "919876543210",
      },
      status: "approved",
    });

    const err = vendor.validateSync();
    assert.strictEqual(err, undefined, "Vendor schema validation must pass with zero errors");
    assert.strictEqual(vendor.pickupAddress.street, "Plot 12, Industrial Area, Patel Nagar");
    assert.strictEqual(vendor.pickupAddress.pincode, "248001");
  });

  // -------------------------------------------------------------------------
  // 2. Vendor Registration with Street Address
  // -------------------------------------------------------------------------
  await test("2. Registration persists actual street address in pickupAddress", async () => {
    // Mock Vendor.findOne to simulate non-existing email
    const originalFindOne = Vendor.findOne;
    let savedVendorDoc = null;

    Vendor.findOne = async () => null;
    const originalSave = Vendor.prototype.save;
    Vendor.prototype.save = async function () {
      savedVendorDoc = this;
      return this;
    };

    try {
      const req = {
        body: {
          businessName: "Aura Organics",
          vendorName: "Aura Gupta",
          businessEmail: "aura@auraorganics.in",
          vendorPhone: "919988776655",
          vendorPass: "Secret@123",
          bankAccNumber: "123456789012",
          IFSCCode: "HDFC0001234",
          accountHolderName: "Aura Gupta",
          streetAddress: "Shop 4, Market Complex, MG Road",
          vendorState: "Maharashtra",
          vendorCity: "Pune",
          pinCode: "411001",
        },
      };
      const res = createMockRes();

      await registerVendor(req, res);

      assert.strictEqual(res.data.success, true, "Registration should succeed");
      assert(savedVendorDoc !== null, "Vendor document must be saved");
      assert.strictEqual(savedVendorDoc.city, "Pune");
      assert(savedVendorDoc.pickupAddress !== null, "pickupAddress must not be null");
      assert.strictEqual(savedVendorDoc.pickupAddress.street, "Shop 4, Market Complex, MG Road");
      assert.strictEqual(savedVendorDoc.pickupAddress.city, "Pune");
      assert.strictEqual(savedVendorDoc.pickupAddress.state, "Maharashtra");
      assert.strictEqual(savedVendorDoc.pickupAddress.pincode, "411001");
      assert.strictEqual(savedVendorDoc.pickupAddress.contactPerson, "Aura Gupta");
      assert.strictEqual(savedVendorDoc.pickupAddress.contactPhone, "919988776655");
    } finally {
      Vendor.findOne = originalFindOne;
      Vendor.prototype.save = originalSave;
    }
  });

  // -------------------------------------------------------------------------
  // 3. Registration without Street Address
  // -------------------------------------------------------------------------
  await test("3. Registration without street address leaves pickupAddress null cleanly", async () => {
    const originalFindOne = Vendor.findOne;
    let savedVendorDoc = null;

    Vendor.findOne = async () => null;
    const originalSave = Vendor.prototype.save;
    Vendor.prototype.save = async function () {
      savedVendorDoc = this;
      return this;
    };

    try {
      const req = {
        body: {
          businessName: "Legacy Herbals",
          vendorName: "Old Seller",
          businessEmail: "old@legacy.com",
          vendorPhone: "919900112233",
          vendorPass: "Secret@123",
          bankAccNumber: "987654321000",
          IFSCCode: "SBIN0001234",
          accountHolderName: "Old Seller",
          // streetAddress omitted
        },
      };
      const res = createMockRes();

      await registerVendor(req, res);

      assert.strictEqual(res.data.success, true);
      assert.strictEqual(savedVendorDoc.pickupAddress, null, "pickupAddress should be null when omitted");
    } finally {
      Vendor.findOne = originalFindOne;
      Vendor.prototype.save = originalSave;
    }
  });

  // -------------------------------------------------------------------------
  // 4. GET /api/vendor/profile
  // -------------------------------------------------------------------------
  await test("4. GET /api/vendor/profile returns authenticated vendor pickup address", async () => {
    const originalFindById = Vendor.findById;

    const mockVendor = {
      _id: VENDOR_1_ID,
      vendorName: "Aura Gupta",
      businessName: "Aura Organics",
      email: "aura@auraorganics.in",
      phone: "919988776655",
      status: "approved",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      pickupAddress: {
        street: "Shop 4, Market Complex, MG Road",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411001",
        contactPerson: "Aura Gupta",
        contactPhone: "919988776655",
      },
      platformCommission: 10,
      createdAt: new Date(),
    };

    Vendor.findById = (id) => ({
      select: (fields) => {
        if (String(id) === String(VENDOR_1_ID)) {
          return Promise.resolve(mockVendor);
        }
        return Promise.resolve(null);
      },
    });

    try {
      const req = {
        user: {
          _id: VENDOR_1_ID,
          vendorId: VENDOR_1_ID,
          role: "vendor",
          status: "approved",
        },
      };
      const res = createMockRes();

      await getVendorProfile(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.vendor.vendorName, "Aura Gupta");
      assert.strictEqual(res.data.vendor.pickupAddress.street, "Shop 4, Market Complex, MG Road");
      assert.strictEqual(res.data.vendor.pickupAddress.pincode, "411001");
    } finally {
      Vendor.findById = originalFindById;
    }
  });

  // -------------------------------------------------------------------------
  // 5. PUT /api/vendor/profile with Structured pickupAddress
  // -------------------------------------------------------------------------
  await test("5. PUT /api/vendor/profile updates pickupAddress and syncs root fields", async () => {
    const originalFindById = Vendor.findById;

    const mockVendor = {
      _id: VENDOR_1_ID,
      vendorName: "Aura Gupta",
      businessName: "Aura Organics",
      email: "aura@auraorganics.in",
      phone: "919988776655",
      status: "approved",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      pickupAddress: null,
      save: async function () {
        return this;
      },
    };

    Vendor.findById = async (id) => {
      if (String(id) === String(VENDOR_1_ID)) return mockVendor;
      return null;
    };

    try {
      const req = {
        user: {
          _id: VENDOR_1_ID,
          vendorId: VENDOR_1_ID,
          role: "vendor",
          status: "approved",
        },
        body: {
          pickupAddress: {
            street: "Warehouse 10B, Chakan MIDC Phase 2",
            city: "Pune",
            state: "Maharashtra",
            pincode: "410501",
            contactPerson: "Warehouse Manager Ramesh",
            contactPhone: "919876543299",
          },
        },
      };
      const res = createMockRes();

      await updateVendorProfile(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(mockVendor.pickupAddress.street, "Warehouse 10B, Chakan MIDC Phase 2");
      assert.strictEqual(mockVendor.pickupAddress.pincode, "410501");
      assert.strictEqual(mockVendor.city, "Pune", "Root city should be synced");
      assert.strictEqual(mockVendor.pincode, "410501", "Root pincode should be synced");
    } finally {
      Vendor.findById = originalFindById;
    }
  });

  // -------------------------------------------------------------------------
  // 6. PUT /api/vendor/profile with Flat Address Fields
  // -------------------------------------------------------------------------
  await test("6. PUT /api/vendor/profile supports flat address field payloads", async () => {
    const originalFindById = Vendor.findById;

    const mockVendor = {
      _id: VENDOR_1_ID,
      vendorName: "Aura Gupta",
      phone: "919988776655",
      pickupAddress: null,
      save: async function () {
        return this;
      },
    };

    Vendor.findById = async () => mockVendor;

    try {
      const req = {
        user: { _id: VENDOR_1_ID, vendorId: VENDOR_1_ID, role: "vendor" },
        body: {
          streetAddress: "77 Nirvana Hills, Kothrud",
          city: "Pune",
          state: "Maharashtra",
          pincode: "411038",
          contactPerson: "Aura Dispatch",
          contactPhone: "919988776655",
        },
      };
      const res = createMockRes();

      await updateVendorProfile(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(mockVendor.pickupAddress.street, "77 Nirvana Hills, Kothrud");
      assert.strictEqual(mockVendor.pickupAddress.pincode, "411038");
    } finally {
      Vendor.findById = originalFindById;
    }
  });

  // -------------------------------------------------------------------------
  // 7. Validation: Street Address < 5 Chars
  // -------------------------------------------------------------------------
  await test("7. Validation rejects street address under 5 characters", async () => {
    const originalFindById = Vendor.findById;
    Vendor.findById = async () => ({ _id: VENDOR_1_ID, phone: "919988776655" });

    try {
      const req = {
        user: { _id: VENDOR_1_ID, vendorId: VENDOR_1_ID },
        body: {
          pickupAddress: {
            street: "St 1", // too short
            city: "Pune",
            state: "Maharashtra",
            pincode: "411001",
            contactPerson: "Ramesh",
            contactPhone: "919988776655",
          },
        },
      };
      const res = createMockRes();

      await updateVendorProfile(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.data.code, "INVALID_PICKUP_ADDRESS");
      assert(res.data.errors.street.includes("at least 5 characters"));
    } finally {
      Vendor.findById = originalFindById;
    }
  });

  // -------------------------------------------------------------------------
  // 8. Validation: Invalid PIN Code
  // -------------------------------------------------------------------------
  await test("8. Validation rejects invalid PIN code (not 6 digits)", async () => {
    const originalFindById = Vendor.findById;
    Vendor.findById = async () => ({ _id: VENDOR_1_ID, phone: "919988776655" });

    try {
      const req = {
        user: { _id: VENDOR_1_ID, vendorId: VENDOR_1_ID },
        body: {
          pickupAddress: {
            street: "123 Business Avenue, Sector 4",
            city: "Pune",
            state: "Maharashtra",
            pincode: "4110", // invalid pincode
            contactPerson: "Ramesh",
            contactPhone: "919988776655",
          },
        },
      };
      const res = createMockRes();

      await updateVendorProfile(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.data.code, "INVALID_PICKUP_ADDRESS");
      assert(res.data.errors.pincode.includes("6-digit"));
    } finally {
      Vendor.findById = originalFindById;
    }
  });

  // -------------------------------------------------------------------------
  // 9. Validation: Invalid Phone
  // -------------------------------------------------------------------------
  await test("9. Validation rejects invalid contact phone (< 10 digits)", async () => {
    const originalFindById = Vendor.findById;
    Vendor.findById = async () => ({ _id: VENDOR_1_ID, phone: "123" });

    try {
      const req = {
        user: { _id: VENDOR_1_ID, vendorId: VENDOR_1_ID },
        body: {
          pickupAddress: {
            street: "123 Business Avenue, Sector 4",
            city: "Pune",
            state: "Maharashtra",
            pincode: "411001",
            contactPerson: "Ramesh",
            contactPhone: "12345", // too short
          },
        },
      };
      const res = createMockRes();

      await updateVendorProfile(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.data.code, "INVALID_PICKUP_ADDRESS");
      assert(res.data.errors.contactPhone.includes("10-digit"));
    } finally {
      Vendor.findById = originalFindById;
    }
  });

  // -------------------------------------------------------------------------
  // 10. Cross-Vendor Authorization Isolation
  // -------------------------------------------------------------------------
  await test("10. Cross-vendor tampering is blocked: req.user is strictly authoritative", async () => {
    const originalFindById = Vendor.findById;

    let targetUpdatedId = null;
    const vendor1 = {
      _id: VENDOR_1_ID,
      vendorName: "Vendor 1",
      phone: "919876543210",
      save: async function () {
        targetUpdatedId = this._id;
        return this;
      },
    };
    const vendor2 = {
      _id: VENDOR_2_ID,
      vendorName: "Vendor 2",
      phone: "919876543220",
      save: async function () {
        targetUpdatedId = this._id;
        return this;
      },
    };

    Vendor.findById = async (id) => {
      if (String(id) === String(VENDOR_1_ID)) return vendor1;
      if (String(id) === String(VENDOR_2_ID)) return vendor2;
      return null;
    };

    try {
      // Vendor 1 sends body attempting to overwrite Vendor 2's profile
      const req = {
        user: { _id: VENDOR_1_ID, vendorId: VENDOR_1_ID, role: "vendor" },
        body: {
          vendorId: VENDOR_2_ID, // Tamper attempt
          _id: VENDOR_2_ID,      // Tamper attempt
          pickupAddress: {
            street: "Hacker Lane, Sector 99",
            city: "Delhi",
            state: "Delhi",
            pincode: "110001",
            contactPerson: "Malicious Actor",
            contactPhone: "919999999999",
          },
        },
      };
      const res = createMockRes();

      await updateVendorProfile(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(String(targetUpdatedId), String(VENDOR_1_ID), "Must strictly update Vendor 1 document");
      assert.notStrictEqual(String(targetUpdatedId), String(VENDOR_2_ID), "Vendor 2 must remain completely untouched");
    } finally {
      Vendor.findById = originalFindById;
    }
  });

  // -------------------------------------------------------------------------
  // 11. Unauthenticated Request Rejection
  // -------------------------------------------------------------------------
  await test("11. Unauthenticated request without req.user returns HTTP 401", async () => {
    const req = { user: null };
    const res = createMockRes();

    await getVendorProfile(req, res);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.data.success, false);

    const res2 = createMockRes();
    await updateVendorProfile(req, res2);
    assert.strictEqual(res2.statusCode, 401);
    assert.strictEqual(res2.data.success, false);
  });

  // -------------------------------------------------------------------------
  // 12. Safe Removal via pickupAddress: null
  // -------------------------------------------------------------------------
  await test("12. PUT /api/vendor/profile with pickupAddress: null safely clears address and preserves account data", async () => {
    const originalFindById = Vendor.findById;

    const mockVendor = {
      _id: VENDOR_1_ID,
      vendorName: "Aura Gupta",
      businessName: "Aura Organics",
      email: "aura@auraorganics.in",
      phone: "919988776655",
      status: "approved",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      platformCommission: 12,
      pickupAddress: {
        street: "Old Warehouse 4, Market Yard",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411037",
        contactPerson: "Aura Gupta",
        contactPhone: "919988776655",
      },
      save: async function () {
        return this;
      },
    };

    Vendor.findById = async (id) => {
      if (String(id) === String(VENDOR_1_ID)) return mockVendor;
      return null;
    };

    try {
      const req = {
        user: {
          _id: VENDOR_1_ID,
          vendorId: VENDOR_1_ID,
          role: "vendor",
          status: "approved",
        },
        body: {
          pickupAddress: null,
        },
      };
      const res = createMockRes();

      await updateVendorProfile(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.message, "Pickup address removed successfully");
      assert.strictEqual(mockVendor.pickupAddress, null, "pickupAddress must be set to null");

      // Verify core account data is strictly preserved
      assert.strictEqual(mockVendor.vendorName, "Aura Gupta");
      assert.strictEqual(mockVendor.businessName, "Aura Organics");
      assert.strictEqual(mockVendor.email, "aura@auraorganics.in");
      assert.strictEqual(mockVendor.phone, "919988776655");
      assert.strictEqual(mockVendor.status, "approved");
      assert.strictEqual(mockVendor.city, "Pune");
      assert.strictEqual(mockVendor.state, "Maharashtra");
      assert.strictEqual(mockVendor.pincode, "411001");
      assert.strictEqual(mockVendor.platformCommission, 12);
      assert.strictEqual(res.data.vendor.pickupAddress, null);
    } finally {
      Vendor.findById = originalFindById;
    }
  });

  // -------------------------------------------------------------------------
  // 13. Safe Removal via removePickupAddress: true
  // -------------------------------------------------------------------------
  await test("13. PUT /api/vendor/profile with removePickupAddress: true safely clears pickupAddress", async () => {
    const originalFindById = Vendor.findById;

    const mockVendor = {
      _id: VENDOR_1_ID,
      vendorName: "Aura Gupta",
      businessName: "Aura Organics",
      email: "aura@auraorganics.in",
      phone: "919988776655",
      status: "approved",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      pickupAddress: {
        street: "Old Warehouse 4, Market Yard",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411037",
        contactPerson: "Aura Gupta",
        contactPhone: "919988776655",
      },
      save: async function () {
        return this;
      },
    };

    Vendor.findById = async (id) => {
      if (String(id) === String(VENDOR_1_ID)) return mockVendor;
      return null;
    };

    try {
      const req = {
        user: {
          _id: VENDOR_1_ID,
          vendorId: VENDOR_1_ID,
          role: "vendor",
          status: "approved",
        },
        body: {
          removePickupAddress: true,
        },
      };
      const res = createMockRes();

      await updateVendorProfile(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.message, "Pickup address removed successfully");
      assert.strictEqual(mockVendor.pickupAddress, null, "pickupAddress must be set to null");
      assert.strictEqual(res.data.vendor.pickupAddress, null);
    } finally {
      Vendor.findById = originalFindById;
    }
  });

  // -------------------------------------------------------------------------
  // 14. GET Profile Reload After Removal
  // -------------------------------------------------------------------------
  await test("14. GET /api/vendor/profile returns pickupAddress: null after removal with core fields intact", async () => {
    const originalFindById = Vendor.findById;

    const mockVendor = {
      _id: VENDOR_1_ID,
      vendorName: "Aura Gupta",
      businessName: "Aura Organics",
      email: "aura@auraorganics.in",
      phone: "919988776655",
      status: "approved",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      platformCommission: 10,
      pickupAddress: null,
      createdAt: new Date("2026-01-01"),
    };

    Vendor.findById = (id) => ({
      select: () => mockVendor,
    });

    try {
      const req = {
        user: {
          _id: VENDOR_1_ID,
          vendorId: VENDOR_1_ID,
          role: "vendor",
          status: "approved",
        },
      };
      const res = createMockRes();

      await getVendorProfile(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.vendor.pickupAddress, null, "pickupAddress should be null on profile reload");
      assert.strictEqual(res.data.vendor.email, "aura@auraorganics.in");
      assert.strictEqual(res.data.vendor.city, "Pune");
      assert.strictEqual(res.data.vendor.status, "approved");
    } finally {
      Vendor.findById = originalFindById;
    }
  });

  console.log("\n==================================================================");
  console.log(` RESULTS: ${passedTests} / ${totalTests} test suites passed`);
  console.log("==================================================================");

  if (passedTests === totalTests) {
    console.log("\n>>> ALL PHASE 2.8A VENDOR PICKUP ADDRESS TESTS PASSED! <<<\n");
  } else {
    console.error(`\n>>> FAILED: ${totalTests - passedTests} tests failed <<<\n`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution aborted:", err);
  process.exit(1);
});
