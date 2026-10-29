
import {type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { API_BASE_URL } from "../config/api";
import { getImageUrl } from "../utils/imageUrl";
import "./AccountsPage.css";
import type { AppDispatch } from "../app/store";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatar?: string | null;
  role?: string;
  created_at?: string;
}

interface Reservation {
  id: number | string;
  reservation_code?: string;
  accommodation_name?: string;
  accommodation?: string;
  guest_name?: string;
  check_in_date: string;
  check_out_date: string;
  status?: string;
  total_amount?: number | string;
  guest_count?: number;
}

interface Favorite {
  id: string;
  accommodation_id?: string;
  name?: string;
  accommodation?: string;
  address?: string;
  description?: string;
  images?: string[] | string;
  price_per_night?: number | string;
  star_rating?: number | string;
}

async function apiRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || data.error || "The request could not be completed."
    );
  }

  return data as T;
}

function formatDate(value?: string): string {
  if (!value) return "Not provided";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMoney(value?: number | string): string {
  if (value === undefined || value === null || value === "") {
    return "Amount unavailable";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) return String(value);

  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(amount);
}

function getFavoriteImage(images?: string[] | string): string | null {
  if (Array.isArray(images)) return images[0] || null;

  if (typeof images === "string" && images.trim()) {
    try {
      const parsed: unknown = JSON.parse(images);

      if (Array.isArray(parsed)) {
        return typeof parsed[0] === "string" ? parsed[0] : null;
      }
    } catch {
      return images;
    }
  }

  return null;
}

export default function AccountPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<
    "profile" | "reservations" | "favorites"
  >("profile");

  useEffect(() => {
    const token =
      localStorage.getItem("lavilla_token") ||
      localStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        replace: true,
        state: { from: "/account" },
      });
      return;
    }

    let cancelled = false;

    async function loadAccount() {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        apiRequest<{ user: UserProfile }>("/profile/me", token!),
        apiRequest<{ reservations: Reservation[] }>(
          "/reservations/mine",
          token!
        ),
        apiRequest<{ favorites: Favorite[] }>("/favorites", token!),
      ]);

      if (cancelled) return;

      const profileResult = results[0];
      const reservationsResult = results[1];
      const favoritesResult = results[2];

      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value.user);
        setName(profileResult.value.user.name || "");
        setAvatar(profileResult.value.user.avatar || "");
      } else {
        setError(profileResult.reason instanceof Error
          ? profileResult.reason.message
          : "Unable to load your profile.");
      }

      if (reservationsResult.status === "fulfilled") {
        setReservations(reservationsResult.value.reservations || []);
      }

      if (favoritesResult.status === "fulfilled") {
        setFavorites(favoritesResult.value.favorites || []);
      }

      if (
        results.some(
          (result) =>
            result.status === "rejected" &&
            result.reason instanceof Error &&
            /token|unauthori[sz]ed|sign in|access denied|expired/i.test(
              result.reason.message
            )
        )
      ) {
        dispatch(logout());
        navigate("/login", {
          replace: true,
          state: { from: "/account" },
        });
        return;
      }

      setLoading(false);
    }

    void loadAccount();

    return () => {
      cancelled = true;
    };
  }, [dispatch, navigate]);

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const token =
      localStorage.getItem("lavilla_token") ||
      localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setSaving(true);

    try {
      const result = await apiRequest<{
        message?: string;
        user: UserProfile;
      }>("/profile/me", token, {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim(),
          avatar: avatar.trim() || null,
        }),
      });

      setProfile(result.user);
      setName(result.user.name || "");
      setAvatar(result.user.avatar || "");
      setMessage(result.message || "Your profile has been updated.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    dispatch(logout());
    navigate("/", { replace: true });
  }

  if (loading) {
    return (
      <main className="account-page">
        <div className="account-loading">Loading your account...</div>
      </main>
    );
  }

  return (
    <main className="account-page">
      <nav className="account-nav">
        <button
          type="button"
          className="account-brand"
          onClick={() => navigate("/")}
        >
          <strong>La Villa</strong>
          <span>Lekker Stays</span>
        </button>

        <div className="account-nav-actions">
          <button type="button" onClick={() => navigate("/discover")}>
            Discover stays
          </button>
          <button type="button" className="account-signout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </nav>

      <section className="account-heading">
        <p className="account-eyebrow">YOUR LA VILLA ACCOUNT</p>
        <h1>Welcome{profile?.name ? `, ${profile.name}` : " back"}</h1>
        <p>Manage your details, trips and saved places in one spot.</p>
      </section>

      {error && (
        <div className="account-alert account-alert-error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="account-alert account-alert-success" role="status">
          {message}
        </div>
      )}

      <div className="account-layout">
        <aside className="account-sidebar">
          <div className="account-identity">
            {profile?.avatar ? (
              <img
                className="account-avatar"
                src={profile.avatar}
                alt="Your profile"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="account-avatar account-avatar-placeholder">
                {(profile?.name || profile?.email || "G")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <strong>{profile?.name || "Guest"}</strong>
            <span>{profile?.email}</span>
          </div>

          <button
            type="button"
            className={activeTab === "profile" ? "account-tab active" : "account-tab"}
            onClick={() => setActiveTab("profile")}
          >
            <span>Profile details</span>
            <span>→</span>
          </button>

          <button
            type="button"
            className={
              activeTab === "reservations" ? "account-tab active" : "account-tab"
            }
            onClick={() => setActiveTab("reservations")}
          >
            <span>My reservations</span>
            <span className="account-count">{reservations.length}</span>
          </button>

          <button
            type="button"
            className={
              activeTab === "favorites" ? "account-tab active" : "account-tab"
            }
            onClick={() => setActiveTab("favorites")}
          >
            <span>Saved stays</span>
            <span className="account-count">{favorites.length}</span>
          </button>
        </aside>

        <section className="account-content">
          {activeTab === "profile" && (
            <div className="account-panel">
              <div className="account-panel-heading">
                <p className="account-eyebrow">PERSONAL INFORMATION</p>
                <h2>Your profile</h2>
                <p>Keep your contact details up to date.</p>
              </div>

              <form className="account-form" onSubmit={handleSaveProfile}>
                <label htmlFor="account-name">Full name</label>
                <input
                  id="account-name"
                  type="text"
                  autoComplete="name"
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />

                <label htmlFor="account-email">Email address</label>
                <input
                  id="account-email"
                  type="email"
                  value={profile?.email || ""}
                  readOnly
                  disabled
                />
                <small className="account-field-note">
                  Your email address is managed by your sign-in account.
                </small>

                <label htmlFor="account-avatar">Profile picture URL</label>
                <input
                  id="account-avatar"
                  type="url"
                  placeholder="https://example.com/your-photo.jpg"
                  value={avatar}
                  onChange={(event) => setAvatar(event.target.value)}
                />
                <small className="account-field-note">
                  Paste an image URL, or leave it blank to use your initials.
                </small>

                <button
                  type="submit"
                  className="account-primary-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "reservations" && (
            <div className="account-panel">
              <div className="account-panel-heading">
                <p className="account-eyebrow">YOUR TRAVEL HISTORY</p>
                <h2>My reservations</h2>
                <p>Keep track of your bookings and stay dates.</p>
              </div>

              {reservations.length === 0 ? (
                <div className="account-empty">
                  <span className="account-empty-icon">⌂</span>
                  <h3>No reservations yet</h3>
                  <p>Your bookings will appear here after you make a reservation.</p>
                  <button
                    type="button"
                    className="account-primary-button"
                    onClick={() => navigate("/discover")}
                  >
                    Explore stays
                  </button>
                </div>
              ) : (
                <div className="account-reservation-list">
                  {reservations.map((reservation) => (
                    <article
                      className="account-reservation-card"
                      key={reservation.id}
                    >
                      <div className="account-reservation-top">
                        <div>
                          <h3>
                            {reservation.accommodation_name ||
                              reservation.accommodation ||
                              "Your accommodation"}
                          </h3>
                          <p>
                            Reference:{" "}
                            {reservation.reservation_code || reservation.id}
                          </p>
                        </div>
                        <span className="account-status">
                          {reservation.status || "Pending"}
                        </span>
                      </div>

                      <div className="account-reservation-dates">
                        <div>
                          <span>CHECK-IN</span>
                          <strong>{formatDate(reservation.check_in_date)}</strong>
                        </div>
                        <div>
                          <span>CHECK-OUT</span>
                          <strong>{formatDate(reservation.check_out_date)}</strong>
                        </div>
                        <div>
                          <span>GUESTS</span>
                          <strong>{reservation.guest_count ?? "—"}</strong>
                        </div>
                      </div>

                      <div className="account-reservation-bottom">
                        <span>Total</span>
                        <strong>{formatMoney(reservation.total_amount)}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="account-panel">
              <div className="account-panel-heading">
                <p className="account-eyebrow">PLACES YOU LOVE</p>
                <h2>Saved stays</h2>
                <p>Your shortlist for the next getaway.</p>
              </div>

              {favorites.length === 0 ? (
                <div className="account-empty">
                  <span className="account-empty-icon">♡</span>
                  <h3>No saved stays yet</h3>
                  <p>Save accommodations you like to find them here later.</p>
                  <button
                    type="button"
                    className="account-primary-button"
                    onClick={() => navigate("/discover")}
                  >
                    Find a stay
                  </button>
                </div>
              ) : (
                <div className="account-favorite-list">
                  {favorites.map((favorite) => {
                    const image = getFavoriteImage(favorite.images);
                    const id = favorite.accommodation_id || favorite.id;

                    return (
                      <article className="account-favorite-card" key={id}>
                        {image ? (
                          <img
                            src={getImageUrl(image)}
                            alt={favorite.name || favorite.accommodation || "Saved stay"}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="account-favorite-placeholder">
                            La Villa
                          </div>
                        )}

                        <div className="account-favorite-details">
                          <h3>
                            {favorite.name ||
                              favorite.accommodation ||
                              "Saved accommodation"}
                          </h3>
                          <p>{favorite.address || "Location not provided"}</p>
                          {favorite.description && (
                            <p className="account-favorite-description">
                              {favorite.description.length > 110
                                ? `${favorite.description.slice(0, 110)}...`
                                : favorite.description}
                            </p>
                          )}
                          {favorite.price_per_night != null && (
                            <strong>
                              {formatMoney(favorite.price_per_night)} / night
                            </strong>
                          )}

                          <button
                            type="button"
                            className="account-text-button"
                            onClick={() =>
                              navigate(
                                `/accommodations/${encodeURIComponent(String(id))}`
                              )
                            }
                          >
                            View stay →
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                className="account-secondary-button"
                onClick={() => navigate("/favorites")}
              >
                Open saved stays page
              </button>
            </div>
          )}
        </section>
      </div>

      <footer className="account-footer">
        © 2026 La Villa Stays. All rights reserved.
      </footer>
    </main>
  );
}
