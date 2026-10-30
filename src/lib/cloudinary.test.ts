import { describe, expect, it } from "vitest";
import { isPosterUrl, posterImageUrl, signCloudinaryParams } from "./cloudinary";

describe("signCloudinaryParams", () => {
  it("matches the worked example in Cloudinary's upload signature docs", () => {
    const signature = signCloudinaryParams(
      { timestamp: 1315060510, public_id: "sample_image", eager: "w_400,h_300,c_pad|w_260,h_200,c_crop" },
      "abcd",
    );
    expect(signature).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e");
  });
});

const url = "https://res.cloudinary.com/demo/image/upload/v1730000000/camac/posters/abc123.jpg";

describe("isPosterUrl", () => {
  it("accepts an upload in our cloud's poster folder", () => {
    expect(isPosterUrl(url, "demo")).toBe(true);
  });

  it("rejects other clouds, folders and sites", () => {
    expect(isPosterUrl(url, "other")).toBe(false);
    expect(isPosterUrl(url.replace("camac/posters", "camac/other"), "demo")).toBe(false);
    expect(isPosterUrl("https://example.com/camac/posters/a.jpg", "demo")).toBe(false);
    expect(isPosterUrl("http://res.cloudinary.com/demo/image/upload/camac/posters/a.jpg", "demo")).toBe(false);
  });
});

describe("posterImageUrl", () => {
  it("adds a Cloudinary transformation after /upload/", () => {
    expect(posterImageUrl(url, "f_auto,q_auto,w_800")).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800/v1730000000/camac/posters/abc123.jpg",
    );
  });
});
