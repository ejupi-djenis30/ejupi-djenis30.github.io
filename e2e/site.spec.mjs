import { expect, test } from "@playwright/test";

test("publishes the complete project index", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Ejupi Labs — Open Source Index");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Open source");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(244, 241, 234)");
  await expect(page.locator(".project-grid")).toHaveCSS("display", "grid");
  await expect(page.locator(".project-card")).toHaveCount(6);
  await expect(page.getByRole("link", { name: /Open the project/ })).toHaveCount(6);
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 },
]) {
  test(`keeps the composition inside ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const geometry = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
  });
}

test("serves origin-level crawler assets with correct media types", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  const sitemap = await request.get("/sitemap.xml");
  expect(robots.status()).toBe(200);
  expect(robots.headers()["content-type"]).toContain("text/plain");
  expect(await robots.text()).toContain("Allow: /");
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()["content-type"]).toContain("application/xml");
});

test("the skip link moves focus to the main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to the projects" });
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});

test("unknown paths return the designed 404 page", async ({ page }) => {
  const response = await page.goto("/not-a-real-project");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nothing here.");
});
