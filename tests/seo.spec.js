// @ts-check
import { test, expect } from "@playwright/test";

const PUBLIC_PAGES = [
  { path: "/", titlePattern: /Tralee Masjid|Kerry Islamic Cultural Centre/i },
  { path: "/prayer-times.html", titlePattern: /Prayer|Salah/i },
  { path: "/activities.html", titlePattern: /Programmes|Activities/i },
  { path: "/projects.html", titlePattern: /New Masjid|Masjid Appeal/i },
  { path: "/about.html", titlePattern: /About/i },
  { path: "/madrasa.html", titlePattern: /Madrasa/i },
  { path: "/contact.html", titlePattern: /Contact/i },
];

test.describe("SEO and PWA metadata", () => {
  for (const { path, titlePattern } of PUBLIC_PAGES) {
    test(`SEO-01: unique title on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(titlePattern);
    });

    test(`SEO-02: canonical URL on ${path}`, async ({ page }) => {
      await page.goto(path);
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute("href", /^https:\/\/traleemasjidkicc\.ie/);
    });

    test(`SEO-03: Open Graph tags on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /.+/);
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", /.+/);
    });
  }

  test("SEO-05: sitemap lists public pages", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain("prayer-times.html");
    expect(body).toContain("activities.html");
    expect(body).toContain("projects.html");
    expect(body).toContain("about.html");
    expect(body).toContain("madrasa.html");
    expect(body).toContain("contact.html");
    expect(body).not.toContain("404.html");
  });

  test("SEO-06: robots.txt allows crawl", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body.toLowerCase()).toContain("sitemap");
    expect(body).not.toMatch(/Disallow:\s*\/\s*$/m);
  });
});
