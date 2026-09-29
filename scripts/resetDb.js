import "dotenv/config";
import { resetDb } from "../src/db/store.js";

resetDb();
console.log("Database reset and reseeded.");
