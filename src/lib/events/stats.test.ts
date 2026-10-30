import { describe, expect, it } from "vitest";
import { isBot, parseStatType } from "./stats";

describe("isBot", () => {
  it.each([
    ["Facebook's link crawler", "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"],
    ["Facebook's other crawler", "Facebot"],
    ["Meta's crawler", "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)"],
    ["Googlebot", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"],
    ["WhatsApp previews", "WhatsApp/2.23.20.0"],
    ["headless browsers", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/120.0 Safari/537.36"],
    ["no user agent", ""],
  ])("flags %s", (_, ua) => {
    expect(isBot(ua)).toBe(true);
  });

  it.each([
    ["Messenger's in-app browser", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/430.0;FBBV/1;FBDV/iPhone14,5;FBMD/iPhone;FBSN/iOS;FBSV/17.0;FBSS/3;FBCR/;FBID/phone;FBLC/en_US;FBOP/5]"],
    ["Facebook's Android in-app browser", "Mozilla/5.0 (Linux; Android 13; SM-A135F Build/TP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/440.0.0.0;]"],
    ["Chrome on Android", "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"],
    ["Safari on iPhone", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1"],
  ])("lets %s through", (_, ua) => {
    expect(isBot(ua)).toBe(false);
  });
});

describe("parseStatType", () => {
  it("accepts the three stat types", () => {
    expect(parseStatType({ type: "VIEW" })).toBe("VIEW");
    expect(parseStatType({ type: "COPY" })).toBe("COPY");
    expect(parseStatType({ type: "SHARE" })).toBe("SHARE");
  });

  it("rejects anything else", () => {
    expect(parseStatType({ type: "view" })).toBeNull();
    expect(parseStatType({ type: "CLICK" })).toBeNull();
    expect(parseStatType({})).toBeNull();
    expect(parseStatType(null)).toBeNull();
  });
});
