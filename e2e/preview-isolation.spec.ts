import { expect, test } from "@playwright/test";

const isVisualPreview =
  process.env.VERCEL === "1" &&
  (process.env.VERCEL_TARGET_ENV ?? process.env.VERCEL_ENV) !== "production";

test.describe("Preview isolation contract", () => {
  test.skip(!isVisualPreview, "Only runs against a disconnected Vercel Preview build.");

  test("keeps both inquiry flows disabled and business data disconnected", async ({
    page,
    request,
  }) => {
    const forbiddenRequests: string[] = [];
    const forbiddenHosts = [
      "api.resend.com",
      "connect.facebook.net",
      "facebook.com",
      "googletagmanager.com",
      "google-analytics.com",
      "px.ads.linkedin.com",
      "snap.licdn.com",
    ];

    page.on("request", (outgoingRequest) => {
      const outgoingUrl = new URL(outgoingRequest.url());
      const { hostname, pathname } = outgoingUrl;
      if (
        pathname.startsWith("/monitoring") ||
        pathname.startsWith("/_vercel/insights") ||
        pathname.startsWith("/_vercel/speed-insights") ||
        forbiddenHosts.some(
          (host) => hostname === host || hostname.endsWith(`.${host}`),
        ) ||
        hostname.endsWith(".supabase.co") ||
        hostname.endsWith(".upstash.io")
      ) {
        forbiddenRequests.push(outgoingUrl.toString());
      }
    });

    await page.addInitScript(() => {
      window.localStorage.setItem("scss:attribution", "legacy-preview-data");
    });
    await page.context().addCookies([
      {
        name: "scss_attr",
        value: "legacy-preview-data",
        url: "http://localhost:3000",
      },
    ]);

    await page.goto("/?lang=es&utm_source=preview-test");

    const corporate = page.locator("#registro");
    const sponsor = page.locator("#contacto-patrocinio");
    await expect(corporate.locator("fieldset")).toHaveAttribute("disabled", "");
    await expect(sponsor.locator("fieldset")).toHaveAttribute("disabled", "");
    await expect(
      corporate.getByText(/Vista previa: este formulario está desactivado/i),
    ).toBeVisible();
    await expect(
      sponsor.getByText(/Vista previa: este formulario está desactivado/i),
    ).toBeVisible();
    await expect(
      corporate.getByRole("button", {
        name: "NO DISPONIBLE EN VISTA PREVIA",
      }),
    ).toBeDisabled();
    await expect(
      sponsor.getByRole("button", {
        name: "NO DISPONIBLE EN VISTA PREVIA",
      }),
    ).toBeDisabled();

    const storedAttribution = () =>
      page.evaluate(() => ({
        local: window.localStorage.getItem("scss:attribution"),
        cookie: document.cookie.includes("scss_attr="),
      }));

    await expect.poll(storedAttribution).toEqual({ local: null, cookie: false });
    await page.getByRole("button", { name: "Aceptar todas" }).click();
    await expect.poll(storedAttribution).toEqual({ local: null, cookie: false });
    await expect(page.locator('input[name="utm_source"]').first()).toHaveValue("");
    await expect(
      page.locator('input[name="marketingConsent"]').first(),
    ).toHaveValue("essential");

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(250);
    const businessEvents = await page.evaluate(() => {
      const dataLayer = (
        window as unknown as { dataLayer?: Array<Record<string, unknown>> }
      ).dataLayer;
      const tracked = new Set([
        "click_register",
        "click_sponsor",
        "click_whatsapp",
        "scroll_depth",
        "section_view",
      ]);
      return (dataLayer ?? [])
        .map((entry) => entry?.event)
        .filter((event): event is string => typeof event === "string")
        .filter((event) => tracked.has(event));
    });
    expect(businessEvents).toEqual([]);

    const health = await request.get("/api/health");
    expect(health.status()).toBe(503);
    expect(await health.json()).toMatchObject({
      ok: false,
      status: "unavailable",
    });

    const cron = await request.get("/api/cron/inquiry-notifications");
    expect(cron.status()).toBe(503);
    expect(await cron.json()).toEqual({
      ok: false,
      reason: "cron_unavailable",
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/?lang=en&utm_source=preview-test");
    const mobileCorporate = page.locator("#registro");
    const mobileSponsor = page.locator("#contacto-patrocinio");
    await expect(mobileCorporate.locator("fieldset")).toHaveAttribute(
      "disabled",
      "",
    );
    await expect(mobileSponsor.locator("fieldset")).toHaveAttribute(
      "disabled",
      "",
    );
    await expect(
      mobileCorporate.getByText(/Preview mode: this form is disabled/i),
    ).toBeVisible();
    await expect(
      mobileSponsor.getByText(/Preview mode: this form is disabled/i),
    ).toBeVisible();
    await expect(
      mobileCorporate.getByRole("button", { name: "UNAVAILABLE IN PREVIEW" }),
    ).toBeDisabled();
    await expect(
      mobileSponsor.getByRole("button", { name: "UNAVAILABLE IN PREVIEW" }),
    ).toBeDisabled();
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);

    expect(forbiddenRequests).toEqual([]);
  });
});
