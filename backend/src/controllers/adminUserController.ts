
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/database";

const SALT_ROUNDS = 10;

const isValidUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );

const getAdminId = (req: Request): string | null => {
  const id = req.user?.id;
  return id && isValidUuid(id) ? id : null;
};

export const adminUserController = {
  /**
   * GET /api/admin/users
   * Lists customers and administrators.
   */
  getUsers: async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const result = await pool.query(
        `SELECT
           id,
           name,
           email,
           image AS avatar,
           UPPER(role) AS role,
           is_active,
           created_at
         FROM users
         ORDER BY created_at DESC`
      );

      res.status(200).json({
        users: result.rows,
      });
    } catch (error) {
      console.error("Admin user listing error:", error);

      res.status(500).json({
        message: "Unable to load registered users.",
      });
    }
  },

  /**
   * POST /api/admin/users/admins
   * Creates a new administrator using bcrypt password hashing.
   */
  createAdmin: async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const adminId = getAdminId(req);

    if (!adminId) {
      res.status(401).json({
        message: "Please sign in again.",
      });
      return;
    }

    const { name, email, password } = req.body ?? {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      res.status(400).json({
        message: "Name, email, and password are required.",
      });
      return;
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length > 100 || cleanEmail.length > 254) {
      res.status(400).json({
        message: "Name or email address is too long.",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({
        message: "Please provide a valid email address.",
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        message: "Password must contain at least 8 characters.",
      });
      return;
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
      res.status(400).json({
        message: "Password must not exceed 72 bytes.",
      });
      return;
    }

    let client;

    try {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      client = await pool.connect();

      await client.query("BEGIN");

      // Serialize administrator creation and status changes.
      await client.query(
        "SELECT pg_advisory_xact_lock($1)",
        [741852963]
      );

      const duplicate = await client.query(
        `SELECT id
         FROM users
         WHERE LOWER(email) = $1
         LIMIT 1`,
        [cleanEmail]
      );

      if (duplicate.rows.length > 0) {
        await client.query("ROLLBACK");

        res.status(409).json({
          message: "An account with this email address already exists.",
        });
        return;
      }

      const result = await client.query(
        `INSERT INTO users
           (name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, 'ADMIN', TRUE)
         RETURNING
           id,
           name,
           email,
           image AS avatar,
           UPPER(role) AS role,
           is_active,
           created_at`,
        [cleanName, cleanEmail, passwordHash]
      );

      await client.query("COMMIT");

      res.status(201).json({
        message: "Administrator account created successfully.",
        user: result.rows[0],
      });
    } catch (error: unknown) {
      if (client) {
        await client.query("ROLLBACK").catch(() => undefined);
      }

      const code = (error as { code?: string })?.code;

      if (code === "23505") {
        res.status(409).json({
          message: "An account with this email address already exists.",
        });
        return;
      }

      console.error("Create administrator error:", error);

      res.status(500).json({
        message: "Unable to create administrator account.",
      });
    } finally {
      client?.release();
    }
  },

  /**
   * PATCH /api/admin/users/:id/status
   *
   * Deactivates or reactivates an account.
   * Accounts are never physically deleted.
   */
  updateUserStatus: async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const adminId = getAdminId(req);

    // Safely extract the route parameter as a string.
    const rawTargetId = req.params.id;
    const targetId = Array.isArray(rawTargetId)
      ? rawTargetId[0]
      : rawTargetId;

    const { isActive } = req.body ?? {};

    if (!adminId) {
      res.status(401).json({
        message: "Please sign in again.",
      });
      return;
    }

    if (
      typeof targetId !== "string" ||
      !isValidUuid(targetId)
    ) {
      res.status(400).json({
        message: "Invalid user ID.",
      });
      return;
    }

    if (typeof isActive !== "boolean") {
      res.status(400).json({
        message: "isActive must be true or false.",
      });
      return;
    }

    if (targetId === adminId && isActive === false) {
      res.status(400).json({
        message: "You cannot deactivate your own administrator account.",
      });
      return;
    }

    let client;

    try {
      client = await pool.connect();

      await client.query("BEGIN");

      // Prevent concurrent administrator changes from bypassing
      // the last-active-administrator protection.
      await client.query(
        "SELECT pg_advisory_xact_lock($1)",
        [741852963]
      );

      const targetResult = await client.query(
        `SELECT id, name, email, role, is_active
         FROM users
         WHERE id = $1
         FOR UPDATE`,
        [targetId]
      );

      if (!targetResult.rows.length) {
        await client.query("ROLLBACK");

        res.status(404).json({
          message: "User account not found.",
        });
        return;
      }

      const target = targetResult.rows[0];
      const isAdmin = String(target.role).toUpperCase() === "ADMIN";

      if (
        isAdmin &&
        target.is_active === true &&
        isActive === false
      ) {
        const adminCount = await client.query(
          `SELECT COUNT(*)::int AS total
           FROM users
           WHERE UPPER(role) = 'ADMIN'
             AND is_active = TRUE`
        );

        if (Number(adminCount.rows[0]?.total ?? 0) <= 1) {
          await client.query("ROLLBACK");

          res.status(409).json({
            message:
              "The last active administrator cannot be deactivated. Create or activate another administrator first.",
          });
          return;
        }
      }

      const updated = await client.query(
        `UPDATE users
         SET is_active = $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING
           id,
           name,
           email,
           image AS avatar,
           UPPER(role) AS role,
           is_active,
           created_at`,
        [isActive, targetId]
      );

      await client.query("COMMIT");

      res.status(200).json({
        message: isActive
          ? "Account activated successfully."
          : "Account deactivated successfully.",
        user: updated.rows[0],
      });
    } catch (error) {
      if (client) {
        await client.query("ROLLBACK").catch(() => undefined);
      }

      console.error("Update user status error:", error);

      res.status(500).json({
        message: "Unable to update account status.",
      });
    } finally {
      client?.release();
    }
  },
};
