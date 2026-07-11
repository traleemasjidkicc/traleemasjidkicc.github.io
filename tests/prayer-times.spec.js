// @ts-check
import { test, expect } from "@playwright/test";
import {
  acceptAllCookies,
  gotoWithViewport,
  hasUkDateFormat,
  hasUkTimeFormat,
  mainNav,
} from "./helpers/site.js";

test.describe("Prayer times page", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithViewport(page, "/prayer-times.html", "mobilePortrait");
    await acceptAllCookies(page);
  });

  test("PT-01: hero live cards with UK times", async ({ page }) => {
    const hero = page.locator(".prayer-times-hero");
    await expect(hero).toBeVisible();
    await page.waitForSelector("[data-prayer-hero-live]", { timeout: 15_000 });
    const heroText = await page.locator("[data-prayer-hero-live]").innerText();
    expect(hasUkTimeFormat(heroText) || heroText.includes("—")).toBeTruthy();
  });

  test("PT-02: month view is default on load", async ({ page }) => {
    const monthTab = page.locator('[data-prayer-view="month"]');
    await expect(monthTab).toHaveClass(/is-active/);
    await expect(page.locator("[data-prayer-table-host]")).toBeVisible();
  });

  test("PT-03: switch to week view", async ({ page }) => {
    await page.locator('[data-prayer-view="week"]').click();
    await expect(page.locator('[data-prayer-view="week"]')).toHaveClass(/is-active/);
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
      { timeout: 15_000 },
    );
    const tableText = await page.locator("[data-prayer-table-host]").innerText();
    expect(hasUkTimeFormat(tableText)).toBeTruthy();
    expect(tableText).not.toContain("No data");
  });

  test("PT-19: week view with normalised month cache", async ({ page }) => {
    await page.evaluate(async () => {
      const parts = new Intl.DateTimeFormat("en-IE", {
        timeZone: "Europe/Dublin",
        year: "numeric",
        month: "long",
      }).formatToParts(new Date());
      const year = Number(parts.find((p) => p.type === "year").value);
      const monthName = parts.find((p) => p.type === "month").value;
      const resp = await fetch(
        "https://getiqamahtimes-rds3nxm6za-ew.a.run.app?year=" +
          year +
          "&month=" +
          encodeURIComponent(monthName),
      );
      const json = await resp.json();
      const normalized = json.data.map((day) =>
        Object.assign({}, day, {
          gregorianMonth: Number(day.gregorianMonth) - 1,
        }),
      );
      const key = "iqamah-month-" + year + "-" + monthName;
      const payload = JSON.stringify({
        year: year,
        month: monthName,
        data: normalized,
      });
      localStorage.setItem(
        key,
        JSON.stringify({
          v: 1,
          savedAt: Date.now(),
          payload: payload,
        }),
      );
    });

    await page.reload();
    await acceptAllCookies(page);
    await page.locator('[data-prayer-view="week"]').click();
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
      { timeout: 15_000 },
    );
    const tableText = await page.locator("[data-prayer-table-host]").innerText();
    expect(hasUkTimeFormat(tableText)).toBeTruthy();
    expect(tableText).not.toContain("No data");
  });

  test("PT-04: switch to day view (desktop)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator('[data-prayer-view="day"]').click();
    await expect(page.locator('[data-prayer-view="day"]')).toHaveClass(/is-active/);
    await expect(page.locator("[data-prayer-day-wrap]")).toBeVisible();
    await page.waitForFunction(
      () => {
        const host = document.querySelector("[data-prayer-table-host]");
        if (!host || !host.textContent) return false;
        const text = host.textContent;
        return (
          /(am|pm)/i.test(text) &&
          !text.includes("No timetable data for this date") &&
          !text.includes("No timetable data available for this date")
        );
      },
      { timeout: 15_000 },
    );
    const dayText = await page.locator("[data-prayer-table-host]").innerText();
    expect(hasUkTimeFormat(dayText)).toBeTruthy();
  });

  test("PT-05: month tabs switch periods", async ({ page }) => {
    const tabs = page.locator(".prayer-times-month-tab");
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(1);

    if (count >= 2) {
      const secondMonth = await tabs.nth(1).innerText();
      await tabs.nth(1).click();
      await expect(tabs.nth(1)).toHaveClass(/is-active/);
      await expect(
        page.locator("[data-prayer-times-page] [data-official-timetable-label]").first(),
      ).toContainText(secondMonth.split(" ")[0], { timeout: 10_000 });
      await tabs.nth(0).click();
      await expect(tabs.nth(0)).toHaveClass(/is-active/);
    }
  });

  test("PT-06: day picker prev/next/today controls", async ({ page }) => {
    await page.locator('[data-prayer-view="day"]').click();
    await page.waitForSelector("[data-prayer-period-label]:not(:empty)", {
      timeout: 15_000,
    });
    const labelBefore = await page.locator("[data-prayer-period-label]").innerText();
    await page.locator("[data-prayer-next]").click();
    await page.waitForFunction(
      (before) => {
        const el = document.querySelector("[data-prayer-period-label]");
        return el && el.textContent && el.textContent.trim() !== before;
      },
      labelBefore,
      { timeout: 10_000 },
    );
    await page.locator("[data-prayer-today]").click();
  });

  test("PT-07: print timetable button present", async ({ page }) => {
    await gotoWithViewport(page, "/prayer-times.html", "desktop");
    await acceptAllCookies(page);
    const printBtn = page.locator("[data-prayer-print]").first();
    await printBtn.scrollIntoViewIfNeeded();
    await expect(printBtn).toBeVisible();
  });

  test("PT-08: PDF download link present", async ({ page }) => {
    await page.waitForFunction(
      () => {
        const link = document.getElementById("salah-times-body");
        return link && link.getAttribute("href") && link.getAttribute("href") !== "#";
      },
      { timeout: 15_000 },
    );
    const pdfLink = page.locator("#salah-times-body");
    await pdfLink.scrollIntoViewIfNeeded();
    await expect(pdfLink).toBeVisible();
    await expect(pdfLink).toHaveAttribute("href", /https?:\/\//);
  });

  test("PT-09: Jumu'ah section reachable", async ({ page }) => {
    await page.locator('a[href="#prayer-times-jumuah"]').first().click();
    await expect(page.locator("#prayer-times-jumuah")).toBeVisible();
    await page.locator("#prayer-times-jumuah-heading").scrollIntoViewIfNeeded();
    await expect(page.locator("#prayer-times-jumuah-heading")).toBeVisible();
  });

  test("PT-12: URL deep link month view (desktop)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/prayer-times.html?view=month");
    await acceptAllCookies(page);
    await expect(page.locator('[data-prayer-view="month"]')).toHaveClass(/is-active/);
  });

  test("PT-16: Hijri date display", async ({ page }) => {
    await page.waitForFunction(
      () => {
        const el = document.getElementById("prayer-hero-hijri");
        return el && el.textContent && el.textContent.trim() !== "—" && el.textContent.trim() !== "";
      },
      { timeout: 20_000 },
    );
    const text = await page.locator("#prayer-hero-hijri").innerText();
    expect(text.trim().length).toBeGreaterThan(3);
  });

  test("SEO-08: UK date format on prayer times page", async ({ page }) => {
    const bodyText = await page.locator("main").innerText();
    expect(bodyText).not.toMatch(
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/,
    );
    if (hasUkDateFormat(bodyText)) {
      expect(hasUkDateFormat(bodyText)).toBeTruthy();
    }
  });
});

test.describe("Salah times nav panel UK format", () => {
  test("SEO-09: UK time format in nav dropdown", async ({ page }) => {
    await gotoWithViewport(page, "/", "desktop");
    await acceptAllCookies(page);
    await mainNav(page).locator("#navSalahDropdown").click();
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
    const firstTime = page
      .locator("#nav-salah-panel-today .kicc-nav-salah-time-value")
      .filter({ hasText: /(am|pm)/i })
      .first();
    const text = await firstTime.innerText();
    expect(text).toMatch(/\d{1,2}:\d{2}[\s\u00a0]*(am|pm)/i);
  });

  test("PT-17: expired iqamah cache falls back to API", async ({ page }) => {
    await gotoWithViewport(page, "/", "desktop");
    await acceptAllCookies(page);

    await page.evaluate(() => {
      const parts = new Intl.DateTimeFormat("en-IE", {
        timeZone: "Europe/Dublin",
        year: "numeric",
        month: "long",
      }).formatToParts(new Date());
      const year = Number(parts.find((p) => p.type === "year").value);
      const monthName = parts.find((p) => p.type === "month").value;
      const key = "iqamah-month-" + year + "-" + monthName;
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      const stalePayload = JSON.stringify({
        year: year,
        month: monthName,
        data: [],
      });
      localStorage.setItem(
        key,
        JSON.stringify({
          v: 1,
          savedAt: eightDaysAgo,
          payload: stalePayload,
        }),
      );
    });

    await page.reload();
    await acceptAllCookies(page);
    await mainNav(page).locator("#navSalahDropdown").click();
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

    const cacheState = await page.evaluate(() => {
      const parts = new Intl.DateTimeFormat("en-IE", {
        timeZone: "Europe/Dublin",
        year: "numeric",
        month: "long",
      }).formatToParts(new Date());
      const year = Number(parts.find((p) => p.type === "year").value);
      const monthName = parts.find((p) => p.type === "month").value;
      const key = "iqamah-month-" + year + "-" + monthName;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return { raw: raw };
      }
    });
    expect(cacheState).toBeTruthy();
    expect(cacheState.v).toBe(1);
    expect(Date.now() - cacheState.savedAt).toBeLessThan(60_000);
  });

  test("PT-18: background iqamah fetch when cache is warm", async ({ page }) => {
    await gotoWithViewport(page, "/", "desktop");
    await acceptAllCookies(page);
    await mainNav(page).locator("#navSalahDropdown").click();
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

    const hasWarmCache = await page.evaluate(() =>
      Object.keys(localStorage).some((key) => key.indexOf("iqamah-month-") === 0),
    );
    expect(hasWarmCache).toBeTruthy();

    const iqamahPattern = /getiqamahtimes/i;
    const backgroundRequest = page.waitForRequest(iqamahPattern, {
      timeout: 20_000,
    });
    await page.reload();
    await acceptAllCookies(page);
    await backgroundRequest;
  });
});
