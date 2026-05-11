import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "test-secret-thirty-two-chars-or-more-yes";
  process.env.BCRYPT_ROUNDS = "4"; // fast for tests
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

async function load() {
  return import("./admin-auth");
}

const SAMPLE_ADMIN = { id: "00000000-0000-0000-0000-000000000001", email: "admin@example.com", nombre: "Admin" };

describe("hashPassword / verifyPassword", () => {
  it("hashes and verifies a password", async () => {
    const { hashPassword, verifyPassword } = await load();
    const hash = await hashPassword("my-secret-password");
    expect(await verifyPassword("my-secret-password", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("produces different hashes for the same password", async () => {
    const { hashPassword } = await load();
    const h1 = await hashPassword("same");
    const h2 = await hashPassword("same");
    expect(h1).not.toBe(h2);
  });
});

describe("session cookie round-trip", () => {
  it("returns the admin after setting the session", async () => {
    const { setSessionCookie, getCurrentAdmin } = await load();
    await setSessionCookie(SAMPLE_ADMIN);
    const session = await getCurrentAdmin();
    expect(session?.email).toBe("admin@example.com");
    expect(session?.id).toBe(SAMPLE_ADMIN.id);
  });

  it("returns null when no cookie exists", async () => {
    const { getCurrentAdmin } = await load();
    const session = await getCurrentAdmin();
    expect(session).toBeNull();
  });

  it("returns null for a tampered cookie", async () => {
    const { setSessionCookie, getCurrentAdmin } = await load();
    await setSessionCookie(SAMPLE_ADMIN);
    process.env.ADMIN_SESSION_SECRET = "different-secret-32-chars-long!!";
    vi.resetModules();
    const { getCurrentAdmin: getCurrentAdmin2 } = await load();
    const session = await getCurrentAdmin2();
    expect(session).toBeNull();
  });
});

describe("verifyAdminSession (edge-compatible)", () => {
  it("returns the admin when given a valid cookie header", async () => {
    const { setSessionCookie, verifyAdminSession } = await load();
    await setSessionCookie(SAMPLE_ADMIN);
    // Pull the value from the in-memory test cookie store by reading via
    // next/headers stub, then build a fake Cookie header.
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    const token = jar.get("admin_session")?.value;
    expect(token).toBeTruthy();
    const session = await verifyAdminSession(`admin_session=${token}; other=foo`);
    expect(session?.email).toBe("admin@example.com");
  });

  it("returns null when the cookie header is missing", async () => {
    const { verifyAdminSession } = await load();
    expect(await verifyAdminSession(null)).toBeNull();
    expect(await verifyAdminSession(undefined)).toBeNull();
    expect(await verifyAdminSession("")).toBeNull();
  });
});
