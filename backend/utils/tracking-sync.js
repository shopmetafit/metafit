/**
 * Tracking Sync Service
 * Periodically syncs tracking data from Blue Dart for all active shipments
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
   * Sync tracking data for all in-transit shipments
   */
  async syncPendingShipments() {
    try {
      console.log("[TRACKING SYNC] Checking for shipments to sync...");

      // Find all orders that are shipped but not delivered
      const pendingOrders = await Order.find({
        status: "Shipped",
        shippingStatus: { $in: ["In-Transit", "Pending"] },
        awbNo: { $exists: true, $ne: null },
      })
        .select("_id awbNo shippingStatus")
        .limit(this.batchSize);

      if (pendingOrders.length === 0) {
        console.log("[TRACKING SYNC] No pending shipments to sync");
        return;
      }

      console.log(`[TRACKING SYNC] Syncing ${pendingOrders.length} shipments...`);

      // Sync each order
      let successCount = 0;
      let failCount = 0;

      for (const order of pendingOrders) {
        try {
          const result = await bluedartService.trackShipment(order.awbNo);

          if (result.success && result.trackingData) {
            // Save tracking update
            await this.saveTrackingUpdate(order._id, order.awbNo, result.trackingData);

            // Update order status if tracking shows delivered
            if (
              result.trackingData.ShipmentTrackingStatus &&
              result.trackingData.ShipmentTrackingStatus.toLowerCase().includes("delivered")
            ) {
              await Order.findByIdAndUpdate(order._id, {
                status: "Delivered",
                shippingStatus: "Delivered",
                isDelivered: true,
                deliveredAt: new Date(),
              });

              console.log(`[TRACKING SYNC] Order ${order._id} marked as delivered`);
            }

            successCount++;
          }
        } catch (error) {
          console.warn(
            `[TRACKING SYNC] Failed to sync order ${order._id}: ${error.message}`
          );
          failCount++;
        }

        // Small delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(
        `[TRACKING SYNC] Completed: ${successCount} success, ${failCount} failed`
      );
    } catch (error) {
      console.error("[TRACKING SYNC ERROR]", error.message);
    }
  }

  /**
   * Save a single tracking update
   */
  async saveTrackingUpdate(orderId, awbNo, trackingData) {
    try {
      // Mark previous records as not latest
      await TrackingHistory.updateMany(
        { orderId, awbNo, isLatest: true },
        { isLatest: false }
      );

      // Save new tracking record
      await TrackingHistory.create({
        orderId,
        awbNo,
        status: trackingData.ShipmentTrackingStatus || "In Transit",
        description: trackingData.LastEventDescription || "Shipment in transit",
        location: {
          city: trackingData.City,
          state: trackingData.State,
          country: trackingData.Country,
        },
        eventDate: trackingData.LastEventDate || new Date(),
        lastSyncedAt: new Date(),
        bluedartResponse: trackingData,
        isLatest: true,
      });
    } catch (error) {
      console.error(`[TRACKING SYNC SAVE ERROR]`, error.message);
    }
  }

  /**
   * Manual sync for a specific order (admin trigger)
   */
  async syncOrder(orderId) {
    try {
      const order = await Order.findById(orderId).select("awbNo");
      if (!order || !order.awbNo) {
        throw new Error("Order or AWB not found");
      }

      const result = await bluedartService.trackShipment(order.awbNo);
      if (result.success) {
        await this.saveTrackingUpdate(orderId, order.awbNo, result.trackingData);
        return { success: true, data: result.trackingData };
      } else {
        throw new Error("Blue Dart tracking failed");
      }
    } catch (error) {
      console.error("[MANUAL SYNC ERROR]", error.message);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new TrackingSync();
