
import { Request, Response } from "express";
import { ReservationService } from "../services/reservationService";

const reservationService = new ReservationService();

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
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const isValidUuid = (value: unknown): value is string => {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
};

/**
 * Create a reservation for the authenticated user.
 *
 * The user ID comes from the verified JWT, never from the request body.
 */
export const createReservation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = req.user;

    if (!authenticatedUser?.id || !isValidUuid(authenticatedUser.id)) {
      res.status(401).json({
        message: "You must be signed in to make a reservation.",
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
    const guests = Number(guest_count);

    if (!Number.isInteger(inventoryId) || inventoryId <= 0) {
      res.status(400).json({
        message: "Select a valid room type.",
      });
      return;
    }

    if (!Number.isInteger(guests) || guests < 1) {
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
      user_id: authenticatedUser.id,
      guest_name: guest_name.trim(),
      accommodation_id,
      room_inventory_id: inventoryId,
      guest_count: guests,
      check_in_date,
      check_out_date,
    });

    res.status(201).json({
      message: "Reservation submitted successfully.",
      reservation,
    });
  } catch (error) {
    const errors: Record<string, { status: number; message: string }> = {
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
    };

    if (error instanceof Error && errors[error.message]) {
      const knownError = errors[error.message];

      res.status(knownError.status).json({
        message: knownError.message,
      });
      return;
    }

    console.error("Error creating reservation:", error);

    res.status(500).json({
      message: "Failed to create reservation.",
    });
  }
};

/**
 * Return reservation history for the currently authenticated user only.
 */
export const getMyReservations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = req.user;

    if (!authenticatedUser?.id || !isValidUuid(authenticatedUser.id)) {
      res.status(401).json({
        message: "You must be signed in to view your reservations.",
      });
      return;
    }

    const reservations = await reservationService.getUserReservations(
      authenticatedUser.id
    );

    res.status(200).json({
      reservations,
    });
  } catch (error) {
    console.error("Error fetching user's reservations:", error);

    res.status(500).json({
      message: "Failed to fetch your reservation history.",
    });
  }
};

/**
 * Existing admin endpoint: return all reservations.
 */
export const getAllReservations = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const reservations = await reservationService.getAllReservations();

    res.status(200).json({
      reservations,
    });
  } catch (error) {
    console.error("Error fetching reservations:", error);

    res.status(500).json({
      error: "Failed to fetch reservations.",
    });
  }
};

/**
 * Existing admin endpoint: update a reservation's status.
 */
export const updateReservationStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body ?? {};

    if (!Number.isInteger(id) || id <= 0) {
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
    console.error("Error updating reservation:", error);

    res.status(500).json({
      error: "Failed to update reservation status.",
    });
  }
};
