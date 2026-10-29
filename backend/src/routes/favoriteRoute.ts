
import { Router } from "express";
import { favoriteController } from "../controllers/favoriteController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

/**
 * All favorites endpoints require a valid authentication token.
 */
router.use(authMiddleware.requireAuth);

/**
 * GET /api/favorites
 * Retrieve the signed-in user's saved accommodations.
 */
router.get("/", favoriteController.getFavorites);

/**
 * POST /api/favorites/:accommodationId
 * Save an accommodation for the signed-in user.
 */
router.post("/:accommodationId", favoriteController.addFavorite);

/**
 * DELETE /api/favorites/:accommodationId
 * Remove an accommodation from the signed-in user's saved list.
 */
router.delete("/:accommodationId", favoriteController.removeFavorite);

export default router;
