export type EventType = "event" | "class";

export type EventAboutSection = {
  title: string;
  description: string;
  images?: string[];
};

export type EventItem = {
  _id: string | null | undefined;
  id: string;
  title: string;
  description: string;
  price: number;
  original_price?: number;
  photo: string;
  images?: string[];
  media?: string[];
  venue?: string;
  category?: string;
  about?: EventAboutSection[];
  placename?: string;
  date: string;
  time: string;
  location: string;
  type: EventType;
  isActive?: boolean;
};

export type CartItem = {
  event: EventItem;
  quantity: number;
  ticketIds?: string[]; // array of Ticket _id for this cart item
};

export type Ticket = {
  id: string;
  eventId?: string;
  title?: string;
  price?: number;
  date?: string;
  time?: string;
  location?: string;
  seat?: string;
  isScanned: boolean;
  scannedAt?: string;
  createdAt?: string;
};

export type PaymentMode = "RAZORPAY" | "MOCK";

export type Booking = {
  id: string;
  cartItems: CartItem[];
  tickets?: Ticket[];
  amount: number;
  paymentMode: PaymentMode;
  status: "pending" | "paid" | "failed" | "checked-in";
  ticketToken: string;
  createdAt: string;
  phone?: string;
};

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  token?: string;
  userId?: string;
};

export type AdminTicketListItem = {
  id: string;
  eventId?: string;
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  seat?: string;
  isScanned: boolean;
  scannedAt?: string;
  createdAt?: string;
  bookingToken?: string;
  user?: {
    name?: string;
    phone?: string;
  };
};
