// @ts-check
import { test, expect } from "@playwright/test";
import {
  acceptAllCookies,
  clearSiteSession,
  gotoWithViewport,
} from "./helpers/site.js";

test.describe("Programmes page", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithViewport(page, "/activities.html", "mobilePortrait");
    await acceptAllCookies(page);
  });

  test("ACT-01: this week schedule", async ({ page }) => {
    await page.goto("/activities.html#this-week");
    await expect(page.locator("#this-week-heading")).toBeVisible();
    await page.waitForSelector("#programmes-weekly-schedule .programmes-schedule-item", {
      timeout: 20_000,
    });
  });

  test("ACT-01b: unified programmes and recordings contracts populate the page", async ({
    page,
  }) => {
    let programmesRequestSeen = false;
    let recordingsRequestSeen = false;
    await page.route(
      "**/getMasjidProgrammes?type=programmes&active=true",
      async (route) => {
        programmesRequestSeen = true;
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            notices: [],
            programmes: [
              {
                id: "programme-contract-test",
                name: "Contract Programme",
                weekdays: ["Fri"],
                prayerName: "Maghrib",
                timeDescription: "Every Friday after Maghrib",
                isMasjidProgramme: true,
                isActive: true,
              },
            ],
            recordings: [],
            collections: [],
          }),
        });
      },
    );
    await page.route(
      "**/getMasjidProgrammes?type=recordings&recordingsLimit=20",
      async (route) => {
        recordingsRequestSeen = true;
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            notices: [],
            programmes: [],
            recordings: [],
            collections: [{ collectionName: "bayaan", label: "Bayaan" }],
          }),
        });
      },
    );
    await page.evaluate(() =>
      localStorage.removeItem("masjidProgrammes_programme_active_true_v2"),
    );
    await page.reload();

    await expect(page.locator("body")).toContainText("Contract Programme");
    expect(programmesRequestSeen).toBeTruthy();
    expect(recordingsRequestSeen).toBeTruthy();
  });

  test("ACT-03: programme details modal opens", async ({ page }) => {
    await page.goto("/activities.html#this-week");
    const interactive = page.locator(".programmes-schedule-item--interactive").first();
    await interactive.waitFor({ state: "visible", timeout: 20_000 });
    await interactive.click();

    const modal = page.locator("#programme-details-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  test("ACT-04: programme guide adults section", async ({ page }) => {
    await page.goto("/activities.html#programme-guide");
    await expect(page.locator("#programme-guide-heading")).toBeVisible();
    await expect(page.locator("#adult-programmes-heading")).toContainText(/Adult programmes/i);
  });

  test("ACT-05: madrasa card links to madrasa", async ({ page }) => {
    await page.goto("/activities.html#programme-guide");
    const madrasaLink = page.getByRole("link", { name: /Madrasa details/i });
    await madrasaLink.scrollIntoViewIfNeeded();
    await expect(madrasaLink).toHaveAttribute("href", /madrasa\.html/);
  });

  test("ACT-06: women's weekly class section", async ({ page }) => {
    await page.goto("/activities.html#womens-weekly-class");
    await page.waitForFunction(
      () => {
        const el = document.getElementById("womens-weekly-class");
        return el && !el.hidden;
      },
      { timeout: 20_000 },
    );
    await expect(page.locator("#womens-weekly-class")).toBeVisible();
  });

  test("ACT-08: Mixlr behind consent gate", async ({ page }) => {
    await clearSiteSession(page);
    await page.goto("/activities.html#live-audio-recordings");
    await page.locator("#cookie-necessary").click();
    await page.waitForFunction(
      () => !document.documentElement.classList.contains("cookie-consent-pending"),
    );
    await page.goto("/activities.html#live-audio-recordings");
    const mixlr = page.locator(".consent-embed-mixlr").first();
    await mixlr.scrollIntoViewIfNeeded();
    await expect(mixlr.locator("iframe")).toHaveCount(0);
  });

  test("ACT-11: how to join CTAs", async ({ page }) => {
    await page.goto("/activities.html#how-to-join");
    await expect(page.locator("#how-to-join-heading")).toBeVisible();
    const links = page.locator("#how-to-join a[href]");
    expect(await links.count()).toBeGreaterThanOrEqual(1);
  });

  test("ACT-13: external links open new tab", async ({ page }) => {
    await page.goto("/activities.html#how-to-join");
    const external = page.locator('#how-to-join a[target="_blank"]').first();
    await external.scrollIntoViewIfNeeded();
    await expect(external).toHaveAttribute("target", "_blank");
    const rel = await external.getAttribute("rel");
    expect(rel || "").toMatch(/noopener|noreferrer/);
  });

  test("ACT-14: home receiver promo links to Imam contact", async ({ page }) => {
    await page.goto("/activities.html#listen-at-home");
    await expect(page.locator("#listen-at-home-heading")).toBeVisible();
    await expect(page.locator("#listen-at-home-heading")).toContainText(/Masjid WiFi Receiver/i);
    const purchaseLink = page.getByRole("link", { name: /Ask the Imam to purchase/i });
    await expect(purchaseLink).toHaveAttribute("href", /contact\.html#reach-the-right-person/);
  });

  test("ACT-15: overview dashboard populates after programmes load", async ({ page }) => {
    await page.goto("/activities.html");
    await page.waitForFunction(
      () => {
        const today = document.getElementById("prog-overview-today-body");
        const week = document.getElementById("prog-overview-week-body");
        const live = document.getElementById("prog-overview-live-body");
        if (!today || !week || !live) return false;
        const hasContent = (el) =>
          el.querySelector(".prog-overview-list") ||
          el.querySelector(".prog-overview-live-title") ||
          (el.textContent && !/Loading|Checking/i.test(el.textContent.trim()));
        return hasContent(today) && hasContent(week) && hasContent(live);
      },
      { timeout: 20_000 },
    );
    await expect(page.locator("#prog-overview-today-body")).toBeVisible();
    await expect(page.locator("#prog-overview-week-body")).toBeVisible();
    await expect(page.locator("#prog-overview-live-body")).toBeVisible();
  });
});
