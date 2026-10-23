
import { randomBytes } from "crypto";
import { pool } from "../config/database";

interface CreateReservationInput {
  user_id: string;
  guest_name: string;
  accommodation_id: string;
  room_inventory_id: number;
  guest_count: number;
  check_in_date: string;
  check_out_date: string;
}

export class ReservationService {
  async createReservation(input: CreateReservationInput) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const roomResult = await client.query(
        `SELECT id, accommodation_id, total_capacity,
                total_rooms, nightly_rate
         FROM room_inventories
         WHERE id = $1 AND accommodation_id = $2
         FOR UPDATE`,
        [input.room_inventory_id, input.accommodation_id]
      );

      if (!roomResult.rowCount) {
        throw new Error("ROOM_NOT_FOUND");
      }

      const room = roomResult.rows[0];

      if (
        !Number.isInteger(input.guest_count) ||
        input.guest_count < 1 ||
        input.guest_count > Number(room.total_capacity)
      ) {
        throw new Error("GUEST_CAPACITY_EXCEEDED");
      }

      if (Number(room.total_rooms) < 1) {
        throw new Error("NO_ROOMS_CONFIGURED");
      }

      const availability = await client.query(
        `SELECT COUNT(*)::int AS booked
         FROM reservations
         WHERE room_inventory_id = $1
           AND status IN ('Pending', 'Confirmed')
           AND check_in_date < $3::date
           AND check_out_date > $2::date`,
        [
          input.room_inventory_id,
          input.check_in_date,
          input.check_out_date,
        ]
      );

      if (
        Number(availability.rows[0].booked) >=
        Number(room.total_rooms)
      ) {
        throw new Error("NO_ROOMS_AVAILABLE");
      }

      const duration = await client.query(
        `SELECT ($2::date - $1::date)::int AS nights`,
        [input.check_in_date, input.check_out_date]
      );

      const nights = Number(duration.rows[0].nights);
      const total = Number(
        (Number(room.nightly_rate) * nights).toFixed(2)
      );

      if (nights < 1 || !Number.isFinite(total) || total <= 0) {
        throw new Error("INVALID_TOTAL_AMOUNT");
      }

      const code = `LV-${randomBytes(6)
        .toString("hex")
        .toUpperCase()}`;

      const result = await client.query(
        `INSERT INTO reservations (
          user_id, reservation_code, guest_name,
          accommodation_id, room_inventory_id, guest_count,
          check_in_date, check_out_date, status, total_amount
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7::date,$8::date,'Pending',$9)
        RETURNING id, user_id, reservation_code, guest_name,
          guest_count, accommodation_id, room_inventory_id,
          check_in_date, check_out_date, status, total_amount`,
        [
          input.user_id,
          code,
          input.guest_name.trim(),
          input.accommodation_id,
          input.room_inventory_id,
          input.guest_count,
          input.check_in_date,
          input.check_out_date,
          total,
        ]
      );

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserReservations(userId: string) {
    const result = await pool.query(
      `SELECT
         r.id, r.reservation_code, r.guest_name,
         r.guest_count, r.accommodation_id, r.room_inventory_id,
         r.check_in_date, r.check_out_date, r.status,
         r.total_amount, a.name AS accommodation_name,
         a.address AS accommodation_address,
         ri.room_type_name
       FROM reservations r
       LEFT JOIN accommodations a ON a.id = r.accommodation_id
       LEFT JOIN room_inventories ri ON ri.id = r.room_inventory_id
       WHERE r.user_id = $1
       ORDER BY r.check_in_date DESC, r.id DESC`,
      [userId]
    );

    return result.rows;
  }

  async getAllReservations() {
    const result = await pool.query(`
      SELECT r.id, r.reservation_code, r.guest_name,
        r.guest_count, r.accommodation_id, r.room_inventory_id,
        r.check_in_date, r.check_out_date, r.status,
        r.total_amount, a.name AS accommodation_name,
        a.address AS accommodation_address, ri.room_type_name
      FROM reservations r
      LEFT JOIN accommodations a ON a.id = r.accommodation_id
      LEFT JOIN room_inventories ri ON ri.id = r.room_inventory_id
      ORDER BY r.check_in_date DESC, r.id DESC
    `);

    return result.rows;
  }

  async updateReservationStatus(id: number, status: string) {
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
