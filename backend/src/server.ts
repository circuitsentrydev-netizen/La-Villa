import express from "express";
import dotenv from "dotenv";
import cors from "cors";  // Added CORS to bridge across frontend origins safely
import { textDbConnection } from "./config/database";
import { pool } from "./config/database";
import authRoute from "./routes/authRoute";
import hotelRoutes from "./routes/hotelRoute";
import userRoute from "./routes/userRoutes"

dotenv.config();

const app = express();
const PORT = 3000;

// Essential Middleware Layers


app.use(express.json());

// API Endpoints Mapping Modules

// app.use("/api/auth", authRoute);

const startServer = async () => {
    await textDbConnection();
    app.use(cors());
    app.use("/api/accommodations", hotelRoutes);   // Binds the hotel actions seamlessly
    app.use("/api/auth", userRoute)
    
    app.listen(PORT, () => {
    console.log(` server is running on http://localhost:${PORT}`);
  });
};

startServer();
