// @ts-check
import { test, expect } from "@playwright/test";
import {
  acceptAllCookies,
  gotoWithViewport,
  hasUkTimeFormat,
  mainNav,
} from "./helpers/site.js";

test.describe("Prayer times page", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithViewport(page, "/prayer-times.html", "mobilePortrait");
    await acceptAllCookies(page);
  });

  test("UAT-51: hero live cards with UK times", async ({ page }) => {
    const hero = page.locator(".prayer-times-hero");
    await expect(hero).toBeVisible();
    await page.waitForSelector("[data-prayer-hero-live]", { timeout: 15_000 });
    const heroText = await page.locator("[data-prayer-hero-live]").innerText();
    expect(hasUkTimeFormat(heroText) || heroText.includes("—")).toBeTruthy();
  });

  test("UAT-52: month view is default on load", async ({ page }) => {
    const monthTab = page.locator('[data-prayer-view="month"]');
    await expect(monthTab).toHaveClass(/is-active/);
    await expect(page.locator("[data-prayer-table-host]")).toBeVisible();
  });

  test("UAT-53: switch to week view", async ({ page }) => {
    await page.locator('[data-prayer-view="week"]').click();
    await expect(page.locator('[data-prayer-view="week"]')).toHaveClass(/is-active/);
    await expect(page.locator("[data-prayer-table-host]")).not.toBeEmpty();
  });

  test("UAT-54: switch to day view (desktop)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator('[data-prayer-view="day"]').click();
    await expect(page.locator('[data-prayer-view="day"]')).toHaveClass(/is-active/);
    await expect(page.locator("[data-prayer-day-wrap]")).toBeVisible();
  });

  test("UAT-55: month tabs switch periods", async ({ page }) => {
    const tabs = page.locator(".prayer-times-month-tab");
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(1);

    if (count >= 2) {
      await tabs.nth(1).click();
      await expect(tabs.nth(1)).toHaveClass(/is-active/);
      await tabs.nth(0).click();
      await expect(tabs.nth(0)).toHaveClass(/is-active/);
    }
  });

  test("UAT-56: day picker prev/next/today controls", async ({ page }) => {
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

  test("UAT-58: PDF download link present", async ({ page }) => {
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

  test("UAT-59: Jumu'ah section reachable", async ({ page }) => {
    await page.locator('a[href="#prayer-times-jumuah"]').first().click();
    await expect(page.locator("#prayer-times-jumuah")).toBeVisible();
    await page.locator("#prayer-times-jumuah-heading").scrollIntoViewIfNeeded();
    await expect(page.locator("#prayer-times-jumuah-heading")).toBeVisible();
  });

  test("UAT-62: URL deep link month view (desktop)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/prayer-times.html?view=month");
    await acceptAllCookies(page);
    await expect(page.locator('[data-prayer-view="month"]')).toHaveClass(/is-active/);
  });

  test("UAT-134: UK date format on prayer times page", async ({ page }) => {
    const bodyText = await page.locator("main").innerText();
    expect(bodyText).not.toMatch(
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/,
    );
  });
});

test.describe("Salah times nav panel UK format", () => {
  test("UAT-135: UK time format in nav dropdown", async ({ page }) => {
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
});
