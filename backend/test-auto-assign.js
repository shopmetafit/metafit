const mongoose = require('mongoose');
require('dotenv').config();
const Vendor = require('./models/Vendor');
const jwt = require('jsonwebtoken');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to DB");
    const vendor = await Vendor.findOne({ status: "approved" });
    if (!vendor) {
      console.log("No approved vendor found");
      process.exit(1);
    }
    console.log("Found vendor:", vendor.vendorName, vendor.email);
    const token = jwt.sign(
      { vendorId: vendor._id, email: vendor.email, vendorName: vendor.vendorName },
      process.env.JWT_SECRET || "your-secret-key"
    );
    console.log("Token:", token);
    process.exit(0);
  });
