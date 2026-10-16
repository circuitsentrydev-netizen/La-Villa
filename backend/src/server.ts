import express from "express";
import dotenv from "dotenv";
import cors from "cors";  // Added CORS to bridge across frontend origins safely
import { textDbConnection } from "./config/database";
import { pool } from "./config/database";
import authRoute from "./routes/authRoute";
import hotelRoute from "./routes/hotelRoute";
import userRoute from "./routes/userRoutes"
import roomRoute from "./routes/roomRoute";

dotenv.config();

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000

// Essential Middleware Layers


app.use(express.json());

// API Endpoints Mapping Modules

const startServer = async () => {
    await textDbConnection();
    

    app.use("/api/auth", authRoute)
     app.use("/api/auth", userRoute)
    app.use('/api',hotelRoute);
    app.use('/api/rooms', roomRoute);
   
    
    app.listen(PORT, () => {
    console.log(` server is running on http://localhost:${PORT}`);
  });
  try {

  }
   catch (error) {
    console.error(" Failed to initiate server lifecycle sequence:", error);
    process.exit(1);
  }
};

startServer();
