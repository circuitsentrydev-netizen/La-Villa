
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

interface CreatePaymentInput {
  reservation_id: number;
  reference: string;
  amount_minor: number;
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
          check_in_date, check_out_date, status, total_amount,
          payment_status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7::date,$8::date,
                'Pending',$9,'Pending')
        RETURNING id, user_id, reservation_code, guest_name,
          guest_count, accommodation_id, room_inventory_id,
          check_in_date, check_out_date, status, total_amount,
          payment_status`,
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
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve the original error.
      }

      throw error;
    } finally {
      client.release();
    }
  }

  async createPaymentAttempt(input: CreatePaymentInput) {
    const result = await pool.query(
      `INSERT INTO payments (
         reservation_id, reference, amount_minor,
         currency, status
       )
       SELECT r.id, $2, $3, 'ZAR', 'Pending'
       FROM reservations r
       WHERE r.id = $1
         AND r.payment_status = 'Pending'
         AND r.status = 'Pending'
       RETURNING id, reservation_id, reference,
                 amount_minor, currency, status`,
      [
        input.reservation_id,
        input.reference,
        input.amount_minor,
      ]
    );

    if (!result.rowCount) {
      throw new Error("RESERVATION_NOT_PAYABLE");
    }

    return result.rows[0];
  }

  async getPaymentForUser(reference: string, userId: string) {
    const result = await pool.query(
      `SELECT
         p.id AS payment_id,
         p.reservation_id,
         p.reference,
         p.amount_minor,
         p.currency,
         p.status AS status,
         p.status AS payment_attempt_status,
         r.reservation_code,
         r.user_id,
         r.total_amount,
         r.status AS reservation_status,
         r.payment_status
       FROM payments p
       INNER JOIN reservations r ON r.id = p.reservation_id
       WHERE p.reference = $1
         AND r.user_id = $2
       LIMIT 1`,
      [reference, userId]
    );

    return result.rows[0] ?? null;
  }

  async confirmPayment(
    reference: string,
    verifiedAmountMinor: number,
    verifiedCurrency: string
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `SELECT
           p.id AS payment_id,
           p.reservation_id,
           p.amount_minor,
           p.currency,
           p.status AS payment_attempt_status,
           r.reservation_code,
           r.total_amount,
           r.status AS reservation_status,
           r.payment_status
         FROM payments p
         INNER JOIN reservations r ON r.id = p.reservation_id
         WHERE p.reference = $1
         FOR UPDATE OF p, r`,
        [reference]
      );

      if (!result.rowCount) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      const payment = result.rows[0];

      const expectedMinor = Math.round(
        Number(payment.total_amount) * 100
      );

      if (
        Number(payment.amount_minor) !== verifiedAmountMinor ||
        expectedMinor !== verifiedAmountMinor ||
        String(payment.currency).toUpperCase() !==
          verifiedCurrency.toUpperCase() ||
        verifiedCurrency.toUpperCase() !== "ZAR"
      ) {
        throw new Error("PAYMENT_AMOUNT_MISMATCH");
      }

      if (
        payment.payment_status === "Paid" &&
        payment.payment_attempt_status === "Paid"
      ) {
        await client.query("COMMIT");

        return {
          alreadyPaid: true,
          reservationId: payment.reservation_id,
          reservation_code: payment.reservation_code,
        };
      }

      // Never confirm a cancelled or completed reservation.
      if (
        payment.reservation_status === "Cancelled" ||
        payment.reservation_status === "Completed"
      ) {
        throw new Error("RESERVATION_NOT_PAYABLE");
      }

      if (payment.payment_status === "Paid") {
        throw new Error("RESERVATION_ALREADY_PAID");
      }

      await client.query(
        `UPDATE payments
         SET status = 'Paid', paid_at = NOW()
         WHERE id = $1`,
        [payment.payment_id]
      );

      await client.query(
        `UPDATE reservations
         SET payment_status = 'Paid',
             payment_reference = $1,
             paid_at = NOW(),
             status = 'Confirmed'
         WHERE id = $2`,
        [reference, payment.reservation_id]
      );

      await client.query("COMMIT");

      return {
        alreadyPaid: false,
        reservationId: payment.reservation_id,
        reservation_code: payment.reservation_code,
      };
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve the original error.
      }

      throw error;
    } finally {
      client.release();
    }
  }

  async markPaymentFailed(reference: string) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const paymentResult = await client.query(
        `SELECT id, reservation_id, status
         FROM payments
         WHERE reference = $1
         FOR UPDATE`,
        [reference]
      );

      if (!paymentResult.rowCount) {
        await client.query("COMMIT");
        return;
      }

      const payment = paymentResult.rows[0];

      if (payment.status !== "Paid") {
        await client.query(
          `UPDATE payments
           SET status = 'Failed'
           WHERE id = $1`,
          [payment.id]
        );

        await client.query(
          `UPDATE reservations r
           SET payment_status = 'Failed',
               status = 'Cancelled'
           WHERE r.id = $1
             AND r.payment_status <> 'Paid'
             AND r.status = 'Pending'
             AND NOT EXISTS (
               SELECT 1
               FROM payments p
               WHERE p.reservation_id = r.id
                 AND p.status = 'Paid'
             )`,
          [payment.reservation_id]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve the original error.
      }

      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Customer self-service cancellation.
   * Only the owner of a Pending, unpaid reservation may cancel it.
   * Paid or confirmed reservations must be handled by La Villa.
   */
  async cancelPendingReservation(id: number, userId: string) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `SELECT id, user_id, status, payment_status
         FROM reservations
         WHERE id = $1
         FOR UPDATE`,
        [id]
      );

      if (!result.rowCount) {
        throw new Error("RESERVATION_NOT_FOUND");
      }

      const reservation = result.rows[0];

      // Return the same error for another user's reservation
      // so its existence is not disclosed.
      if (reservation.user_id !== userId) {
        throw new Error("RESERVATION_NOT_FOUND");
      }

      if (
        reservation.status !== "Pending" ||
        reservation.payment_status !== "Pending"
      ) {
        throw new Error("CANCELLATION_NOT_ALLOWED");
      }

      const paymentResult = await client.query(
        `SELECT id
         FROM payments
         WHERE reservation_id = $1
           AND status = 'Paid'
         LIMIT 1`,
        [id]
      );

      if (paymentResult.rowCount) {
        throw new Error("CANCELLATION_NOT_ALLOWED");
      }

      const updated = await client.query(
        `UPDATE reservations
         SET status = 'Cancelled'
         WHERE id = $1
           AND user_id = $2
           AND status = 'Pending'
           AND payment_status = 'Pending'
         RETURNING id, reservation_code, status, payment_status`,
        [id, userId]
      );

      if (!updated.rowCount) {
        throw new Error("CANCELLATION_NOT_ALLOWED");
      }

      await client.query("COMMIT");
      return updated.rows[0];
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve the original error.
      }

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
         r.total_amount, r.payment_status,
         r.payment_reference, r.paid_at,
         a.name AS accommodation_name,
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
      SELECT
        r.id, r.reservation_code, r.guest_name,
        r.guest_count, r.accommodation_id, r.room_inventory_id,
        r.check_in_date, r.check_out_date, r.status,
        r.total_amount, r.payment_status,
        r.payment_reference, r.paid_at,
        a.name AS accommodation_name,
        a.address AS accommodation_address,
        ri.room_type_name
      FROM reservations r
      LEFT JOIN accommodations a ON a.id = r.accommodation_id
      LEFT JOIN room_inventories ri ON ri.id = r.room_inventory_id
      ORDER BY r.check_in_date DESC, r.id DESC
    `);

    return result.rows;
  }

  async updateReservationStatus(id: number, status: string) {
    if (status === "Confirmed") {
      const check = await pool.query(
        `SELECT payment_status
         FROM reservations
         WHERE id = $1`,
        [id]
      );

      if (
        !check.rowCount ||
        check.rows[0].payment_status !== "Paid"
      ) {
        throw new Error("PAYMENT_REQUIRED");
      }
    }

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
