// @ts-check
import { expect } from "@playwright/test";

/** @typedef {import('@playwright/test').Page} Page */
/** @typedef {import('@playwright/test').BrowserContext} BrowserContext */

export const VIEWPORTS = {
  mobilePortrait: { width: 390, height: 844 },
  mobileLandscape: { width: 844, height: 390 },
  desktop: { width: 1280, height: 800 },
  narrowMobile: { width: 320, height: 568 },
  responsiveCheck: { width: 375, height: 812 },
};

export const PUBLIC_PAGES = [
  "/",
  "/prayer-times.html",
  "/activities.html",
  "/projects.html",
  "/about.html",
  "/madrasa.html",
  "/contact.html",
];

const CLOUD_RUN_HOST = /\.run\.app/;
const MIXLR_HOST = /api\.mixlr\.com/;
const CREATE_CHECKOUT_HOST = /createcheckout-rds3nxm6za-ew\.a\.run\.app/;

/**
 * Clear consent cookie and web storage for a fresh visitor session.
 * @param {Page} page
 */
export async function clearSiteSession(page) {
  await page.context().clearCookies();
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Dismiss the Kerry Muslim database signup modal when it appears.
 * @param {Page} page
 * @param {{ waitForDelayed?: boolean }} [options]
 */
export async function dismissHomeSignupModal(page, options = {}) {
  const { waitForDelayed = false } = options;
  const modal = page.locator("#myModal");
  const dismissBtn = page.locator("#sub-btn-tomorrow, .signup-modal-close").first();
  const appearTimeout = waitForDelayed ? 6_000 : 1_500;

  try {
    await modal.waitFor({ state: "visible", timeout: appearTimeout });
    await dismissBtn.click();
    await expect(modal).not.toHaveClass(/show/, { timeout: 5_000 });
    await expect(page.locator(".modal-backdrop")).toHaveCount(0, { timeout: 5_000 });
  } catch {
    // Modal not shown for this session.
  }
}

/**
 * @param {Page} page
 */
export async function acceptAllCookies(page) {
  const banner = page.locator("#cookie-consent");
  const accept = page.locator("#cookie-accept");
  if (await banner.isVisible()) {
    await accept.click();
    await page.waitForFunction(
      () => !document.documentElement.classList.contains("cookie-consent-pending"),
    );
  }
}

/**
 * Accept essential cookies only (third-party embeds remain blocked).
 * @param {Page} page
 */
export async function acceptEssentialCookiesOnly(page) {
  const banner = page.locator("#cookie-consent");
  const necessary = page.locator("#cookie-necessary");
  if (await banner.isVisible()) {
    await necessary.click();
    await page.waitForFunction(
      () => !document.documentElement.classList.contains("cookie-consent-pending"),
    );
  }
}

/**
 * @param {Page} page
 * @param {string} path
 * @param {keyof typeof VIEWPORTS} viewportKey
 */
export async function gotoWithViewport(page, path, viewportKey) {
  await page.setViewportSize(VIEWPORTS[viewportKey]);
  await page.goto(path);
}

/**
 * @param {Page} page
 */
export async function openCookieSettings(page) {
  const bannerSettings = page.locator("#cookie-banner-settings");
  const footerSettings = page.locator("#cookie-prefs-open");
  if (await bannerSettings.isVisible()) {
    await bannerSettings.click();
  } else {
    await footerSettings.scrollIntoViewIfNeeded();
    await footerSettings.click();
  }
  await expect(page.locator("#cookie-preferences.is-visible")).toBeVisible();
}

/**
 * @param {Page} page
 */
export function mainNav(page) {
  return page.getByLabel("Main navigation");
}

/**
 * @param {string} text
 */
export function hasUkTimeFormat(text) {
  return /\b([1-9]|1[0-2]):[0-5]\d\s?(am|pm)\b/i.test(text);
}

/**
 * @param {string} text
 */
export function hasUkDateFormat(text) {
  return /\b([1-9]|[12]\d|3[01])\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/i.test(
    text,
  );
}

/**
 * @param {BrowserContext} context
 */
export async function blockCloudRun(context) {
  await context.route(CLOUD_RUN_HOST, (route) => route.abort("failed"));
}

/**
 * @param {BrowserContext} context
 */
export async function blockMixlr(context) {
  await context.route(MIXLR_HOST, (route) => route.abort("failed"));
}

/**
 * @param {BrowserContext} context
 */
export async function blockCreateCheckout(context) {
  await context.route(CREATE_CHECKOUT_HOST, (route) => route.abort("failed"));
}

/**
 * Delay Cloud Run API responses to exercise loading UI.
 * @param {BrowserContext} context
 * @param {number} [delayMs]
 */
export async function delayCloudRun(context, delayMs = 2500) {
  await context.route(CLOUD_RUN_HOST, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

/**
 * Remove iqamah month caches so prayer times must fetch fresh data.
 * @param {Page} page
 */
export async function clearPrayerCache(page) {
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((key) => key.indexOf("iqamah-") === 0)
      .forEach((key) => localStorage.removeItem(key));
  });
}

/**
 * @param {Page} page
 * @param {string[]} [paths]
 */
export async function visitAllPublicPages(page, paths = PUBLIC_PAGES) {
  for (const path of paths) {
    await page.goto(path);
    await acceptAllCookies(page);
    await expect(page.locator("main")).toBeVisible();
  }
}

/**
 * @param {Page} page
 */
export async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(24);
}

/**
 * @param {Page} page
 */
export async function expectFooterYearCurrent(page) {
  const year = String(new Date().getFullYear());
  await expect(page.locator("#footer-year")).toHaveText(year);
}

/**
 * @param {Page} page
 * @param {import('@playwright/test').Locator} link
 */
export async function expectExternalLinkIcon(page, link) {
  await expect(link.locator(".external-link-icon, .fa-arrow-up-right-from-square")).toBeVisible();
}
