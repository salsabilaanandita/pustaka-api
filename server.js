import "dotenv/config";

import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";

import authRoutes from "./src/routes/auth.routes.js";
import booksRoutes from "./src/routes/books.routes.js";
import categoriesRoutes from "./src/routes/categories.routes.js";
import cartRoutes from "./src/routes/cart.routes.js";
import wishlistRoutes from "./src/routes/wishlist.routes.js";
import ordersRoutes from "./src/routes/orders.routes.js";
import libraryRoutes from "./src/routes/library.routes.js";
import usersRoutes from "./src/routes/users.routes.js";
import reportsRoutes from "./src/routes/reports.routes.js";

import { initDb } from "./src/db/store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 4000;

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without Origin header
      // such as Postman, curl, server-to-server, etc.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // During development, allow Vercel preview deployments too.
      if (
        origin.endsWith(".vercel.app") &&
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },
    credentials: true,
  })
);

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(morgan("dev"));

app.use(
  express.json({
    limit: "7mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "7mb",
  })
);

/*
|--------------------------------------------------------------------------
| Static uploads
|--------------------------------------------------------------------------
|
| Local development only.
| Later we will move book covers to Supabase Storage.
|
*/

const uploadsDir = path.join(__dirname, "uploads");

app.use(
  "/uploads",
  express.static(uploadsDir)
);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.json({
    message: "Pustaka API is running",
    status: "ok",
    database: "Supabase PostgreSQL",
  });
});

app.get("/api/health", async (req, res) => {
  res.json({
    status: "ok",
    message: "Pustaka API is running",
    database: "Supabase PostgreSQL",
    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/reports", reportsRoutes);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {
  console.error("=================================");
  console.error("API ERROR");
  console.error(err);
  console.error("=================================");

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    message:
      status === 500
        ? "Internal server error"
        : err.message || "Request failed",
  });
});

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

async function startServer() {
  try {
    console.log("=================================");
    console.log("Starting Pustaka API...");
    console.log("Connecting to Supabase PostgreSQL...");

    await initDb();

    console.log("Supabase PostgreSQL connected!");

    app.listen(PORT, () => {
      console.log(`Pustaka API listening on http://localhost:${PORT}`);
      console.log("=================================");
    });
  } catch (error) {
    console.error("=================================");
    console.error("FAILED TO START API");
    console.error(error);
    console.error("=================================");

    process.exit(1);
  }
}

startServer();