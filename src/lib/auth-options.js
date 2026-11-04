import { APIError, createAuthMiddleware } from "better-auth/api";
import { jwt } from "better-auth/plugins";

export function validatePassword(password) {
  if (typeof password !== "string" || password.length < 6
    || !/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
    throw new APIError("BAD_REQUEST", {
      code: "INVALID_PASSWORD",
      message: "Password must contain at least 6 characters, one uppercase letter, and one lowercase letter.",
    });
  }
}

export function createAuthOptions({ database, environment = process.env }) {
  const { BETTER_AUTH_SECRET, BETTER_AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = environment;
  if (!BETTER_AUTH_SECRET || BETTER_AUTH_SECRET.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be configured with at least 32 characters.");
  }
  let base;
  try { base = new URL(BETTER_AUTH_URL); } catch { throw new Error("Invalid BETTER_AUTH_URL configuration."); }
  if (!["http:", "https:"].includes(base.protocol) || base.origin !== BETTER_AUTH_URL
    || base.username || base.password) throw new Error("Invalid BETTER_AUTH_URL configuration.");

  return {
    appName: "BookNook",
    baseURL: base.origin,
    secret: BETTER_AUTH_SECRET,
    database,
    trustedOrigins: [base.origin],
    emailAndPassword: { enabled: true, minPasswordLength: 6, requireEmailVerification: false },
    socialProviders: GOOGLE_CLIENT_ID?.trim() && GOOGLE_CLIENT_SECRET?.trim() ? {
      google: { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET },
    } : {},
    disabledPaths: ["/request-password-reset", "/reset-password", "/send-verification-email", "/verify-email"],
    hooks: {
      before: createAuthMiddleware(async ctx => {
        if (ctx.path === "/sign-up/email") validatePassword(ctx.body?.password);
        if (["/change-password", "/set-password"].includes(ctx.path)) validatePassword(ctx.body?.newPassword);
      }),
    },
    plugins: [jwt({
      jwt: {
        issuer: base.origin,
        audience: base.origin,
        // Better Auth supplies the standard sub claim from user.id.
        definePayload: ({ user }) => ({ email: user.email }),
      },
    })],
    rateLimit: { enabled: true, window: 60, max: 100 },
    // Driver/provider errors can contain secrets. Do not emit raw library logs.
    logger: { disabled: true },
  };
}
