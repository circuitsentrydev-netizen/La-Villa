
import { Router } from "express";
import {createReservation, getAllReservations,updateReservationStatus,} from "../controllers/reservationController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// A logged-in customer must submit a reservation.

router.post("/",
     authMiddleware.requireAuth,
      createReservation
    );

// Admin-only reservation management.

router.get(
  "/",
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  getAllReservations
);

router.patch(
  "/:id/status",
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  updateReservationStatus
);

export default router;
