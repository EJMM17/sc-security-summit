import { afterEach, describe, expect, it, vi } from "vitest";
import {
  captureAttribution,
  clearAttribution,
  getAttributionPayload,
} from "@/lib/attribution";
import { COOKIE_CONSENT_STORAGE_KEY } from "@/lib/consent";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function browser(options?: {
  consent?: "all" | "essential";
  pathname?: string;
  search?: string;
  referrer?: string;
}) {
  const storage = new MemoryStorage();
  if (options?.consent) {
    storage.setItem(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify({ decision: options.consent, ts: Date.now() }),
    );
  }

  const cookies = new Map<string, string>();
  const documentStub = { referrer: options?.referrer ?? "" };
  Object.defineProperty(documentStub, "cookie", {
    configurable: true,
    get: () =>
      [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; "),
    set: (serialized: string) => {
      const [pair] = serialized.split(";");
      const separator = pair.indexOf("=");
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      if (/Max-Age=0/i.test(serialized)) cookies.delete(name);
      else cookies.set(name, value);
    },
  });

  vi.stubGlobal("window", {
    localStorage: storage,
    location: {
      pathname: options?.pathname ?? "/registro",
      search: options?.search ?? "",
    },
  });
  vi.stubGlobal("document", documentStub);
  return { cookies, storage };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("privacy-gated attribution", () => {
  it("does not capture and removes legacy stores without consent", () => {
    const { cookies, storage } = browser();
    storage.setItem("scss:attribution", '{"legacy":"pii@example.com"}');
    cookies.set("scss_attr", encodeURIComponent('{"legacy":"pii@example.com"}'));

    captureAttribution();

    expect(storage.getItem("scss:attribution")).toBeNull();
    expect(cookies.has("scss_attr")).toBe(false);
    expect(Object.values(getAttributionPayload()).every((value) => value === "")).toBe(
      true,
    );
  });

  it("captures only a landing path and referrer origin after opt-in", () => {
    const { storage } = browser({
      consent: "all",
      pathname: "/registro",
      search:
        "?utm_source=linkedin&gclid=CLICK-123&email=pii%40example.com",
      referrer: "https://partner.example/path?email=pii@example.com",
    });

    captureAttribution();
    const payload = getAttributionPayload();
    const serializedStore = storage.getItem("scss:attribution") ?? "";

    expect(payload.utm_source).toBe("linkedin");
    expect(payload.gclid).toBe("CLICK-123");
    expect(payload.landing_page).toBe("/registro");
    expect(payload.referrer).toBe("https://partner.example");
    expect(serializedStore).not.toContain("pii@example.com");
    expect(serializedStore).not.toContain("email=");
  });

  it("clears attribution when consent is withdrawn", () => {
    const { cookies, storage } = browser({ consent: "all" });
    captureAttribution();
    expect(storage.getItem("scss:attribution")).not.toBeNull();

    clearAttribution();

    expect(storage.getItem("scss:attribution")).toBeNull();
    expect(cookies.has("scss_attr")).toBe(false);
  });
});
