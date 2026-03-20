const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testVendorApproval() {
  console.log('🧪 Testing Vendor Approval System...\n');

  try {
    // 1. Test getting pending vendors
    console.log('1. Testing get pending vendors...');
    const pendingResponse = await axios.get(`${API_BASE}/vendor/pending-vendors`);
    console.log('✅ Pending vendors:', pendingResponse.data.vendors.length);
    
    // 2. Test getting all vendors
    console.log('\n2. Testing get all vendors...');
    const allResponse = await axios.get(`${API_BASE}/vendor/all-vendors`);
    console.log('✅ All vendors:', allResponse.data.vendors.length);
    
    // 3. Test approving a vendor (if there are any pending)
    if (pendingResponse.data.vendors.length > 0) {
      const vendor = pendingResponse.data.vendors[0];
      console.log(`\n3. Testing approve vendor: ${vendor.vendorName}...`);
      
      const approveResponse = await axios.post(`${API_BASE}/vendor/approve-vendor/${vendor._id}`);
      console.log('✅ Approval result:', approveResponse.data.message);
      
      // 4. Test rejecting a vendor
      console.log(`\n4. Testing reject vendor: ${vendor.vendorName}...`);
      const rejectResponse = await axios.post(`${API_BASE}/vendor/reject-vendor/${vendor._id}`, {
        reason: 'Test rejection'
      });
      console.log('✅ Rejection result:', rejectResponse.data.message);
    } else {
      console.log('\n3. No pending vendors to test with');
    }

    console.log('\n🎉 All vendor approval tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testVendorApproval();