import { supabase } from "../lib/supabase.js";
import { verifyToken } from "../utils/jwt.js";
import { ApiError } from "../utils/ApiError.js";

/*
|--------------------------------------------------------------------------
| Require Authentication
|--------------------------------------------------------------------------
| Verifies Bearer token and loads the user from Supabase PostgreSQL.
|--------------------------------------------------------------------------
*/

export async function requireAuth(req, res, next) {
  try {
    const header =
      req.headers.authorization || "";

    const token = header.startsWith("Bearer ")
      ? header.slice(7)
      : null;

    if (!token) {
      return next(
        new ApiError(
          401,
          "Missing or invalid Authorization header"
        )
      );
    }

    let payload;

    try {
      payload = verifyToken(token);
    } catch {
      return next(
        new ApiError(
          401,
          "Invalid or expired token"
        )
      );
    }

    if (!payload?.sub) {
      return next(
        new ApiError(
          401,
          "Invalid token payload"
        )
      );
    }

    /*
     * Load user from Supabase PostgreSQL.
     */
    const { data: user, error } =
      await supabase
        .from("users")
        .select(
          "id, name, email, role, avatar"
        )
        .eq("id", payload.sub)
        .maybeSingle();

    if (error) {
      console.error(
        "Supabase auth user lookup error:",
        error
      );

      return next(
        new ApiError(
          500,
          "Failed to verify account"
        )
      );
    }

    if (!user) {
      return next(
        new ApiError(
          401,
          "Account not found or disabled"
        )
      );
    }

    /*
     * Attach safe user information.
     */
    req.user = user;

    next();
  } catch (error) {
    console.error(
      "Authentication middleware error:",
      error
    );

    next(
      new ApiError(
        500,
        "Authentication failed"
      )
    );
  }
}

/*
|--------------------------------------------------------------------------
| Require Role
|--------------------------------------------------------------------------
*/

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new ApiError(
          401,
          "Not authenticated"
        )
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          "You do not have permission to perform this action"
        )
      );
    }

    next();
  };
}