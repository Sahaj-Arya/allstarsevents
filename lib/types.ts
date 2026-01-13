export type EventType = "event" | "class";

export type EventItem = {
  id: string;
  title: string;
  description: string;
  price: number;
  photo: string;
  date: string;
  time: string;
  location: string;
  type: EventType;
};

export type CartItem = {
  event: EventItem;
  quantity: number;
};

export type PaymentMode = "RAZORPAY" | "MOCK";

export type Booking = {
  id: string;
  cartItems: CartItem[];
  amount: number;
  paymentMode: PaymentMode;
  status: "pending" | "paid" | "failed" | "checked-in";
  ticketToken: string;
  createdAt: string;
};

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
};
