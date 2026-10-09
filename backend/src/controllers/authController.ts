import { Request, Response } from 'express';
import { authService } from '../services/authService';

export const authController = {
  // Receives user info from the client application
  handleOAuthLogin: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, name, avatar } = req.body;

      // Basic validation check
      if (!email) {
        res.status(400).json({ error: 'Email parameter is required for authentication.' });
        return;
      }

      // Execute login/registration
      const authData = await authService.loginOrRegister({ email, name, avatar });

      res.status(200).json({
        message: 'Authentication successful',
        ...authData
      });
    } catch (error) {
      console.error('Error handling auth process:', error);
      res.status(500).json({ error: 'Internal validation or server error.' });
    }
  }
};
