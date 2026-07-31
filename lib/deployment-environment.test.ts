import { afterEach, describe, expect, it } from "vitest";
import {
  isVercelProductionDeployment,
  isVisualOnlyVercelDeployment,
} from "@/lib/deployment-environment";

const originalVercel = process.env.VERCEL;
const originalVercelEnvironment = process.env.VERCEL_ENV;
const originalVercelTargetEnvironment = process.env.VERCEL_TARGET_ENV;

afterEach(() => {
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
  if (originalVercelEnvironment === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalVercelEnvironment;
  if (originalVercelTargetEnvironment === undefined) {
    delete process.env.VERCEL_TARGET_ENV;
  } else {
    process.env.VERCEL_TARGET_ENV = originalVercelTargetEnvironment;
  }
});

describe("isVisualOnlyVercelDeployment", () => {
  it("detects the standard Vercel Preview target", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "preview";

    expect(isVisualOnlyVercelDeployment()).toBe(true);
  });

  it("allows the Vercel Production target", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "production";

    expect(isVisualOnlyVercelDeployment()).toBe(false);
    expect(isVercelProductionDeployment()).toBe(true);
  });

  it.each(["staging", "qa", ""])(
    "fails closed for the Vercel target %j",
    (target) => {
      process.env.VERCEL = "1";
      process.env.VERCEL_ENV = "preview";
      process.env.VERCEL_TARGET_ENV = target;

      expect(isVisualOnlyVercelDeployment()).toBe(true);
      expect(isVercelProductionDeployment()).toBe(false);
    },
  );

  it("does not affect local execution", () => {
    delete process.env.VERCEL;
    process.env.VERCEL_ENV = "preview";

    expect(isVisualOnlyVercelDeployment()).toBe(false);
    expect(isVercelProductionDeployment()).toBe(false);
  });
});
