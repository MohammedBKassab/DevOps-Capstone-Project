const { createApp } = require('./app');

const PORT = Number(process.env.PORT) || 3000;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`task-api ${process.env.APP_VERSION || 'dev'} listening on port ${PORT}`);
});

// Graceful shutdown: Kubernetes sends SIGTERM before killing a pod.
// We stop reporting "ready", let in-flight requests finish, then exit.
function shutdown(signal) {
  console.log(`${signal} received, shutting down gracefully...`);
  app.locals.setReady(false);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  // Force-exit if connections don't close in time
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
