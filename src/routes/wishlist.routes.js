import { Router } from "express";
import { getDb, persist } from "../db/store.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();
router.use(requireAuth);

// GET /api/wishlist
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const mine = db.wishlist.filter((w) => w.userId === req.user.id);
    const items = mine
      .map((w) => db.books.find((b) => b.id === w.bookId))
      .filter(Boolean);
    res.json({ items });
  })
);

// POST /api/wishlist  { bookId }
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { bookId } = req.body || {};
    if (!bookId) throw new ApiError(400, "bookId is required");

    const db = getDb();
    if (!db.books.some((b) => b.id === bookId)) throw new ApiError(404, "Book not found");

    const already = db.wishlist.some((w) => w.userId === req.user.id && w.bookId === bookId);
    if (!already) {
      db.wishlist.push({ userId: req.user.id, bookId, addedAt: new Date().toISOString() });
      persist();
    }
    res.status(201).json({ ok: true });
  })
);

// DELETE /api/wishlist/:bookId
router.delete(
  "/:bookId",
  asyncHandler(async (req, res) => {
    const db = getDb();
    db.wishlist = db.wishlist.filter((w) => !(w.userId === req.user.id && w.bookId === req.params.bookId));
    persist();
    res.status(204).send();
  })
);

export default router;
