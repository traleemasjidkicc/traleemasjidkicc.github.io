// @ts-check
import { test, expect } from "@playwright/test";
import { acceptAllCookies, gotoWithViewport } from "./helpers/site.js";

test.describe("About page", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithViewport(page, "/about.html", "mobilePortrait");
    await acceptAllCookies(page);
  });

  test("ABOUT-01: hero stats visible", async ({ page }) => {
    await expect(page.locator("h1")).toBeVisible();
    const stats = page.locator(".about-stat, [data-about-stat]");
    await expect(stats.first()).toBeVisible();
    const body = await page.locator("main").innerText();
    expect(body).toMatch(/1988|2001|140|CHY/i);
  });

  test("ABOUT-02: timeline and story sections", async ({ page }) => {
    await page.locator("#who-we-are").scrollIntoViewIfNeeded();
    await expect(page.locator("#who-we-are")).toBeVisible();
    await expect(page.locator("#our-story")).toBeVisible();
    await expect(page.locator("main img").first()).toBeVisible();
  });

  test("ABOUT-03: team member cards", async ({ page }) => {
    await page.locator("#our-team").scrollIntoViewIfNeeded();
    await expect(page.locator("#our-team")).toBeVisible();
    const teamCards = page.locator(".about-team-card");
    expect(await teamCards.count()).toBeGreaterThanOrEqual(1);
    await expect(teamCards.first().locator("img")).toHaveAttribute("alt", /.+/);
  });

  test("ABOUT-04: visit and connect cards", async ({ page }) => {
    await page.locator("#visit-us-heading, #visit-us").first().scrollIntoViewIfNeeded();
    await expect(page.locator("#visit-us")).toBeVisible();
    await expect(page.getByRole("link", { name: /contact|programmes|maps/i }).first()).toBeVisible();
  });

  test("ABOUT-05: support GoFundMe bar", async ({ page }) => {
    const support = page.locator("#support");
    await support.scrollIntoViewIfNeeded();
    await expect(support.locator(".gfm-progress, a[href*='gofundme']").first()).toBeVisible();
  });

  test("ABOUT-06: section nav scroll targets", async ({ page }) => {
    const navLink = page.locator('.about-section-nav a[href="#who-we-are"]').first();
    await navLink.click();
    await expect(page.locator("#who-we-are")).toBeInViewport();
  });

  test("ANN-04: daily hadith on about page", async ({ page }) => {
    await page.locator(".hadith-card").first().scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () => {
        const el = document.getElementById("hadith-body");
        return el && el.textContent && el.textContent.trim().length > 20;
      },
      { timeout: 20_000 },
    );
    await expect(page.locator("#hadith-link")).toHaveAttribute("href", /.+/);
  });
});
