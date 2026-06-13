const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to DB");
    const product = await Product.findOne({ isPublished: true, productApprovalStatus: "approved" });
    if (!product) {
      console.log("No published approved product found");
      process.exit(1);
    }
    product.isAssignedToAll = true;
    await product.save();
    console.log("Set product " + product.name + " as globally assigned.");
    process.exit(0);
  });
