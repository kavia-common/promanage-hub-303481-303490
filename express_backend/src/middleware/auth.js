const { AppError } = require("../utils/AppError");
const { User } = require("../models");
const { verifyAccessToken } = require("../utils/tokens");

/**
 * Authentication middleware:
 * - reads Bearer token from Authorization header
 * - verifies JWT access token
 * - loads user and attaches to req.user
 */

// PUBLIC_INTERFACE
async function verifyAccessTokenMiddleware(req, res, next) {
  /** Express middleware that authenticates a request via Bearer access token. */
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || typeof authHeader !== "string") {
      return next(new AppError("Missing Authorization header", 401, "AUTH_REQUIRED"));
    }

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return next(new AppError("Invalid Authorization header format", 401, "AUTH_INVALID"));
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return next(new AppError("Invalid or expired access token", 401, "AUTH_TOKEN_INVALID"));
    }

    if (!decoded || decoded.typ !== "access") {
      return next(new AppError("Invalid access token type", 401, "AUTH_TOKEN_INVALID"));
    }

    const userId = decoded.sub;
    const user = await User.findById(userId).select("email name role isActive");
    if (!user) {
      return next(new AppError("User not found", 401, "AUTH_USER_NOT_FOUND"));
    }
    if (!user.isActive) {
      return next(new AppError("User is inactive", 403, "AUTH_USER_INACTIVE"));
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { verifyAccessToken: verifyAccessTokenMiddleware };
