import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { pool } from "../src/db/postgres.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, "../src/db/db.json");

function loadJsonDb() {
  if (!fs.existsSync(DB_FILE)) {
    throw new Error(`db.json tidak ditemukan: ${DB_FILE}`);
  }

  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

async function migrate() {
  const db = loadJsonDb();

  console.log("=================================");
  console.log("Starting migration...");
  console.log("=================================");

  /*
   * USERS
   */
  if (Array.isArray(db.users)) {
    for (const user of db.users) {
      await pool.query(
        `
        INSERT INTO users (
          id,
          name,
          email,
          password,
          role,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
        `,
        [
          user.id,
          user.name,
          user.email,
          user.passwordHash,
          user.role,
          user.createdAt || new Date(),
        ]
      );
    }

    console.log(`Users migrated: ${db.users.length}`);
  }

  /*
   * CATEGORIES
   */
  if (Array.isArray(db.categories)) {
    for (const category of db.categories) {
      await pool.query(
        `
        INSERT INTO categories (
          id,
          name,
          slug
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO NOTHING
        `,
        [
          category.id,
          category.name,
          category.slug,
        ]
      );
    }

    console.log(`Categories migrated: ${db.categories.length}`);
  }

  /*
   * BOOKS
   */
  if (Array.isArray(db.books)) {
    for (const book of db.books) {
      await pool.query(
        `
        INSERT INTO books (
          id,
          title,
          author,
          category,
          price,
          stock,
          pages,
          chapters,
          synopsis,
          content,
          cover,
          color,
          added_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, $13
        )
        ON CONFLICT (id) DO NOTHING
        `,
        [
          book.id,
          book.title,
          book.author,
          book.category,
          Number(book.price) || 0,
          Number(book.stock) || 0,
          Number(book.pages) || 0,
          Number(book.chapters) || 1,
          book.synopsis || "",
          book.content || "",
          book.cover || null,
          book.color || null,
          book.addedAt || new Date(),
        ]
      );
    }

    console.log(`Books migrated: ${db.books.length}`);
  }

  console.log("=================================");
  console.log("Migration finished!");
  console.log("=================================");
}

migrate()
  .catch((error) => {
    console.error("Migration failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });