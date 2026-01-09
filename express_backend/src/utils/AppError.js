class AppError extends Error {
  /**
   * @param {string} message Human-readable error message.
   * @param {number} statusCode HTTP status code.
   * @param {string} [code] Optional machine-readable error code.
   * @param {any} [details] Optional error details for debugging/validation.
   */
  constructor(message, statusCode, code, details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

module.exports = { AppError };
