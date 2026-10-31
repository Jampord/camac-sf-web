import type { ErrorEvent } from "@sentry/nextjs";

// What may leave the app in an error report. Error tracking must never break the promises in
// brief §6.4 and §6.7, so reports keep the error's type, where it happened and which route, and
// drop anything that could hold what someone typed or who they are.

/** Prayer text only passes through /prayer routes. A report with no route is treated the same. */
function isPrayerRoute(route: string | undefined): boolean {
  return !route || route.includes("/prayer");
}

/** Prisma errors can quote the values of the query that failed, including emails and form text. */
function isPrismaError(type: string | undefined): boolean {
  return type?.startsWith("Prisma") ?? false;
}

export function scrubErrorEvent(event: ErrorEvent): ErrorEvent {
  // Headers (session cookie, IP), and earlier console output that could quote anything.
  delete event.request;
  delete event.user;
  delete event.breadcrumbs;
  delete event.extra;

  const nextjs = event.contexts?.nextjs;
  if (typeof nextjs?.request_path === "string") {
    nextjs.request_path = nextjs.request_path.split("?")[0];
  }

  // An error's causes are listed too, and a Prisma error's cause can quote the same values.
  const errors = event.exception?.values ?? [];
  if (isPrayerRoute(event.transaction) || errors.some((error) => isPrismaError(error.type))) {
    for (const error of errors) delete error.value;
  }

  // Also switched off in Sentry.init. Local variables are too risky to rely on one setting.
  for (const error of errors) {
    for (const frame of error.stacktrace?.frames ?? []) delete frame.vars;
  }
  return event;
}
