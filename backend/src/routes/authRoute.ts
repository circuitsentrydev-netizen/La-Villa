
import { Router } from "express";
import { authController } from "../controllers/authController";
import { userController } from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Public authentication
router.post("/register", authController.handleRegister);
router.post("/login", authController.handleLogin);
// router.post("/oauth-login", authController.handleOAuthLogin);

// Authenticated user's own profile
router.get(
  "/profile/me",
  authMiddleware.requireAuth,
  userController.getUserProfile
);

router.patch(
  "/profile/me",
  authMiddleware.requireAuth,
  userController.updateUserProfile
);

export default router;
