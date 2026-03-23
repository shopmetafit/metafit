// Simple test to test vendor product fetching without dependencies
async function testVendorProductFetch() {
  try {
    console.log('Testing vendor product fetch...');
    
    // Test without token first
    console.log('1. Testing without token...');
    try {
      const response = await fetch('http://localhost:9000/api/vendor/products');
      const data = await response.json();
      console.log('Response without token:', data);
    } catch (error) {
      console.log('Error without token:', error.message);
    }
    
    // Test with a dummy token
    console.log('2. Testing with dummy token...');
    try {
      const response = await fetch('http://localhost:9000/api/vendor/products', {
        headers: {
          'Authorization': 'Bearer dummy-token'
        }
      });
      const data = await response.json();
      console.log('Response with dummy token:', data);
    } catch (error) {
      console.log('Error with dummy token:', error.message);
    }
    
    // Test with a properly formatted JWT token (but invalid)
    console.log('3. Testing with JWT formatted token...');
    try {
      // Create a simple JWT-like token
      const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZW5kb3JJZCI6IjYwZjdiM2IzYjNiM2IzYjNiM2IzYjNiIiwiZW1haWwiOiJ0ZXN0dmVuZG9yQGV4YW1wbGUuY29tIiwidmVuZG9yTmFtZSI6IlRlc3QgVmVuZG9yIiwiYnVzaW5lc3NOYW1lIjoiVGVzdCBWZW5kb3IgQnVzaW5lc3MiLCJpYXQiOjE2Nzg5MDAwMDB9.invalid-signature';
      
      const response = await fetch('http://localhost:9000/api/vendor/products', {
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      });
      const data = await response.json();
      console.log('Response with JWT token:', data);
    } catch (error) {
      console.log('Error with JWT token:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testVendorProductFetch();