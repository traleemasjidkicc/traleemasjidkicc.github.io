// @ts-check
import { test, expect } from "@playwright/test";
import {
  acceptAllCookies,
  clearPrayerCache,
  mainNav,
} from "./helpers/site.js";

const PRAYER_DAY_TEMPLATE = {
  fajarTime: "4:30 AM",
  fajarJamahTime: "4:45 AM",
  sunriseTime: "5:45 AM",
  dhuharTime: "1:30 PM",
  zohrJamahTime: "1:45 PM",
  asrTime: "5:00 PM",
  asarJamahTime: "5:15 PM",
  maghribTime: "9:30 PM",
  maghribJamahTime: "9:35 PM",
  ishaTime: "10:30 PM",
  ishaJamahTime: "10:45 PM",
  hijriDay: 17,
  hijriMonthName: "Muharram",
  hijriYear: 1448,
  gregorianMonthName: "July",
};

/**
 * @param {number} year
 * @param {number} month
 * @param {number} day
 */
function buildIqamahDay(year, month, day) {
  const monthStr = String(month).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");
  return {
    ...PRAYER_DAY_TEMPLATE,
    gregorianYear: year,
    gregorianMonth: month,
    gregorianDay: day,
    gregorianDateString: `${year}-${monthStr}-${dayStr}`,
  };
}

test.describe("Nav salah post-midnight highlights", () => {
  test.use({ timezoneId: "Europe/Dublin" });

  test.beforeEach(async ({ page, context }) => {
    await context.route(/getiqamahtimes/i, async (route) => {
      const url = new URL(route.request().url());
      const year = Number(url.searchParams.get("year"));
      const month = url.searchParams.get("month");
      const day = url.searchParams.get("day");

      if (day) {
        const dayNum = Number(day);
        if (year === 2026 && month === "July" && dayNum >= 10 && dayNum <= 14) {
          await route.fulfill({
            contentType: "application/json",
            body: JSON.stringify({ data: [buildIqamahDay(2026, 7, dayNum)] }),
          });
          return;
        }
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ data: [] }),
        });
        return;
      }

      if (year === 2026 && month === "July") {
        const data = [10, 11, 12, 13, 14].map((d) => buildIqamahDay(2026, 7, d));
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ data }),
        });
        return;
      }

      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.clock.install({ time: new Date(2026, 6, 12, 1, 30, 0) });
    await page.goto("/");
    await acceptAllCookies(page);
    await clearPrayerCache(page);
    await page.reload();
    await acceptAllCookies(page);
  });

  test("NAV-27: after midnight, row badges match Today/Tomorrow panels only", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.waitForFunction(
      () => {
        const panel = document.querySelector("#nav-salah-panel-today");
        if (!panel) return false;
        const fajr = panel.querySelector(
          '[data-prayer="fajr"] .kicc-nav-salah-time-value',
        );
        return fajr && fajr.textContent && fajr.textContent !== "—";
      },
      { timeout: 20_000 },
    );

    await mainNav(page).locator("#navSalahDropdown").click();
    await expect(page.locator(".kicc-nav-salah-menu")).toBeVisible();

    const todayPanel = page.locator("#nav-salah-panel-today");
    await expect(todayPanel.locator('[data-prayer="fajr"]')).toHaveClass(
      /is-next-prayer/,
    );
    await expect(todayPanel.locator(".is-current-prayer")).toHaveCount(0);

    const status = page.locator("#nav-salah-status");
    await expect(status).toBeVisible();
    await expect(status).toContainText(/Isha/i);
    await expect(status).toContainText(/Fajr/i);

    await page.locator("#nav-salah-tab-tomorrow").click();
    const tomorrowPanel = page.locator("#nav-salah-panel-tomorrow");
    await expect(tomorrowPanel.locator(".is-current-prayer")).toHaveCount(0);
    await expect(tomorrowPanel.locator(".is-next-prayer")).toHaveCount(0);
  });
});
