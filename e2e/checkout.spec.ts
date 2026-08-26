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

    // The redirect note that promised a platform fee screen is gone.
    await expect(page.locator("form")).not.toContainText(
      "checkout seguro de MercadoPago",
    );

    // Quantity is a dropdown, and the student tier is capped at two seats.
    const quantity = page.getByLabel("Cantidad");
    await quantity.selectOption("5");
    await page.getByRole("radio", { name: /acceso estudiante/i }).check();
    await expect(quantity).toHaveValue("2");
    await expect(quantity.locator("option")).toHaveCount(2);
    await expect(summary).toContainText("1,300.00");
    await expect(summary).not.toContainText("1,508.00");
  });

  test("aplica el 25% por volumen al comprar 5 accesos plus", async ({ page }) => {
    await page.goto("/checkout?lang=es&tier=plus");

    const summary = page.getByRole("heading", { name: "Resumen" }).locator("..");
    const quantity = page.getByLabel("Cantidad");

    // Below the threshold the buyer pays the list price and is told what the
    // fifth access would do.
    await quantity.selectOption("4");
    await expect(summary).toContainText("10,000.00");
    await expect(summary).not.toContainText("Descuento por volumen");
    await expect(page.locator(".checkout-volume-note")).toContainText("1,875.00");

    // From the fifth up, the same 25% a corporate block gets.
    await quantity.selectOption("5");
    await expect(summary).toContainText("Descuento por volumen");
    await expect(summary).toContainText("9,375.00");
    await expect(page.locator(".checkout-volume-note.is-applied")).toBeVisible();

    // The entry tier keeps its price at the same quantity.
    await page.getByRole("radio", { name: /acceso general/i }).check();
    await expect(summary).toContainText("4,500.00");
    await expect(summary).not.toContainText("Descuento por volumen");
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
      page.getByRole("button", { name: /process payment/i }),
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

    // The live rail follows the block: discounted unit, total and savings.
    const rail = corporate.locator(".corporate-rail");
    await expect(rail).toContainText("1,875.00");
    await expect(rail).toContainText("11,250.00");
    await expect(rail).toContainText("Ahorras");

    // The stepper and the presets move the block and the roster with it.
    await corporate.getByRole("button", { name: /agregar un acceso/i }).click();
    await expect(seats).toHaveValue("7");
    await expect(corporate.getByLabel(/participante \d+/i)).toHaveCount(7);
    await corporate.getByRole("button", { name: "10 accesos", exact: true }).click();
    await expect(seats).toHaveValue("10");
  });

  test("el bloque corporativo acomoda una lista pegada", async ({ page }) => {
    await page.goto("/?lang=es");

    const corporate = page.locator("#registro");
    const seats = corporate.getByLabel(/número de accesos/i);

    await corporate.getByText(/pegar la lista de participantes/i).click();
    await corporate
      .locator(".corporate-bulk textarea")
      .fill("Ada Lovelace\nGrace Hopper\nAlan Turing\nKatherine Johnson");
    await corporate.getByRole("button", { name: /acomodar nombres/i }).click();

    // Four names grow a two-seat block to four and fill it in order.
    await expect(seats).toHaveValue("4");
    await expect(corporate.getByLabel("Participante 1")).toHaveValue("Ada Lovelace");
    await expect(corporate.getByLabel("Participante 4")).toHaveValue(
      "Katherine Johnson",
    );
    await expect(corporate.locator(".corporate-roster-progress")).toContainText(
      "Lista completa",
    );

    await corporate.getByRole("button", { name: /vaciar lista/i }).click();
    await expect(corporate.getByLabel("Participante 1")).toHaveValue("");
  });
});
