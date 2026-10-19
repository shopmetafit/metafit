const express = require("express");
const router = express.Router();
const {
  adminGetAllTickets,
  adminGetTicketStats,
  getTicketById,
  addReply,
  adminUpdateTicketStatus,
  adminDeleteTicket,
} = require("../controllers/ticketController");
const { protect, admin } = require("../middleware/authMiddleware");

// Admin routes (all require protect + admin check)
router.get("/", protect, admin, adminGetAllTickets);
router.get("/stats", protect, admin, adminGetTicketStats);
router.get("/:id", protect, admin, getTicketById);
router.post("/:id/reply", protect, admin, addReply);
router.patch("/:id/status", protect, admin, adminUpdateTicketStatus);
router.delete("/:id", protect, admin, adminDeleteTicket);

module.exports = router;
