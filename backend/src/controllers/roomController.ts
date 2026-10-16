import { Request, Response } from 'express';
import { RoomService } from '../services/roomService';

const roomService = new RoomService();

export const createRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accommodationId } = req.params;
    const { room_type, capacity, price_per_night } = req.body;

    // Parameter presence verification safeguard checklist
    if (!room_type || capacity === undefined || price_per_night === undefined) {
      res.status(400).json({ error: 'Room type configuration values, maximum capacity, and nightly rates are required.' });
      return;
    }

    const newRoom = await roomService.insertRoom(accommodationId as string, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Room inventory configuration appended successfully to listing target.',
      room: newRoom
    });
  } catch (error: any) {
    console.error('Error adding room configuration entry:', error);
    res.status(500).json({ error: 'Failed to register configuration row link.' });
  }
};

export const getRoomsFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accommodationId } = req.params;
    const records = await roomService.getRoomsByAccommodation(accommodationId as string);
    
    res.status(200).json(records);
  } catch (error: any) {
    console.error('Error fetching room profile instances:', error);
    res.status(500).json({ error: 'Internal server error pulling sub-listing entities feed.' });
  }
};
