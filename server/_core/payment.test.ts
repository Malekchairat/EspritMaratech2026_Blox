import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import {
  createFlouciPayment,
  verifyWebhookSignature,
  getPaymentStatus,
  type PaymentRequest,
  type PaymentResponse,
  type PaymentError,
} from "./payment";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("Payment Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createFlouciPayment", () => {
    it("should create a payment successfully", async () => {
      const mockFlouciResponse = {
        result: {
          link: "https://developers.flouci.com/pay/123456",
          payment_id: "pay_123456",
        },
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockFlouciResponse });

      const request: PaymentRequest = {
        amount: 100,
        description: "Test donation",
        redirectUrl: "http://localhost:3000/case/1",
        metadata: { caseId: 1 },
      };

      const result = await createFlouciPayment(request);

      expect(result).toMatchObject({
        payment_id: "pay_123456",
        payment_url: "https://developers.flouci.com/pay/123456",
        amount: 100,
        status: "pending",
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          app_token: expect.any(String),
          app_secret: expect.any(String),
          amount: 100000, // 100 TND * 1000 = 100000 millimes
          accept_card: "true",
          session_timeout_secs: 1200,
          success_link: "http://localhost:3000/case/1",
          fail_link: "http://localhost:3000/case/1",
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          timeout: 10000,
        })
      );
    });

    it("should reject invalid amount (zero)", async () => {
      const request: PaymentRequest = {
        amount: 0,
        description: "Test donation",
        redirectUrl: "http://localhost:3000/case/1",
        metadata: { caseId: 1 },
      };

      await expect(createFlouciPayment(request)).rejects.toMatchObject({
        code: "INVALID_AMOUNT",
        message: expect.stringContaining("greater than 0"),
      });
    });

    it("should reject invalid amount (negative)", async () => {
      const request: PaymentRequest = {
        amount: -50,
        description: "Test donation",
        redirectUrl: "http://localhost:3000/case/1",
        metadata: { caseId: 1 },
      };

      await expect(createFlouciPayment(request)).rejects.toMatchObject({
        code: "INVALID_AMOUNT",
      });
    });

    it("should reject empty description", async () => {
      const request: PaymentRequest = {
        amount: 100,
        description: "",
        redirectUrl: "http://localhost:3000/case/1",
        metadata: { caseId: 1 },
      };

      await expect(createFlouciPayment(request)).rejects.toMatchObject({
        code: "INVALID_DESCRIPTION",
      });
    });

    it("should handle 401 unauthorized error", async () => {
      mockedAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 401,
          data: { message: "Invalid API credentials" },
        },
      });
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      const request: PaymentRequest = {
        amount: 100,
        description: "Test donation",
        redirectUrl: "http://localhost:3000/case/1",
        metadata: { caseId: 1 },
      };

      await expect(createFlouciPayment(request)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        message: expect.stringContaining("Invalid API credentials"),
      });
    });

    it("should handle 400 bad request error", async () => {
      mockedAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: "Invalid request data" },
        },
      });
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      const request: PaymentRequest = {
        amount: 100,
        description: "Test donation",
        redirectUrl: "http://localhost:3000/case/1",
        metadata: { caseId: 1 },
      };

      await expect(createFlouciPayment(request)).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });

    it("should handle 429 rate limit error", async () => {
      mockedAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 429,
          data: { message: "Too many requests" },
        },
      });
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      const request: PaymentRequest = {
        amount: 100,
        description: "Test donation",
        redirectUrl: "http://localhost:3000/case/1",
        metadata: { caseId: 1 },
      };

      await expect(createFlouciPayment(request)).rejects.toMatchObject({
        code: "RATE_LIMIT",
      });
    });

    it("should handle 500 service error", async () => {
      mockedAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: "Internal server error" },
        },
      });
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      const request: PaymentRequest = {
        amount: 100,
        description: "Test donation",
        redirectUrl: "http://localhost:3000/case/1",
        metadata: { caseId: 1 },
      };

      await expect(createFlouciPayment(request)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
      });
    });

    it("should handle network error (no response)", async () => {
      mockedAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        request: {},
        message: "Network error",
      });
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      const request: PaymentRequest = {
        amount: 100,
        description: "Test donation",
        redirectUrl: "http://localhost:3000/case/1",
        metadata: { caseId: 1 },
      };

      await expect(createFlouciPayment(request)).rejects.toMatchObject({
        code: "NETWORK_ERROR",
      });
    });

    it("should handle unknown error", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("Unknown error"));
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(false);

      const request: PaymentRequest = {
        amount: 100,
        description: "Test donation",
        redirectUrl: "http://localhost:3000/case/1",
        metadata: { caseId: 1 },
      };

      await expect(createFlouciPayment(request)).rejects.toMatchObject({
        code: "UNKNOWN_ERROR",
      });
    });
  });

  describe("getPaymentStatus", () => {
    it("should retrieve payment status successfully", async () => {
      const mockStatus = {
        payment_id: "pay_123456",
        status: "completed",
        amount: 100,
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockStatus });

      const result = await getPaymentStatus("pay_123456");

      expect(result).toEqual(mockStatus);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("verify_payment"),
        expect.objectContaining({
          app_token: expect.any(String),
          app_secret: expect.any(String),
          payment_id: "pay_123456",
        }),
        expect.any(Object)
      );
    });

    it("should handle error when retrieving payment status", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("Payment not found"));

      await expect(getPaymentStatus("invalid_id")).rejects.toThrow();
    });
  });

  describe("verifyWebhookSignature", () => {
    it("should verify valid webhook signature", () => {
      const payload = JSON.stringify({ event: "payment.completed" });
      const crypto = require("crypto");
      const secret = process.env.FLOUCI_WEBHOOK_SECRET || "your-webhook-secret-here";
      const validSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

      const result = verifyWebhookSignature(payload, validSignature);
      expect(result).toBe(true);
    });

    it("should reject invalid webhook signature", () => {
      const payload = JSON.stringify({ event: "payment.completed" });
      const invalidSignature = "invalid_signature";

      const result = verifyWebhookSignature(payload, invalidSignature);
      expect(result).toBe(false);
    });
  });
});
