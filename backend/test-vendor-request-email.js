const mongoose = require("mongoose");
const connectDB = require("./config/db");
require("dotenv").config();

const { sellerTransporter } = require("./utils/email");
const { generateAdminVendorRequestEmail } = require("./utils/emailTemplate");

const testAdminNotificationEmail = async () => {
  try {
    await connectDB();
    console.log("✓ Connected to MongoDB");

    // Sample vendor data
    const vendorName = "John Doe";
    const companyName = "Fitness Pro Gym";
    const email = "vendor@example.com";
    const phone = "9876543210";
    const businessDescription =
      "We provide premium gym equipment and fitness accessories";
    const city = "Mumbai";
    const state = "Maharashtra";

    console.log(`\n📧 Testing admin notification email...`);
    console.log(`Vendor: ${companyName}`);
    console.log(`Contact: ${vendorName}`);
    console.log(`Email: ${email}`);

    const emailHtml = generateAdminVendorRequestEmail(
      vendorName,
      companyName,
      email,
      phone,
      businessDescription,
      city,
      state
    );

    const mailOptions = {
      from: process.env.SELLER_EMAIL,
      to: process.env.ADMIN_EMAIL || "cto.metafit@gmail.com",
      subject: "📋 New Vendor Registration Request - MetaFit",
      html: emailHtml,
    };

    console.log(
      `\n📤 Sending admin notification email from: ${process.env.SELLER_EMAIL}`
    );
    console.log(`📬 To: ${mailOptions.to}`);

    const result = await sellerTransporter.sendMail(mailOptions);

    console.log(`\n✓ Admin notification email sent successfully!`);
    console.log(`Response ID: ${result.response}`);

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

testAdminNotificationEmail();
