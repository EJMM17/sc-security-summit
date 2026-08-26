import { describe, expect, it } from "vitest";
import { languageSwitchTarget } from "../lib/language-url";
import { resolveRequestLanguage } from "../lib/language";

describe("languageSwitchTarget", () => {
  it("returns null when the URL carries no lang param", () => {
    // Nothing outranks the cookie the toggle just wrote, so a refresh is
    // enough and the URL must stay exactly as the reader found it.
    expect(languageSwitchTarget("https://scsecuritysummit.com/", "en")).toBeNull();
    expect(
      languageSwitchTarget("https://scsecuritysummit.com/checkout?tier=plus", "en"),
    ).toBeNull();
  });

  it("rewrites an existing lang param to the language being switched to", () => {
    expect(languageSwitchTarget("https://scsecuritysummit.com/?lang=es", "en")).toBe(
      "/?lang=en",
    );
    expect(languageSwitchTarget("https://scsecuritysummit.com/?lang=en", "es")).toBe(
      "/?lang=es",
    );
  });

  it("keeps the other search params and the hash", () => {
    expect(
      languageSwitchTarget(
        "https://scsecuritysummit.com/checkout?lang=en&tier=plus#registro",
        "es",
      ),
    ).toBe("/checkout?lang=es&tier=plus#registro");
  });

  it("rewrites a lang param the server would not accept", () => {
    // `?lang=fr` falls through to the cookie on the server, but leaving it in
    // place would keep an unknown value travelling with every later share.
    expect(languageSwitchTarget("https://scsecuritysummit.com/?lang=fr", "en")).toBe(
      "/?lang=en",
    );
  });

  it("returns null for a URL it cannot parse", () => {
    expect(languageSwitchTarget("not a url", "en")).toBeNull();
  });

  it("produces a target the server resolves to the requested language", () => {
    // The regression this guards: writing the cookie alone left ?lang= in the
    // URL, and the param outranks the cookie, so the page never switched.
    const target = languageSwitchTarget("https://scsecuritysummit.com/?lang=es", "en");
    const param = new URLSearchParams(target!.split("?")[1]).get("lang");
    expect(resolveRequestLanguage(param, "es", "es-MX")).toBe("en");
  });
});
