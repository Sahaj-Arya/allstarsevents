# All Stars Customer Frontend (Next.js App Router)

Runs independently from admin and API.

## Quickstart

```bash
cd apps/frontend
npm install
cp .env.example .env.local   # set API base + payment mode
npm run dev
```

## Environment

- NEXT_PUBLIC_API_BASE_URL — Express API URL
- NEXT_PUBLIC_PAYMENT_MODE — MOCK (default) or RAZORPAY
- NEXT_PUBLIC_RAZORPAY_KEY_ID — required only in RAZORPAY mode
- ADMIN_PASSWORD — admin UI password (server-side)
- ADMIN_SESSION_KEY — session cookie value for admin auth

## Key Pages

- / — Landing with events/classes list and add-to-cart
- /cart — Multi-item cart
- /checkout — Attendee info + Razorpay or mock checkout
- /ticket/[token] — Ticket with QR code
- /profile — Tickets list + OTP login link
- /auth/login — OTP UI (frontend side)
- /admin/login — Admin password screen
- /admin/validate — Token paste screen hitting /ticket/validate

## Notes

- Works end-to-end in MOCK mode with no Razorpay keys.
- Admin/check-in lives separately in apps/admin.
- Backend endpoints are in services/api; set NEXT_PUBLIC_API_BASE_URL accordingly.

# allstarsevents
