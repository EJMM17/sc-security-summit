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
      set: (name: string, value: string) => {
        COOKIE_STORE.set(name, { value });
      },
      delete: (name: string) => {
        COOKIE_STORE.delete(name);
      },
    }),
    headers: async () => new Map<string, string>(),
  };
});
