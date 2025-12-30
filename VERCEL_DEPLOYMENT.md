# Deploy ValueKE to Vercel

## Prerequisites
- Vercel account (free at https://vercel.com)
- GitHub account with the repository connected
- All environment variables configured in `.env`

## Step 1: Push Code to GitHub

```bash
git remote -v  # Check if GitHub remote is set
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Deploy from Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Select your GitHub repository (Business Valuation)
4. Click **"Import"**
5. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./ (default)
   - **Build Command**: `npm run build`
   - **Output Directory**: .next (default)

### Step 3: Set Environment Variables

In the Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

```
DATABASE_URL=your_neon_db_url
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-project.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-business-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=ValueKE <your-business-email@gmail.com>
```

**Important**: Change `NEXTAUTH_URL` to your actual Vercel domain after first deployment.

### Step 4: Deploy

1. After adding environment variables, click **"Deploy"**
2. Wait for build to complete (usually 2-5 minutes)
3. Your app will be live at `https://your-project.vercel.app`

## Option B: Deploy from Command Line (CLI)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
# ... add other variables

# Redeploy with environment variables
vercel --prod
```

## Verify Deployment

1. Visit your Vercel URL
2. Test the signup flow:
   - Go to `/auth/signup`
   - Enter test email
   - Check email for OTP
   - Complete signup flow
3. Check server logs in Vercel dashboard for any errors

## Post-Deployment Checklist

- [ ] Update `NEXTAUTH_URL` to your Vercel domain
- [ ] Test signup with OTP email
- [ ] Test signin flow
- [ ] Verify database connection
- [ ] Check email sending (review logs)
- [ ] Test PDF generation (if applicable)
- [ ] Update DNS/domain if using custom domain

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all dependencies are in package.json
- Run `npm run build` locally to test

### Database Connection Error
- Verify DATABASE_URL is correct
- Check Neon database is accessible
- Ensure allowlist includes Vercel IPs

### OTP Emails Not Sending
- Verify SMTP credentials in environment variables
- Check Gmail app password is correct
- Review function logs in Vercel dashboard
- Look for [EMAIL] error messages in logs

### Static Files Not Loading
- Check next.config.js configuration
- Verify public/ folder exists
- Clear Vercel cache and redeploy

## Viewing Logs

In Vercel Dashboard:
1. Select your project
2. Go to **Deployments**
3. Click latest deployment
4. View **Logs** tab to see:
   - Build logs
   - Function logs (API routes)
   - Runtime errors

## Redeploying

```bash
# Simple redeploy
vercel --prod

# After changing environment variables
vercel env pull  # Pull current variables
vercel --prod    # Redeploy
```

## Custom Domain (Optional)

1. In Vercel project settings, go to **Domains**
2. Add your custom domain
3. Update DNS records according to Vercel instructions
4. Update `NEXTAUTH_URL` to your custom domain

## Performance Optimization

Vercel automatically includes:
- ✓ Edge caching
- ✓ Image optimization
- ✓ Automatic scaling
- ✓ DDoS protection
- ✓ Global CDN

## Support

- Vercel Documentation: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Contact Vercel Support: https://vercel.com/support

---

**After deployment, your ValueKE application will be live and accessible globally!**
