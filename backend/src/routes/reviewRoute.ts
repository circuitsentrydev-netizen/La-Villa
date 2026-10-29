import { Router } from "express";
import {
  createReview,
  deleteReview,
  getMyAccommodationReview,
  getReviewsByAccommodation,
  updateReview,
} from "../controllers/reviewController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Public: view accommodation reviews and ratings.
router.get(
  "/accommodation/:accommodationId",
  getReviewsByAccommodation
);

// Protected: view the signed-in user's review.
router.get(
  "/accommodation/:accommodationId/mine",
  authMiddleware.requireAuth,
  getMyAccommodationReview
);

// Protected: submit a review.
router.post(
  "/accommodation/:accommodationId",
  authMiddleware.requireAuth,
  createReview
);

// Protected: edit or delete an owned review.
router.patch(
  "/:reviewId",
  authMiddleware.requireAuth,
  updateReview
);

router.delete(
  "/:reviewId",
  authMiddleware.requireAuth,
  deleteReview
);

export default router;
