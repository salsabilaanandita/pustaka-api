import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSeed } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, "db.json");

let cache = null;

/**
 * Loads the database from disk, seeding it on first run.
 * Kept intentionally simple (readFileSync/writeFileSync): this is a small
 * demo store, not a concurrent production database.
 */
export function loadDb() {
  if (cache) return cache;

  if (!fs.existsSync(DB_FILE)) {
    cache = buildSeed();
    persist();
  } else {
    cache = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  }
  return cache;
}

export function getDb() {
  return loadDb();
}

/** Writes the current in-memory db to disk. Call after every mutation. */
export function persist() {
  fs.writeFileSync(DB_FILE, JSON.stringify(cache, null, 2), "utf-8");
}

/** Deletes db.json and reseeds from scratch. Used by scripts/resetDb.js. */
export function resetDb() {
  cache = buildSeed();
  persist();
  return cache;
}
