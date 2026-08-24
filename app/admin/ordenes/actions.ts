"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasAdminSession } from "@/lib/admin/auth";
import {
  getTicketOrder,
  updateTicketOrderOperations,
} from "@/server/repositories/admin-ticket-order-repository";

export type OrderUpdateState = {
  error?: "unauthorized" | "invalid" | "not_found" | "unavailable";
  saved?: boolean;
};

const updateSchema = z.object({
  id: z.string().uuid(),
  // `not_requested` is intentionally absent: the database ties it to
  // requires_invoice, and Operations must not be able to erase the fact that
  // a buyer asked for a CFDI.
  invoiceStatus: z.enum(["requested", "issued", "cancelled"]),
  cfdiUuid: z
    .string()
    .trim()
    .toUpperCase()
    .transform((value) => (value === "" ? null : value))
    .refine(
      (value) =>
        value === null ||
        /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/.test(
          value,
        ),
      "cfdi_uuid",
    ),
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
});

export async function updateTicketOrder(
  _previous: OrderUpdateState,
  formData: FormData,
): Promise<OrderUpdateState> {
  if (!(await hasAdminSession())) return { error: "unauthorized" };

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    invoiceStatus: formData.get("invoiceStatus"),
    cfdiUuid: formData.get("cfdiUuid") ?? "",
    owner: formData.get("owner") ?? "",
    internalNotes: formData.get("internalNotes") ?? "",
  });
  if (!parsed.success) return { error: "invalid" };

  // A CFDI marked issued without its fiscal folio is not evidence of anything.
  if (parsed.data.invoiceStatus === "issued" && !parsed.data.cfdiUuid) {
    return { error: "invalid" };
  }

  try {
    const order = await getTicketOrder(parsed.data.id);
    if (!order) return { error: "not_found" };
    // An order whose buyer never asked for a CFDI has no invoice workflow.
    if (!order.requires_invoice) return { error: "invalid" };

    await updateTicketOrderOperations(parsed.data);
  } catch {
    return { error: "unavailable" };
  }

  revalidatePath(`/admin/ordenes/${parsed.data.id}`);
  revalidatePath("/admin/ordenes");
  return { saved: true };
}
