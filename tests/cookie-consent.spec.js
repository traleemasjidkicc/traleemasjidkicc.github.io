// @ts-check
import { test, expect } from "@playwright/test";
import {
  acceptAllCookies,
  clearSiteSession,
  gotoWithViewport,
} from "./helpers/site.js";

test.describe("Cookie consent and privacy", () => {
  test.describe.configure({ mode: "serial" });
  test("UAT-19: first-visit cookie banner (mobile portrait)", async ({ page }) => {
    await gotoWithViewport(page, "/", "mobilePortrait");
    await clearSiteSession(page);
    await page.reload();

    await expect(page.locator("#cookie-consent")).toBeVisible();
    await expect(page.locator("#cookie-accept")).toBeVisible();
    await expect(page.locator("#cookie-banner-settings")).toBeVisible();
    await expect(page.locator("html")).toHaveClass(/cookie-consent-pending/);
  });

  test("UAT-20: accept all enables embeds (mobile portrait)", async ({ page }) => {
    await gotoWithViewport(page, "/", "mobilePortrait");
    await clearSiteSession(page);
    await page.reload();
    await acceptAllCookies(page);

    await expect(page.locator("#cookie-consent")).toBeHidden();
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === "kicc-cookie-consent")).toBeTruthy();

    const mixlrSection = page.locator(".consent-embed-mixlr").first();
    await mixlrSection.scrollIntoViewIfNeeded();
    await expect(mixlrSection).toBeVisible();
  });

  test("UAT-21: essential-only blocks Mixlr iframe (desktop)", async ({ page }) => {
    await gotoWithViewport(page, "/", "desktop");
    await clearSiteSession(page);
    await page.reload();

    await page.locator("#cookie-necessary").click();
    await page.waitForFunction(
      () => !document.documentElement.classList.contains("cookie-consent-pending"),
    );

    await page.reload();
    const mixlr = page.locator(".consent-embed-mixlr").first();
    await mixlr.scrollIntoViewIfNeeded();
    await expect(mixlr.locator("iframe")).toHaveCount(0);
  });

  test("UAT-27: preferences persist across pages (desktop)", async ({ page }) => {
    await gotoWithViewport(page, "/", "desktop");
    await clearSiteSession(page);
    await page.reload();

    await page.locator("#cookie-banner-settings").click();
    await page.locator('label[for="cookie-prefs-toggle-analytics"]').click();
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !document.documentElement.classList.contains("cookie-consent-pending"),
    );

    await page.goto("/activities.html");
    await expect(page.locator("#cookie-consent")).toBeHidden();
    const cookies = await page.context().cookies();
    const consent = cookies.find((c) => c.name === "kicc-cookie-consent");
    expect(consent?.value).toBeTruthy();
    expect(consent?.value).toMatch(/analytics/i);
  });

  test("UAT-28: privacy copy avoids developer jargon (mobile portrait)", async ({
    page,
  }) => {
    await gotoWithViewport(page, "/", "mobilePortrait");
    await clearSiteSession(page);
    await page.reload();

    const bannerText = await page.locator("#cookie-consent-desc").innerText();
    expect(bannerText.toLowerCase()).not.toMatch(/\bapi\b/);
    expect(bannerText.toLowerCase()).not.toMatch(/\blocalstorage\b/);
    expect(bannerText.toLowerCase()).not.toMatch(/\bembed\b/);
  });

  test("UAT-26: Google Maps consent on contact (mobile portrait)", async ({ page }) => {
    await gotoWithViewport(page, "/contact.html#contact-visit", "mobilePortrait");
    await clearSiteSession(page);
    await page.goto("/contact.html#contact-visit");

    const mapEmbed = page.locator(".contact-map-embed");
    await mapEmbed.scrollIntoViewIfNeeded();
    await expect(mapEmbed.locator("iframe")).toHaveCount(0);

    await acceptAllCookies(page);
    await page.goto("/contact.html#contact-visit");
    await mapEmbed.scrollIntoViewIfNeeded();
    await expect(mapEmbed.locator("iframe")).toHaveCount(1, { timeout: 15_000 });
  });
});
