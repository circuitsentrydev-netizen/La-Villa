
import { Request, Response } from "express";
import {HotelService } from "../services/hotelService";

const hotelService = new HotelService();

function parseArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map(String)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed
        .map(String)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    // Fall back to comma-separated values.
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getAccommodationId(req: Request): string | null {
  const value = req.params.accommodationId;

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value) && value[0]?.trim()) {
    return value[0].trim();
  }

  return null;
}

// GET /api/accommodations/:accommodationId
export const getAccommodationById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const accommodationId = getAccommodationId(req);

    if (!accommodationId) {
      res.status(400).json({
        error: "Accommodation ID is required.",
      });
      return;
    }

    const accommodation =
      await hotelService.getAccommodationById(accommodationId);

    if (!accommodation) {
      res.status(404).json({
        error: "Accommodation not found.",
      });
      return;
    }

    res.status(200).json(accommodation);
  } catch (error) {
    console.error("Error fetching accommodation:", error);

    res.status(500).json({
      error: "Failed to fetch accommodation details.",
    });
  }
};

// GET /api/accommodations
export const getAllAccommodations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : undefined;

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : undefined;

    const accommodations =
      await hotelService.getFilteredAccommodations(search, status);

    res.status(200).json(accommodations);
  } catch (error) {
    console.error("Error fetching accommodations:", error);

    res.status(500).json({
      error: "Failed to fetch accommodations.",
    });
  }
};

// POST /api/accommodations
export const createAccommodation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      address,
      pricePerNight,
      description,
      starRating,
      status,
      facilities,
      policies,
      lat,
      lng,
      latitude,
      longitude,
    } = req.body;

    const price = optionalNumber(pricePerNight);

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof address !== "string" ||
      !address.trim() ||
      price === null ||
      price <= 0
    ) {
      res.status(400).json({
        error:
          "Name, address, and a valid positive price per night are required.",
      });
      return;
    }

    const rating = optionalNumber(starRating) ?? 5;

    if (rating < 1 || rating > 5) {
      res.status(400).json({
        error: "Star rating must be between 1 and 5.",
      });
      return;
    }

    const uploadedFiles = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[])
      : [];

    const images = uploadedFiles.map(
      (file) => `/uploads/${file.filename}`
    );

    const accommodation = await hotelService.insertAccommodation({
      name: name.trim(),
      address: address.trim(),
      pricePerNight: price,
      description:
        typeof description === "string"
          ? description.trim()
          : "",
      starRating: rating,
      status: status === "Draft" ? "Draft" : "Published",
      facilities: parseArray(facilities),
      policies: parseArray(policies),
      latitude: optionalNumber(latitude ?? lat),
      longitude: optionalNumber(longitude ?? lng),
      images,
    });

    res.status(201).json({
      message: "Accommodation created successfully.",
      accommodation,
    });
  } catch (error) {
    console.error("Error saving accommodation:", error);

    res.status(500).json({
      error: "Failed to save accommodation. Check the backend logs.",
    });
  }
};

// POST /api/accommodations/:accommodationId/rooms
export const addRoomInventory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const accommodationId = getAccommodationId(req);

    if (!accommodationId) {
      res.status(400).json({
        error: "A valid accommodation ID is required.",
      });
      return;
    }

    const { roomTypeName, totalCapacity, nightlyRate } = req.body;

    const capacity = optionalNumber(totalCapacity);
    const rate = optionalNumber(nightlyRate);

    if (
      typeof roomTypeName !== "string" ||
      !roomTypeName.trim() ||
      capacity === null ||
      !Number.isInteger(capacity) ||
      capacity <= 0 ||
      rate === null ||
      rate <= 0
    ) {
      res.status(400).json({
        error:
          "A room type, positive whole-number capacity, and positive nightly rate are required.",
      });
      return;
    }

    const inventory = await hotelService.insertRoomInventory(
      accommodationId,
      {
        roomTypeName: roomTypeName.trim(),
        totalCapacity: capacity,
        nightlyRate: rate,
      }
    );

    res.status(201).json({
      success: true,
      message: "Room inventory added successfully.",
      inventory,
    });
  } catch (error) {
    console.error("Error adding room inventory:", error);

    res.status(500).json({
      error: "Failed to add room inventory.",
    });
  }
};

// GET /api/snapshot
export const getDashboardSnapshot = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const metrics = await hotelService.computeDashboardSnapshot();

    res.status(200).json(metrics);
  } catch (error) {
    console.error("Error loading dashboard snapshot:", error);

    res.status(500).json({
      error: "Failed to load dashboard data.",
    });
  }
};
