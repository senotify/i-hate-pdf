/**
 * Get the base URL for API calls
 * In production: uses relative URL (same domain)
 * In development: uses localhost:3000
 */
export function getApiBaseUrl(): string {
  return (
    import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === "production" ? "" : "http://localhost:3000")
  );
}

/**
 * Get the full API URL with /api prefix
 */
export function getApiUrl(): string {
  return `${getApiBaseUrl()}/api`;
}
