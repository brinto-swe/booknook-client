"use client";
import { authClient } from "../auth-client";
import { createAuthenticatedRequest } from "./authenticated-request.js";
export const authenticatedRequest = createAuthenticatedRequest(signal => authClient.token({ fetchOptions: { signal } }));
