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
  it("returns the admin email after setting the session", async () => {
    const { setSessionCookie, getCurrentAdmin } = await load();
    await setSessionCookie("admin@example.com");
    const email = await getCurrentAdmin();
    expect(email).toBe("admin@example.com");
  });

  it("returns null when no cookie exists", async () => {
    const { getCurrentAdmin } = await load();
    const email = await getCurrentAdmin();
    expect(email).toBeNull();
  });

  it("returns null for a tampered cookie", async () => {
    const { setSessionCookie, getCurrentAdmin } = await load();
    await setSessionCookie("admin@example.com");
    // simulate tampering by loading fresh module and changing secret
    process.env.ADMIN_SESSION_SECRET = "different-secret-32-chars-long!!";
    vi.resetModules();
    const { getCurrentAdmin: getCurrentAdmin2 } = await load();
    const email = await getCurrentAdmin2();
    expect(email).toBeNull();
  });
});
