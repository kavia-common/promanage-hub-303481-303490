const { AppError } = require("../utils/AppError");

// PUBLIC_INTERFACE
function errorHandler(err, req, res, next) {
  /** Express error middleware that returns a standardized JSON error response. */
  // eslint-disable-next-line no-unused-vars
  const _next = next;

  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;

  const payload = {
    success: false,
    message: isAppError ? err.message : "Internal Server Error"
  };

  if (isAppError && err.code) payload.code = err.code;
  if (isAppError && err.details !== undefined) payload.details = err.details;

  // Avoid leaking stack traces in production.
  if (process.env.NODE_ENV !== "production" && !isAppError) {
    payload.details = { stack: err.stack };
  }

  res.status(statusCode).json(payload);
}

module.exports = { errorHandler };
