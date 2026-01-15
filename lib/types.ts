export type EventType = "event" | "class";

export type EventItem = {
  _id: string | null | undefined;
  id: string;
  title: string;
  description: string;
  price: number;
  photo: string;
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
