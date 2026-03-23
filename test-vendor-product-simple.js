// Simple test to test vendor product fetching with a mock token
const jwt = require('jsonwebtoken');

async function testVendorProductFetch() {
  try {
    console.log('Testing vendor product fetch with mock token...');
    
    // Generate a mock vendor token
    const mockVendorData = {
      vendorId: '60f7b3b3b3b3b3b3b3b3b3b3',
      email: 'testvendor@example.com',
      vendorName: 'Test Vendor',
      businessName: 'Test Vendor Business'
    };
    
    const mockToken = jwt.sign(
      mockVendorData,
      'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('Generated mock vendor token:', mockToken);
    
    // Test the token with fetch
    const response = await fetch('http://localhost:9000/api/vendor/products', {
      headers: {
        'Authorization': `Bearer ${mockToken}`
      }
    });
    
    const data = await response.json();
    console.log('Vendor products response:', data);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testVendorProductFetch();