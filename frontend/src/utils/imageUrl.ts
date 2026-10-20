
import { API_BASE_URL } from "../config/api";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export function getImageUrl(imagePath?: string | null): string {
  if (!imagePath?.trim()) {
    return "";
  }

  const path = imagePath.trim();

  // Support absolute URLs as well as backend upload paths.
  
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_ORIGIN}/${path.replace(/^\/+/, "")}`;
}
