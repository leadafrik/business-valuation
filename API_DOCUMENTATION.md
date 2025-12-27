# API Documentation

## Overview

The Business Valuation Tool provides REST APIs for authentication and business valuations. All requests should include appropriate headers and authentication.

## Base URL

```
http://localhost:3000/api (development)
https://yourdomain.com/api (production)
```

## Authentication

Uses NextAuth.js 5 with JWT-based sessions. Protected routes require valid session cookies.

---

## Endpoints

### 1. User Registration

**POST** `/auth/signup`

Create a new user account.

#### Request

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | User's full name |
| email | string | Yes | Valid email address |
| password | string | Yes | Min 8 characters |

#### Response Success (201)

```json
{
  "id": "user_id_123",
  "email": "john@example.com",
  "name": "John Doe"
}
```

#### Response Error (400)

```json
{
  "error": "User already exists"
}
```

#### Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 400 | Email and password required | Missing fields |
| 400 | User already exists | Email taken |
| 500 | Internal server error | Server error |

---

### 2. User Sign In

**POST** `/auth/[...nextauth]`

Handled by NextAuth. Use `/api/auth/signin` for credential submission via browser form.

#### Via NextAuth Callback

```javascript
import { signIn } from "next-auth/react";

await signIn("credentials", {
  email: "john@example.com",
  password: "password",
  redirect: true,
});
```

---

### 3. Create Valuation

**POST** `/valuations`

Calculate business valuation using multiple methods.

#### Authentication

Requires active NextAuth session (automatically included via cookies)

#### Request

```bash
curl -X POST http://localhost:3000/api/valuations \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Tech Startup Ltd",
    "businessDescription": "SaaS platform for SMEs",
    "sector": "tech",
    "annualRevenue": 50000000,
    "ebitda": 15000000,
    "netIncome": 8000000,
    "freeCashFlow": 12000000,
    "totalAssets": 30000000,
    "totalLiabilities": 10000000,
    "discountRate": 0.32,
    "terminalGrowth": 0.04,
    "projectionYears": 5
  }'
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| businessName | string | Yes | Name of business |
| businessDescription | string | No | Business description |
| sector | string | Yes | One of: `retail`, `hospitality`, `agribusiness`, `tech`, `manufacturing`, `services` |
| annualRevenue | number | Yes | Annual revenue in KES |
| ebitda | number | No | EBITDA in KES |
| netIncome | number | No | Net income in KES |
| freeCashFlow | number | No | Free cash flow in KES |
| totalAssets | number | No | Total assets in KES |
| totalLiabilities | number | No | Total liabilities in KES |
| discountRate | number | No | WACC (0.20 = 20%). Uses sector default if omitted |
| terminalGrowth | number | No | Terminal growth rate (default 0.04 = 4%) |
| projectionYears | number | No | DCF projection years (default 5) |

#### Response Success (200)

```json
{
  "id": "valuation_123",
  "valuations": [
    {
      "type": "dcf",
      "value": 85000000,
      "assumptions": {
        "freeCashFlow": 12000000,
        "growthRate": 0.10,
        "discountRate": 0.32
      }
    },
    {
      "type": "comparable_revenue",
      "value": 200000000,
      "multiple": 4.0,
      "assumptions": {
        "annualRevenue": 50000000,
        "multipleRange": { "min": 3.0, "max": 8.0 }
      }
    },
    {
      "type": "comparable_ebitda",
      "value": 90000000,
      "multiple": 6.0,
      "assumptions": {
        "ebitda": 15000000
      }
    },
    {
      "type": "asset_based",
      "value": 20000000,
      "assumptions": {
        "totalAssets": 30000000,
        "totalLiabilities": 10000000,
        "netAssetValue": 20000000
      }
    }
  ],
  "finalValuation": 96333333,
  "sector": {
    "sector": "Tech & Digital Startups",
    "description": "SaaS, fintech, e-commerce, digital services",
    "riskProfile": "high",
    "baseDiscountRate": 0.22,
    "riskPremium": 0.10,
    "keyFactors": [
      "Growth rate",
      "User retention & churn",
      "MRR/ARR"
    ]
  },
  "savedAt": "2025-12-27T12:00:00Z"
}
```

#### Response Error (401)

```json
{
  "error": "Unauthorized"
}
```

#### Response Error (500)

```json
{
  "error": "Failed to calculate valuation"
}
```

---

### 4. Get Valuation History

**GET** `/valuations`

Retrieve all valuations created by authenticated user.

#### Authentication

Requires active NextAuth session

#### Request

```bash
curl http://localhost:3000/api/valuations \
  -H "Cookie: sessionToken=..."
```

#### Response Success (200)

```json
[
  {
    "id": "valuation_123",
    "userId": "user_123",
    "businessName": "Tech Startup Ltd",
    "businessDescription": "SaaS platform",
    "sector": "tech",
    "annualRevenue": 50000000,
    "ebitda": 15000000,
    "valuationType": "multiple",
    "valuationValue": 96333333,
    "createdAt": "2025-12-27T12:00:00Z",
    "updatedAt": "2025-12-27T12:00:00Z"
  }
]
```

#### Response Error (401)

```json
{
  "error": "Unauthorized"
}
```

---

## Sector Mappings

Use these exact strings for the `sector` field:

```javascript
const VALID_SECTORS = [
  "retail",        // Retail & Wholesale
  "hospitality",   // Hotels, Restaurants
  "agribusiness",  // Farming, Agritech
  "tech",          // SaaS, Fintech, E-commerce
  "manufacturing", // Industrial, Production
  "services"       // Consulting, Professional Services
];
```

---

## Sector Risk Profiles

Each sector has pre-configured risk metrics:

### Tech & Digital Startups
- **WACC**: 32% (high risk, scalability potential)
- **Revenue Multiples**: 3.0x - 8.0x
- **Key Factors**: Growth rate, user retention, market scalability

### Hospitality (Hotels, Restaurants)
- **WACC**: 34%+ (very high risk, cyclical)
- **EBITDA Multiples**: 3.0x - 5.0x
- **Key Factors**: Occupancy rates, location, security concerns

### Agribusiness & Agritech
- **WACC**: 28% (high risk, weather/commodity)
- **EBITDA Multiples**: 3.0x - 5.5x
- **Key Factors**: Land quality, contracts, certifications

### Retail & Wholesale
- **WACC**: 28% (high risk, thin margins)
- **Revenue Multiples**: 0.3x - 0.8x
- **Key Factors**: Footfall, location, inventory turnover

### Manufacturing & Industrial
- **WACC**: 24% (moderate risk, contracts)
- **EBITDA Multiples**: 4.0x - 7.0x
- **Key Factors**: Capacity utilization, efficiency

### Professional Services
- **WACC**: 20% (low risk, predictable)
- **EBITDA Multiples**: 3.5x - 6.0x
- **Key Factors**: Client stability, reputation

---

## Valuation Calculation Details

### DCF Method

Projects free cash flow for N years:

$$PV = \sum_{t=1}^{N} \frac{FCF_t}{(1 + WACC)^t}$$

Terminal Value (Gordon Growth Model):

$$TV = \frac{FCF_{N+1}}{WACC - g}$$

**Parameters**:
- `FCF`: Free Cash Flow (required)
- `WACC`: Discount Rate (uses sector default if not provided)
- `g`: Terminal Growth Rate (default 4%)
- `N`: Projection Years (default 5)

### Comparable Multiples

$$Enterprise\ Value = EBITDA \times Multiple$$

or

$$Enterprise\ Value = Revenue \times Multiple$$

Multiples sourced from Kenyan business benchmarks.

### Asset-Based

$$NAV = Total\ Assets - Total\ Liabilities$$

### Weighted Average

Combines all calculated methods:
- DCF: 40% weight (most reliable)
- Comparable (Revenue): 20% weight
- Comparable (EBITDA): 20% weight
- Asset-Based: 20% weight (lower for knowledge-based)

---

## Error Handling

All error responses include:

```json
{
  "error": "Error description message"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (not logged in) |
| 404 | Not Found |
| 500 | Server Error |

---

## Rate Limiting

*Currently unrestricted for development*

For production, implement:
- 100 requests per 15 minutes per user
- 1000 requests per hour per IP

---

## CORS

Development: All origins allowed  
Production: Configure CORS for your domain

```bash
# In production, set appropriate headers:
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Examples

### Example 1: Retail Store Valuation

```bash
curl -X POST http://localhost:3000/api/valuations \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Mama Njeri Supermarket",
    "sector": "retail",
    "annualRevenue": 12000000,
    "ebitda": 1440000,
    "totalAssets": 3000000,
    "totalLiabilities": 800000
  }'
```

**Expected Result**: ~2.5M - 4.5M KES depending on assets and margins

### Example 2: Tech Startup

```bash
curl -X POST http://localhost:3000/api/valuations \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "FinTech Innovators",
    "sector": "tech",
    "annualRevenue": 100000000,
    "ebitda": 20000000,
    "freeCashFlow": 18000000
  }'
```

**Expected Result**: ~200M - 500M KES depending on growth trajectory

### Example 3: Manufacturing Plant

```bash
curl -X POST http://localhost:3000/api/valuations \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Industrial Products Ltd",
    "sector": "manufacturing",
    "annualRevenue": 250000000,
    "ebitda": 45000000,
    "totalAssets": 150000000,
    "totalLiabilities": 50000000
  }'
```

**Expected Result**: ~200M - 400M KES (asset-backed)

---

## Changelog

### Version 1.0 (Current)
- ✅ User authentication
- ✅ Multi-method valuation
- ✅ Kenya sector profiles
- ✅ Valuation history

### Future Versions
- PDF report generation
- Sensitivity analysis
- Scenario planning
- Comparison tool
- Export to Excel
