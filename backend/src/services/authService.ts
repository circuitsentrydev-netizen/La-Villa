import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; // Handles secure salt-hashing operations
import { pool } from '../config/database';
import { OAuthLoginInput, RegisterInput, LoginInput, AuthResponse } from '../types/authType';

const SECRET = process.env.JWT_SECRET || 'this-key-is-secret';
const SALT_ROUNDS = 10;

export const authService = {
  // 1. THIRD-PARTY OAUTH SYSTEM FLOW
  loginOrRegister: async (input: OAuthLoginInput): Promise<AuthResponse> => {
    try {
      const { email, name, avatar } = input;
      const sanitizedEmail = email.toLowerCase().trim();

      const userCheck = await pool.query('SELECT * FROM users WHERE email = \$1', [sanitizedEmail]);
      let user;

      if (userCheck.rows.length > 0) {
        user = userCheck.rows[0];
      } else {
        const assignedRole = sanitizedEmail === 'circuitsentrydev@gmail.com' ? 'ADMIN' : 'USER';
        
        // Match the columns exactly as configured inside your pgAdmin layout
        const newUser = await pool.query(
          `INSERT INTO users (name, email, password_hash, role) 
           VALUES ($1, $2, $3, $4) 
           RETURNING id, name, email, role`,
          [name || 'Villa Guest', sanitizedEmail, 'OAUTH_EXTERNAL_ACCOUNT', assignedRole]
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
          role: user.role === 'ADMIN' ? 'ADMIN' : 'USER'
        }
      };
    } catch (error: any) {
      console.error("OAUTH SERVICE EXCEPTION:", error.message);
      throw new Error(`OAuth registration pipeline failed: ${error.message}`);
    }
  },

  // 2. TRADITIONAL ACCOUNT REGISTRATION FORM FLOW
  registerWithPassword: async (input: RegisterInput): Promise<AuthResponse> => {
    try {
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

      console.log("⏳ Executing PostgreSQL INSERT operation...");
      
      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, name, email, role`,
        [name, sanitizedEmail, secureHash, assignedRole]
      );

      // Verify a row was successfully captured and returned
      if (!result.rows || result.rows.length === 0) {
        throw new Error("The database successful target execution transaction returned 0 structural rows.");
      }

      const user = result.rows[0];
      
      // Safe dynamic property fallback assignments to completely eliminate JWT generation payload crashes
      const userIdStr = user.id ? String(user.id) : '';
      const userEmailStr = user.email ? String(user.email) : '';
      const userRoleStr = user.role ? String(user.role) : 'USER';

      const token = jwt.sign(
        { id: userIdStr, email: userEmailStr, role: userRoleStr }, 
        SECRET, 
        { expiresIn: '1d' }
      );

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role === 'ADMIN' ? 'ADMIN' : 'USER'
        }
      };
    } catch (error: any) {
      // This will trap database syntax/schema validation mapping runtime exceptions cleanly
      console.error(' CRITICAL REGISTRATION BACKEND EXCEPTION ENCOUNTERED:', error.message);
      throw error;
    }
  },

  // 3. TRADITIONAL EMAIL & PASSWORD VERIFICATION LOGIN FLOW
  loginWithPassword: async (input: LoginInput): Promise<AuthResponse> => {
    try {
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
          role: user.role === 'ADMIN' ? 'ADMIN' : 'USER'
        }
      };
    } catch (error: any) {
      console.error(" LOGIN SERVICE EXCEPTION:", error.message);
      throw error;
    }
  }
};
