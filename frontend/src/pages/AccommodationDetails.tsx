
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { getImageUrl } from "../utils/imageUrl";

interface RoomType {
  id?: string | number;
  room_type_name?: string;
  total_capacity?: number | string;
  nightly_rate?: number | string;
}

interface Accommodation {
  id: string;
  name: string;
  description?: string;
  address: string;
  starRating: number;
  nightlyRate: string;
  images: string[];
  facilities: string[];
  policies: string[];
  room_types: RoomType[];
  lat?: number | null;
  lng?: number | null;
}

export default function AccommodationDetails() {
  const { accommodationId } = useParams();

  const [stay, setStay] = useState<Accommodation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accommodationId) {
      setError("No accommodation was selected.");
      setLoading(false);
      return;
    }

    const loadAccommodation = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/accommodations/${encodeURIComponent(
            accommodationId
          )}`
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Accommodation not found."
              : "Unable to load accommodation details."
          );
        }

        const data = await response.json();
        setStay(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadAccommodation();
  }, [accommodationId]);

  if (loading) {
    return <main className="stay-details"><p>Loading accommodation...</p></main>;
  }

  if (error || !stay) {
    return (
      <main className="stay-details">
        <p>{error || "Accommodation not found."}</p>
        <Link to="/">Back to homepage</Link>
      </main>
    );
  }

  const mapUrl =
    stay.lat != null && stay.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${stay.lat},${stay.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          stay.address
        )}`;

  return (
    <main className="stay-details">
      <Link to="/" className="back-link">
        ← Back to homepage
      </Link>

      <header className="stay-details-header">
        <h1>{stay.name}</h1>
        <p>★ {stay.starRating} / 5</p>
        <p>{stay.address}</p>
        <h2>{stay.nightlyRate} per night</h2>
      </header>

      <section className="stay-gallery" aria-label="Accommodation photos">
        {stay.images?.length ? (
          stay.images.map((image, index) => (
            <img
              key={`${image}-${index}`}
              src={getImageUrl(image)}
              alt={`${stay.name} photo ${index + 1}`}
              loading={index === 0 ? "eager" : "lazy"}
            />
          ))
        ) : (
          <p>No photos have been added to this accommodation yet.</p>
        )}
      </section>

      <section>
        <h2>About this accommodation</h2>
        <p>{stay.description || "No description has been provided yet."}</p>
      </section>

      <section>
        <h2>Facilities</h2>
        {stay.facilities?.length ? (
          <ul>
            {stay.facilities.map((facility, index) => (
              <li key={`${facility}-${index}`}>{facility}</li>
            ))}
          </ul>
        ) : (
          <p>Facilities have not been listed yet.</p>
        )}
      </section>

      <section>
        <h2>Policies</h2>
        {stay.policies?.length ? (
          <ul>
            {stay.policies.map((policy, index) => (
              <li key={`${policy}-${index}`}>{policy}</li>
            ))}
          </ul>
        ) : (
          <p>No policies have been provided yet.</p>
        )}
      </section>

      <section>
        <h2>Room types</h2>
        {stay.room_types?.length ? (
          <ul>
            {stay.room_types.map((room, index) => (
              <li key={room.id ?? index}>
                <strong>{room.room_type_name ?? "Room"}</strong>
                {" — "}
                Capacity: {room.total_capacity ?? "Not specified"}
                {" — "}
                R {Number(room.nightly_rate ?? 0).toFixed(2)} per night
              </li>
            ))}
          </ul>
        ) : (
          <p>Room details have not been added yet.</p>
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
