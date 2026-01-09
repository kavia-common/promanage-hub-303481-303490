const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { jwtSecret, jwtRefreshSecret, tokenExpiry, refreshTokenExpiry } = require("../config/env");

/**
 * Token helpers are centralized to ensure consistent signing options and payloads.
 */

// PUBLIC_INTERFACE
function hashRefreshToken(token) {
  /** Hashes a refresh token with sha256 for storage/comparison. */
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

// PUBLIC_INTERFACE
function signAccessToken(user) {
  /**
   * Signs a short-lived access token.
   * @param {object} user Mongoose user document (must include id/_id, role)
   */
  return jwt.sign(
    { sub: String(user.id || user._id), role: user.role, typ: "access" },
    jwtSecret,
    { expiresIn: tokenExpiry }
  );
}

// PUBLIC_INTERFACE
function signRefreshToken(user) {
  /**
   * Signs a refresh token (longer-lived).
   * @param {object} user Mongoose user document (must include id/_id, role)
   */
  return jwt.sign(
    { sub: String(user.id || user._id), role: user.role, typ: "refresh" },
    jwtRefreshSecret,
    { expiresIn: refreshTokenExpiry }
  );
}

// PUBLIC_INTERFACE
function verifyAccessToken(token) {
  /** Verifies an access token and returns decoded payload. Throws on invalid. */
  return jwt.verify(String(token), jwtSecret);
}

// PUBLIC_INTERFACE
function verifyRefreshToken(token) {
  /** Verifies a refresh token and returns decoded payload. Throws on invalid. */
  return jwt.verify(String(token), jwtRefreshSecret);
}

module.exports = {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
