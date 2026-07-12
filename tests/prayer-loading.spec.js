// @ts-check
import { test, expect } from "@playwright/test";
import {
  acceptAllCookies,
  clearPrayerCache,
  clearSiteSession,
  delayCloudRun,
  gotoWithViewport,
  hasUkTimeFormat,
  mainNav,
} from "./helpers/site.js";

test.describe("Prayer times loading feedback", () => {
  test("PT-20: nav panel shows loading feedback on slow API", async ({ page, context }) => {
    await delayCloudRun(context, 3000);
    await clearSiteSession(page);
    await clearPrayerCache(page);
    await gotoWithViewport(page, "/", "desktop");
    await acceptAllCookies(page);

    await mainNav(page).locator("#navSalahDropdown").click();

    const menu = page.locator(".kicc-nav-salah-menu");
    await expect(menu).toHaveClass(/is-loading/);
    await expect(page.locator("#nav-salah-status")).toContainText(/Loading prayer times/i);

    await page.waitForFunction(
      () => {
        const values = Array.from(
          document.querySelectorAll(
            "#nav-salah-panel-today .kicc-nav-salah-time-value",
          ),
        );
        return values.some(
          (el) =>
            el.textContent &&
            /(am|pm)/i.test(el.textContent) &&
            !el.textContent.includes("—"),
        );
      },
      { timeout: 20_000 },
    );

    await expect(menu).not.toHaveClass(/is-loading/);
  });

  test("PT-21: home prayer deck shows loading message on slow API", async ({
    page,
    context,
  }) => {
    await delayCloudRun(context, 3000);
    await clearSiteSession(page);
    await clearPrayerCache(page);
    await gotoWithViewport(page, "/", "mobilePortrait");
    await acceptAllCookies(page);

    const loading = page.locator(".home-prayer-deck-loading");
    await expect(loading).toBeVisible({ timeout: 10_000 });
    await expect(loading).toContainText(/Loading prayer times/i);
    await expect(page.locator(".home-prayer-carousel-stage")).toHaveClass(/is-loading/);

    await page.waitForFunction(
      () => {
        const cards = document.querySelectorAll(".home-prayer-deck-card");
        const empty = document.querySelector(".home-prayer-deck-empty");
        if (cards.length > 0) return true;
        return !!(empty && /unavailable/i.test(empty.textContent || ""));
      },
      { timeout: 20_000 },
    );

    const hasCards = await page.locator(".home-prayer-deck-card").count();
    if (hasCards > 0) {
      const deckText = await page.locator("[data-prayer-carousel-track]").innerText();
      expect(hasUkTimeFormat(deckText)).toBeTruthy();
      await expect(page.locator(".home-prayer-carousel-stage")).not.toHaveClass(/is-loading/);
    }
  });

  test("PT-22: prayer times page shows loading status on slow month fetch", async ({
    page,
    context,
  }) => {
    await delayCloudRun(context, 3000);
    await clearSiteSession(page);
    await clearPrayerCache(page);
    await gotoWithViewport(page, "/prayer-times.html", "mobilePortrait");
    await acceptAllCookies(page);

    const status = page.locator("[data-prayer-status]");
    await expect(status).toBeVisible({ timeout: 10_000 });
    await expect(status).toContainText(/Loading timetable/i);
    await expect(status).toHaveClass(/is-loading-status/);
    await expect(page.locator("[data-prayer-table-stage]")).toHaveClass(/is-loading/);

    await page.waitForFunction(
      () => {
        const host = document.querySelector("[data-prayer-table-host]");
        if (!host || !host.textContent) return false;
        const text = host.textContent;
        return (
          /(am|pm)/i.test(text) &&
          !text.includes("No timetable data available for this period")
        );
      },
      { timeout: 20_000 },
    );

    await expect(status).toBeHidden();
    await expect(page.locator("[data-prayer-table-stage]")).not.toHaveClass(/is-loading/);
  });

  test("PT-23: prayer times hero shows loading placeholders on slow API", async ({
    page,
    context,
  }) => {
    await delayCloudRun(context, 3000);
    await clearSiteSession(page);
    await clearPrayerCache(page);
    await gotoWithViewport(page, "/prayer-times.html", "desktop");
    await acceptAllCookies(page);

    const heroLive = page.locator("[data-prayer-hero-live]");
    await expect(heroLive).toHaveClass(/is-loading/, { timeout: 10_000 });
    await expect(page.locator("#prayer-hero-hijri")).toContainText(/Loading/i);

    await page.waitForFunction(
      () => {
        const hijri = document.getElementById("prayer-hero-hijri");
        return (
          hijri &&
          hijri.textContent &&
          hijri.textContent.trim() !== "—" &&
          !/loading/i.test(hijri.textContent)
        );
      },
      { timeout: 20_000 },
    );

    await expect(heroLive).not.toHaveClass(/is-loading/);
  });
});
