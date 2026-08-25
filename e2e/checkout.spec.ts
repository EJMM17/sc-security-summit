import { expect, test } from "@playwright/test";

/**
 * The checkout page is exercised up to (but not through) the MercadoPago
 * redirect. Submitting would create a real preference against a sandbox or
 * live account, which belongs in a controlled Production smoke test, not in
 * the automated suite.
 */
test.describe("Checkout de accesos", () => {
  test("cobra el precio publicado con IVA incluido y reacciona al tipo de acceso", async ({
    page,
  }) => {
    await page.goto("/checkout?lang=es");

    await expect(
      page.getByRole("heading", { level: 1, name: /reserva tu acceso/i }),
    ).toBeVisible();

    // Plus is preselected: 1 x $2,500, IVA already inside that price.
    const summary = page.getByRole("heading", { name: "Resumen" }).locator("..");
    await expect(summary).toContainText("2,500.00");
    await expect(summary).toContainText("Incluye IVA del 16%");
    // Nothing is added on top of the published price.
    await expect(summary).not.toContainText("2,900.00");

    await page.getByRole("radio", { name: /acceso general/i }).check();
    await expect(summary).toContainText("900.00");
    await expect(summary).not.toContainText("1,044.00");

    // Quantity is a dropdown, and the student tier is capped at two seats.
    const quantity = page.getByLabel("Cantidad");
    await quantity.selectOption("5");
    await page.getByRole("radio", { name: /acceso estudiante/i }).check();
    await expect(quantity).toHaveValue("2");
    await expect(quantity.locator("option")).toHaveCount(2);
    await expect(summary).toContainText("1,300.00");
    await expect(summary).not.toContainText("1,508.00");
  });

  test("solo pide datos fiscales cuando se solicita factura", async ({ page }) => {
    await page.goto("/checkout?lang=es");

    await expect(page.getByLabel("RFC")).toHaveCount(0);

    await page.getByRole("checkbox", { name: /necesito factura/i }).check();
    await expect(page.getByLabel("RFC")).toBeVisible();
    await expect(page.getByLabel(/razón social/i)).toBeVisible();
    await expect(page.getByLabel(/código postal fiscal/i)).toBeVisible();

    // A 12-character RFC is a persona moral, so only corporate regimes show.
    await page.getByLabel("RFC").fill("ABC800101XY2");
    const regime = page.getByLabel(/régimen fiscal/i);
    await expect(regime.getByRole("option", { name: /^601/ })).toHaveCount(1);
    await expect(regime.getByRole("option", { name: /^605/ })).toHaveCount(0);

    // A 13-character RFC is a persona física, so the list swaps.
    await page.getByLabel("RFC").fill("GOME800101AB1");
    await expect(regime.getByRole("option", { name: /^605/ })).toHaveCount(1);
    await expect(regime.getByRole("option", { name: /^601/ })).toHaveCount(0);

    await page.getByRole("checkbox", { name: /necesito factura/i }).uncheck();
    await expect(page.getByLabel("RFC")).toHaveCount(0);
  });

  test("renders in English with VAT wording", async ({ page }) => {
    await page.goto("/checkout?lang=en");

    await expect(
      page.getByRole("heading", { level: 1, name: /reserve your pass/i }),
    ).toBeVisible();
    await expect(page.getByText("Includes 16% VAT")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /pay with mercadopago/i }),
    ).toBeVisible();
  });

  test("el pase corporativo cobra el bloque con descuento", async ({ page }) => {
    await page.goto("/?lang=es");

    const corporate = page.locator("#registro");
    const seats = corporate.getByLabel(/número de accesos/i);
    // The dropdown starts at the smallest block a company can buy.
    await expect(seats.locator("option").first()).toHaveAttribute("value", "2");

    await seats.selectOption("5");
    await corporate.getByLabel("Participante 1").fill("Ada Lovelace");
    await expect(corporate.getByLabel(/participante \d+/i)).toHaveCount(5);
    // Renaming the block keeps what was already typed.
    await seats.selectOption("6");
    await expect(corporate.getByLabel("Participante 1")).toHaveValue("Ada Lovelace");

    const summary = corporate.locator(".checkout-summary");
    await expect(summary).toContainText("Descuento por volumen");
    await expect(summary).toContainText("11,250.00");
  });
});
