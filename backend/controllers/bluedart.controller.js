const Order = require("../models/Order");
const TrackingHistory = require("../models/TrackingHistory");
const bluedartService = require("../utils/bluedart.service");

/**
 * Generate AWB for a specific order
 * POST /api/shipment/:orderId/generate-awb
 */
exports.generateAWB = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { consigneeName, consigneePhone, consigneeEmail, weight } = req.body;

    // ======================================
    // STEP 1: Validation Checks
    // ======================================
    
    // 1.1: Validate input fields
    if (!orderId || !consigneeName || !consigneePhone) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: orderId, consigneeName, consigneePhone",
        code: "VALIDATION_ERROR",
      });
    }

    // 1.2: Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        code: "ORDER_NOT_FOUND",
      });
    }

    // 1.3: Check if order is already shipped (SAFETY CHECK 1)
    if (order.status === "Shipped" || order.status === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Order is already shipped or delivered",
        code: "ORDER_ALREADY_SHIPPED",
        awbNo: order.awbNo,
      });
    }

    // 1.4: Check if order is cancelled (SAFETY CHECK 2)
    if (order.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot generate AWB for cancelled order",
        code: "ORDER_CANCELLED",
      });
    }

    // 1.5: Check if AWB already generated (SAFETY CHECK 3)
    if (order.awbNo) {
      return res.status(400).json({
        success: false,
        message: "AWB already generated for this order",
        code: "AWB_ALREADY_EXISTS",
        awbNo: order.awbNo,
        trackingId: order.trackingId,
      });
    }

    // 1.6: Check if order is paid (SAFETY CHECK 4)
    if (!order.isPaid) {
      return res.status(400).json({
        success: false,
        message: "Order must be paid before generating AWB",
        code: "ORDER_NOT_PAID",
        paymentStatus: order.paymentStatus,
      });
    }

    // 1.7: Verify shipping address is complete (SAFETY CHECK 5)
    if (!order.shippingAddress || !order.shippingAddress.address || 
        !order.shippingAddress.city || !order.shippingAddress.postalCode) {
      return res.status(400).json({
        success: false,
        message: "Incomplete shipping address",
        code: "INCOMPLETE_ADDRESS",
        shippingAddress: order.shippingAddress,
      });
    }

    // Prepare data for Blue Dart
    const orderData = {
      consigneeName,
      consigneePhone,
      consigneeEmail: consigneeEmail || "",
      weight: weight || "1",
      length: "20",
      width: "15",
      height: "10",
      totalPrice: order.totalPrice,
      shippingAddress: order.shippingAddress,
    };

    // ======================================
    // STEP 2: Call Blue Dart API
    // ======================================
    
    console.log(`[AWB] Generating waybill for order ${orderId}...`);
    
    let result;
    try {
      result = await bluedartService.generateWayBill(orderData);
    } catch (bdError) {
      console.error(`[AWB ERROR] Blue Dart API failed:`, bdError.message);
      
      // ======================================
      // STEP 3: Handle Blue Dart Failures Gracefully
      // ======================================
      
      // Check for specific Blue Dart error codes
      const errorMessage = bdError.message || "";
      
      // Balance issue
      if (errorMessage.includes("AvailableBalance") || 
          errorMessage.includes("AvailableAmountForBooking")) {
        order.shippingStatus = "FAILED";
        order.shippingError = "Insufficient Blue Dart account balance. Contact support.";
        await order.save();
        
        return res.status(402).json({
          success: false,
          message: "Blue Dart account has insufficient balance",
          code: "BLUEDART_INSUFFICIENT_BALANCE",
          shippingError: order.shippingError,
          orderId: order._id,
        });
      }
      
      // Authentication error
      if (errorMessage.includes("JWT") || errorMessage.includes("401")) {
        order.shippingStatus = "FAILED";
        order.shippingError = "Authentication error with shipping provider.";
        await order.save();
        
        return res.status(503).json({
          success: false,
          message: "Shipping provider authentication failed",
          code: "BLUEDART_AUTH_ERROR",
          shippingError: order.shippingError,
          orderId: order._id,
        });
      }
      
      // Network/connectivity error
      if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("timeout")) {
        order.shippingStatus = "PENDING";
        order.shippingError = "Shipping provider temporarily unavailable. Will retry.";
        await order.save();
        
        return res.status(503).json({
          success: false,
          message: "Shipping provider temporarily unavailable",
          code: "BLUEDART_UNAVAILABLE",
          shippingError: order.shippingError,
          orderId: order._id,
          retry: true,
        });
      }
      
      // Generic error
      order.shippingStatus = "FAILED";
      order.shippingError = `Shipping generation failed: ${bdError.message}`;
      await order.save();
      
      return res.status(500).json({
        success: false,
        message: `Failed to generate waybill: ${bdError.message}`,
        code: "BLUEDART_ERROR",
        shippingError: order.shippingError,
        orderId: order._id,
      });
    }

    // ======================================
    // STEP 4: Success - Update Order
    // ======================================
    
    if (result.success) {
      order.awbNo = result.awbNo;
      order.trackingId = result.trackingId;
      order.shippingStatus = "In-Transit";
      order.status = "Shipped";
      order.bluedartGeneratedAt = new Date();
      order.shippingError = null; // Clear any previous errors
      await order.save();

      console.log(`[AWB SUCCESS] Order ${orderId} - AWB ${result.awbNo}`);
      
      return res.status(201).json({
        success: true,
        message: "AWB generated successfully",
        code: "AWB_GENERATED",
        awbNo: result.awbNo,
        trackingId: result.trackingId,
        order: {
          orderId: order._id,
          status: order.status,
          shippingStatus: order.shippingStatus,
          bluedartGeneratedAt: order.bluedartGeneratedAt,
        },
      });
    } else {
      throw new Error("Blue Dart returned unsuccessful response");
    }
  } catch (error) {
    console.error("[AWB EXCEPTION] Unexpected error:", error.message);
    
    res.status(500).json({
      success: false,
      message: "Unexpected error while generating AWB",
      code: "INTERNAL_ERROR",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get tracking status for an order
 * STEP 3: Works WITH or WITHOUT Blue Dart
 * GET /api/shipment/:orderId/track
 */
exports.trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { forceRefresh = false } = req.query;

    // ======================================
    // STEP 1: Get Order Details
    // ======================================

    const order = await Order.findById(orderId).populate("user", "name email");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check if AWB exists
    if (!order.awbNo) {
      return res.status(400).json({
        success: false,
        message: "Shipment not initiated for this order yet",
        code: "NO_AWB",
        shippingStatus: order.shippingStatus,
      });
    }

    // ======================================
    // STEP 2: Try to fetch from Blue Dart (Optional)
    // ======================================

    let trackingData = null;
    let bluedartError = null;
    let fromCache = false;

    if (forceRefresh === "true" || forceRefresh === true) {
      console.log(`[TRACKING] Force refresh for order ${orderId}`);
      try {
        const result = await bluedartService.trackShipment(order.awbNo);
        if (result.success) {
          trackingData = result.trackingData;
          
          // Save to tracking history
          await saveTrackingUpdate(orderId, order.awbNo, trackingData);
        }
      } catch (bdError) {
        console.warn(`[TRACKING] Blue Dart call failed:`, bdError.message);
        bluedartError = bdError.message;
        // Will fall back to cache below
      }
    }

    // ======================================
    // STEP 3: Fallback to Cached Data
    // ======================================

    if (!trackingData) {
      const cachedTracking = await TrackingHistory.findOne({
        orderId,
        awbNo: order.awbNo,
      })
        .sort({ createdAt: -1 })
        .limit(1);

      if (cachedTracking) {
        trackingData = cachedTracking;
        fromCache = true;
        console.log(`[TRACKING] Using cached data for order ${orderId}`);
      }
    }

    // ======================================
    // STEP 4: Build Response
    // ======================================

    const response = {
      success: true,
      orderId: order._id,
      awbNo: order.awbNo,
      courier: order.courier,
      
      // Order-level status
      orderStatus: order.status,
      orderCreatedAt: order.createdAt,
      
      // Shipping-level status
      shippingStatus: order.shippingStatus,
      shippingError: order.shippingError,
      
      // Tracking data (if available)
      tracking: trackingData
        ? {
            status: trackingData.status || order.shippingStatus,
            description: trackingData.description,
            location: trackingData.location,
            eventDate: trackingData.eventDate || trackingData.createdAt,
            lastSyncedAt: trackingData.lastSyncedAt || trackingData.updatedAt,
          }
        : null,

      // Data source indicators
      dataSource: {
        isLive: !fromCache && !bluedartError,
        isCached: fromCache,
        unavailable: !trackingData,
      },

      // For admin debugging
      ...(bluedartError && {
        bluedartError,
        message: "Live tracking unavailable. Showing cached data.",
      }),
    };

    res.json(response);
  } catch (error) {
    console.error("[TRACKING EXCEPTION]", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve tracking information",
      code: "TRACKING_ERROR",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Helper: Save tracking update to database
 */
async function saveTrackingUpdate(orderId, awbNo, trackingData) {
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

    console.log(`[TRACKING SAVED] AWB ${awbNo} tracking updated`);
  } catch (error) {
    console.error(`[TRACKING SAVE ERROR]`, error.message);
    // Don't throw - tracking save failure shouldn't break tracking endpoint
  }
}

/**
 * Cancel shipment
 * POST /api/shipment/:orderId/cancel
 */
exports.cancelShipment = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check if AWB exists
    if (!order.awbNo) {
      return res.status(400).json({
        success: false,
        message: "No shipment to cancel",
      });
    }

    // Check if already cancelled
    if (order.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order already cancelled",
      });
    }

    // Call Blue Dart cancel API
    const result = await bluedartService.cancelWayBill(order.awbNo);

    if (result.success) {
      // Update order status
      order.status = "Cancelled";
      order.shippingStatus = "Cancelled";
      await order.save();

      return res.json({
        success: true,
        message: "Shipment cancelled successfully",
        orderId: order._id,
        awbNo: order.awbNo,
      });
    } else {
      throw new Error("Failed to cancel shipment");
    }
  } catch (error) {
    console.error("Error in cancelShipment:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel shipment",
    });
  }
};

/**
 * Get shipping info for an order
 * GET /api/shipment/:orderId
 */
exports.getShippingInfo = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({
      success: true,
      orderId: order._id,
      courier: order.courier,
      awbNo: order.awbNo,
      trackingId: order.trackingId,
      shippingStatus: order.shippingStatus,
      shippingError: order.shippingError,
      status: order.status,
      bluedartGeneratedAt: order.bluedartGeneratedAt,
      shippingAddress: order.shippingAddress,
    });
  } catch (error) {
    console.error("Error in getShippingInfo:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch shipping info",
    });
  }
};

/**
 * ADMIN: List all orders pending shipment
 * GET /api/admin/shipment/pending
 */
exports.listPendingShipments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = "Processing" } = req.query;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ status })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "name email phone");

    const total = await Order.countDocuments({ status });

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in listPendingShipments:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch pending shipments",
    });
  }
};

/**
 * ADMIN: Retry failed shipment generation
 * POST /api/admin/shipment/:orderId/retry
 */
exports.retryShipmentGeneration = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { consigneeName, consigneePhone, consigneeEmail, weight } = req.body;

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check if order is paid
    if (!order.isPaid) {
      return res.status(400).json({
        success: false,
        message: "Order must be paid before generating AWB",
      });
    }

    // If no name provided, use existing or previous attempt
    const finalConsigneeName = consigneeName || order.shippingAddress?.city || "Customer";
    const finalConsigneePhone = consigneePhone || "9999999999";
    const finalConsigneeEmail = consigneeEmail || "";

    console.log(`[AWB RETRY] Admin retrying AWB for order ${orderId}`);

    // Prepare data
    const orderData = {
      consigneeName: finalConsigneeName,
      consigneePhone: finalConsigneePhone,
      consigneeEmail: finalConsigneeEmail,
      weight: weight || "1",
      totalPrice: order.totalPrice,
      shippingAddress: order.shippingAddress,
    };

    let result;
    try {
      result = await bluedartService.generateWayBill(orderData);
    } catch (bdError) {
      console.error(`[AWB RETRY ERROR]`, bdError.message);
      order.shippingStatus = "FAILED";
      order.shippingError = `Retry failed: ${bdError.message}`;
      await order.save();

      return res.status(500).json({
        success: false,
        message: `Retry failed: ${bdError.message}`,
        code: "RETRY_FAILED",
        shippingError: order.shippingError,
      });
    }

    if (result.success) {
      order.awbNo = result.awbNo;
      order.trackingId = result.trackingId;
      order.shippingStatus = "In-Transit";
      order.status = "Shipped";
      order.bluedartGeneratedAt = new Date();
      order.shippingError = null;
      await order.save();

      console.log(`[AWB RETRY SUCCESS] Order ${orderId} - AWB ${result.awbNo}`);

      return res.json({
        success: true,
        message: "AWB generated successfully on retry",
        awbNo: result.awbNo,
        trackingId: result.trackingId,
        order: {
          orderId: order._id,
          status: order.status,
          shippingStatus: order.shippingStatus,
        },
      });
    }
  } catch (error) {
    console.error("[AWB RETRY EXCEPTION]", error.message);
    res.status(500).json({
      success: false,
      message: "Unexpected error during retry",
    });
  }
};

/**
 * ADMIN: Get shipping error details
 * GET /api/admin/shipment/:orderId/error
 */
exports.getShippingError = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).select(
      "shippingStatus shippingError status awbNo"
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.shippingError) {
      return res.json({
        success: true,
        message: "No shipping errors",
        shippingStatus: order.shippingStatus,
        awbNo: order.awbNo,
      });
    }

    res.json({
      success: true,
      orderId: order._id,
      shippingStatus: order.shippingStatus,
      shippingError: order.shippingError,
      status: order.status,
      awbNo: order.awbNo,
      canRetry: order.shippingStatus === "FAILED",
    });
  } catch (error) {
    console.error("Error in getShippingError:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch shipping error",
    });
  }
};

/**
 * ADMIN: Update shipping address before generating AWB
 * PUT /api/admin/shipment/:orderId/address
 */
exports.updateShippingAddress = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { address, city, postalCode, state, country } = req.body;

    if (!address || !city || !postalCode) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: address, city, postalCode",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Can't update if AWB already generated
    if (order.awbNo) {
      return res.status(400).json({
        success: false,
        message: "Cannot update address after AWB is generated",
        awbNo: order.awbNo,
      });
    }

    // Update address
    order.shippingAddress = {
      address,
      city,
      postalCode,
      state: state || "N/A",
      country: country || "IN",
    };

    await order.save();

    console.log(`[ADDRESS UPDATE] Order ${orderId} address updated by admin`);

    res.json({
      success: true,
      message: "Shipping address updated successfully",
      shippingAddress: order.shippingAddress,
    });
  } catch (error) {
    console.error("Error in updateShippingAddress:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update shipping address",
    });
  }
};
