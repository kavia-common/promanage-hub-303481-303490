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

  // Not required in this skeleton step, but validated if provided.
  JWT_SECRET: Joi.string().min(16).optional(),

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
  corsOrigin: value.CORS_ORIGIN
};
