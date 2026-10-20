
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
      `SELECT *
       FROM accommodations
       WHERE id = $1
       LIMIT 1`,
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
        `(name ILIKE $${values.length}
          OR address ILIKE $${values.length})`
      );
    }

    if (status?.trim()) {
      values.push(status.trim());
      conditions.push(`status = $${values.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const result = await pool.query(
      `SELECT *
       FROM accommodations
       ${whereClause}
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
        $7, $8, $9, $10, $11
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
        JSON.stringify(dto.policies),
        dto.latitude,
        dto.longitude,
        JSON.stringify(dto.images),
      ]
    );

    return result.rows[0];
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
