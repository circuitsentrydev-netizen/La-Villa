import { query } from "../config/database";
import jwt from "jsonwebtoken";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: 'USER' | 'ADMIN';
  created_at: Date;
  updated_at: Date;
}

interface AuthPayload {
  email: string;
  name?: string;
  avatar?: string;
}

export const authService = {
  // Lowercase 'o' used here to match exactly what your controller calls
  loginOrRegister: async (userData: AuthPayload) => {
    const { email, name, avatar } = userData;
    const secret = process.env.JWT_SECRET || 'hotel_app_super_secure_secret_key_2026';

    // 1. Look up existing user
    const checkResult = await query("SELECT id, email, name, role FROM users WHERE email = \$1;", [email]);
    let targetUser = checkResult.rows;

    // 2. If user doesn't exist, create them
    if (targetUser.length === 0) {
      const insertResult = await query(
        "INSERT INTO users (email, name, avatar, role) VALUES (\$1, \$2, \$3, 'USER') RETURNING id, email, name, role;",
        [email, name, avatar]
      );
      targetUser = insertResult.rows;
    }

    // FIX: Extracting item [0] from the array to read specific object parameters safely
    const currentUser = targetUser[0];

    // 3. Generate a signed token using object properties
    const token = jwt.sign(
      { id: currentUser.id, email: currentUser.email, role: currentUser.role },
      secret,
      { expiresIn: '7d' }
    );

    return { user: currentUser, token };
  }
};
