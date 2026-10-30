
import type { Request, Response } from 'express';
import { authService } from '../services/authService';

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
  console.error("REGISTER ERROR:", error);

  if (error instanceof Error) {
    console.error("MESSAGE:", error.message);
    console.error("STACK:", error.stack);
  }
 console.log("Backend error:", error)
  res.status(500).json({
    error: error instanceof Error
      ? error.message
      : String(error),
  });
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

  // Kept for compatibility with the existing authRoute.
  // This is not a substitute for validating a real OAuth provider token.
  handleOAuthLogin: async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { email, name, avatar } = req.body ?? {};

      if (typeof email !== 'string' || !email.trim()) {
        res.status(400).json({
          error: 'A valid email is required.',
        });
        return;
      }

      const authData = await authService.loginOrRegister({
        email: email.trim().toLowerCase(),
        name: typeof name === 'string' ? name : undefined,
        avatar: typeof avatar === 'string' ? avatar : undefined,
      });

      res.status(200).json({
        message: 'Authentication successful.',
        ...authData,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Authentication failed.';

      console.error('OAuth handler error:', message);
      res.status(400).json({ error: message });
    }
  },
};
