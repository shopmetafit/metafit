const axios = require('axios');

// Test the vendor registration API
async function testVendorRegistration() {
  try {
    console.log('Testing Vendor Registration API...');
    
    // Test data
    const testData = {
      businessName: 'Test Business',
      vendorName: 'Test Vendor',
      businessEmail: 'test@example.com',
      vendorPhone: '9876543210',
      businessType: 'company',
      vendorPass: 'testpassword123',
      bankAccNumber: '123456789012',
      IFSCCode: 'SBIN0001234',
      accountHolderName: 'Test Account Holder',
      vendorState: 'Test State',
      vendorCity: 'Test City',
      pinCode: '123456',
      vendorAcceptance: 'true'
    };

    // Make API request
    const response = await axios.post('http://localhost:9000/api/vendor/register', testData);
    
    console.log('Response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Vendor registration test PASSED');
    } else {
      console.log('❌ Vendor registration test FAILED:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing vendor registration:', error.response?.data || error.message);
  }
}

// Run the test
testVendorRegistration();