const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const Vendor = require('./models/Vendor');
const jwt = require('jsonwebtoken');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const vendorId = "5f5fb4dd-2e87-4e83-bf18-67522670d17d";
    
    // We don't have this vendor in Vendor collection, we'll fake a token
    const token = jwt.sign(
      { mentorId: vendorId, email: "test@test.com" },
      process.env.JWT_SECRET
    );
    
    try {
      const res = await axios.get("http://localhost:9000/api/vendor/assigned-products?vendorId=" + vendorId, {
        headers: { Authorization: "Bearer " + token }
      });
      console.log("API returned items:", res.data.length);
    } catch (e) {
      console.error(e.response ? e.response.data : e.message);
    }
    process.exit(0);
  });
