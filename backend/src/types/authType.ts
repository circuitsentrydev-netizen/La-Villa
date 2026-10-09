export type UserRole = 'USER' | 'ADMIN';

export interface  OAuthLoginInput {
    email:string;
    name?:string;
    avatar?:string;
}

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
      message: string;
    user: {
        id: string;
        email: string;
        name: string | null;
        role: UserRole,
    };
    token: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string
                role: UserRole;
            };
        }
    }
}
    