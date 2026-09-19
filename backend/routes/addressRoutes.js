const express = require("express");
const Address = require("../models/Address");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Helper to validate phone and pincode
const validateAddressInputs = (data) => {
  const { fullName, phone, house, area, city, state, pincode, country } = data;

  if (!fullName || !String(fullName).trim()) return "Full name is required";
  if (!phone || !String(phone).trim()) return "Phone number is required";
  if (!house || !String(house).trim()) return "House / Building details are required";
  if (!area || !String(area).trim()) return "Area / Street details are required";
  if (!city || !String(city).trim()) return "City is required";
  if (!state || !String(state).trim()) return "State is required";
  if (!pincode || !String(pincode).trim()) return "Pincode is required";

  const cleanPhone = String(phone).replace(/\D/g, "");
  if (cleanPhone.length < 10 || cleanPhone.length > 12) {
    return "Please enter a valid 10-digit phone number";
  }

  const cleanCountry = String(country || "India").trim().toLowerCase();
  if (cleanCountry === "india" || cleanCountry === "in") {
    const cleanPin = String(pincode).trim().replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      return "Please enter a valid 6-digit Indian PIN code";
    }
  }

  return null;
};

// @route GET /api/addresses
// @desc Get logged-in user's saved addresses
// @access Private
router.get("/", protect, async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    res.json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ message: "Server error fetching addresses" });
  }
});

// @route POST /api/addresses
// @desc Add a new address
// @access Private
router.post("/", protect, async (req, res) => {
  try {
    const errorMsg = validateAddressInputs(req.body);
    if (errorMsg) {
      return res.status(400).json({ message: errorMsg });
    }

    const {
      addressType,
      fullName,
      phone,
      house,
      area,
      landmark,
      city,
      district,
      state,
      pincode,
      country,
      isDefault,
    } = req.body;

    const existingCount = await Address.countDocuments({ user: req.user._id });
    const shouldBeDefault = Boolean(isDefault) || existingCount === 0;

    if (shouldBeDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const address = new Address({
      user: req.user._id,
      addressType: addressType || "Home",
      fullName: String(fullName).trim(),
      phone: String(phone).trim(),
      house: String(house).trim(),
      area: String(area).trim(),
      landmark: String(landmark || "").trim(),
      city: String(city).trim(),
      district: String(district || "").trim(),
      state: String(state).trim(),
      pincode: String(pincode).trim(),
      country: String(country || "India").trim(),
      isDefault: shouldBeDefault,
    });

    await address.save();
    res.status(201).json(address);
  } catch (error) {
    console.error("Error creating address:", error);
    res.status(500).json({ message: "Server error creating address" });
  }
});

// @route PUT /api/addresses/:id
// @desc Edit an existing address
// @access Private
router.put("/:id", protect, async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    if (address.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to modify this address" });
    }

    const errorMsg = validateAddressInputs(req.body);
    if (errorMsg) {
      return res.status(400).json({ message: errorMsg });
    }

    const {
      addressType,
      fullName,
      phone,
      house,
      area,
      landmark,
      city,
      district,
      state,
      pincode,
      country,
      isDefault,
    } = req.body;

    if (isDefault && !address.isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
      address.isDefault = true;
    }

    address.addressType = addressType || address.addressType;
    address.fullName = String(fullName).trim();
    address.phone = String(phone).trim();
    address.house = String(house).trim();
    address.area = String(area).trim();
    address.landmark = String(landmark || "").trim();
    address.city = String(city).trim();
    address.district = String(district || "").trim();
    address.state = String(state).trim();
    address.pincode = String(pincode).trim();
    address.country = String(country || "India").trim();

    await address.save();
    res.json(address);
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Server error updating address" });
  }
});

// @route PATCH /api/addresses/:id/default
// @desc Set an address as default
// @access Private
router.patch("/:id/default", protect, async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    if (address.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to modify this address" });
    }

    // Unset all previous default addresses for this user
    await Address.updateMany({ user: req.user._id }, { isDefault: false });

    address.isDefault = true;
    await address.save();

    res.json(address);
  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({ message: "Server error setting default address" });
  }
});

// @route DELETE /api/addresses/:id
// @desc Delete an address
// @access Private
router.delete("/:id", protect, async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    if (address.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this address" });
    }

    const wasDefault = address.isDefault;
    await Address.findByIdAndDelete(req.params.id);

    // If the deleted address was default, promote another address to default if exists
    if (wasDefault) {
      const remainingAddress = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      if (remainingAddress) {
        remainingAddress.isDefault = true;
        await remainingAddress.save();
      }
    }

    res.json({ message: "Address deleted successfully", id: req.params.id });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Server error deleting address" });
  }
});

module.exports = router;
