const AUTH_TOKEN_KEY = "authToken";

function userId() {
  return localStorage.getItem("authUserId") || "guest";
}

function scopedKey(key) {
  return `u_${userId()}_${key}`;
}

export function isLoggedIn() {
  return !!localStorage.getItem(AUTH_TOKEN_KEY);
}

export function readJSON(key, fallback) {
  if (!isLoggedIn()) return fallback;
  try {
    const raw = localStorage.getItem(scopedKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  if (!isLoggedIn()) return false;
  localStorage.setItem(scopedKey(key), JSON.stringify(value));
  return true;
}

export function removeItem(key) {
  if (!isLoggedIn()) return false;
  localStorage.removeItem(scopedKey(key));
  return true;
}
