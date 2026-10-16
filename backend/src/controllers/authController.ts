import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { query } from '../config/database';

export const authController = {
  // 1. THIRD-PARTY OAUTH HANDLER
  handleOAuthLogin: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, name, avatar } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email parameter is required for authentication.' });
        return;
      }

      const authData = await authService.loginOrRegister({ email, name, avatar });

      res.status(200).json({
        message: 'Authentication successful',
        ...authData
      });
    } catch (error: any) {
      console.error('Error handling OAuth process:', error);
      res.status(500).json({ error: error.message || 'Internal validation or server error.' });
    }
  },

  // 2. TRADITIONAL USER REGISTRATION FORM HANDLER
  handleRegister: async (req: Request, res: Response): Promise<void> => {
    try { 
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ error: 'All configuration inputs (name, email, password) are mandatory parameters.' });
        return;
      }

      const authData = await authService.registerWithPassword({
        name,
        email,
        password_hash: password // Passes the plain text to the service layer to be hashed securely
      });

      //  SAFE DIAGNOSTIC BLOCK: Placed down here so it won't crash on an empty user table.
      // This prints the exact database file your connection pool is targeting.
      try {
        const debugDb = await query("SELECT current_database(), current_schema()");
        console.log("📍 REAL BACKEND TARGET DATABASE:", debugDb.rows);
      } catch (dbErr) {
        console.error("Diagnostic query failed:", dbErr);
      }

      res.status(201).json({
        message: 'Registration successful',
        ...authData
      });
    } catch (error: any) {
      console.error('Error handling standard registration:', error);
      res.status(400).json({ error: error.message || 'Failed to complete registration flow.' });
    }
  },

  // 3. TRADITIONAL EMAIL & PASSWORD LOGIN HANDLER
  handleLogin: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required fields.' });
        return;
      }

      const authData = await authService.loginWithPassword({
        email,
        password_raw: password
      });

      res.status(200).json({
        message: 'Login successful',
        ...authData
      });
    } catch (error: any) {
      console.error('Error handling standard login:', error);
      res.status(401).json({ error: error.message || 'Authentication rejected.' });
    }
  }
};
