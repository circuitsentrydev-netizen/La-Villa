import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { logout } from "../features/auth/authSlice";
import type { RootState } from "../app/store";
import "./AdminDashboard.css";

interface Accommodation {
  id: string;
  name: string;
  address: string;
  price_per_night: string | number;
  star_rating: number;
  status: string;
}

const token = () =>
  localStorage.getItem("lavilla_token") || localStorage.getItem("token");

const money = (price: string | number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth?.user);
  const [tab, setTab] = useState<"overview" | "accommodations">("overview");
  const [hotels, setHotels] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/accommodations`, {
        headers: token() ? { Authorization: `Bearer ${token()}` } : {},
      });
      if (!response.ok) throw new Error("Failed to load accommodations.");
      const data = await response.json();
      setHotels(Array.isArray(data) ? data : data?.data?.accommodations || data?.accommodations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHotels();
  }, [fetchHotels]);

  const deleteHotel = async (hotel: Accommodation) => {
    if (!window.confirm(`Delete "${hotel.name}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/accommodations/${hotel.id}`, {
        method: "DELETE",
        headers: token() ? { Authorization: `Bearer ${token()}` } : {},
      });
      if (!response.ok) throw new Error("Failed to delete accommodation.");
      await fetchHotels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete listing.");
    }
  };

  const signOut = () => {
    localStorage.removeItem("lavilla_token");
    localStorage.removeItem("token");
    dispatch(logout());
    navigate("/admin/login");
  };

  const published = hotels.filter(
    (hotel) => hotel.status?.toLowerCase() === "published"
  );

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">LV</span>
          <span className="admin-brand-copy"><strong>La Villa</strong><small>ADMINISTRATION</small></span>
        </div>

        <div className="admin-nav-label">WORKSPACE</div>
        <nav className="admin-nav">
          <button className={`admin-nav-item ${tab === "overview" ? "is-active" : ""}`} onClick={() => setTab("overview")}>⌂ Overview</button>
          <button className={`admin-nav-item ${tab === "accommodations" ? "is-active" : ""}`} onClick={() => setTab("accommodations")}>▤ Accommodations Inventory <span className="admin-nav-count">{hotels.length}</span></button>
          <button className="admin-nav-item" onClick={() => navigate("/admin/reservations")}>▣ Manage Reservations</button>
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-user-card">
            <span className="admin-avatar">{String(user && "name" in user ? user.name || "A" : "A").charAt(0).toUpperCase()}</span>
            <span className="admin-user-copy"><strong>{user && "name" in user ? String(user.name || "Administrator") : "Administrator"}</strong><small>Administrator</small></span>
          </div>
          <button className="admin-signout" onClick={signOut}>↪ Sign out</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">La Villa <span>/</span> <strong>{tab === "overview" ? "Overview" : "Accommodations Inventory"}</strong></div>
          <div className="admin-topbar-right"><span className="admin-status-dot" /> Admin workspace</div>
        </header>

        <div className="admin-content">
          <section className="admin-page-heading">
            <div>
              <p className="admin-eyebrow">PROPERTY MANAGEMENT</p>
              <h1>{tab === "overview" ? "Operational Snapshot" : "Accommodations Inventory"}</h1>
              <p className="admin-subtitle">{tab === "overview" ? "Manage your properties and monitor your listings." : "Edit, review, and manage the accommodations you uploaded."}</p>
            </div>
            <button className="admin-primary-button" onClick={() => navigate("/admin/accommodations/new")}>＋ Add accommodation</button>
          </section>

          {error && <div className="admin-alert" role="alert">{error}<button onClick={() => setError("")}>×</button></div>}

          {tab === "overview" && (
            <section className="admin-stats-grid">
              {[["Total accommodations", hotels.length], ["Published listings", published.length], ["Other statuses", hotels.length - published.length]].map(([label, count]) => (
                <article className="admin-stat-card" key={String(label)}>
                  <div className="admin-stat-top"><span className="admin-stat-label">{label}</span><span className="admin-stat-icon">⌂</span></div>
                  <strong className="admin-stat-value">{loading ? "—" : count}</strong>
                  <span className="admin-stat-note">Your property inventory</span>
                </article>
              ))}
            </section>
          )}

          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div><h2>{tab === "overview" ? "Recent accommodations" : `All accommodations (${hotels.length})`}</h2><p>Manage your uploaded property listings.</p></div>
              <button className="admin-secondary-button" disabled={loading} onClick={() => void (tab === "overview" ? setTab("accommodations") : fetchHotels())}>{tab === "overview" ? "View inventory →" : loading ? "Refreshing…" : "↻ Refresh"}</button>
            </div>

            {loading ? <div className="admin-inline-state">Loading accommodations…</div> : hotels.length === 0 ? (
              <div className="admin-empty-state"><span className="admin-empty-icon">⌂</span><h3>No accommodations found</h3><p>Add a property to see it in your inventory.</p><button className="admin-primary-button" onClick={() => navigate("/admin/accommodations/new")}>Add accommodation</button></div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Accommodation</th><th>Address</th><th>Rating</th><th>Price per night</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {(tab === "overview" ? hotels.slice(0, 4) : hotels).map((hotel) => (
                      <tr key={hotel.id}>
                        <td><div className="admin-table-property"><span className="admin-table-property-icon">⌂</span><span className="admin-table-property-name">{hotel.name}</span></div></td>
                        <td><span className="admin-address-cell">{hotel.address || "—"}</span></td>
                        <td><span className="admin-rating">★ {hotel.star_rating ?? "—"}</span></td>
                        <td><strong className="admin-price-cell">{money(hotel.price_per_night)}</strong></td>
                        <td><span className={`admin-status-pill ${hotel.status?.toLowerCase() === "published" ? "status-published" : "status-other"}`}><span className="admin-status-indicator" />{hotel.status || "Unspecified"}</span></td>
                        <td><div className="admin-row-actions"><button className="admin-edit-button" onClick={() => navigate(`/admin/accommodations/${hotel.id}/edit`)}>✎ Edit</button><button className="admin-delete-button" onClick={() => void deleteHotel(hotel)}>× Delete</button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="admin-panel-footer"><span>{hotels.length} accommodations</span><span>La Villa property management</span></div>
          </section>
        </div>
      </main>
    </div>
  );
}