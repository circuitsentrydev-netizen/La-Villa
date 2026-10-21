import { API_BASE_URL } from "../config/api";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/i, "").replace(/\/+$/, "");

export function getImageUrl(imagePath?: string | null): string {
  if (typeof imagePath !== "string" || !imagePath.trim()) {
    return "";
  }

  const path = imagePath.trim();

  // Reject the Unsplash homepage: it is not an image URL.
  try {
    const parsed = new URL(path);

    if (
      parsed.hostname === "unsplash.com" &&
      parsed.pathname === "/"
    ) {
      return "";
    }

    // Keep valid absolute image URLs unchanged.
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.href
      : "";
  } catch {
    // Relative backend upload paths are handled below.
  }

  // Convert /uploads/photo.jpg to the backend URL.
  const relativePath = path.replace(/^\/+/, "");

  return `${API_ORIGIN}/${relativePath}`;
}