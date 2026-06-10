// API base path configuration
// In development, this is empty so requests are proxied via Vite (vite.config.ts)
// In production/deployment, set VITE_API_URL to your deployed backend URL (e.g. https://your-backend.onrender.com)
export const API_BASE = import.meta.env.VITE_API_URL || '';
