
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

import authRoute from "./routes/authRoute";
import hotelRoute from "./routes/hotelRoute";
import userRoute from "./routes/userRoutes";
import roomRoute from "./routes/roomRoute";
import reservationRoute from "./routes/reservationRoute";
import favoriteRoute from "./routes/favoriteRoute";
import reviewRoute from "./routes/reviewRoute";
import notificationRoute from "./routes/notificationRoute";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3002);

const allowedOrigins = [
  "https://la-villa-nu.vercel.app",
  "http://localhost:5173",
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim())
    : []),
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by La Villa CORS policy."));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "uploads"))
);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "La Villa API",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoute);
app.use("/api", userRoute);
app.use("/api", hotelRoute);
app.use("/api/rooms", roomRoute);
app.use("/api/reservations", reservationRoute);
app.use("/api/favorites", favoriteRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/notifications", notificationRoute);

app.use((_req, res) => {
  res.status(404).json({
    message: "The requested API endpoint was not found.",
  });
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled API error:", error);

    if (res.headersSent) return;

    res.status(500).json({
      message: "An unexpected server error occurred.",
    });
  }
);

app.listen(PORT, () => {
  console.log(`La Villa API running on port ${PORT}`);
});
