
import { Request, Response } from "express";
import { pool } from "../config/database";

const isValidUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );

const getAuthenticatedUserId = (req: Request): string | null => {
  const id = req.user?.id;
  return id && isValidUuid(id) ? id : null;
};

const selectProfile = async (id: string) => {
  const result = await pool.query(
    `SELECT id, name, email, avatar, role, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] ?? null;
};

/**
 * GET /api/profile/me
 */
export const getMyProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      res.status(401).json({ message: "Please sign in to view your profile." });
      return;
    }

    const user = await selectProfile(userId);

    if (!user) {
      res.status(404).json({ message: "User profile not found." });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Failed to fetch your profile." });
  }
};

/**
 * PUT /api/profile/me
 * Users may update their name and avatar, but not their role or email.
 */
export const updateMyProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      res.status(401).json({ message: "Please sign in to edit your profile." });
      return;
    }

    const { name, avatar } = req.body ?? {};

    if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
      res.status(400).json({
        message: "Name is required and must be 100 characters or fewer.",
      });
      return;
    }

    if (
      avatar !== undefined &&
      avatar !== null &&
      (typeof avatar !== "string" || avatar.length > 2000)
    ) {
      res.status(400).json({
        message: "The profile picture URL must be 2,000 characters or fewer.",
      });
      return;
    }

    const result = await pool.query(
      `UPDATE users
       SET name = $1,
           avatar = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, avatar, role, created_at`,
      [name.trim(), avatar?.trim() || null, userId]
    );

    if (!result.rowCount) {
      res.status(404).json({ message: "User profile not found." });
      return;
    }

    res.status(200).json({
      message: "Profile updated successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update your profile." });
  }
};

/**
 * Backwards-compatible endpoints for /profile/:id.
 * A user can only access their own profile through these endpoints.
 */
export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authenticatedUserId = getAuthenticatedUserId(req);

  if (!authenticatedUserId) {
    res.status(401).json({ message: "Please sign in to view your profile." });
    return;
  }

  if (req.params.id !== authenticatedUserId) {
    res.status(403).json({ message: "You cannot access another user's profile." });
    return;
  }

  try {
    const user = await selectProfile(authenticatedUserId);

    if (!user) {
      res.status(404).json({ message: "User profile not found." });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Failed to fetch user profile." });
  }
};

export const updateUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authenticatedUserId = getAuthenticatedUserId(req);

  if (!authenticatedUserId) {
    res.status(401).json({ message: "Please sign in to edit your profile." });
    return;
  }

  if (req.params.id !== authenticatedUserId) {
    res.status(403).json({ message: "You cannot edit another user's profile." });
    return;
  }

  await updateMyProfile(req, res);
};

/**
 * Account deletion is intentionally not implemented here.
 * Removing a user can affect reservations and other related records.
 */
export const deleteUserProfile = async (
  _req: Request,
  res: Response
): Promise<void> => {
  res.status(501).json({
    message:
      "Account deletion is not available through this endpoint. Please contact support.",
  });
};
