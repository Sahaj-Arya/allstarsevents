import { v4 as uuidv4 } from "uuid";
import { OtpRequest } from "../models/OtpRequest.js";
import { incrementOtpSent } from "./stats.js";

export const OTP_CONFIG = {
  TTL_MS: 5 * 60 * 1000, // 5 minutes
  SMS_PROVIDER: "http://164.52.195.161/API/SendMsg.aspx",
  BRAND: process.env.SMS_BRAND || "ALLSTARS STUDIO",
  FOOTER: "OAVPL",
};

const SMS_REJECTION_KEYWORDS = [
  "error",
  "invalid",
  "reject",
  "failed",
  "not match",
];

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
 * @param {string} ticketToken - Ticket placeholder or ticket ID
 * @returns {string} Formatted ticket message with QR
 */
export function getTicketMessage(ticketToken) {
  return `Your ticket is ready.\nhttps://www.allstarsstudio.in/ticket/{${ticketToken}}\nPlease show this ticket link (QR) at the entry. ${OTP_CONFIG.FOOTER}`;
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
export function buildSmsUrl(phone, message, extraParams = {}) {
  const config = getSmsProviderConfig();
  const url = new URL(OTP_CONFIG.SMS_PROVIDER);

  url.searchParams.set("uname", config.username || "");
  url.searchParams.set("pass", config.password || "");
  url.searchParams.set("send", config.sender || "");
  url.searchParams.set("dest", String(phone || ""));
  url.searchParams.set("msg", String(message || ""));
  url.searchParams.set("priority", "1");

  if (extraParams.templateId) {
    url.searchParams.set("tempid", String(extraParams.templateId));
  }

  if (extraParams.entityId) {
    url.searchParams.set("peid", String(extraParams.entityId));
  }

  if (Array.isArray(extraParams.vars)) {
    const useSingleVarParam = extraParams.varParamStyle === "single";
    extraParams.vars.forEach((value, index) => {
      if (value !== undefined && value !== null && value !== "") {
        const key = useSingleVarParam ? "var" : `var${index + 1}`;
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

function maskPhone(phone) {
  const value = String(phone || "");
  if (value.length <= 4) return value;
  return `${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

function sanitizeSmsUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has("pass")) {
      parsed.searchParams.set("pass", "***");
    }
    return parsed.toString();
  } catch {
    return "invalid-url";
  }
}

/**
 * Send OTP via SMS
 * @param {string} phone - Phone number
 * @param {string} message - Message to send
 * @returns {Promise<boolean>} Success status
 */
export async function sendOtpViaSms(phone, message, meta = {}) {
  const config = getSmsProviderConfig();

  if (!config.username || !config.password || !config.sender) {
    throw new Error("SMS provider not configured");
  }

  const buildMeta = (varParamStyle = "indexed") => ({
    templateId: meta.templateId,
    entityId: meta.entityId,
    vars: meta.vars,
    varParamStyle,
  });
  const url = buildSmsUrl(phone, message, buildMeta());
  const isTicketSms = meta?.type === "ticket";

  if (isTicketSms) {
    console.info("[SMS][ticket] Sending ticket SMS", {
      ticketId: meta.ticketId || null,
      phone: maskPhone(phone),
      smsUrl: sanitizeSmsUrl(url),
    });
  }

  const response = await fetch(url);
  const responseText = await response.text();
  const isRejectedByBody = SMS_REJECTION_KEYWORDS.some((keyword) =>
    responseText.toLowerCase().includes(keyword),
  );

  if (isTicketSms) {
    console.info("[SMS][ticket] Provider response", {
      ticketId: meta.ticketId || null,
      status: response.status,
      ok: response.ok,
      body: responseText.slice(0, 300),
    });
  }

  if (isTicketSms && isRejectedByBody) {
    const canRetryWithSingleVar =
      Array.isArray(meta.vars) &&
      meta.vars.length > 0 &&
      meta.varParamStyle !== "single";

    if (canRetryWithSingleVar) {
      const retryUrl = buildSmsUrl(phone, message, buildMeta("single"));
      console.warn("[SMS][ticket] Retrying with single var parameter", {
        ticketId: meta.ticketId || null,
        phone: maskPhone(phone),
        smsUrl: sanitizeSmsUrl(retryUrl),
      });

      const retryResponse = await fetch(retryUrl);
      const retryText = await retryResponse.text();
      const retryRejected = SMS_REJECTION_KEYWORDS.some((keyword) =>
        retryText.toLowerCase().includes(keyword),
      );

      console.info("[SMS][ticket] Retry provider response", {
        ticketId: meta.ticketId || null,
        status: retryResponse.status,
        ok: retryResponse.ok,
        body: retryText.slice(0, 300),
      });

      if (retryResponse.ok && !retryRejected) {
        return true;
      }

      throw new Error(
        `Ticket SMS rejected by provider: ${retryText.slice(0, 200)}`,
      );
    }

    throw new Error(
      `Ticket SMS rejected by provider: ${responseText.slice(0, 200)}`,
    );
  }

  if (!response.ok) {
    if (isTicketSms) {
      console.error("[SMS][ticket] Ticket SMS failed", {
        ticketId: meta.ticketId || null,
        phone: maskPhone(phone),
        status: response.status,
        body: responseText.slice(0, 300),
      });
    }
    throw new Error("Failed to send OTP via SMS");
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
function resolveTicketTemplateId(templateType = "event") {
  const normalizedType = templateType === "workshop" ? "workshop" : "event";

  if (normalizedType === "workshop") {
    return (
      process.env.SMS_TICKET_WORKSHOP_TEMPLATE_ID ||
      process.env.SMS_TICKET_TEMPLATE_ID_WORKSHOP ||
      process.env.SMS_TICKET_TEMPLATE_ID ||
      null
    );
  }

  return (
    process.env.SMS_TICKET_EVENT_TEMPLATE_ID ||
    process.env.SMS_TICKET_TEMPLATE_ID_EVENT ||
    process.env.SMS_TICKET_TEMPLATE_ID ||
    null
  );
}

export async function sendTicketViaSms(
  phone,
  ticketId,
  templateType = "event",
) {
  const useDltTemplate = process.env.SMS_TICKET_USE_DLT === "true";
  const templateId = useDltTemplate
    ? resolveTicketTemplateId(templateType)
    : null;
  const entityId = useDltTemplate
    ? process.env.SMS_ENTITY_ID || process.env.SMS_PEID || process.env.SMS_PE_ID
    : null;
  const message = getTicketMessage(ticketId);
  const vars = useDltTemplate ? [ticketId] : [];

  console.info("[SMS][ticket] Prepared ticket message", {
    ticketId,
    templateType,
    useDltTemplate,
    phone: maskPhone(phone),
    templateId,
    entityId,
    vars,
    message: message.slice(0, 300),
  });

  return await sendOtpViaSms(phone, message, {
    type: "ticket",
    ticketId,
    templateId,
    entityId,
    vars,
  });
}
