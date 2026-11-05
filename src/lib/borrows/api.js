"use client";
import { authenticatedRequest } from "../api/client";
import { createBorrowsApi } from "./core.js";
export const borrowsApi = createBorrowsApi(authenticatedRequest);
