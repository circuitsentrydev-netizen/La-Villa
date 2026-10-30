
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { getImageUrl } from "../utils/imageUrl";

interface FavoriteStay {
  id: string;
  accommodation_id: string;
  name: string;
  address: string | null;
  description: string | null;
  star_rating: number | string | null;
  price_per_night: number | string | null;
  images: string[] | string | null;
}

interface FavoriteApiItem {
  id?: string | number;
  accommodation_id?: string | number;
  name?: string;
  address?: string | null;
  description?: string | null;
  star_rating?: number | string | null;
  price_per_night?: number | string | null;
  images?: string[] | string | null;
}

interface FavoritesApiResponse {
  favorites?: FavoriteApiItem[];
  message?: string;
}

export default function FavoritesPage() {
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState<FavoriteStay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const getToken = (): string | null =>
    localStorage.getItem("lavilla_token") ||
    localStorage.getItem("token");

  const getImages = (
    value: FavoriteStay["images"]
  ): string[] => {
    if (Array.isArray(value)) {
      return value.filter(
        (item): item is string =>
          typeof item === "string" &&
          item.trim() !== ""
      );
    }

    if (typeof value !== "string" || !value.trim()) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string =>
            typeof item === "string" &&
            item.trim() !== ""
        );
      }

      if (typeof parsed === "string" && parsed.trim()) {
        return [parsed];
      }
    } catch {
      return [value];
    }

    return [];
  };

  const loadFavorites = useCallback(async () => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/favorites`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data: FavoritesApiResponse = await response
        .json()
        .catch(() => ({}));

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ?? "Failed to load favorites."
        );
      }

      const normalizedFavorites: FavoriteStay[] = (
        Array.isArray(data.favorites) ? data.favorites : []
      )
        .map((item) => {
          // The current backend query returns the accommodation ID
          // in "id". Support "accommodation_id" as well.
          const accommodationId = String(
            item.accommodation_id ?? item.id ?? ""
          );

          return {
            id: String(item.id ?? accommodationId),
            accommodation_id: accommodationId,
            name: item.name ?? "Untitled property",
            address: item.address ?? null,
            description: item.description ?? null,
            star_rating: item.star_rating ?? null,
            price_per_night: item.price_per_night ?? null,
            images: item.images ?? null,
          };
        })
        .filter((item) => item.accommodation_id !== "");

      setFavorites(normalizedFavorites);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load favorites."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const removeFavorite = async (accommodationId: string) => {
    const token = getToken();

    if (!token || removingId !== null) {
      return;
    }

    try {
      setRemovingId(accommodationId);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/favorites/${encodeURIComponent(
          accommodationId
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data: { message?: string } = await response
        .json()
        .catch(() => ({}));

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ?? "Unable to remove favorite."
        );
      }

      setFavorites((current) =>
        current.filter(
          (item) => item.accommodation_id !== accommodationId
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove favorite."
      );
    } finally {
      setRemovingId(null);
    }
  };

  const buttonStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 7,
    border: "1px solid #1B4D3E",
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 24px",
        background: "#FAF9F6",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <header
        style={{
          maxWidth: 1200,
          margin: "0 auto 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: "#1B4D3E" }}>
            ♥ My Favorites
          </h1>

          <p style={{ color: "#64748b" }}>
            Your saved La Villa accommodations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/discover")}
          style={{
            ...buttonStyle,
            background: "#1B4D3E",
            color: "#fff",
          }}
        >
          ← Discover Stays
        </button>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto" }}>
        {error && (
          <p
            role="alert"
            style={{
              color: "#b91c1c",
              padding: "12px 16px",
              background: "#fef2f2",
              borderRadius: 8,
            }}
          >
            {error}
          </p>
        )}

        {loading ? (
          <p>Loading your favorites...</p>
        ) : favorites.length === 0 ? (
          <section
            style={{
              padding: 48,
              background: "#fff",
              borderRadius: 12,
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 40, margin: 0 }}>♡</p>

            <h2>No saved accommodations yet</h2>

            <p style={{ color: "#64748b" }}>
              Browse our stays and tap the heart to save a property.
            </p>

            <button
              type="button"
              onClick={() => navigate("/discover")}
              style={{
                ...buttonStyle,
                background: "#1B4D3E",
                color: "#fff",
              }}
            >
              Explore accommodations
            </button>
          </section>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 24,
            }}
          >
            {favorites.map((favorite) => {
              const images = getImages(favorite.images);
              const imageUrl =
                images.length > 0
                  ? getImageUrl(images[0]).trim()
                  : "";

              return (
                <article
                  key={favorite.accommodation_id}
                  style={{
                    background: "#fff",
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                    overflow: "hidden",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    style={{
                      height: 210,
                      background: "#e2e8f0",
                      overflow: "hidden",
                    }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={favorite.name}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: "100%",
                          display: "grid",
                          placeItems: "center",
                          color: "#64748b",
                        }}
                      >
                        No image available
                      </div>
                    )}
                  </div>

                  <div style={{ padding: 20 }}>
                    <h3
                      style={{
                        marginTop: 0,
                        color: "#0f172a",
                      }}
                    >
                      {favorite.name}
                    </h3>

                    <p style={{ color: "#64748b" }}>
                      {favorite.address || "Location not provided"}
                    </p>

                    {favorite.description && (
                      <p
                        style={{
                          color: "#475569",
                          fontSize: 14,
                          lineHeight: 1.6,
                        }}
                      >
                        {favorite.description.length > 120
                          ? `${favorite.description.slice(0, 120)}...`
                          : favorite.description}
                      </p>
                    )}

                    <p style={{ color: "#f59e0b" }}>
                      ★{" "}
                      {Number(favorite.star_rating) || "Unrated"}
                    </p>

                    <strong style={{ color: "#1B4D3E" }}>
                      {favorite.price_per_night !== null &&
                      favorite.price_per_night !== ""
                        ? `R ${Number(
                            favorite.price_per_night
                          ).toFixed(2)} / night`
                        : "Price on request"}
                    </strong>

                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        marginTop: 18,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/accommodations/${encodeURIComponent(
                              favorite.accommodation_id
                            )}`
                          )
                        }
                        style={{
                          ...buttonStyle,
                          flex: 1,
                          background: "#fff",
                          color: "#1B4D3E",
                        }}
                      >
                        View details
                      </button>

                      <button
                        type="button"
                        disabled={
                          removingId === favorite.accommodation_id
                        }
                        onClick={() => {
                          void removeFavorite(
                            favorite.accommodation_id
                          );
                        }}
                        style={{
                          ...buttonStyle,
                          flex: 1,
                          background: "#fff",
                          color: "#b91c1c",
                          borderColor: "#fecaca",
                          opacity:
                            removingId === favorite.accommodation_id
                              ? 0.6
                              : 1,
                          cursor:
                            removingId === favorite.accommodation_id
                              ? "wait"
                              : "pointer",
                        }}
                      >
                        {removingId === favorite.accommodation_id
                          ? "Removing..."
                          : "♥ Remove"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
