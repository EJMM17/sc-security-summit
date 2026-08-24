import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Next bundles `server-only` internally; stub it for vitest.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "app/actions/inquiries.ts",
        "app/api/cron/inquiry-notifications/route.ts",
        "app/api/health/route.ts",
        "lib/email.ts",
        "lib/deployment-environment.ts",
        "lib/health-readiness.ts",
        "lib/inquiries/**/*.ts",
        "app/actions/checkout.ts",
        "app/api/webhooks/mercadopago/route.ts",
        "lib/payments/**/*.ts",
        "server/services/mercadopago-client.ts",
        "server/services/mercadopago-signature.ts",
        "server/services/ticket-order-notifier.ts",
        "server/services/payment-observability.ts",
        "server/use-cases/create-ticket-checkout.ts",
        "lib/supabase-server.ts",
        "server/repositories/inquiry-repository.ts",
        "server/services/inquiry-notifier.ts",
        "server/services/inquiry-observability.ts",
        "server/use-cases/submit-inquiry.ts",
      ],
      exclude: [
        "lib/**/*.test.ts",
        "lib/inquiries/result.ts",
        "lib/payments/result.ts",
      ],
      thresholds: {
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85,
      },
    },
  },
});
