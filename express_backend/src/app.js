const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { nodeEnv, corsOrigin } = require("./config/env");
const apiRouter = require("./routes");
const { notFoundHandler } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");
const { getDbHealth } = require("./db/mongoose");

function createCorsOptions() {
  // In dev, allow all by default unless CORS_ORIGIN is set.
  if (nodeEnv !== "production" && (!corsOrigin || corsOrigin.trim() === "")) {
    return { origin: true, credentials: true };
  }

  // In production, require an explicit allowed origin if provided.
  if (corsOrigin && corsOrigin.trim() !== "") {
    return { origin: corsOrigin, credentials: true };
  }

  // Production without explicit origin: be strict by default.
  return { origin: false };
}

// PUBLIC_INTERFACE
function createApp() {
  /** Creates and configures the Express application instance. */
  const app = express();

  app.set("trust proxy", true);

  app.use(helmet());
  app.use(cors(createCorsOptions()));
  app.use(morgan(nodeEnv === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "1mb" }));

  // PUBLIC_INTERFACE
  app.get("/health", (req, res) => {
    /** Liveness probe endpoint. Process is up; may be degraded if DB is down. */
    const db = getDbHealth();
    const isOk = db.status === "connected";
    res.status(isOk ? 200 : 200).json({
      status: "ok",
      db: {
        status: db.status,
        lastConnectedAt: db.lastConnectedAt,
        lastError: db.lastError
      }
    });
  });

  // PUBLIC_INTERFACE
  app.get("/ready", (req, res) => {
    /** Readiness probe endpoint. Returns 200 only when DB connection is established. */
    const db = getDbHealth();
    const isReady = db.status === "connected";
    res.status(isReady ? 200 : 503).json({
      status: isReady ? "ready" : "not_ready",
      db: {
        status: db.status,
        lastConnectedAt: db.lastConnectedAt,
        lastError: db.lastError
      }
    });
  });

  app.use("/api/v1", apiRouter);

  // 404 + error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
