const mongoose = require('mongoose');
require('dotenv').config();
const ReferralAssignment = require('./models/ReferralAssignment');
const Product = require('./models/Product');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to DB");
    
    // Pick the vendor with 51 assignments
    const vendorId = "5f5fb4dd-2e87-4e83-bf18-67522670d17d";
    const assignments = await ReferralAssignment.find({ externalVendorId: vendorId });
    
    console.log("Found assignments:", assignments.length);
    
    const productIds = assignments.map(a => a.productId);
    const uniqueIds = [...new Set(productIds.map(String))];
    
    const products = await Product.find({ _id: { $in: uniqueIds } });
    console.log("Found products in DB for these assignments:", products.length);
    
    // Check if any product is published or not
    const publishedProducts = products.filter(p => p.isPublished);
    console.log("Published products:", publishedProducts.length);
    
    process.exit(0);
  });
