import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL — check your .env file.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon requires SSL; rejectUnauthorized:false avoids cert-chain issues on
  // local machines while still encrypting the connection.
  ssl: { rejectUnauthorized: false },
  max: 10, // maximum connections in the pool
  idleTimeoutMillis: 30_000, // close idle connections after 30 s
  connectionTimeoutMillis: 5_000, // fail fast if Neon is unreachable
});

export const db = drizzle(pool, { schema });
