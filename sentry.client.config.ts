// Sentry — browser SDK
// Loaded by Next.js at runtime on every page in the browser.

import * as Sentry from "@sentry/nextjs";
import { scrubValue } from "@/lib/sentry-scrub";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

    tracesSampleRate: 0.1,
    // Privacy: we do not record sessions. Only send replays for sessions
    // that crash, and even then with a hard mask on inputs.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
        maskAllInputs: true,
      }),
    ],

    // Strip PII before any event leaves the browser.
    beforeSend(event) {
      return scrubValue(event) as typeof event;
    },
    beforeBreadcrumb(breadcrumb) {
      return scrubValue(breadcrumb) as typeof breadcrumb;
    },
  });
}
