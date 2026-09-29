import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import rateLimit from "express-rate-limit";
import { getDb, persist } from "../db/store.js";
import { signToken } from "../utils/jwt.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "too_many_requests", message: "Too many login attempts. Try again later." } },
});

// POST /api/auth/register
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      throw new ApiError(400, "Name, email and password are required");
    }

    if (String(password).length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters");
    }

    const db = getDb();
    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      throw new ApiError(409, "Email already registered");
    }

    const user = {
      id: `u${randomUUID().slice(0, 8)}`,
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: bcrypt.hashSync(password, 10),
      role: "user",
      isActive: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    db.users.push(user);
    persist();

    const token = signToken(user);
    const { passwordHash, ...safeUser } = user;
    res.status(201).json({ token, user: safeUser });
  })
);

// POST /api/auth/login
router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) throw new ApiError(400, "Email and password are required");

    const user = getDb().users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (!user || !user.isActive || !bcrypt.compareSync(password, user.passwordHash)) {
      throw new ApiError(401, "Invalid email or password");
    }

    const token = signToken(user);
    const { passwordHash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  })
);

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
// The API is stateless (JWT); logout is a client-side token discard.
// This endpoint exists so the frontend has a symmetrical call to make.
router.post("/logout", requireAuth, (req, res) => {
  res.json({ ok: true });
});

export default router;
