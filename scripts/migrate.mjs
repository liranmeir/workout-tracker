// Runs Drizzle migrations against Neon before `next build`.
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.warn("[migrate] DATABASE_URL not set – skipping migrations");
  process.exit(0);
}
await migrate(drizzle(neon(url)), { migrationsFolder: "./drizzle" });
console.log("[migrate] done");
