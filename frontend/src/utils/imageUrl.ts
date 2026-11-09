import { API_BASE_URL } from "../config/api";

// Remove the trailing /api from the backend API URL
// so uploaded images can be loaded from the backend root.
const API_ORIGIN = API_BASE_URL
  .replace(/\/api\/?$/i, "")
  .replace(/\/+$/, "");

export function getImageUrl(imagePath?: string | null): string {
  if (typeof imagePath !== "string" || !imagePath.trim()) {
    return "";
  }

  const path = imagePath.trim();

  // Handle absolute image URLs.
  try {
    const parsed = new URL(path);

    // Reject the Unsplash homepage because it is not an image.
    if (
      parsed.hostname === "unsplash.com" &&
      parsed.pathname === "/"
    ) {
      return "";
    }

    // Accept HTTP and HTTPS image URLs.
    if (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    ) {
      return parsed.href;
    }

    return "";
  } catch {
    // Continue with relative backend upload paths.
  }

  // Remove leading slashes from relative paths.
  const relativePath = path.replace(/^\/+/, "");

  if (!relativePath) {
    return "";
  }

  // Build the full backend image URL.
  return `${API_ORIGIN}/${relativePath}`;
}