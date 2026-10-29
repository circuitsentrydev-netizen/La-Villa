// backend/src/services/favoriteService.ts
import { pool } from "../config/database";
import type { FavoriteAccommodation } from "../types/favoriteType";

export class FavoriteService {
  async getFavorites(userId: string): Promise<FavoriteAccommodation[]> {
    const result = await pool.query(
      `SELECT
         f.accommodation_id AS id,
         f.accommodation_id,
         a.name,
         a.address,
         a.description,
         a.star_rating,
         a.price_per_night,
         a.images,
         f.created_at
       FROM favorites f
       INNER JOIN accommodations a
         ON a.id = f.accommodation_id
       WHERE f.user_id = $1
         AND (
           a.status IS NULL 
           OR LOWER(a.status) IN ('published', 'available', 'active')
         )
       ORDER BY f.created_at DESC NULLS LAST`,
      [userId]
    );

    return result.rows;
  }

  async addFavorite(
    userId: string,
    accommodationId: string
  ): Promise<boolean> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const accommodation = await client.query(
        `SELECT id
         FROM accommodations
         WHERE id = $1
           AND (
             status IS NULL 
             OR LOWER(status) IN ('published', 'available', 'active')
           )
         FOR SHARE`,
        [accommodationId]
      );

      if (accommodation.rowCount === 0) {
        await client.query("ROLLBACK");
        throw new Error("ACCOMMODATION_NOT_FOUND");
      }

      const result = await client.query(
        `INSERT INTO favorites (user_id, accommodation_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, accommodation_id) DO NOTHING
         RETURNING id`,
        [userId, accommodationId]
      );

      await client.query("COMMIT");

      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve original error
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async removeFavorite(
    userId: string,
    accommodationId: string
  ): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM favorites
       WHERE user_id = $1
         AND accommodation_id = $2
       RETURNING id`,
      [userId, accommodationId]
    );

    return (result.rowCount ?? 0) > 0;
  }
}