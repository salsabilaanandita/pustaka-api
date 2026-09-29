import { verifyToken } from "../utils/jwt.js";
import { getDb } from "../db/store.js";
import { ApiError } from "../utils/ApiError.js";

/** Verifies the Bearer token and attaches the user (without passwordHash) to req.user. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, "Missing or invalid Authorization header"));

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return next(new ApiError(401, "Invalid or expired token"));
  }

  const user = getDb().users.find((u) => u.id === payload.sub);
  if (!user || !user.isActive) return next(new ApiError(401, "Account not found or disabled"));

  const { passwordHash, ...safeUser } = user;
  req.user = safeUser;
  next();
}

/** Restricts a route to one or more roles. Use after requireAuth. */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Not authenticated"));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action"));
    }
    next();
  };
}
