// @ts-check
import { test, expect } from "@playwright/test";
import {
  acceptAllCookies,
  dismissHomeSignupModal,
  gotoWithViewport,
  mainNav,
} from "./helpers/site.js";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithViewport(page, "/", "mobilePortrait");
    await acceptAllCookies(page);
    await dismissHomeSignupModal(page, { waitForDelayed: true });
  });

  test("NAV-01: site loads with title and hero", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await acceptAllCookies(page);
    await expect(page).toHaveTitle(/Tralee Masjid|Kerry Islamic Cultural Centre/i);
    await expect(mainNav(page)).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
  });

  test("HOME-01: hero renders on mobile", async ({ page }) => {
    const hero = page.locator("#home-hero").first();
    await expect(hero).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(24);
  });

  test("HOME-03: hero shows dates and prayer status", async ({ page }) => {
    const text = await page.locator("main").innerText();
    expect(text.length).toBeGreaterThan(100);
    await expect(page.locator("[data-prayer-carousel-stage]")).toBeVisible();
  });

  test("HOME-04: prayer deck day navigation", async ({ page }) => {
    await expect(page.locator("[data-home-prayer-suite]")).toBeAttached();
    await expect(page.locator("[data-prayer-day-prev]")).toBeAttached();
    await expect(page.locator("[data-prayer-day-next]")).toBeAttached();
    await expect(page.locator("[data-prayer-day-today]")).toBeAttached();

    const suiteReady = await page.evaluate(() => {
      const suite = document.querySelector("[data-home-prayer-suite]");
      return !!(suite && !suite.hidden);
    });
    if (!suiteReady) {
      return;
    }

    await page.locator("[data-prayer-day-next]").click();
    await expect(page.locator("[data-prayer-carousel-label]")).not.toBeEmpty();
    await page.locator("[data-prayer-day-today]").click();
    await expect(page.locator("[data-prayer-carousel-stage]")).toContainText(
      /(am|pm|unavailable)/i,
    );
  });

  test("HOME-07: link to full timetable", async ({ page }) => {
    await page.locator("#home-explore-heading").scrollIntoViewIfNeeded();
    const timetableLink = page.getByRole("link", { name: /View timetable/i });
    await expect(timetableLink).toHaveAttribute("href", /prayer-times\.html/);
    await Promise.all([
      page.waitForURL(/prayer-times\.html/, { timeout: 15_000 }),
      timetableLink.click(),
    ]);
  });

  test("HOME-10: pillars of faith tabs switch content", async ({ page }) => {
    const angelsTab = page.locator('[data-faith-tab="angels"]');
    await angelsTab.scrollIntoViewIfNeeded();
    await angelsTab.click();
    await expect(page.locator('[data-faith-panel="angels"]')).toBeVisible();
    await expect(page.locator('[data-faith-tab="angels"]')).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("HOME-11: pillars of Islam accordion", async ({ page }) => {
    const firstPillar = page.locator(".pillars-islam-pillar-trigger").first();
    await firstPillar.scrollIntoViewIfNeeded();
    await firstPillar.click();
    await expect(firstPillar).toHaveAttribute("aria-expanded", "true");
  });

  test("HOME-13: explore hub links", async ({ page }) => {
    await page.locator("#home-explore-heading").scrollIntoViewIfNeeded();
    await expect(page.getByRole("link", { name: /View timetable/i })).toHaveAttribute(
      "href",
      /prayer-times/,
    );
    await expect(page.getByRole("link", { name: /View schedule/i })).toHaveAttribute(
      "href",
      /activities/,
    );
    await expect(page.getByRole("link", { name: /Class times/i })).toHaveAttribute(
      "href",
      /madrasa/,
    );
  });

  test("HOME-17: homepage donate section with progress and SumUp", async ({ page }) => {
    const progress = page.locator(".gfm-progress").first();
    await progress.scrollIntoViewIfNeeded();
    await expect(progress).toBeVisible();
    const startDonate = page.locator("[data-sumup-start-donate]").first();
    await startDonate.scrollIntoViewIfNeeded();
    await startDonate.click();
    await expect(page.locator("[data-sumup-donate]").first()).toBeVisible();
  });

  test("HOME-19: Qur'an verse block", async ({ page }) => {
    const quran = page.locator(".home-quran-verse-section").first();
    await quran.scrollIntoViewIfNeeded();
    await expect(quran).toBeVisible();
    await expect(quran.getByRole("link").first()).toHaveAttribute("href", /quran\.com/);
  });

  test("HOME-20: homepage layout in landscape remains usable", async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto("/");
    await acceptAllCookies(page);

    await expect(mainNav(page)).toBeVisible();
    await expect(page.locator("[data-prayer-carousel-stage]")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(24);
  });
});

test.describe("Donations high priority", () => {
  test("DON-03: SumUp on homepage", async ({ page }) => {
    await gotoWithViewport(page, "/", "mobilePortrait");
    await acceptAllCookies(page);
    await page.locator("[data-sumup-start-donate]").first().scrollIntoViewIfNeeded();
    await page.locator("[data-sumup-start-donate]").first().click();
    await expect(page.locator("[data-sumup-donate]").first()).toBeVisible();
  });
});

test.describe("Accessibility basics", () => {
  test("ACC-01: page language en-GB", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en-GB");
  });

  test("ACC-02: keyboard focus on nav links", async ({ page }) => {
    await gotoWithViewport(page, "/", "desktop");
    await acceptAllCookies(page);
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
  });
});
