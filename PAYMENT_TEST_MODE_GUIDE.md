# Payment Test Mode Guide

## Overview

Your payment system now supports **two modes**:

### 1. 🧪 Test Mode (Development)
- **Purpose:** Test payment flow without real money or external API calls
- **Behavior:** Simulates successful payments instantly
- **Use Case:** Local development, testing, demonstrations
- **Cost:** FREE - no real transactions

### 2. 💳 Production Mode (Live)
- **Purpose:** Real payment processing with Flouci gateway
- **Behavior:** Redirects to real Flouci payment page
- **Use Case:** Production deployment with paying customers
- **Cost:** Real money transactions through Flouci

---

## Configuration

### Enable Test Mode (Current Setup)

In your `.env` file:
```env
PAYMENT_TEST_MODE=true
```

**Result:**
- ✅ Payments are simulated
- ✅ No external API calls
- ✅ No real money charged
- ✅ Instant completion
- ✅ Database updates work normally
- ✅ Great for development and testing

### Enable Production Mode

In your `.env` file:
```env
PAYMENT_TEST_MODE=false
# Also add real credentials:
FLOUCI_APP_TOKEN=your_real_flouci_token
FLOUCI_APP_SECRET=your_real_flouci_secret
```

**Result:**
- 💳 Real Flouci API calls
- 💳 Redirects to actual payment page
- 💳 Real money transactions
- 💳 Webhook notifications from Flouci
- 💳 Requires valid Flouci credentials

---

## How Test Mode Works

### Payment Flow in Test Mode:

1. **User clicks "Support Now"** on a case

2. **Backend receives payment request**
   - Creates payment record in database
   - Detects `PAYMENT_TEST_MODE=true`
   - Generates test payment ID: `test_pay_1234567890`

3. **Simulated Payment Created**
   ```
   [Payment] ⚠️  TEST MODE - Simulating payment (no real transaction)
   [Payment] ✅ Test payment created: test_pay_1234567890
   ```

4. **Auto-Completion** (Instant)
   - Payment status: `pending` → `completed`
   - Case amount updated automatically
   - No webhook needed (simulated internally)

5. **User sees success message**
   ```
   ✅ TEST MODE: Payment simulated successfully!

   Payment ID: test_pay_1234567890
   Amount: 100 TND

   This is a test payment. No real money was charged.
   ```

6. **Page refreshes** to show updated case amount

---

## Visual Indicators

### Test Mode Logs:
```
[Payment] ⚠️  TEST MODE - Simulating payment (no real transaction)
[Payment] ✅ Test payment created: test_pay_1234567890
[Payment] ⚠️  TEST MODE - Auto-completing test payment
[Payment] ✅ Test payment auto-completed and case amount updated
```

### Production Mode Logs:
```
[Payment] 💳 Production mode - calling real Flouci API
[Payment] Successfully created payment: flouci_xyz123
```

---

## Testing the Payment Flow

### Test Mode Testing:

1. **Start server:**
   ```bash
   pnpm dev
   ```
   Server runs on: http://localhost:3002/

2. **Open any case** in the browser

3. **Click "Support Now"** button

4. **Expected result:**
   - ✅ Alert shows: "TEST MODE: Payment simulated successfully!"
   - ✅ No redirect to external site
   - ✅ Case amount increases immediately
   - ✅ Payment record created in database with status "completed"

5. **Check database:**
   ```sql
   SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;
   ```
   You should see:
   - `transaction_id` starts with `test_pay_`
   - `status` = `completed`
   - `payment_method` = `flouci`

---

## Advantages of Test Mode

### For Development:
- ✅ No need for real Flouci credentials
- ✅ No internet connection required
- ✅ Instant payment completion
- ✅ No API rate limits
- ✅ No costs or fees

### For Testing:
- ✅ Test entire payment flow
- ✅ Verify database updates
- ✅ Check UI behavior
- ✅ Test error handling
- ✅ Demonstrate functionality

### For Demos:
- ✅ Show working payment system
- ✅ No risk of real charges
- ✅ Fast and reliable
- ✅ Works offline

---

## Switching to Production

When ready to accept real payments:

### Step 1: Get Flouci Credentials
1. Sign up at https://developers.flouci.com
2. Create an application
3. Get your production credentials:
   - `app_token`
   - `app_secret`
   - `webhook_secret`

### Step 2: Update Environment Variables
```env
# Disable test mode
PAYMENT_TEST_MODE=false

# Add real credentials
FLOUCI_APP_TOKEN=your_production_app_token_here
FLOUCI_APP_SECRET=your_production_app_secret_here
FLOUCI_WEBHOOK_SECRET=your_production_webhook_secret_here
FLOUCI_API_URL=https://developers.flouci.com/api/generate_payment
```

### Step 3: Configure Webhook
Set webhook URL in Flouci dashboard:
```
https://yourdomain.com/api/payments/webhook
```

Enable events:
- `payment.completed`
- `payment.failed`
- `payment.cancelled`

### Step 4: Deploy and Test
1. Deploy to production
2. Make a small test payment with real card
3. Verify webhook is received
4. Check payment status updates correctly

---

## Database Schema

Payments are stored in the `payments` table:

```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL,
  donor_id INTEGER,
  amount INTEGER NOT NULL,
  status payment_status DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'flouci',
  transaction_id VARCHAR(255),
  payment_url TEXT,
  metadata TEXT,
  error_message TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Test Payment Example:**
```
id: 3
case_id: 4
amount: 100
status: completed
payment_method: flouci
transaction_id: test_pay_1738962825123
```

**Production Payment Example:**
```
id: 4
case_id: 5
amount: 250
status: pending
payment_method: flouci
transaction_id: flouci_abc123xyz
payment_url: https://developers.flouci.com/pay/abc123
```

---

## Comparison Table

| Feature | Test Mode | Production Mode |
|---------|-----------|-----------------|
| **Real Money** | ❌ No charges | ✅ Real charges |
| **API Calls** | ❌ Simulated | ✅ Real Flouci API |
| **Credentials** | ❌ Not needed | ✅ Required |
| **Internet** | ❌ Not needed | ✅ Required |
| **Speed** | ⚡ Instant | ⏱️ Normal |
| **Payment URL** | 🔗 Local redirect | 🔗 Flouci gateway |
| **Completion** | 🤖 Automatic | 📡 Via webhook |
| **Cost** | 💰 Free | 💰 Transaction fees |
| **Use Case** | 🧪 Development | 🚀 Production |

---

## Troubleshooting

### Test Mode Not Working?

**Check `.env` file:**
```env
PAYMENT_TEST_MODE=true
```

**Restart server:**
```bash
pnpm dev
```

**Look for logs:**
```
[Payment] ⚠️  TEST MODE - Simulating payment
```

### Payment Not Completing?

**Check database:**
```sql
SELECT status FROM payments ORDER BY id DESC LIMIT 1;
```

If status is `pending`, check server logs for errors.

### Page Not Refreshing?

The frontend should show an alert and reload automatically. If not:
- Check browser console for errors
- Manually refresh the page
- Payment should still be recorded in database

---

## Summary

✅ **Current Setup:** Test Mode Enabled

**What this means:**
- All payments are simulated
- No real money charged
- No Flouci API calls needed
- Perfect for development and testing

**To use real payments:**
- Set `PAYMENT_TEST_MODE=false`
- Add real Flouci credentials
- Deploy to production
- Configure webhooks

**Questions?**
- Test mode: Great for development ✅
- Production mode: Required for real payments 💳

Your payment system is now flexible and safe for both testing and production! 🎉
