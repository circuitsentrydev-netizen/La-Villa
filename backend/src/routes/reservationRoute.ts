
import { Router } from "express";
import {
  createReservation,
  getAllReservations,
  getMyReservations,
  updateReservationStatus,
  verifyPayment,
} from "../controllers/reservationController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Customer: create a reservation
router.post(
  "/",
  authMiddleware.requireAuth,
  createReservation
);

// Customer: verify a Paystack transaction
router.post(
  "/verify-payment",
  authMiddleware.requireAuth,
  verifyPayment
);

// Customer: retrieve their own reservations
router.get(
  "/mine",
  authMiddleware.requireAuth,
  getMyReservations
);

// Admin: retrieve all reservations
router.get(
  "/",
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  getAllReservations
);

// Admin: update reservation status
router.patch(
  "/:id/status",
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  updateReservationStatus
);

export default router;
