export type EventType = "event" | "workshop" | "class";

export type EventRepeatFrequency = "none" | "daily" | "weekly" | "monthly";

export type EventRepeatConfig = {
  enabled: boolean;
  frequency: EventRepeatFrequency;
  interval: number;
  until?: string;
  occurrences?: number | null;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
};

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
  drop_in_price?: number;
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
  repeat?: EventRepeatConfig;
  isActive?: boolean;
  lifecycleStatus?: "active" | "inactive" | "past";
};

export type CartItem = {
  event: EventItem;
  quantity: number;
  ticketIds?: string[];
  sessionDate?: string; // specific class session date for drop-in
  bookingType?: "monthly" | "drop_in";
};

export type Ticket = {
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
  bookingType?: "monthly" | "drop_in";
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
  venue?: string;
  placename?: string;
  seat?: string;
  sessionDate?: string;
  bookingType?: "monthly" | "drop_in";
  isScanned: boolean;
  scannedAt?: string;
  createdAt?: string;
  bookingToken?: string;
  user?: {
    name?: string;
    phone?: string;
  };
};

export type HomeSettings = {
  key?: string;
  heroVideoUrl: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription?: string;
  heroOverlayOpacity: number;
};

export type AttendanceRecord = {
  id: string;
  ticketId: string;
  bookingToken?: string;
  eventId: string;
  eventTitle: string;
  eventType: "event" | "workshop" | "class";
  bookingType: "monthly" | "drop_in";
  sessionDate?: string;
  date?: string;
  time?: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  scannedAt?: string;
  scanCategory?: string;
  scanSource?: "ticket_id" | "booking_token";
  createdAt?: string;
};

export type AttendanceRosterRow = {
  ticketId: string;
  bookingToken?: string;
  eventId: string;
  eventTitle: string;
  eventType: "event" | "workshop" | "class";
  bookingType: "monthly" | "drop_in";
  sessionDate?: string;
  time?: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  status: "present" | "absent";
  scannedAt?: string;
};

export type ClassDayAttendanceAttendee = {
  ticketId: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  bookingType: "monthly" | "drop_in";
  status: "present" | "absent";
  scannedAt?: string;
};

export type ClassDayAttendanceSession = {
  eventId: string;
  eventTitle: string;
  sessionDate: string;
  time?: string;
  total: number;
  present: number;
  absent: number;
  dropInTotal: number;
  dropInPresent: number;
  dropInAbsent: number;
  monthlyTotal: number;
  monthlyPresent: number;
  monthlyAbsent: number;
  attendees: ClassDayAttendanceAttendee[];
  absentUsers: ClassDayAttendanceAttendee[];
};
