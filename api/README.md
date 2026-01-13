# AllStars API (Node/Express)

Standalone backend for AllStars events.

## Stack

- Node.js + Express (ESM)
- MongoDB (db: allstarsdev)
- Razorpay (test keys via env)
- Controllers / Routes / Schemas

## Endpoints

- POST /auth/send-otp — { phone }
- POST /auth/verify-otp — { phone, otp, requestId, name?, email? }
- POST /payment/create-order — { amount, userPhone, cartItems?, paymentMode }
- POST /payment/verify — Razorpay signature verification
- GET /tickets?phone=... — list tickets for a phone
- GET /health

### Frontend wiring (Next.js)

- Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000` in the frontend `.env.local`.
- Auth: call `/auth/send-otp` then `/auth/verify-otp` with `phone`, `otp`, `requestId` (optionally `name`, `email`). `BYPASS_OTP`/`STATIC_OTP` env flags allow local skip/fixed codes.
- Tickets: call `/tickets?phone={phone}` after auth to fetch bookings for that user.
- Payments: post to `/payment/create-order` with `paymentMode: "MOCK"` to bypass Razorpay, or `"RAZORPAY"` to create an order and then confirm via `/payment/verify` using the Razorpay signature fields.

## Env

Copy `.env.example` to `.env` and set values:

```
PORT=4000
MONGO_URI="mongodb+srv://sahaj:Foodfood1@@allstars.l7yk0hy.mongodb.net/allstarsdev?retryWrites=true&w=majority"
RAZORPAY_KEY_ID="rzp_test_xxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxx"
BYPASS_OTP=false
STATIC_OTP=000000
```

## Scripts

- npm run dev — nodemon
- npm start — prod

## Notes

- OTP is dev-friendly (console logs code, supports BYPASS_OTP/STATIC_OTP).
- Razorpay mode requires test keys; MOCK mode returns paid booking immediately.
