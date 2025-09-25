export function apiFetch(input: string, init: RequestInit = {}) {
  // Attach Authorization header if an auth token is available.
  // This allows the backend to identify the current user without any client-side filtering logic.
  try {
    const token = localStorage.getItem('auth_token');
    if (token) {
      init.headers = {
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
      } as HeadersInit;
    }
  } catch {
    // ignore
  }
  return fetch(input, init);
}
