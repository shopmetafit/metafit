const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testVendorOTPLogin() {
  console.log('🧪 Testing Vendor OTP Login...\n');

  try {
    // Test 1: Send OTP to approved vendor
    console.log('1. Testing send OTP to approved vendor...');
    const approvedVendorPhone = "9876543212"; // From our test setup
    
    try {
      const response = await axios.post(`${API_BASE}/vendor/send-otp`, {
        phone: approvedVendorPhone
      });
      
      if (response.data.success) {
        console.log('✅ OTP sent successfully');
        console.log('   Phone:', response.data.phone);
      } else {
        console.log('❌ Failed to send OTP:', response.data.message);
      }
    } catch (error) {
      console.log('❌ Send OTP error:', error.response?.data?.message || error.message);
    }

    // Test 2: Try OTP login with wrong OTP
    console.log('\n2. Testing OTP login with wrong OTP...');
    try {
      const response = await axios.post(`${API_BASE}/vendor/login-otp`, {
        phone: approvedVendorPhone,
        otp: "123456" // Wrong OTP
      });
      
      console.log('❌ Should have failed with wrong OTP');
    } catch (error) {
      if (error.response?.data?.message && error.response.data.message.includes("Invalid OTP")) {
        console.log('✅ Correctly rejected wrong OTP:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Test 3: Try OTP login with non-existent vendor
    console.log('\n3. Testing OTP login with non-existent vendor...');
    try {
      const response = await axios.post(`${API_BASE}/vendor/login-otp`, {
        phone: "9999999999",
        otp: "123456"
      });
      
      console.log('❌ Should have failed for non-existent vendor');
    } catch (error) {
      if (error.response?.data?.message && error.response.data.message.includes("No vendor found")) {
        console.log('✅ Correctly rejected non-existent vendor:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Test 4: Try OTP login with pending vendor
    console.log('\n4. Testing OTP login with pending vendor...');
    const pendingVendorPhone = "9876543210"; // From our test setup
    
    try {
      const response = await axios.post(`${API_BASE}/vendor/login-otp`, {
        phone: pendingVendorPhone,
        otp: "123456"
      });
      
      console.log('❌ Should have failed for pending vendor');
    } catch (error) {
      if (error.response?.data?.status === 'pending') {
        console.log('✅ Correctly rejected pending vendor:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Test 5: Try OTP login with rejected vendor
    console.log('\n5. Testing OTP login with rejected vendor...');
    const rejectedVendorPhone = "9876543211"; // From our test setup
    
    try {
      const response = await axios.post(`${API_BASE}/vendor/login-otp`, {
        phone: rejectedVendorPhone,
        otp: "123456"
      });
      
      console.log('❌ Should have failed for rejected vendor');
    } catch (error) {
      if (error.response?.data?.status === 'rejected') {
        console.log('✅ Correctly rejected rejected vendor:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    console.log('\n🎉 Vendor OTP login tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Helper function to create test vendors for testing
async function setupTestVendors() {
  console.log('🔧 Setting up test vendors for OTP login...\n');

  const testVendors = [
    {
      businessName: "OTP Test Vendor",
      vendorName: "OTP User",
      businessEmail: "otp@example.com",
      vendorPhone: "9876543212",
      vendorPass: "password123",
      vendorState: "Maharashtra",
      vendorCity: "Mumbai",
      pinCode: "400001",
      bankAccNumber: "1234567890",
      IFSCCode: "SBIN0002499",
      accountHolderName: "OTP User"
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

  // Approve the OTP test vendor
  try {
    console.log('\nApproving OTP test vendor...');
    const pendingVendors = await axios.get(`${API_BASE}/vendor/pending-vendors`);
    const otpVendor = pendingVendors.data.vendors.find(v => v.email === 'otp@example.com');
    
    if (otpVendor) {
      const response = await axios.post(`${API_BASE}/vendor/approve-vendor/${otpVendor._id}`);
      console.log('✅ OTP vendor approved:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Failed to approve OTP vendor:', error.response?.data);
  }
}

// Run the tests
async function runTests() {
  await setupTestVendors();
  await testVendorOTPLogin();
}

runTests();