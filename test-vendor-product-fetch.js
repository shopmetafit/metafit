// Simple test using fetch API
async function testVendorProductFetch() {
  try {
    console.log('Testing vendor product fetch...');
    
    // Test vendor products endpoint without auth
    console.log('1. Testing vendor products endpoint without auth...');
    try {
      const response = await fetch('http://localhost:9000/api/vendor/products');
      const data = await response.json();
      console.log('Vendor products without auth response:', data);
    } catch (error) {
      console.log('Vendor products without auth error:', error.message);
    }
    
    // Test with a dummy token
    console.log('2. Testing vendor products endpoint with dummy token...');
    try {
      const response = await fetch('http://localhost:9000/api/vendor/products', {
        headers: {
          'Authorization': 'Bearer dummy-token'
        }
      });
      const data = await response.json();
      console.log('Vendor products with dummy token response:', data);
    } catch (error) {
      console.log('Vendor products with dummy token error:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testVendorProductFetch();
