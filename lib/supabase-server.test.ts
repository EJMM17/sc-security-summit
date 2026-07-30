import { afterEach, describe, expect, it } from "vitest";
import {
  getSupabaseServerClient,
  SupabaseConfigurationError,
} from "@/lib/supabase-server";

const originalUrl = process.env.SUPABASE_URL;
const originalKey = process.env.SUPABASE_SECRET_KEY;

afterEach(() => {
  if (originalUrl === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = originalUrl;
  if (originalKey === undefined) delete process.env.SUPABASE_SECRET_KEY;
  else process.env.SUPABASE_SECRET_KEY = originalKey;
});

describe("getSupabaseServerClient", () => {
  it("accepts HTTPS for hosted Supabase", () => {
    process.env.SUPABASE_URL = "https://project-ref.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    expect(getSupabaseServerClient()).toBeDefined();
  });

  it.each([
    "http://127.0.0.1:54321",
    "http://localhost:54321",
    "http://[::1]:54321",
  ])("accepts the local Supabase HTTP endpoint %s", (url) => {
    process.env.SUPABASE_URL = url;
    process.env.SUPABASE_SECRET_KEY = "local-secret-key";
    expect(getSupabaseServerClient()).toBeDefined();
  });

  it("rejects insecure non-local endpoints", () => {
    process.env.SUPABASE_URL = "http://supabase.example.com";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    expect(() => getSupabaseServerClient()).toThrow(SupabaseConfigurationError);
  });

  it("rejects missing keys and URL credentials", () => {
    process.env.SUPABASE_URL = "https://user:password@project-ref.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    expect(() => getSupabaseServerClient()).toThrow(SupabaseConfigurationError);

    delete process.env.SUPABASE_SECRET_KEY;
    expect(() => getSupabaseServerClient()).toThrow(SupabaseConfigurationError);
  });
});

