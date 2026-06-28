// @ts-check
import { test, expect } from "@playwright/test";
import { acceptAllCookies, gotoWithViewport } from "./helpers/site.js";

test.describe("Contact form", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithViewport(page, "/contact.html#contact-form", "desktop");
    await acceptAllCookies(page);
    await page.locator("#contact-form-el").evaluate((form) => {
      form.setAttribute("action", "#");
    });
  });

  test("UAT-103: empty submit shows inline errors and focuses first field", async ({
    page,
  }) => {
    await page.locator(".contact-submit-btn").click();

    await expect(page.locator("#contact-name-error")).toHaveClass(/is-visible/);
    await expect(page.locator("#contact-email-error")).toHaveClass(/is-visible/);
    await expect(page.locator("#contact-message-error")).toHaveClass(/is-visible/);
    await expect(page.locator("#contact-name")).toBeFocused();
  });

  test("UAT-104: validation rules on blur (mobile portrait)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.locator("#contact-name").fill("Ab");
    await page.locator("#contact-name").blur();
    await expect(page.locator("#contact-name-error")).toContainText(/at least 3 characters/i);

    await page.locator("#contact-email").fill("not-an-email");
    await page.locator("#contact-email").blur();
    await expect(page.locator("#contact-email-error")).toContainText(/valid email/i);

    await page.locator("#contact-message").fill("Too short");
    await page.locator("#contact-message").blur();
    await expect(page.locator("#contact-message-error")).toContainText(/at least 20 characters/i);
  });

  test("UAT-105: message character counter updates", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#contact-message").fill("Hello from UAT testing message.");
    await expect(page.locator("#contact-message-count")).toHaveText(/\d+ \/ 2000/);
    await expect(page.locator("#contact-message-count")).toHaveAttribute("aria-live", "polite");
  });

  test("UAT-120: form labels and error roles", async ({ page }) => {
    await expect(page.locator('label[for="contact-name"]')).toBeVisible();
    await expect(page.locator('label[for="contact-email"]')).toBeVisible();
    await expect(page.locator('label[for="contact-message"]')).toBeVisible();

    await page.locator(".contact-submit-btn").click();
    await expect(page.locator("#contact-name-error")).toHaveAttribute("role", "alert");
    await expect(page.locator("#contact-email-error")).toHaveAttribute("role", "alert");
    await expect(page.locator("#contact-message-error")).toHaveAttribute("role", "alert");
  });

  test("UAT-106: valid form passes client validation before submit", async ({ page }) => {
    await page.locator("#contact-form-el").evaluate((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
      });
    });

    await page.locator("#contact-name").fill("UAT Tester");
    await page.locator("#contact-email").fill("uat@example.com");
    await page.locator("#contact-message").fill(
      "This is a UAT validation message with enough characters to pass.",
    );

    await page.locator(".contact-submit-btn").click();
    await expect(page.locator("#contact-name")).not.toHaveClass(/is-invalid/);
    await expect(page.locator("#contact-email")).not.toHaveClass(/is-invalid/);
    await expect(page.locator("#contact-message")).not.toHaveClass(/is-invalid/);
  });
});
