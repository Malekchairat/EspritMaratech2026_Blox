# Payment Testing Guide - Flousi Integration

This guide will help you test the payment functionality in your application using the Flousi payment gateway.

## Table of Contents

- [Setup](#setup)
- [Environment Configuration](#environment-configuration)
- [Testing Methods](#testing-methods)
- [Webhook Testing](#webhook-testing)
- [Automated Tests](#automated-tests)
- [Common Issues](#common-issues)

## Setup

### 1. Environment Configuration

Add the following variables to your `.env` file:

```env
# Flousi Payment Gateway
FLOUSI_API_KEY=sandbox
FLOUSI_API_URL=https://sandbox.flousi.tn/api/v1/payments
FLOUSI_WEBHOOK_SECRET=your-webhook-secret-here
```

### 2. Database Migration

The payment system includes a new `payments` table for tracking payment transactions. Run the database migration:

```bash
pnpm db:push
```

This will create the following table:
- `payments` - Stores payment records with status tracking
- Adds `payment_status` enum: pending, completed, failed, cancelled, refunded

## Testing Methods

### Method 1: Manual UI Testing

1. **Start the Development Server**
   ```bash
   pnpm dev
   ```

2. **Navigate to a Case**
   - Open http://localhost:3000
   - Click on any case to view its details
   - Scroll to the "Support Case" section

3. **Initiate Payment**
   - Click the "Support Now" button
   - You should see a loading state: "Processing..."
   - If successful, you'll be redirected to Flousi's payment page
   - If there's an error, you'll see an error message with details

4. **Test Error Scenarios**
   - Try with invalid amounts
   - Test with network disconnected
   - Verify error messages are user-friendly

### Method 2: API Testing with Postman/Insomnia

#### Create Payment Request

```http
POST http://localhost:3000/api/payments/flousi
Content-Type: application/json

{
  "amount": 100,
  "description": "Test donation for Case #1",
  "redirectUrl": "http://localhost:3000/case/1",
  "metadata": {
    "caseId": 1,
    "donorId": 1
  }
}
```

**Expected Success Response:**
```json
{
  "payment_id": "pay_abc123",
  "payment_url": "https://sandbox.flousi.tn/pay/abc123",
  "amount": 100,
  "status": "pending",
  "created_at": "2026-02-07T10:30:00Z",
  "paymentRecordId": 1
}
```

**Expected Error Response (Invalid Amount):**
```json
{
  "error": "Payment amount must be greater than 0",
  "code": "INVALID_AMOUNT"
}
```

#### Test Error Scenarios

**1. Invalid Amount:**
```json
{
  "amount": 0,
  "description": "Test",
  "redirectUrl": "http://localhost:3000/case/1",
  "metadata": { "caseId": 1 }
}
```

**2. Missing Case ID:**
```json
{
  "amount": 100,
  "description": "Test",
  "redirectUrl": "http://localhost:3000/case/1",
  "metadata": {}
}
```

**3. Non-existent Case:**
```json
{
  "amount": 100,
  "description": "Test",
  "redirectUrl": "http://localhost:3000/case/1",
  "metadata": { "caseId": 99999 }
}
```

### Method 3: Automated Testing

Run the automated test suite:

```bash
# Run all tests
pnpm test

# Run payment tests specifically
pnpm test payment

# Run tests in watch mode
pnpm test --watch
```

The test suite covers:
- ✅ Successful payment creation
- ✅ Invalid amount validation (zero and negative)
- ✅ Empty description validation
- ✅ 401 Unauthorized error handling
- ✅ 400 Bad Request error handling
- ✅ 429 Rate Limit error handling
- ✅ 500 Service Error handling
- ✅ Network error handling
- ✅ Unknown error handling
- ✅ Payment status retrieval
- ✅ Webhook signature verification

## Webhook Testing

### Local Webhook Testing with ngrok

1. **Install ngrok**
   ```bash
   npm install -g ngrok
   ```

2. **Start Your Server**
   ```bash
   pnpm dev
   ```

3. **Expose Your Local Server**
   ```bash
   ngrok http 3000
   ```

4. **Configure Webhook URL in Flousi Dashboard**
   - Go to your Flousi dashboard
   - Set webhook URL to: `https://YOUR-NGROK-URL/api/payments/webhook`
   - Copy the webhook secret and add it to your `.env` file

5. **Test Webhook Events**

   Use curl to simulate webhook events:

   **Payment Completed:**
   ```bash
   curl -X POST http://localhost:3000/api/payments/webhook \
     -H "Content-Type: application/json" \
     -H "X-Flousi-Signature: YOUR_SIGNATURE" \
     -d '{
       "type": "payment.completed",
       "data": {
         "payment_id": "pay_123456",
         "amount": 100,
         "metadata": {
           "caseId": 1,
           "paymentId": 1
         }
       }
     }'
   ```

   **Payment Failed:**
   ```bash
   curl -X POST http://localhost:3000/api/payments/webhook \
     -H "Content-Type: application/json" \
     -H "X-Flousi-Signature: YOUR_SIGNATURE" \
     -d '{
       "type": "payment.failed",
       "data": {
         "payment_id": "pay_123456",
         "error_message": "Card declined"
       }
     }'
   ```

### Generate Webhook Signature

To generate a valid webhook signature for testing:

```javascript
const crypto = require('crypto');

const payload = JSON.stringify({
  type: "payment.completed",
  data: {
    payment_id: "pay_123456",
    amount: 100
  }
});

const secret = "your-webhook-secret-here";
const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

console.log('Signature:', signature);
```

## Database Inspection

### View Payment Records

You can inspect payment records in your database:

```sql
-- View all payments
SELECT * FROM payments ORDER BY created_at DESC;

-- View payments for a specific case
SELECT * FROM payments WHERE case_id = 1;

-- View payment status distribution
SELECT status, COUNT(*) as count FROM payments GROUP BY status;

-- View recent completed payments
SELECT p.*, c.title as case_title
FROM payments p
JOIN cases c ON p.case_id = c.id
WHERE p.status = 'completed'
ORDER BY p.completed_at DESC
LIMIT 10;
```

## Payment Flow Diagram

```
┌──────────┐
│  User    │
│  Clicks  │
│  Donate  │
└────┬─────┘
     │
     v
┌──────────────────────────┐
│  Frontend (CaseDetail)   │
│  - Validates form        │
│  - Calls payment API     │
└────────┬─────────────────┘
         │
         v
┌──────────────────────────┐
│  Backend API Endpoint    │
│  /api/payments/flousi    │
│  - Creates payment record│
│  - Calls Flousi API      │
│  - Returns payment URL   │
└────────┬─────────────────┘
         │
         v
┌──────────────────────────┐
│  Flousi Payment Gateway  │
│  - User enters card info │
│  - Processes payment     │
│  - Sends webhook         │
└────────┬─────────────────┘
         │
         v
┌──────────────────────────┐
│  Webhook Endpoint        │
│  /api/payments/webhook   │
│  - Updates payment status│
│  - Updates case amount   │
│  - Creates donation      │
└──────────────────────────┘
```

## Common Issues

### Issue 1: "Payment service temporarily unavailable"

**Cause:** Flousi API is down or unreachable

**Solution:**
- Check your internet connection
- Verify FLOUSI_API_URL is correct
- Check Flousi service status
- Try again in a few minutes

### Issue 2: "Invalid API key or unauthorized access"

**Cause:** Invalid or missing FLOUSI_API_KEY

**Solution:**
- Verify FLOUSI_API_KEY is set in `.env`
- For sandbox testing, use: `FLOUSI_API_KEY=sandbox`
- For production, get your API key from Flousi dashboard

### Issue 3: Webhook signature verification fails

**Cause:** Incorrect webhook secret

**Solution:**
- Verify FLOUSI_WEBHOOK_SECRET matches your Flousi dashboard
- Regenerate webhook secret if needed
- Test signature generation with the provided script

### Issue 4: Payment created but case amount not updated

**Cause:** Webhook not processed correctly

**Solution:**
- Check server logs for webhook errors
- Verify webhook endpoint is accessible (use ngrok for local testing)
- Check payment status in database manually
- Manually trigger webhook event for testing

### Issue 5: "Missing required fields: amount and caseId are required"

**Cause:** Frontend not sending required metadata

**Solution:**
- Verify `metadata.caseId` is included in the payment request
- Check that the case exists in the database
- Ensure the frontend is passing the correct case ID

## Test Checklist

Before deploying to production, verify:

- [ ] Environment variables are set correctly
- [ ] Database migration completed successfully
- [ ] All automated tests pass (`pnpm test`)
- [ ] Manual payment flow works end-to-end
- [ ] Error messages are user-friendly
- [ ] Webhook endpoint is accessible and working
- [ ] Payment status updates correctly in database
- [ ] Case amount updates after successful payment
- [ ] Donation records are created correctly
- [ ] Payment tracking is working in admin dashboard

## Production Deployment

When moving to production:

1. **Update Environment Variables**
   ```env
   FLOUSI_API_KEY=your_production_api_key
   FLOUSI_API_URL=https://api.flousi.tn/api/v1/payments
   FLOUSI_WEBHOOK_SECRET=your_production_webhook_secret
   ```

2. **Configure Production Webhook**
   - Set webhook URL to: `https://yourdomain.com/api/payments/webhook`
   - Enable webhook events: payment.completed, payment.failed, payment.cancelled

3. **Test in Production**
   - Make a real payment with a test card
   - Verify webhook is received and processed
   - Check payment and case records are updated correctly

## Support

If you encounter issues:
- Check server logs for detailed error messages
- Review payment records in database
- Test webhook signature generation
- Verify API credentials with Flousi support

For Flousi API documentation: https://docs.flousi.tn
