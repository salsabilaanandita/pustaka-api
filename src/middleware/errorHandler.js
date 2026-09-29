export function notFound(req, res) {
  res.status(404).json({ error: { code: "not_found", message: `Route ${req.method} ${req.path} not found` } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: {
      code: err.code || (status === 500 ? "internal_error" : "request_error"),
      message: err.message || "Something went wrong",
    },
  });
}
