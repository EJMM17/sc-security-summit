function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseUrl(): string {
  return getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey(): string {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (anonKey) {
    return anonKey;
  }

  if (publishableKey) {
    return publishableKey;
  }

  throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)"
  );
}

export function getSupabaseServiceRoleKey(): string {
  return getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
}
