import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes } from "node:crypto";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { loginSchema, registerSchema } from "../src/lib/auth-ui/schemas.js";
import { safeCallbackURL, authPageURL, loginRedirectURL, destinationWithQuery } from "../src/lib/auth-ui/redirects.js";
import { navbarState } from "../src/lib/auth-ui/navigation.js";
import { submitAuth, logoutSession, authErrorMessage } from "../src/lib/auth-ui/actions.js";
import { createSessionGuard } from "../src/lib/auth-ui/session-guard.js";
import { createAuthOptions } from "../src/lib/auth-options.js";

test("login form validates email/password and supported remember-me input", () => {
  const values = { email: "reader@example.com", password: "Abcdef", rememberMe: true };
  assert.ok(loginSchema.safeParse(values).success);
  assert.ok(loginSchema.safeParse({ ...values, rememberMe: false }).success);
  for (const patch of [{ email: "bad" }, { email: "" }, { password: "" }]) {
    assert.equal(loginSchema.safeParse({ ...values, ...patch }).success, false);
  }
  assert.equal(loginSchema.parse({ ...values, email: " reader@example.com " }).email, values.email);
});

test("registration shares server password requirements and requires matching confirmation", () => {
  const values = { name: "Reader", email: "reader@example.com", password: "Abcdef", confirmPassword: "Abcdef" };
  assert.ok(registerSchema.safeParse(values).success);
  for (const patch of [{ name: " " }, { email: "bad" }, { password: "Abcde" }, { password: "abcdef" }, { password: "ABCDEF" }, { confirmPassword: "different" }]) {
    assert.equal(registerSchema.safeParse({ ...values, ...patch }).success, false);
  }
  const mismatch = registerSchema.safeParse({ ...values, confirmPassword: "different" });
  assert.ok(mismatch.error.issues.some(issue => issue.path[0] === "confirmPassword"));
});

test("safe callbacks preserve private destinations and reject external/encoded redirects", () => {
  for (const path of ["/", "/add-book", "/my-books", "/my-borrows", "/profile", "/books/0123456789abcdef01234567", "/books?category=Science", "/#arrivals-title"]) {
    assert.equal(safeCallbackURL(path), path);
  }
  for (const path of [null, ["/profile"], "https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "/%2f%2fevil.example", "/%252f%252fevil.example", "/%5cevil.example", "/%0a/evil", "/login", "/register", "/books/../login", "/%6cogin", "/api/auth/sign-out", "/_next/file", "/%", " /my-books"]) {
    assert.equal(safeCallbackURL(path), "/");
  }
  assert.equal(loginRedirectURL("/my-books"), "/login?callbackURL=%2Fmy-books");
  assert.equal(authPageURL("/register", "/my-books"), "/register?callbackURL=%2Fmy-books");
  assert.equal(destinationWithQuery("/my-books", { page: "2", filter: ["one", "two"] }), "/my-books?page=2&filter=one&filter=two");
});

test("anonymous navbar contains only public navigation and auth controls", () => {
  const state = navbarState(null, false);
  assert.deepEqual(state.links.map(([, href]) => href), ["/", "/books"]);
  assert.equal(state.showAuthLinks, true);
  assert.equal(state.user, null);
});

test("authenticated navbar exposes private navigation and preserves it during refresh", () => {
  const session = { user: { id: "reader", name: "Reader", email: "reader@example.com" } };
  const state = navbarState(session, false);
  assert.deepEqual(state.links.map(([, href]) => href), ["/", "/books", "/add-book", "/my-books", "/my-borrows"]);
  assert.equal(state.showAuthLinks, false);
  assert.equal(navbarState(session, true).loading, false);
});

test("pending navbar does not flicker auth controls or disclose private links", () => {
  const state = navbarState(null, true);
  assert.equal(state.loading, true);
  assert.equal(state.showAuthLinks, false);
  assert.equal(state.links.length, 2);
});

test("login/register actions use existing Better Auth API without forwarding confirmation", async () => {
  const calls = [];
  const result = { data: { user: { id: "reader" } } };
  const client = {
    signIn: { email: async values => { calls.push(values); return result; } },
    signUp: { email: async values => { calls.push(values); return result; } },
  };
  await submitAuth(client, "login", { email: "reader@example.com", password: "Abcdef", rememberMe: false });
  assert.equal(calls[0].rememberMe, false);
  await submitAuth(client, "register", { name: "Reader", email: "reader@example.com", password: "Abcdef", confirmPassword: "Abcdef" });
  assert.equal(calls[1].confirmPassword, undefined);
  assert.equal(calls[1].name, "Reader");
});

test("invalid credentials and server failures produce safe messages", async () => {
  const client = { signIn: { email: async () => ({ error: { code: "INVALID_EMAIL_OR_PASSWORD", message: "PRIVATE" } }) } };
  await assert.rejects(submitAuth(client, "login", {}), /email or password is incorrect/);
  assert.ok(!authErrorMessage({ message: "PRIVATE" }).includes("PRIVATE"));
  assert.match(authErrorMessage({ status: 429 }), /Too many/);
});

test("logout invokes Better Auth, and failure is not reported as success", async () => {
  let called = 0;
  await logoutSession({ signOut: async () => { called++; return { data: { success: true } }; } });
  assert.equal(called, 1);
  await assert.rejects(logoutSession({ signOut: async () => ({ error: { message: "PRIVATE" } }) }), /couldn’t sign you out/);
});

test("server guard redirects anonymous, forged, and logged-out sessions; accepts verified session", async () => {
  const store = { user: [], account: [], session: [], verification: [], jwks: [] };
  const origin = "http://localhost:3000";
  const auth = betterAuth(createAuthOptions({
    database: memoryAdapter(store),
    environment: { BETTER_AUTH_URL: origin, BETTER_AUTH_SECRET: randomBytes(48).toString("base64url") },
  }));
  const redirects = [];
  const guard = createSessionGuard(headers => auth.api.getSession({ headers, query: { disableCookieCache: true } }), destination => { redirects.push(destination); return null; });
  await guard("/my-books", new Headers());
  assert.equal(redirects.at(-1), "/login?callbackURL=%2Fmy-books");
  await guard("/profile", new Headers({ Cookie: "better-auth.session_token=forged" }));
  assert.equal(redirects.at(-1), "/login?callbackURL=%2Fprofile");
  const registration = await auth.handler(new Request(`${origin}/api/auth/sign-up/email`, {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Reader", email: "guard@example.com", password: "Abcdef" }),
  }));
  assert.equal(registration.status, 200);
  const cookie = registration.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  const session = await guard("/profile", new Headers({ Cookie: cookie }));
  assert.equal(session.user.email, "guard@example.com");
  await auth.api.signOut({ headers: new Headers({ Cookie: cookie, Origin: origin }) });
  await guard("/my-borrows", new Headers({ Cookie: cookie }));
  assert.equal(redirects.at(-1), "/login?callbackURL=%2Fmy-borrows");
});
