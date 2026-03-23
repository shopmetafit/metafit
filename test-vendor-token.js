// Simple test to generate vendor token and test product fetching
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Vendor = require('./backend/models/Vendor');

async function testVendorProductFetch() {
  try {
    console.log('Testing vendor product fetch...');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/mwellnessbazaar', { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });

    // Create a test vendor if none exists
    let vendor = await Vendor.findOne({ email: 'testvendor@example.com' });
    
    if (!vendor) {
      // Create test vendor
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      vendor = new Vendor({
        businessName: 'Test Vendor Business',
        vendorName: 'Test Vendor',
        email: 'testvendor@example.com',
        phone: '919876543210',
        password: hashedPassword,
        status: 'approved'
      });
      await vendor.save();
      console.log('Created test vendor:', vendor.email);
    } else {
      console.log('Using existing vendor:', vendor.email);
    }
    
    // Generate token
    const token = jwt.sign(
      { 
        vendorId: vendor._id, 
        email: vendor.email,
        vendorName: vendor.vendorName,
        businessName: vendor.businessName
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('Generated vendor token:', token);
    
    // Test the token with fetch
    const response = await fetch('http://localhost:9000/api/vendor/products', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('Vendor products response:', data);
    
    mongoose.disconnect();
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testVendorProductFetch();