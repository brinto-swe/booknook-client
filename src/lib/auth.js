import { betterAuth } from "better-auth";
import "server-only";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { getAuthDatabase } from "./auth-database";
import { createAuthOptions } from "./auth-options";

const { client, database } = getAuthDatabase();

export const auth = betterAuth(createAuthOptions({
  database: mongodbAdapter(database, { client }),
}));
