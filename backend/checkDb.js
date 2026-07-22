require('dotenv').config({ path: '/home/shubham/copymetafit/metafit/backend/.env' });
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGO_URI || process.env.DB_URI);
  const db = mongoose.connection.db;
  const assignments = await db.collection('referralassignments').find({ shareCode: 'MWREF-9DEF51-5904E1' }).toArray();
  console.log("Assignments with MWREF-9DEF51-5904E1:");
  console.log(assignments);
  
  const allAssignments = await db.collection('referralassignments').find().toArray();
  console.log("All assignments shareCodes:");
  console.log(allAssignments.map(a => ({ id: a._id, shareCode: a.shareCode, productId: a.productId })));
  
  mongoose.disconnect();
}
check();
