/**
 * Tracking Sync Service
 * Periodically syncs tracking data from Blue Dart for all active shipments
 * Supports both legacy root-level AWBs and vendor fulfillment AWBs
 * Runs in background to keep cache fresh
 */

const Order = require("../models/Order");
const TrackingHistory = require("../models/TrackingHistory");
const bluedartService = require("./bluedart.service");

class TrackingSync {
  constructor() {
    this.isRunning = false;
    this.syncInterval = 60 * 60 * 1000; // Every 1 hour
    this.batchSize = 10; // Sync 10 orders per batch
  }

  /**
   * Start background tracking sync
   * Call this on server startup
   */
  start() {
    if (this.isRunning) {
      console.log("[TRACKING SYNC] Already running");
      return;
    }

    this.isRunning = true;
    console.log("[TRACKING SYNC] Starting background sync...");

    // Run immediately on startup
    this.syncPendingShipments();

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.syncPendingShipments();
    }, this.syncInterval);
  }

  /**
   * Stop background tracking sync
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.isRunning = false;
      console.log("[TRACKING SYNC] Stopped");
    }
  }

  /**
   * Helper: Map BlueDart status string to normalized order & shipping status
   */
  mapTrackingStatus(trackingStatusStr) {
    if (!trackingStatusStr || typeof trackingStatusStr !== "string") {
      return {
        status: "Shipped",
        shippingStatus: "In-Transit",
        isDelivered: false,
        isOutForDelivery: false,
      };
    }

    const lower = trackingStatusStr.toLowerCase();
    if (lower.includes("delivered")) {
      return {
        status: "Delivered",
        shippingStatus: "Delivered",
        isDelivered: true,
        isOutForDelivery: false,
      };
    }

    if (lower.includes("out for delivery")) {
      return {
        status: "Out for Delivery",
        shippingStatus: "In-Transit",
        isDelivered: false,
        isOutForDelivery: true,
      };
    }

    if (
      lower.includes("undelivered") ||
      lower.includes("failed") ||
      lower.includes("rto") ||
      lower.includes("return")
    ) {
      return {
        status: "Processing",
        shippingStatus: "Failed",
        isDelivered: false,
        isOutForDelivery: false,
      };
    }

    return {
      status: "Shipped",
      shippingStatus: "In-Transit",
      isDelivered: false,
      isOutForDelivery: false,
    };
  }

  /**
   * Helper: Save tracking update with deduplication
   * Prevents creating duplicate records when the same event is processed repeatedly
   */
  async saveTrackingUpdate(orderId, awbNo, trackingData, fulfillmentId = null) {
    try {
      const newStatus =
        trackingData.ShipmentTrackingStatus ||
        trackingData.Status ||
        "In Transit";
      const newDesc =
        trackingData.LastEventDescription ||
        trackingData.StatusDescription ||
        "Shipment in transit";
      const newEventDate = trackingData.LastEventDate
        ? new Date(trackingData.LastEventDate).getTime()
        : null;

      // Query latest record for this AWB and order
      const query = { orderId, awbNo, isLatest: true };
      if (fulfillmentId) {
        query.fulfillmentId = fulfillmentId;
      }

      const latestRecord = await TrackingHistory.findOne(query);

      // Check for exact duplicate event
      if (latestRecord) {
        const oldEventDate = latestRecord.eventDate
          ? new Date(latestRecord.eventDate).getTime()
          : null;
        const isSameStatus = latestRecord.status === newStatus;
        const isSameDesc = latestRecord.description === newDesc;
        const isSameTime =
          !newEventDate || !oldEventDate || Math.abs(newEventDate - oldEventDate) < 60000;

        if (isSameStatus && isSameDesc && isSameTime) {
          // Event has not changed; update lastSyncedAt and raw response without adding a duplicate
          latestRecord.lastSyncedAt = new Date();
          latestRecord.bluedartResponse = trackingData;
          await latestRecord.save();
          return latestRecord;
        }
      }

      // If status or event changed, mark old records as not latest
      await TrackingHistory.updateMany(query, { isLatest: false });

      // Save new tracking record
      const newRecord = await TrackingHistory.create({
        orderId,
        fulfillmentId: fulfillmentId || null,
        awbNo,
        status: newStatus,
        description: newDesc,
        location: {
          city: trackingData.City,
          state: trackingData.State,
          country: trackingData.Country,
        },
        eventDate: trackingData.LastEventDate
          ? new Date(trackingData.LastEventDate)
          : new Date(),
        lastSyncedAt: new Date(),
        bluedartResponse: trackingData,
        isLatest: true,
      });

      return newRecord;
    } catch (error) {
      console.error(`[TRACKING SYNC SAVE ERROR]`, error.message);
      return null;
    }
  }

  /**
   * Helper: Evaluate root order status roll-up for multi-vendor orders
   * Rules:
   * 1. Parent order is marked "Delivered" if and only if ALL active (non-cancelled) fulfillments are "Delivered".
   * 2. If some fulfillments are delivered but others are processing/shipped, parent order remains isDelivered: false.
   * 3. If any fulfillment is shipped or in-transit, parent order status is at least "Shipped".
   * 4. If all fulfillments are cancelled, parent order status is "Cancelled".
   */
  async evaluateOrderStatusRollup(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order || !order.vendorFulfillments || order.vendorFulfillments.length === 0) {
        return; // Legacy order handled independently
      }

      const fulfillments = order.vendorFulfillments;
      const activeFulfillments = fulfillments.filter((f) => f.status !== "Cancelled");

      if (activeFulfillments.length === 0) {
        // All fulfillments are cancelled
        if (order.status !== "Cancelled") {
          order.status = "Cancelled";
          order.shippingStatus = "Cancelled";
          await order.save();
        }
        return;
      }

      const allDelivered = activeFulfillments.every(
        (f) => f.status === "Delivered" || f.shippingStatus === "Delivered"
      );

      if (allDelivered) {
        // All active fulfillments are delivered -> mark parent order delivered
        order.status = "Delivered";
        order.shippingStatus = "Delivered";
        order.isDelivered = true;
        if (!order.deliveredAt) {
          order.deliveredAt = new Date();
        }
        await order.save();
        console.log(`[TRACKING ROLLUP] Order ${order._id}: all fulfillments delivered, marked parent order Delivered`);
      } else {
        // Partial or ongoing delivery: do NOT mark parent order delivered
        order.isDelivered = false;
        order.deliveredAt = null;

        const anyInTransit = activeFulfillments.some(
          (f) =>
            f.status === "Shipped" ||
            f.status === "Out for Delivery" ||
            f.shippingStatus === "In-Transit" ||
            f.status === "Delivered"
        );

        if (anyInTransit && order.status === "Processing") {
          order.status = "Shipped";
          order.shippingStatus = "In-Transit";
        }

        await order.save();
        console.log(`[TRACKING ROLLUP] Order ${order._id}: partial status (isDelivered: false, status: ${order.status})`);
      }
    } catch (error) {
      console.error(`[TRACKING ROLLUP ERROR] Order ${orderId}:`, error.message);
    }
  }

  /**
   * Sync a legacy single-vendor order using root-level awbNo
   */
  async syncLegacyOrder(order) {
    const result = await bluedartService.trackShipment(order.awbNo);

    if (result.success && result.trackingData) {
      await this.saveTrackingUpdate(order._id, order.awbNo, result.trackingData, null);

      const { status, shippingStatus, isDelivered, isOutForDelivery } =
        this.mapTrackingStatus(result.trackingData.ShipmentTrackingStatus);

      const updateData = { shippingStatus, status };
      if (isDelivered) {
        updateData.isDelivered = true;
        updateData.deliveredAt = new Date();
      }
      if (isOutForDelivery) {
        updateData.outForDeliveryAt = new Date();
      }

      await Order.findByIdAndUpdate(order._id, updateData);
      console.log(`[TRACKING SYNC] Legacy order ${order._id} updated to ${status}`);
      return { success: true, trackingData: result.trackingData };
    }

    return { success: false, message: "No tracking data returned" };
  }

  /**
   * Sync a specific vendor fulfillment within an order
   */
  async syncFulfillmentShipment(orderId, fulfillment) {
    const result = await bluedartService.trackShipment(fulfillment.awbNo);

    if (result.success && result.trackingData) {
      // 1. Save deduplicated tracking history for this fulfillment
      await this.saveTrackingUpdate(
        orderId,
        fulfillment.awbNo,
        result.trackingData,
        fulfillment.fulfillmentId
      );

      // 2. Map status
      const { status, shippingStatus, isDelivered, isOutForDelivery } =
        this.mapTrackingStatus(result.trackingData.ShipmentTrackingStatus);

      const statusChanged =
        fulfillment.status !== status || fulfillment.shippingStatus !== shippingStatus;

      // 3. Update ONLY the target fulfillment
      const updateFields = {
        "vendorFulfillments.$.shippingStatus": shippingStatus,
        "vendorFulfillments.$.status": status,
        "vendorFulfillments.$.updatedAt": new Date(),
      };
      if (isDelivered && !fulfillment.deliveredAt) {
        updateFields["vendorFulfillments.$.deliveredAt"] = new Date();
      }
      if (isOutForDelivery && !fulfillment.outForDeliveryAt) {
        updateFields["vendorFulfillments.$.outForDeliveryAt"] = new Date();
      }

      const subIdFilter = fulfillment._id
        ? { "vendorFulfillments._id": fulfillment._id }
        : { "vendorFulfillments.fulfillmentId": fulfillment.fulfillmentId };

      const updateOp = { $set: updateFields };
      if (statusChanged) {
        updateOp.$push = {
          "vendorFulfillments.$.statusHistory": {
            status,
            timestamp: new Date(),
            updatedBy: "BlueDart Sync",
            note:
              result.trackingData.LastEventDescription ||
              `Tracking updated to ${status}`,
          },
        };
      }

      await Order.updateOne({ _id: orderId, ...subIdFilter }, updateOp);

      console.log(
        `[TRACKING SYNC] Fulfillment ${fulfillment.fulfillmentId} in order ${orderId} updated to ${status}`
      );

      return { success: true, trackingData: result.trackingData };
    }

    return { success: false, message: "No tracking data returned" };
  }

  /**
   * Sync tracking data for all in-transit shipments (both legacy and fulfillment-based)
   */
  async syncPendingShipments() {
    try {
      console.log("[TRACKING SYNC] Checking for shipments to sync...");

      let successCount = 0;
      let failCount = 0;

      // 1. Find pending legacy orders (root awbNo, no vendorFulfillments)
      const pendingLegacyOrders = await Order.find({
        status: {
          $in: [
            "Shipped",
            "Processing",
            "Will be Out for Delivery in 1-2 Days",
            "Will be Out for Delivery in 1–2 Days",
            "Out for Delivery",
          ],
        },
        shippingStatus: { $in: ["In-Transit", "Pending"] },
        awbNo: { $exists: true, $ne: null },
        $or: [
          { vendorFulfillments: { $exists: false } },
          { vendorFulfillments: { $size: 0 } },
        ],
      })
        .select("_id awbNo shippingStatus status")
        .limit(this.batchSize);

      for (const order of pendingLegacyOrders) {
        try {
          const res = await this.syncLegacyOrder(order);
          if (res.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.warn(
            `[TRACKING SYNC] Failed to sync legacy order ${order._id}: ${error.message}`
          );
          failCount++;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // 2. Find pending multi-vendor orders with fulfillment AWBs
      const pendingFulfillmentOrders = await Order.find({
        "vendorFulfillments.awbNo": { $exists: true, $ne: null },
        "vendorFulfillments.shippingStatus": { $in: ["In-Transit", "Pending"] },
        "vendorFulfillments.status": { $nin: ["Delivered", "Cancelled"] },
      })
        .select("_id status shippingStatus vendorFulfillments isDelivered")
        .limit(this.batchSize);

      for (const order of pendingFulfillmentOrders) {
        const eligibleFulfillments = (order.vendorFulfillments || []).filter(
          (f) =>
            f.awbNo &&
            f.status !== "Delivered" &&
            f.status !== "Cancelled" &&
            f.shippingStatus !== "Delivered" &&
            f.shippingStatus !== "Cancelled"
        );

        let orderHadUpdate = false;

        for (const fulfillment of eligibleFulfillments) {
          try {
            const res = await this.syncFulfillmentShipment(order._id, fulfillment);
            if (res.success) {
              successCount++;
              orderHadUpdate = true;
            } else {
              failCount++;
            }
          } catch (error) {
            console.warn(
              `[TRACKING SYNC] Failed to sync fulfillment ${fulfillment.fulfillmentId} in order ${order._id}: ${error.message}`
            );
            failCount++;
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Re-evaluate root status roll-up if any fulfillment was processed
        if (orderHadUpdate) {
          await this.evaluateOrderStatusRollup(order._id);
        }
      }

      console.log(
        `[TRACKING SYNC] Completed: ${successCount} success, ${failCount} failed`
      );
    } catch (error) {
      console.error("[TRACKING SYNC ERROR]", error.message);
    }
  }

  /**
   * Manual sync for a specific order (admin trigger)
   * Supports both legacy orders and multi-vendor fulfillment orders
   */
  async syncOrder(orderId, targetFulfillmentId = null) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Check if order has vendor fulfillments with AWBs
      const hasFulfillmentsWithAwb =
        order.vendorFulfillments &&
        order.vendorFulfillments.some((f) => f.awbNo);

      if (hasFulfillmentsWithAwb) {
        let targets = order.vendorFulfillments.filter((f) => f.awbNo);
        if (targetFulfillmentId) {
          targets = targets.filter(
            (f) =>
              f.fulfillmentId === targetFulfillmentId ||
              String(f._id) === String(targetFulfillmentId)
          );
        }

        if (targets.length === 0) {
          throw new Error("No matching fulfillment with AWB found");
        }

        const results = [];
        for (const f of targets) {
          const res = await this.syncFulfillmentShipment(order._id, f);
          results.push({ fulfillmentId: f.fulfillmentId, awbNo: f.awbNo, result: res });
        }

        await this.evaluateOrderStatusRollup(order._id);
        return { success: true, mode: "fulfillment", fulfillments: results };
      }

      // Legacy order flow
      if (!order.awbNo) {
        throw new Error("No AWB found for this order");
      }

      const res = await this.syncLegacyOrder(order);
      return { success: res.success, mode: "legacy", data: res.trackingData };
    } catch (error) {
      console.error("[MANUAL SYNC ERROR]", error.message);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new TrackingSync();
