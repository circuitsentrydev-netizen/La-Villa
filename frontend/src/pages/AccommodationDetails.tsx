
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
  } catch { /* Use comma-separated values below. */ }
  return value.split(",").map((v) => v.trim()).filter(Boolean);
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const nights = (start: string, end: string) =>
  start && end
    ? Math.max(0, Math.round((Date.parse(`${end}T00:00:00`) - Date.parse(`${start}T00:00:00`)) / 86400000))
    : 0;

export default function AccommodationDetails() {
  const { accommodationId } = useParams();
  const [stay, setStay] = useState<Stay | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [error, setError] = useState("");
  const [roomError, setRoomError] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [guests, setGuests] = useState<Record<string, number>>({});
  const [checkIns, setCheckIns] = useState<Record<string, string>>({});
  const [checkOuts, setCheckOuts] = useState<Record<string, string>>({});
  const [booking, setBooking] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    if (!accommodationId) {
      setError("No accommodation was selected.");
      setLoading(false);
      setRoomsLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/accommodations/${encodeURIComponent(accommodationId)}`);
        if (!response.ok) throw new Error(response.status === 404 ? "Accommodation not found." : "Unable to load accommodation.");
        const result = await response.json();
        const a = result.accommodation ?? result;
        if (!cancelled) setStay({
          id: String(a.id), name: a.name ?? "Accommodation",
          description: a.description ?? "", address: a.address ?? "Location not provided",
          starRating: Number(a.star_rating ?? a.starRating ?? 0),
          nightlyRate: Number(a.price_per_night ?? a.pricePerNight ?? 0),
          images: list(a.images), facilities: list(a.facilities), policies: list(a.policies),
          latitude: a.latitude == null ? null : Number(a.latitude),
          longitude: a.longitude == null ? null : Number(a.longitude),
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load accommodation.");
      } finally {
        if (!cancelled) setLoading(false);
      }

      try {
        const response = await fetch(`${API_BASE_URL}/accommodations/${encodeURIComponent(accommodationId)}/rooms`);
        if (!response.ok) throw new Error("Unable to load room types.");
        const result = await response.json();
        if (!Array.isArray(result.rooms)) throw new Error("Unexpected room data received.");
        if (!cancelled) setRooms(result.rooms.map((r: Record<string, unknown>) => ({
          id: String(r.id), room_type_name: String(r.room_type_name ?? r.roomTypeName ?? "Room"),
          total_capacity: Number(r.total_capacity ?? r.totalCapacity ?? 0),
          nightly_rate: Number(r.nightly_rate ?? r.nightlyRate ?? 0),
        })));
      } catch (e) {
        if (!cancelled) setRoomError(e instanceof Error ? e.message : "Unable to load room types.");
      } finally {
        if (!cancelled) setRoomsLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [accommodationId]);

  const reserve = async (room: Room) => {
    const id = String(room.id);
    const name = (names[id] ?? "").trim();
    const count = guests[id] ?? 1;
    const start = checkIns[id] ?? "";
    const end = checkOuts[id] ?? "";
    setMessage("");
    setBookingError("");

    if (!name || name.length > 120) return setBookingError("Enter a guest name of up to 120 characters.");
    if (!Number.isInteger(count) || count < 1 || count > room.total_capacity)
      return setBookingError(`This room accommodates 1–${room.total_capacity} guests.`);
    if (!start || !end || nights(start, end) < 1)
      return setBookingError("Check-out must be after check-in.");
    if (start < today()) return setBookingError("Check-in cannot be in the past.");

    setBooking(id);
    try {
      const response = await fetch(`${API_BASE_URL}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: name, accommodation_id: stay?.id,
          room_inventory_id: room.id, guest_count: count,
          check_in_date: start, check_out_date: end,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message ?? result.error ?? "Reservation failed.");
      setMessage(`Reservation submitted${result.reservation?.reservation_code ? ` — reference: ${result.reservation.reservation_code}` : ""}. Pending confirmation.`);
      setNames((old) => ({ ...old, [id]: "" }));
    } catch (e) {
      setBookingError(e instanceof Error ? e.message : "Reservation failed.");
    } finally {
      setBooking(null);
    }
  };

  if (loading) return <main className="stay-details"><p>Loading accommodation...</p></main>;
  if (error || !stay) return <main className="stay-details"><p>{error || "Accommodation not found."}</p><Link to="/">Back to homepage</Link></main>;

  const mapUrl = stay.latitude != null && stay.longitude != null && Number.isFinite(stay.latitude) && Number.isFinite(stay.longitude)
    ? `https://www.google.com/maps/search/?api=1&query=${stay.latitude},${stay.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stay.address)}`;

  return (
    <main className="stay-details">
      <Link to="/" className="back-link">← Back to homepage</Link>
      <header className="stay-details-header">
        <h1>{stay.name}</h1><p>★ {stay.starRating} / 5</p><p>{stay.address}</p>
        <h2>R {stay.nightlyRate.toFixed(2)} per night</h2>
      </header>

      <section className="stay-gallery" aria-label="Accommodation photos">
        {stay.images.length ? stay.images.map((img, i) => {
          const url = getImageUrl(img);
          return url ? <img key={`${img}-${i}`} src={url} alt={`${stay.name} photo ${i + 1}`} loading={i ? "lazy" : "eager"} /> : null;
        }) : <p>No photos have been added yet.</p>}
      </section>

      <section><h2>About this accommodation</h2><p>{stay.description || "No description provided."}</p></section>
      <section><h2>Facilities</h2>{stay.facilities.length ? <ul>{stay.facilities.map((v, i) => <li key={`${v}-${i}`}>{v}</li>)}</ul> : <p>No facilities listed.</p>}</section>
      <section><h2>Policies</h2>{stay.policies.length ? <ul>{stay.policies.map((v, i) => <li key={`${v}-${i}`}>{v}</li>)}</ul> : <p>No policies provided.</p>}</section>

      <section>
        <h2>Available room types</h2>
        {roomsLoading ? <p>Loading room types...</p> : roomError ? <p role="alert">{roomError}</p> : rooms.length ? (
          <div className="room-types-list">
            {rooms.map((room) => {
              const id = String(room.id);
              const stayNights = nights(checkIns[id] ?? "", checkOuts[id] ?? "");
              return (
                <article className="room-type-card" key={id}>
                  <h3>{room.room_type_name}</h3>
                  <p>Capacity: {room.total_capacity} guests</p>
                  <p>R {room.nightly_rate.toFixed(2)} per night</p>
                  <form onSubmit={(e) => { e.preventDefault(); void reserve(room); }}>
                    <h4>Reserve this room</h4>
                    <label>Guest name<input required maxLength={120} autoComplete="name" value={names[id] ?? ""} onChange={(e) => setNames((v) => ({ ...v, [id]: e.target.value }))} /></label>
                    <label>Number of guests<input required type="number" min={1} max={room.total_capacity} value={guests[id] ?? 1} onChange={(e) => setGuests((v) => ({ ...v, [id]: Number(e.target.value) }))} /></label>
                    <label>Check-in<input required type="date" min={today()} value={checkIns[id] ?? ""} onChange={(e) => setCheckIns((v) => ({ ...v, [id]: e.target.value }))} /></label>
                    <label>Check-out<input required type="date" min={checkIns[id] || today()} value={checkOuts[id] ?? ""} onChange={(e) => setCheckOuts((v) => ({ ...v, [id]: e.target.value }))} /></label>
                    {stayNights > 0 && <p>Estimated total: <strong>R {(stayNights * room.nightly_rate).toFixed(2)}</strong> ({stayNights} nights)</p>}
                    <button type="submit" disabled={booking === id}>{booking === id ? "Submitting..." : "Reserve Room"}</button>
                  </form>
                </article>
              );
            })}
          </div>
        ) : <p>No room types have been added yet.</p>}
        {message && <p role="status">{message}</p>}
        {bookingError && <p role="alert">{bookingError}</p>}
      </section>

      <section><h2>Location</h2><p>{stay.address}</p><a href={mapUrl} target="_blank" rel="noreferrer">View on Google Maps</a></section>
    </main>
  );
}
