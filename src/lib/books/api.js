"use client";
import { authClient } from "../auth-client";
import { createAuthenticatedRequest, createBooksApi } from "../api/authenticated-request.js";
export const booksApi = createBooksApi(createAuthenticatedRequest(signal => authClient.token({ fetchOptions: { signal } })));
