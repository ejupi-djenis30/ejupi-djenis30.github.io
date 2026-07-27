import { expect, test } from "@playwright/test";

test("publishes the complete project index", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Ejupi Labs — Open Source Index");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Open source");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(244, 241, 234)");
  await expect(page.locator(".project-grid")).toHaveCSS("display", "grid");
  await expect(page.locator(".project-card")).toHaveCount(7);
  await expect(page.getByRole("link", { name: /Open the project/ })).toHaveCount(7);
});

test("publishes JDoor as a safe product tour with no active download", async ({ page }) => {
  const response = await page.goto("/jdoor/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("JDoor Assist 1.0.0 — Product Tour");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Remote support");
  await expect(page.getByText("No remote-control session runs from this page.")).toBeVisible();
  await expect(page.locator(".release-placeholder")).toHaveText("Download — in preparation");
  await expect(
    page.getByRole("link", { name: "Inspect source history ↗" }),
  ).toHaveAttribute("href", "https://github.com/NobodyToListen/JDoor");
  await expect(
    page.getByRole("link", { name: "Case study ↗", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://blog.ejupilabs.com/case-studies/jdoor-security-lab/",
  );
  await expect(page.locator("script, iframe, form, input, button")).toHaveCount(0);
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute(
    "content",
    /default-src 'none'/,
  );
});

for (const viewport of [
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
