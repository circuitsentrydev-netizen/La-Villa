import { Request, Response } from 'express';
import { query } from '../config/database';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; 
import { UserRole } from '../types/userType';

const SECRET = process.env.JWT_SECRET || 'this-key-is-secret';

export const userController = {
    // ⚡ 1. THIRD-PARTY OAUTH SYSTEM FLOW
    handleOAuthLogin: async (req: Request, res: Response) => {
        try {
            const { email, name, avatar } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email parameter is required for authentication.' });
            }

            const sanitizedEmail = email.toLowerCase().trim();
            const userCheck = await query('SELECT * FROM users WHERE email = \$1', [sanitizedEmail]);
            let user;

            if (userCheck.rows && userCheck.rows.length > 0) {
                user = userCheck.rows[0];
            } else {
                // System master super admin assignment check
                const assignedRole: UserRole = sanitizedEmail === 'circuitsentrydev@gmail.com' ? 'ADMIN' : 'USER';
                const newUser = await query(
                    `INSERT INTO users (name, email, password_hash, role, display_picture) 
                     VALUES ($1, $2, $3, $4, $5) 
                     RETURNING id, name, email, role, display_picture`,
                    [name || 'Villa Guest', sanitizedEmail, 'OAUTH_EXTERNAL_ACCOUNT', assignedRole, avatar || null]
                );
                user = newUser.rows[0];
            }

            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '1d' });

            return res.status(200).json({
                message: 'Authentication successful',
                token,
                user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.display_picture }
            });
        } catch (error: any) {
            console.error("OAuth error:", error);
            return res.status(500).json({ error: 'Internal validation or server error during OAuth processing.' });
        }
    },

    // 2. TRADITIONAL ACCOUNT REGISTRATION FORM FLOW
    handleRegister: async (req: Request, res: Response) => {
        try {
            const { name, email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: "Email and password are required" });
            }

            const sanitizedEmail = email.toLowerCase().trim();
            const existingUser = await query("SELECT id FROM users WHERE email = \$1", [sanitizedEmail]);
            if (existingUser.rows && existingUser.rows.length > 0) {
                return res.status(400).json({ error: "User with this email already exists" });
            }

            // Secure salt generation and password hashing
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const assignedRole: UserRole = sanitizedEmail === 'circuitsentrydev@gmail.com' ? 'ADMIN' : 'USER';

            const { rows } = await query(
                "INSERT INTO users (email, password_hash, name, role) VALUES (\$1, \$2, \$3, \$4) RETURNING id, email, name, role",
                [sanitizedEmail, hashedPassword, name || null, assignedRole]
            );

            const user = rows[0];
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '1d' });

            return res.status(201).json({
                message: "User registered successfully",
                token,
                user: { id: user.id, name: user.name, email: user.email, role: user.role }
            });
        } catch (error) {
            console.error("Registration error:", error);
            return res.status(500).json({ error: "Error registering new user" });
        }
    },

    // 3. TRADITIONAL EMAIL & PASSWORD VERIFICATION LOGIN FLOW
    handleLogin: async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required fields.' });
            }

            const sanitizedEmail = email.toLowerCase().trim();
            const result = await query('SELECT * FROM users WHERE email = \$1', [sanitizedEmail]);
            if (!result.rows || result.rows.length === 0) {
                return res.status(401).json({ error: 'Invalid email or password combination.' });
            }

            const user = result.rows[0];

            if (user.password_hash === 'OAUTH_EXTERNAL_ACCOUNT') {
                return res.status(400).json({ error: 'This account is registered via Google OAuth. Please use Google Sign In.' });
            }

            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) {
                return res.status(401).json({ error: 'Invalid email or password combination.' });
            }

            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '1d' });

            return res.status(200).json({
                message: 'Login successful',
                token,
                user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.display_picture }
            });
        } catch (error) {
            console.error("Login error:", error);
            return res.status(500).json({ error: "Internal authentication error." });
        }
    },

    // 4. GET USER PROFILE BY ID
    getUserProfile: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { rows } = await query("SELECT id, email, name, display_picture, role FROM users WHERE id = \$1", [id]);

            if (!rows || rows.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(200).json(rows[0]);
        } catch (error) {
            return res.status(500).json({ message: "Error fetching profile" });
        }
    },

    // 5. UPDATE USER PROFILE
    updateUserProfile: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { email, name, display_picture } = req.body;

            if (!email) {
                return res.status(400).json({ message: "Email is required to update profile" });
            }

            const { rows } = await query(
                "UPDATE users SET email = \$1, name = \$2, display_picture = \$3 WHERE id = \$4 RETURNING id, email, name, display_picture, role",
                [email, name || null, display_picture || null, id]
            );

            if (!rows || rows.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(200).json({ message: "Profile updated successfully", user: rows[0] });
        } catch (error) {
            return res.status(500).json({ message: "Error updating profile" });
        }
    },

    // 6. DELETE USER PROFILE
    deleteUserProfile: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { rows } = await query("DELETE FROM users WHERE id = \$1 RETURNING id", [id]);

            if (!rows || rows.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(200).json({ message: "User profile deleted successfully" });
        } catch (error) {
            return res.status(500).json({ message: "Error deleting profile" });
        }
    }
};
