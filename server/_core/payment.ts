import axios, { AxiosError } from "axios";
import { createCha9a9aPayment, verifyCha9a9aWebhookSignature, getCha9a9aPaymentStatus } from "./cha9a9a-payment";

// Flouci API endpoint (TEST MODE ONLY)
const FLOUCI_API = process.env.FLOUCI_API_URL || "https://developers.flouci.com/api/generate_payment";
const FLOUCI_APP_TOKEN = process.env.FLOUCI_APP_TOKEN || "your_flouci_app_token_here";
const FLOUCI_APP_SECRET = process.env.FLOUCI_APP_SECRET || "your_flouci_app_secret_here";
const FLOUCI_WEBHOOK_SECRET = process.env.FLOUCI_WEBHOOK_SECRET || "your-webhook-secret-here";
const PAYMENT_TEST_MODE = process.env.PAYMENT_TEST_MODE === "true";

export interface PaymentRequest {
  amount: number;
  description: string;
  redirectUrl: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  payment_id: string;
  payment_url: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface PaymentError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Create a payment (routes to Cha9a9a in production, Flouci in test mode)
 * @throws {PaymentError} When payment creation fails
 */
export async function createPayment({
  amount,
  description,
  redirectUrl,
  metadata = {},
}: PaymentRequest): Promise<PaymentResponse> {
  // Validate input (throw immediately, don't catch)
  if (amount <= 0) {
    throw {
      code: "INVALID_AMOUNT",
      message: "Payment amount must be greater than 0",
    } as PaymentError;
  }

  if (!description || description.trim().length === 0) {
    throw {
      code: "INVALID_DESCRIPTION",
      message: "Payment description is required",
    } as PaymentError;
  }

  try {
    // TEST MODE: Use Flouci for testing (simulated payments)
    if (PAYMENT_TEST_MODE) {
      console.log("[Payment] ⚠️  TEST MODE - Using Flouci (no real transaction)");
      return await createFlouciPaymentInternal({ amount, description, redirectUrl, metadata });
    }

    // PRODUCTION MODE: Use Cha9a9a for real payments
    console.log("[Payment] 💳 PRODUCTION MODE - Using Cha9a9a");
    return await createCha9a9aPayment({ amount, description, redirectUrl, metadata });
  } catch (error) {
    console.error("[Payment] Error creating payment:", error);
    throw error;
  }
}

/**
 * Internal Flouci payment creation (for test mode only)
 */
async function createFlouciPaymentInternal({
  amount,
  description,
  redirectUrl,
  metadata = {},
}: PaymentRequest): Promise<PaymentResponse> {
  try {
    console.log(`[Flouci] Creating test payment: amount=${amount}, description=${description}`);

    const testPaymentId = `test_flouci_${Date.now()}`;
    const testPaymentUrl = `${redirectUrl}?test_payment=${testPaymentId}&status=success&gateway=flouci`;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(`[Flouci] ✅ Test payment created: ${testPaymentId}`);

    return {
      payment_id: testPaymentId,
      payment_url: testPaymentUrl,
      amount,
      status: "pending",
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Flouci] Error:", error);
    throw {
      code: "TEST_MODE_ERROR",
      message: "Error in test mode",
      details: error,
    } as PaymentError;
  }
}

/**
 * Legacy function name for backwards compatibility
 * @deprecated Use createPayment() instead
 */
export async function createFlouciPayment(params: PaymentRequest): Promise<PaymentResponse> {
  return createPayment(params);
}

/**
 * Real Flouci API call (not used, kept for reference)
 */
async function createRealFlouciPayment({
  amount,
  description,
  redirectUrl,
  metadata = {},
}: PaymentRequest): Promise<PaymentResponse> {
  try {
    console.log("[Flouci] 💳 Calling real Flouci API");

    // Flouci expects amount in millimes (1 TND = 1000 millimes)
    const amountInMillimes = amount * 1000;

    const res = await axios.post(
      FLOUCI_API,
      {
        app_token: FLOUCI_APP_TOKEN,
        app_secret: FLOUCI_APP_SECRET,
        amount: amountInMillimes,
        accept_card: "true",
        session_timeout_secs: 1200, // 20 minutes
        success_link: redirectUrl,
        fail_link: redirectUrl,
        developer_tracking_id: metadata?.paymentId || `payment_${Date.now()}`,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    // Flouci returns: { result: { link, payment_id } }
    const { result } = res.data;

    if (!result || !result.link || !result.payment_id) {
      throw {
        code: "INVALID_RESPONSE",
        message: "Invalid response from Flouci API",
        details: res.data,
      } as PaymentError;
    }

    console.log(`[Payment] Successfully created payment: ${result.payment_id}`);

    return {
      payment_id: result.payment_id,
      payment_url: result.link,
      amount,
      status: "pending",
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;

      // Handle specific HTTP error codes
      if (axiosError.response) {
        const status = axiosError.response.status;
        const errorData = axiosError.response.data;

        console.error(`[Payment] Flouci API error [${status}]:`, errorData);

        switch (status) {
          case 401:
            throw {
              code: "UNAUTHORIZED",
              message: "Invalid API credentials or unauthorized access",
              details: errorData,
            } as PaymentError;
          case 400:
            throw {
              code: "BAD_REQUEST",
              message: errorData?.message || "Invalid payment request",
              details: errorData,
            } as PaymentError;
          case 429:
            throw {
              code: "RATE_LIMIT",
              message: "Too many requests. Please try again later.",
              details: errorData,
            } as PaymentError;
          case 500:
          case 502:
          case 503:
            throw {
              code: "SERVICE_ERROR",
              message: "Payment service temporarily unavailable. Please try again.",
              details: errorData,
            } as PaymentError;
          default:
            throw {
              code: "API_ERROR",
              message: errorData?.message || "Payment creation failed",
              details: errorData,
            } as PaymentError;
        }
      } else if (axiosError.request) {
        // Request was made but no response received
        console.error("[Payment] No response from Flouci API:", axiosError.message);
        throw {
          code: "NETWORK_ERROR",
          message: "Unable to connect to payment service. Please check your connection.",
        } as PaymentError;
      }
    }

    // Unknown error
    console.error("[Payment] Unexpected error:", error);
    throw {
      code: "UNKNOWN_ERROR",
      message: "An unexpected error occurred while creating payment",
      details: error,
    } as PaymentError;
  }
}

/**
 * Verify webhook signature (for Flouci webhook callbacks)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  try {
    // Implement signature verification based on Flouci's webhook signature algorithm
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", FLOUCI_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    return signature === expectedSignature;
  } catch (error) {
    console.error("[Payment] Webhook signature verification failed:", error);
    return false;
  }
}

/**
 * Get payment status from Flouci
 */
export async function getPaymentStatus(paymentId: string): Promise<any> {
  try {
    const res = await axios.post("https://developers.flouci.com/api/verify_payment", {
      app_token: FLOUCI_APP_TOKEN,
      app_secret: FLOUCI_APP_SECRET,
      payment_id: paymentId,
    }, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });
    return res.data;
  } catch (error) {
    console.error(`[Payment] Failed to get status for payment ${paymentId}:`, error);
    throw error;
  }
}
