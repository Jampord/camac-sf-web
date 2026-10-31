import { isCronAuthorized } from "@/lib/retention";

// TEMPORARY: proves production can reach Sentry. Delete once a report has arrived. It throws rather
// than calling Sentry directly so the test takes the same path as a real error. Reusing CRON_SECRET
// means nobody else can fill the Sentry project with test reports.

export function GET(request: Request) {
  if (!isCronAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }
  throw new Error("Sentry connection test");
}
