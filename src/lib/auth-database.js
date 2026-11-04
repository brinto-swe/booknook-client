import "server-only";
import { createRequire } from "node:module";
import { isIP } from "node:net";
import { MongoClient } from "mongodb";

const cacheKey = Symbol.for("booknook.auth.mongo");
// Use the native module object: setServers replaces resolver-bound exports,
// which must also be visible to the native driver's CommonJS DNS imports.
const dns = createRequire(import.meta.url)("node:dns");

export function getAuthDatabase() {
  const { MONGODB_URI, DB_NAME, DNS_SERVERS, NODE_ENV } = process.env;
  if (!MONGODB_URI?.trim() || !DB_NAME?.trim()) {
    throw new Error("Authentication MongoDB configuration is missing.");
  }
  // Keep both callback and promise DNS APIs aligned with the explicit override.
  // The native driver resolves Atlas SRV/TXT records through dns.promises.
  if (NODE_ENV !== "production" && DNS_SERVERS !== undefined) {
    const servers = DNS_SERVERS.split(",").map(value => value.trim());
    if (servers.some(value => !isIP(value))) throw new Error("Invalid authentication DNS configuration.");
    if (JSON.stringify(dns.getServers()) !== JSON.stringify(servers)) dns.setServers(servers);
    if (JSON.stringify(dns.promises.getServers()) !== JSON.stringify(servers)) dns.promises.setServers(servers);
  }
  if (!globalThis[cacheKey]) {
    try {
      // The driver connects lazily on first use. Reuse the pool across Next HMR.
      globalThis[cacheKey] = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 15000,
      });
    } catch {
      throw new Error("Invalid authentication MongoDB configuration.");
    }
  }
  const client = globalThis[cacheKey];
  return { client, database: client.db(DB_NAME) };
}

const connectionKey = Symbol.for("booknook.auth.mongo.connection");

export async function connectAuthDatabase() {
  const { client, database } = getAuthDatabase();
  if (!globalThis[connectionKey]) {
    globalThis[connectionKey] = client.connect().catch(() => {
      delete globalThis[connectionKey];
      throw new Error("Authentication database connection failed.");
    });
  }
  await globalThis[connectionKey];
  return database;
}
