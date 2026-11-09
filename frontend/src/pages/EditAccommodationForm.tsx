import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { getImageUrl } from "../utils/imageUrl";

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

interface AccommodationData {
  id?: string;
  name?: string;
  description?: string;
  address?: string;
  price_per_night?: number | string;
  pricePerNight?: number | string;
  star_rating?: number | string;
  starRating?: number | string;
  status?: string;
  facilities?: string[] | string;
  policies?: string[] | string;
  images?: string[] | string;
  image?: string;
  image_url?: string;
  imageUrl?: string;
  cover_image?: string;
}

const getToken = () =>
  localStorage.getItem("lavilla_token") ||
  localStorage.getItem("token");

const parseList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  const trimmed = value.trim();

  try {
    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item).trim())
        .filter(Boolean);
    }
  } catch {
    // Continue with a plain-text or PostgreSQL array value.
  }

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.replace(/^"|"$/g, "").trim())
      .filter(Boolean);
  }

  return trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const getAccommodationImages = (
  accommodation: AccommodationData
): string[] => {
  const images = parseList(accommodation.images);

  const fallbackImages = [
    accommodation.cover_image,
    accommodation.image_url,
    accommodation.imageUrl,
    accommodation.image,
  ].filter(
    (image): image is string =>
      typeof image === "string" && Boolean(image.trim())
  );

  return Array.from(new Set([...images, ...fallbackImages]));
};

export function EditAccommodationForm() {
  const navigate = useNavigate();
  const { accommodationId } = useParams<{ accommodationId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    starRating: "5",
    pricePerNight: "",
    status: "Published",
    facilities: "",
    policies: "",
  });

  const baseUrl = API_BASE_URL.replace(/\/+$/, "");

  useEffect(() => {
    const urls = newImages.map((image) =>
      URL.createObjectURL(image)
    );

    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImages]);

  useEffect(() => {
    const loadAccommodation = async () => {
      if (!accommodationId) {
        setError("No accommodation was selected.");
        setLoading(false);
        return;
      }

      try {
        const token = getToken();

        if (!token) {
          throw new Error(
            "Your admin session has expired. Please sign in again."
          );
        }

        const response = await fetch(
          `${baseUrl}/accommodations/${encodeURIComponent(
            accommodationId
          )}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error ||
              result?.message ||
              `Could not load accommodation (HTTP ${response.status}).`
          );
        }

        const accommodation: AccommodationData =
          result?.accommodation ||
          result?.data ||
          result;

        if (!accommodation || !accommodation.name) {
          throw new Error(
            "The server did not return the selected accommodation."
          );
        }

        setFormData({
          name: accommodation.name || "",
          description: accommodation.description || "",
          address: accommodation.address || "",
          starRating: String(
            accommodation.star_rating ??
              accommodation.starRating ??
              5
          ),
          pricePerNight: String(
            accommodation.price_per_night ??
              accommodation.pricePerNight ??
              ""
          ),
          status: accommodation.status || "Published",
          facilities: parseList(accommodation.facilities).join(", "),
          policies: parseList(accommodation.policies).join(", "),
        });

        setExistingImages(getAccommodationImages(accommodation));
      } catch (err) {
        console.error("Load accommodation error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Could not load accommodation details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAccommodation();
  }, [accommodationId, baseUrl]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (
      existingImages.length + newImages.length + selectedFiles.length >
      MAX_IMAGES
    ) {
      setError(
        `You can keep or upload a maximum of ${MAX_IMAGES} images in total. Remove an existing image before adding more.`
      );
      e.target.value = "";
      return;
    }

    if (selectedFiles.some((file) => !ALLOWED_TYPES.includes(file.type))) {
      setError("Only JPG, PNG, and WebP images are allowed.");
      e.target.value = "";
      return;
    }

    if (selectedFiles.some((file) => file.size > MAX_IMAGE_SIZE)) {
      setError("Each image must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }

    setError("");
    setNewImages((previous) => [...previous, ...selectedFiles]);

    // Allow the same file to be selected again after removal.
    e.target.value = "";
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );
  };

  const removeNewImage = (index: number) => {
    setNewImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );
  };

  const removeAllImages = () => {
    setExistingImages([]);
    setNewImages([]);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");

    if (!accommodationId) {
      setError("No accommodation was selected.");
      return;
    }

    const price = Number(formData.pricePerNight);

    if (
      !formData.name.trim() ||
      !formData.address.trim() ||
      !formData.pricePerNight.trim() ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setError(
        "Enter the accommodation name, address, and a valid price per night."
      );
      return;
    }

    if (existingImages.length + newImages.length > MAX_IMAGES) {
      setError(`You can keep or upload a maximum of ${MAX_IMAGES} images.`);
      return;
    }

    setSaving(true);

    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Your admin session has expired. Please sign in again."
        );
      }

      const body = new FormData();

      body.append("name", formData.name.trim());
      body.append("address", formData.address.trim());
      body.append("pricePerNight", String(price));
      body.append("description", formData.description.trim());
      body.append("starRating", formData.starRating);
      body.append("status", formData.status);

      body.append(
        "facilities",
        JSON.stringify(
          formData.facilities
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      );

      body.append(
        "policies",
        JSON.stringify(
          formData.policies
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      );

      // The backend uses this list to retain only the selected old photos.
      body.append("existingImages", JSON.stringify(existingImages));

      newImages.forEach((image) => {
        body.append("images", image);
      });

      const response = await fetch(
        `${baseUrl}/accommodations/${encodeURIComponent(
          accommodationId
        )}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body,
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Authentication failed. Please sign in again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have administrator permission to edit this accommodation."
          );
        }

        throw new Error(
          result?.error ||
            result?.message ||
            `Failed to update accommodation (HTTP ${response.status}).`
        );
      }

      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Update accommodation error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not update the accommodation. Check your backend connection."
      );
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    boxSizing: "border-box",
    fontSize: "14px",
    background: "#fff",
    color: "#0f172a",
  };

  const labelStyle: React.CSSProperties = {
    display: "grid",
    gap: "7px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: 600,
  };

  const buttonStyle: React.CSSProperties = {
    background: "#1B4D3E",
    color: "#fff",
    padding: "13px",
    border: 0,
    borderRadius: "7px",
    cursor: saving ? "wait" : "pointer",
    fontWeight: 700,
    fontSize: "14px",
    opacity: saving ? 0.7 : 1,
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#FAF9F6",
          color: "#1B4D3E",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        Loading accommodation details...
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#FAF9F6",
        minHeight: "100vh",
        padding: "40px 20px",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          background: "#fff",
          padding: "32px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(15,23,42,0.06)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/admin/dashboard")}
          style={{
            border: 0,
            background: "transparent",
            color: "#1B4D3E",
            padding: 0,
            marginBottom: 20,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          ← Back to dashboard
        </button>

        <p
          style={{
            color: "#1B4D3E",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.5,
            marginBottom: 8,
          }}
        >
          PROPERTY MANAGEMENT
        </p>

        <h2
          style={{
            color: "#0f172a",
            fontSize: 27,
            margin: "0 0 8px",
          }}
        >
          Edit Accommodation
        </h2>

        <p
          style={{
            color: "#64748b",
            margin: "0 0 26px",
            lineHeight: 1.6,
            fontSize: 13,
          }}
        >
          Update your property details, manage existing photographs,
          and add new images to your La Villa listing.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gap: "19px" }}
        >
          <label style={labelStyle}>
            Accommodation name *
            <input
              style={inputStyle}
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </label>

          <label style={labelStyle}>
            Address *
            <input
              style={inputStyle}
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
            />
          </label>

          <label style={labelStyle}>
            Price per night (ZAR) *
            <input
              style={inputStyle}
              type="number"
              name="pricePerNight"
              value={formData.pricePerNight}
              onChange={handleInputChange}
              min="0.01"
              step="0.01"
              required
            />
          </label>

          <label style={labelStyle}>
            Star rating
            <select
              style={inputStyle}
              name="starRating"
              value={formData.starRating}
              onChange={handleInputChange}
            >
              {[1, 2, 3, 4, 5].map((number) => (
                <option key={number} value={number}>
                  {number} star{number > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Description
            <textarea
              style={{
                ...inputStyle,
                resize: "vertical",
                lineHeight: 1.6,
              }}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
            />
          </label>

          <label style={labelStyle}>
            Facilities (comma-separated)
            <input
              style={inputStyle}
              name="facilities"
              value={formData.facilities}
              onChange={handleInputChange}
              placeholder="Free Wi-Fi, Swimming pool, Parking"
            />
          </label>

          <label style={labelStyle}>
            Policies (comma-separated)
            <input
              style={inputStyle}
              name="policies"
              value={formData.policies}
              onChange={handleInputChange}
              placeholder="No smoking, Check-in at 14:00"
            />
          </label>

          <div style={{ display: "grid", gap: 12 }}>
            <div style={labelStyle}>
              Property photographs
              <span
                style={{
                  color: "#64748b",
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}
              >
                Keep existing photographs, remove ones you no longer want,
                or upload additional photographs. You can manage up to
                10 images in total.
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "#475569",
                fontSize: 12,
              }}
            >
              <strong>
                Current images ({existingImages.length + newImages.length}/{MAX_IMAGES})
              </strong>

              {(existingImages.length > 0 || newImages.length > 0) && (
                <button
                  type="button"
                  onClick={removeAllImages}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "#b42318",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Remove all images
                </button>
              )}
            </div>

            {existingImages.length > 0 && (
              <>
                <strong style={{ fontSize: 12, color: "#334155" }}>
                  Existing photographs
                </strong>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(125px, 1fr))",
                    gap: 12,
                  }}
                >
                  {existingImages.map((image, index) => {
                    const imageUrl = getImageUrl(image);

                    return (
                      <div
                        key={`${image}-${index}`}
                        style={{
                          position: "relative",
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                          overflow: "hidden",
                          background: "#f1f5f9",
                        }}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`Existing accommodation image ${index + 1}`}
                            style={{
                              display: "block",
                              width: "100%",
                              height: 105,
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              height: 105,
                              display: "grid",
                              placeItems: "center",
                              color: "#64748b",
                              fontSize: 11,
                            }}
                          >
                            Image unavailable
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          aria-label={`Remove existing image ${index + 1}`}
                          style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            width: 26,
                            height: 26,
                            border: 0,
                            borderRadius: "50%",
                            background: "#fff",
                            color: "#b42318",
                            cursor: "pointer",
                            fontWeight: 800,
                            boxShadow: "0 1px 5px #0002",
                          }}
                        >
                          ×
                        </button>

                        <div
                          style={{
                            padding: 6,
                            fontSize: 10,
                            color: "#475569",
                          }}
                        >
                          Existing image {index + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <label style={labelStyle}>
              Add new photographs
              <input
                style={inputStyle}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageChange}
              />
            </label>

            <small style={{ color: "#64748b", lineHeight: 1.6 }}>
              JPG, PNG or WebP. Maximum 5 MB per image.
            </small>

            {previewUrls.length > 0 && (
              <>
                <strong style={{ fontSize: 12, color: "#334155" }}>
                  Newly selected photographs
                </strong>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(125px, 1fr))",
                    gap: 12,
                  }}
                >
                  {previewUrls.map((url, index) => (
                    <div
                      key={`${newImages[index].name}-${index}`}
                      style={{
                        position: "relative",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        overflow: "hidden",
                        background: "#f1f5f9",
                      }}
                    >
                      <img
                        src={url}
                        alt={`New accommodation image ${index + 1}`}
                        style={{
                          display: "block",
                          width: "100%",
                          height: 105,
                          objectFit: "cover",
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        aria-label={`Remove new image ${index + 1}`}
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          width: 26,
                          height: 26,
                          border: 0,
                          borderRadius: "50%",
                          background: "#fff",
                          color: "#b42318",
                          cursor: "pointer",
                          fontWeight: 800,
                          boxShadow: "0 1px 5px #0002",
                        }}
                      >
                        ×
                      </button>

                      <div
                        style={{
                          padding: 6,
                          fontSize: 10,
                          color: "#475569",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {newImages[index].name}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <label style={labelStyle}>
            Status
            <select
              style={inputStyle}
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </label>

          {error && (
            <div
              role="alert"
              style={{
                color: "#991b1b",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 7,
                padding: 12,
                fontSize: 13,
                lineHeight: 1.5,
                overflowWrap: "anywhere",
              }}
            >
              {error}
            </div>
          )}

          <button
            disabled={saving}
            type="submit"
            style={buttonStyle}
          >
            {saving ? "Saving changes..." : "Save Accommodation Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditAccommodationForm;