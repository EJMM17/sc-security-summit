import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import deploymentContract from "@/config/deployment-contract.json";
import type { Database } from "@/lib/database.types";
import {
  isVercelProductionDeployment,
  isVisualOnlyVercelDeployment,
} from "@/lib/deployment-environment";

let client: SupabaseClient<Database> | null = null;
let clientSignature = "";

export class SupabaseConfigurationError extends Error {
  constructor() {
    super("Supabase server configuration is unavailable");
    this.name = "SupabaseConfigurationError";
  }
}

function getServerConfiguration(): { url: string; secretKey: string } {
  if (isVisualOnlyVercelDeployment()) {
    throw new SupabaseConfigurationError();
  }

  const url = process.env.SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secretKey || !URL.canParse(url)) {
    throw new SupabaseConfigurationError();
  }

  const parsedUrl = new URL(url);
  const localHttp =
    parsedUrl.protocol === "http:" &&
    ["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsedUrl.hostname);
  const hostedSupabase =
    parsedUrl.protocol === "https:" &&
    parsedUrl.hostname === deploymentContract.supabaseProductionHost &&
    parsedUrl.port === "";
  const permittedEndpoint = isVercelProductionDeployment()
    ? hostedSupabase
    : localHttp;
  if (
    !permittedEndpoint ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.pathname !== "/" ||
    parsedUrl.search ||
    parsedUrl.hash
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
