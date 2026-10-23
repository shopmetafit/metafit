const mongoose = require("mongoose");

const pickupAddressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    pincode: { type: String, trim: true, default: "" },
    contactPerson: { type: String, trim: true, default: "" },
    contactPhone: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

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
  pickupAddress: {
    type: pickupAddressSchema,
    default: null,
  },
  platformCommission: { type: Number, default: 10 },

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
  termsAcceptedAt: Date,
  actionMailSentAt: Date,
  signatureProofUrl: String,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Vendor", vendorSchema);
