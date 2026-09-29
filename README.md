# Pustaka API

Express REST API for the Pustaka Bookstore app. Data lives in a JSON file
(`src/db/db.json`), auto-created and seeded on first run — no external
database required.

## Setup

```bash
npm install
cp .env.example .env
npm run dev        # or: npm start
```

Server runs on `http://localhost:4000` by default.

To wipe and reseed the data: `npm run db:reset`.

## Demo accounts

| Role  | Email             | Password  |
|-------|-------------------|-----------|
| User  | user@pustaka.id   | demo1234  |
| Staff | staff@pustaka.id  | demo1234  |
| Admin | admin@pustaka.id  | demo1234  |

## Auth

Login returns a JWT. Send it as `Authorization: Bearer <token>` on
protected routes.

| Method | Route             | Access | Notes |
|--------|-------------------|--------|-------|
| POST   | /api/auth/login   | public | `{ email, password }` → `{ token, user }` |
| GET    | /api/auth/me      | any    | current user |
| POST   | /api/auth/logout  | any    | stateless; client should discard the token |

## Books & categories

| Method | Route                    | Access        | Notes |
|--------|--------------------------|---------------|-------|
| GET    | /api/books               | public        | `?q=&category=&minPrice=&maxPrice=&sort=&page=&limit=` |
| GET    | /api/books/:id           | public        | |
| POST   | /api/books               | admin         | |
| PUT    | /api/books/:id           | admin         | full edit |
| PATCH  | /api/books/:id/stock     | staff, admin  | `{ stock }` or `{ delta }` |
| DELETE | /api/books/:id           | admin         | |
| GET    | /api/categories          | public        | includes live `bookCount` |
| POST   | /api/categories          | admin         | |
| PUT    | /api/categories/:id      | admin         | |
| DELETE | /api/categories/:id      | admin         | blocked if books still use it |

## Cart, wishlist, orders

| Method | Route                    | Access | Notes |
|--------|--------------------------|--------|-------|
| GET/POST/PATCH/DELETE | /api/cart      | any    | per-user cart |
| GET/POST/DELETE       | /api/wishlist  | any    | per-user wishlist |
| POST   | /api/orders/checkout     | any           | creates order from cart, decrements stock, grants library access |
| GET    | /api/orders              | any (own for user, all for staff/admin) | `?status=` |
| GET    | /api/orders/:id          | own / staff / admin | |
| PATCH  | /api/orders/:id/status   | staff, admin  | `{ status }`; cancelling restocks items |

## Library & reading progress

| Method | Route                          | Access | Notes |
|--------|---------------------------------|--------|-------|
| GET    | /api/library                    | any    | purchased books + progress |
| GET    | /api/library/:bookId/progress   | any    | 403 if not owned |
| PUT    | /api/library/:bookId/progress   | any    | `{ currentPage, totalPages }` |

## Admin

| Method | Route              | Access | Notes |
|--------|--------------------|--------|-------|
| GET    | /api/users         | admin  | |
| PATCH  | /api/users/:id     | admin  | `{ role, isActive }`; can't demote own account |
| GET    | /api/reports/summary | admin | revenue, orders by status, sales by category, daily sales |

## Notes

- Revenue in `/api/reports/summary` only counts `Completed` orders.
- Login is rate-limited to 5 attempts / 15 min per IP.
- This store uses synchronous file I/O and is meant for development/demo use,
  not concurrent production traffic.
