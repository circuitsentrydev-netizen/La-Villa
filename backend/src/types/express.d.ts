import { TokenPayload } from './authType'; // Adjust this import path to point to your authType file

export {};

declare global {
  namespace Express {
    interface Request {
      // 💡 This injects the user property definition across all Express Request objects globally
      user?: TokenPayload; 
    }
  } 
}