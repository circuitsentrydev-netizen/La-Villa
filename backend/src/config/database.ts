// Replace "pg" with "@neondatabase/serverless"
import { Pool } from "@neondatabase/serverless"; 
import dns from "dns";
import net from "net";
import "dotenv/config";

dns.setDefaultResultOrder("ipv4first");
net.setDefaultAutoSelectFamilyAttemptTimeout(5000);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err: any) => {
  console.warn("Unexpected idle PostgreSQL client error:", err.message);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const testDbConnection = async () => {
  try {
    const { rows } = await pool.query(
      "SELECT current_database() AS db, NOW() AS now",
    );
    console.log(`Database connection successful: ${rows[0].db}`);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};
