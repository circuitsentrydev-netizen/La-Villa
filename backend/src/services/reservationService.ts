
import { pool } from "../config/database";

export class ReservationService {
  public async getAllReservations(): Promise<any[]> {
    const result = await pool.query(`
      SELECT
        r.id,
        r.reservation_code,
        r.guest_name,
        r.accommodation_id,
        r.room_inventory_id,
        r.check_in_date,
        r.check_out_date,
        r.status,
        r.total_amount,
        a.name AS accommodation_name,
        a.address AS accommodation_address,
        ri.room_type_name
      FROM reservations r
      LEFT JOIN accommodations a
        ON a.id = r.accommodation_id
      LEFT JOIN room_inventories ri
        ON ri.id = r.room_inventory_id
      ORDER BY r.check_in_date DESC, r.id DESC
    `);

    return result.rows;
  }

  public async updateReservationStatus(
    id: number,
    status: string
  ): Promise<any | null> {
    const result = await pool.query(
      `UPDATE reservations
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    return result.rows[0] ?? null;
  }
}
