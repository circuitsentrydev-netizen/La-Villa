import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TokenPayload } from '../types/authType';

export const authMiddleware = {
  // Verifies that a valid user JWT is passed in the Authorization Header
  requireAuth: (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Access denied. Missing or malformed token.' });
        return;
      }

      // FIX 1: Add [1] to pull the actual string token out of the array
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'hotel_app_super_secure_secret_key_2026';
      
      // FIX 2: Safe type evaluation assertion
      const decoded = jwt.verify(token, secret) as unknown as TokenPayload;
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired authorization token.' });
    }
  },

  // Restricts endpoint access strictly to accounts possessing an ADMIN flag
  requireAdmin: (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden. Administrative access credentials required.' });
      return;
    }
    next();
  }
};
