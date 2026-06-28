// @ts-check
import { test, expect } from "@playwright/test";

import { acceptAllCookies } from "./helpers/site.js";

test.describe("New Masjid campaign page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projects.html");
    await acceptAllCookies(page);
  });

  test("loads with campaign hero and visible title", async ({ page }) => {
    await expect(page).toHaveTitle(/New Masjid Appeal/i);
    await expect(page.locator("#campaign-hero h1")).toContainText(
      "Help Us Complete the House of Allah",
    );
    await expect(page.locator(".gfm-progress")).toBeVisible();
  });

  test("section nav links to all major segments", async ({ page }) => {
    const nav = page.locator(".campaign-section-nav-list");
    await expect(nav.getByRole("link", { name: "Opening message" })).toHaveAttribute(
      "href",
      "#opening-message",
    );
    await expect(nav.getByRole("link", { name: "Two parts, one vision" })).toHaveAttribute(
      "href",
      "#two-parts-one-vision",
    );
    await expect(nav.getByRole("link", { name: "Progress so far" })).toHaveAttribute(
      "href",
      "#progress-so-far",
    );
    await expect(nav.getByRole("link", { name: "The vision" })).toHaveAttribute(
      "href",
      "#the-vision",
    );
    await expect(nav.getByRole("link", { name: "Construction updates" })).toHaveAttribute(
      "href",
      "#masjid-construction-updates",
    );
    await expect(nav.getByRole("link", { name: "What your donation supports" })).toHaveAttribute(
      "href",
      "#what-your-donation-supports",
    );
    await expect(nav.getByRole("link", { name: "Ways to donate" })).toHaveAttribute(
      "href",
      "#ways-to-donate",
    );
  });

  test("explains community centre progress and main masjid not yet built", async ({
    page,
  }) => {
    await expect(page.locator("#opening-message")).toContainText(
      "main masjid prayer hall has not yet been constructed",
    );
    await expect(page.locator("#two-parts-one-vision")).toContainText(
      "Community Centre",
    );
    await expect(page.locator("#two-parts-one-vision")).toContainText("Main Masjid");
    await expect(page.locator(".campaign-phase-badge-progress")).toContainText(
      "In Progress",
    );
    await expect(page.locator(".campaign-phase-badge-vision")).toContainText(
      "Planned",
    );
  });

  test("shows site photos in progress section", async ({ page }) => {
    const progress = page.locator("#progress-so-far");
    await expect(progress.locator('img[src*="photos/site-wide"]')).toBeVisible();
    await expect(
      progress.locator('img[src*="photos/community-centre-exterior"]'),
    ).toBeVisible();
    await expect(
      progress.locator('img[src*="photos/building-entrance"]'),
    ).toBeVisible();
  });

  test("shows blueprint vision renders and site layouts", async ({ page }) => {
    const vision = page.locator("#the-vision");
    await expect(
      vision.locator('img[src*="blueprints/render-front-elevation"]'),
    ).toBeVisible();
    await expect(
      vision.locator('img[src*="blueprints/site-layout.png"]'),
    ).toBeVisible();
    await expect(vision.locator(".campaign-gallery-caption")).toHaveCount(6);
  });

  test("shows construction update photos", async ({ page }) => {
    const updates = page.locator("#masjid-construction-updates");
    await expect(
      updates.locator('img[src*="construction-update-2024-03-site"]'),
    ).toBeVisible();
    await expect(
      updates.locator('img[src*="construction-update-2024-03-building"]'),
    ).toBeVisible();
    await expect(updates).toContainText("March 2024");
  });

  test("lists funding needs including qardh hasanah and car park", async ({
    page,
  }) => {
    const costs = page.locator("#what-your-donation-supports");
    await expect(costs).toContainText("Qardh Hasanah");
    await expect(costs).toContainText("Car Park");
    await expect(costs).toContainText("Main Masjid");
    await expect(costs).toContainText("€122k");
    await expect(costs).toContainText("€150k");
  });

  test("donate section includes SumUp card payment", async ({ page }) => {
    const sumup = page.locator("#ways-to-donate [data-sumup-donate]");
    await sumup.scrollIntoViewIfNeeded();
    await expect(sumup).toBeVisible();
    await expect(
      page.locator("#ways-to-donate [data-sumup-start-donate]"),
    ).toContainText("Donate with SumUp");
  });

  const GOFUNDME_DONATE_URL =
    "https://www.gofundme.com/f/ub7t7-kerry-islamic-cultural-centre-requires-donation/donate?source=btn_donate";

  test("donate buttons link to GoFundMe", async ({ page }) => {
    const donateLinks = page.locator('a[href*="gofundme.com"][href*="/donate"]');
    await expect(donateLinks.first()).toBeVisible();
    expect(await donateLinks.count()).toBeGreaterThanOrEqual(3);
  });

  test("gallery images load successfully", async ({ page }) => {
    const images = page.locator(".campaign-gallery-img");
    const count = await images.count();
    expect(count).toBeGreaterThanOrEqual(11);

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      await img.scrollIntoViewIfNeeded();
      await expect(img).toHaveAttribute("src", /.+/);
      const naturalWidth = await img.evaluate(
        (el) => /** @type {HTMLImageElement} */ (el).naturalWidth,
      );
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test("sticky donate action is present on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/projects.html");
    await expect(page.locator(".site-action-btn--donate")).toBeVisible();
    await expect(page.locator(".site-action-btn--donate")).toHaveAttribute(
      "href",
      GOFUNDME_DONATE_URL,
    );
  });
});
