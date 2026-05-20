const mongoose = require("mongoose");

const referralAssignmentSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    assignedProductId: {
      type: String,
      required: true,
      trim: true,
    },
    shareCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    refCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: undefined,
    },
    commissionType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    commissionValue: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

referralAssignmentSchema.index(
  { productId: 1, vendorId: 1, assignedProductId: 1 },
  { unique: true }
);
referralAssignmentSchema.index({ shareCode: 1 }, { unique: true });
referralAssignmentSchema.index({ refCode: 1 }, { sparse: true });

module.exports = mongoose.model("ReferralAssignment", referralAssignmentSchema);
