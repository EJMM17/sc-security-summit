// Next.js loads this file once per runtime to bootstrap instrumentation.
// We use it to wire up Sentry for the right runtime.
//
// The dynamic imports + Production gate keep @sentry/nextjs inactive in local
// development, visual Preview and custom targets.

const target = (
  process.env.VERCEL_TARGET_ENV ??
  process.env.VERCEL_ENV ??
  ""
).trim();
const sentryEnabled =
  process.env.VERCEL === "1" &&
  target === "production" &&
  Boolean(process.env.SENTRY_DSN?.trim());

export async function register() {
  if (!sentryEnabled) return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Capture the exception without forwarding Next.js' normalized request object.
export async function onRequestError(
  ...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>
) {
  if (!sentryEnabled) return;
  const [error, , context] = args;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(error, {
    tags: {
      router_kind: context.routerKind,
      route_type: context.routeType,
    },
  });
}
