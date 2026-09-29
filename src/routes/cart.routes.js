import { Router } from "express";
import { getDb, persist } from "../db/store.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();
router.use(requireAuth);

function withBookDetails(cartItems, books) {
  return cartItems.map((item) => {
    const book = books.find((b) => b.id === item.bookId);
    return {
      bookId: item.bookId,
      qty: item.qty,
      title: book?.title ?? "(removed book)",
      author: book?.author,
      price: book?.price ?? 0,
      cover: book?.cover ?? null,
      color: book?.color,
      stock: book?.stock ?? 0,
      subtotal: (book?.price ?? 0) * item.qty,
    };
  });
}

// GET /api/cart
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const mine = db.cart.filter((c) => c.userId === req.user.id);
    const items = withBookDetails(mine, db.books);
    const total = items.reduce((sum, i) => sum + i.subtotal, 0);
    res.json({ items, total });
  })
);

// POST /api/cart  { bookId, qty }
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { bookId, qty = 1 } = req.body || {};
    if (!bookId) throw new ApiError(400, "bookId is required");

    const db = getDb();
    const book = db.books.find((b) => b.id === bookId);
    if (!book) throw new ApiError(404, "Book not found");

    const existing = db.cart.find((c) => c.userId === req.user.id && c.bookId === bookId);
    if (existing) existing.qty += Number(qty);
    else db.cart.push({ userId: req.user.id, bookId, qty: Number(qty) });

    persist();
    res.status(201).json({ items: withBookDetails(db.cart.filter((c) => c.userId === req.user.id), db.books) });
  })
);

// PATCH /api/cart/:bookId  { qty }
router.patch(
  "/:bookId",
  asyncHandler(async (req, res) => {
    const { qty } = req.body || {};
    if (qty == null || Number(qty) < 1) throw new ApiError(400, "qty must be at least 1");

    const db = getDb();
    const item = db.cart.find((c) => c.userId === req.user.id && c.bookId === req.params.bookId);
    if (!item) throw new ApiError(404, "Item not in cart");

    item.qty = Number(qty);
    persist();
    res.json({ items: withBookDetails(db.cart.filter((c) => c.userId === req.user.id), db.books) });
  })
);

// DELETE /api/cart/:bookId
router.delete(
  "/:bookId",
  asyncHandler(async (req, res) => {
    const db = getDb();
    db.cart = db.cart.filter((c) => !(c.userId === req.user.id && c.bookId === req.params.bookId));
    persist();
    res.status(204).send();
  })
);

// DELETE /api/cart  (clear)
router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const db = getDb();
    db.cart = db.cart.filter((c) => c.userId !== req.user.id);
    persist();
    res.status(204).send();
  })
);

export default router;
