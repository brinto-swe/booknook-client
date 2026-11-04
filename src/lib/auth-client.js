"use client";

import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

// Same-origin auth routes; private environment configuration stays on the server.
export const authClient = createAuthClient({ plugins: [jwtClient()] });
