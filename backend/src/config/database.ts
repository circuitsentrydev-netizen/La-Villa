import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

// 1. ADD THE 'export' KEYWORD RIGHT HERE!
export const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432")
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const textDbConnection = async () => {
    try {
        const client = await pool.connect();
        console.log("Database connection successful");
        client.release();
    } catch (error) {
        console.log("Unable to connect to the database");
        process.exit(1);
    }
};
