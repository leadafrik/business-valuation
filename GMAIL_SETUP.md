# Gmail Setup for ValueKE OTP Emails

## Quick Setup for Your Business Google Account

Follow these steps to enable OTP emails for your ValueKE application:

### Step 1: Enable 2-Step Verification
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Look for "2-Step Verification" in the left sidebar
3. Click on it and follow the prompts to enable 2-Step Verification
4. Choose your preferred verification method (phone, security key, etc.)

### Step 2: Generate App Password
1. Once 2-Step Verification is enabled, go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select:
   - App: **Mail**
   - Device: **Windows Computer** (or your device type)
3. Google will generate a 16-character password
4. **Copy this password** (it will have spaces, which you should remove)

### Step 3: Update .env File
Open `.env` in the project root and update:

```dotenv
SMTP_USER=your-business-email@gmail.com
SMTP_PASS=your16characterapppassword
EMAIL_FROM="ValueKE <your-business-email@gmail.com>"
```

**Example:**
```dotenv
SMTP_USER=business@company.com
SMTP_PASS=abcd efgh ijkl mnop    # Remove spaces when pasting
EMAIL_FROM="ValueKE <business@company.com>"
```

### Step 4: Restart the Application
```bash
npm run dev
```

### Step 5: Test the OTP Flow
1. Go to http://localhost:3000/auth/signup
2. Enter your email address
3. Click "Send OTP"
4. Check your email inbox for the OTP code
5. The email will come from your business Gmail account

## Gmail Limits
- **Rate Limit**: 500 emails per day for free accounts
- **OTP Validity**: 10 minutes (configured in the app)
- **Security**: App passwords are more secure than using your main Gmail password

## Troubleshooting

### Email Not Sending?
1. Check server logs for error messages (marked with `[EMAIL]`)
2. Verify the app password is correct (no spaces)
3. Ensure 2-Step Verification is enabled
4. Check that the email in `.env` matches your Google Account email

### Common Issues
- **Error**: "Username and password not accepted"
  - Solution: Generate a new App Password, ensure no spaces
  
- **Error**: "SMTP connection timeout"
  - Solution: Verify SMTP_HOST is `smtp.gmail.com`
  
- **Error**: "Email service not configured"
  - Solution: Verify all SMTP variables in `.env` are filled in

## Email Template
The OTP email includes:
- Professional branding with ValueKE logo
- Clear 6-digit OTP code
- Expiration time (10 minutes)
- Security notice
- Plain text and HTML versions for compatibility

## Security Notes
- Never commit your real Gmail password to version control
- App Passwords are safer than main account passwords
- OTPs are hashed before storage in the database
- Each user can only request 3 OTPs per 15 minutes (rate limiting)
