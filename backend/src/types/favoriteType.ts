
export interface FavoriteAccommodation {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  star_rating: number | string | null;
  price_per_night: number | string | null;
  images: string[] | string | null;
  created_at: string;
}

export interface FavoriteResponse {
  favorites: FavoriteAccommodation[];
}
