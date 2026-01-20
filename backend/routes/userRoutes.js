const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const {protect} = require("../middleware/authMiddleware");
const loginSchema = require("../validators/login-validator");
const registerSchema = require("../validators/auth-validator");
const validate = require("../middleware/validate-middleware");
const { OAuth2Client } = require("google-auth-library");
const router = express.Router();


const client = new OAuth2Client(process.env.GOOGLE_OAUTH_KEY);

// @route POST /api/users/register
// @desc Register a new user
// access Public
router.post("/register",validate(registerSchema), async (req, res) => {
  const { name, email, password , phone} = req.body;
  console.log(req.body);
  try {
    // Registration logic
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });
    user = new User({ name, email, password , phone });
    await user.save();
    // res.status(201).json({
    //     user:{
    //         _id: user._id,
    //         name:user.name,
    //         email:user.email,
    //         role:user.role,
    //     },
    // });

    // create JWT Payload
    const payload = { user: { id: user._id, role: user.role } };
    // console.log("wece",payload);

    // sign and return the token along with user data
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      (err, token) => {
        if (err) throw err;
        // send the user and token in response
        res.status(201).json({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
        });
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

// @route POST /api/users/login
// @desc Authenticate user
// @access Public

router.post("/login",validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const isMatch = await user.matchPassword(password);
    // console.log(isMatch);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const payload = { user: { id: user._id, role: user.role } };
    // console.log("wece",payload);

    // sign and return the token along with user data
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      (err, token) => {
        if (err) throw err;
        // send the user and token in response
        res.json({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
        });
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send("server error");
  }
});

// @route GET /api/users/profile
// @desc get logged-in user's profile(protected  Route)
// @access Private

router.get("/profile", protect ,  async (req, res) => {
  res.json(req.user);
});



// @route GET /api/users/google-login
// @desc for google login
// @access Private
router.post("/google-login", async (req, res) => {
  try {
    const { token } = req.body; // from frontend
    if (!token) return res.status(400).json({ message: "No token provided" });

    // ✅ Verify ID Token from Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_OAUTH_KEY,
    });

    // console.log("userRou135", ticket);
    console.log(ticket)
    const payload = ticket.getPayload(); // contains user info
    console.log(payload)
    const { email, name, picture } = payload;

    // console.log(`useRou142${email}  nam${name} picture${picture} `);
    // ✅ Check if user exists in DB, else create new one
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, name, avatar: picture });
    }

    // Generate your own JWT for session
    const payloads = { user: { id: user._id, role: user.role , avatar:user.avatar} };
    // console.log("wece",payload);

    // sign and return the token along with user data
    jwt.sign(
      payloads,
      process.env.JWT_SECRET,
      { expiresIn: "40h" },
      (err, token) => {
        if (err) throw err;
        // send the user and token in response
        res.status(200).json({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar:user.avatar
          },
          token,
        });
        // console.log("usro171",user)
        // console.log("usro172",token)
      }
    );
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Invalid Google Token" });
  }
});
module.exports = router;
