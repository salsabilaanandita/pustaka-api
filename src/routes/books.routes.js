import { Router } from "express";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { getDb, persist } from "../db/store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();

const uploadsDir = path.resolve("uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const coverUpload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase() || ".jpg";
      callback(null, `cover-${randomUUID()}${extension}`);
    },
  }),
  fileFilter: (req, file, callback) => {
    callback(null, file.mimetype.startsWith("image/"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

function saveCoverDataUrl(value) {
  if (typeof value !== "string" || !value.startsWith("data:image/")) return null;

  const match = value.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) throw new ApiError(400, "Invalid cover image data");

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > 5 * 1024 * 1024) throw new ApiError(413, "Cover image must be 5 MB or smaller");

  const extension = match[1].split("/")[1].replace("jpeg", "jpg");
  const filename = `cover-${randomUUID()}.${extension}`;
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}

function normalizeCover(value) {
  return saveCoverDataUrl(value) || value || null;
}

function withCoverUrl(book, req) {
  if (!book.cover || book.cover.startsWith("http://") || book.cover.startsWith("https://")) return book;
  return { ...book, cover: `${req.protocol}://${req.get("host")}${book.cover}` };
}

// GET /api/books?q=&category=&minPrice=&maxPrice=&sort=&page=&limit=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q, category, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;
    let results = [...getDb().books];

    if (q) {
      const needle = String(q).toLowerCase();
      results = results.filter(
        (b) => b.title.toLowerCase().includes(needle) || b.author.toLowerCase().includes(needle)
      );
    }
    if (category) results = results.filter((b) => b.category === category);
    if (minPrice) results = results.filter((b) => b.price >= Number(minPrice));
    if (maxPrice) results = results.filter((b) => b.price <= Number(maxPrice));

    switch (sort) {
      case "price_asc":
        results.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        results.sort((a, b) => b.price - a.price);
        break;
      case "title":
        results.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "newest":
      default:
        results.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    }

    const total = results.length;
    const p = Math.max(1, Number(page));
    const l = Math.min(50, Math.max(1, Number(limit)));
    const start = (p - 1) * l;
    const items = results.slice(start, start + l).map((book) => withCoverUrl(book, req));

    res.json({ items, total, page: p, limit: l, totalPages: Math.ceil(total / l) });
  })
);

// GET /api/books/:id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const book = getDb().books.find((b) => b.id === req.params.id);
    if (!book) throw new ApiError(404, "Book not found");
    res.json({ book: withCoverUrl(book, req) });
  })
);

// POST /api/books  (admin only)
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  coverUpload.single("cover"),
  asyncHandler(async (req, res) => {
    const { title, author, category, categoryId, price, stock, pages, synopsis, content, cover, color } = req.body || {};
    if (!title || !author || !category && !categoryId || price == null || stock == null) {
      throw new ApiError(400, "title, author, category, price and stock are required");
    }

    const db = getDb();
    const rawCategory = categoryId ?? category;
    const categoryEntry = db.categories.find(
      (c) =>
        c.slug === rawCategory ||
        c.id === rawCategory ||
        c.name.toLowerCase() === String(rawCategory).trim().toLowerCase()
    );

    if (!categoryEntry) {
      throw new ApiError(400, `Unknown category: ${rawCategory}`);
    }

    const book = {
      id: `b${randomUUID().slice(0, 8)}`,
      title,
      author,
      category: categoryEntry.slug,
      price: Number(price),
      stock: Number(stock),
      pages: Number(pages) || 0,
      chapters: Math.max(1, Math.round((Number(pages) || 0) / 25)),
      synopsis: synopsis || "",
      content: content || "",
      cover: req.file ? `/uploads/${req.file.filename}` : normalizeCover(cover),
      color: color || "#5B6B4E",
      addedAt: new Date().toISOString().slice(0, 10),
    };
    db.books.push(book);
    persist();
    res.status(201).json({ book: withCoverUrl(book, req) });
  })
);

// PUT /api/books/:id  (admin only, full edit)
router.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  coverUpload.single("cover"),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const book = db.books.find((b) => b.id === req.params.id);
    if (!book) throw new ApiError(404, "Book not found");

    const editable = ["title", "author", "category", "price", "stock", "pages", "synopsis", "content", "cover", "color"];
    if (req.file) book.cover = `/uploads/${req.file.filename}`;
    else if (req.body?.cover !== undefined) book.cover = normalizeCover(req.body.cover);
    for (const key of editable.filter((key) => key !== "cover")) {
      if (req.body?.[key] !== undefined) book[key] = req.body[key];
    }
    persist();
    res.json({ book: withCoverUrl(book, req) });
  })
);

// PATCH /api/books/:id/stock  (staff or admin)
router.patch(
  "/:id/stock",
  requireAuth,
  requireRole("staff", "admin"),
  asyncHandler(async (req, res) => {
    const { stock, delta } = req.body || {};
    if (stock == null && delta == null) throw new ApiError(400, "Provide either stock or delta");

    const book = getDb().books.find((b) => b.id === req.params.id);
    if (!book) throw new ApiError(404, "Book not found");

    book.stock = stock != null ? Number(stock) : book.stock + Number(delta);
    if (book.stock < 0) throw new ApiError(400, "Stock cannot go below zero");
    persist();
    res.json({ book });
  })
);

// DELETE /api/books/:id  (admin only)
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const idx = db.books.findIndex((b) => b.id === req.params.id);
    if (idx === -1) throw new ApiError(404, "Book not found");
    db.books.splice(idx, 1);
    persist();
    res.status(204).send();
  })
);

export default router;
