import * as Sentry from "@sentry/nextjs";
import { scrubErrorEvent } from "@/lib/error-scrub";

// Error tracking on the server only (brief §5): no script or cookie reaches visitors, and page
// performance isn't traced. Without SENTRY_DSN (local, CI) nothing is sent anywhere.

export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // Sentry collects all of these by default. Local variables could hold a prayer request.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      stackFrameVariables: false,
    },
    beforeSend: scrubErrorEvent,
    // These hooks only feed tracing spans, which we don't record. Turbopack bundles the package
    // they load from, so leaving them on just logs "Cannot find package" at every start.
    enableRuntimeChannelInjection: false,
  });
}

// Next.js calls this for anything uncaught in a page, Route Handler or Server Action.
export const onRequestError = Sentry.captureRequestError;
