import { beforeEach, describe, expect, it, vi } from "vitest";

type QueryCall = { op: string; args: unknown[] };

const state = {
  calls: [] as Array<{ table: string; calls: QueryCall[] }>,
  responses: new Map<string, { data: unknown; error: unknown }>(),
};

function builder(table: string) {
  const record: { table: string; calls: QueryCall[] } = { table, calls: [] };
  state.calls.push(record);

  const result = () =>
    state.responses.get(table) ?? { data: [], error: null };

  const chain: Record<string, unknown> = {
    then: (resolve: (value: unknown) => unknown) => resolve(result()),
    maybeSingle: async () => {
      const value = result();
      const data = Array.isArray(value.data) ? (value.data[0] ?? null) : value.data;
      return { data, error: value.error };
    },
  };

  for (const op of ["select", "order", "limit", "eq", "in", "or", "update"]) {
    chain[op] = (...args: unknown[]) => {
      record.calls.push({ op, args });
      return chain;
    };
  }
  return chain;
}

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServerClient: () => ({ from: (table: string) => builder(table) }),
}));

const {
  listInquiries,
  getInquiry,
  updateInquiryOperations,
} = await import("@/server/repositories/admin-inquiry-repository");

const INQUIRY_ROW = {
  id: "91c89b93-08a4-41c9-8f8e-2ab6923a9061",
  kind: "corporate",
  status: "new",
  contact_name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+52 899 123 4567",
  company: "Analytical Engines",
  job_title: "Directora",
  requested_seats: 4,
  interest: null,
  language: "es",
  owner: null,
  internal_notes: null,
  next_follow_up_at: null,
  created_at: "2026-08-01T10:00:00Z",
  updated_at: "2026-08-01T10:00:00Z",
  consent_version: "2026-07-30",
  consented_at: "2026-08-01T10:00:00Z",
  retention_until: "2028-02-01",
};

const NOTIFICATION_ROW = {
  inquiry_id: INQUIRY_ROW.id,
  status: "sent",
  attempt_count: 1,
  provider_message_id: "9958c675-beda-416a-8a19-048912cf3d03",
  last_error_code: null,
  last_error_at: null,
  sent_at: "2026-08-01T10:00:05Z",
  next_attempt_at: null,
};

function callsFor(table: string): QueryCall[] {
  return state.calls.filter((entry) => entry.table === table).flatMap((e) => e.calls);
}

beforeEach(() => {
  state.calls = [];
  state.responses = new Map([
    ["inquiries", { data: [INQUIRY_ROW], error: null }],
    ["inquiry_notifications", { data: [NOTIFICATION_ROW], error: null }],
  ]);
});

describe("listInquiries", () => {
  it("joins each inquiry with its notification status", async () => {
    const rows = await listInquiries();
    expect(rows).toHaveLength(1);
    expect(rows[0].company).toBe("Analytical Engines");
    expect(rows[0].notification?.status).toBe("sent");
    expect(rows[0].notification?.provider_message_id).toBe(
      NOTIFICATION_ROW.provider_message_id,
    );
  });

  it("applies status and kind filters but skips them when set to all", async () => {
    await listInquiries({ status: "new", kind: "sponsor" });
    const eqs = callsFor("inquiries").filter((call) => call.op === "eq");
    expect(eqs).toEqual([
      { op: "eq", args: ["status", "new"] },
      { op: "eq", args: ["kind", "sponsor"] },
    ]);

    state.calls = [];
    await listInquiries({ status: "all", kind: "all" });
    expect(callsFor("inquiries").filter((call) => call.op === "eq")).toEqual([]);
  });

  it("neutralizes PostgREST pattern characters in the search term", async () => {
    await listInquiries({ search: "acme%,(evil)" });
    const or = callsFor("inquiries").find((call) => call.op === "or");
    // The term keeps its words but loses every character PostgREST would read
    // as list or pattern syntax, so only the three intended wildcards remain.
    expect(or?.args[0]).toBe(
      "company.ilike.%acme   evil%,contact_name.ilike.%acme   evil%,email.ilike.%acme   evil%",
    );
  });

  it("clamps the page size", async () => {
    await listInquiries({ limit: 5000 });
    const limit = callsFor("inquiries").find((call) => call.op === "limit");
    expect(limit?.args[0]).toBe(200);
  });

  it("drops rows that do not match the expected shape", async () => {
    state.responses.set("inquiries", {
      data: [INQUIRY_ROW, { id: "not-a-uuid" }],
      error: null,
    });
    expect(await listInquiries()).toHaveLength(1);
  });

  it("raises a sanitized error when the query fails", async () => {
    state.responses.set("inquiries", {
      data: null,
      error: { code: "PGRST301", message: "connection to ada@example.com failed" },
    });
    await expect(listInquiries()).rejects.toThrow(/PGRST301/);
    await expect(listInquiries()).rejects.not.toThrow(/ada@example\.com/);
  });
});

describe("getInquiry", () => {
  it("returns null for an unknown id", async () => {
    state.responses.set("inquiries", { data: [], error: null });
    expect(await getInquiry(INQUIRY_ROW.id)).toBeNull();
  });

  it("returns the inquiry with its notification", async () => {
    const inquiry = await getInquiry(INQUIRY_ROW.id);
    expect(inquiry?.id).toBe(INQUIRY_ROW.id);
    expect(inquiry?.notification?.status).toBe("sent");
  });
});

describe("updateInquiryOperations", () => {
  it("writes only the four fields Operations may edit", async () => {
    await updateInquiryOperations(INQUIRY_ROW.id, {
      status: "contacted",
      owner: "ventas-01",
      internalNotes: "Llamada agendada",
      nextFollowUpAt: "2026-08-10T16:00:00.000Z",
    });

    const update = callsFor("inquiries").find((call) => call.op === "update");
    expect(Object.keys(update?.args[0] as object).sort()).toEqual([
      "internal_notes",
      "next_follow_up_at",
      "owner",
      "status",
    ]);

    const eq = callsFor("inquiries").find((call) => call.op === "eq");
    expect(eq?.args).toEqual(["id", INQUIRY_ROW.id]);
  });

  it("raises a sanitized error when the update fails", async () => {
    state.responses.set("inquiries", {
      data: null,
      error: { code: "23514" },
    });
    await expect(
      updateInquiryOperations(INQUIRY_ROW.id, {
        status: "won",
        owner: null,
        internalNotes: null,
        nextFollowUpAt: null,
      }),
    ).rejects.toThrow(/23514/);
  });
});
