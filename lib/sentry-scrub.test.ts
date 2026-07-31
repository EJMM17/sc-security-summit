import { describe, expect, it } from "vitest";
import {
  sanitizeSentryEvent,
  scrubString,
  scrubValue,
} from "./sentry-scrub";

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

describe("sanitizeSentryEvent", () => {
  it("keeps only allowlisted error diagnostics", () => {
    const result = sanitizeSentryEvent({
      event_id: "0123456789abcdef0123456789abcdef",
      timestamp: 1_785_300_000,
      platform: "javascript",
      level: "error",
      environment: "production",
      release: "abcdef1234567890",
      message: "Failed for Ada at Acme Logistics",
      request: {
        url: "https://example.com/?email=ada@example.com",
        method: "POST",
        headers: {
          authorization: "Bearer secret",
          cookie: "session=secret",
          referer: "https://partner.example/private",
          "user-agent": "private browser",
        },
        data: { company: "Acme Logistics", phone: "+52 899 123 4567" },
      },
      user: { id: "attendee-123", email: "ada@example.com" },
      breadcrumbs: [{ message: "Typed Acme Logistics" }],
      contexts: { browser: { name: "Private Browser" } },
      extra: { interest: "Our confidential sponsor plans" },
      tags: {
        router_kind: "AppRouter",
        route_type: "action",
        company: "Acme Logistics",
      },
      exception: {
        values: [
          {
            type: "DatabaseError",
            value: "ada@example.com from Acme Logistics failed",
            mechanism: {
              type: "auto.function.nextjs.on_request_error",
              handled: false,
              data: { request_path: "/companies/acme" },
            },
            stacktrace: {
              frames: [
                {
                  filename:
                    "C:\\Users\\private-person\\workspace\\app\\actions\\inquiries.ts?email=ada@example.com",
                  abs_path: "C:\\Users\\private-person\\workspace\\app\\actions\\inquiries.ts",
                  function: "submitInquiry",
                  module: "app.actions.inquiries",
                  lineno: 42,
                  colno: 7,
                  in_app: true,
                  vars: { company: "Acme Logistics" },
                  pre_context: ["const email = 'ada@example.com'"],
                  context_line: "throw new Error(company)",
                  post_context: ["// private"],
                },
              ],
            },
          },
        ],
      },
    });

    expect(result).toEqual({
      event_id: "0123456789abcdef0123456789abcdef",
      timestamp: 1_785_300_000,
      platform: "javascript",
      level: "error",
      environment: "production",
      release: "abcdef1234567890",
      tags: {
        router_kind: "AppRouter",
        route_type: "action",
      },
      exception: {
        values: [
          {
            type: "DatabaseError",
            value: "[REDACTED:error-message]",
            mechanism: {
              type: "auto.function.nextjs.on_request_error",
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename: "workspace/app/actions/inquiries.ts",
                  function: "submitInquiry",
                  module: "app.actions.inquiries",
                  lineno: 42,
                  colno: 7,
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    });

    const serialized = JSON.stringify(result);
    for (const sensitive of [
      "ada@example.com",
      "Acme Logistics",
      "Bearer secret",
      "session=secret",
      "private-person",
      "confidential sponsor",
      "user-agent",
      "request_path",
      "vars",
      "context_line",
    ]) {
      expect(serialized).not.toContain(sensitive);
    }
  });

  it("drops messages and non-error telemetry", () => {
    expect(
      sanitizeSentryEvent({
        message: "Acme Logistics clicked a button",
        level: "info",
        spans: [{ description: "POST /inquiries" }],
      }),
    ).toBeNull();
  });

  it("rejects arbitrary free-form technical fields", () => {
    const result = sanitizeSentryEvent({
      environment: "preview",
      release: "release with customer name",
      platform: "custom platform",
      level: "info",
      tags: {
        router_kind: "App Router with spaces",
        route_type: "route",
      },
      exception: {
        values: [{ type: "Error", value: "Sensitive message" }],
      },
    });

    expect(result).toEqual({
      tags: { route_type: "route" },
      exception: {
        values: [
          {
            type: "Error",
            value: "[REDACTED:error-message]",
          },
        ],
      },
    });
  });
});
