const http = require("http");
const { createApp } = require("./app");
const { port, nodeEnv } = require("./config/env");

// PUBLIC_INTERFACE
function startServer() {
  /** Starts the HTTP server for the Express application. */
  const app = createApp();
  const server = http.createServer(app);

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[express_backend] listening on port ${port} (${nodeEnv})`);
  });

  return server;
}

// Start only when executed directly (not when imported for tests).
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
