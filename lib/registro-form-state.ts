export type RegistroFlashState = {
  success: boolean;
  message: string;
  folio?: string;
  errors?: Record<string, string[]>;
  values?: Record<string, string | boolean>;
};

export function serializeRegistroFlashState(state: RegistroFlashState): string {
  return encodeURIComponent(JSON.stringify(state));
}

export function deserializeRegistroFlashState(
  payload: string | null | undefined,
): RegistroFlashState | null {
  if (!payload) return null;

  try {
    return JSON.parse(decodeURIComponent(payload)) as RegistroFlashState;
  } catch {
    return null;
  }
}
