import { loginRedirectURL } from "./redirects.js";

// The session loader must verify the session with Better Auth, not decode a cookie.
export function createSessionGuard(loadSession, redirect) {
  return async function requireSession(destination, requestHeaders) {
    const session = await loadSession(requestHeaders);
    if (!session?.user?.id || !session.session) return redirect(loginRedirectURL(destination));
    return session;
  };
}
