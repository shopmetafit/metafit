const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testVendorLoginFlow() {
  console.log('🧪 Testing Vendor Login Flow...\n');

  try {
    // Test 1: Try to login with non-existent vendor
    console.log('1. Testing login with non-existent vendor...');
    try {
      await axios.post(`${API_BASE}/vendor/login`, {
        email: 'nonexistent@example.com',
        password: 'password123'
      });
    } catch (error) {
      console.log('✅ Correctly rejected non-existent vendor:', error.response?.data?.message);
    }

    // Test 2: Try to login with wrong password
    console.log('\n2. Testing login with wrong password...');
    try {
      await axios.post(`${API_BASE}/vendor/login`, {
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      console.log('✅ Correctly rejected wrong password:', error.response?.data?.message);
    }

    // Test 3: Try to login with pending vendor
    console.log('\n3. Testing login with pending vendor...');
    try {
      const response = await axios.post(`${API_BASE}/vendor/login`, {
        email: 'pending@example.com',
        password: 'password123'
      });
      console.log('❌ Should have been rejected for pending status');
    } catch (error) {
      if (error.response?.data?.status === 'pending') {
        console.log('✅ Correctly rejected pending vendor:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Test 4: Try to login with rejected vendor
    console.log('\n4. Testing login with rejected vendor...');
    try {
      const response = await axios.post(`${API_BASE}/vendor/login`, {
        email: 'rejected@example.com',
        password: 'password123'
      });
      console.log('❌ Should have been rejected for rejected status');
    } catch (error) {
      if (error.response?.data?.status === 'rejected') {
        console.log('✅ Correctly rejected rejected vendor:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Test 5: Try to login with approved vendor
    console.log('\n5. Testing login with approved vendor...');
    try {
      const response = await axios.post(`${API_BASE}/vendor/login`, {
        email: 'approved@example.com',
        password: 'password123'
      });
      
      if (response.data.success && response.data.token) {
        console.log('✅ Successfully logged in approved vendor');
        console.log('   Token received:', response.data.token.substring(0, 20) + '...');
        console.log('   Vendor info:', response.data.vendor);
      } else {
        console.log('❌ Login failed for approved vendor:', response.data);
      }
    } catch (error) {
      console.log('❌ Login failed for approved vendor:', error.response?.data);
    }

    console.log('\n🎉 Vendor login flow tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Helper function to create test vendors for testing
async function setupTestVendors() {
  console.log('🔧 Setting up test vendors...\n');

  const testVendors = [
    {
      businessName: "Pending Vendor",
      vendorName: "Pending User",
      businessEmail: "pending@example.com",
      vendorPhone: "9876543210",
      vendorPass: "password123",
      vendorState: "Maharashtra",
      vendorCity: "Mumbai",
      pinCode: "400001",
      bankAccNumber: "1234567890",
      IFSCCode: "SBIN0002499",
      accountHolderName: "Pending User"
    },
    {
      businessName: "Rejected Vendor",
      vendorName: "Rejected User",
      businessEmail: "rejected@example.com",
      vendorPhone: "9876543211",
      vendorPass: "password123",
      vendorState: "Delhi",
      vendorCity: "Delhi",
      pinCode: "110001",
      bankAccNumber: "1234567891",
      IFSCCode: "SBIN0002499",
      accountHolderName: "Rejected User"
    },
    {
      businessName: "Approved Vendor",
      vendorName: "Approved User",
      businessEmail: "approved@example.com",
      vendorPhone: "9876543212",
      vendorPass: "password123",
      vendorState: "Karnataka",
      vendorCity: "Bangalore",
      pinCode: "560001",
      bankAccNumber: "1234567892",
      IFSCCode: "SBIN0002499",
      accountHolderName: "Approved User"
    }
  ];

  for (const vendorData of testVendors) {
    try {
      console.log(`Creating vendor: ${vendorData.businessEmail}...`);
      const response = await axios.post(`${API_BASE}/vendor/register`, vendorData);
      console.log(`✅ ${vendorData.businessEmail}: ${response.data.message}`);
    } catch (error) {
      console.log(`❌ ${vendorData.businessEmail}: ${error.response?.data?.message || error.message}`);
    }
  }

  // Approve the approved vendor
  try {
    console.log('\nApproving approved vendor...');
    const pendingVendors = await axios.get(`${API_BASE}/vendor/pending-vendors`);
    const approvedVendor = pendingVendors.data.vendors.find(v => v.email === 'approved@example.com');
    
    if (approvedVendor) {
      const response = await axios.post(`${API_BASE}/vendor/approve-vendor/${approvedVendor._id}`);
      console.log('✅ Approved vendor approved:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Failed to approve vendor:', error.response?.data);
  }

  // Reject the rejected vendor
  try {
    console.log('\nRejecting rejected vendor...');
    const pendingVendors = await axios.get(`${API_BASE}/vendor/pending-vendors`);
    const rejectedVendor = pendingVendors.data.vendors.find(v => v.email === 'rejected@example.com');
    
    if (rejectedVendor) {
      const response = await axios.post(`${API_BASE}/vendor/reject-vendor/${rejectedVendor._id}`, {
        reason: 'Test rejection'
      });
      console.log('✅ Rejected vendor rejected:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Failed to reject vendor:', error.response?.data);
  }
}

// Run the tests
async function runTests() {
  await setupTestVendors();
  await testVendorLoginFlow();
}

runTests();