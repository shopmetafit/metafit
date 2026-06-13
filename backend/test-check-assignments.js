const mongoose = require('mongoose');
require('dotenv').config();
const ReferralAssignment = require('./models/ReferralAssignment');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to DB");
    
    // Group by externalVendorId and count
    const stats = await ReferralAssignment.aggregate([
      {
        $group: {
          _id: "$externalVendorId",
          count: { $sum: 1 },
          activeCount: { $sum: { $cond: ["$isActive", 1, 0] } },
          assignedCount: { $sum: { $cond: [{ $eq: ["$assignmentStatus", "assigned"] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    console.log("Assignment Stats by Vendor:", stats);
    process.exit(0);
  });
