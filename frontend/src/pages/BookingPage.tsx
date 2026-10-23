
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { type RootState } from "../app/store";
import { API_BASE_URL } from "../config/api";

interface Accommodation {
  id: string;
  name: string;
  address: string;
  status?: string;
}

interface Room {
  id: number | string;
  room_type_name: string;
  total_capacity: number;
  nightly_rate: number;
}

export default function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, token, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const requestedAccommodationId = searchParams.get("accommodationId") ?? "";

  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [accommodationId, setAccommodationId] = useState(requestedAccommodationId);
  const [roomId, setRoomId] = useState("");
  const [guestName, setGuestName] = useState(user?.name ?? "");
  const [guestCount, setGuestCount] = useState(1);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

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

  // Preserve the intended booking URL while redirecting visitors to login.
  useEffect(() => {
    if (!isAuthenticated || !(token || localStorage.getItem("lavilla_token") || localStorage.getItem("token"))) {
      const intendedPath = `${location.pathname}${location.search}`;
      navigate("/login", {
        replace: true,
        state: { from: intendedPath },
      });
    }
  }, [isAuthenticated, token, navigate, location.pathname, location.search]);

  useEffect(() => {
    if (user?.name) setGuestName(user.name);
  }, [user?.name]);

  useEffect(() => {
    let active = true;

    const loadAccommodations = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/accommodations?status=Published`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? data.message ?? "Unable to load accommodations.");
        }

        const records = Array.isArray(data.accommodations)
          ? data.accommodations
          : Array.isArray(data)
            ? data
            : [];

        const items: Accommodation[] = records.map(
          (item: Record<string, unknown>) => ({
            id: String(item.id),
            name: String(item.name ?? item.accommodation ?? "Accommodation"),
            address: String(item.address ?? item.location ?? ""),
            status: item.status ? String(item.status) : undefined,
          })
        );

        if (active) {
          setAccommodations(items);

          if (requestedAccommodationId && items.some((item) => item.id === requestedAccommodationId)) {
            setAccommodationId(requestedAccommodationId);
          } else if (requestedAccommodationId) {
            setError("The selected accommodation could not be found. Please choose another.");
            setAccommodationId("");
          }
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load accommodations.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadAccommodations();

    return () => {
      active = false;
    };
  }, [requestedAccommodationId]);

  useEffect(() => {
    let active = true;

    setRooms([]);
    setRoomId("");
    setGuestCount(1);
    setError("");

    if (!accommodationId) {
      setRoomsLoading(false);
      return;
    }

    setRoomsLoading(true);

    fetch(`${API_BASE_URL}/accommodations/${encodeURIComponent(accommodationId)}/rooms`)
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? data.message ?? "Unable to load room types.");
        }

        return data;
      })
      .then((data) => {
        if (!active) return;

        const records = Array.isArray(data.rooms) ? data.rooms : [];

        setRooms(
          records.map((room: Record<string, unknown>) => ({
            id: String(room.id),
            room_type_name: String(room.room_type_name ?? room.roomTypeName ?? "Room"),
            total_capacity: Number(room.total_capacity ?? room.totalCapacity ?? 1),
            nightly_rate: Number(room.nightly_rate ?? room.nightlyRate ?? 0),
          }))
        );
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load room types.");
      })
      .finally(() => {
        if (active) setRoomsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accommodationId]);

  const submitReservation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const activeToken =
      token || localStorage.getItem("lavilla_token") || localStorage.getItem("token");

    if (!activeToken || !isAuthenticated) {
      const intendedPath = `${location.pathname}${location.search}`;
      navigate("/login", { state: { from: intendedPath } });
      return;
    }

    if (!selectedRoom || !accommodationId) {
      setError("Please select an accommodation and room type.");
      return;
    }

    if (!guestName.trim() || guestName.trim().length > 120) {
      setError("Enter a guest name of up to 120 characters.");
      return;
    }

    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > selectedRoom.total_capacity) {
      setError(`This room accommodates up to ${selectedRoom.total_capacity} guests.`);
      return;
    }

    if (checkIn < minDate || !checkOut || checkOut <= checkIn) {
      setError("Choose valid check-in and check-out dates.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          guest_name: guestName.trim(),
          accommodation_id: accommodationId,
          room_inventory_id: selectedRoom.id,
          guest_count: guestCount,
          check_in_date: checkIn,
          check_out_date: checkOut,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message ?? data.error ?? "Reservation could not be submitted.");
      }

      setMessage(
        `Reservation submitted successfully! Reference: ${
          data.reservation?.reservation_code ?? "pending confirmation"
        }. Your booking is pending confirmation.`
      );

      setRoomId("");
      setGuestCount(1);
      setCheckIn("");
      setCheckOut("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reservation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated || !(token || localStorage.getItem("lavilla_token") || localStorage.getItem("token"))) {
    return <main style={{ maxWidth: 760, margin: "40px auto", padding: 24 }}>Redirecting to sign in...</main>;
  }

  const fieldStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: 12,
    margin: "8px 0 18px",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    boxSizing: "border-box",
  };

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
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
                const nextId = event.target.value;
                setAccommodationId(nextId);
                setSearchParams(nextId ? { accommodationId: nextId } : {});
                setError("");
                setMessage("");
              }}
              style={fieldStyle}
            >
              <option value="">Select an accommodation</option>
              {accommodations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}{item.address ? ` — ${item.address}` : ""}
                </option>
              ))}
            </select>
          </label>

          {accommodationId && (
            <p>
              <Link to={`/accommodations/${encodeURIComponent(accommodationId)}`}>
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
              disabled={!accommodationId || roomsLoading || rooms.length === 0}
              style={fieldStyle}
            >
              <option value="">
                {roomsLoading ? "Loading room types..." : "Select a room type"}
              </option>
              {rooms.map((room) => (
                <option key={room.id} value={String(room.id)}>
                  {room.room_type_name} — R{Number(room.nightly_rate).toFixed(2)} per night
                </option>
              ))}
            </select>
          </label>

          {accommodationId && !roomsLoading && rooms.length === 0 && (
            <p>No room types are currently configured for this accommodation.</p>
          )}

          <label>
            Guest name
            <input
              required
              maxLength={120}
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              style={fieldStyle}
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
              style={fieldStyle}
            />
          </label>

          {selectedRoom && <p>Maximum capacity: {selectedRoom.total_capacity} guests.</p>}

          <label>
            Check-in
            <input
              required
              type="date"
              min={minDate}
              value={checkIn}
              onChange={(event) => setCheckIn(event.target.value)}
              style={fieldStyle}
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
              style={fieldStyle}
            />
          </label>

          {nights > 0 && selectedRoom && (
            <section>
              <p>Number of nights: {nights}</p>
              <h3>Estimated total: R{total.toFixed(2)}</h3>
              <p>The final amount is calculated by the server.</p>
            </section>
          )}

          {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
          {message && <p role="status" style={{ color: "#166534" }}>{message}</p>}

          <button
            type="submit"
            disabled={submitting || !selectedRoom || !guestName.trim()}
            style={{
              padding: "12px 22px",
              border: 0,
              borderRadius: 6,
              background: "#1B4D3E",
              color: "#fff",
              cursor: submitting ? "wait" : "pointer",
              fontWeight: 600,
            }}
          >
            {submitting ? "Submitting..." : "Submit Reservation"}
          </button>
        </form>
      )}
    </main>
  );
}
