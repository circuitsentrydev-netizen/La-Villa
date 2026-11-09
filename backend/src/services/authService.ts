
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { pool } from "../config/database";
import {
  type RegisterInput,
  type LoginInput,
  type AuthResponse,
} from "../types/authType";

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error(
    "JWT_SECRET must be configured in the backend environment."
  );
}

const SALT_ROUNDS = 10;
const GOOGLE_PASSWORD_MARKER = "GOOGLE_OAUTH_ACCOUNT";

interface DatabaseUser {
  id: string | number;
  name: string;
  email: string;
  role: string;
  image?: string | null;
  is_active?: boolean;
}

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
    { expiresIn: "1d" }
  );
}

function toAuthResponse(user: DatabaseUser): AuthResponse {
  return {
    token: createToken(user),
    user: {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role?.toUpperCase() === "ADMIN" ? "ADMIN" : "USER",
      ...(user.image ? { avatar: user.image } : {}),
    },
  };
}

function ensureAccountIsActive(user: DatabaseUser): void {
  if (user.is_active === false) {
    throw new Error(
      "This account has been deactivated. Please contact La Villa support."
    );
  }
}

export const authService = {
  registerWithPassword: async (
    input: RegisterInput
  ): Promise<AuthResponse> => {
    const name = input.name?.trim();
    const sanitizedEmail = input.email?.trim().toLowerCase();
    const password = input.password_hash;

    if (!name || !sanitizedEmail || !password) {
      throw new Error("Name, email, and password are required.");
    }

    if (name.length > 100 || sanitizedEmail.length > 254) {
      throw new Error("The supplied name or email address is too long.");
    }

    if (password.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    const duplicateCheck = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1",
      [sanitizedEmail]
    );

    if (duplicateCheck.rows.length > 0) {
      throw new Error("An account with this email address already exists.");
    }

    const secureHash = await bcrypt.hash(password, SALT_ROUNDS);
    const client = await pool.connect();

    try {
      await client.query("SET statement_timeout = 5000");

      const result = await client.query(
        `INSERT INTO users
           (name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, 'USER', TRUE)
         RETURNING id, name, email, role, image, is_active`,
        [name, sanitizedEmail, secureHash]
      );

      if (!result.rows.length) {
        throw new Error("Account creation failed. Please try again.");
      }

      return toAuthResponse(result.rows[0] as DatabaseUser);
    } finally {
      client.release(true);
    }
  },

  loginWithPassword: async (
    input: LoginInput
  ): Promise<AuthResponse> => {
    const sanitizedEmail = input.email.trim().toLowerCase();

    if (!sanitizedEmail || !input.password_raw) {
      throw new Error("Email and password are required.");
    }

    const result = await pool.query(
      `SELECT
         id,
         name,
         email,
         role,
         password_hash,
         image,
         is_active
       FROM users
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [sanitizedEmail]
    );

    if (!result.rows.length) {
      throw new Error("Invalid email or password.");
    }

    const user = result.rows[0] as DatabaseUser & {
      password_hash: string;
    };

    ensureAccountIsActive(user);

    if (
      user.password_hash === "OAUTH_EXTERNAL_ACCOUNT" ||
      user.password_hash === GOOGLE_PASSWORD_MARKER
    ) {
      throw new Error(
        "This account uses Google sign-in. Please continue with Google."
      );
    }

    const passwordMatches = await bcrypt.compare(
      input.password_raw,
      user.password_hash
    );

    if (!passwordMatches) {
      throw new Error("Invalid email or password.");
    }

    return toAuthResponse(user);
  },

  /**
   * Called only after authController verifies Google's signed ID token
   * and confirms that the email address is verified.
   */
  loginOrRegisterWithGoogle: async (input: {
    googleSub: string;
    email: string;
    name: string;
    picture?: string;
  }): Promise<AuthResponse> => {
    const email = input.email.trim().toLowerCase();

    if (!input.googleSub || !email || !input.name.trim()) {
      throw new Error(
        "Google did not return the required account information."
      );
    }

    const existing = await pool.query(
      `SELECT
         id,
         name,
         email,
         role,
         image,
         google_sub,
         is_active
       FROM users
       WHERE google_sub = $1 OR LOWER(email) = $2
       LIMIT 2`,
      [input.googleSub, email]
    );

    if (existing.rows.length > 1) {
      throw new Error(
        "More than one La Villa account matches this Google email. Please contact support."
      );
    }

    if (existing.rows.length === 1) {
      const user = existing.rows[0] as DatabaseUser & {
        google_sub: string | null;
      };

      ensureAccountIsActive(user);

      if (user.google_sub && user.google_sub !== input.googleSub) {
        throw new Error(
          "This email is already linked to a different Google account. Please contact support."
        );
      }

      const updated = await pool.query(
        `UPDATE users
         SET google_sub = $1,
             image = COALESCE(NULLIF(image, ''), $2),
             name = CASE
               WHEN name IS NULL OR BTRIM(name) = '' THEN $3
               ELSE name
             END,
             updated_at = NOW()
         WHERE id = $4
           AND is_active = TRUE
         RETURNING id, name, email, role, image, is_active`,
        [
          input.googleSub,
          input.picture ?? null,
          input.name.trim(),
          user.id,
        ]
      );

      if (!updated.rows.length) {
        throw new Error(
          "This account has been deactivated. Please contact La Villa support."
        );
      }

      return toAuthResponse(updated.rows[0] as DatabaseUser);
    }

    try {
      const inserted = await pool.query(
        `INSERT INTO users
           (name, email, password_hash, role, image, google_sub, is_active)
         VALUES ($1, $2, $3, 'USER', $4, $5, TRUE)
         RETURNING id, name, email, role, image, is_active`,
        [
          input.name.trim(),
          email,
          GOOGLE_PASSWORD_MARKER,
          input.picture ?? null,
          input.googleSub,
        ]
      );

      return toAuthResponse(inserted.rows[0] as DatabaseUser);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;

      if (code !== "23505") {
        throw error;
      }

      const racedUser = await pool.query(
        `SELECT
           id,
           name,
           email,
           role,
           image,
           google_sub,
           is_active
         FROM users
         WHERE google_sub = $1 OR LOWER(email) = $2
         LIMIT 2`,
        [input.googleSub, email]
      );

      if (racedUser.rows.length !== 1) {
        throw error;
      }

      const user = racedUser.rows[0] as DatabaseUser & {
        google_sub: string | null;
      };

      ensureAccountIsActive(user);

      if (user.google_sub && user.google_sub !== input.googleSub) {
        throw error;
      }

      const linked = await pool.query(
        `UPDATE users
         SET google_sub = $1,
             image = COALESCE(NULLIF(image, ''), $2),
             updated_at = NOW()
         WHERE id = $3
           AND is_active = TRUE
         RETURNING id, name, email, role, image, is_active`,
        [input.googleSub, input.picture ?? null, user.id]
      );

      if (!linked.rows.length) {
        throw new Error(
          "This account has been deactivated. Please contact La Villa support."
        );
      }

      return toAuthResponse(linked.rows[0] as DatabaseUser);
    }
  },
};
