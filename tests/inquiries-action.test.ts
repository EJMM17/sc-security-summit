import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INQUIRY_CONSENT_VERSION } from "@/lib/inquiries/constants";

vi.mock("@/server/use-cases/submit-inquiry", () => ({
  submitInquiryUseCase: vi.fn(),
}));

import { submitInquiry } from "@/app/actions/inquiries";
import { submitInquiryUseCase } from "@/server/use-cases/submit-inquiry";

const mockedUseCase = vi.mocked(submitInquiryUseCase);

function validSponsorForm(): FormData {
  const formData = new FormData();
  Object.entries({
    kind: "sponsor",
    submissionId: "ea1358d1-b0cd-4f99-ae48-b3df545f40c8",
    name: "Grace Hopper",
    email: "grace@example.com",
    company: "Compilers Inc.",
    phone: "+52 899 765 4321",
    interest: "We would like information about the premium sponsorship package.",
    language: "en",
    consentVersion: INQUIRY_CONSENT_VERSION,
    website: "",
  }).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe("submitInquiry server action", () => {
  beforeEach(() => {
    mockedUseCase.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects visual Preview before reading form data or invoking the use case", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "preview");
    const get = vi.fn();

    await expect(
      submitInquiry({ get } as unknown as FormData),
    ).resolves.toEqual({
      ok: false,
      reason: "storage_unavailable",
    });
    expect(get).not.toHaveBeenCalled();
    expect(mockedUseCase).not.toHaveBeenCalled();
  });

  it("returns a false success for the honeypot without persistence", async () => {
    const formData = new FormData();
    formData.set("website", "https://spam.example");

    const result = await submitInquiry(formData);
    expect(result.ok).toBe(true);
    expect(mockedUseCase).not.toHaveBeenCalled();
  });

  it("rejects invalid forms before the use case", async () => {
    const formData = validSponsorForm();
    formData.set("email", "not-an-email");

    await expect(submitInquiry(formData)).resolves.toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(mockedUseCase).not.toHaveBeenCalled();
  });

  it("converts FormData and delegates a valid request", async () => {
    mockedUseCase.mockResolvedValue({
      ok: true,
      inquiryId: "02b99bb9-23ab-4c6e-8dc3-a5819ba65506",
      notification: "queued",
    });

    await submitInquiry(validSponsorForm());
    expect(mockedUseCase).toHaveBeenCalledOnce();
    expect(mockedUseCase.mock.calls[0][0]).toMatchObject({
      kind: "sponsor",
      email: "grace@example.com",
      language: "en",
    });
  });

  it("converts an unexpected exception to a typed result", async () => {
    mockedUseCase.mockRejectedValue(new Error("unexpected"));
    await expect(submitInquiry(validSponsorForm())).resolves.toEqual({
      ok: false,
      reason: "unexpected",
    });
  });
});
