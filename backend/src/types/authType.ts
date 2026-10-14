export type UserRole = 'USER' | 'ADMIN';

export interface OAuthLoginInput {
  email: string;
  name?: string;
  avatar?: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password_hash: string; 
}

export interface LoginInput {
  email: string;
  password_raw: string; 
}

export interface TokenPayload {
  id: string; 
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    avatar?: string;
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}
