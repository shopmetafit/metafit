const Ticket = require("../models/Ticket");
const Order = require("../models/Order");
const User = require("../models/User");
const {
  sendTicketCreatedCustomerEmail,
  sendTicketCreatedAdminAlert,
  sendTicketReplyCustomerEmail,
} = require("../utils/ticketEmail");

const VALID_CATEGORIES = [
  "Order & Delivery",
  "Payment Issues",
  "Return & Refund",
  "Damaged or Wrong Product",
  "Product Information",
  "Account Issues",
  "Other",
];

const VALID_STATUSES = [
  "Open",
  "In Progress",
  "Waiting for Customer",
  "Resolved",
  "Closed",
];

/**
 * Helper to generate secure unique ticket number
 */
const generateUniqueTicketNumber = async () => {
  const d = new Date();
  const dateStr =
    d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");

  let ticketNumber;
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    const randomStr = Math.floor(100000 + Math.random() * 900000).toString();
    ticketNumber = `MWB-TKT-${dateStr}-${randomStr}`;
    const found = await Ticket.findOne({ ticketNumber });
    if (!found) {
      exists = false;
    }
    attempts++;
  }

  return ticketNumber;
};

// =========================================================================
// CUSTOMER APIS
// =========================================================================

/**
 * @desc    Create a new support ticket
 * @route   POST /api/tickets
 * @access  Private (Customer)
 */
const createTicket = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { category, subject, description, orderId } = req.body;

    // 1. Validation
    if (!category || !VALID_CATEGORIES.includes(category.trim())) {
      return res.status(400).json({
        success: false,
        message: `Please select a valid category: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Subject is required (minimum 3 characters)",
      });
    }

    if (subject.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: "Subject cannot exceed 200 characters",
      });
    }

    if (
      !description ||
      typeof description !== "string" ||
      description.trim().length < 10
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a detailed description (minimum 10 characters)",
      });
    }

    if (description.trim().length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 5000 characters",
      });
    }

    // 2. Duplicate submission prevention (within 60 seconds)
    const recentDuplicate = await Ticket.findOne({
      user: userId,
      subject: subject.trim(),
      description: description.trim(),
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
    });

    if (recentDuplicate) {
      return res.status(409).json({
        success: false,
        message:
          "A ticket with this exact subject and description was just submitted. Please check your tickets.",
        ticket: recentDuplicate,
      });
    }

    // 3. Validate linked order if provided
    let linkedOrder = null;
    let orderNumber = "";

    if (orderId) {
      linkedOrder = await Order.findOne({
        _id: orderId,
        user: userId,
      });

      if (!linkedOrder) {
        return res.status(400).json({
          success: false,
          message:
            "The selected order could not be found or does not belong to your account",
        });
      }

      orderNumber = linkedOrder.orderNumber || String(linkedOrder._id);
    }

    // 4. Generate unique ticket number
    const ticketNumber = await generateUniqueTicketNumber();

    // Customer details snapshot
    const customerName = req.user.name || "Customer";
    const customerEmail = req.user.email || "";
    const customerPhone = req.user.phone || "";

    // Initial message subdocument
    const initialMessage = {
      sender: userId,
      senderRole: "customer",
      senderName: customerName,
      message: description.trim(),
      createdAt: new Date(),
    };

    const newTicket = new Ticket({
      ticketNumber,
      user: userId,
      customerName,
      customerEmail,
      customerPhone,
      order: linkedOrder ? linkedOrder._id : null,
      orderNumber,
      category: category.trim(),
      subject: subject.trim(),
      description: description.trim(),
      status: "Open",
      priority: "Medium",
      messages: [initialMessage],
      lastReplyAt: new Date(),
      lastRepliedBy: "customer",
    });

    await newTicket.save();

    // 5. Send asynchronous notifications (safe non-blocking)
    sendTicketCreatedCustomerEmail(newTicket);
    sendTicketCreatedAdminAlert(newTicket);

    return res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      ticket: newTicket,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating ticket",
      error: error.message,
    });
  }
};

/**
 * @desc    Get tickets for logged-in customer
 * @route   GET /api/tickets/my-tickets
 * @access  Private (Customer)
 */
const getMyTickets = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { user: userId };

    if (status && status !== "All") {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [tickets, totalCount] = await Promise.all([
      Ticket.find(query)
        .populate("order", "orderNumber totalPrice status orderItems createdAt")
        .sort({ lastReplyAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Ticket.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      tickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching your tickets",
      error: error.message,
    });
  }
};

/**
 * @desc    Get ticket by ID (Customer or Admin)
 * @route   GET /api/tickets/:id
 * @access  Private (Customer owns or Admin)
 */
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    const userRole = String(req.user.role || "").toLowerCase();
    const isAdmin = userRole === "admin";

    // Query by ObjectId or ticketNumber
    let query;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: id };
    } else {
      query = { ticketNumber: id };
    }

    const ticket = await Ticket.findOne(query)
      .populate("order", "orderNumber totalPrice status orderItems createdAt shippingAddress paymentMethod")
      .populate("user", "name email phone")
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    // Ownership check: If not admin, must be ticket owner
    const ticketUserId = ticket.user?._id
      ? ticket.user._id.toString()
      : (ticket.user ? ticket.user.toString() : "");

    if (!isAdmin && ticketUserId !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own tickets.",
      });
    }

    return res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Error fetching ticket details:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching ticket details",
      error: error.message,
    });
  }
};

/**
 * @desc    Add reply message to ticket
 * @route   POST /api/tickets/:id/reply
 * @access  Private (Customer or Admin)
 */
const addReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user._id || req.user.id;
    const userRole = String(req.user.role || "").toLowerCase();
    const isAdmin = userRole === "admin";

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Reply message cannot be empty",
      });
    }

    if (message.trim().length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Reply message cannot exceed 5000 characters",
      });
    }

    let query;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: id };
    } else {
      query = { ticketNumber: id };
    }

    const ticket = await Ticket.findOne(query);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    // Ownership verification for non-admin
    if (!isAdmin && ticket.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only reply to your own tickets.",
      });
    }

    // Check if ticket is closed
    if (ticket.status === "Closed") {
      return res.status(400).json({
        success: false,
        message:
          "This ticket has been closed. Please open a new ticket if you need further assistance.",
      });
    }

    const senderRole = isAdmin ? "admin" : "customer";
    const senderName = req.user.name || (isAdmin ? "Support Agent" : "Customer");

    const replySubdoc = {
      sender: userId,
      senderRole,
      senderName,
      message: message.trim(),
      createdAt: new Date(),
    };

    ticket.messages.push(replySubdoc);
    ticket.lastReplyAt = new Date();
    ticket.lastRepliedBy = senderRole;

    // Status transitions
    if (!isAdmin) {
      // If customer replies, change status to In Progress (if it was Waiting for Customer or Resolved)
      if (
        ticket.status === "Waiting for Customer" ||
        ticket.status === "Resolved"
      ) {
        ticket.status = "In Progress";
        ticket.resolvedAt = null;
      }
    } else {
      // If admin replies, change status to Waiting for Customer unless resolved
      if (ticket.status === "Open" || ticket.status === "In Progress") {
        ticket.status = "Waiting for Customer";
      }
    }

    await ticket.save();

    // Asynchronous email notifications
    if (isAdmin) {
      sendTicketReplyCustomerEmail(ticket, message.trim());
    }

    return res.status(200).json({
      success: true,
      message: "Reply sent successfully",
      ticket,
    });
  } catch (error) {
    console.error("Error adding reply to ticket:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while sending reply",
      error: error.message,
    });
  }
};

/**
 * @desc    Customer closes their own ticket
 * @route   PATCH /api/tickets/:id/close
 * @access  Private (Customer)
 */
const closeCustomerTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    let query;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: id };
    } else {
      query = { ticketNumber: id };
    }

    const ticket = await Ticket.findOne(query);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    if (ticket.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only close your own tickets.",
      });
    }

    ticket.status = "Closed";
    ticket.closedAt = new Date();
    ticket.closedBy = userId;
    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Ticket marked as closed",
      ticket,
    });
  } catch (error) {
    console.error("Error closing customer ticket:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while closing ticket",
      error: error.message,
    });
  }
};

// =========================================================================
// ADMIN APIS
// =========================================================================

/**
 * @desc    Get all tickets with filters, search, and pagination
 * @route   GET /api/admin/tickets
 * @access  Private (Admin)
 */
const adminGetAllTickets = async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = "lastReplyAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    if (status && status !== "All") {
      query.status = status;
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (priority && priority !== "All") {
      query.priority = priority;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { ticketNumber: searchRegex },
        { subject: searchRegex },
        { customerName: searchRegex },
        { customerEmail: searchRegex },
        { orderNumber: searchRegex },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const sortOption = {};
    sortOption[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [tickets, totalCount] = await Promise.all([
      Ticket.find(query)
        .populate("order", "orderNumber totalPrice status createdAt")
        .populate("user", "name email phone")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Ticket.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      tickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching admin tickets:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching tickets for admin",
      error: error.message,
    });
  }
};

/**
 * @desc    Get ticket stats for admin dashboard
 * @route   GET /api/admin/tickets/stats
 * @access  Private (Admin)
 */
const adminGetTicketStats = async (req, res) => {
  try {
    const [total, open, inProgress, waitingForCustomer, resolved, closed] =
      await Promise.all([
        Ticket.countDocuments(),
        Ticket.countDocuments({ status: "Open" }),
        Ticket.countDocuments({ status: "In Progress" }),
        Ticket.countDocuments({ status: "Waiting for Customer" }),
        Ticket.countDocuments({ status: "Resolved" }),
        Ticket.countDocuments({ status: "Closed" }),
      ]);

    return res.status(200).json({
      success: true,
      stats: {
        total,
        open,
        inProgress,
        waitingForCustomer,
        resolved,
        closed,
      },
    });
  } catch (error) {
    console.error("Error fetching ticket stats:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching ticket stats",
      error: error.message,
    });
  }
};

/**
 * @desc    Update ticket status, priority, or details
 * @route   PATCH /api/admin/tickets/:id/status
 * @access  Private (Admin)
 */
const adminUpdateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, note } = req.body;
    const adminId = req.user._id || req.user.id;

    let query;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: id };
    } else {
      query = { ticketNumber: id };
    }

    const ticket = await Ticket.findOne(query);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Permitted statuses: ${VALID_STATUSES.join(", ")}`,
        });
      }

      ticket.status = status;

      if (status === "Resolved") {
        ticket.resolvedAt = new Date();
      } else if (status === "Closed") {
        ticket.closedAt = new Date();
        ticket.closedBy = adminId;
      } else {
        ticket.resolvedAt = null;
        ticket.closedAt = null;
        ticket.closedBy = null;
      }
    }

    if (priority && ["Low", "Medium", "High", "Urgent"].includes(priority)) {
      ticket.priority = priority;
    }

    // Optional admin internal note or status announcement message
    if (note && typeof note === "string" && note.trim().length > 0) {
      ticket.messages.push({
        sender: adminId,
        senderRole: "admin",
        senderName: req.user.name || "Support Team",
        message: `[Status Update: ${ticket.status}] ${note.trim()}`,
        createdAt: new Date(),
      });
      ticket.lastReplyAt = new Date();
      ticket.lastRepliedBy = "admin";
    }

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: `Ticket status updated to ${ticket.status}`,
      ticket,
    });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating ticket status",
      error: error.message,
    });
  }
};

/**
 * @desc    Admin permanently deletes a ticket (spam, fake, test, inappropriate)
 * @route   DELETE /api/admin/tickets/:id
 * @access  Private (Admin)
 */
const adminDeleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    let query;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: id };
    } else {
      query = { ticketNumber: id };
    }

    const ticket = await Ticket.findOneAndDelete(query);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found or already deleted",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Ticket #${ticket.ticketNumber} deleted permanently`,
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
    });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting ticket",
      error: error.message,
    });
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getTicketById,
  addReply,
  closeCustomerTicket,
  adminGetAllTickets,
  adminGetTicketStats,
  adminUpdateTicketStatus,
  adminDeleteTicket,
};
