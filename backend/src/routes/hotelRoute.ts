
import { Router, type Request } from "express";
import multer, { type FileFilterCallback } from "multer";
import fs from "fs";
import path from "path";

import {
  getAllAccommodations,
  createAccommodation,
  addRoomInventory,
  getDashboardSnapshot,
  getAccommodationById,
} from "../controllers/hotelController";

import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

const uploadDirectory = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    callback: (error: Error | null, destination: string) => void
  ) => {
    callback(null, uploadDirectory);
  },

  filename: (
    _req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void
  ) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}-${Math.round(
      Math.random() * 1000000
    )}${extension}`;

    callback(null, filename);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error("Only JPG, PNG, and WebP images are allowed."));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
  fileFilter,
});

// Dashboard summary
router.get("/snapshot", getDashboardSnapshot);

// Public accommodation listings
router.get("/accommodations", getAllAccommodations);
router.get(
  "/accommodations/:accommodationId",
  getAccommodationById
);

// Admin-only accommodation creation with image uploads

router.post(
  "/accommodations",
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  upload.array("images", 10),
  createAccommodation
);

// Admin-only room inventory creation
router.post(
  "/accommodations/:accommodationId/rooms",
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  addRoomInventory
);

export default router;
