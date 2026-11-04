import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookie } from "better-auth/cookies";
import { auth } from "./auth";
import { connectAuthDatabase } from "./auth-database";
import { createSessionGuard } from "./auth-ui/session-guard";

const guard = createSessionGuard(async requestHeaders => {
  // Missing cookies can redirect immediately. Present cookies always require
  // a verified database session; cookie presence alone never grants access.
  if (!getSessionCookie(requestHeaders)) return null;
  await connectAuthDatabase();
  return auth.api.getSession({ headers: requestHeaders, query: { disableCookieCache: true } });
}, redirect);

export async function requireSession(destination) {
  return guard(destination, await headers());
}
