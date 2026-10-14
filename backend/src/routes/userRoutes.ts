import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware'; // Assuming this tracks requireAuth

const router = Router();

// Core Sign Up & Login Endpoints
router.post('/register', userController.handleRegister);
router.post('/login', userController.handleLogin);
router.post('/oauth-login', userController.handleOAuthLogin);

// Protected User Management Operations Endpoints
router.get('/profile/:id', authMiddleware.requireAuth, userController.getUserProfile);
router.put('/profile/:id', authMiddleware.requireAuth, userController.updateUserProfile);
router.delete('/profile/:id', authMiddleware.requireAuth, userController.deleteUserProfile);

export default router;
