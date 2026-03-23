// Test vendor login and product fetching
async function testVendorLoginAndFetch() {
  try {
    console.log('Testing vendor login and product fetching...');
    
    // Step 1: Test vendor login
    console.log('1. Testing vendor login...');
    try {
      const loginResponse = await fetch('http://localhost:9000/api/vendor/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'testvendor@example.com',
          password: 'testpassword123'
        })
      });
      
      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);
      
      if (loginData.success && loginData.token) {
        console.log('Login successful! Token:', loginData.token);
        
        // Step 2: Test product fetching with the token
        console.log('2. Testing product fetching with token...');
        const productResponse = await fetch('http://localhost:9000/api/vendor/products', {
          headers: {
            'Authorization': `Bearer ${loginData.token}`
          }
        });
        
        const productData = await productResponse.json();
        console.log('Product fetch response:', productData);
        
      } else {
        console.log('Login failed or no token received');
      }
      
    } catch (error) {
      console.log('Login test error:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testVendorLoginAndFetch();