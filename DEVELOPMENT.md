# Development Setup Guide

## Prerequisites

- Node.js 18+ (verify with `node -v`)
- npm 9+ (verify with `npm -v`)
- PostgreSQL (local or cloud-hosted)
- A code editor (VS Code recommended)

## Quick Start

### 1. Environment Setup

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/business_valuation_kenya"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-key-here"
# To generate a secret: openssl rand -base64 32

# Optional: Email Configuration (for notifications)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

### 2. Database Setup

If using PostgreSQL locally, ensure it's running. Then:

```bash
# Push the Prisma schema to your database
npm run db:push

# Optional: Open Prisma Studio (GUI for database)
npm run db:studio
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Workflow

### File Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication
│   │   └── valuations/           # Valuation calculations
│   ├── auth/                     # Auth pages (signin, signup)
│   ├── dashboard/                # User dashboard
│   ├── valuation/                # Valuation pages
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
├── components/                   # Reusable components
├── lib/
│   ├── valuation/                # Valuation logic
│   │   ├── dcf.ts                # DCF calculations
│   │   ├── comparable.ts         # Multiple-based valuation
│   │   ├── assetBased.ts         # Asset valuation
│   │   └── sectorData.ts         # Kenya sector profiles
│   ├── auth.ts                   # NextAuth configuration
│   └── prisma.ts                 # Prisma client singleton
├── types/                        # TypeScript definitions
└── prisma/
    └── schema.prisma             # Database schema
```

### Common Commands

```bash
# Development
npm run dev                # Start dev server (hot reload)

# Building
npm run build              # Build for production
npm start                  # Run production server
npm run lint               # Run ESLint

# Database
npm run db:push            # Sync Prisma schema to database
npm run db:studio          # Open database GUI
npm run db:generate        # Regenerate Prisma client

# Database Migrations (if using Prisma Migrate)
# npx prisma migrate dev --name description
```

## Debugging

### TypeScript Errors

If you see TypeScript errors in VS Code:

1. Run `npm run lint` to see full errors
2. Check that all imports are correct
3. Ensure Prisma client is generated: `npm run db:generate`

### Database Connection Issues

```bash
# Test your DATABASE_URL
npx prisma db execute --stdin < /dev/null

# View database connection status
npm run db:studio
```

### Build Fails

1. Clear build cache: `rm -rf .next`
2. Regenerate Prisma: `npm run db:generate`
3. Clean install: `rm -rf node_modules && npm install`

## Environment Variables

### Required (Production)
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Your application URL
- `NEXTAUTH_SECRET` - Secret key for NextAuth (must be 32+ chars)

### Optional
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` - For email notifications
- `GITHUB_ID`, `GITHUB_SECRET` - For GitHub OAuth (optional)
- `GOOGLE_ID`, `GOOGLE_SECRET` - For Google OAuth (optional)

## Database Management

### Reset Database (⚠️ Warning: Destructive)

```bash
# Push latest schema (overwrites data)
npx prisma migrate reset

# Or manually:
npx prisma db execute --stdin << EOF
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
EOF
npm run db:push
```

### Seed Database with Test Data

Create `prisma/seed.ts`:

```typescript
import prisma from "@/lib/prisma";

async function main() {
  // Add test data here
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
```

Run with: `npx prisma db seed`

## Testing Pages

### Authentication Flow
1. Go to http://localhost:3000
2. Click "Sign Up" and create an account
3. Sign in with your credentials
4. Should redirect to /dashboard

### Create a Valuation
1. From dashboard, click "Create Valuation"
2. Fill in business details
3. Select sector (e.g., "retail")
4. Enter financial metrics
5. Click "Calculate Valuation"

## Deployment Checklist

Before deploying to production:

- [ ] Set `NEXTAUTH_URL` to your production domain
- [ ] Generate new `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- [ ] Set up PostgreSQL production database
- [ ] Configure email service credentials
- [ ] Set NODE_ENV=production
- [ ] Run `npm run build` successfully
- [ ] Test all authentication flows
- [ ] Verify all API endpoints work

## Performance Tips

1. **Database Indexing**: Check `.prisma/` for generated queries
2. **Caching**: Consider adding response caching in API routes
3. **Image Optimization**: Use Next.js Image component for images
4. **Code Splitting**: Next.js handles this automatically

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `PrismaClient not found` | Run `npm run db:generate` |
| Database connection refused | Check DATABASE_URL and PostgreSQL is running |
| NextAuth redirect loop | Ensure NEXTAUTH_URL matches your domain |
| Build fails | Clear `.next` folder and rebuild |
| Styles not loading | Rebuild to regenerate Tailwind CSS |

## Additional Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

## Support & Questions

If you encounter any issues:

1. Check this guide's troubleshooting section
2. Review error messages carefully
3. Check build logs with `npm run build`
4. Open an issue with error details
