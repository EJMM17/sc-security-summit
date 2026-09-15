import { expect, test } from "@playwright/test";

test("direct presenter links remain readable with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?lang=es#presentadores", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#presentadores h2")).toBeVisible();
  for (const element of await page.locator(".reveal, .reveal-left, .reveal-right, .reveal-scale").all()) {
    await expect(element).toHaveCSS("opacity", "1");
  }
});

test("server-rendered content remains readable when JavaScript is unavailable", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/?lang=es", { waitUntil: "domcontentloaded" });
  const reveals = page.locator(".reveal, .reveal-left, .reveal-right, .reveal-scale");
  expect(await reveals.count()).toBeGreaterThan(10);
  for (const element of await reveals.all()) {
    await expect(element).toHaveCSS("opacity", "1");
  }
  await context.close();
});

for (const lang of ["es", "en"]) {
  test(`${lang}: first visit, reload and return keep the complete landing available`, async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (url.origin === new URL(page.url()).origin && response.status() >= 400) {
        errors.push(`${response.status()} ${url.pathname}`);
      }
    });

    for (const visit of ["first", "reload", "return"]) {
      if (visit === "reload") await page.reload({ waitUntil: "domcontentloaded" });
      else {
        if (visit === "return") await page.goto("/aviso-de-privacidad", { waitUntil: "domcontentloaded" });
        await page.goto(`/?lang=${lang}`, { waitUntil: "domcontentloaded" });
      }
      for (const id of ["formacion", "presentadores", "especialistas", "programa", "accesos", "registro", "ubicacion", "faq"]) {
        const section = page.locator(`#${id}`);
        await section.scrollIntoViewIfNeeded();
        await expect(section.locator("h2").first()).toBeVisible();
        for (const reveal of await section.locator(".reveal, .reveal-left, .reveal-right, .reveal-scale").all()) {
          // Observe the reveal after scrolling; waiting for its animated box
          // to become stable first can stall WebKit's actionability checks.
          await reveal.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
          await expect(reveal).toHaveCSS("opacity", "1");
        }
      }
      for (const image of await page.locator("#presentadores img").all()) {
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0)).toBe(true);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}
