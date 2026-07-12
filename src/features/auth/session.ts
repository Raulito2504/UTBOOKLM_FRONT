import type { AuthResponse, User } from "@/src/features/auth/types";

const ACCESS_TOKEN = "utbooklm_access_token";
const REFRESH_TOKEN = "utbooklm_refresh_token";
const USER = "utbooklm_user";
const REMEMBER = "utbooklm_remember";

function stores() {
  return [localStorage, sessionStorage];
}

function activeStorage(): Storage {
  return localStorage.getItem(REMEMBER) === "true" ? localStorage : sessionStorage;
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return activeStorage().getItem(ACCESS_TOKEN);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return activeStorage().getItem(REFRESH_TOKEN);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const value = activeStorage().getItem(USER);
  if (!value) return null;
  try { return JSON.parse(value) as User; } catch { return null; }
}

export function saveSession(session: AuthResponse, remember: boolean) {
  clearSession(false);
  const storage = remember ? localStorage : sessionStorage;
  if (remember) localStorage.setItem(REMEMBER, "true");
  storage.setItem(ACCESS_TOKEN, session.access_token);
  storage.setItem(REFRESH_TOKEN, session.refresh_token);
  storage.setItem(USER, JSON.stringify(session.user));
  window.dispatchEvent(new Event("auth-session-change"));
}

export function updateAccessToken(token: string) {
  activeStorage().setItem(ACCESS_TOKEN, token);
}

export function saveUser(user: User) {
  activeStorage().setItem(USER, JSON.stringify(user));
}

export function clearSession(notify = true) {
  if (typeof window === "undefined") return;
  for (const storage of stores()) {
    storage.removeItem(ACCESS_TOKEN);
    storage.removeItem(REFRESH_TOKEN);
    storage.removeItem(USER);
  }
  localStorage.removeItem(REMEMBER);
  if (notify) window.dispatchEvent(new Event("auth-session-change"));
}
