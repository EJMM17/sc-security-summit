import { expect, test } from "@playwright/test";

test.describe("Homepage comercial", () => {
  test("muestra ponentes, agenda, accesos y formularios actualizados", async ({ page }) => {
    await page.goto("/?lang=es");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /summit de seguridad en la cadena de suministros/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("img", { name: "Lanz Logistics" })).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Instituto Internacional de Estudios Superiores" }),
    ).toBeVisible();
    await expect(page.getByRole("img", { name: "Parque Industrial Villa Florida" })).toBeVisible();

    const speakers = page.getByRole("region", { name: /conferencistas confirmados/i });
    await expect(speakers.getByRole("heading", { name: "Sandra Romero" })).toBeVisible();
    await expect(speakers.getByRole("img", { name: "Sandra Romero" })).toBeVisible();

    await speakers.getByRole("button", { name: "Fidel Guerrero", exact: true }).click();
    await expect(speakers.getByRole("heading", { name: "Fidel Guerrero" })).toBeVisible();

    const sectionOrder = await page.evaluate(() =>
      ["speakers", "agenda", "accesos", "patrocinadores", "registro"].map(
        (id) => document.getElementById(id)?.offsetTop ?? -1,
      ),
    );
    expect(sectionOrder).toEqual([...sectionOrder].sort((a, b) => a - b));

    for (const price of ["$4,800", "$2,500", "$900", "$650"]) {
      await expect(page.getByText(price, { exact: true })).toBeVisible();
    }

    const eventbriteLinks = page.locator('a[href*="eventbrite.com"]');
    const visibleEventbriteLink = page.locator('a[href*="eventbrite.com"]:visible').first();
    await expect(visibleEventbriteLink).toBeVisible();
    expect(await eventbriteLinks.count()).toBeGreaterThan(1);
    await expect(visibleEventbriteLink).toHaveAttribute(
      "href",
      "https://www.eventbrite.com.mx/e/supply-chain-security-summit-tickets-1994843949954?aff=ebdsoporgprofile",
    );

    const corporate = page.locator("#registro");
    await expect(corporate.getByRole("heading", { name: /capacita a tu equipo completo/i })).toBeVisible();
    await expect(corporate.getByLabel(/nombre/i)).toBeVisible();
    await expect(corporate.getByLabel(/apellido/i)).toBeVisible();
    await expect(corporate.getByLabel(/correo/i)).toBeVisible();
    await expect(corporate.getByLabel(/empresa/i)).toBeVisible();
    await expect(corporate.getByLabel(/cargo/i)).toBeVisible();
    await expect(corporate.getByLabel(/teléfono/i)).toBeVisible();
    await expect(corporate.getByLabel(/número de accesos/i)).toHaveAttribute("min", "2");
    await expect(corporate.getByLabel(/número de accesos/i)).toHaveAttribute("max", "10");
    await expect(
      corporate.getByRole("link", { name: /aviso de privacidad/i }),
    ).toHaveAttribute("href", "/aviso-de-privacidad");

    const sponsor = page.locator("#contacto-patrocinio");
    await expect(sponsor.getByRole("heading", { name: /hablemos de tu marca/i })).toBeVisible();
    await expect(sponsor.getByRole("button", { name: /solicitar información/i })).toBeVisible();
    await expect(
      sponsor.getByRole("link", { name: /aviso de privacidad/i }),
    ).toHaveAttribute("href", "/aviso-de-privacidad");
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

  test("carga Google Maps solo después de una acción explícita", async ({
    page,
  }) => {
    await page.goto("/?lang=es");

    const location = page.locator("#ubicacion");
    const mapFrame = location.locator('iframe[src*="google.com/maps"]');
    await expect(mapFrame).toHaveCount(0);

    await location
      .getByRole("button", { name: "Cargar mapa interactivo" })
      .click();
    await expect(mapFrame).toHaveCount(1);
    await expect(mapFrame).toHaveAttribute(
      "title",
      "Mapa del Centro de Convenciones de Reynosa",
    );
  });

  test("renderiza los dos formularios y privacidad en inglés", async ({ page }) => {
    await page.goto("/?lang=en");

    const corporate = page.locator("#registro");
    await expect(
      corporate.getByRole("heading", { name: /train your entire team/i }),
    ).toBeVisible();
    await expect(corporate.getByLabel("First name")).toBeVisible();
    await expect(corporate.getByLabel("Last name")).toBeVisible();
    await expect(corporate.getByLabel("Number of passes")).toHaveAttribute("min", "2");
    await expect(corporate.getByLabel("Number of passes")).toHaveAttribute("max", "10");
    await expect(
      corporate.getByRole("link", { name: /privacy notice/i }),
    ).toHaveAttribute("href", "/aviso-de-privacidad");

    const sponsor = page.locator("#contacto-patrocinio");
    await expect(
      sponsor.getByRole("heading", { name: /let's talk about your brand/i }),
    ).toBeVisible();
    await expect(sponsor.getByLabel("What would you like to know?")).toBeVisible();
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
