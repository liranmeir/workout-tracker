import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

// Lazily created so `next build` doesn't need a DB connection.
export function db() {
  if (!_db) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _db = drizzle(neon(url), { schema });
  }
  return _db;
}
