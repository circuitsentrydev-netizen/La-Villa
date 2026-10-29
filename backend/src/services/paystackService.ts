
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
  private readonly baseUrl = "https://api.paystack.co";

  private getSecretKey(): string {
    const key = process.env.PAYSTACK_SECRET_KEY?.trim();

    if (!key) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured.");
    }

    return key;
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.getSecretKey()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  async initializeTransaction(input: InitializePaymentInput) {
    const email = input.email?.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("A valid customer email is required.");
    }

    if (
      !Number.isSafeInteger(input.amountMinor) ||
      input.amountMinor <= 0
    ) {
      throw new Error("INVALID_TOTAL_AMOUNT");
    }

    if (
      !Number.isSafeInteger(input.reservationId) ||
      input.reservationId <= 0
    ) {
      throw new Error("A valid reservation ID is required.");
    }

    const reference = input.reference?.trim();

    if (
      !reference ||
      reference.length > 100 ||
      !/^[a-zA-Z0-9.=-]+$/.test(reference)
    ) {
      throw new Error("A valid payment reference is required.");
    }

    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL?.trim();

    if (!callbackUrl) {
      throw new Error("PAYSTACK_CALLBACK_URL is not configured.");
    }

    let parsedCallbackUrl: URL;

    try {
      parsedCallbackUrl = new URL(callbackUrl);
    } catch {
      throw new Error("PAYSTACK_CALLBACK_URL must be a valid URL.");
    }

    if (
      parsedCallbackUrl.protocol !== "https:" &&
      !(
        parsedCallbackUrl.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(
          parsedCallbackUrl.hostname
        )
      )
    ) {
      throw new Error(
        "PAYSTACK_CALLBACK_URL must use HTTPS, except for local development."
      );
    }

    let response: Response;

    try {
      response = await fetch(
        `${this.baseUrl}/transaction/initialize`,
        {
          method: "POST",
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(20000),
          body: JSON.stringify({
            email,
            amount: input.amountMinor,
            currency: "ZAR",
            reference,
            callback_url: callbackUrl,
            metadata: {
              reservation_id: input.reservationId,
              reservation_code: input.reservationCode,
            },
          }),
        }
      );
    } catch (error) {
      console.error("Paystack connection error:", error);

      throw new Error(
        error instanceof Error && error.name === "TimeoutError"
          ? "PAYSTACK_CONNECTION_TIMEOUT"
          : "PAYSTACK_CONNECTION_FAILED"
      );
    }

    let data: PaystackInitializeResponse;

    try {
      data = (await response.json()) as PaystackInitializeResponse;
    } catch {
      throw new Error("PAYMENT_INITIALIZATION_FAILED");
    }

    if (
      !response.ok ||
      !data.status ||
      !data.data?.authorization_url ||
      !data.data?.access_code ||
      data.data.reference !== reference
    ) {
      console.error("Paystack initialization rejected:", {
        httpStatus: response.status,
        message: data.message,
        reference,
      });

      throw new Error(
        `PAYSTACK_INITIALIZATION_REJECTED: ${
          data.message || "Unknown Paystack error"
        }`
      );
    }

    let checkoutUrl: URL;

    try {
      checkoutUrl = new URL(data.data.authorization_url);
    } catch {
      throw new Error("PAYSTACK_INVALID_CHECKOUT_URL");
    }

    if (
      checkoutUrl.protocol !== "https:" ||
      !(
        checkoutUrl.hostname === "checkout.paystack.com" ||
        checkoutUrl.hostname.endsWith(".paystack.com")
      )
    ) {
      throw new Error("PAYSTACK_INVALID_CHECKOUT_URL");
    }

    return {
      authorizationUrl: checkoutUrl.toString(),
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  }

  async verifyTransaction(reference: string) {
    const normalizedReference = reference?.trim();

    if (
      !normalizedReference ||
      normalizedReference.length > 100 ||
      !/^[a-zA-Z0-9.=-]+$/.test(normalizedReference)
    ) {
      throw new Error("A valid payment reference is required.");
    }

    let response: Response;

    try {
      response = await fetch(
        `${this.baseUrl}/transaction/verify/${encodeURIComponent(
          normalizedReference
        )}`,
        {
          method: "GET",
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(20000),
        }
      );
    } catch (error) {
      console.error("Paystack verification connection error:", error);

      throw new Error(
        error instanceof Error && error.name === "TimeoutError"
          ? "PAYSTACK_CONNECTION_TIMEOUT"
          : "PAYMENT_VERIFICATION_FAILED"
      );
    }

    let data: PaystackVerifyResponse;

    try {
      data = (await response.json()) as PaystackVerifyResponse;
    } catch {
      throw new Error("PAYMENT_VERIFICATION_FAILED");
    }

    if (!response.ok || !data.status || !data.data) {
      console.error("Paystack verification rejected:", {
        httpStatus: response.status,
        message: data.message,
        reference: normalizedReference,
      });

      throw new Error("PAYMENT_VERIFICATION_FAILED");
    }

    if (data.data.reference !== normalizedReference) {
      throw new Error("PAYMENT_REFERENCE_MISMATCH");
    }

    return data.data;
  }
}
