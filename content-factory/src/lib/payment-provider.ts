export type PaymentProviderName = "mock" | "stripe" | "paypal";

export type CheckoutInput = {
  paymentId: string;
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  mode: "sandbox" | "production";
};

export type CheckoutResult = {
  providerPaymentId: string;
  checkoutUrl: string;
  status: "pending" | "paid" | "failed" | "canceled";
  metadata?: Record<string, unknown>;
};

export type VerifyPaymentResult = {
  status: "pending" | "paid" | "failed" | "canceled";
  metadata?: Record<string, unknown>;
};

export interface PaymentProvider {
  name: PaymentProviderName;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  verifyPayment(input: { providerPaymentId: string; paymentId: string }): Promise<VerifyPaymentResult>;
}

export class MockPaymentProvider implements PaymentProvider {
  name: PaymentProviderName = "mock";

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    return {
      providerPaymentId: `mock_${input.paymentId}`,
      checkoutUrl: `/dashboard/billing?mock_payment=${input.paymentId}`,
      status: "pending",
      metadata: { mode: input.mode, mock: true },
    };
  }

  async verifyPayment(): Promise<VerifyPaymentResult> {
    return { status: "paid", metadata: { mockVerified: true } };
  }
}

export class PlaceholderPaymentProvider implements PaymentProvider {
  constructor(public name: PaymentProviderName) {}

  async createCheckout(): Promise<CheckoutResult> {
    throw new Error(`${this.name.toUpperCase()}_PAYMENT_PROVIDER_NOT_CONFIGURED`);
  }

  async verifyPayment(): Promise<VerifyPaymentResult> {
    throw new Error(`${this.name.toUpperCase()}_PAYMENT_PROVIDER_NOT_CONFIGURED`);
  }
}

export function getPaymentProvider(provider: PaymentProviderName): PaymentProvider {
  if (provider === "mock") return new MockPaymentProvider();
  return new PlaceholderPaymentProvider(provider);
}
