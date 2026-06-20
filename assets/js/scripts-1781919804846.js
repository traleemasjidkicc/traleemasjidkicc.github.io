(function () {
  "use strict";

  const getPathname = () => window.location.pathname || "";

  const isHomePage = () => {
    const path = getPathname();
    return path === "/" || /\/index\.html$/i.test(path);
  };

  const isActivitiesPage = () => /\/activities\.html$/i.test(getPathname());

  const isProjectsPage = () => /\/projects\.html$/i.test(getPathname());

  const isAboutPage = () => /\/about\.html$/i.test(getPathname());

  const isMadrasaPage = () => /\/madrasa\.html$/i.test(getPathname());

  const isContactPage = () => /\/contact\.html$/i.test(getPathname());

  const getPageKey = () => {
    if (isHomePage()) return "home";
    if (isActivitiesPage()) return "activities";
    if (isMadrasaPage()) return "madrasa";
    if (isProjectsPage()) return "projects";
    if (isAboutPage()) return "about";
    if (isContactPage()) return "contact";
    return null;
  };

  const scrollToLocationHash = () => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    const id = decodeURIComponent(hash.slice(1));
    const target = document.getElementById(id);
    if (!target) return;

    requestAnimationFrame(function () {
      target.scrollIntoView({ behavior: "auto", block: "start" });
    });
  };

  const setElHtml = (id, html) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };

  const getToday = () => {
    return new Date();
  };

  const addDays = (date, days) => {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const isToday = (someDate) => {
    var today = getToday();
    return (
      someDate.getDate() == today.getDate() &&
      someDate.getMonth() == today.getMonth() &&
      someDate.getFullYear() == today.getFullYear()
    );
  };

  const isRamadan = () => {
    // Ramadan 2026 is on: February 17, 2026, 15:00:00 AM
    var ramadanStartDate = new Date(2026, 1, 17, 15, 0, 0, 0);
    return (
      addDays(getToday(), 4) >= ramadanStartDate &&
      getToday() < addDays(ramadanStartDate, 27)
    );
  };

  const isEid = () => {
    // Eid 2026 is on: March 19, 2026, 15:00:00 PM
    var eidStartDate = new Date(2026, 2, 19, 15, 0, 0, 0);
    return getToday() >= eidStartDate && getToday() < addDays(eidStartDate, 1);
  };

  const setFooterYear = () => {
    setElHtml("footer-year", String(getToday().getFullYear()));
  };

  const COOKIE_CONSENT_KEY = "kicc-cookie-consent";
  const COOKIE_CONSENT_LEGACY_KEY = "kicc-accept-cookie";
  const GA_MEASUREMENT_ID = "G-3H9CDDS71D";
  const CONSENT_DEFAULTS = {
    necessary: true,
    functional: false,
    analytics: false,
    thirdParty: false,
  };
  const CONSENT_ALL_ON = {
    necessary: true,
    functional: true,
    analytics: true,
    thirdParty: true,
  };
  const FUNCTIONAL_COOKIE_NAMES = ["kicc-modal-tmw", "kicc-modal-registered"];
  const FUNCTIONAL_STORAGE_KEYS = [
    "salahTimesAssetUrl",
    "iqamah-today",
    "iqamah-tomorrow",
    "kicc-announcements",
    "notices",
    "kicc-random-hadith",
    "masjidProgrammes_programme_active_true_v1",
    "kicc-campaign-progress",
  ];
  const FUNCTIONAL_SESSION_KEYS = ["kicc-notices-spotlight-dismissed"];
  const BREAKING_DISMISS_PREFIX = "kicc-breaking-dismiss-";

  const parseConsentCookie = () => {
    try {
      if (typeof Cookies === "undefined") return null;
      const raw = Cookies.get(COOKIE_CONSENT_KEY);
      if (raw) {
        if (raw === "all") return Object.assign({}, CONSENT_ALL_ON);
        if (raw === "essential") return Object.assign({}, CONSENT_DEFAULTS);
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return {
            necessary: true,
            functional: !!parsed.functional,
            analytics: !!parsed.analytics,
            thirdParty: !!parsed.thirdParty,
          };
        }
      }
      const legacy = Cookies.get(COOKIE_CONSENT_LEGACY_KEY);
      if (legacy !== undefined && legacy !== "false") {
        return {
          necessary: true,
          functional: true,
          analytics: false,
          thirdParty: false,
        };
      }
    } catch {
      return null;
    }
    return null;
  };

  const hasConsentChoice = () => parseConsentCookie() !== null;

  const getConsentPrefs = () => {
    const parsed = parseConsentCookie();
    return parsed || Object.assign({}, CONSENT_DEFAULTS);
  };

  const canUseFunctionalStorage = () => getConsentPrefs().functional;

  const canUseAnalytics = () => getConsentPrefs().analytics;

  const canUseThirdPartyEmbeds = () => getConsentPrefs().thirdParty;

  const kiccStorageGet = (storage, key) => {
    if (storage === localStorage && !canUseFunctionalStorage()) return null;
    if (storage === sessionStorage && !canUseFunctionalStorage()) return null;
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  };

  const kiccStorageSet = (storage, key, value) => {
    if (storage === localStorage && !canUseFunctionalStorage()) return false;
    if (storage === sessionStorage && !canUseFunctionalStorage()) return false;
    try {
      storage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  };

  const setFunctionalCookie = (name, value, options) => {
    if (!canUseFunctionalStorage() || typeof Cookies === "undefined") return;
    Cookies.set(name, value, options);
  };

  const setSalahTimeUrl = () => {
    const SALAH_TIMES_KEY = "salahTimesAssetUrl";
    const baseUrl = "https://getsalahtimes-rds3nxm6za-ew.a.run.app";

    // 1) Try to use cached URL first (non-blocking)
    try {
      const cached = kiccStorageGet(localStorage, SALAH_TIMES_KEY);
      if (cached) {
        console.log("Using cached salah times URL:", cached);
        applySalahTimesUrl(cached);
      }
    } catch (e) {
      console.warn("Unable to read localStorage", e);
    }

    // 2) Always call API to refresh
    let targetDate;
    try {
      targetDate = addDays(getToday(), 3);
    } catch (e) {
      console.error("Error computing target date", e);
      return;
    }

    const month = targetDate.toLocaleString("en-GB", { month: "long" });
    const year = targetDate.getFullYear();
    const ramadan = isRamadan();

    const url = new URL(baseUrl);
    url.searchParams.set("month", month);
    url.searchParams.set("year", String(year));
    url.searchParams.set("isRamadan", String(ramadan));

    fetch(url.toString())
      .then((response) => {
        console.log("Salah times API response status:", response.status);
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then((json) => {
        console.log("Salah times API JSON:", json);
        const data = json && json.data;
        if (!Array.isArray(data) || !data.length || !data[0].url) {
          console.error("No salah times data returned");
          return;
        }

        const asset = data[0].url;
        console.log("Latest salah times URL from API:", asset);

        // Update DOM
        applySalahTimesUrl(asset);

        // Update localStorage
        try {
          kiccStorageSet(localStorage, SALAH_TIMES_KEY, asset);
        } catch (e) {
          console.warn("Unable to write localStorage", e);
        }
      })
      .catch((error) => {
        console.error("Error loading salah times", error);
      });
  };

  const applySalahTimesUrl = (asset) => {
    const elMain = document.getElementById("salah-times");
    const elFooter = document.getElementById("salah-times-footer");
    const elBody = document.getElementById("salah-times-body");

    if (elMain) elMain.href = asset;
    if (elFooter) elFooter.href = asset;
    if (elBody && isHomePage()) {
      elBody.href = asset;
    }
  };

  const setEvent = () => {
    const liveNowEl = document.getElementById("live-now");
    const nameEl = document.getElementById("event-name");
    const startsAtEl = document.getElementById("starts-at");
    const dayEl = document.getElementById("event-day");
    const dateEl = document.getElementById("event-date");
    const monthEl = document.getElementById("event-month");
    const yearEl = document.getElementById("event-year");

    if (
      !liveNowEl ||
      !nameEl ||
      !startsAtEl ||
      !dayEl ||
      !dateEl ||
      !monthEl ||
      !yearEl
    ) {
      console.warn("Event elements missing in DOM");
      return;
    }

    fetch("https://api.mixlr.com/users/7752720?source=embed")
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((mixlrData) => {
        // Live / Off Air badge
        const isLive = !!mixlrData.is_live;
        liveNowEl.innerHTML = isLive
          ? '<span class="programmes-live-badge is-live"><span aria-hidden="true">●</span> Live now</span>'
          : '<span class="programmes-live-badge is-offline">Off air</span>';

        const allEvents = Array.isArray(mixlrData.events)
          ? mixlrData.events
          : [];

        // Sort safely
        const sortedEvents = allEvents.length
          ? allEvents
              .slice()
              .sort(
                (a, b) =>
                  Number(a.starts_at_timestamp) - Number(b.starts_at_timestamp),
              )
          : [];

        const today = getToday();
        const todayMs = today.getTime();
        const defaultStarts = Math.floor(todayMs / 1000); // today
        const defaultEnds = Math.floor((todayMs + 86400 * 1000) / 1000); // +1d

        const fallbackEvent = {
          title: "Check back for upcoming events",
          starts_at_timestamp: defaultStarts,
          ends_at_timestamp: defaultEnds,
        };

        const eventsData =
          sortedEvents[0] == null ? fallbackEvent : sortedEvents[0];

        const startDate = new Date(eventsData.starts_at_timestamp * 1000);
        const endDate = new Date(eventsData.ends_at_timestamp * 1000);

        const startsAt = startDate.toLocaleTimeString("en-GB", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        });

        let eventDay = startDate.toLocaleDateString("en-GB", {
          weekday: "short",
        });
        const eventDate = startDate.toLocaleDateString("en-GB", {
          day: "2-digit",
        });
        const eventMonth = startDate.toLocaleDateString("en-GB", {
          month: "short",
        });
        const eventYear = startDate.toLocaleDateString("en-GB", {
          year: "numeric",
        });

        if (isToday(startDate)) {
          eventDay = "Today";
        }

        nameEl.textContent = eventsData.title;
        startsAtEl.textContent = startsAt;
        dayEl.textContent = eventDay;
        dateEl.textContent = eventDate;
        monthEl.textContent = eventMonth;
        yearEl.textContent = eventYear;
      })
      .catch((err) => {
        console.error("Error loading Mixlr events", err);
      });
  };

  const IQAMAH_API_URL = "https://getiqamahtimes-rds3nxm6za-ew.a.run.app";
  let navSalahActiveTab = "today";

  const getIrelandDateParts = (date) => {
    const parts = new Intl.DateTimeFormat("en-IE", {
      timeZone: "Europe/Dublin",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).formatToParts(date);
    return {
      day: Number(parts.find((p) => p.type === "day").value),
      monthName: parts.find((p) => p.type === "month").value,
      year: Number(parts.find((p) => p.type === "year").value),
    };
  };

  const getTodayInIreland = () => {
    const now = new Date();
    return Object.assign({ date: now }, getIrelandDateParts(now));
  };

  const getTomorrowInIreland = () => {
    const dublin = getDublinDate();
    dublin.setDate(dublin.getDate() + 1);
    return getIrelandDateParts(dublin);
  };

  const buildIqamahUrl = (dateParts) =>
    IQAMAH_API_URL +
    `?year=${dateParts.year}&month=${encodeURIComponent(dateParts.monthName)}&day=${dateParts.day}`;

  const PRAYER_SLOTS = [
    {
      id: "fajr",
      label: "Fajr",
      navKey: "fajr",
      beginsKey: "fajarTime",
      iqamahKey: "fajarJamahTime",
    },
    {
      id: "dhuhr",
      label: "Zohr",
      navKey: "zohr",
      beginsKey: "dhuharTime",
      iqamahKey: "zohrJamahTime",
    },
    {
      id: "asr",
      label: "Asar",
      navKey: "asar",
      beginsKey: "asrTime",
      iqamahKey: "asarJamahTime",
    },
    {
      id: "maghrib",
      label: "Magrib",
      navKey: "magrib",
      beginsKey: "maghribTime",
      iqamahKey: "maghribJamahTime",
    },
    {
      id: "isha",
      label: "Isha",
      navKey: "isha",
      beginsKey: "ishaTime",
      iqamahKey: "ishaJamahTime",
    },
  ];

  let cachedPrayerDayData = null;
  let cachedTomorrowPrayerDayData = null;
  let prayerHighlightTimer = null;

  const getDublinDate = () => {
    return new Date(
      new Date().toLocaleString("en-US", { timeZone: "Europe/Dublin" }),
    );
  };

  const parseTimeToDublinDate = (timeStr, dayOffset) => {
    if (!timeStr) return null;
    const base = getDublinDate();
    if (dayOffset) {
      base.setDate(base.getDate() + dayOffset);
    }
    const t = String(timeStr).trim().toLowerCase();
    const m = t.match(/^(\d{1,2}):(\d{2})(?:\s*(am|pm))?$/i);
    if (!m) return null;
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ampm = m[3] || null;
    if (ampm) {
      if (ampm === "pm" && hh !== 12) hh = hh + 12;
      if (ampm === "am" && hh === 12) hh = 0;
    }
    base.setHours(hh, mm, 0, 0);
    return base;
  };

  const formatCountdown = (targetDate) => {
    if (!targetDate) return "";
    const diffMs = targetDate.getTime() - getDublinDate().getTime();
    if (diffMs <= 0) return "now";
    const totalMinutes = Math.ceil(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return hours + "h " + minutes + "m";
    }
    return minutes + "m";
  };

  const getPrayerState = (d) => {
    const now = getDublinDate().getTime();
    const slots = PRAYER_SLOTS.map(function (slot) {
      return {
        id: slot.id,
        label: slot.label,
        navKey: slot.navKey,
        begins: parseTimeToDublinDate(d[slot.beginsKey]),
        iqamah: parseTimeToDublinDate(d[slot.iqamahKey]),
      };
    }).filter(function (slot) {
      return slot.begins;
    });

    if (slots.length === 0) return null;

    let current = null;
    slots.forEach(function (slot) {
      if (slot.begins.getTime() <= now) {
        current = slot;
      }
    });

    let next = null;
    let countdownTarget = null;
    let countdownKind = "begins";

    if (
      current &&
      current.iqamah &&
      current.begins.getTime() <= now &&
      current.iqamah.getTime() > now
    ) {
      countdownTarget = current.iqamah;
      countdownKind = "iqamah";
    }

    if (!current) {
      current = slots[slots.length - 1];
      next = slots[0];
      if (!countdownTarget) {
        countdownTarget = next.begins;
      }
    } else {
      const currentIndex = slots.findIndex(function (slot) {
        return slot.id === current.id;
      });
      if (currentIndex < slots.length - 1) {
        next = slots[currentIndex + 1];
        if (!countdownTarget) {
          countdownTarget = next.begins;
        }
      } else {
        next = slots[0];
        if (!countdownTarget) {
          countdownTarget = parseTimeToDublinDate(d.fajarTime, 1);
        }
      }
    }

    return {
      current: current,
      next: next,
      countdownTarget: countdownTarget,
      countdownKind: countdownKind,
    };
  };

  const clearPrayerHighlights = () => {
    document
      .querySelectorAll(".home-hero-prayer-card-wrap")
      .forEach(function (el) {
        el.classList.remove("is-current-prayer", "is-next-prayer");
      });
    document
      .querySelectorAll(".kicc-nav-prayer-row, .kicc-nav-salah-row")
      .forEach(function (el) {
        el.classList.remove("is-current-prayer", "is-next-prayer");
      });
  };

  const highlightPrayerSlot = (slot, className) => {
    if (!slot) return;
    var homeCard = document.querySelector(
      '.home-hero-prayer-card-wrap[data-prayer="' + slot.id + '"]',
    );
    if (homeCard) {
      homeCard.classList.add(className);
    }
    var navBegins = document.getElementById("nav-" + slot.navKey + "-begins");
    if (navBegins) {
      var navRow = navBegins.closest(".kicc-nav-salah-row, tr");
      if (navRow) {
        navRow.classList.add("kicc-nav-prayer-row", className);
      }
    }
  };

  const updatePrayerHighlightsUI = () => {
    if (!cachedPrayerDayData) return;

    var state = getPrayerState(cachedPrayerDayData);
    clearPrayerHighlights();

    if (!state) return;

    highlightPrayerSlot(state.current, "is-current-prayer");
    highlightPrayerSlot(state.next, "is-next-prayer");

    var statusEl = document.getElementById("home-prayer-status");
    var statusLine = document.getElementById("home-prayer-status-line");

    if (statusEl && statusLine) {
      var countdown = formatCountdown(state.countdownTarget);
      var countdownLabel =
        state.countdownKind === "iqamah"
          ? state.current.label + " iqamah"
          : state.next.label;

      statusLine.innerHTML =
        '<div class="home-prayer-status-chip home-prayer-status-chip-current">' +
        '<span class="home-prayer-status-chip-label">Current prayer</span>' +
        '<strong class="home-prayer-status-chip-value">' +
        state.current.label +
        "</strong></div>" +
        '<div class="home-prayer-status-chip home-prayer-status-chip-next">' +
        '<span class="home-prayer-status-chip-label">Next: ' +
        countdownLabel +
        "</span>" +
        '<strong class="home-prayer-status-chip-value home-prayer-countdown">' +
        countdown +
        "</strong></div>";

      statusEl.hidden = false;

      if (window.matchMedia("(max-width: 767.98px)").matches) {
        var activeCard = document.querySelector(
          ".home-hero-prayer-card-wrap.is-current-prayer, .home-hero-prayer-card-wrap.is-next-prayer",
        );
        if (activeCard) {
          activeCard.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }
    }

    updateNavSalahStatus();
  };

  const schedulePrayerHighlights = (d) => {
    cachedPrayerDayData = d;
    updatePrayerHighlightsUI();
    refreshJumuahDisplay();
    if (!prayerHighlightTimer) {
      prayerHighlightTimer = setInterval(function () {
        updatePrayerHighlightsUI();
        refreshJumuahDisplay();
      }, 30000);
    }
  };

  const applyToHomePage = (d) => {
    if (!isHomePage()) return;
    const lower = (s) => s.toLowerCase();
    const setPrayer = (beginsId, iqamahId, beginsVal, iqamahVal) => {
      const beginsEl = document.getElementById(beginsId);
      const iqamahEl = document.getElementById(iqamahId);
      if (beginsEl) beginsEl.innerHTML = lower(beginsVal);
      if (iqamahEl) iqamahEl.innerHTML = lower(iqamahVal);
    };

    setPrayer("fajr-begins", "fajr-iqamah", d.fajarTime, d.fajarJamahTime);
    setPrayer("dhuhr-begins", "dhuhr-iqamah", d.dhuharTime, d.zohrJamahTime);
    setPrayer("asr-begins", "asr-iqamah", d.asrTime, d.asarJamahTime);
    setPrayer("maghrib-begins", "maghrib-iqamah", d.maghribTime, d.maghribJamahTime);
    setPrayer("isha-begins", "isha-iqamah", d.ishaTime, d.ishaJamahTime);

    const sunriseEl = document.getElementById("sunrise");
    if (sunriseEl) sunriseEl.innerHTML = lower(d.sunriseTime);

    const hijriEl = document.getElementById("home-hero-hijri");
    if (hijriEl) {
      hijriEl.textContent =
        d.hijriDay + " " + d.hijriMonthName + " " + d.hijriYear + " AH";
    }
    const gregEl = document.getElementById("home-hero-gregorian");
    if (gregEl && d.gregorianDateString) {
      gregEl.textContent = d.gregorianDateString;
    }

    const curMonthEl = document.getElementById("cur-month");
    if (curMonthEl) {
      const today = new Date();
      const addedDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      if (isRamadan()) {
        curMonthEl.innerHTML = "Ramadan";
      } else {
        curMonthEl.innerHTML = addedDays.toLocaleString("default", {
          month: "long",
        });
      }
    }
  };

  const buildNavSalahRowHtml = (slot, options) => {
    options = options || {};
    const idPrefix = options.idPrefix || "nav-";
    const beginsId = idPrefix + slot.navKey + "-begins";
    const jamaatId = idPrefix + slot.navKey + "-jamaat";
    const sunriseId = options.sunriseId || "nav-sunrise";
    const rowClass =
      slot.id === "fajr" ? " kicc-nav-salah-row-fajr" : "";

    const timesHtml =
      '<div class="kicc-nav-salah-row-times">' +
      '<div class="kicc-nav-salah-time">' +
      '<span class="kicc-nav-salah-time-label">Adhan</span>' +
      '<span class="kicc-nav-salah-time-value" id="' +
      beginsId +
      '" data-field="begins">—</span>' +
      "</div>" +
      '<div class="kicc-nav-salah-time kicc-nav-salah-time-iqamah">' +
      '<span class="kicc-nav-salah-time-label">Iqamah</span>' +
      '<span class="kicc-nav-salah-time-value" id="' +
      jamaatId +
      '" data-field="iqamah">—</span>' +
      "</div></div>";

    const sunriseHtml =
      slot.id === "fajr"
        ? '<p class="kicc-nav-salah-sunrise-inline">' +
          '<span class="kicc-nav-salah-time-label">Sunrise</span>' +
          '<span class="kicc-nav-salah-time-value" id="' +
          sunriseId +
          '" data-field="sunrise">—</span></p>'
        : "";

    return (
      '<div class="kicc-nav-salah-row' +
      rowClass +
      '" data-prayer="' +
      slot.id +
      '" data-nav-key="' +
      slot.navKey +
      '">' +
      '<div class="kicc-nav-salah-row-name">' +
      '<span class="kicc-nav-salah-row-label">' +
      slot.label +
      "</span>" +
      '<span class="kicc-nav-salah-row-badge" aria-hidden="true"></span>' +
      "</div>" +
      '<div class="kicc-nav-salah-row-body">' +
      timesHtml +
      sunriseHtml +
      "</div></div>"
    );
  };

  const updateNavSalahTabIndicator = () => {
    const tabs = document.querySelector(".kicc-nav-salah-tabs");
    const activeTab = document.getElementById(
      navSalahActiveTab === "today"
        ? "nav-salah-tab-today"
        : "nav-salah-tab-tomorrow",
    );
    const indicator = document.querySelector(".kicc-nav-salah-tab-indicator");
    if (!tabs || !activeTab || !indicator) return;

    const tabsRect = tabs.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    indicator.style.width = tabRect.width + "px";
    indicator.style.transform =
      "translateX(" + (tabRect.left - tabsRect.left) + "px)";
  };

  const updateNavSalahHeaderForTab = () => {
    const hijriEl = document.getElementById("nav-hijri");
    const d =
      navSalahActiveTab === "tomorrow"
        ? cachedTomorrowPrayerDayData
        : cachedPrayerDayData;

    if (!d || !hijriEl) return;

    hijriEl.textContent =
      d.hijriDay + " " + d.hijriMonthName + " " + d.hijriYear;
  };

  const updateNavSalahDateLabel = () => {
    const label = document.getElementById("nav-salah-date-label");
    if (!label) return;

    if (navSalahActiveTab === "today") {
      const todayDate = document.getElementById("nav-salah-date-today");
      label.textContent = todayDate ? todayDate.textContent : "Today";
      return;
    }

    const tomorrowDate = document.getElementById("nav-salah-date-tomorrow");
    label.textContent = tomorrowDate ? tomorrowDate.textContent : "Tomorrow";
  };

  const updateNavSalahStatus = () => {
    const statusEl = document.getElementById("nav-salah-status");
    if (!statusEl || !cachedPrayerDayData || navSalahActiveTab !== "today") {
      if (statusEl) statusEl.hidden = true;
      return;
    }

    const state = getPrayerState(cachedPrayerDayData);
    if (!state) {
      statusEl.hidden = true;
      return;
    }

    const countdown = formatCountdown(state.countdownTarget);
    const countdownLabel =
      state.countdownKind === "iqamah"
        ? state.current.label + " iqamah"
        : state.next.label;

    statusEl.innerHTML =
      '<div class="kicc-nav-salah-status-chip kicc-nav-salah-status-chip-current">' +
      '<span class="kicc-nav-salah-status-label">Now</span>' +
      '<strong>' +
      state.current.label +
      "</strong></div>" +
      '<div class="kicc-nav-salah-status-chip kicc-nav-salah-status-chip-next">' +
      '<span class="kicc-nav-salah-status-label">Next · ' +
      countdownLabel +
      "</span>" +
      '<strong class="kicc-nav-salah-countdown">' +
      countdown +
      "</strong></div>";
    statusEl.hidden = false;
  };

  const setNavSalahTab = (tab) => {
    if (tab !== "today" && tab !== "tomorrow") return;
    navSalahActiveTab = tab;

    const todayTab = document.getElementById("nav-salah-tab-today");
    const tomorrowTab = document.getElementById("nav-salah-tab-tomorrow");
    const todayPanel = document.getElementById("nav-salah-panel-today");
    const tomorrowPanel = document.getElementById("nav-salah-panel-tomorrow");
    const menu = document.querySelector(".kicc-nav-salah-menu");

    if (todayTab) {
      todayTab.classList.toggle("is-active", tab === "today");
      todayTab.setAttribute("aria-selected", tab === "today" ? "true" : "false");
    }
    if (tomorrowTab) {
      tomorrowTab.classList.toggle("is-active", tab === "tomorrow");
      tomorrowTab.setAttribute(
        "aria-selected",
        tab === "tomorrow" ? "true" : "false",
      );
    }

    if (todayPanel) {
      todayPanel.classList.toggle("is-active", tab === "today");
      todayPanel.hidden = tab !== "today";
    }
    if (tomorrowPanel) {
      tomorrowPanel.classList.toggle("is-active", tab === "tomorrow");
      tomorrowPanel.hidden = tab !== "tomorrow";
      if (tab === "tomorrow") {
        tomorrowPanel.classList.remove("is-entering");
        requestAnimationFrame(function () {
          tomorrowPanel.classList.add("is-entering");
        });
      }
    }

    if (menu) {
      menu.classList.toggle("kicc-nav-salah-menu--tomorrow", tab === "tomorrow");
    }

    updateNavSalahDateLabel();
    updateNavSalahHeaderForTab();
    updateNavSalahStatus();
    updateNavSalahTabIndicator();
  };

  const onNavSalahTabClick = (event, tab) => {
    event.preventDefault();
    event.stopPropagation();
    setNavSalahTab(tab);
  };

  const initNavSalahPanel = () => {
    const menu = document.querySelector(".kicc-nav-salah-menu");
    if (!menu || menu.dataset.salahEnhanced) return;

    const timetableLink = menu.querySelector("#salah-times, .btn-kicc-salah");
    const timetableHref = timetableLink ? timetableLink.getAttribute("href") : "#";
    const monthLabelEl = menu.querySelector("#nav-cur-month");
    const monthLabel = monthLabelEl
      ? monthLabelEl.textContent.trim()
      : "Month";

    const todayRows = PRAYER_SLOTS.map(function (slot) {
      return buildNavSalahRowHtml(slot, { sunriseId: "nav-sunrise" });
    }).join("");
    const tomorrowRows = PRAYER_SLOTS.map(function (slot) {
      return buildNavSalahRowHtml(slot, {
        idPrefix: "nav-tomorrow-",
        sunriseId: "nav-tomorrow-sunrise",
      });
    }).join("");

    menu.dataset.salahEnhanced = "true";
    menu.classList.add("kicc-nav-salah-menu--enhanced");
    menu.innerHTML =
      '<div class="kicc-nav-salah-panel">' +
      '<header class="kicc-nav-salah-header">' +
      '<p class="kicc-nav-salah-date" id="nav-salah-date-label">Today</p>' +
      '<p class="kicc-nav-salah-hijri" id="nav-hijri">—</p>' +
      '<span id="nav-salah-date-today" class="sr-only">Today</span>' +
      '<span id="nav-salah-date-tomorrow" class="sr-only">Tomorrow</span>' +
      '<span id="nav-hijri-tomorrow" class="sr-only"></span>' +
      "</header>" +
      '<div class="kicc-nav-salah-tabs" role="tablist" aria-label="Salah day">' +
      '<button type="button" class="kicc-nav-salah-tab is-active" id="nav-salah-tab-today" role="tab" aria-selected="true" aria-controls="nav-salah-panel-today">Today</button>' +
      '<button type="button" class="kicc-nav-salah-tab" id="nav-salah-tab-tomorrow" role="tab" aria-selected="false" aria-controls="nav-salah-panel-tomorrow">Tomorrow</button>' +
      '<a class="kicc-nav-salah-tab kicc-nav-salah-tab-month" id="salah-times" href="' +
      timetableHref +
      '" target="_blank" rel="noopener noreferrer" title="Download monthly timetable PDF">' +
      '<i class="far fa-calendar-alt" aria-hidden="true"></i>' +
      '<span id="nav-cur-month">' +
      monthLabel +
      "</span></a>" +
      '<span class="kicc-nav-salah-tab-indicator" aria-hidden="true"></span>' +
      "</div>" +
      '<div class="kicc-nav-salah-status" id="nav-salah-status" hidden></div>' +
      '<div class="kicc-nav-salah-panels">' +
      '<div class="kicc-nav-salah-day-panel is-active" id="nav-salah-panel-today" role="tabpanel" aria-labelledby="nav-salah-tab-today">' +
      todayRows +
      "</div>" +
      '<div class="kicc-nav-salah-day-panel" id="nav-salah-panel-tomorrow" role="tabpanel" aria-labelledby="nav-salah-tab-tomorrow" hidden>' +
      tomorrowRows +
      "</div></div></div>";

    menu.addEventListener("click", function (event) {
      if (event.target.closest(".kicc-nav-salah-tab-month")) {
        return;
      }
      if (event.target.closest(".kicc-nav-salah-panel")) {
        event.stopPropagation();
      }
    });

    document
      .getElementById("nav-salah-tab-today")
      ?.addEventListener("click", function (event) {
        onNavSalahTabClick(event, "today");
      });
    document
      .getElementById("nav-salah-tab-tomorrow")
      ?.addEventListener("click", function (event) {
        onNavSalahTabClick(event, "tomorrow");
      });

    const dropdown = menu.closest(".kicc-nav-salah-dropdown");
    if (dropdown && typeof $ !== "undefined") {
      $(dropdown).on("hide.bs.dropdown", function (event) {
        const clickTarget = event.clickEvent && event.clickEvent.target;
        if (
          clickTarget &&
          clickTarget.closest &&
          clickTarget.closest(".kicc-nav-salah-tab-month")
        ) {
          return;
        }
        if (
          clickTarget &&
          clickTarget.closest &&
          clickTarget.closest(".kicc-nav-salah-panel")
        ) {
          event.preventDefault();
        }
      });

      $(dropdown).on("shown.bs.dropdown", function () {
        menu.classList.add("is-open");
        updateNavSalahTabIndicator();
        updateNavSalahStatus();
      });
      $(dropdown).on("hidden.bs.dropdown", function () {
        menu.classList.remove("is-open");
        setNavSalahTab("today");
      });
    }

    window.addEventListener("resize", updateNavSalahTabIndicator, {
      passive: true,
    });
    updateNavSalahTabIndicator();
  };

  const applyNavSalahDay = (panelId, d, dayKey) => {
    const panel = document.getElementById(panelId);
    if (!panel || !d) return;

    const lower = (s) => (s ? String(s).toLowerCase() : "—");

    PRAYER_SLOTS.forEach(function (slot) {
      const row = panel.querySelector(
        '.kicc-nav-salah-row[data-prayer="' + slot.id + '"]',
      );
      if (!row) return;
      const beginsEl = row.querySelector('[data-field="begins"]');
      const iqamahEl = row.querySelector('[data-field="iqamah"]');
      const beginsVal = lower(d[slot.beginsKey]);
      const iqamahVal = lower(d[slot.iqamahKey]);
      if (beginsEl) beginsEl.textContent = beginsVal;
      if (iqamahEl) iqamahEl.textContent = iqamahVal;

      if (dayKey === "today") {
        setElHtml("nav-" + slot.navKey + "-begins", beginsVal);
        setElHtml("nav-" + slot.navKey + "-jamaat", iqamahVal);
      }
    });

    const sunriseVal = lower(d.sunriseTime);
    const sunriseInPanel = panel.querySelector('[data-field="sunrise"]');
    if (sunriseInPanel) sunriseInPanel.textContent = sunriseVal;
    if (dayKey === "today") {
      setElHtml("nav-sunrise", sunriseVal);
    }

    const hijriText =
      d.hijriDay + " " + d.hijriMonthName + " " + d.hijriYear;
    if (dayKey === "today") {
      setElHtml("nav-hijri", hijriText);
      const todayDateEl = document.getElementById("nav-salah-date-today");
      if (todayDateEl) {
        todayDateEl.textContent = d.gregorianDateString || "Today";
      }
    } else {
      const hijriTomorrow = document.getElementById("nav-hijri-tomorrow");
      if (hijriTomorrow) hijriTomorrow.textContent = hijriText;
      const tomorrowDateEl = document.getElementById("nav-salah-date-tomorrow");
      if (tomorrowDateEl) {
        tomorrowDateEl.textContent = d.gregorianDateString || "Tomorrow";
      }
    }

    if (dayKey === "today") {
      panel.classList.remove("is-loaded");
      requestAnimationFrame(function () {
        panel.classList.add("is-loaded");
      });
    } else {
      panel.classList.add("is-loaded");
    }
  };

  const applyToNav = (d) => {
    const today = new Date();
    const addedDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const monthName = isRamadan()
      ? "Ramadan"
      : addedDays.toLocaleString("default", { month: "long" });
    setElHtml("nav-cur-month", monthName);
    setElHtml("footer-cur-month", monthName);
    applyNavSalahDay("nav-salah-panel-today", d, "today");
    updateNavSalahDateLabel();
  };

  const applyTomorrowToNav = (d) => {
    cachedTomorrowPrayerDayData = d;
    applyNavSalahDay("nav-salah-panel-tomorrow", d, "tomorrow");
    updateNavSalahDateLabel();
    if (navSalahActiveTab === "tomorrow") {
      updateNavSalahHeaderForTab();
    }
  };

  const fetchIqamahForDate = (dateParts, storageKey) => {
    const cached = kiccStorageGet(localStorage, storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (
          parsed &&
          parsed.year === dateParts.year &&
          parsed.month === dateParts.monthName &&
          parsed.day === dateParts.day &&
          parsed.data &&
          parsed.data[0]
        ) {
          return Promise.resolve(parsed.data[0]);
        }
      } catch (e) {
        console.warn("Failed to parse cached iqamah", storageKey, e);
      }
    }

    return fetch(buildIqamahUrl(dateParts))
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.json();
      })
      .then(function (json) {
        if (!json || !json.data || !json.data[0]) {
          throw new Error("No iqamah data");
        }
        try {
          kiccStorageSet(localStorage, storageKey, JSON.stringify(json));
        } catch (e) {
          console.warn("Unable to cache iqamah", storageKey, e);
        }
        return json.data[0];
      });
  };

  const setDynamicCelebrationToBanner = (date) => {
    if (!isHomePage()) return;

    const titleElement = document.getElementById("dynamic-celeb-title");
    const messageElement = document.getElementById("dynamic-celeb-message");
    const dynamicTimeOneLabel = document.getElementById("dynamic-time-one-label");
    const dynamicTimeTwoLabel = document.getElementById("dynamic-time-two-label");
    const dynamicTimeOne = document.getElementById("dynamic-time-one");
    const dynamicTimeTwo = document.getElementById("dynamic-time-two");
    const dynamicTimeOneCircle = document.getElementById("dynamic-time-one-circle");
    const dynamicTimeTwoCircle = document.getElementById("dynamic-time-two-circle");

    if (!titleElement || !messageElement) return;

    const hideCelebrationSlot = (el) => {
      if (el) el.style.display = "none";
    };
    const showCelebrationSlot = (el) => {
      if (el) el.style.display = "";
    };

    hideCelebrationSlot(titleElement);
    hideCelebrationSlot(messageElement);
    hideCelebrationSlot(dynamicTimeOneLabel);
    hideCelebrationSlot(dynamicTimeTwoLabel);
    hideCelebrationSlot(dynamicTimeOne);
    hideCelebrationSlot(dynamicTimeTwo);
    hideCelebrationSlot(dynamicTimeOneCircle);
    hideCelebrationSlot(dynamicTimeTwoCircle);

    if (isRamadan()) {
      if (dynamicTimeOneLabel) dynamicTimeOneLabel.innerHTML = "Suhoor ends";
      if (dynamicTimeTwoLabel) dynamicTimeTwoLabel.innerHTML = "Iftaar";
      if (date.fajarTime && dynamicTimeOne) {
        const fajrDate = parseTimeToDate(date.fajarTime) || null;
        let suhoorStr = "—";
        if (fajrDate) {
          const suhoorDate = new Date(fajrDate.getTime() - 10 * 60 * 1000);
          const hh = String(suhoorDate.getHours()).padStart(2, "0");
          const mm = String(suhoorDate.getMinutes()).padStart(2, "0");
          suhoorStr = `${hh}:${mm}`;
        }
        const parts = splitTimeAndPeriod(suhoorStr);
        dynamicTimeOne.innerHTML = `${parts.time} <small>${parts.period}</small>`;
      }
      if (date.maghribTime && dynamicTimeTwo) {
        const partsM = splitTimeAndPeriod(date.maghribTime);
        dynamicTimeTwo.innerHTML = `${partsM.time} <small>${partsM.period}</small>`;
      }
      titleElement.innerHTML = "Ramadan Mubarak";
      messageElement.innerHTML = "";
      showCelebrationSlot(titleElement);
      showCelebrationSlot(dynamicTimeOneLabel);
      showCelebrationSlot(dynamicTimeTwoLabel);
      showCelebrationSlot(dynamicTimeOne);
      showCelebrationSlot(dynamicTimeTwo);
      showCelebrationSlot(dynamicTimeOneCircle);
      showCelebrationSlot(dynamicTimeTwoCircle);
    } else if (isEid()) {
      if (dynamicTimeOneLabel) dynamicTimeOneLabel.innerHTML = "Speech";
      if (dynamicTimeTwoLabel) dynamicTimeTwoLabel.innerHTML = "Salah";
      if (dynamicTimeOne) {
        const partsSpeech = splitTimeAndPeriod("7:30 AM");
        dynamicTimeOne.innerHTML = `${partsSpeech.time} <small>${partsSpeech.period}</small>`;
      }
      if (dynamicTimeTwo) {
        const partsSalah = splitTimeAndPeriod("8:00 AM");
        dynamicTimeTwo.innerHTML = `${partsSalah.time} <small>${partsSalah.period}</small>`;
      }
      titleElement.innerHTML = "Eid Mubarak";
      messageElement.innerHTML =
        "Taqabbal Allahu minna wa minkum (May Allah accept from us and from you) and bless you and your family with happiness and prosperity";
      showCelebrationSlot(titleElement);
      showCelebrationSlot(messageElement);
      showCelebrationSlot(dynamicTimeOneLabel);
      showCelebrationSlot(dynamicTimeTwoLabel);
      showCelebrationSlot(dynamicTimeOne);
      showCelebrationSlot(dynamicTimeTwo);
      showCelebrationSlot(dynamicTimeOneCircle);
      showCelebrationSlot(dynamicTimeTwoCircle);
    } else {
      titleElement.innerHTML = "السلام عليكم";
      messageElement.innerHTML =
        "Peace be upon you — welcome to Kerry Islamic Cultural Centre, Tralee.";
      showCelebrationSlot(titleElement);
      showCelebrationSlot(messageElement);
    }
  };

  const setSalahTimes = () => {
    const todayParts = getTodayInIreland();
    const tomorrowParts = getTomorrowInIreland();

    fetchIqamahForDate(todayParts, "iqamah-today")
      .then(function (d) {
        applyToHomePage(d);
        applyToNav(d);
        schedulePrayerHighlights(d);
        setDynamicCelebrationToBanner(d);
      })
      .catch(function (err) {
        console.error("Failed to load today's iqamah times", err);
      });

    fetchIqamahForDate(tomorrowParts, "iqamah-tomorrow")
      .then(function (d) {
        applyTomorrowToNav(d);
      })
      .catch(function (err) {
        console.warn("Failed to load tomorrow's iqamah times", err);
      });
  };

  const COOKIE_REGISTRY = [
    {
      category: "necessary",
      type: "Cookie",
      name: "kicc-cookie-consent",
      duration: "10 days",
      purpose: "Stores your privacy choices (always required).",
    },
    {
      category: "functional",
      type: "Cookie",
      name: "kicc-modal-tmw",
      duration: "1 day",
      purpose: "Hides the community registration reminder until tomorrow.",
    },
    {
      category: "functional",
      type: "Cookie",
      name: "kicc-modal-registered",
      duration: "10 days",
      purpose: "Remembers that you have already registered for programmes.",
    },
    {
      category: "functional",
      type: "localStorage",
      name: "salahTimesAssetUrl",
      duration: "Until cleared",
      purpose: "Caches the link to the monthly prayer timetable.",
    },
    {
      category: "functional",
      type: "localStorage",
      name: "iqamah-today / iqamah-tomorrow",
      duration: "Until cleared",
      purpose: "Caches today\u2019s and tomorrow\u2019s iqamah times.",
    },
    {
      category: "functional",
      type: "localStorage",
      name: "kicc-announcements",
      duration: "Until cleared",
      purpose: "Caches homepage announcements.",
    },
    {
      category: "functional",
      type: "localStorage",
      name: "notices",
      duration: "Until cleared",
      purpose: "Caches the notice board.",
    },
    {
      category: "functional",
      type: "localStorage",
      name: "kicc-random-hadith",
      duration: "Until cleared",
      purpose: "Caches the daily hadith.",
    },
    {
      category: "functional",
      type: "localStorage",
      name: "masjidProgrammes_programme_active_true_v1",
      duration: "Until cleared",
      purpose: "Caches weekly programme listings.",
    },
    {
      category: "functional",
      type: "localStorage",
      name: "kicc-campaign-progress",
      duration: "Until cleared",
      purpose: "Caches New Masjid fundraiser totals.",
    },
    {
      category: "functional",
      type: "localStorage",
      name: "kicc-breaking-dismiss-*",
      duration: "Until cleared",
      purpose: "Remembers dismissed urgent announcements.",
    },
    {
      category: "functional",
      type: "sessionStorage",
      name: "kicc-notices-spotlight-dismissed",
      duration: "Browser session",
      purpose: "Hides the notice spotlight for this visit.",
    },
    {
      category: "analytics",
      type: "Cookie",
      name: "_ga, _gid, _gat",
      duration: "Up to 2 years",
      purpose: "Google Analytics \u2014 anonymous usage statistics.",
    },
    {
      category: "thirdParty",
      type: "Third-party",
      name: "Mixlr embed",
      duration: "Varies",
      purpose: "Live audio stream player (Mixlr may set its own cookies).",
    },
    {
      category: "thirdParty",
      type: "Third-party",
      name: "Google Maps embed",
      duration: "Varies",
      purpose: "Interactive map on the Contact page (Google may set its own cookies).",
    },
  ];
  const CONSENT_CATEGORIES = [
    {
      id: "necessary",
      label: "Strictly necessary",
      locked: true,
      description:
        "Required to remember your privacy choices. This cannot be turned off.",
    },
    {
      id: "functional",
      label: "Functional & storage",
      locked: false,
      description:
        "Preference cookies and browser storage that cache prayer times, notices, programmes, and similar masjid content.",
    },
    {
      id: "analytics",
      label: "Analytics",
      locked: false,
      description:
        "Google Analytics helps us understand how visitors use the site so we can improve it.",
    },
    {
      id: "thirdParty",
      label: "Third-party embeds",
      locked: false,
      description:
        "Embedded Mixlr live stream and Google Maps on the Contact page. These services may set their own cookies.",
    },
  ];
  const ANNOUNCEMENTS_API_URL =
    "https://getannouncements-rds3nxm6za-ew.a.run.app";
  let postCookieConsentDone = false;
  let pendingBreakingAnnouncement = null;
  let siteAnnouncementsBound = false;
  let lastShownBreakingIdentity = "";
  let cookieRegistryRendered = false;

  const hasCookieConsent = () => hasConsentChoice();

  const saveConsentPrefs = (prefs) => {
    const previous = getConsentPrefs();
    const next = {
      necessary: true,
      functional: !!prefs.functional,
      analytics: !!prefs.analytics,
      thirdParty: !!prefs.thirdParty,
    };

    if (previous.functional && !next.functional) clearFunctionalData();
    if (previous.analytics && !next.analytics) clearAnalyticsData();
    if (previous.thirdParty && !next.thirdParty) removeConsentEmbeds();

    Cookies.set(COOKIE_CONSENT_KEY, JSON.stringify({
      functional: next.functional,
      analytics: next.analytics,
      thirdParty: next.thirdParty,
    }), { expires: 10 });

    applyConsentSideEffects(next);
    syncConsentToggles(next);
    updateCookiePrefsStatus();
  };

  const readConsentToggles = (prefix) => {
    const prefs = Object.assign({}, CONSENT_DEFAULTS);
    CONSENT_CATEGORIES.forEach(function (cat) {
      if (cat.locked) return;
      const input = document.getElementById(prefix + "-toggle-" + cat.id);
      if (input) prefs[cat.id] = !!input.checked;
    });
    return prefs;
  };

  const syncConsentToggles = (prefs) => {
    ["cookie-banner", "cookie-prefs"].forEach(function (prefix) {
      CONSENT_CATEGORIES.forEach(function (cat) {
        const input = document.getElementById(prefix + "-toggle-" + cat.id);
        if (!input || cat.locked) return;
        input.checked = !!prefs[cat.id];
      });
    });
  };

  const expireCookie = (name) => {
    const hostname = window.location.hostname;
    const domains = [hostname, "." + hostname.replace(/^www\./, "")];
    const paths = ["/", ""];
    domains.forEach(function (domain) {
      paths.forEach(function (path) {
        document.cookie =
          name +
          "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=" +
          (path || "/") +
          "; domain=" +
          domain +
          "; SameSite=Lax";
      });
    });
    if (typeof Cookies !== "undefined") Cookies.remove(name);
  };

  const clearBreakingDismissKeys = () => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const key = localStorage.key(i);
        if (key && key.indexOf(BREAKING_DISMISS_PREFIX) === 0) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // ignore storage errors
    }
  };

  const clearFunctionalData = () => {
    FUNCTIONAL_COOKIE_NAMES.forEach(function (name) {
      expireCookie(name);
    });
    FUNCTIONAL_STORAGE_KEYS.forEach(function (key) {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    });
    FUNCTIONAL_SESSION_KEYS.forEach(function (key) {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // ignore
      }
    });
    clearBreakingDismissKeys();
  };

  const clearAnalyticsData = () => {
    const names = [];
    document.cookie.split(";").forEach(function (part) {
      const name = part.split("=")[0].trim();
      if (/^(_ga|_gid|_gat|_ga_)/.test(name)) names.push(name);
    });
    names.forEach(expireCookie);
    window.__kiccGaLoaded = false;
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }
  };

  const loadGoogleAnalytics = () => {
    if (!hasConsentChoice() || !canUseAnalytics() || window.__kiccGaLoaded) return;
    if (typeof window.gtag !== "function") return;

    window.__kiccGaLoaded = true;
    window.gtag("consent", "update", {
      analytics_storage: "granted",
    });

    if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
      const script = document.createElement("script");
      script.async = true;
      script.src =
        "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
      document.head.appendChild(script);
    }

    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID);
  };

  const injectConsentEmbed = (container) => {
    if (!canUseThirdPartyEmbeds()) return;
    if (!container || container.dataset.embedLoaded === "true") return;
    const src = container.getAttribute("data-embed-src");
    if (!src) return;

    const title = container.getAttribute("data-embed-title") || "";
    const height = container.getAttribute("data-embed-height") || "150";
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = title;
    iframe.width = "100%";
    iframe.height = height;
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("frameborder", "0");
    iframe.loading = "lazy";

    if (container.classList.contains("consent-embed-map")) {
      iframe.className = "contact-map-iframe";
      iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
      iframe.setAttribute("allowfullscreen", "");
    }

    const placeholder = container.querySelector(".consent-embed-placeholder");
    if (placeholder) placeholder.hidden = true;
    container.appendChild(iframe);
    container.dataset.embedLoaded = "true";
  };

  const showEmbedPlaceholder = (container) => {
    if (container.dataset.embedLoaded === "true") return;
    const placeholder = container.querySelector(".consent-embed-placeholder");
    if (placeholder) placeholder.hidden = false;
  };

  const removeConsentEmbeds = () => {
    document.querySelectorAll("[data-consent-embed]").forEach(function (container) {
      const iframe = container.querySelector("iframe");
      if (iframe) iframe.remove();
      container.dataset.embedLoaded = "false";
      showEmbedPlaceholder(container);
    });
  };

  const loadConsentEmbeds = () => {
    if (!canUseThirdPartyEmbeds()) return;
    document.querySelectorAll("[data-consent-embed]").forEach(injectConsentEmbed);
  };

  const initConsentEmbeds = () => {
    document.querySelectorAll("[data-consent-embed]").forEach(function (container) {
      if (container.dataset.embedBound === "true") return;
      container.dataset.embedBound = "true";

      if (canUseThirdPartyEmbeds()) {
        injectConsentEmbed(container);
        return;
      }

      showEmbedPlaceholder(container);
    });
  };

  const applyConsentSideEffects = (prefs) => {
    if (!hasConsentChoice()) {
      clearAnalyticsData();
      removeConsentEmbeds();
      return;
    }
    const state = prefs || getConsentPrefs();
    if (state.analytics) loadGoogleAnalytics();
    else clearAnalyticsData();
    if (state.thirdParty) loadConsentEmbeds();
    else removeConsentEmbeds();
  };

  const renderCookieRegistry = () => {
    const el = document.getElementById("cookie-prefs-registry");
    if (!el || cookieRegistryRendered) return;
    cookieRegistryRendered = true;

    const headings = {
      necessary: "Strictly necessary (always on)",
      functional: "Functional & storage",
      analytics: "Analytics",
      thirdParty: "Third-party embeds",
    };

    const buildTable = (heading, items) => {
      if (!items.length) return "";
      const rows = items
        .map(function (item) {
          return (
            "<tr><th scope=\"row\">" +
            item.name +
            "</th><td>" +
            item.type +
            "</td><td>" +
            item.duration +
            "</td><td>" +
            item.purpose +
            "</td></tr>"
          );
        })
        .join("");
      return (
        "<h3 class=\"cookie-preferences-subheading\">" +
        heading +
        "</h3>" +
        "<div class=\"cookie-preferences-table-wrap\">" +
        "<table class=\"cookie-preferences-table\">" +
        "<thead><tr><th scope=\"col\">Name</th><th scope=\"col\">Type</th>" +
        "<th scope=\"col\">Duration</th><th scope=\"col\">Purpose</th></tr></thead>" +
        "<tbody>" +
        rows +
        "</tbody></table></div>"
      );
    };

    el.innerHTML = Object.keys(headings)
      .map(function (category) {
        const items = COOKIE_REGISTRY.filter(function (item) {
          return item.category === category;
        });
        return buildTable(headings[category], items);
      })
      .join("");
  };

  const describeConsentPrefs = (prefs) => {
    const enabled = [];
    if (prefs.functional) enabled.push("functional & storage");
    if (prefs.analytics) enabled.push("analytics");
    if (prefs.thirdParty) enabled.push("third-party embeds");
    if (!enabled.length) return "Your current choice: strictly necessary only";
    return "Your current choice: " + enabled.join(", ");
  };

  const updateCookiePrefsStatus = () => {
    const el = document.getElementById("cookie-prefs-status");
    if (!el) return;
    if (!hasConsentChoice()) {
      el.textContent = "You have not chosen yet.";
      return;
    }
    el.textContent = describeConsentPrefs(getConsentPrefs());
  };

  const hideCookiePreferences = (animate) => {
    if (!hasConsentChoice()) return;

    const el = document.getElementById("cookie-preferences");
    if (!el) return;

    const finish = () => {
      el.classList.remove("is-visible", "is-leaving");
      el.setAttribute("aria-hidden", "true");
      document.body.classList.remove("cookie-preferences-active");
    };

    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    el.classList.add("is-leaving");
    el.classList.remove("is-visible");
    window.setTimeout(finish, 420);
  };

  const showCookiePreferences = () => {
    if (!hasConsentChoice()) {
      showCookieConsent();
      return;
    }

    const el = document.getElementById("cookie-preferences");
    if (!el) return;

    renderCookieRegistry();
    syncConsentToggles(getConsentPrefs());
    updateCookiePrefsStatus();
    el.setAttribute("aria-hidden", "false");
    document.body.classList.add("cookie-preferences-active");

    requestAnimationFrame(function () {
      el.classList.add("is-visible");
    });
  };

  const runPostCookieConsent = () => {
    if (!hasCookieConsent() || postCookieConsentDone) return;
    postCookieConsentDone = true;
    setCookieConsentBlocking(false);
    if (isHomePage()) {
      const modalScheduled = showSignUpModal();
      if (!modalScheduled) {
        tryShowBreakingAlert();
      }
      return;
    }
    tryShowBreakingAlert();
  };

  const hideCookieConsent = (animate) => {
    const el = document.getElementById("cookie-consent");
    if (!el) return;

    const finish = () => {
      el.classList.remove("is-visible", "is-leaving");
      el.setAttribute("aria-hidden", "true");
    };

    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    el.classList.add("is-leaving");
    el.classList.remove("is-visible");
    window.setTimeout(finish, 420);
  };

  const setCookieConsentBlocking = (active) => {
    if (active) {
      document.documentElement.classList.add("cookie-consent-pending");
      document.body.classList.add("cookie-consent-active");
      Array.from(document.body.children).forEach(function (node) {
        if (node.id !== "cookie-consent") node.setAttribute("inert", "");
      });
      return;
    }
    document.documentElement.classList.remove("cookie-consent-pending");
    document.body.classList.remove("cookie-consent-active");
    Array.from(document.body.children).forEach(function (node) {
      if (node.id !== "cookie-consent") node.removeAttribute("inert");
    });
  };

  const activateCookieConsentGate = () => {
    const el = document.getElementById("cookie-consent");
    if (!el) return;

    clearAnalyticsData();
    syncConsentToggles(CONSENT_DEFAULTS);
    setCookieConsentBlocking(true);
    el.setAttribute("aria-hidden", "false");
    el.classList.add("is-visible");
  };

  const showCookieConsent = () => {
    activateCookieConsentGate();
  };

  const finalizeConsentChoice = (prefs) => {
    saveConsentPrefs(prefs);
    hideCookieConsent(true);
    hideCookiePreferences(true);
    runPostCookieConsent();
  };

  const acceptAllConsent = () => finalizeConsentChoice(CONSENT_ALL_ON);

  const acceptNecessaryOnlyConsent = () =>
    finalizeConsentChoice(Object.assign({}, CONSENT_DEFAULTS));

  const saveBannerConsent = () =>
    finalizeConsentChoice(readConsentToggles("cookie-banner"));

  const savePreferencesConsent = () =>
    finalizeConsentChoice(readConsentToggles("cookie-prefs"));

  const clearOptionalStoredData = () => {
    clearFunctionalData();
    clearAnalyticsData();
    removeConsentEmbeds();
    saveConsentPrefs(Object.assign({}, CONSENT_DEFAULTS));
  };

  const initSignUpModal = () => {
    const modal = document.getElementById("myModal");
    if (!modal || modal.dataset.bound) return;
    modal.dataset.bound = "true";

    if (typeof $ !== "undefined") {
      $(modal).on("shown.bs.modal", function () {
        modal.classList.add("is-content-visible");
      });
      $(modal).on("hidden.bs.modal", function () {
        modal.classList.remove("is-content-visible");
        tryShowBreakingAlert();
      });
    }

    $("#sub-btn-tomorrow").on("click", function () {
      setFunctionalCookie("kicc-modal-tmw", true, { expires: 1 });
      $("#myModal").modal("hide");
    });
    $("#sub-btn-registered").on("click", function () {
      setFunctionalCookie("kicc-modal-registered", true, { expires: 10 });
      $("#myModal").modal("hide");
    });

    const newsTab = document.getElementById("nav-news-tab");
    if (newsTab) {
      newsTab.addEventListener("click", function () {
        if (!hasCookieConsent()) return;
        $("#myModal").modal("show");
      });
    }
  };

  const showSignUpModal = () => {
    if (!hasCookieConsent()) return false;
    setSignUpCookies();
    initSignUpModal();

    if (!Cookies.get("kicc-modal-tmw")) {
      setTimeout(function () {
        $("#myModal").modal("show");
        setTimeout(function () {
          $("#myModal").modal("hide");
        }, 30000);
      }, 2500);
      return true;
    }
    return false;
  };

  const bindCookieButton = (id, handler) => {
    const btn = document.getElementById(id);
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = "true";
    btn.addEventListener("click", handler);
  };

  const initCookiePreferences = () => {
    bindCookieButton("cookie-accept", acceptAllConsent);
    bindCookieButton("cookie-necessary", acceptNecessaryOnlyConsent);
    bindCookieButton("cookie-save", saveBannerConsent);
    bindCookieButton("cookie-prefs-accept", acceptAllConsent);
    bindCookieButton("cookie-prefs-necessary", acceptNecessaryOnlyConsent);
    bindCookieButton("cookie-prefs-save", savePreferencesConsent);
    bindCookieButton("cookie-prefs-clear", clearOptionalStoredData);

    const openLink = document.getElementById("cookie-prefs-open");
    if (openLink && !openLink.dataset.bound) {
      openLink.dataset.bound = "true";
      openLink.addEventListener("click", function (e) {
        e.preventDefault();
        showCookiePreferences();
      });
    }

    document.querySelectorAll("[data-cookie-prefs-dismiss]").forEach((el) => {
      if (el.dataset.bound) return;
      el.dataset.bound = "true";
      el.addEventListener("click", function () {
        if (!hasConsentChoice()) return;
        hideCookiePreferences(true);
      });
    });

    document.querySelectorAll(".cookie-prefs-inline-open").forEach(function (link) {
      if (link.dataset.bound) return;
      link.dataset.bound = "true";
      link.addEventListener("click", function (e) {
        e.preventDefault();
        showCookiePreferences();
      });
    });

    if (!document.documentElement.dataset.cookiePrefsEscapeBound) {
      document.documentElement.dataset.cookiePrefsEscapeBound = "true";
      document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        if (!hasConsentChoice()) return;
        hideCookiePreferences(true);
      });
    }
  };

  const showCookiePolicy = () => {
    initCookiePreferences();

    if (typeof $ !== "undefined") {
      $(document).on("show.bs.modal", function (e) {
        if (!hasCookieConsent()) {
          e.preventDefault();
        }
      });
    }

    if (hasCookieConsent()) {
      hideCookieConsent(false);
      setCookieConsentBlocking(false);
      syncConsentToggles(getConsentPrefs());
      applyConsentSideEffects(getConsentPrefs());
      runPostCookieConsent();
    } else {
      activateCookieConsentGate();
    }
  };

  const setSignUpCookies = () => {
    if (Cookies.get("kicc-modal-registered")) {
      setFunctionalCookie("kicc-modal-tmw", true, { expires: 1 });
    }
  };

  const getRandomHadith = () => {
    const HADITH_KEY = "kicc-random-hadith";
    const HADITH_TITLES = {
      bukhari: "Sahih al-Bukhari",
      muslim: "Sahih Muslim",
      nasai: "Sunan an-Nasa'i",
      abudawud: "Sunan Abi Dawud",
      tirmidhi: "Jami` at-Tirmidhi",
      ibnmajah: "Sunan Ibn Majah",
      riyadussalihin: "Riyad as-Salihin",
    };
    const getHadithTitle = (key) => HADITH_TITLES[key] || key;

    const bodyEl = document.getElementById("hadith-body");
    const citeEl = document.getElementById("hadith-cite");
    const linkEl = document.getElementById("hadith-link");
    if (!bodyEl || !citeEl || !linkEl) return;

    const applyFallback = () => {
      bodyEl.innerHTML =
        "<p>Abu Hurairah (May Allah be pleased with him) reported: Messenger of Allah (ﷺ) said, \"The five (daily) Salat (prayers), and from one Jumu'ah prayer to the (next) Jumu'ah prayer, and from Ramadan to Ramadan are expiations for the (sins) committed in between (their intervals); provided the major sins are not committed\".<br/><br/><b>[Muslim]</b>.<br/><br/></p>";
      citeEl.textContent = "Riyad as-Salihin 189:1059";
      linkEl.href = "https://sunnah.com/riyadussalihin:1059";
    };

    const applyHadithToDom = (randomHadith) => {
      if (!randomHadith || !randomHadith.hadith || !randomHadith.hadith.body) {
        applyFallback();
        return;
      }
      const { collection, hadith, hadithNumber } = randomHadith;
      const title = getHadithTitle(collection);

      bodyEl.innerHTML = hadith.body;
      citeEl.textContent = `${title} ${hadith.chapterNumber}:${hadithNumber}`;
      linkEl.href = `https://sunnah.com/${collection}:${hadithNumber}`;
    };

    const loadFromCache = () => {
      try {
        const raw = kiccStorageGet(localStorage, HADITH_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };

    const saveToCache = (randomHadith) => {
      try {
        if (!randomHadith) return;
        kiccStorageSet(localStorage, HADITH_KEY, JSON.stringify(randomHadith));
      } catch {
        // ignore storage errors
      }
    };

    // 1) Render from cache if available
    const cached = loadFromCache();
    if (cached) {
      applyHadithToDom(cached);
    }

    // 2) Always fetch latest and update cache + DOM
    fetch("https://randomhadith-rds3nxm6za-ew.a.run.app")
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((randomHadith) => {
        saveToCache(randomHadith);
        applyHadithToDom(randomHadith);
      })
      .catch(() => {
        if (!cached) {
          applyFallback();
        }
      });
  };

  const formatTimeToAmPm = (timeInput) => {
    if (!timeInput) return "";
    const s = String(timeInput).trim();

    // Match hh:mm with optional am/pm
    const m = s.match(/^(\d{1,2}):(\d{2})(?:\s*(am|pm))?$/i);
    if (!m) return "";
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const explicit = m[3] ? String(m[3]).toLowerCase() : null;

    let period;
    let displayHour = hh;

    if (explicit) {
      period = explicit;
      // If explicit period is provided, keep hour as-is (assume it's 12-hour input)
      displayHour = hh;
      if (displayHour === 0) displayHour = 12;
    } else {
      // assume 24-hour input
      period = hh >= 12 ? "pm" : "am";
      displayHour = hh % 12;
      if (displayHour === 0) displayHour = 12;
    }

    const minutePadded = mm.toString().padStart(2, "0");
    return `${displayHour}:${minutePadded} ${period}`;
  };

  // Parse a time string (HH:MM or H:MM with optional am/pm) into a Date for today
  const parseTimeToDate = (timeStr) => {
    if (!timeStr) return null;
    const now = new Date();
    // Trim and normalize
    const t = String(timeStr).trim().toLowerCase();

    // Match hh:mm and optional am/pm
    const m = t.match(/^(\d{1,2}):(\d{2})(?:\s*(am|pm))?$/i);
    if (!m) return null;
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ampm = m[3] || null;

    if (ampm) {
      if (ampm === "pm" && hh !== 12) hh = hh + 12;
      if (ampm === "am" && hh === 12) hh = 0;
    }

    const d = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hh,
      mm,
      0,
      0,
    );
    return d;
  };

  // Given a time string like "04:30" return an object {time, period}
  const splitTimeAndPeriod = (timeStr) => {
    const formatted = formatTimeToAmPm(timeStr);
    if (!formatted) return { time: "—", period: "" };
    const parts = formatted.split(" ");
    return { time: parts[0], period: parts[1] || "" };
  };

  const getPrayerDayData = () => {
    if (cachedPrayerDayData) return cachedPrayerDayData;
    try {
      const cached = kiccStorageGet(localStorage, "iqamah-today");
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      return parsed.data && parsed.data[0] ? parsed.data[0] : null;
    } catch {
      return null;
    }
  };

  /** Show Jumu'ah from Thursday Maghrib until Friday Asr (Dublin time). */
  const isJumuahDisplayWindow = () => {
    const now = getDublinDate();
    const day = now.getDay();
    const prayerData = getPrayerDayData();

    if (day === 4) {
      if (!prayerData || !prayerData.maghribTime) return false;
      const maghrib = parseTimeToDublinDate(prayerData.maghribTime);
      if (!maghrib) return false;
      return now.getTime() >= maghrib.getTime();
    }

    if (day === 5) {
      if (!prayerData || !prayerData.asrTime) return true;
      const asr = parseTimeToDublinDate(prayerData.asrTime);
      if (!asr) return true;
      return now.getTime() < asr.getTime();
    }

    return false;
  };

  const isFridayInDublin = () => getDublinDate().getDay() === 5;

  const getJumuahBannerBadge = () =>
    getDublinDate().getDay() === 5 ? "Today" : "This Friday";

  const refreshJumuahDisplay = () => {
    const cached = loadAnnouncementsFromCache();
    renderJumuahFridayBanner(cached || []);
  };

  const getJumuahTimes = (announcements) => {
    if (!Array.isArray(announcements)) return null;
    const jumuah = announcements.find((a) => a.type === "jumuah") || null;
    if (
      !jumuah ||
      !Array.isArray(jumuah.jummahTimes) ||
      jumuah.jummahTimes.length === 0
    ) {
      return null;
    }
    return jumuah.jummahTimes;
  };

  const isJumuahFeatureBannerVisible = (jummahTimes) => {
    if (!jummahTimes || jummahTimes.length === 0) return false;
    if (!isJumuahDisplayWindow()) return false;
    return isHomePage() || isActivitiesPage();
  };

  const buildJumuahTimesHtml = (jummahTimes) => {
    if (!Array.isArray(jummahTimes) || jummahTimes.length === 0) return "";

    return jummahTimes
      .map(function (slot, index) {
        const speech = formatTimeToAmPm(slot.speech);
        const khutbah = formatTimeToAmPm(slot.khutbah);
        if (!speech && !khutbah) return "";

        const prefix =
          jummahTimes.length > 1 ? "Jumu'ah " + (index + 1) + ": " : "";
        const parts = [];
        if (speech) {
          parts.push("Speech <strong>" + speech + "</strong>");
        }
        if (khutbah) {
          parts.push("Khutbah &amp; salah <strong>" + khutbah + "</strong>");
        }
        return prefix + parts.join(" · ");
      })
      .filter(Boolean)
      .join("<br>");
  };

  const buildJumuahScheduleFeatureHtml = (jummahTimes) => {
    if (!Array.isArray(jummahTimes) || jummahTimes.length === 0) return "";

    const slot = jummahTimes[0];
    const speech = formatTimeToAmPm(slot.speech) || "—";
    const khutbah = formatTimeToAmPm(slot.khutbah) || "—";
    const badge = getJumuahBannerBadge();

    return (
      '<div class="programmes-jumuah-feature-inner">' +
      '<div class="programmes-jumuah-feature-head">' +
      '<span class="programmes-jumuah-feature-badge">' +
      badge +
      "</span>" +
      '<h3 class="programmes-jumuah-feature-title">' +
      '<i class="fas fa-mosque" aria-hidden="true"></i> Jumu\'ah Salah</h3>' +
      '<p class="programmes-jumuah-feature-lead">Join us for the Friday congregation</p>' +
      "</div>" +
      '<div class="programmes-jumuah-feature-times">' +
      '<div class="programmes-jumuah-feature-slot">' +
      '<span class="programmes-jumuah-feature-slot-label">Speech</span>' +
      '<strong class="programmes-jumuah-feature-slot-time">' +
      speech +
      "</strong></div>" +
      '<div class="programmes-jumuah-feature-slot programmes-jumuah-feature-slot-primary">' +
      '<span class="programmes-jumuah-feature-slot-label">Khutbah &amp; salah</span>' +
      '<strong class="programmes-jumuah-feature-slot-time">' +
      khutbah +
      "</strong></div></div></div>"
    );
  };

  const renderNavJumuahRow = (jummahTimes) => {
    const zohrBegins = document.getElementById("nav-zohr-begins");
    const zohrRow = zohrBegins
      ? zohrBegins.closest(".kicc-nav-salah-row, tr")
      : null;
    const existing = document.getElementById("nav-jumuah-row");

    if (!jummahTimes || jummahTimes.length === 0) {
      if (existing) existing.remove();
      return;
    }

    if (!zohrRow) return;

    const slot = jummahTimes[0];
    const speech = formatTimeToAmPm(slot.speech) || "—";
    const khutbah = formatTimeToAmPm(slot.khutbah) || "—";
    const badge = getJumuahBannerBadge();
    const isEnhanced = !!zohrRow.classList.contains("kicc-nav-salah-row");

    let row = existing;
    if (!row) {
      row = document.createElement(isEnhanced ? "div" : "tr");
      row.id = "nav-jumuah-row";
      row.className = isEnhanced
        ? "kicc-nav-salah-row kicc-nav-jumuah-row kicc-nav-prayer-row"
        : "kicc-nav-jumuah-row kicc-nav-prayer-row";
      zohrRow.insertAdjacentElement("afterend", row);
    }

    if (isEnhanced) {
      row.innerHTML =
        '<div class="kicc-nav-salah-row-name">' +
        '<span class="kicc-nav-salah-row-label">Jumu\'ah</span>' +
        '<span class="kicc-nav-jumuah-day-badge">' +
        badge +
        "</span></div>" +
        '<div class="kicc-nav-salah-row-times kicc-nav-jumuah-times">' +
        '<div class="kicc-nav-salah-time">' +
        '<span class="kicc-nav-salah-time-label">Speech</span>' +
        '<span class="kicc-nav-salah-time-value">' +
        speech +
        "</span></div>" +
        '<div class="kicc-nav-salah-time kicc-nav-salah-time-iqamah">' +
        '<span class="kicc-nav-salah-time-label">Khutbah &amp; salah</span>' +
        '<span class="kicc-nav-salah-time-value">' +
        khutbah +
        "</span></div></div>";
      return;
    }

    row.innerHTML =
      "<th scope=\"row\">Jumu'ah <span class=\"kicc-nav-jumuah-day-badge\">" +
      badge +
      "</span></th>" +
      '<td><span class="nav-jumuah-time">' +
      speech +
      '</span> <span class="nav-jumuah-hint">speech</span></td>' +
      '<td><span class="nav-jumuah-time">' +
      khutbah +
      '</span> <span class="nav-jumuah-hint">khutbah &amp; salah</span></td>';
  };

  const renderJumuahFridayBanner = (announcements) => {
    const banners = document.querySelectorAll(".jumuah-friday-banner");
    const jummahTimes = getJumuahTimes(announcements);
    const showJumuah = isJumuahDisplayWindow() && jummahTimes;

    renderNavJumuahRow(showJumuah ? jummahTimes : null);

    if (banners.length) {
      banners.forEach(function (banner) {
        if (!showJumuah) {
          banner.hidden = true;
          banner.innerHTML = "";
          return;
        }

        const isScheduleFeature = banner.classList.contains(
          "jumuah-feature-banner",
        );
        banner.innerHTML = isScheduleFeature
          ? buildJumuahScheduleFeatureHtml(jummahTimes)
          : '<p class="jumuah-friday-banner-label">' +
            '<i class="fas fa-mosque" aria-hidden="true"></i> Friday Jumu\'ah</p>' +
            '<p class="jumuah-friday-banner-times">' +
            buildJumuahTimesHtml(jummahTimes) +
            "</p>";
        banner.hidden = false;
      });
    }
  };

  const pickAnnouncementByType = (announcements, type) => {
    if (!Array.isArray(announcements)) return null;
    const matches = announcements.filter((a) => a.type === type);
    if (!matches.length) return null;
    const active = matches.filter((a) => a.active);
    const pool = active.length ? active : matches;
    return pool.sort(
      (a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0),
    )[0];
  };

  const parseAnnouncementsByType = (announcements) => {
    if (!Array.isArray(announcements)) {
      return { breaking: null, general: null, jumuah: null };
    }
    return {
      breaking: pickAnnouncementByType(announcements, "breaking"),
      general: pickAnnouncementByType(announcements, "general"),
      jumuah: pickAnnouncementByType(announcements, "jumuah"),
    };
  };

  const getBreakingAnnouncementTimestamp = (announcement) =>
    Number(announcement && announcement.timestamp) || 0;

  const getAnnouncementDismissKey = (announcement) => {
    if (!announcement) return "";
    if (announcement.id) return BREAKING_DISMISS_PREFIX + announcement.id;
    return BREAKING_DISMISS_PREFIX + String(announcement.timestamp || "legacy");
  };

  const isBreakingDismissed = (announcement) => {
    const key = getAnnouncementDismissKey(announcement);
    if (!key || !announcement) return false;
    try {
      const stored = kiccStorageGet(localStorage, key);
      if (stored === null || stored === "") return false;
      if (stored === "1") return false;
      const dismissedTs = Number(stored);
      if (!Number.isFinite(dismissedTs)) return false;
      return getBreakingAnnouncementTimestamp(announcement) <= dismissedTs;
    } catch {
      return false;
    }
  };

  const dismissBreakingAnnouncement = (announcement) => {
    const key = getAnnouncementDismissKey(announcement);
    if (!key || !announcement) return;
    try {
      const ts = getBreakingAnnouncementTimestamp(announcement) || Date.now();
      kiccStorageSet(localStorage, key, String(ts));
    } catch {
      // ignore storage errors
    }
  };

  const getBreakingIdentity = (breaking) => {
    if (!breaking) return "";
    return String(breaking.id || "legacy") + ":" + getBreakingAnnouncementTimestamp(breaking);
  };

  const selectRibbonAnnouncement = (announcements, options) => {
    options = options || {};
    const suppressJumuah = !!options.suppressJumuah;
    const { breaking, general, jumuah } = parseAnnouncementsByType(announcements);
    const showJumuahMessage =
      !suppressJumuah &&
      isFridayInDublin() &&
      jumuah &&
      jumuah.active &&
      jumuah.message;

    if (breaking && breaking.active && breaking.message) {
      return { announcement: breaking, variant: "breaking" };
    }
    if (showJumuahMessage) {
      return { announcement: jumuah, variant: "jumuah" };
    }
    if (general && general.active && general.message) {
      return { announcement: general, variant: "general" };
    }
    return null;
  };

  const getRibbonVariantLabel = (variant) => {
    if (variant === "breaking") return "Important";
    if (variant === "jumuah") return "Jumu'ah";
    return "Announcement";
  };

  const buildJumuahRibbonScheduleHtml = (jummahTimes) => {
    if (!Array.isArray(jummahTimes) || jummahTimes.length === 0) return "";

    const slot = jummahTimes[0];
    const speech = formatTimeToAmPm(slot.speech);
    const khutbah = formatTimeToAmPm(slot.khutbah);
    const parts = [];

    if (speech) {
      parts.push('Speech <strong>' + speech + "</strong>");
    }
    if (khutbah) {
      parts.push("Khutbah &amp; salah <strong>" + khutbah + "</strong>");
    }
    if (!parts.length) return "";

    return (
      '<p class="site-announcement-ribbon-schedule">' +
      '<i class="fas fa-mosque" aria-hidden="true"></i> ' +
      '<span class="site-announcement-ribbon-schedule-label">Jumu\'ah</span> ' +
      parts.join(" · ") +
      "</p>"
    );
  };

  const isBlockingOverlayVisible = () => {
    if (document.documentElement.classList.contains("cookie-consent-pending")) {
      return true;
    }
    if (document.body.classList.contains("cookie-consent-active")) {
      return true;
    }
    const modal = document.getElementById("myModal");
    if (modal && modal.classList.contains("show")) {
      return true;
    }
    return false;
  };

  const hideBreakingAlert = (animate) => {
    const alertEl = document.getElementById("site-breaking-alert");
    if (!alertEl) return;

    const finish = () => {
      alertEl.hidden = true;
      alertEl.classList.remove("is-visible", "is-leaving");
      alertEl.setAttribute("aria-hidden", "true");
      document.body.classList.remove("site-breaking-alert-open");
    };

    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    alertEl.classList.add("is-leaving");
    alertEl.classList.remove("is-visible");
    window.setTimeout(finish, 320);
  };

  const showBreakingAlert = (breaking) => {
    const alertEl = document.getElementById("site-breaking-alert");
    const messageEl = document.getElementById("site-breaking-alert-message");
    if (!alertEl || !messageEl || !breaking || !breaking.message) return;

    messageEl.innerHTML = breaking.message;
    alertEl.hidden = false;
    alertEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("site-breaking-alert-open");
    lastShownBreakingIdentity = getBreakingIdentity(breaking);

    requestAnimationFrame(function () {
      alertEl.classList.add("is-visible");
    });
  };

  const tryShowBreakingAlert = () => {
    if (!pendingBreakingAnnouncement) return;
    if (isBlockingOverlayVisible()) return;
    if (isBreakingDismissed(pendingBreakingAnnouncement)) {
      return;
    }

    const identity = getBreakingIdentity(pendingBreakingAnnouncement);
    const alertEl = document.getElementById("site-breaking-alert");
    const isOpen =
      alertEl &&
      !alertEl.hidden &&
      alertEl.classList.contains("is-visible") &&
      lastShownBreakingIdentity === identity;

    if (isOpen) return;

    showBreakingAlert(pendingBreakingAnnouncement);
  };

  const queueBreakingAlert = (breaking) => {
    if (!breaking || !breaking.active || !breaking.message) {
      pendingBreakingAnnouncement = null;
      lastShownBreakingIdentity = "";
      hideBreakingAlert(false);
      return;
    }
    if (isBreakingDismissed(breaking)) {
      pendingBreakingAnnouncement = null;
      return;
    }

    const identity = getBreakingIdentity(breaking);
    const identityChanged = identity !== lastShownBreakingIdentity;

    pendingBreakingAnnouncement = breaking;

    if (identityChanged) {
      hideBreakingAlert(false);
    }

    tryShowBreakingAlert();
  };

  const ensureSiteAnnouncementShell = () => {
    if (document.getElementById("site-announcement-ribbon")) return;

    const mainNav = document.querySelector(".kicc-nav-v2");
    if (!mainNav) return;

    const legacyBar = document.getElementById("announcement-bar");
    if (legacyBar) legacyBar.remove();

    const ribbon = document.createElement("aside");
    ribbon.id = "site-announcement-ribbon";
    ribbon.className = "site-announcement-ribbon";
    ribbon.hidden = true;
    ribbon.setAttribute("aria-live", "polite");
    ribbon.innerHTML =
      '<div class="site-announcement-ribbon-inner">' +
      '<div class="site-announcement-ribbon-main">' +
      '<span class="site-announcement-ribbon-badge" id="site-announcement-ribbon-badge"></span>' +
      '<div class="site-announcement-ribbon-message" id="site-announcement-ribbon-message"></div>' +
      "</div>" +
      '<div class="site-announcement-ribbon-schedule-wrap" id="site-announcement-ribbon-schedule" hidden></div>' +
      "</div>";

    const alertEl = document.createElement("div");
    alertEl.id = "site-breaking-alert";
    alertEl.className = "site-breaking-alert";
    alertEl.hidden = true;
    alertEl.setAttribute("role", "alertdialog");
    alertEl.setAttribute("aria-modal", "true");
    alertEl.setAttribute("aria-labelledby", "site-breaking-alert-title");
    alertEl.setAttribute("aria-describedby", "site-breaking-alert-message");
    alertEl.setAttribute("aria-hidden", "true");
    alertEl.innerHTML =
      '<div class="site-breaking-alert-backdrop" aria-hidden="true"></div>' +
      '<div class="site-breaking-alert-dialog">' +
      '<div class="site-breaking-alert-card">' +
      '<span class="site-breaking-alert-icon" aria-hidden="true">' +
      '<i class="fas fa-bullhorn"></i></span>' +
      '<h2 id="site-breaking-alert-title" class="site-breaking-alert-title">Important announcement</h2>' +
      '<div id="site-breaking-alert-message" class="site-breaking-alert-message"></div>' +
      '<p class="site-breaking-alert-note">You can dismiss this alert. A reminder stays visible in the banner across the site.</p>' +
      '<button type="button" class="site-breaking-alert-dismiss" id="site-breaking-alert-dismiss">' +
      "Got it — keep banner reminder</button>" +
      "</div></div>";

    mainNav.insertAdjacentElement("afterend", ribbon);
    document.body.appendChild(alertEl);
  };

  const bindSiteAnnouncementEvents = () => {
    if (siteAnnouncementsBound) return;
    siteAnnouncementsBound = true;

    const dismissBtn = document.getElementById("site-breaking-alert-dismiss");
    if (dismissBtn && !dismissBtn.dataset.bound) {
      dismissBtn.dataset.bound = "true";
      dismissBtn.addEventListener("click", function () {
        if (pendingBreakingAnnouncement) {
          dismissBreakingAnnouncement(pendingBreakingAnnouncement);
        }
        hideBreakingAlert(true);
      });
    }

    const backdrop = document.querySelector(".site-breaking-alert-backdrop");
    if (backdrop && !backdrop.dataset.bound) {
      backdrop.dataset.bound = "true";
      backdrop.addEventListener("click", function () {
        dismissBtn?.click();
      });
    }
  };

  const renderSiteAnnouncementRibbon = (announcements) => {
    ensureSiteAnnouncementShell();
    bindSiteAnnouncementEvents();

    const ribbon = document.getElementById("site-announcement-ribbon");
    const badgeEl = document.getElementById("site-announcement-ribbon-badge");
    const messageEl = document.getElementById("site-announcement-ribbon-message");
    const scheduleWrap = document.getElementById(
      "site-announcement-ribbon-schedule",
    );
    if (!ribbon || !badgeEl || !messageEl || !scheduleWrap) return;

    const jummahTimes = getJumuahTimes(announcements);
    const suppressJumuahInRibbon = isJumuahFeatureBannerVisible(jummahTimes);
    const selected = selectRibbonAnnouncement(announcements, {
      suppressJumuah: suppressJumuahInRibbon,
    });
    const scheduleHtml = buildJumuahRibbonScheduleHtml(jummahTimes);
    const hasSchedule = !!scheduleHtml && !suppressJumuahInRibbon;
    const hasMessage = !!(selected && selected.announcement.message);

    ribbon.classList.remove(
      "site-announcement-ribbon--breaking",
      "site-announcement-ribbon--jumuah",
      "site-announcement-ribbon--general",
      "site-announcement-ribbon--schedule-only",
    );

    if (!hasMessage && !hasSchedule) {
      ribbon.hidden = true;
      messageEl.innerHTML = "";
      scheduleWrap.innerHTML = "";
      scheduleWrap.hidden = true;
      queueStickyNavOffsetSync();
      return;
    }

    if (hasMessage) {
      badgeEl.textContent = getRibbonVariantLabel(selected.variant);
      messageEl.innerHTML = selected.announcement.message;
      ribbon.classList.add("site-announcement-ribbon--" + selected.variant);
      badgeEl.hidden = false;
      messageEl.hidden = false;
    } else {
      badgeEl.hidden = true;
      messageEl.hidden = true;
      messageEl.innerHTML = "";
      ribbon.classList.add("site-announcement-ribbon--schedule-only");
    }

    if (hasSchedule) {
      scheduleWrap.innerHTML = scheduleHtml;
      scheduleWrap.hidden = false;
    } else {
      scheduleWrap.innerHTML = "";
      scheduleWrap.hidden = true;
    }

    ribbon.hidden = false;
    queueStickyNavOffsetSync();
  };

  const applyAnnouncements = (announcements) => {
    renderSiteAnnouncementRibbon(announcements);
    renderJumuahFridayBanner(announcements);

    const { breaking } = parseAnnouncementsByType(announcements);
    queueBreakingAlert(breaking && breaking.active ? breaking : null);
  };

  const initSiteAnnouncements = () => {
    ensureSiteAnnouncementShell();
    bindSiteAnnouncementEvents();

    const cached = loadAnnouncementsFromCache();
    if (cached) {
      applyAnnouncements(cached);
    }

    fetch(ANNOUNCEMENTS_API_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (announcements) {
        saveAnnouncementsToCache(announcements);
        applyAnnouncements(announcements);
      })
      .catch(function () {
        if (!cached) {
          renderJumuahFridayBanner([]);
          queueStickyNavOffsetSync();
        }
      });
  };

  const loadAnnouncementsFromCache = () => {
    const ANNOUNCEMENTS_KEY = "kicc-announcements";
    try {
      const raw = kiccStorageGet(localStorage, ANNOUNCEMENTS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const saveAnnouncementsToCache = (announcements) => {
    const ANNOUNCEMENTS_KEY = "kicc-announcements";
    try {
      if (!Array.isArray(announcements)) return;
      kiccStorageSet(localStorage, ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
    } catch {
      // ignore storage errors
    }
  };

  const loadNoticesFromCache = () => {
    const NOTICES_KEY = "notices";
    try {
      const raw = kiccStorageGet(localStorage, NOTICES_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const saveNoticesToCache = (notices) => {
    const NOTICES_KEY = "notices";
    try {
      if (!Array.isArray(notices)) return;
      kiccStorageSet(localStorage, NOTICES_KEY, JSON.stringify(notices));
    } catch {
      // ignore storage errors
    }
  };

  const formatNoticeLabel = (name) => {
    if (!name || typeof name !== "string") return "Masjid notice";
    return (
      name
        .replace(/\.(jpe?g|png|webp|gif)$/i, "")
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .trim() || "Masjid notice"
    );
  };

  const sortNotices = (notices) => {
    if (!Array.isArray(notices)) return [];
    return notices
      .filter((notice) => notice && typeof notice.url === "string" && notice.url.trim() !== "")
      .slice()
      .sort(
        (a, b) =>
          (Number(b.createdTime) || Number(b.order) || 0) -
          (Number(a.createdTime) || Number(a.order) || 0),
      );
  };

  const getNoticeSpotlightDismissKey = (notices) => {
    const latest = sortNotices(notices)[0];
    return latest ? String(latest.id || latest.key || latest.url) : "none";
  };

  const isNoticeSpotlightDismissed = (notices) => {
    try {
      const dismissed = kiccStorageGet(
        sessionStorage,
        "kicc-notices-spotlight-dismissed",
      );
      if (!dismissed) return false;
      return dismissed === getNoticeSpotlightDismissKey(notices);
    } catch {
      return false;
    }
  };

  const dismissNoticeSpotlight = () => {
    const cached = loadNoticesFromCache() || [];
    const section = document.getElementById("masjid-notice-spotlight");
    if (!section) return;

    const finishDismiss = () => {
      try {
        kiccStorageSet(
          sessionStorage,
          "kicc-notices-spotlight-dismissed",
          getNoticeSpotlightDismissKey(cached),
        );
      } catch {
        // ignore storage errors
      }
      section.hidden = true;
      section.classList.remove("is-dismissing");
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishDismiss();
      return;
    }

    section.classList.add("is-dismissing");
    window.setTimeout(finishDismiss, 480);
  };

  const bindNoticeSpotlightDismiss = () => {
    const btn = document.getElementById("masjidNoticeSpotlightDismiss");
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = "true";
    btn.addEventListener("click", dismissNoticeSpotlight);
  };

  let noticesRevealObserver = null;

  const observeNoticeReveals = () => {
    const els = document.querySelectorAll(
      ".notices-reveal:not([data-notices-observed])",
    );
    if (!els.length) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) {
        el.classList.add("is-visible");
        el.dataset.noticesObserved = "true";
      });
      return;
    }

    if (!noticesRevealObserver) {
      noticesRevealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              noticesRevealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -28px 0px" },
      );
    }

    els.forEach(function (el) {
      el.dataset.noticesObserved = "true";
      noticesRevealObserver.observe(el);
    });
  };

  const initHomeNotices = () => {
    if (!isHomePage()) return;
    observeNoticeReveals();
  };

  const renderNoticeSpotlight = (notices) => {
    const section = document.getElementById("masjid-notice-spotlight");
    const track = document.getElementById("masjidNoticeSpotlightTrack");
    const countEl = document.getElementById("masjidNoticeSpotlightCount");
    if (!section || !track) return;

    const sorted = sortNotices(notices);
    if (sorted.length === 0 || isNoticeSpotlightDismissed(sorted)) {
      section.hidden = true;
      track.innerHTML = "";
      return;
    }

    track.innerHTML = "";
    sorted.slice(0, 4).forEach(function (notice, index) {
      const card = document.createElement("a");
      card.className =
        "notices-spotlight-card lightbox" +
        (index === 0 ? " notices-spotlight-card--featured" : "");
      card.href = notice.url;
      card.setAttribute("role", "listitem");
      card.style.setProperty("--spotlight-i", index);
      card.setAttribute(
        "aria-label",
        "View notice: " + formatNoticeLabel(notice.name),
      );

      if (index === 0) {
        const badge = document.createElement("span");
        badge.className = "notices-spotlight-card-new";
        badge.textContent = "Latest";
        card.appendChild(badge);
      }

      const frame = document.createElement("div");
      frame.className = "notices-spotlight-card-frame";

      const img = document.createElement("img");
      img.src = notice.url;
      img.alt = "";
      img.loading = index === 0 ? "eager" : "lazy";
      img.decoding = "async";

      const overlay = document.createElement("span");
      overlay.className = "notices-spotlight-card-overlay";
      overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML = '<i class="fas fa-expand"></i>';

      frame.appendChild(img);
      frame.appendChild(overlay);

      const label = document.createElement("span");
      label.className = "notices-spotlight-card-label";
      label.textContent = formatNoticeLabel(notice.name);

      card.appendChild(frame);
      card.appendChild(label);
      track.appendChild(card);
    });

    if (countEl) {
      countEl.textContent =
        sorted.length === 1 ? "1 new poster" : sorted.length + " posters available";
    }

    bindNoticeSpotlightDismiss();
    section.hidden = false;
    section.classList.remove("is-dismissing");
    initBaguetteBox();
  };

  const renderNotices = (notices = []) => {
    const noticeContainer = document.getElementById("noticeContainer");
    const noticeBoard = document.getElementById("notice-board");
    if (!noticeContainer) return;

    const sorted = sortNotices(notices);
    renderNoticeSpotlight(sorted);

    noticeContainer.innerHTML = "";

    if (sorted.length === 0) {
      if (noticeBoard) noticeBoard.hidden = true;
      return;
    }

    if (noticeBoard) noticeBoard.hidden = false;

    sorted.forEach(function (notice, index) {
      const article = document.createElement("article");
      article.className =
        "notices-card" + (index === 0 ? " notices-card--featured" : "");
      article.setAttribute("role", "listitem");
      article.style.setProperty("--notice-i", index);

      const a = document.createElement("a");
      a.className = "notices-card-link lightbox";
      a.href = notice.url;
      a.setAttribute(
        "aria-label",
        "View notice: " + formatNoticeLabel(notice.name),
      );

      const media = document.createElement("div");
      media.className = "notices-card-media";

      if (index === 0) {
        const badge = document.createElement("span");
        badge.className = "notices-card-new";
        badge.textContent = "Latest";
        media.appendChild(badge);
      }

      const img = document.createElement("img");
      img.className = "notices-card-image";
      img.src = notice.url;
      img.alt = formatNoticeLabel(notice.name);
      img.loading = index === 0 ? "eager" : "lazy";
      img.decoding = "async";

      const shade = document.createElement("div");
      shade.className = "notices-card-shade";
      shade.setAttribute("aria-hidden", "true");

      const zoom = document.createElement("span");
      zoom.className = "notices-card-zoom";
      zoom.setAttribute("aria-hidden", "true");
      zoom.innerHTML = '<i class="fas fa-expand"></i>';

      const caption = document.createElement("span");
      caption.className = "notices-card-caption";
      caption.textContent = formatNoticeLabel(notice.name);

      media.appendChild(img);
      media.appendChild(shade);
      media.appendChild(zoom);
      media.appendChild(caption);
      a.appendChild(media);
      article.appendChild(a);
      noticeContainer.appendChild(article);
    });

    observeNoticeReveals();
    initBaguetteBox();
  };

  const getNotices = () => {
    const NOTICE_API_URL = "https://getnotices-rds3nxm6za-ew.a.run.app";
    return fetch(NOTICE_API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((response) => {
        const notices = Array.isArray(response.notices) ? response.notices : [];
        saveNoticesToCache(notices);
        renderNotices(notices);
      })
      .catch((err) => {
        console.error("Error loading notices", err);
      });
  };

  const showNotices = () => {
    const cached = loadNoticesFromCache();
    if (cached) {
      renderNotices(cached);
    }

    // Always refresh from API and update cache + UI
    getNotices();
  };

  const WEEKDAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const WEEKDAY_LABELS = {
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
    Sun: "Sunday",
  };

  const programmeSlug = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .replace(/['']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const normalizeWeekday = (day) => {
    if (!day || typeof day !== "string") return null;
    var map = {
      mon: "Mon",
      tue: "Tue",
      wed: "Wed",
      thu: "Thu",
      fri: "Fri",
      sat: "Sat",
      sun: "Sun",
    };
    var key = day.trim().slice(0, 3).toLowerCase();
    return map[key] || null;
  };

  const MONTH_NAME_TO_INDEX = {
    january: 0,
    jan: 0,
    february: 1,
    feb: 1,
    march: 2,
    mar: 2,
    april: 3,
    apr: 3,
    may: 4,
    june: 5,
    jun: 5,
    july: 6,
    jul: 6,
    august: 7,
    aug: 7,
    september: 8,
    sep: 8,
    sept: 8,
    october: 9,
    oct: 9,
    november: 10,
    nov: 10,
    december: 11,
    dec: 11,
  };

  const getProgrammeTimeLabel = (p) => {
    return p.timeDescription || (p.clockTime ? "At " + p.clockTime : "");
  };

  const hasProgrammePrayerName = (p) => {
    return p.prayerName != null && String(p.prayerName).trim() !== "";
  };

  const getProgrammeScheduleTime = (p) => {
    if (hasProgrammePrayerName(p)) {
      return String(p.prayerName).trim();
    }
    if (p.clockTime) {
      return p.clockTime;
    }
    return "—";
  };

  const getProgrammeChipTime = (p) => {
    if (hasProgrammePrayerName(p)) {
      return "After " + String(p.prayerName).trim();
    }
    return getProgrammeTimeLabel(p);
  };

  const isRecurringWeeklyProgramme = (p) => {
    var desc = (p.timeDescription || "").trim();
    return /^Every(day|\s)/i.test(desc);
  };

  const applyClockTimeToDate = (date, clockTime) => {
    if (!clockTime || typeof clockTime !== "string") return date;
    var parts = clockTime.split(":");
    if (parts.length < 2) return date;
    date.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
    return date;
  };

  const getProgrammeEventDate = (p) => {
    if (isRecurringWeeklyProgramme(p)) return null;

    var desc = p.timeDescription || "";

    if (/today at/i.test(desc)) {
      var today = new Date();
      return applyClockTimeToDate(today, p.clockTime);
    }

    var match = desc.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (match) {
      var day = parseInt(match[1], 10);
      var month = MONTH_NAME_TO_INDEX[match[2].toLowerCase()];
      var year = parseInt(match[3], 10);
      if (month !== undefined) {
        var eventDate = new Date(year, month, day);
        return applyClockTimeToDate(eventDate, p.clockTime);
      }
    }

    if (p.createdAt) {
      return new Date(p.createdAt);
    }

    return null;
  };

  const getThisWeekRange = (refDate) => {
    var d = refDate ? new Date(refDate) : new Date();
    d.setHours(0, 0, 0, 0);
    var dow = d.getDay();
    var mondayOffset = dow === 0 ? -6 : 1 - dow;
    var start = new Date(d);
    start.setDate(d.getDate() + mondayOffset);
    var end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start: start, end: end };
  };

  const isDateInRange = (date, start, end) => {
    return date >= start && date <= end;
  };

  const isSameCalendarDay = (a, b) => {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const formatProgrammeEventDate = (date) => {
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const programmeMatchesDay = (p, dayKey) => {
    var days = Array.isArray(p.weekdays) ? p.weekdays : [];
    return days.map(normalizeWeekday).filter(Boolean).indexOf(dayKey) >= 0;
  };

  const isProgrammeToday = (p, today, todayKey) => {
    if (isRecurringWeeklyProgramme(p)) {
      return programmeMatchesDay(p, todayKey);
    }

    var eventDate = getProgrammeEventDate(p);
    return eventDate ? isSameCalendarDay(eventDate, today) : false;
  };

  const programmeIdentity = (p) => {
    return (p.id || "") + "|" + (p.name || "");
  };

  const getProgrammeAnchorId = (p) => {
    var name = (p && p.name) || "";
    if (/women/i.test(name)) return "women-class";
    if (/adult/i.test(name)) return "adult-classes";
    return programmeSlug(name);
  };

  const createScheduleItem = (p) => {
    var item = document.createElement("li");
    item.className = "programmes-schedule-item";

    var time = document.createElement("span");
    time.className = "programmes-schedule-item-time";
    if (hasProgrammePrayerName(p)) {
      time.classList.add("is-prayer");
    }
    time.textContent = getProgrammeScheduleTime(p);

    var name = document.createElement("span");
    name.className = "programmes-schedule-item-name";
    name.textContent = p.name || "";

    item.appendChild(time);
    item.appendChild(name);

    if (p.speaker) {
      var speaker = document.createElement("span");
      speaker.className = "programmes-schedule-item-speaker";
      speaker.textContent = p.speaker;
      item.appendChild(speaker);
    }

    return item;
  };

  const renderUpcomingEvents = (events) => {
    var container = document.getElementById("programmes-upcoming-events");
    if (!container) return;

    if (!Array.isArray(events) || events.length === 0) {
      container.hidden = true;
      container.innerHTML = "";
      return;
    }

    container.hidden = false;
    container.innerHTML = "";

    var sorted = events.slice().sort(function (a, b) {
      var dateA = getProgrammeEventDate(a);
      var dateB = getProgrammeEventDate(b);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });

    var title = document.createElement("h3");
    title.id = "upcoming-events-heading";
    title.className = "programmes-upcoming-title";
    title.textContent = "Upcoming events";

    var list = document.createElement("ul");
    list.className = "programmes-upcoming-list list-unstyled mb-0";

    sorted.forEach(function (p) {
      var eventDate = getProgrammeEventDate(p);
      var li = document.createElement("li");
      li.className = "programmes-upcoming-item";

      var dateEl = document.createElement("span");
      dateEl.className = "programmes-upcoming-date";
      dateEl.textContent = eventDate ? formatProgrammeEventDate(eventDate) : "";

      var body = document.createElement("div");
      body.className = "programmes-upcoming-body";

      var name = document.createElement("strong");
      name.className = "programmes-upcoming-name";
      name.textContent = p.name || "";

      var meta = document.createElement("span");
      meta.className = "programmes-upcoming-meta";
      meta.textContent = hasProgrammePrayerName(p)
        ? "After " + String(p.prayerName).trim()
        : getProgrammeTimeLabel(p);

      body.appendChild(name);
      body.appendChild(meta);

      if (p.location) {
        var location = document.createElement("span");
        location.className = "programmes-upcoming-location";
        location.textContent = p.location;
        body.appendChild(location);
      }

      li.appendChild(dateEl);
      li.appendChild(body);

      if (p.listenUrl) {
        var link = document.createElement("a");
        link.href = p.listenUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "programmes-link-more programmes-upcoming-link";
        link.innerHTML =
          'Details <i class="fas fa-arrow-right" aria-hidden="true"></i>';
        li.appendChild(link);
      }

      list.appendChild(li);
    });

    container.appendChild(title);
    container.appendChild(list);
  };

  const renderProgrammeSchedule = (programmes) => {
    var container = document.getElementById("programmes-weekly-schedule");
    var todayBanner = document.getElementById("programmes-today-banner");
    if (!container) return;

    container.innerHTML = "";
    renderUpcomingEvents([]);

    if (todayBanner) {
      todayBanner.hidden = true;
      todayBanner.innerHTML = "";
    }

    var fallback = [
      {
        name: "Children's Youth Programme",
        timeDescription: "Check Events or Masjid Notice Board",
      },
      {
        name: "Adult's Monthly Programme",
        timeDescription: "Check Events or Masjid Notice Board",
      },
    ];

    var list =
      Array.isArray(programmes) && programmes.length ? programmes : fallback;

    var byDay = {};
    var unscheduled = [];
    var upcomingEvents = [];
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var todayKey = today.toLocaleDateString("en-GB", { weekday: "short" });
    var weekRange = getThisWeekRange(today);
    var todayProgrammes = [];
    var seenToday = {};

    WEEKDAY_ORDER.forEach(function (day) {
      byDay[day] = [];
    });

    list.forEach(function (p) {
      var days = Array.isArray(p.weekdays) ? p.weekdays : [];
      var normalized = days.map(normalizeWeekday).filter(Boolean);

      if (normalized.length === 0) {
        unscheduled.push(p);
        return;
      }

      if (isRecurringWeeklyProgramme(p)) {
        normalized.forEach(function (day) {
          if (!byDay[day]) return;
          var alreadyListed = byDay[day].some(function (existing) {
            return programmeIdentity(existing) === programmeIdentity(p);
          });
          if (!alreadyListed) {
            byDay[day].push(p);
          }
        });

        if (isProgrammeToday(p, today, todayKey)) {
          var todayId = programmeIdentity(p);
          if (!seenToday[todayId]) {
            seenToday[todayId] = true;
            todayProgrammes.push(p);
          }
        }
        return;
      }

      var eventDate = getProgrammeEventDate(p);
      if (!eventDate) {
        unscheduled.push(p);
        return;
      }

      if (!isDateInRange(eventDate, weekRange.start, weekRange.end)) {
        upcomingEvents.push(p);
        return;
      }

      var eventDay = eventDate.toLocaleDateString("en-GB", { weekday: "short" });
      if (byDay[eventDay]) {
        byDay[eventDay].push(p);
      }

      if (isProgrammeToday(p, today, todayKey)) {
        var oneOffId = programmeIdentity(p);
        if (!seenToday[oneOffId]) {
          seenToday[oneOffId] = true;
          todayProgrammes.push(p);
        }
      }
    });

    if (todayBanner && todayProgrammes.length > 0) {
      todayBanner.hidden = false;

      var bannerLabel = document.createElement("div");
      bannerLabel.className = "programmes-today-banner-label";
      bannerLabel.innerHTML =
        '<i class="fas fa-sun" aria-hidden="true"></i> Today &mdash; ' +
        (WEEKDAY_LABELS[todayKey] || todayKey);

      var bannerList = document.createElement("div");
      bannerList.className = "programmes-today-banner-chips";

      todayProgrammes.forEach(function (p) {
        var chip = document.createElement("article");
        chip.className = "programmes-today-chip";

        var time = document.createElement("span");
        time.className = "programmes-today-chip-time";
        time.textContent = hasProgrammePrayerName(p)
          ? "After " + String(p.prayerName).trim()
          : getProgrammeTimeLabel(p);

        var name = document.createElement("strong");
        name.className = "programmes-today-chip-name";
        name.textContent = p.name || "";

        chip.appendChild(time);
        chip.appendChild(name);
        bannerList.appendChild(chip);
      });

      todayBanner.appendChild(bannerLabel);
      todayBanner.appendChild(bannerList);
    }

    var columns = document.createElement("div");
    columns.className = "programmes-day-columns";

    WEEKDAY_ORDER.forEach(function (day) {
      var col = document.createElement("div");
      col.className = "programmes-day-col";
      if (day === todayKey) {
        col.classList.add("is-today");
      }

      var heading = document.createElement("h3");
      heading.className = "programmes-day-label";

      var abbr = document.createElement("span");
      abbr.className = "programmes-day-abbr";
      abbr.textContent = day;

      var full = document.createElement("span");
      full.className = "programmes-day-full";
      full.textContent = WEEKDAY_LABELS[day] || day;

      heading.appendChild(abbr);
      heading.appendChild(full);
      col.appendChild(heading);

      var dayProgrammes = byDay[day] || [];
      var listEl = document.createElement("ul");
      listEl.className = "programmes-day-list list-unstyled mb-0";

      if (dayProgrammes.length === 0) {
        var empty = document.createElement("li");
        empty.className = "programmes-day-empty";
        empty.textContent = "—";
        listEl.appendChild(empty);
      } else {
        dayProgrammes.forEach(function (p) {
          listEl.appendChild(createScheduleItem(p));
        });
      }

      col.appendChild(listEl);
      columns.appendChild(col);
    });

    container.appendChild(columns);

    if (unscheduled.length > 0) {
      var ongoing = document.createElement("div");
      ongoing.className = "programmes-unscheduled";

      var ongoingTitle = document.createElement("h3");
      ongoingTitle.className = "programmes-unscheduled-title";
      ongoingTitle.textContent = "Ongoing programmes";

      var ongoingList = document.createElement("ul");
      ongoingList.className = "programmes-unscheduled-list list-unstyled mb-0";

      unscheduled.forEach(function (p) {
        var li = document.createElement("li");
        li.className = "programmes-unscheduled-item";

        var anchorId = getProgrammeAnchorId(p);
        if (anchorId) {
          li.id = anchorId;
        }

        var name = document.createElement("strong");
        name.textContent = p.name || "";

        var time = document.createElement("span");
        time.textContent = getProgrammeTimeLabel(p);

        li.appendChild(name);
        li.appendChild(time);
        ongoingList.appendChild(li);
      });

      ongoing.appendChild(ongoingTitle);
      ongoing.appendChild(ongoingList);
      container.appendChild(ongoing);
    }

    renderUpcomingEvents(upcomingEvents);
  };

  const renderProgrammeTable = (programmes) => {
    renderProgrammeSchedule(programmes);
  };

  const isDirectStreamUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    return (
      /mixlr-recordings-production/i.test(url) ||
      /response-content-type=application%2Fmp3/i.test(url) ||
      /\.(aac|mp3|m4a)(\?|$)/i.test(url)
    );
  };

  const getRecordingDateLabel = (recording) => {
    if (recording.timeDescription) {
      return recording.timeDescription;
    }
    if (recording.createdAt) {
      return formatProgrammeEventDate(new Date(recording.createdAt));
    }
    return "";
  };

  const getRecordingSortTime = (recording) => {
    var eventDate = getProgrammeEventDate(recording);
    if (eventDate) return eventDate.getTime();
    if (recording.createdAt) return Number(recording.createdAt);
    return 0;
  };

  var activeRecordingButton = null;

  const setActiveRecordingItem = (buttonEl) => {
    if (activeRecordingButton) {
      activeRecordingButton.classList.remove("is-playing");
      activeRecordingButton.setAttribute("aria-pressed", "false");
      var oldIcon = activeRecordingButton.querySelector(
        ".programmes-recording-play-icon i",
      );
      if (oldIcon) {
        oldIcon.className = "fas fa-play";
      }
    }
    activeRecordingButton = buttonEl || null;
    if (activeRecordingButton) {
      activeRecordingButton.classList.add("is-playing");
      activeRecordingButton.setAttribute("aria-pressed", "true");
      var newIcon = activeRecordingButton.querySelector(
        ".programmes-recording-play-icon i",
      );
      if (newIcon) {
        newIcon.className = "fas fa-pause";
      }
    }
  };

  const stopRecording = () => {
    var playerWrap = document.getElementById("programmes-recording-player");
    var audio = document.getElementById("programmes-recording-audio");

    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    if (playerWrap) {
      playerWrap.hidden = true;
    }
    setActiveRecordingItem(null);
  };

  const playRecording = (recording, buttonEl) => {
    var playerWrap = document.getElementById("programmes-recording-player");
    var audio = document.getElementById("programmes-recording-audio");
    var titleEl = document.getElementById("programmes-recording-now-title");
    var dateEl = document.getElementById("programmes-recording-now-date");
    var artEl = document.getElementById("programmes-recording-art");

    if (!playerWrap || !audio || !recording || !recording.listenUrl) return;

    if (!isDirectStreamUrl(recording.listenUrl)) {
      window.open(recording.listenUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setActiveRecordingItem(buttonEl);

    if (titleEl) {
      titleEl.textContent = recording.name || "Recording";
    }
    if (dateEl) {
      dateEl.textContent = getRecordingDateLabel(recording);
    }

    if (artEl) {
      if (recording.imageUrl) {
        artEl.src = recording.imageUrl;
        artEl.alt = recording.name || "Recording artwork";
        artEl.hidden = false;
      } else {
        artEl.removeAttribute("src");
        artEl.alt = "";
        artEl.hidden = true;
      }
    }

    playerWrap.hidden = false;

    if (audio.src !== recording.listenUrl) {
      audio.src = recording.listenUrl;
    }

    audio.play().catch(function (err) {
      console.error("Failed to play recording", err);
    });

    playerWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const renderRecordings = (recordings) => {
    var wrap = document.getElementById("programmes-recordings-wrap");
    var list = document.getElementById("programmes-recordings-list");
    var audio = document.getElementById("programmes-recording-audio");
    var playerWrap = document.getElementById("programmes-recording-player");

    if (!wrap || !list) return;

    var playable = Array.isArray(recordings)
      ? recordings.filter(function (r) {
          return r && typeof r.listenUrl === "string" && r.listenUrl.trim() !== "";
        })
      : [];

    if (playable.length === 0) {
      wrap.hidden = true;
      list.innerHTML = "";
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
      }
      if (playerWrap) {
        playerWrap.hidden = true;
      }
      setActiveRecordingItem(null);
      return;
    }

    wrap.hidden = false;
    list.innerHTML = "";
    setActiveRecordingItem(null);
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
    if (playerWrap) {
      playerWrap.hidden = true;
    }

    playable
      .slice()
      .sort(function (a, b) {
        return getRecordingSortTime(b) - getRecordingSortTime(a);
      })
      .forEach(function (recording) {
        var item = document.createElement("li");
        item.className = "programmes-recording-item";

        var button = document.createElement("button");
        button.type = "button";
        button.className = "programmes-recording-button";
        button.setAttribute("aria-pressed", "false");

        if (recording.imageUrl) {
          var thumb = document.createElement("img");
          thumb.className = "programmes-recording-thumb";
          thumb.src = recording.imageUrl;
          thumb.alt = "";
          thumb.width = 56;
          thumb.height = 56;
          thumb.loading = "lazy";
          button.appendChild(thumb);
        } else {
          var iconWrap = document.createElement("span");
          iconWrap.className = "programmes-recording-thumb programmes-recording-thumb-fallback";
          iconWrap.innerHTML = '<i class="fas fa-headphones" aria-hidden="true"></i>';
          button.appendChild(iconWrap);
        }

        var body = document.createElement("span");
        body.className = "programmes-recording-body";

        var name = document.createElement("span");
        name.className = "programmes-recording-name";
        name.textContent = recording.name || "Recording";

        var date = document.createElement("span");
        date.className = "programmes-recording-date";
        date.textContent = getRecordingDateLabel(recording);

        body.appendChild(name);
        body.appendChild(date);
        button.appendChild(body);

        var playIcon = document.createElement("span");
        playIcon.className = "programmes-recording-play-icon";
        playIcon.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
        button.appendChild(playIcon);

        button.addEventListener("click", function () {
          playRecording(recording, button);
        });

        item.appendChild(button);
        list.appendChild(item);
      });

    if (audio && !audio.dataset.bound) {
      audio.dataset.bound = "true";
      audio.addEventListener("play", function () {
        if (activeRecordingButton) {
          var icon = activeRecordingButton.querySelector(".programmes-recording-play-icon i");
          if (icon) {
            icon.className = "fas fa-pause";
          }
        }
      });
      audio.addEventListener("pause", function () {
        if (activeRecordingButton) {
          var icon = activeRecordingButton.querySelector(".programmes-recording-play-icon i");
          if (icon) {
            icon.className = "fas fa-play";
          }
        }
        if (audio.ended) {
          setActiveRecordingItem(null);
        }
      });
      audio.addEventListener("ended", function () {
        if (activeRecordingButton) {
          var icon = activeRecordingButton.querySelector(".programmes-recording-play-icon i");
          if (icon) {
            icon.className = "fas fa-play";
          }
        }
        setActiveRecordingItem(null);
      });
    }

    var closeBtn = document.getElementById("programmes-recording-close");
    if (closeBtn && !closeBtn.dataset.bound) {
      closeBtn.dataset.bound = "true";
      closeBtn.addEventListener("click", stopRecording);
    }
  };

  const renderWeeklyProgrammes = (programmes) => {
    var section = document.getElementById("weekly-programmes-section");
    var container = document.getElementById("weekly-programmes");
    if (!container || !section) return;

    var withImages = Array.isArray(programmes)
      ? programmes.filter(function (p) {
          return (
            p && typeof p.imageUrl === "string" && p.imageUrl.trim() !== ""
          );
        })
      : [];

    if (withImages.length === 0) {
      section.style.display = "none";
      container.innerHTML = "";
      return;
    }

    section.style.display = "";
    container.innerHTML = "";

    withImages.forEach(function (p) {
      var card = document.createElement("article");
      card.className = "weekly-programme-card";

      var anchorId = getProgrammeAnchorId(p);
      if (anchorId) {
        card.id = anchorId;
      }

      var imgWrapper = document.createElement("div");
      imgWrapper.className = "weekly-programme-image-wrapper";

      var img = document.createElement("img");
      img.src = p.imageUrl;
      img.alt = p.name || "Masjid programme";
      img.className = "weekly-programme-image";
      img.loading = "lazy";
      imgWrapper.appendChild(img);
      card.appendChild(imgWrapper);

      var body = document.createElement("div");
      body.className = "weekly-programme-body";

      if (p.name) {
        var title = document.createElement("h3");
        title.className = "weekly-programme-title";
        title.textContent = p.name;
        body.appendChild(title);
      }

      var chips = document.createElement("div");
      chips.className = "weekly-programme-chips";

      var metaText = getProgrammeChipTime(p);
      if (metaText) {
        var timeChip = document.createElement("span");
        timeChip.className = "weekly-programme-chip";
        timeChip.innerHTML =
          '<i class="far fa-clock" aria-hidden="true"></i> ' + metaText;
        chips.appendChild(timeChip);
      }

      if (p.location) {
        var locChip = document.createElement("span");
        locChip.className = "weekly-programme-chip";
        locChip.innerHTML =
          '<i class="fas fa-mosque" aria-hidden="true"></i> ' + p.location;
        chips.appendChild(locChip);
      }

      if (chips.childNodes.length > 0) {
        body.appendChild(chips);
      }

      if (p.description) {
        var desc = document.createElement("div");
        desc.className = "weekly-programme-description";
        desc.innerHTML = p.description;
        body.appendChild(desc);
      }

      var footer = document.createElement("div");
      footer.className = "weekly-programme-footer";

      if (p.topic) {
        var topic = document.createElement("p");
        topic.className = "weekly-programme-detail";
        topic.innerHTML = "<strong>Topic:</strong> " + p.topic;
        footer.appendChild(topic);
      }

      if (p.speaker) {
        var speaker = document.createElement("p");
        speaker.className = "weekly-programme-detail";
        speaker.innerHTML = "<strong>Speaker:</strong> " + p.speaker;
        footer.appendChild(speaker);
      }

      if (p.listenUrl) {
        var link = document.createElement("a");
        link.href = p.listenUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "weekly-programme-link btn btn-kicc btn-kicc-sm";
        link.innerHTML =
          'Listen / Watch live <i class="fas fa-external-link-alt" aria-hidden="true"></i>';
        footer.appendChild(link);
      }

      if (footer.childNodes.length > 0) {
        body.appendChild(footer);
      }

      card.appendChild(body);
      container.appendChild(card);
    });
  };

  const applyProgrammesResponse = (data) => {
    var programmes =
      data && Array.isArray(data.programmes) ? data.programmes : [];
    var recordings =
      data && Array.isArray(data.recordings) ? data.recordings : [];

    renderProgrammeTable(programmes);
    renderWeeklyProgrammes(programmes);
    renderRecordings(recordings);
    scrollToLocationHash();
  };

  const loadProgrammes = () => {
    // Weekly Programmes + recordings on activities page
    const PROGRAMMES_API_URL =
      "https://getmasjidprogrammes-rds3nxm6za-ew.a.run.app?type=programme&active=true";
    const PROGRAMMES_STORAGE_KEY = "masjidProgrammes_programme_active_true_v1";
    var cachedJson = kiccStorageGet(localStorage, PROGRAMMES_STORAGE_KEY);
    if (cachedJson) {
      try {
        var cached = JSON.parse(cachedJson);
        console.log("Cached programmes:", cached);
        applyProgrammesResponse(cached);
      } catch (e) {
        console.error("Failed to parse cached programmes", e);
        applyProgrammesResponse(null);
      }
    } else {
      applyProgrammesResponse(null);
    }

    fetch(PROGRAMMES_API_URL, {
      method: "GET",
      headers: { Accept: "application/json" },
    })
      .then(function (resp) {
        if (!resp.ok) {
          throw new Error("HTTP " + resp.status);
        }
        return resp.json();
      })
      .then(function (data) {
        console.log("Programmes API response:", data);
        if (data) {
          kiccStorageSet(localStorage, PROGRAMMES_STORAGE_KEY, JSON.stringify(data));
          applyProgrammesResponse(data);
        } else {
          applyProgrammesResponse(null);
        }
      })
      .catch(function (err) {
        console.error("Failed to fetch programmes", err);
      });
  };

  const addWhatsAppButton = () => {
    initSiteActionDock();
  };

  const addBackToTopButton = () => {
    /* handled by initSiteActionDock */
  };

  const initBaguetteBox = () => {
    if (typeof baguetteBox !== "undefined") {
      baguetteBox.run(".grid-gallery", { animation: "slideIn" });
    }
  };

  const PAGE_SECTION_NAV_SELECTOR =
    ".madrasa-section-nav, .about-section-nav, .campaign-section-nav, .programmes-section-nav, .contact-section-nav";

  const syncPageSectionNavMetrics = () => {
    const nav = document.querySelector(
      ".page-section-nav-dock.page-section-nav-dock--ready",
    );
    if (!nav) return;

    const height = Math.ceil(nav.getBoundingClientRect().height);
    if (height > 0) {
      document.documentElement.style.setProperty(
        "--page-section-nav-height",
        height + "px",
      );
    }
  };

  let stickyNavOffsetTick = false;

  const syncStickyNavOffset = () => {
    const mainNav = document.querySelector(".kicc-nav-v2");
    if (!mainNav) return;

    const navHeight = Math.ceil(mainNav.getBoundingClientRect().height);
    let top = navHeight;

    if (navHeight > 0) {
      document.documentElement.style.setProperty(
        "--kicc-nav-height",
        navHeight + "px",
      );
    }

    const ribbon = document.getElementById("site-announcement-ribbon");
    if (ribbon && !ribbon.hidden) {
      const ribbonHeight = Math.ceil(ribbon.getBoundingClientRect().height);
      if (ribbonHeight > 0) {
        top += ribbonHeight;
        document.documentElement.style.setProperty(
          "--kicc-announcement-ribbon-height",
          ribbonHeight + "px",
        );
      } else {
        document.documentElement.style.setProperty(
          "--kicc-announcement-ribbon-height",
          "0px",
        );
      }
    } else {
      document.documentElement.style.setProperty(
        "--kicc-announcement-ribbon-height",
        "0px",
      );
    }

    if (top > 0) {
      document.documentElement.style.setProperty(
        "--kicc-sticky-nav-top",
        top + "px",
      );
    }
  };

  const queueStickyNavOffsetSync = () => {
    if (stickyNavOffsetTick) return;
    stickyNavOffsetTick = true;
    requestAnimationFrame(function () {
      syncStickyNavOffset();
      stickyNavOffsetTick = false;
    });
  };

  const initPageSectionNavDock = () => {
    const nav = document.querySelector(PAGE_SECTION_NAV_SELECTOR);
    if (!nav || nav.classList.contains("page-section-nav-dock--ready")) return;

    nav.classList.add("page-section-nav-dock--ready");
    document.body.classList.add("has-page-section-nav");
    document.body.appendChild(nav);

    const tracks = [];
    nav.querySelectorAll(
      ".madrasa-section-nav-list, .about-section-nav-list, .campaign-section-nav-list, .programmes-section-nav-list, .contact-section-nav-list"
    ).forEach(function (list) {
      list.classList.add("page-section-nav-track");

      const indicator = document.createElement("span");
      indicator.className = "page-section-nav-indicator";
      indicator.setAttribute("aria-hidden", "true");
      list.insertBefore(indicator, list.firstChild);

      list.querySelectorAll("li").forEach(function (li, index) {
        li.style.setProperty("--pill-i", index);
      });

      tracks.push({ list: list, indicator: indicator });
    });

    window.addEventListener("resize", syncPageSectionNavMetrics, {
      passive: true,
    });

    const links = nav.querySelectorAll('a[href^="#"]');
    const sections = [];
    links.forEach(function (link) {
      const id = decodeURIComponent(link.getAttribute("href").slice(1));
      const el = document.getElementById(id);
      if (el) sections.push({ link: link, el: el });
    });

    if (sections.length === 0) return;

    let activeItem = sections[0];
    let scrollTicking = false;

    const getTrackForLink = (link) => {
      return tracks.find(function (track) {
        return track.list.contains(link);
      });
    };

    const getLinkMetrics = (link, list) => {
      const linkRect = link.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      return {
        contentLeft: linkRect.left - listRect.left + list.scrollLeft,
        width: linkRect.width,
        viewportLeft: linkRect.left,
        viewportRight: linkRect.right,
        listLeft: listRect.left,
        listRight: listRect.right,
      };
    };

    const updateIndicator = (link) => {
      const track = getTrackForLink(link);
      if (!track) return;

      const metrics = getLinkMetrics(link, track.list);
      track.indicator.style.width = metrics.width + "px";
      track.indicator.style.left = metrics.contentLeft + "px";
    };

    const markIndicatorsPositioned = () => {
      tracks.forEach(function (track) {
        track.indicator.classList.add("is-positioned");
      });
    };

    const layoutIndicator = () => {
      if (!activeItem) return;
      updateIndicator(activeItem.link);
      markIndicatorsPositioned();
    };

    const scrollActiveIntoView = (link, forceCenter) => {
      const track = getTrackForLink(link);
      if (!track) return;

      const list = track.list;
      if (list.scrollWidth <= list.clientWidth + 2) return;

      if (forceCenter) {
        link.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
        return;
      }

      const metrics = getLinkMetrics(link, list);
      const edgePad = 20;
      const needsScroll =
        metrics.viewportRight > metrics.listRight - edgePad ||
        metrics.viewportLeft < metrics.listLeft + edgePad;

      if (needsScroll) {
        link.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    };

    const setActiveLink = (nextItem, fromScroll) => {
      if (!nextItem) return;

      const changed = activeItem !== nextItem;
      activeItem = nextItem;
      sections.forEach(function (item) {
        item.link.classList.toggle("is-active", item === nextItem);
      });

      updateIndicator(nextItem.link);

      if (changed) {
        scrollActiveIntoView(nextItem.link, true);
      } else if (fromScroll) {
        scrollActiveIntoView(nextItem.link, false);
      }
    };

    const scheduleIndicatorLayout = () => {
      layoutIndicator();
      requestAnimationFrame(layoutIndicator);
    };

    const resolveActiveSection = () => {
      const probeLine = window.scrollY + window.innerHeight * 0.32;
      let current = sections[0];

      sections.forEach(function (item) {
        const sectionTop = item.el.getBoundingClientRect().top + window.scrollY;
        if (sectionTop <= probeLine + 8) {
          current = item;
        }
      });

      return current;
    };

    const onScrollSpy = () => {
      setActiveLink(resolveActiveSection(), true);
    };

    const queueScrollSpy = () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(function () {
        onScrollSpy();
        scrollTicking = false;
      });
    };

    window.addEventListener("scroll", queueScrollSpy, { passive: true });
    window.addEventListener(
      "resize",
      function () {
        updateIndicator(activeItem.link);
      },
      { passive: true }
    );

    tracks.forEach(function (track) {
      track.list.addEventListener(
        "scroll",
        function () {
          updateIndicator(activeItem.link);
        },
        { passive: true }
      );
    });

    links.forEach(function (link) {
      link.addEventListener("click", function () {
        const id = decodeURIComponent(link.getAttribute("href").slice(1));
        const el = document.getElementById(id);
        const item = sections.find(function (entry) {
          return entry.el === el;
        });
        if (item) {
          sections.forEach(function (entry) {
            entry.link.classList.toggle("is-active", entry === item);
          });
          activeItem = item;
          updateIndicator(item.link);
          scrollActiveIntoView(item.link, true);
        }
      });
    });

    onScrollSpy();

    requestAnimationFrame(function () {
      nav.classList.add("is-visible");
      syncPageSectionNavMetrics();
      setActiveLink(resolveActiveSection(), false);
      scheduleIndicatorLayout();
    });

    /* Pill entrance animation runs up to ~0.7s after is-visible — re-measure then */
    window.setTimeout(scheduleIndicatorLayout, 720);

    nav.addEventListener(
      "transitionend",
      function (event) {
        if (event.propertyName === "transform") scheduleIndicatorLayout();
      },
      { once: true }
    );
  };

  const initSiteActionDock = () => {
    if (document.querySelector(".site-action-dock")) return;

    document.querySelector(".whatsapp-float")?.remove();
    document.querySelector(".back-to-top")?.remove();

    const dock = document.createElement("aside");
    dock.className = "site-action-dock";
    dock.setAttribute("aria-label", "Quick actions");

    const waLink = document.createElement("a");
    waLink.href = "https://wa.me/353862440556";
    waLink.target = "_blank";
    waLink.rel = "noopener noreferrer";
    waLink.className = "site-action-btn site-action-btn--whatsapp";
    waLink.setAttribute("aria-label", "Chat on WhatsApp");
    waLink.style.setProperty("--action-i", "0");
    waLink.innerHTML =
      '<span class="site-action-btn-icon" aria-hidden="true"><i class="fa-brands fa-whatsapp"></i></span>' +
      '<span class="site-action-btn-label">WhatsApp</span>';

    const donateLink = document.createElement("a");
    donateLink.href = "https://kicc.page.link/gfm";
    donateLink.target = "_blank";
    donateLink.rel = "noopener noreferrer";
    donateLink.className = "site-action-btn site-action-btn--donate";
    donateLink.setAttribute("aria-label", "Donate to the masjid");
    donateLink.style.setProperty("--action-i", "1");
    donateLink.innerHTML =
      '<span class="site-action-btn-icon" aria-hidden="true"><i class="fas fa-hand-holding-heart"></i></span>' +
      '<span class="site-action-btn-label">Donate</span>';

    const topBtn = document.createElement("button");
    topBtn.type = "button";
    topBtn.className = "site-action-btn site-action-btn--top";
    topBtn.setAttribute("aria-label", "Back to top");
    topBtn.style.setProperty("--action-i", "2");
    topBtn.innerHTML =
      '<span class="site-action-btn-icon" aria-hidden="true"><i class="fas fa-arrow-up"></i></span>' +
      '<span class="site-action-btn-label">Top</span>';

    topBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const toggleTopVisibility = () => {
      topBtn.classList.toggle("is-visible", window.scrollY > 400);
    };

    window.addEventListener("scroll", toggleTopVisibility, { passive: true });
    toggleTopVisibility();

    dock.appendChild(waLink);
    dock.appendChild(donateLink);
    dock.appendChild(topBtn);
    document.body.appendChild(dock);

    requestAnimationFrame(function () {
      dock.classList.add("is-visible");
    });
  };

  const CAMPAIGNS_API_URL =
    "https://getcampaigns-rds3nxm6za-ew.a.run.app";
  const CAMPAIGN_PROGRESS_KEY = "kicc-campaign-progress";

  const formatFundraiserAmount = (amount, currencyCode) => {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: currencyCode || "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const applyFundraiserProgress = (fundraiser) => {
    const goal = Number(fundraiser.goalAmount.amount);
    const raised = Number(fundraiser.currentAmount.amount);
    const currencyCode =
      fundraiser.goalAmount.currencyCode ||
      fundraiser.currentAmount.currencyCode ||
      "EUR";
    const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
    const pctLabel = pct.toFixed(1).replace(/\.0$/, "");

    document.querySelectorAll("[data-gfm-progress]").forEach((el) => {
      const nameEl = el.querySelector("[data-gfm-name]");
      const raisedEl = el.querySelector("[data-gfm-raised]");
      const goalEl = el.querySelector("[data-gfm-goal]");
      const fillEl = el.querySelector("[data-gfm-fill]");
      const pctEl = el.querySelector("[data-gfm-percent]");
      const trackEl = el.querySelector("[data-gfm-track]");

      el.dataset.gfmRaised = String(raised);
      el.dataset.gfmGoal = String(goal);
      el.dataset.gfmCurrency = currencyCode;
      el.dataset.gfmPct = String(pct);
      el.dataset.gfmPctLabel = pctLabel;

      if (nameEl) nameEl.textContent = fundraiser.fundName;
      if (goalEl) {
        goalEl.textContent =
          "raised of " + formatFundraiserAmount(goal, currencyCode) + " goal";
      }
      if (trackEl) {
        trackEl.setAttribute("aria-valuemin", "0");
        trackEl.setAttribute("aria-valuemax", "100");
        trackEl.setAttribute(
          "aria-label",
          "Campaign " + pctLabel + "% funded"
        );
      }

      if (el.classList.contains("gfm-progress-enhanced")) {
        const remainingEl = el.querySelector("[data-gfm-remaining]");
        if (remainingEl) {
          const remaining = Math.max(0, goal - raised);
          remainingEl.textContent =
            formatFundraiserAmount(remaining, currencyCode) + " to go";
          remainingEl.hidden = remaining <= 0;
        }
        if (el.classList.contains("gfm-progress-is-visible")) {
          animateEnhancedFundraiserWidget(el);
        }
        return;
      }

      if (raisedEl) raisedEl.textContent = formatFundraiserAmount(raised, currencyCode);
      if (fillEl) fillEl.style.width = pct + "%";
      if (pctEl) pctEl.textContent = pctLabel;
      if (trackEl) trackEl.setAttribute("aria-valuenow", pctLabel);
      el.classList.remove("gfm-progress-loading");
    });
  };

  const animateEnhancedFundraiserWidget = (el) => {
    if (el.dataset.gfmAnimDone === "true") return;

    const raised = Number(el.dataset.gfmRaised);
    const goal = Number(el.dataset.gfmGoal);
    const currencyCode = el.dataset.gfmCurrency || "EUR";
    const pct = Number(el.dataset.gfmPct);
    const pctLabel = el.dataset.gfmPctLabel || "0";
    const remaining = Math.max(0, goal - raised);

    const raisedEl = el.querySelector("[data-gfm-raised]");
    const fillEl = el.querySelector("[data-gfm-fill]");
    const pctEl = el.querySelector("[data-gfm-percent]");
    const trackEl = el.querySelector("[data-gfm-track]");
    const remainingEl = el.querySelector("[data-gfm-remaining]");

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const duration = prefersReducedMotion ? 0 : 1400;

    el.classList.remove("gfm-progress-loading");

    if (duration === 0) {
      if (raisedEl) raisedEl.textContent = formatFundraiserAmount(raised, currencyCode);
      if (fillEl) fillEl.style.width = pct + "%";
      if (pctEl) pctEl.textContent = pctLabel;
      if (trackEl) trackEl.setAttribute("aria-valuenow", pctLabel);
      if (remainingEl && remaining > 0) {
        remainingEl.textContent =
          formatFundraiserAmount(remaining, currencyCode) + " to go";
        remainingEl.hidden = false;
      }
      el.classList.add("gfm-progress-ready");
      el.dataset.gfmAnimDone = "true";
      signalFundraiserDonateReady(el);
      return;
    }

    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const currentRaised = raised * eased;
      const currentPct = pct * eased;

      if (raisedEl) {
        raisedEl.textContent = formatFundraiserAmount(currentRaised, currencyCode);
      }
      if (fillEl) fillEl.style.width = currentPct + "%";
      if (pctEl) pctEl.textContent = currentPct.toFixed(1).replace(/\.0$/, "");
      if (remainingEl && remaining > 0) {
        remainingEl.hidden = false;
        remainingEl.textContent =
          formatFundraiserAmount(Math.max(0, goal - currentRaised), currencyCode) +
          " to go";
      }
      if (trackEl) {
        trackEl.setAttribute(
          "aria-valuenow",
          currentPct.toFixed(1).replace(/\.0$/, "")
        );
      }

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        if (raisedEl) raisedEl.textContent = formatFundraiserAmount(raised, currencyCode);
        if (fillEl) fillEl.style.width = pct + "%";
        if (pctEl) pctEl.textContent = pctLabel;
        if (trackEl) trackEl.setAttribute("aria-valuenow", pctLabel);
        el.classList.add("gfm-progress-ready");
        el.dataset.gfmAnimDone = "true";
        signalFundraiserDonateReady(el);
      }
    };

    requestAnimationFrame(tick);
  };

  const signalFundraiserDonateReady = (widget) => {
    const heroPanel = widget.closest(".campaign-hero-enter");
    if (heroPanel) heroPanel.classList.add("is-donate-ready");

    const homeDonate = widget.closest(".home-donate-enter");
    if (homeDonate) homeDonate.classList.add("is-donate-ready");

    widget.dispatchEvent(
      new CustomEvent("gfm-progress-ready", { bubbles: true })
    );
  };

  const initAboutPageMotion = () => {
    if (!isAboutPage()) return;

    const hero = document.querySelector(".about-hero-enter");
    if (hero) {
      requestAnimationFrame(function () {
        hero.classList.add("is-visible");
      });
    }

    const statsSection = document.querySelector(".about-stats-enter");
    if (statsSection) {
      const revealStats = () => {
        statsSection.classList.add("is-visible");
        statsSection.querySelectorAll("[data-count]").forEach(function (el) {
          if (el.dataset.counted) return;
          el.dataset.counted = "true";
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.countSuffix || "";
          const col = el.closest(".about-stat-reveal");
          if (!target || isNaN(target)) return;

          const duration = 1400;
          const start = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (progress < 1) {
              requestAnimationFrame(tick);
            } else if (col) {
              col.classList.add("is-counted");
            }
          };
          requestAnimationFrame(tick);
        });
      };

      if (!("IntersectionObserver" in window)) {
        revealStats();
      } else {
        const statsObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                revealStats();
                statsObserver.disconnect();
              }
            });
          },
          { threshold: 0.3 }
        );
        statsObserver.observe(statsSection);
      }
    }

    const quoteSection = document.querySelector(".about-quote-enter");
    if (quoteSection) {
      const revealQuote = () => quoteSection.classList.add("is-visible");
      if (!("IntersectionObserver" in window)) {
        revealQuote();
      } else {
        const quoteObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                revealQuote();
                quoteObserver.disconnect();
              }
            });
          },
          { threshold: 0.25 }
        );
        quoteObserver.observe(quoteSection);
      }
    }

    const milestones = document.querySelector(".about-milestones-animate");
    if (milestones) {
      const revealMilestones = () => milestones.classList.add("is-visible");
      if (!("IntersectionObserver" in window)) {
        revealMilestones();
      } else {
        const milestoneObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                revealMilestones();
                milestoneObserver.disconnect();
              }
            });
          },
          { threshold: 0.2 }
        );
        milestoneObserver.observe(milestones);
      }
    }

    const revealSelectors = [
      ".about-reveal",
      ".about-service-reveal",
      ".about-team-reveal",
      ".about-visit-reveal",
    ].join(",");

    document.querySelectorAll(revealSelectors).forEach(function (el) {
      el.classList.add("about-motion-target");
    });

    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".about-motion-target").forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(".about-motion-target").forEach(function (el) {
      revealObserver.observe(el);
    });
  };

  const initCampaignPageMotion = () => {
    if (!isProjectsPage()) return;

    const hero = document.querySelector(".campaign-hero-enter");
    if (hero) {
      requestAnimationFrame(function () {
        hero.classList.add("is-visible");
      });
    }

    document.querySelectorAll("#project-campaign .campaign-section").forEach(
      function (section, index) {
        section.classList.add("campaign-reveal");
        section.style.setProperty("--reveal-i", String(index % 6));
      }
    );

    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".campaign-reveal").forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(".campaign-reveal").forEach(function (el) {
      revealObserver.observe(el);
    });

    window.setTimeout(function () {
      const hero = document.querySelector(".campaign-hero-enter");
      if (hero && !hero.classList.contains("is-donate-ready")) {
        hero.classList.add("is-donate-ready");
      }
    }, 4500);
  };

  const initHomeDonateMotion = () => {
    if (!isHomePage()) return;

    const section = document.querySelector(".home-donate-enter");
    if (!section) return;

    const reveal = () => section.classList.add("is-visible");

    const donateReadyFallback = () => {
      window.setTimeout(function () {
        if (!section.classList.contains("is-donate-ready")) {
          section.classList.add("is-donate-ready");
        }
      }, 4500);
    };

    if (!("IntersectionObserver" in window)) {
      reveal();
      donateReadyFallback();
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            reveal();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(section);
    donateReadyFallback();
  };

  const initEnhancedFundraiserWidgets = () => {
    document.querySelectorAll(".gfm-progress-enhanced[data-gfm-progress]").forEach(
      function (widget) {
        const reveal = () => {
          widget.classList.add("gfm-progress-is-visible");
          if (widget.dataset.gfmRaised) {
            animateEnhancedFundraiserWidget(widget);
          }
        };

        if (widget.classList.contains("gfm-progress-campaign")) {
          reveal();
          return;
        }

        if (!("IntersectionObserver" in window)) {
          reveal();
          return;
        }

        const observer = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                reveal();
                observer.disconnect();
              }
            });
          },
          { threshold: 0.3 }
        );
        observer.observe(widget);
      }
    );
  };

  const loadFundraiserProgress = () => {
    const widgets = document.querySelectorAll("[data-gfm-progress]");
    if (!widgets.length) return;

    try {
      const cached = kiccStorageGet(localStorage, CAMPAIGN_PROGRESS_KEY);
      if (cached) {
        applyFundraiserProgress(JSON.parse(cached));
      }
    } catch (e) {
      console.warn("Unable to read campaign progress cache", e);
    }

    fetch(CAMPAIGNS_API_URL)
      .then((response) => {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then((json) => {
        const fundraiser = json && json.data && json.data.fundraiser;
        if (!fundraiser) throw new Error("No fundraiser data");
        try {
          kiccStorageSet(localStorage, CAMPAIGN_PROGRESS_KEY, JSON.stringify(fundraiser));
        } catch (e) {
          console.warn("Unable to cache campaign progress", e);
        }
        applyFundraiserProgress(fundraiser);
      })
      .catch((err) => {
        console.error("Error loading campaign progress", err);
        widgets.forEach((el) => {
          if (!el.classList.contains("gfm-progress-loading")) return;
          const nameEl = el.querySelector("[data-gfm-name]");
          if (nameEl) {
            nameEl.textContent =
              "Help Complete Kerry Islamic Cultural Centre this Year!";
          }
          el.classList.remove("gfm-progress-loading");
          signalFundraiserDonateReady(el);
        });
      });
  };

  const initHomePillars = () => {
    if (!isHomePage()) return;

    const layout = document.querySelector(".pillars-faith-layout");
    if (layout) {
      const tabs = layout.querySelectorAll('[role="tab"]');
      const panels = layout.querySelectorAll('[role="tabpanel"]');

      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          const id = tab.getAttribute("data-faith-tab");
          tabs.forEach(function (t) {
            const active = t === tab;
            t.classList.toggle("is-active", active);
            t.setAttribute("aria-selected", active ? "true" : "false");
            t.tabIndex = active ? 0 : -1;
          });
          panels.forEach(function (panel) {
            const active = panel.getAttribute("data-faith-panel") === id;
            panel.classList.toggle("is-active", active);
            panel.hidden = !active;
          });
        });
      });
    }

    const islamTriggers = document.querySelectorAll(".pillars-islam-pillar-trigger");
    const islamMobileQuery = window.matchMedia("(max-width: 767px)");

    islamTriggers.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const pillar = btn.closest(".pillars-islam-pillar");
        if (!pillar) return;
        const expanded = pillar.classList.toggle("is-expanded");
        btn.setAttribute("aria-expanded", expanded ? "true" : "false");
        if (islamMobileQuery.matches) {
          document.querySelectorAll(".pillars-islam-pillar.is-expanded").forEach(function (p) {
            if (p !== pillar) {
              p.classList.remove("is-expanded");
              const otherBtn = p.querySelector(".pillars-islam-pillar-trigger");
              if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
            }
          });
        }
      });
    });

    const revealEls = document.querySelectorAll(".pillars-reveal");
    if (!revealEls.length) return;

    if (!("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" },
    );

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });

    initMasjidServices();
  };

  const initMasjidServices = () => {
    if (!isHomePage()) return;

    const section = document.getElementById("masjid-services");
    if (!section) return;

    const hub = section.querySelector(".home-services-hub");
    if (hub) {
      const tabs = hub.querySelectorAll('[role="tab"]');
      const panels = hub.querySelectorAll('[role="tabpanel"]');

      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          const id = tab.getAttribute("data-services-tab");
          tabs.forEach(function (t) {
            const active = t === tab;
            t.classList.toggle("is-active", active);
            t.setAttribute("aria-selected", active ? "true" : "false");
            t.tabIndex = active ? 0 : -1;
          });
          panels.forEach(function (panel) {
            panel.classList.remove("is-active");
            panel.hidden = true;
          });
          const activePanel = hub.querySelector(
            '[data-services-panel="' + id + '"]',
          );
          if (activePanel) {
            activePanel.hidden = false;
            void activePanel.offsetWidth;
            activePanel.classList.add("is-active");
          }
        });
      });
    }

    const cards = section.querySelectorAll(".home-services-card");
    let highlightIdx = 0;
    let highlightTimer = null;

    const setHighlight = function (idx) {
      cards.forEach(function (card, i) {
        card.classList.toggle("is-highlighted", i === idx);
      });
    };

    if (cards.length) {
      setHighlight(0);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        highlightTimer = window.setInterval(function () {
          highlightIdx = (highlightIdx + 1) % cards.length;
          setHighlight(highlightIdx);
        }, 4000);
      }

      cards.forEach(function (card, i) {
        card.addEventListener("mouseenter", function () {
          if (highlightTimer) {
            window.clearInterval(highlightTimer);
            highlightTimer = null;
          }
          setHighlight(i);
        });
      });

      section.addEventListener("mouseleave", function () {
        if (highlightTimer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          return;
        }
        highlightTimer = window.setInterval(function () {
          highlightIdx = (highlightIdx + 1) % cards.length;
          setHighlight(highlightIdx);
        }, 4000);
      });
    }

    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      cards.forEach(function (card) {
        card.addEventListener("mousemove", function (e) {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          card.style.transform =
            "perspective(800px) rotateY(" +
            x * 10 +
            "deg) rotateX(" +
            -y * 10 +
            "deg) translateY(-4px)";
        });
        card.addEventListener("mouseleave", function () {
          card.style.transform = "";
        });
      });
    }

    const serviceReveals = section.querySelectorAll(".services-reveal");
    if (!serviceReveals.length) return;

    if (!("IntersectionObserver" in window)) {
      serviceReveals.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    const servicesObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            servicesObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -24px 0px" },
    );

    serviceReveals.forEach(function (el) {
      servicesObserver.observe(el);
    });
  };

  const initMobileNav = () => {
    const nav = document.querySelector(".kicc-nav-v2");
    const collapseEl = document.getElementById("navbarResponsive");
    if (!nav || !collapseEl || typeof $ === "undefined") return;

    const mobileQuery = window.matchMedia("(max-width: 991.98px)");

    let backdrop = document.querySelector(".kicc-nav-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "kicc-nav-backdrop";
      backdrop.setAttribute("aria-hidden", "true");
      document.body.appendChild(backdrop);
    }

    const closeOpenDropdowns = () => {
      nav.querySelectorAll(".dropdown.show").forEach(function (dropdown) {
        dropdown.classList.remove("show");
        var menu = dropdown.querySelector(".dropdown-menu");
        var toggle = dropdown.querySelector(".dropdown-toggle");
        if (menu) menu.classList.remove("show");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      });
    };

    const closeNav = () => {
      if ($(collapseEl).hasClass("show")) {
        $(collapseEl).collapse("hide");
      }
    };

    backdrop.addEventListener("click", closeNav);

    $(collapseEl)
      .on("shown.bs.collapse", function () {
        backdrop.classList.add("is-visible");
        document.body.classList.add("kicc-nav-open");
        queueStickyNavOffsetSync();
      })
      .on("hidden.bs.collapse", function () {
        backdrop.classList.remove("is-visible");
        document.body.classList.remove("kicc-nav-open");
        closeOpenDropdowns();
        queueStickyNavOffsetSync();
      });

    nav.querySelectorAll(
      ".kicc-nav-mega-link, .kicc-nav-main > .nav-item:not(.dropdown) .kicc-nav-link, .kicc-nav-donate-btn, .kicc-nav-salah-tab-month",
    ).forEach(function (link) {
      link.addEventListener("click", function () {
        if (mobileQuery.matches) closeNav();
      });
    });

    nav.querySelectorAll(".dropdown").forEach(function (dropdownEl) {
      $(dropdownEl).on("show.bs.dropdown", function () {
        if (!mobileQuery.matches) return;
        var menu = dropdownEl.querySelector(".dropdown-menu");
        if (!menu) return;
        menu.style.position = "static";
        menu.style.transform = "none";
        menu.style.willChange = "auto";
      });
    });

    nav.querySelectorAll(".kicc-nav-mega-item > .dropdown-toggle").forEach(
      function (toggle) {
        toggle.addEventListener("click", function (e) {
          if (!mobileQuery.matches) return;
          e.preventDefault();
        });
      },
    );
  };

  const setLocationSpecific = () => {
    if (isHomePage()) {
      setEvent();
      loadProgrammes();
      return;
    }
    if (isActivitiesPage()) {
      setEvent();
      loadProgrammes();
      return;
    }
    if (isProjectsPage()) {
      initBaguetteBox();
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (isHomePage()) {
      showNotices();
      initHomeNotices();
      initHomePillars();
    }
    initSiteAnnouncements();
    initNavSalahPanel();
    initEnhancedFundraiserWidgets();
    initCampaignPageMotion();
    initAboutPageMotion();
    initHomeDonateMotion();
    initMobileNav();
    syncStickyNavOffset();
    window.addEventListener("resize", queueStickyNavOffsetSync, {
      passive: true,
    });
    initPageSectionNavDock();
    addWhatsAppButton();
    addBackToTopButton();
    setFooterYear();
    showCookiePolicy();
    initConsentEmbeds();
  });

  window.onload = () => {
    syncStickyNavOffset();
    setSalahTimeUrl();
    setSalahTimes();
    getRandomHadith();
    loadFundraiserProgress();
    setLocationSpecific();
    scrollToLocationHash();
  };
})();
