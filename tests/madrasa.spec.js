// @ts-check
import { test, expect } from "@playwright/test";
import { acceptAllCookies, gotoWithViewport } from "./helpers/site.js";

test.describe("Madrasa page", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithViewport(page, "/madrasa.html", "mobilePortrait");
    await acceptAllCookies(page);
  });

  test("MAD-01: hero WhatsApp CTA", async ({ page }) => {
    const wa = page.locator('a[href*="wa.me"], a[href*="api.whatsapp.com"]').first();
    await expect(wa).toBeVisible();
    await expect(wa).toHaveAttribute("href", /wa\.me|api\.whatsapp\.com/);
  });

  test("MAD-02: class times tables", async ({ page }) => {
    await page.locator("#class-times").scrollIntoViewIfNeeded();
    await expect(page.locator("#class-times h2")).toContainText(/Class times/i);
    const tableText = await page.locator("#class-times").innerText();
    expect(tableText.length).toBeGreaterThan(50);
  });

  test("MAD-03: ready to enrol WhatsApp only", async ({ page }) => {
    await page.locator("#ready-to-enrol").scrollIntoViewIfNeeded();
    const enrolLink = page.locator('#ready-to-enrol a[href*="wa.me"], #ready-to-enrol a[href*="api.whatsapp.com"]');
    await expect(enrolLink.first()).toBeVisible();
    await expect(enrolLink.first()).not.toHaveAttribute("href", /forms\.office|microsoft/);
  });

  test("MAD-04: Life With Allah app links", async ({ page }) => {
    await page.locator("#madrasa-home-app-heading").scrollIntoViewIfNeeded();
    const storeLinks = page.locator('a[href*="apps.apple.com"], a[href*="play.google.com"]');
    expect(await storeLinks.count()).toBeGreaterThanOrEqual(1);
  });

  test("MAD-05: enrolment copy plain language", async ({ page }) => {
    const mainText = await page.locator("main").innerText();
    expect(mainText).toMatch(/WhatsApp/i);
    expect(mainText.toLowerCase()).not.toMatch(/\bapi\b/);
    expect(mainText.toLowerCase()).not.toMatch(/\bcard\b.*\bprogramme\b/);
  });

  test("MAD-06: madrasa layout in landscape", async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto("/madrasa.html#class-times");
    await acceptAllCookies(page);
    await expect(page.locator("#class-times")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(24);
  });
});
