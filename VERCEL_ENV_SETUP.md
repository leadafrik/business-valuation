# URGENT: Set Environment Variables in Vercel

Your app is deployed but OTP emails aren't working because **environment variables are not configured in Vercel**.

## Required Environment Variables for Vercel

Go to: **Vercel Dashboard → business-valuation → Settings → Environment Variables**

Add these variables **exactly as shown**:

### 1. Database Configuration
```
DATABASE_URL = postgresql://neondb_owner:npg_OmZS8Abh1IqH@ep-blue-grass-ab840vni-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 2. Authentication
```
NEXTAUTH_SECRET = supersecret-key-valueke-2024-development-only
NEXTAUTH_URL = https://business-valuation-sand.vercel.app
```
(Replace the URL with your actual Vercel domain)

### 3. Gmail SMTP Configuration
```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_SECURE = false
SMTP_USER = info@agrisoko254ke.com
SMTP_PASS = ozzheduccutvqitg
EMAIL_FROM = ValueKE <info@agrisoko254ke.com>
```

## Step-by-Step Instructions:

1. **Open Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Click on your "business-valuation" project

2. **Go to Settings**
   - Click the **"Settings"** tab
   - Click **"Environment Variables"** in the left menu

3. **Add Each Variable**
   - Click **"Add New"** button
   - Enter the variable name (e.g., `DATABASE_URL`)
   - Enter the value
   - Select which environments: **Production, Preview, Development**
   - Click **"Save"**

4. **Repeat for all 9 variables** (listed above)

5. **Redeploy**
   - Go to **Deployments** tab
   - Click the **"..."** menu on the latest deployment
   - Select **"Redeploy"**
   - Wait for deployment to complete

## Verify It Works

1. Visit your Vercel URL: https://business-valuation-sand.vercel.app
2. Go to `/auth/signup`
3. Enter your test email
4. Click "Send OTP"
5. **Check your email inbox** for the OTP code
6. If you receive the email, it's working! ✅

## Troubleshooting

**Still no email?**
1. Check Vercel deployment logs for errors
2. Verify all SMTP variables are entered correctly
3. Check Gmail spam folder
4. Verify the Gmail app password is correct (remove spaces if any)

**Email credentials issue?**
- Verify SMTP_USER email is correct: `info@agrisoko254ke.com`
- Verify SMTP_PASS: `ozzheduccutvqitg` (no spaces)
- If expired, regenerate at https://myaccount.google.com/apppasswords

---

**This is the final step to make OTP emails work in production!** 🎯
