import "server-only";

import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  COUPON_DISCOUNT_TYPES,
  isLookupableDiscountCode,
  normalizeDiscountCode,
  type CouponDefinition,
  type CouponDiscountType,
} from "@/lib/payments/coupons";

/**
 * Discount codes live in the database and are read only from the server.
 *
 * The browser never sees the list and never sees a coupon row: it sends a
 * string, and the server answers whether that string bought a discount. This
 * module is the only place that reads `public.coupons`.
 */

export class CouponRepositoryError extends Error {
  readonly code: string;

  constructor(operation: string, error: unknown) {
    const code = safeTechnicalCode(error);
    super(`Coupon repository operation failed: ${operation} (${code})`);
    this.name = "CouponRepositoryError";
    this.code = code;
  }
}

function safeTechnicalCode(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return "database_error";
  }
  const code = String(error.code);
  return /^[a-zA-Z0-9_.-]{1,64}$/.test(code) ? code : "database_error";
}

const couponRowSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(2).max(40),
  discount_type: z.enum(
    COUPON_DISCOUNT_TYPES as unknown as [CouponDiscountType, ...CouponDiscountType[]],
  ),
  discount_basis_points: z.coerce.number().int().nonnegative().nullable(),
  discount_amount_cents: z.coerce.number().int().nonnegative().nullable(),
  active: z.boolean(),
  starts_at: z.string().nullable(),
  expires_at: z.string().nullable(),
  max_uses: z.coerce.number().int().nonnegative().nullable(),
  max_uses_per_customer: z.coerce.number().int().nonnegative().nullable(),
  minimum_purchase_cents: z.coerce.number().int().nonnegative().nullable(),
  maximum_discount_cents: z.coerce.number().int().nonnegative().nullable(),
});

const COUPON_COLUMNS =
  "id,code,discount_type,discount_basis_points,discount_amount_cents,active,starts_at,expires_at,max_uses,max_uses_per_customer,minimum_purchase_cents,maximum_discount_cents";

/**
 * Looks a normalized code up. A code that could not be a code is never sent to
 * the database at all, and a code nobody issued is simply absent — neither is
 * an error, both mean "no discount".
 */
export async function findCouponByCode(
  rawCode: string,
): Promise<CouponDefinition | null> {
  const code = normalizeDiscountCode(rawCode);
  if (!isLookupableDiscountCode(code)) return null;

  const { data, error } = await getSupabaseServerClient()
    .from("coupons")
    .select(COUPON_COLUMNS)
    .eq("code", code)
    .maybeSingle();

  if (error) throw new CouponRepositoryError("find_coupon", error);
  if (!data) return null;

  const parsed = couponRowSchema.safeParse(data);
  if (!parsed.success) {
    throw new CouponRepositoryError("find_coupon_response", {
      code: "invalid_response",
    });
  }

  const row = parsed.data;
  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type,
    discountBasisPoints: row.discount_basis_points,
    discountAmountCents: row.discount_amount_cents,
    active: row.active,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    maxUses: row.max_uses,
    maxUsesPerCustomer: row.max_uses_per_customer,
    minimumPurchaseCents: row.minimum_purchase_cents,
    maximumDiscountCents: row.maximum_discount_cents,
  };
}

/**
 * Uses already reserved or confirmed for a coupon.
 *
 * Nothing limits uses today, so this is only read when a coupon actually
 * carries a `max_uses`. The definitive check is in `create_ticket_order`,
 * inside the transaction that writes the reservation; this one exists so the
 * form can say "no longer available" before the buyer reaches MercadoPago.
 */
export async function countCouponRedemptions(
  couponId: string,
): Promise<number> {
  const { count, error } = await getSupabaseServerClient()
    .from("coupon_uses")
    .select("id", { count: "exact", head: true })
    .eq("coupon_id", couponId)
    .in("status", ["reserved", "used"]);

  if (error) throw new CouponRepositoryError("count_coupon_uses", error);
  return count ?? 0;
}
