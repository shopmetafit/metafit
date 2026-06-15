const mongoose = require('mongoose');
const ReferralAssignment = require('./models/ReferralAssignment');
const { protect, admin } = require('./middleware/authMiddleware');

mongoose.connect('mongodb+srv://shopmetafit:lXg32cAJNDoNXo6v@cluster0.8dqecof.mongodb.net/metafit?retryWrites=true&w=majority&appName=Cluster0');

async function test() {
  try {
    const operations = [
      {
        updateOne: {
          filter: { productId: new mongoose.Types.ObjectId(), vendorId: "invalid_id_string" },
          update: {
            $set: {
              shareCode: "MWREF-TEST-TEST",
              refCode: "REF-TEST-TEST",
              commissionType: "percentage",
              commissionValue: 10,
              isActive: true,
              assignmentStatus: "assigned"
            }
          },
          upsert: true
        }
      }
    ];
    const res = await ReferralAssignment.bulkWrite(operations, { ordered: false });
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}
test();
