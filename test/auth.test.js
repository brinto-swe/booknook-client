import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes } from "node:crypto";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { createLocalJWKSet, jwtVerify } from "jose";
import { createAuthOptions, validatePassword } from "../src/lib/auth-options.js";

const baseURL = "http://localhost:3000";
const environment = { BETTER_AUTH_SECRET: randomBytes(48).toString("base64url"), BETTER_AUTH_URL: baseURL };

test("password requirements", () => {
  for (const password of ["abcde", "abcdef", "ABCDEF", "123456", null]) {
    assert.throws(() => validatePassword(password));
  }
  assert.doesNotThrow(() => validatePassword("Abcdef"));
});

test("Google is optional and configured only when both credentials exist", () => {
  assert.deepEqual(createAuthOptions({ environment }).socialProviders, {});
  assert.deepEqual(createAuthOptions({ environment: { ...environment, GOOGLE_CLIENT_ID: "test-id" } }).socialProviders, {});
  assert.ok(createAuthOptions({ environment: { ...environment, GOOGLE_CLIENT_ID: "test-id", GOOGLE_CLIENT_SECRET: "test-secret" } }).socialProviders.google);
});

test("Better Auth email/password session and JWT flow uses only in-memory data", async (t) => {
  const store = { user: [], account: [], session: [], verification: [], jwks: [] };
  const auth = betterAuth(createAuthOptions({ database: memoryAdapter(store), environment }));
  async function request(path, body, cookie) {
    return auth.handler(new Request(`${baseURL}/api/auth${path}`, {
      method: body ? "POST" : "GET",
      headers: { Origin: baseURL, ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }));
  }
  await t.test("weak registration is rejected before persistence", async () => {
    const response = await request("/sign-up/email", { name: "Reader", email: "reader@example.com", password: "abcdef" });
    assert.equal(response.status, 400);
    assert.equal(store.user.length, 0);
  });
  let cookie;
  let userId;
  await t.test("registration accepts a six-character mixed-case password", async () => {
    const response = await request("/sign-up/email", { name: "Reader", email: "reader@example.com", password: "Abcdef", image: "https://example.com/photo.jpg" });
    assert.equal(response.status, 200);
    const body = await response.json();
    userId = body.user.id;
    cookie = response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
    assert.ok(cookie);
    assert.ok(store.account[0].password && store.account[0].password !== "Abcdef");
  });
  await t.test("session persists across independent requests", async () => {
    const response = await request("/get-session", undefined, cookie);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).user.id, userId);
  });
  await t.test("token is Ed25519, minimal, 15 minutes, and JWKS-verifiable", async () => {
    const response = await request("/token", undefined, cookie);
    assert.equal(response.status, 200);
    const { token } = await response.json();
    const jwksResponse = await request("/jwks");
    const jwks = await jwksResponse.json();
    assert.ok(jwks.keys.every(key => key.crv === "Ed25519" && !key.d));
    const { payload, protectedHeader } = await jwtVerify(token, createLocalJWKSet(jwks), { algorithms: ["EdDSA"], issuer: baseURL, audience: baseURL });
    assert.equal(protectedHeader.alg, "EdDSA");
    assert.equal(payload.sub, userId);
    assert.equal(payload.email, "reader@example.com");
    assert.equal(payload.exp - payload.iat, 900);
    assert.deepEqual(Object.keys(payload).sort(), ["aud", "email", "exp", "iat", "iss", "sub"]);
    assert.ok(store.jwks.length > 0);
    const storedPrivate = JSON.parse(store.jwks[0].privateKey);
    assert.equal(typeof storedPrivate, "string", "private JWK must be stored as encrypted text");
  });
  await t.test("email/password login works without Google configuration", async () => {
    const response = await request("/sign-in/email", { email: "reader@example.com", password: "Abcdef" });
    assert.equal(response.status, 200);
  });
  await t.test("weak password changes are rejected", async () => {
    const response = await request("/change-password", { currentPassword: "Abcdef", newPassword: "abcdef" }, cookie);
    assert.equal(response.status, 400);
  });
  await t.test("logout invalidates the persisted session", async () => {
    const response = await request("/sign-out", {}, cookie);
    assert.equal(response.status, 200);
    const session = await request("/get-session", undefined, cookie);
    assert.equal(await session.json(), null);
  });
});
