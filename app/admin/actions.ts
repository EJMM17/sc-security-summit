"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  adminCookieName,
  adminCookieOptions,
  hasAdminSession,
} from "@/lib/admin/auth";
import {
  adminPassword,
  adminSessionSecret,
  isAdminPanelConfigured,
} from "@/lib/admin/config";
import { createAdminSessionToken, passwordMatches } from "@/lib/admin/session";
import { checkRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";
import { INQUIRY_STATUSES } from "@/lib/admin/types";
import { updateInquiryOperations } from "@/server/repositories/admin-inquiry-repository";

export type LoginState = { error?: "invalid" | "rate_limited" | "unavailable" };

export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isAdminPanelConfigured()) return { error: "unavailable" };

  const expected = adminPassword();
  const secret = adminSessionSecret();
  if (!expected || !secret) return { error: "unavailable" };

  try {
    await checkRateLimit(`admin-login:${await getClientIp()}`);
  } catch (error) {
    if (error instanceof RateLimitError) return { error: "rate_limited" };
    return { error: "unavailable" };
  }

  const candidate = formData.get("password");
  if (typeof candidate !== "string" || !passwordMatches(candidate, expected)) {
    return { error: "invalid" };
  }

  const store = await cookies();
  store.set(adminCookieName(), createAdminSessionToken(secret), adminCookieOptions());
  redirect("/admin");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(adminCookieName());
  redirect("/admin/login");
}

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(INQUIRY_STATUSES),
  // The database constrains owner to a short slug; mirror it here so the panel
  // reports a usable message instead of surfacing a constraint violation.
  owner: z
    .string()
    .trim()
    .max(160)
    .regex(/^[a-z0-9_.:-]*$/, "owner")
    .transform((value) => (value === "" ? null : value)),
  internalNotes: z
    .string()
    .trim()
    .max(5000)
    .transform((value) => (value === "" ? null : value)),
  nextFollowUpAt: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .refine(
      (value) => value === null || !Number.isNaN(Date.parse(value)),
      "date",
    )
    .transform((value) => (value === null ? null : new Date(value).toISOString())),
});

export type UpdateState = { ok?: true; error?: "invalid" | "unavailable" };

export async function updateInquiry(
  _previous: UpdateState,
  formData: FormData,
): Promise<UpdateState> {
  if (!(await hasAdminSession())) return { error: "unavailable" };

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    owner: formData.get("owner") ?? "",
    internalNotes: formData.get("internalNotes") ?? "",
    nextFollowUpAt: formData.get("nextFollowUpAt") ?? "",
  });
  if (!parsed.success) return { error: "invalid" };

  try {
    await updateInquiryOperations(parsed.data.id, {
      status: parsed.data.status,
      owner: parsed.data.owner,
      internalNotes: parsed.data.internalNotes,
      nextFollowUpAt: parsed.data.nextFollowUpAt,
    });
  } catch {
    return { error: "unavailable" };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/${parsed.data.id}`);
  return { ok: true };
}
