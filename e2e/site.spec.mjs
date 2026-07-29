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

test("publishes JDoor as a complementary engineering record", async ({ page }) => {
  const response = await page.goto("/jdoor/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("JDoor Assist — Engineering record | Ejupi Labs");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Working source",
  );
  await expect(page.locator(".record-panel")).toContainText("DistributionManual");
  await expect(page.locator(".fit-column")).toHaveCount(2);
  await expect(page.locator('.decision-table article[role="row"]')).toHaveCount(4);
  await expect(page.locator("body")).not.toContainText("PRE-RELEASE");
  await expect(page.locator("body")).not.toContainText("Download — in preparation");
  await expect(
    page.getByRole("link", { name: "Visit the product" }),
  ).toHaveAttribute("href", "https://ejupi-djenis30.github.io/JDoor/");
  await expect(page.locator("#provenance")).toContainText("a collaborator");
  await expect(
    page.getByRole("link", { name: /Build from source/ }).first(),
  ).toHaveAttribute(
    "href",
    "https://github.com/ejupi-djenis30/JDoor/blob/main/docs/DEVELOPMENT.md",
  );
  await expect(
    page.getByRole("link", { name: /Threat model/ }),
  ).toHaveAttribute(
    "href",
    "https://github.com/ejupi-djenis30/JDoor/blob/main/docs/THREAT_MODEL.md",
  );
  await expect(
    page.locator('a[href="https://blog.ejupilabs.com/case-studies/jdoor-security-lab/"]').first(),
  ).toHaveAttribute(
    "href",
    "https://blog.ejupilabs.com/case-studies/jdoor-security-lab/",
  );
  await expect(page.locator("script:not([type='application/ld+json']), iframe, form, input, button")).toHaveCount(0);
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute(
    "content",
    /default-src 'none'/,
  );
});

for (const viewport of [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 },
]) {
  for (const path of ["/", "/jdoor/"]) {
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

test("keeps both record actions distinct and touch-friendly at 320px", async ({ page }) => {
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
    expect(record.links).toHaveLength(2);
    expect(record.links[0].height).toBeGreaterThanOrEqual(44);
    expect(record.links[1].height).toBeGreaterThanOrEqual(44);
    expect(record.links[0].scrollWidth).toBeLessThanOrEqual(record.links[0].clientWidth);
    expect(record.links[1].scrollWidth).toBeLessThanOrEqual(record.links[1].clientWidth);
    expect(record.links[1].top).toBeGreaterThanOrEqual(record.links[0].bottom - 0.5);
  }
});

test("serves origin-level crawler and preview assets with correct media types", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  const sitemap = await request.get("/sitemap.xml");
  const wordmark = await request.get("/brand/ejupi-labs-primary-carbon.svg");
  expect(robots.status()).toBe(200);
  expect(robots.headers()["content-type"]).toContain("text/plain");
  expect(await robots.text()).toContain("Allow: /");
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()["content-type"]).toContain("application/xml");
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
