import { logger } from "./logger";

export type PaymentMethod = "cod" | "paypal" | "stripe" | "manual_bank_transfer";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "awaiting_verification";

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string; // For redirecting to PayPal/Stripe
  message: string;
}

export interface PaymentProvider {
  createPaymentSession(amount: number, currency: string, orderId: string): Promise<PaymentResponse>;
  verifyPayment(transactionId: string): Promise<boolean>;
}

/**
 * PaymentService orchestrates different payment providers.
 * It allows the system to switch providers without changing the order logic.
 */
export class PaymentService {
  private providers: Map<PaymentMethod, PaymentProvider | null> = new Map();

  constructor() {
    // Register Manual Bank Transfer Provider
    this.registerProvider("manual_bank_transfer", {
      async createPaymentSession(amount, currency, orderId) {
        return {
          success: true,
          message: `Please transfer ${amount} ${currency} to our bank account. Order ID: ${orderId}`,
          paymentUrl: "/orders/payment-instructions", // Custom page for bank details
        };
      },
      async verifyPayment(transactionId) {
        // Manual verification is done by Admin in the dashboard
        return false; 
      }
    });
  }

  async processPayment(method: PaymentMethod, amount: number, currency: string, orderId: string): Promise<PaymentResponse> {
    const provider = this.providers.get(method);
    
    if (method === "cod") {
      return { success: true, message: "Cash on Delivery selected. Payment will be collected upon delivery." };
    }

    if (!provider) {
      return { success: false, message: `Payment method ${method} is not currently configured.` };
    }

    return await provider.createPaymentSession(amount, currency, orderId);
  }

  registerProvider(method: PaymentMethod, provider: PaymentProvider) {
    this.providers.set(method, provider);
  }
}

export const paymentService = new PaymentService();
