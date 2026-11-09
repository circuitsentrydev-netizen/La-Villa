
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { TokenPayload } from "../types/authType";
import { pool } from "../config/database";

export const authMiddleware = {
  // Verifies the JWT and confirms that the account is active.
  requireAuth: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
          error: "Access denied. Missing or malformed token.",
        });
        return;
      }

      const token = authHeader.split(" ")[1];
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        res.status(500).json({
          error: "JWT_SECRET is not configured.",
        });
        return;
      }

      const decoded = jwt.verify(
        token,
        secret
      ) as unknown as TokenPayload;

      if (!decoded.id) {
        res.status(401).json({
          error: "Invalid authorization token.",
        });
        return;
      }

      // Check the latest account status and role in Neon.
      const result = await pool.query(
        `SELECT id, email, role, is_active
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [decoded.id]
      );

      if (
        !result.rows.length ||
        result.rows[0].is_active !== true
      ) {
        res.status(401).json({
          error: "This account is inactive or no longer exists. Please sign in again.",
        });
        return;
      }

      const currentUser = result.rows[0];

      const currentRole = String(currentUser.role).toUpperCase();

      if (currentRole !== "ADMIN" && currentRole !== "USER") {
        res.status(403).json({
          error: "Invalid account role.",
        });
        return;
      }

      // Keep the same assignment structure as your original middleware.
      req.user = {
        id: String(currentUser.id),
        email: currentUser.email,
        role: currentRole as TokenPayload["role"],
      };

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          error: "Invalid or expired authorization token.",
        });
        return;
      }

      console.error("Authentication middleware error:", error);

      res.status(500).json({
        error: "Unable to verify your account.",
      });
    }
  },

  // Restricts access to active administrator accounts.
  requireAdmin: (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (
      !req.user ||
      String(req.user.role).toUpperCase() !== "ADMIN"
    ) {
      res.status(403).json({
        error: "Forbidden. Administrative access credentials required.",
      });
      return;
    }

    next();
  },
};
