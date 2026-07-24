// @ts-check
import { test, expect } from "@playwright/test";
import {
  acceptAllCookies,
  blockCloudRun,
  clearPrayerCache,
  clearSiteSession,
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

  test("HOME-04b: prayer deck shows five salah on desktop", async ({ page }) => {
    await gotoWithViewport(page, "/", "desktop");
    await acceptAllCookies(page);
    await dismissHomeSignupModal(page, { waitForDelayed: true });

    const suiteReady = await page.waitForFunction(
      () => {
        const suite = document.querySelector("[data-home-prayer-suite]");
        const cards = document.querySelectorAll(".home-prayer-deck-card");
        return !!(suite && !suite.hidden && cards.length >= 5);
      },
      { timeout: 20_000 },
    );
    if (!suiteReady) return;

    const todayVisibleCount = await page.evaluate(() => {
      const viewport = document.querySelector("[data-prayer-carousel-viewport]");
      if (!viewport) return 0;
      const vpRect = viewport.getBoundingClientRect();
      return Array.from(
        document.querySelectorAll('.home-prayer-deck-card[data-day-offset="0"]'),
      ).filter(function (card) {
        const rect = card.getBoundingClientRect();
        return rect.left < vpRect.right && rect.right > vpRect.left && rect.width > 0;
      }).length;
    });
    expect(todayVisibleCount).toBe(5);

    await expect(page.locator("[data-prayer-carousel-label]")).toContainText(/Today/i);
    await expect(page.locator("[data-prayer-day-prev]")).toHaveAttribute(
      "aria-label",
      "Previous day",
    );
    await expect(page.locator("[data-prayer-day-next]")).toHaveAttribute(
      "aria-label",
      "Next day",
    );

    await page.locator("[data-prayer-day-next]").click();
    await expect(page.locator("[data-prayer-carousel-label]")).toContainText(/Tomorrow/i);
    await page.waitForFunction(() => {
      const viewport = document.querySelector("[data-prayer-carousel-viewport]");
      if (!viewport) return false;
      const tomorrowCards = document.querySelectorAll(
        '.home-prayer-deck-card[data-day-offset="1"]',
      );
      if (!tomorrowCards.length) return false;
      const vpRect = viewport.getBoundingClientRect();
      return Array.from(tomorrowCards).some(function (card) {
        const rect = card.getBoundingClientRect();
        return rect.left < vpRect.right && rect.right > vpRect.left && rect.width > 0;
      });
    });

    await page.locator("[data-prayer-day-prev]").click();
    await expect(page.locator("[data-prayer-carousel-label]")).toContainText(/Today/i);
    await page.waitForFunction(() => {
      const lead = document.querySelector(".home-prayer-deck-card.is-centered");
      return lead && lead.getAttribute("data-day-offset") === "0";
    });

    await page.locator("[data-prayer-day-prev]").click();
    await expect(page.locator("[data-prayer-carousel-label]")).toContainText(/Yesterday/i);
    await page.waitForFunction(() => {
      const lead = document.querySelector(".home-prayer-deck-card.is-centered");
      return lead && lead.getAttribute("data-day-offset") === "-1";
    });

    await page.locator("[data-prayer-day-today]").click();
    await expect(page.locator("[data-prayer-carousel-label]")).toContainText(/Today/i);

    await page.locator("[data-prayer-day-prev]").click();
    await expect(page.locator("[data-prayer-carousel-label]")).toContainText(/Yesterday/i);
    await expect(page.locator("[data-prayer-day-prev]")).toBeDisabled();

    await page.locator("[data-prayer-day-next]").click();
    await expect(page.locator("[data-prayer-carousel-label]")).toContainText(/Today/i);
    await page.locator("[data-prayer-day-next]").click();
    await expect(page.locator("[data-prayer-carousel-label]")).toContainText(/Tomorrow/i);
    await expect(page.locator("[data-prayer-day-next]")).toBeDisabled();
  });

  test("HOME-06: prayer deck empty state when API unavailable", async ({ page, context }) => {
    await blockCloudRun(context);
    await clearSiteSession(page);
    await clearPrayerCache(page);
    await gotoWithViewport(page, "/", "desktop");
    await acceptAllCookies(page);
    await dismissHomeSignupModal(page, { waitForDelayed: true });

    await expect(page.locator(".home-prayer-deck-empty")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator(".home-prayer-deck-empty")).toContainText(
      /Prayer times unavailable/i,
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

  test("HOME-11b: unified notices contract renders imageUrl records", async ({
    page,
  }) => {
    let noticesRequestSeen = false;
    await page.route("**/getMasjidProgrammes?type=notices", async (route) => {
      noticesRequestSeen = true;
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          notices: [
            {
              id: "notice-contract-test",
              name: "Community Notice",
              createdAt: 1765283253954,
              imageUrl: "https://example.com/community-notice.png",
              isMasjidNotice: true,
              isActive: true,
            },
          ],
          programmes: [],
          recordings: [],
          collections: [],
        }),
      });
    });
    await page.evaluate(() => localStorage.removeItem("notices"));
    await page.reload();

    await expect(page.locator("#notice-board")).toBeVisible();
    await expect(page.locator(".notices-card-image")).toHaveAttribute(
      "src",
      "https://example.com/community-notice.png",
    );
    await expect(page.locator(".notices-card-caption")).toHaveText(
      "Community Notice",
    );
    expect(noticesRequestSeen).toBeTruthy();
  });

  test("HOME-11c: homepage requests and renders six previous recordings", async ({
    page,
  }) => {
    let recordingsRequestSeen = false;
    await page.route(
      "**/getMasjidProgrammes?type=programmes&active=true",
      (route) =>
        route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            notices: [],
            programmes: [],
            recordings: [],
            collections: [],
          }),
        }),
    );
    await page.route(
      "**/getMasjidProgrammes?type=recordings&recordingsLimit=6",
      (route) => {
        recordingsRequestSeen = true;
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            notices: [],
            programmes: [],
            recordings: Array.from({ length: 8 }, (_, index) => ({
              id: "home-recording-" + index,
              name: "Previous recording " + (index + 1),
              createdAt: 1765283253954 - index * 1000,
              listenUrl: "https://example.com/recording-" + index + ".mp3",
            })),
            collections: [],
          }),
        });
      },
    );
    await page.evaluate(() =>
      localStorage.removeItem("masjidProgrammes_programme_active_true_v2"),
    );
    await page.reload();

    await expect(page.locator("#programmes-recordings-wrap")).toBeVisible();
    await expect(page.locator("#programmes-recordings-list > li")).toHaveCount(6);
    expect(recordingsRequestSeen).toBeTruthy();
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
