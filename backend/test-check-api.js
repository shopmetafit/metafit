const mongoose = require('mongoose');
require('dotenv').config();
const { fetchProductsByIds } = require('./utils/productDataAccess');
const ReferralAssignment = require('./models/ReferralAssignment');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const vendorId = "5f5fb4dd-2e87-4e83-bf18-67522670d17d";
    const assignments = await ReferralAssignment.find({ externalVendorId: vendorId });
    
    const productMap = await fetchProductsByIds(assignments.map((a) => a.productId));
    const assignedProducts = assignments.map((assignment) => {
      return {
        product: productMap.get(String(assignment.productId))
      };
    }).filter((item) => item.product && typeof item.product === "object");
    
    console.log("Assigned products count:", assignedProducts.length);
    process.exit(0);
  });
