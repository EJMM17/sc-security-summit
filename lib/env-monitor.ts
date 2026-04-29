/**
 * Environment Configuration Monitor
 *
 * This utility helps monitor and debug environment variable configuration
 * across different environments and deployments.
 *
 * Usage:
 *   import { envMonitor } from '@/lib/env-monitor';
 *   envMonitor.initialize(); // Call during app startup
 */

import "server-only";
import { env, features } from "@/env";
import { getEnvStatus } from "./env-utils";

interface EnvCheckResult {
  timestamp: string;
  environment: string;
  checks: {
    supabase: boolean;
    email: boolean;
    ratelimit: boolean;
    turnstile: boolean;
    admin: boolean;
    sentry: boolean;
  };
  warnings: string[];
  errors: string[];
  healthy: boolean;
}

class EnvironmentMonitor {
  private checks: Map<string, EnvCheckResult> = new Map();
  private initialized = false;

  /**
   * Initialize environment monitoring
   * Call once during app startup
   */
  initialize() {
    if (this.initialized) return;

    this.logStartupInfo();
    this.performInitialChecks();
    this.setupCleanupOnExit();

    this.initialized = true;
  }

  /**
   * Perform comprehensive environment checks
   */
  private performInitialChecks(): EnvCheckResult {
    const result: EnvCheckResult = {
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      checks: {
        supabase: Boolean(
          env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
        ),
        email: features.email,
        ratelimit: features.ratelimit,
        turnstile: features.turnstile,
        admin: Boolean(env.ADMIN_EMAILS || env.ADMIN_SESSION_SECRET),
        sentry: Boolean(env.SENTRY_DSN),
      },
      warnings: [],
      errors: [],
      healthy: true,
    };

    // Validate required services
    if (!result.checks.supabase) {
      result.errors.push("Supabase not configured (critical)");
      result.healthy = false;
    }

    // Check production-specific requirements
    if (env.NODE_ENV === "production") {
      if (!result.checks.ratelimit) {
        result.warnings.push("Rate limiting not enabled in production");
      }
      if (!result.checks.turnstile) {
        result.warnings.push("CAPTCHA not enabled in production");
      }
      if (!result.checks.sentry) {
        result.warnings.push("Error tracking not configured in production");
      }
    }

    // Check optional admin configuration
    if (!result.checks.admin && env.NODE_ENV === "production") {
      result.warnings.push("Admin authentication not configured");
    }

    // Security checks
    if (
      env.ADMIN_SESSION_SECRET &&
      env.ADMIN_SESSION_SECRET.length < 32
    ) {
      result.errors.push(
        "ADMIN_SESSION_SECRET too short (minimum 32 characters)"
      );
      result.healthy = false;
    }

    // Log results
    this.logCheckResults(result);
    this.checks.set(env.NODE_ENV, result);

    return result;
  }

  /**
   * Log startup information
   */
  private logStartupInfo() {
    const status = getEnvStatus();

    console.log("");
    console.log("═══════════════════════════════════════════════════════");
    console.log("  SC Security Summit - Environment Configuration");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`  Environment: ${status.env.toUpperCase()}`);
    console.log(`  Timestamp: ${new Date().toISOString()}`);
    console.log("───────────────────────────────────────────────────────");
    console.log("");
  }

  /**
   * Log check results
   */
  private logCheckResults(result: EnvCheckResult) {
    console.log("✓ Service Configuration:");
    console.log(
      `  • Supabase Database: ${result.checks.supabase ? "✅" : "❌"}`
    );
    console.log(`  • Email (Resend): ${result.checks.email ? "✅" : "⚠️"}`);
    console.log(
      `  • Rate Limiting (Redis): ${result.checks.ratelimit ? "✅" : "⚠️"}`
    );
    console.log(
      `  • CAPTCHA (Turnstile): ${result.checks.turnstile ? "✅" : "⚠️"}`
    );
    console.log(`  • Admin Auth: ${result.checks.admin ? "✅" : "⚠️"}`);
    console.log(`  • Error Tracking (Sentry): ${result.checks.sentry ? "✅" : "⚠️"}`);

    if (result.errors.length > 0) {
      console.log("");
      console.log("❌ Configuration Errors:");
      result.errors.forEach((err) => {
        console.error(`  • ${err}`);
      });
    }

    if (result.warnings.length > 0) {
      console.log("");
      console.log("⚠️  Configuration Warnings:");
      result.warnings.forEach((warn) => {
        console.warn(`  • ${warn}`);
      });
    }

    const statusText = result.healthy
      ? "✅ System Healthy"
      : "❌ Configuration Issues";
    console.log("");
    console.log(`Status: ${statusText}`);
    console.log("═══════════════════════════════════════════════════════");
    console.log("");
  }

  /**
   * Get current environment check status
   */
  getStatus(): EnvCheckResult | undefined {
    return this.checks.get(env.NODE_ENV);
  }

  /**
   * Check if system is healthy
   */
  isHealthy(): boolean {
    const status = this.getStatus();
    return status?.healthy ?? false;
  }

  /**
   * Get human-readable health report
   */
  getHealthReport(): string {
    const status = this.getStatus();
    if (!status) return "No checks performed";

    const lines: string[] = [
      `Environment: ${status.environment.toUpperCase()}`,
      `Timestamp: ${status.timestamp}`,
      "",
      "Services:",
      `  Supabase: ${status.checks.supabase ? "✅" : "❌"}`,
      `  Email: ${status.checks.email ? "✅" : "⚠️"}`,
      `  Rate Limiting: ${status.checks.ratelimit ? "✅" : "⚠️"}`,
      `  CAPTCHA: ${status.checks.turnstile ? "✅" : "⚠️"}`,
      `  Admin: ${status.checks.admin ? "✅" : "⚠️"}`,
      `  Sentry: ${status.checks.sentry ? "✅" : "⚠️"}`,
    ];

    if (status.errors.length > 0) {
      lines.push("");
      lines.push("Errors:");
      status.errors.forEach((err) => lines.push(`  - ${err}`));
    }

    if (status.warnings.length > 0) {
      lines.push("");
      lines.push("Warnings:");
      status.warnings.forEach((warn) => lines.push(`  - ${warn}`));
    }

    lines.push("");
    lines.push(`Status: ${status.healthy ? "HEALTHY ✅" : "UNHEALTHY ❌"}`);

    return lines.join("\n");
  }

  /**
   * Setup cleanup on process exit
   */
  private setupCleanupOnExit() {
    const cleanup = () => {
      console.log("\n[env-monitor] Shutting down...");
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  }

  /**
   * Create health check endpoint response
   * Useful for liveness/readiness probes
   */
  createHealthCheckResponse() {
    const status = this.getStatus();

    return {
      status: status?.healthy ? "healthy" : "unhealthy",
      timestamp: status?.timestamp,
      environment: status?.environment,
      services: status?.checks,
      errors: status?.errors,
      warnings: status?.warnings,
    };
  }
}

// Export singleton instance
export const envMonitor = new EnvironmentMonitor();

/**
 * Export types for use in other modules
 */
export type { EnvCheckResult };
