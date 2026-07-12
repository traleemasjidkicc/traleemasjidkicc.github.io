// @ts-check
import { test, expect } from "@playwright/test";
import {
  acceptAllCookies,
  blockCloudRun,
  blockMixlr,
  clearPrayerCache,
  clearSiteSession,
  gotoWithViewport,
  mainNav,
} from "./helpers/site.js";

test.describe("Error states", () => {
  test("ERR-01: branded 404 page", async ({ page }) => {
    await page.goto("/404.html");
    await acceptAllCookies(page);
    await expect(page.locator("#error-heading")).toContainText(/could not be found/i);
    await expect(mainNav(page)).toBeVisible();
  });

  test("ERR-02: invalid hash anchor does not crash", async ({ page }) => {
    await gotoWithViewport(page, "/about.html#nonexistent-section-uat", "mobilePortrait");
    await acceptAllCookies(page);
    await expect(page.locator("main")).toBeVisible();
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test("ERR-03: prayer API failure degrades nav panel", async ({ page, context }) => {
    await blockCloudRun(context);
    await clearSiteSession(page);
    await clearPrayerCache(page);
    await page.goto("/");
    await acceptAllCookies(page);
    await mainNav(page).locator("#navSalahDropdown").click();
    await expect(page.locator(".kicc-nav-salah-dropdown")).toBeVisible();
    await expect(page.locator("#nav-salah-status")).toContainText(
      /Prayer times unavailable/i,
      { timeout: 20_000 },
    );
  });

  test("ERR-04: Mixlr API failure keeps page usable", async ({ page, context }) => {
    await blockMixlr(context);
    await gotoWithViewport(page, "/activities.html#live-audio-recordings", "desktop");
    await acceptAllCookies(page);
    await expect(page.locator("#live-audio-recordings-heading, #live-audio-recordings").first()).toBeVisible();
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.waitForTimeout(2_000);
    expect(errors).toHaveLength(0);
  });

  test("ERR-06: maps consent placeholder copy", async ({ page }) => {
    await gotoWithViewport(page, "/contact.html#contact-visit", "mobilePortrait");
    await clearSiteSession(page);
    await page.goto("/contact.html#contact-visit");
    await page.locator("#cookie-necessary").click();
    await page.waitForFunction(
      () => !document.documentElement.classList.contains("cookie-consent-pending"),
    );
    await page.goto("/contact.html#contact-visit");
    const placeholder = page.locator(".contact-map-embed .consent-embed-placeholder").first();
    await placeholder.scrollIntoViewIfNeeded();
    await expect(placeholder).toBeVisible();
    await expect(placeholder).toContainText(/Privacy|cookies/i);
  });
});
