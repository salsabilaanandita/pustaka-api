import bcrypt from "bcryptjs";

const hash = (plain) => bcrypt.hashSync(plain, 10);

export function buildSeed() {
  return {
    users: [
      {
        id: "u-admin",
        name: "Admin Pustaka",
        email: "admin@pustaka.id",
        passwordHash: hash("demo1234"),
        role: "admin",
        isActive: true,
        createdAt: "2026-09-26",
      },
      {
        id: "u-staff",
        name: "Staff Pustaka",
        email: "staff@pustaka.id",
        passwordHash: hash("demo1234"),
        role: "staff",
        isActive: true,
        createdAt: "2026-09-26",
      },
    ],
    categories: [],
    books: [],
    orders: [],
    cart: [],
    wishlist: [],
    progress: [],
    library: [],
  };
}
