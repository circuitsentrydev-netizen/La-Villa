
import { Request, Response } from "express";
import { randomBytes } from "crypto";
import { ReservationService } from "../services/reservationService";
import { PaystackService } from "../services/paystackService";

const reservationService = new ReservationService();
const paystackService = new PaystackService();

const allowedStatuses = [
  "Pending",
  "Confirmed",
  "Cancelled",
  "Completed",
];

const isValidDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

const localToday = (): string => {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
};

const isValidUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

/**
 * Create a reservation and initialize Paystack checkout.
 */
export const createReservation = async (
  req: Request,
  res: Response
): Promise<void> => {
  let reservationCreated = false;

  try {
    const user = req.user;

    if (!user?.id || !isValidUuid(user.id)) {
      res.status(401).json({
        message: "You must be signed in to make a reservation.",
      });
      return;
    }

    const email =
      typeof user.email === "string" ? user.email.trim() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        message:
          "Your account needs a valid email address before payment can be initialized.",
      });
      return;
    }

    const {
      guest_name,
      accommodation_id,
      room_inventory_id,
      guest_count,
      check_in_date,
      check_out_date,
    } = req.body ?? {};

    if (
      typeof guest_name !== "string" ||
      !guest_name.trim() ||
      guest_name.trim().length > 120
    ) {
      res.status(400).json({
        message: "Enter a guest name of up to 120 characters.",
      });
      return;
    }

    if (!isValidUuid(accommodation_id)) {
      res.status(400).json({
        message: "Invalid accommodation ID.",
      });
      return;
    }

    const inventoryId = Number(room_inventory_id);
    const guestCount = Number(guest_count);

    if (!Number.isInteger(inventoryId) || inventoryId <= 0) {
      res.status(400).json({
        message: "Select a valid room type.",
      });
      return;
    }

    if (!Number.isInteger(guestCount) || guestCount < 1) {
      res.status(400).json({
        message: "Guest count must be at least 1.",
      });
      return;
    }

    if (!isValidDate(check_in_date) || !isValidDate(check_out_date)) {
      res.status(400).json({
        message: "Enter valid check-in and check-out dates.",
      });
      return;
    }

    if (check_in_date < localToday()) {
      res.status(400).json({
        message: "Check-in cannot be in the past.",
      });
      return;
    }

    if (check_out_date <= check_in_date) {
      res.status(400).json({
        message: "Check-out must be after check-in.",
      });
      return;
    }

    const reservation = await reservationService.createReservation({
      user_id: user.id,
      guest_name: guest_name.trim(),
      accommodation_id,
      room_inventory_id: inventoryId,
      guest_count: guestCount,
      check_in_date,
      check_out_date,
    });

    reservationCreated = true;

    const totalAmount = Number(reservation.total_amount);
    const amountMinor = Math.round(totalAmount * 100);

    if (
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0 ||
      !Number.isSafeInteger(amountMinor) ||
      amountMinor <= 0
    ) {
      console.error("Invalid reservation payment amount:", {
        reservationId: reservation.id,
        totalAmount,
        amountMinor,
      });

      res.status(500).json({
        message:
          "Your reservation was created, but its payment amount is invalid. Please contact support before submitting another reservation.",
        reservation,
        paymentStatus: "error",
      });
      return;
    }

    const reference = `LV-${randomBytes(16)
      .toString("hex")
      .toUpperCase()}`;

    await reservationService.createPaymentAttempt({
      reservation_id: Number(reservation.id),
      reference,
      amount_minor: amountMinor,
    });

    let checkout: Awaited<
      ReturnType<PaystackService["initializeTransaction"]>
    >;

    try {
      checkout = await paystackService.initializeTransaction({
        email,
        amountMinor,
        reference,
        reservationId: Number(reservation.id),
        reservationCode: reservation.reservation_code,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      const isConnectionError = [
        "PAYSTACK_CONNECTION_FAILED",
        "PAYSTACK_CONNECTION_TIMEOUT",
      ].includes(errorMessage);

      console.error("Paystack initialization failed:", {
        errorCode: errorMessage,
        reservationId: reservation.id,
        reference,
      });

      res.status(502).json({
        message: isConnectionError
          ? "Your reservation was created, but La Villa could not connect to Paystack. Your payment has not been confirmed. Please contact support before submitting another reservation."
          : "Your reservation was created, but Paystack checkout could not be initialized. Your payment has not been confirmed. Please contact support before submitting another reservation.",
        reservation,
        paymentStatus: "pending",
        reference,
        errorCode: isConnectionError ? errorMessage : undefined,
      });
      return;
    }

    const authorizationUrl = checkout.authorizationUrl;

    let parsedCheckoutUrl: URL | null = null;

    try {
      parsedCheckoutUrl = new URL(authorizationUrl);
    } catch {
      parsedCheckoutUrl = null;
    }

    const validCheckoutUrl =
      parsedCheckoutUrl?.protocol === "https:" &&
      (
        parsedCheckoutUrl.hostname === "checkout.paystack.com" ||
        parsedCheckoutUrl.hostname.endsWith(".paystack.com")
      );

    if (!validCheckoutUrl) {
      console.error("Paystack returned an invalid checkout URL:", {
        reservationId: reservation.id,
        reference,
      });

      res.status(502).json({
        message:
          "Your reservation was created, but Paystack did not return a valid checkout URL. Please contact support before submitting another reservation.",
        reservation,
        paymentStatus: "pending",
        reference,
      });
      return;
    }

    res.status(201).json({
      message:
        "Reservation created. Continue to Paystack to complete payment.",
      reservation,
      paymentStatus: "pending",
      reference,
      authorization_url: authorizationUrl,
      authorizationUrl,
      payment: {
        reference,
        status: "Pending",
        authorization_url: authorizationUrl,
        authorizationUrl,
      },
    });
  } catch (error) {
    const message = getErrorMessage(error);

    const knownErrors: Record<
      string,
      { status: number; message: string }
    > = {
      ROOM_NOT_FOUND: {
        status: 404,
        message: "That room type was not found for this accommodation.",
      },
      GUEST_CAPACITY_EXCEEDED: {
        status: 400,
        message: "The guest count exceeds this room type's capacity.",
      },
      NO_ROOMS_CONFIGURED: {
        status: 409,
        message: "No physical rooms are configured for this room type.",
      },
      NO_ROOMS_AVAILABLE: {
        status: 409,
        message: "No rooms of this type are available for those dates.",
      },
      INVALID_TOTAL_AMOUNT: {
        status: 400,
        message: "Unable to calculate the reservation total.",
      },
      RESERVATION_NOT_PAYABLE: {
        status: 409,
        message:
          "This reservation cannot currently be paid. Please contact support.",
      },
    };

    const knownError = knownErrors[message];

    if (knownError) {
      res.status(knownError.status).json({
        message: knownError.message,
      });
      return;
    }

    console.error(
      reservationCreated
        ? "Reservation created, but payment setup failed:"
        : "Failed to create reservation:",
      error
    );

    res.status(500).json({
      message: reservationCreated
        ? "Your reservation was created, but payment setup failed. Please contact support before submitting another reservation."
        : "Failed to create reservation.",
      paymentStatus: reservationCreated ? "pending" : undefined,
    });
  }
};

/**
 * Verify a payment with Paystack.
 * A browser redirect is never proof of payment.
 */
export const verifyPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;

    if (!user?.id || !isValidUuid(user.id)) {
      res.status(401).json({
        error: "Please sign in again to verify your payment.",
        paymentStatus: "error",
      });
      return;
    }

    const reference =
      typeof req.body?.reference === "string"
        ? req.body.reference.trim()
        : "";

    if (
      !reference ||
      reference.length > 100 ||
      !/^[a-zA-Z0-9.=-]+$/.test(reference)
    ) {
      res.status(400).json({
        error: "A valid payment reference is required.",
        paymentStatus: "error",
      });
      return;
    }

    const payment = await reservationService.getPaymentForUser(
      reference,
      user.id
    );

    if (!payment) {
      res.status(404).json({
        error: "Payment reference not found for this account.",
        paymentStatus: "error",
      });
      return;
    }

    if (
      String(payment.payment_attempt_status ?? payment.status).toLowerCase() ===
        "paid" &&
      String(payment.payment_status).toLowerCase() === "paid"
    ) {
      res.status(200).json({
        message: "Your payment has already been verified.",
        paymentStatus: "paid",
        payment: { status: "Paid" },
        reservation: {
          reservation_code: payment.reservation_code,
          status: "Confirmed",
          payment_status: "Paid",
        },
      });
      return;
    }

    // A network or verification error must not mark the payment as failed.
    const verified = await paystackService.verifyTransaction(reference);

    if (String(verified.reference ?? "") !== reference) {
      res.status(400).json({
        error: "The payment reference did not match.",
        paymentStatus: "error",
      });
      return;
    }

    const transactionStatus = String(verified.status ?? "").toLowerCase();

    if (transactionStatus !== "success") {
      if (["failed", "abandoned", "reversed"].includes(transactionStatus)) {
        await reservationService.markPaymentFailed(reference);

        res.status(200).json({
          message:
            "The payment was not completed successfully. Your reservation is not confirmed.",
          paymentStatus: "failed",
          payment: { status: "Failed" },
        });
        return;
      }

      res.status(200).json({
        message:
          "Your payment is still being processed. Please check again shortly.",
        paymentStatus: "pending",
        payment: { status: "Pending" },
      });
      return;
    }

    const expectedAmountMinor = Number(payment.amount_minor);
    const verifiedAmountMinor = Number(verified.amount);
    const verifiedCurrency = String(verified.currency ?? "").toUpperCase();

    if (
      !Number.isSafeInteger(expectedAmountMinor) ||
      expectedAmountMinor <= 0 ||
      !Number.isSafeInteger(verifiedAmountMinor) ||
      verifiedAmountMinor !== expectedAmountMinor ||
      verifiedCurrency !== "ZAR"
    ) {
      console.error("Paystack verification amount/currency mismatch:", {
        reference,
        expectedAmountMinor,
        verifiedAmountMinor,
        verifiedCurrency,
      });

      res.status(400).json({
        error:
          "The payment amount or currency could not be validated. Your reservation has not been confirmed.",
        paymentStatus: "error",
      });
      return;
    }

    const confirmed = await reservationService.confirmPayment(
      reference,
      verifiedAmountMinor,
      verifiedCurrency
    );

    res.status(200).json({
      message:
        "Your payment has been verified successfully. Your reservation is confirmed.",
      paymentStatus: "paid",
      payment: { status: "Paid" },
      reservation: {
        reservation_code:
          confirmed?.reservation_code ?? payment.reservation_code,
        status: "Confirmed",
        payment_status: "Paid",
      },
    });
  } catch (error) {
    const message = getErrorMessage(error);

    if (
      message === "RESERVATION_NOT_PAYABLE" ||
      message === "RESERVATION_ALREADY_PAID"
    ) {
      res.status(409).json({
        error:
          "This reservation cannot be confirmed through this payment attempt. Please contact La Villa if you believe you completed payment.",
        paymentStatus: "error",
      });
      return;
    }

    if (
      message === "PAYSTACK_CONNECTION_TIMEOUT" ||
      message === "PAYMENT_VERIFICATION_FAILED"
    ) {
      console.error("Paystack payment verification is temporarily unavailable:", {
        errorCode: message,
      });

      res.status(502).json({
        error:
          "We could not reach Paystack to verify your payment. Your reservation has not been confirmed. Please try again shortly.",
        paymentStatus: "pending",
      });
      return;
    }

    console.error("Error verifying Paystack payment:", error);

    res.status(500).json({
      error:
        "Unable to verify your payment right now. Please try again shortly.",
      paymentStatus: "error",
    });
  }
};

/**
 * GET /api/reservations/mine
 * Return reservations belonging to the authenticated customer.
 */
export const getMyReservations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;

    if (!user?.id || !isValidUuid(user.id)) {
      res.status(401).json({
        message: "You must be signed in to view your reservations.",
      });
      return;
    }

    const reservations = await reservationService.getUserReservations(user.id);

    res.status(200).json({ reservations });
  } catch (error) {
    console.error("Error fetching user's reservations:", error);

    res.status(500).json({
      message: "Failed to fetch your reservation history.",
    });
  }
};

/**
 * Customer cancellation.
 * Only Pending, unpaid reservations can be cancelled online.
 */
export const cancelMyReservation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;

    if (!user?.id || !isValidUuid(user.id)) {
      res.status(401).json({
        message: "Please sign in again to cancel your reservation.",
      });
      return;
    }

    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({
        message: "Invalid reservation ID.",
      });
      return;
    }

    const reservation =
      await reservationService.cancelPendingReservation(id, user.id);

    res.status(200).json({
      message: "Your unpaid reservation has been cancelled.",
      reservation,
    });
  } catch (error) {
    const message = getErrorMessage(error);

    if (message === "RESERVATION_NOT_FOUND") {
      res.status(404).json({
        message: "Reservation not found.",
      });
      return;
    }

    if (message === "CANCELLATION_NOT_ALLOWED") {
      res.status(409).json({
        message:
          "This reservation cannot be cancelled online. Please contact La Villa if it has already been paid or confirmed.",
      });
      return;
    }

    console.error("Error cancelling customer reservation:", error);

    res.status(500).json({
      message: "Unable to cancel your reservation right now.",
    });
  }
};

/**
 * GET /api/reservations
 * Admin: return all reservations.
 */
export const getAllReservations = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const reservations = await reservationService.getAllReservations();

    res.status(200).json({ reservations });
  } catch (error) {
    console.error("Error fetching all reservations:", error);

    res.status(500).json({
      error: "Failed to fetch reservations.",
    });
  }
};

/**
 * PATCH /api/reservations/:id/status
 * Admin: update reservation status.
 */
export const updateReservationStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const status = req.body?.status;

    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({
        error: "Invalid reservation ID.",
      });
      return;
    }

    if (typeof status !== "string" || !allowedStatuses.includes(status)) {
      res.status(400).json({
        error: `Status must be one of: ${allowedStatuses.join(", ")}.`,
      });
      return;
    }

    const reservation = await reservationService.updateReservationStatus(
      id,
      status
    );

    if (!reservation) {
      res.status(404).json({
        error: "Reservation not found.",
      });
      return;
    }

    res.status(200).json({
      message: "Reservation status updated successfully.",
      reservation,
    });
  } catch (error) {
    const message = getErrorMessage(error);

    if (message === "PAYMENT_REQUIRED") {
      res.status(409).json({
        error:
          "Payment must be completed before confirming this reservation.",
      });
      return;
    }

    console.error("Error updating reservation:", error);

    res.status(500).json({
      error: "Failed to update reservation status.",
    });
  }
};
