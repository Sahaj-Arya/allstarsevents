"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Booking, EventItem } from "./types";

type CartState = {
  items: CartItem[];
  bookings: Booking[];
  total: number;
  addItem: (event: EventItem, quantity?: number) => void;
  updateQuantity: (eventId: string, quantity: number) => void;
  removeItem: (eventId: string) => void;
  clearCart: () => void;
  recordBooking: (booking: Booking) => void;
  replaceBookings: (bookings: Booking[]) => void;
};

const calculateTotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.event.price * item.quantity, 0);

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      bookings: [],
      total: 0,
      addItem: (event, quantity = 1) => {
        set((state) => {
          const existing = state.items[0];
          const nextItems =
            existing && existing.event.id === event.id
              ? [{ ...existing, quantity: existing.quantity + quantity }]
              : [{ event, quantity }];
          return { items: nextItems, total: calculateTotal(nextItems) };
        });
      },
      updateQuantity: (eventId, quantity) => {
        set((state) => {
          const nextItems = state.items
            .map((item) =>
              item.event.id === eventId ? { ...item, quantity } : item
            )
            .filter((item) => item.quantity > 0)
            .slice(0, 1);
          return { items: nextItems, total: calculateTotal(nextItems) };
        });
      },
      removeItem: (eventId) => {
        set((state) => {
          const nextItems = state.items.filter(
            (item) => item.event.id !== eventId
          );
          return { items: nextItems, total: calculateTotal(nextItems) };
        });
      },
      clearCart: () => set({ items: [], total: 0 }),
      recordBooking: (booking) => {
        const currentBookings = get().bookings;
        set({
          bookings: [booking, ...currentBookings],
          items: [],
          total: 0,
        });
      },
      replaceBookings: (bookings) =>
        set((state) => ({ ...state, bookings: bookings || [] })),
    }),
    {
      name: "cart-store",
    }
  )
);

export const useCart = () => useCartStore();
