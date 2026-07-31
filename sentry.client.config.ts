// Sentry — browser SDK
// Loaded by Next.js at runtime on every page in the browser.

import * as Sentry from "@sentry/nextjs";
import { sanitizeSentryEvent } from "@/lib/sentry-scrub";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
const isProduction =
  process.env.NEXT_PUBLIC_DEPLOYMENT_TARGET === "production";

if (dsn && isProduction) {
  Sentry.init({
    dsn,
    environment: "production",
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    sendDefaultPii: false,
    enableLogs: false,
    enableMetrics: false,
    tracePropagationTargets: [],
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
