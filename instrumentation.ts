// Next.js loads this file once per runtime to bootstrap instrumentation.
// We use it to wire up Sentry for the right runtime.
//
// The dynamic imports + DSN gate keep @sentry/nextjs out of the bundle when
// observability is disabled (local dev, preview without DSN, etc), which
// matters for Edge runtime size budgets.

const sentryEnabled = Boolean(process.env.SENTRY_DSN);

export async function register() {
  if (!sentryEnabled) return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Forward server-action / route-handler request errors to Sentry.
export async function onRequestError(
  ...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>
) {
  if (!sentryEnabled) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
}
