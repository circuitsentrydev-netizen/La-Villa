import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

import { textDbConnection } from "./config/database";
import authRoute from "./routes/authRoute";
import hotelRoute from "./routes/hotelRoute";
import userRoute from "./routes/userRoutes";
import roomRoute from "./routes/roomRoute";
import reservationRoute from "./routes/reservationRoute";
import favoriteRoute from "./routes/favoriteRoute";
import reviewRoute from "./routes/reviewRoute";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "uploads"))
);

app.use("/api/auth", authRoute);
app.use("/api", userRoute);
app.use("/api", hotelRoute);
app.use("/api/rooms", roomRoute);
app.use("/api/reservations", reservationRoute);
app.use("/api/favorites", favoriteRoute);
app.use("/api/reviews", reviewRoute);

const startServer = async () => {
  try {
    await textDbConnection();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();