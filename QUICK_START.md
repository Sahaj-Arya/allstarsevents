# 🚀 Quick Start Guide

## Problem
Users complete payment but close the app → No tickets generated ❌

## Solution
Razorpay webhook automatically creates tickets server-side ✅

---

## Setup (5 minutes)

### 1. Add to `.env`:
```bash
RAZORPAY_WEBHOOK_SECRET=your_secret_from_razorpay_dashboard
```

### 2. Razorpay Dashboard:
1. Go to: https://dashboard.razorpay.com/app/webhooks
2. Click "Create New Webhook"
3. URL: `https://yourdomain.com/payment/webhook`
4. Event: Select `payment.captured`
5. Copy the webhook secret → add to `.env`

### 3. Test:
```bash
# Local testing with ngrok
ngrok http 3001

# Use ngrok URL in Razorpay:
# https://your-id.ngrok.io/payment/webhook
```

---

## How It Works

```
Payment → Razorpay confirms → Webhook fires → Tickets created
(Works even if user closed the app!)
```

---

## Test the Fix

1. Make a payment
2. **Close browser immediately**
3. Wait 5 seconds
4. Check: Tickets should still be created ✅

---

## Files Changed

- ✅ `api/src/controllers/paymentController.js` - Added webhook handler
- ✅ `api/src/routes/paymentRoutes.js` - Added webhook route
- ✅ `api/src/app.js` - Added raw body parser

---

## Verify It's Working

Check server logs for:
```
"Webhook received: payment.captured"
"Webhook: Created 2 tickets for booking 507f..."
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid signature" | Check `RAZORPAY_WEBHOOK_SECRET` in `.env` |
| Webhook not triggering | Use ngrok for local testing |
| Duplicate tickets | Both frontend & webhook have duplicate protection ✅ |

---

## Documentation

- 📖 Full guide: [WEBHOOK_SETUP.md](WEBHOOK_SETUP.md)
- 🎯 Dashboard guide: [RAZORPAY_DASHBOARD_GUIDE.md](RAZORPAY_DASHBOARD_GUIDE.md)
- 📝 Summary: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

---

## Test Scripts

```bash
# Test webhook signature
node api/test-webhook-signature.js

# Test integration
node api/test-webhook-integration.js
```

---

## ✨ Benefits

- ✅ Tickets generated even if app is closed
- ✅ No lost payments
- ✅ Automatic SMS notification
- ✅ Reliable payment processing
