const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testVendorStatusFiltering() {
  console.log('🧪 Testing Vendor Status Filtering...\n');

  try {
    // Test 1: Get all vendors
    console.log('1. Testing get all vendors...');
    const allVendorsResponse = await axios.get(`${API_BASE}/vendor/all-vendors`);
    if (allVendorsResponse.data.success) {
      const vendors = allVendorsResponse.data.vendors;
      console.log(`✅ Total vendors: ${vendors.length}`);
      
      const statusCounts = {
        pending: vendors.filter(v => v.status === 'pending').length,
        approved: vendors.filter(v => v.status === 'approved').length,
        rejected: vendors.filter(v => v.status === 'rejected').length
      };
      
      console.log(`   - Pending: ${statusCounts.pending}`);
      console.log(`   - Approved: ${statusCounts.approved}`);
      console.log(`   - Rejected: ${statusCounts.rejected}`);
    } else {
      console.log('❌ Failed to get all vendors');
    }

    // Test 2: Get pending vendors
    console.log('\n2. Testing get pending vendors...');
    const pendingVendorsResponse = await axios.get(`${API_BASE}/vendor/pending-vendors`);
    if (pendingVendorsResponse.data.success) {
      const pendingVendors = pendingVendorsResponse.data.vendors;
      console.log(`✅ Pending vendors: ${pendingVendors.length}`);
      
      // Verify all are pending
      const allPending = pendingVendors.every(v => v.status === 'pending');
      console.log(`   - All pending: ${allPending ? '✅' : '❌'}`);
    } else {
      console.log('❌ Failed to get pending vendors');
    }

    // Test 3: Test approval workflow
    console.log('\n3. Testing approval workflow...');
    const pendingVendors = pendingVendorsResponse.data.vendors;
    if (pendingVendors.length > 0) {
      const vendorToApprove = pendingVendors[0];
      console.log(`   Approving vendor: ${vendorToApprove.vendorName}`);
      
      const approveResponse = await axios.post(`${API_BASE}/vendor/approve-vendor/${vendorToApprove._id}`);
      if (approveResponse.data.success) {
        console.log('✅ Vendor approved successfully');
        
        // Verify vendor is no longer in pending list
        const updatedPendingResponse = await axios.get(`${API_BASE}/vendor/pending-vendors`);
        const updatedPendingVendors = updatedPendingResponse.data.vendors;
        const stillPending = updatedPendingVendors.some(v => v._id === vendorToApprove._id);
        console.log(`   - Vendor removed from pending list: ${!stillPending ? '✅' : '❌'}`);
        
        // Verify vendor is in approved list
        const updatedAllResponse = await axios.get(`${API_BASE}/vendor/all-vendors`);
        const updatedAllVendors = updatedAllResponse.data.vendors;
        const approvedVendor = updatedAllVendors.find(v => v._id === vendorToApprove._id);
        console.log(`   - Vendor status updated to approved: ${approvedVendor.status === 'approved' ? '✅' : '❌'}`);
      } else {
        console.log('❌ Failed to approve vendor');
      }
    } else {
      console.log('   No pending vendors to test with');
    }

    // Test 4: Test rejection workflow
    console.log('\n4. Testing rejection workflow...');
    const pendingVendorsAfterApproval = (await axios.get(`${API_BASE}/vendor/pending-vendors`)).data.vendors;
    if (pendingVendorsAfterApproval.length > 0) {
      const vendorToReject = pendingVendorsAfterApproval[0];
      console.log(`   Rejecting vendor: ${vendorToReject.vendorName}`);
      
      const rejectResponse = await axios.post(`${API_BASE}/vendor/reject-vendor/${vendorToReject._id}`, {
        reason: 'Test rejection for status filtering'
      });
      if (rejectResponse.data.success) {
        console.log('✅ Vendor rejected successfully');
        
        // Verify vendor is no longer in pending list
        const updatedPendingResponse = await axios.get(`${API_BASE}/vendor/pending-vendors`);
        const updatedPendingVendors = updatedPendingResponse.data.vendors;
        const stillPending = updatedPendingVendors.some(v => v._id === vendorToReject._id);
        console.log(`   - Vendor removed from pending list: ${!stillPending ? '✅' : '❌'}`);
        
        // Verify vendor is in rejected list
        const updatedAllResponse = await axios.get(`${API_BASE}/vendor/all-vendors`);
        const updatedAllVendors = updatedAllResponse.data.vendors;
        const rejectedVendor = updatedAllVendors.find(v => v._id === vendorToReject._id);
        console.log(`   - Vendor status updated to rejected: ${rejectedVendor.status === 'rejected' ? '✅' : '❌'}`);
        console.log(`   - Rejection reason stored: ${rejectedVendor.rejectionReason ? '✅' : '❌'}`);
      } else {
        console.log('❌ Failed to reject vendor');
      }
    } else {
      console.log('   No pending vendors to test with');
    }

    // Test 5: Final status counts
    console.log('\n5. Final status verification...');
    const finalResponse = await axios.get(`${API_BASE}/vendor/all-vendors`);
    if (finalResponse.data.success) {
      const vendors = finalResponse.data.vendors;
      const statusCounts = {
        pending: vendors.filter(v => v.status === 'pending').length,
        approved: vendors.filter(v => v.status === 'approved').length,
        rejected: vendors.filter(v => v.status === 'rejected').length
      };
      
      console.log(`✅ Final vendor counts:`);
      console.log(`   - Pending: ${statusCounts.pending}`);
      console.log(`   - Approved: ${statusCounts.approved}`);
      console.log(`   - Rejected: ${statusCounts.rejected}`);
      console.log(`   - Total: ${vendors.length}`);
    }

    console.log('\n🎉 Vendor status filtering tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Helper function to create test vendors for testing
async function setupTestVendors() {
  console.log('🔧 Setting up test vendors for status filtering...\n');

  const testVendors = [
    {
      businessName: "Test Pending Vendor 1",
      vendorName: "Pending User 1",
      businessEmail: "pending1@example.com",
      vendorPhone: "9876543210",
      vendorPass: "password123",
      vendorState: "Maharashtra",
      vendorCity: "Mumbai",
      pinCode: "400001",
      bankAccNumber: "1234567890",
      IFSCCode: "SBIN0002499",
      accountHolderName: "Pending User 1"
    },
    {
      businessName: "Test Pending Vendor 2",
      vendorName: "Pending User 2",
      businessEmail: "pending2@example.com",
      vendorPhone: "9876543211",
      vendorPass: "password123",
      vendorState: "Delhi",
      vendorCity: "Delhi",
      pinCode: "110001",
      bankAccNumber: "1234567891",
      IFSCCode: "SBIN0002499",
      accountHolderName: "Pending User 2"
    },
    {
      businessName: "Test Pending Vendor 3",
      vendorName: "Pending User 3",
      businessEmail: "pending3@example.com",
      vendorPhone: "9876543212",
      vendorPass: "password123",
      vendorState: "Karnataka",
      vendorCity: "Bangalore",
      pinCode: "560001",
      bankAccNumber: "1234567892",
      IFSCCode: "SBIN0002499",
      accountHolderName: "Pending User 3"
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
}

// Run the tests
async function runTests() {
  await setupTestVendors();
  await testVendorStatusFiltering();
}

runTests();