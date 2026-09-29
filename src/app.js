import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";

import authRoutes from "./routes/auth.routes.js";
import booksRoutes from "./routes/books.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import libraryRoutes from "./routes/library.routes.js";
import usersRoutes from "./routes/users.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import { initDb } from "./db/store.js";

import { notFound, errorHandler } from "./middleware/errorHandler.js";

// ======================================================
// CREATE EXPRESS APP
// ======================================================

const app = express();

// ======================================================
// PATH CONFIGURATION
// ======================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "*",
  })
);

app.use(express.json({ limit: "7mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "7mb",
  })
);

app.use(morgan("dev"));

app.use(async (req, res, next) => {
  try {
    await initDb();
    next();
  } catch (error) {
    next(error);
  }
});

// ======================================================
// STATIC FILES / UPLOADS
// ======================================================

app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "../uploads"))
);

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Pustaka API is running",
  });
});

// ======================================================
// API ROUTES
// ======================================================

app.use("/api/auth", authRoutes);

app.use("/api/books", booksRoutes);

app.use("/api/categories", categoriesRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/wishlist", wishlistRoutes);

app.use("/api/orders", ordersRoutes);

app.use("/api/library", libraryRoutes);

app.use("/api/users", usersRoutes);

app.use("/api/reports", reportsRoutes);

// ======================================================
// ERROR HANDLING
// ======================================================

app.use(notFound);

app.use(errorHandler);

// ======================================================
// EXPORT APP
// ======================================================

export default app;

