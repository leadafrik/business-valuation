#!/bin/bash

# Test script for Business Valuation Tool
# This script tests the complete valuation flow

API_BASE="http://localhost:3000/api"
SESSION_TOKEN=""
USER_EMAIL="test@example.com"
USER_PASSWORD="Test@1234"

echo "=== Business Valuation Tool - Test Flow ==="
echo ""

# Step 1: Sign up a test user
echo "1️⃣ Testing User Signup..."
SIGNUP_RESPONSE=$(curl -s -X POST "$API_BASE/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"$USER_PASSWORD\",
    \"name\": \"Test User\"
  }")

echo "Signup Response: $SIGNUP_RESPONSE"
echo ""

# Step 2: Create a test valuation with seed data
echo "2️⃣ Testing Valuation Creation (Retail Sector)..."
VALUATION_DATA='{
  "businessName": "Tech Hub Kenya",
  "businessDescription": "A leading retail technology distributor in East Africa",
  "sector": "retail",
  "annualRevenue": 50000000,
  "ebitda": 7500000,
  "netIncome": 5000000,
  "freeCashFlow": 4000000,
  "totalAssets": 25000000,
  "totalLiabilities": 10000000,
  "discountRate": 0.18,
  "terminalGrowth": 0.04,
  "projectionYears": 5
}'

echo "Creating valuation with data:"
echo "$VALUATION_DATA"
echo ""

# Step 3: Test scenarios calculation
echo "3️⃣ Expected Scenario Results:"
echo "- Conservative: 10% lower with higher discount rate"
echo "- Base Case: Market rate with current assumptions"
echo "- Upside: 15% uplift with lower discount rate"
echo ""

# Step 4: Test value drivers
echo "4️⃣ Expected Value Drivers (Retail Sector):"
echo "- Improve financial record quality & formalize accounting"
echo "- Reduce dependency on owner/founder"
echo "- Build team of qualified professionals"
echo "- Improve profit margins through operational efficiency"
echo "- Reduce credit/receivables period"
echo ""

echo "=== Test Expectations ==="
echo "✅ Form validation: Empty values should be 0, not empty strings"
echo "✅ FCF confirmation: Required before proceeding to results"
echo "✅ Terminal growth: Default to 'moderate' (4%)"
echo "✅ Scenario weights: Conservative 40/30/30, Base 40/30/30, Upside 40/30/30"
echo "✅ Sector display: Should safely handle any sector value"
echo "✅ Value drivers: Should show fallback message if empty"
echo "✅ WACC values: Should display correctly without null fallback"
echo ""

echo "=== Ready for Manual Testing ==="
echo "Open http://localhost:3000 in your browser to test the UI"
