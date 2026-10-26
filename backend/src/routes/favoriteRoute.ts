
import { Router } from "express";
import { favoriteController } from "../controllers/favoriteController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// All favorites routes require authentication
router.use(authMiddleware.requireAuth);

// Retrieve the authenticated user's saved accommodations
router.get("/", favoriteController.getFavorites);

// Save an accommodation
router.post(
  "/:accommodationId",
  favoriteController.addFavorite
);

// Remove a saved accommodation
router.delete(
  "/:accommodationId",
  favoriteController.removeFavorite
);

export default router;
