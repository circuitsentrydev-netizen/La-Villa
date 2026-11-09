
import { Router } from "express";
import { getMyProfile,updateMyProfile,getUserProfile,  updateUserProfile,} from "../controllers/userController";
import { adminUserController } from "../controllers/adminUserController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Authenticated user's own profile.
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

// Backwards-compatible own-profile routes.
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

// Administrator-only user management.
router.get(
  "/admin/users",
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  adminUserController.getUsers
);

router.post(
  "/admin/users/admins",
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  adminUserController.createAdmin
);

router.patch(
  "/admin/users/:id/status",
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  adminUserController.updateUserStatus
);

export default router;
