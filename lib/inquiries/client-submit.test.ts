import { describe, expect, it, vi } from "vitest";
import {
  createSubmissionId,
  inquiryErrorMessage,
  runInquirySubmission,
} from "@/lib/inquiries/client-submit";

describe("runInquirySubmission", () => {
  it("always releases sending after an unexpected exception", async () => {
    const transitions: boolean[] = [];
    const result = await runInquirySubmission({
      setSending: (value) => transitions.push(value),
      submit: async () => {
        throw new Error("network failed");
      },
    });

    expect(result).toEqual({ ok: false, reason: "unexpected" });
    expect(transitions).toEqual([true, false]);
  });

  it("returns a typed result and releases sending on success", async () => {
    const setSending = vi.fn();
    const success = {
      ok: true as const,
      inquiryId: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
      notification: "queued" as const,
    };
    await expect(
      runInquirySubmission({
        setSending,
        submit: async () => success,
      }),
    ).resolves.toEqual(success);
    expect(setSending.mock.calls).toEqual([[true], [false]]);
  });
});

describe("createSubmissionId", () => {
  it("creates RFC 4122 version 4 identifiers", () => {
    expect(createSubmissionId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("uses getRandomValues when randomUUID is unavailable", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.fill(0xab);
        return bytes;
      },
    });
    expect(createSubmissionId()).toBe("abababab-abab-4bab-abab-abababababab");
    vi.unstubAllGlobals();
  });

  it("fails closed when no secure random generator exists", () => {
    vi.stubGlobal("crypto", {});
    expect(() => createSubmissionId()).toThrow(
      "Secure random number generation is unavailable",
    );
    vi.unstubAllGlobals();
  });
});

describe("inquiryErrorMessage", () => {
  const messages = {
    invalid: "invalid",
    rateLimited: "rate limited",
    unavailable: "unavailable",
  };

  it("maps actionable reasons and uses a safe availability fallback", () => {
    expect(inquiryErrorMessage("invalid", messages)).toBe("invalid");
    expect(inquiryErrorMessage("rate_limited", messages)).toBe("rate limited");
    expect(inquiryErrorMessage("storage_unavailable", messages)).toBe("unavailable");
    expect(inquiryErrorMessage("idempotency_conflict", messages)).toBe("unavailable");
    expect(inquiryErrorMessage("unexpected", messages)).toBe("unavailable");
  });
});
