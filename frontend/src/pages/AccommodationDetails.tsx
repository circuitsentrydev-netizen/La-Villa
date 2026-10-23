
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { getImageUrl } from "../utils/imageUrl";

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

const list = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed.filter(Boolean).map(String);
    }
  } catch {
    // Fall back to comma-separated values.
  }

  return value.split(",").map((item) => item.trim()).filter(Boolean);
};

export default function AccommodationDetails() {
  const navigate = useNavigate();
  const { accommodationId } = useParams();

  const [stay, setStay] = useState<Stay | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [error, setError] = useState("");
  const [roomError, setRoomError] = useState("");

  useEffect(() => {
    if (!accommodationId) {
      setError("No accommodation was selected.");
      setLoading(false);
      setRoomsLoading(false);
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
        if (!cancelled) {
          setLoading(false);
        }
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
        if (!cancelled) {
          setRoomsLoading(false);
        }
      }
    };

    void loadAccommodation();
    void loadRooms();

    return () => {
      cancelled = true;
    };
  }, [accommodationId]);

  const reserveRoom = () => {
    if (!stay) return;

    navigate(
      `/reservations?accommodationId=${encodeURIComponent(stay.id)}`
    );
  };

  if (loading) {
    return (
      <main className="stay-details">
        <p>Loading accommodation...</p>
      </main>
    );
  }

  if (error || !stay) {
    return (
      <main className="stay-details">
        <p role="alert">{error || "Accommodation not found."}</p>
        <Link to="/discover">Browse accommodations</Link>
      </main>
    );
  }

  const hasCoordinates =
    stay.latitude !== null &&
    stay.longitude !== null &&
    Number.isFinite(stay.latitude) &&
    Number.isFinite(stay.longitude);

  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${stay.latitude},${stay.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        stay.address
      )}`;

  return (
    <main className="stay-details">
      <Link to="/discover" className="back-link">
        ← Back to accommodations
      </Link>

      <header className="stay-details-header">
        <h1>{stay.name}</h1>
        <p>★ {stay.starRating} / 5</p>
        <p>{stay.address}</p>
        <h2>R {stay.nightlyRate.toFixed(2)} per night</h2>

        <button type="button" onClick={reserveRoom}>
          Reserve a Room
        </button>
      </header>

      <section className="stay-gallery" aria-label="Accommodation photos">
        {stay.images.length > 0 ? (
          stay.images.map((image, index) => {
            const url = getImageUrl(image);

            return url ? (
              <img
                key={`${image}-${index}`}
                src={url}
                alt={`${stay.name} photo ${index + 1}`}
                loading={index === 0 ? "eager" : "lazy"}
              />
            ) : null;
          })
        ) : (
          <p>No photos have been added yet.</p>
        )}
      </section>

      <section>
        <h2>About this accommodation</h2>
        <p>{stay.description || "No description provided."}</p>
      </section>

      <section>
        <h2>Facilities</h2>
        {stay.facilities.length > 0 ? (
          <ul>
            {stay.facilities.map((facility, index) => (
              <li key={`${facility}-${index}`}>{facility}</li>
            ))}
          </ul>
        ) : (
          <p>No facilities listed.</p>
        )}
      </section>

      <section>
        <h2>Policies</h2>
        {stay.policies.length > 0 ? (
          <ul>
            {stay.policies.map((policy, index) => (
              <li key={`${policy}-${index}`}>{policy}</li>
            ))}
          </ul>
        ) : (
          <p>No policies provided.</p>
        )}
      </section>

      <section>
        <h2>Available room types</h2>

        {roomsLoading ? (
          <p>Loading room types...</p>
        ) : roomError ? (
          <p role="alert">{roomError}</p>
        ) : rooms.length > 0 ? (
          <div className="room-types-list">
            {rooms.map((room) => (
              <article className="room-type-card" key={room.id}>
                <h3>{room.room_type_name}</h3>
                <p>Capacity: {room.total_capacity} guests</p>
                <p>R {room.nightly_rate.toFixed(2)} per night</p>

                <button type="button" onClick={reserveRoom}>
                  Reserve This Room
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p>No room types have been added yet.</p>
        )}
      </section>

      <section>
        <h2>Location</h2>
        <p>{stay.address}</p>
        <a href={mapUrl} target="_blank" rel="noreferrer">
          View on Google Maps
        </a>
      </section>
    </main>
  );
}
