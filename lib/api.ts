import { fireAlert } from "./alerts";
import {
  AdminTicketListItem,
  AttendanceRecord,
  AttendanceRosterRow,
  ClassDayAttendanceSession,
  Booking,
  CartItem,
  EventItem,
  HomeSettings,
  PaymentMode,
  UserProfile,
  Ticket,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.prod.allstarsstudio.in";
const PAYMENT_MODE = "RAZORPAY";
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
export const HOME_SETTINGS_SYNC_KEY = "allstars:home-settings";

type ApiBooking = {
  _id?: string;
  id?: string;
  ticketToken: string;
  phone?: string;
  cartItems?: Array<{
    eventId?: string;
    title?: string;
    photo?: string;
    price?: number;
    quantity?: number;
    date?: string;
    time?: string;
    location?: string;
    venue?: string;
    placename?: string;
    type?: string;
    sessionDate?: string;
    bookingType?: string;
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
    photo?: string;
    price?: number;
    date?: string;
    time?: string;
    location?: string;
    venue?: string;
    placename?: string;
    seat?: string;
    sessionDate?: string;
    bookingType?: string;
    isScanned?: boolean;
    scannedAt?: string;
    createdAt?: string;
  }>;
};

export function getPaymentMode(): PaymentMode {
  return PAYMENT_MODE;
}

export function getRazorpayKey() {
  return RAZORPAY_KEY_ID;
}

export function readCachedHomeSettings(): HomeSettings | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(HOME_SETTINGS_SYNC_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as HomeSettings;
  } catch {
    return null;
  }
}

export function cacheHomeSettings(settings: HomeSettings) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(HOME_SETTINGS_SYNC_KEY, JSON.stringify(settings));
    window.dispatchEvent(
      new CustomEvent("allstars:home-settings-updated", { detail: settings }),
    );
  } catch {
    // Ignore storage failures.
  }
}

export async function fetchEvents(): Promise<EventItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/events`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch events");
    return (await res.json()) as EventItem[];
  } catch (err) {
    fireAlert("error", "Failed to fetch events");
    console.warn("Failed to fetch events", err);
    return [];
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
    console.warn("Failed to fetch event", err);
    return null;
  }
}

export async function fetchHomeSettings(): Promise<HomeSettings | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/home-settings`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch home settings");
    const settings = (await res.json()) as HomeSettings;
    cacheHomeSettings(settings);
    return settings;
  } catch (err) {
    console.warn("Failed to fetch home settings", err);
    return null;
  }
}

export async function updateHomeSettings(
  payload: Partial<HomeSettings>,
): Promise<HomeSettings> {
  const res = await fetch(`${API_BASE_URL}/home-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}) as { error?: string });
  if (!res.ok) {
    const message = data?.error || "Failed to update home settings";
    fireAlert("error", message);
    throw new Error(message);
  }
  cacheHomeSettings(data as HomeSettings);
  fireAlert("success", "Home settings updated");
  return data as HomeSettings;
}

export async function fetchShareableTicket(
  token: string,
): Promise<{ booking: Booking; focusTicketId: string | null } | null> {
  try {
    const normalizedToken = String(token || "")
      .trim()
      .replace(/^\{+|\}+$/g, "");

    const res = await fetch(
      `${API_BASE_URL}/tickets/share/${encodeURIComponent(normalizedToken)}`,
      {
        cache: "no-store",
      },
    );
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
    const data = await res.json().catch(() => ({}) as { error?: string });
    const message =
      res.status === 413
        ? "File too large"
        : data?.error || "Failed to upload media";
    fireAlert("error", message);
    throw new Error(message);
  }

  fireAlert("success", "Media uploaded successfully");

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

export async function createEvent(payload: {
  id: string;
  title: string;
  description?: string;
  price: number;
  original_price?: number;
  drop_in_price?: number;
  photo?: string;
  images?: string[];
  media?: string[];
  placename?: string;
  venue?: string;
  category?: string;
  date: string;
  time: string;
  location: string;
  type?: EventItem["type"];
  repeat?: EventItem["repeat"];
  isActive?: boolean;
  about?: EventItem["about"];
}): Promise<EventItem> {
  const res = await fetch(`${API_BASE_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}) as { error?: string });
  if (!res.ok) {
    const message = data?.error || "Failed to create event";
    fireAlert("error", message);
    throw new Error(message);
  }
  fireAlert("success", "Event created");
  return data as EventItem;
}

export async function updateEvent(
  id: string,
  payload: Partial<EventItem>,
): Promise<EventItem> {
  const res = await fetch(`${API_BASE_URL}/events/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}) as { error?: string });
  if (!res.ok) {
    const message = data?.error || "Failed to update event";
    fireAlert("error", message);
    throw new Error(message);
  }
  fireAlert("success", "Event updated");
  return data as EventItem;
}

export async function deleteEvent(
  id: string,
): Promise<{ ok: boolean; id?: string }> {
  const res = await fetch(`${API_BASE_URL}/events/${id}`, {
    method: "DELETE",
  });
  const data = await res
    .json()
    .catch(() => ({}) as { error?: string; ok?: boolean; id?: string });
  if (!res.ok) {
    const message = data?.error || "Failed to delete event";
    fireAlert("error", message);
    throw new Error(message);
  }
  fireAlert("success", "Event deleted");
  return { ok: Boolean(data?.ok), id: data?.id };
}

export async function fetchTicketsByPhoneAdmin(
  phone: string,
): Promise<Booking[]> {
  if (!phone) return [];
  const res = await fetch(
    `${API_BASE_URL}/tickets/search?phone=${encodeURIComponent(phone)}`,
  );
  if (!res.ok) {
    fireAlert("error", "Failed to fetch tickets");
    return [];
  }
  const data = await res.json().catch(() => ({}));
  const tickets: ApiBooking[] = data.tickets || [];
  return tickets.map(mapBookingFromApi);
}

export async function fetchTicketByTokenAdmin(token: string): Promise<{
  booking: Booking | null;
  focusTicketId: string | null;
}> {
  if (!token) return { booking: null, focusTicketId: null };
  const res = await fetch(
    `${API_BASE_URL}/tickets/search?token=${encodeURIComponent(token)}`,
  );
  if (!res.ok) {
    fireAlert("error", "Failed to fetch ticket");
    return { booking: null, focusTicketId: null };
  }
  const data = (await res.json().catch(() => ({}))) as {
    ticket?: ApiBooking;
    focusTicketId?: string | null;
  };
  if (!data.ticket) return { booking: null, focusTicketId: null };
  return {
    booking: mapBookingFromApi(data.ticket),
    focusTicketId: data.focusTicketId ?? null,
  };
}

export async function fetchAllTicketsAdmin(
  page = 1,
  limit = 200,
  options?: { eventId?: string },
): Promise<{
  tickets: AdminTicketListItem[];
  total: number;
  page: number;
  limit: number;
}> {
  const search = new URLSearchParams();
  search.set("page", String(page));
  search.set("limit", String(limit));
  if (options?.eventId) search.set("eventId", options.eventId);

  const res = await fetch(`${API_BASE_URL}/tickets/list?${search.toString()}`);
  if (!res.ok) {
    fireAlert("error", "Failed to fetch tickets list");
    return { tickets: [], total: 0, page, limit };
  }
  const data = await res.json().catch(() => ({}));
  return {
    tickets: data.tickets || [],
    total: data.total || 0,
    page: data.page || page,
    limit: data.limit || limit,
  };
}

export async function fetchAttendanceHistoryAdmin(params?: {
  page?: number;
  limit?: number;
  eventId?: string;
  eventType?: "event" | "workshop" | "class";
  bookingType?: "monthly" | "drop_in";
  sessionDate?: string;
  userPhone?: string;
}): Promise<{
  records: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
}> {
  const search = new URLSearchParams();
  search.set("page", String(params?.page || 1));
  search.set("limit", String(params?.limit || 200));
  if (params?.eventId) search.set("eventId", params.eventId);
  if (params?.eventType) search.set("eventType", params.eventType);
  if (params?.bookingType) search.set("bookingType", params.bookingType);
  if (params?.sessionDate) search.set("sessionDate", params.sessionDate);
  if (params?.userPhone) search.set("userPhone", params.userPhone);

  const res = await fetch(
    `${API_BASE_URL}/tickets/attendance?${search.toString()}`,
  );
  if (!res.ok) {
    fireAlert("error", "Failed to fetch attendance history");
    return { records: [], total: 0, page: 1, limit: 200 };
  }
  const data = await res.json().catch(() => ({}));
  return {
    records: data.records || [],
    total: data.total || 0,
    page: data.page || 1,
    limit: data.limit || 200,
  };
}

export async function fetchAttendanceRosterAdmin(params: {
  eventId: string;
  sessionDate?: string;
  bookingType?: "monthly" | "drop_in";
}): Promise<{
  eventId: string;
  sessionDate?: string;
  total: number;
  presentCount: number;
  absentCount: number;
  rows: AttendanceRosterRow[];
}> {
  const search = new URLSearchParams();
  search.set("eventId", params.eventId);
  if (params.sessionDate) search.set("sessionDate", params.sessionDate);
  if (params.bookingType) search.set("bookingType", params.bookingType);

  const res = await fetch(
    `${API_BASE_URL}/tickets/attendance-roster?${search.toString()}`,
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    fireAlert("error", data?.error || "Failed to fetch attendance roster");
    return {
      eventId: params.eventId,
      sessionDate: params.sessionDate,
      total: 0,
      presentCount: 0,
      absentCount: 0,
      rows: [],
    };
  }
  const data = await res.json().catch(() => ({}));
  return {
    eventId: data.eventId || params.eventId,
    sessionDate: data.sessionDate || params.sessionDate,
    total: data.total || 0,
    presentCount: data.presentCount || 0,
    absentCount: data.absentCount || 0,
    rows: data.rows || [],
  };
}

export async function fetchClassAttendanceByDayAdmin(day: string): Promise<{
  day: string;
  sessionCount: number;
  totals: {
    total: number;
    present: number;
    absent: number;
    dropInTotal: number;
    dropInPresent: number;
    dropInAbsent: number;
  };
  sessions: ClassDayAttendanceSession[];
}> {
  const search = new URLSearchParams();
  if (day) search.set("date", day);

  const res = await fetch(
    `${API_BASE_URL}/tickets/attendance/classes-by-day?${search.toString()}`,
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    fireAlert("error", data?.error || "Failed to fetch class attendance");
    return {
      day,
      sessionCount: 0,
      totals: {
        total: 0,
        present: 0,
        absent: 0,
        dropInTotal: 0,
        dropInPresent: 0,
        dropInAbsent: 0,
      },
      sessions: [],
    };
  }

  const data = await res.json().catch(() => ({}));
  return {
    day: data.day || day,
    sessionCount: data.sessionCount || 0,
    totals: data.totals || {
      total: 0,
      present: 0,
      absent: 0,
      dropInTotal: 0,
      dropInPresent: 0,
      dropInAbsent: 0,
    },
    sessions: data.sessions || [],
  };
}

function mapCartItemsForApi(cartItems: CartItem[]) {
  return cartItems.map(
    ({ event, quantity, ticketIds, sessionDate, bookingType }) => ({
      eventId: event.id,
      title: event.title,
      price: event.price,
      quantity,
      date: event.date,
      time: event.time,
      location: event.location,
      venue: event.venue,
      placename: event.placename,
      type: event.type,
      ticketIds,
      sessionDate: sessionDate || "",
      bookingType: bookingType || "monthly",
    }),
  );
}

function mapBookingFromApi(api: ApiBooking): Booking {
  const cartItems: CartItem[] = (api.cartItems || []).map((item, idx) => ({
    event: {
      _id: item.eventId || `event-${idx + 1}`,
      id: item.eventId || `event-${idx + 1}`,
      title: item.title || "Ticket",
      description: "",
      price: item.price || 0,
      photo: item.photo || "",
      date: item.date || "",
      time: item.time || "",
      location: item.location || "",
      venue: item.venue || "",
      placename: item.placename || "",
      type: (item.type as EventItem["type"]) || "event",
    },
    quantity: item.quantity || 1,
    ticketIds: item.ticketIds || [],
    sessionDate: item.sessionDate || undefined,
    bookingType: (item.bookingType === "drop_in" ? "drop_in" : "monthly") as
      | "monthly"
      | "drop_in",
  }));

  return {
    id: api._id || api.id || api.ticketToken,
    cartItems,
    tickets: (api.tickets || []).map(
      (t): Ticket => ({
        id: t.id,
        eventId: t.eventId,
        title: t.title,
        photo: t.photo,
        price: t.price,
        date: t.date,
        time: t.time,
        location: t.location,
        venue: t.venue,
        placename: t.placename,
        seat: t.seat,
        sessionDate: t.sessionDate,
        bookingType: (t.bookingType === "drop_in" ? "drop_in" : "monthly") as
          | "monthly"
          | "drop_in",
        isScanned: Boolean(t.isScanned),
        scannedAt: t.scannedAt,
        createdAt: t.createdAt,
      }),
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
  paymentMode: PaymentMode,
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
  const booking = mapBookingFromApi(data.booking);
  if (Array.isArray(data.tickets) && data.tickets.length > 0) {
    booking.tickets = data.tickets.map(
      (t: {
        _id?: string;
        id?: string;
        eventId?: string;
        title?: string;
        photo?: string;
        price?: number;
        date?: string;
        time?: string;
        location?: string;
        seat?: string;
        sessionDate?: string;
        bookingType?: string;
        isScanned?: boolean;
        createdAt?: string;
      }) => ({
        id: t._id || t.id || "",
        eventId: t.eventId,
        title: t.title,
        photo: t.photo,
        price: t.price,
        date: t.date,
        time: t.time,
        location: t.location,
        seat: t.seat,
        sessionDate: t.sessionDate,
        bookingType: (t.bookingType === "drop_in" ? "drop_in" : "monthly") as
          | "monthly"
          | "drop_in",
        isScanned: Boolean(t.isScanned),
        createdAt: t.createdAt,
      }),
    );
  }
  return booking;
}

export async function fetchTickets(
  token?: string,
  phone?: string,
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
  update: { name?: string; email?: string },
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

export async function validateTicket(
  ticketToken: string,
  scanCategory:
    | "any"
    | "event"
    | "workshop"
    | "class"
    | "drop_in_class" = "any",
  targetEventId?: string,
  targetSessionDate?: string,
) {
  const normalizeToken = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    try {
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        const url = new URL(trimmed);
        const byQuery =
          url.searchParams.get("token") || url.searchParams.get("id");
        if (byQuery) return byQuery;
        const match = url.pathname.match(/\/ticket\/([^/]+)$/);
        if (match?.[1]) return match[1];
        const parts = url.pathname.split("/").filter(Boolean);
        return parts[parts.length - 1] || trimmed;
      }
    } catch {
      // fall through to regex parsing
    }

    const pathMatch = trimmed.match(/\/ticket\/([^/?#]+)/);
    if (pathMatch?.[1]) return pathMatch[1];
    const queryMatch = trimmed.match(/[?&](token|id)=([^&]+)/);
    if (queryMatch?.[2]) return queryMatch[2];
    return trimmed;
  };

  const normalizedToken = normalizeToken(ticketToken);
  const res = await fetch(`${API_BASE_URL}/ticket/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: normalizedToken,
      scanCategory,
      targetEventId: targetEventId || "",
      targetSessionDate: targetSessionDate || "",
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    fireAlert("error", data?.error || "Ticket validation failed");
    return { status: "invalid" as const, error: data?.error };
  }

  const data = await res.json();
  const alreadyScanned =
    data?.status === "already_scanned" ||
    data?.status === "scanned" ||
    data?.ticket?.isScanned === true;
  fireAlert(
    alreadyScanned ? "info" : "success",
    alreadyScanned ? "Ticket already scanned" : "Ticket scanned",
  );
  return data;
}

export async function fetchUserByPhone(
  phone: string,
  options?: { silent?: boolean },
) {
  if (!phone) return { user: null, error: "phone required", status: 400 };
  const silent = Boolean(options?.silent);
  try {
    const res = await fetch(
      `${API_BASE_URL}/auth/user-by-phone?phone=${encodeURIComponent(phone)}`,
    );
    const data = await res.json();
    if (!res.ok) {
      if (!silent) {
        fireAlert("error", data.error || "Unknown error");
      }
      return {
        user: null,
        error: data.error || "Unknown error",
        status: res.status,
      };
    }
    // fireAlert("success", "User fetched");
    return { user: data.user || null, error: null, status: res.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    if (!silent) {
      fireAlert("error", message);
    }
    return { user: null, error: message, status: 500 };
  }
}
