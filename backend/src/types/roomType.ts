export interface RoomRecord {
  id: string;                          // UUID primary key
  accommodation_id: string;            // UUID foreign key linking to parent property
  room_type: string;                     
  capacity: number;           // Max guest occupancy threshold
  price_per_night: number;   // Numeric fee per stay night
  is_available: boolean;     // Dynamic status flag
  created_at: Date;
  updated_at: Date;
}

export interface CreateRoomDTO {
  room_type: string;
  capacity: number;
  price_per_night: number;
  is_available?: boolean;
}
