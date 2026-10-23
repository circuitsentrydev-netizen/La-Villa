
import type { Request, Response } from "express";
import { FavoriteService } from "../services/favoriteService";

const favoriteService = new FavoriteService();

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Gets the authenticated user's ID from the request.
 * The auth middleware must populate req.user.id.
 */
function getAuthenticatedUserId(req: Request): string | null {
  const id = req.user?.id;

  if (typeof id !== "string" || !UUID_PATTERN.test(id)) {
    return null;
  }

  return id;
}

/**
 * Sends a consistent JSON error response.
 * Both fields are provided for compatibility with frontend code
 * that reads either data.message or data.error.
 */
function sendError(
  res: Response,
  status: number,
  message: string
): void {
  res.status(status).json({
    message,
    error: message,
  });
}

export const favoriteController = {
  /**
   * GET /favorites
   * Returns all published accommodations saved by the current user.
   */
  getFavorites: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);

      if (!userId) {
        sendError(res, 401, "Please sign in again.");
        return;
      }

      const favorites = await favoriteService.getFavorites(userId);

      res.status(200).json({
        favorites,
      });
    } catch (error: unknown) {
      console.error("Failed to retrieve favorites:", error);

      sendError(
        res,
        500,
        "Unable to load saved accommodations. Please try again."
      );
    }
  },

  /**
   * POST /favorites/:accommodationId
   * Saves an accommodation for the authenticated user.
   */
  addFavorite: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);

      if (!userId) {
        sendError(res, 401, "Please sign in again.");
        return;
      }

      const accommodationId = req.params.accommodationId;

      if (
        typeof accommodationId !== "string" ||
        !UUID_PATTERN.test(accommodationId)
      ) {
        sendError(res, 400, "Invalid accommodation ID.");
        return;
      }

      const added = await favoriteService.addFavorite(
        userId,
        accommodationId
      );

      res.status(200).json({
        message: added
          ? "Accommodation saved successfully."
          : "This accommodation is already in your saved items.",
        saved: true,
      });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === "ACCOMMODATION_NOT_FOUND"
      ) {
        sendError(
          res,
          404,
          "Published accommodation not found."
        );
        return;
      }

      console.error("Failed to save favorite:", error);

      sendError(
        res,
        500,
        "Unable to save this accommodation. Please try again."
      );
    }
  },

  /**
   * DELETE /favorites/:accommodationId
   * Removes a saved accommodation for the authenticated user.
   */
  removeFavorite: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);

      if (!userId) {
        sendError(res, 401, "Please sign in again.");
        return;
      }

      const accommodationId = req.params.accommodationId;

      if (
        typeof accommodationId !== "string" ||
        !UUID_PATTERN.test(accommodationId)
      ) {
        sendError(res, 400, "Invalid accommodation ID.");
        return;
      }

      const removed = await favoriteService.removeFavorite(
        userId,
        accommodationId
      );

      res.status(200).json({
        message: removed
          ? "Accommodation removed from saved items."
          : "This accommodation was not in your saved items.",
        saved: false,
      });
    } catch (error: unknown) {
      console.error("Failed to remove favorite:", error);

      sendError(
        res,
        500,
        "Unable to remove this accommodation. Please try again."
      );
    }
  },
};
