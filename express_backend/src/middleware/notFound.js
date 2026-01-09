const { AppError } = require("../utils/AppError");

// PUBLIC_INTERFACE
function notFoundHandler(req, res, next) {
  /** Express middleware that converts unmatched routes into a standardized 404 error. */
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, "NOT_FOUND"));
}

module.exports = { notFoundHandler };
