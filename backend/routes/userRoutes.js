const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { protect } = require("../middleware/authMiddleware");
const loginSchema = require("../validators/login-validator");
const registerSchema = require("../validators/auth-validator");
const validate = require("../middleware/validate-middleware");
const { OAuth2Client } = require("google-auth-library");

const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_OAUTH_KEY);

// =====================================================
// REGISTER
// POST /api/users/register
// Access: Public
// =====================================================

router.post(
  "/register",
  validate(registerSchema),
  async (req, res) => {
    const { name, email, password, phone } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({
          message: "User already exists",
        });
      }

      user = new User({
        name,
        email,
        password,
        phone,
      });

      await user.save();

      const payload = {
        user: {
          id: user._id,
          role: user.role,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        (err, token) => {
          if (err) throw err;

          res.status(201).json({
            user: {
              _id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              phone: user.phone || "",
            },
            token,
          });
        }
      );
    } catch (error) {
      console.error("Register error:", error);

      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);

// =====================================================
// LOGIN
// POST /api/users/login
// Access: Public
// =====================================================

router.post(
  "/login",
  validate(loginSchema),
  async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({
          message: "Invalid credentials",
        });
      }

      const isMatch = await user.matchPassword(password);

      if (!isMatch) {
        return res.status(400).json({
          message: "Invalid credentials",
        });
      }

      const payload = {
        user: {
          id: user._id,
          role: user.role,
        },
      };

      // Generate JWT
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        (err, token) => {
          if (err) throw err;

          res.json({
            user: {
              _id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              phone: user.phone || "",
            },
            token,
          });
        }
      );
    } catch (error) {
      console.error("Login error:", error);

      res.status(500).json({
        message: "server error",
      });
    }
  }
);

// =====================================================
// LOGIN WITH OTP
// POST /api/users/login-otp
// Access: Public
// =====================================================

router.post("/login-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required",
      });
    }

    const normalizedPhone =
      phone.replace(/\D/g, "").length === 10
        ? "91" + phone.replace(/\D/g, "")
        : phone.replace(/\D/g, "");

    const otpStore =
      require("../config/whatsappServices").otpStore;

    const otpData = otpStore.get(normalizedPhone);

    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    if (otpData.otp !== otp) {
      otpData.attempts += 1;

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    otpStore.delete(normalizedPhone);

    let user = await User.findOne({
      phone: phone,
    });

    if (!user) {
      user = await User.create({
        name: "Guest User",
        email: `${phone}@guest.metafit.com`,
        phone: phone,
        role: "customer",
      });
    }

    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      (err, token) => {
        if (err) throw err;

        res.json({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
          },
          token,
        });
      }
    );
  } catch (error) {
    console.error("OTP login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// =====================================================
// GET PROFILE
// GET /api/users/profile
// Access: Private
// =====================================================

router.get(
  "/profile",
  protect,
  async (req, res) => {
    res.json(req.user);
  }
);

// =====================================================
// UPDATE PROFILE
// PUT /api/users/profile
// Access: Private
// =====================================================

router.put(
  "/profile",
  protect,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const { name, email, phone } = req.body;

      // -----------------------------
      // Name
      // -----------------------------

      if (name !== undefined) {
        const trimmedName = String(name).trim();

        if (!trimmedName) {
          return res.status(400).json({
            message: "Name cannot be empty",
          });
        }

        user.name = trimmedName;
      }

      // -----------------------------
      // Phone
      // -----------------------------

      if (phone !== undefined) {
        user.phone = String(phone).trim();
      }

      // -----------------------------
      // Email
      // -----------------------------

      if (email !== undefined) {
        const trimmedEmail = String(email)
          .trim()
          .toLowerCase();

        if (
          !trimmedEmail ||
          !/^\S+@\S+\.\S+$/.test(trimmedEmail)
        ) {
          return res.status(400).json({
            message: "Please enter a valid email address",
          });
        }

        if (
          trimmedEmail !== user.email.toLowerCase()
        ) {
          const emailExists = await User.findOne({
            email: trimmedEmail,
          });

          if (
            emailExists &&
            emailExists._id.toString() !==
              user._id.toString()
          ) {
            return res.status(400).json({
              message:
                "Email is already in use by another account",
            });
          }

          user.email = trimmedEmail;
        }
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone || "",
        avatar: updatedUser.avatar || "",
        createdAt: updatedUser.createdAt,
      });
    } catch (error) {
      console.error(
        "Profile update error:",
        error
      );

      res.status(500).json({
        message: "Server error updating profile",
      });
    }
  }
);

// =====================================================
// GET WISHLIST
// GET /api/users/wishlist
// Access: Private
// =====================================================

router.get(
  "/wishlist",
  protect,
  async (req, res) => {
    try {
      const user = await User.findById(
        req.user._id
      ).populate("wishlist");

      res.json(user.wishlist);
    } catch (error) {
      console.error("Get wishlist error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// ADD TO WISHLIST
// POST /api/users/wishlist
// Access: Private
// =====================================================

router.post(
  "/wishlist",
  protect,
  async (req, res) => {
    try {
      const { productId } = req.body;

      const user = await User.findById(
        req.user._id
      );

      if (!user.wishlist.includes(productId)) {
        user.wishlist.push(productId);

        await user.save();
      }

      await user.populate("wishlist");

      res.json(user.wishlist);
    } catch (error) {
      console.error(
        "Add wishlist error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// REMOVE FROM WISHLIST
// DELETE /api/users/wishlist/:productId
// Access: Private
// =====================================================

router.delete(
  "/wishlist/:productId",
  protect,
  async (req, res) => {
    try {
      const { productId } = req.params;

      const user = await User.findById(
        req.user._id
      );

      user.wishlist = user.wishlist.filter(
        (id) => id.toString() !== productId
      );

      await user.save();

      await user.populate("wishlist");

      res.json(user.wishlist);
    } catch (error) {
      console.error(
        "Remove wishlist error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// GOOGLE LOGIN
// POST /api/users/google-login
// Access: Public
// =====================================================

router.post(
  "/google-login",
  async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          message: "No token provided",
        });
      }

      // Verify Google ID Token
      const ticket =
        await client.verifyIdToken({
          idToken: token,
          audience:
            process.env.GOOGLE_OAUTH_KEY,
        });

      const googlePayload =
        ticket.getPayload();

      const {
        email,
        name,
        picture,
      } = googlePayload;

      // Find existing user
      let user = await User.findOne({
        email,
      });

      // Create new user if not found
      if (!user) {
        user = await User.create({
          email,
          name,
          avatar: picture,
        });
      }

      // Generate application JWT
      const jwtPayload = {
        user: {
          id: user._id,
          role: user.role,
          avatar: user.avatar,
        },
      };

      jwt.sign(
        jwtPayload,
        process.env.JWT_SECRET,
        {
          expiresIn: "40h",
        },
        (err, token) => {
          if (err) throw err;

          res.status(200).json({
            user: {
              _id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              avatar: user.avatar,
            },
            token,
          });
        }
      );
    } catch (err) {
      console.error(
        "Google login error:",
        err
      );

      res.status(400).json({
        message: "Invalid Google Token",
      });
    }
  }
);

module.exports = router;