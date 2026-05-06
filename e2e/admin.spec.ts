import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

// Skip the suite if admin creds aren't provided — these tests touch real DB.
test.skip(
  !ADMIN_EMAIL || !ADMIN_PASSWORD,
  "Set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD to run admin tests",
);

test.describe("Admin dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/email|correo/i).fill(ADMIN_EMAIL!);
    await page.getByLabel(/password|contraseña/i).fill(ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /entrar|login|iniciar/i }).click();
    await expect(page).toHaveURL(/\/admin\/registros/);
  });

  test("dashboard renders with cupos counter", async ({ page }) => {
    await expect(page.getByText(/Registros/i).first()).toBeVisible();
    await expect(page.getByText(/cupo\(s\)/i)).toBeVisible();
  });

  test("filters by estado_pago", async ({ page }) => {
    await page.getByLabel(/estado de pago/i).selectOption("pendiente");
    await page.getByRole("button", { name: /aplicar/i }).click();
    await expect(page).toHaveURL(/estado=pendiente/);
  });

  test("export CSV download", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: /export csv/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/registros-\d{4}-\d{2}-\d{2}\.csv/);
  });
});
