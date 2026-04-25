import { describe, expect, it } from "vitest";
import { scrubString, scrubValue } from "./sentry-scrub";

describe("scrubString", () => {
  it("redacts email addresses", () => {
    expect(scrubString("Hola maria@empresa.com aquí")).toBe(
      "Hola [REDACTED:email] aquí",
    );
  });

  it("redacts Mexican RFCs", () => {
    expect(scrubString("RFC: GOML850315ABC")).toBe("RFC: [REDACTED:rfc]");
  });

  it("redacts phone numbers", () => {
    expect(scrubString("+52 899 123 4567")).toBe("[REDACTED:phone]");
  });

  it("redacts credit-card-like sequences", () => {
    expect(scrubString("4111 1111 1111 1111")).toBe("[REDACTED:card]");
  });

  it("leaves harmless text alone", () => {
    expect(scrubString("Sept 24-25, 2026")).toBe("Sept 24-25, 2026");
  });
});

describe("scrubValue", () => {
  it("redacts known PII keys whole-value", () => {
    const input = {
      folio: "SCSS2026-ABC-123456",
      email: "user@example.com",
      rfc: "GOML850315ABC",
      empresa: "Empresa SA",
    };
    expect(scrubValue(input)).toEqual({
      folio: "SCSS2026-ABC-123456",
      email: "[REDACTED]",
      rfc: "[REDACTED]",
      empresa: "Empresa SA",
    });
  });

  it("recurses into nested objects", () => {
    const input = {
      registro: {
        contact: { email: "user@example.com", phone: "+52 899 123 4567" },
        items: [{ rfc: "GOML850315ABC" }],
      },
    };
    const out = scrubValue(input) as typeof input;
    expect(out.registro.contact.email).toBe("[REDACTED]");
    expect(out.registro.contact.phone).toBe("[REDACTED]");
    expect(out.registro.items[0].rfc).toBe("[REDACTED]");
  });

  it("scrubs PII patterns inside string values of non-PII keys", () => {
    const input = {
      message: "Failed to send to maria@empresa.com",
    };
    expect(scrubValue(input)).toEqual({
      message: "Failed to send to [REDACTED:email]",
    });
  });

  it("handles arrays of strings", () => {
    expect(scrubValue(["one@two.com", "harmless"])).toEqual([
      "[REDACTED:email]",
      "harmless",
    ]);
  });

  it("truncates objects deeper than the max recursion depth", () => {
    type Deep = { a?: Deep };
    const deep: Deep = {};
    let cur = deep;
    for (let i = 0; i < 12; i++) {
      cur.a = {};
      cur = cur.a;
    }
    const out = scrubValue(deep);
    // Walk down until we hit the truncation marker; we don't pin the exact
    // depth because the implementation is allowed to evolve.
    let cursor: unknown = out;
    let steps = 0;
    while (cursor && typeof cursor === "object" && steps < 20) {
      cursor = (cursor as Record<string, unknown>).a;
      steps++;
    }
    expect(cursor).toBe("[TRUNCATED:depth]");
    expect(steps).toBeLessThan(15);
  });

  it("redacts authorization-like header keys", () => {
    expect(
      scrubValue({ Authorization: "Bearer abc", cookie: "sid=xyz" }),
    ).toEqual({ Authorization: "[REDACTED]", cookie: "[REDACTED]" });
  });
});
