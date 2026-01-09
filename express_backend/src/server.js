const http = require("http");
const { createApp } = require("./app");
const { port, nodeEnv } = require("./config/env");
const { connectDB, disconnectDB } = require("./db/mongoose");

// PUBLIC_INTERFACE
async function startServer() {
  /** Starts the HTTP server for the Express application (connects DB before listening). */
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[express_backend] listening on port ${port} (${nodeEnv})`);
  });

  // Graceful shutdown handler
  let isClosing = false;

  // PUBLIC_INTERFACE
  async function shutdown(signal) {
    /** Gracefully stops accepting new connections, closes MongoDB, then exits. */
    if (isClosing) return;
    isClosing = true;

    // eslint-disable-next-line no-console
    console.log(`[express_backend] received ${signal}. Shutting down...`);

    // Stop accepting new requests
    await new Promise((resolve) => {
      server.close(() => resolve());
    });

    try {
      await disconnectDB();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[express_backend] error during MongoDB disconnect:", err);
    }

    // eslint-disable-next-line no-console
    console.log("[express_backend] shutdown complete");
    process.exit(0);
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  return server;
}

// Start only when executed directly (not when imported for tests).
if (require.main === module) {
  startServer().catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[express_backend] failed to start server:", err);
    process.exit(1);
  });
}

module.exports = { startServer };
