// @ts-check
import { test, expect } from "@playwright/test";
import {
  acceptAllCookies,
  acceptEssentialCookiesOnly,
  clearSiteSession,
  gotoWithViewport,
} from "./helpers/site.js";
import {
  SUMUP_HOSTED_FIELDS,
  SUMUP_SUCCESS_CARD,
  expectSumUpError,
  expectSumUpSuccess,
  fillSumUpHostedFields,
  openSumUpCheckout,
  submitSumUpDonation,
  sumUpPanel,
  waitForSumUpWidget,
} from "./helpers/sumup.js";

test.describe("SumUp sandbox donations", () => {
  test.describe.configure({ mode: "serial", timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await gotoWithViewport(page, "/projects.html#ways-to-donate", "desktop");
    await acceptAllCookies(page);
  });

  test("DON-05: SumUp sandbox ribbon on localhost", async ({ page }) => {
    await openSumUpCheckout(page);

    const panel = sumUpPanel(page);
    await expect(panel.sandboxRibbon).toContainText(/sandbox only/i);
    await expect(panel.sandboxRibbon).toContainText(/no real payment/i);
    await expect(panel.root).toHaveClass(/is-sandbox-mode/);
  });

  test("DON-06: SumUp hosted card fields mount", async ({ page }) => {
    await openSumUpCheckout(page);

    for (const fieldName of SUMUP_HOSTED_FIELDS) {
      await expect(
        page.frameLocator(`iframe[name="${fieldName}"]`).locator("input"),
      ).toBeVisible({ timeout: 15_000 });
    }

    await expect(
      sumUpPanel(page).cardMount.locator('button:has-text("Donate")'),
    ).toBeVisible();
  });

  test("DON-07: SumUp sandbox successful payment", async ({ page }) => {
    await openSumUpCheckout(page, { amount: 10 });
    await fillSumUpHostedFields(page, SUMUP_SUCCESS_CARD);
    await submitSumUpDonation(page);
    await expectSumUpSuccess(page);
    await expect(sumUpPanel(page).successAmount).toContainText(/10/);
  });

  test("DON-08: SumUp sandbox declined payment", async ({ page }) => {
    await openSumUpCheckout(page, { amount: "custom", customValue: "11" });
    await fillSumUpHostedFields(page, SUMUP_SUCCESS_CARD);
    await submitSumUpDonation(page);
    await expectSumUpError(page);
    await expect(sumUpPanel(page).errorTitle).toContainText(/payment not completed/i);
    await expect(sumUpPanel(page).errorRetry).toBeVisible();
  });

  test("DON-09: SumUp error retry reopens checkout", async ({ page }) => {
    await openSumUpCheckout(page, { amount: "custom", customValue: "11" });
    await fillSumUpHostedFields(page, SUMUP_SUCCESS_CARD);
    await submitSumUpDonation(page);
    await expectSumUpError(page);

    await sumUpPanel(page).errorRetry.click();
    await expect(sumUpPanel(page).error).toBeHidden();
    await expect(sumUpPanel(page).startDonate).toBeEnabled();

    await sumUpPanel(page).startDonate.click();
    await waitForSumUpWidget(page);
  });
});

test.describe("SumUp consent and homepage", () => {
  test.describe.configure({ timeout: 120_000 });

  test("DON-10: SumUp blocked without third-party embed consent", async ({
    page,
  }) => {
    await gotoWithViewport(page, "/projects.html#ways-to-donate", "desktop");
    await clearSiteSession(page);
    await page.reload();
    await acceptEssentialCookiesOnly(page);

    const panel = sumUpPanel(page);
    await panel.startDonate.scrollIntoViewIfNeeded();
    await expect(panel.consentNotice).toBeVisible();
    await expect(panel.startDonate).toBeDisabled();
    await expect(panel.cardMount).toBeHidden();
  });

  test("DON-03: SumUp on homepage opens sandbox checkout", async ({ page }) => {
    await gotoWithViewport(page, "/", "mobilePortrait");
    await acceptAllCookies(page);
    await page.locator("#home-donate, [data-sumup-donate]").first().scrollIntoViewIfNeeded();

    await openSumUpCheckout(page, { scope: "home" });
    await expect(sumUpPanel(page, "home").sandboxRibbon).toBeVisible();
  });
});
