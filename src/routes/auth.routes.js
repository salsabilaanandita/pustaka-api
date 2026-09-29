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
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "too_many_requests",
      message: "Too many login attempts. Try again later.",
    },
  },
});

// ================================
// REGISTER
// ================================
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      throw new ApiError(
        400,
        "Name, email and password are required"
      );
    }

    if (String(password).length < 6) {
      throw new ApiError(
        400,
        "Password must be at least 6 characters"
      );
    }

    const db = getDb();

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const existingUser = db.users.find(
      (u) =>
        String(u.email).trim().toLowerCase() ===
        normalizedEmail
    );

    if (existingUser) {
      throw new ApiError(
        409,
        "Email already registered"
      );
    }

    const passwordHash = bcrypt.hashSync(
      String(password),
      10
    );

    const user = {
      id: `u${randomUUID().slice(0, 8)}`,
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: "user",
      isActive: true,
      createdAt: new Date()
        .toISOString()
        .slice(0, 10),
    };

    db.users.push(user);

    await persist();

    const token = signToken(user);

    const {
      passwordHash: _passwordHash,
      ...safeUser
    } = user;

    res.status(201).json({
      token,
      user: safeUser,
    });
  })
);

// ================================
// LOGIN
// ================================
router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};

    console.log("========== LOGIN ==========");
    console.log("Email:", email);
    console.log("Password received:", !!password);

    if (!email || !password) {
      throw new ApiError(
        400,
        "Email and password are required"
      );
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const db = getDb();

    console.log(
      "Users in DB:",
      db.users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        hasPasswordHash: !!u.passwordHash,
        hashLength: u.passwordHash?.length,
      }))
    );

    const user = db.users.find(
      (u) =>
        String(u.email).trim().toLowerCase() ===
        normalizedEmail
    );

    console.log(
      "User found:",
      user
        ? {
            id: user.id,
            email: user.email,
            role: user.role,
            hasPasswordHash: !!user.passwordHash,
          }
        : null
    );

    if (!user) {
      console.log("LOGIN FAILED: USER NOT FOUND");

      throw new ApiError(
        401,
        "Invalid email or password"
      );
    }

    if (user.isActive === false) {
      console.log("LOGIN FAILED: USER INACTIVE");

      throw new ApiError(
        401,
        "Account is inactive"
      );
    }

    // Support both possible field names
    const passwordHash =
      user.passwordHash ||
      user.password ||
      null;

    console.log(
      "Password hash exists:",
      !!passwordHash
    );

    console.log(
      "Password hash length:",
      passwordHash?.length
    );

    if (!passwordHash) {
      console.log(
        "LOGIN FAILED: PASSWORD HASH NOT FOUND"
      );

      throw new ApiError(
        401,
        "Invalid email or password"
      );
    }

    const passwordMatch = bcrypt.compareSync(
      String(password),
      String(passwordHash)
    );

    console.log(
      "Password match:",
      passwordMatch
    );

    if (!passwordMatch) {
      console.log(
        "LOGIN FAILED: PASSWORD DOES NOT MATCH"
      );

      throw new ApiError(
        401,
        "Invalid email or password"
      );
    }

    const token = signToken(user);

    const {
      passwordHash: _passwordHash,
      password: _password,
      ...safeUser
    } = user;

    console.log(
      "LOGIN SUCCESS:",
      safeUser.email
    );

    console.log("===========================");

    res.json({
      token,
      user: safeUser,
    });
  })
);

// ================================
// ME
// ================================
router.get(
  "/me",
  requireAuth,
  (req, res) => {
    res.json({
      user: req.user,
    });
  }
);

// ================================
// LOGOUT
// ================================
router.post(
  "/logout",
  requireAuth,
  (req, res) => {
    res.json({
      ok: true,
    });
  }
);

export default router;