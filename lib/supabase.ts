import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente público (anon key) — para operaciones de cara al usuario.
 * Usa este para INSERT desde el formulario de registro.
 * Sujeto a RLS: solo permite INSERT, no SELECT ni UPDATE.
 */
let _publicClient: SupabaseClient | null = null;

export function createPublicClient(): SupabaseClient {
  if (_publicClient) return _publicClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan variables de entorno de Supabase. Revisa .env.local (NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    );
  }

  _publicClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _publicClient;
}

/**
 * Cliente admin (service_role key) — SOLO para operaciones internas.
 * Bypasea RLS. NUNCA exponer en el browser.
 * Úsalo para: leer registros, actualizar estado_pago, reportes.
 */
let _adminClient: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan variables de entorno de Supabase. Revisa .env.local (SUPABASE_SERVICE_ROLE_KEY)"
    );
  }

  _adminClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _adminClient;
}
