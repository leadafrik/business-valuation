# Email Configuration Guide

## Current Status
The Business Valuation Tool has email functionality built in but requires SMTP configuration to work.

## What's Needed

To enable the email feature (sending valuation PDFs), you need SMTP credentials. Here are your options:

### Option 1: Gmail (Free & Recommended for Testing)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  (NOT your regular password)
EMAIL_FROM=your-email@gmail.com
```

**Setup Steps:**
1. Enable 2-Factor Authentication on your Google account
2. Go to myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer"
4. Google will generate a 16-character password
5. Use that 16-character password as SMTP_PASS

### Option 2: SendGrid (Production Recommended)
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

### Option 3: AWS SES
```
SMTP_HOST=email-smtp.region.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-iam-username
SMTP_PASS=your-iam-password
EMAIL_FROM=verified-sender@yourdomain.com
```

### Option 4: Other SMTP Service
Contact your email provider for SMTP credentials.

## How to Configure

1. **Update .env file:**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

2. **Restart the application:**
   ```bash
   npm run dev
   ```

3. **Test email feature:**
   - Create a valuation
   - Go to Results page
   - Click "Email PDF" button
   - Enter recipient email
   - Should receive the PDF in seconds

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `SMTP_HOST` | SMTP server hostname | Yes |
| `SMTP_PORT` | SMTP port (usually 587 or 465) | Yes |
| `SMTP_USER` | SMTP username/email | Yes |
| `SMTP_PASS` | SMTP password (use app-specific for Gmail) | Yes |
| `SMTP_SECURE` | Use TLS encryption (true/false) | No (default: false) |
| `EMAIL_FROM` | Sender email address | No (default: noreply@valueke.com) |

## Current Implementation

**Email endpoints:**
- Sends professionally formatted emails with PDF attachments
- Rate limited to 5 emails per user per hour
- Includes sender name, valuation summary, and usage guidance
- Beautiful HTML template with scenario breakdown

**Features:**
- ✅ OTP emails for authentication
- ✅ Valuation PDF delivery
- ✅ Professional HTML template
- ✅ Rate limiting protection
- ✅ Error handling with user feedback

## What to Do Now

Choose one of the options above and provide the SMTP credentials. I'll update the `.env` file and test the email delivery.

If you want to skip email for now and do it later, just let me know!
