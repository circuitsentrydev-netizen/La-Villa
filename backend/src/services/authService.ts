
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import {
  type OAuthLoginInput,
  type RegisterInput,
  type LoginInput,
  type AuthResponse,
} from '../types/authType';

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error('JWT_SECRET must be configured in the backend environment.');
}

const SALT_ROUNDS = 10;

function createToken(user: {
  id: string | number;
  email: string;
  role: string;
}): string {
  return jwt.sign(
    {
      id: String(user.id),
      email: user.email,
      role: user.role,
    },
    SECRET as string,
    { expiresIn: '1d' }
  );
}

function toAuthResponse(user: {
  id: string | number;
  name: string;
  email: string;
  role: string;
}): AuthResponse {
  return {
    token: createToken(user),
    user: {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER',
    },
  };
}

export const authService = {
  // Registration through an actual OAuth provider must be implemented
  // separately. This method is retained for compatibility with authRoute.
  // Do not use a client-supplied email to grant administrator privileges.
  loginOrRegister: async (
    input: OAuthLoginInput
  ): Promise<AuthResponse> => {
    const sanitizedEmail = input.email.trim().toLowerCase();

    if (!sanitizedEmail) {
      throw new Error('Email is required.');
    }

    const userCheck = await pool.query(
      'SELECT id, name, email, role FROM users WHERE email = $1',
      [sanitizedEmail]
    );

    if (userCheck.rows.length > 0) {
      return toAuthResponse(userCheck.rows[0]);
    }

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [
        input.name?.trim() || 'Villa Guest',
        sanitizedEmail,
        'OAUTH_EXTERNAL_ACCOUNT',
        'USER',
      ]
    );

    return toAuthResponse(result.rows[0]);
  },

  // Traditional registration: always create a normal USER account.
    // Traditional registration: always create a normal USER account.
  registerWithPassword: async (
    input: RegisterInput
  ): Promise<AuthResponse> => {
    const name = input.name?.trim();
    const sanitizedEmail = input.email?.trim().toLowerCase();
    
    // CRITICAL BUG CHECK: Ensure the frontend is actually sending password_hash or password
    // Sometimes the frontend payload uses 'password', mapping it incorrectly here.
    const password = input.password_hash || (input as any).password;

    if (!name || !sanitizedEmail || !password) {
      throw new Error('Name, email, and password are required.');
    }

    if (password.length < 8) {
      throw new Error('Password must contain at least 8 characters.');
    }

    console.log('[Register] Checking for duplicate email...');
    const duplicateCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [sanitizedEmail]
    );

    if (duplicateCheck.rows.length > 0) {
      throw new Error('An account with this email address already exists.');
    }

    // 1. Move bcrypt away from database allocation timing
    console.log('[Register] Hashing password...');
    const secureHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 2. Neon Poolers hate long idle sockets. We pull a fresh client right before insertion
    console.log('[Register] Inserting user into Neon...');
    const client = await pool.connect();
    try {
      // Set a strict local query timeout for this execution so it doesn't hang the thread
      await client.query('SET statement_timeout = 5000'); 
      
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role`,
        [name, sanitizedEmail, secureHash, 'USER']
      );

      if (!result.rows.length) {
        throw new Error('Account creation failed. Please try again.');
      }

      console.log('[Register] User created successfully!');
      return toAuthResponse(result.rows[0]);

    } catch (dbError: any) {
      console.error('[Register DB Exec Error]:', dbError);
      throw dbError;
    } finally {
      // Explicitly return the client to the pool immediately
      client.release(true); 
    }
  },

  // Traditional email and password login.
  loginWithPassword: async (
    input: LoginInput
  ): Promise<AuthResponse> => {
    const sanitizedEmail = input.email.trim().toLowerCase();

    if (!sanitizedEmail || !input.password_raw) {
      throw new Error('Email and password are required.');
    }

    const result = await pool.query(
      'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
      [sanitizedEmail]
    );

    if (!result.rows.length) {
      throw new Error('Invalid email or password.');
    }

    const user = result.rows[0];

    if (user.password_hash === 'OAUTH_EXTERNAL_ACCOUNT') {
      throw new Error(
        'This account does not have a password set. Use the configured identity provider or reset your password.'
      );
    }

    const passwordMatches = await bcrypt.compare(
      input.password_raw,
      user.password_hash
    );

    if (!passwordMatches) {
      throw new Error('Invalid email or password.');
    }

    return toAuthResponse(user);
  },
};
