import { Router } from "express";
import { authController } from "../controllers/authController";

const router = Router();

// 1. Traditional Account Creation Form Endpoint
router.post('/register', authController.handleRegister);

// 2. Traditional Email & Password Login Endpoint
router.post('/login', authController.handleLogin);

// 3. Third-Party OAuth Authentication Endpoint
router.post('/oauth-login', authController.handleOAuthLogin);

export default router;
