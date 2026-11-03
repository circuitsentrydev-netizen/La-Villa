
// export const API_BASE_URL = "http://localhost:3002/api";

const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = configuredApiUrl
  ? configuredApiUrl.replace(/\/+$/, '')
  : 'https://la-villa-3.onrender.com/api';
