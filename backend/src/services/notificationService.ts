import { pool } from "../config/database";

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  metadata?: Record<string, unknown>;
}

export class NotificationService {
  
    // Create a notification for one user.

  async create(input: CreateNotificationInput) {
    const result = await pool.query(
      `INSERT INTO notifications (
         user_id,
         type,
         title,
         message,
         link,
         metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING *`,
      [
        input.userId,
        input.type,
        input.title,
        input.message,
        input.link ?? null,
        JSON.stringify(input.metadata ?? {}),
      ]
    );

    return result.rows[0];
  }

  // Create a notification for every active administrator.
  async createForAdmins(
    input: Omit<CreateNotificationInput, "userId">
  ) {
    const admins = await pool.query(
      `SELECT id
       FROM users
       WHERE UPPER(role) = 'ADMIN'
         AND is_active = TRUE`
    );

    if (!admins.rows.length) {
      return [];
    }

    const notifications = await Promise.all(
      admins.rows.map((admin) =>
        this.create({
          ...input,
          userId: admin.id,
        })
      )
    );

    return notifications;
  }

  // Retrieve notifications belonging to one user.
  async getForUser(userId: string, limit = 50) {
    const safeLimit = Math.min(
      Math.max(Number(limit) || 50, 1),
      100
    );

    const result = await pool.query(
      `SELECT
         id,
         type,
         title,
         message,
         link,
         metadata,
         is_read,
         read_at,
         created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, safeLimit]
    );

    return result.rows;
  }

  // Count unread notifications for one user.
  async getUnreadCount(userId: string) {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM notifications
       WHERE user_id = $1
         AND is_read = FALSE`,
      [userId]
    );

    return Number(result.rows[0]?.count ?? 0);
  }

  // Mark one user's notification as read.
  async markAsRead(
    notificationId: string,
    userId: string
  ) {
    const result = await pool.query(
      `UPDATE notifications
       SET
         is_read = TRUE,
         read_at = NOW()
       WHERE id = $1
         AND user_id = $2
       RETURNING id, is_read, read_at`,
      [notificationId, userId]
    );

    return result.rows[0] ?? null;
  }

  // Mark all notifications belonging to one user as read.
  async markAllAsRead(userId: string) {
    const result = await pool.query(
      `UPDATE notifications
       SET
         is_read = TRUE,
         read_at = NOW()
       WHERE user_id = $1
         AND is_read = FALSE`,
      [userId]
    );

    return result.rowCount ?? 0;
  }

  // Delete one notification belonging to one user.
  async deleteNotification(
    notificationId: string,
    userId: string
  ) {
    const result = await pool.query(
      `DELETE FROM notifications
       WHERE id = $1
         AND user_id = $2
       RETURNING id`,
      [notificationId, userId]
    );

    return Boolean(result.rowCount);
  }
}
