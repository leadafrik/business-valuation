# Business Valuation Tool for Kenya SMEs

A comprehensive web-based business valuation platform designed specifically for Kenyan Small and Medium Enterprises (SMEs).

## Features

### Multiple Valuation Methods
- DCF (Discounted Cash Flow): For businesses with predictable cash flows
- Comparable Transactions: Based on market multiples (Revenue, EBITDA)
- Asset-Based Valuation: For asset-heavy businesses
- Weighted Average: Combines all methods for robust valuation

### Kenya-Specific Insights
- Sector-specific risk profiles and discount rates
- Localized valuation multiples for:
  - Retail & Wholesale
  - Hospitality (Hotels, Restaurants)
  - Agribusiness & Agritech
  - Tech & Digital Startups
  - Manufacturing & Industrial
  - Professional Services
- Macro risk adjustments for KES volatility, political risk, and interest rate changes

### User Features
- OTP-based signup and authentication with NextAuth.js
- Save and manage multiple valuations
- View valuation history
- Professional PDF reports (coming soon)

## Tech Stack

- Frontend: Next.js 14, React, TypeScript, Tailwind CSS
- Backend: Next.js API Routes, Node.js
- Database: PostgreSQL with Prisma ORM
- Authentication: NextAuth.js
- Visualization: Recharts (for dashboard charts)
- PDF Generation: html2pdf (for reports)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd business-valuation
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```
DATABASE_URL="postgresql://user:password@localhost:5432/business_valuation_kenya"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here"
EMAIL_FROM="no-reply@your-domain.com"
```

4. Set up the database
```bash
npm run db:push
```

This will create all required tables based on the Prisma schema.

5. Start the development server
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Project Structure

```
src/
  app/
    api/
      auth/              # Authentication endpoints
      valuations/        # Valuation calculation API
    auth/
      signin/            # Sign in page
      signup/            # Sign up page
      verify-otp/        # OTP verification page
      error/             # Auth error page
    dashboard/           # User dashboard
    valuation/
      new/               # Create new valuation
      [id]/              # View specific valuation
      history/           # View all valuations
    layout.tsx           # Root layout
    page.tsx             # Landing page
    globals.css
  components/            # Reusable React components
  lib/
    valuation/
      dcf.ts             # DCF calculation logic
      comparable.ts      # Comparable valuation logic
      assetBased.ts      # Asset-based valuation logic
      sectorData.ts      # Sector profiles and risk data
    auth.ts              # NextAuth configuration
    prisma.ts            # Prisma client singleton
  types/                 # TypeScript type definitions
prisma/
  schema.prisma          # Database schema
```

## API Endpoints

### Authentication
- POST /api/auth/send-otp - Request an OTP for signup
- POST /api/auth/verify-otp - Verify OTP and create account
- POST /api/auth/[...nextauth] - NextAuth endpoints (signin, signout, etc.)

### Valuations
- POST /api/valuations - Create a new valuation
- GET /api/valuations - Get user's valuation history
- GET /api/valuations/[id] - Get a specific valuation

## Valuation Methodology

### DCF (Discounted Cash Flow)
Projects free cash flows for N years and discounts them to present value using WACC:

EV = sum(Fcf_t / (1 + WACC)^t) + TV / (1 + WACC)^N

Where Terminal Value uses the Gordon Growth Model:
TV = FCF_(N+1) / (WACC - g)

### Comparable Valuation
Uses market multiples tailored to Kenyan sectors:

Enterprise Value = EBITDA * Sector Multiple

### Asset-Based Valuation
Net Asset Value = Total Assets - Total Liabilities

## Kenya Risk Profiles

Each sector has a customized WACC based on:
- Base Risk-Free Rate: ~9% (Kenyan government bond rate)
- Market Risk Premium: ~8% (emerging market)
- Sector Risk Premium: 4-12% depending on volatility
- Macro Adjustments:
  - KES Currency Risk: +2%
  - Political Risk: +3%
  - Interest Rate Volatility: +2%
  - Infrastructure Risk: +1%

### Typical WACC by Sector
- Services: 16% - Most stable, predictable cash flows
- Manufacturing: 18% - Moderate risk
- Agribusiness: 20% - Weather/commodity exposure
- Retail: 20% - Thin margins, high competition
- Tech: 22% - High volatility, high growth
- Hospitality: 22%+ - Cyclical, reputation sensitive

## Database Schema

### Users
- id: Unique user identifier
- email: User email (unique)
- password: Hashed password
- name: Display name
- createdAt, updatedAt: Timestamps

### Valuations
- id: Valuation ID
- userId: Foreign key to User
- businessName, businessDescription: Business details
- sector: Business sector
- annualRevenue, ebitda, netIncome, freeCashFlow: Financial metrics
- totalAssets, totalLiabilities: Balance sheet items
- valuationType: Method used (dcf, comparable, asset-based, multiple)
- valuationValue: Final valuation result
- assumptions: JSON field storing all assumptions
- createdAt, updatedAt: Timestamps

## Scripts

```bash
# Development
npm run dev              # Start dev server

# Build & Production
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Prisma Studio (database GUI)
npm run db:generate      # Regenerate Prisma client

# Linting
npm run lint             # Run ESLint
```

## Contributing

Contributions are welcome. Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

Built for Kenya's SME ecosystem.
