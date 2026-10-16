import { pool } from '../config/database';
import { RoomRecord, CreateRoomDTO } from '../types/roomType';

export class RoomService {
  
  // 1. Ingest a new configuration dynamically linked to an accommodation UUID
  public async insertRoom(accommodationId: string, dto: CreateRoomDTO): Promise<RoomRecord> {
    const { room_type, capacity, price_per_night, is_available } = dto;

    // Aligned exactly to: accommodation_id, room_type, capacity, price_per_night, is_available
    const result = await pool.query(
      `INSERT INTO rooms 
      (accommodation_id, room_type, capacity, price_per_night, is_available) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`,
      [
        accommodationId,
        room_type,
        capacity,
        price_per_night,
        is_available !== undefined ? is_available : true // Defaults to true if left unspecified by the admin panel
      ]
    );

    return result.rows[0];
  }

  // 2. Fetch all configuration rooms belonging to a single accommodation property
  public async getRoomsByAccommodation(accommodationId: string): Promise<RoomRecord[]> {
    const result = await pool.query(
      'SELECT * FROM rooms WHERE accommodation_id = \$1 ORDER BY created_at ASC',
      [accommodationId]
    );
    return result.rows;
  }
}
