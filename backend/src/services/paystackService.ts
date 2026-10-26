
interface InitializePaymentInput {
  email: string;
  amountMinor: number;
  reference: string;
  reservationId: number;
  reservationCode: string;
}

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at: string | null;
  };
}

export class PaystackService {
  private getSecretKey(): string {
    const key = process.env.PAYSTACK_SECRET_KEY;

    if (!key) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured.");
    }

    return key;
  }

  async initializeTransaction(input: InitializePaymentInput) {
    if (!input.email || !input.email.includes("@")) {
      throw new Error("A valid customer email is required.");
    }

    if (
      !Number.isSafeInteger(input.amountMinor) ||
      input.amountMinor <= 0
    ) {
      throw new Error("INVALID_TOTAL_AMOUNT");
    }

    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL;

    if (!callbackUrl) {
      throw new Error("PAYSTACK_CALLBACK_URL is not configured.");
    }

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.getSecretKey()}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: input.email,
          amount: input.amountMinor,
          currency: "ZAR",
          reference: input.reference,
          callback_url: callbackUrl,
          metadata: {
            reservation_id: input.reservationId,
            reservation_code: input.reservationCode,
          },
        }),
      }
    );

    const data = (await response.json()) as PaystackInitializeResponse;

    if (
      !response.ok ||
      !data.status ||
      !data.data?.authorization_url ||
      data.data.reference !== input.reference
    ) {
      console.error("Paystack initialization failed:", data.message);
      throw new Error("PAYMENT_INITIALIZATION_FAILED");
    }

    return {
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  }

  async verifyTransaction(reference: string) {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getSecretKey()}`,
          Accept: "application/json",
        },
      }
    );

    const data = (await response.json()) as PaystackVerifyResponse;

    if (!response.ok || !data.status || !data.data) {
      throw new Error("PAYMENT_VERIFICATION_FAILED");
    }

    return data.data;
  }
}
