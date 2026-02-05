# Razorpay Dashboard Configuration

## Step-by-Step Guide

### 1. Login to Razorpay Dashboard
- Go to: https://dashboard.razorpay.com/
- Login with your credentials
- Switch to **Test Mode** for testing (toggle in top-right)

### 2. Navigate to Webhooks
```
Dashboard → Settings (⚙️ icon) → Webhooks
```

### 3. Create New Webhook
Click the **"+ New Webhook"** button

### 4. Configure Webhook Settings

#### A. Webhook URL
```
Production: https://your-domain.com/payment/webhook
Development: https://your-ngrok-url.ngrok.io/payment/webhook
```

**Important:**
- URL must be publicly accessible
- Must use HTTPS (not HTTP)
- Don't use localhost directly

#### B. Active Events
Select **only** these events:
- ☑️ `payment.captured` - Triggered when payment is successfully captured

**Why this event?**
- `payment.captured` fires when payment is confirmed by Razorpay
- This is the most reliable event for generating tickets
- Fires regardless of whether user's browser is open

#### C. Alert Email
Enter your email to receive alerts if webhook fails

#### D. Secret
After creating, Razorpay will show a **Webhook Secret**
- Copy this secret
- Add to your `.env` file as `RAZORPAY_WEBHOOK_SECRET`

**Example:**
```bash
RAZORPAY_WEBHOOK_SECRET=whsec_abc123xyz789...
```

### 5. Save Webhook
Click **"Create Webhook"** or **"Save"**

### 6. Verify Webhook Status
After saving, you should see:
- ✅ Status: **Active**
- URL: Your webhook endpoint
- Events: `payment.captured`

---

## Testing Your Webhook

### Method 1: Test Button (Razorpay Dashboard)
1. Click on your webhook in the list
2. Click **"Send Test Webhook"**
3. Select `payment.captured` event
4. Click **"Send"**
5. Check your server logs

### Method 2: Real Payment Flow
1. Create a test payment on your app
2. Use Razorpay test card numbers:
   - Card: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date
3. Complete payment
4. Close browser immediately
5. Check server logs for: `"Webhook: Created X tickets"`

### Method 3: Local Testing with ngrok
```bash
# Terminal 1: Start API
cd api
npm start

# Terminal 2: Start ngrok
ngrok http 3001

# Copy ngrok URL (e.g., https://abc123.ngrok.io)
# Use this in Razorpay dashboard: https://abc123.ngrok.io/payment/webhook
```

---

## Webhook Logs in Razorpay

### Viewing Webhook Deliveries
```
Dashboard → Settings → Webhooks → Click your webhook → Deliveries tab
```

### What to Look For:
- ✅ **200 OK** - Webhook processed successfully
- ❌ **400 Bad Request** - Signature verification failed
- ❌ **500 Internal Server Error** - Server error (check your logs)
- ⏱️ **Timeout** - Webhook URL not accessible

### Troubleshooting Failed Deliveries
1. Click on a failed delivery to see details
2. Check the response body for error message
3. Common issues:
   - Wrong webhook secret → Update `.env`
   - URL not accessible → Check server/firewall
   - Missing cart items → Check order creation

---

## Security Checklist

- [ ] Webhook URL uses HTTPS (not HTTP)
- [ ] `RAZORPAY_WEBHOOK_SECRET` is set in `.env`
- [ ] Webhook secret matches Razorpay dashboard
- [ ] Only `payment.captured` event is enabled
- [ ] Test webhook delivery before going live
- [ ] Monitor webhook logs regularly

---

## Production Deployment Checklist

### Before Going Live:
- [ ] Add production webhook URL to Razorpay (Live Mode)
- [ ] Set `RAZORPAY_WEBHOOK_SECRET` in production environment
- [ ] Test with real small-amount payment
- [ ] Verify tickets are created when browser is closed
- [ ] Check SMS notification is sent
- [ ] Monitor webhook delivery logs

### After Going Live:
- [ ] Set up alerts for failed webhooks
- [ ] Monitor webhook success rate daily
- [ ] Keep webhook secret secure (don't commit to git)
- [ ] Document webhook URL for team reference

---

## Common Issues & Solutions

### Issue: "Invalid signature"
**Solution:** 
- Verify `RAZORPAY_WEBHOOK_SECRET` matches dashboard
- Check no spaces/newlines in the secret
- Restart server after updating `.env`

### Issue: "URL not accessible"
**Solution:**
- For local testing, use ngrok
- For production, ensure server is running and accessible
- Check firewall/security group settings

### Issue: "No cart items in order notes"
**Solution:**
- Verify frontend is sending `cartItems` in `/payment/create-order`
- Check backend is storing them in order notes
- Test order creation first before testing webhook

### Issue: Webhook not triggering
**Solution:**
- Verify webhook is **Active** in dashboard
- Check `payment.captured` event is selected
- Test with "Send Test Webhook" button
- Check server logs for incoming requests

---

## Support

If you encounter issues:
1. Check Razorpay webhook delivery logs
2. Check your server application logs
3. Review [WEBHOOK_SETUP.md](WEBHOOK_SETUP.md) for detailed troubleshooting
4. Contact Razorpay support: https://razorpay.com/support/
