const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      
    },
    password: { type: String, minLength: 6 },
    role: { type: String, enum: ["customer", "admin", "vendor"], default: "customer" },
    avatar: { type: String },
    googleId: { type: String },
    phone: { type: String },

    // Vendor-specific fields
    vendorName: { type: String }, // Shop/Brand name for vendors
    vendorDescription: { type: String }, // Vendor bio/description
    vendorLogo: { type: String }, // Vendor logo URL
    vendorBanner: { type: String }, // Vendor banner image
    isApproved: { type: Boolean, default: false }, // Admin approval status
    commissionRate: { type: Number, default: 10 }, // Commission percentage (default 10%)
    bankDetails: {
      _id: false,
      accountName: String,
      accountNumber: String,
      bankName: String,
      ifscCode: String,
    },
  },
  { timestamps: true },
);

//password hash middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match User entered password to Hash password

userSchema.methods.matchPassword = async function (enteredPassword) {
return await bcrypt.compare(enteredPassword, this.password);    
};

module.exports = mongoose.model("User",userSchema);

