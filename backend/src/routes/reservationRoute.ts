
import { Router } from "express";
import {
  createReservation,
  getAllReservations,
  getMyReservations,
  updateReservationStatus,
} from "../controllers/reservationController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/", authMiddleware.requireAuth, createReservation);

router.get("/mine", authMiddleware.requireAuth, getMyReservations);

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
