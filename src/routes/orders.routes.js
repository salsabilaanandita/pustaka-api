import { Router } from "express";
import { randomUUID } from "node:crypto";
import { getDb, persist } from "../db/store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();
router.use(requireAuth);

const STATUSES = ["Pending", "Processing", "Completed", "Cancelled"];

// POST /api/orders/checkout  -> creates an order from the current user's cart
router.post(
  "/checkout",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const cartItems = db.cart.filter((c) => c.userId === req.user.id);
    if (cartItems.length === 0) throw new ApiError(400, "Cart is empty");

    // Validate stock before mutating anything.
    for (const item of cartItems) {
      const book = db.books.find((b) => b.id === item.bookId);
      if (!book) throw new ApiError(404, `Book ${item.bookId} no longer exists`);
      if (book.stock < item.qty) throw new ApiError(409, `Not enough stock for "${book.title}"`);
    }

    const items = cartItems.map((item) => {
      const book = db.books.find((b) => b.id === item.bookId);
      book.stock -= item.qty;
      return { bookId: book.id, title: book.title, price: book.price, qty: item.qty };
    });
    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

    const order = {
      id: `o${randomUUID().slice(0, 8)}`,
      userId: req.user.id,
      customerName: req.user.name,
      items,
      total,
      status: "Pending",
      date: new Date().toISOString(),
    };
    db.orders.push(order);

    // Grant library access immediately (digital delivery on purchase).
    for (const item of items) {
      const owned = db.library.some((l) => l.userId === req.user.id && l.bookId === item.bookId);
      if (!owned) {
        db.library.push({ userId: req.user.id, bookId: item.bookId, acquiredAt: order.date, orderId: order.id });
      }
    }

    db.cart = db.cart.filter((c) => c.userId !== req.user.id);
    persist();
    res.status(201).json({ order });
  })
);

// GET /api/orders?status=  (own orders for user, all orders for staff/admin)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const db = getDb();
    let items =
      req.user.role === "user" ? db.orders.filter((o) => o.userId === req.user.id) : [...db.orders];

    if (req.query.status) items = items.filter((o) => o.status === req.query.status);
    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ items });
  })
);

// GET /api/orders/:id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const order = getDb().orders.find((o) => o.id === req.params.id);
    if (!order) throw new ApiError(404, "Order not found");
    if (req.user.role === "user" && order.userId !== req.user.id) {
      throw new ApiError(403, "You cannot view another customer's order");
    }
    res.json({ order });
  })
);

// PATCH /api/orders/:id/status  (staff or admin)  { status }
router.patch(
  "/:id/status",
  requireRole("staff", "admin"),
  asyncHandler(async (req, res) => {
    const { status } = req.body || {};
    if (!STATUSES.includes(status)) {
      throw new ApiError(400, `status must be one of: ${STATUSES.join(", ")}`);
    }

    const db = getDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) throw new ApiError(404, "Order not found");

    // Restock only on the transition INTO Cancelled, and only once.
    if (status === "Cancelled" && order.status !== "Cancelled") {
      for (const item of order.items) {
        const book = db.books.find((b) => b.id === item.bookId);
        if (book) book.stock += item.qty;
      }
    }

    order.status = status;
    persist();
    res.json({ order });
  })
);

export default router;
