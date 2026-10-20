
export interface RoomRecord {
  id: string;
  accommodation_id: string;
  room_type: string;
  capacity: number;
  price_per_night: string | number;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRoomDTO {
  room_type: string;
  capacity: number;
  price_per_night: number;
  is_available?: boolean;
}
