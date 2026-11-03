import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getMyProfile,
  updateMyProfile,
} from '../controllers/userController';

const router = Router();

// Public authentication routes.
router.post('/register', authController.handleRegister);
router.post('/login', authController.handleLogin);
router.post('/google', authController.handleGoogleLogin);

// Authenticated customer profile routes.
router.get(
  '/profile/me',
  authMiddleware.requireAuth,
  getMyProfile
);

router.put(
  '/profile/me',
  authMiddleware.requireAuth,
  updateMyProfile
);

export default router;