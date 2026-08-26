import "server-only";

/**
 * PostgREST code for "JWT claims validation or parsing failed", returned with
 * HTTP 401.
 *
 * Production sees this sporadically on requests that carry the same, valid
 * `SUPABASE_SECRET_KEY` that succeeds the rest of the time: on 2026-08-26 the
 * cron lost roughly six calls an hour to it, each one skipping a whole
 * notification batch or a whole reconciliation sweep. Retrying is safe because
 * a 401 is decided at the API gateway, before the request reaches the
 * database: the statement never ran, so replaying it cannot double-apply a
 * write.
 *
 * This is a mitigation, not the fix. A key that fails validation at all still
 * has to be diagnosed and rotated; see `docs/RUNBOOK.md`.
 */
export const TRANSIENT_AUTH_ERROR_CODE = "PGRST303";

export const MAX_ATTEMPTS = 3;

/**
 * Short waits on purpose. The cron has a request budget to respect, and the
 * failure clears on the next attempt when it clears at all — a long backoff
 * would only turn a lost batch into a timed-out one.
 */
export const RETRY_DELAYS_MS = [150, 500] as const;

type FetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type SupabaseRetryingFetchOptions = {
  fetchImpl?: FetchImplementation;
  sleep?: (ms: number) => Promise<void>;
  /** Called before each retry with the attempt number that is about to run. */
  onRetry?: (attempt: number) => void;
};

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * A request can only be replayed when its body can be sent twice. Strings,
 * bytes and encoded forms can; a stream is consumed by the first attempt, so
 * such a request is returned with its original failure rather than corrupted
 * by a second send. `supabase-js` serializes to a string, so this guard costs
 * nothing in practice and protects anything that does not.
 */
function isReplayable(init: RequestInit | undefined): boolean {
  const body = init?.body;
  return (
    body === undefined ||
    body === null ||
    typeof body === "string" ||
    body instanceof Uint8Array ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams
  );
}

/**
 * Reads a copy of the body, so the response handed back to the caller is
 * still unread. An unreadable body is treated as "not the transient failure":
 * the caller sees the original 401 instead of a retry it did not earn.
 */
async function isTransientAuthFailure(response: Response): Promise<boolean> {
  if (response.status !== 401) return false;
  try {
    const body = await response.clone().text();
    return body.includes(TRANSIENT_AUTH_ERROR_CODE);
  } catch {
    return false;
  }
}

/**
 * Wraps `fetch` so a Supabase call rejected with a transient JWT validation
 * failure is retried instead of failing the caller.
 *
 * Every other status — including every other 401 — is returned untouched. An
 * expired, wrong or missing key must still surface immediately: hiding it
 * behind retries would turn a misconfiguration into a slow, silent one.
 */
export function createSupabaseRetryingFetch(
  options: SupabaseRetryingFetchOptions = {},
): FetchImplementation {
  const {
    fetchImpl = fetch,
    sleep = defaultSleep,
    onRetry = () => {},
  } = options;

  return async function retryingFetch(input, init) {
    let lastResponse = await fetchImpl(input, init);

    for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt += 1) {
      if (!isReplayable(init)) return lastResponse;
      if (!(await isTransientAuthFailure(lastResponse))) return lastResponse;

      onRetry(attempt + 1);
      await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 0);
      lastResponse = await fetchImpl(input, init);
    }

    return lastResponse;
  };
}
