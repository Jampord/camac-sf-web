import QRCode from "qrcode";

// QR codes for the printable event page and the projector PNG (brief §6.6).
// Error correction "M" survives a smudged or folded bulletin while keeping the squares large.
// The 4-module quiet zone is the standard minimum; scanners need it.

const OPTIONS = {
  errorCorrectionLevel: "M",
  margin: 4,
  color: { dark: "#000000", light: "#ffffff" }, // always black on white, even in dark mode
} as const;

/** The QR as an SVG string: sharp at any print size. */
export function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { ...OPTIONS, type: "svg" });
}

/** The QR as a square PNG `width` pixels wide, for slides. */
export function qrPng(url: string, width: number): Promise<Buffer> {
  return QRCode.toBuffer(url, { ...OPTIONS, type: "png", width });
}

/** "camac-sf-web.vercel.app/events/…": the address printed under the code, for typing. */
export function shortUrl(url: string): string {
  return url.replace(/^https?:\/\//, "");
}
