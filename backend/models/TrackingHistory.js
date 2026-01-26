const mongoose = require("mongoose");

/**
 * Tracking History Model
 * Stores tracking updates from Blue Dart for offline access
 * Acts as cache so users can track even if Blue Dart API is down
 */
const trackingHistorySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
      required: true,
      index: true,
    },
    awbNo: {
      type: String,
      required: true,
      index: true,
    },
    // Latest status from Blue Dart
    status: {
      type: String,
      default: "In Transit", // In Transit, Out for Delivery, Delivered, Failed, etc.
    },
    // Detailed description
    description: {
      type: String,
      default: "Shipment in transit",
    },
    // Location data
    location: {
      city: String,
      state: String,
      country: String,
    },
    // Event timestamp (when status was updated on Blue Dart)
    eventDate: {
      type: Date,
      default: Date.now,
    },
    // When we last synced with Blue Dart
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
    // Raw response from Blue Dart (for debugging)
    bluedartResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Whether this is the latest status
    isLatest: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast queries
trackingHistorySchema.index({ orderId: 1, createdAt: -1 });
trackingHistorySchema.index({ awbNo: 1, isLatest: 1 });

module.exports = mongoose.model("TrackingHistory", trackingHistorySchema);
