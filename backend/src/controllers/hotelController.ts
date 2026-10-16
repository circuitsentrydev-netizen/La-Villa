import { Request, Response } from 'express';
import { HotelService } from '../services/hotelService';

const hotelService = new HotelService();

export const getAllAccommodations = async (req: Request, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string;
    const status = req.query.status as string;

    const formattedData = await hotelService.getFilteredAccommodations(search, status);
    res.status(200).json(formattedData);
  } catch (error: any) {
    console.error('Error fetching accommodations grid:', error);
    res.status(500).json({ error: 'Internal server error pulling listings feed.' });
  }
};

export const createAccommodation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, pricePerNight, address } = req.body;
    if (!name || !pricePerNight || !address) {
      res.status(400).json({ error: 'Name, address, and price per night are required elements.' });
      return;
    }

    const newHotel = await hotelService.insertAccommodation(req.body);
    res.status(201).json({
      message: 'Accommodation listing successfully added from admin portal.',
      accommodation: newHotel
    });
  } catch (error: any) {
    console.error('Error recording accommodation:', error);
    res.status(500).json({ error: 'Failed to record accommodation row.' });
  }
};

export const addRoomInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accommodationId } = req.params;
    const { roomTypeName, totalCapacity, nightlyRate } = req.body;

    if (!roomTypeName || !totalCapacity || !nightlyRate) {
      res.status(400).json({ error: 'Missing room configuration body details.' });
      return;
    }

    // 💡 Added 'as string' assertion to guarantee a primitive string parameter type layout mapping
    const newInventory = await hotelService.insertRoomInventory(accommodationId as string, req.body);
    res.status(201).json({ success: true, inventory: newInventory });
  } catch (error: any) {
    console.error('Error adding configuration element:', error);
    res.status(500).json({ error: 'Failed to link dynamic room configuration structural record.' });
  }
};

export const getDashboardSnapshot = async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await hotelService.computeDashboardSnapshot();
    res.status(200).json(metrics);
  } catch (error: any) {
    console.error('Error computing engine aggregates:', error);
    res.status(500).json({ error: 'Dynamic calculations execution error running core updates.' });
  }
};
