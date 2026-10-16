import { pool } from '../config/database';
import { AccommodationRecord, DashboardSnapshot } from '../types/hotelType';

export class HotelService {
  
  // 1. Fetch filtered accommodations with embedded room counts
  public async getFilteredAccommodations(search?: string, status?: string): Promise<any[]> {
    let queryText = `
      SELECT a.*, 
             COALESCE(json_agg(ri.*) FILTER (WHERE ri.id IS NOT NULL), '[]') as room_types
      FROM accommodations a
      LEFT JOIN room_inventories ri ON a.id = ri.accommodation_id
    `;
    
    const queryParams: any[] = [];
    const conditions: string[] = [];

    if (search) {
      queryParams.push(`%${search}%`);
      conditions.push(`(a.name ILIKE $${queryParams.length} OR a.address ILIKE $${queryParams.length})`);
    }

    if (status && status !== 'All statuses') {
      queryParams.push(status);
      conditions.push(`a.status = $${queryParams.length}`);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' GROUP BY a.id ORDER BY a.created_at DESC';

    const result = await pool.query(queryText, queryParams);
    
    return result.rows.map(row => {
      const totalRooms = row.room_types.reduce((sum: number, item: any) => sum + item.total_capacity, 0);
      return {
        id: row.id,
        accommodation: row.name,
        starRating: row.star_rating,
        location: row.address,
        roomInventory: `${totalRooms} rooms / ${row.room_types.length} room types`,
        nightlyRate: `From R${row.price_per_night || 0}`, 
        status: row.status || 'Published'
      };
    });
  }

  // 2. Insert new entry (Perfect mapping to your text[], numeric, and uuid fields)
  public async insertAccommodation(data: any): Promise<any> {
    const { name, description, address, latitude, longitude, starRating, policies, facilities, images, status, pricePerNight } = data;

    // Matches your columns exactly: name, description, address, latitude, longitude, star_rating, policies, amenities, images, status, price_per_night
    const result = await pool.query(
      `INSERT INTO accommodations 
      (name, description, address, latitude, longitude, star_rating, policies, amenities, images, status, price_per_night) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [
        name,
        description || null,
        address,
        latitude !== undefined ? parseFloat(latitude) : null,
        longitude !== undefined ? parseFloat(longitude) : null,
        starRating !== undefined ? parseFloat(starRating) : null,
        policies || null,      // Correctly saves to your text[] type field
        facilities || null,    // Frontend data arrays saved directly to amenities text[] column
        images || null,        // Correctly saves to your text[] type field
        status || 'Published',
        pricePerNight || 0.00
      ]
    );

    return result.rows[0]; // Returns the registered row object instance
  }

  // 3. Link dynamic room configurations
  public async insertRoomInventory(accommodationId: string, data: any): Promise<any> {
    const { roomTypeName, totalCapacity, nightlyRate } = data;

    const result = await pool.query(
      `INSERT INTO room_inventories (accommodation_id, room_type_name, total_capacity, nightly_rate)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [accommodationId, roomTypeName, totalCapacity, nightlyRate]
    );

    return result.rows[0];
  }

  // 4. Calculate dashboard aggregate summaries
  public async computeDashboardSnapshot(): Promise<DashboardSnapshot> {
    const activeListingsRes = await pool.query("SELECT COUNT(*) FROM accommodations WHERE status = 'Published'");
    const activeCount = parseInt(activeListingsRes.rows[0].count);

    const inventoryRes = await pool.query(`
      SELECT COALESCE(SUM(ri.total_capacity), 0) as total, 
             COALESCE(SUM(ri.occupied_count), 0) as occupied 
      FROM room_inventories ri
      JOIN accommodations a ON ri.accommodation_id = a.id
      WHERE a.status = 'Published'
    `);
    
    const totalCapacity = parseInt(inventoryRes.rows[0].total);
    const occupiedCount = parseInt(inventoryRes.rows[0].occupied);
    const occupancyPercentage = totalCapacity > 0 ? Math.round((occupiedCount / totalCapacity) * 100) : 0;

    const pendingRes = await pool.query("SELECT COUNT(*) FROM reservations WHERE status = 'Pending'");
    const pendingCount = parseInt(pendingRes.rows[0].count);

    const revenueRes = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM reservations WHERE status = 'Confirmed'");
    const aggregatedRevenue = parseFloat(revenueRes.rows[0].total);

    return {
      activeListingsCount: activeCount,
      roomCapacityTotal: totalCapacity,
      occupancyTodayPercentage: `${occupancyPercentage}%`,
      occupancyRatioStr: totalCapacity > 0 ? `${occupiedCount} of ${totalCapacity} rooms occupied` : '0 units active',
      arrivalsToday: 0, 
      pendingReservations: pendingCount,
      aggregatedRevenue: `R ${aggregatedRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
      systemHealth: activeCount > 0 ? 'Live & Active' : 'No Listings Online'
    };
  }
}
