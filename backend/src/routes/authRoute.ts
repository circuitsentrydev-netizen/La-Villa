import { Router } from 'express';
import { authController } from '../controllers/authController'; 
import { authMiddleware } from '../middleware/authMiddleware';
import { userController } from '../controllers/userController';

const router = Router();

// 1. PUBLIC AUTHENTICATION PIPELINES (Unified to go through authController)

router.post('/register', authController.handleRegister);
router.post('/login', authController.handleLogin);
router.post('/oauth-login', authController.handleOAuthLogin);


// 2. PROTECTED PROFILE MANAGEMENT OPERATIONS

router.get('/profile/:id', authMiddleware.requireAuth, userController.getUserProfile);
router.put('/profile/:id', authMiddleware.requireAuth, userController.updateUserProfile);
router.delete('/profile/:id', authMiddleware.requireAuth, userController.deleteUserProfile);

export default router;
