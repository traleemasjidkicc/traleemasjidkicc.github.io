// @ts-check
import { test, expect } from "@playwright/test";
import { acceptAllCookies, PUBLIC_PAGES, VIEWPORTS } from "./helpers/site.js";

test.describe("Responsiveness", () => {
  for (const path of PUBLIC_PAGES) {
    test(`RESP-01: no horizontal scroll on ${path} at 375px`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.responsiveCheck);
      await page.goto(path);
      await acceptAllCookies(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(24);
    });
  }

  test("HOME-21: very small screen 320px", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.narrowMobile);
    await page.goto("/");
    await acceptAllCookies(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(24);
    const fontSize = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.body).fontSize),
    );
    expect(fontSize).toBeGreaterThanOrEqual(14);
  });

  test("RESP-02: homepage text readable without zoom", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobilePortrait);
    await page.goto("/");
    await acceptAllCookies(page);
    const fontSize = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.body).fontSize),
    );
    expect(fontSize).toBeGreaterThanOrEqual(14);
  });
});
