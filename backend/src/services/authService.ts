import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; // Handles secure salt-hashing operations
import { pool } from '../config/database';
import { OAuthLoginInput, RegisterInput, LoginInput, AuthResponse } from '../types/authType';

const SECRET = process.env.JWT_SECRET || 'this-key-is-secret';
const SALT_ROUNDS = 10;

export const authService = {
  // 1. THIRD-PARTY OAUTH SYSTEM FLOW
  loginOrRegister: async (input: OAuthLoginInput): Promise<AuthResponse> => {
    const { email, name, avatar } = input;
    const sanitizedEmail = email.toLowerCase().trim();

    const userCheck = await pool.query('SELECT * FROM users WHERE email = \$1', [sanitizedEmail]);
    let user;

    if (userCheck.rows.length > 0) {
      user = userCheck.rows[0];
    } else {
      const assignedRole = sanitizedEmail === 'circuitsentrydev@gmail.com' ? 'ADMIN' : 'USER';
      const newUser = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, avatar_url) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, name, email, role, avatar_url`,
        [name || 'Villa Guest', sanitizedEmail, 'OAUTH_EXTERNAL_ACCOUNT', assignedRole, avatar || '']
      );
      user = newUser.rows[0];
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '1d' });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
        avatar: user.avatar_url
      }
    };
  },

  // 2. TRADITIONAL ACCOUNT REGISTRATION FORM FLOW
  registerWithPassword: async (input: RegisterInput): Promise<AuthResponse> => {
    const { name, email, password_hash } = input;
    const sanitizedEmail = email.toLowerCase().trim();

    // Check if account email already exists in PostgreSQL rows
    const duplicateCheck = await pool.query('SELECT id FROM users WHERE email = \$1', [sanitizedEmail]);
    if (duplicateCheck.rows.length > 0) {
      throw new Error('An account with this email address already exists.');
    }

    // Cryptographically hash the plain-text password securely before saving to database rows
    const secureHash = await bcrypt.hash(password_hash, SALT_ROUNDS);
    const assignedRole = sanitizedEmail === 'circuitsentrydev@gmail.com' ? 'ADMIN' : 'USER';

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role`,
      [name, sanitizedEmail, secureHash, assignedRole]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '1d' });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role === 'ADMIN' ? 'ADMIN' : 'USER'
      }
    };
  },

  // 3. TRADITIONAL EMAIL & PASSWORD VERIFICATION LOGIN FLOW
  loginWithPassword: async (input: LoginInput): Promise<AuthResponse> => {
    const { email, password_raw } = input;
    const sanitizedEmail = email.toLowerCase().trim();

    const result = await pool.query('SELECT * FROM users WHERE email = \$1', [sanitizedEmail]);
    if (result.rows.length === 0) {
      throw new Error('Invalid email or password combination.');
    }

    const user = result.rows[0];

    // Intercept OAuth accounts trying to guess manual passwords
    if (user.password_hash === 'OAUTH_EXTERNAL_ACCOUNT') {
      throw new Error('This account is registered via Google OAuth. Please click the Google button to sign in.');
    }

    // Compare plain-text password from form submission against the stored database bcrypt string
    const match = await bcrypt.compare(password_raw, user.password_hash);
    if (!match) {
      throw new Error('Invalid email or password combination.');
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '1d' });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
        avatar: user.avatar_url
      }
    };
  }
};
