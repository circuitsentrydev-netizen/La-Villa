
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

export function AddAccommodationForm() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<File[]>([]);

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
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (selectedFiles.length > 10) {
      setError("You can upload a maximum of 10 images.");
      setImages([]);
      e.target.value = "";
      return;
    }

    if (selectedFiles.some((file) => !allowedTypes.includes(file.type))) {
      setError("Only JPG, PNG, and WebP images are allowed.");
      setImages([]);
      e.target.value = "";
      return;
    }

    if (selectedFiles.some((file) => file.size > 5 * 1024 * 1024)) {
      setError("Each image must be 5 MB or smaller.");
      setImages([]);
      e.target.value = "";
      return;
    }

    setError("");
    setImages(selectedFiles);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

    setLoading(true);

    try {
      const token = localStorage.getItem("lavilla_token");

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

      // API_BASE_URL should be the backend origin, not the
      // complete /accommodations endpoint.
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
    padding: "10px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    boxSizing: "border-box",
    fontSize: "14px",
  };

  const labelStyle: React.CSSProperties = {
    display: "grid",
    gap: "6px",
  };

  return (
    <div
      style={{
        background: "#FAF9F6",
        minHeight: "100vh",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          background: "#fff",
          padding: "32px",
          borderRadius: "8px",
        }}
      >
        <h2>Add New Accommodation</h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gap: "16px" }}
        >
          <label style={labelStyle}>
            Name *
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
              style={inputStyle}
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

          <label style={labelStyle}>
            Property images
            <input
              style={inputStyle}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageChange}
            />
            <small>
              Maximum 10 images, 5 MB per image. JPG, PNG or WebP.
            </small>
          </label>

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
            <p
              role="alert"
              style={{ color: "red", margin: 0, overflowWrap: "anywhere" }}
            >
              {error}
            </p>
          )}

          <button
            disabled={loading}
            type="submit"
            style={{
              background: "#1B4D3E",
              color: "white",
              padding: "12px",
              border: 0,
              borderRadius: "6px",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Saving..." : "Save Accommodation"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddAccommodationForm;
