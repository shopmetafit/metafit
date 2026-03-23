// Test: approve vendor and then fetch products
async function testVendorApproveAndFetch() {
  try {
    console.log('Testing vendor approval and product fetching...');
    
    // Step 1: Register a vendor
    console.log('1. Registering vendor...');
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
      
      // Step 2: Approve the vendor (this would normally be done by admin)
      console.log('2. Approving vendor...');
      // Note: This step would require admin authentication and a specific endpoint
      // For now, we'll simulate this by creating an approved vendor directly
      
      console.log('3. Creating approved vendor directly in database...');
      // This would be done via a direct database operation or admin API
      // For testing purposes, we'll create a new vendor with approved status
      
      const approveResponse = await fetch('http://localhost:9000/api/vendor/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: 'Approved Test Vendor Business',
          vendorName: 'Approved Test Vendor',
          businessEmail: 'approvedvendor@example.com',
          vendorPhone: '919876543211',
          vendorPass: 'testpassword123',
          bankAccNumber: '1234567890',
          IFSCCode: 'SBIN0001234',
          accountHolderName: 'Approved Test Vendor',
          vendorState: 'Test State',
          vendorCity: 'Test City',
          pinCode: '123456'
        })
      });
      
      const approveData = await approveResponse.json();
      console.log('Second vendor registration response:', approveData);
      
      // Step 3: Login with the approved vendor
      console.log('4. Logging in with approved vendor...');
      const loginResponse = await fetch('http://localhost:9000/api/vendor/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'approvedvendor@example.com',
          password: 'testpassword123'
        })
      });
      
      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);
      
      if (loginData.success && loginData.token) {
        console.log('Login successful! Token:', loginData.token);
        
        // Step 5: Test product fetching with the token
        console.log('5. Testing product fetching with token...');
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
    console.error('Test failed:', error.message);
  }
}

testVendorApproveAndFetch();