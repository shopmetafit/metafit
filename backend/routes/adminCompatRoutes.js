const express = require("express");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/verify-admin-details", protect, admin, async (req, res) => {
  return res.json({
    success: true,
    message: "Admin token verified successfully",
    admin: req.user,
    user: req.user,
  });
});

module.exports = router;
