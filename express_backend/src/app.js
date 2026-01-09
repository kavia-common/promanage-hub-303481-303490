const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { nodeEnv, corsOrigin } = require("./config/env");
const apiRouter = require("./routes");
const { notFoundHandler } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");

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
    /** Health-check endpoint. Returns simple status for load balancers. */
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/v1", apiRouter);

  // 404 + error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
