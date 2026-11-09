import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export function AddAccommodationForm() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<File[]>([]);
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

  // Create image previews and clean up their object URLs.
  useEffect(() => {
    const urls = images.map((image) =>
      URL.createObjectURL(image)
    );

    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

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

    if (selectedFiles.length + images.length > MAX_IMAGES) {
      setError(`You can upload a maximum of ${MAX_IMAGES} images.`);
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
    setImages((previous) => [...previous, ...selectedFiles]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");

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

    if (images.length > MAX_IMAGES) {
      setError(`You can upload a maximum of ${MAX_IMAGES} images.`);
      return;
    }

    setLoading(true);

    try {
      const token =
        localStorage.getItem("lavilla_token") ||
        localStorage.getItem("token");

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

      images.forEach((image) => {
        body.append("images", image);
      });

      // API_BASE_URL already includes /api.
      const baseUrl = API_BASE_URL.replace(/\/+$/, "");
      const endpoint = `${baseUrl}/accommodations`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Authentication failed. Please sign in again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have administrator permission to add accommodation."
          );
        }

        throw new Error(
          result?.error ||
            result?.message ||
            `Failed to save accommodation (HTTP ${response.status}).`
        );
      }

      if (!result?.accommodation) {
        throw new Error(
          "The server responded, but no accommodation record was returned."
        );
      }

      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Add accommodation error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not save the accommodation. Check your backend connection."
      );
    } finally {
      setLoading(false);
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
    cursor: loading ? "wait" : "pointer",
    fontWeight: 700,
    fontSize: "14px",
    opacity: loading ? 0.7 : 1,
  };

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
          maxWidth: "700px",
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
          Add New Accommodation
        </h2>

        <p
          style={{
            color: "#64748b",
            margin: "0 0 26px",
            lineHeight: 1.6,
            fontSize: 13,
          }}
        >
          Add your property details, facilities and photographs
          to La Villa.
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
              placeholder="e.g. Ocean View Luxury Villa"
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
              placeholder="Enter the full property address"
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
              placeholder="e.g. 1250.00"
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
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} star{n > 1 ? "s" : ""}
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
              placeholder="Describe your accommodation..."
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

          <div style={{ display: "grid", gap: 10 }}>
            <label style={labelStyle}>
              Property images
              <input
                style={inputStyle}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageChange}
              />
            </label>

            <small style={{ color: "#64748b", lineHeight: 1.6 }}>
              Select up to 10 images. JPG, PNG or WebP.
              Maximum 5 MB per image.
            </small>

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
                Selected images ({images.length}/{MAX_IMAGES})
              </strong>

              {images.length > 0 && (
                <button
                  type="button"
                  onClick={() => setImages([])}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "#b42318",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Remove all
                </button>
              )}
            </div>

            {previewUrls.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(125px, 1fr))",
                  gap: 12,
                }}
              >
                {previewUrls.map((url, index) => (
                  <div
                    key={`${images[index].name}-${index}`}
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
                      alt={`Accommodation preview ${index + 1}`}
                      style={{
                        display: "block",
                        width: "100%",
                        height: 105,
                        objectFit: "cover",
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      aria-label={`Remove image ${index + 1}`}
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
                        padding: "6px",
                        fontSize: 10,
                        color: "#475569",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {images[index].name}
                    </div>
                  </div>
                ))}
              </div>
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
            disabled={loading}
            type="submit"
            style={buttonStyle}
          >
            {loading ? "Saving accommodation..." : "Save Accommodation"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddAccommodationForm;