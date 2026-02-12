const mongoose = require("mongoose");
const Vendor = require("./models/Vendor");
const User = require("./models/User");
const connectDB = require("./config/db");
require("dotenv").config();

const testVendorApprovalEmail = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("✓ Connected to MongoDB");

    // Find first pending vendor
    const vendor = await Vendor.findOne({ status: "pending" }).populate(
      "userId"
    );

    if (!vendor) {
      console.log("❌ No pending vendors found. Please register a vendor first.");
      process.exit(1);
    }

    console.log(`\n📧 Testing vendor approval email...`);
    console.log(`Vendor: ${vendor.companyName}`);
    console.log(`Email: ${vendor.userId.email}`);
    console.log(`Name: ${vendor.userId.name}`);

    // Approve the vendor
    const { sellerTransporter } = require("./utils/email");
    const { generateVendorApprovalEmail } = require("./utils/emailTemplate");

    vendor.isApproved = true;
    vendor.status = "approved";
    vendor.approvedAt = new Date();
    await vendor.save();

    const user = await User.findByIdAndUpdate(vendor.userId, {
      role: "vendor",
      isApproved: true,
    });

    const emailHtml = generateVendorApprovalEmail(
      user.name || user.firstName,
      vendor.companyName
    );

    const mailOptions = {
      from: process.env.SELLER_EMAIL,
      to: user.email,
      subject: "🎉 Vendor Account Approved - MetaFit",
      html: emailHtml,
    };

    console.log(`\n📤 Sending email from: ${process.env.SELLER_EMAIL}`);
    const result = await sellerTransporter.sendMail(mailOptions);

    console.log(`\n✓ Email sent successfully!`);
    console.log(`Response ID: ${result.response}`);
    console.log(`\nVendor Status: ${vendor.status}`);
    console.log(`Vendor Approved: ${vendor.isApproved}`);

    await mongoose.connection.close();
    console.log("\n✓ Test completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:");
    console.error(error.message);
    if (error.response) {
      console.error("SMTP Response:", error.response);
    }
    process.exit(1);
  }
};

testVendorApprovalEmail();
