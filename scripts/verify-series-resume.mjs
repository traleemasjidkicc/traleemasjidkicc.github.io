// One-off manual verification for programme series resume (run with dev server on :3000)
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";

const waitForSeries = async (page) => {
  await page.goto(`${BASE}/activities.html#programme-series`);
  await page.waitForFunction(
    () => {
      const stage = document.getElementById(
        "programmes-recording-collections-carousel-stage",
      );
      return stage && !stage.hidden;
    },
    { timeout: 30_000 },
  );
};

const firstCollectionCard = (page) =>
  page.locator(".programmes-recording-collection-card").first();

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${BASE}/`);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.locator("#cookie-accept").click();
  await page.waitForFunction(
    () => !document.documentElement.classList.contains("cookie-consent-pending"),
  );

  await waitForSeries(page);
  const card = firstCollectionCard(page);
  const collectionName = await card.getAttribute("data-collection");
  if (!collectionName) throw new Error("No collection card found");

  // First visit: no resume prompt, panel opens
  await card.click();
  await page.waitForSelector("#programmes-recording-series-panel:not([hidden])");
  const recordingCount = await page.evaluate(() => {
    return document.querySelectorAll(
      "#programmes-recording-series-list .programmes-recording-playlist-item",
    ).length;
  });
  if (recordingCount < 1) {
    throw new Error("Expected at least one recording in series");
  }
  const midTalkIndex = Math.min(1, recordingCount - 1);
  const nextTalkIndex = Math.min(midTalkIndex + 1, recordingCount - 1);

  const resumeHiddenFirst = await page
    .locator("#programmes-recording-series-resume")
    .isHidden();
  if (!resumeHiddenFirst) {
    throw new Error("Resume prompt should be hidden on first visit");
  }

  await page.evaluate(() => {
    if (typeof window.Amplitude !== "undefined") {
      window.Amplitude.stop();
    }
  });

  // Seed saved mid-talk progress, then reload (simulates return visit)
  await page.evaluate(
    ({ name, midTalkIndex }) => {
      localStorage.setItem(
        "kicc-programme-series-progress",
        JSON.stringify({
          v: 1,
          collections: {
            [name]: {
              recordingId: "",
              trackIndex: midTalkIndex,
              currentTime: 42,
              completed: false,
              updatedAt: Date.now(),
            },
          },
        }),
      );
    },
    { name: collectionName, midTalkIndex },
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSeries(page);

  // Return visit: resume prompt visible, no autoplay
  await firstCollectionCard(page).click();
  await page.waitForSelector("#programmes-recording-series-resume:not([hidden])");
  const playerState = await page.evaluate(() =>
    typeof window.Amplitude !== "undefined"
      ? window.Amplitude.getPlayerState()
      : "missing",
  );
  if (playerState === "playing") {
    throw new Error("Should not autoplay when saved progress exists");
  }

  // Continue resolves to saved talk + seek
  await page.locator('[data-series-resume="continue"]').click();
  await page.waitForFunction(
    ({ midTalkIndex }) => {
      if (typeof window.Amplitude === "undefined") return false;
      var meta = window.Amplitude.getActivePlaylistMetadata();
      return (
        meta &&
        meta.active_index === midTalkIndex &&
        window.Amplitude.getPlayerState() === "playing"
      );
    },
    { midTalkIndex },
    { timeout: 30_000 },
  );
  const afterContinue = await page.evaluate(() => {
    const audio = window.Amplitude.getAudio();
    const meta = window.Amplitude.getActivePlaylistMetadata();
    return {
      index: meta && meta.active_index,
      time: audio ? audio.currentTime : 0,
    };
  });
  if (afterContinue.index !== midTalkIndex) {
    throw new Error(
      `Continue expected track index ${midTalkIndex}, got ${afterContinue.index}`,
    );
  }

  // Completed talk + Continue -> next talk
  await page.evaluate(() => {
    if (typeof window.Amplitude !== "undefined") {
      window.Amplitude.stop();
    }
  });
  await page.evaluate(
    ({ name, midTalkIndex }) => {
      const store = JSON.parse(
        localStorage.getItem("kicc-programme-series-progress"),
      );
      store.collections[name].completed = true;
      store.collections[name].trackIndex = midTalkIndex;
      store.collections[name].currentTime = 0;
      localStorage.setItem(
        "kicc-programme-series-progress",
        JSON.stringify(store),
      );
    },
    { name: collectionName, midTalkIndex },
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSeries(page);
  await firstCollectionCard(page).click();
  await page.waitForSelector("#programmes-recording-series-resume:not([hidden])");
  await page.locator('[data-series-resume="continue"]').click();
  await page.waitForFunction(
    ({ nextTalkIndex }) => {
      const meta = window.Amplitude.getActivePlaylistMetadata();
      return meta && meta.active_index === nextTalkIndex;
    },
    { nextTalkIndex },
    { timeout: 30_000 },
  );

  // No functional consent: progress not stored
  await page.context().clearCookies();
  await page.goto(`${BASE}/`);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.locator("#cookie-consent").waitFor({ state: "visible" });
  await page.locator("#cookie-necessary").click();
  await page.waitForFunction(
    () => !document.documentElement.classList.contains("cookie-consent-pending"),
  );
  await waitForSeries(page);
  await firstCollectionCard(page).click();
  await page.waitForSelector("#programmes-recording-series-panel:not([hidden])");
  await page.evaluate(() => {
    if (typeof window.Amplitude !== "undefined") {
      window.Amplitude.pause();
    }
  });
  await page.waitForTimeout(500);
  const noConsentProgress = await page.evaluate(() =>
    localStorage.getItem("kicc-programme-series-progress"),
  );
  if (noConsentProgress) {
    throw new Error("Progress should not save without functional consent");
  }

  console.log("Programme series resume verification passed.");
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
