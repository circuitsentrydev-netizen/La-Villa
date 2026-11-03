import type { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { authService } from '../services/authService';

const googleClient = new OAuth2Client();

export const authController = {
  handleRegister: async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { name, email, password } = req.body ?? {};

      if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        !name.trim() ||
        !email.trim() ||
        !password
      ) {
        res.status(400).json({
          error: 'Name, email, and password are required.',
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({
          error: 'Password must contain at least 8 characters.',
        });
        return;
      }

      const authData = await authService.registerWithPassword({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_hash: password,
      });

      res.status(201).json({
        message: 'Registration successful. Please sign in.',
        ...authData,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Registration failed.';

      const status = message.toLowerCase().includes('already exists')
        ? 409
        : 500;

      console.error('Register error:', message);
      res.status(status).json({ error: message });
    }
  },

  handleLogin: async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { email, password } = req.body ?? {};

      if (
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        !email.trim() ||
        !password
      ) {
        res.status(400).json({
          error: 'Email and password are required.',
        });
        return;
      }

      const authData = await authService.loginWithPassword({
        email: email.trim().toLowerCase(),
        password_raw: password,
      });

      res.status(200).json({
        message: 'Login successful.',
        ...authData,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Authentication failed.';

      console.error('Login error:', message);
      res.status(401).json({ error: message });
    }
  },

  handleGoogleLogin: async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { credential } = req.body ?? {};
      const clientId = process.env.GOOGLE_CLIENT_ID;

      if (!clientId) {
        res.status(500).json({
          error: 'Google sign-in is not configured on the server.',
        });
        return;
      }

      if (
        typeof credential !== 'string' ||
        !credential.trim() ||
        credential.length > 12000
      ) {
        res.status(400).json({
          error: 'A valid Google credential is required.',
        });
        return;
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });

      const payload = ticket.getPayload();

      if (
        !payload?.sub ||
        !payload.email ||
        payload.email_verified !== true
      ) {
        res.status(401).json({
          error: 'Google could not verify this email address.',
        });
        return;
      }

      const authData = await authService.loginOrRegisterWithGoogle({
        googleSub: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture,
      });

      res.status(200).json({
        message: 'Google sign-in successful.',
        ...authData,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Google sign-in failed.';

      console.error('Google sign-in error:', message);

      res.status(401).json({
        error: 'Google sign-in could not be verified. Please try again.',
      });
    }
  },
};