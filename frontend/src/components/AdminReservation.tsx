
import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config/api";
import "./AdminReservations.css";

type ReservationStatus =
  | "Pending"
  | "Confirmed"
  | "Cancelled"
  | "Completed";

type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";

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
  payment_status?: string | null;
  total_amount: number | string;
}

const STATUSES: ReservationStatus[] = [
  "Pending",
  "Confirmed",
  "Cancelled",
  "Completed",
];

const normalizePaymentStatus = (
  status?: string | null
): PaymentStatus => {
  switch (status?.trim().toLowerCase()) {
    case "paid":
    case "success":
    case "successful":
      return "Paid";
    case "failed":
    case "failure":
      return "Failed";
    case "refunded":
      return "Refunded";
    default:
      return "Pending";
  }
};

const formatMoney = (amount: number | string) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(Number(amount) || 0);

const formatDate = (date: string) => {
  if (!date) return "—";

  const datePart = date.slice(0, 10);
  const parts = datePart.split("-");

  if (parts.length !== 3) {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? "—"
      : parsed.toLocaleDateString("en-ZA");
  }

  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  ).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");

  const getToken = () =>
    localStorage.getItem("lavilla_token") ||
    localStorage.getItem("token");

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
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Could not load reservations."
        );
      }

      const rows: Reservation[] = Array.isArray(data)
        ? data
        : Array.isArray(data.reservations)
          ? data.reservations
          : Array.isArray(data.data)
            ? data.data
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
            Accept: "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Could not update reservation."
        );
      }

      await loadReservations();
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

  const paymentCounts = useMemo(() => {
    return reservations.reduce(
      (counts, reservation) => {
        const payment = normalizePaymentStatus(
          reservation.payment_status
        );

        counts[payment] += 1;
        return counts;
      },
      {
        Paid: 0,
        Pending: 0,
        Failed: 0,
        Refunded: 0,
      } as Record<PaymentStatus, number>
    );
  }, [reservations]);

  const paidRevenue = useMemo(
    () =>
      reservations.reduce((total, reservation) => {
        if (
          normalizePaymentStatus(reservation.payment_status) === "Paid"
        ) {
          return total + (Number(reservation.total_amount) || 0);
        }

        return total;
      }, 0),
    [reservations]
  );

  const filteredReservations = useMemo(
    () =>
      reservations.filter((reservation) => {
        const payment = normalizePaymentStatus(
          reservation.payment_status
        );

        const matchesReservation =
          statusFilter === "All" ||
          reservation.status === statusFilter;

        const matchesPayment =
          paymentFilter === "All" || payment === paymentFilter;

        return matchesReservation && matchesPayment;
      }),
    [reservations, statusFilter, paymentFilter]
  );

  if (loading && reservations.length === 0) {
    return (
      <section className="admin-reservations">
        <p>Loading reservations and payments...</p>
      </section>
    );
  }

  return (
    <section className="admin-reservations">
      <div className="admin-reservations__header">
        <div>
          <p className="admin-reservations__eyebrow">
            LA VILLA ADMIN
          </p>
          <h2>Reservations &amp; Payments</h2>
          <p>
            Review bookings, monitor payment progress, and manage
            reservation status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadReservations()}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div role="alert" className="admin-reservations__error">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            Dismiss
          </button>
        </div>
      )}

      <h3 className="admin-reservations__section-title">
        Payment overview
      </h3>

      <div className="admin-reservations__payment-cards">
        <article className="admin-reservations__payment-card">
          <span>Total reservations</span>
          <strong>{reservations.length}</strong>
        </article>

        <article className="admin-reservations__payment-card payment-paid">
          <span>Paid</span>
          <strong>{paymentCounts.Paid}</strong>
        </article>

        <article className="admin-reservations__payment-card payment-pending">
          <span>Payment pending</span>
          <strong>{paymentCounts.Pending}</strong>
        </article>

        <article className="admin-reservations__payment-card payment-failed">
          <span>Payment failed</span>
          <strong>{paymentCounts.Failed}</strong>
        </article>

        <article className="admin-reservations__payment-card payment-revenue">
          <span>Successfully paid revenue</span>
          <strong>{formatMoney(paidRevenue)}</strong>
        </article>
      </div>

      <div className="admin-reservations__filters">
        <label>
          Reservation status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label>
          Payment status
          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
          >
            <option value="All">All payments</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
        </label>
      </div>

      {filteredReservations.length === 0 ? (
        <p className="admin-reservations__empty">
          No reservations match these filters.
        </p>
      ) : (
        <div className="admin-reservations__table-wrap">
          <table className="admin-reservations__table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Guest</th>
                <th>Accommodation</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Reservation</th>
                <th>Update</th>
              </tr>
            </thead>

            <tbody>
              {filteredReservations.map((reservation) => {
                const payment = normalizePaymentStatus(
                  reservation.payment_status
                );

                return (
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
                    <td>{formatDate(reservation.check_in_date)}</td>
                    <td>{formatDate(reservation.check_out_date)}</td>
                    <td>{formatMoney(reservation.total_amount)}</td>

                    <td>
                      <span
                        className={`admin-reservations__payment-status status-${payment.toLowerCase()}`}
                      >
                        {payment}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`admin-reservations__reservation-status reservation-${reservation.status.toLowerCase()}`}
                      >
                        {reservation.status}
                      </span>
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
                        <small className="admin-reservations__saving">
                          Saving...
                        </small>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="admin-reservations__note">
        Payment status is read from the backend. A reservation is counted
        as Paid only when the backend reports a successful, verified payment.
        Reservation status and payment status are tracked separately.
      </p>
    </section>
  );
}
