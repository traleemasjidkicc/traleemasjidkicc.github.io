// @ts-check
import { expect } from "@playwright/test";

/** @typedef {import('@playwright/test').Page} Page */

export const VIEWPORTS = {
  mobilePortrait: { width: 390, height: 844 },
  mobileLandscape: { width: 844, height: 390 },
  desktop: { width: 1280, height: 800 },
};

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
 * On the homepage it is scheduled ~2.5s after cookie consent — use
 * `{ waitForDelayed: true }` there so beforeEach blocks until it is closed.
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
 * @param {Page} page
 * @param {keyof typeof VIEWPORTS} viewportKey
 */
export async function gotoWithViewport(page, path, viewportKey) {
  await page.setViewportSize(VIEWPORTS[viewportKey]);
  await page.goto(path);
}

/**
 * UK 12-hour time: e.g. 4:30 pm (no leading zero on hour).
 * @param {string} text
 */
export function hasUkTimeFormat(text) {
  return /\b([1-9]|1[0-2]):[0-5]\d\s?(am|pm)\b/i.test(text);
}

/**
 * UK date: day before month, e.g. 24 June 2026
 * @param {string} text
 */
export function hasUkDateFormat(text) {
  return /\b([1-9]|[12]\d|3[01])\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/i.test(
    text,
  );
}

/**
 * @param {Page} page
 */
export function mainNav(page) {
  return page.getByLabel("Main navigation");
}
