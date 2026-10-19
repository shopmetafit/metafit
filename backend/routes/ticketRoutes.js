const express = require("express");
const router = express.Router();
const {
  createTicket,
  getMyTickets,
  getTicketById,
  addReply,
  closeCustomerTicket,
} = require("../controllers/ticketController");
const { protect } = require("../middleware/authMiddleware");

// Customer routes (all require authentication)
router.post("/", protect, createTicket);
router.get("/my-tickets", protect, getMyTickets);
router.get("/:id", protect, getTicketById);
router.post("/:id/reply", protect, addReply);
router.patch("/:id/close", protect, closeCustomerTicket);

module.exports = router;
