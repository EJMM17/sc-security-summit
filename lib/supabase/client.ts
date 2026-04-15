"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/supabase";

import { getSupabaseAnonKey, getSupabaseUrl } from "./config";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createBrowserSupabaseClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      getSupabaseUrl(),
      getSupabaseAnonKey()
    );
  }

  return browserClient;
}
