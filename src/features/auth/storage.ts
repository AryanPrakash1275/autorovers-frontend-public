// Minimal auth token storage utilities.
// Keeps persistence logic isolated from API and UI layers.
// Note: token validity/expiry is enforced server-side; UI checks are convenience only.

const STORAGE_KEY = "autorovers_auth_token";

export function saveToken(token: string) {
  localStorage.setItem(STORAGE_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function clearToken() {
  localStorage.removeItem(STORAGE_KEY);
}

// Checks for token presence only (not token validity)
export function isLoggedIn(): boolean {
  return !!getToken();
}
