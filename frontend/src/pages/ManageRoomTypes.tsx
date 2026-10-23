
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

interface Accommodation {
  id: string | number;
  name?: string;
  accommodation?: string;
  address?: string;
}

interface RoomType {
  id: string | number;
  room_type_name: string;
  total_capacity: number;
  nightly_rate: number;
  total_rooms?: number;
}

function getToken(): string {
  return (
    localStorage.getItem("lavilla_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

async function getError(response: Response): Promise<string> {
  const data = await response.json().catch(() => ({}));
  return data.message || data.error || "The request could not be completed.";
}

export default function ManageRoomTypes() {
  const { accommodationId } = useParams();

  const [accommodation, setAccommodation] = useState<Accommodation | null>(
    null
  );
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [roomTypeName, setRoomTypeName] = useState("");
  const [totalCapacity, setTotalCapacity] = useState("2");
  const [nightlyRate, setNightlyRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    if (!accommodationId) {
      setError("No accommodation was selected.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [accommodationResponse, roomsResponse] = await Promise.all([
        fetch(
          `${API_BASE_URL}/accommodations/${encodeURIComponent(
            accommodationId
          )}`
        ),
        fetch(
          `${API_BASE_URL}/accommodations/${encodeURIComponent(
            accommodationId
          )}/rooms`
        ),
      ]);

      if (!accommodationResponse.ok) {
        throw new Error("Unable to load this accommodation.");
      }

      if (!roomsResponse.ok) {
        throw new Error("Unable to load existing room types.");
      }

      const accommodationData = await accommodationResponse.json();
      const roomsData = await roomsResponse.json();

      setAccommodation(
        accommodationData.accommodation ?? accommodationData
      );
      setRooms(Array.isArray(roomsData.rooms) ? roomsData.rooms : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load room types."
      );
    } finally {
      setLoading(false);
    }
  }, [accommodationId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function addRoomType(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const name = roomTypeName.trim();
    const capacity = Number(totalCapacity);
    const rate = Number(nightlyRate);
    const token = getToken();

    if (!token) {
      setError("Please log in as an administrator to add room types.");
      return;
    }

    if (!accommodationId || !name) {
      setError("Enter a room type name.");
      return;
    }

    if (!Number.isInteger(capacity) || capacity < 1) {
      setError("Guest capacity must be a whole number of at least 1.");
      return;
    }

    if (!Number.isFinite(rate) || rate <= 0) {
      setError("Enter a valid nightly rate greater than zero.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/accommodations/${encodeURIComponent(
          accommodationId
        )}/rooms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            roomTypeName: name,
            totalCapacity: capacity,
            nightlyRate: rate,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await getError(response));
      }

      setRoomTypeName("");
      setTotalCapacity("2");
      setNightlyRate("");
      setNotice("Room type added successfully.");

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to add the room type."
      );
    } finally {
      setSaving(false);
    }
  }

  const propertyName =
    accommodation?.name ??
    accommodation?.accommodation ??
    "Accommodation";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8faf9",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        color: "#17211d",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Link
          to="/admin/dashboard"
          style={{ color: "#1b4d3e", textDecoration: "none" }}
        >
          ← Back to dashboard
        </Link>

        <header style={{ margin: "24px 0" }}>
          <p style={{ color: "#64748b", marginBottom: 6 }}>
            LA VILLA ADMIN
          </p>
          <h1 style={{ margin: "0 0 8px" }}>Manage Room Types</h1>
          <h2 style={{ fontSize: 20, fontWeight: 500 }}>{propertyName}</h2>
          {accommodation?.address && (
            <p style={{ color: "#64748b" }}>{accommodation.address}</p>
          )}
        </header>

        {error && (
          <p
            role="alert"
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              padding: 12,
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
              padding: 12,
              borderRadius: 8,
            }}
          >
            {notice}
          </p>
        )}

        <section
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Add a room type</h2>
          <p style={{ color: "#64748b" }}>
            Guest capacity is the maximum number of guests this room type
            accommodates. It is not the number of rooms available.
          </p>

          <form
            onSubmit={addRoomType}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            <label>
              Room type name
              <input
                required
                maxLength={100}
                value={roomTypeName}
                onChange={(event) => setRoomTypeName(event.target.value)}
                placeholder="e.g. Deluxe Double Room"
                style={inputStyle}
              />
            </label>

            <label>
              Maximum guests
              <input
                required
                type="number"
                min={1}
                step={1}
                value={totalCapacity}
                onChange={(event) => setTotalCapacity(event.target.value)}
                style={inputStyle}
              />
            </label>

            <label>
              Nightly rate (R)
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={nightlyRate}
                onChange={(event) => setNightlyRate(event.target.value)}
                placeholder="e.g. 950.00"
                style={inputStyle}
              />
            </label>

            <div style={{ alignSelf: "end" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  ...buttonStyle,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Adding..." : "Add Room Type"}
              </button>
            </div>
          </form>
        </section>

        <section
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Existing room types</h2>

          {loading ? (
            <p>Loading room types...</p>
          ) : rooms.length === 0 ? (
            <p>No room types have been added for this accommodation yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 500,
                }}
              >
                <thead>
                  <tr style={{ textAlign: "left", background: "#f1f5f3" }}>
                    <th style={cellStyle}>Room type</th>
                    <th style={cellStyle}>Maximum guests</th>
                    <th style={cellStyle}>Nightly rate</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id}>
                      <td style={cellStyle}>{room.room_type_name}</td>
                      <td style={cellStyle}>
                        {room.total_capacity} guests
                      </td>
                      <td style={cellStyle}>
                        R {Number(room.nightly_rate).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  boxSizing: "border-box",
  width: "100%",
  marginTop: 8,
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 7,
  font: "inherit",
};

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  background: "#1b4d3e",
  color: "#fff",
  border: 0,
  borderRadius: 7,
  fontWeight: 600,
  cursor: "pointer",
};

const cellStyle: React.CSSProperties = {
  padding: 12,
  borderBottom: "1px solid #e2e8f0",
};
