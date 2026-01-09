const mongoose = require("mongoose");
const { mongoDbUri } = require("../config/env");

const { baseSchemaPlugin } = require("./plugins/baseSchema");

mongoose.plugin(baseSchemaPlugin);

/**
 * Simple runtime connection state used for /health and /ready endpoints.
 */
const dbState = {
  status: "disconnected", // disconnected | connecting | connected | disconnecting | error
  lastError: null,
  lastConnectedAt: null
};

let connectPromise = null;
let isShuttingDown = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeBackoffMs(attempt, baseMs, maxMs) {
  // Exponential backoff with jitter
  const exp = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * Math.min(250, exp));
  return Math.min(maxMs, exp + jitter);
}

function attachConnectionListeners() {
  // Avoid duplicate listeners if connectDB called multiple times.
  if (attachConnectionListeners._attached) return;
  attachConnectionListeners._attached = true;

  mongoose.connection.on("connected", () => {
    dbState.status = "connected";
    dbState.lastError = null;
    dbState.lastConnectedAt = new Date().toISOString();
  });

  mongoose.connection.on("disconnected", () => {
    if (!isShuttingDown) {
      dbState.status = "disconnected";
    }
  });

  mongoose.connection.on("error", (err) => {
    dbState.status = "error";
    dbState.lastError = err ? String(err.message || err) : "unknown mongoose error";
  });
}

// PUBLIC_INTERFACE
async function connectDB(options = {}) {
  /**
   * Connects to MongoDB via Mongoose with retry and exponential backoff.
   *
   * @param {object} [options]
   * @param {number} [options.maxRetries=10] Maximum retry attempts. Use 0 for no retries.
   * @param {number} [options.baseDelayMs=300] Base delay for backoff.
   * @param {number} [options.maxDelayMs=5000] Maximum delay between retries.
   * @returns {Promise<void>}
   */
  const {
    maxRetries = 10,
    baseDelayMs = 300,
    maxDelayMs = 5000
  } = options;

  if (!mongoDbUri || mongoDbUri.trim() === "") {
    dbState.status = "error";
    dbState.lastError = "MONGODB_URI is not configured";
    throw new Error("MONGODB_URI is required to connect to MongoDB");
  }

  attachConnectionListeners();

  // If already connected, no-op.
  if (mongoose.connection.readyState === 1) {
    dbState.status = "connected";
    return;
  }

  // If a connect attempt is in-flight, await it.
  if (connectPromise) return connectPromise;

  dbState.status = "connecting";
  dbState.lastError = null;

  connectPromise = (async () => {
    let attempt = 0;

    while (true) {
      try {
        // Note: we avoid setting strictQuery globally here; mongoose 8 defaults are fine.
        await mongoose.connect(mongoDbUri, {
          // Keep this intentionally minimal; consumers can extend later.
          serverSelectionTimeoutMS: 5000
        });
        return;
      } catch (err) {
        attempt += 1;
        dbState.status = "error";
        dbState.lastError = err ? String(err.message || err) : "unknown connect error";

        if (attempt > maxRetries) {
          throw err;
        }

        const waitMs = computeBackoffMs(attempt, baseDelayMs, maxDelayMs);
        // eslint-disable-next-line no-console
        console.warn(
          `[express_backend] MongoDB connection failed (attempt ${attempt}/${maxRetries}). Retrying in ${waitMs}ms...`
        );
        await sleep(waitMs);

        // Transition back to connecting after backoff.
        dbState.status = "connecting";
      }
    }
  })();

  try {
    await connectPromise;
  } finally {
    // Only clear after completion to allow subsequent callers to reconnect if needed.
    connectPromise = null;
  }
}

// PUBLIC_INTERFACE
async function disconnectDB() {
  /** Gracefully closes the Mongoose connection. */
  isShuttingDown = true;

  const readyState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (readyState === 0) {
    dbState.status = "disconnected";
    return;
  }

  dbState.status = "disconnecting";
  try {
    await mongoose.disconnect();
    dbState.status = "disconnected";
    dbState.lastError = null;
  } catch (err) {
    dbState.status = "error";
    dbState.lastError = err ? String(err.message || err) : "unknown disconnect error";
    throw err;
  }
}

// PUBLIC_INTERFACE
function getDbHealth() {
  /** Returns a shallow copy of current DB health state. */
  return { ...dbState, readyState: mongoose.connection.readyState };
}

module.exports = { connectDB, disconnectDB, getDbHealth };

