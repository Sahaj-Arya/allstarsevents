#!/usr/bin/env node

/**
 * Test script to verify webhook signature verification
 * Usage: node test-webhook-signature.js
 */

import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.error("❌ RAZORPAY_WEBHOOK_SECRET not found in .env file");
  console.log("\nPlease add it to your .env file:");
  console.log("RAZORPAY_WEBHOOK_SECRET=your_secret_here\n");
  process.exit(1);
}

// Sample webhook payload from Razorpay
const samplePayload = {
  event: "payment.captured",
  payload: {
    payment: {
      entity: {
        id: "pay_test123",
        order_id: "order_test456",
        amount: 100000,
        status: "captured",
      },
    },
  },
};

const body = JSON.stringify(samplePayload);
const signature = crypto
  .createHmac("sha256", webhookSecret)
  .update(body)
  .digest("hex");

console.log("✅ Webhook Secret Found:", webhookSecret.substring(0, 10) + "...");
console.log("\n📦 Sample Webhook Payload:");
console.log(JSON.stringify(samplePayload, null, 2));
console.log("\n🔐 Generated Signature:");
console.log(signature);
console.log("\n📝 To test manually:");
console.log("curl -X POST http://localhost:3001/payment/webhook \\");
console.log('  -H "Content-Type: application/json" \\');
console.log(`  -H "x-razorpay-signature: ${signature}" \\`);
console.log(`  -d '${body}'`);
console.log("\n✨ If configured correctly, the webhook should accept this request");
