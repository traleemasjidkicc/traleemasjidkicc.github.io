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

  test("UAT-1: site loads with title and hero", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await acceptAllCookies(page);
    await expect(page).toHaveTitle(/Tralee Masjid|Kerry Islamic Cultural Centre/i);
    await expect(mainNav(page)).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
  });

  test("UAT-34: hero shows dates and prayer status", async ({ page }) => {
    const text = await page.locator("main").innerText();
    expect(text.length).toBeGreaterThan(100);
    await expect(page.locator("[data-prayer-carousel-stage]")).toBeVisible();
  });

  test("UAT-35: prayer deck day navigation", async ({ page }) => {
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

  test("UAT-37: link to full timetable", async ({ page }) => {
    await page.locator("#home-explore-heading").scrollIntoViewIfNeeded();
    const timetableLink = page.getByRole("link", { name: /View timetable/i });
    await expect(timetableLink).toHaveAttribute("href", /prayer-times\.html/);
    await Promise.all([
      page.waitForURL(/prayer-times\.html/, { timeout: 15_000 }),
      timetableLink.click(),
    ]);
  });

  test("UAT-40: pillars of faith tabs switch content", async ({ page }) => {
    const angelsTab = page.locator('[data-faith-tab="angels"]');
    await angelsTab.scrollIntoViewIfNeeded();
    await angelsTab.click();
    await expect(page.locator('[data-faith-panel="angels"]')).toBeVisible();
    await expect(page.locator('[data-faith-tab="angels"]')).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("UAT-47: homepage donate section with progress and SumUp", async ({ page }) => {
    const progress = page.locator(".gfm-progress").first();
    await progress.scrollIntoViewIfNeeded();
    await expect(progress).toBeVisible();
    const startDonate = page.locator("[data-sumup-start-donate]").first();
    await startDonate.scrollIntoViewIfNeeded();
    await startDonate.click();
    await expect(page.locator("[data-sumup-donate]").first()).toBeVisible();
  });

  test("UAT-50: homepage layout in landscape remains usable", async ({ page }) => {
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

test.describe("Programmes page", () => {
  test("UAT-66: weekly schedule grid loads", async ({ page }) => {
    await gotoWithViewport(page, "/activities.html#this-week", "mobilePortrait");
    await acceptAllCookies(page);
    await expect(page.locator("#this-week-heading")).toBeVisible();
    await page.waitForSelector("#programmes-weekly-schedule .programmes-schedule-item", {
      timeout: 20_000,
    });
  });

  test("UAT-68: programme details modal opens", async ({ page }) => {
    await gotoWithViewport(page, "/activities.html#this-week", "mobilePortrait");
    await acceptAllCookies(page);

    const interactive = page.locator(".programmes-schedule-item--interactive").first();
    await interactive.waitFor({ state: "visible", timeout: 20_000 });
    await interactive.click();

    const modal = page.locator("#programme-details-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });
});

test.describe("Donations high priority", () => {
  test("UAT-84: GoFundMe donate links on projects (mobile)", async ({ page }) => {
    await gotoWithViewport(page, "/projects.html", "mobilePortrait");
    await acceptAllCookies(page);
    const links = page.locator('a[href*="gofundme.com"][href*="/donate"]');
    expect(await links.count()).toBeGreaterThanOrEqual(3);
  });

  test("UAT-85: SumUp widget mounts on projects (desktop)", async ({ page }) => {
    await gotoWithViewport(page, "/projects.html#ways-to-donate", "desktop");
    await acceptAllCookies(page);
    const startBtn = page.locator("[data-sumup-start-donate]").first();
    await startBtn.scrollIntoViewIfNeeded();
    await startBtn.click();
    await expect(page.locator("[data-sumup-donate]")).toBeVisible();
  });

  test("UAT-111: SumUp on homepage", async ({ page }) => {
    await gotoWithViewport(page, "/", "mobilePortrait");
    await acceptAllCookies(page);
    await page.locator("[data-sumup-start-donate]").first().scrollIntoViewIfNeeded();
    await page.locator("[data-sumup-start-donate]").first().click();
    await expect(page.locator("[data-sumup-donate]").first()).toBeVisible();
  });
});

test.describe("Accessibility basics", () => {
  test("UAT-113: page language en-GB", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en-GB");
  });

  test("UAT-114: keyboard focus on nav links", async ({ page }) => {
    await gotoWithViewport(page, "/", "desktop");
    await acceptAllCookies(page);
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
  });
});
