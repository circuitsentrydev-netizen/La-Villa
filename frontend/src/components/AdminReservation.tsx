
import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

type ReservationStatus =
  | "Pending"
  | "Confirmed"
  | "Cancelled"
  | "Completed";

interface Reservation {
  id: number;
  reservation_code: string;
  guest_name: string;
  accommodation_name: string | null;
  accommodation_address: string | null;
  room_type_name: string | null;
  check_in_date: string;
  check_out_date: string;
  status: ReservationStatus;
  total_amount: number | string;
}

const STATUSES: ReservationStatus[] = [
  "Pending",
  "Confirmed",
  "Cancelled",
  "Completed",
];

export default function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const getToken = () => localStorage.getItem("lavilla_token");

  const loadReservations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please sign in as an administrator.");
      }

      const response = await fetch(`${API_BASE_URL}/reservations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load reservations.");
      }

      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data.reservations)
          ? data.reservations
          : [];

      setReservations(rows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load reservations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  const changeStatus = async (
    reservationId: number,
    status: ReservationStatus
  ) => {
    setUpdatingId(reservationId);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please sign in as an administrator.");
      }

      const response = await fetch(
        `${API_BASE_URL}/reservations/${reservationId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update reservation.");
      }

      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === reservationId
            ? { ...reservation, status }
            : reservation
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update reservation."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <p>Loading reservations...</p>;
  }

  return (
    <section className="admin-reservations">
      <div className="admin-reservations__header">
        <div>
          <h2>Reservations</h2>
          <p>View bookings and manage their status.</p>
        </div>

        <button type="button" onClick={() => void loadReservations()}>
          Refresh
        </button>
      </div>

      {error && (
        <p role="alert" className="admin-reservations__error">
          {error}
        </p>
      )}

      {reservations.length === 0 ? (
        <p>No reservations found.</p>
      ) : (
        <div className="admin-reservations__table-wrap">
          <table className="admin-reservations__table">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Guest</th>
                <th>Accommodation</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td>{reservation.reservation_code}</td>
                  <td>{reservation.guest_name}</td>
                  <td>
                    <strong>
                      {reservation.accommodation_name ?? "Unavailable"}
                    </strong>
                    <br />
                    <small>
                      {reservation.accommodation_address ?? ""}
                    </small>
                  </td>
                  <td>{reservation.room_type_name ?? "—"}</td>
                  <td>
                    {new Date(reservation.check_in_date).toLocaleDateString()}
                  </td>
                  <td>
                    {new Date(reservation.check_out_date).toLocaleDateString()}
                  </td>
                  <td>
                    {Number(reservation.total_amount).toLocaleString(
                      "en-ZA",
                      {
                        style: "currency",
                        currency: "ZAR",
                      }
                    )}
                  </td>
                  <td>
                    <select
                      value={reservation.status}
                      disabled={updatingId === reservation.id}
                      onChange={(event) =>
                        void changeStatus(
                          reservation.id,
                          event.target.value as ReservationStatus
                        )
                      }
                      aria-label={`Status for booking ${reservation.reservation_code}`}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    {updatingId === reservation.id && (
                      <small> Saving...</small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
