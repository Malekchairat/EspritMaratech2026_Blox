import axios, { AxiosError } from "axios";

// Cha9a9a API Configuration
const CHA9A9A_API_URL = process.env.CHA9A9A_API_URL || "https://api.cha9a9a.tn/v1/payment";
const CHA9A9A_API_KEY = process.env.CHA9A9A_API_KEY || "your_cha9a9a_api_key_here";
const CHA9A9A_API_SECRET = process.env.CHA9A9A_API_SECRET || "your_cha9a9a_secret_here";
const CHA9A9A_MERCHANT_ID = process.env.CHA9A9A_MERCHANT_ID || "your_merchant_id_here";
const CHA9A9A_WEBHOOK_SECRET = process.env.CHA9A9A_WEBHOOK_SECRET || "your_webhook_secret_here";

export interface Cha9a9aPaymentRequest {
  amount: number;
  description: string;
  redirectUrl: string;
  metadata?: Record<string, any>;
}

export interface Cha9a9aPaymentResponse {
  payment_id: string;
  payment_url: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface Cha9a9aPaymentError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Create a payment with Cha9a9a
 * @throws {Cha9a9aPaymentError} When payment creation fails
 */
export async function createCha9a9aPayment({
  amount,
  description,
  redirectUrl,
  metadata = {},
}: Cha9a9aPaymentRequest): Promise<Cha9a9aPaymentResponse> {
  // Validate input
  if (amount <= 0) {
    throw {
      code: "INVALID_AMOUNT",
      message: "Payment amount must be greater than 0",
    } as Cha9a9aPaymentError;
  }

  if (!description || description.trim().length === 0) {
    throw {
      code: "INVALID_DESCRIPTION",
      message: "Payment description is required",
    } as Cha9a9aPaymentError;
  }

  try {
    console.log(`[Cha9a9a] Creating payment: amount=${amount}, description=${description}`);

    // Cha9a9a expects amount in TND (Tunisian Dinars)
    const res = await axios.post(
      `${CHA9A9A_API_URL}/create`,
      {
        merchant_id: CHA9A9A_MERCHANT_ID,
        amount: amount,
        currency: "TND",
        description: description,
        success_url: redirectUrl,
        cancel_url: redirectUrl,
        callback_url: `${process.env.APP_URL || "http://localhost:3000"}/api/payments/webhook/cha9a9a`,
        reference: metadata?.paymentId || `payment_${Date.now()}`,
        customer: {
          email: metadata?.donorEmail || "",
          name: metadata?.donorName || "Anonymous",
        },
      },
      {
        headers: {
          "Authorization": `Bearer ${CHA9A9A_API_KEY}`,
          "X-API-Secret": CHA9A9A_API_SECRET,
          "Content-Type": "application/json",
        },
        timeout: 15000, // 15 second timeout
      }
    );

    // Cha9a9a returns payment details
    const { data } = res;

    if (!data || !data.payment_url || !data.payment_id) {
      throw {
        code: "INVALID_RESPONSE",
        message: "Invalid response from Cha9a9a API",
        details: data,
      } as Cha9a9aPaymentError;
    }

    console.log(`[Cha9a9a] Successfully created payment: ${data.payment_id}`);

    return {
      payment_id: data.payment_id,
      payment_url: data.payment_url,
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

        console.error(`[Cha9a9a] API error [${status}]:`, errorData);

        switch (status) {
          case 401:
            throw {
              code: "UNAUTHORIZED",
              message: "Invalid API credentials or unauthorized access",
              details: errorData,
            } as Cha9a9aPaymentError;
          case 400:
            throw {
              code: "BAD_REQUEST",
              message: errorData?.message || "Invalid payment request",
              details: errorData,
            } as Cha9a9aPaymentError;
          case 429:
            throw {
              code: "RATE_LIMIT",
              message: "Too many requests. Please try again later.",
              details: errorData,
            } as Cha9a9aPaymentError;
          case 500:
          case 502:
          case 503:
            throw {
              code: "SERVICE_ERROR",
              message: "Payment service temporarily unavailable. Please try again.",
              details: errorData,
            } as Cha9a9aPaymentError;
          default:
            throw {
              code: "API_ERROR",
              message: errorData?.message || "Payment creation failed",
              details: errorData,
            } as Cha9a9aPaymentError;
        }
      } else if (axiosError.request) {
        // Request was made but no response received
        console.error("[Cha9a9a] No response from API:", axiosError.message);
        throw {
          code: "NETWORK_ERROR",
          message: "Unable to connect to payment service. Please check your connection.",
        } as Cha9a9aPaymentError;
      }
    }

    // Unknown error
    console.error("[Cha9a9a] Unexpected error:", error);
    throw {
      code: "UNKNOWN_ERROR",
      message: "An unexpected error occurred while creating payment",
      details: error,
    } as Cha9a9aPaymentError;
  }
}

/**
 * Verify Cha9a9a webhook signature
 */
export function verifyCha9a9aWebhookSignature(
  payload: string,
  signature: string
): boolean {
  try {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", CHA9A9A_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    return signature === expectedSignature;
  } catch (error) {
    console.error("[Cha9a9a] Webhook signature verification failed:", error);
    return false;
  }
}

/**
 * Get payment status from Cha9a9a
 */
export async function getCha9a9aPaymentStatus(paymentId: string): Promise<any> {
  try {
    const res = await axios.get(`${CHA9A9A_API_URL}/status/${paymentId}`, {
      headers: {
        "Authorization": `Bearer ${CHA9A9A_API_KEY}`,
        "X-API-Secret": CHA9A9A_API_SECRET,
      },
      timeout: 10000,
    });
    return res.data;
  } catch (error) {
    console.error(`[Cha9a9a] Failed to get status for payment ${paymentId}:`, error);
    throw error;
  }
}
