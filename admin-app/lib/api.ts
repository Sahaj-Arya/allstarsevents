import { API_BASE_URL } from "../constants/Config";
import { AdminTicketListItem, Booking, EventItem, Ticket } from "./types";

export async function validateTicket(ticketToken: string) {
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
      // ignore
    }

    const pathMatch = trimmed.match(/\/ticket\/([^/?#]+)/);
    if (pathMatch?.[1]) return pathMatch[1];
    const queryMatch = trimmed.match(/[?&](token|id)=([^&]+)/);
    if (queryMatch?.[2]) return queryMatch[2];
    return trimmed;
  };

  const normalizedToken = normalizeToken(ticketToken);

  try {
    const res = await fetch(`${API_BASE_URL}/ticket/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: normalizedToken }),
    });

    if (!res.ok) {
      return { status: "error", error: "Ticket validation failed" };
    }

    const data = await res.json();
    return data;
  } catch (err) {
    return { status: "error", error: "Network error" };
  }
}

export async function uploadImage(file: {
  uri: string;
  name: string;
  type: string;
}): Promise<{
  id: string;
  url: string;
  path: string;
  filename: string;
  size: number;
  mime: string;
  createdAt: string;
}> {
  const formData = new FormData();
  formData.append("image", file as any);

  const res = await fetch(`${API_BASE_URL}/uploads`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Upload failed" }));
    const message =
      res.status === 413 ? "File too large" : data?.error || "Upload failed";
    throw new Error(message);
  }

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
  isActive?: boolean;
  about?: EventItem["about"];
}): Promise<EventItem> {
  const res = await fetch(`${API_BASE_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({ error: "Failed to create" }));
  if (!res.ok) {
    throw new Error(data?.error || "Failed to create event");
  }
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
  const data = await res.json().catch(() => ({ error: "Failed to update" }));
  if (!res.ok) {
    throw new Error(data?.error || "Failed to update event");
  }
  return data as EventItem;
}

export async function fetchTicketsByPhoneAdmin(
  phone: string,
): Promise<Booking[]> {
  if (!phone) return [];
  const res = await fetch(
    `${API_BASE_URL}/tickets/search?phone=${encodeURIComponent(phone)}`,
  );
  if (!res.ok) {
    throw new Error("Failed to fetch tickets");
  }
  const data = await res.json().catch(() => ({}));
  const tickets = (data.tickets || []) as ApiBooking[];
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
    throw new Error("Failed to fetch ticket");
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
): Promise<{
  tickets: AdminTicketListItem[];
  total: number;
  page: number;
  limit: number;
}> {
  const res = await fetch(
    `${API_BASE_URL}/tickets/list?page=${page}&limit=${limit}`,
  );
  if (!res.ok) {
    throw new Error("Failed to fetch tickets list");
  }
  const data = await res.json().catch(() => ({}));
  return {
    tickets: data.tickets || [],
    total: data.total || 0,
    page: data.page || page,
    limit: data.limit || limit,
  };
}

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
  paymentMode?: "RAZORPAY" | "MOCK";
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
    scannedAt?: string;
    createdAt?: string;
    user?: {
      name?: string;
      phone?: string;
      email?: string;
    };
  }>;
};

function mapBookingFromApi(booking: ApiBooking): Booking {
  return {
    id: booking.id || booking._id || "",
    cartItems:
      booking.cartItems?.map((item) => ({
        event: {
          _id: item.eventId || null,
          id: item.eventId || "",
          title: item.title || "",
          description: "",
          price: item.price || 0,
          photo: "",
          date: item.date || "",
          time: item.time || "",
          location: item.location || "",
          type: (item.type as EventItem["type"]) || "event",
        },
        quantity: item.quantity || 0,
        ticketIds: item.ticketIds || [],
      })) || [],
    tickets:
      booking.tickets?.map((t) => ({
        id: t.id,
        eventId: t.eventId,
        title: t.title,
        price: t.price,
        date: t.date,
        time: t.time,
        location: t.location,
        seat: t.seat,
        isScanned: !!t.isScanned,
        scannedAt: t.scannedAt,
        createdAt: t.createdAt,
        user: t.user,
      })) || [],
    amount: booking.amount || 0,
    paymentMode: booking.paymentMode || "RAZORPAY",
    status: booking.status || "paid",
    ticketToken: booking.ticketToken,
    createdAt: booking.createdAt || "",
    phone: booking.phone,
  };
}
