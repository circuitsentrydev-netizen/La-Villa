
import { Router } from "express";
import {
  getAllReservations,
  updateReservationStatus,
} from "../controllers/reservationController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Admin-only reservation listing
router.get(
  "/",
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  getAllReservations
);

// Admin-only reservation status update
router.patch(
  "/:id/status",
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  updateReservationStatus
);

export default router;
