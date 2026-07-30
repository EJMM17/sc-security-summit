import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildInquiryNotificationEmail,
  processInquiryNotification,
} from "@/server/services/inquiry-notifier";
import type { sendEmail, SendEmailResult } from "@/lib/email";
import type {
  ClaimedInquiryNotification,
  NotificationStatus,
  StoredInquiry,
} from "@/server/repositories/inquiry-repository";
import {
  InquiryRepositoryError,
  type completeInquiryNotification,
} from "@/server/repositories/inquiry-repository";

const CLAIM: ClaimedInquiryNotification = {
  notificationId: "6b899fb2-5501-46ae-9621-d0d87983351d",
  inquiryId: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
  attemptNumber: 1,
  template: "corporate_internal_v1",
};

const INQUIRY: StoredInquiry = {
  id: CLAIM.inquiryId,
  kind: "corporate",
  contactName: "Ada <script>alert(1)</script>",
  email: "ada@example.com",
  phone: "+52 899 123 4567",
  company: "Analytical Engines",
  language: "es",
  jobTitle: "Director",
  requestedSeats: 6,
  interest: null,
};

function dependencies() {
  return {
    send: vi.fn(
      async (
        input: Parameters<typeof sendEmail>[0],
      ): Promise<SendEmailResult> => {
        void input;
        return {
          ok: true,
          id: "provider-message-id",
        };
      },
    ),
    getInquiry: vi.fn(async (inquiryId: string): Promise<StoredInquiry> => {
      void inquiryId;
      return INQUIRY;
    }),
    complete: vi.fn(
      async (
        input: Parameters<typeof completeInquiryNotification>[0],
      ): Promise<NotificationStatus> => {
        void input;
        return "sent";
      },
    ),
    now: vi.fn(() => new Date("2026-07-29T12:00:00.000Z")),
  };
}

describe("buildInquiryNotificationEmail", () => {
  it("escapes lead-controlled values and keeps the subject free of PII", () => {
    const email = buildInquiryNotificationEmail(INQUIRY);
    expect(email.subject).toBe("Nueva solicitud de pase corporativo");
    expect(email.subject).not.toContain(INQUIRY.company);
    expect(email.html).toContain("Ada &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(email.html).not.toContain("<script>alert(1)</script>");
  });

  it("renders sponsor-specific content", () => {
    const email = buildInquiryNotificationEmail({
      ...INQUIRY,
      kind: "sponsor",
      jobTitle: null,
      requestedSeats: null,
      interest: "Premium package details",
    });
    expect(email.subject).toBe("Nueva solicitud de patrocinio");
    expect(email.html).toContain("Premium package details");
  });
});

describe("processInquiryNotification", () => {
  beforeEach(() => {
    process.env.CONTACT_EMAIL = "operations@example.com";
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    delete process.env.CONTACT_EMAIL;
    vi.restoreAllMocks();
  });

  it("sends and atomically finalizes a successful attempt", async () => {
    const deps = dependencies();
    await expect(processInquiryNotification(CLAIM, deps)).resolves.toBe("sent");
    expect(deps.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "operations@example.com",
        subject: "Nueva solicitud de pase corporativo",
        idempotencyKey:
          "inquiry-notification/6b899fb2-5501-46ae-9621-d0d87983351d",
      }),
    );
    expect(deps.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationId: CLAIM.notificationId,
        attemptNumber: 1,
        result: "sent",
        providerMessageId: "provider-message-id",
      }),
    );
  });

  it("queues a transient provider failure with one-minute backoff", async () => {
    const deps = dependencies();
    deps.send.mockResolvedValue({
      ok: false,
      code: "rate_limit_exceeded",
    });
    deps.complete.mockResolvedValue("retry");

    await expect(processInquiryNotification(CLAIM, deps)).resolves.toBe("queued");
    expect(deps.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        result: "retry",
        errorCode: "rate_limit_exceeded",
        nextAttemptAt: "2026-07-29T12:01:00.000Z",
      }),
    );
  });

  it("marks a permanent provider failure dead without storing its message", async () => {
    const deps = dependencies();
    deps.send.mockResolvedValue({
      ok: false,
      code: "validation_error",
    });
    deps.complete.mockResolvedValue("dead");

    await expect(processInquiryNotification(CLAIM, deps)).resolves.toBe("dead");
    const completion = deps.complete.mock.calls[0][0];
    expect(completion).toMatchObject({
      result: "dead",
      errorCode: "validation_error",
    });
    expect(JSON.stringify(completion)).not.toContain("ada@example.com");
  });

  it("marks the fifth transient failure dead", async () => {
    const deps = dependencies();
    deps.send.mockResolvedValue({
      ok: false,
      code: "provider_timeout",
    });
    deps.complete.mockResolvedValue("dead");

    await expect(
      processInquiryNotification({ ...CLAIM, attemptNumber: 5 }, deps),
    ).resolves.toBe("dead");
    expect(deps.complete).toHaveBeenCalledWith(
      expect.objectContaining({ result: "dead", nextAttemptAt: undefined }),
    );
  });

  it("does not send when the claimed template does not match the inquiry", async () => {
    const deps = dependencies();
    deps.complete.mockResolvedValue("dead");

    await expect(
      processInquiryNotification({ ...CLAIM, template: "sponsor_internal_v1" }, deps),
    ).resolves.toBe("dead");
    expect(deps.send).not.toHaveBeenCalled();
    expect(deps.complete).toHaveBeenCalledWith(
      expect.objectContaining({ result: "dead", errorCode: "template_mismatch" }),
    );
  });

  it("queues a read failure without leaking the exception", async () => {
    const deps = dependencies();
    deps.getInquiry.mockRejectedValue(new Error("row contains ada@example.com"));
    deps.complete.mockResolvedValue("retry");

    await expect(processInquiryNotification(CLAIM, deps)).resolves.toBe("queued");
    expect(deps.send).not.toHaveBeenCalled();
    expect(deps.complete).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: "inquiry_read_failed" }),
    );
    expect(JSON.stringify(deps.complete.mock.calls[0][0])).not.toContain("ada@example.com");
  });

  it("preserves a sanitized repository error code", async () => {
    const deps = dependencies();
    deps.getInquiry.mockRejectedValue(
      new InquiryRepositoryError("get_inquiry", { code: "PGRST503" }),
    );
    deps.complete.mockResolvedValue("retry");

    await expect(processInquiryNotification(CLAIM, deps)).resolves.toBe("queued");
    expect(deps.complete).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: "PGRST503" }),
    );
  });

  it.each([
    ["UPSTREAM_TIMEOUT", "UPSTREAM_TIMEOUT"],
    ["ada@example.com", "inquiry_read_failed"],
  ])("sanitizes a generic dependency code %s", async (code, expectedCode) => {
    const deps = dependencies();
    deps.getInquiry.mockRejectedValue({ code });
    deps.complete.mockResolvedValue("retry");

    await expect(processInquiryNotification(CLAIM, deps)).resolves.toBe("queued");
    expect(deps.complete).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: expectedCode }),
    );
  });

  it("queues instead of sending when the internal recipient is missing", async () => {
    delete process.env.CONTACT_EMAIL;
    const deps = dependencies();
    deps.complete.mockResolvedValue("retry");

    await expect(processInquiryNotification(CLAIM, deps)).resolves.toBe("queued");
    expect(deps.send).not.toHaveBeenCalled();
    expect(deps.complete).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: "missing_contact_email" }),
    );
  });

  it("records a thrown provider call as a retry", async () => {
    const deps = dependencies();
    deps.send.mockRejectedValue(new Error("network"));
    deps.complete.mockResolvedValue("retry");

    await expect(processInquiryNotification(CLAIM, deps)).resolves.toBe("queued");
    expect(deps.complete).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: "send_exception" }),
    );
  });

  it.each([
    [undefined, "provider_error"],
    ["invalid code with PII ada@example.com", "provider_error"],
  ])("sanitizes provider code %s", async (code, expectedCode) => {
    const deps = dependencies();
    deps.send.mockResolvedValue({
      ok: false,
      code: code ?? "provider_error",
    });
    deps.complete.mockResolvedValue("retry");

    await expect(processInquiryNotification(CLAIM, deps)).resolves.toBe("queued");
    expect(deps.complete).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: expectedCode }),
    );
  });
});
