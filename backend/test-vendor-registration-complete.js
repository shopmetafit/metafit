const axios = require("axios");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
require("dotenv").config();

const testVendorRegistration = async () => {
  try {
    await connectDB();
    console.log("✓ Connected to MongoDB");

    // Step 1: Find a user to test with (or create one)
    let user = await User.findOne({ role: "customer" });

    if (!user) {
      console.log("❌ No customer user found. Creating test user...");
      user = new User({
        name: "Test Vendor",
        email: "tevendor@example.com",
        phone: "9999999999",
        password: "testpass123",
        role: "customer",
      });
      await user.save();
      console.log("✓ Test user created");
    }

    console.log(`\nUsing user: ${user.name} (${user.email})`);

    // Step 2: Generate a mock JWT token
    const token = user.generateAuthToken ? user.generateAuthToken() : "mock-token";
    console.log(`Token generated: ${token.substring(0, 20)}...`);

    // Step 3: Prepare vendor registration data
    const vendorData = {
      companyName: "TestFit Equipment Co",
      businessDescription:
        "Premium fitness equipment supplier providing gym machines and accessories",
      gstNo: "27AABCD1234E1Z5",
      panNo: "AAAAA0000A",
      bankDetails: {
        accountName: "TestFit Equipment Co",
        accountNumber: "9876543210123456",
        bankName: "HDFC Bank",
        ifscCode: "HDFC0001234",
      },
      pickupAddress: {
        street: "123 Business Complex",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        country: "India",
      },
      contactPerson: {
        name: "Rajesh Kumar",
        phone: "9876543210",
        email: "contact@testfit.com",
      },
    };

    // Step 4: Send registration request
    const apiUrl =
      process.env.API_URL || "http://localhost:5000/api/vendors/register";

    console.log(`\n📤 Sending vendor registration request to: ${apiUrl}`);
    console.log(`Company: ${vendorData.companyName}`);
    console.log(`Contact: ${vendorData.contactPerson.name}`);

    const response = await axios.post(apiUrl, vendorData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("\n✓ Vendor registration successful!");
    console.log(`Status: ${response.status}`);
    console.log(`Message: ${response.data.message}`);
    console.log(`Vendor ID: ${response.data.vendor._id}`);

    console.log(`\n📧 Check the following emails:`);
    console.log(`  - Admin Email: cto.metafit@gmail.com (notification)`);
    console.log(`  - Vendor Email: ${vendorData.contactPerson.email}`);

    await mongoose.connection.close();
    console.log("\n✓ Test completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${error.response.data.message}`);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
};

testVendorRegistration();
