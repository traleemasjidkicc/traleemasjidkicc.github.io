// @ts-check
import { expect } from "@playwright/test";

/** @typedef {import('@playwright/test').Page} Page */
/** @typedef {import('@playwright/test').Locator} Locator */

/** SumUp sandbox test card — frictionless success (Visa). */
export const SUMUP_SUCCESS_CARD = {
  number: "4200000000000091",
  expiry: "12/30",
  cvv: "123",
  cardholder: "Test Donor",
};

/** SumUp docs: these amounts force a failed payment in sandbox. */
export const SUMUP_DECLINE_AMOUNTS = ["11.00", "42.01", "42.76", "42.91"];

export const SUMUP_HOSTED_FIELDS = [
  "cardDetails.cardholder",
  "cardDetails.number",
  "cardDetails.expiryDate",
  "cardDetails.securityCode",
];

/**
 * @param {Page} page
 * @param {"projects" | "home"} [scope]
 */
export function sumUpPanel(page, scope = "projects") {
  const root =
    scope === "home"
      ? page.locator("#sumup-donate-panel")
      : page.locator("[data-sumup-donate]").first();
  return {
    root,
    startDonate: root.locator("[data-sumup-start-donate]").first(),
    cardMount: root.locator("[data-sumup-card-mount]"),
    sandboxRibbon: root.locator("[data-sumup-sandbox-ribbon]"),
    success: root.locator("[data-sumup-success]"),
    error: root.locator("[data-sumup-error]"),
    errorTitle: root.locator("[data-sumup-error-title]"),
    errorRetry: root.locator("[data-sumup-error-retry]"),
    successAmount: root.locator("[data-sumup-success-amount]"),
    consentNotice: root.locator("[data-sumup-consent-notice]"),
    status: root.locator("[data-sumup-status]"),
    customAmountBtn: root.locator('[data-sumup-amount="custom"]'),
    customAmountInput: root.locator("[data-sumup-custom-input]"),
    presetAmount: (amount) => root.locator(`[data-sumup-amount="${amount}"]`),
  };
}

/**
 * Open SumUp checkout and wait for the hosted payment form.
 * @param {Page} page
 * @param {{
 *   scope?: "projects" | "home",
 *   amount?: number | "custom",
 *   customValue?: string,
 * }} [options]
 */
export async function openSumUpCheckout(page, options = {}) {
  const { scope = "projects", amount, customValue } = options;
  const panel = sumUpPanel(page, scope);

  await panel.startDonate.scrollIntoViewIfNeeded();

  if (amount === "custom") {
    await panel.customAmountBtn.click();
    if (customValue) {
      await panel.customAmountInput.fill(customValue);
    }
  } else if (typeof amount === "number") {
    await panel.presetAmount(amount).click();
  }

  await panel.startDonate.click();
  await waitForSumUpWidget(page, scope);
  await expect(panel.sandboxRibbon).toBeVisible({ timeout: 15_000 });
  await expect(panel.root).toHaveClass(/is-sandbox-mode/);
}

/**
 * @param {Page} page
 * @param {"projects" | "home"} [scope]
 */
export async function waitForSumUpWidget(page, scope = "projects") {
  const panel = sumUpPanel(page, scope);
  await expect(panel.cardMount).toBeVisible({ timeout: 45_000 });

  for (const fieldName of SUMUP_HOSTED_FIELDS) {
    await expect(page.locator(`iframe[name="${fieldName}"]`)).toBeAttached({
      timeout: 30_000,
    });
  }
}

/**
 * @param {Page} page
 * @param {string} fieldName
 * @param {string} value
 */
export async function fillSumUpHostedField(page, fieldName, value) {
  const frame = page.frameLocator(`iframe[name="${fieldName}"]`);
  await frame.locator("input").fill(value);
}

/**
 * @param {Page} page
 * @param {typeof SUMUP_SUCCESS_CARD} [card]
 */
export async function fillSumUpHostedFields(page, card = SUMUP_SUCCESS_CARD) {
  await fillSumUpHostedField(page, "cardDetails.cardholder", card.cardholder);
  await fillSumUpHostedField(page, "cardDetails.number", card.number);
  await fillSumUpHostedField(page, "cardDetails.expiryDate", card.expiry);
  await fillSumUpHostedField(page, "cardDetails.securityCode", card.cvv);
}

/**
 * @param {Page} page
 * @param {"projects" | "home"} [scope]
 */
export async function submitSumUpDonation(page, scope = "projects") {
  const panel = sumUpPanel(page, scope);
  await panel.cardMount.locator('button:has-text("Donate")').click();
}

/**
 * @param {Page} page
 * @param {"projects" | "home"} [scope]
 */
export async function expectSumUpSuccess(page, scope = "projects") {
  const panel = sumUpPanel(page, scope);
  await expect(panel.success).toBeVisible({ timeout: 60_000 });
  await expect(panel.error).toBeHidden();
  await expect(panel.successAmount).not.toHaveText("—");
}

/**
 * @param {Page} page
 * @param {"projects" | "home"} [scope]
 */
export async function expectSumUpError(page, scope = "projects") {
  const panel = sumUpPanel(page, scope);
  await expect(panel.error).toBeVisible({ timeout: 60_000 });
  await expect(panel.success).toBeHidden();
}
