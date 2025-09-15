export type AuthRole = "admin" | "survivor" | "banned";
export type AuthStorage = { token: string; username: string; role: AuthRole };

const STORAGE_KEY = "auth";

export function getAuthFromStorage(): AuthStorage | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthStorage>;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.token || !parsed.username || !parsed.role) return null;
    return parsed as AuthStorage;
  } catch {
    return null;
  }
}

export function setAuthToStorage(auth: AuthStorage) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearAuthStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
