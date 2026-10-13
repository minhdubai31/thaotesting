// Same-origin API. In development Vite proxies /api to the backend.
const API_BASE = import.meta.env.VITE_API_BASE || "";
const TOKEN_KEY = "token";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage can be blocked. The session then lasts until the page is closed.
  }
}

function flattenErrors(errors) {
  if (!errors) return "";
  return Object.entries(errors)
    .map(([key, value]) => {
      const text = Array.isArray(value) ? value.join(" ") : typeof value === "object" ? JSON.stringify(value) : String(value);
      return `${key}: ${text}`;
    })
    .join(" · ");
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection.", 0);
  }

  let json = null;
  try {
    json = await response.json();
  } catch {
    // Not JSON (for example a platform error page).
  }

  if (!response.ok || !json?.success) {
    const details = flattenErrors(json?.errors);
    const message = json?.message || `Request failed (${response.status}).`;
    throw new ApiError(details ? `${message} ${details}` : message, response.status);
  }

  return json.data;
}

// Builds a query string, skipping empty values.
export function toQuery(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  return search.toString();
}
