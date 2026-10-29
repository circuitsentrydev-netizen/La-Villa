
export interface Review {
  id: string;
  user_id: string;
  accommodation_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface CreateReviewInput {
  user_id: string;
  accommodation_id: string;
  rating: number;
  comment: string | null;
}

export interface UpdateReviewInput {
  rating: number;
  comment: string | null;
}

export interface AccommodationReviewSummary {
  accommodation_id: string;
  average_rating: number;
  review_count: number;
}
