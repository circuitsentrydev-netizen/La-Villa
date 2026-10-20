
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
  registerWithPassword: async (
    input: RegisterInput
  ): Promise<AuthResponse> => {
    const name = input.name.trim();
    const sanitizedEmail = input.email.trim().toLowerCase();
    const password = input.password_hash;

    if (!name || !sanitizedEmail || !password) {
      throw new Error('Name, email, and password are required.');
    }

    if (password.length < 8) {
      throw new Error('Password must contain at least 8 characters.');
    }

    const duplicateCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [sanitizedEmail]
    );

    if (duplicateCheck.rows.length > 0) {
      throw new Error('An account with this email address already exists.');
    }

    const secureHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, sanitizedEmail, secureHash, 'USER']
    );

    if (!result.rows.length) {
      throw new Error('Account creation failed. Please try again.');
    }

    // The backend still returns its expected response shape.
    // The frontend registration reducer deliberately ignores the token.
    return toAuthResponse(result.rows[0]);
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
