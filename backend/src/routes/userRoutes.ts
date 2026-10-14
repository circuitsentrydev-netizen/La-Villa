import { Router } from 'express';

import { authController } from '../controllers/authController'; 
import { authMiddleware } from '../middleware/authMiddleware';
import { userController } from '../controllers/userController';

const router = Router();

// Core Sign Up & Login Endpoints
// 2. UPDATE THESE THREE LINES: Change userController to authController

router.post('/register', authController.handleRegister);
router.post('/login', authController.handleLogin);
router.post('/oauth-login', authController.handleOAuthLogin);

// Protected User Management Operations Endpoints
// Note: If getUserProfile, are in a separate userController file, 
// you should keep a separate import for that below.

router.get('/profile/:id', authMiddleware.requireAuth, userController.getUserProfile);
router.put('/profile/:id', authMiddleware.requireAuth, userController.updateUserProfile);
router.delete('/profile/:id', authMiddleware.requireAuth, userController.deleteUserProfile);

export default router;
