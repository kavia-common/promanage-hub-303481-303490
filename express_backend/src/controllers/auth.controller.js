const Joi = require("joi");

const { AppError } = require("../utils/AppError");
const { User, RefreshToken } = require("../models");
const {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} = require("../utils/tokens");

function sanitizeUser(user) {
  return {
    id: String(user.id || user._id),
    email: user.email,
    name: user.name,
    role: user.role
  };
}

function computeExpiresAtFromNowSeconds(seconds) {
  return new Date(Date.now() + seconds * 1000);
}

function parseJwtExpiresInToSeconds(expiresIn) {
  // Supports: "15m", "30d", "3600"
  const s = String(expiresIn || "").trim();
  if (!s) return null;

  if (/^\d+$/.test(s)) return Number(s);
  const match = s.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return null;

  const n = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "s") return n;
  if (unit === "m") return n * 60;
  if (unit === "h") return n * 60 * 60;
  if (unit === "d") return n * 60 * 60 * 24;
  return null;
}

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(1).max(120).required(),
  password: Joi.string().min(8).max(200).required()
}).required();

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).max(200).required()
}).required();

const refreshSchema = Joi.object({
  refreshToken: Joi.string().min(10).required()
}).required();

const logoutSchema = Joi.object({
  refreshToken: Joi.string().min(10).required()
}).required();

// PUBLIC_INTERFACE
async function register(req, res, next) {
  /** Registers a new user and returns access (+ refresh) tokens. */
  try {
    const { value, error } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", error.details));
    }

    const email = String(value.email).toLowerCase().trim();

    const existing = await User.findOne({ email }).select("_id");
    if (existing) {
      return next(new AppError("Email already in use", 409, "EMAIL_IN_USE"));
    }

    const user = new User({
      email,
      name: value.name,
      role: "member"
    });
    // triggers pre-save hook hashing
    user.password = value.password;

    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    // Persist refresh token (hashed)
    const expiresSec = parseJwtExpiresInToSeconds(process.env.REFRESH_TOKEN_EXPIRY || "30d");
    const expiresAt = expiresSec ? computeExpiresAtFromNowSeconds(expiresSec) : new Date(Date.now() + 30 * 864e5);

    await RefreshToken.create({
      user: user._id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt
    });

    return res.status(201).json({
      success: true,
      user: sanitizeUser(user),
      accessToken,
      refreshToken
    });
  } catch (err) {
    // Duplicate key fallback
    if (err && err.code === 11000) {
      return next(new AppError("Email already in use", 409, "EMAIL_IN_USE"));
    }
    return next(err);
  }
}

// PUBLIC_INTERFACE
async function login(req, res, next) {
  /** Logs in a user with email/password and returns access (+ refresh) tokens. */
  try {
    const { value, error } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", error.details));
    }

    const email = String(value.email).toLowerCase().trim();

    // Need passwordHash for verifyPassword, so select it explicitly
    const user = await User.findOne({ email }).select("+passwordHash email name role isActive");
    if (!user) {
      return next(new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS"));
    }
    if (!user.isActive) {
      return next(new AppError("User is inactive", 403, "AUTH_USER_INACTIVE"));
    }

    const ok = await user.verifyPassword(value.password);
    if (!ok) {
      return next(new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS"));
    }

    user.lastLogin = new Date();
    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    const expiresSec = parseJwtExpiresInToSeconds(process.env.REFRESH_TOKEN_EXPIRY || "30d");
    const expiresAt = expiresSec ? computeExpiresAtFromNowSeconds(expiresSec) : new Date(Date.now() + 30 * 864e5);

    await RefreshToken.create({
      user: user._id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt
    });

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
      accessToken,
      refreshToken
    });
  } catch (err) {
    return next(err);
  }
}

// PUBLIC_INTERFACE
async function refresh(req, res, next) {
  /** Exchanges a valid, non-revoked refresh token for a new access token (and rotates refresh token). */
  try {
    const { value, error } = refreshSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", error.details));
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(value.refreshToken);
    } catch (err) {
      return next(new AppError("Invalid or expired refresh token", 401, "REFRESH_TOKEN_INVALID"));
    }

    if (!decoded || decoded.typ !== "refresh") {
      return next(new AppError("Invalid refresh token type", 401, "REFRESH_TOKEN_INVALID"));
    }

    const tokenHash = hashRefreshToken(value.refreshToken);
    const stored = await RefreshToken.findOne({ tokenHash }).select("user revokedAt expiresAt");
    if (!stored) {
      return next(new AppError("Refresh token not recognized", 401, "REFRESH_TOKEN_INVALID"));
    }
    if (stored.revokedAt) {
      return next(new AppError("Refresh token revoked", 401, "REFRESH_TOKEN_REVOKED"));
    }
    if (stored.expiresAt && stored.expiresAt.getTime() <= Date.now()) {
      return next(new AppError("Refresh token expired", 401, "REFRESH_TOKEN_EXPIRED"));
    }

    const user = await User.findById(stored.user).select("email name role isActive");
    if (!user) {
      return next(new AppError("User not found", 401, "AUTH_USER_NOT_FOUND"));
    }
    if (!user.isActive) {
      return next(new AppError("User is inactive", 403, "AUTH_USER_INACTIVE"));
    }

    // Rotate refresh token: revoke old + issue/store new
    stored.revokedAt = new Date();
    await stored.save();

    const accessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    const expiresSec = parseJwtExpiresInToSeconds(process.env.REFRESH_TOKEN_EXPIRY || "30d");
    const expiresAt = expiresSec ? computeExpiresAtFromNowSeconds(expiresSec) : new Date(Date.now() + 30 * 864e5);

    await RefreshToken.create({
      user: user._id,
      tokenHash: hashRefreshToken(newRefreshToken),
      expiresAt
    });

    return res.status(200).json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    return next(err);
  }
}

// PUBLIC_INTERFACE
async function logout(req, res, next) {
  /** Revokes a refresh token (logout). */
  try {
    const { value, error } = logoutSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", error.details));
    }

    const tokenHash = hashRefreshToken(value.refreshToken);
    const stored = await RefreshToken.findOne({ tokenHash }).select("_id revokedAt");
    if (stored && !stored.revokedAt) {
      stored.revokedAt = new Date();
      await stored.save();
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
}

// PUBLIC_INTERFACE
async function me(req, res, next) {
  /** Returns the authenticated user's profile. Requires verifyAccessToken middleware. */
  try {
    if (!req.user) {
      return next(new AppError("Authentication required", 401, "AUTH_REQUIRED"));
    }
    return res.status(200).json({ success: true, user: sanitizeUser(req.user) });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, refresh, logout, me };
