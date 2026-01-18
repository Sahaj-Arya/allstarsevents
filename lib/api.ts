import { mockEvents } from "./mockData";
import { fireAlert } from "./alerts";
import {
  Booking,
  CartItem,
  EventItem,
  PaymentMode,
  UserProfile,
  Ticket,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const PAYMENT_MODE = "RAZORPAY";
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

type ApiBooking = {
  _id?: string;
  id?: string;
  ticketToken: string;
  phone?: string;
  cartItems?: Array<{
    eventId?: string;
    title?: string;
    price?: number;
    quantity?: number;
    date?: string;
    time?: string;
    location?: string;
    type?: string;
    ticketIds?: string[];
  }>;
  amount?: number;
  paymentMode?: PaymentMode;
  status?: Booking["status"];
  createdAt?: string;
  tickets?: Array<{
    id: string;
    eventId?: string;
    title?: string;
    price?: number;
    date?: string;
    time?: string;
    location?: string;
    seat?: string;
    isScanned?: boolean;
    createdAt?: string;
  }>;
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
    fireAlert("error", "Failed to fetch events");
    console.warn("Falling back to mock events", err);
    return mockEvents;
  }
}

export async function fetchEventById(id: string): Promise<EventItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch event");
    return (await res.json()) as EventItem;
  } catch (err) {
    fireAlert("error", "Failed to fetch event");
    console.warn("Falling back to mock event", err);
    return (
      mockEvents.find((event) => event.id === id || event._id === id) || null
    );
  }
}

export async function fetchShareableTicket(
  token: string
): Promise<{ booking: Booking; focusTicketId: string | null } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/tickets/share/${token}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      fireAlert("error", "Failed to load shared ticket");
      return null;
    }
    const data = (await res.json()) as {
      ticket: ApiBooking;
      focusTicketId?: string | null;
    };
    if (!data?.ticket) return null;
    return {
      booking: mapBookingFromApi(data.ticket),
      focusTicketId: data.focusTicketId ?? null,
    };
  } catch (err) {
    fireAlert("error", "Failed to load shared ticket");
    console.warn("Failed to fetch shareable ticket", err);
    return null;
  }
}

export async function uploadImage(file: File): Promise<{
  id: string;
  url: string;
  path: string;
  filename: string;
  size: number;
  mime: string;
  createdAt: string;
}> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_BASE_URL}/uploads`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({} as { error?: string }));
    const message =
      res.status === 413
        ? "File too large"
        : data?.error || "Failed to upload image";
    fireAlert("error", message);
    throw new Error(message);
  }

  fireAlert("success", "Image uploaded successfully");

  return (await res.json()) as {
    id: string;
    url: string;
    path: string;
    filename: string;
    size: number;
    mime: string;
    createdAt: string;
  };
}

function mapCartItemsForApi(cartItems: CartItem[]) {
  return cartItems.map(({ event, quantity, ticketIds }) => ({
    eventId: event.id,
    title: event.title,
    price: event.price,
    quantity,
    date: event.date,
    time: event.time,
    location: event.location,
    type: event.type,
    ticketIds,
  }));
}

function mapBookingFromApi(api: ApiBooking): Booking {
  const cartItems: CartItem[] = (api.cartItems || []).map((item, idx) => ({
    event: {
      _id: item.eventId || `event-${idx + 1}`,
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
    ticketIds: item.ticketIds || [],
  }));

  return {
    id: api._id || api.id || api.ticketToken,
    cartItems,
    tickets: (api.tickets || []).map(
      (t): Ticket => ({
        id: t.id,
        eventId: t.eventId,
        title: t.title,
        price: t.price,
        date: t.date,
        time: t.time,
        location: t.location,
        seat: t.seat,
        isScanned: Boolean(t.isScanned),
        createdAt: t.createdAt,
      })
    ),
    amount: api.amount ?? 0,
    paymentMode: api.paymentMode || PAYMENT_MODE,
    status: api.status || "paid",
    ticketToken: api.ticketToken,
    createdAt: api.createdAt || new Date().toISOString(),
    phone: api.phone,
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
    fireAlert("error", data.error || "Unable to create payment order");
    throw new Error(data.error || "Unable to create payment order");
  }

  fireAlert("success", "Payment order created");

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
  amount?: number;
  cartItems?: CartItem[];
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
      amount: params.amount,
      cartItems: params.cartItems
        ? mapCartItemsForApi(params.cartItems)
        : undefined,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    fireAlert("error", data.error || "Payment verification failed");
    throw new Error(data.error || "Payment verification failed");
  }
  if (!data.booking) throw new Error("Booking not found after verification");
  fireAlert("success", "Payment verified successfully");
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
  if (!res.ok) {
    fireAlert("error", "Failed to fetch tickets");
    return [];
  }
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
  if (!res.ok) {
    fireAlert("error", "Failed to update profile");
    throw new Error("Failed to update profile");
  }
  const data = await res.json();
  fireAlert("success", "Profile updated");
  return data;
}

export async function validateTicket(ticketToken: string) {
  const res = await fetch(`${API_BASE_URL}/ticket/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: ticketToken }),
  });

  if (!res.ok) {
    fireAlert("error", "Ticket validation failed");
    return { status: "invalid" as const };
  }

  const data = await res.json();
  const alreadyScanned =
    data?.status === "already_scanned" ||
    data?.status === "scanned" ||
    data?.ticket?.isScanned === true;
  fireAlert(
    alreadyScanned ? "info" : "success",
    alreadyScanned ? "Ticket already scanned" : "Ticket scanned"
  );
  return data;
}

export async function fetchUserByPhone(phone: string) {
  if (!phone) return { user: null, error: "phone required", status: 400 };
  try {
    const res = await fetch(
      `${API_BASE_URL}/auth/user-by-phone?phone=${encodeURIComponent(phone)}`
    );
    const data = await res.json();
    if (!res.ok) {
      fireAlert("error", data.error || "Unknown error");
      return {
        user: null,
        error: data.error || "Unknown error",
        status: res.status,
      };
    }
    fireAlert("success", "User fetched");
    return { user: data.user || null, error: null, status: res.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    fireAlert("error", message);
    return { user: null, error: message, status: 500 };
  }
}
