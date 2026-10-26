
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

    if (!key?.trim()) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured.");
    }

    return key.trim();
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

    if (!input.reference?.trim() || input.reference.length > 100) {
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
      parsedCallbackUrl.hostname !== "localhost"
    ) {
      throw new Error("PAYSTACK_CALLBACK_URL must use HTTPS.");
    }

    const secretKey = this.getSecretKey();

    let response: Response;

    try {
      response = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email,
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
    } catch (error) {
      console.error(
        "Could not connect to Paystack to initialize payment:",
        error
      );

      throw new Error("PAYMENT_INITIALIZATION_FAILED");
    }

    let data: PaystackInitializeResponse;

    try {
      data = (await response.json()) as PaystackInitializeResponse;
    } catch {
      console.error("Paystack returned an invalid initialization response.");
      throw new Error("PAYMENT_INITIALIZATION_FAILED");
    }

    if (
      !response.ok ||
      !data.status ||
      !data.data?.authorization_url ||
      !data.data?.access_code ||
      data.data.reference !== input.reference
    ) {
      // Log the useful failure details, but never log the secret key.
      console.error("Paystack initialization failed:", {
        httpStatus: response.status,
        message: data.message,
        referenceMatches: data.data?.reference === input.reference,
        hasAuthorizationUrl: Boolean(data.data?.authorization_url),
      });

      throw new Error("PAYMENT_INITIALIZATION_FAILED");
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
        checkoutUrl.hostname === "paystack.com" ||
        checkoutUrl.hostname.endsWith(".paystack.com")
      )
    ) {
      console.error("Paystack returned an unexpected checkout URL host:", {
        hostname: checkoutUrl.hostname,
        reference: input.reference,
      });

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

    if (!normalizedReference || normalizedReference.length > 100) {
      throw new Error("A valid payment reference is required.");
    }

    const secretKey = this.getSecretKey();

    let response: Response;

    try {
      response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(
          normalizedReference
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            Accept: "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Could not connect to Paystack to verify payment:", error);
      throw new Error("PAYMENT_VERIFICATION_FAILED");
    }

    let data: PaystackVerifyResponse;

    try {
      data = (await response.json()) as PaystackVerifyResponse;
    } catch {
      console.error("Paystack returned an invalid verification response.");
      throw new Error("PAYMENT_VERIFICATION_FAILED");
    }

    if (!response.ok || !data.status || !data.data) {
      console.error("Paystack verification failed:", {
        httpStatus: response.status,
        message: data.message,
      });

      throw new Error("PAYMENT_VERIFICATION_FAILED");
    }

    if (data.data.reference !== normalizedReference) {
      throw new Error("PAYMENT_REFERENCE_MISMATCH");
    }

    return data.data;
  }
}
