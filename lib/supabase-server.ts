import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

let client: SupabaseClient<Database> | null = null;
let clientSignature = "";

export class SupabaseConfigurationError extends Error {
  constructor() {
    super("Supabase server configuration is unavailable");
    this.name = "SupabaseConfigurationError";
  }
}

function getServerConfiguration(): { url: string; secretKey: string } {
  const url = process.env.SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secretKey || !URL.canParse(url)) {
    throw new SupabaseConfigurationError();
  }

  const parsedUrl = new URL(url);
  const localHttp =
    parsedUrl.protocol === "http:" &&
    ["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsedUrl.hostname);
  if (
    (parsedUrl.protocol !== "https:" && !localHttp) ||
    parsedUrl.username ||
    parsedUrl.password
  ) {
    throw new SupabaseConfigurationError();
  }

  return { url, secretKey };
}

/**
 * Creates one backend-only client. It never reads cookies, persists sessions,
 * or exposes the elevated key to a client component.
 */
export function getSupabaseServerClient(): SupabaseClient<Database> {
  const { url, secretKey } = getServerConfiguration();
  const signature = `${url}\0${secretKey}`;

  if (!client || clientSignature !== signature) {
    client = createClient<Database>(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
    clientSignature = signature;
  }

  return client;
}
