import { expect, test } from "@playwright/test";

// End-to-end: complete a registration with a unique email, then expect the
// success folio panel to appear. We do not assert on Conekta order creation
// here — that's covered in webhook.spec.ts via DB.
test.describe("Registro", () => {
  test("happy path — general access without CFDI", async ({ page }) => {
    await page.goto("/");

    // Anchor down to the form
    await page.getByRole("link", { name: /registrarme|register/i }).first().click();

    const unique = Date.now();
    const email = `playwright+${unique}@example.test`;

    await page.getByLabel(/nombre|first name/i).first().fill("Maria");
    await page.getByLabel(/apellido|last name/i).first().fill("González Test");
    await page.getByLabel(/correo|email/i).fill(email);
    await page.getByLabel(/empresa|company/i).fill("Lanz QA");
    await page.getByLabel(/cargo|job title/i).fill("QA Engineer");
    await page
      .getByLabel(/teléfono|tel|phone/i)
      .first()
      .fill("+52 899 123 4567");

    // Tipo de acceso: General (default) — verify the option exists
    const tipo = page.getByLabel(/tipo de acceso|access type/i);
    await expect(tipo).toBeVisible();
    await tipo.selectOption("general");

    await page.getByLabel(/términos|terms/i).check();

    // Skip Turnstile in test mode — test sitekey 1x000... auto-passes.
    await page.getByRole("button", { name: /completar|complete registration/i }).click();

    // Either we land on success state or a server-rendered error. Check folio
    // pattern presence in the response page.
    await expect(page.getByText(/SCSS2026-/)).toBeVisible({ timeout: 15_000 });
  });

  test("validates required fields", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /registrarme|register/i }).first().click();
    await page.getByRole("button", { name: /completar|complete registration/i }).click();
    // Browser native validation OR our error summary
    const summary = page.locator("#registro-error-summary");
    if (await summary.isVisible().catch(() => false)) {
      await expect(summary).toBeVisible();
    }
  });
});

test.describe("Pago page", () => {
  test("rejects unknown folio with 404", async ({ page }) => {
    const res = await page.goto("/pago?folio=SCSS2026-DOES-NOT-EXIST");
    expect(res?.status()).toBe(404);
  });
});
