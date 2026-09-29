import { Router } from "express";
import { getDb, persist } from "../db/store.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();
router.use(requireAuth);

function ownsBook(db, userId, bookId) {
  return db.library.some((l) => l.userId === userId && l.bookId === bookId);
}

// GET /api/library  -> purchased books merged with reading progress
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const mine = db.library.filter((l) => l.userId === req.user.id);
    const items = mine
      .map((entry) => {
        const book = db.books.find((b) => b.id === entry.bookId);
        if (!book) return null;
        const progress = db.progress.find((p) => p.userId === req.user.id && p.bookId === entry.bookId);
        return {
          ...book,
          acquiredAt: entry.acquiredAt,
          currentPage: progress?.currentPage ?? 0,
          totalPages: progress?.totalPages ?? book.pages,
          lastRead: progress?.lastRead ?? null,
        };
      })
      .filter(Boolean);
    res.json({ items });
  })
);

// GET /api/library/:bookId/progress
router.get(
  "/:bookId/progress",
  asyncHandler(async (req, res) => {
    const db = getDb();
    if (!ownsBook(db, req.user.id, req.params.bookId)) {
      throw new ApiError(403, "You do not own this book");
    }
    const progress = db.progress.find((p) => p.userId === req.user.id && p.bookId === req.params.bookId);
    res.json({ progress: progress || { bookId: req.params.bookId, currentPage: 0, lastRead: null } });
  })
);

// PUT /api/library/:bookId/progress  { currentPage, totalPages }
router.put(
  "/:bookId/progress",
  asyncHandler(async (req, res) => {
    const { currentPage, totalPages } = req.body || {};
    if (currentPage == null) throw new ApiError(400, "currentPage is required");

    const db = getDb();
    if (!ownsBook(db, req.user.id, req.params.bookId)) {
      throw new ApiError(403, "You do not own this book");
    }

    let progress = db.progress.find((p) => p.userId === req.user.id && p.bookId === req.params.bookId);
    if (!progress) {
      progress = { userId: req.user.id, bookId: req.params.bookId, currentPage: 0, totalPages: totalPages ?? 0 };
      db.progress.push(progress);
    }
    progress.currentPage = Number(currentPage);
    if (totalPages != null) progress.totalPages = Number(totalPages);
    progress.lastRead = new Date().toISOString();

    persist();
    res.json({ progress });
  })
);

export default router;
