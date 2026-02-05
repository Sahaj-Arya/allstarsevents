# Razorpay Webhook Setup Guide

## Problem Solved
When users complete payment in UPI apps and close the web-app, the payment succeeds but tickets are not generated. This webhook implementation ensures tickets are automatically created when Razorpay confirms payment, regardless of whether the user's browser is still open.

## How It Works

### Payment Flow
1. **User initiates checkout** → Backend creates a Razorpay order with cart items stored in order notes
2. **User pays** → Razorpay processes the payment
3. **Two paths for ticket creation:**
   - **Path A (Frontend):** If user stays on the page, frontend `handler` callback triggers `/payment/verify` endpoint
   - **Path B (Webhook):** Razorpay sends `payment.captured` event to `/payment/webhook` endpoint (works even if user closed the app)
4. **Duplicate prevention:** Both paths check if booking already exists before creating tickets

## Setup Instructions

### 1. Add Webhook Secret to Environment Variables

Add this to your `.env` file:
```bash
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_from_razorpay_dashboard
```

### 2. Configure Webhook in Razorpay Dashboard

1. Log into [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **Webhooks**
3. Click **Create New Webhook**
4. Configure:
   - **Webhook URL:** `https://yourdomain.com/payment/webhook`
     - For local testing with ngrok: `https://your-ngrok-url.ngrok.io/payment/webhook`
   - **Alert Email:** Your email for webhook failures
   - **Active Events:** Select `payment.captured`
   - **Secret:** Copy this value and add it to your `.env` as `RAZORPAY_WEBHOOK_SECRET`
5. Click **Create Webhook**

### 3. Local Testing with ngrok

For testing webhooks locally:

```bash
# Install ngrok
npm install -g ngrok

# Start your API server
cd api
npm start

# In another terminal, expose your local server
ngrok http 3001

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Use this URL in Razorpay dashboard: https://abc123.ngrok.io/payment/webhook
```

## Testing the Webhook

### Test Payment Flow
1. Create a test payment on your app
2. Complete payment in Razorpay/UPI
3. **Close the browser immediately** after payment
4. Check your server logs for: `"Webhook: Created X tickets for booking..."`
5. Verify in database that booking and tickets were created
6. User should receive SMS with ticket link

### Webhook Logs
The webhook logs important events:
```javascript
// Success
"Webhook received: payment.captured"
"Webhook: Created 2 tickets for booking 507f1f77bcf86cd799439011"

// Already processed
"Booking already exists for payment: pay_abc123"

// Errors
"Invalid webhook signature" // Wrong RAZORPAY_WEBHOOK_SECRET
"Missing phone or cart items in order notes" // Order creation issue
```

## Security Features

1. **Signature Verification:** All webhook requests are verified using HMAC SHA256
2. **Duplicate Prevention:** Checks for existing bookings before creating new ones
3. **No Authentication Required:** Webhook endpoint bypasses JWT auth (uses signature instead)

## Troubleshooting

### Webhook Not Triggering
- Verify webhook URL is publicly accessible (not localhost)
- Check Razorpay dashboard for webhook delivery logs
- Ensure `payment.captured` event is selected

### Signature Mismatch
- Verify `RAZORPAY_WEBHOOK_SECRET` matches the secret in Razorpay dashboard
- Don't modify the request body before signature verification

### Missing Cart Items
- Ensure frontend is sending `cartItems` in `/payment/create-order` request
- Check order notes in Razorpay dashboard contain `cartItems` JSON

### Duplicate Tickets
- Both webhook and frontend verification check for existing bookings
- Safe to have both active - only one will create the tickets

## API Endpoints

### POST `/payment/webhook`
**Purpose:** Razorpay webhook endpoint for automatic ticket generation

**Authentication:** Webhook signature verification (no JWT required)

**Request Body:** (Sent by Razorpay)
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_abc123",
        "order_id": "order_xyz789",
        "amount": 100000,
        "status": "captured"
      }
    }
  }
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Webhook processed"
}
```

## Files Modified

1. **`api/src/controllers/paymentController.js`**
   - Added `handleWebhook` function
   - Added duplicate check in `verifyPayment`
   - Store cart items in order notes

2. **`api/src/routes/paymentRoutes.js`**
   - Added `/webhook` route (before auth middleware)

3. **`api/src/app.js`**
   - Added raw body parser for webhook signature verification

4. **`api/.env.example`**
   - Added `RAZORPAY_WEBHOOK_SECRET` variable

## Production Checklist

- [ ] Add `RAZORPAY_WEBHOOK_SECRET` to production environment variables
- [ ] Configure webhook in Razorpay dashboard with production URL
- [ ] Test payment flow with closing browser
- [ ] Monitor webhook logs for errors
- [ ] Set up alerts for failed webhook deliveries
