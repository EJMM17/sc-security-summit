import { expect, test } from "@playwright/test";

test.describe("Homepage comercial", () => {
  test("muestra ponentes, agenda, accesos y el checkout corporativo", async ({ page }) => {
    await page.goto("/?lang=es");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /summit de seguridad en la cadena de suministros/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("img", { name: "Lanz Logistics" }).first()).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Instituto Internacional de Estudios Superiores" }).first(),
    ).toBeVisible();
    await expect(page.getByRole("img", { name: "Parque Industrial Villa Florida" })).toBeVisible();

    const speakers = page.getByRole("region", { name: /conferencistas confirmados/i });
    await expect(speakers.getByRole("heading", { name: "Sandra Romero" })).toBeVisible();
    await expect(speakers.getByRole("img", { name: "Sandra Romero" })).toBeVisible();

    await speakers.getByRole("button", { name: "Fidel Guerrero", exact: true }).click();
    await expect(speakers.getByRole("heading", { name: "Fidel Guerrero" })).toBeVisible();

    const sectionOrder = await page.evaluate(() =>
      ["especialistas", "programa", "accesos", "registro"].map(
        (id) => document.getElementById(id)?.offsetTop ?? -1,
      ),
    );
    expect(sectionOrder).toEqual([...sectionOrder].sort((a, b) => a - b));

    for (const price of ["$2,500", "$900", "$650"]) {
      await expect(page.getByText(price, { exact: true })).toBeVisible();
    }

    // Individual accesses are sold on site now: no call to action may leave
    // for an external ticketing page.
    await expect(page.locator('a[href*="eventbrite.com"]')).toHaveCount(0);
    const checkoutLinks = page.locator('a[href^="/checkout"]');
    await expect(page.locator('a[href^="/checkout"]:visible').first()).toBeVisible();
    expect(await checkoutLinks.count()).toBeGreaterThan(1);

    const corporate = page.locator("#registro");
    await expect(corporate.getByRole("heading", { name: /capacita a tu equipo completo/i })).toBeVisible();
    await expect(corporate.getByLabel(/nombre\(s\)/i)).toBeVisible();
    await expect(corporate.getByLabel(/apellidos/i)).toBeVisible();
    await expect(corporate.getByLabel(/correo electrónico/i)).toBeVisible();
    await expect(corporate.getByLabel(/empresa/i)).toBeVisible();
    await expect(corporate.getByLabel(/teléfono/i)).toBeVisible();
    // The referral box is offered on the block too, and never required.
    const referral = corporate.getByLabel(/quién te recomendó/i);
    await expect(referral).toBeVisible();
    await expect(referral).not.toHaveAttribute("required", "");

    // Seats are picked from a dropdown, so the roster can only ever hold a
    // number of names the catalog authorizes.
    const seats = corporate.getByLabel(/número de accesos/i);
    await expect(seats).toHaveValue("2");
    await expect(corporate.getByLabel(/participante \d+/i)).toHaveCount(2);

    const summary = corporate.locator(".checkout-summary");
    await expect(summary).toContainText("5,000.00");
    await expect(summary).not.toContainText("Descuento por volumen");

    await seats.selectOption("5");
    await expect(corporate.getByLabel(/participante \d+/i)).toHaveCount(5);
    // 5 x $2,500 = $12,500 less 25% = $9,375.
    await expect(summary).toContainText("12,500.00");
    await expect(summary).toContainText("3,125.00");
    await expect(summary).toContainText("9,375.00");
    await expect(
      corporate.getByRole("button", { name: /procesar pago/i }),
    ).toBeVisible();
    await expect(
      corporate.getByRole("link", { name: /aviso de privacidad/i }),
    ).toHaveAttribute("href", "/aviso-de-privacidad");

    // The sponsorship section and its form are retired from the site.
    await expect(page.locator("#patrocinadores")).toHaveCount(0);
    await expect(page.locator("#contacto-patrocinio")).toHaveCount(0);
    await expect(page.locator("#audiencia")).toHaveCount(0);
  });

  test("no produce desbordamiento horizontal", async ({ page }) => {
    await page.goto("/?lang=es");
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));

    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  });

  test("optimiza una imagen local con la versión segura de Sharp", async ({
    request,
  }) => {
    const response = await request.get(
      "/_next/image?url=%2Fimages%2Fhero-bg.webp&w=640&q=70",
      { headers: { accept: "image/webp" } },
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/webp");
    expect((await response.body()).byteLength).toBeGreaterThan(1_000);
  });

  test("monta Google Maps con la sección y difiere la descarga", async ({
    page,
  }) => {
    await page.goto("/?lang=es");

    const location = page.locator("#ubicacion");
    const mapFrame = location.locator('iframe[src*="google.com/maps"]');

    // The embed is part of the section composition, not a click-gated step.
    await expect(mapFrame).toHaveCount(1);
    await expect(mapFrame).toHaveAttribute(
      "title",
      "Mapa del Centro de Convenciones de Reynosa",
    );
    // `loading="lazy"` keeps the third-party request off the initial load.
    await expect(mapFrame).toHaveAttribute("loading", "lazy");

    // The bilingual note stays visible and still declares the Google connection.
    await expect(location.locator(".summit-map-note")).toContainText(
      "Google Maps",
    );
  });

  test("renderiza el checkout corporativo y privacidad en inglés", async ({ page }) => {
    await page.goto("/?lang=en");

    const corporate = page.locator("#registro");
    await expect(
      corporate.getByRole("heading", { name: /train your entire team/i }),
    ).toBeVisible();
    await expect(corporate.getByLabel("First name")).toBeVisible();
    await expect(corporate.getByLabel("Last name")).toBeVisible();
    await expect(corporate.getByLabel(/who referred you/i)).toBeVisible();
    await expect(corporate.getByLabel(/number of passes/i)).toHaveValue("2");
    await expect(corporate.getByLabel(/participant \d+/i)).toHaveCount(2);
    await expect(corporate.locator(".checkout-summary")).toBeVisible();
    await expect(
      corporate.getByRole("link", { name: /privacy notice/i }),
    ).toHaveAttribute("href", "/aviso-de-privacidad");

    await expect(
      page.getByRole("dialog", { name: "Privacy & cookies" }),
    ).toBeVisible();
  });

  test("no captura atribución sin consentimiento y la borra al retirarlo", async ({
    page,
  }) => {
    await page.goto(
      "/?lang=es&utm_source=linkedin&gclid=CLICK-123&email=pii%40example.com",
    );

    const storedAttribution = () =>
      page.evaluate(() => ({
        local: window.localStorage.getItem("scss:attribution"),
        cookie: document.cookie.includes("scss_attr="),
      }));

    await expect(page.getByRole("dialog", { name: "Privacidad y cookies" })).toBeVisible();
    await expect.poll(storedAttribution).toEqual({ local: null, cookie: false });
    await expect(page.locator('input[name="utm_source"]').first()).toHaveValue("");
    await expect(
      page.locator('input[name="marketingConsent"]').first(),
    ).toHaveValue("essential");

    await page.getByRole("button", { name: "Aceptar todas" }).click();
    await expect.poll(storedAttribution).toEqual({
      local: expect.any(String),
      cookie: true,
    });
    await expect(page.locator('input[name="utm_source"]').first()).toHaveValue(
      "linkedin",
    );
    await expect(
      page.locator('input[name="marketingConsent"]').first(),
    ).toHaveValue("all");
    await expect(page.locator('input[name="landing_page"]').first()).toHaveValue("/");
    const serialized = (await storedAttribution()).local ?? "";
    expect(serialized).not.toContain("pii@example.com");
    expect(serialized).not.toContain("email=");

    await page.getByRole("button", { name: "Configurar cookies" }).click();
    const reloaded = page.waitForEvent("load");
    await page.getByRole("button", { name: "Solo esenciales" }).click();
    await reloaded;

    await expect.poll(storedAttribution).toEqual({ local: null, cookie: false });
    await expect(page.locator('input[name="utm_source"]').first()).toHaveValue("");
    await expect(
      page.locator('input[name="marketingConsent"]').first(),
    ).toHaveValue("essential");
  });
});
