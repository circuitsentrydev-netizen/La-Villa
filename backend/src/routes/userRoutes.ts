
import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
  getUserProfile,
  updateUserProfile,
} from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Authenticated user's own profile
router.get(
  "/profile/me",
  authMiddleware.requireAuth,
  getMyProfile
);

router.put(
  "/profile/me",
  authMiddleware.requireAuth,
  updateMyProfile
);

// Profile routes for a specific user.
// The controller must enforce that users can only update their own profile.
router.get(
  "/profile/:id",
  authMiddleware.requireAuth,
  getUserProfile
);

router.put(
  "/profile/:id",
  authMiddleware.requireAuth,
  updateUserProfile
);

export default router;