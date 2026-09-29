import { Router } from "express";
import { randomUUID } from "node:crypto";

import { getDb, persist } from "../db/store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();

router.use(requireAuth);

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Completed",
  "Cancelled",
];

const PAYMENT_STATUSES = [
  "Pending",
  "Paid",
  "Failed",
];

/*
|--------------------------------------------------------------------------
| Helper
|--------------------------------------------------------------------------
*/

function getQuantity(item) {
  return Number(
    item.quantity ??
      item.qty ??
      0
  );
}

function getOrderDate(order) {
  return (
    order.date ||
    order.createdAt ||
    new Date().toISOString()
  );
}

/*
|--------------------------------------------------------------------------
| POST /api/orders/checkout
|--------------------------------------------------------------------------
| User checkout dari cart.
|
| Hasil awal:
|
| paymentStatus = Pending
| status        = Pending
|
| Library BELUM diberikan.
|--------------------------------------------------------------------------
*/

router.post(
  "/checkout",
  asyncHandler(async (req, res) => {
    const db = getDb();

    const cartItems = db.cart.filter(
      (item) =>
        item.userId === req.user.id
    );

    if (cartItems.length === 0) {
      throw new ApiError(
        400,
        "Cart is empty"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Validasi semua item terlebih dahulu.
    |--------------------------------------------------------------------------
    */

    const preparedItems = [];

    for (const cartItem of cartItems) {
      const book = db.books.find(
        (item) =>
          item.id === cartItem.bookId
      );

      if (!book) {
        throw new ApiError(
          404,
          `Book ${cartItem.bookId} no longer exists`
        );
      }

      const quantity =
        getQuantity(cartItem);

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        throw new ApiError(
          400,
          `Invalid quantity for "${book.title}"`
        );
      }

      if (
        Number(book.stock) <
        quantity
      ) {
        throw new ApiError(
          409,
          `Not enough stock for "${book.title}"`
        );
      }

      preparedItems.push({
        book,
        quantity,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Hitung total
    |--------------------------------------------------------------------------
    */

    const total =
      preparedItems.reduce(
        (sum, item) =>
          sum +
          Number(item.book.price || 0) *
            item.quantity,
        0
      );

    const orderDate =
      new Date().toISOString();

    /*
    |--------------------------------------------------------------------------
    | Buat order
    |--------------------------------------------------------------------------
    */

    const order = {
      id: `o${randomUUID().slice(
        0,
        8
      )}`,

      userId: req.user.id,

      customerName:
        req.user.name ||
        "Customer",

      total,

      /*
      |----------------------------------------------------------------------
      | Status pesanan
      |----------------------------------------------------------------------
      */

      status: "Pending",

      /*
      |----------------------------------------------------------------------
      | Status pembayaran
      |----------------------------------------------------------------------
      */

      paymentStatus: "Pending",

      date: orderDate,

      items: [],
    };

    /*
    |--------------------------------------------------------------------------
    | Kurangi stock + masukkan item order
    |--------------------------------------------------------------------------
    */

    for (const item of preparedItems) {
      const book = item.book;
      const quantity = item.quantity;

      book.stock =
        Number(book.stock) -
        quantity;

      order.items.push({
        id: `oi${randomUUID().slice(
          0,
          8
        )}`,

        bookId: book.id,

        title: book.title,

        price:
          Number(book.price) || 0,

        quantity,

        /*
        | Backward compatibility
        */
        qty: quantity,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Masukkan order ke memory
    |--------------------------------------------------------------------------
    */

    db.orders.push(order);

    /*
    |--------------------------------------------------------------------------
    | Hapus cart user
    |--------------------------------------------------------------------------
    */

    db.cart =
      db.cart.filter(
        (item) =>
          item.userId !==
          req.user.id
      );

    /*
    |--------------------------------------------------------------------------
    | JANGAN masukkan ke library di sini.
    |--------------------------------------------------------------------------
    |
    | Library baru diberikan ketika pembayaran sudah Paid.
    |
    |--------------------------------------------------------------------------
    */

    await persist();

    res.status(201).json({
      order,
    });
  })
);

/*
|--------------------------------------------------------------------------
| GET /api/orders
|--------------------------------------------------------------------------
|
| User:
| hanya order miliknya.
|
| Staff/Admin:
| semua order.
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const db = getDb();

    let items;

    if (
      req.user.role === "user"
    ) {
      items =
        db.orders.filter(
          (order) =>
            order.userId ===
            req.user.id
        );
    } else {
      items = [
        ...db.orders,
      ];
    }

    /*
    |--------------------------------------------------------------------------
    | Filter order status
    |--------------------------------------------------------------------------
    */

    if (req.query.status) {
      items =
        items.filter(
          (order) =>
            order.status ===
            req.query.status
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Filter payment status
    |--------------------------------------------------------------------------
    */

    if (
      req.query.paymentStatus
    ) {
      items =
        items.filter(
          (order) =>
            order.paymentStatus ===
            req.query.paymentStatus
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Terbaru di atas
    |--------------------------------------------------------------------------
    */

    items.sort(
      (a, b) =>
        new Date(
          getOrderDate(b)
        ) -
        new Date(
          getOrderDate(a)
        )
    );

    res.json({
      items,
    });
  })
);

/*
|--------------------------------------------------------------------------
| GET /api/orders/:id
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const order =
      getDb().orders.find(
        (item) =>
          item.id ===
          req.params.id
      );

    if (!order) {
      throw new ApiError(
        404,
        "Order not found"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | User tidak boleh melihat order orang lain
    |--------------------------------------------------------------------------
    */

    if (
      req.user.role === "user" &&
      order.userId !==
        req.user.id
    ) {
      throw new ApiError(
        403,
        "You cannot view another customer's order"
      );
    }

    res.json({
      order,
    });
  })
);

/*
|--------------------------------------------------------------------------
| PATCH /api/orders/:id/payment
|--------------------------------------------------------------------------
|
| Staff/Admin mengubah status pembayaran.
|
| Pending -> Paid
| Pending -> Failed
|
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/payment",
  requireRole(
    "staff",
    "admin"
  ),

  asyncHandler(async (req, res) => {
    const {
      paymentStatus,
    } = req.body || {};

    /*
    |--------------------------------------------------------------------------
    | Validasi payment status
    |--------------------------------------------------------------------------
    */

    if (
      !PAYMENT_STATUSES.includes(
        paymentStatus
      )
    ) {
      throw new ApiError(
        400,
        `paymentStatus must be one of: ${PAYMENT_STATUSES.join(
          ", "
        )}`
      );
    }

    const db = getDb();

    const order =
      db.orders.find(
        (item) =>
          item.id ===
          req.params.id
      );

    if (!order) {
      throw new ApiError(
        404,
        "Order not found"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Jangan bayar order yang sudah cancelled
    |--------------------------------------------------------------------------
    */

    if (
      order.status ===
        "Cancelled" &&
      paymentStatus ===
        "Paid"
    ) {
      throw new ApiError(
        400,
        "Cancelled order cannot be marked as paid"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Jangan proses payment berulang
    |--------------------------------------------------------------------------
    */

    if (
      order.paymentStatus ===
        "Paid" &&
      paymentStatus ===
        "Paid"
    ) {
      res.json({
        order,
      });

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Update payment status
    |--------------------------------------------------------------------------
    */

    order.paymentStatus =
      paymentStatus;

    /*
    |--------------------------------------------------------------------------
    | PAYMENT PAID
    |--------------------------------------------------------------------------
    |
    | Pending + Paid
    |       ↓
    | Processing
    |--------------------------------------------------------------------------
    */

    if (
      paymentStatus ===
        "Paid" &&
      order.status ===
        "Pending"
    ) {
      order.status =
        "Processing";
    }

    /*
    |--------------------------------------------------------------------------
    | PAYMENT FAILED
    |--------------------------------------------------------------------------
    |
    | Pending + Failed
    |       ↓
    | Cancelled
    |
    | Stock dikembalikan.
    |--------------------------------------------------------------------------
    */

    if (
      paymentStatus ===
        "Failed" &&
      order.status ===
        "Pending"
    ) {
      order.status =
        "Cancelled";

      for (
        const item of
          order.items || []
      ) {
        const book =
          db.books.find(
            (bookItem) =>
              bookItem.id ===
              item.bookId
          );

        if (book) {
          const quantity =
            getQuantity(item);

          book.stock =
            Number(book.stock) +
            quantity;
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | PAYMENT PAID -> LIBRARY
    |--------------------------------------------------------------------------
    */

    if (
      paymentStatus ===
      "Paid"
    ) {
      for (
        const item of
          order.items || []
      ) {
        const exists =
          db.library.some(
            (libraryItem) =>
              libraryItem.userId ===
                order.userId &&
              libraryItem.bookId ===
                item.bookId
          );

        if (!exists) {
          db.library.push({
            id: `l${randomUUID().slice(
              0,
              8
            )}`,

            userId:
              order.userId,

            bookId:
              item.bookId,

            acquiredAt:
              getOrderDate(order),

            orderId:
              order.id,

            progress: 0,
          });
        }
      }
    }

    await persist();

    res.json({
      order,
    });
  })
);

/*
|--------------------------------------------------------------------------
| PATCH /api/orders/:id/status
|--------------------------------------------------------------------------
|
| Staff/Admin mengubah STATUS PESANAN.
|
| Processing -> Completed
| Pending    -> Cancelled
|
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/status",
  requireRole(
    "staff",
    "admin"
  ),

  asyncHandler(async (req, res) => {
    const {
      status,
    } = req.body || {};

    /*
    |--------------------------------------------------------------------------
    | Validasi
    |--------------------------------------------------------------------------
    */

    if (
      !ORDER_STATUSES.includes(
        status
      )
    ) {
      throw new ApiError(
        400,
        `status must be one of: ${ORDER_STATUSES.join(
          ", "
        )}`
      );
    }

    const db = getDb();

    const order =
      db.orders.find(
        (item) =>
          item.id ===
          req.params.id
      );

    if (!order) {
      throw new ApiError(
        404,
        "Order not found"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Completed hanya setelah pembayaran Paid
    |--------------------------------------------------------------------------
    */

    if (
      status ===
        "Completed" &&
      order.paymentStatus !==
        "Paid"
    ) {
      throw new ApiError(
        400,
        "Order cannot be completed before payment is confirmed"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Processing hanya setelah pembayaran Paid
    |--------------------------------------------------------------------------
    */

    if (
      status ===
        "Processing" &&
      order.paymentStatus !==
        "Paid"
    ) {
      throw new ApiError(
        400,
        "Order cannot be processed before payment is confirmed"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Cancelled
    |--------------------------------------------------------------------------
    |
    | Stock dikembalikan satu kali.
    |--------------------------------------------------------------------------
    */

    if (
      status ===
        "Cancelled" &&
      order.status !==
        "Cancelled"
    ) {
      for (
        const item of
          order.items || []
      ) {
        const book =
          db.books.find(
            (bookItem) =>
              bookItem.id ===
              item.bookId
          );

        if (book) {
          const quantity =
            getQuantity(item);

          book.stock =
            Number(book.stock) +
            quantity;
        }
      }
    }

    order.status =
      status;

    await persist();

    res.json({
      order,
    });
  })
);

export default router;