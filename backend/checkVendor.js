require('dotenv').config({ path: '/home/shubham/copymetafit/metafit/backend/.env' });
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGO_URI || process.env.DB_URI);
  const db = mongoose.connection.db;
  const assignments = await db.collection('referralassignments').find({ 
    vendorId: new mongoose.Types.ObjectId("6a5dd4115c8af46b299def51"),
    productId: new mongoose.Types.ObjectId("6a5a07321f01590a685904e1")
  }).toArray();
  console.log("Assignments for vendor/product:");
  console.log(assignments);
  
  // also check if any assignment exists for just the product
  const prodAssignments = await db.collection('referralassignments').find({ 
    productId: new mongoose.Types.ObjectId("6a5a07321f01590a685904e1")
  }).toArray();
  console.log("Assignments for product:");
  console.log(prodAssignments.map(a => ({ vendorId: a.vendorId, shareCode: a.shareCode })));
  
  mongoose.disconnect();
}
check();
