import { describe, expect, it } from "vitest";
import { qrPng, qrSvg, shortUrl } from "./qr";

const url = "https://camac-sf-web.vercel.app/events/church-anniversary";

describe("shortUrl", () => {
  it("drops the https:// so it's quick to type from paper", () => {
    expect(shortUrl(url)).toBe("camac-sf-web.vercel.app/events/church-anniversary");
    expect(shortUrl("http://localhost:3000/events/x")).toBe("localhost:3000/events/x");
  });
});

describe("qrSvg", () => {
  it("is a square SVG drawn in black on white, the same every time", async () => {
    const svg = await qrSvg(url);
    expect(svg).toMatch(/^<svg[^>]+viewBox="0 0 (\d+) \1"/);
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('stroke="#000000"');
    expect(await qrSvg(url)).toBe(svg);
  });
});

describe("qrPng", () => {
  it("is a PNG of the requested width", async () => {
    const png = await qrPng(url, 1024);
    expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]); // PNG signature
    expect(png.readUInt32BE(16)).toBe(1024); // IHDR width
    expect(png.readUInt32BE(20)).toBe(1024); // IHDR height
  });
});
