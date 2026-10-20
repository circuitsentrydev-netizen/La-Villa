
import { Request, Response } from "express";
import { RoomService } from "../services/roomService";

const roomService = new RoomService();

export const createRoom = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const accommodationId = req.params.accommodationId;
    const { roomTypeName, totalCapacity, nightlyRate } = req.body;

    const capacity = Number(totalCapacity);
    const rate = Number(nightlyRate);

    if (
      typeof accommodationId !== "string" ||
      !accommodationId.trim() ||
      typeof roomTypeName !== "string" ||
      !roomTypeName.trim() ||
      !Number.isInteger(capacity) ||
      capacity <= 0 ||
      !Number.isFinite(rate) ||
      rate <= 0
    ) {
      res.status(400).json({
        error:
          "A valid accommodation ID, room type, positive whole-number capacity, and positive nightly rate are required.",
      });
      return;
    }

    const room = await roomService.insertRoom(accommodationId, {
      room_type: roomTypeName.trim(),
      capacity,
      price_per_night: rate,
    });

    res.status(201).json({
      success: true,
      message: "Room created successfully.",
      room,
    });
  } catch (error) {
    console.error("Error creating room:", error);

    res.status(500).json({
      error: "Failed to create room.",
    });
  }
};

export const getRoomsFeed = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const accommodationId = req.params.accommodationId;

    if (
      typeof accommodationId !== "string" ||
      !accommodationId.trim()
    ) {
      res.status(400).json({
        error: "A valid accommodation ID is required.",
      });
      return;
    }

    const rooms =
      await roomService.getRoomsByAccommodation(accommodationId);

    res.status(200).json({
      success: true,
      rooms,
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);

    res.status(500).json({
      error: "Failed to fetch rooms.",
    });
  }
};
