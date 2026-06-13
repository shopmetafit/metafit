const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const products = await Product.find({ isAssignedToAll: true, isPublished: true, productApprovalStatus: "approved" });
    console.log("Global products count:", products.length);
    process.exit(0);
  });
