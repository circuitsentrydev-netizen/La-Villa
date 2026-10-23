 
import type { Request, Response } from "express";
import { FavoriteService } from "../services/favoriteService";

const favoriteService = new FavoriteService();

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getAuthenticatedUserId(req: Request): string | null {
  const id = req.user?.id;
  return typeof id === "string" && UUID_PATTERN.test(id) ? id : null;
}

export const favoriteController = {
  getFavorites: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);

      if (!userId) {
        res.status(401).json({ error: "Please sign in again." });
        return;
      }

      const favorites = await favoriteService.getFavorites(userId);
      res.status(200).json({ favorites });
    } catch (error) {
      console.error("Failed to retrieve favorites:", error);
      res.status(500).json({ error: "Unable to load saved accommodations." });
    }
  },

  addFavorite: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const accommodationId = req.params.accommodationId;

      if (!userId) {
        res.status(401).json({ error: "Please sign in again." });
        return;
      }

      if (
        typeof accommodationId !== "string" ||
        !UUID_PATTERN.test(accommodationId)
      ) {
        res.status(400).json({ error: "Invalid accommodation ID." });
        return;
      }

      const added = await favoriteService.addFavorite(
        userId,
        accommodationId
      );

      res.status(200).json({
        message: added
          ? "Accommodation saved."
          : "Accommodation was already saved.",
        saved: true,
      });
    } catch (error) {
      if (error instanceof Error &&
          error.message === "ACCOMMODATION_NOT_FOUND") {
        res.status(404).json({
          error: "Published accommodation not found.",
        });
        return;
      }

      console.error("Failed to save favorite:", error);
      res.status(500).json({ error: "Unable to save accommodation." });
    }
  },

  removeFavorite: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const accommodationId = req.params.accommodationId;

      if (!userId) {
        res.status(401).json({ error: "Please sign in again." });
        return;
      }

      if (
        typeof accommodationId !== "string" ||
        !UUID_PATTERN.test(accommodationId)
      ) {
        res.status(400).json({ error: "Invalid accommodation ID." });
        return;
      }

      const removed = await favoriteService.removeFavorite(
        userId,
        accommodationId
      );

      res.status(200).json({
        message: removed
          ? "Accommodation removed from saved items."
          : "Accommodation was not in your saved items.",
        saved: false,
      });
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      res.status(500).json({ error: "Unable to remove accommodation." });
    }
  },
};
