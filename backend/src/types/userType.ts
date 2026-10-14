// Define user architectural roles
export type UserRole = 'USER' | 'ADMIN';

// Status tracker fields for handling accommodation reviews and submission overrides
export type SubmissionStatus = 'pending' | 'in_review' | 'approved' | 'changes_requested';

export interface User {
    id: number;
    email: string;
    password_hash: string;
    name?: string;
    display_picture?: string;
    role?: UserRole;
    created_at?: Date;
    updated_at?: Date;
}

// Data payload shape when working with an authenticated user context
export interface TokenPayload {
    id: number;
    email: string;
    role: UserRole;
}

