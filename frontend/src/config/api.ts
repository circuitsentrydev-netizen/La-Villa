// In production the Express API runs as a Netlify Function on the same domain.
export const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:3002/api"
  : "/api";
