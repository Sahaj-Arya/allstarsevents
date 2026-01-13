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

type ApiBooking = {
  _id?: string;
  id?: string;
  ticketToken: string;
  cartItems?: Array<{
    eventId?: string;
    title?: string;
    price?: number;
    quantity?: number;
    date?: string;
    time?: string;
    location?: string;
    type?: string;
  }>;
  amount?: number;
  paymentMode?: PaymentMode;
  status?: Booking["status"];
  createdAt?: string;
};

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

function mapCartItemsForApi(cartItems: CartItem[]) {
  return cartItems.map(({ event, quantity }) => ({
    eventId: event.id,
    title: event.title,
    price: event.price,
    quantity,
    date: event.date,
    time: event.time,
    location: event.location,
    type: event.type,
  }));
}

function mapBookingFromApi(api: ApiBooking): Booking {
  const cartItems: CartItem[] = (api.cartItems || []).map((item, idx) => ({
    event: {
      id: item.eventId || `event-${idx + 1}`,
      title: item.title || "Ticket",
      description: "",
      price: item.price || 0,
      photo: "",
      date: item.date || "",
      time: item.time || "",
      location: item.location || "",
      type: (item.type as EventItem["type"]) || "event",
    },
    quantity: item.quantity || 1,
  }));

  return {
    id: api._id || api.id || api.ticketToken,
    cartItems,
    amount: api.amount ?? 0,
    paymentMode: api.paymentMode || PAYMENT_MODE,
    status: api.status || "paid",
    ticketToken: api.ticketToken,
    createdAt: api.createdAt || new Date().toISOString(),
    phone: (api as any).phone,
  };
}

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createPaymentOrder(
  amount: number,
  profile: UserProfile,
  cartItems: CartItem[],
  paymentMode: PaymentMode
) {
  const res = await fetch(`${API_BASE_URL}/payment/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(profile.token),
    } as Record<string, string>,
    body: JSON.stringify({
      amount,
      userPhone: profile.phone,
      cartItems: mapCartItemsForApi(cartItems),
      paymentMode,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error || "Unable to create payment order");
  }

  return {
    orderId: data.order?.id || data.orderId || data.razorpayOrderId,
    amount: data.order?.amount || Math.round(amount * 100),
    currency: data.order?.currency || "INR",
    booking: data.booking ? mapBookingFromApi(data.booking) : undefined,
  };
}

export async function verifyPayment(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  token?: string;
}): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/payment/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(params.token),
    } as Record<string, string>,
    body: JSON.stringify({
      razorpay_order_id: params.razorpayOrderId,
      razorpay_payment_id: params.razorpayPaymentId,
      razorpay_signature: params.razorpaySignature,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error)
    throw new Error(data.error || "Payment verification failed");
  if (!data.booking) throw new Error("Booking not found after verification");
  return mapBookingFromApi(data.booking);
}

export async function fetchTickets(
  token?: string,
  phone?: string
): Promise<Booking[]> {
  if (!token && !phone) return [];
  const url = token
    ? `${API_BASE_URL}/tickets`
    : `${API_BASE_URL}/tickets?phone=${encodeURIComponent(phone || "")}`;
  const res = await fetch(url, { headers: authHeaders(token) });
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  const tickets: ApiBooking[] = data.tickets || [];
  return tickets.map(mapBookingFromApi);
}

export async function updateProfileApi(
  token: string,
  update: { name?: string; email?: string }
) {
  const res = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  const data = await res.json();
  return data;
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

export async function fetchUserByPhone(phone: string) {
  if (!phone) return null;
  const res = await fetch(
    `${API_BASE_URL}/auth/user-by-phone?phone=${encodeURIComponent(phone)}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.user || null;
}
