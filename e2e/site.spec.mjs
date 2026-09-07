import { expect, test } from "@playwright/test";

test("publishes the complete editorial product archive", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Open-source product archive | Ejupi Labs");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Seven open-source products",
  );
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(244, 241, 234)");
  await expect(page.locator(".project-index")).toBeVisible();
  await expect(page.locator(".project-record")).toHaveCount(7);
  await expect(page.locator("[data-product-link]")).toHaveCount(7);
  await expect(page.getByRole("heading", { level: 3, name: "DjenisAiAgent" })).toBeVisible();
  await expect(page.locator(".site-header .brand-wordmark")).toHaveAttribute(
    "src",
    "./brand/ejupi-labs-primary-carbon.svg",
  );
  await expect(
    page.locator('[data-product-link][href="https://ejupi-djenis30.github.io/JDoor/"]'),
  ).toBeVisible();
});

for (const viewport of [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 },
]) {
  for (const path of ["/"]) {
    test(`keeps ${path} inside ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      const geometry = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
    });
  }
}

for (const viewport of [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
]) {
  test(`keeps every public link touch-friendly at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.locator(".skip-link").focus();

    const undersized = await page.locator("a").evaluateAll((links) =>
      links
        .filter((link) => link.getClientRects().length > 0)
        .map((link) => {
          const rect = link.getBoundingClientRect();
          return {
            height: rect.height,
            label: link.getAttribute("aria-label") ?? link.textContent.trim(),
            width: rect.width,
          };
        })
        .filter(({ height, width }) => height < 44 || width < 44),
    );

    expect(undersized).toEqual([]);
  });
}

test("keeps product, source and check actions distinct and touch-friendly at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");

  const actionGeometry = await page.locator(".project-record").evaluateAll((records) => records.map((record) => {
    const links = [...record.querySelectorAll(".project-actions a")];
    return {
      recordScrollWidth: record.scrollWidth,
      recordClientWidth: record.clientWidth,
      links: links.map((link) => {
        const rect = link.getBoundingClientRect();
        return {
          bottom: rect.bottom,
          height: rect.height,
          left: rect.left,
          right: rect.right,
          scrollWidth: link.scrollWidth,
          clientWidth: link.clientWidth,
          top: rect.top,
        };
      }),
    };
  }));

  for (const record of actionGeometry) {
    expect(record.recordScrollWidth).toBeLessThanOrEqual(record.recordClientWidth);
    expect(record.links).toHaveLength(3);
    for (const link of record.links) {
      expect(link.height).toBeGreaterThanOrEqual(44);
      expect(link.scrollWidth).toBeLessThanOrEqual(link.clientWidth);
    }
    expect(record.links[0].height).toBeGreaterThanOrEqual(44);
    expect(record.links[1].height).toBeGreaterThanOrEqual(44);
    expect(record.links[0].scrollWidth).toBeLessThanOrEqual(record.links[0].clientWidth);
    expect(record.links[1].scrollWidth).toBeLessThanOrEqual(record.links[1].clientWidth);
    expect(record.links[1].top).toBeGreaterThanOrEqual(record.links[0].bottom - 0.5);
    expect(record.links[2].top).toBeGreaterThanOrEqual(record.links[1].bottom - 1.5);
  }
});

test("serves origin-level crawler, security and preview assets with correct media types", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  const sitemap = await request.get("/sitemap.xml");
  const securityTxt = await request.get("/.well-known/security.txt");
  const wordmark = await request.get("/brand/ejupi-labs-primary-carbon.svg");
  expect(robots.status()).toBe(200);
  expect(robots.headers()["content-type"]).toContain("text/plain");
  expect(await robots.text()).toContain("Allow: /");
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()["content-type"]).toContain("application/xml");
  expect(securityTxt.status()).toBe(200);
  expect(securityTxt.headers()["content-type"]).toContain("text/plain");
  expect(await securityTxt.text()).toContain(
    "Canonical: https://ejupi-djenis30.github.io/.well-known/security.txt",
  );
  expect(wordmark.status()).toBe(200);
  expect(wordmark.headers()["content-type"]).toContain("image/svg+xml");
});

test("the skip link moves focus to the main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to the product archive" });
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});

test("unknown paths return the designed 404 page", async ({ page }) => {
  const response = await page.goto("/not-a-real-project");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found.");
});

test("the removed lowercase JDoor path returns the designed 404 page", async ({ page }) => {
  const response = await page.goto("/jdoor/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found.");
});
