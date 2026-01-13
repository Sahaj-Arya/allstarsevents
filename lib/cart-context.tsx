"use client";

import React, { createContext, useContext, useMemo } from "react";
import { CartItem, Booking, EventItem } from "./types";
import { useLocalStorage } from "./useLocalStorage";

const CartContext = createContext<{
  items: CartItem[];
  bookings: Booking[];
  addItem: (event: EventItem, quantity?: number) => void;
  updateQuantity: (eventId: string, quantity: number) => void;
  removeItem: (eventId: string) => void;
  clearCart: () => void;
  recordBooking: (booking: Booking) => void;
  total: number;
} | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useLocalStorage<CartItem[]>("cart", []);
  const [bookings, setBookings] = useLocalStorage<Booking[]>("bookings", []);

  const addItem = (event: EventItem, quantity = 1) => {
    // Only one event can be in the cart; replace if different.
    setItems((prev) => {
      const existing = prev[0];
      if (existing && existing.event.id === event.id) {
        return [{ ...existing, quantity: existing.quantity + quantity }];
      }
      return [{ event, quantity }];
    });
  };

  const updateQuantity = (eventId: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.event.id === eventId ? { ...item, quantity } : item
        )
        .filter((item) => item.quantity > 0)
        .slice(0, 1)
    );
  };

  const removeItem = (eventId: string) => {
    setItems((prev) => prev.filter((item) => item.event.id !== eventId));
  };

  const clearCart = () => setItems([]);

  const recordBooking = (booking: Booking) => {
    setBookings((prev) => [booking, ...prev]);
    clearCart();
  };

  const total = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.event.price * item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        bookings,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        recordBooking,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
