# Payment Flow Diagram

## Before (Problem)

```
┌─────────┐                                  ┌──────────┐
│  User   │                                  │ Razorpay │
└────┬────┘                                  └─────┬────┘
     │                                             │
     │ 1. Click "Pay Now"                          │
     ├────────────────────────────────────────────►│
     │                                             │
     │ 2. Redirected to Razorpay/UPI app          │
     ◄────────────────────────────────────────────┤
     │                                             │
     │ 3. Complete payment                         │
     ├────────────────────────────────────────────►│
     │                                             │
     │ 4. User closes app ❌                       │
     │                                             │
     X (No callback received)                      │
     │                                             │
     │ ⚠️  RESULT: Payment done, but NO tickets!  │
     └─────────────────────────────────────────────┘
```

---

## After (Solution with Webhook)

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User   │    │ Frontend │    │  Backend │    │ Razorpay │
└────┬────┘    └─────┬────┘    └─────┬────┘    └─────┬────┘
     │               │               │               │
     │ 1. Click Pay  │               │               │
     ├──────────────►│               │               │
     │               │ 2. Create Order (with cart)   │
     │               ├──────────────►│               │
     │               │               │               │
     │               │ 3. Order ID   │               │
     │               ◄──────────────┤               │
     │               │               │               │
     │               │ 4. Open Razorpay with order   │
     │               ├──────────────────────────────►│
     │               │               │               │
     │ 5. Pay in UPI │               │               │
     ├──────────────────────────────────────────────►│
     │               │               │               │
     │ 6. Close app  │               │ 7. payment.captured event
     │               │               ◄──────────────┤
     X               X               │               │
                                     │               │
                 (User gone, but webhook continues)  │
                                     │               │
                                     │ 8. Verify signature
                                     │               │
                                     │ 9. Fetch order details
                                     │               │
                                     │ 10. Create booking + tickets
                                     │               │
                                     │ 11. Send SMS  │
                                     │               │
                         ✅ RESULT: Tickets created automatically!
```

---

## Detailed Flow

### Step 1: Order Creation
```
Frontend → Backend: POST /payment/create-order
{
  amount: 1000,
  cartItems: [{eventId, title, price, quantity, ...}]
}

Backend → Razorpay: Create order with notes
{
  amount: 100000,
  notes: {
    phone: "9876543210",
    cartItems: "[{...}]"  // Stored for webhook
  }
}
```

### Step 2: Payment
```
User → Razorpay: Complete payment
Razorpay → Payment captured ✅
```

### Step 3: Ticket Generation (Dual Path)

#### Path A: Frontend (if user stays)
```
Razorpay → Frontend: Payment success callback
Frontend → Backend: POST /payment/verify
Backend: 
  1. Verify signature
  2. Check if booking exists (may have been created by webhook)
  3. If not exists, create booking + tickets
  4. Return success
```

#### Path B: Webhook (always works)
```
Razorpay → Backend: POST /payment/webhook
{
  event: "payment.captured",
  payload: {payment: {...}}
}

Backend:
  1. Verify webhook signature
  2. Fetch order details from Razorpay
  3. Get cart items from order notes
  4. Find user by phone
  5. Check if booking exists
  6. If not exists, create booking + tickets
  7. Send SMS
```

---

## Duplicate Prevention

Both paths check for existing booking:

```javascript
const existingBooking = await Booking.findOne({
  razorpayPaymentId: payment_id
});

if (existingBooking) {
  return {ok: true, booking: existingBooking};
}

// Only create if doesn't exist
```

**Result:** Safe to have both paths active. Whichever runs first creates the tickets, the other returns existing booking.

---

## Timeline Example

```
00:00:00 - User clicks "Pay Now"
00:00:01 - Backend creates order with cart items in notes
00:00:02 - Razorpay opens, user redirected to UPI app
00:00:10 - User completes payment in UPI
00:00:11 - User closes browser ❌
00:00:12 - Razorpay sends webhook to backend ✅
00:00:13 - Backend verifies signature ✅
00:00:14 - Backend fetches order, gets cart items ✅
00:00:15 - Backend creates booking + 2 tickets ✅
00:00:16 - SMS sent to user ✅
```

**Key:** Entire process completes even though user closed app at 00:00:11!

---

## What Gets Stored in Order Notes

```json
{
  "order_id": "order_xyz789",
  "amount": 100000,
  "notes": {
    "phone": "9876543210",
    "cartItems": "[{\"eventId\":\"evt123\",\"title\":\"Concert\",\"price\":500,\"quantity\":2}]"
  }
}
```

**Why?** Webhook needs this data to recreate tickets since user context is lost.

---

## Security Flow

```
Razorpay Webhook Request
    ↓
Contains: x-razorpay-signature header
    ↓
Backend: Calculate expected signature
    HMAC-SHA256(request_body, webhook_secret)
    ↓
Compare signatures
    ↓
Match? ✅ Process webhook
Mismatch? ❌ Return 400 error
```

---

## Error Handling

### Scenario 1: User stays on page
- Frontend callback: Creates tickets ✅
- Webhook arrives: Sees existing booking, skips creation ✅
- **Result:** 1 booking, N tickets ✅

### Scenario 2: User closes app
- Frontend callback: Never fires ❌
- Webhook arrives: Creates tickets ✅
- **Result:** 1 booking, N tickets ✅

### Scenario 3: Both happen
- Frontend callback: Creates tickets ✅
- Webhook arrives: Duplicate check, returns existing ✅
- **Result:** 1 booking, N tickets (no duplicates) ✅

---

## Monitoring

Check webhook status:
```
Razorpay Dashboard → Webhooks → Your webhook → Deliveries

Look for:
✅ 200 OK - Success
❌ 400 Bad Request - Signature mismatch
❌ 500 Error - Server error
⏱️ Timeout - Server not reachable
```

Server logs:
```
✅ "Webhook received: payment.captured"
✅ "Webhook: Created 2 tickets for booking 507f..."
✅ "Already processed" (if duplicate)
❌ "Invalid signature"
❌ "User not found"
```
