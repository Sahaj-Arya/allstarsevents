#!/usr/bin/env node

/**
 * Integration test for webhook functionality
 * This simulates a complete payment flow including webhook
 * 
 * Usage: node test-webhook-integration.js
 */

import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL || "http://localhost:3001";
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.error("❌ RAZORPAY_WEBHOOK_SECRET not found in .env file");
  process.exit(1);
}

console.log("🧪 Webhook Integration Test\n");
console.log("API URL:", API_URL);
console.log("Webhook Secret:", WEBHOOK_SECRET.substring(0, 10) + "...\n");

// Step 1: Create sample webhook payload
const samplePayment = {
  event: "payment.captured",
  payload: {
    payment: {
      entity: {
        id: `pay_test_${Date.now()}`,
        order_id: `order_test_${Date.now()}`,
        amount: 100000, // 1000.00 INR in paise
        status: "captured",
        method: "upi",
        created_at: Math.floor(Date.now() / 1000),
      },
    },
  },
};

const body = JSON.stringify(samplePayment);
const signature = crypto
  .createHmac("sha256", WEBHOOK_SECRET)
  .update(body)
  .digest("hex");

console.log("✅ Step 1: Generated webhook payload");
console.log("   Payment ID:", samplePayment.payload.payment.entity.id);
console.log("   Order ID:", samplePayment.payload.payment.entity.order_id);
console.log("   Amount: ₹1000.00");
console.log();

// Step 2: Display curl command for testing
console.log("✅ Step 2: Test with curl\n");
console.log("Run this command to test the webhook:\n");
console.log(`curl -X POST ${API_URL}/payment/webhook \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "x-razorpay-signature: ${signature}" \\`);
console.log(`  -d '${body}'`);
console.log();

// Step 3: Explain expected behavior
console.log("✅ Step 3: Expected Behavior\n");
console.log("⚠️  Note: This test will fail with 'User not found' because");
console.log("   the order doesn't exist in your database. This is expected.");
console.log();
console.log("For a real test:");
console.log("1. Create an order via /payment/create-order");
console.log("2. Note the order_id from the response");
console.log("3. Modify the webhook payload above with that order_id");
console.log("4. Send the webhook request");
console.log();

// Step 4: Verification checklist
console.log("✅ Step 4: Verification Checklist\n");
console.log("[ ] Server returns 200 OK (signature valid)");
console.log("[ ] Server returns 400 Bad Request if signature is wrong");
console.log("[ ] Check server logs for: 'Webhook received: payment.captured'");
console.log("[ ] For real orders: Booking and tickets are created");
console.log("[ ] For real orders: SMS is sent to user");
console.log("[ ] Duplicate webhooks don't create duplicate tickets");
console.log();

// Step 5: Quick signature verification test
console.log("✅ Step 5: Signature Verification Test\n");
const wrongSignature = "wrong_signature_12345";
console.log("Valid signature:", signature);
console.log("Wrong signature:", wrongSignature);
console.log();
console.log("Test with wrong signature (should get 400 error):");
console.log(`curl -X POST ${API_URL}/payment/webhook \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "x-razorpay-signature: ${wrongSignature}" \\`);
console.log(`  -d '${body}'`);
console.log();

// Step 6: Complete flow test
console.log("✅ Step 6: Complete Flow Test\n");
console.log("To test the complete flow:");
console.log();
console.log("1. Start your API server:");
console.log("   cd api && npm start");
console.log();
console.log("2. Make a test payment from your frontend");
console.log();
console.log("3. Close the browser immediately after payment");
console.log();
console.log("4. Check server logs for:");
console.log("   'Webhook received: payment.captured'");
console.log("   'Webhook: Created X tickets for booking...'");
console.log();
console.log("5. Verify in database:");
console.log("   - Booking exists with status 'paid'");
console.log("   - Tickets are created");
console.log("   - User received SMS");
console.log();

console.log("🎉 Test setup complete!\n");
