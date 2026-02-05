# Webhook Payment Flow - Complete Implementation

## ✅ What's Implemented

### Scenario 1: User Stays on App (Frontend Callback)
1. User clicks "Pay Now"
2. Payment succeeds
3. Frontend receives callback → calls `/payment/verify`
4. **Result:** Booking created, Tickets created, SMS sent ✅

### Scenario 2: User Closes App After Payment (Webhook)
1. User clicks "Pay Now"
2. Payment succeeds in Razorpay
3. User closes browser/app ❌
4. Razorpay sends webhook to `/payment/webhook`
5. **Steps executed:**
   - ✅ 1️⃣ Signature verified
   - ✅ 2️⃣ Event parsed (payment.captured)
   - ✅ 3️⃣ Payment captured logged
   - ✅ 4️⃣ Order fetched from Razorpay
   - ✅ 5️⃣ Cart items parsed from order notes
   - ✅ 6️⃣ User found by ID or phone
   - ✅ 7️⃣ Booking created with status "paid"
   - ✅ 8️⃣ Tickets created for each item in cart
   - ✅ 9️⃣ SMS sent with ticket link
6. **Result:** Booking created, Tickets created, SMS sent ✅

### Scenario 3: User Reopens App to Check Booking
1. User has already paid and closed app
2. Webhook already created booking + tickets
3. User opens app and goes to profile
4. **Checks for existing booking:**
   - Query by `razorpayPaymentId` (unique per payment)
   - If exists → show existing booking ✅
   - If not exists → error ❌

## 🔒 Duplicate Prevention

Both paths check for existing booking:
```javascript
const existingBooking = await Booking.findOne({
  razorpayPaymentId: paymentId
});

if (existingBooking) {
  return { ok: true, booking: existingBooking, tickets: [...] };
}
```

**Result:** Safe to call both paths. Whichever runs first creates the booking, the other returns existing. ✅

## 📋 Complete Flow Checklist

✅ Order creation stores:
  - userId
  - phone
  - cartItems (as JSON string)

✅ Webhook fetches order and extracts:
  - userId (to find user)
  - phone (backup user lookup)
  - cartItems (to create tickets)

✅ Creates booking with:
  - user
  - phone
  - amount
  - status = "paid"
  - ticketToken
  - razorpayOrderId
  - razorpayPaymentId (unique identifier)

✅ Creates tickets:
  - For each cartItem
  - With correct event, price, date, time, location
  - Links to booking

✅ Sends SMS:
  - To user phone
  - With ticket token
  - User can click to view tickets

✅ Logs all steps:
  - 1️⃣-9️⃣ numbered progress
  - Payment details logged
  - Booking ID logged
  - Ticket count logged
  - SMS confirmation logged

## 🧪 Testing Instructions

### Test 1: Webhook After Closing App
1. Go to checkout
2. Make payment
3. Close browser immediately
4. Wait 10 seconds
5. Check server logs for: `✅ ✨ SUCCESS: Payment ... processed`
6. User should have received SMS ✅

### Test 2: Reopen App to Check Booking
1. After webhook completes, open app
2. Go to Profile/Bookings
3. Query by razorpayPaymentId
4. Should show existing booking with tickets ✅
5. Should NOT allow rebooking ✅

### Test 3: Frontend Callback Still Works
1. Make payment and stay on page
2. Frontend callback should process
3. Check if duplicate (should see "Already processed by webhook") ✅

## 🔍 Debug Logs to Look For

```
📨 WEBHOOK RECEIVED: 2026-02-05T10:30:45Z
1️⃣  Signature header received: abc123...
🔐 Signature Verification Debug: { received: "...", expected: "...", match: true }
2️⃣  ✅ Signature verified! Event type: payment.captured
3️⃣  💳 Payment captured: { orderId: "order_123", paymentId: "pay_456", amount: 1000 }
📊 Payment Log: pay_456 | ₹1000 | Order: order_123 | Time: 2026-02-05T10:30:45Z
4️⃣  📦 Order fetched from Razorpay: order_123
5️⃣  🛒 Cart items parsed: 2 item(s)
6️⃣  👤 User found: 9876543210 ID: 507f1f77...
7️⃣  📝 Booking created: 507f1f77bcf86cd799439011
💾 Payment Record: PayID=pay_456 | Phone=9876543210 | Amount=₹1000 | Booking=507f1f77...
8️⃣  ✅ Created 2 ticket(s) for booking 507f1f77bcf86cd799439011
9️⃣  📱 SMS sent to: 9876543210
✨ SUCCESS: Payment pay_456 processed | 2 tickets created | SMS sent
================================================================================
```

## ⚠️ Potential Issues & Fixes

### Issue: "Invalid signature"
- **Fix:** Verify `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard secret exactly

### Issue: "User not found"
- **Fix:** Ensure order notes have `phone` field when creating order

### Issue: "Missing phone or cart items"
- **Fix:** Check that `createOrder` properly stores notes

### Issue: No SMS sent
- **Fix:** Verify SMS service is working (check `/utils/otp.js`)

## 🚀 Deployment Checklist

- [ ] Deploy latest code
- [ ] Set `RAZORPAY_WEBHOOK_SECRET` in .env
- [ ] Restart API server
- [ ] Test with real payment
- [ ] Close browser after payment
- [ ] Check logs for success message
- [ ] Verify SMS received
- [ ] Reopen app and check booking shows tickets
