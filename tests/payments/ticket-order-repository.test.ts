import { describe, expect, it } from "vitest";
import { orderRetentionDateFrom } from "@/server/repositories/ticket-order-repository";

describe("orderRetentionDateFrom", () => {
  it("retains a fiscal record for five years by default", () => {
    expect(orderRetentionDateFrom(new Date("2026-08-24T12:00:00.000Z"))).toBe(
      "2031-08-24",
    );
  });

  it("clamps an end-of-month date instead of rolling into the next month", () => {
    // 2026-08-31 + 6 months is 2027-02-31, which does not exist.
    expect(orderRetentionDateFrom(new Date("2026-08-31T00:00:00.000Z"), 6)).toBe(
      "2027-02-28",
    );
    expect(orderRetentionDateFrom(new Date("2027-08-31T00:00:00.000Z"), 6)).toBe(
      "2028-02-29",
    );
  });

  it("handles a leap day origin", () => {
    expect(orderRetentionDateFrom(new Date("2028-02-29T00:00:00.000Z"), 12)).toBe(
      "2029-02-28",
    );
  });
});
