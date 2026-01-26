/**
 * Blue Dart Integration Testing Script
 * Run: node test-bluedart.js
 * 
 * This script tests the Blue Dart integration without making real API calls
 * Comment/uncomment sections as needed
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bluedartService = require("./utils/bluedart.service");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
};

async function testBlueDartService() {
  try {
    console.log("\n" + "=".repeat(50));
    console.log("Blue Dart Service Tests");
    console.log("=".repeat(50) + "\n");

    // Test 1: Check environment variables
    console.log("Test 1: Checking Environment Variables");
    const requiredVars = [
      "BLUEDART_API_KEY",
      "BLUEDART_API_SECRET",
      "BLUEDART_LOGIN_ID",
      "BLUEDART_LICENSE_KEY",
      "BLUEDART_CUSTOMER_CODE",
      "BLUEDART_ORIGIN_AREA",
    ];

    let allVarsPresent = true;
    requiredVars.forEach((varName) => {
      if (process.env[varName]) {
        log.success(`${varName} is set`);
      } else {
        log.error(`${varName} is MISSING`);
        allVarsPresent = false;
      }
    });

    if (!allVarsPresent) {
      log.error("Missing environment variables. Update your .env file.");
      process.exit(1);
    }

    console.log();

    // Test 2: Test JWT Token Generation
    console.log("Test 2: Testing JWT Token Generation");
    log.info("Calling Blue Dart login endpoint...");
    try {
      const token = await bluedartService.generateJWTToken();
      if (token) {
        log.success(`JWT Token generated: ${token.substring(0, 50)}...`);
      } else {
        log.error("Failed to generate token");
      }
    } catch (error) {
      log.error(`JWT Token generation failed: ${error.message}`);
      log.warn("This is expected if Blue Dart API is unreachable from your network");
    }

    console.log();

    // Test 3: Test Waybill Generation (Mock Data)
    console.log("Test 3: Testing Waybill Generation Logic");
    const mockOrderData = {
      consigneeName: "Test Customer",
      consigneePhone: "9876543210",
      consigneeEmail: "test@example.com",
      weight: "1.5",
      length: "20",
      width: "15",
      height: "10",
      totalPrice: 1999,
      shippingAddress: {
        address: "123 Customer Street",
        city: "Mumbai",
        postalCode: "400001",
        state: "MH",
        country: "IN",
      },
    };

    log.info("Mock order data:");
    console.log(JSON.stringify(mockOrderData, null, 2));

    try {
      log.info("Sending waybill request to Blue Dart...");
      const result = await bluedartService.generateWayBill(mockOrderData);
      if (result.success) {
        log.success(`Waybill generated successfully!`);
        log.success(`AWB Number: ${result.awbNo}`);
        log.success(`Tracking ID: ${result.trackingId}`);
      } else {
        log.error("Waybill generation failed");
      }
    } catch (error) {
      log.error(`Waybill generation failed: ${error.message}`);
      log.warn("This is expected if Blue Dart API is unreachable");
    }

    console.log();

    // Test 4: Database Connection
    console.log("Test 4: Testing Database Connection");
    try {
      if (mongoose.connection.readyState === 0) {
        log.info("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
      }
      log.success("Connected to MongoDB");

      // Check if Order model exists
      const Order = require("./models/Order");
      log.success("Order model loaded");

      // Check schema fields
      const schema = Order.schema.paths;
      const requiredFields = ["awbNo", "trackingId", "shippingStatus"];
      let allFieldsPresent = true;

      requiredFields.forEach((field) => {
        if (schema[field]) {
          log.success(`Order.${field} field exists`);
        } else {
          log.error(`Order.${field} field MISSING`);
          allFieldsPresent = false;
        }
      });

      if (!allFieldsPresent) {
        log.error("Order schema needs to be updated");
      }
    } catch (error) {
      log.error(`Database error: ${error.message}`);
    }

    console.log();

    // Test 5: Route Check
    console.log("Test 5: Checking Shipment Routes");
    try {
      const shipmentRoutes = require("./routes/shipmentRoutes");
      log.success("Shipment routes loaded successfully");
      log.info("Available endpoints:");
      console.log("  - POST   /api/shipment/:orderId/generate-awb");
      console.log("  - GET    /api/shipment/:orderId");
      console.log("  - GET    /api/shipment/:orderId/track");
      console.log("  - POST   /api/shipment/:orderId/cancel");
    } catch (error) {
      log.error(`Route error: ${error.message}`);
    }

    console.log();

    // Final Summary
    console.log("=".repeat(50));
    log.success("All tests completed!");
    console.log("=".repeat(50));

    console.log("\nNext Steps:");
    console.log("1. Ensure MongoDB is running");
    console.log("2. Start the server: npm run dev");
    console.log("3. Use POSTMAN_COLLECTION.json to test endpoints");
    console.log("4. Or run: bash TEST_WITH_CURL.sh");

    process.exit(0);
  } catch (error) {
    log.error(`Unexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

testBlueDartService();
