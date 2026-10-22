import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

interface Accommodation {
  id: string;
  name: string;
  address: string;
  price_per_night?: number;
  pricePerNight?: number;
}

interface Room {
  id: number;
  room_type_name: string;
  total_capacity: number;
  nightly_rate: number;
}

export default function BookingPage() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [accommodationId, setAccommodationId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const selectedRoom = rooms.find((room) => String(room.id) === roomId);

  const nights =
    checkIn && checkOut && checkOut > checkIn
      ? Math.round(
          (Date.parse(`${checkOut}T00:00:00Z`) -
            Date.parse(`${checkIn}T00:00:00Z`)) /
            86400000
        )
      : 0;

  const total = selectedRoom ? selectedRoom.nightly_rate * nights : 0;

  useEffect(() => {
    let active = true;

    fetch(`${API_BASE_URL}/accommodations?status=Published`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load accommodations.");
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const items = data.accommodations ?? [];
        setAccommodations(
          items.filter(
            (item: Accommodation & { status?: string }) =>
              !item.status || item.status === "Published"
          )
        );
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    setRooms([]);
    setRoomId("");
    setGuestCount(1);

    if (!accommodationId) return;

    fetch(
      `${API_BASE_URL}/accommodations/${encodeURIComponent(
        accommodationId
      )}/rooms`
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load room types.");
        return response.json();
      })
      .then((data) => {
        if (active) setRooms(data.rooms ?? []);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
    };
  }, [accommodationId]);

  const submitReservation = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selectedRoom || !accommodationId) {
      setError("Please select an accommodation and room type.");
      return;
    }

    if (guestCount > selectedRoom.total_capacity) {
      setError(`This room accommodates up to ${selectedRoom.total_capacity} guests.`);
      return;
    }

    if (checkIn < minDate || checkOut <= checkIn) {
      setError("Choose valid check-in and check-out dates.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: guestName.trim(),
          accommodation_id: accommodationId,
          room_inventory_id: selectedRoom.id,
          guest_count: guestCount,
          check_in_date: checkIn,
          check_out_date: checkOut,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ?? data.error ?? "Reservation could not be submitted."
        );
      }

      setMessage(
        `Reservation submitted successfully! Reference: ${
          data.reservation?.reservation_code ?? "pending confirmation"
        }.`
      );
      setGuestName("");
      setGuestCount(1);
      setCheckIn("");
      setCheckOut("");
      setRoomId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reservation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: 24 }}>
      <Link to="/discover">← Browse accommodations</Link>
      <h1>Make a Reservation</h1>
      <p>Select your preferred accommodation and complete your booking details.</p>

      {loading ? (
        <p>Loading accommodations...</p>
      ) : (
        <form onSubmit={submitReservation}>
          <label>
            Accommodation
            <select
              required
              value={accommodationId}
              onChange={(event) => {
                setAccommodationId(event.target.value);
                setError("");
                setMessage("");
              }}
              style={{ display: "block", width: "100%", padding: 12, margin: "8px 0 18px" }}
            >
              <option value="">Select an accommodation</option>
              {accommodations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.address}
                </option>
              ))}
            </select>
          </label>

          {accommodationId && (
            <p>
              <Link to={`/accommodations/${accommodationId}`}>
                View accommodation details
              </Link>
            </p>
          )}

          <label>
            Room type
            <select
              required
              value={roomId}
              onChange={(event) => {
                setRoomId(event.target.value);
                setGuestCount(1);
                setError("");
              }}
              disabled={!accommodationId || rooms.length === 0}
              style={{ display: "block", width: "100%", padding: 12, margin: "8px 0 18px" }}
            >
              <option value="">Select a room type</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.room_type_name} — R{Number(room.nightly_rate).toFixed(2)} per night
                </option>
              ))}
            </select>
          </label>

          {accommodationId && rooms.length === 0 && (
            <p>No room types are currently available for this accommodation.</p>
          )}

          <label>
            Guest name
            <input
              required
              maxLength={120}
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              style={{ display: "block", width: "100%", padding: 12, margin: "8px 0 18px" }}
            />
          </label>

          <label>
            Number of guests
            <input
              required
              type="number"
              min={1}
              max={selectedRoom?.total_capacity ?? 1}
              value={guestCount}
              disabled={!selectedRoom}
              onChange={(event) => setGuestCount(Number(event.target.value))}
              style={{ display: "block", width: "100%", padding: 12, margin: "8px 0 18px" }}
            />
          </label>

          {selectedRoom && (
            <p>Maximum capacity: {selectedRoom.total_capacity} guests.</p>
          )}

          <label>
            Check-in
            <input
              required
              type="date"
              min={minDate}
              value={checkIn}
              onChange={(event) => setCheckIn(event.target.value)}
              style={{ display: "block", width: "100%", padding: 12, margin: "8px 0 18px" }}
            />
          </label>

          <label>
            Check-out
            <input
              required
              type="date"
              min={checkIn || minDate}
              value={checkOut}
              onChange={(event) => setCheckOut(event.target.value)}
              style={{ display: "block", width: "100%", padding: 12, margin: "8px 0 18px" }}
            />
          </label>

          {nights > 0 && selectedRoom && (
            <section>
              <p>Number of nights: {nights}</p>
              <h3>Estimated total: R{total.toFixed(2)}</h3>
              <p>The final amount is calculated by the server.</p>
            </section>
          )}

          {error && <p role="alert">{error}</p>}
          {message && <p role="status">{message}</p>}

          <button
            type="submit"
            disabled={submitting || !selectedRoom || !guestName.trim()}
            style={{ padding: "12px 22px", cursor: "pointer" }}
          >
            {submitting ? "Submitting..." : "Submit Reservation"}
          </button>
        </form>
      )}
    </main>
  );
}