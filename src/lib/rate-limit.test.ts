import { describe, expect, it } from "vitest";
import { clientIp, hashIp } from "./rate-limit";

describe("clientIp", () => {
  it("takes the first address in x-forwarded-for (the visitor; the rest are proxies)", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then to a shared bucket", () => {
    expect(clientIp(new Headers({ "x-real-ip": "203.0.113.8" }))).toBe("203.0.113.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("hashIp", () => {
  it("never contains the address and depends on the secret", () => {
    const hash = hashIp("203.0.113.7", "secret-a");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("203.0.113.7");
    expect(hash).not.toBe(hashIp("203.0.113.7", "secret-b"));
  });

  it("is stable, so repeat visits from one address can be counted", () => {
    expect(hashIp("203.0.113.7", "secret-a")).toBe(hashIp("203.0.113.7", "secret-a"));
    expect(hashIp("203.0.113.7", "secret-a")).not.toBe(hashIp("203.0.113.8", "secret-a"));
  });
});
