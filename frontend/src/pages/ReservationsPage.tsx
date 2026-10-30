
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

type ReservationStatus =
  | "Pending"
  | "Confirmed"
  | "Cancelled"
  | "Completed";

interface Reservation {
  id: number | string;
  reservation_code?: string;
  guest_name?: string;
  accommodation_name?: string;
  accommodation_address?: string;
  room_type_name?: string;
  check_in_date?: string;
  check_out_date?: string;
  status: ReservationStatus;
  total_amount?: number | string;
}

const STATUSES: ReservationStatus[] = [
  "Pending",
  "Confirmed",
  "Cancelled",
  "Completed",
];

function getToken(): string | null {
  return (
    localStorage.getItem("lavilla_token") ??
    localStorage.getItem("token")
  );
}

function formatDate(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value?: number | string): string {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) return String(value);

  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(amount);
}

async function getError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.message ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  const [filter, setFilter] = useState("All");

  const loadReservations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();

      const response = await fetch(`${API_BASE_URL}/reservations`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(await getError(response));
      }

      const data = await response.json();

      const rows: Reservation[] = Array.isArray(data)
        ? data
        : Array.isArray(data.reservations)
          ? data.reservations
          : [];

      setReservations(rows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load reservations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  async function updateStatus(
    id: string | number,
    status: ReservationStatus
  ) {
    setUpdatingId(id);
    setError("");
    setNotice("");

    try {
      const token = getToken();

      const response = await fetch(
        `${API_BASE_URL}/reservations/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error(await getError(response));
      }

      const data = await response.json();

      setReservations((current) =>
        current.map((reservation) =>
          String(reservation.id) === String(id)
            ? {
                ...reservation,
                status: data.reservation?.status ?? status,
              }
            : reservation
        )
      );

      setNotice(`Reservation status changed to ${status}.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update reservation."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const visibleReservations =
    filter === "All"
      ? reservations
      : reservations.filter((item) => item.status === filter);

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 20,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8faf9",
        padding: 32,
        fontFamily: "system-ui, sans-serif",
        color: "#17211d",
      }}
    >
      <header
        style={{
          maxWidth: 1400,
          margin: "0 auto 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p style={{ color: "#64748b", margin: "0 0 6px" }}>
            LA VILLA ADMIN
          </p>
          <h1 style={{ margin: 0, fontSize: 30 }}>Reservations</h1>
          <p style={{ color: "#64748b" }}>
            Review guest bookings and manage their status.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => void loadReservations()}
            style={buttonStyle("#fff", "#334155", "#cbd5e1")}
          >
            Refresh
          </button>

          <Link
            to="/admin/dashboard"
            style={{
              ...buttonStyle("#1b4d3e", "#fff", "#1b4d3e"),
              textDecoration: "none",
            }}
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <section style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 22,
          }}
        >
          {[
            { label: "All reservations", value: reservations.length },
            {
              label: "Pending",
              value: reservations.filter((r) => r.status === "Pending").length,
            },
            {
              label: "Confirmed",
              value: reservations.filter((r) => r.status === "Confirmed").length,
            },
            {
              label: "Completed",
              value: reservations.filter((r) => r.status === "Completed").length,
            },
          ].map((item) => (
            <div key={item.label} style={cardStyle}>
              <p style={{ color: "#64748b", margin: "0 0 8px" }}>
                {item.label}
              </p>
              <strong style={{ fontSize: 28 }}>{item.value}</strong>
            </div>
          ))}
        </div>

        <div style={{ ...cardStyle, marginBottom: 18 }}>
          <label
            htmlFor="reservation-filter"
            style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
          >
            Filter by status
          </label>

          <select
            id="reservation-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            style={selectStyle}
          >
            <option value="All">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p
            role="alert"
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              padding: 14,
              borderRadius: 8,
            }}
          >
            {error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            style={{
              background: "#ecfdf5",
              color: "#166534",
              padding: 14,
              borderRadius: 8,
            }}
          >
            {notice}
          </p>
        )}

        {loading ? (
          <div style={cardStyle}>Loading reservations…</div>
        ) : visibleReservations.length === 0 ? (
          <div style={cardStyle}>No reservations found.</div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: 1050,
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ background: "#f1f5f3", textAlign: "left" }}>
                  {[
                    "Reference",
                    "Guest",
                    "Accommodation",
                    "Room",
                    "Check-in",
                    "Check-out",
                    "Total",
                    "Status",
                    "Update",
                  ].map((heading) => (
                    <th key={heading} style={headerCellStyle}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleReservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td style={cellStyle}>
                      {reservation.reservation_code ?? `#${reservation.id}`}
                    </td>
                    <td style={cellStyle}>
                      {reservation.guest_name ?? "Guest"}
                    </td>
                    <td style={cellStyle}>
                      {reservation.accommodation_name ?? "—"}
                      {reservation.accommodation_address && (
                        <div style={{ color: "#64748b", fontSize: 12 }}>
                          {reservation.accommodation_address}
                        </div>
                      )}
                    </td>
                    <td style={cellStyle}>
                      {reservation.room_type_name ?? "—"}
                    </td>
                    <td style={cellStyle}>
                      {formatDate(reservation.check_in_date)}
                    </td>
                    <td style={cellStyle}>
                      {formatDate(reservation.check_out_date)}
                    </td>
                    <td style={cellStyle}>
                      {formatMoney(reservation.total_amount)}
                    </td>
                    <td style={cellStyle}>
                      {reservation.status}
                    </td>
                    <td style={cellStyle}>
                      <select
                        aria-label={`Update reservation ${reservation.id}`}
                        value={reservation.status}
                        disabled={updatingId === reservation.id}
                        onChange={(event) =>
                          void updateStatus(
                            reservation.id,
                            event.target.value as ReservationStatus
                          )
                        }
                        style={selectStyle}
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function buttonStyle(
  background: string,
  color: string,
  borderColor: string
): React.CSSProperties {
  return {
    padding: "10px 16px",
    borderRadius: 8,
    border: `1px solid ${borderColor}`,
    background,
    color,
    fontWeight: 600,
    cursor: "pointer",
  };
}

const selectStyle: React.CSSProperties = {
  padding: "9px 10px",
  borderRadius: 7,
  border: "1px solid #cbd5e1",
  background: "#fff",
};

const headerCellStyle: React.CSSProperties = {
  padding: "14px 12px",
  fontSize: 12,
  textTransform: "uppercase",
  color: "#475569",
  whiteSpace: "nowrap",
};

const cellStyle: React.CSSProperties = {
  padding: "14px 12px",
  borderTop: "1px solid #e2e8f0",
  fontSize: 13,
  verticalAlign: "top",
};
