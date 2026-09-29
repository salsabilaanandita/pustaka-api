import { Router } from "express";
import { getDb } from "../db/store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

// GET /api/reports/summary
// Revenue and unit counts are computed from Completed orders only;
// ordersByStatus counts every order regardless of status.
router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const completed = db.orders.filter((o) => o.status === "Completed");

    const totalRevenue = completed.reduce((sum, o) => sum + o.total, 0);

    const ordersByStatus = ["Pending", "Processing", "Completed", "Cancelled"].map((status) => ({
      status,
      count: db.orders.filter((o) => o.status === status).length,
    }));

    const revenueByCategory = {};
    for (const order of completed) {
      for (const item of order.items) {
        const book = db.books.find((b) => b.id === item.bookId);
        const category = book?.category ?? "unknown";
        revenueByCategory[category] = (revenueByCategory[category] || 0) + item.price * item.qty;
      }
    }
    const salesByCategory = Object.entries(revenueByCategory)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    const dailyMap = {};
    for (const order of completed) {
      const day = order.date.slice(0, 10);
      dailyMap[day] = (dailyMap[day] || 0) + order.total;
    }
    const dailySales = Object.entries(dailyMap)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      totalRevenue,
      totalOrders: db.orders.length,
      completedOrders: completed.length,
      ordersByStatus,
      salesByCategory,
      dailySales,
    });
  })
);

export default router;
