import Razorpay from "razorpay";

export function createRazorpay(keyId, keySecret) {
  if (!keyId || !keySecret) {
    console.warn("Razorpay keys missing; Razorpay mode will fail until set.");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}
