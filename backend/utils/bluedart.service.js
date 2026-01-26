const axios = require("axios");

const SANDBOX_URL = "https://apigateway-sandbox.bluedart.com/in/transportation";
const PRODUCTION_URL = "https://apigateway.bluedart.com/in/transportation";

// Use sandbox for demo
const BASE_URL = SANDBOX_URL;

class BlueDartService {
  constructor() {
    this.apiKey = process.env.BLUEDART_API_KEY;
    this.apiSecret = process.env.BLUEDART_API_SECRET;
    this.loginId = process.env.BLUEDART_LOGIN_ID;
    this.licenseKey = process.env.BLUEDART_LICENSE_KEY;
    this.customerCode = process.env.BLUEDART_CUSTOMER_CODE;
    this.originArea = process.env.BLUEDART_ORIGIN_AREA;
    this.jwtToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Step 1: Generate JWT Token
   * Token is valid for ~30-60 minutes
   */
  async generateJWTToken() {
    try {
      // Return cached token if valid
      if (this.jwtToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        console.log("Using cached JWT token");
        return this.jwtToken;
      }

      const response = await axios.get(`${BASE_URL}/token/v1/login`, {
        headers: {
          ClientID: this.apiKey,
          clientSecret: this.apiSecret,
          Accept: "application/json",
        },
      });

      this.jwtToken = response.data.JWTToken;
      // Set expiry to 45 minutes from now (assuming 60 min validity)
      this.tokenExpiry = Date.now() + 45 * 60 * 1000;

      console.log("JWT Token generated successfully");
      return this.jwtToken;
    } catch (error) {
      console.error("Error generating JWT token:", error.response?.data || error.message);
      throw new Error("Failed to generate JWT token from Blue Dart");
    }
  }

  /**
   * Step 2: Generate Waybill (AWB)
   * Creates shipment in Blue Dart system
   */
  async generateWayBill(orderData) {
    try {
      const token = await this.generateJWTToken();

      const waybillData = {
        Profile: {
          Key: this.licenseKey,
          PaymentType: "P", // Prepaid
          LoginID: this.loginId,
          CustomerCode: this.customerCode,
        },
        Shipper: {
          MailingName: "Wellness Bazaar",
          Street: process.env.SHIPPER_ADDRESS || "123 Business St",
          Area: this.originArea,
          City: process.env.SHIPPER_CITY || "Gurugram",
          State: process.env.SHIPPER_STATE || "HR",
          Country: "IN",
          PinCode: process.env.SHIPPER_PINCODE || "122002",
          PhoneNumber: process.env.SHIPPER_PHONE || "1234567890",
          EmailAddress: process.env.SHIPPER_EMAIL || "support@wellnessbazaar.com",
        },
        Consignee: {
          MailingName: orderData.consigneeName,
          Street: orderData.shippingAddress.address,
          Area: orderData.shippingAddress.area || "N/A",
          City: orderData.shippingAddress.city,
          State: orderData.shippingAddress.state,
          Country: orderData.shippingAddress.country || "IN",
          PinCode: orderData.shippingAddress.postalCode,
          PhoneNumber: orderData.consigneePhone,
          EmailAddress: orderData.consigneeEmail || "",
        },
        Shipment: {
          DimensionUnit: "cm",
          WeightUnit: "kg",
          ShipmentDetails: [
            {
              Pieces: "1",
              Length: orderData.length || "20",
              Width: orderData.width || "15",
              Height: orderData.height || "10",
              Weight: orderData.weight || "1",
            },
          ],
          ShipmentType: "P", // Parcel
          ShipmentWeight: orderData.weight || "1",
          ShipmentVolume: "0",
          DeclaredValue: orderData.totalPrice.toString(),
          DeclaredValueCurrency: "INR",
          PickupLocation: {
            Area: this.originArea,
            Door: "N",
          },
        },
        Services: [
          {
            Code: "D", // Domestic
          },
        ],
      };

      console.log("Sending waybill request to Blue Dart...");
      const response = await axios.post(
        `${BASE_URL}/waybill/v1/GenerateWayBill`,
        waybillData,
        {
          headers: {
            JWTToken: token,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.SuccessFlag === true || response.data.SuccessFlag === "Y") {
        const awbNo = response.data.WayBillNumber || response.data.AWBNo;
        console.log("Waybill generated successfully:", awbNo);
        return {
          success: true,
          awbNo,
          trackingId: awbNo,
          response: response.data,
        };
      } else {
        console.error("Blue Dart returned error:", response.data);
        throw new Error(response.data.ErrorMessage || "Failed to generate waybill");
      }
    } catch (error) {
      console.error("Error generating waybill:", error.response?.data || error.message);
      throw new Error(`Failed to generate waybill: ${error.message}`);
    }
  }

  /**
   * Step 3: Track Shipment
   * Get current tracking status
   */
  async trackShipment(awbNo) {
    try {
      const token = await this.generateJWTToken();

      const trackingData = {
        ShipmentTrackingRequest: {
          ShipmentIdentificationNumber: awbNo,
          LicenseKey: this.licenseKey,
          LoginID: this.loginId,
        },
      };

      const response = await axios.post(
        `${BASE_URL}/shipment/v1/TrackShipment`,
        trackingData,
        {
          headers: {
            JWTToken: token,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.SuccessFlag === true || response.data.SuccessFlag === "Y") {
        console.log("Tracking data retrieved:", awbNo);
        return {
          success: true,
          trackingData: response.data,
        };
      } else {
        throw new Error(response.data.ErrorMessage || "Failed to track shipment");
      }
    } catch (error) {
      console.error("Error tracking shipment:", error.response?.data || error.message);
      throw new Error(`Failed to track shipment: ${error.message}`);
    }
  }

  /**
   * Cancel Waybill
   * Optional: Cancel shipment if needed
   */
  async cancelWayBill(awbNo) {
    try {
      const token = await this.generateJWTToken();

      const cancelData = {
        WayBillNumber: awbNo,
        LicenseKey: this.licenseKey,
        LoginID: this.loginId,
      };

      const response = await axios.post(
        `${BASE_URL}/waybill/v1/CancelWayBill`,
        cancelData,
        {
          headers: {
            JWTToken: token,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.SuccessFlag === true || response.data.SuccessFlag === "Y") {
        console.log("Waybill cancelled:", awbNo);
        return { success: true };
      } else {
        throw new Error(response.data.ErrorMessage || "Failed to cancel waybill");
      }
    } catch (error) {
      console.error("Error cancelling waybill:", error.response?.data || error.message);
      throw new Error(`Failed to cancel waybill: ${error.message}`);
    }
  }
}

module.exports = new BlueDartService();
