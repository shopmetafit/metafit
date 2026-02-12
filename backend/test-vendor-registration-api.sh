#!/bin/bash

# Test Vendor Registration API
# Replace YOUR_TOKEN with actual JWT token from login

TOKEN="your_jwt_token_here"
BASE_URL="http://localhost:5000"  # or your API URL

curl -X POST $BASE_URL/api/vendors/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Fitness Company",
    "businessDescription": "Premium fitness equipment and supplements provider",
    "gstNo": "27AABCD1234E1Z5",
    "panNo": "AAAAA0000A",
    "bankDetails": {
      "accountName": "Test Company Ltd",
      "accountNumber": "1234567890",
      "bankName": "HDFC Bank",
      "ifscCode": "HDFC0001234"
    },
    "pickupAddress": {
      "street": "123 Business Park",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    },
    "contactPerson": {
      "name": "Rajesh Kumar",
      "phone": "9876543210",
      "email": "rajesh@testfitness.com"
    }
  }'

echo -e "\n\n✓ Test request sent!"
echo "Check cto.metafit@gmail.com for admin notification email"
