import { Request, Response } from "express";
import { ReviewService } from "../services/reviewService";

const reviewService = new ReviewService();

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_REGEX.test(value);

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

const getAuthenticatedUserId = (req: Request): string | null => {
  const userId = req.user?.id;
  return isValidUuid(userId) ? userId : null;
};

const validateReviewInput = (
  ratingValue: unknown,
  commentValue: unknown
): { rating: number; comment: string | null } | null => {
  const rating = Number(ratingValue);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null;
  }

  if (
    commentValue !== undefined &&
    commentValue !== null &&
    typeof commentValue !== "string"
  ) {
    return null;
  }

  const comment =
    typeof commentValue === "string" ? commentValue.trim() : "";

  if (comment.length > 2000) {
    return null;
  }

  return {
    rating,
    comment: comment.length > 0 ? comment : null,
  };
};

/**
 * GET /api/reviews/accommodation/:accommodationId
 * Public: list reviews for an accommodation.
 */
export const getReviewsByAccommodation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { accommodationId } = req.params;

    if (!isValidUuid(accommodationId)) {
      res.status(400).json({ error: "Invalid accommodation ID." });
      return;
    }

    const exists = await reviewService.accommodationExists(accommodationId);

    if (!exists) {
      res.status(404).json({ error: "Accommodation not found." });
      return;
    }

    const [reviews, summary] = await Promise.all([
      reviewService.getReviewsByAccommodation(accommodationId),
      reviewService.getReviewSummary(accommodationId),
    ]);

    res.status(200).json({ reviews, summary });
  } catch (error) {
    console.error("Error retrieving accommodation reviews:", error);
    res.status(500).json({ error: "Unable to load reviews." });
  }
};

/**
 * GET /api/reviews/accommodation/:accommodationId/mine
 * Protected: get the signed-in user's review for an accommodation.
 */
export const getMyAccommodationReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { accommodationId } = req.params;

    if (!userId) {
      res.status(401).json({ error: "Please sign in again." });
      return;
    }

    if (!isValidUuid(accommodationId)) {
      res.status(400).json({ error: "Invalid accommodation ID." });
      return;
    }

    const exists = await reviewService.accommodationExists(accommodationId);

    if (!exists) {
      res.status(404).json({ error: "Accommodation not found." });
      return;
    }

    const review = await reviewService.getUserReview(
      userId,
      accommodationId
    );

    res.status(200).json({ review });
  } catch (error) {
    console.error("Error retrieving user's accommodation review:", error);
    res.status(500).json({ error: "Unable to load your review." });
  }
};

/**
 * POST /api/reviews/accommodation/:accommodationId
 * Protected: create one review for an accommodation.
 */
export const createReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { accommodationId } = req.params;

    if (!userId) {
      res.status(401).json({ error: "Please sign in to leave a review." });
      return;
    }

    if (!isValidUuid(accommodationId)) {
      res.status(400).json({ error: "Invalid accommodation ID." });
      return;
    }

    const input = validateReviewInput(req.body?.rating, req.body?.comment);

    if (!input) {
      res.status(400).json({
        error:
          "Rating must be a whole number from 1 to 5, and the comment must be 2,000 characters or fewer.",
      });
      return;
    }

    const exists = await reviewService.accommodationExists(accommodationId);

    if (!exists) {
      res.status(404).json({ error: "Accommodation not found." });
      return;
    }

    const existingReview = await reviewService.getUserReview(
      userId,
      accommodationId
    );

    if (existingReview) {
      res.status(409).json({
        error:
          "You have already reviewed this accommodation. Edit your existing review instead.",
        review: existingReview,
      });
      return;
    }

    const review = await reviewService.createReview({
      user_id: userId,
      accommodation_id: accommodationId,
      rating: input.rating,
      comment: input.comment,
    });

    res.status(201).json({
      message: "Your review has been submitted.",
      review,
    });
  } catch (error) {
    // PostgreSQL unique-constraint violation, if a unique index exists.
    const code = (error as { code?: string })?.code;

    if (code === "23505") {
      res.status(409).json({
        error:
          "You have already reviewed this accommodation. Edit your existing review instead.",
      });
      return;
    }

    console.error("Error creating review:", error);
    res.status(500).json({ error: "Unable to submit your review." });
  }
};

/**
 * PATCH /api/reviews/:reviewId
 * Protected: update only the signed-in user's review.
 */
export const updateReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { reviewId } = req.params;

    if (!userId) {
      res.status(401).json({ error: "Please sign in again." });
      return;
    }

    if (!isValidUuid(reviewId)) {
      res.status(400).json({ error: "Invalid review ID." });
      return;
    }

    const input = validateReviewInput(req.body?.rating, req.body?.comment);

    if (!input) {
      res.status(400).json({
        error:
          "Rating must be a whole number from 1 to 5, and the comment must be 2,000 characters or fewer.",
      });
      return;
    }

    const review = await reviewService.updateReview(reviewId, userId, {
      rating: input.rating,
      comment: input.comment,
    });

    if (!review) {
      const exists = await reviewService.reviewExists(reviewId);

      res.status(exists ? 403 : 404).json({
        error: exists
          ? "You can only edit your own review."
          : "Review not found.",
      });
      return;
    }

    res.status(200).json({
      message: "Your review has been updated.",
      review,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "Unable to update your review." });
  }
};

/**
 * DELETE /api/reviews/:reviewId
 * Protected: delete only the signed-in user's review.
 */
export const deleteReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { reviewId } = req.params;

    if (!userId) {
      res.status(401).json({ error: "Please sign in again." });
      return;
    }

    if (!isValidUuid(reviewId)) {
      res.status(400).json({ error: "Invalid review ID." });
      return;
    }

    const deleted = await reviewService.deleteReview(reviewId, userId);

    if (!deleted) {
      const exists = await reviewService.reviewExists(reviewId);

      res.status(exists ? 403 : 404).json({
        error: exists
          ? "You can only delete your own review."
          : "Review not found.",
      });
      return;
    }

    res.status(200).json({ message: "Your review has been deleted." });
  } catch (error) {
    console.error(
      `Error deleting review (${getErrorMessage(error)}):`,
      error
    );

    res.status(500).json({ error: "Unable to delete your review." });
  }
};
