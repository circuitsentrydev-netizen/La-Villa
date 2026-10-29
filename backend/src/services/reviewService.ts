import { query } from "../config/database";
import {
  AccommodationReviewSummary,
  CreateReviewInput,
  Review,
  UpdateReviewInput,
} from "../types/reviewType";

export class ReviewService {
  /**
   * Get all reviews for an accommodation.
   */
  async getReviewsByAccommodation(
    accommodationId: string
  ): Promise<Review[]> {
    const result = await query(
      `SELECT
         id,
         user_id,
         accommodation_id,
         rating,
         comment,
         created_at
       FROM reviews
       WHERE accommodation_id = $1
       ORDER BY created_at DESC`,
      [accommodationId]
    );

    return result.rows as Review[];
  }

  /**
   * Get the average rating and review count.
   */
  async getReviewSummary(
    accommodationId: string
  ): Promise<AccommodationReviewSummary> {
    const result = await query(
      `SELECT
         $1::uuid AS accommodation_id,
         COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::float
           AS average_rating,
         COUNT(*)::int AS review_count
       FROM reviews
       WHERE accommodation_id = $1`,
      [accommodationId]
    );

    return result.rows[0] as AccommodationReviewSummary;
  }

  /**
   * Get one user's review for one accommodation.
   */
  async getUserReview(
    userId: string,
    accommodationId: string
  ): Promise<Review | null> {
    const result = await query(
      `SELECT
         id,
         user_id,
         accommodation_id,
         rating,
         comment,
         created_at
       FROM reviews
       WHERE user_id = $1
         AND accommodation_id = $2
       LIMIT 1`,
      [userId, accommodationId]
    );

    return (result.rows[0] as Review | undefined) ?? null;
  }

  /**
   * Create a review.
   */
  async createReview(input: CreateReviewInput): Promise<Review> {
    const result = await query(
      `INSERT INTO reviews (
         user_id,
         accommodation_id,
         rating,
         comment
       )
       VALUES ($1, $2, $3, $4)
       RETURNING
         id,
         user_id,
         accommodation_id,
         rating,
         comment,
         created_at`,
      [
        input.user_id,
        input.accommodation_id,
        input.rating,
        input.comment,
      ]
    );

    return result.rows[0] as Review;
  }

  /**
   * Update only a review belonging to the signed-in user.
   */
  async updateReview(
    reviewId: string,
    userId: string,
    input: UpdateReviewInput
  ): Promise<Review | null> {
    const result = await query(
      `UPDATE reviews
       SET rating = $1,
           comment = $2
       WHERE id = $3
         AND user_id = $4
       RETURNING
         id,
         user_id,
         accommodation_id,
         rating,
         comment,
         created_at`,
      [input.rating, input.comment, reviewId, userId]
    );

    return (result.rows[0] as Review | undefined) ?? null;
  }

  /**
   * Delete only a review belonging to the signed-in user.
   */
  async deleteReview(
    reviewId: string,
    userId: string
  ): Promise<boolean> {
    const result = await query(
      `DELETE FROM reviews
       WHERE id = $1
         AND user_id = $2
       RETURNING id`,
      [reviewId, userId]
    );

    // rowCount can be null in the PostgreSQL result type.
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Check whether an accommodation exists.
   */
  async accommodationExists(
    accommodationId: string
  ): Promise<boolean> {
    const result = await query(
      `SELECT id
       FROM accommodations
       WHERE id = $1
       LIMIT 1`,
      [accommodationId]
    );

    return result.rows.length > 0;
  }

  /**
   * Check whether a review exists.
   */
  async reviewExists(reviewId: string): Promise<boolean> {
    const result = await query(
      `SELECT id
       FROM reviews
       WHERE id = $1
       LIMIT 1`,
      [reviewId]
    );

    return result.rows.length > 0;
  }
}
