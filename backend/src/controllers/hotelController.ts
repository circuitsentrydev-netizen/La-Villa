import { Request, Response } from 'express';
import { pool } from '../config/database';

// 1. GET ALL ACCOMMODATIONS (Public Endpoint for Frontend Grid)
export const getAllAccommodations = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM accommodations ORDER BY created_at DESC');
    res.status(200).json(result.rows);
  } catch (error: any) {
    console.error('Error fetching accommodations:', error);
    res.status(500).json({ error: 'Internal server error pulling listings feed.' });
  }
};

// 2. CREATE NEW ACCOMMODATION (Admin Protected Writer Endpoint)
export const createAccommodation = async (req: Request, res: Response): Promise<void> => {
  const { name, address, starRating, pricePerNight, images, facilities, policies, latitude, longitude } = req.body;

  try {
    // Basic structural request parameter verification check
    if (!name || !pricePerNight || !address) {
      res.status(400).json({ error: 'Name, address, and price per night are required elements.' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO accommodations 
      (name, address, star_rating, price_per_night, images, facilities, policies, latitude, longitude) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        name,
        address,
        starRating || 5,
        pricePerNight,
        images || ['https://unsplash.com'],  // Fallback visual asset placeholder
        facilities || ['Wi-Fi', 'Pool'],
        policies || ['Check-in 14:00', 'No pets'],
        latitude || -33.9249,   // Defaults to Cape Town region coordinates parameters
        longitude || 18.4241
      ]
    );

    res.status(201).json({
      message: 'Accommodation listing successfully added.',
      accommodation: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating accommodation:', error);
    res.status(500).json({ error: 'Failed to record accommodation row.' });
  }
};
