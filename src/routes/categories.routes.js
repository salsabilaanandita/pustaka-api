import { Router } from "express";
import { randomUUID } from "node:crypto";
import { getDb, persist } from "../db/store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// GET /api/categories  (includes a live book count, handy for the admin table)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const items = db.categories.map((c) => ({
      ...c,
      bookCount: db.books.filter((b) => b.category === c.slug).length,
    }));
    res.json({ items });
  })
);

// POST /api/categories  (admin only)
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { name, slug } = req.body || {};
    if (!name || !String(name).trim()) throw new ApiError(400, "name is required");

    const db = getDb();
    const finalSlug = slug ? slugify(slug) : slugify(name);
    if (!finalSlug) throw new ApiError(400, "Category name must include letters or numbers");
    if (db.categories.some((c) => c.slug === finalSlug)) {
      throw new ApiError(409, "A category with this slug already exists");
    }

    const category = { id: `c${randomUUID().slice(0, 8)}`, name: String(name).trim(), slug: finalSlug };
    db.categories.push(category);
    persist();
    res.status(201).json({ category });
  })
);

// PUT /api/categories/:id  (admin only)
router.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const category = db.categories.find((c) => c.id === req.params.id);
    if (!category) throw new ApiError(404, "Category not found");

    if (req.body?.name !== undefined) {
      const nextName = String(req.body.name).trim();
      if (!nextName) throw new ApiError(400, "name is required");
      category.name = nextName;
    }

    if (req.body?.slug !== undefined) {
      const nextSlug = slugify(String(req.body.slug));
      if (!nextSlug) throw new ApiError(400, "slug must include letters or numbers");
      category.slug = nextSlug;
    }

    if (db.categories.some((c) => c.id !== category.id && c.slug === category.slug)) {
      throw new ApiError(409, "A category with this slug already exists");
    }

    persist();
    res.json({ category });
  })
);

// DELETE /api/categories/:id  (admin only, blocked if books still use it)
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const category = db.categories.find((c) => c.id === req.params.id);
    if (!category) throw new ApiError(404, "Category not found");

    const inUse = db.books.some((b) => b.category === category.slug);
    if (inUse) throw new ApiError(409, "Category still has books assigned to it");

    db.categories = db.categories.filter((c) => c.id !== category.id);
    persist();
    res.status(204).send();
  })
);

export default router;
