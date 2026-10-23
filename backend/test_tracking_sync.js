/**
 * Test Suite: Vendor Fulfillment Tracking Synchronization (Phase 2.9)
 *
 * Verifies:
 * 1. Multiple AWBs: Different fulfillments in the same order track independently.
 * 2. Partial Delivery: One fulfillment reaching "Delivered" does NOT mark the parent order Delivered.
 * 3. Complete Delivery: Parent order is marked "Delivered" ONLY when all active fulfillments are Delivered.
 * 4. Deduplication: Repeated identical tracking events do NOT generate duplicate TrackingHistory or statusHistory entries.
 * 5. Event Updates: When a new tracking event occurs, TrackingHistory records the update and marks old as isLatest: false.
 * 6. Carrier Failure Resilience: Carrier error on one fulfillment does not corrupt its status or block other fulfillments.
 * 7. Legacy Tracking Compatibility: Orders with root awbNo and no vendorFulfillments continue to sync properly.
 * 8. Manual Order Sync: syncOrder(orderId) handles both fulfillment-based and legacy orders.
 * 9. Controller trackOrder Integration: Supports tracking fulfillment AWBs when order.awbNo is null.
 */

const assert = require("assert");
const mongoose = require("mongoose");
const Order = require("./models/Order");
const TrackingHistory = require("./models/TrackingHistory");
const bluedartService = require("./utils/bluedart.service");
const trackingSync = require("./utils/tracking-sync");
const { trackOrder } = require("./controllers/bluedart.controller");

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

const ORDER_MULTI_ID = new mongoose.Types.ObjectId("770000000000000000000001");
const ORDER_LEGACY_ID = new mongoose.Types.ObjectId("770000000000000000000002");
const FULFILLMENT_A_ID = new mongoose.Types.ObjectId("780000000000000000000001");
const FULFILLMENT_B_ID = new mongoose.Types.ObjectId("780000000000000000000002");

async function runTests() {
  console.log("==================================================================");
  console.log(" PHASE 2.9: VENDOR TRACKING SYNCHRONIZATION TEST SUITE");
  console.log("==================================================================\n");

  const origOrderFind = Order.find;
  const origOrderFindById = Order.findById;
  const origOrderFindByIdAndUpdate = Order.findByIdAndUpdate;
  const origOrderUpdateOne = Order.updateOne;
  const origTrackingFindOne = TrackingHistory.findOne;
  const origTrackingUpdateMany = TrackingHistory.updateMany;
  const origTrackingCreate = TrackingHistory.create;
  const origBDTrackShipment = bluedartService.trackShipment;

  // -------------------------------------------------------------------------
  // 1. Multiple AWBs: Independent fulfillment tracking
  // -------------------------------------------------------------------------
  await test("1. Multiple AWBs in the same order track independently without cross-over", async () => {
    const fulfillmentA = {
      _id: FULFILLMENT_A_ID,
      fulfillmentId: "FUL-ORD-VEND-A",
      awbNo: "BD-AWB-AAA",
      status: "Shipped",
      shippingStatus: "In-Transit",
      statusHistory: [],
    };
    const fulfillmentB = {
      _id: FULFILLMENT_B_ID,
      fulfillmentId: "FUL-ORD-VEND-B",
      awbNo: "BD-AWB-BBB",
      status: "Shipped",
      shippingStatus: "In-Transit",
      statusHistory: [],
    };

    const multiOrder = {
      _id: ORDER_MULTI_ID,
      status: "Shipped",
      shippingStatus: "In-Transit",
      isDelivered: false,
      vendorFulfillments: [fulfillmentA, fulfillmentB],
      save: async function () { return this; },
    };

    Order.find = (filter) => ({
      select: () => ({
        limit: async () => (filter && filter.$or ? [] : [multiOrder]),
      }),
    });
    Order.findById = async () => multiOrder;

    const updatedFulfillments = {};
    Order.updateOne = async (filter, update) => {
      const subId = filter["vendorFulfillments._id"];
      updatedFulfillments[String(subId)] = update;
      return { modifiedCount: 1 };
    };

    // Tracking History mock
    TrackingHistory.findOne = async () => null;
    TrackingHistory.updateMany = async () => ({ modifiedCount: 0 });
    TrackingHistory.create = async (doc) => ({ ...doc, save: async () => doc });

    bluedartService.trackShipment = async (awbNo) => {
      if (awbNo === "BD-AWB-AAA") {
        return {
          success: true,
          trackingData: {
            ShipmentTrackingStatus: "In Transit",
            LastEventDescription: "Departed sorting facility",
            City: "Gurugram",
            State: "HR",
            Country: "India",
            LastEventDate: "2026-10-22 10:00:00",
          },
        };
      }
      if (awbNo === "BD-AWB-BBB") {
        return {
          success: true,
          trackingData: {
            ShipmentTrackingStatus: "Out for Delivery",
            LastEventDescription: "Out for delivery with courier",
            City: "Mumbai",
            State: "MH",
            Country: "India",
            LastEventDate: "2026-10-22 11:30:00",
          },
        };
      }
      throw new Error("Unknown AWB");
    };

    try {
      await trackingSync.syncPendingShipments();

      // Verify Fulfillment A received "Shipped" / "In-Transit"
      const updateA = updatedFulfillments[String(FULFILLMENT_A_ID)];
      assert(updateA !== undefined, "Fulfillment A must be updated");
      assert.strictEqual(updateA.$set["vendorFulfillments.$.status"], "Shipped");
      assert.strictEqual(updateA.$set["vendorFulfillments.$.shippingStatus"], "In-Transit");

      // Verify Fulfillment B received "Out for Delivery"
      const updateB = updatedFulfillments[String(FULFILLMENT_B_ID)];
      assert(updateB !== undefined, "Fulfillment B must be updated");
      assert.strictEqual(updateB.$set["vendorFulfillments.$.status"], "Out for Delivery");
      assert(updateB.$set["vendorFulfillments.$.outForDeliveryAt"] instanceof Date);

      // Verify status histories did not cross over
      if (updateB.$push) {
        assert.strictEqual(updateB.$push["vendorFulfillments.$.statusHistory"].status, "Out for Delivery");
      }
    } finally {
      Order.find = origOrderFind;
      Order.findById = origOrderFindById;
      Order.updateOne = origOrderUpdateOne;
      TrackingHistory.findOne = origTrackingFindOne;
      TrackingHistory.updateMany = origTrackingUpdateMany;
      TrackingHistory.create = origTrackingCreate;
      bluedartService.trackShipment = origBDTrackShipment;
    }
  });

  // -------------------------------------------------------------------------
  // 2. Partial Delivery: One fulfillment delivered does NOT mark parent order Delivered
  // -------------------------------------------------------------------------
  await test("2. Partial Delivery: One fulfillment reaching Delivered does NOT mark parent order Delivered", async () => {
    const fulfillmentA = {
      _id: FULFILLMENT_A_ID,
      fulfillmentId: "FUL-ORD-VEND-A",
      awbNo: "BD-AWB-DELIVERED",
      status: "Shipped",
      shippingStatus: "In-Transit",
    };
    const fulfillmentB = {
      _id: FULFILLMENT_B_ID,
      fulfillmentId: "FUL-ORD-VEND-B",
      awbNo: "BD-AWB-INTRANSIT",
      status: "Shipped",
      shippingStatus: "In-Transit",
    };

    const multiOrder = {
      _id: ORDER_MULTI_ID,
      status: "Shipped",
      shippingStatus: "In-Transit",
      isDelivered: false,
      deliveredAt: null,
      vendorFulfillments: [fulfillmentA, fulfillmentB],
      save: async function () { return this; },
    };

    Order.find = (filter) => ({
      select: () => ({
        limit: async () => (filter && filter.$or ? [] : [multiOrder]),
      }),
    });
    Order.findById = async () => multiOrder;

    Order.updateOne = async (filter, update) => {
      const subId = filter["vendorFulfillments._id"];
      const target = multiOrder.vendorFulfillments.find(f => String(f._id) === String(subId));
      if (target && update.$set) {
        target.status = update.$set["vendorFulfillments.$.status"];
        target.shippingStatus = update.$set["vendorFulfillments.$.shippingStatus"];
      }
      return { modifiedCount: 1 };
    };

    TrackingHistory.findOne = async () => null;
    TrackingHistory.updateMany = async () => ({ modifiedCount: 0 });
    TrackingHistory.create = async (doc) => ({ ...doc, save: async () => doc });

    bluedartService.trackShipment = async (awbNo) => {
      if (awbNo === "BD-AWB-DELIVERED") {
        return {
          success: true,
          trackingData: {
            ShipmentTrackingStatus: "Delivered",
            LastEventDescription: "Delivered to consignee",
            City: "Pune",
            State: "MH",
            Country: "India",
            LastEventDate: "2026-10-22 14:00:00",
          },
        };
      }
      if (awbNo === "BD-AWB-INTRANSIT") {
        return {
          success: true,
          trackingData: {
            ShipmentTrackingStatus: "In Transit",
            LastEventDescription: "Package moving in network",
            City: "Mumbai",
            State: "MH",
            Country: "India",
            LastEventDate: "2026-10-22 12:00:00",
          },
        };
      }
      throw new Error("Unknown AWB");
    };

    try {
      await trackingSync.syncPendingShipments();

      // Fulfillment A should be Delivered
      assert.strictEqual(fulfillmentA.status, "Delivered");
      assert.strictEqual(fulfillmentA.shippingStatus, "Delivered");

      // Fulfillment B should still be Shipped
      assert.strictEqual(fulfillmentB.status, "Shipped");

      // CRITICAL: Parent order MUST NOT be marked Delivered!
      assert.strictEqual(multiOrder.isDelivered, false, "Parent order must NOT be marked Delivered on partial fulfillment delivery");
      assert.strictEqual(multiOrder.deliveredAt, null);
      assert.strictEqual(multiOrder.status, "Shipped");
    } finally {
      Order.find = origOrderFind;
      Order.findById = origOrderFindById;
      Order.updateOne = origOrderUpdateOne;
      TrackingHistory.findOne = origTrackingFindOne;
      TrackingHistory.updateMany = origTrackingUpdateMany;
      TrackingHistory.create = origTrackingCreate;
      bluedartService.trackShipment = origBDTrackShipment;
    }
  });

  // -------------------------------------------------------------------------
  // 3. Complete Delivery: Parent order is marked Delivered when ALL active fulfillments are Delivered
  // -------------------------------------------------------------------------
  await test("3. Complete Delivery: Parent order is marked Delivered ONLY when 100% of active fulfillments are Delivered", async () => {
    const fulfillmentA = {
      _id: FULFILLMENT_A_ID,
      fulfillmentId: "FUL-ORD-VEND-A",
      awbNo: "BD-AWB-1",
      status: "Delivered", // already delivered
      shippingStatus: "Delivered",
    };
    const fulfillmentB = {
      _id: FULFILLMENT_B_ID,
      fulfillmentId: "FUL-ORD-VEND-B",
      awbNo: "BD-AWB-2",
      status: "Shipped", // delivering now
      shippingStatus: "In-Transit",
    };

    const multiOrder = {
      _id: ORDER_MULTI_ID,
      status: "Shipped",
      shippingStatus: "In-Transit",
      isDelivered: false,
      deliveredAt: null,
      vendorFulfillments: [fulfillmentA, fulfillmentB],
      save: async function () { return this; },
    };

    Order.find = (filter) => ({
      select: () => ({
        limit: async () => (filter && filter.$or ? [] : [multiOrder]),
      }),
    });
    Order.findById = async () => multiOrder;

    Order.updateOne = async (filter, update) => {
      const subId = filter["vendorFulfillments._id"];
      const target = multiOrder.vendorFulfillments.find(f => String(f._id) === String(subId));
      if (target && update.$set) {
        target.status = update.$set["vendorFulfillments.$.status"];
        target.shippingStatus = update.$set["vendorFulfillments.$.shippingStatus"];
      }
      return { modifiedCount: 1 };
    };

    TrackingHistory.findOne = async () => null;
    TrackingHistory.updateMany = async () => ({ modifiedCount: 0 });
    TrackingHistory.create = async (doc) => ({ ...doc, save: async () => doc });

    bluedartService.trackShipment = async (awbNo) => ({
      success: true,
      trackingData: {
        ShipmentTrackingStatus: "Delivered",
        LastEventDescription: "Delivered to consignee",
        LastEventDate: "2026-10-22 15:00:00",
      },
    });

    try {
      await trackingSync.syncPendingShipments();

      // Now both fulfillments are delivered
      assert.strictEqual(fulfillmentA.status, "Delivered");
      assert.strictEqual(fulfillmentB.status, "Delivered");

      // Parent order should now be marked Delivered
      assert.strictEqual(multiOrder.isDelivered, true, "Parent order must be marked Delivered when all fulfillments are delivered");
      assert.strictEqual(multiOrder.status, "Delivered");
      assert.strictEqual(multiOrder.shippingStatus, "Delivered");
      assert(multiOrder.deliveredAt instanceof Date, "deliveredAt must be set");
    } finally {
      Order.find = origOrderFind;
      Order.findById = origOrderFindById;
      Order.updateOne = origOrderUpdateOne;
      TrackingHistory.findOne = origTrackingFindOne;
      TrackingHistory.updateMany = origTrackingUpdateMany;
      TrackingHistory.create = origTrackingCreate;
      bluedartService.trackShipment = origBDTrackShipment;
    }
  });

  // -------------------------------------------------------------------------
  // 4. Deduplication of Repeated Tracking Events
  // -------------------------------------------------------------------------
  await test("4. Deduplication: Repeated identical tracking events update lastSyncedAt without duplicate records", async () => {
    let createdCount = 0;
    let existingRecordSaved = false;

    const existingRecord = {
      _id: new mongoose.Types.ObjectId(),
      orderId: ORDER_MULTI_ID,
      awbNo: "BD-AWB-DEDUP",
      fulfillmentId: "FUL-1",
      status: "In Transit",
      description: "Shipment in transit at hub",
      eventDate: new Date("2026-10-22T08:00:00Z"),
      lastSyncedAt: new Date("2026-10-22T08:00:00Z"),
      isLatest: true,
      save: async function () {
        existingRecordSaved = true;
        return this;
      },
    };

    // TrackingHistory.findOne returns existing record
    TrackingHistory.findOne = async () => existingRecord;
    TrackingHistory.create = async () => {
      createdCount++;
      return {};
    };

    const identicalTrackingData = {
      ShipmentTrackingStatus: "In Transit",
      LastEventDescription: "Shipment in transit at hub",
      LastEventDate: "2026-10-22T08:00:00Z",
      City: "Delhi",
    };

    try {
      const res = await trackingSync.saveTrackingUpdate(
        ORDER_MULTI_ID,
        "BD-AWB-DEDUP",
        identicalTrackingData,
        "FUL-1"
      );

      // Verify no new record was created
      assert.strictEqual(createdCount, 0, "No duplicate record should be created for identical event");
      assert.strictEqual(existingRecordSaved, true, "Existing record lastSyncedAt must be updated");
      assert(res.lastSyncedAt > new Date("2026-10-22T08:00:00Z"));
    } finally {
      TrackingHistory.findOne = origTrackingFindOne;
      TrackingHistory.create = origTrackingCreate;
    }
  });

  // -------------------------------------------------------------------------
  // 5. Event Updates: When status changes, new record is created with isLatest: true
  // -------------------------------------------------------------------------
  await test("5. Status transition marks old tracking record isLatest: false and creates new entry", async () => {
    let oldRecordsDemoted = false;
    let newRecordCreated = null;

    const existingRecord = {
      _id: new mongoose.Types.ObjectId(),
      orderId: ORDER_MULTI_ID,
      awbNo: "BD-AWB-TRANSIT",
      fulfillmentId: "FUL-1",
      status: "In Transit",
      description: "Shipment in transit at hub",
      eventDate: new Date("2026-10-22T08:00:00Z"),
      isLatest: true,
    };

    TrackingHistory.findOne = async () => existingRecord;
    TrackingHistory.updateMany = async (filter, update) => {
      if (update.isLatest === false) {
        oldRecordsDemoted = true;
      }
      return { modifiedCount: 1 };
    };
    TrackingHistory.create = async (doc) => {
      newRecordCreated = doc;
      return doc;
    };

    const newTrackingData = {
      ShipmentTrackingStatus: "Out for Delivery", // New status!
      LastEventDescription: "Out for delivery with courier agent",
      LastEventDate: "2026-10-22T11:00:00Z",
      City: "Delhi",
    };

    try {
      await trackingSync.saveTrackingUpdate(
        ORDER_MULTI_ID,
        "BD-AWB-TRANSIT",
        newTrackingData,
        "FUL-1"
      );

      assert.strictEqual(oldRecordsDemoted, true, "Previous records must be marked isLatest: false");
      assert(newRecordCreated !== null, "New TrackingHistory record must be created");
      assert.strictEqual(newRecordCreated.status, "Out for Delivery");
      assert.strictEqual(newRecordCreated.fulfillmentId, "FUL-1");
      assert.strictEqual(newRecordCreated.isLatest, true);
    } finally {
      TrackingHistory.findOne = origTrackingFindOne;
      TrackingHistory.updateMany = origTrackingUpdateMany;
      TrackingHistory.create = origTrackingCreate;
    }
  });

  // -------------------------------------------------------------------------
  // 6. Carrier Failure Resilience: Failure on one AWB does not corrupt state
  // -------------------------------------------------------------------------
  await test("6. Carrier failure on one fulfillment does not corrupt state or block other fulfillments", async () => {
    const fulfillmentA = {
      _id: FULFILLMENT_A_ID,
      fulfillmentId: "FUL-ORD-FAIL",
      awbNo: "BD-AWB-FAIL",
      status: "Shipped",
      shippingStatus: "In-Transit",
    };
    const fulfillmentB = {
      _id: FULFILLMENT_B_ID,
      fulfillmentId: "FUL-ORD-OK",
      awbNo: "BD-AWB-OK",
      status: "Shipped",
      shippingStatus: "In-Transit",
    };

    const multiOrder = {
      _id: ORDER_MULTI_ID,
      status: "Shipped",
      shippingStatus: "In-Transit",
      isDelivered: false,
      vendorFulfillments: [fulfillmentA, fulfillmentB],
      save: async function () { return this; },
    };

    Order.find = (filter) => ({
      select: () => ({
        limit: async () => (filter && filter.$or ? [] : [multiOrder]),
      }),
    });
    Order.findById = async () => multiOrder;

    const updatedMap = {};
    Order.updateOne = async (filter, update) => {
      const subId = filter["vendorFulfillments._id"];
      updatedMap[String(subId)] = update;
      return { modifiedCount: 1 };
    };

    TrackingHistory.findOne = async () => null;
    TrackingHistory.updateMany = async () => ({ modifiedCount: 0 });
    TrackingHistory.create = async (doc) => ({ ...doc, save: async () => doc });

    bluedartService.trackShipment = async (awbNo) => {
      if (awbNo === "BD-AWB-FAIL") {
        throw new Error("Carrier Gateway Timeout: 504");
      }
      if (awbNo === "BD-AWB-OK") {
        return {
          success: true,
          trackingData: {
            ShipmentTrackingStatus: "In Transit",
            LastEventDescription: "Arrived at destination hub",
          },
        };
      }
      throw new Error("Unknown AWB");
    };

    try {
      await trackingSync.syncPendingShipments();

      // Fulfillment A must NOT have been updated with false data
      assert.strictEqual(updatedMap[String(FULFILLMENT_A_ID)], undefined, "Failed carrier call must not alter fulfillment");

      // Fulfillment B must be updated normally
      assert(updatedMap[String(FULFILLMENT_B_ID)] !== undefined, "Successful carrier call must update fulfillment");
    } finally {
      Order.find = origOrderFind;
      Order.findById = origOrderFindById;
      Order.updateOne = origOrderUpdateOne;
      TrackingHistory.findOne = origTrackingFindOne;
      TrackingHistory.updateMany = origTrackingUpdateMany;
      TrackingHistory.create = origTrackingCreate;
      bluedartService.trackShipment = origBDTrackShipment;
    }
  });

  // -------------------------------------------------------------------------
  // 7. Legacy Tracking Compatibility: Orders with root awbNo and no fulfillments
  // -------------------------------------------------------------------------
  await test("7. Legacy tracking compatibility: Single-vendor root awbNo syncs correctly", async () => {
    let legacyUpdated = null;

    const legacyOrder = {
      _id: ORDER_LEGACY_ID,
      awbNo: "BD-LEGACY-AWB-100",
      status: "Shipped",
      shippingStatus: "In-Transit",
      vendorFulfillments: [], // No fulfillments
    };

    Order.find = (filter) => {
      // If querying legacy orders
      if (filter.awbNo && filter.$or) {
        return {
          select: () => ({
            limit: async () => [legacyOrder],
          }),
        };
      }
      // If querying fulfillment orders
      return {
        select: () => ({
          limit: async () => [],
        }),
      };
    };

    Order.findByIdAndUpdate = async (id, update) => {
      legacyUpdated = update;
      return legacyOrder;
    };

    TrackingHistory.findOne = async () => null;
    TrackingHistory.updateMany = async () => ({ modifiedCount: 0 });
    TrackingHistory.create = async (doc) => ({ ...doc, save: async () => doc });

    bluedartService.trackShipment = async (awbNo) => {
      assert.strictEqual(awbNo, "BD-LEGACY-AWB-100");
      return {
        success: true,
        trackingData: {
          ShipmentTrackingStatus: "Delivered",
          LastEventDescription: "Package delivered to customer",
        },
      };
    };

    try {
      await trackingSync.syncPendingShipments();

      assert(legacyUpdated !== null, "Legacy order must be updated");
      assert.strictEqual(legacyUpdated.status, "Delivered");
      assert.strictEqual(legacyUpdated.shippingStatus, "Delivered");
      assert.strictEqual(legacyUpdated.isDelivered, true);
    } finally {
      Order.find = origOrderFind;
      Order.findByIdAndUpdate = origOrderFindByIdAndUpdate;
      TrackingHistory.findOne = origTrackingFindOne;
      TrackingHistory.updateMany = origTrackingUpdateMany;
      TrackingHistory.create = origTrackingCreate;
      bluedartService.trackShipment = origBDTrackShipment;
    }
  });

  // -------------------------------------------------------------------------
  // 8. Manual Order Sync: syncOrder(orderId) handles multi-vendor fulfillments
  // -------------------------------------------------------------------------
  await test("8. Manual Order Sync: syncOrder(orderId) syncs all fulfillment AWBs in order", async () => {
    const fulfillmentA = {
      _id: FULFILLMENT_A_ID,
      fulfillmentId: "FUL-1",
      awbNo: "BD-MANUAL-1",
      status: "Shipped",
      shippingStatus: "In-Transit",
    };
    const fulfillmentB = {
      _id: FULFILLMENT_B_ID,
      fulfillmentId: "FUL-2",
      awbNo: "BD-MANUAL-2",
      status: "Shipped",
      shippingStatus: "In-Transit",
    };

    const multiOrder = {
      _id: ORDER_MULTI_ID,
      status: "Shipped",
      shippingStatus: "In-Transit",
      vendorFulfillments: [fulfillmentA, fulfillmentB],
      save: async function () { return this; },
    };

    Order.findById = async () => multiOrder;
    Order.updateOne = async () => ({ modifiedCount: 1 });
    TrackingHistory.findOne = async () => null;
    TrackingHistory.updateMany = async () => ({ modifiedCount: 0 });
    TrackingHistory.create = async (doc) => ({ ...doc, save: async () => doc });

    let syncedAwbs = [];
    bluedartService.trackShipment = async (awbNo) => {
      syncedAwbs.push(awbNo);
      return {
        success: true,
        trackingData: { ShipmentTrackingStatus: "In Transit" },
      };
    };

    try {
      const res = await trackingSync.syncOrder(String(ORDER_MULTI_ID));

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.mode, "fulfillment");
      assert.strictEqual(res.fulfillments.length, 2);
      assert.deepStrictEqual(syncedAwbs, ["BD-MANUAL-1", "BD-MANUAL-2"]);
    } finally {
      Order.findById = origOrderFindById;
      Order.updateOne = origOrderUpdateOne;
      TrackingHistory.findOne = origTrackingFindOne;
      TrackingHistory.updateMany = origTrackingUpdateMany;
      TrackingHistory.create = origTrackingCreate;
      bluedartService.trackShipment = origBDTrackShipment;
    }
  });

  // -------------------------------------------------------------------------
  // 9. Controller trackOrder Integration with Fulfillment AWB
  // -------------------------------------------------------------------------
  await test("9. Controller trackOrder endpoint retrieves tracking for fulfillment AWB when order.awbNo is null", async () => {
    const fulfillmentA = {
      _id: FULFILLMENT_A_ID,
      fulfillmentId: "FUL-TARGET",
      awbNo: "BD-FULFILLMENT-AWB",
      courier: "BlueDart",
      shippingStatus: "In-Transit",
    };

    const multiOrder = {
      _id: ORDER_MULTI_ID,
      awbNo: null, // Root AWB is null!
      status: "Shipped",
      shippingStatus: "In-Transit",
      vendorFulfillments: [fulfillmentA],
      populate: function () { return this; },
    };

    Order.findById = () => ({
      populate: async () => multiOrder,
    });

    TrackingHistory.findOne = () => ({
      sort: () => ({
        limit: async () => ({
          status: "In Transit",
          description: "Shipment moving toward delivery hub",
          location: { city: "Delhi", state: "DL" },
          eventDate: new Date(),
          lastSyncedAt: new Date(),
        }),
      }),
    });

    try {
      const req = {
        params: { orderId: String(ORDER_MULTI_ID) },
        query: { fulfillmentId: "FUL-TARGET" },
      };
      const res = createMockRes();

      await trackOrder(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.awbNo, "BD-FULFILLMENT-AWB");
      assert.strictEqual(res.data.fulfillmentId, "FUL-TARGET");
      assert.strictEqual(res.data.courier, "BlueDart");
      assert.strictEqual(res.data.tracking.status, "In Transit");
    } finally {
      Order.findById = origOrderFindById;
      TrackingHistory.findOne = origTrackingFindOne;
    }
  });

  console.log("\n==================================================================");
  console.log(` RESULTS: ${passedTests} / ${totalTests} test suites passed`);
  console.log("==================================================================\n");

  if (passedTests === totalTests) {
    console.log(">>> ALL PHASE 2.9 TRACKING SYNC TESTS PASSED! <<<\n");
  } else {
    throw new Error(`Only ${passedTests}/${totalTests} tests passed.`);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
