import { describe, expect, it, vi } from "vitest";
import {
  MAX_ATTEMPTS,
  RETRY_DELAYS_MS,
  createSupabaseRetryingFetch,
} from "@/lib/supabase-retry-fetch";

function transientAuthFailure(): Response {
  return new Response(
    JSON.stringify({
      code: "PGRST303",
      message: "JWT claims validation or parsing failed",
    }),
    { status: 401, headers: { "content-type": "application/json" } },
  );
}

function invalidKeyFailure(): Response {
  return new Response(
    JSON.stringify({ code: "PGRST301", message: "invalid JWT" }),
    { status: 401 },
  );
}

function ok(body = '{"ok":true}'): Response {
  return new Response(body, { status: 200 });
}

function harness(responses: Response[]) {
  const slept: number[] = [];
  const retries: number[] = [];
  const fetchImpl = vi.fn(async () => {
    const next = responses.shift();
    if (!next) throw new Error("unexpected extra request");
    return next;
  });
  const retryingFetch = createSupabaseRetryingFetch({
    fetchImpl,
    sleep: async (ms) => {
      slept.push(ms);
    },
    onRetry: (attempt) => {
      retries.push(attempt);
    },
  });
  return { fetchImpl, retryingFetch, retries, slept };
}

describe("createSupabaseRetryingFetch", () => {
  it("retries a transient JWT validation failure and returns the success", async () => {
    const { fetchImpl, retryingFetch, retries, slept } = harness([
      transientAuthFailure(),
      ok(),
    ]);

    const response = await retryingFetch("https://db.example.com/rest/v1/rpc/x", {
      method: "POST",
      body: '{"p_limit":10}',
    });

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('{"ok":true}');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(retries).toEqual([2]);
    expect(slept).toEqual([RETRY_DELAYS_MS[0]]);
  });

  it("gives up after the attempt budget and returns the last failure", async () => {
    const { fetchImpl, retryingFetch, retries, slept } = harness([
      transientAuthFailure(),
      transientAuthFailure(),
      transientAuthFailure(),
    ]);

    const response = await retryingFetch("https://db.example.com/rest/v1/x");

    expect(response.status).toBe(401);
    await expect(response.text()).resolves.toContain("PGRST303");
    expect(fetchImpl).toHaveBeenCalledTimes(MAX_ATTEMPTS);
    expect(retries).toEqual([2, 3]);
    expect(slept).toEqual([...RETRY_DELAYS_MS]);
  });

  it("does not retry a 401 caused by a wrong or expired key", async () => {
    const { fetchImpl, retryingFetch, retries } = harness([invalidKeyFailure()]);

    const response = await retryingFetch("https://db.example.com/rest/v1/x");

    expect(response.status).toBe(401);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(retries).toEqual([]);
  });

  it("does not retry a database or transport error", async () => {
    const { fetchImpl, retryingFetch } = harness([
      new Response("boom", { status: 500 }),
    ]);

    const response = await retryingFetch("https://db.example.com/rest/v1/x");

    expect(response.status).toBe(500);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("propagates a rejected request instead of swallowing it", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    });
    const retryingFetch = createSupabaseRetryingFetch({ fetchImpl });

    await expect(retryingFetch("https://db.example.com/rest/v1/x")).rejects.toThrow(
      "network down",
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("returns the original failure when the body cannot be replayed", async () => {
    const { fetchImpl, retryingFetch, retries } = harness([
      transientAuthFailure(),
    ]);

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("{}"));
        controller.close();
      },
    });
    const response = await retryingFetch("https://db.example.com/rest/v1/x", {
      method: "POST",
      body,
      // Node requires this for a stream body; the guard runs before any send.
      duplex: "half",
    } as RequestInit);

    expect(response.status).toBe(401);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(retries).toEqual([]);
  });

  it("leaves the returned body readable after inspecting it", async () => {
    const { retryingFetch } = harness([transientAuthFailure(), ok('{"claimed":0}')]);

    const response = await retryingFetch("https://db.example.com/rest/v1/x", {
      body: "{}",
    });

    await expect(response.json()).resolves.toEqual({ claimed: 0 });
  });
});
