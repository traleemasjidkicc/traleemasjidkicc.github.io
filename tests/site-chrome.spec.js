// @ts-check
import { test, expect } from "@playwright/test";
import {
  acceptAllCookies,
  expectFooterYearCurrent,
  gotoWithViewport,
  mainNav,
  PUBLIC_PAGES,
} from "./helpers/site.js";

test.describe("Site chrome", () => {
  test("NAV-02: brand logo returns home", async ({ page }) => {
    await gotoWithViewport(page, "/contact.html", "mobilePortrait");
    await acceptAllCookies(page);
    await mainNav(page).getByRole("link", { name: /Tralee Masjid|Kerry Islamic/i }).first().click();
    await expect(page).toHaveURL(/\/(index\.html)?$/);
  });

  test("NAV-04: sticky navbar on scroll", async ({ page }) => {
    await gotoWithViewport(page, "/", "mobilePortrait");
    await acceptAllCookies(page);
    const nav = mainNav(page);
    const boxBefore = await nav.boundingBox();
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);
    const boxAfter = await nav.boundingBox();
    expect(boxBefore).toBeTruthy();
    expect(boxAfter).toBeTruthy();
    if (boxBefore && boxAfter) {
      expect(boxAfter.y).toBeLessThanOrEqual(boxBefore.y + 5);
    }
  });

  test("NAV-16: donate now in navbar", async ({ page }) => {
    await gotoWithViewport(page, "/", "desktop");
    await acceptAllCookies(page);
    const donate = mainNav(page).getByRole("link", { name: "Donate now" });
    await expect(donate).toHaveAttribute("href", /gofundme\.com/);
    await expect(donate).toHaveAttribute("target", "_blank");
    await expect(donate).toHaveAttribute("rel", /noopener/);
  });

  test("NAV-18: skip to main content", async ({ page }) => {
    await gotoWithViewport(page, "/", "desktop");
    await acceptAllCookies(page);
    const skip = page.locator(".skip-link");
    await skip.focus();
    await expect(skip).toBeFocused();
    await skip.press("Enter");
    await expect(page).toHaveURL(/#main-content$/);
    await expect(page.locator("#main-content")).toBeInViewport();
  });

  test("NAV-20: footer links on all pages", async ({ page }) => {
    for (const path of PUBLIC_PAGES) {
      await page.goto(path);
      await acceptAllCookies(page);
      const footer = page.locator(".site-footer, .page-footer").first();
      await footer.scrollIntoViewIfNeeded();
      await expect(footer.getByRole("link", { name: /prayer|salah/i }).first()).toBeVisible();
      await expect(footer.getByRole("link", { name: /contact/i }).first()).toBeVisible();
    }
  });

  test("NAV-21: floating dock WhatsApp", async ({ page }) => {
    await gotoWithViewport(page, "/", "mobilePortrait");
    await acceptAllCookies(page);
    const wa = page.locator(".site-action-dock a[href*='wa.me'], .site-action-btn--whatsapp");
    await expect(wa.first()).toHaveAttribute("href", /wa\.me/);
  });

  test("NAV-22: floating dock donate", async ({ page }) => {
    await gotoWithViewport(page, "/", "mobilePortrait");
    await acceptAllCookies(page);
    await expect(page.locator(".site-action-btn--donate")).toHaveAttribute("href", /gofundme/);
  });

  test("NAV-23: back to top", async ({ page }) => {
    await gotoWithViewport(page, "/projects.html", "mobilePortrait");
    await acceptAllCookies(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForFunction(() => {
      const btn = document.querySelector(".site-action-btn--top");
      return btn && btn.classList.contains("is-visible");
    });
    const backToTop = page.locator(".site-action-btn--top");
    await backToTop.click();
    await page.waitForFunction(() => window.scrollY < 200);
  });

  test("HOME-22: footer copyright year", async ({ page }) => {
    await gotoWithViewport(page, "/", "desktop");
    await acceptAllCookies(page);
    await page.locator("#footer-year").scrollIntoViewIfNeeded();
    await expectFooterYearCurrent(page);
  });
});
