// src/db/store.js

import pg from "pg";
import { randomUUID } from "node:crypto";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL belum ditemukan. Tambahkan DATABASE_URL pada Environment Variables hosting atau file .env lokal."
  );
}

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false,
  },
});

let cache = null;

/*
|--------------------------------------------------------------------------
| INIT DATABASE
|--------------------------------------------------------------------------
*/

export async function initDb() {
  if (cache) {
    return cache;
  }

  const client =
    await pool.connect();

  try {
    console.log(
      "================================="
    );

    console.log(
      "Loading database from Supabase..."
    );

    /*
    |--------------------------------------------------------------------------
    | USERS
    |--------------------------------------------------------------------------
    */

    const usersResult =
      await client.query(`
        SELECT
          id,
          name,
          email,
          password AS "passwordHash",
          role,
          avatar,
          created_at AS "createdAt"
        FROM users
        ORDER BY created_at
      `);

    /*
    |--------------------------------------------------------------------------
    | CATEGORIES
    |--------------------------------------------------------------------------
    */

    const categoriesResult =
      await client.query(`
        SELECT
          id,
          name,
          slug
        FROM categories
        ORDER BY name
      `);

    /*
    |--------------------------------------------------------------------------
    | BOOKS
    |--------------------------------------------------------------------------
    */

    const booksResult =
      await client.query(`
        SELECT
          id,
          title,
          author,
          category,
          price,
          stock,
          pages,
          chapters,
          synopsis,
          content,
          cover,
          color,
          added_at AS "addedAt"
        FROM books
        ORDER BY added_at DESC
      `);

    /*
    |--------------------------------------------------------------------------
    | CART
    |--------------------------------------------------------------------------
    */

    const cartResult =
      await client.query(`
        SELECT
          id,
          user_id AS "userId",
          book_id AS "bookId",
          quantity
        FROM cart
      `);

    /*
    |--------------------------------------------------------------------------
    | WISHLIST
    |--------------------------------------------------------------------------
    */

    const wishlistResult =
      await client.query(`
        SELECT
          id,
          user_id AS "userId",
          book_id AS "bookId",
          created_at AS "createdAt"
        FROM wishlist
      `);

    /*
    |--------------------------------------------------------------------------
    | LIBRARY
    |--------------------------------------------------------------------------
    */

    const libraryResult =
      await client.query(`
        SELECT
          id,
          user_id AS "userId",
          book_id AS "bookId",
          progress,
          created_at AS "createdAt"
        FROM library
      `);

    /*
    |--------------------------------------------------------------------------
    | ORDERS
    |--------------------------------------------------------------------------
    */

    const ordersResult =
      await client.query(`
        SELECT
          id,
          user_id AS "userId",
          customer_name AS "customerName",
          total,
          status,
          payment_status AS "paymentStatus",
          created_at AS "createdAt"
        FROM orders
        ORDER BY created_at DESC
      `);

    /*
    |--------------------------------------------------------------------------
    | ORDER ITEMS
    |--------------------------------------------------------------------------
    */

    const orderItemsResult =
      await client.query(`
        SELECT
          id,
          order_id AS "orderId",
          book_id AS "bookId",
          title,
          quantity,
          price
        FROM order_items
      `);

    /*
    |--------------------------------------------------------------------------
    | Gabungkan order items ke orders
    |--------------------------------------------------------------------------
    */

    const orders =
      ordersResult.rows.map(
        (order) => ({
          ...order,

          /*
          | Backward compatibility
          */
          date:
            order.createdAt,

          paymentStatus:
            order.paymentStatus ||
            "Pending",

          items:
            orderItemsResult.rows
              .filter(
                (item) =>
                  item.orderId ===
                  order.id
              )
              .map(
                (item) => ({
                  id: item.id,

                  bookId:
                    item.bookId,

                  title:
                    item.title ||
                    "",

                  price:
                    Number(
                      item.price
                    ) || 0,

                  quantity:
                    Number(
                      item.quantity
                    ) || 0,

                  qty:
                    Number(
                      item.quantity
                    ) || 0,
                })
              ),
        })
      );

    /*
    |--------------------------------------------------------------------------
    | CACHE
    |--------------------------------------------------------------------------
    */

    cache = {
      users:
        usersResult.rows,

      categories:
        categoriesResult.rows,

      books:
        booksResult.rows,

      cart:
        cartResult.rows,

      wishlist:
        wishlistResult.rows,

      library:
        libraryResult.rows,

      orders,

      order_items:
        orderItemsResult.rows,

      progress: [],
    };

    console.log(
      "Supabase database loaded!"
    );

    console.log(
      `Users: ${cache.users.length}`
    );

    console.log(
      `Categories: ${cache.categories.length}`
    );

    console.log(
      `Books: ${cache.books.length}`
    );

    console.log(
      `Cart: ${cache.cart.length}`
    );

    console.log(
      `Wishlist: ${cache.wishlist.length}`
    );

    console.log(
      `Library: ${cache.library.length}`
    );

    console.log(
      `Orders: ${cache.orders.length}`
    );

    console.log(
      `Order items: ${cache.order_items.length}`
    );

    console.log(
      "================================="
    );

    return cache;
  } finally {
    client.release();
  }
}

/*
|--------------------------------------------------------------------------
| GET DB
|--------------------------------------------------------------------------
*/

export function getDb() {
  if (!cache) {
    throw new Error(
      "Database belum diinisialisasi. Jalankan initDb() terlebih dahulu."
    );
  }

  return cache;
}

/*
|--------------------------------------------------------------------------
| PERSIST
|--------------------------------------------------------------------------
*/

export async function persist() {
  if (!cache) {
    throw new Error(
      "Database belum diinisialisasi."
    );
  }

  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    /*
    |--------------------------------------------------------------------------
    | USERS
    |--------------------------------------------------------------------------
    */

    for (
      const user of cache.users
    ) {
      await client.query(
        `
        INSERT INTO users (
          id,
          name,
          email,
          password,
          role,
          avatar,
          created_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
        ON CONFLICT (id)
        DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          password = EXCLUDED.password,
          role = EXCLUDED.role,
          avatar = EXCLUDED.avatar
        `,
        [
          user.id,

          user.name,

          user.email,

          user.passwordHash ||
            user.password,

          user.role,

          user.avatar ||
            null,

          user.createdAt ||
            new Date(),
        ]
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CATEGORIES
    |--------------------------------------------------------------------------
    */

    for (
      const category of
        cache.categories
    ) {
      await client.query(
        `
        INSERT INTO categories (
          id,
          name,
          slug
        )
        VALUES (
          $1,
          $2,
          $3
        )
        ON CONFLICT (id)
        DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug
        `,
        [
          category.id,

          category.name,

          category.slug,
        ]
      );
    }

    /*
    |--------------------------------------------------------------------------
    | BOOKS
    |--------------------------------------------------------------------------
    */

    for (
      const book of cache.books
    ) {
      await client.query(
        `
        INSERT INTO books (
          id,
          title,
          author,
          category,
          price,
          stock,
          pages,
          chapters,
          synopsis,
          content,
          cover,
          color,
          added_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13
        )
        ON CONFLICT (id)
        DO UPDATE SET
          title = EXCLUDED.title,
          author = EXCLUDED.author,
          category = EXCLUDED.category,
          price = EXCLUDED.price,
          stock = EXCLUDED.stock,
          pages = EXCLUDED.pages,
          chapters = EXCLUDED.chapters,
          synopsis = EXCLUDED.synopsis,
          content = EXCLUDED.content,
          cover = EXCLUDED.cover,
          color = EXCLUDED.color
        `,
        [
          book.id,

          book.title,

          book.author,

          book.category,

          Number(
            book.price
          ) || 0,

          Number(
            book.stock
          ) || 0,

          Number(
            book.pages
          ) || 0,

          Number(
            book.chapters
          ) || 0,

          book.synopsis ||
            "",

          book.content ||
            "",

          book.cover ||
            null,

          book.color ||
            null,

          book.addedAt ||
            new Date(),
        ]
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ORDERS
    |--------------------------------------------------------------------------
    */

    for (
      const order of cache.orders
    ) {
      await client.query(
        `
        INSERT INTO orders (
          id,
          user_id,
          customer_name,
          total,
          status,
          payment_status,
          created_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
        ON CONFLICT (id)
        DO UPDATE SET
          customer_name =
            EXCLUDED.customer_name,

          total =
            EXCLUDED.total,

          status =
            EXCLUDED.status,

          payment_status =
            EXCLUDED.payment_status
        `,
        [
          order.id,

          order.userId,

          order.customerName ||
            null,

          Number(
            order.total
          ) || 0,

          order.status ||
            "Pending",

          order.paymentStatus ||
            "Pending",

          order.date ||
            order.createdAt ||
            new Date(),
        ]
      );

      /*
      |--------------------------------------------------------------------------
      | ORDER ITEMS
      |--------------------------------------------------------------------------
      */

      for (
        const item of
          order.items || []
      ) {
        const itemId =
          item.id ||
          `oi${randomUUID().slice(
            0,
            8
          )}`;

        const quantity =
          Number(
            item.quantity ??
              item.qty ??
              0
          );

        await client.query(
          `
          INSERT INTO order_items (
            id,
            order_id,
            book_id,
            title,
            quantity,
            price
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )
          ON CONFLICT (id)
          DO UPDATE SET
            title =
              EXCLUDED.title,

            quantity =
              EXCLUDED.quantity,

            price =
              EXCLUDED.price
          `,
          [
            itemId,

            order.id,

            item.bookId,

            item.title ||
              "",

            quantity,

            Number(
              item.price
            ) || 0,
          ]
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | CART
    |--------------------------------------------------------------------------
    */

    for (
      const item of cache.cart
    ) {
      await client.query(
        `
        INSERT INTO cart (
          id,
          user_id,
          book_id,
          quantity
        )
        VALUES (
          $1,
          $2,
          $3,
          $4
        )
        ON CONFLICT (id)
        DO UPDATE SET
          quantity =
            EXCLUDED.quantity
        `,
        [
          item.id ||
            `c${randomUUID().slice(
              0,
              8
            )}`,

          item.userId,

          item.bookId,

          Number(
            item.quantity ??
              item.qty ??
              1
          ),
        ]
      );
    }

    /*
    |--------------------------------------------------------------------------
    | WISHLIST
    |--------------------------------------------------------------------------
    */

    for (
      const item of
        cache.wishlist
    ) {
      await client.query(
        `
        INSERT INTO wishlist (
          id,
          user_id,
          book_id,
          created_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4
        )
        ON CONFLICT (id)
        DO UPDATE SET
          book_id =
            EXCLUDED.book_id
        `,
        [
          item.id ||
            `w${randomUUID().slice(
              0,
              8
            )}`,

          item.userId,

          item.bookId,

          item.createdAt ||
            new Date(),
        ]
      );
    }

    /*
    |--------------------------------------------------------------------------
    | LIBRARY
    |--------------------------------------------------------------------------
    */

    for (
      const item of
        cache.library
    ) {
      await client.query(
        `
        INSERT INTO library (
          id,
          user_id,
          book_id,
          progress,
          created_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        ON CONFLICT (id)
        DO UPDATE SET
          progress =
            EXCLUDED.progress
        `,
        [
          item.id ||
            `l${randomUUID().slice(
              0,
              8
            )}`,

          item.userId,

          item.bookId,

          Number(
            item.progress
          ) || 0,

          item.acquiredAt ||
            item.createdAt ||
            new Date(),
        ]
      );
    }

    /*
    |--------------------------------------------------------------------------
    | COMMIT
    |--------------------------------------------------------------------------
    */

    await client.query(
      "COMMIT"
    );

    return true;
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    console.error(
      "Database persist error:",
      error
    );

    throw error;
  } finally {
    client.release();
  }
}

/*
|--------------------------------------------------------------------------
| RESET DB
|--------------------------------------------------------------------------
*/

export async function resetDb() {
  throw new Error(
    "resetDb() dinonaktifkan karena aplikasi sekarang menggunakan Supabase PostgreSQL."
  );
}

/*
|--------------------------------------------------------------------------
| EXPORT POOL
|--------------------------------------------------------------------------
*/

export {
  pool,
};