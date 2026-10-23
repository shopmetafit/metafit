/**
 * Test Suite: Vendor-wise AWB Generation (Phase 2.8B)
 *
 * Verifies:
 * 1. Authorized vendor can generate an AWB for their own eligible fulfillment.
 * 2. Vendor cannot generate an AWB for another vendor's fulfillment (Cross-vendor 403 Forbidden).
 * 3. Missing or incomplete pickup address blocks the request BEFORE carrier invocation.
 * 4. Invalid payment/order/fulfillment lifecycle state blocks generation (Unpaid, Cancelled, Delivered).
 * 5. Existing AWB prevents duplicate generation (Idempotency 400).
 * 6. Two different fulfillments in the same order can receive separate, independent AWBs.
 * 7. Concurrent requests cannot create duplicate AWBs (Atomic DB lock 409).
 * 8. Legacy single-vendor AWB flow remains compatible (and rejects fulfillment orders).
 * 9. Carrier failure does not leave a false successful shipment state (marks Failed with error).
 * 10. BlueDart service parameterization passes exact vendor pickupAddress without demo fallbacks.
 */

const assert = require("assert");
const mongoose = require("mongoose");
const Order = require("./models/Order");
const Vendor = require("./models/Vendor");
const bluedartService = require("./utils/bluedart.service");
const {
  generateVendorFulfillmentAWB,
  generateAWB,
} = require("./controllers/bluedart.controller");

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

const VENDOR_A_ID = new mongoose.Types.ObjectId("650000000000000000000001");
const VENDOR_B_ID = new mongoose.Types.ObjectId("650000000000000000000002");
const ORDER_1_ID = new mongoose.Types.ObjectId("660000000000000000000001");
const ORDER_LEGACY_ID = new mongoose.Types.ObjectId("660000000000000000000002");

const VALID_PICKUP_ADDRESS_A = {
  street: "Plot 45, Udyog Vihar Phase 4",
  city: "Gurugram",
  state: "Haryana",
  pincode: "122015",
  contactPerson: "Rajesh Kumar",
  contactPhone: "9876543210",
};

const VALID_PICKUP_ADDRESS_B = {
  street: "Shop 12, Swastik Complex, CG Road",
  city: "Ahmedabad",
  state: "Gujarat",
  pincode: "380009",
  contactPerson: "Bhavin Shah",
  contactPhone: "9988776655",
};

async function runTests() {
  console.log("==================================================================");
  console.log(" PHASE 2.8B: VENDOR-WISE AWB GENERATION TEST SUITE");
  console.log("==================================================================\n");

  // Save original methods
  const origOrderFindById = Order.findById;
  const origOrderFindOneAndUpdate = Order.findOneAndUpdate;
  const origOrderUpdateOne = Order.updateOne;
  const origVendorFindById = Vendor.findById;
  const origBDGenerateWayBill = bluedartService.generateWayBill;

  // -------------------------------------------------------------------------
  // 1. Authorized vendor generates AWB for own eligible fulfillment
  // -------------------------------------------------------------------------
  await test("1. Authorized vendor generates AWB for their own eligible fulfillment", async () => {
    let capturedOrderData = null;
    let updateOnePayload = null;

    const mockVendor = {
      _id: VENDOR_A_ID,
      vendorName: "Aura Organics",
      businessName: "Aura Organics Pvt Ltd",
      email: "aura@organics.com",
      phone: "9876543210",
      pickupAddress: { ...VALID_PICKUP_ADDRESS_A },
    };

    const mockOrder = {
      _id: ORDER_1_ID,
      isPaid: true,
      paymentStatus: "Paid",
      status: "Processing",
      shippingAddress: {
        fullName: "Rahul Verma",
        phone: "9123456780",
        address: "Flat 101, Green Heights",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India",
      },
      vendorFulfillments: [
        {
          _id: new mongoose.Types.ObjectId("670000000000000000000001"),
          fulfillmentId: "FUL-ORD-VEND-1",
          vendorId: VENDOR_A_ID,
          vendorName: "Aura Organics",
          items: [{ productId: new mongoose.Types.ObjectId(), name: "Tea", price: 500, quantity: 2 }],
          status: "Processing",
          statusHistory: [],
          courier: "standard",
          awbNo: null,
          trackingId: null,
          shippingStatus: "Pending",
        },
      ],
    };

    Order.findById = async () => mockOrder;
    Vendor.findById = async () => mockVendor;
    Order.findOneAndUpdate = async () => mockOrder; // Lock succeeds
    Order.updateOne = async (filter, update) => {
      updateOnePayload = update;
      return { modifiedCount: 1 };
    };

    bluedartService.generateWayBill = async (data) => {
      capturedOrderData = data;
      return {
        success: true,
        awbNo: "BD-7788990011",
        trackingId: "BD-7788990011",
      };
    };

    try {
      const req = {
        params: { orderId: String(ORDER_1_ID), fulfillmentId: "FUL-ORD-VEND-1" },
        body: { weight: "1.5" },
        user: {
          _id: VENDOR_A_ID,
          vendorId: VENDOR_A_ID,
          vendorName: "Aura Organics",
          role: "vendor",
          status: "approved",
        },
      };
      const res = createMockRes();

      await generateVendorFulfillmentAWB(req, res);

      assert.strictEqual(res.statusCode, 201, "Expected HTTP 201 Created");
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.awbNo, "BD-7788990011");
      assert.strictEqual(res.data.courier, "BlueDart");
      assert.strictEqual(res.data.shippingStatus, "In-Transit");
      assert.strictEqual(res.data.status, "Shipped");

      // Verify captured shipper data matches actual vendor pickupAddress
      assert.strictEqual(capturedOrderData.shipper.street, VALID_PICKUP_ADDRESS_A.street);
      assert.strictEqual(capturedOrderData.shipper.city, VALID_PICKUP_ADDRESS_A.city);
      assert.strictEqual(capturedOrderData.shipper.pincode, VALID_PICKUP_ADDRESS_A.pincode);
      assert.strictEqual(capturedOrderData.shipper.contactPerson, VALID_PICKUP_ADDRESS_A.contactPerson);
      assert.strictEqual(capturedOrderData.shipper.contactPhone, VALID_PICKUP_ADDRESS_A.contactPhone);

      // Verify update payload
      assert.strictEqual(updateOnePayload.$set["vendorFulfillments.$.awbNo"], "BD-7788990011");
      assert.strictEqual(updateOnePayload.$set["vendorFulfillments.$.courier"], "BlueDart");
      assert.strictEqual(updateOnePayload.$set["vendorFulfillments.$.pickupAddressSnapshot"].street, VALID_PICKUP_ADDRESS_A.street);
      assert.strictEqual(updateOnePayload.$push["vendorFulfillments.$.statusHistory"].status, "Shipped");
    } finally {
      Order.findById = origOrderFindById;
      Vendor.findById = origVendorFindById;
      Order.findOneAndUpdate = origOrderFindOneAndUpdate;
      Order.updateOne = origOrderUpdateOne;
      bluedartService.generateWayBill = origBDGenerateWayBill;
    }
  });

  // -------------------------------------------------------------------------
  // 2. Vendor cannot generate AWB for another vendor's fulfillment
  // -------------------------------------------------------------------------
  await test("2. Vendor cannot generate an AWB for another vendor's fulfillment (403 Forbidden)", async () => {
    let bdCalled = false;

    const mockOrder = {
      _id: ORDER_1_ID,
      isPaid: true,
      paymentStatus: "Paid",
      shippingAddress: { address: "123 Main St", city: "Delhi", postalCode: "110001" },
      vendorFulfillments: [
        {
          _id: new mongoose.Types.ObjectId(),
          fulfillmentId: "FUL-ORD-VEND-A",
          vendorId: VENDOR_A_ID, // Belongs to Vendor A
          awbNo: null,
          status: "Processing",
          shippingStatus: "Pending",
        },
      ],
    };

    Order.findById = async () => mockOrder;
    bluedartService.generateWayBill = async () => {
      bdCalled = true;
      return { success: true, awbNo: "ILLEGAL" };
    };

    try {
      const req = {
        params: { orderId: String(ORDER_1_ID), fulfillmentId: "FUL-ORD-VEND-A" },
        user: {
          _id: VENDOR_B_ID,
          vendorId: VENDOR_B_ID, // Vendor B requesting Vendor A's fulfillment
          role: "vendor",
          status: "approved",
        },
      };
      const res = createMockRes();

      await generateVendorFulfillmentAWB(req, res);

      assert.strictEqual(res.statusCode, 403, "Must return HTTP 403 Forbidden");
      assert.strictEqual(res.data.success, false);
      assert.strictEqual(res.data.code, "UNAUTHORIZED_FULFILLMENT");
      assert.strictEqual(bdCalled, false, "Carrier must NOT be called for unauthorized vendor");
    } finally {
      Order.findById = origOrderFindById;
      bluedartService.generateWayBill = origBDGenerateWayBill;
    }
  });

  // -------------------------------------------------------------------------
  // 3. Missing/incomplete pickup address blocks request before carrier invocation
  // -------------------------------------------------------------------------
  await test("3. Missing pickup address blocks generation with VENDOR_PICKUP_ADDRESS_MISSING before BlueDart", async () => {
    let bdCalled = false;

    const mockVendorNoAddress = {
      _id: VENDOR_A_ID,
      vendorName: "No Address Vendor",
      pickupAddress: null, // No saved pickup address
    };

    const mockOrder = {
      _id: ORDER_1_ID,
      isPaid: true,
      shippingAddress: { address: "123 Main St", city: "Delhi", postalCode: "110001" },
      vendorFulfillments: [
        {
          _id: new mongoose.Types.ObjectId(),
          fulfillmentId: "FUL-ORD-VEND-A",
          vendorId: VENDOR_A_ID,
          awbNo: null,
          status: "Processing",
          shippingStatus: "Pending",
        },
      ],
    };

    Order.findById = async () => mockOrder;
    Vendor.findById = async () => mockVendorNoAddress;
    bluedartService.generateWayBill = async () => {
      bdCalled = true;
      return { success: true };
    };

    try {
      const req = {
        params: { orderId: String(ORDER_1_ID), fulfillmentId: "FUL-ORD-VEND-A" },
        user: {
          _id: VENDOR_A_ID,
          vendorId: VENDOR_A_ID,
          role: "vendor",
          status: "approved",
        },
      };
      const res = createMockRes();

      await generateVendorFulfillmentAWB(req, res);

      assert.strictEqual(res.statusCode, 400, "Must return HTTP 400 Bad Request");
      assert.strictEqual(res.data.success, false);
      assert.strictEqual(res.data.code, "VENDOR_PICKUP_ADDRESS_MISSING");
      assert.strictEqual(bdCalled, false, "Carrier must NEVER be called when pickup address is missing");
    } finally {
      Order.findById = origOrderFindById;
      Vendor.findById = origVendorFindById;
      bluedartService.generateWayBill = origBDGenerateWayBill;
    }
  });

  await test("3b. Incomplete pickup address (invalid pincode / short street) blocks generation", async () => {
    let bdCalled = false;

    const mockVendorIncomplete = {
      _id: VENDOR_A_ID,
      pickupAddress: {
        street: "Hi", // Too short (< 5 chars)
        city: "Pune",
        state: "Maharashtra",
        pincode: "123", // Invalid PIN (not 6 digits)
        contactPerson: "R",
        contactPhone: "123", // Invalid phone (< 10 digits)
      },
    };

    const mockOrder = {
      _id: ORDER_1_ID,
      isPaid: true,
      shippingAddress: { address: "123 Main St", city: "Delhi", postalCode: "110001" },
      vendorFulfillments: [
        {
          _id: new mongoose.Types.ObjectId(),
          fulfillmentId: "FUL-ORD-VEND-A",
          vendorId: VENDOR_A_ID,
          awbNo: null,
          status: "Processing",
          shippingStatus: "Pending",
        },
      ],
    };

    Order.findById = async () => mockOrder;
    Vendor.findById = async () => mockVendorIncomplete;
    bluedartService.generateWayBill = async () => {
      bdCalled = true;
    };

    try {
      const req = {
        params: { orderId: String(ORDER_1_ID), fulfillmentId: "FUL-ORD-VEND-A" },
        user: {
          _id: VENDOR_A_ID,
          vendorId: VENDOR_A_ID,
          role: "vendor",
          status: "approved",
        },
      };
      const res = createMockRes();

      await generateVendorFulfillmentAWB(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.data.code, "VENDOR_PICKUP_ADDRESS_MISSING");
      assert.strictEqual(bdCalled, false, "Carrier must NOT be called for incomplete address");
      assert.strictEqual(res.data.missingFields.street, true);
      assert.strictEqual(res.data.missingFields.pincode, true);
      assert.strictEqual(res.data.missingFields.contactPhone, true);
    } finally {
      Order.findById = origOrderFindById;
      Vendor.findById = origVendorFindById;
      bluedartService.generateWayBill = origBDGenerateWayBill;
    }
  });

  // -------------------------------------------------------------------------
  // 4. Invalid payment/order/fulfillment lifecycle states
  // -------------------------------------------------------------------------
  await test("4a. Unpaid order blocks AWB generation (ORDER_NOT_PAID)", async () => {
    let bdCalled = false;

    const mockOrder = {
      _id: ORDER_1_ID,
      isPaid: false,
      paymentStatus: "Pending",
      shippingAddress: { address: "123 Main St", city: "Delhi", postalCode: "110001" },
      vendorFulfillments: [
        {
          _id: new mongoose.Types.ObjectId(),
          fulfillmentId: "FUL-1",
          vendorId: VENDOR_A_ID,
          awbNo: null,
          status: "Processing",
        },
      ],
    };

    Order.findById = async () => mockOrder;
    bluedartService.generateWayBill = async () => { bdCalled = true; };

    try {
      const req = {
        params: { orderId: String(ORDER_1_ID), fulfillmentId: "FUL-1" },
        user: { _id: VENDOR_A_ID, vendorId: VENDOR_A_ID, role: "vendor", status: "approved" },
      };
      const res = createMockRes();

      await generateVendorFulfillmentAWB(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.data.code, "ORDER_NOT_PAID");
      assert.strictEqual(bdCalled, false);
    } finally {
      Order.findById = origOrderFindById;
      bluedartService.generateWayBill = origBDGenerateWayBill;
    }
  });

  await test("4b. Cancelled fulfillment blocks AWB generation (FULFILLMENT_CANCELLED)", async () => {
    let bdCalled = false;

    const mockOrder = {
      _id: ORDER_1_ID,
      isPaid: true,
      shippingAddress: { address: "123 Main St", city: "Delhi", postalCode: "110001" },
      vendorFulfillments: [
        {
          _id: new mongoose.Types.ObjectId(),
          fulfillmentId: "FUL-1",
          vendorId: VENDOR_A_ID,
          awbNo: null,
          status: "Cancelled",
        },
      ],
    };

    Order.findById = async () => mockOrder;
    bluedartService.generateWayBill = async () => { bdCalled = true; };

    try {
      const req = {
        params: { orderId: String(ORDER_1_ID), fulfillmentId: "FUL-1" },
        user: { _id: VENDOR_A_ID, vendorId: VENDOR_A_ID, role: "vendor", status: "approved" },
      };
      const res = createMockRes();

      await generateVendorFulfillmentAWB(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.data.code, "FULFILLMENT_CANCELLED");
      assert.strictEqual(bdCalled, false);
    } finally {
      Order.findById = origOrderFindById;
      bluedartService.generateWayBill = origBDGenerateWayBill;
    }
  });

  await test("4c. Already Delivered fulfillment blocks AWB generation", async () => {
    let bdCalled = false;

    const mockOrder = {
      _id: ORDER_1_ID,
      isPaid: true,
      shippingAddress: { address: "123 Main St", city: "Delhi", postalCode: "110001" },
      vendorFulfillments: [
        {
          _id: new mongoose.Types.ObjectId(),
          fulfillmentId: "FUL-1",
          vendorId: VENDOR_A_ID,
          status: "Delivered",
          shippingStatus: "Delivered",
        },
      ],
    };

    Order.findById = async () => mockOrder;
    bluedartService.generateWayBill = async () => { bdCalled = true; };

    try {
      const req = {
        params: { orderId: String(ORDER_1_ID), fulfillmentId: "FUL-1" },
        user: { _id: VENDOR_A_ID, vendorId: VENDOR_A_ID, role: "vendor", status: "approved" },
      };
      const res = createMockRes();

      await generateVendorFulfillmentAWB(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.data.code, "FULFILLMENT_ALREADY_DELIVERED");
      assert.strictEqual(bdCalled, false);
    } finally {
      Order.findById = origOrderFindById;
      bluedartService.generateWayBill = origBDGenerateWayBill;
    }
  });

  // -------------------------------------------------------------------------
  // 5. Existing AWB prevents duplicate generation (Idempotency)
  // -------------------------------------------------------------------------
  await test("5. Existing AWB prevents duplicate generation (AWB_ALREADY_EXISTS)", async () => {
    let bdCalled = false;

    const mockOrder = {
      _id: ORDER_1_ID,
      isPaid: true,
      shippingAddress: { address: "123 Main St", city: "Delhi", postalCode: "110001" },
      vendorFulfillments: [
        {
          _id: new mongoose.Types.ObjectId(),
          fulfillmentId: "FUL-1",
          vendorId: VENDOR_A_ID,
          awbNo: "BD-123456789", // Already generated!
          trackingId: "BD-123456789",
          status: "Shipped",
          shippingStatus: "In-Transit",
        },
      ],
    };

    Order.findById = async () => mockOrder;
    bluedartService.generateWayBill = async () => { bdCalled = true; };

    try {
      const req = {
        params: { orderId: String(ORDER_1_ID), fulfillmentId: "FUL-1" },
        user: { _id: VENDOR_A_ID, vendorId: VENDOR_A_ID, role: "vendor", status: "approved" },
      };
      const res = createMockRes();

      await generateVendorFulfillmentAWB(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.data.code, "AWB_ALREADY_EXISTS");
      assert.strictEqual(res.data.awbNo, "BD-123456789");
      assert.strictEqual(bdCalled, false, "Carrier must NOT be re-called when AWB already exists");
    } finally {
      Order.findById = origOrderFindById;
      bluedartService.generateWayBill = origBDGenerateWayBill;
    }
  });

  // -------------------------------------------------------------------------
  // 6. Two different fulfillments receive separate AWBs independently
  // -------------------------------------------------------------------------
  await test("6. Two different fulfillments receive separate AWBs independently without blocking each other", async () => {
    const fulfillmentA = {
      _id: new mongoose.Types.ObjectId("67000000000000000000000a"),
      fulfillmentId: "FUL-ORD-VEND-A",
      vendorId: VENDOR_A_ID,
      items: [{ price: 300, quantity: 1 }],
      status: "Processing",
      awbNo: null,
      shippingStatus: "Pending",
    };

    const fulfillmentB = {
      _id: new mongoose.Types.ObjectId("67000000000000000000000b"),
      fulfillmentId: "FUL-ORD-VEND-B",
      vendorId: VENDOR_B_ID,
      items: [{ price: 800, quantity: 1 }],
      status: "Processing",
      awbNo: null,
      shippingStatus: "Pending",
    };

    const sharedOrder = {
      _id: ORDER_1_ID,
      isPaid: true,
      shippingAddress: { address: "123 Main St", city: "Delhi", postalCode: "110001" },
      vendorFulfillments: [fulfillmentA, fulfillmentB],
    };

    const vendorA = { _id: VENDOR_A_ID, pickupAddress: { ...VALID_PICKUP_ADDRESS_A } };
    const vendorB = { _id: VENDOR_B_ID, pickupAddress: { ...VALID_PICKUP_ADDRESS_B } };

    Order.findById = async () => sharedOrder;
    Vendor.findById = async (id) => String(id) === String(VENDOR_A_ID) ? vendorA : vendorB;
    Order.findOneAndUpdate = async () => sharedOrder; // Lock succeeds
    Order.updateOne = async (filter, update) => {
      // Simulate applying update to sharedOrder
      const fId = filter["vendorFulfillments._id"];
      const target = sharedOrder.vendorFulfillments.find(f => String(f._id) === String(fId));
      if (target && update.$set) {
        Object.assign(target, {
          awbNo: update.$set["vendorFulfillments.$.awbNo"],
          courier: update.$set["vendorFulfillments.$.courier"],
          shippingStatus: update.$set["vendorFulfillments.$.shippingStatus"],
        });
      }
      return { modifiedCount: 1 };
    };

    let callCount = 0;
    bluedartService.generateWayBill = async (shipmentData) => {
      callCount++;
      return {
        success: true,
        awbNo: `AWB-${shipmentData.shipper.city.toUpperCase()}-${callCount}`,
        trackingId: `TRK-${callCount}`,
      };
    };

    try {
      // Vendor A generates AWB for Fulfillment A
      const reqA = {
        params: { orderId: String(ORDER_1_ID), fulfillmentId: "FUL-ORD-VEND-A" },
        user: { _id: VENDOR_A_ID, vendorId: VENDOR_A_ID, role: "vendor", status: "approved" },
      };
      const resA = createMockRes();
      await generateVendorFulfillmentAWB(reqA, resA);

      assert.strictEqual(resA.statusCode, 201);
      assert.strictEqual(resA.data.awbNo, "AWB-GURUGRAM-1");
      assert.strictEqual(fulfillmentA.awbNo, "AWB-GURUGRAM-1");

      // Fulfillment B should STILL be null and ready for its own AWB
      assert.strictEqual(fulfillmentB.awbNo, null);

      // Vendor B generates AWB for Fulfillment B
      const reqB = {
        params: { orderId: String(ORDER_1_ID), fulfillmentId: "FUL-ORD-VEND-B" },
        user: { _id: VENDOR_B_ID, vendorId: VENDOR_B_ID, role: "vendor", status: "approved" },
      };
      const resB = createMockRes();
      await generateVendorFulfillmentAWB(reqB, resB);

      assert.strictEqual(resB.statusCode, 201);
      assert.strictEqual(resB.data.awbNo, "AWB-AHMEDABAD-2");
      assert.strictEqual(fulfillmentB.awbNo, "AWB-AHMEDABAD-2");

      // Verify separate, non-colliding AWBs
      assert.notStrictEqual(fulfillmentA.awbNo, fulfillmentB.awbNo);
    } finally {
      Order.findById = origOrderFindById;
      Vendor.findById = origVendorFindById;
      Order.findOneAndUpdate = origOrderFindOneAndUpdate;
      Order.updateOne = origOrderUpdateOne;
      bluedartService.generateWayBill = origBDGenerateWayBill;
    }
  });

  // -------------------------------------------------------------------------
  // 7. Concurrent requests cannot create duplicate AWBs (Atomic DB lock)
  // -------------------------------------------------------------------------
  await test("7. Concurrent requests are protected by atomic DB test-and-set condition (409 Conflict)", async () => {
    let bdCalls = 0;
    let lockAcquired = false;

    const mockOrder = {
      _id: ORDER_1_ID,
      isPaid: true,
      shippingAddress: { address: "123 Main St", city: "Delhi", postalCode: "110001" },
      vendorFulfillments: [
        {
          _id: new mongoose.Types.ObjectId(),
          fulfillmentId: "FUL-CONCURRENT-1",
          vendorId: VENDOR_A_ID,
          awbNo: null,
          status: "Processing",
          shippingStatus: "Pending",
        },
      ],
    };

    Order.findById = async () => mockOrder;
    Vendor.findById = async () => ({ _id: VENDOR_A_ID, pickupAddress: { ...VALID_PICKUP_ADDRESS_A } });

    // Simulate atomic MongoDB findOneAndUpdate: only the FIRST request succeeds; the second returns null
    Order.findOneAndUpdate = async () => {
      if (!lockAcquired) {
        lockAcquired = true;
        return mockOrder; // Lock successfully claimed
      }
      return null; // Atomic condition failed (already Generating / In-Transit)
    };

    bluedartService.generateWayBill = async () => {
      bdCalls++;
      return { success: true, awbNo: "BD-CONCURRENT-AWB" };
    };

    Order.updateOne = async () => ({ modifiedCount: 1 });

    try {
      const req1 = {
        params: { orderId: String(ORDER_1_ID), fulfillmentId: "FUL-CONCURRENT-1" },
        user: { _id: VENDOR_A_ID, vendorId: VENDOR_A_ID, role: "vendor", status: "approved" },
      };
      const req2 = {
        params: { orderId: String(ORDER_1_ID), fulfillmentId: "FUL-CONCURRENT-1" },
        user: { _id: VENDOR_A_ID, vendorId: VENDOR_A_ID, role: "vendor", status: "approved" },
      };

      const res1 = createMockRes();
      const res2 = createMockRes();

      // Launch both simultaneously
      await Promise.all([
        generateVendorFulfillmentAWB(req1, res1),
        generateVendorFulfillmentAWB(req2, res2),
      ]);

      // Exactly one must succeed with 201, and one must be rejected with 409
      const statusCodes = [res1.statusCode, res2.statusCode].sort();
      assert.deepStrictEqual(statusCodes, [201, 409], "One request must succeed (201) and one must be rejected (409 Conflict)");

      // Carrier should have been called only once
      assert.strictEqual(bdCalls, 1, "BlueDart must only be called once under concurrent attempts");
    } finally {
      Order.findById = origOrderFindById;
      Vendor.findById = origVendorFindById;
      Order.findOneAndUpdate = origOrderFindOneAndUpdate;
      Order.updateOne = origOrderUpdateOne;
      bluedartService.generateWayBill = origBDGenerateWayBill;
    }
  });

  // -------------------------------------------------------------------------
  // 8. Legacy single-vendor order compatibility
  // -------------------------------------------------------------------------
  await test("8a. Legacy single-vendor order without vendorFulfillments uses root generateAWB flow", async () => {
    let bdCalled = false;
    let rootOrderSaved = false;

    const legacyOrder = {
      _id: ORDER_LEGACY_ID,
      isPaid: true,
      status: "Processing",
      totalPrice: 1500,
      shippingAddress: { address: "Old City Rd", city: "Jaipur", postalCode: "302001" },
      vendorFulfillments: [], // Legacy order has no fulfillments
      awbNo: null,
      save: async function () {
        rootOrderSaved = true;
        return this;
      },
    };

    Order.findById = async () => legacyOrder;
    bluedartService.generateWayBill = async () => {
      bdCalled = true;
      return { success: true, awbNo: "BD-LEGACY-999" };
    };

    try {
      const req = {
        params: { orderId: String(ORDER_LEGACY_ID) },
        body: { consigneeName: "Legacy Buyer", consigneePhone: "9876543210" },
      };
      const res = createMockRes();

      await generateAWB(req, res);

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.awbNo, "BD-LEGACY-999");
      assert.strictEqual(bdCalled, true);
      assert.strictEqual(rootOrderSaved, true);
      assert.strictEqual(legacyOrder.awbNo, "BD-LEGACY-999");
    } finally {
      Order.findById = origOrderFindById;
      bluedartService.generateWayBill = origBDGenerateWayBill;
    }
  });

  await test("8b. Legacy root generateAWB rejects orders that contain vendorFulfillments", async () => {
    let bdCalled = false;

    const fulfillmentOrder = {
      _id: ORDER_1_ID,
      isPaid: true,
      status: "Processing",
      shippingAddress: { address: "123 Main St", city: "Delhi", postalCode: "110001" },
      vendorFulfillments: [{ fulfillmentId: "FUL-1", vendorId: VENDOR_A_ID }],
      awbNo: null,
    };

    Order.findById = async () => fulfillmentOrder;
    bluedartService.generateWayBill = async () => { bdCalled = true; };

    try {
      const req = {
        params: { orderId: String(ORDER_1_ID) },
        body: { consigneeName: "Buyer", consigneePhone: "9876543210" },
      };
      const res = createMockRes();

      await generateAWB(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.data.code, "USE_FULFILLMENT_AWB");
      assert.strictEqual(bdCalled, false, "Must not route fulfillment orders through legacy root AWB path");
    } finally {
      Order.findById = origOrderFindById;
      bluedartService.generateWayBill = origBDGenerateWayBill;
    }
  });

  // -------------------------------------------------------------------------
  // 9. Carrier failure does not leave a false successful shipment state
  // -------------------------------------------------------------------------
  await test("9. Carrier failure marks fulfillment as Failed with error, never Shipped", async () => {
    let recordedUpdate = null;

    const mockOrder = {
      _id: ORDER_1_ID,
      isPaid: true,
      shippingAddress: { address: "123 Main St", city: "Delhi", postalCode: "110001" },
      vendorFulfillments: [
        {
          _id: new mongoose.Types.ObjectId(),
          fulfillmentId: "FUL-FAIL-1",
          vendorId: VENDOR_A_ID,
          awbNo: null,
          status: "Processing",
          shippingStatus: "Pending",
        },
      ],
    };

    Order.findById = async () => mockOrder;
    Vendor.findById = async () => ({ _id: VENDOR_A_ID, pickupAddress: { ...VALID_PICKUP_ADDRESS_A } });
    Order.findOneAndUpdate = async () => mockOrder;
    Order.updateOne = async (filter, update) => {
      recordedUpdate = update;
      return { modifiedCount: 1 };
    };

    // BlueDart throws network/account error
    bluedartService.generateWayBill = async () => {
      throw new Error("BlueDart Account Balance Exhausted");
    };

    try {
      const req = {
        params: { orderId: String(ORDER_1_ID), fulfillmentId: "FUL-FAIL-1" },
        user: { _id: VENDOR_A_ID, vendorId: VENDOR_A_ID, role: "vendor", status: "approved" },
      };
      const res = createMockRes();

      await generateVendorFulfillmentAWB(req, res);

      assert.strictEqual(res.statusCode, 502, "Must return HTTP 502 Bad Gateway");
      assert.strictEqual(res.data.success, false);
      assert.strictEqual(res.data.code, "BLUEDART_ERROR");
      assert(res.data.shippingError.includes("Account Balance Exhausted"));

      // Verify DB update recorded the failure without marking Shipped
      assert.strictEqual(recordedUpdate.$set["vendorFulfillments.$.shippingStatus"], "Failed");
      assert(recordedUpdate.$set["vendorFulfillments.$.shippingError"].includes("Account Balance Exhausted"));
      assert.strictEqual(recordedUpdate.$set["vendorFulfillments.$.status"], undefined, "Status must NOT be set to Shipped on failure");
    } finally {
      Order.findById = origOrderFindById;
      Vendor.findById = origVendorFindById;
      Order.findOneAndUpdate = origOrderFindOneAndUpdate;
      Order.updateOne = origOrderUpdateOne;
      bluedartService.generateWayBill = origBDGenerateWayBill;
    }
  });

  // -------------------------------------------------------------------------
  // 10. BlueDart Service Parameterization Safety
  // -------------------------------------------------------------------------
  await test("10. BlueDart service parameterization strictly enforces required shipper fields", async () => {
    // If someone calls generateWayBill with incomplete shipper directly
    let thrownError = null;
    try {
      await bluedartService.generateWayBill({
        shipper: { street: "Only Street" }, // Missing city, state, pincode, etc.
      });
    } catch (e) {
      thrownError = e;
    }

    assert(thrownError !== null, "Must throw on incomplete shipper");
    assert(thrownError.message.includes("Missing required shipper details"));
  });

  console.log("\n==================================================================");
  console.log(` RESULTS: ${passedTests} / ${totalTests} test suites passed`);
  console.log("==================================================================\n");

  if (passedTests === totalTests) {
    console.log(">>> ALL PHASE 2.8B VENDOR AWB GENERATION TESTS PASSED! <<<\n");
  } else {
    throw new Error(`Only ${passedTests}/${totalTests} tests passed.`);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
