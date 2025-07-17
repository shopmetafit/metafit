const express = require("express");
const User = require("../models/User");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// @route GET / api/admin/users
// @desc Get all users(admin only)
//@access Private/Admin

router.get("/", protect, admin, async (req, res) => {
  try {
    const user = await User.find({});
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST / api/admin/users
// @desc add a new user(admin only)
//@access Private/Admin

router.post("/", protect, admin, async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      res.status(400).json({ message: " User already exists" });
    }
    user = new User({
      name,
      email,
      password,
      role: role || "customer",
    });
    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error", error);
  }
});

// @route Put / api/admin/orders/:id
// @desc update user info(admin only) like - name, email and role
//@access Private/Admin

router.put("/:id", protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
    }
    const updateUser = await user.save();
    res.json({ message: " User updated successfully", user: updateUser });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error", error);
  }
});

// @route DELETe / api/admin/users/:id
// @desc delete a user
//@access Private/Admin

router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await user.deleteOne();
      res.json({ message: " User deleted successfully" });
      res.status(404).json({ message: " User not found" });
    } else {
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error", error);
  }
});

module.exports = router;
