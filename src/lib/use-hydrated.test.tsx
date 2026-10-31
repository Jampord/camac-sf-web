import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useHydrated } from "./use-hydrated";

function Probe() {
  return <button disabled={!useHydrated()}>Save</button>;
}

describe("useHydrated", () => {
  // The HTML a browser shows before React takes over, when a tap would post the form natively.
  it("is false in the server-rendered HTML", () => {
    expect(renderToString(<Probe />)).toContain("disabled");
  });
});
