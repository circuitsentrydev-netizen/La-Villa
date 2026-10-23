
import { Router } from "express";
import { favoriteController } from "../controllers/favoriteController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.use(authMiddleware.requireAuth);

router.get("/", favoriteController.getFavorites);

router.post("/:accommodationId", favoriteController.addFavorite);

router.delete("/:accommodationId", favoriteController.removeFavorite);

export default router;

