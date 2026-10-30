
import { pool } from "../config/database";

export interface CreateAccommodationDTO {
  name: string;
  address: string;
  pricePerNight: number;
  description: string;
  starRating: number;
  status: "Draft" | "Published";
  facilities: string[];
  policies: string[];
  latitude: number | null;
  longitude: number | null;
  images: string[];
}

export interface CreateRoomInventoryDTO {
  roomTypeName: string;
  totalCapacity: number;
  nightlyRate: number;
}

export class HotelService {
  public async getAccommodationById(
    accommodationId: string
  ): Promise<Record<string, unknown> | null> {
    const result = await pool.query(
      `SELECT * FROM accommodations WHERE id = $1 LIMIT 1`,
      [accommodationId]
    );

    return result.rows[0] ?? null;
  }

  public async getFilteredAccommodations(
    search?: string,
    status?: string
  ): Promise<Record<string, unknown>[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (search?.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(
        `(name ILIKE $${values.length} OR address ILIKE $${values.length})`
      );
    }

    if (status?.trim()) {
      values.push(status.trim());
      conditions.push(`status = $${values.length}`);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const result = await pool.query(
      `SELECT *
       FROM accommodations
       ${where}
       ORDER BY id DESC`,
      values
    );

    return result.rows;
  }

  public async insertAccommodation(
    dto: CreateAccommodationDTO
  ): Promise<Record<string, unknown>> {
    const result = await pool.query(
      `INSERT INTO accommodations (
        name,
        address,
        price_per_night,
        description,
        star_rating,
        status,
        facilities,
        policies,
        latitude,
        longitude,
        images
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7::jsonb, $8, $9, $10, $11
      )
      RETURNING *`,
      [
        dto.name,
        dto.address,
        dto.pricePerNight,
        dto.description,
        dto.starRating,
        dto.status,
        JSON.stringify(dto.facilities),
        dto.policies,
        dto.latitude,
        dto.longitude,
        dto.images,
      ]
    );

    return result.rows[0];
  }

  public async updateAccommodation(
    accommodationId: string,
    dto: CreateAccommodationDTO
  ): Promise<Record<string, unknown> | null> {
    const result = await pool.query(
      `UPDATE accommodations
       SET name = $1,
           address = $2,
           price_per_night = $3,
           description = $4,
           star_rating = $5,
           status = $6,
           facilities = $7::jsonb,
           policies = $8,
           latitude = $9,
           longitude = $10,
           images = $11
       WHERE id = $12
       RETURNING *`,
      [
        dto.name,
        dto.address,
        dto.pricePerNight,
        dto.description,
        dto.starRating,
        dto.status,
        JSON.stringify(dto.facilities),
        dto.policies,
        dto.latitude,
        dto.longitude,
        dto.images,
        accommodationId,
      ]
    );

    return result.rows[0] ?? null;
  }

  public async deleteAccommodation(
    accommodationId: string
  ): Promise<boolean> {
    const client = await pool.connect();
    let transactionStarted = false;

    try {
      await client.query("BEGIN");
      transactionStarted = true;

      const accommodation = await client.query(
        `SELECT id
         FROM accommodations
         WHERE id = $1
         FOR UPDATE`,
        [accommodationId]
      );

      if (accommodation.rowCount === 0) {
        await client.query("ROLLBACK");
        transactionStarted = false;
        return false;
      }

      // Protect accommodations that already have reservations.
      const reservationCheck = await client.query(
        `SELECT r.id
         FROM reservations r
         JOIN room_inventories ri
           ON ri.id = r.room_inventory_id
         WHERE ri.accommodation_id = $1
         LIMIT 1`,
        [accommodationId]
      );

      if ((reservationCheck.rowCount ?? 0) > 0) {
        throw new Error(
          "This accommodation has reservations and cannot be deleted."
        );
      }

      await client.query(
        `DELETE FROM room_inventories
         WHERE accommodation_id = $1`,
        [accommodationId]
      );

      await client.query(
        `DELETE FROM accommodations
         WHERE id = $1`,
        [accommodationId]
      );

      await client.query("COMMIT");
      transactionStarted = false;

      return true;
    } catch (error) {
      if (transactionStarted) {
        await client.query("ROLLBACK");
      }

      throw error;
    } finally {
      client.release();
    }
  }

  public async insertRoomInventory(
    accommodationId: string,
    dto: CreateRoomInventoryDTO
  ): Promise<Record<string, unknown>> {
    const result = await pool.query(
      `INSERT INTO room_inventories (
        accommodation_id,
        room_type_name,
        total_capacity,
        occupied_count,
        nightly_rate
      )
      VALUES ($1, $2, $3, 0, $4)
      RETURNING *`,
      [
        accommodationId,
        dto.roomTypeName,
        dto.totalCapacity,
        dto.nightlyRate,
      ]
    );

    return result.rows[0];
  }

  public async getRoomInventory(
    accommodationId: string
  ): Promise<Record<string, unknown>[]> {
    const result = await pool.query(
      `SELECT *
       FROM room_inventories
       WHERE accommodation_id = $1
       ORDER BY id DESC`,
      [accommodationId]
    );

    return result.rows;
  }

  public async computeDashboardSnapshot(): Promise<
    Record<string, number>
  > {
    const result = await pool.query(
      `SELECT
         COUNT(*)::int AS total_accommodations,
         COUNT(*) FILTER (
           WHERE status = 'Published'
         )::int AS published_accommodations,
         COUNT(*) FILTER (
           WHERE status = 'Draft'
         )::int AS draft_accommodations
       FROM accommodations`
    );

    return result.rows[0];
  }
}
