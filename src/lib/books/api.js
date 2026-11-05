"use client";
import { authenticatedRequest } from "../api/client";
import { createBooksApi } from "../api/authenticated-request.js";
export const booksApi = createBooksApi(authenticatedRequest);
