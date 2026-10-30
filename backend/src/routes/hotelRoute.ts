
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {getAllAccommodations,getAccommodationById,createAccommodation,updateAccommodation,deleteAccommodation,addRoomInventory,
  getRoomInventory,
  getDashboardSnapshot,
} from "../controllers/hotelController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

const uploadDirectory = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .slice(0, 50);

    callback(null, `${Date.now()}-${safeName || "image"}${extension}`);
  },
});

const imageFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
    callback(new Error("Only JPEG, PNG, and WebP images are allowed."));
    return;
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { files: 10, fileSize: 5 * 1024 * 1024 },
});

// Public read endpoints
router.get("/snapshot", getDashboardSnapshot);
router.get("/accommodations", getAllAccommodations);
router.get("/accommodations/:accommodationId", getAccommodationById);
router.get("/accommodations/:accommodationId/rooms", getRoomInventory);

// Admin-only modification endpoints
router.post(
  "/accommodations",
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  upload.array("images", 10),
  createAccommodation
);

router.put(
  "/accommodations/:accommodationId",
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  upload.array("images", 10),
  updateAccommodation
);

router.delete(
  "/accommodations/:accommodationId",
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  deleteAccommodation
);

router.post(
  "/accommodations/:accommodationId/rooms",
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  addRoomInventory
);

export default router;
