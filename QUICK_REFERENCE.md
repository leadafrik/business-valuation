# 🚀 Quick Reference Card

## Project: Business Valuation Tool for Kenya

---

## ⚡ Get Started in 3 Steps

### 1️⃣ Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your PostgreSQL connection
```

### 2️⃣ Database Setup
```bash
npm run db:push
```

### 3️⃣ Start Development
```bash
npm run dev
# Open http://localhost:3000
```

---

## 📝 Key Files

| File | Purpose |
|------|---------|
| `README.md` | User documentation & features |
| `DEVELOPMENT.md` | Setup & development guide |
| `PROJECT_SUMMARY.md` | Project overview & status |
| `API_DOCUMENTATION.md` | API endpoints & examples |
| `src/lib/valuation/dcf.ts` | DCF calculations |
| `src/lib/valuation/comparable.ts` | Multiple valuations |
| `src/lib/valuation/sectorData.ts` | Kenya sector profiles |
| `prisma/schema.prisma` | Database schema |

---

## 🔐 Authentication Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/signup` | POST | Register user |
| `/api/auth/signin` | POST | Login (via NextAuth) |
| `/api/auth/signout` | POST | Logout (via NextAuth) |
| `/api/auth/session` | GET | Get current session |

---

## 💰 Valuation Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/valuations` | POST | Create new valuation |
| `/api/valuations` | GET | Get user's valuations |

---

## 🌍 Sectors (Use Exact Strings)

```javascript
const SECTORS = [
  "retail",        // Retail & Wholesale (28% WACC)
  "hospitality",   // Hotels, Restaurants (34%+ WACC)
  "agribusiness",  // Farming, Agritech (28% WACC)
  "tech",          // SaaS, Fintech (32% WACC)
  "manufacturing", // Industrial (24% WACC)
  "services"       // Consulting, Professional (20% WACC)
];
```

---

## 📊 Valuation Methods Supported

1. **DCF** - Discounted Cash Flow (40% weight)
2. **Comparable Revenue** - Revenue multiples (20% weight)
3. **Comparable EBITDA** - EBITDA multiples (20% weight)
4. **Asset-Based** - Net asset value (20% weight)

---

## 💾 Database Models

```javascript
// User - Authentication
{
  id: String,
  email: String (unique),
  password: String (hashed),
  name: String,
  createdAt: DateTime,
  updatedAt: DateTime
}

// Valuation - Results
{
  id: String,
  userId: String,
  businessName: String,
  sector: String,
  annualRevenue: Float,
  ebitda: Float,
  valuationValue: Float,
  assumptions: JSON,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

---

## 🛠️ Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Run production build

# Database
npm run db:push          # Sync schema
npm run db:studio        # Open database GUI
npm run db:generate      # Regenerate Prisma client

# Code Quality
npm run lint             # Run ESLint
```

---

## 🧮 Default Discount Rates (WACC) by Sector

```
Services:       20%  ✓ (Most stable)
Manufacturing:  24%
Agribusiness:   28%
Retail:         28%
Tech:           32%  
Hospitality:    34%+ (Most risky)
```

---

## 📋 Valuation Formula Quick Reference

### DCF
$$PV = \sum_{t=1}^{5} \frac{FCF_t}{(1.32)^t} + \frac{FCF_6}{0.32-0.04} \times \frac{1}{(1.32)^5}$$

### Comparable (Revenue)
$$EV = Annual\ Revenue \times Multiple$$

### Comparable (EBITDA)
$$EV = EBITDA \times Multiple$$

### Asset-Based
$$NAV = Assets - Liabilities$$

---

## 🔒 Security Notes

✅ Passwords hashed with bcryptjs  
✅ JWT session tokens  
✅ Protected API routes  
✅ CSRF protection built-in  
✅ SQL injection prevented (Prisma)  

⚠️ Set `NEXTAUTH_SECRET` to 32+ random characters  
⚠️ Use HTTPS in production  
⚠️ Implement rate limiting  

---

## 🧪 Test Data for Development

### Retail Shop
```
Name: Mama's Supermarket
Sector: retail
Revenue: 15,000,000
EBITDA: 2,250,000
Assets: 5,000,000
Liabilities: 1,000,000
Expected Value: ~4M-6M KES
```

### Tech Startup
```
Name: FinTech Platform
Sector: tech
Revenue: 80,000,000
EBITDA: 24,000,000
FCF: 20,000,000
Expected Value: ~150M-300M KES
```

### Manufacturing
```
Name: Widget Factory
Sector: manufacturing
Revenue: 200,000,000
EBITDA: 40,000,000
Assets: 100,000,000
Liabilities: 40,000,000
Expected Value: ~180M-350M KES
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Database won't connect | Check `DATABASE_URL` in `.env.local` |
| Prisma client not found | Run `npm run db:generate` |
| Build fails | Clear `.next` folder, run `npm run build` |
| Port 3000 in use | Change with `npm run dev -- -p 3001` |
| Auth not working | Verify `NEXTAUTH_SECRET` is set |

---

## 📚 Documentation Files

- **README.md** - Start here for features overview
- **DEVELOPMENT.md** - Setup and development guide
- **PROJECT_SUMMARY.md** - Complete project status
- **API_DOCUMENTATION.md** - All API endpoints & examples
- **API_DOCUMENTATION.md** - Example curl requests

---

## 🎯 Project Checklist

- [x] Next.js scaffolding
- [x] TypeScript setup
- [x] Database schema (Prisma)
- [x] Authentication system
- [x] User registration & login
- [x] DCF calculation engine
- [x] Comparable valuation
- [x] Asset-based valuation
- [x] Kenya sector profiles
- [x] API endpoints (POST/GET)
- [x] Dashboard pages
- [x] Valuation form
- [ ] PDF report generation (Next)
- [ ] Charts/visualizations (Next)
- [ ] Email notifications (Next)
- [ ] Comparison tool (Next)

---

## 🚀 Deployment Checklist

Before going live:

- [ ] `NEXTAUTH_SECRET` set to secure random value
- [ ] `NEXTAUTH_URL` set to your domain
- [ ] PostgreSQL production database configured
- [ ] `NODE_ENV=production`
- [ ] Run `npm run build` successfully
- [ ] Test all auth flows
- [ ] Test valuation calculation
- [ ] Set up monitoring/logging
- [ ] Configure CORS for your domain
- [ ] HTTPS enabled
- [ ] Backups configured

---

## 📞 Quick Support

| Need | Location |
|------|----------|
| Setup help | `DEVELOPMENT.md` |
| Feature docs | `README.md` |
| API details | `API_DOCUMENTATION.md` |
| Calculation logic | `src/lib/valuation/*.ts` |
| Type definitions | `src/types/index.ts` |
| Sector data | `src/lib/valuation/sectorData.ts` |

---

## 💡 Pro Tips

1. **Test signup flow first**: Visit http://localhost:3000, sign up, verify session
2. **Check database**: Use `npm run db:studio` to view data visually
3. **Valuation examples**: Try different sectors to see how risk adjusts
4. **API testing**: Use curl or Postman with examples from API_DOCUMENTATION.md
5. **Code organization**: Valuation logic is in `src/lib/valuation/` directory

---

## 🎉 You're Ready!

Your business valuation tool is fully scaffolded and ready for development.

**Next steps:**
1. Set up `.env.local`
2. Run `npm run db:push`
3. Run `npm run dev`
4. Test the signup flow
5. Create a sample valuation
6. Build additional features!

---

**Built with Next.js 14 | TypeScript | PostgreSQL | Tailwind CSS | NextAuth.js**

🇰🇪 **For Kenya's SMEs** 🇰🇪
