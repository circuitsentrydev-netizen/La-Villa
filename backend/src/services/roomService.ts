
import { pool } from "../config/database";
import { RoomRecord, CreateRoomDTO } from "../types/roomType";

export class RoomService {
  public async insertRoom(
    accommodationId: string,
    dto: CreateRoomDTO
  ): Promise<RoomRecord> {
    const { room_type, capacity, price_per_night, is_available } = dto;

    const result = await pool.query(
      `INSERT INTO rooms (
        accommodation_id,
        room_type,
        capacity,
        price_per_night,
        is_available
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        accommodationId,
        room_type,
        capacity,
        price_per_night,
        is_available ?? true
      ]
    );

    return result.rows[0] as RoomRecord;
  }

  public async getRoomsByAccommodation(
    accommodationId: string
  ): Promise<RoomRecord[]> {
    const result = await pool.query(
      `SELECT *
       FROM rooms
       WHERE accommodation_id = $1
       ORDER BY created_at ASC`,
      [accommodationId]
    );

    return result.rows as RoomRecord[];
  }
}
