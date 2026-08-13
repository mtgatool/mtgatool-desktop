/**
 * Where to land after the next successful login. Router state carries this
 * for in-app pushes to /auth, but state does not survive every path there
 * (hard reloads of the auth page, the boot-time bounce for signed-out deep
 * links) — sessionStorage does, and dies with the tab like the intent does.
 */
const KEY = "loginReturnTo";

export function setLoginReturnTo(path: string): void {
  try {
    // Never loop back into the login screen itself.
    if (!path || path === "/" || path.startsWith("/auth")) return;
    sessionStorage.setItem(KEY, path);
  } catch {
    // Storage unavailable — router state remains the primary carrier.
  }
}

export function consumeLoginReturnTo(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return value;
  } catch {
    return null;
  }
}
