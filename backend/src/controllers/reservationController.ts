
import { Request, Response } from "express";
import { ReservationService } from "../services/reservationService";

const reservationService = new ReservationService();

export const getAllReservations = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const reservations =
      await reservationService.getAllReservations();

    res.status(200).json(reservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);

    res.status(500).json({
      error: "Failed to fetch reservations.",
    });
  }
};

export const updateReservationStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        error: "Invalid reservation ID.",
      });
      return;
    }

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Cancelled",
      "Completed",
    ];

    if (
      typeof status !== "string" ||
      !allowedStatuses.includes(status)
    ) {
      res.status(400).json({
        error: `Status must be one of: ${allowedStatuses.join(", ")}.`,
      });
      return;
    }

    const reservation =
      await reservationService.updateReservationStatus(id, status);

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
