
import { Request, Response } from "express";
import {HotelService,CreateAccommodationDTO,CreateRoomInventoryDTO,} from "../services/hotelService";

const hotelService = new HotelService();

const idFrom = (req: Request): string =>
  String(req.params.accommodationId ?? "");

const isDuplicateAccommodationName = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;

  const dbError = error as {
    code?: string;
    constraint?: string;
  };

  return (
    dbError.code === "23505" &&
    dbError.constraint === "accommodations_name_key"
  );
};

const parseArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item != null)
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value !== "string" || !value.trim()) return [];

  const input = value.trim();

  if (input.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item != null)
          .map((item) => String(item).trim())
          .filter(Boolean);
      }
    } catch {
      // Continue to other formats.
    }
  }

  if (input.startsWith("{") && input.endsWith("}")) {
    const inner = input.slice(1, -1).trim();
    if (!inner) return [];

    const values =
      inner.match(/"(?:[^"\\]|\\.)*"|[^,]+/g) ?? [];

    return values
      .map((item) => {
        const trimmed = item.trim();

        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          try {
            return JSON.parse(trimmed) as string;
          } catch {
            return trimmed.slice(1, -1);
          }
        }

        return trimmed;
      })
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return input.split(",").map((item) => item.trim()).filter(Boolean);
};

const imagePaths = (req: Request): string[] =>
  ((req.files as Express.Multer.File[] | undefined) ?? []).map(
    (file) => `/uploads/${file.filename}`
  );

const existingImages = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // A plain string may be one image path.
  }

  return [value];
};

function buildDTO(
  body: Record<string, unknown>,
  images: string[],
  previousImages: string[] = []
): CreateAccommodationDTO {
  const name = String(body.name ?? "").trim();
  const address = String(body.address ?? "").trim();
  const pricePerNight = Number(body.pricePerNight);
  const starRating = Number(body.starRating);
  const status = String(body.status ?? "Draft");

  if (!name || !address) {
    throw new Error("Accommodation name and address are required.");
  }

  if (!Number.isFinite(pricePerNight) || pricePerNight <= 0) {
    throw new Error("Price per night must be greater than zero.");
  }

  if (!Number.isFinite(starRating) || starRating < 1 || starRating > 5) {
    throw new Error("Star rating must be between 1 and 5.");
  }

  if (status !== "Draft" && status !== "Published") {
    throw new Error("Status must be Draft or Published.");
  }

  const numberOrNull = (value: unknown): number | null => {
    if (value === "" || value == null) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  return {
    name,
    address,
    pricePerNight,
    description: String(body.description ?? "").trim(),
    starRating,
    status,
    facilities: parseArray(body.facilities),
    policies: parseArray(body.policies),
    latitude: numberOrNull(body.latitude),
    longitude: numberOrNull(body.longitude),
    images: images.length > 0 ? images : previousImages,
  };
}

const handleError = (
  res: Response,
  error: unknown,
  fallback: string,
  status = 500
): void => {
  console.error(fallback, error);
  res.status(status).json({
    message: error instanceof Error ? error.message : fallback,
  });
};

export async function getAllAccommodations(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const accommodations = await hotelService.getFilteredAccommodations(
      typeof req.query.search === "string" ? req.query.search : undefined,
      typeof req.query.status === "string" ? req.query.status : undefined
    );

    res.status(200).json({ accommodations });
  } catch (error) {
    handleError(res, error, "Failed to load accommodations.");
  }
}

export async function getAccommodationById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const accommodation = await hotelService.getAccommodationById(idFrom(req));

    if (!accommodation) {
      res.status(404).json({ message: "Accommodation not found." });
      return;
    }

    res.status(200).json({ accommodation });
  } catch (error) {
    handleError(res, error, "Failed to load accommodation.");
  }
}

export async function createAccommodation(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const dto = buildDTO(req.body, imagePaths(req));
    const accommodation = await hotelService.insertAccommodation(dto);

    res.status(201).json({
      message: "Accommodation created successfully.",
      accommodation,
    });
  } catch (error) {
    if (isDuplicateAccommodationName(error)) {
      res.status(409).json({
        message:
          "An accommodation with this name already exists. Please use a different name or edit the existing accommodation.",
      });
      return;
    }

    if (
      error instanceof Error &&
      (
        error.message.startsWith("Accommodation") ||
        error.message.startsWith("Price per night") ||
        error.message.startsWith("Star rating") ||
        error.message.startsWith("Status must")
      )
    ) {
      handleError(res, error, "Failed to create accommodation.", 400);
      return;
    }

    handleError(res, error, "Failed to create accommodation.");
  }
}

export async function updateAccommodation(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = idFrom(req);
    const existing = await hotelService.getAccommodationById(id);

    if (!existing) {
      res.status(404).json({ message: "Accommodation not found." });
      return;
    }

    const dto = buildDTO(
      req.body,
      imagePaths(req),
      existingImages(existing.images)
    );

    const accommodation = await hotelService.updateAccommodation(id, dto);

    if (!accommodation) {
      res.status(404).json({ message: "Accommodation not found." });
      return;
    }

    res.status(200).json({
      message: "Accommodation updated successfully.",
      accommodation,
    });
  } catch (error) {
    if (isDuplicateAccommodationName(error)) {
      res.status(409).json({
        message:
          "Another accommodation already uses this name. Please choose a different name.",
      });
      return;
    }

    handleError(res, error, "Failed to update accommodation.");
  }
}

export async function deleteAccommodation(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const deleted = await hotelService.deleteAccommodation(idFrom(req));

    if (!deleted) {
      res.status(404).json({ message: "Accommodation not found." });
      return;
    }

    res.status(200).json({
      message: "Accommodation deleted successfully.",
    });
  } catch (error) {
    handleError(res, error, "Failed to delete accommodation.", 409);
  }
}

export async function addRoomInventory(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = idFrom(req);
    const { roomTypeName, totalCapacity, nightlyRate } = req.body;
    const capacity = Number(totalCapacity);
    const rate = Number(nightlyRate);

    if (!(await hotelService.getAccommodationById(id))) {
      res.status(404).json({ message: "Accommodation not found." });
      return;
    }

    if (!String(roomTypeName ?? "").trim()) {
      res.status(400).json({ message: "Room type name is required." });
      return;
    }

    if (
      !Number.isInteger(capacity) ||
      capacity < 1 ||
      !Number.isFinite(rate) ||
      rate <= 0
    ) {
      res.status(400).json({
        message: "Enter a valid capacity and nightly rate.",
      });
      return;
    }

    const room = await hotelService.insertRoomInventory(id, {
      roomTypeName: String(roomTypeName).trim(),
      totalCapacity: capacity,
      nightlyRate: rate,
    } as CreateRoomInventoryDTO);

    res.status(201).json({
      message: "Room inventory added successfully.",
      room,
    });
  } catch (error) {
    handleError(res, error, "Failed to add room inventory.");
  }
}

export async function getRoomInventory(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const rooms = await hotelService.getRoomInventory(idFrom(req));
    res.status(200).json({ rooms });
  } catch (error) {
    handleError(res, error, "Failed to load room inventory.");
  }
}

export async function getDashboardSnapshot(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const snapshot = await hotelService.computeDashboardSnapshot();
    res.status(200).json({ snapshot });
  } catch (error) {
    handleError(res, error, "Failed to load dashboard summary.");
  }
}
