
import { useEffect, useState } from "react";
import {Link,useLocation,useNavigate,useSearchParams,} from "react-router-dom";
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
  };
  authorizationUrl?: string;
  authorization_url?: string;
}

export default function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user, token, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const requestedAccommodationId =
    searchParams.get("accommodationId") ?? "";

  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [accommodationId, setAccommodationId] = useState(
    requestedAccommodationId
  );
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
  const minDate = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const selectedRoom = rooms.find(
    (room) => String(room.id) === roomId
  );

  const nights =
    checkIn && checkOut && checkOut > checkIn
      ? Math.round(
          (Date.parse(`${checkOut}T00:00:00Z`) -
            Date.parse(`${checkIn}T00:00:00Z`)) /
            86400000
        )
      : 0;

  const total = selectedRoom
    ? selectedRoom.nightly_rate * nights
    : 0;

  // Preserve the intended booking URL when a visitor needs to sign in.
  useEffect(() => {
    const activeToken =
      token ||
      localStorage.getItem("lavilla_token") ||
      localStorage.getItem("token");

    if (!isAuthenticated || !activeToken) {
      const intendedPath = `${location.pathname}${location.search}`;

      navigate("/login", {
        replace: true,
        state: { from: intendedPath },
      });
    }
  }, [
    isAuthenticated,
    token,
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
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/accommodations?status=Published`
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.error ??
              data.message ??
              "Unable to load accommodations."
          );
        }

        const records = Array.isArray(data.accommodations)
          ? data.accommodations
          : Array.isArray(data)
            ? data
            : Array.isArray(data.data)
              ? data.data
              : Array.isArray(data.results)
                ? data.results
                : [];

        const items: Accommodation[] = records
          .filter(
            (item: Record<string, unknown>) =>
              !item.status ||
              String(item.status).toLowerCase() === "published"
          )
          .map((item: Record<string, unknown>) => ({
            id: String(item.id ?? ""),
            name: String(
              item.name ?? item.accommodation ?? "Accommodation"
            ),
            address: String(item.address ?? item.location ?? ""),
            status: item.status
              ? String(item.status)
              : undefined,
          }))
          .filter((item: Accommodation) => item.id !== "");

        if (!active) return;

        setAccommodations(items);

        if (
          requestedAccommodationId &&
          items.some(
            (item) => item.id === requestedAccommodationId
          )
        ) {
          setAccommodationId(requestedAccommodationId);
        } else if (requestedAccommodationId) {
          setAccommodationId("");
          setError(
            "The selected accommodation could not be found. Please choose another."
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load accommodations."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadAccommodations();

    return () => {
      active = false;
    };
  }, [requestedAccommodationId]);

  // Load room types for the selected accommodation.
  useEffect(() => {
    let active = true;

    setRooms([]);
    setRoomId("");
    setGuestCount(1);
    setError("");
    setMessage("");

    if (!accommodationId) {
      setRoomsLoading(false);
      return;
    }

    setRoomsLoading(true);

    fetch(
      `${API_BASE_URL}/accommodations/${encodeURIComponent(
        accommodationId
      )}/rooms`
    )
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.error ??
              data.message ??
              "Unable to load room types."
          );
        }

        return data;
      })
      .then((data) => {
        if (!active) return;

        const records = Array.isArray(data.rooms)
          ? data.rooms
          : [];

        setRooms(
          records.map((room: Record<string, unknown>) => ({
            id: String(room.id),
            room_type_name: String(
              room.room_type_name ??
                room.roomTypeName ??
                "Room"
            ),
            total_capacity: Number(
              room.total_capacity ??
                room.totalCapacity ??
                1
            ),
            nightly_rate: Number(
              room.nightly_rate ??
                room.nightlyRate ??
                0
            ),
          }))
        );
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load room types."
          );
        }
      })
      .finally(() => {
        if (active) {
          setRoomsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accommodationId]);

  // Create the reservation and redirect to Paystack checkout.
  const submitReservation = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const activeToken =
      token ||
      localStorage.getItem("lavilla_token") ||
      localStorage.getItem("token");

    if (!activeToken || !isAuthenticated) {
      const intendedPath = `${location.pathname}${location.search}`;

      navigate("/login", {
        state: { from: intendedPath },
      });

      return;
    }

    if (!selectedRoom || !accommodationId) {
      setError("Please select an accommodation and room type.");
      return;
    }

    if (
      !guestName.trim() ||
      guestName.trim().length > 120
    ) {
      setError("Enter a guest name of up to 120 characters.");
      return;
    }

    if (
      !Number.isInteger(guestCount) ||
      guestCount < 1 ||
      guestCount > selectedRoom.total_capacity
    ) {
      setError(
        `This room accommodates up to ${selectedRoom.total_capacity} guests.`
      );
      return;
    }

    if (
      !checkIn ||
      checkIn < minDate ||
      !checkOut ||
      checkOut <= checkIn
    ) {
      setError("Choose valid check-in and check-out dates.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/reservations`,
        {
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
        }
      );

      const data =
        (await response
          .json()
          .catch(() => ({}))) as ReservationResponse;

      if (!response.ok) {
        throw new Error(
          data.message ??
            data.error ??
            "Reservation could not be submitted."
        );
      }

      // Support the common response shapes used by the backend.
      const authorizationUrl =
        data.payment?.authorizationUrl ??
        data.payment?.authorization_url ??
        data.authorizationUrl ??
        data.authorization_url;

      if (!authorizationUrl) {
        throw new Error(
          "Your reservation was received, but the payment checkout link was not returned. Please contact support before submitting again."
        );
      }

      // Only redirect to a secure Paystack checkout URL.
      let checkoutUrl: URL;

      try {
        checkoutUrl = new URL(authorizationUrl);
      } catch {
        throw new Error(
          "The payment checkout link returned by the server is invalid."
        );
      }

      if (
        checkoutUrl.protocol !== "https:" ||
        !(
          checkoutUrl.hostname === "paystack.com" ||
          checkoutUrl.hostname.endsWith(".paystack.com")
        )
      ) {
        throw new Error(
          "The payment checkout link is not a valid secure Paystack URL."
        );
      }

      // Leave the booking page and open the hosted payment checkout.
      window.location.assign(checkoutUrl.toString());
      return;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start your payment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (
    !isAuthenticated ||
    !(
      token ||
      localStorage.getItem("lavilla_token") ||
      localStorage.getItem("token")
    )
  ) {
    return (
      <main
        style={{
          maxWidth: 760,
          margin: "40px auto",
          padding: 24,
        }}
      >
        Redirecting to sign in...
      </main>
    );
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
    <main
      style={{
        maxWidth: 760,
        margin: "40px auto",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <Link to="/discover">
        ← Browse accommodations
      </Link>

      <h1>Make a Reservation</h1>

      <p>
        Select your preferred accommodation and complete your
        booking details.
      </p>

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

                setSearchParams(
                  nextId
                    ? { accommodationId: nextId }
                    : {}
                );

                setError("");
                setMessage("");
              }}
              style={fieldStyle}
            >
              <option value="">
                Select an accommodation
              </option>

              {accommodations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.address
                    ? ` — ${item.address}`
                    : ""}
                </option>
              ))}
            </select>
          </label>

          {accommodationId && (
            <p>
              <Link
                to={`/accommodations/${encodeURIComponent(
                  accommodationId
                )}`}
              >
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
                setMessage("");
              }}
              disabled={
                !accommodationId ||
                roomsLoading ||
                rooms.length === 0
              }
              style={fieldStyle}
            >
              <option value="">
                {roomsLoading
                  ? "Loading room types..."
                  : "Select a room type"}
              </option>

              {rooms.map((room) => (
                <option
                  key={room.id}
                  value={String(room.id)}
                >
                  {room.room_type_name} — R
                  {Number(room.nightly_rate).toFixed(2)} per night
                </option>
              ))}
            </select>
          </label>

          {accommodationId &&
            !roomsLoading &&
            rooms.length === 0 && (
              <p>
                No room types are currently configured for
                this accommodation.
              </p>
            )}

          <label>
            Guest name

            <input
              required
              maxLength={120}
              value={guestName}
              onChange={(event) =>
                setGuestName(event.target.value)
              }
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
              onChange={(event) =>
                setGuestCount(Number(event.target.value))
              }
              style={fieldStyle}
            />
          </label>

          {selectedRoom && (
            <p>
              Maximum capacity: {selectedRoom.total_capacity}{" "}
              guests.
            </p>
          )}

          <label>
            Check-in

            <input
              required
              type="date"
              min={minDate}
              value={checkIn}
              onChange={(event) => {
                setCheckIn(event.target.value);

                if (
                  checkOut &&
                  event.target.value &&
                  checkOut <= event.target.value
                ) {
                  setCheckOut("");
                }

                setError("");
                setMessage("");
              }}
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
              onChange={(event) => {
                setCheckOut(event.target.value);
                setError("");
                setMessage("");
              }}
              style={fieldStyle}
            />
          </label>

          {nights > 0 && selectedRoom && (
            <section
              style={{
                margin: "20px 0",
                padding: 18,
                background: "#FAF9F6",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
              }}
            >
              <p>Number of nights: {nights}</p>

              <p>
                Nightly rate: R
                {selectedRoom.nightly_rate.toFixed(2)}
              </p>

              <h3>
                Estimated total: R{total.toFixed(2)}
              </h3>

              <p>
                The final amount is calculated by the server.
                You will be redirected to Paystack to pay the
                full reservation amount before your booking is
                confirmed.
              </p>
            </section>
          )}

          {error && (
            <p
              role="alert"
              style={{
                color: "#b91c1c",
                marginBottom: 16,
              }}
            >
              {error}
            </p>
          )}

          {message && (
            <p
              role="status"
              style={{
                color: "#166534",
                marginBottom: 16,
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={
              submitting ||
              loading ||
              roomsLoading ||
              !selectedRoom ||
              !guestName.trim() ||
              !checkIn ||
              !checkOut ||
              checkOut <= checkIn
            }
            style={{
              padding: "12px 22px",
              border: 0,
              borderRadius: 6,
              background:
                submitting ? "#6b8b80" : "#1B4D3E",
              color: "#fff",
              cursor: submitting
                ? "wait"
                : "pointer",
              fontWeight: 600,
            }}
          >
            {submitting
              ? "Preparing secure payment..."
              : "Reserve & Pay Now"}
          </button>
        </form>
      )}
    </main>
  );
}
