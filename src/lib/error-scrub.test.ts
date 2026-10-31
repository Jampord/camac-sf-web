import type { ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";
import { scrubErrorEvent } from "./error-scrub";

function report(overrides: Partial<ErrorEvent> = {}): ErrorEvent {
  return {
    type: undefined,
    transaction: "GET /events/[slug]",
    exception: { values: [{ type: "TypeError", value: "x is not a function" }] },
    ...overrides,
  };
}

const messages = (event: ErrorEvent) => event.exception?.values?.map((error) => error.value);

describe("scrubErrorEvent", () => {
  it("removes headers, user, earlier console output and extras from every report", () => {
    const event = scrubErrorEvent(
      report({
        request: { headers: { cookie: "authjs.session-token=secret" } },
        user: { ip_address: "203.0.113.5" },
        breadcrumbs: [{ message: "console output" }],
        extra: { note: "anything" },
      }),
    );

    expect(event.request).toBeUndefined();
    expect(event.user).toBeUndefined();
    expect(event.breadcrumbs).toBeUndefined();
    expect(event.extra).toBeUndefined();
  });

  it("keeps the message of an ordinary error, which is what makes it debuggable", () => {
    expect(messages(scrubErrorEvent(report()))).toEqual(["x is not a function"]);
  });

  it("removes the message of any error on a prayer route", () => {
    for (const transaction of ["POST /prayer", "GET /admin/(app)/prayer"]) {
      const event = scrubErrorEvent(
        report({
          transaction,
          exception: { values: [{ type: "Error", value: "Please pray for my mother" }] },
        }),
      );
      expect(messages(event)).toEqual([undefined]);
      expect(event.exception?.values?.[0].type).toBe("Error");
    }
  });

  it("removes the message when the report doesn't say which route it came from", () => {
    expect(messages(scrubErrorEvent(report({ transaction: undefined })))).toEqual([undefined]);
  });

  it("removes Prisma messages on any route, along with their causes", () => {
    const event = scrubErrorEvent(
      report({
        exception: {
          values: [
            { type: "DriverAdapterError", value: "Key (email)=(someone@example.com) exists" },
            { type: "PrismaClientKnownRequestError", value: "Unique constraint failed" },
          ],
        },
      }),
    );
    expect(messages(event)).toEqual([undefined, undefined]);
  });

  it("removes local variables from stack frames, keeping where the error happened", () => {
    const event = scrubErrorEvent(
      report({
        exception: {
          values: [
            {
              type: "TypeError",
              stacktrace: { frames: [{ filename: "a.js", lineno: 3, vars: { body: "text" } }] },
            },
          ],
        },
      }),
    );
    expect(event.exception?.values?.[0].stacktrace?.frames).toEqual([
      { filename: "a.js", lineno: 3 },
    ]);
  });

  it("removes the query string from the request path", () => {
    const event = scrubErrorEvent(
      report({ contexts: { nextjs: { request_path: "/events/camp?ministry=youth" } } }),
    );
    expect(event.contexts?.nextjs?.request_path).toBe("/events/camp");
  });
});
