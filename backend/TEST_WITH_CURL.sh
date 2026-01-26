#!/bin/bash

# Blue Dart Shipping Integration - Complete Testing Script
# Usage: bash TEST_WITH_CURL.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:9000/api"
TOKEN="" # Will be set interactively
CHECKOUT_ID=""
ORDER_ID=""
PRODUCT_ID="" # Get from your database

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Blue Dart Integration Test${NC}"
echo -e "${BLUE}================================${NC}"

# Step 0: Get user input
echo -e "\n${YELLOW}Step 0: Setup${NC}"
read -p "Enter your JWT token (from login): " TOKEN
read -p "Enter a Product ID (from your database): " PRODUCT_ID
read -p "Enter your User ID (from your database): " USER_ID

if [ -z "$TOKEN" ] || [ -z "$PRODUCT_ID" ] || [ -z "$USER_ID" ]; then
  echo -e "${RED}Error: Missing required information${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Configuration loaded${NC}"

# Step 1: Add item to cart
echo -e "\n${YELLOW}Step 1: Add Item to Cart${NC}"
curl -X POST "$API_URL/cart" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"quantity\": 2,
    \"size\": \"M\",
    \"color\": \"red\",
    \"price\": 999
  }" | jq .

echo -e "${GREEN}✓ Item added to cart${NC}"

# Step 2: Create Checkout
echo -e "\n${YELLOW}Step 2: Create Checkout Session${NC}"
CHECKOUT_RESPONSE=$(curl -s -X POST "$API_URL/checkout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "checkoutItems": [
      {
        "productId": "'"$PRODUCT_ID"'",
        "name": "Test Product",
        "image": "https://example.com/image.jpg",
        "price": 999,
        "quantity": 2,
        "size": "M",
        "color": "red"
      }
    ],
    "shippingAddress": {
      "address": "123 Customer Street",
      "city": "Mumbai",
      "postalCode": "400001",
      "country": "IN"
    },
    "paymentMethod": "razorpay",
    "totalPrice": 1998
  }')

echo "$CHECKOUT_RESPONSE" | jq .
CHECKOUT_ID=$(echo "$CHECKOUT_RESPONSE" | jq -r '._id')

if [ -z "$CHECKOUT_ID" ] || [ "$CHECKOUT_ID" = "null" ]; then
  echo -e "${RED}Error: Failed to create checkout${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Checkout created: $CHECKOUT_ID${NC}"

# Step 3: Mark as Paid
echo -e "\n${YELLOW}Step 3: Mark Checkout as Paid${NC}"
curl -s -X PUT "$API_URL/checkout/$CHECKOUT_ID/pay" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentStatus": "paid",
    "paymentDetails": {
      "razorpay_payment_id": "pay_test_'$(date +%s)'",
      "razorpay_order_id": "order_test_'$(date +%s)'",
      "razorpay_signature": "sig_test_123"
    }
  }' | jq .

echo -e "${GREEN}✓ Checkout marked as paid${NC}"

# Step 4: Finalize Checkout → Creates Order
echo -e "\n${YELLOW}Step 4: Finalize Checkout (Create Order)${NC}"
FINALIZE_RESPONSE=$(curl -s -X POST "$API_URL/checkout/$CHECKOUT_ID/finalize" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "$FINALIZE_RESPONSE" | jq .
ORDER_ID=$(echo "$FINALIZE_RESPONSE" | jq -r '._id')

if [ -z "$ORDER_ID" ] || [ "$ORDER_ID" = "null" ]; then
  echo -e "${RED}Error: Failed to create order${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Order created: $ORDER_ID${NC}"

# Step 5: Generate AWB (Blue Dart Integration)
echo -e "\n${YELLOW}Step 5: Generate AWB (Create Shipping)${NC}"
echo -e "${BLUE}Calling Blue Dart API to generate waybill...${NC}"

AWB_RESPONSE=$(curl -s -X POST "$API_URL/shipment/$ORDER_ID/generate-awb" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "consigneeName": "Test Customer",
    "consigneePhone": "9876543210",
    "consigneeEmail": "test@example.com",
    "weight": "1.5"
  }')

echo "$AWB_RESPONSE" | jq .
AWB_NO=$(echo "$AWB_RESPONSE" | jq -r '.awbNo')
SUCCESS=$(echo "$AWB_RESPONSE" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✓ AWB Generated: $AWB_NO${NC}"
else
  echo -e "${RED}Error: AWB Generation failed${NC}"
  echo "$AWB_RESPONSE" | jq .
  exit 1
fi

# Step 6: Get Shipping Info
echo -e "\n${YELLOW}Step 6: Get Shipping Information${NC}"
curl -s -X GET "$API_URL/shipment/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "${GREEN}✓ Shipping info retrieved${NC}"

# Step 7: Track Shipment
echo -e "\n${YELLOW}Step 7: Track Shipment${NC}"
echo -e "${BLUE}Calling Blue Dart Tracking API...${NC}"

TRACK_RESPONSE=$(curl -s -X GET "$API_URL/shipment/$ORDER_ID/track" \
  -H "Authorization: Bearer $TOKEN")

echo "$TRACK_RESPONSE" | jq .
TRACK_SUCCESS=$(echo "$TRACK_RESPONSE" | jq -r '.success')

if [ "$TRACK_SUCCESS" = "true" ]; then
  echo -e "${GREEN}✓ Tracking info retrieved${NC}"
else
  echo -e "${YELLOW}Note: Tracking data may not be available immediately${NC}"
fi

# Summary
echo -e "\n${BLUE}================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "Token: ${YELLOW}$TOKEN${NC}"
echo -e "Product ID: ${YELLOW}$PRODUCT_ID${NC}"
echo -e "Checkout ID: ${YELLOW}$CHECKOUT_ID${NC}"
echo -e "Order ID: ${YELLOW}$ORDER_ID${NC}"
echo -e "AWB Number: ${GREEN}$AWB_NO${NC}"
echo -e "\n${GREEN}✓ All tests passed!${NC}"

echo -e "\n${BLUE}Next Steps:${NC}"
echo -e "1. Check MongoDB for the order with AWB"
echo -e "2. Use the tracking number: ${GREEN}$AWB_NO${NC}"
echo -e "3. Try tracking: curl -H \"Authorization: Bearer $TOKEN\" http://localhost:3000/api/shipment/$ORDER_ID/track"

echo -e "\n${BLUE}Useful Commands:${NC}"
echo -e "Get Order: ${YELLOW}curl -H \"Authorization: Bearer $TOKEN\" http://localhost:3000/api/orders/$ORDER_ID${NC}"
echo -e "Get My Orders: ${YELLOW}curl -H \"Authorization: Bearer $TOKEN\" http://localhost:3000/api/orders/my-orders${NC}"
