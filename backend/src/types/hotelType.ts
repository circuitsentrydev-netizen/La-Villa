export interface AccommodationRecord {
  id: number;
  name: string;
  address: string;
  star_rating: number;
  price_per_night: number;
  images: string[];
  facilities: string[];
  policies: string[];
  latitude: number;
  longitude: number;
  status: 'Draft' | 'Published';
  created_at: Date;
}

export interface DashboardSnapshot {
  activeListingsCount: number;
   roomCapacityTotal: number;
  occupancyTodayPercentage: string;
  occupancyRatioStr: string;
  arrivalsToday: number;
  pendingReservations: number;
  aggregatedRevenue: string;
  systemHealth: string;
}
