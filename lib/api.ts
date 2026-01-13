import { mockEvents } from "./mockData";
import {
  Booking,
  CartItem,
  EventItem,
  PaymentMode,
  UserProfile,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const PAYMENT_MODE =
  (process.env.NEXT_PUBLIC_PAYMENT_MODE as PaymentMode) || "MOCK";
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

export function getPaymentMode(): PaymentMode {
  return PAYMENT_MODE;
}

export function getRazorpayKey() {
  return RAZORPAY_KEY_ID;
}

export async function fetchEvents(): Promise<EventItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/events`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch events");
    return (await res.json()) as EventItem[];
  } catch (err) {
    console.warn("Falling back to mock events", err);
    return mockEvents;
  }
}

export async function createPaymentOrder(amount: number, profile: UserProfile) {
  if (PAYMENT_MODE === "MOCK") {
    const orderId = `mock_${crypto.randomUUID()}`;
    return { orderId, amount, currency: "INR" };
  }

  const res = await fetch(`${API_BASE_URL}/payment/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency: "INR", customer: profile }),
  });

  if (!res.ok) throw new Error("Unable to create payment order");
  return res.json();
}

export async function verifyPayment(params: {
  orderId: string;
  paymentId?: string;
  signature?: string;
  cartItems: CartItem[];
  amount: number;
  profile: UserProfile;
}): Promise<Booking> {
  if (PAYMENT_MODE === "MOCK") {
    const booking: Booking = {
      id: params.orderId,
      cartItems: params.cartItems,
      amount: params.amount,
      paymentMode: "MOCK",
      status: "paid",
      ticketToken: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    return booking;
  }

  const res = await fetch(`${API_BASE_URL}/payment/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) throw new Error("Payment verification failed");
  return res.json();
}

export async function validateTicket(ticketToken: string) {
  const res = await fetch(`${API_BASE_URL}/ticket/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: ticketToken }),
  });

  if (!res.ok) {
    return { status: "invalid" as const };
  }

  return res.json();
}
