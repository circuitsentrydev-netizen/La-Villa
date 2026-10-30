import { useEffect, useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
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

interface ReservationResponse {
  message?: string;
  error?: string;
  reservation?: {
    id?: number | string;
    reservation_code?: string;
    status?: string;
    total_amount?: number | string;
    payment_status?: string;
  };
  payment?: {
    authorizationUrl?: string;
    authorization_url?: string;
    reference?: string;
    amount?: number | string;
    data?: {
      authorizationUrl?: string;
      authorization_url?: string;
    };
  };
  authorizationUrl?: string;
  authorization_url?: string;
  data?: {
    authorizationUrl?: string;
    authorization_url?: string;
    payment?: {
      authorizationUrl?: string;
      authorization_url?: string;
    };
  };
}

const getErrorMessage = (data: unknown, fallback: string): string => {
  if (data && typeof data === "object") {
    const value = data as Record<string, unknown>;

    if (typeof value.message === "string" && value.message) {
      return value.message;
    }

    if (typeof value.error === "string" && value.error) {
      return value.error;
    }
  }

  return fallback;
};

const getPaystackUrl = (data: ReservationResponse): string => {
  return (
    data.payment?.authorizationUrl ??
    data.payment?.authorization_url ??
    data.payment?.data?.authorizationUrl ??
    data.payment?.data?.authorization_url ??
    data.authorizationUrl ??
    data.authorization_url ??
    data.data?.authorizationUrl ??
    data.data?.authorization_url ??
    data.data?.payment?.authorizationUrl ??
    data.data?.payment?.authorization_url ??
    ""
  ).trim();
};

const isValidPaystackUrl = (value: string): boolean => {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      (url.hostname === "paystack.com" || url.hostname.endsWith(".paystack.com"))
    );
  } catch {
    return false;
  }
};

export default function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

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
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const activeToken =
    token ||
    localStorage.getItem("lavilla_token") ||
    localStorage.getItem("token");

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

  // Redirect unauthenticated visitors to login.
  useEffect(() => {
    if (!activeToken || !isAuthenticated) {
      navigate("/login", {
        replace: true,
        state: {
          from: `${location.pathname}${location.search}`,
        },
      });
    }
  }, [
    activeToken,
    isAuthenticated,
    navigate,
    location.pathname,
    location.search,
  ]);

  useEffect(() => {
    if (user?.name) {
      setGuestName(user.name);
    }
  }, [user?.name]);

  // Load published accommodations.
  useEffect(() => {
    let active = true;

    const loadAccommodations = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/accommodations?status=Published`
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            getErrorMessage(data, "Unable to load accommodations.")
          );
        }

        const records = Array.isArray(data)
          ? data
          : Array.isArray(data.accommodations)
          ? data.accommodations
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.results)
          ? data.results
          : [];

        const items: Accommodation[] = records
          .filter(
            (item: Record<string, unknown>) =>
              !item.status || String(item.status).toLowerCase() === "published"
          )
          .map((item: Record<string, unknown>) => ({
            id: String(item.id ?? ""),
            name: String(item.name ?? item.accommodation ?? "Accommodation"),
            address: String(item.address ?? item.location ?? ""),
            status: item.status ? String(item.status) : undefined,
          }))
          .filter((item: Accommodation) => Boolean(item.id));

        if (!active) return;

        setAccommodations(items);

        if (
          requestedAccommodationId &&
          items.some((item) => item.id === requestedAccommodationId)
        ) {
          setAccommodationId(requestedAccommodationId);
        } else if (requestedAccommodationId) {
          setAccommodationId("");
          setError(
            "The selected accommodation could not be found. Please choose another."
          );
        } else if (items.length === 1) {
          setAccommodationId(items[0].id);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load accommodations."
          );
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

  // Load rooms for the selected accommodation.
  useEffect(() => {
    let active = true;

    setRooms([]);
    setRoomId("");
    setGuestCount(1);

    if (!accommodationId) {
      setRoomsLoading(false);
      return;
    }

    const loadRooms = async () => {
      setRoomsLoading(true);
      setError("");
      setMessage("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/accommodations/${encodeURIComponent(
            accommodationId
          )}/rooms`
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            getErrorMessage(data, "Unable to load room types.")
          );
        }

        const records = Array.isArray(data)
          ? data
          : Array.isArray(data.rooms)
          ? data.rooms
          : Array.isArray(data.data)
          ? data.data
          : [];

        const loadedRooms: Room[] = records.map(
          (item: Record<string, unknown>) => ({
            id: item.id ?? "",
            room_type_name: String(item.room_type_name ?? "Standard Room"),
            total_capacity: Number(item.total_capacity ?? 1),
            nightly_rate: Number(item.nightly_rate ?? 0),
          })
        );

        if (!active) return;

        setRooms(loadedRooms);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load room options."
          );
        }
      } finally {
        if (active) setRoomsLoading(false);
      }
    };

    void loadRooms();

    return () => {
      active = false;
    };
  }, [accommodationId]);

  // Handle Form Submission and API Integration
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          accommodation_id: accommodationId,
          room_inventory_id: roomId,
          guest_name: guestName.trim(),
          guest_count: guestCount,
          check_in_date: checkIn,
          check_out_date: checkOut,
        }),
      });

      const data: ReservationResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Reservation setup failed.")
        );
      }

      const checkoutUrl = getPaystackUrl(data);

      if (checkoutUrl && isValidPaystackUrl(checkoutUrl)) {
        window.location.href = checkoutUrl;
      } else {
        navigate("/payment-result", {
          state: { reservation: data.reservation },
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected payment error occurred."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formGroupStyle: CSSProperties = {
    marginBottom: "20px",
  };
  const labelStyle: CSSProperties = {
    display: "block",
    marginBottom: "6px",
    fontWeight: "500",
    color: "#333",
  };
  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "15px",
    boxSizing: "border-box",
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Loading properties configurations...
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "550px",
        margin: "40px auto",
        padding: "25px",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "20px", color: "#1B4D3E" }}>
        Book Your Accommodation
      </h2>

      {error && (
        <div
          style={{
            padding: "12px",
            background: "#fef2f2",
            color: "#991b1b",
            borderRadius: "6px",
            marginBottom: "20px",
            fontSize: "14px",
            border: "1px solid #fca5a5",
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          style={{
            padding: "12px",
            background: "#f0fdf4",
            color: "#166534",
            borderRadius: "6px",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Select Property</label>
          <select
            style={inputStyle}
            value={accommodationId}
            onChange={(e) => setAccommodationId(e.target.value)}
          >
            <option value="">-- Select Property --</option>
            {accommodations.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.address})
              </option>
            ))}
          </select>
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Room Configuration</label>
          <select
            style={inputStyle}
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={roomsLoading || !accommodationId}
          >
            <option value="">
              {roomsLoading ? "Fetching variations..." : "-- Select Room Option --"}
            </option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.room_type_name} (Max: {room.total_capacity} guests) — {room.nightly_rate}/night
              </option>
            ))}
          </select>
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Primary Guest Name</label>
          <input
            type="text"
            style={inputStyle}
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Enter full legal name"
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Number of Guests</label>
          <input
            type="number"
            min={1}
            max={selectedRoom ? selectedRoom.total_capacity : 10}
            style={inputStyle}
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
          />
        </div>

        <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Check-In</label>
            <input
              type="date"
              min={minDate}
              style={inputStyle}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Check-Out</label>
            <input
              type="date"
              min={checkIn || minDate}
              style={inputStyle}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        </div>

        {nights > 0 && total > 0 && (
          <div
            style={{
              padding: "15px",
              background: "#f8fafc",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              marginBottom: "25px",
              fontSize: "15px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span style={{ color: "#64748b" }}>Duration:</span>
              <strong style={{ marginLeft: "auto" }}>{nights} Nights</strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "17px",
                paddingTop: "5px",
                marginTop: "5px",
                borderTop: "1px dashed #cbd5e1",
              }}
            >
              <span style={{ color: "#1b4d3e", fontWeight: "600" }}>Total Due:</span>
              <strong style={{ marginLeft: "auto", color: "#1B4D3E" }}>
                {total.toLocaleString()}
              </strong>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={
            submitting ||
            roomsLoading ||
            !selectedRoom ||
            !guestName.trim() ||
            !checkIn ||
            !checkOut ||
            checkOut <= checkIn
          }
          style={{
            width: "100%",
            padding: "14px 22px",
            border: 0,
            borderRadius: 6,
            background: submitting ? "#6b8b80" : "#1B4D3E",
            color: "#fff",
            cursor: submitting ? "wait" : "pointer",
            fontWeight: 600,
            fontSize: "16px",
            transition: "background 0.2s ease",
          }}
        >
          {submitting ? "Preparing secure payment..." : "Reserve & Pay Now"}
        </button>
      </form>
    </div>
  );
}