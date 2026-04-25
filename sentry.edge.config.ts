// Sentry — Edge runtime (middleware.ts and edge route handlers)

import * as Sentry from "@sentry/nextjs";
import { scrubValue } from "@/lib/sentry-scrub";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: 0.1,

    beforeSend(event) {
      return scrubValue(event) as typeof event;
    },
    beforeBreadcrumb(breadcrumb) {
      return scrubValue(breadcrumb) as typeof breadcrumb;
    },
  });
}
