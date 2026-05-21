import "server-only";

export type TurnstileDecision = { success: boolean; reason?: string };

// Anti-bot protection intentionally disabled.
export async function verifyTurnstile(_token: string, _ip: string): Promise<TurnstileDecision> {
  return { success: true, reason: "disabled" };
}
