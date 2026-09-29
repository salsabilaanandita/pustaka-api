import { Router } from "express";
import { getDb, persist } from "../db/store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

const ROLES = ["user", "staff", "admin"];

// GET /api/users
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = getDb().users.map(({ passwordHash, ...u }) => u);
    res.json({ items });
  })
);

// PATCH /api/users/:id  { role?, isActive? }
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { role, isActive } = req.body || {};
    if (role !== undefined && !ROLES.includes(role)) {
      throw new ApiError(400, `role must be one of: ${ROLES.join(", ")}`);
    }
    if (role === undefined && isActive === undefined) {
      throw new ApiError(400, "Provide role and/or isActive to update");
    }

    const db = getDb();
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) throw new ApiError(404, "User not found");

    if (user.id === req.user.id && role && role !== "admin") {
      throw new ApiError(400, "Admins cannot demote their own account");
    }

    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = Boolean(isActive);
    persist();

    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  })
);

export default router;
