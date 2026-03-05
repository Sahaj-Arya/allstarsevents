import { v4 as uuidv4 } from "uuid";
import { OtpRequest } from "../models/OtpRequest.js";
import { incrementOtpSent } from "./stats.js";

export const OTP_CONFIG = {
  TTL_MS: 5 * 60 * 1000, // 5 minutes
  SMS_PROVIDER: "http://164.52.195.161/API/SendMsg.aspx",
  BRAND: process.env.SMS_BRAND || "ALLSTARS STUDIO",
  FOOTER: "OAVPL",
};

/**
 * Get OTP message template
 * @param {string} code - OTP code
 * @param {string} brandName - Brand name (optional)
 * @returns {string} Formatted OTP message
 */
export function getOtpMessage(code, brandName = OTP_CONFIG.BRAND) {
  return `Your OTP for ${brandName} is ${code}. It is valid for 5 minutes.${OTP_CONFIG.FOOTER}`;
}

/**
 * Get ticket message template
 * @param {string} ticketId - Ticket ID
 * @returns {string} Formatted ticket message with QR
 */
export function getTicketMessage(ticketId) {
  return `Your ticket is ready.\nhttps://www.allstarsstudio.in/ticket/${ticketId}\nPlease show this ticket link (QR) at the entry. OAVPL`;
}

/**
 * Generate a random OTP code
 * @returns {string} 6-digit OTP code
 */
export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Get test OTP configuration from environment
 * @returns {Object} Test numbers and test code
 */
export function getTestOtpConfig() {
  const staticOtp = process.env.STATIC_OTP || "000000";
  const testNumbers = (process.env.OTP_TEST_NUMBERS || "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);
  const testCode = process.env.OTP_TEST_CODE || staticOtp;

  return { testNumbers, testCode, staticOtp };
}

/**
 * Get SMS provider configuration
 * @returns {Object} SMS provider credentials
 */
export function getSmsProviderConfig() {
  return {
    username: process.env.SMS_UNAME,
    password: process.env.SMS_PASS,
    sender: process.env.SMS_SENDER,
  };
}

/**
 * Check if phone number is a test number
 * @param {string} phone - Phone number to check
 * @returns {boolean}
 */
export function isTestNumber(phone) {
  const { testNumbers } = getTestOtpConfig();
  return testNumbers.includes(phone);
}

/**
 * Create OTP request in database
 * @param {string} phone - Phone number
 * @param {string} code - OTP code
 * @returns {Promise<Object>} Created OTP request
 */
export async function createOtpRequest(phone, code) {
  const requestId = uuidv4();
  const expiresAt = new Date(Date.now() + OTP_CONFIG.TTL_MS);

  const otpRequest = await OtpRequest.create({
    phone,
    code,
    requestId,
    expiresAt,
  });

  return { requestId, otpRequest };
}

/**
 * Build SMS API URL
 * @param {string} phone - Destination phone number
 * @param {string} message - Message to send
 * @returns {string} Complete SMS API URL
 */
export function buildSmsUrl(phone, message) {
  const config = getSmsProviderConfig();
  const encodedMessage = encodeURIComponent(message || "");

  return (
    OTP_CONFIG.SMS_PROVIDER +
    `?uname=${config.username}` +
    `&pass=${config.password}` +
    `&send=${config.sender}` +
    `&dest=${phone}` +
    `&msg=${encodedMessage}` +
    `&priority=1`
  );
}

function normalizeSmsPhone(phone) {
  const raw = String(phone || "").trim();
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  if (digits.length === 10) {
    return digits;
  }

  return digits || raw;
}

function isSmsProviderFailure(responseText) {
  const text = String(responseText || "").toLowerCase();
  if (!text) return false;

  const failureHints = [
    "invalid",
    "error",
    "failed",
    "failure",
    "denied",
    "not allowed",
    "not permitted",
    "unauthorized",
    "insufficient",
    "dlt",
    "template",
    "blocked",
  ];

  return failureHints.some((hint) => text.includes(hint));
}

/**
 * Send OTP via SMS
 * @param {string} phone - Phone number
 * @param {string} message - Message to send
 * @returns {Promise<boolean>} Success status
 */
export async function sendOtpViaSms(phone, message) {
  const config = getSmsProviderConfig();

  if (!config.username || !config.password || !config.sender) {
    throw new Error("SMS provider not configured");
  }

  const destination = normalizeSmsPhone(phone);
  if (!destination) {
    throw new Error("Invalid destination phone number");
  }

  const url = buildSmsUrl(destination, message);
  const redactedUrl = url.replace(/([?&]pass=)[^&]*/i, "$1***");
  console.log("📨 SMS Request URL:", redactedUrl);
  console.log("📨 SMS Destination:", { rawPhone: phone, normalizedPhone: destination });

  const response = await fetch(url);
  const responseText = await response.text();
  console.log("📨 SMS Response:", response.status, responseText);

  if (!response.ok) {
    throw new Error(
      `Failed to send OTP via SMS: ${response.status} ${responseText}`,
    );
  }

  if (isSmsProviderFailure(responseText)) {
    throw new Error(`SMS provider rejected request: ${responseText}`);
  }

  return true;
}

/**
 * Verify OTP request
 * @param {string} phone - Phone number
 * @param {string} code - OTP code to verify
 * @param {string} requestId - Request ID
 * @returns {Promise<Object>} Verification result with status and error message
 */
export async function verifyOtpRequest(phone, code, requestId) {
  if (!phone || !code || !requestId) {
    return { valid: false, error: "Missing required fields" };
  }

  const found = await OtpRequest.findOne({
    requestId,
    phone,
    consumed: false,
  });

  if (!found) {
    return { valid: false, error: "invalid" };
  }

  if (found.expiresAt < new Date()) {
    return { valid: false, error: "expired" };
  }

  if (found.code !== code) {
    return { valid: false, error: "incorrect" };
  }

  // Mark as consumed
  found.consumed = true;
  await found.save();

  return { valid: true, error: null };
}

/**
 * Increment OTP sent stats with error handling
 * @returns {Promise<void>}
 */
export async function trackOtpSent() {
  try {
    await incrementOtpSent();
  } catch (err) {
    console.warn("Failed to increment OTP stats", err);
  }
}

/**
 * Send ticket message via SMS
 * @param {string} phone - Phone number
 * @param {string} ticketId - Ticket ID
 * @returns {Promise<boolean>} Success status
 */
export async function sendTicketViaSms(phone, ticketId) {
  const message = getTicketMessage(ticketId);
  return await sendOtpViaSms(phone, message);
}
