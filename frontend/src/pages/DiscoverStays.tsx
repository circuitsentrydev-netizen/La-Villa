
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { getImageUrl } from "../utils/imageUrl";

interface Stay {
  id: string;
  accommodation: string;
  location: string;
  starRating: number;
  nightlyRate: string | number;
  status: string;
  description?: string;
  images?: string[] | string;
}

interface AccommodationResponse {
  id: string | number;
  name?: string;
  accommodation?: string;
  address?: string;
  location?: string;
  star_rating?: number | string;
  starRating?: number | string;
  price_per_night?: number | string;
  pricePerNight?: number | string;
  nightly_rate?: number | string;
  nightlyRate?: number | string;
  status?: string;
  description?: string;
  images?: string[] | string;
}

interface FavoriteResponseItem {
  id?: string | number;
  accommodation_id?: string | number;
}

interface FavoritesApiResponse {
  favorites?: FavoriteResponseItem[];
  message?: string;
}

export function DiscoverStays() {
  const navigate = useNavigate();

  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const getToken = (): string | null =>
    localStorage.getItem("lavilla_token") ||
    localStorage.getItem("token");

  // Load published accommodations.
  useEffect(() => {
    let active = true;

    const fetchStays = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/accommodations?status=Published`
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load accommodations (${response.status}).`
          );
        }

        const data: unknown = await response.json();
        let records: unknown = data;

        if (
          !Array.isArray(records) &&
          records &&
          typeof records === "object"
        ) {
          const result = records as Record<string, unknown>;
          const nested = result.data;

          if (Array.isArray(result.accommodations)) {
            records = result.accommodations;
          } else if (Array.isArray(nested)) {
            records = nested;
          } else if (nested && typeof nested === "object") {
            const nestedData = nested as Record<string, unknown>;

            records =
              nestedData.accommodations ?? nestedData.results;
          } else {
            records = result.results;
          }
        }

        if (!Array.isArray(records)) {
          throw new Error(
            "The server returned an unsupported accommodations format."
          );
        }

        const normalized: Stay[] = (
          records as AccommodationResponse[]
        )
          .filter(
            (item) =>
              !item.status ||
              item.status.toLowerCase() === "published"
          )
          .map((item) => ({
            id: String(item.id),
            accommodation:
              item.name ??
              item.accommodation ??
              "Untitled property",
            location:
              item.address ??
              item.location ??
              "Location not provided",
            starRating: Number(
              item.star_rating ?? item.starRating ?? 0
            ),
            nightlyRate:
              item.price_per_night ??
              item.pricePerNight ??
              item.nightly_rate ??
              item.nightlyRate ??
              "",
            status: item.status ?? "Published",
            description: item.description ?? "",
            images: item.images,
          }));

        if (active) {
          setStays(normalized);
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

    void fetchStays();

    return () => {
      active = false;
    };
  }, []);

  // To Load saved accommodation IDs for the signed in user.
  useEffect(() => {
    let active = true;

    const loadFavoriteIds = async () => {
      const token = getToken();

      // Browsing remains available without signing in.
      
      if (!token) {
        if (active) {
          setFavoriteIds([]);
        }
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/favorites`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (response.status === 401) {
          if (active) {
            setFavoriteIds([]);
          }
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load saved accommodations.");
        }

        const data: FavoritesApiResponse = await response.json();

        const ids = (
          Array.isArray(data.favorites) ? data.favorites : []
        )
          .map((item) =>
            String(item.accommodation_id ?? item.id ?? "")
          )
          .filter((id) => id !== "");

        if (active) {
          setFavoriteIds(ids);
        }
      } catch (err) {
        // A favorites-loading problem should not stop visitors
        // from browsing available accommodations.
        console.error("Unable to load favorites:", err);
      }
    };

    void loadFavoriteIds();

    return () => {
      active = false;
    };
  }, []);

  const getImages = (
    images?: string[] | string
  ): string[] => {
    if (Array.isArray(images)) {
      return images.filter(
        (image) =>
          typeof image === "string" &&
          image.trim() !== ""
      );
    }

    if (typeof images === "string" && images.trim()) {
      try {
        const parsed: unknown = JSON.parse(images);

        if (Array.isArray(parsed)) {
          return parsed.filter(
            (image): image is string =>
              typeof image === "string" &&
              image.trim() !== ""
          );
        }

        if (typeof parsed === "string" && parsed.trim()) {
          return [parsed];
        }
      } catch {
        return [images];
      }
    }

    return [];
  };

  // Save or remove a favorite through the existing backend routes.
  const toggleFavorite = async (accommodationId: string) => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    if (savingId !== null) {
      return;
    }

    const alreadySaved = favoriteIds.includes(accommodationId);

    try {
      setSavingId(accommodationId);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/favorites/${encodeURIComponent(
          accommodationId
        )}`,
        {
          method: alreadySaved ? "DELETE" : "POST",
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
          data.message ?? "Unable to update your favorites."
        );
      }

      setFavoriteIds((current) => {
        if (alreadySaved) {
          return current.filter(
            (id) => id !== accommodationId
          );
        }

        return current.includes(accommodationId)
          ? current
          : [...current, accommodationId];
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update your favorites."
      );
    } finally {
      setSavingId(null);
    }
  };

  const reserveRoom = (stayId: string) => {
    const destination =
      `/reservations?accommodationId=${encodeURIComponent(stayId)}`;

    navigate(destination);
  };

  const buttonStyle = (
    background: string,
    color: string,
    border: string
  ): React.CSSProperties => ({
    flex: 1,
    padding: "12px 14px",
    borderRadius: 7,
    background,
    color,
    border: `1px solid ${border}`,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  });

  return (
    <div
      style={{
        background: "#FAF9F6",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        padding: "40px 24px",
      }}
    >
      <header
        style={{
          maxWidth: 1200,
          margin: "0 auto 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <strong
            onClick={() => navigate("/")}
            style={{
              color: "#1B4D3E",
              fontSize: 26,
              cursor: "pointer",
            }}
          >
            La Villa
          </strong>

          <p
            style={{
              margin: "4px 0 0",
              color: "#64748b",
              fontSize: 14,
            }}
          >
            All available accommodations posted live from the
            backoffice portal.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/favorites")}
            style={buttonStyle("#1B4D3E", "#fff", "#1B4D3E")}
          >
            ♥ My Favorites
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            style={buttonStyle("transparent", "#475569", "#cbd5e1")}
          >
            ← Back to Home
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto" }}>
        {error && (
          <p
            role="alert"
            style={{
              padding: "12px 16px",
              marginBottom: 20,
              color: "#b91c1c",
              background: "#fef2f2",
              borderRadius: 8,
            }}
          >
            {error}
          </p>
        )}

        {loading ? (
          <p style={{ textAlign: "center", padding: 40 }}>
            Loading available properties...
          </p>
        ) : stays.length === 0 ? (
          <p
            style={{
              padding: 40,
              textAlign: "center",
              color: "#64748b",
            }}
          >
            No published accommodations are currently available.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 30,
            }}
          >
            {stays.map((stay) => {
              const images = getImages(stay.images);
              const isFavorite = favoriteIds.includes(stay.id);
              const imageUrl =
                images.length > 0
                  ? getImageUrl(images[0]).trim()
                  : "";

              return (
                <article
                  key={stay.id}
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
                      position: "relative",
                    }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={stay.accommodation}
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
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#64748b",
                        }}
                      >
                        No image available
                      </div>
                    )}

                    <button
                      type="button"
                      aria-label={
                        isFavorite
                          ? "Remove from favorites"
                          : "Save to favorites"
                      }
                      title={
                        isFavorite
                          ? "Remove from favorites"
                          : "Save to favorites"
                      }
                      disabled={savingId === stay.id}
                      onClick={() => {
                        void toggleFavorite(stay.id);
                      }}
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        color: isFavorite ? "#dc2626" : "#1B4D3E",
                        fontSize: 25,
                        lineHeight: 1,
                        cursor:
                          savingId === stay.id ? "wait" : "pointer",
                        opacity: savingId === stay.id ? 0.65 : 1,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                      }}
                    >
                      {savingId === stay.id
                        ? "…"
                        : isFavorite
                          ? "♥"
                          : "♡"}
                    </button>
                  </div>

                  <div style={{ padding: 20 }}>
                    <h3
                      style={{
                        margin: "0 0 6px",
                        fontSize: 19,
                        color: "#0f172a",
                      }}
                    >
                      {stay.accommodation}
                    </h3>

                    <p
                      style={{
                        margin: "0 0 12px",
                        color: "#64748b",
                        fontSize: 14,
                      }}
                    >
                      {stay.location}
                    </p>

                    {stay.description && (
                      <p
                        style={{
                          margin: "0 0 16px",
                          color: "#475569",
                          fontSize: 14,
                          lineHeight: 1.6,
                        }}
                      >
                        {stay.description.length > 120
                          ? `${stay.description.slice(0, 120)}...`
                          : stay.description}
                      </p>
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        paddingTop: 14,
                        borderTop: "1px solid #F1F5F9",
                      }}
                    >
                      <span
                        style={{
                          color: "#f59e0b",
                          fontWeight: 600,
                        }}
                      >
                        ★ {stay.starRating || "Unrated"}
                      </span>

                      <strong style={{ color: "#1B4D3E" }}>
                        {stay.nightlyRate !== "" &&
                        stay.nightlyRate !== null &&
                        stay.nightlyRate !== undefined
                          ? `R ${stay.nightlyRate} / night`
                          : "Price on request"}
                      </strong>
                    </div>

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
                              stay.id
                            )}`
                          )
                        }
                        style={buttonStyle("#fff", "#1B4D3E", "#1B4D3E")}
                      >
                        View details
                      </button>

                      <button
                        type="button"
                        onClick={() => reserveRoom(stay.id)}
                        style={buttonStyle(
                          "#1B4D3E",
                          "#fff",
                          "#1B4D3E"
                        )}
                      >
                        Reserve a Room
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

export default DiscoverStays;
