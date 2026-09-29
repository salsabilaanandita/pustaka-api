import { Router } from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import multer from "multer";

import { supabase, STORAGE_BUCKET } from "../lib/supabase.js";
import { getDb, persist } from "../db/store.js";
import {
  requireAuth,
  requireRole,
} from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| MULTER
|--------------------------------------------------------------------------
| File cover disimpan sementara di memory.
| Setelah itu langsung di-upload ke Supabase Storage.
|--------------------------------------------------------------------------
*/

const coverUpload = multer({
  storage: multer.memoryStorage(),

  fileFilter: (req, file, callback) => {
    if (!file?.mimetype?.startsWith("image/")) {
      return callback(
        new ApiError(
          400,
          "Cover must be an image file"
        )
      );
    }

    callback(null, true);
  },

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/*
|--------------------------------------------------------------------------
| HELPER: EXTENSION
|--------------------------------------------------------------------------
*/

function getFileExtension(file) {
  const originalExtension = path
    .extname(file.originalname || "")
    .toLowerCase();

  if (originalExtension) {
    if (originalExtension === ".jpeg") {
      return ".jpg";
    }

    return originalExtension;
  }

  const mimeMap = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
  };

  return mimeMap[file.mimetype] || ".jpg";
}

/*
|--------------------------------------------------------------------------
| HELPER: UPLOAD COVER KE SUPABASE STORAGE
|--------------------------------------------------------------------------
*/

async function uploadCover(file) {
  if (!file) {
    return null;
  }

  const extension = getFileExtension(file);

  const filename = `cover-${randomUUID()}${extension}`;

  console.log("Uploading cover:");
  console.log({
    filename,
    mimetype: file.mimetype,
    size: file.size,
  });

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    console.error(
      "Supabase Storage upload error:",
      error
    );

    throw new ApiError(
      500,
      `Failed to upload cover: ${error.message}`
    );
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filename);

  if (!data?.publicUrl) {
    throw new ApiError(
      500,
      "Failed to generate public cover URL"
    );
  }

  console.log(
    "Cover uploaded successfully:",
    data.publicUrl
  );

  return data.publicUrl;
}

/*
|--------------------------------------------------------------------------
| HELPER: AMBIL PATH FILE DARI SUPABASE URL
|--------------------------------------------------------------------------
*/

function extractStoragePath(coverUrl) {
  if (
    !coverUrl ||
    typeof coverUrl !== "string"
  ) {
    return null;
  }

  /*
   * Cover local lama.
   */
  if (
    coverUrl.startsWith("/uploads/") ||
    coverUrl.includes("/uploads/")
  ) {
    return null;
  }

  /*
   * Cover base64 lama.
   */
  if (
    coverUrl.startsWith("data:image/")
  ) {
    return null;
  }

  /*
   * URL Supabase:
   *
   * https://xxxx.supabase.co/storage/v1/object/public/book-covers/cover-xxx.jpg
   */

  const marker =
    `/storage/v1/object/public/${STORAGE_BUCKET}/`;

  const index = coverUrl.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return decodeURIComponent(
    coverUrl.substring(
      index + marker.length
    )
  );
}

/*
|--------------------------------------------------------------------------
| HELPER: DELETE COVER SUPABASE
|--------------------------------------------------------------------------
*/

async function deleteCover(coverUrl) {
  const storagePath =
    extractStoragePath(coverUrl);

  if (!storagePath) {
    return;
  }

  console.log(
    "Deleting old cover:",
    storagePath
  );

  const { error } =
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

  if (error) {
    console.error(
      "Supabase Storage delete error:",
      error
    );

    /*
     * Jangan gagalkan proses utama
     * hanya karena delete file gagal.
     */
  }
}

/*
|--------------------------------------------------------------------------
| HELPER: NORMALIZE COVER URL
|--------------------------------------------------------------------------
*/

function withCoverUrl(book, req) {
  if (!book) {
    return book;
  }

  if (!book.cover) {
    return {
      ...book,
      cover: null,
    };
  }

  const cover = String(book.cover).trim();

  /*
   * ================================================================
   * 1. BASE64
   * ================================================================
   *
   * Kalau masih ada cover lama berbentuk:
   *
   * data:image/jpeg;base64,...
   *
   * langsung kembalikan.
   *
   * Browser sebenarnya bisa menampilkan ini.
   */

  if (cover.startsWith("data:image/")) {
    return {
      ...book,
      cover,
    };
  }

  /*
   * ================================================================
   * 2. SUPABASE STORAGE
   * ================================================================
   */

  if (
    cover.startsWith("https://") ||
    cover.startsWith("http://")
  ) {
    return {
      ...book,
      cover,
    };
  }

  /*
   * ================================================================
   * 3. LOCAL UPLOADS
   * ================================================================
   *
   * Untuk data lama:
   *
   * /uploads/xxx.jpg
   */

  if (cover.startsWith("/uploads/")) {
    return {
      ...book,
      cover: `${req.protocol}://${req.get(
        "host"
      )}${cover}`,
    };
  }

  /*
   * ================================================================
   * 4. FALLBACK
   * ================================================================
   */

  return {
    ...book,
    cover,
  };
}

/*
|--------------------------------------------------------------------------
| GET /api/books
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 20,
    } = req.query;

    let results = [
      ...getDb().books,
    ];

    /*
     * SEARCH
     */

    if (q) {
      const needle = String(
        q
      ).toLowerCase();

      results = results.filter(
        (book) =>
          String(
            book.title || ""
          )
            .toLowerCase()
            .includes(needle) ||
          String(
            book.author || ""
          )
            .toLowerCase()
            .includes(needle)
      );
    }

    /*
     * CATEGORY
     */

    if (category) {
      results = results.filter(
        (book) =>
          String(
            book.category || ""
          ).toLowerCase() ===
          String(category).toLowerCase()
      );
    }

    /*
     * MIN PRICE
     */

    if (minPrice) {
      results = results.filter(
        (book) =>
          Number(book.price) >=
          Number(minPrice)
      );
    }

    /*
     * MAX PRICE
     */

    if (maxPrice) {
      results = results.filter(
        (book) =>
          Number(book.price) <=
          Number(maxPrice)
      );
    }

    /*
     * SORT
     */

    switch (sort) {
      case "price_asc":
        results.sort(
          (a, b) =>
            Number(a.price) -
            Number(b.price)
        );
        break;

      case "price_desc":
        results.sort(
          (a, b) =>
            Number(b.price) -
            Number(a.price)
        );
        break;

      case "title":
        results.sort((a, b) =>
          String(
            a.title || ""
          ).localeCompare(
            String(
              b.title || ""
            )
          )
        );
        break;

      case "newest":
      default:
        results.sort(
          (a, b) =>
            new Date(
              b.addedAt
            ) -
            new Date(
              a.addedAt
            )
        );
        break;
    }

    /*
     * PAGINATION
     */

    const total =
      results.length;

    const p = Math.max(
      1,
      Number(page)
    );

    const l = Math.min(
      50,
      Math.max(
        1,
        Number(limit)
      )
    );

    const start =
      (p - 1) * l;

    const items = results
      .slice(
        start,
        start + l
      )
      .map((book) =>
        withCoverUrl(
          book,
          req
        )
      );

    res.json({
      items,
      total,
      page: p,
      limit: l,
      totalPages:
        Math.ceil(
          total / l
        ),
    });
  })
);

/*
|--------------------------------------------------------------------------
| GET /api/books/:id
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const book =
      getDb().books.find(
        (item) =>
          item.id ===
          req.params.id
      );

    if (!book) {
      throw new ApiError(
        404,
        "Book not found"
      );
    }

    res.json({
      book: withCoverUrl(
        book,
        req
      ),
    });
  })
);

/*
|--------------------------------------------------------------------------
| POST /api/books
|--------------------------------------------------------------------------
| ADMIN ONLY
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  coverUpload.single("cover"),

  asyncHandler(async (req, res) => {
    const {
      title,
      author,
      category,
      categoryId,
      price,
      stock,
      pages,
      synopsis,
      content,
      cover,
      color,
    } = req.body || {};

    /*
     * VALIDASI
     */

    if (
      !title ||
      !author ||
      (!category &&
        !categoryId) ||
      price == null ||
      stock == null
    ) {
      throw new ApiError(
        400,
        "title, author, category, price and stock are required"
      );
    }

    const db =
      getDb();

    /*
     * CARI CATEGORY
     */

    const rawCategory =
      categoryId ??
      category;

    const categoryEntry =
      db.categories.find(
        (item) =>
          String(
            item.slug
          ) ===
            String(
              rawCategory
            ) ||
          String(
            item.id
          ) ===
            String(
              rawCategory
            ) ||
          String(
            item.name || ""
          )
            .toLowerCase()
            .trim() ===
            String(
              rawCategory
            )
              .toLowerCase()
              .trim()
      );

    if (!categoryEntry) {
      throw new ApiError(
        400,
        `Unknown category: ${rawCategory}`
      );
    }

    /*
     * ================================================================
     * COVER
     * ================================================================
     *
     * Prioritas:
     *
     * 1. file upload
     * 2. URL cover dari frontend
     * 3. null
     */

    let coverUrl = null;

    if (req.file) {
      coverUrl =
        await uploadCover(
          req.file
        );
    } else if (
      cover
    ) {
      coverUrl =
        String(
          cover
        ).trim();
    }

    /*
     * BUAT BOOK
     */

    const book = {
      id: `b${randomUUID().slice(
        0,
        8
      )}`,

      title:
        String(title).trim(),

      author:
        String(author).trim(),

      category:
        categoryEntry.slug,

      price:
        Number(price) || 0,

      stock:
        Number(stock) || 0,

      pages:
        Number(pages) || 0,

      chapters:
        Math.max(
          1,
          Math.round(
            (Number(pages) ||
              0) / 25
          )
        ),

      synopsis:
        synopsis || "",

      content:
        content || "",

      cover:
        coverUrl,

      color:
        color ||
        "#5B6B4E",

      addedAt:
        new Date()
          .toISOString()
          .slice(0, 10),
    };

    /*
     * SIMPAN KE CACHE
     */

    db.books.push(book);

    /*
     * SIMPAN KE SUPABASE
     */

    await persist();

    console.log(
      "Book created:",
      {
        id: book.id,
        title: book.title,
        cover: book.cover,
      }
    );

    res.status(201).json({
      book: withCoverUrl(
        book,
        req
      ),
    });
  })
);

/*
|--------------------------------------------------------------------------
| PUT /api/books/:id
|--------------------------------------------------------------------------
| ADMIN ONLY
|--------------------------------------------------------------------------
*/

router.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  coverUpload.single("cover"),

  asyncHandler(async (req, res) => {
    const db =
      getDb();

    const book =
      db.books.find(
        (item) =>
          item.id ===
          req.params.id
      );

    if (!book) {
      throw new ApiError(
        404,
        "Book not found"
      );
    }

    const oldCover =
      book.cover;

    /*
     * ================================================================
     * COVER BARU
     * ================================================================
     */

    if (req.file) {
      const newCover =
        await uploadCover(
          req.file
        );

      book.cover =
        newCover;
    } else if (
      req.body?.cover !==
      undefined
    ) {
      book.cover =
        req.body.cover
          ? String(
              req.body.cover
            ).trim()
          : null;
    }

    /*
     * ================================================================
     * FIELD LAIN
     * ================================================================
     */

    if (
      req.body?.title !==
      undefined
    ) {
      book.title =
        String(
          req.body.title
        ).trim();
    }

    if (
      req.body?.author !==
      undefined
    ) {
      book.author =
        String(
          req.body.author
        ).trim();
    }

    if (
      req.body?.category !==
      undefined
    ) {
      const categoryEntry =
        db.categories.find(
          (item) =>
            item.slug ===
              req.body.category ||
            item.id ===
              req.body.category ||
            String(
              item.name || ""
            )
              .toLowerCase() ===
              String(
                req.body.category
              )
                .trim()
                .toLowerCase()
        );

      if (!categoryEntry) {
        throw new ApiError(
          400,
          `Unknown category: ${req.body.category}`
        );
      }

      book.category =
        categoryEntry.slug;
    }

    if (
      req.body?.price !==
      undefined
    ) {
      book.price =
        Number(
          req.body.price
        ) || 0;
    }

    if (
      req.body?.stock !==
      undefined
    ) {
      book.stock =
        Number(
          req.body.stock
        ) || 0;
    }

    if (
      req.body?.pages !==
      undefined
    ) {
      book.pages =
        Number(
          req.body.pages
        ) || 0;

      book.chapters =
        Math.max(
          1,
          Math.round(
            book.pages / 25
          )
        );
    }

    if (
      req.body?.synopsis !==
      undefined
    ) {
      book.synopsis =
        req.body.synopsis;
    }

    if (
      req.body?.content !==
      undefined
    ) {
      book.content =
        req.body.content;
    }

    if (
      req.body?.color !==
      undefined
    ) {
      book.color =
        req.body.color;
    }

    /*
     * SIMPAN DB
     */

    await persist();

    /*
     * HAPUS COVER LAMA
     * setelah cover baru berhasil disimpan.
     */

    if (
      req.file &&
      oldCover &&
      oldCover !==
        book.cover
    ) {
      await deleteCover(
        oldCover
      );
    }

    res.json({
      book: withCoverUrl(
        book,
        req
      ),
    });
  })
);

/*
|--------------------------------------------------------------------------
| PATCH /api/books/:id/stock
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/stock",
  requireAuth,
  requireRole(
    "staff",
    "admin"
  ),

  asyncHandler(
    async (req, res) => {
      const {
        stock,
        delta,
      } = req.body || {};

      if (
        stock == null &&
        delta == null
      ) {
        throw new ApiError(
          400,
          "Provide either stock or delta"
        );
      }

      const book =
        getDb().books.find(
          (item) =>
            item.id ===
            req.params.id
        );

      if (!book) {
        throw new ApiError(
          404,
          "Book not found"
        );
      }

      book.stock =
        stock != null
          ? Number(stock)
          : Number(
              book.stock
            ) +
            Number(
              delta
            );

      if (
        book.stock < 0
      ) {
        throw new ApiError(
          400,
          "Stock cannot go below zero"
        );
      }

      await persist();

      res.json({
        book:
          withCoverUrl(
            book,
            req
          ),
      });
    }
  )
);

/*
|--------------------------------------------------------------------------
| DELETE /api/books/:id
|--------------------------------------------------------------------------
| ADMIN ONLY
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),

  asyncHandler(
    async (req, res) => {
      const db =
        getDb();

      const index =
        db.books.findIndex(
          (item) =>
            item.id ===
            req.params.id
        );

      if (index === -1) {
        throw new ApiError(
          404,
          "Book not found"
        );
      }

      const book =
        db.books[index];

      /*
       * HAPUS COVER DARI SUPABASE
       */

      await deleteCover(
        book.cover
      );

      /*
       * HAPUS BOOK
       */

      db.books.splice(
        index,
        1
      );

      /*
       * SIMPAN
       */

      await persist();

      res.status(204).send();
    }
  )
);

export default router;