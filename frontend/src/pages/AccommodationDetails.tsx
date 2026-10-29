
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { getImageUrl } from "../utils/imageUrl";
import "./AccommodationDetails.css";

interface Room {
  id: string | number;
  room_type_name: string;
  total_capacity: number;
  nightly_rate: number;
}

interface Stay {
  id: string;
  name: string;
  description: string;
  address: string;
  starRating: number;
  nightlyRate: number;
  images: string[];
  facilities: string[];
  policies: string[];
  latitude: number | null;
  longitude: number | null;
}

interface Review {
  id: string;
  user_id: string;
  accommodation_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface ReviewSummary {
  accommodation_id: string;
  average_rating: number;
  review_count: number;
}

interface ReviewListResponse {
  reviews?: Review[];
  summary?: ReviewSummary;
  message?: string;
  error?: string;
}

interface SingleReviewResponse {
  review?: Review | null;
  message?: string;
  error?: string;
}

const BRAND = "#1B4D3E";

const list = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed.filter(Boolean).map(String);
    }
  } catch {
    // Support comma-separated values too.
  }

  return value.split(",").map((item) => item.trim()).filter(Boolean);
};

const getToken = (): string | null =>
  localStorage.getItem("lavilla_token") ||
  localStorage.getItem("token");

const getErrorMessage = (
  data: { message?: string; error?: string },
  fallback: string
): string => data.message || data.error || fallback;

const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function StarDisplay({
  rating,
  size = 20,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <span
      className="review-stars"
      aria-label={`${rating} out of 5 stars`}
      style={{ fontSize: size }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= Math.round(rating) ? "star-filled" : "star-empty"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function StarPicker({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="review-star-picker" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={rating === star}
          aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
          className={star <= rating ? "picker-star selected" : "picker-star"}
          onClick={() => onChange(star)}
        >
          ★
        </button>
      ))}
      <span className="rating-choice">
        {rating > 0 ? `${rating} / 5` : "Choose a rating"}
      </span>
    </div>
  );
}

export default function AccommodationDetails() {
  const navigate = useNavigate();
  const { accommodationId } = useParams();

  const [stay, setStay] = useState<Stay | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [error, setError] = useState("");
  const [roomError, setRoomError] = useState("");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({
    accommodation_id: "",
    average_rating: 0,
    review_count: 0,
  });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewError, setReviewError] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");

  const [myReview, setMyReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editingReview, setEditingReview] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);

  const loadReviews = useCallback(async () => {
    if (!accommodationId) return;

    setReviewsLoading(true);
    setReviewError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/reviews/accommodation/${encodeURIComponent(
          accommodationId
        )}`,
        { headers: { Accept: "application/json" } }
      );

      const data: ReviewListResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to load accommodation reviews.")
        );
      }

      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setSummary(
        data.summary ?? {
          accommodation_id: accommodationId,
          average_rating: 0,
          review_count: 0,
        }
      );
    } catch (err) {
      setReviewError(
        err instanceof Error
          ? err.message
          : "Unable to load accommodation reviews."
      );
    } finally {
      setReviewsLoading(false);
    }
  }, [accommodationId]);

  const loadMyReview = useCallback(async () => {
    if (!accommodationId) return;

    const token = getToken();

    if (!token) {
      setMyReview(null);
      setRating(0);
      setComment("");
      setEditingReview(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/reviews/accommodation/${encodeURIComponent(
          accommodationId
        )}/mine`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        setMyReview(null);
        return;
      }

      const data: SingleReviewResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to load your review.")
        );
      }

      const existing = data.review ?? null;
      setMyReview(existing);

      if (existing) {
        setRating(Number(existing.rating));
        setComment(existing.comment ?? "");
      } else {
        setRating(0);
        setComment("");
      }

      setEditingReview(false);
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Unable to load your review."
      );
    }
  }, [accommodationId]);

  useEffect(() => {
    if (!accommodationId) {
      setError("No accommodation was selected.");
      setLoading(false);
      setRoomsLoading(false);
      setReviewsLoading(false);
      return;
    }

    let cancelled = false;

    const loadAccommodation = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/accommodations/${encodeURIComponent(
            accommodationId
          )}`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ??
              result.error ??
              (response.status === 404
                ? "Accommodation not found."
                : "Unable to load accommodation.")
          );
        }

        const item = result.accommodation ?? result.data ?? result;

        if (!cancelled) {
          setStay({
            id: String(item.id ?? accommodationId),
            name: item.name ?? item.accommodation ?? "Accommodation",
            description: item.description ?? "",
            address: item.address ?? item.location ?? "Location not provided",
            starRating: Number(item.star_rating ?? item.starRating ?? 0),
            nightlyRate: Number(
              item.price_per_night ??
                item.pricePerNight ??
                item.nightly_rate ??
                item.nightlyRate ??
                0
            ),
            images: list(item.images),
            facilities: list(item.facilities),
            policies: list(item.policies),
            latitude:
              item.latitude == null ? null : Number(item.latitude),
            longitude:
              item.longitude == null ? null : Number(item.longitude),
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load accommodation."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const loadRooms = async () => {
      try {
        setRoomsLoading(true);
        setRoomError("");

        const response = await fetch(
          `${API_BASE_URL}/accommodations/${encodeURIComponent(
            accommodationId
          )}/rooms`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ?? result.error ?? "Unable to load room types."
          );
        }

        const records = Array.isArray(result.rooms) ? result.rooms : [];

        if (!cancelled) {
          setRooms(
            records.map((room: Record<string, unknown>) => ({
              id: String(room.id),
              room_type_name: String(
                room.room_type_name ?? room.roomTypeName ?? "Room"
              ),
              total_capacity: Number(
                room.total_capacity ?? room.totalCapacity ?? 0
              ),
              nightly_rate: Number(
                room.nightly_rate ?? room.nightlyRate ?? 0
              ),
            }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setRoomError(
            err instanceof Error
              ? err.message
              : "Unable to load room types."
          );
        }
      } finally {
        if (!cancelled) setRoomsLoading(false);
      }
    };

    void loadAccommodation();
    void loadRooms();

    return () => {
      cancelled = true;
    };
  }, [accommodationId]);

  useEffect(() => {
    void loadReviews();
    void loadMyReview();
  }, [loadReviews, loadMyReview]);

  const reserveRoom = () => {
    if (!stay) return;

    navigate(
      `/reservations?accommodationId=${encodeURIComponent(stay.id)}`
    );
  };

  const startEditing = () => {
    if (!myReview) return;
    setRating(Number(myReview.rating));
    setComment(myReview.comment ?? "");
    setReviewMessage("");
    setReviewError("");
    setEditingReview(true);
  };

  const cancelEditing = () => {
    setRating(Number(myReview?.rating ?? 0));
    setComment(myReview?.comment ?? "");
    setEditingReview(false);
    setReviewError("");
  };

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    if (!accommodationId) return;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setReviewError("Please choose a rating from 1 to 5 stars.");
      return;
    }

    if (!comment.trim()) {
      setReviewError("Please write a comment about your stay.");
      return;
    }

    if (comment.trim().length > 2000) {
      setReviewError("Your review must be 2,000 characters or fewer.");
      return;
    }

    try {
      setSavingReview(true);
      setReviewError("");
      setReviewMessage("");

      const isUpdating = Boolean(myReview && editingReview);
      const url = isUpdating
        ? `${API_BASE_URL}/reviews/${encodeURIComponent(myReview!.id)}`
        : `${API_BASE_URL}/reviews/accommodation/${encodeURIComponent(
            accommodationId
          )}`;

      const response = await fetch(url, {
        method: isUpdating ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
        }),
      });

      const data: SingleReviewResponse = await response.json().catch(() => ({}));

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to save your review.")
        );
      }

      setReviewMessage(data.message ?? "Your review has been saved.");
      setEditingReview(false);

      await Promise.all([loadReviews(), loadMyReview()]);
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Unable to save your review."
      );
    } finally {
      setSavingReview(false);
    }
  };

  const deleteReview = async () => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    if (!myReview) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your review?"
    );

    if (!confirmed) return;

    try {
      setDeletingReview(true);
      setReviewError("");
      setReviewMessage("");

      const response = await fetch(
        `${API_BASE_URL}/reviews/${encodeURIComponent(myReview.id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data: { message?: string; error?: string } =
        await response.json().catch(() => ({}));

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to delete your review.")
        );
      }

      setMyReview(null);
      setRating(0);
      setComment("");
      setEditingReview(false);
      setReviewMessage(data.message ?? "Your review has been deleted.");

      await loadReviews();
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Unable to delete your review."
      );
    } finally {
      setDeletingReview(false);
    }
  };

  if (loading) {
    return (
      <main className="stay-details">
        <p className="stay-state">Loading accommodation...</p>
      </main>
    );
  }

  if (error || !stay) {
    return (
      <main className="stay-details">
        <div className="stay-state stay-error" role="alert">
          {error || "Accommodation not found."}
        </div>
        <Link to="/discover" className="stay-back-link">
          Browse accommodations
        </Link>
      </main>
    );
  }

  const hasCoordinates =
    stay.latitude !== null &&
    stay.longitude !== null &&
    Number.isFinite(stay.latitude) &&
    Number.isFinite(stay.longitude);

  const locationQuery = hasCoordinates
  ? `${stay.latitude},${stay.longitude}`
  : `${stay.name}, ${stay.address}`;

const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  locationQuery
)}`;

const directionsUrl= `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  locationQuery
)}`;
  return (
    <main className="stay-details">
      <Link to="/discover" className="stay-back-link">
        <span aria-hidden="true">←</span> Back to accommodations
      </Link>

      <header className="stay-details-header stay-panel">
        <div className="stay-heading-row">
          <div>
            <span className="stay-eyebrow">LA VILLA · LEKKER STAYS</span>
            <h1>{stay.name}</h1>
            <p className="stay-address">{stay.address}</p>
          </div>

          <div className="stay-header-rating">
            <span className="stay-rating-number">
              {summary.review_count > 0
                ? summary.average_rating.toFixed(1)
                : stay.starRating.toFixed(1)}
            </span>
            <span className="stay-rating-stars">★</span>
            <span className="stay-rating-caption">
              {summary.review_count > 0
                ? `${summary.review_count} ${
                    summary.review_count === 1 ? "review" : "reviews"
                  }`
                : "Property rating"}
            </span>
          </div>
        </div>

        <div className="stay-price-row">
          <div>
            <span className="stay-price">
              R {stay.nightlyRate.toLocaleString("en-ZA", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="stay-price-unit"> / night</span>
          </div>

          <button type="button" className="stay-primary-button" onClick={reserveRoom}>
            Reserve a Room
          </button>
        </div>
      </header>

      <section className="stay-gallery stay-panel" aria-label="Accommodation photos">
        {stay.images.length > 0 ? (
          <div className="stay-gallery-grid">
            {stay.images.map((image, index) => {
              const url = getImageUrl(image);

              return url ? (
                <img
                  key={`${image}-${index}`}
                  src={url}
                  alt={`${stay.name} photo ${index + 1}`}
                  loading={index === 0 ? "eager" : "lazy"}
                />
              ) : null;
            })}
          </div>
        ) : (
          <div className="stay-gallery-empty">
            <span aria-hidden="true">⌂</span>
            <p>No photos have been added yet.</p>
          </div>
        )}
      </section>

      <section className="stay-panel">
        <div className="stay-section-heading">
          <span className="stay-eyebrow">THE EXPERIENCE</span>
          <h2>About this accommodation</h2>
        </div>
        <p className="stay-body-copy">
          {stay.description || "No description provided."}
        </p>
      </section>

      <section className="stay-panel">
        <div className="stay-section-heading">
          <span className="stay-eyebrow">YOUR COMFORT</span>
          <h2>Facilities</h2>
        </div>
        {stay.facilities.length > 0 ? (
          <ul className="stay-feature-list">
            {stay.facilities.map((facility, index) => (
              <li key={`${facility}-${index}`}>{facility}</li>
            ))}
          </ul>
        ) : (
          <p className="stay-muted">No facilities listed.</p>
        )}
      </section>

      <section className="stay-panel">
        <div className="stay-section-heading">
          <span className="stay-eyebrow">BEFORE YOU ARRIVE</span>
          <h2>Policies</h2>
        </div>
        {stay.policies.length > 0 ? (
          <ul className="stay-feature-list">
            {stay.policies.map((policy, index) => (
              <li key={`${policy}-${index}`}>{policy}</li>
            ))}
          </ul>
        ) : (
          <p className="stay-muted">No policies provided.</p>
        )}
      </section>

      <section className="stay-panel">
        <div className="stay-section-heading">
          <span className="stay-eyebrow">FIND YOUR ROOM</span>
          <h2>Available room types</h2>
        </div>

        {roomsLoading ? (
          <p className="stay-muted">Loading room types...</p>
        ) : roomError ? (
          <p className="stay-alert stay-alert-error" role="alert">{roomError}</p>
        ) : rooms.length > 0 ? (
          <div className="room-types-list">
            {rooms.map((room) => (
              <article className="room-type-card" key={room.id}>
                <div>
                  <h3>{room.room_type_name}</h3>
                  <p>Capacity: {room.total_capacity} guests</p>
                  <p className="room-type-price">
                    R {room.nightly_rate.toLocaleString("en-ZA", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} <span>/ night</span>
                  </p>
                </div>
                <button type="button" className="stay-outline-button" onClick={reserveRoom}>
                  Reserve this room
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="stay-muted">No room types have been added yet.</p>
        )}
      </section>

      <section className="stay-panel stay-reviews-section">
        <div className="stay-section-heading">
          <span className="stay-eyebrow">GUEST EXPERIENCES</span>
          <h2>Reviews &amp; ratings</h2>
          <p className="stay-muted">
            Discover what guests think about {stay.name}.
          </p>
        </div>

        <div className="reviews-summary">
          <div className="reviews-average">
            <strong>
              {summary.review_count > 0
                ? summary.average_rating.toFixed(1)
                : "—"}
            </strong>
            <StarDisplay rating={summary.average_rating} size={19} />
            <span>
              {summary.review_count}{" "}
              {summary.review_count === 1 ? "review" : "reviews"}
            </span>
          </div>
          <p>
            {summary.review_count > 0
              ? "Ratings are based on guest reviews."
              : "Be the first to share your experience."}
          </p>
        </div>

        {reviewMessage && (
          <div className="stay-alert stay-alert-success" role="status">
            {reviewMessage}
          </div>
        )}

        {reviewError && (
          <div className="stay-alert stay-alert-error" role="alert">
            {reviewError}
          </div>
        )}

        <div className="review-form-card">
          <h3>{myReview && !editingReview ? "Your review" : myReview ? "Edit your review" : "Share your experience"}</h3>

          {!getToken() ? (
            <div className="review-signin">
              <p>Sign in to rate this accommodation and leave a review.</p>
              <button
                type="button"
                className="stay-primary-button"
                onClick={() => navigate("/login")}
              >
                Sign in to review
              </button>
            </div>
          ) : myReview && !editingReview ? (
            <div className="my-review-card">
              <div className="review-card-top">
                <StarDisplay rating={myReview.rating} />
                <span className="review-date">{formatDate(myReview.created_at)}</span>
              </div>
              <p className="review-comment">
                {myReview.comment || "No written comment provided."}
              </p>
              <div className="review-actions">
                <button type="button" className="stay-outline-button" onClick={startEditing}>
                  Edit review
                </button>
                <button
                  type="button"
                  className="stay-danger-button"
                  disabled={deletingReview}
                  onClick={() => void deleteReview()}
                >
                  {deletingReview ? "Deleting..." : "Delete review"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submitReview} className="review-form">
              <label className="review-field-label">Your rating</label>
              <StarPicker rating={rating} onChange={setRating} />

              <label className="review-field-label" htmlFor="review-comment">
                Your review
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Tell other guests about your experience..."
                rows={5}
                maxLength={2000}
                required
              />
              <div className="review-character-count">
                {comment.length}/2000 characters
              </div>

              <div className="review-actions">
                <button
                  type="submit"
                  className="stay-primary-button"
                  disabled={savingReview}
                >
                  {savingReview
                    ? "Saving..."
                    : myReview
                      ? "Save changes"
                      : "Submit review"}
                </button>
                {myReview && (
                  <button
                    type="button"
                    className="stay-outline-button"
                    onClick={cancelEditing}
                    disabled={savingReview}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        <div className="reviews-list-heading">
          <h3>What guests are saying</h3>
        </div>

        {reviewsLoading ? (
          <p className="stay-muted">Loading reviews...</p>
        ) : reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.map((review) => (
              <article className="review-item" key={review.id}>
                <div className="review-card-top">
                  <div className="review-avatar" aria-hidden="true">
                    {String(review.user_id || "G").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="review-meta">
                    <strong>
                      {myReview?.id === review.id ? "You" : "Guest"}
                    </strong>
                    <span>{formatDate(review.created_at)}</span>
                  </div>
                  <StarDisplay rating={Number(review.rating)} size={17} />
                </div>
                <p className="review-comment">
                  {review.comment || "No written comment provided."}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="reviews-empty">
            <span aria-hidden="true">☆</span>
            <h3>No reviews yet</h3>
            <p>Be the first guest to rate this accommodation.</p>
          </div>
        )}
      </section>

      <section className="stay-panel stay-location-panel">
        <div className="stay-section-heading">
          <span className="stay-eyebrow">GETTING HERE</span>
          <h2>Location</h2>
        </div>

        <p className="stay-body-copy stay-location-address">
          <span aria-hidden="true"> </span>
          {stay.address}
        </p>

        <div className="stay-map-container">
          <iframe
            title={`Map showing ${stay.name} at ${stay.address}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(
              locationQuery
            )}&z=16&output=embed`}
            width="100%"
            height="400"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>

        <div className="stay-location-actions">
          <a
            className="stay-map-link"
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View location on Google Maps ↗
          </a>

          <a
            className="stay-map-link"
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Get directions ↗
          </a>
        </div>
      </section>


      <footer className="stay-footer">
        <span>LA VILLA</span>
        <p>Thoughtful stays. Memorable experiences.</p>
      </footer>
    </main>
  );
}
