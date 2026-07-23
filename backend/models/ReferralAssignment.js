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
      default: null,
    },
    externalVendorId: {
      type: String,
      trim: true,
      default: "",
    },
    vendorSnapshot: {
      mentorId: {
        type: String,
        trim: true,
        default: "",
      },
      name: {
        type: String,
        trim: true,
        default: "",
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },
      phone: {
        type: String,
        trim: true,
        default: "",
      },
      role: {
        type: String,
        trim: true,
        default: "",
      },
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
      enum: ["percentage", "fixed", "flat"],
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
    assignmentStatus: {
      type: String,
      enum: ["assigned", "removed"],
      default: "assigned",
    },
    isAssignedToAll: {
      type: Boolean,
      default: false,
    },
    isAssignToAll: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "vendor_product_assignments"
  }
);
referralAssignmentSchema.index({
  vendorId: 1,
  assignmentStatus: 1,
});

referralAssignmentSchema.index({
  externalVendorId: 1,
  assignmentStatus: 1,
});

referralAssignmentSchema.index(
  { productId: 1, vendorId: 1, assignedProductId: 1 },
  { unique: true, partialFilterExpression: { vendorId: { $type: "objectId" } } }
);
referralAssignmentSchema.index(
  { productId: 1, externalVendorId: 1, assignedProductId: 1 },
  { unique: true, partialFilterExpression: { externalVendorId: { $type: "string", $ne: "" } } }
);
referralAssignmentSchema.index({ shareCode: 1 }, { unique: true });
referralAssignmentSchema.index({ refCode: 1 }, { sparse: true });

module.exports = mongoose.model("ReferralAssignment", referralAssignmentSchema);
