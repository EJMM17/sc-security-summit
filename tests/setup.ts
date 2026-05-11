// Vitest global setup: fill in env vars that env.ts validates so that
// importing modules with transitive deps on env (e.g. lib/supabase) does
// not throw during tests.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
process.env.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000";

// next/headers `cookies()` requires a real request scope, which doesn't
// exist under vitest. Provide an in-memory store so cookie round-trip
// tests can run in plain node.
import { beforeEach, vi } from "vitest";

const COOKIE_STORE = new Map<string, { value: string }>();

beforeEach(() => {
  COOKIE_STORE.clear();
});

vi.mock("next/headers", () => {
  return {
    cookies: async () => ({
      get: (name: string) => COOKIE_STORE.get(name),
      set: (
        name: string,
        value: string,
        _opts?: Record<string, unknown>,
      ) => {
        COOKIE_STORE.set(name, { value });
      },
      delete: (name: string) => {
        COOKIE_STORE.delete(name);
      },
    }),
    headers: async () => new Map<string, string>(),
  };
});

// Stub the Supabase admin client so tests don't reach a real network. Tests
// that need a specific DB shape can override per-test with vi.mocked().
vi.mock("@/lib/supabase", () => {
  const adminThenable = {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: async () => ({ data: { email: "admin@example.com", active: true }, error: null }),
          }),
          single: async () => ({ data: null, error: null }),
        }),
      }),
    }),
    rpc: async () => ({ data: 0, error: null }),
  };
  return {
    supabasePublic: adminThenable,
    supabaseAdmin: adminThenable,
    createPublicClient: () => adminThenable,
    createAdminClient: () => adminThenable,
  };
});
