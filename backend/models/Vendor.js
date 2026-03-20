const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema({
  businessName: String,
  vendorName: String,
  email: String,
  phone: {
    type: String,
    unique: true,
    required: true
  },
  password: String,

  bankAccountNumber: String,
  ifscCode: String,
  accountHolderName: String,

  state: String,
  city: String,
  pincode: String,

  // 🔥 IMPORTANT
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  // Approval tracking
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Vendor", vendorSchema);
