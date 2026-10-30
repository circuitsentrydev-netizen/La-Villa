
import { Router } from "express";
import {
  createReservation,
  getAllReservations,
  getMyReservations,
  updateReservationStatus,
  verifyPayment,
  cancelMyReservation,
} from "../controllers/reservationController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Customer: create a reservation and initialize Paystack checkout.
router.post(
  "/",
  authMiddleware.requireAuth,
  createReservation
);

// Customer: verify payment with Paystack.
router.post(
  "/verify-payment",
  authMiddleware.requireAuth,
  verifyPayment
);

// Customer: retrieve their own reservation history.
router.get(
  "/mine",
  authMiddleware.requireAuth,
  getMyReservations
);

// Customer: cancel their own Pending, unpaid reservation only.
router.patch(
  "/:id/cancel",
  authMiddleware.requireAuth,
  cancelMyReservation
);

// Admin: retrieve all reservations.
router.get(
  "/",
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  getAllReservations
);

// Admin: update reservation status.
router.patch(
  "/:id/status",
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  updateReservationStatus
);

export default router;
