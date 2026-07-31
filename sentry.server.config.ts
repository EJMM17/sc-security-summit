// Sentry — Node.js (server actions, route handlers, API routes)

import * as Sentry from "@sentry/nextjs";
import { sanitizeSentryEvent } from "@/lib/sentry-scrub";

const dsn = process.env.SENTRY_DSN?.trim();
const target = (
  process.env.VERCEL_TARGET_ENV ??
  process.env.VERCEL_ENV ??
  ""
).trim();
const isProduction = process.env.VERCEL === "1" && target === "production";

if (dsn && isProduction) {
  Sentry.init({
    dsn,
    environment: "production",
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    sendDefaultPii: false,
    enableLogs: false,
    enableMetrics: false,
    tracePropagationTargets: [],
    includeLocalVariables: false,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: { request: false, response: false },
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      stackFrameVariables: false,
      frameContextLines: 0,
    },
    beforeSend(event) {
      return sanitizeSentryEvent(event);
    },
    beforeSendTransaction: () => null,
    beforeSendLog: () => null,
    beforeSendMetric: () => null,
    beforeBreadcrumb: () => null,
  });
}
