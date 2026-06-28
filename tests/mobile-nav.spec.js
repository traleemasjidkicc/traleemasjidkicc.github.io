// @ts-check
import { test, expect } from "@playwright/test";
import { acceptAllCookies, gotoWithViewport, mainNav } from "./helpers/site.js";

test.describe("Mobile navigation", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithViewport(page, "/", "mobilePortrait");
    await acceptAllCookies(page);
  });

  test("UAT-4: hamburger opens menu with backdrop and scroll lock", async ({ page }) => {
    const toggler = mainNav(page).locator(".navbar-toggler");
    await toggler.click();

    await expect(page.locator("#navbarResponsive")).toHaveClass(/show/);
    await expect(page.locator(".kicc-nav-backdrop")).toHaveClass(/is-visible/);
    await expect(page.locator("body")).toHaveClass(/kicc-nav-open/);
  });

  test("UAT-5: menu closes and navigates on Madrasa link", async ({ page }) => {
    await mainNav(page).locator(".navbar-toggler").click();
    await mainNav(page).getByRole("link", { name: "Madrasa", exact: true }).click();

    await expect(page).toHaveURL(/madrasa\.html/);
    await expect(page.locator("#navbarResponsive")).not.toHaveClass(/show/);
    await expect(page.locator("body")).not.toHaveClass(/kicc-nav-open/);
  });

  test("UAT-7: programmes mega menu navigates to programme guide", async ({ page }) => {
    await mainNav(page).locator(".navbar-toggler").click();
    await mainNav(page).locator("#navProgrammesDropdown").click();
    await mainNav(page).getByRole("link", { name: "Programme guide" }).click();

    await expect(page).toHaveURL(/activities\.html#programme-guide/);
  });

  test("UAT-9: salah times dropdown Today/Tomorrow tabs (mobile portrait)", async ({
    page,
  }) => {
    await mainNav(page).locator(".navbar-toggler").click();
    await mainNav(page).locator("#navSalahDropdown").click();
    await page.waitForSelector("#nav-salah-tab-today", { timeout: 15_000 });

    await expect(page.locator("#nav-salah-tab-today")).toBeVisible();
    await expect(page.locator("#nav-salah-panel-today")).toBeVisible();

    await page.locator("#nav-salah-tab-tomorrow").click();
    await expect(page.locator("#nav-salah-panel-tomorrow")).toBeVisible();

    const panelText = await page.locator(".kicc-nav-salah-dropdown").innerText();
    expect(panelText.length).toBeGreaterThan(10);
  });

  test("UAT-119: mobile nav toggler has usable tap area", async ({ page }) => {
    const box = await mainNav(page).locator(".navbar-toggler").boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(40);
    }
  });
});

test.describe("Desktop navigation", () => {
  test("UAT-3: desktop top nav links visible", async ({ page }) => {
    await gotoWithViewport(page, "/", "desktop");
    await acceptAllCookies(page);

    const nav = mainNav(page);
    await expect(nav.locator(".navbar-toggler")).toBeHidden();
    await expect(nav.getByRole("link", { name: "Madrasa", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "New Masjid", exact: true })).toBeVisible();
    await expect(nav.locator("#navSalahDropdown")).toBeVisible();
    await expect(nav.getByRole("link", { name: "Donate now" })).toBeVisible();
  });

  test("UAT-6: programmes mega menu links to this week", async ({ page }) => {
    await gotoWithViewport(page, "/", "desktop");
    await acceptAllCookies(page);

    await mainNav(page).locator("#navProgrammesDropdown").click();
    await mainNav(page).getByRole("link", { name: "This week" }).click();
    await expect(page).toHaveURL(/activities\.html#this-week/);
    await expect(page.locator("#this-week-heading")).toBeInViewport();
  });

  test("UAT-8: about mega menu links to contact", async ({ page }) => {
    await gotoWithViewport(page, "/", "desktop");
    await acceptAllCookies(page);

    await mainNav(page).locator("#navAboutDropdown").click();
    await mainNav(page).getByRole("link", { name: "Contact us" }).click();
    await expect(page).toHaveURL(/contact\.html/);
    await expect(page.locator("h1")).toContainText(/Here to Help/i);
  });
});
