
import { Router } from "express";
import { authController } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Public authentication routes
router.post("/register", authController.handleRegister);
router.post("/login", authController.handleLogin);

// OAuth route retained for compatibility if needed later.
// It is not enabled unless you explicitly add it.
router.post("/oauth-login", authController.handleOAuthLogin);

export default router;
