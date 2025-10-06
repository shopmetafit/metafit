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
    role: { type: String, enum: ["customer", "admin","owner"], default: "customer" },
    avatar: { type: String }, // ✅ added for Google picture
    googleId: { type: String }, // ✅ store Google ID if needed later
  },
  { timestamps: true }
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

