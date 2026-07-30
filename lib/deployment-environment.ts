import "server-only";

/**
 * Every Vercel deployment outside the Production target is intentionally
 * visual-only. Missing or custom target metadata fails closed.
 */
export function isVisualOnlyVercelDeployment(): boolean {
  return process.env.VERCEL === "1" && !isVercelProductionDeployment();
}

export function isVercelProductionDeployment(): boolean {
  if (process.env.VERCEL !== "1") return false;
  const target = (
    process.env.VERCEL_TARGET_ENV ??
    process.env.VERCEL_ENV ??
    ""
  ).trim();
  return target === "production";
}
