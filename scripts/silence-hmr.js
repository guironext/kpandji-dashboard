// Preloaded via NODE_OPTIONS="--require ./scripts/silence-hmr.js" in scripts/dev.js.
// Turbopack (Next 15) occasionally emits an internal "unrecognized HMR message"
// rejection for its own `{"event":"ping"}` keep-alive frames. These are harmless
// but saturate the terminal. We swallow exactly this noise, nothing else.

const isHMRPingNoise = (reason) => {
  if (!reason || typeof reason !== 'object') return false;
  const msg =
    ('message' in reason && typeof reason.message === 'string' && reason.message) ||
    (reason instanceof Error && reason.toString()) ||
    '';
  return (
    msg.includes('unrecognized HMR message') ||
    msg.includes('client-file-logs')
  );
};

process.on('unhandledRejection', (reason) => {
  if (isHMRPingNoise(reason)) return;
  process.emitWarning(
    reason instanceof Error ? reason : new Error(String(reason)),
    { type: 'UnhandledPromiseRejection' }
  );
});

process.on('uncaughtException', (err) => {
  if (isHMRPingNoise(err)) return;
  throw err;
});
