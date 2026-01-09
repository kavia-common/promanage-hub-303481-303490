const dotenv = require("dotenv");
const Joi = require("joi");

/**
 * Load environment variables from .env (if present) and validate them.
 * This keeps configuration centralized and fail-fast.
 */
dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().integer().min(1).max(65535).default(3001),

  // Required now that DB connection is part of server startup.
  MONGODB_URI: Joi.string().uri().required(),

  // Auth (required for this step)
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).default(Joi.ref("JWT_SECRET")),
  TOKEN_EXPIRY: Joi.string().default("15m"),
  REFRESH_TOKEN_EXPIRY: Joi.string().default("30d"),

  // If empty/undefined, we handle permissive CORS in development.
  CORS_ORIGIN: Joi.string().allow("").optional()
}).unknown(true);

const { value, error } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
  // Fail fast in case of misconfiguration.
  // eslint-disable-next-line no-console
  console.error("Invalid environment configuration:", error.details.map((d) => d.message));
  throw new Error("Environment validation failed");
}

module.exports = {
  nodeEnv: value.NODE_ENV,
  port: value.PORT,
  mongoDbUri: value.MONGODB_URI,

  jwtSecret: value.JWT_SECRET,
  jwtRefreshSecret: value.JWT_REFRESH_SECRET,
  tokenExpiry: value.TOKEN_EXPIRY,
  refreshTokenExpiry: value.REFRESH_TOKEN_EXPIRY,

  corsOrigin: value.CORS_ORIGIN
};
