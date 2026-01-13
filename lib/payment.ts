"use client";

import {
  createPaymentOrder,
  getPaymentMode,
  getRazorpayKey,
  verifyPayment,
} from "./api";
import { CartItem, Booking, UserProfile } from "./types";

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_signature: string;
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (
      document.querySelector(
        "script[src='https://checkout.razorpay.com/v1/checkout.js']"
      )
    ) {
      return resolve(true);
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function startCheckout(
  cartItems: CartItem[],
  profile: UserProfile
): Promise<Booking> {
  const paymentMode = getPaymentMode();
  const amount = cartItems.reduce(
    (sum, item) => sum + item.event.price * item.quantity,
    0
  );

  const order = await createPaymentOrder(amount, profile);

  if (paymentMode === "MOCK") {
    return verifyPayment({
      orderId: order.orderId,
      cartItems,
      amount,
      profile,
    });
  }

  const ok = await loadRazorpayScript();
  if (!ok) {
    throw new Error(
      "Razorpay SDK failed to load. Switch to MOCK mode for development."
    );
  }

  const key = getRazorpayKey();
  if (!key) {
    throw new Error("NEXT_PUBLIC_RAZORPAY_KEY_ID is missing");
  }

  return new Promise((resolve, reject) => {
    const options: Record<string, unknown> = {
      key,
      amount: order.amount,
      currency: order.currency || "INR",
      name: "All Stars Events",
      order_id: order.orderId,
      handler: async (response: RazorpayResponse) => {
        try {
          const booking = await verifyPayment({
            orderId: order.orderId,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            cartItems,
            amount,
            profile,
          });
          resolve(booking);
        } catch (err) {
          reject(err);
        }
      },
      prefill: {
        name: profile.name,
        email: profile.email,
        contact: profile.phone,
      },
      theme: { color: "#111827" },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled")),
      },
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  });
}
