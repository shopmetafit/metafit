const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    gstNo: {
      type: String,
      required: false,
      sparse: true,
      uppercase: true,
    },
    panNo: {
      type: String,
      required: false,
      sparse: true,
      uppercase: true,
    },
    businessDescription: {
      type: String,
    },
    // Bank Details
    bankDetails: {
      _id: false,
      accountName: {
        type: String,
        required: true,
      },
      accountNumber: {
        type: String,
        required: true,
      },
      bankName: {
        type: String,
        required: true,
      },
      ifscCode: {
        type: String,
        required: true,
      },
    },
    // Pickup/Warehouse Address
    pickupAddress: {
      _id: false,
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: "India",
      },
    },
    // Contact Details
    contactPerson: {
      _id: false,
      name: String,
      phone: String,
      email: String,
    },
    // Approval Status
    isApproved: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    // Commission & Settings
    commissionRate: {
      type: Number,
      default: 10, // 10% default
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);
