/**
 * Session storage for the app's own auth. The API issues a signed access token
 * on sign-in; we keep it (with the user it belongs to) in localStorage and hand
 * it to every request. There is no refresh dance — the token is long-lived, and
 * an expired one simply sends the user back to the sign-in page.
 */
const STORAGE_KEY = 'panovia-session';

/** Fired when the stored session is dropped, including by a 401 response. */
export const SIGNED_OUT_EVENT = 'auth:signed-out';

export interface AuthSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number; // unix seconds
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface StoredAuth {
  session: AuthSession;
  user: AuthUser;
}

let current: StoredAuth | null = load();

function load(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed?.session?.access_token || !parsed.user?.id) return null;
    // Drop an expired token so the app never starts in a half-signed-in state.
    if (parsed.session.expires_at && parsed.session.expires_at * 1000 < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const readAuth = (): StoredAuth | null => current;
export const getToken = (): string | null => current?.session.access_token ?? null;

export function writeAuth(auth: StoredAuth) {
  current = auth;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  } catch {
    /* private mode — the session just won't survive a reload */
  }
}

export function clearAuth() {
  const had = current !== null;
  current = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  if (had) window.dispatchEvent(new Event(SIGNED_OUT_EVENT));
}
