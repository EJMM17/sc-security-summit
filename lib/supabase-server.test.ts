import { afterEach, describe, expect, it } from "vitest";
import deploymentContract from "@/config/deployment-contract.json";
import {
  getSupabaseServerClient,
  SupabaseConfigurationError,
} from "@/lib/supabase-server";

const originalUrl = process.env.SUPABASE_URL;
const originalKey = process.env.SUPABASE_SECRET_KEY;
const originalVercel = process.env.VERCEL;
const originalVercelEnvironment = process.env.VERCEL_ENV;
const originalVercelTargetEnvironment = process.env.VERCEL_TARGET_ENV;
const productionUrl = `https://${deploymentContract.supabaseProductionHost}`;

afterEach(() => {
  if (originalUrl === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = originalUrl;
  if (originalKey === undefined) delete process.env.SUPABASE_SECRET_KEY;
  else process.env.SUPABASE_SECRET_KEY = originalKey;
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
  if (originalVercelEnvironment === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalVercelEnvironment;
  if (originalVercelTargetEnvironment === undefined) {
    delete process.env.VERCEL_TARGET_ENV;
  } else {
    process.env.VERCEL_TARGET_ENV = originalVercelTargetEnvironment;
  }
});

describe("getSupabaseServerClient", () => {
  it("accepts HTTPS for hosted Supabase", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_TARGET_ENV = "production";
    process.env.SUPABASE_URL = productionUrl;
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

  it("rejects local Supabase endpoints in Vercel Production", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_TARGET_ENV = "production";
    process.env.SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.SUPABASE_SECRET_KEY = "local-secret-key";

    expect(() => getSupabaseServerClient()).toThrow(SupabaseConfigurationError);
  });

  it("rejects insecure non-local endpoints", () => {
    process.env.SUPABASE_URL = "http://supabase.example.com";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    expect(() => getSupabaseServerClient()).toThrow(SupabaseConfigurationError);
  });

  it("rejects HTTPS endpoints outside the Supabase hosted domain", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_TARGET_ENV = "production";
    process.env.SUPABASE_URL = "https://attacker.example.com";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";

    expect(() => getSupabaseServerClient()).toThrow(SupabaseConfigurationError);
  });

  it("rejects a different hosted Supabase project in Production", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_TARGET_ENV = "production";
    process.env.SUPABASE_URL = "https://different-project.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";

    expect(() => getSupabaseServerClient()).toThrow(SupabaseConfigurationError);
  });

  it("rejects a hosted Supabase URL with a custom port", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_TARGET_ENV = "production";
    process.env.SUPABASE_URL = `${productionUrl}:8443`;
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";

    expect(() => getSupabaseServerClient()).toThrow(SupabaseConfigurationError);
  });

  it("rejects hosted Supabase outside Vercel Production", () => {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_TARGET_ENV;
    process.env.SUPABASE_URL = "https://project-ref.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_accidentally_copied";

    expect(() => getSupabaseServerClient()).toThrow(SupabaseConfigurationError);
  });

  it("rejects missing keys and URL credentials", () => {
    process.env.SUPABASE_URL = "https://user:password@project-ref.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    expect(() => getSupabaseServerClient()).toThrow(SupabaseConfigurationError);

    delete process.env.SUPABASE_SECRET_KEY;
    expect(() => getSupabaseServerClient()).toThrow(SupabaseConfigurationError);
  });

  it("rejects Vercel Preview even when Supabase credentials are present", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "preview";
    process.env.SUPABASE_URL = "https://project-ref.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_accidentally_scoped";

    expect(() => getSupabaseServerClient()).toThrow(SupabaseConfigurationError);
  });

  it("fails closed for custom Vercel targets", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_TARGET_ENV = "staging";
    process.env.SUPABASE_URL = "https://project-ref.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_isolated";

    expect(() => getSupabaseServerClient()).toThrow(SupabaseConfigurationError);
  });
});
