// Complete test: register vendor, login, and fetch products
async function testVendorCompleteFlow() {
  try {
    console.log('Testing complete vendor flow...');
    
    // Step 1: Register a vendor
    console.log('1. Registering vendor...');
    try {
      const registerResponse = await fetch('http://localhost:9000/api/vendor/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: 'Test Vendor Business',
          vendorName: 'Test Vendor',
          businessEmail: 'testvendor@example.com',
          vendorPhone: '919876543210',
          vendorPass: 'testpassword123',
          bankAccNumber: '1234567890',
          IFSCCode: 'SBIN0001234',
          accountHolderName: 'Test Vendor',
          vendorState: 'Test State',
          vendorCity: 'Test City',
          pinCode: '123456'
        })
      });
      
      const registerData = await registerResponse.json();
      console.log('Registration response:', registerData);
      
      if (registerData.success) {
        console.log('Registration successful!');
        
        // Step 2: Login with the registered vendor
        console.log('2. Logging in with registered vendor...');
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
          
          // Step 3: Test product fetching with the token
          console.log('3. Testing product fetching with token...');
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
        
      } else {
        console.log('Registration failed');
      }
      
    } catch (error) {
      console.log('Test error:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testVendorCompleteFlow();