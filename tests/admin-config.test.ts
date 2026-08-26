import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  adminAccessKey,
  adminPassword,
  adminSessionSecret,
  isAdminLinkGateEnabled,
  isAdminPanelConfigured,
} from "@/lib/admin/config";

const ORIGINAL = {
  password: process.env.ADMIN_PASSWORD,
  secret: process.env.ADMIN_SESSION_SECRET,
};

function setSecrets(password?: string, secret?: string) {
  if (password === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = password;
  if (secret === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = secret;
}

beforeEach(() => setSecrets(undefined, undefined));

afterEach(() => setSecrets(ORIGINAL.password, ORIGINAL.secret));

describe("admin panel configuration", () => {
  it("is disabled when neither secret is present", () => {
    expect(isAdminPanelConfigured()).toBe(false);
    expect(adminPassword()).toBeNull();
    expect(adminSessionSecret()).toBeNull();
  });

  it("is disabled when only one secret is present", () => {
    setSecrets("a-sufficiently-long-password", undefined);
    expect(isAdminPanelConfigured()).toBe(false);

    setSecrets(undefined, "a-sufficiently-long-session-secret");
    expect(isAdminPanelConfigured()).toBe(false);
  });

  it("rejects short or whitespace-bearing secrets", () => {
    setSecrets("short", "a-sufficiently-long-session-secret");
    expect(isAdminPanelConfigured()).toBe(false);

    setSecrets("has whitespace inside it", "a-sufficiently-long-session-secret");
    expect(isAdminPanelConfigured()).toBe(false);
  });

  it("is enabled with both usable secrets and trims them", () => {
    setSecrets("  a-sufficiently-long-password  ", "a-sufficiently-long-session-secret");
    expect(isAdminPanelConfigured()).toBe(true);
    expect(adminPassword()).toBe("a-sufficiently-long-password");
  });
});

describe("private-link gate", () => {
  const ORIGINAL_KEY = process.env.ADMIN_ACCESS_KEY;

  afterEach(() => {
    if (ORIGINAL_KEY === undefined) delete process.env.ADMIN_ACCESS_KEY;
    else process.env.ADMIN_ACCESS_KEY = ORIGINAL_KEY;
  });

  it("is off when no access key is configured", () => {
    delete process.env.ADMIN_ACCESS_KEY;
    expect(isAdminLinkGateEnabled()).toBe(false);
    expect(adminAccessKey()).toBeNull();
  });

  it("ignores a key that is too short or carries whitespace", () => {
    process.env.ADMIN_ACCESS_KEY = "short-key";
    expect(isAdminLinkGateEnabled()).toBe(false);

    process.env.ADMIN_ACCESS_KEY = `${"a".repeat(20)} ${"b".repeat(20)}`;
    expect(isAdminLinkGateEnabled()).toBe(false);
  });

  it("turns on with a long key and trims it", () => {
    const key = "k".repeat(40);
    process.env.ADMIN_ACCESS_KEY = `  ${key}  `;
    expect(isAdminLinkGateEnabled()).toBe(true);
    expect(adminAccessKey()).toBe(key);
  });
});
