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

  const isPrayerTimesPage = () => /\/prayer-times\.html$/i.test(getPathname());

  const getPageKey = () => {
    if (isHomePage()) return "home";
    if (isActivitiesPage()) return "activities";
    if (isMadrasaPage()) return "madrasa";
    if (isProjectsPage()) return "projects";
    if (isAboutPage()) return "about";
    if (isContactPage()) return "contact";
    if (isPrayerTimesPage()) return "prayer-times";
    return null;
  };

  const scrollToLocationHash = () => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    const id = decodeURIComponent(hash.slice(1));
    const target = document.getElementById(id);
    if (!target) return;

    const scrollToTarget = () => {
      syncStickyNavOffset();
      syncPageSectionNavMetrics();
      target.scrollIntoView({ behavior: "auto", block: "start" });
    };

    requestAnimationFrame(function () {
      requestAnimationFrame(scrollToTarget);
    });
  };

  const isExternalHref = (href) => {
    if (!href || typeof href !== "string") return false;
    var trimmed = href.trim();
    if (
      !trimmed ||
      trimmed === "#" ||
      trimmed.indexOf("#") === 0 ||
      trimmed.indexOf("mailto:") === 0 ||
      trimmed.indexOf("tel:") === 0 ||
      trimmed.indexOf("javascript:") === 0
    ) {
      return false;
    }
    if (trimmed.indexOf("/") === 0 && trimmed.indexOf("//") !== 0) return false;
    try {
      return new URL(trimmed, window.location.href).origin !== window.location.origin;
    } catch (e) {
      return /^https?:\/\//i.test(trimmed);
    }
  };

  const shouldSkipExternalLinkIcon = (link) => {
    if (!link) return false;
    if (link.dataset.skipExternalIcon === "true") return true;
    if (!link.closest) return false;
    return !!link.closest(
      "#noticeContainer, #masjid-notice-spotlight, #notice-board",
    );
  };

  const initExternalLinkIcons = (root) => {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll("a[href]").forEach(function (link) {
      if (shouldSkipExternalLinkIcon(link)) return;
      if (link.dataset.externalIcon === "true") return;
      if (!isExternalHref(link.getAttribute("href"))) return;
      if (
        link.querySelector(
          ".fa-external-link-alt, .fa-up-right-from-square, .kicc-external-icon",
        )
      ) {
        link.dataset.externalIcon = "true";
        return;
      }
      var arrow = link.querySelector(".fa-arrow-right");
      if (arrow) {
        arrow.className = "fas fa-external-link-alt kicc-external-icon";
        arrow.setAttribute("aria-hidden", "true");
        link.dataset.externalIcon = "true";
        return;
      }
      var icon = document.createElement("i");
      icon.className = "fas fa-external-link-alt kicc-external-icon";
      icon.setAttribute("aria-hidden", "true");
      link.appendChild(document.createTextNode("\u00a0"));
      link.appendChild(icon);
      link.dataset.externalIcon = "true";
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
  const FUNCTIONAL_SESSION_KEYS = [
    "kicc-notices-spotlight-dismissed",
    "kicc-announcements-dismissed",
  ];
  const BREAKING_DISMISS_PREFIX = "kicc-breaking-dismiss-";
  const ANNOUNCEMENTS_SESSION_DISMISS_KEY = "kicc-announcements-dismissed";

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

  const SALAH_TIMES_API_URL = "https://getsalahtimes-rds3nxm6za-ew.a.run.app";

  const fetchSalahTimesAssetUrl = (month, year, options) => {
    const opts = options || {};
    const ramadan =
      opts.isRamadan != null ? opts.isRamadan : isRamadan();
    const url = new URL(SALAH_TIMES_API_URL);
    url.searchParams.set("month", month);
    url.searchParams.set("year", String(year));
    url.searchParams.set("isRamadan", String(ramadan));

    return fetch(url.toString())
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (json) {
        const data = json && json.data;
        if (!Array.isArray(data) || !data.length || !data[0].url) {
          return null;
        }
        return data[0].url;
      });
  };

  const getDefaultSalahTimesPeriod = () => {
    const targetDate = addDays(getToday(), 3);
    return {
      month: targetDate.toLocaleString("en-GB", { month: "long" }),
      year: targetDate.getFullYear(),
      isRamadan: isRamadan(),
    };
  };

  const getSalahTimesMonthLabel = (monthName) => {
    if (monthName) return String(monthName).trim();
    if (isRamadan()) return "Ramadan";
    return getDefaultSalahTimesPeriod().month;
  };

  const formatOfficialTimetableLabel = (monthName) => {
    const month = getSalahTimesMonthLabel(monthName);
    return month ? "Download " + month + " Timetable" : "Download Timetable";
  };

  const setOfficialTimetableLabels = (monthName) => {
    const label = formatOfficialTimetableLabel(monthName);
    document.querySelectorAll("[data-official-timetable-label]").forEach(function (el) {
      el.textContent = label;
    });
  };

  const setSalahTimeUrl = () => {
    const SALAH_TIMES_KEY = "salahTimesAssetUrl";

    // 1) Try to use cached URL first (non-blocking)
    try {
      const cached = kiccStorageGet(localStorage, SALAH_TIMES_KEY);
      if (cached) {
        console.log("Using cached salah times URL:", cached);
        applySalahTimesUrl(
          cached,
          isPrayerTimesPage() ? "nav" : "all",
        );
      }
    } catch (e) {
      console.warn("Unable to read localStorage", e);
    }

    // 2) Always call API to refresh the default period (today + 3 days)
    let period;
    try {
      period = getDefaultSalahTimesPeriod();
    } catch (e) {
      console.error("Error computing target date", e);
      return;
    }

    fetchSalahTimesAssetUrl(period.month, period.year, {
      isRamadan: period.isRamadan,
    })
      .then(function (asset) {
        if (!asset) {
          console.error("No salah times data returned");
          return;
        }

        console.log("Latest salah times URL from API:", asset);
        applySalahTimesUrl(
          asset,
          isPrayerTimesPage() ? "nav" : "all",
        );

        try {
          kiccStorageSet(localStorage, SALAH_TIMES_KEY, asset);
        } catch (e) {
          console.warn("Unable to write localStorage", e);
        }
      })
      .catch(function (error) {
        console.error("Error loading salah times", error);
      });
  };

  const applySalahTimesUrl = (asset, scope) => {
    const mode = scope || "all";
    const elMain = document.getElementById("salah-times");
    const elBody = document.getElementById("salah-times-body");
    const elHeroQuickPdf = document.getElementById("prayer-hero-quick-pdf");

    if (elMain) elMain.href = asset;
    if (mode === "nav") return;
    if (elHeroQuickPdf) elHeroQuickPdf.href = asset;
    if (elBody && (isHomePage() || isPrayerTimesPage())) {
      elBody.href = asset;
    }
  };

  const setLiveStreamStatus = () => {
    const liveNowEl = document.getElementById("live-now");
    if (!liveNowEl) return;

    const setBadge = (html) => {
      liveNowEl.innerHTML = html;
    };

    if (!hasCookieConsent() || !canUseThirdPartyEmbeds()) {
      setBadge(
        '<span class="programmes-live-badge is-offline">Stream paused</span>',
      );
      return;
    }

    fetch("https://api.mixlr.com/users/7752720?source=embed")
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((mixlrData) => {
        const isLive = !!mixlrData.is_live;
        setBadge(
          isLive
            ? '<span class="programmes-live-badge is-live"><span aria-hidden="true">●</span> On air</span>'
            : '<span class="programmes-live-badge is-offline">Off air</span>',
        );
      })
      .catch((err) => {
        console.error("Error loading Mixlr live status", err);
        setBadge(
          '<span class="programmes-live-badge is-offline">Off air</span>',
        );
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
      if (ampm === "pm" && hh !== 12) hh += 12;
      if (ampm === "am" && hh === 12) hh = 0;
    }
    base.setHours(hh, mm, 0, 0);
    return base;
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
  let cachedPrayerDayMap = null;
  let cachedSalahEvents = null;
  let prayerHighlightTimer = null;
  let prayerCarouselBuilt = false;
  let prayerCarouselUserScrolling = false;
  let prayerCarouselScrollTimer = null;
  let prayerCarouselNormalizeTimer = null;
  let prayerCarouselJumping = false;

  const PRAYER_DAY_RADIUS = 30;
  const PRAYER_CAROUSEL_REPEAT = 3;
  const PRAYER_CAROUSEL_PRIMARY = 1;
  const SUNRISE_FORBIDDEN_MINUTES = 15;
  const ZAWAAL_BEFORE_ZOHR_MINUTES = 10;

  const PRAYER_DECK_ICONS = {
    fajr: "fa-cloud-sun",
    dhuhr: "fa-sun",
    asr: "fa-cloud-sun-rain",
    maghrib: "fa-moon",
    isha: "fa-star-and-crescent",
  };

  const makeDayKeyFromParts = (year, month, day) =>
    year + "-" + month + "-" + day;

  const makeDayKeyFromRecord = (record) =>
    makeDayKeyFromParts(
      record.gregorianYear,
      record.gregorianMonth,
      record.gregorianDay,
    );

  const makeDayKeyFromDate = (date) =>
    makeDayKeyFromParts(date.getFullYear(), date.getMonth(), date.getDate());

  const getDublinDateWithOffset = (dayOffset) => {
    const d = getDublinDate();
    if (dayOffset) {
      d.setDate(d.getDate() + dayOffset);
    }
    return d;
  };

  const getDayRecordForOffset = (dayOffset) => {
    if (!cachedPrayerDayMap) return null;
    const key = makeDayKeyFromDate(getDublinDateWithOffset(dayOffset));
    return cachedPrayerDayMap[key] || null;
  };

  const IQAMAH_MONTH_PREFIX = "iqamah-month-";

  const getIqamahMonthsAroundToday = () => {
    const dublin = getDublinDate();
    const seen = Object.create(null);
    const months = [];
    for (let offset = -1; offset <= 1; offset += 1) {
      const d = new Date(dublin.getFullYear(), dublin.getMonth() + offset, 1);
      const parts = getIrelandDateParts(d);
      const id = parts.year + "-" + parts.monthName;
      if (!seen[id]) {
        seen[id] = true;
        months.push({ year: parts.year, monthName: parts.monthName });
      }
    }
    return months;
  };

  const clearIqamahMonthStorage = () => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const key = localStorage.key(i);
        if (key && key.indexOf(IQAMAH_MONTH_PREFIX) === 0) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // ignore storage errors
    }
  };

  const buildMonthUrl = (year, monthName) =>
    IQAMAH_API_URL +
    "?year=" +
    year +
    "&month=" +
    encodeURIComponent(monthName);

  const fetchIqamahMonth = (year, monthName) => {
    const storageKey = "iqamah-month-" + year + "-" + monthName;
    const cached = kiccStorageGet(localStorage, storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (
          parsed &&
          parsed.year === year &&
          parsed.month === monthName &&
          Array.isArray(parsed.data)
        ) {
          return Promise.resolve(parsed.data);
        }
      } catch (e) {
        console.warn("Failed to parse cached iqamah month", storageKey, e);
      }
    }

    return fetch(buildMonthUrl(year, monthName))
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.json();
      })
      .then(function (json) {
        if (!json || !Array.isArray(json.data)) {
          throw new Error("No iqamah month data");
        }
        try {
          kiccStorageSet(
            localStorage,
            storageKey,
            JSON.stringify({
              year: year,
              month: monthName,
              data: json.data,
            }),
          );
        } catch (e) {
          console.warn("Unable to cache iqamah month", storageKey, e);
        }
        return json.data;
      });
  };

  const parseTimeOnRecord = (record, field, dayOffset) => {
    if (!record || !record[field]) return null;
    const base = getDublinDate();
    base.setFullYear(
      record.gregorianYear,
      record.gregorianMonth,
      record.gregorianDay,
    );
    if (dayOffset) {
      base.setDate(base.getDate() + dayOffset);
    }
    const t = String(record[field]).trim().toLowerCase();
    const m = t.match(/^(\d{1,2}):(\d{2})(?:\s*(am|pm))?$/i);
    if (!m) return null;
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ampm = m[3] || null;
    if (ampm) {
      if (ampm === "pm" && hh !== 12) hh += 12;
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

  const formatEventChipLabel = (event) => {
    if (!event) return "";
    if (event.type === "sunrise") return "Sunrise";
    if (event.type === "duha") return "Duha";
    if (event.type === "zawaal") return "Zawaal";
    if (event.type === "adhan") return event.label + " Adhan";
    if (event.type === "iqamah") return event.label + " Iqamah";
    return event.label || "";
  };

  const buildDayEvents = (record) => {
    if (!record) return [];
    const dayKey = makeDayKeyFromRecord(record);
    const events = [];

    PRAYER_SLOTS.forEach(function (slot) {
      const adhan = parseTimeOnRecord(record, slot.beginsKey);
      const iqamah = parseTimeOnRecord(record, slot.iqamahKey);
      if (adhan) {
        events.push({
          type: "adhan",
          prayerId: slot.id,
          label: slot.label,
          at: adhan,
          dayKey: dayKey,
        });
      }
      if (iqamah) {
        events.push({
          type: "iqamah",
          prayerId: slot.id,
          label: slot.label,
          at: iqamah,
          dayKey: dayKey,
        });
      }
      if (slot.id === "fajr" && record.sunriseTime) {
        const sunrise = parseTimeOnRecord(record, "sunriseTime");
        if (sunrise) {
          events.push({
            type: "sunrise",
            prayerId: "fajr",
            label: "Sunrise",
            at: sunrise,
            dayKey: dayKey,
          });
          const duhaStart = new Date(
            sunrise.getTime() + SUNRISE_FORBIDDEN_MINUTES * 60000,
          );
          events.push({
            type: "duha",
            prayerId: "duha",
            label: "Duha",
            at: duhaStart,
            dayKey: dayKey,
          });
        }
      }
      if (slot.id === "dhuhr") {
        const zohrAdhan = parseTimeOnRecord(record, slot.beginsKey);
        if (zohrAdhan) {
          const zawaalStart = new Date(
            zohrAdhan.getTime() - ZAWAAL_BEFORE_ZOHR_MINUTES * 60000,
          );
          events.push({
            type: "zawaal",
            prayerId: slot.id,
            label: "Zawaal",
            at: zawaalStart,
            dayKey: dayKey,
          });
        }
      }
    });

    events.sort(function (a, b) {
      return a.at.getTime() - b.at.getTime();
    });
    return events;
  };

  const buildSalahEventTimeline = () => {
    if (!cachedPrayerDayMap) return [];
    const events = [];
    for (let offset = -PRAYER_DAY_RADIUS; offset <= PRAYER_DAY_RADIUS; offset += 1) {
      const record = getDayRecordForOffset(offset);
      if (!record) continue;
      buildDayEvents(record).forEach(function (event) {
        events.push(event);
      });
    }
    events.sort(function (a, b) {
      return a.at.getTime() - b.at.getTime();
    });
    return events;
  };

  const getSpecialSalahPeriod = (record, nowMs) => {
    if (!record || !record.sunriseTime) return null;

    const sunrise = parseTimeOnRecord(record, "sunriseTime");
    if (!sunrise) return null;

    const sunriseMs = sunrise.getTime();
    if (nowMs < sunriseMs) return null;

    const dayKey = makeDayKeyFromRecord(record);
    const forbiddenEndMs =
      sunriseMs + SUNRISE_FORBIDDEN_MINUTES * 60000;

    if (nowMs < forbiddenEndMs) {
      return {
        id: "forbidden-after-sunrise",
        label: "Forbidden time",
        navKey: null,
        dayKey: dayKey,
        special: true,
      };
    }

    const zohrSlot = PRAYER_SLOTS.find(function (slot) {
      return slot.id === "dhuhr";
    });
    const zohrAdhan = zohrSlot
      ? parseTimeOnRecord(record, zohrSlot.beginsKey)
      : null;

    if (zohrAdhan) {
      const zawaalStartMs =
        zohrAdhan.getTime() - ZAWAAL_BEFORE_ZOHR_MINUTES * 60000;

      if (nowMs < zawaalStartMs) {
        return {
          id: "duha",
          label: "Duha",
          navKey: null,
          dayKey: dayKey,
          special: true,
        };
      }

      if (nowMs < zohrAdhan.getTime()) {
        return {
          id: "zawaal-before-zohr",
          label: "Zawaal",
          navKey: null,
          dayKey: dayKey,
          special: true,
        };
      }
    }

    return null;
  };

  const getCurrentPrayerSlotForRecord = (record, nowMs) => {
    if (!record) return null;

    const special = getSpecialSalahPeriod(record, nowMs);
    if (special) return special;

    let current = null;
    const sunrise =
      record.sunriseTime && parseTimeOnRecord(record, "sunriseTime");

    PRAYER_SLOTS.forEach(function (slot) {
      const adhan = parseTimeOnRecord(record, slot.beginsKey);
      if (!adhan || adhan.getTime() > nowMs) return;
      if (
        slot.id === "fajr" &&
        sunrise &&
        nowMs >= sunrise.getTime()
      ) {
        return;
      }
      current = {
        id: slot.id,
        label: slot.label,
        navKey: slot.navKey,
        dayKey: makeDayKeyFromRecord(record),
      };
    });
    if (!current) {
      const prev = getDayRecordForOffset(-1);
      if (prev) {
        const last = PRAYER_SLOTS[PRAYER_SLOTS.length - 1];
        current = {
          id: last.id,
          label: last.label,
          navKey: last.navKey,
          dayKey: makeDayKeyFromRecord(prev),
        };
      }
    }
    return current;
  };

  const getNextPrayerSlot = (currentSlot) => {
    if (!currentSlot) return null;

    if (currentSlot.special) {
      const zohr = PRAYER_SLOTS.find(function (slot) {
        return slot.id === "dhuhr";
      });
      if (zohr) {
        return {
          id: zohr.id,
          label: zohr.label,
          navKey: zohr.navKey,
          dayKey: currentSlot.dayKey,
        };
      }
      return null;
    }

    const index = PRAYER_SLOTS.findIndex(function (slot) {
      return slot.id === currentSlot.id;
    });
    if (index < 0) return null;

    if (index < PRAYER_SLOTS.length - 1) {
      const next = PRAYER_SLOTS[index + 1];
      return {
        id: next.id,
        label: next.label,
        navKey: next.navKey,
        dayKey: currentSlot.dayKey,
      };
    }

    const currentRecord = cachedPrayerDayMap[currentSlot.dayKey];
    if (!currentRecord) return null;
    const nextDate = getDublinDate();
    nextDate.setFullYear(
      currentRecord.gregorianYear,
      currentRecord.gregorianMonth,
      currentRecord.gregorianDay,
    );
    nextDate.setDate(nextDate.getDate() + 1);
    const nextKey = makeDayKeyFromDate(nextDate);
    const first = PRAYER_SLOTS[0];
    return {
      id: first.id,
      label: first.label,
      navKey: first.navKey,
      dayKey: nextKey,
    };
  };

  const getSalahTimelineState = () => {
    const nowMs = getDublinDate().getTime();
    const todayRecord =
      cachedPrayerDayData || getDayRecordForOffset(0);
    const events = cachedSalahEvents || buildSalahEventTimeline();
    const nextEvent =
      events.find(function (event) {
        return event.at.getTime() > nowMs;
      }) || null;
    const current = getCurrentPrayerSlotForRecord(todayRecord, nowMs);
    const nextPrayer = getNextPrayerSlot(current);

    return {
      current: current,
      nextPrayer: nextPrayer,
      nextEvent: nextEvent,
      countdownTarget: nextEvent ? nextEvent.at : null,
    };
  };

  const getPrayerCarouselTrack = () =>
    document.querySelector("[data-prayer-carousel-track]");

  const getPrayerCarouselViewport = () =>
    document.querySelector("[data-prayer-carousel-viewport]");

  const getDeckHighlightState = () => {
    const todayRecord = cachedPrayerDayData || getDayRecordForOffset(0);
    const nowMs = getDublinDate().getTime();
    const current = getCurrentPrayerSlotForRecord(todayRecord, nowMs);
    const nextPrayer = getNextPrayerSlot(current);

    return { current: current, nextPrayer: nextPrayer };
  };

  const formatDeckTime = (raw) => {
    if (!raw || raw === "—") return "—";
    return String(raw)
      .trim()
      .toLowerCase()
      .replace(/\s+(am|pm)\b/i, "\u00a0$1");
  };

  const buildPrayerDeckCardHtml = (record, slot, deckIndex, repeat, dayOffset) => {
    const dayKey = makeDayKeyFromRecord(record);
    const adhan = formatDeckTime(record[slot.beginsKey]);
    const iqamah = formatDeckTime(record[slot.iqamahKey]);
    const icon = PRAYER_DECK_ICONS[slot.id] || "fa-mosque";
    const sunriseHtml =
      slot.id === "fajr" && record.sunriseTime
        ? '<p class="home-hero-prayer-sunrise"><i class="fas fa-sun" aria-hidden="true"></i> ' +
          formatDeckTime(record.sunriseTime) +
          "</p>"
        : "";

    return (
      '<article class="home-prayer-deck-card home-hero-prayer-card-wrap" role="listitem"' +
      ' data-prayer="' +
      slot.id +
      '" data-day-key="' +
      dayKey +
      '" data-day-offset="' +
      dayOffset +
      '" data-carousel-repeat="' +
      repeat +
      '" style="--deck-index:' +
      deckIndex +
      '">' +
      '<span class="home-prayer-deck-card-glow" aria-hidden="true"></span>' +
      '<div class="home-hero-prayer-card">' +
      '<span class="home-hero-prayer-badge home-hero-prayer-badge-current">Current</span>' +
      '<span class="home-hero-prayer-badge home-hero-prayer-badge-next">Up next</span>' +
      '<span class="home-prayer-deck-date-chip home-prayer-carousel-date">' +
      (record.gregorianDateString || record.dayOfWeek || "") +
      "</span>" +
      '<div class="home-prayer-deck-icon-orbit" aria-hidden="true">' +
      '<span class="home-prayer-deck-icon"><i class="fas ' +
      icon +
      '"></i></span>' +
      "</div>" +
      '<h3 class="home-hero-prayer-name">' +
      slot.label +
      "</h3>" +
      '<div class="home-prayer-deck-times">' +
      '<div class="home-prayer-deck-time-row">' +
      '<span class="home-hero-prayer-label">Adhan</span>' +
      '<span class="home-hero-prayer-begins">' +
      adhan +
      "</span>" +
      "</div>" +
      '<div class="home-prayer-deck-time-row home-prayer-deck-time-row-iqamah">' +
      '<span class="home-hero-prayer-label">Iqamah</span>' +
      '<span class="home-hero-prayer-iqamah">' +
      iqamah +
      "</span>" +
      "</div>" +
      "</div>" +
      sunriseHtml +
      "</div></article>"
    );
  };

  const renderHomePrayerDeck = () => {
    if (!isHomePage() || !cachedPrayerDayMap) return;

    const track = getPrayerCarouselTrack();
    const suite = document.querySelector("[data-home-prayer-suite]");
    const toolbar = document.querySelector("[data-prayer-deck-toolbar]");
    if (!track || !suite) return;

    const chunks = [];
    for (let repeat = 0; repeat < PRAYER_CAROUSEL_REPEAT; repeat += 1) {
      for (let offset = -PRAYER_DAY_RADIUS; offset <= PRAYER_DAY_RADIUS; offset += 1) {
        const record = getDayRecordForOffset(offset);
        if (!record) continue;
        PRAYER_SLOTS.forEach(function (slot, index) {
          chunks.push(
            buildPrayerDeckCardHtml(record, slot, index, repeat, offset),
          );
        });
      }
    }

    if (!chunks.length) {
      track.innerHTML =
        '<p class="home-prayer-deck-empty">Prayer times unavailable.</p>';
      suite.hidden = false;
      return;
    }

    track.innerHTML = chunks.join("");
    suite.hidden = false;
    if (toolbar) toolbar.hidden = false;
    prayerCarouselBuilt = true;
    initHomePrayerDeckControls();
    requestAnimationFrame(function () {
      centerPrayerCarouselOnSlot(null, null, "auto");
      normalizePrayerCarouselScroll();
      updatePrayerCarouselToolbarLabel();
      updatePrayerHighlightsUI();
    });
  };

  const getPrayerCarouselLoopWidth = () => {
    const track = getPrayerCarouselTrack();
    if (!track) return 0;
    const firstRepeat0 = track.querySelector(
      '.home-prayer-deck-card[data-carousel-repeat="0"]',
    );
    const firstRepeat1 = track.querySelector(
      '.home-prayer-deck-card[data-carousel-repeat="1"]',
    );
    if (!firstRepeat0 || !firstRepeat1) return 0;
    return firstRepeat1.offsetLeft - firstRepeat0.offsetLeft;
  };

  const getVisiblePrayerCarouselSlide = () => {
    const viewport = getPrayerCarouselViewport();
    const track = getPrayerCarouselTrack();
    if (!viewport || !track) return null;

    const slides = track.querySelectorAll(".home-prayer-deck-card");
    if (!slides.length) return null;

    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    let closest = null;
    let closestDistance = Infinity;

    slides.forEach(function (slide) {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(slideCenter - center);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = slide;
      }
    });

    return closest;
  };

  const updateCarouselCenteredSlide = () => {
    const track = getPrayerCarouselTrack();
    const visible = getVisiblePrayerCarouselSlide();
    if (!track) return;
    track.querySelectorAll(".home-prayer-deck-card.is-centered").forEach(function (el) {
      el.classList.remove("is-centered");
    });
    if (visible) visible.classList.add("is-centered");
  };

  const centerPrayerCarouselOnSlide = (slide, behavior) => {
    const viewport = getPrayerCarouselViewport();
    if (!viewport || !slide) return;

    const targetScroll =
      slide.offsetLeft - viewport.clientWidth / 2 + slide.offsetWidth / 2;
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    viewport.scrollTo({
      left: Math.max(0, Math.min(targetScroll, maxScroll)),
      behavior: behavior || "smooth",
    });
  };

  const findPrayerDeckCard = (dayKey, prayerId, repeat) => {
    const track = getPrayerCarouselTrack();
    if (!track || !dayKey || !prayerId) return null;
    return track.querySelector(
      '.home-prayer-deck-card[data-day-key="' +
        dayKey +
        '"][data-prayer="' +
        prayerId +
        '"][data-carousel-repeat="' +
        (repeat != null ? repeat : PRAYER_CAROUSEL_PRIMARY) +
        '"]',
    );
  };

  const centerPrayerCarouselOnSlot = (dayKey, prayerId, behavior) => {
    const deckState = getDeckHighlightState();
    let targetDay = dayKey;
    let targetPrayer = prayerId;

    if (!targetDay || !targetPrayer) {
      if (deckState.current) {
        targetDay = deckState.current.dayKey;
        targetPrayer = deckState.current.id;
      } else if (deckState.nextPrayer) {
        targetDay = deckState.nextPrayer.dayKey;
        targetPrayer = deckState.nextPrayer.id;
      }
    }

    if (!targetDay || !targetPrayer) return;

    const slide = findPrayerDeckCard(
      targetDay,
      targetPrayer,
      PRAYER_CAROUSEL_PRIMARY,
    );
    if (slide) {
      centerPrayerCarouselOnSlide(slide, behavior || "smooth");
      requestAnimationFrame(updateCarouselCenteredSlide);
    }
  };

  const schedulePrayerCarouselNormalize = () => {
    if (prayerCarouselNormalizeTimer) {
      clearTimeout(prayerCarouselNormalizeTimer);
    }
    prayerCarouselNormalizeTimer = setTimeout(normalizePrayerCarouselScroll, 90);
  };

  const normalizePrayerCarouselScroll = () => {
    if (prayerCarouselJumping) return;

    const viewport = getPrayerCarouselViewport();
    const loopWidth = getPrayerCarouselLoopWidth();
    const visible = getVisiblePrayerCarouselSlide();
    if (!viewport || !loopWidth || !visible) return;

    const repeat = Number(visible.getAttribute("data-carousel-repeat"));
    if (Number.isNaN(repeat)) return;

    let jumpBy = 0;
    if (repeat <= 0) {
      jumpBy = loopWidth;
    } else if (repeat >= PRAYER_CAROUSEL_REPEAT - 1) {
      jumpBy = -loopWidth;
    }
    if (!jumpBy) return;

    prayerCarouselJumping = true;
    viewport.scrollLeft += jumpBy;
    requestAnimationFrame(function () {
      prayerCarouselJumping = false;
      updateCarouselCenteredSlide();
    });
  };

  const scrollPrayerCarouselBy = (direction) => {
    const visible = getVisiblePrayerCarouselSlide();
    if (!visible) return;

    const track = getPrayerCarouselTrack();
    const slides = track
      ? Array.prototype.slice.call(
          track.querySelectorAll(".home-prayer-deck-card"),
        )
      : [];
    const index = slides.indexOf(visible);
    if (index < 0) return;

    const nextIndex =
      direction < 0
        ? Math.max(0, index - 1)
        : Math.min(slides.length - 1, index + 1);
    centerPrayerCarouselOnSlide(slides[nextIndex], "smooth");
  };

  const initHomePrayerDeckControls = () => {
    const viewport = getPrayerCarouselViewport();
    if (!viewport || viewport.dataset.prayerCarouselInit === "true") return;
    viewport.dataset.prayerCarouselInit = "true";

    viewport.addEventListener(
      "scroll",
      function () {
        prayerCarouselUserScrolling = true;
        if (prayerCarouselScrollTimer) {
          clearTimeout(prayerCarouselScrollTimer);
        }
        prayerCarouselScrollTimer = setTimeout(function () {
          prayerCarouselUserScrolling = false;
          schedulePrayerCarouselNormalize();
          updatePrayerCarouselToolbarLabel();
          updateCarouselCenteredSlide();
        }, 120);
      },
      { passive: true },
    );

    const todayBtn = document.querySelector("[data-prayer-day-today]");
    const prevBtn = document.querySelector("[data-prayer-day-prev]");
    const nextBtn = document.querySelector("[data-prayer-day-next]");

    if (todayBtn) {
      todayBtn.addEventListener("click", function () {
        centerPrayerCarouselOnSlot(null, null, "smooth");
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        scrollPrayerCarouselBy(-1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        scrollPrayerCarouselBy(1);
      });
    }

    window.addEventListener(
      "resize",
      function () {
        if (!prayerCarouselUserScrolling) {
          centerPrayerCarouselOnSlot(null, null, "auto");
        }
      },
      { passive: true },
    );
  };

  const updatePrayerCarouselToolbarLabel = () => {
    const label = document.querySelector("[data-prayer-carousel-label]");
    const visible = getVisiblePrayerCarouselSlide();
    if (!label || !visible) return;
    const nameEl = visible.querySelector(".home-hero-prayer-name");
    const dateEl = visible.querySelector(".home-prayer-carousel-date");
    const offset = Number(visible.getAttribute("data-day-offset"));
    let offsetLabel = "";
    if (offset === 0) offsetLabel = "Today";
    else if (offset === 1) offsetLabel = "Tomorrow";
    else if (offset === -1) offsetLabel = "Yesterday";
    label.textContent =
      (nameEl ? nameEl.textContent.trim() : "") +
      (dateEl && dateEl.textContent
        ? " · " +
          (offsetLabel ? offsetLabel + " · " : "") +
          dateEl.textContent.trim()
        : "");
  };

  const clearPrayerHighlights = () => {
    document
      .querySelectorAll(
        ".home-prayer-deck-card, .home-hero-prayer-card-wrap",
      )
      .forEach(function (el) {
        el.classList.remove("is-current-prayer", "is-next-prayer", "is-centered");
      });
    document
      .querySelectorAll(".kicc-nav-prayer-row, .kicc-nav-salah-row")
      .forEach(function (el) {
        el.classList.remove("is-current-prayer", "is-next-prayer");
      });
  };

  const getTodayDayKey = () => {
    if (cachedPrayerDayData) {
      return makeDayKeyFromRecord(cachedPrayerDayData);
    }
    return makeDayKeyFromDate(getDublinDate());
  };

  const getCurrentSalahChipLabel = (slot) => {
    if (!slot) return "Current prayer";
    if (slot.special) return "Now";
    return "Current prayer";
  };

  const highlightPrayerSlot = (slot, className) => {
    if (!slot || slot.special || !slot.navKey) return;
    var homeCard = findPrayerDeckCard(slot.dayKey, slot.id);
    if (homeCard) {
      homeCard.classList.add(className);
    }
    var todayKey = getTodayDayKey();
    var idPrefix =
      slot.dayKey === todayKey ? "nav-" : "nav-tomorrow-";
    var navBegins = document.getElementById(idPrefix + slot.navKey + "-begins");
    if (navBegins) {
      var navRow = navBegins.closest(".kicc-nav-salah-row, tr");
      if (navRow) {
        navRow.classList.add("kicc-nav-prayer-row", className);
      }
    }
  };

  const buildPrayerStatusHtml = (state) => {
    const countdown = formatCountdown(state.countdownTarget);
    const nextLabel = formatEventChipLabel(state.nextEvent);
    const currentLabel = state.current ? state.current.label : "—";
    const currentChipLabel = getCurrentSalahChipLabel(state.current);

    return (
      '<div class="home-prayer-status-chip home-prayer-status-chip-current">' +
      '<span class="home-prayer-status-chip-label">' +
      currentChipLabel +
      "</span>" +
      '<strong class="home-prayer-status-chip-value">' +
      currentLabel +
      "</strong></div>" +
      '<div class="home-prayer-status-chip home-prayer-status-chip-next">' +
      '<span class="home-prayer-status-chip-label">' +
      nextLabel +
      " in</span>" +
      '<strong class="home-prayer-status-chip-value home-prayer-countdown">' +
      countdown +
      "</strong></div>"
    );
  };

  const updatePrayerHighlightsUI = () => {
    if (!cachedPrayerDayMap && !cachedPrayerDayData) return;

    cachedSalahEvents = buildSalahEventTimeline();
    var state = getSalahTimelineState();
    var deckState = getDeckHighlightState();
    clearPrayerHighlights();

    if (!state.current && !state.nextEvent) return;

    if (deckState.current) {
      highlightPrayerSlot(deckState.current, "is-current-prayer");
    }
    if (deckState.nextPrayer) {
      highlightPrayerSlot(deckState.nextPrayer, "is-next-prayer");
    }

    var statusEl = document.getElementById("home-prayer-status");
    var statusLine = document.getElementById("home-prayer-status-line");

    if (statusEl && statusLine) {
      statusLine.innerHTML = buildPrayerStatusHtml(state);
      statusEl.hidden = false;
    }

    if (prayerCarouselBuilt && !prayerCarouselUserScrolling) {
      centerPrayerCarouselOnSlot(null, null, "auto");
      updateCarouselCenteredSlide();
    }

    updatePrayerCarouselToolbarLabel();
    updateNavSalahStatus();
  };

  const schedulePrayerHighlights = (d) => {
    cachedPrayerDayData = d;
    cachedSalahEvents = buildSalahEventTimeline();
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
    if (!isHomePage() || !d) return;

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
      const monthName = getSalahTimesMonthLabel();
      curMonthEl.textContent = monthName;
      setOfficialTimetableLabels(monthName);
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

    const state = getSalahTimelineState();
    if (!state || !state.current) {
      statusEl.hidden = true;
      return;
    }

    const countdown = formatCountdown(state.countdownTarget);
    const nextLabel = formatEventChipLabel(state.nextEvent);
    const currentChipLabel = getCurrentSalahChipLabel(state.current);

    statusEl.innerHTML =
      '<div class="kicc-nav-salah-status-chip kicc-nav-salah-status-chip-current">' +
      '<span class="kicc-nav-salah-status-label">' +
      currentChipLabel +
      "</span>" +
      '<strong>' +
      state.current.label +
      "</strong></div>" +
      '<div class="kicc-nav-salah-status-chip kicc-nav-salah-status-chip-next">' +
      '<span class="kicc-nav-salah-status-label">' +
      nextLabel +
      " in</span>" +
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
      '<a class="kicc-nav-salah-tab-month" id="salah-times" href="' +
      timetableHref +
      '" target="_blank" rel="noopener noreferrer" title="Download monthly timetable PDF">' +
      '<i class="far fa-file-pdf" aria-hidden="true"></i>' +
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
    setOfficialTimetableLabels(monthName);
    applyNavSalahDay("nav-salah-panel-today", d, "today");
    updateNavSalahDateLabel();
    updatePrayerTimesHero();
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

  const loadPrayerDataWindow = () => {
    const months = getIqamahMonthsAroundToday();
    return Promise.all(
      months.map(function (m) {
        return fetchIqamahMonth(m.year, m.monthName).catch(function (err) {
          console.warn("Failed to load iqamah month", m, err);
          return [];
        });
      }),
    ).then(function (results) {
      cachedPrayerDayMap = Object.create(null);
      results.forEach(function (days) {
        if (!Array.isArray(days)) return;
        days.forEach(function (d) {
          cachedPrayerDayMap[makeDayKeyFromRecord(d)] = d;
        });
      });
      return cachedPrayerDayMap;
    });
  };

  const setSalahTimes = () => {
    loadPrayerDataWindow()
      .then(function () {
        const todayData =
          cachedPrayerDayMap[makeDayKeyFromDate(getDublinDate())] ||
          getDayRecordForOffset(0);
        const tomorrowData = getDayRecordForOffset(1);

        cachedPrayerDayData = todayData || null;
        cachedTomorrowPrayerDayData = tomorrowData || null;

        if (todayData) {
          applyToHomePage(todayData);
          applyToNav(todayData);
          schedulePrayerHighlights(todayData);
          setDynamicCelebrationToBanner(todayData);
          renderHomePrayerDeck();
        } else {
          console.error("No prayer data for today");
        }

        if (tomorrowData) {
          applyTomorrowToNav(tomorrowData);
        } else {
          fetchIqamahForDate(getTomorrowInIreland(), "iqamah-tomorrow")
            .then(function (d) {
              applyTomorrowToNav(d);
            })
            .catch(function (err) {
              console.warn("Failed to load tomorrow's iqamah times", err);
            });
        }
      })
      .catch(function (err) {
        console.error("Failed to load prayer times", err);
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
      name: "iqamah-month-*",
      duration: "Until cleared",
      purpose:
        "Caches monthly iqamah timetables (previous, current, and next month only). Stored only with Functional & storage consent.",
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
      category: "functional",
      type: "sessionStorage",
      name: "kicc-announcements-dismissed",
      duration: "Browser session",
      purpose:
        "Hides site announcement banners, Jumu'ah ribbon notes, and urgent alerts for this visit. Stored only with Functional & storage consent.",
    },
    {
      category: "thirdParty",
      type: "Cookie",
      name: "Mixlr cookies (mixlr.com)",
      duration: "Varies",
      purpose:
        "Set on mixlr.com when the live stream embed or recordings player is loaded. The site cannot remove these from your browser — clear them via your browser settings if needed.",
    },
    {
      category: "analytics",
      type: "Cookie",
      name: "_ga, _gid, _gat, _ga_*",
      duration: "Up to 2 years",
      purpose:
        "Google Analytics on this site — anonymous usage statistics. Only set with Analytics consent.",
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
    {
      category: "thirdParty",
      type: "Third-party",
      name: "SumUp payment widget (gateway.sumup.com)",
      duration: "Varies",
      purpose:
        "Secure card checkout on the homepage. Loads only when you start a donation. SumUp may set cookies and use local storage for fraud prevention, checkout sessions, and performance.",
    },
    {
      category: "thirdParty",
      type: "Cookie",
      name: "SumUp cookies (sumup.com)",
      duration: "Session to 2 years",
      purpose:
        "Set by SumUp when you use the card payment form (security, checkout functionality, and analytics). We cannot remove these from your browser; see SumUp\u2019s cookie policy.",
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
        "Embedded Mixlr live stream, Google Maps on Contact, and SumUp card payments on the homepage. These services may set their own cookies.",
    },
  ];
  const kiccSumUpConsentHandlers = { teardown: null, refresh: null };
  const ANNOUNCEMENTS_API_URL =
    "https://getannouncements-rds3nxm6za-ew.a.run.app";
  let postCookieConsentDone = false;
  let pendingBreakingAnnouncement = null;
  let siteAnnouncementsBound = false;
  let lastShownBreakingIdentity = "";
  let breakingModalShownForIdentity = "";
  let breakingAnnouncementSurfaceReady = false;
  let signupModalFlowResolved = true;
  let announcementsSessionDismissedFingerprint = "";
  let latestAnnouncements = [];
  let latestProgrammeRecordings = [];
  let cookieRegistryRendered = false;
  let cookiePrefsSavedTimer = null;

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
    else if (!next.functional) {
      clearFunctionalSessionKeys();
      clearIqamahMonthStorage();
      FUNCTIONAL_STORAGE_KEYS.forEach(function (key) {
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
      });
      clearBreakingDismissKeys();
    }

    if (!next.analytics) clearAnalyticsData();
    if (!next.thirdParty) clearThirdPartyData();

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
    const bareHost = hostname.replace(/^www\./, "");
    const domainVariants = [
      "",
      "; domain=" + hostname,
      "; domain=." + bareHost,
      "; domain=" + bareHost,
    ];
    const secure =
      window.location.protocol === "https:" ? "; Secure" : "";
    domainVariants.forEach(function (domainPart) {
      document.cookie =
        name +
        "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" +
        domainPart +
        "; SameSite=Lax" +
        secure;
    });
    if (typeof Cookies !== "undefined") {
      Cookies.remove(name, { path: "/" });
      Cookies.remove(name, { path: "/", domain: hostname });
      Cookies.remove(name, { path: "/", domain: "." + bareHost });
    }
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

  const clearFunctionalSessionKeys = () => {
    FUNCTIONAL_SESSION_KEYS.forEach(function (key) {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // ignore
      }
    });
    announcementsSessionDismissedFingerprint = "";
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
    clearIqamahMonthStorage();
    clearFunctionalSessionKeys();
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

  const clearThirdPartyData = () => {
    removeConsentEmbeds();
    if (typeof kiccSumUpConsentHandlers.teardown === "function") {
      kiccSumUpConsentHandlers.teardown();
    }
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
      clearThirdPartyData();
      return;
    }
    const state = prefs || getConsentPrefs();
    if (!state.functional) {
      FUNCTIONAL_SESSION_KEYS.forEach(function (key) {
        try {
          sessionStorage.removeItem(key);
        } catch {
          // ignore
        }
      });
      clearIqamahMonthStorage();
      FUNCTIONAL_STORAGE_KEYS.forEach(function (key) {
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
      });
      clearBreakingDismissKeys();
    }
    if (state.analytics) loadGoogleAnalytics();
    else clearAnalyticsData();
    if (state.thirdParty) {
      loadConsentEmbeds();
      if (typeof kiccSumUpConsentHandlers.refresh === "function") {
        kiccSumUpConsentHandlers.refresh();
      }
    } else {
      clearThirdPartyData();
    }
    if (document.getElementById("programmes-recordings-wrap")) {
      renderRecordings(latestProgrammeRecordings);
    }
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

  const showCookiePrefsSavedFeedback = () => {
    const el = document.getElementById("cookie-prefs-status");
    if (!el || !hasConsentChoice()) return;
    el.textContent = describeConsentPrefs(getConsentPrefs()) + " \u00b7 Saved";
    if (cookiePrefsSavedTimer) window.clearTimeout(cookiePrefsSavedTimer);
    cookiePrefsSavedTimer = window.setTimeout(function () {
      cookiePrefsSavedTimer = null;
      updateCookiePrefsStatus();
    }, 2200);
  };

  const handleConsentToggleAutoSave = () => {
    const prefs = readConsentToggles("cookie-prefs");
    if (!hasConsentChoice()) {
      finalizeConsentChoice(prefs);
      return;
    }
    saveConsentPrefs(prefs);
    showCookiePrefsSavedFeedback();
  };

  const isConsentGateActive = () =>
    document.documentElement.classList.contains("cookie-consent-pending");

  const isConsentUiNode = (node) =>
    node.id === "cookie-consent" || node.id === "cookie-preferences";

  const hideCookiePreferences = (animate) => {
    const el = document.getElementById("cookie-preferences");
    if (!el) return;

    const finish = () => {
      el.classList.remove("is-visible", "is-leaving");
      el.setAttribute("aria-hidden", "true");
      document.body.classList.remove("cookie-preferences-active");
      if (isConsentGateActive()) {
        document.documentElement.classList.remove("cookie-prefs-gate-open");
        el.setAttribute("inert", "");
        const consentEl = document.getElementById("cookie-consent");
        if (consentEl) {
          consentEl.classList.add("is-visible");
          consentEl.setAttribute("aria-hidden", "false");
        }
      }
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
    if (!hasConsentChoice() && !isConsentGateActive()) {
      showCookieConsent();
      return;
    }

    const el = document.getElementById("cookie-preferences");
    if (!el) return;

    renderCookieRegistry();
    syncConsentToggles(
      hasConsentChoice() ? getConsentPrefs() : CONSENT_ALL_ON,
    );
    updateCookiePrefsStatus();
    el.setAttribute("aria-hidden", "false");
    el.removeAttribute("inert");
    document.body.classList.add("cookie-preferences-active");
    if (isConsentGateActive()) {
      document.documentElement.classList.add("cookie-prefs-gate-open");
      const consentEl = document.getElementById("cookie-consent");
      if (consentEl) {
        consentEl.classList.remove("is-visible");
        consentEl.setAttribute("aria-hidden", "true");
      }
    }

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
    signupModalFlowResolved = true;
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
        if (isConsentUiNode(node)) return;
        node.setAttribute("inert", "");
      });
      return;
    }
    document.documentElement.classList.remove("cookie-consent-pending");
    document.documentElement.classList.remove("cookie-prefs-gate-open");
    document.body.classList.remove("cookie-consent-active");
    Array.from(document.body.children).forEach(function (node) {
      if (isConsentUiNode(node)) return;
      node.removeAttribute("inert");
    });
  };

  const activateCookieConsentGate = () => {
    const el = document.getElementById("cookie-consent");
    if (!el) return;

    clearAnalyticsData();
    syncConsentToggles(CONSENT_ALL_ON);
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

  const clearOptionalStoredData = () => {
    clearFunctionalData();
    clearAnalyticsData();
    clearThirdPartyData();
    saveConsentPrefs(Object.assign({}, CONSENT_DEFAULTS));
    showCookiePrefsSavedFeedback();
  };

  const bindConsentToggleAutoSave = () => {
    CONSENT_CATEGORIES.forEach(function (cat) {
      if (cat.locked) return;
      const input = document.getElementById("cookie-prefs-toggle-" + cat.id);
      if (!input || input.dataset.boundAutoSave) return;
      input.dataset.boundAutoSave = "true";
      input.addEventListener("change", handleConsentToggleAutoSave);
    });
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
        signupModalFlowResolved = true;
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
      signupModalFlowResolved = false;
      setTimeout(function () {
        $("#myModal").modal("show");
        setTimeout(function () {
          $("#myModal").modal("hide");
        }, 30000);
      }, 2500);
      return true;
    }
    signupModalFlowResolved = true;
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
    bindCookieButton("cookie-banner-settings", showCookiePreferences);
    bindCookieButton("cookie-prefs-accept", acceptAllConsent);
    bindCookieButton("cookie-prefs-necessary", acceptNecessaryOnlyConsent);
    bindCookieButton("cookie-prefs-clear", clearOptionalStoredData);
    bindConsentToggleAutoSave();

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
        const prefsEl = document.getElementById("cookie-preferences");
        if (prefsEl && prefsEl.classList.contains("is-visible")) {
          hideCookiePreferences(true);
        }
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
    const announcements = latestAnnouncements.length
      ? latestAnnouncements
      : loadAnnouncementsFromCache() || [];
    renderJumuahFridayBanner(announcements);
    if (!announcements.length) return;
    renderSiteAnnouncementRibbon(announcements);
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

  const prayerTimesHubState = {
    programmes: [],
  };

  const setPrayerTimesJumuahTimes = (jummahTimes) => {
    const slot = jummahTimes && jummahTimes[0];
    const speech = slot ? formatTimeToAmPm(slot.speech) || "—" : "—";
    const khutbah = slot ? formatTimeToAmPm(slot.khutbah) || "—" : "—";

    document
      .querySelectorAll(
        "[data-prayer-jumuah-speech], [data-prayer-footer-jumuah-speech]",
      )
      .forEach(function (el) {
        el.textContent = speech;
      });
    document
      .querySelectorAll(
        "[data-prayer-jumuah-khutbah], [data-prayer-footer-jumuah-khutbah]",
      )
      .forEach(function (el) {
        el.textContent = khutbah;
      });
  };

  const renderPrayerTimesJumuahSection = (announcements) => {
    if (!isPrayerTimesPage()) return;

    const panel = document.querySelector("[data-prayer-jumuah-panel]");
    if (!panel) return;

    const jummahTimes = getJumuahTimes(announcements);
    const jumuah = pickAnnouncementByType(announcements, "jumuah");
    const featureHost = panel.querySelector("[data-prayer-jumuah-feature]");
    const emptyHost = panel.querySelector("[data-prayer-jumuah-empty]");
    const messageEl = panel.querySelector("[data-prayer-jumuah-message]");
    const badgeEl = panel.querySelector("[data-prayer-jumuah-status-badge]");

    setPrayerTimesJumuahTimes(jummahTimes);

    if (featureHost) {
      if (jummahTimes) {
        featureHost.innerHTML = buildJumuahScheduleFeatureHtml(jummahTimes);
        featureHost.hidden = false;
        if (emptyHost) emptyHost.hidden = true;
      } else {
        featureHost.innerHTML = "";
        featureHost.hidden = true;
        if (emptyHost) emptyHost.hidden = false;
      }
    }

    if (messageEl) {
      if (
        jumuah &&
        jumuah.active &&
        jumuah.message &&
        !isAnnouncementsSessionDismissed(announcements)
      ) {
        messageEl.innerHTML = jumuah.message;
        messageEl.hidden = false;
      } else {
        messageEl.innerHTML = "";
        messageEl.hidden = true;
      }
    }

    if (badgeEl) {
      if (isFridayInDublin()) {
        badgeEl.textContent = "Today";
      } else if (isJumuahDisplayWindow()) {
        badgeEl.textContent = getJumuahBannerBadge();
      } else {
        badgeEl.textContent = "Every Friday";
      }
    }
  };

  const buildPrayerTimesFooterProgrammeLabel = (p) => {
    let label = getProgrammeTimeLabel(p) || "";
    if (!label) return "";

    if (hasProgrammePrayerName(p) || /\bafter\b/i.test(label)) {
      label = label.replace(/\s+at\s+.+$/i, "").trim();
    }

    return label;
  };

  const getPrayerTimesFooterProgrammes = (programmes) => {
    if (!Array.isArray(programmes)) return [];

    return programmes
      .filter(isRecurringWeeklyProgramme)
      .filter(function (p) {
        return Array.isArray(p.weekdays) && p.weekdays.length > 0;
      })
      .sort(function (a, b) {
        const dayA = WEEKDAY_ORDER.indexOf(
          normalizeWeekday((a.weekdays || [])[0]),
        );
        const dayB = WEEKDAY_ORDER.indexOf(
          normalizeWeekday((b.weekdays || [])[0]),
        );
        return (dayA < 0 ? 99 : dayA) - (dayB < 0 ? 99 : dayB);
      });
  };

  const renderPrayerTimesFooterProgrammes = (programmes) => {
    if (!isPrayerTimesPage()) return;

    const list = document.querySelector("[data-prayer-footer-programmes]");
    if (!list) return;

    list.innerHTML = "";
    const weekly = getPrayerTimesFooterProgrammes(programmes);

    if (!weekly.length) {
      const li = document.createElement("li");
      li.textContent = "See traleemasjidkicc.ie/activities for programmes.";
      list.appendChild(li);
      return;
    }

    weekly.forEach(function (p) {
      const li = document.createElement("li");
      const strong = document.createElement("strong");
      strong.textContent = p.name || "Programme";
      li.appendChild(strong);

      const meta = buildPrayerTimesFooterProgrammeLabel(p);
      if (meta) {
        li.appendChild(document.createTextNode(" — " + meta));
      }

      list.appendChild(li);
    });
  };

  const renderPrayerTimesFooterListen = () => {
    if (!isPrayerTimesPage()) return;

    const list = document.querySelector("[data-prayer-footer-listen]");
    if (!list) return;

    list.innerHTML = "";

    const addLinkItem = (href, label, external) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = href;
      a.textContent = label;
      if (external) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      li.appendChild(a);
      list.appendChild(li);
    };

    addLinkItem(
      "https://traleemasjid.mixlr.com/",
      "Live on Mixlr — traleemasjid.mixlr.com",
      true,
    );
    addLinkItem("https://www.traleemasjidkicc.ie", "www.traleemasjidkicc.ie", true);
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

  const readAnnouncementsSessionDismiss = () =>
    kiccStorageGet(sessionStorage, ANNOUNCEMENTS_SESSION_DISMISS_KEY);

  const writeAnnouncementsSessionDismiss = (value) =>
    kiccStorageSet(sessionStorage, ANNOUNCEMENTS_SESSION_DISMISS_KEY, value);

  const restoreAnnouncementsSessionDismiss = () => {
    if (!canUseFunctionalStorage()) {
      try {
        sessionStorage.removeItem(ANNOUNCEMENTS_SESSION_DISMISS_KEY);
      } catch {
        // ignore
      }
      return;
    }
    const stored = readAnnouncementsSessionDismiss();
    if (stored && stored !== "none") {
      announcementsSessionDismissedFingerprint = stored;
    }
  };

  const getAnnouncementsDismissFingerprint = (announcements) => {
    if (!Array.isArray(announcements)) return "none";

    const parts = [];
    announcements.forEach(function (announcement) {
      if (!announcement || !announcement.type) return;

      const hasJumuahTimes =
        announcement.type === "jumuah" &&
        Array.isArray(announcement.jummahTimes) &&
        announcement.jummahTimes.length > 0;
      if (!announcement.active && !hasJumuahTimes) return;

      const timesKey = hasJumuahTimes
        ? announcement.jummahTimes
            .map(function (slot) {
              return (
                String(slot.speech || "") + "-" + String(slot.khutbah || "")
              );
            })
            .join(",")
        : "";

      parts.push(
        [
          announcement.type,
          announcement.id || "",
          String(announcement.timestamp || 0),
          timesKey,
        ].join(":"),
      );
    });

    if (!parts.length) return "none";
    return parts.sort().join("|");
  };

  const isAnnouncementsSessionDismissed = (announcements) => {
    if (!announcementsSessionDismissedFingerprint) {
      restoreAnnouncementsSessionDismiss();
    }
    if (!announcementsSessionDismissedFingerprint) return false;
    if (!Array.isArray(announcements) || !announcements.length) {
      return announcementsSessionDismissedFingerprint === "dismissed";
    }

    const fingerprint = getAnnouncementsDismissFingerprint(announcements);
    if (fingerprint === "none") {
      return announcementsSessionDismissedFingerprint === "dismissed";
    }
    return announcementsSessionDismissedFingerprint === fingerprint;
  };

  const dismissAllAnnouncementsForSession = (announcements) => {
    const fingerprint = getAnnouncementsDismissFingerprint(announcements);
    const toStore =
      fingerprint && fingerprint !== "none" ? fingerprint : "dismissed";
    announcementsSessionDismissedFingerprint = toStore;
    writeAnnouncementsSessionDismiss(toStore);
  };

  const handleAnnouncementsRibbonDismiss = () => {
    const announcements = latestAnnouncements.length
      ? latestAnnouncements
      : loadAnnouncementsFromCache() || [];
    dismissAllAnnouncementsForSession(announcements);
    pendingBreakingAnnouncement = null;
    lastShownBreakingIdentity = "";
    hideBreakingAlert(false);
    applyAnnouncements(announcements);
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

  const hasPendingBreakingRibbonGate = (announcements) => {
    const { breaking } = parseAnnouncementsByType(announcements);
    if (!breaking || !breaking.active || !breaking.message) return false;
    if (isAnnouncementsSessionDismissed(announcements)) return false;
    if (isBreakingDismissed(breaking)) return false;
    return !breakingAnnouncementSurfaceReady;
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

    if (breaking && breaking.active && breaking.message && breakingAnnouncementSurfaceReady) {
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
    if (document.body.classList.contains("cookie-preferences-active")) {
      return true;
    }
    const modal = document.getElementById("myModal");
    if (modal && modal.classList.contains("show")) {
      return true;
    }
    return false;
  };

  const markBreakingAnnouncementSurfaceReady = () => {
    if (breakingAnnouncementSurfaceReady) return;
    breakingAnnouncementSurfaceReady = true;
    if (latestAnnouncements.length) {
      renderSiteAnnouncementRibbon(latestAnnouncements);
    }
  };

  const scheduleBreakingAlertWhenReady = () => {
    tryShowBreakingAlert();
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
    if (!pendingBreakingAnnouncement) {
      markBreakingAnnouncementSurfaceReady();
      return;
    }
    if (!hasCookieConsent()) return;
    if (isHomePage() && !signupModalFlowResolved) return;
    if (isBlockingOverlayVisible()) return;
    if (isAnnouncementsSessionDismissed(latestAnnouncements)) {
      markBreakingAnnouncementSurfaceReady();
      return;
    }
    if (isBreakingDismissed(pendingBreakingAnnouncement)) {
      markBreakingAnnouncementSurfaceReady();
      return;
    }

    const identity = getBreakingIdentity(pendingBreakingAnnouncement);
    if (breakingModalShownForIdentity === identity) {
      return;
    }

    const alertEl = document.getElementById("site-breaking-alert");
    const isOpen =
      alertEl &&
      !alertEl.hidden &&
      alertEl.classList.contains("is-visible") &&
      lastShownBreakingIdentity === identity;

    if (isOpen) return;

    showBreakingAlert(pendingBreakingAnnouncement);
    breakingModalShownForIdentity = identity;
  };

  const queueBreakingAlert = (breaking) => {
    if (isAnnouncementsSessionDismissed(latestAnnouncements)) {
      pendingBreakingAnnouncement = null;
      lastShownBreakingIdentity = "";
      hideBreakingAlert(false);
      markBreakingAnnouncementSurfaceReady();
      return;
    }

    if (!breaking || !breaking.active || !breaking.message) {
      pendingBreakingAnnouncement = null;
      lastShownBreakingIdentity = "";
      hideBreakingAlert(false);
      markBreakingAnnouncementSurfaceReady();
      return;
    }
    if (isBreakingDismissed(breaking)) {
      pendingBreakingAnnouncement = null;
      breakingModalShownForIdentity = getBreakingIdentity(breaking);
      markBreakingAnnouncementSurfaceReady();
      return;
    }

    const identity = getBreakingIdentity(breaking);
    const identityChanged = identity !== lastShownBreakingIdentity;

    pendingBreakingAnnouncement = breaking;

    if (identityChanged) {
      hideBreakingAlert(false);
      breakingModalShownForIdentity = "";
      if (breaking.active) {
        breakingAnnouncementSurfaceReady = false;
      }
    }

    scheduleBreakingAlertWhenReady();
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
      '<button type="button" class="site-announcement-ribbon-dismiss" id="site-announcement-ribbon-dismiss" aria-label="Dismiss announcements for this visit" hidden>' +
      '<i class="fas fa-times" aria-hidden="true"></i></button>' +
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
    const dismissBtn = document.getElementById("site-breaking-alert-dismiss");
    if (dismissBtn && !dismissBtn.dataset.bound) {
      dismissBtn.dataset.bound = "true";
      dismissBtn.addEventListener("click", function () {
        if (pendingBreakingAnnouncement) {
          dismissBreakingAnnouncement(pendingBreakingAnnouncement);
        }
        hideBreakingAlert(true);
        markBreakingAnnouncementSurfaceReady();
      });
    }

    const backdrop = document.querySelector(".site-breaking-alert-backdrop");
    if (backdrop && !backdrop.dataset.bound) {
      backdrop.dataset.bound = "true";
      backdrop.addEventListener("click", function () {
        dismissBtn?.click();
      });
    }

    if (!document.documentElement.dataset.ribbonDismissBound) {
      document.documentElement.dataset.ribbonDismissBound = "true";
      document.addEventListener("click", function (e) {
        const btn = e.target.closest("#site-announcement-ribbon-dismiss");
        if (!btn || btn.hidden) return;
        e.preventDefault();
        handleAnnouncementsRibbonDismiss();
      });
    }

    siteAnnouncementsBound = true;
  };

  const renderSiteAnnouncementRibbon = (announcements) => {
    ensureSiteAnnouncementShell();
    bindSiteAnnouncementEvents();

    const ribbon = document.getElementById("site-announcement-ribbon");
    const mainEl = ribbon
      ? ribbon.querySelector(".site-announcement-ribbon-main")
      : null;
    const badgeEl = document.getElementById("site-announcement-ribbon-badge");
    const messageEl = document.getElementById("site-announcement-ribbon-message");
    const scheduleWrap = document.getElementById(
      "site-announcement-ribbon-schedule",
    );
    const dismissBtn = document.getElementById(
      "site-announcement-ribbon-dismiss",
    );
    if (!ribbon || !badgeEl || !messageEl || !scheduleWrap) return;

    if (isAnnouncementsSessionDismissed(announcements)) {
      ribbon.hidden = true;
      messageEl.innerHTML = "";
      scheduleWrap.innerHTML = "";
      scheduleWrap.hidden = true;
      if (mainEl) mainEl.hidden = true;
      if (dismissBtn) dismissBtn.hidden = true;
      queueStickyNavOffsetSync();
      return;
    }

    if (hasPendingBreakingRibbonGate(announcements)) {
      ribbon.hidden = true;
      messageEl.innerHTML = "";
      scheduleWrap.innerHTML = "";
      scheduleWrap.hidden = true;
      if (mainEl) mainEl.hidden = true;
      if (dismissBtn) dismissBtn.hidden = true;
      queueStickyNavOffsetSync();
      return;
    }

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
      if (mainEl) mainEl.hidden = true;
      if (dismissBtn) dismissBtn.hidden = true;
      queueStickyNavOffsetSync();
      return;
    }

    if (hasMessage) {
      if (mainEl) mainEl.hidden = false;
      badgeEl.textContent = getRibbonVariantLabel(selected.variant);
      messageEl.innerHTML = selected.announcement.message;
      ribbon.classList.add("site-announcement-ribbon--" + selected.variant);
      badgeEl.hidden = false;
      messageEl.hidden = false;
    } else {
      if (mainEl) mainEl.hidden = true;
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
    if (dismissBtn) dismissBtn.hidden = false;
    syncAnnouncementRibbonNavSuppression();
    queueStickyNavOffsetSync();
  };

  const applyAnnouncements = (announcements) => {
    latestAnnouncements = Array.isArray(announcements) ? announcements : [];
    renderSiteAnnouncementRibbon(latestAnnouncements);
    renderJumuahFridayBanner(latestAnnouncements);
    renderPrayerTimesJumuahSection(latestAnnouncements);

    const { breaking } = parseAnnouncementsByType(latestAnnouncements);
    queueBreakingAlert(breaking && breaking.active ? breaking : null);
  };

  const initSiteAnnouncements = () => {
    ensureSiteAnnouncementShell();
    restoreAnnouncementsSessionDismiss();
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

  const NOTICE_SPOTLIGHT_DESKTOP_LIMIT = 6;
  const NOTICE_SPOTLIGHT_MOBILE_LIMIT = 4;

  const renderNoticeSpotlight = (notices) => {
    const section = document.getElementById("masjid-notice-spotlight");
    const track = document.getElementById("masjidNoticeSpotlightTrack");
    if (!section || !track) return;

    const sorted = sortNotices(notices);
    if (sorted.length === 0 || isNoticeSpotlightDismissed(sorted)) {
      section.hidden = true;
      track.innerHTML = "";
      return;
    }

    track.innerHTML = "";
    sorted.slice(0, NOTICE_SPOTLIGHT_DESKTOP_LIMIT).forEach(function (notice, index) {
      const card = document.createElement("a");
      card.className =
        "notices-spotlight-card lightbox" +
        (index === 0 ? " notices-spotlight-card--featured" : "") +
        (index >= NOTICE_SPOTLIGHT_MOBILE_LIMIT
          ? " notices-spotlight-card--mobile-hidden"
          : "");
      card.href = notice.url;
      card.dataset.skipExternalIcon = "true";
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
      a.dataset.skipExternalIcon = "true";
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

  const getTomorrowWeekdayKey = (todayKey) => {
    var index = WEEKDAY_ORDER.indexOf(todayKey);
    if (index < 0) return null;
    return WEEKDAY_ORDER[(index + 1) % WEEKDAY_ORDER.length];
  };

  const PROGRAMME_WEEK_REPEAT_COUNT = 5;
  const PROGRAMME_WEEK_PRIMARY_REPEAT = 2;

  var programmeWeekScrollCentered = false;
  var programmeWeekScrollResizeTimer = null;
  var programmeWeekScrollJumping = false;
  var programmeWeekScrollNormalizeTimer = null;

  const getProgrammeWeekScrollWrap = () => {
    return document.querySelector("[data-programmes-week-scroll]");
  };

  const getProgrammeDayColumn = (dayKey, weekRepeat) => {
    var wrap = getProgrammeWeekScrollWrap();
    if (!wrap || !dayKey) return null;
    var repeat =
      weekRepeat != null ? weekRepeat : PROGRAMME_WEEK_PRIMARY_REPEAT;
    return wrap.querySelector(
      '.programmes-day-col[data-day="' +
        dayKey +
        '"][data-week-repeat="' +
        repeat +
        '"]',
    );
  };

  const getProgrammeWeekLoopWidth = () => {
    var wrap = getProgrammeWeekScrollWrap();
    if (!wrap) return 0;

    var first = wrap.querySelector(
      '.programmes-day-col[data-week-repeat="0"][data-day="Mon"]',
    );
    var second = wrap.querySelector(
      '.programmes-day-col[data-week-repeat="1"][data-day="Mon"]',
    );
    if (!first || !second) return 0;
    return second.offsetLeft - first.offsetLeft;
  };

  const getVisibleProgrammeDayInfo = () => {
    var wrap = getProgrammeWeekScrollWrap();
    if (!wrap) return null;

    var columns = wrap.querySelectorAll(".programmes-day-col");
    if (!columns.length) return null;

    var wrapCenter = wrap.scrollLeft + wrap.clientWidth / 2;
    var closestCol = null;
    var closestDistance = Infinity;

    columns.forEach(function (col) {
      var colCenter = col.offsetLeft + col.offsetWidth / 2;
      var distance = Math.abs(colCenter - wrapCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestCol = col;
      }
    });

    if (!closestCol) return null;

    return {
      day: closestCol.getAttribute("data-day"),
      repeat: Number(closestCol.getAttribute("data-week-repeat")),
    };
  };

  const scheduleProgrammeWeekNormalize = () => {
    if (programmeWeekScrollNormalizeTimer) {
      clearTimeout(programmeWeekScrollNormalizeTimer);
    }
    programmeWeekScrollNormalizeTimer = setTimeout(
      normalizeProgrammeWeekScroll,
      90,
    );
  };

  const normalizeProgrammeWeekScroll = () => {
    if (programmeWeekScrollJumping) return;

    var wrap = getProgrammeWeekScrollWrap();
    var loopWidth = getProgrammeWeekLoopWidth();
    var info = getVisibleProgrammeDayInfo();
    if (!wrap || !loopWidth || !info || Number.isNaN(info.repeat)) return;

    var jumpBy = 0;
    if (info.repeat <= 0) {
      jumpBy = loopWidth * 2;
    } else if (info.repeat >= PROGRAMME_WEEK_REPEAT_COUNT - 1) {
      jumpBy = -loopWidth * 2;
    }

    if (!jumpBy) return;

    programmeWeekScrollJumping = true;
    wrap.scrollLeft += jumpBy;
    requestAnimationFrame(function () {
      programmeWeekScrollJumping = false;
    });
  };

  const centerProgrammeWeekOnDay = (dayKey, behavior) => {
    var wrap = getProgrammeWeekScrollWrap();
    var col = getProgrammeDayColumn(dayKey);
    if (!wrap || !col) return;

    var targetScroll =
      col.offsetLeft - wrap.clientWidth / 2 + col.offsetWidth / 2;
    var maxScroll = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
    targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));

    wrap.scrollTo({
      left: targetScroll,
      behavior: behavior || "smooth",
    });
  };

  const getVisibleProgrammeDayKey = () => {
    var info = getVisibleProgrammeDayInfo();
    return info ? info.day : null;
  };

  const scrollProgrammeWeekBy = (direction) => {
    var currentKey = getVisibleProgrammeDayKey();
    if (!currentKey) return;

    var index = WEEKDAY_ORDER.indexOf(currentKey);
    if (index < 0) return;

    var nextIndex =
      direction < 0
        ? (index - 1 + WEEKDAY_ORDER.length) % WEEKDAY_ORDER.length
        : (index + 1) % WEEKDAY_ORDER.length;

    centerProgrammeWeekOnDay(WEEKDAY_ORDER[nextIndex], "smooth");
  };

  const initProgrammeWeekScroll = (todayKey) => {
    var wrap = getProgrammeWeekScrollWrap();
    var toolbar = document.querySelector("[data-programmes-week-toolbar]");
    if (!wrap || !todayKey) return;

    if (toolbar) {
      toolbar.hidden = false;
    }

    var centerToday = function (behavior) {
      centerProgrammeWeekOnDay(todayKey, behavior);
    };

    if (!programmeWeekScrollCentered) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          centerToday("auto");
          normalizeProgrammeWeekScroll();
        });
      });
      programmeWeekScrollCentered = true;
    } else {
      centerToday("auto");
      normalizeProgrammeWeekScroll();
    }

    if (wrap.dataset.programmesScrollInit === "true") return;
    wrap.dataset.programmesScrollInit = "true";

    var todayBtn = document.querySelector("[data-programmes-scroll-today]");
    var prevBtn = document.querySelector("[data-programmes-scroll-prev]");
    var nextBtn = document.querySelector("[data-programmes-scroll-next]");

    if (todayBtn) {
      todayBtn.addEventListener("click", function () {
        centerToday("smooth");
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        scrollProgrammeWeekBy(-1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        scrollProgrammeWeekBy(1);
      });
    }

    wrap.addEventListener("scroll", scheduleProgrammeWeekNormalize, {
      passive: true,
    });

    window.addEventListener("resize", function () {
      if (programmeWeekScrollResizeTimer) {
        clearTimeout(programmeWeekScrollResizeTimer);
      }
      programmeWeekScrollResizeTimer = setTimeout(function () {
        centerToday("auto");
      }, 150);
    });
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

  const getProgrammeColumnDate = (dayKey, weekRepeat) => {
    var dayIndex = WEEKDAY_ORDER.indexOf(dayKey);
    if (dayIndex < 0) return null;

    var weekRange = getThisWeekRange(getDublinDate());
    var weekOffset =
      (Number(weekRepeat) - PROGRAMME_WEEK_PRIMARY_REPEAT) * 7;
    var date = new Date(weekRange.start.getTime());
    date.setDate(weekRange.start.getDate() + weekOffset + dayIndex);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const formatProgrammeColumnDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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

  const MIXLR_TRALEE_EVENT_URL_RE =
    /^https:\/\/mixlr\.com\/tralee-masjid\/events\/\d+\/?$/i;

  const isMixlrTraleeEventUrl = (url) =>
    typeof url === "string" && MIXLR_TRALEE_EVENT_URL_RE.test(url.trim());

  const getMixlrEventProgrammes = (programmes) => {
    if (!Array.isArray(programmes)) return [];

    return programmes
      .filter(function (p) {
        return p && isMixlrTraleeEventUrl(p.listenUrl);
      })
      .map(function (p) {
        return {
          programme: p,
          eventDate: getProgrammeEventDate(p),
        };
      })
      .filter(function (item) {
        return !!item.eventDate;
      })
      .sort(function (a, b) {
        return a.eventDate.getTime() - b.eventDate.getTime();
      });
  };

  const getNextMixlrEventProgramme = (programmes) => {
    const now = getDublinDate();
    const events = getMixlrEventProgrammes(programmes);
    for (let i = 0; i < events.length; i += 1) {
      if (events[i].eventDate.getTime() >= now.getTime()) {
        return events[i].programme;
      }
    }
    return null;
  };

  const renderNextUpEvent = (programmes) => {
    const nameEl = document.getElementById("event-name");
    const startsAtEl = document.getElementById("starts-at");
    const dayEl = document.getElementById("event-day");
    const dateEl = document.getElementById("event-date");
    const monthEl = document.getElementById("event-month");
    const yearEl = document.getElementById("event-year");

    if (
      !nameEl ||
      !startsAtEl ||
      !dayEl ||
      !dateEl ||
      !monthEl ||
      !yearEl
    ) {
      return;
    }

    const nextProgramme = getNextMixlrEventProgramme(programmes);
    if (!nextProgramme) {
      nameEl.textContent = "Check back for upcoming events";
      startsAtEl.textContent = "—";
      dayEl.textContent = "—";
      dateEl.textContent = "—";
      monthEl.textContent = "—";
      yearEl.textContent = "—";
      cachedNextUpProgramme = null;
      syncNextUpEventCard(null);
      return;
    }

    const eventDate = getProgrammeEventDate(nextProgramme);
    if (!eventDate) {
      nameEl.textContent = nextProgramme.name || "Upcoming event";
      startsAtEl.textContent = getProgrammeTimeLabel(nextProgramme);
      dayEl.textContent = "—";
      dateEl.textContent = "—";
      monthEl.textContent = "—";
      yearEl.textContent = "—";
      cachedNextUpProgramme = nextProgramme;
      syncNextUpEventCard(nextProgramme);
      return;
    }

    const startsAt = eventDate.toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

    let eventDay = eventDate.toLocaleDateString("en-GB", {
      weekday: "short",
    });
    const eventDateNum = eventDate.toLocaleDateString("en-GB", {
      day: "2-digit",
    });
    const eventMonth = eventDate.toLocaleDateString("en-GB", {
      month: "short",
    });
    const eventYear = eventDate.toLocaleDateString("en-GB", {
      year: "numeric",
    });

    if (isSameCalendarDay(eventDate, getDublinDate())) {
      eventDay = "Today";
    }

    nameEl.textContent = nextProgramme.name || "Upcoming event";
    startsAtEl.textContent = startsAt;
    dayEl.textContent = eventDay;
    dateEl.textContent = eventDateNum;
    monthEl.textContent = eventMonth;
    yearEl.textContent = eventYear;
    cachedNextUpProgramme = nextProgramme;
    syncNextUpEventCard(nextProgramme);
  };

  const isAdultMonthlyProgramme = (p) => {
    var name = ((p && p.name) || "").toLowerCase();
    if (!name || name.indexOf("monthly") === -1) return false;
    return (
      name.indexOf("adult") !== -1 ||
      /\bmen'?s?\b/.test(name) ||
      /\bwomen'?s?\b/.test(name)
    );
  };

  const isWomensQuranClassProgramme = (p) => {
    var name = ((p && p.name) || "").toLowerCase();
    return /women/i.test(name) && /qur/i.test(name) && name.indexOf("monthly") === -1;
  };

  const createAdultProgrammeSectionLink = (label, sectionId) => {
    var link = document.createElement("a");
    link.href = "#" + (sectionId || "adult-programme");
    link.className = "programmes-adult-section-link";
    link.innerHTML =
      (label || "Segments &amp; venues") +
      ' <i class="fas fa-arrow-right" aria-hidden="true"></i>';
    return link;
  };

  const getProgrammeAnchorId = (p) => {
    if (isAdultMonthlyProgramme(p) || isWomensQuranClassProgramme(p)) {
      return null;
    }
    var name = ((p && p.name) || "").toLowerCase();
    return programmeSlug((p && p.name) || "");
  };

  const programmeHasDetailsContent = (p) => {
    if (!p) return false;
    return !!(
      p.description ||
      p.topic ||
      p.speaker ||
      (typeof p.imageUrl === "string" && p.imageUrl.trim())
    );
  };

  const getProgrammeAudience = (p) => {
    var name = ((p && p.name) || "").toLowerCase();
    if (/hadith|durood|salawat|salat alan|tafseer|tafsir|zaad/i.test(name)) {
      return "all";
    }
    if (/children|child|madrasa|hifz|kids/i.test(name)) return "children";
    if (/youth|teen/i.test(name)) return "youth";
    if (
      isAdultMonthlyProgramme(p) ||
      /women|men|adult|sister|brother|qur.?an class/i.test(name)
    ) {
      return "adults";
    }
    return "all";
  };

  const getProgrammeType = (p) => {
    if (isAdultMonthlyProgramme(p)) return "monthly";
    var name = ((p && p.name) || "").toLowerCase();
    if (/workshop|event|gathering|open day|iftar|eid/i.test(name)) return "event";
    if (/talk|bayaan|lecture|tafseer|monthly/i.test(name)) return "lecture";
    if (/qur.?an|tajweed|class|madrasa|hifz|arabic|education/i.test(name)) {
      return "education";
    }
    if (p && p.topic) return "lecture";
    return "event";
  };

  const getProgrammeCategory = (p) => {
    if (isAdultMonthlyProgramme(p)) return "adult";
    var name = ((p && p.name) || "").toLowerCase();
    if (
      /hadith|durood|salawat|salat alan|tafseer|tafsir|zaad|provisions for the seekers/i.test(
        name,
      )
    ) {
      return "community";
    }
    if (/youth/i.test(name) && !/children/i.test(name)) return "youth";
    if (/children|child|madrasa|hifz|kids/i.test(name)) return "children";
    if (
      /women|men|adult|sister|brother|qur.?an|talk|lecture|bayaan|monthly/i.test(
        name,
      )
    ) {
      return "adult";
    }
    return "community";
  };

  const getProgrammeFilterDays = (p) => {
    var days = Array.isArray(p.weekdays) ? p.weekdays : [];
    return days
      .map(function (d) {
        if (!d || typeof d !== "string") return "";
        return d.trim().slice(0, 3).toLowerCase();
      })
      .filter(Boolean)
      .join(",");
  };

  const getProgrammeSearchText = (p) => {
    var parts = [p.name, p.topic, p.speaker, p.location, p.timeDescription];
    if (p.description) {
      var tmp = document.createElement("div");
      tmp.innerHTML = p.description;
      parts.push(tmp.textContent || "");
    }
    return parts
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  };

  const PROGRAMME_AUDIENCE_LABELS = {
    adults: "Adults",
    youth: "Youth",
    children: "Children",
    all: "All welcome",
  };

  const PROGRAMME_TYPE_LABELS = {
    education: "Education",
    lecture: "Lecture",
    monthly: "Monthly",
    event: "Event",
  };

  let programmeDetailsModalBound = false;
  let cachedNextUpProgramme = null;
  let nextUpEventInteractionBound = false;

  const bindNextUpEventInteraction = () => {
    if (nextUpEventInteractionBound) return;
    nextUpEventInteractionBound = true;

    document.addEventListener("click", function (e) {
      const trigger = e.target.closest("[data-programme-next-up-open]");
      if (!trigger || !cachedNextUpProgramme) return;
      if (e.target.closest(".programmes-next-event-footer a[href]")) return;
      openProgrammeDetailsModal(cachedNextUpProgramme);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      const trigger = e.target.closest("[data-programme-next-up-open]");
      if (!trigger || !cachedNextUpProgramme) return;
      e.preventDefault();
      openProgrammeDetailsModal(cachedNextUpProgramme);
    });
  };

  const syncNextUpEventCard = (programme) => {
    bindNextUpEventInteraction();

    const card = document.querySelector(".programmes-next-event");
    const body = card ? card.querySelector(".programmes-next-event-body") : null;
    const footer = card ? card.querySelector(".programmes-next-event-footer") : null;
    if (!body || !footer) return;

    const detailsBtn = footer.querySelector(".programmes-next-event-details-btn");
    const canOpenDetails =
      programme &&
      (programmeHasDetailsContent(programme) || programme.listenUrl);

    if (canOpenDetails) {
      body.classList.add("programmes-next-event-body--interactive");
      body.setAttribute("data-programme-next-up-open", "");
      body.setAttribute("role", "button");
      body.setAttribute("tabindex", "0");
      body.setAttribute(
        "aria-label",
        "View programme details for " + (programme.name || "upcoming event"),
      );

      if (!detailsBtn) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "programmes-link-more programmes-next-event-details-btn";
        btn.setAttribute("data-programme-next-up-open", "");
        btn.innerHTML =
          'Programme details <i class="fas fa-arrow-right" aria-hidden="true"></i>';
        footer.insertBefore(btn, footer.firstChild);
      }
    } else {
      body.classList.remove("programmes-next-event-body--interactive");
      body.removeAttribute("data-programme-next-up-open");
      body.removeAttribute("role");
      body.removeAttribute("tabindex");
      body.removeAttribute("aria-label");
      if (detailsBtn) detailsBtn.remove();
    }
  };

  const ensureProgrammeDetailsModal = () => {
    if (document.getElementById("programme-details-modal")) return;

    const modal = document.createElement("div");
    modal.id = "programme-details-modal";
    modal.className = "programme-details-modal";
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "programme-details-modal-title");
    modal.setAttribute("aria-describedby", "programme-details-modal-body");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML =
      '<div class="programme-details-modal-backdrop" data-programme-details-dismiss aria-hidden="true"></div>' +
      '<div class="programme-details-modal-dialog">' +
      '<div class="programme-details-modal-card">' +
      '<button type="button" class="programme-details-modal-close" data-programme-details-dismiss aria-label="Close programme details">' +
      '<i class="fas fa-times" aria-hidden="true"></i></button>' +
      '<div class="programme-details-modal-layout">' +
      '<figure class="programme-details-modal-poster" id="programme-details-modal-poster" hidden>' +
      '<img id="programme-details-modal-image" class="programme-details-modal-image" alt="" width="640" height="960">' +
      '<figcaption class="programme-details-modal-poster-badge">Masjid programme</figcaption>' +
      "</figure>" +
      '<div class="programme-details-modal-panel">' +
      '<p class="programme-details-modal-eyebrow">Programme details</p>' +
      '<h2 id="programme-details-modal-title" class="programme-details-modal-title"></h2>' +
      '<div id="programme-details-modal-meta" class="programme-details-modal-meta"></div>' +
      '<div id="programme-details-modal-highlights" class="programme-details-modal-highlights" hidden></div>' +
      '<div id="programme-details-modal-body" class="programme-details-modal-body weekly-programme-description"></div>' +
      '<div id="programme-details-modal-actions" class="programme-details-modal-actions" hidden></div>' +
      "</div></div></div></div>";

    document.body.appendChild(modal);
  };

  const bindProgrammeDetailsModal = () => {
    if (programmeDetailsModalBound) return;
    programmeDetailsModalBound = true;
    ensureProgrammeDetailsModal();

    document.addEventListener("click", function (e) {
      if (!e.target.closest("[data-programme-details-dismiss]")) return;
      const modal = document.getElementById("programme-details-modal");
      if (!modal || modal.hidden) return;
      e.preventDefault();
      closeProgrammeDetailsModal(true);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      const modal = document.getElementById("programme-details-modal");
      if (!modal || modal.hidden) return;
      closeProgrammeDetailsModal(true);
    });
  };

  const closeProgrammeDetailsModal = (animate) => {
    const modal = document.getElementById("programme-details-modal");
    if (!modal) return;

    const finish = () => {
      modal.hidden = true;
      modal.classList.remove("is-visible", "is-leaving");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("programme-details-modal-open");
    };

    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    modal.classList.add("is-leaving");
    modal.classList.remove("is-visible");
    window.setTimeout(finish, 280);
  };

  const openProgrammeDetailsModal = (programme) => {
    if (!programme) return;

    bindProgrammeDetailsModal();
    ensureProgrammeDetailsModal();

    const modal = document.getElementById("programme-details-modal");
    const titleEl = document.getElementById("programme-details-modal-title");
    const metaEl = document.getElementById("programme-details-modal-meta");
    const posterEl = document.getElementById("programme-details-modal-poster");
    const imageEl = document.getElementById("programme-details-modal-image");
    const highlightsEl = document.getElementById("programme-details-modal-highlights");
    const bodyEl = document.getElementById("programme-details-modal-body");
    const actionsEl = document.getElementById("programme-details-modal-actions");
    if (
      !modal ||
      !titleEl ||
      !metaEl ||
      !posterEl ||
      !imageEl ||
      !highlightsEl ||
      !bodyEl ||
      !actionsEl
    ) {
      return;
    }

    titleEl.textContent = programme.name || "Programme";

    metaEl.innerHTML = "";
    const timeLabel = getProgrammeTimeLabel(programme);
    if (timeLabel) {
      const chip = document.createElement("span");
      chip.className = "programme-details-modal-chip";
      chip.innerHTML =
        '<i class="far fa-clock" aria-hidden="true"></i> ' + timeLabel;
      metaEl.appendChild(chip);
    }
    if (programme.location) {
      const chip = document.createElement("span");
      chip.className = "programme-details-modal-chip";
      chip.innerHTML =
        '<i class="fas fa-mosque" aria-hidden="true"></i> ' + programme.location;
      metaEl.appendChild(chip);
    }
    metaEl.hidden = metaEl.childNodes.length === 0;

    if (programme.imageUrl) {
      imageEl.src = programme.imageUrl;
      imageEl.alt = (programme.name || "Programme") + " notice";
      posterEl.hidden = false;
    } else {
      imageEl.removeAttribute("src");
      imageEl.alt = "";
      posterEl.hidden = true;
    }

    highlightsEl.innerHTML = "";
    if (programme.topic) {
      const topicCard = document.createElement("div");
      topicCard.className = "programme-details-modal-highlight";
      topicCard.innerHTML =
        '<span class="programme-details-modal-highlight-label">Topic</span>' +
        '<p class="programme-details-modal-highlight-value"></p>';
      topicCard.querySelector(".programme-details-modal-highlight-value").textContent =
        programme.topic;
      highlightsEl.appendChild(topicCard);
    }
    if (programme.speaker) {
      const speakerCard = document.createElement("div");
      speakerCard.className = "programme-details-modal-highlight";
      speakerCard.innerHTML =
        '<span class="programme-details-modal-highlight-label">Speaker</span>' +
        '<p class="programme-details-modal-highlight-value"></p>';
      speakerCard.querySelector(".programme-details-modal-highlight-value").textContent =
        programme.speaker;
      highlightsEl.appendChild(speakerCard);
    }
    highlightsEl.hidden = highlightsEl.childNodes.length === 0;

    if (programme.description) {
      bodyEl.innerHTML = programme.description;
      bodyEl.hidden = false;
    } else {
      bodyEl.innerHTML = "";
      bodyEl.hidden = true;
    }

    actionsEl.innerHTML = "";
    if (programme.listenUrl) {
      const link = document.createElement("a");
      link.href = programme.listenUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className =
        "programme-details-modal-listen btn btn-kicc btn-kicc-primary";
      link.innerHTML =
        '<i class="fas fa-headphones" aria-hidden="true"></i> Listen live';
      actionsEl.appendChild(link);
      initExternalLinkIcons(actionsEl);
    }
    actionsEl.hidden = actionsEl.childNodes.length === 0;

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("programme-details-modal-open");

    requestAnimationFrame(function () {
      modal.classList.add("is-visible");
      const dialog = modal.querySelector(".programme-details-modal-dialog");
      if (dialog) {
        if (!dialog.hasAttribute("tabindex")) {
          dialog.setAttribute("tabindex", "-1");
        }
        dialog.focus({ preventScroll: true });
      }
    });
  };

  const createScheduleItem = (p, animationDelay, dayKey) => {
    var item = document.createElement("li");
    item.className = "programmes-schedule-item programmes-schedule-item-animate";
    item.dataset.scheduleItem = "";
    item.dataset.scheduleAudience = getProgrammeAudience(p);
    item.dataset.scheduleType = getProgrammeType(p);
    if (dayKey) {
      item.dataset.scheduleDay = dayKey.slice(0, 3).toLowerCase();
    }
    if (typeof animationDelay === "number") {
      item.style.animationDelay = animationDelay + "s";
    }

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

    if (isAdultMonthlyProgramme(p)) {
      var monthlyLink = createAdultProgrammeSectionLink(
        "About this programme",
        "adult-programme",
      );
      monthlyLink.classList.add("programmes-schedule-item-link");
      item.appendChild(monthlyLink);
    } else if (isWomensQuranClassProgramme(p)) {
      var weeklyLink = createAdultProgrammeSectionLink(
        "About this programme",
        "womens-quran-class",
      );
      weeklyLink.classList.add("programmes-schedule-item-link");
      item.appendChild(weeklyLink);
    }

    if (p.speaker) {
      var speaker = document.createElement("span");
      speaker.className = "programmes-schedule-item-speaker";
      speaker.textContent = p.speaker;
      item.appendChild(speaker);
    }

    if (p.location) {
      var location = document.createElement("span");
      location.className = "programmes-schedule-item-location";
      location.innerHTML =
        '<i class="fas fa-mosque" aria-hidden="true"></i> ' + p.location;
      item.appendChild(location);
    }

    if (programmeHasDetailsContent(p)) {
      item.classList.add("programmes-schedule-item--interactive");
      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "button");
      item.setAttribute(
        "aria-label",
        "View details for " + (p.name || "programme"),
      );
      var openDetails = function (e) {
        if (e.target.closest("a")) return;
        e.preventDefault();
        openProgrammeDetailsModal(p);
      };
      item.addEventListener("click", openDetails);
      item.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        if (e.target.closest("a")) return;
        e.preventDefault();
        openProgrammeDetailsModal(p);
      });
    }

    return item;
  };

  const renderOngoingProgrammes = (programmes) => {
    var container = document.getElementById("programmes-ongoing");
    if (!container) return;

    container.innerHTML = "";
    container.hidden = true;
    container.classList.remove("programmes-ongoing-block-animate");

    if (!Array.isArray(programmes) || programmes.length === 0) return;

    container.hidden = false;
    container.classList.add("programmes-ongoing-block-animate");

    var header = document.createElement("header");
    header.className = "programmes-ongoing-header";

    var title = document.createElement("h3");
    title.id = "programmes-ongoing-heading";
    title.className = "programmes-ongoing-title";
    title.innerHTML =
      '<i class="fas fa-infinity" aria-hidden="true"></i> Ongoing programmes';

    var lead = document.createElement("p");
    lead.className = "programmes-ongoing-lead";
    lead.textContent =
      "No fixed weekly slot — see the programme guide below or check the notice board.";

    header.appendChild(title);
    header.appendChild(lead);

    var grid = document.createElement("div");
    grid.className = "programmes-ongoing-grid";

    programmes.forEach(function (p, index) {
      var card = document.createElement("article");
      card.className = "programmes-ongoing-card programmes-ongoing-card-animate";
      card.style.animationDelay = 0.08 + index * 0.07 + "s";

      var name = document.createElement("h4");
      name.className = "programmes-ongoing-card-name";
      name.textContent = p.name || "";

      var time = document.createElement("p");
      time.className = "programmes-ongoing-card-time";
      time.textContent = getProgrammeTimeLabel(p);

      card.appendChild(name);
      card.appendChild(time);

      if (isAdultMonthlyProgramme(p)) {
        card.appendChild(createAdultProgrammeSectionLink("About monthly programme"));
        if (programmeHasDetailsContent(p)) {
          var monthBtn = document.createElement("button");
          monthBtn.type = "button";
          monthBtn.className = "programmes-ongoing-card-link";
          monthBtn.innerHTML =
            'Open programme <i class="fas fa-arrow-right" aria-hidden="true"></i>';
          monthBtn.addEventListener("click", function () {
            var highlights = document.getElementById("adult-programme-highlights");
            if (highlights && !highlights.hidden && highlights.childNodes.length > 0) {
              highlights.scrollIntoView({ behavior: "smooth", block: "start" });
              return;
            }
            openProgrammeDetailsModal(p);
          });
          card.appendChild(monthBtn);
        }
      } else if (programmeHasDetailsContent(p)) {
        var detailsBtn = document.createElement("button");
        detailsBtn.type = "button";
        detailsBtn.className = "programmes-ongoing-card-link";
        detailsBtn.innerHTML =
          'Programme details <i class="fas fa-arrow-right" aria-hidden="true"></i>';
        detailsBtn.addEventListener("click", function () {
          openProgrammeDetailsModal(p);
        });
        card.appendChild(detailsBtn);
      }

      grid.appendChild(card);
    });

    container.appendChild(header);
    container.appendChild(grid);
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

  const appendProgrammeDayColumn = (
    parent,
    day,
    dayIndex,
    weekRepeat,
    options,
  ) => {
    var todayKey = options.todayKey;
    var tomorrowKey = options.tomorrowKey;
    var byDay = options.byDay;
    var isPrimary = weekRepeat === PROGRAMME_WEEK_PRIMARY_REPEAT;

    var col = document.createElement("div");
    col.className = "programmes-day-col";
    col.setAttribute("data-day", day);
    col.setAttribute("data-week-repeat", String(weekRepeat));
    col.setAttribute("data-schedule-day", day.slice(0, 3).toLowerCase());

    if (isPrimary) {
      col.classList.add("programmes-day-col-animate");
      col.style.animationDelay = dayIndex * 0.05 + "s";

      if (day === todayKey) {
        col.classList.add("is-today");
      } else if (day === tomorrowKey) {
        col.classList.add("is-tomorrow");
      }

      if (day === todayKey) {
        var todayBadge = document.createElement("span");
        todayBadge.className = "programmes-day-badge programmes-day-badge-today";
        todayBadge.textContent = "Today";
        col.appendChild(todayBadge);
      } else if (day === tomorrowKey) {
        var tomorrowBadge = document.createElement("span");
        tomorrowBadge.className =
          "programmes-day-badge programmes-day-badge-tomorrow";
        tomorrowBadge.textContent = "Tomorrow";
        col.appendChild(tomorrowBadge);
      }
    } else {
      col.classList.add("programmes-day-col-clone");
    }

    var heading = document.createElement("h3");
    heading.className = "programmes-day-label";

    var abbr = document.createElement("span");
    abbr.className = "programmes-day-abbr";
    abbr.textContent = day.toUpperCase();

    var dateLabel = document.createElement("span");
    dateLabel.className = "programmes-day-date";
    dateLabel.textContent = formatProgrammeColumnDate(
      getProgrammeColumnDate(day, weekRepeat),
    );

    heading.appendChild(abbr);
    heading.appendChild(dateLabel);
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
      dayProgrammes.forEach(function (p, itemIndex) {
        if (isPrimary) {
          listEl.appendChild(
            createScheduleItem(
              p,
              dayIndex * 0.04 + itemIndex * 0.06 + 0.15,
              day,
            ),
          );
        } else {
          listEl.appendChild(createScheduleItem(p, undefined, day));
        }
      });
    }

    col.appendChild(listEl);
    parent.appendChild(col);
    return col;
  };

  const renderProgrammeOverviewList = (container, items, emptyText) => {
    if (!container) return;
    container.innerHTML = "";

    if (!items || items.length === 0) {
      var empty = document.createElement("p");
      empty.className = "prog-overview-empty";
      empty.textContent = emptyText;
      container.appendChild(empty);
      return;
    }

    var list = document.createElement("ul");
    list.className = "prog-overview-list";

    items.forEach(function (p) {
      var li = document.createElement("li");
      li.className = "prog-overview-list-item";

      var time = document.createElement("span");
      time.className = "prog-overview-list-time";
      time.textContent = hasProgrammePrayerName(p)
        ? "After " + String(p.prayerName).trim()
        : getProgrammeChipTime(p) || getProgrammeTimeLabel(p);

      var name = document.createElement("strong");
      name.className = "prog-overview-list-name";
      name.textContent = p.name || "";

      li.appendChild(time);
      li.appendChild(name);

      if (p.speaker) {
        var speaker = document.createElement("span");
        speaker.className = "prog-overview-list-meta";
        speaker.textContent = p.speaker;
        li.appendChild(speaker);
      }

      list.appendChild(li);
    });

    container.appendChild(list);
  };

  const getWeekHighlightProgrammes = (byDay, todayProgrammes, limit) => {
    var max = typeof limit === "number" ? limit : 4;
    var seen = {};
    var highlights = [];

    todayProgrammes.forEach(function (p) {
      var id = programmeIdentity(p);
      seen[id] = true;
    });

    WEEKDAY_ORDER.forEach(function (day) {
      (byDay[day] || []).forEach(function (p) {
        var pid = programmeIdentity(p);
        if (seen[pid] || highlights.length >= max) return;
        seen[pid] = true;
        highlights.push(p);
      });
    });

    return highlights;
  };

  const syncProgrammeOverviewLive = (programme) => {
    var body = document.getElementById("prog-overview-live-body");
    if (!body) return;

    body.innerHTML = "";

    if (!programme) {
      var empty = document.createElement("p");
      empty.className = "prog-overview-empty";
      empty.textContent = "No upcoming live session scheduled. Check Mixlr for past talks.";
      body.appendChild(empty);
      return;
    }

    var title = document.createElement("p");
    title.className = "prog-overview-live-title";
    title.textContent = programme.name || "Upcoming broadcast";

    var meta = document.createElement("p");
    meta.className = "prog-overview-live-meta";
    meta.textContent = getProgrammeTimeLabel(programme) || "See Mixlr for time";

    body.appendChild(title);
    body.appendChild(meta);

    if (programme.speaker) {
      var speaker = document.createElement("p");
      speaker.className = "prog-overview-live-speaker";
      speaker.textContent = programme.speaker;
      body.appendChild(speaker);
    }
  };

  const renderProgrammeOverview = (todayProgrammes, byDay, todayKey) => {
    var todayBody = document.getElementById("prog-overview-today-body");
    var weekBody = document.getElementById("prog-overview-week-body");

    if (todayBody) {
      renderProgrammeOverviewList(
        todayBody,
        todayProgrammes,
        "Nothing scheduled for " + (WEEKDAY_LABELS[todayKey] || "today") + ".",
      );
    }

    if (weekBody) {
      renderProgrammeOverviewList(
        weekBody,
        getWeekHighlightProgrammes(byDay, todayProgrammes, 4),
        "Weekly highlights will appear when programmes are published.",
      );
    }

    syncProgrammeOverviewLive(cachedNextUpProgramme);
  };

  let scheduleFilterState = { audience: "all", day: "all", type: "all" };

  const applyScheduleFilters = () => {
    var columns = document.querySelectorAll(".programmes-day-col[data-schedule-day]");
    var hasActiveFilter =
      scheduleFilterState.audience !== "all" ||
      scheduleFilterState.day !== "all" ||
      scheduleFilterState.type !== "all";

    columns.forEach(function (col) {
      var day = col.getAttribute("data-schedule-day") || "";
      var dayMatch =
        scheduleFilterState.day === "all" ||
        day === scheduleFilterState.day;
      var visibleItems = 0;

      col.querySelectorAll("[data-schedule-item]").forEach(function (item) {
        var match = true;
        if (
          scheduleFilterState.audience !== "all" &&
          item.dataset.scheduleAudience !== scheduleFilterState.audience &&
          item.dataset.scheduleAudience !== "all"
        ) {
          match = false;
        }
        if (
          scheduleFilterState.type !== "all" &&
          item.dataset.scheduleType !== scheduleFilterState.type
        ) {
          match = false;
        }
        item.hidden = !match;
        if (match) visibleItems += 1;
      });

      var emptyNote = col.querySelector(".programmes-day-filter-empty");
      if (hasActiveFilter && dayMatch && visibleItems === 0) {
        if (!emptyNote) {
          emptyNote = document.createElement("p");
          emptyNote.className = "programmes-day-filter-empty";
          emptyNote.textContent = "No matches";
          col.appendChild(emptyNote);
        }
        emptyNote.hidden = false;
      } else if (emptyNote) {
        emptyNote.hidden = true;
      }

      col.hidden = hasActiveFilter && scheduleFilterState.day !== "all" && !dayMatch;
    });
  };

  const initScheduleFilters = () => {
    if (!isActivitiesPage()) return;

    document
      .querySelectorAll(".prog-schedule-filters .prog-filter-pill")
      .forEach(function (pill) {
        if (pill.dataset.boundSchedule) return;
        pill.dataset.boundSchedule = "true";
        pill.addEventListener("click", function () {
          var group = pill.closest("[data-schedule-filter-group]");
          if (!group) return;

          group.querySelectorAll(".prog-filter-pill").forEach(function (sibling) {
            sibling.classList.remove("is-active");
            sibling.setAttribute("aria-pressed", "false");
          });
          pill.classList.add("is-active");
          pill.setAttribute("aria-pressed", "true");

          if (pill.dataset.scheduleFilterAudience !== undefined) {
            scheduleFilterState.audience = pill.dataset.scheduleFilterAudience;
          } else if (pill.dataset.scheduleFilterDay !== undefined) {
            scheduleFilterState.day = pill.dataset.scheduleFilterDay;
          } else if (pill.dataset.scheduleFilterType !== undefined) {
            scheduleFilterState.type = pill.dataset.scheduleFilterType;
          }
          applyScheduleFilters();
        });
      });
  };

  const renderProgrammeSchedule = (programmes) => {
    var container = document.getElementById("programmes-weekly-schedule");
    var todayBanner = document.getElementById("programmes-today-banner");
    if (!container) return;

    container.innerHTML = "";
    renderUpcomingEvents([]);
    renderOngoingProgrammes([]);

    if (todayBanner) {
      todayBanner.hidden = true;
      todayBanner.innerHTML = "";
      todayBanner.classList.remove("programmes-today-banner-animate");
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
      todayBanner.classList.add("programmes-today-banner-animate");

      var bannerLabel = document.createElement("div");
      bannerLabel.className = "programmes-today-banner-label";
      bannerLabel.innerHTML =
        '<i class="fas fa-sun" aria-hidden="true"></i> Today &mdash; ' +
        (WEEKDAY_LABELS[todayKey] || todayKey);

      var bannerList = document.createElement("div");
      bannerList.className = "programmes-today-banner-chips";

      todayProgrammes.forEach(function (p, chipIndex) {
        var chip = document.createElement("article");
        chip.className = "programmes-today-chip programmes-today-chip-animate";
        chip.style.animationDelay = 0.12 + chipIndex * 0.08 + "s";

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

    var tomorrowKey = getTomorrowWeekdayKey(todayKey);

    var columns = document.createElement("div");
    columns.className = "programmes-week-grid";

    var columnOptions = {
      todayKey: todayKey,
      tomorrowKey: tomorrowKey,
      byDay: byDay,
    };

    WEEKDAY_ORDER.forEach(function (day, dayIndex) {
      appendProgrammeDayColumn(
        columns,
        day,
        dayIndex,
        PROGRAMME_WEEK_PRIMARY_REPEAT,
        columnOptions,
      );
    });

    container.appendChild(columns);

    renderOngoingProgrammes(unscheduled);
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
          thumb.decoding = "async";
          thumb.referrerPolicy = "no-referrer";
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

  const getProgrammeTeaser = (p, maxLen) => {
    var limit = typeof maxLen === "number" ? maxLen : 140;
    var text = "";

    if (p && p.topic) {
      text = String(p.topic).trim();
    } else if (p && p.description) {
      var tmp = document.createElement("div");
      tmp.innerHTML = p.description;
      text = (tmp.textContent || "").replace(/\s+/g, " ").trim();
    }

    if (!text) return "";
    if (text.length <= limit) return text;
    return text.slice(0, limit).trim() + "\u2026";
  };

  const programmeHighlightCanOpen = (p) =>
    programmeHasDetailsContent(p) || !!(p && p.listenUrl);

  const createProgrammeHighlightCard = (p) => {
    var card = document.createElement("article");
    card.className = "programme-highlight-card prog-card";
    card.dataset.progCard = "";
    card.dataset.progAudience = getProgrammeAudience(p);
    card.dataset.progType = getProgrammeType(p);
    card.dataset.progCategory = getProgrammeCategory(p);
    card.dataset.progDays = getProgrammeFilterDays(p);
    card.dataset.progSearch = getProgrammeSearchText(p);
    var canOpen = programmeHighlightCanOpen(p);

    var anchorId = getProgrammeAnchorId(p);
    if (anchorId) {
      card.id = anchorId;
    }

    if (canOpen) {
      card.classList.add("programme-highlight-card--interactive");
      card.setAttribute("tabindex", "0");
      card.setAttribute(
        "role",
        programmeHasDetailsContent(p) ? "button" : "link",
      );
      card.setAttribute(
        "aria-label",
        "View full details for " + (p.name || "programme"),
      );
    }

    var hasImage =
      p && typeof p.imageUrl === "string" && p.imageUrl.trim() !== "";

    if (hasImage) {
      card.classList.add("programme-highlight-card--poster");
      var media = document.createElement("div");
      media.className = "programme-highlight-media programme-highlight-media--poster";
      var img = document.createElement("img");
      img.src = p.imageUrl;
      img.alt = (p.name || "Masjid programme") + " notice";
      img.className = "programme-highlight-image";
      img.loading = "lazy";
      media.appendChild(img);
      card.appendChild(media);
    } else {
      var placeholder = document.createElement("div");
      placeholder.className = "programme-highlight-media programme-highlight-media--placeholder";
      placeholder.setAttribute("aria-hidden", "true");
      placeholder.innerHTML = '<i class="fas fa-book-open"></i>';
      card.appendChild(placeholder);
    }

    var body = document.createElement("div");
    body.className = "programme-highlight-body";

    if (p.name) {
      var title = document.createElement("h4");
      title.className = "programme-highlight-title prog-card-title";
      title.textContent = p.name;
      body.appendChild(title);
    }

    var chips = document.createElement("div");
    chips.className = "programme-highlight-chips";

    var metaText = getProgrammeChipTime(p);
    if (metaText) {
      var timeChip = document.createElement("span");
      timeChip.className = "programme-highlight-chip";
      timeChip.innerHTML =
        '<i class="far fa-clock" aria-hidden="true"></i> ' + metaText;
      chips.appendChild(timeChip);
    }

    if (p.location) {
      var locChip = document.createElement("span");
      locChip.className = "programme-highlight-chip";
      locChip.innerHTML =
        '<i class="fas fa-mosque" aria-hidden="true"></i> ' + p.location;
      chips.appendChild(locChip);
    }

    if (chips.childNodes.length > 0) {
      body.appendChild(chips);
    }

    if (p.speaker) {
      var speaker = document.createElement("p");
      speaker.className = "programme-highlight-speaker prog-card-instructor";
      speaker.innerHTML =
        '<span class="prog-card-instructor-label">Instructor</span> ' +
        p.speaker;
      body.appendChild(speaker);
    }

    var teaser = hasImage ? "" : getProgrammeTeaser(p);
    if (teaser) {
      var teaserEl = document.createElement("p");
      teaserEl.className = "programme-highlight-teaser";
      teaserEl.textContent = teaser;
      body.appendChild(teaserEl);
    }

    var footer = document.createElement("div");
    footer.className = "programme-highlight-footer";

    if (programmeHasDetailsContent(p)) {
      var detailsBtn = document.createElement("span");
      detailsBtn.className = "programme-highlight-cta";
      detailsBtn.innerHTML =
        'Learn more <i class="fas fa-arrow-right" aria-hidden="true"></i>';
      footer.appendChild(detailsBtn);
    }

    if (p.listenUrl) {
      var listen = document.createElement("a");
      listen.href = p.listenUrl;
      listen.target = "_blank";
      listen.rel = "noopener noreferrer";
      listen.className = "programme-highlight-listen";
      listen.innerHTML =
        'Listen <i class="fas fa-external-link-alt" aria-hidden="true"></i>';
      listen.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      footer.appendChild(listen);
    }

    if (footer.childNodes.length > 0) {
      body.appendChild(footer);
    }

    card.appendChild(body);

    if (canOpen && programmeHasDetailsContent(p)) {
      var openDetails = function (e) {
        if (e.target.closest(".programme-highlight-listen")) return;
        e.preventDefault();
        openProgrammeDetailsModal(p);
      };
      card.addEventListener("click", openDetails);
      card.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        if (e.target.closest(".programme-highlight-listen")) return;
        e.preventDefault();
        openProgrammeDetailsModal(p);
      });
    }

    return card;
  };

  let programmeFilterState = {
    audience: "all",
    day: "all",
    type: "all",
    search: "",
  };

  const applyProgrammeFilters = () => {
    var cards = document.querySelectorAll("[data-prog-card]");
    var totalVisible = 0;
    var statusEl = document.getElementById("prog-filter-status");
    var hasActiveFilter =
      programmeFilterState.audience !== "all" ||
      programmeFilterState.day !== "all" ||
      programmeFilterState.type !== "all" ||
      programmeFilterState.search !== "";

    cards.forEach(function (card) {
      var match = true;
      var audience = card.dataset.progAudience || "all";
      var type = card.dataset.progType || "event";
      var days = (card.dataset.progDays || "").split(",").filter(Boolean);
      var searchText = card.dataset.progSearch || "";

      if (
        programmeFilterState.audience !== "all" &&
        audience !== programmeFilterState.audience &&
        audience !== "all"
      ) {
        match = false;
      }
      if (programmeFilterState.type !== "all" && type !== programmeFilterState.type) {
        match = false;
      }
      if (
        programmeFilterState.day !== "all" &&
        days.indexOf(programmeFilterState.day) === -1
      ) {
        match = false;
      }
      if (
        programmeFilterState.search &&
        searchText.indexOf(programmeFilterState.search) === -1
      ) {
        match = false;
      }

      card.hidden = !match;
      if (match) totalVisible += 1;
    });

    ["adult", "youth", "children", "community"].forEach(function (cat) {
      var panel = document.getElementById("prog-cat-" + cat);
      if (!panel) return;

      var visibleInCat = panel.querySelectorAll(
        "[data-prog-card]:not([hidden])",
      ).length;
      var countEl = panel.querySelector('[data-prog-count="' + cat + '"]');
      var emptyEl = panel.querySelector('[data-prog-empty="' + cat + '"]');

      if (countEl) {
        if (visibleInCat > 0) {
          countEl.textContent = String(visibleInCat);
          countEl.hidden = false;
        } else {
          countEl.textContent = "";
          countEl.hidden = true;
        }
      }

      if (emptyEl) {
        var showEmpty = hasActiveFilter && visibleInCat === 0;
        if (cat === "adult") {
          var monthlyGrid = document.getElementById("adult-programme-highlights");
          var hasMonthly =
            monthlyGrid &&
            !monthlyGrid.hidden &&
            monthlyGrid.querySelectorAll("[data-prog-card]:not([hidden])").length > 0;
          showEmpty = hasActiveFilter && visibleInCat === 0 && !hasMonthly;
        }
        emptyEl.hidden = !showEmpty;
      }
    });

    if (statusEl) {
      if (hasActiveFilter) {
        statusEl.textContent =
          totalVisible === 0
            ? "No programmes match your filters."
            : totalVisible +
              " programme" +
              (totalVisible === 1 ? "" : "s") +
              " shown";
        statusEl.hidden = false;
      } else {
        statusEl.textContent = "";
        statusEl.hidden = true;
      }
    }
  };

  const pickFeaturedProgramme = (programmes) => {
    if (!Array.isArray(programmes) || !programmes.length) return null;
    var candidates = programmes.filter(function (p) {
      return !isAdultMonthlyProgramme(p) && programmeHasDetailsContent(p);
    });
    candidates.sort(function (a, b) {
      var scoreA =
        (a.imageUrl ? 2 : 0) + (a.speaker ? 1 : 0) + (a.topic ? 1 : 0);
      var scoreB =
        (b.imageUrl ? 2 : 0) + (b.speaker ? 1 : 0) + (b.topic ? 1 : 0);
      return scoreB - scoreA;
    });
    return candidates[0] || programmes[0];
  };

  const renderFeaturedProgramme = (programmes) => {
    var section = document.getElementById("featured-programme");
    var cardEl = document.getElementById("featured-programme-card");
    if (!section || !cardEl) return;

    var featured = pickFeaturedProgramme(programmes);
    if (!featured) {
      section.hidden = true;
      return;
    }

    section.hidden = false;
    cardEl.innerHTML = "";

    if (featured.imageUrl) {
      var media = document.createElement("div");
      media.className = "prog-featured-media";
      var img = document.createElement("img");
      img.src = featured.imageUrl;
      img.alt = (featured.name || "Featured programme") + " notice";
      img.className = "prog-featured-image";
      img.loading = "lazy";
      media.appendChild(img);
      cardEl.appendChild(media);
    }

    var content = document.createElement("div");
    content.className = "prog-featured-content";

    var eyebrow = document.createElement("p");
    eyebrow.className = "prog-featured-eyebrow";
    eyebrow.textContent = PROGRAMME_TYPE_LABELS[getProgrammeType(featured)] || "Programme";
    content.appendChild(eyebrow);

    var title = document.createElement("h3");
    title.className = "prog-featured-title";
    title.textContent = featured.name || "Featured programme";
    content.appendChild(title);

    var teaser = getProgrammeTeaser(featured, 200);
    if (teaser) {
      var desc = document.createElement("p");
      desc.className = "prog-featured-desc";
      desc.textContent = teaser;
      content.appendChild(desc);
    }

    var meta = document.createElement("div");
    meta.className = "prog-featured-meta";
    var timeLabel = getProgrammeChipTime(featured);
    if (timeLabel) {
      var time = document.createElement("span");
      time.innerHTML =
        '<i class="far fa-clock" aria-hidden="true"></i> ' + timeLabel;
      meta.appendChild(time);
    }
    if (featured.location) {
      var loc = document.createElement("span");
      loc.innerHTML =
        '<i class="fas fa-mosque" aria-hidden="true"></i> ' + featured.location;
      meta.appendChild(loc);
    }
    if (featured.speaker) {
      var sp = document.createElement("span");
      sp.innerHTML =
        '<i class="fas fa-user" aria-hidden="true"></i> ' + featured.speaker;
      meta.appendChild(sp);
    }
    if (meta.childNodes.length) content.appendChild(meta);

    var actions = document.createElement("div");
    actions.className = "prog-featured-actions";
    if (programmeHasDetailsContent(featured)) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-kicc btn-kicc-primary prog-featured-btn";
      btn.innerHTML =
        'View details <i class="fas fa-arrow-right" aria-hidden="true"></i>';
      btn.addEventListener("click", function () {
        openProgrammeDetailsModal(featured);
      });
      actions.appendChild(btn);
    }
    var anchorId = getProgrammeAnchorId(featured);
    if (anchorId) {
      var link = document.createElement("a");
      link.href = "#" + anchorId;
      link.className = "btn btn-kicc btn-kicc-ghost prog-featured-btn";
      link.textContent = "In programme guide";
      actions.appendChild(link);
    }
    if (actions.childNodes.length) content.appendChild(actions);

    cardEl.appendChild(content);
  };

  const renderProgrammeCatalog = (programmes) => {
    var adultMonthlyGrid = document.getElementById("adult-programme-highlights");
    var adultEmpty = document.getElementById("adult-programme-empty");
    var adultWeeklyGrid = document.getElementById("adult-weekly-highlights");
    var adultWeeklySection = document.getElementById("womens-quran-class");
    var adultSplit = document.getElementById("programmes-adult-split");
    var youngGrid = document.getElementById("prog-grid-young");
    var categoryGrids = {
      adult: document.getElementById("prog-grid-adult"),
      community: document.getElementById("prog-grid-community"),
    };

    if (!adultMonthlyGrid) return;

    adultMonthlyGrid.innerHTML = "";
    adultMonthlyGrid.hidden = true;
    if (adultEmpty) adultEmpty.hidden = true;

    if (adultWeeklyGrid) {
      adultWeeklyGrid.innerHTML = "";
      adultWeeklyGrid.hidden = true;
    }
    if (adultWeeklySection) adultWeeklySection.hidden = true;
    if (adultSplit) adultSplit.classList.add("programmes-adult-split--monthly-only");

    if (youngGrid) {
      youngGrid.innerHTML = "";
      youngGrid.hidden = true;
    }

    Object.keys(categoryGrids).forEach(function (key) {
      var grid = categoryGrids[key];
      if (!grid) return;
      grid.innerHTML = "";
      grid.hidden = true;
    });

    var list = Array.isArray(programmes) ? programmes : [];
    if (list.length === 0) {
      if (adultEmpty) adultEmpty.hidden = false;
      return;
    }

    var adultMonthly = [];
    var adultWeekly = [];
    var byCategory = { adult: [], youth: [], children: [], community: [] };

    list.forEach(function (p) {
      if (isAdultMonthlyProgramme(p)) {
        adultMonthly.push(p);
        return;
      }
      if (isWomensQuranClassProgramme(p)) {
        adultWeekly.push(p);
        return;
      }
      var cat = getProgrammeCategory(p);
      if (byCategory[cat]) byCategory[cat].push(p);
      else byCategory.community.push(p);
    });

    if (adultMonthly.length > 0) {
      adultMonthlyGrid.hidden = false;
      adultMonthly
        .slice()
        .sort(function (a, b) {
          var an = ((a && a.name) || "").toLowerCase();
          var bn = ((b && b.name) || "").toLowerCase();
          var aWomen = an.indexOf("women") !== -1 || an.indexOf("sister") !== -1;
          var bWomen = bn.indexOf("women") !== -1 || bn.indexOf("sister") !== -1;
          if (aWomen === bWomen) return 0;
          return aWomen ? -1 : 1;
        })
        .forEach(function (p) {
          adultMonthlyGrid.appendChild(createProgrammeHighlightCard(p));
        });
    } else if (adultEmpty) {
      adultEmpty.hidden = false;
    }

    if (adultWeeklyGrid && adultWeekly.length > 0) {
      if (adultWeeklySection) adultWeeklySection.hidden = false;
      if (adultSplit) {
        adultSplit.classList.remove("programmes-adult-split--monthly-only");
      }
      adultWeeklyGrid.hidden = false;
      adultWeekly.forEach(function (p) {
        adultWeeklyGrid.appendChild(createProgrammeHighlightCard(p));
      });
    }

    var youngProgrammes = byCategory.youth.concat(byCategory.children);
    if (youngGrid && youngProgrammes.length > 0) {
      youngGrid.hidden = false;
      youngProgrammes.forEach(function (p) {
        youngGrid.appendChild(createProgrammeHighlightCard(p));
      });
    }

    Object.keys(categoryGrids).forEach(function (cat) {
      var grid = categoryGrids[cat];
      if (!grid || byCategory[cat].length === 0) return;
      grid.hidden = false;
      byCategory[cat].forEach(function (p) {
        grid.appendChild(createProgrammeHighlightCard(p));
      });
    });

    initExternalLinkIcons(document.getElementById("prog-catalog"));
  };

  const initProgrammesPageFilters = () => {
    if (!isActivitiesPage()) return;

    var searchInput = document.getElementById("prog-search-input");
    var searchTimer = null;

    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = "true";
      searchInput.addEventListener("input", function () {
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(function () {
          programmeFilterState.search = searchInput.value.trim().toLowerCase();
          applyProgrammeFilters();
        }, 180);
      });
    }

    document.querySelectorAll(".prog-filter-pill").forEach(function (pill) {
      if (pill.dataset.bound) return;
      pill.dataset.bound = "true";
      pill.addEventListener("click", function () {
        var group = pill.closest("[data-prog-filter-group]");
        if (!group) return;

        group.querySelectorAll(".prog-filter-pill").forEach(function (sibling) {
          sibling.classList.remove("is-active");
          sibling.setAttribute("aria-pressed", "false");
        });
        pill.classList.add("is-active");
        pill.setAttribute("aria-pressed", "true");

        if (pill.dataset.progFilterAudience !== undefined) {
          programmeFilterState.audience = pill.dataset.progFilterAudience;
        } else if (pill.dataset.progFilterDay !== undefined) {
          programmeFilterState.day = pill.dataset.progFilterDay;
        } else if (pill.dataset.progFilterType !== undefined) {
          programmeFilterState.type = pill.dataset.progFilterType;
        }
        applyProgrammeFilters();
      });
    });
  };

  const initProgrammesPageMotion = () => {
    if (!isActivitiesPage()) return;

    var hero = document.querySelector(".prog-hero-inner");
    if (hero) {
      requestAnimationFrame(function () {
        hero.classList.add("is-visible");
      });
    }

    var revealEls = document.querySelectorAll(".prog-reveal");
    if (!revealEls.length) return;

    var reveal = function (el) {
      el.classList.add("is-visible");
    };

    if (!("IntersectionObserver" in window)) {
      revealEls.forEach(reveal);
      return;
    }

    var motionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            reveal(entry.target);
            motionObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    revealEls.forEach(function (el) {
      motionObserver.observe(el);
    });
  };

  const renderProgrammeHighlights = renderProgrammeCatalog;

  const applyProgrammesResponse = (data) => {
    var programmes =
      data && Array.isArray(data.programmes) ? data.programmes : [];
    var recordings =
      data && Array.isArray(data.recordings) ? data.recordings : [];

    latestProgrammeRecordings = recordings;
    renderProgrammeTable(programmes);
    renderProgrammeHighlights(programmes);
    renderRecordings(recordings);
    renderNextUpEvent(programmes);
    if (isPrayerTimesPage()) {
      prayerTimesHubState.programmes = programmes;
      renderPrayerTimesFooterProgrammes(programmes);
    }
    scrollToLocationHash();
    initExternalLinkIcons();
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
    ".madrasa-section-nav, .about-section-nav, .campaign-section-nav, .programmes-section-nav, .contact-section-nav, .prayer-times-section-nav";

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

  const setAnnouncementRibbonNavSuppressed = (suppressed) => {
    const ribbon = document.getElementById("site-announcement-ribbon");
    if (!ribbon) return;
    ribbon.classList.toggle(
      "site-announcement-ribbon--nav-suppressed",
      !!suppressed,
    );
    if (suppressed) {
      ribbon.setAttribute("aria-hidden", "true");
    } else {
      ribbon.removeAttribute("aria-hidden");
    }
  };

  const syncAnnouncementRibbonNavSuppression = () => {
    const ribbon = document.getElementById("site-announcement-ribbon");
    if (!ribbon || ribbon.hidden) {
      setAnnouncementRibbonNavSuppressed(false);
      return;
    }

    const collapseEl = document.getElementById("navbarResponsive");
    const mobileQuery = window.matchMedia("(max-width: 991.98px)");
    if (!collapseEl || !mobileQuery.matches) {
      setAnnouncementRibbonNavSuppressed(false);
      return;
    }
    setAnnouncementRibbonNavSuppressed(
      collapseEl.classList.contains("show"),
    );
  };

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
    const ribbonCounts =
      ribbon &&
      !ribbon.hidden &&
      !ribbon.classList.contains("site-announcement-ribbon--nav-suppressed");
    if (ribbonCounts) {
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
      ".madrasa-section-nav-list, .about-section-nav-list, .campaign-section-nav-list, .programmes-section-nav-list, .contact-section-nav-list, .prayer-times-section-nav-list"
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
    donateLink.href = GOFUNDME_DONATE_URL;
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

  const GOFUNDME_DONATE_URL =
    "https://www.gofundme.com/f/ub7t7-kerry-islamic-cultural-centre-requires-donation/donate?source=btn_donate";
  const SUMUP_DEVELOPER_WHATSAPP = "353833114171";
  const CAMPAIGNS_API_URL =
    "https://getcampaigns-rds3nxm6za-ew.a.run.app";
  const SUMUP_CHECKOUT_API_URL =
    "https://europe-west1-tralee-masjid.cloudfunctions.net/createCheckout";
  const SUMUP_SDK_URL =
    "https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js";
  const SUMUP_MIN_AMOUNT = 1;
  const SUMUP_MAX_AMOUNT = 5000;
  const SUMUP_SUCCESS_RESET_MS = 60000;
  const SUMUP_WIDGET_CURRENCIES = [
    { code: "EUR", label: "Euro", locale: "en-IE", country: "IE" },
    { code: "GBP", label: "British pound", locale: "en-GB", country: "GB" },
    { code: "USD", label: "US dollar", locale: "en-US", country: "US" },
    { code: "CHF", label: "Swiss franc", locale: "de-CH", country: "CH" },
    { code: "DKK", label: "Danish krone", locale: "da-DK", country: "DK" },
    { code: "NOK", label: "Norwegian krone", locale: "nb-NO", country: "NO" },
    { code: "SEK", label: "Swedish krona", locale: "sv-SE", country: "SE" },
    { code: "PLN", label: "Polish zloty", locale: "pl-PL", country: "PL" },
    { code: "CZK", label: "Czech koruna", locale: "cs-CZ", country: "CZ" },
    { code: "HUF", label: "Hungarian forint", locale: "hu-HU", country: "HU" },
    { code: "BGN", label: "Bulgarian lev", locale: "en-GB", country: "BG" },
    { code: "HRK", label: "Croatian kuna", locale: "hr-HR", country: "HR" },
    { code: "RON", label: "Romanian leu", locale: "ro-RO", country: "RO" },
    { code: "BRL", label: "Brazilian real", locale: "pt-BR", country: "BR" },
    { code: "CLP", label: "Chilean peso", locale: "es-CL", country: "CL" },
    { code: "COP", label: "Colombian peso", locale: "es-CO", country: "CO" },
  ];
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

  const CONTACT_MASJID_PLUS_CODE = "7866+QX Tralee, County Kerry";
  const CONTACT_DIRECTIONS_URL =
    "https://www.google.com/maps/dir/?api=1&destination=" +
    encodeURIComponent(CONTACT_MASJID_PLUS_CODE) +
    "&travelmode=driving";

  const initContactPageMotion = () => {
    if (!isContactPage()) return;

    const hero = document.querySelector(".contact-hero-enter");
    if (hero) {
      requestAnimationFrame(function () {
        hero.classList.add("is-visible");
      });
    }

    const revealNodes = document.querySelectorAll(".contact-reveal");
    if (!revealNodes.length) return;

    if (!("IntersectionObserver" in window)) {
      revealNodes.forEach(function (el) {
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
      { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
    );

    revealNodes.forEach(function (el) {
      revealObserver.observe(el);
    });
  };

  const initContactDirections = () => {
    if (!isContactPage()) return;

    document.querySelectorAll("[data-contact-directions]").forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "true";
      btn.addEventListener("click", function () {
        window.open(CONTACT_DIRECTIONS_URL, "_blank", "noopener,noreferrer");
      });
    });
  };

  const CONTACT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const isValidContactEmail = (value) => {
    if (!value || value.length > 254) return false;
    const at = value.indexOf("@");
    if (at <= 0 || at !== value.lastIndexOf("@")) return false;
    if (value.slice(0, at).length > 64) return false;
    return CONTACT_EMAIL_PATTERN.test(value);
  };

  const initContactFormEnhancements = () => {
    if (!isContactPage()) return;

    const form = document.getElementById("contact-form-el");
    if (!form || form.dataset.bound) return;
    form.dataset.bound = "true";

    const nameInput = document.getElementById("contact-name");
    const emailInput = document.getElementById("contact-email");
    const messageInput = document.getElementById("contact-message");
    const messageCount = document.getElementById("contact-message-count");

    const fields = [
      {
        input: nameInput,
        errorEl: document.getElementById("contact-name-error"),
        validate: function () {
          const value = (nameInput.value || "").trim();
          if (!value) return "Please enter your name.";
          if (value.length < 3) {
            return "Name must be at least 3 characters.";
          }
          return "";
        },
      },
      {
        input: emailInput,
        errorEl: document.getElementById("contact-email-error"),
        validate: function () {
          const value = (emailInput.value || "").trim();
          if (!value) return "Please enter your email address.";
          if (!isValidContactEmail(value)) {
            return "Please enter a valid email address (for example name@example.com).";
          }
          return "";
        },
      },
      {
        input: messageInput,
        errorEl: document.getElementById("contact-message-error"),
        validate: function () {
          const value = (messageInput.value || "").trim();
          if (!value) return "Please enter your message.";
          if (value.length < 20) {
            return "Message must be at least 20 characters (" +
              value.length + " so far).";
          }
          return "";
        },
      },
    ];

    const setFieldState = (field, message) => {
      if (!field.input) return false;
      const hasError = !!message;
      field.input.classList.toggle("is-invalid", hasError);
      field.input.classList.toggle("is-valid", !hasError && field.input.value.trim());
      if (field.errorEl) {
        field.errorEl.textContent = message;
        field.errorEl.classList.toggle("is-visible", hasError);
      }
      return !hasError;
    };

    const validateField = (field) => setFieldState(field, field.validate());

    fields.forEach(function (field) {
      if (!field.input) return;
      field.input.addEventListener("blur", function () {
        validateField(field);
      });
      field.input.addEventListener("input", function () {
        if (field.input.classList.contains("is-invalid")) {
          validateField(field);
        }
      });
    });

    const updateMessageCount = () => {
      if (!messageInput || !messageCount) return;
      const length = messageInput.value.length;
      messageCount.textContent = length + " / 2000";
    };

    if (messageInput) {
      messageInput.addEventListener("input", updateMessageCount);
      updateMessageCount();
    }

    form.addEventListener("submit", function (e) {
      let valid = true;
      fields.forEach(function (field) {
        if (!validateField(field)) valid = false;
      });
      if (!valid) {
        e.preventDefault();
        const firstInvalid = form.querySelector(".is-invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      if (emailInput) {
        emailInput.value = emailInput.value.trim();
      }
    });
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

  const initCampaignBankDetails = () => {
    if (!isProjectsPage()) return;

    const toggle = document.getElementById("bank-details-toggle");
    const panel = document.getElementById("bank-details");
    if (!toggle || !panel || toggle.dataset.bound) return;
    toggle.dataset.bound = "true";

    const setOpen = (open) => {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Hide Bank Details" : "View Bank Details";
    };

    toggle.addEventListener("click", function () {
      const willOpen = panel.hidden;
      setOpen(willOpen);
      if (willOpen) {
        panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });

    if (window.location.hash === "#bank-details") {
      setOpen(true);
    }
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

  const initSumUpDonate = () => {
    const panel = document.querySelector("[data-sumup-donate]");
    if (!panel || (!isHomePage() && !isProjectsPage())) return;

    const mountEl = panel.querySelector("[data-sumup-card-mount]");
    const statusEl = panel.querySelector("[data-sumup-status]");
    const customWrap = panel.querySelector("[data-sumup-custom-wrap]");
    const customInput = panel.querySelector("[data-sumup-custom-input]");
    const sandboxRibbon = panel.querySelector("[data-sumup-sandbox-ribbon]");
    const successEl = panel.querySelector("[data-sumup-success]");
    const successAmountEl = panel.querySelector("[data-sumup-success-amount]");
    const successResetEl = panel.querySelector("[data-sumup-success-reset]");
    const donateAgainBtn = panel.querySelector("[data-sumup-donate-again]");
    const errorEl = panel.querySelector("[data-sumup-error]");
    const errorTitleEl = panel.querySelector("[data-sumup-error-title]");
    const errorLeadEl = panel.querySelector("[data-sumup-error-lead]");
    const errorReferenceWrapEl = panel.querySelector("[data-sumup-error-reference-wrap]");
    const errorReferenceLabelEl = panel.querySelector("[data-sumup-error-reference-label]");
    const errorReferenceEl = panel.querySelector("[data-sumup-error-reference]");
    const errorReferenceNoteEl = panel.querySelector("[data-sumup-error-reference-note]");
    const errorStatusEl = panel.querySelector("[data-sumup-error-status]");
    const errorDetailEl = panel.querySelector("[data-sumup-error-detail]");
    const errorWhatsappEl = panel.querySelector("[data-sumup-error-whatsapp]");
    const errorRetryBtn = panel.querySelector("[data-sumup-error-retry]");
    const errorCopyBtn = panel.querySelector("[data-sumup-error-copy]");
    const startDonateBtn = panel.querySelector("[data-sumup-start-donate]");
    const currencySelect = panel.querySelector("[data-sumup-currency]");
    const customLabelEl = panel.querySelector("[data-sumup-custom-label]");
    const consentNoticeEl = panel.querySelector("[data-sumup-consent-notice]");
    const amountButtons = panel.querySelectorAll("[data-sumup-amount]");
    let sumupWidget = null;
    let activeAmount = 10;
    let checkoutRequestId = 0;
    let sdkLoadPromise = null;
    let successResetTimer = null;
    let successCountdownTimer = null;
    let successResetDeadline = 0;
    let checkoutOpen = false;
    let activeCheckoutId = null;
    let lastCheckoutPayload = null;

    const SUMUP_TRANSACTION_CODE_RE = /^T[A-Z0-9]{6,14}$/;

    const extractSumUpSupportInfo = (body, checkoutId) => {
      const info = {
        transactionCode: "",
        checkoutId: checkoutId ? String(checkoutId) : "",
        status: "",
        message: "",
      };
      const codeCandidates = [];

      const collectCode = (value) => {
        if (value === null || value === undefined) return;
        const text = String(value).trim();
        if (text) codeCandidates.push(text);
      };

      if (body && typeof body === "object") {
        collectCode(body.transaction_code);
        collectCode(body.transactionCode);

        if (Array.isArray(body.transactions)) {
          body.transactions.forEach(function (tx) {
            if (!tx || typeof tx !== "object") return;
            collectCode(tx.transaction_code);
            collectCode(tx.transactionCode);
          });
        }

        if (body.status) info.status = String(body.status);
        if (body.message) info.message = String(body.message);
        if (body.id) info.checkoutId = String(body.id);
      }

      for (let i = 0; i < codeCandidates.length; i++) {
        if (SUMUP_TRANSACTION_CODE_RE.test(codeCandidates[i])) {
          info.transactionCode = codeCandidates[i];
          break;
        }
      }
      if (!info.transactionCode) {
        for (let j = 0; j < codeCandidates.length; j++) {
          if (!codeCandidates[j].startsWith("kicc-")) {
            info.transactionCode = codeCandidates[j];
            break;
          }
        }
      }

      return info;
    };

    const buildSumUpSupportWhatsAppUrl = (support, amount, currencyCode) => {
      const parts = [
        "As-salamu alaikum.",
        "My SumUp card donation on traleemasjidkicc.ie did not go through.",
      ];
      if (support && support.transactionCode) {
        parts.push("Transaction code: " + support.transactionCode + ".");
      }
      if (support && support.checkoutId) {
        parts.push("Checkout ID: " + support.checkoutId + ".");
      }
      if (amount !== null && amount !== undefined && currencyCode) {
        parts.push(
          "Amount attempted: " +
            formatDonationAmount(amount, currencyCode) +
            "."
        );
      }
      parts.push("Please can you help investigate?");
      return (
        "https://wa.me/" +
        SUMUP_DEVELOPER_WHATSAPP +
        "?text=" +
        encodeURIComponent(parts.join(" "))
      );
    };

    const hideErrorState = () => {
      if (errorEl) errorEl.setAttribute("hidden", "");
      panel.classList.remove("is-error");
    };

    const showErrorState = (options) => {
      const opts = options || {};
      const support =
        opts.support ||
        extractSumUpSupportInfo(opts.body, opts.checkoutId || activeCheckoutId);
      if (!support.transactionCode && lastCheckoutPayload) {
        const fromCreate = extractSumUpSupportInfo(
          lastCheckoutPayload.checkout || lastCheckoutPayload,
          activeCheckoutId
        );
        if (fromCreate.transactionCode) {
          support.transactionCode = fromCreate.transactionCode;
        }
        if (!support.status && fromCreate.status) {
          support.status = fromCreate.status;
        }
      }
      const amount = opts.amount;
      const currencyCode = opts.currency || getSelectedCurrency();
      const title = opts.title || "Payment not completed";
      const lead =
        opts.lead ||
        "Your card donation did not go through. No confirmation was received from SumUp.";
      const detail = opts.detail || support.message || "";
      const displayCode = support.transactionCode || support.checkoutId || "";
      const usingCheckoutId = !support.transactionCode && !!support.checkoutId;

      unmountWidget();
      closeCheckout();
      setStatus("");
      clearSuccessResetTimers();
      if (successEl) successEl.setAttribute("hidden", "");
      panel.classList.remove("is-success");

      if (errorTitleEl) errorTitleEl.textContent = title;
      if (errorLeadEl) errorLeadEl.textContent = lead;

      if (errorReferenceLabelEl) {
        errorReferenceLabelEl.textContent = support.transactionCode
          ? "Transaction code"
          : "Checkout ID";
      }

      if (errorStatusEl) {
        if (support.status) {
          errorStatusEl.textContent = support.status;
          errorStatusEl.hidden = false;
        } else {
          errorStatusEl.textContent = "";
          errorStatusEl.hidden = true;
        }
      }

      if (errorReferenceWrapEl && errorReferenceEl) {
        if (displayCode) {
          errorReferenceEl.textContent = displayCode;
          errorReferenceWrapEl.hidden = false;
        } else {
          errorReferenceEl.textContent = "";
          errorReferenceWrapEl.hidden = true;
        }
      }

      if (errorReferenceNoteEl) {
        errorReferenceNoteEl.hidden = !usingCheckoutId;
      }

      if (errorDetailEl) {
        const detailText =
          detail && detail.indexOf("Payment status:") !== 0 ? detail : "";
        if (detailText) {
          errorDetailEl.textContent = detailText;
          errorDetailEl.hidden = false;
        } else {
          errorDetailEl.textContent = "";
          errorDetailEl.hidden = true;
        }
      }

      if (errorWhatsappEl) {
        errorWhatsappEl.href = buildSumUpSupportWhatsAppUrl(
          support,
          amount,
          currencyCode
        );
      }

      if (errorEl) {
        errorEl.removeAttribute("hidden");
        panel.classList.add("is-error");
        errorEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    };

    const getSelectedCurrency = () => {
      const code =
        currencySelect && currencySelect.value
          ? currencySelect.value.toUpperCase()
          : "EUR";
      const match = SUMUP_WIDGET_CURRENCIES.find(function (item) {
        return item.code === code;
      });
      return match ? match.code : "EUR";
    };

    const getCurrencyConfig = (currencyCode) => {
      const code = currencyCode || getSelectedCurrency();
      return (
        SUMUP_WIDGET_CURRENCIES.find(function (item) {
          return item.code === code;
        }) || SUMUP_WIDGET_CURRENCIES[0]
      );
    };

    const formatDonationAmount = (amount, currencyCode, compact) => {
      const value = Number(amount);
      if (!Number.isFinite(value)) return "";
      const config = getCurrencyConfig(currencyCode);
      const hasFraction = Math.round(value * 100) % 100 !== 0;
      return new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: config.code,
        minimumFractionDigits: compact && !hasFraction ? 0 : hasFraction ? 2 : 0,
        maximumFractionDigits: 2,
      }).format(value);
    };

    const getAmountRangeMessage = () => {
      const currency = getSelectedCurrency();
      return (
        "Enter an amount between " +
        formatDonationAmount(SUMUP_MIN_AMOUNT, currency, true) +
        " and " +
        formatDonationAmount(SUMUP_MAX_AMOUNT, currency, true) +
        "."
      );
    };

    const updateAmountPickerLabels = () => {
      const currency = getSelectedCurrency();
      amountButtons.forEach(function (btn) {
        const value = btn.getAttribute("data-sumup-amount");
        if (value === "custom") return;
        btn.textContent = formatDonationAmount(Number(value), currency, true);
      });
      if (customLabelEl) {
        customLabelEl.textContent =
          "Custom amount (" + getSelectedCurrency() + ")";
      }
    };

    const clearSuccessResetTimers = () => {
      if (successResetTimer) {
        window.clearTimeout(successResetTimer);
        successResetTimer = null;
      }
      if (successCountdownTimer) {
        window.clearInterval(successCountdownTimer);
        successCountdownTimer = null;
      }
      successResetDeadline = 0;
    };

    const closeCheckout = () => {
      checkoutOpen = false;
      checkoutRequestId += 1;
      panel.classList.remove("is-widget-open");
      unmountWidget();
      setLoading(false);
    };

    const resetToCheckout = () => {
      clearSuccessResetTimers();
      if (successResetEl) successResetEl.textContent = "";
      if (successEl) successEl.setAttribute("hidden", "");
      hideErrorState();
      panel.classList.remove("is-success");
      lastCheckoutPayload = null;
      closeCheckout();
      setStatus("");
    };

    const updateSuccessResetMessage = () => {
      if (!successResetEl || !successResetDeadline) return;
      const secondsLeft = Math.max(
        0,
        Math.ceil((successResetDeadline - Date.now()) / 1000)
      );
      if (secondsLeft <= 0) {
        successResetEl.textContent = "";
        return;
      }
      successResetEl.textContent =
        "Returning to donation options in " + secondsLeft + "s";
    };

    const startSuccessResetTimer = () => {
      clearSuccessResetTimers();
      successResetDeadline = Date.now() + SUMUP_SUCCESS_RESET_MS;
      updateSuccessResetMessage();
      successCountdownTimer = window.setInterval(
        updateSuccessResetMessage,
        1000
      );
      successResetTimer = window.setTimeout(function () {
        resetToCheckout();
      }, SUMUP_SUCCESS_RESET_MS);
    };

    const showSuccessState = (amount) => {
      unmountWidget();
      hideErrorState();
      setStatus("");
      if (successAmountEl) {
        successAmountEl.textContent = formatDonationAmount(
          amount,
          getSelectedCurrency()
        );
      }
      if (successEl) successEl.removeAttribute("hidden");
      panel.classList.add("is-success");
      startSuccessResetTimer();
    };

    const setStatus = (message, type) => {
      if (!statusEl) return;
      statusEl.textContent = message || "";
      statusEl.classList.remove("is-error", "is-success");
      if (type === "error") statusEl.classList.add("is-error");
      if (type === "success") statusEl.classList.add("is-success");
    };

    const setLoading = (isLoading) => {
      panel.classList.toggle("is-loading", isLoading);
      amountButtons.forEach(function (btn) {
        btn.disabled = isLoading;
      });
      if (customInput) customInput.disabled = isLoading;
      if (startDonateBtn) {
        startDonateBtn.disabled =
          isLoading || (hasConsentChoice() && !canUseThirdPartyEmbeds());
      }
      if (currencySelect) currencySelect.disabled = isLoading;
    };

    const parseAmount = (value) => {
      const amount = Number(value);
      if (!Number.isFinite(amount)) return null;
      if (amount < SUMUP_MIN_AMOUNT || amount > SUMUP_MAX_AMOUNT) return null;
      return Math.round(amount * 100) / 100;
    };

    const getSelectedAmount = () => {
      if (activeAmount === "custom") {
        return customInput ? parseAmount(customInput.value) : null;
      }
      return activeAmount;
    };

    const removeSumUpSdk = () => {
      document
        .querySelectorAll('script[src*="gateway.sumup.com"]')
        .forEach(function (script) {
          script.remove();
        });
      sdkLoadPromise = null;
      try {
        delete window.SumUpCard;
      } catch {
        window.SumUpCard = undefined;
      }
    };

    const updateSumUpConsentUi = () => {
      const needsConsent =
        hasConsentChoice() && !canUseThirdPartyEmbeds();
      if (consentNoticeEl) consentNoticeEl.hidden = !needsConsent;
      if (startDonateBtn) startDonateBtn.disabled = needsConsent;
    };

    const loadSumUpSdk = () => {
      if (!canUseThirdPartyEmbeds()) {
        return Promise.reject(
          new Error("Enable third-party embeds in Privacy & cookies to use card payments.")
        );
      }
      if (window.SumUpCard) return Promise.resolve(window.SumUpCard);
      if (sdkLoadPromise) return sdkLoadPromise;

      sdkLoadPromise = new Promise(function (resolve, reject) {
        const script = document.createElement("script");
        script.src = SUMUP_SDK_URL;
        script.async = true;
        script.onload = function () {
          if (window.SumUpCard) {
            resolve(window.SumUpCard);
            return;
          }
          reject(new Error("SumUp SDK loaded without SumUpCard"));
        };
        script.onerror = function () {
          reject(new Error("SumUp SDK failed to load"));
        };
        document.head.appendChild(script);
      });

      return sdkLoadPromise;
    };

    const getCheckoutId = (payload) => {
      if (!payload || typeof payload !== "object") return null;
      if (typeof payload.checkoutId === "string") return payload.checkoutId;
      if (
        payload.checkout &&
        typeof payload.checkout.id === "string"
      ) {
        return payload.checkout.id;
      }
      return null;
    };

    const isSandboxCheckout = (payload) => {
      if (!payload || typeof payload !== "object") return false;
      if (payload.sandbox === true) return true;
      if (payload.checkout && payload.checkout.sandbox === true) return true;
      return false;
    };

    const applySumUpSandboxFromPayload = (payload) => {
      const isSandbox = isSandboxCheckout(payload);
      panel.classList.toggle("is-sandbox-mode", isSandbox);
      if (sandboxRibbon) sandboxRibbon.hidden = !isSandbox;
    };

    const createCheckout = (amount) => {
      const currency = getSelectedCurrency();
      return fetch(SUMUP_CHECKOUT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          currency: currency,
          returnUrl: isProjectsPage()
            ? window.location.origin + "/projects.html#donate"
            : window.location.origin + "/#home-donate",
        }),
      }).then(function (resp) {
        if (!resp.ok) {
          return resp.json().catch(function () {
            return {};
          }).then(function (body) {
            const message =
              body && body.error
                ? body.error
                : "Unable to start secure checkout.";
            throw new Error(message);
          });
        }
        return resp.json();
      });
    };

    const unmountWidget = () => {
      if (sumupWidget && typeof sumupWidget.unmount === "function") {
        sumupWidget.unmount();
      }
      sumupWidget = null;
      if (mountEl) {
        mountEl.innerHTML = "";
        mountEl.hidden = true;
      }
    };

    const mountWidget = (checkoutId) => {
      if (!mountEl || !window.SumUpCard) return;

      activeCheckoutId = checkoutId;
      const currencyConfig = getCurrencyConfig();
      unmountWidget();
      mountEl.hidden = false;

      sumupWidget = window.SumUpCard.mount({
        id: mountEl.id,
        checkoutId: checkoutId,
        donateSubmitButton: true,
        locale: currencyConfig.locale,
        currency: currencyConfig.code,
        country: currencyConfig.country,
        showEmail: false,
        onResponse: function (type, body) {
          const support = extractSumUpSupportInfo(body, activeCheckoutId);
          const amount = getSelectedAmount();
          const currency = getSelectedCurrency();

          if (type === "success") {
            if (body && body.status === "FAILED") {
              showErrorState({
                body: body,
                checkoutId: activeCheckoutId,
                amount: amount,
                currency: currency,
                title: "Payment not completed",
                lead:
                  "SumUp could not complete this donation. Your card should not have been charged.",
              });
              return;
            }
            showSuccessState(amount);
            return;
          }
          if (type === "fail") {
            showErrorState({
              body: body,
              checkoutId: activeCheckoutId,
              amount: amount,
              currency: currency,
              title: "Payment not completed",
              lead:
                "The payment was cancelled or the session ended before your donation went through.",
              detail:
                body && body.message
                  ? body.message
                  : "If you closed the form by mistake, you can try again below.",
            });
            return;
          }
          if (type === "error") {
            showErrorState({
              body: body,
              checkoutId: activeCheckoutId,
              amount: amount,
              currency: currency,
              title: "Payment could not be processed",
              lead: "SumUp reported an error while processing your card details.",
              detail: body && body.message ? body.message : "",
            });
          }
        },
      });
    };

    const refreshCheckout = () => {
      const amount = getSelectedAmount();
      if (amount === null) {
        setStatus(getAmountRangeMessage(), "error");
        closeCheckout();
        return;
      }

      const requestId = ++checkoutRequestId;
      setLoading(true);
      setStatus("Preparing secure checkout\u2026");

      return loadSumUpSdk()
        .then(function () {
          return createCheckout(amount);
        })
        .then(function (payload) {
          if (requestId !== checkoutRequestId || !checkoutOpen) return;
          const checkoutId = getCheckoutId(payload);
          if (!checkoutId) {
            throw new Error("Checkout response was incomplete.");
          }
          activeCheckoutId = checkoutId;
          lastCheckoutPayload = payload;
          applySumUpSandboxFromPayload(payload);
          mountWidget(checkoutId);
          setStatus("");
        })
        .catch(function (err) {
          if (requestId !== checkoutRequestId) return;
          console.error("SumUp checkout error", err);
          showErrorState({
            body: null,
            checkoutId: activeCheckoutId,
            amount: getSelectedAmount(),
            currency: getSelectedCurrency(),
            title: "Could not open card payment",
            lead:
              err && err.message
                ? err.message
                : "Unable to load the secure payment form right now.",
            detail:
              "Please try again in a moment, use GoFundMe, or contact website support.",
          });
        })
        .finally(function () {
          if (requestId === checkoutRequestId) {
            setLoading(false);
          }
        });
    };

    const openCheckout = () => {
      if (!canUseThirdPartyEmbeds()) {
        setStatus(
          "Enable Third-party embeds in Privacy & cookies to use SumUp card payments.",
          "error"
        );
        updateSumUpConsentUi();
        return;
      }

      const amount = getSelectedAmount();
      if (amount === null) {
        setStatus(getAmountRangeMessage(), "error");
        return;
      }

      setStatus("");
      checkoutOpen = true;
      panel.classList.add("is-widget-open");
      refreshCheckout();
    };

    amountButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const value = btn.getAttribute("data-sumup-amount");
        activeAmount = value === "custom" ? "custom" : Number(value);

        amountButtons.forEach(function (item) {
          const isActive = item === btn;
          item.classList.toggle("is-active", isActive);
          item.setAttribute("aria-pressed", isActive ? "true" : "false");
        });

        if (customWrap) {
          customWrap.hidden = value !== "custom";
        }

        if (checkoutOpen) {
          closeCheckout();
          setStatus("");
        }

        if (value === "custom" && customInput) {
          customInput.focus();
        }
      });
    });

    if (startDonateBtn) {
      startDonateBtn.addEventListener("click", function () {
        openCheckout();
      });
    }

    if (donateAgainBtn) {
      donateAgainBtn.addEventListener("click", function () {
        resetToCheckout();
      });
    }

    if (errorRetryBtn) {
      errorRetryBtn.addEventListener("click", function () {
        resetToCheckout();
      });
    }

    if (errorCopyBtn && errorReferenceEl) {
      errorCopyBtn.addEventListener("click", function () {
        const text = (errorReferenceEl.textContent || "").trim();
        if (!text || !navigator.clipboard) return;
        navigator.clipboard.writeText(text).then(function () {
          const original = errorCopyBtn.innerHTML;
          errorCopyBtn.textContent = "Copied";
          window.setTimeout(function () {
            errorCopyBtn.innerHTML = original;
          }, 2000);
        }).catch(function () {
          /* clipboard unavailable */
        });
      });
    }

    if (customInput) {
      customInput.addEventListener("change", function () {
        if (checkoutOpen) {
          closeCheckout();
          setStatus("");
        }
      });
    }

    if (currencySelect) {
      currencySelect.addEventListener("change", function () {
        updateAmountPickerLabels();
        if (checkoutOpen) {
          closeCheckout();
          setStatus("");
        }
      });
    }

    kiccSumUpConsentHandlers.teardown = function () {
      closeCheckout();
      resetToCheckout();
      applySumUpSandboxFromPayload(null);
      removeSumUpSdk();
      updateSumUpConsentUi();
    };
    kiccSumUpConsentHandlers.refresh = updateSumUpConsentUi;
    updateSumUpConsentUi();

    updateAmountPickerLabels();
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
    const panelsWrap = document.querySelector(".pillars-faith-panels");
    const tabsEl = document.querySelector(".pillars-faith-tabs");

    const syncFaithTabIndicator = () => {
      const indicator = document.querySelector(".pillars-faith-tab-indicator");
      if (!tabsEl || !indicator) return;

      const active = tabsEl.querySelector(".pillars-faith-tab.is-active");
      if (!active) return;

      indicator.style.top = active.offsetTop + "px";
      indicator.style.left = active.offsetLeft + "px";
      indicator.style.width = active.offsetWidth + "px";
      indicator.style.height = active.offsetHeight + "px";
    };

    const setFaithAccent = (id) => {
      if (panelsWrap) panelsWrap.setAttribute("data-active-faith", id);
      if (tabsEl) tabsEl.setAttribute("data-active-faith", id);
    };

    const activateFaithTab = (tab, tabs, panels) => {
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
        if (active) {
          panel.classList.remove("is-entering");
          void panel.offsetWidth;
          panel.classList.add("is-entering");
        }
      });
      setFaithAccent(id);
      requestAnimationFrame(syncFaithTabIndicator);
    };

    if (layout) {
      const tabs = layout.querySelectorAll('[role="tab"]');
      const panels = layout.querySelectorAll('[role="tabpanel"]');

      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          activateFaithTab(tab, tabs, panels);
          if (window.matchMedia("(max-width: 991px)").matches) {
            tab.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "center",
            });
          }
        });
      });

      const activeTab = tabsEl && tabsEl.querySelector(".pillars-faith-tab.is-active");
      if (activeTab) {
        setFaithAccent(activeTab.getAttribute("data-faith-tab") || "tawheed");
      }

      window.addEventListener("resize", syncFaithTabIndicator, { passive: true });
      requestAnimationFrame(syncFaithTabIndicator);
    }

    const islamPillars = document.querySelectorAll(".pillars-islam-pillar");
    const islamTriggers = document.querySelectorAll(".pillars-islam-pillar-trigger");
    const islamMobileQuery = window.matchMedia("(max-width: 767px)");

    const setIslamHighlight = (target) => {
      islamPillars.forEach(function (p) {
        p.classList.toggle("is-highlighted", target ? p === target : false);
      });
    };

    islamPillars.forEach(function (pillar) {
      pillar.addEventListener("mouseenter", function () {
        if (!islamMobileQuery.matches) setIslamHighlight(pillar);
      });
      pillar.addEventListener("mouseleave", function () {
        if (!islamMobileQuery.matches) setIslamHighlight(null);
      });
    });

    islamTriggers.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const pillar = btn.closest(".pillars-islam-pillar");
        if (!pillar) return;
        const expanded = pillar.classList.toggle("is-expanded");
        btn.setAttribute("aria-expanded", expanded ? "true" : "false");
        if (islamMobileQuery.matches) {
          document.querySelectorAll(".pillars-islam-pillar.is-expanded").forEach(function (p) {
            if (p !== pillar) {
              p.classList.remove("is-expanded", "is-highlighted");
              const otherBtn = p.querySelector(".pillars-islam-pillar-trigger");
              if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
            }
          });
        }
        setIslamHighlight(expanded ? pillar : null);
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
        if (mobileQuery.matches) {
          setAnnouncementRibbonNavSuppressed(true);
        }
        queueStickyNavOffsetSync();
      })
      .on("hidden.bs.collapse", function () {
        backdrop.classList.remove("is-visible");
        document.body.classList.remove("kicc-nav-open");
        closeOpenDropdowns();
        if (mobileQuery.matches) {
          setAnnouncementRibbonNavSuppressed(false);
        }
        queueStickyNavOffsetSync();
      });

    mobileQuery.addEventListener("change", function () {
      if (!mobileQuery.matches) {
        setAnnouncementRibbonNavSuppressed(false);
        queueStickyNavOffsetSync();
      }
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

  const PRAYER_TIMES_MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getPrayerTimesAllowedWindow = () => {
    const dublin = getDublinDate();
    const currentYear = dublin.getFullYear();
    const currentMonthIndex = dublin.getMonth();
    const nextStart = new Date(currentYear, currentMonthIndex + 1, 1);
    const nextYear = nextStart.getFullYear();
    const nextMonthIndex = nextStart.getMonth();
    const rangeStart = new Date(currentYear, currentMonthIndex, 1);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(currentYear, currentMonthIndex + 2, 0);
    rangeEnd.setHours(23, 59, 59, 999);
    return {
      currentYear: currentYear,
      currentMonthIndex: currentMonthIndex,
      currentMonthName: PRAYER_TIMES_MONTH_NAMES[currentMonthIndex],
      nextYear: nextYear,
      nextMonthIndex: nextMonthIndex,
      nextMonthName: PRAYER_TIMES_MONTH_NAMES[nextMonthIndex],
      rangeStart: rangeStart,
      rangeEnd: rangeEnd,
      periods: [
        {
          year: currentYear,
          monthIndex: currentMonthIndex,
          monthName: PRAYER_TIMES_MONTH_NAMES[currentMonthIndex],
        },
        {
          year: nextYear,
          monthIndex: nextMonthIndex,
          monthName: PRAYER_TIMES_MONTH_NAMES[nextMonthIndex],
        },
      ],
    };
  };

  const prayerTimesPeriodKey = (year, monthIndex) =>
    year + "-" + monthIndex;

  const parsePrayerTimesPeriodKey = (key) => {
    const dash = String(key).indexOf("-");
    return {
      year: Number(key.slice(0, dash)),
      monthIndex: Number(key.slice(dash + 1)),
    };
  };

  const clampPrayerDateToWindow = (date, window) => {
    if (date < window.rangeStart) return new Date(window.rangeStart.getTime());
    if (date > window.rangeEnd) return new Date(window.rangeEnd.getTime());
    return date;
  };

  const isPrayerPeriodAllowed = (year, monthIndex, window) =>
    window.periods.some(function (p) {
      return p.year === year && p.monthIndex === monthIndex;
    });

  const HIJRI_MONTH_SHORT = {
    "Dhul Qadah": "D.Qadah",
    "Dhul Hijjah": "D.Hijjah",
    Muharram: "Muharram",
    Safar: "Safar",
    "Rabi al-awwal": "Rabi I",
    "Rabi al-thani": "Rabi II",
    "Jumada al-awwal": "Jumada I",
    "Jumada al-thani": "Jumada II",
    Rajab: "Rajab",
    Shaban: "Shab.",
    Ramadan: "Ramadan",
    Shawwal: "Shawwal",
  };

  const formatTimetableTime = (raw) => {
    if (!raw) return "—";
    const str = String(raw).trim();
    const match = str.match(/^(\d{1,2})[:.](\d{2})\s*(am|pm)?\b/i);
    if (match) {
      const hour = String(Number(match[1]));
      const mins = match[2];
      const suffix = match[3];
      let time = hour + ":" + mins;
      if (suffix) {
        time += " " + suffix.toLowerCase();
      }
      return time;
    }
    return str
      .replace(/\b0(\d)([:.])/g, "$1$2")
      .replace(/\s+(am|pm)\b/gi, function (_, ap) {
        return " " + ap.toLowerCase();
      });
  };

  const formatHijriShort = (record) => {
    if (!record) return "—";
    const short =
      HIJRI_MONTH_SHORT[record.hijriMonthName] || record.hijriMonthName || "";
    return record.hijriDay + " " + short;
  };

  const buildHijriPeriodLabel = (records) => {
    if (!records || !records.length) return "";
    const first = records[0];
    const last = records[records.length - 1];
    const monthPart = function (r) {
      return HIJRI_MONTH_SHORT[r.hijriMonthName] || r.hijriMonthName;
    };
    if (first.hijriMonthName === last.hijriMonthName && first.hijriYear === last.hijriYear) {
      return monthPart(first) + " " + first.hijriYear + " A.H.";
    }
    const monthNames = [];
    records.forEach(function (r) {
      const m = monthPart(r);
      if (monthNames.indexOf(m) === -1) monthNames.push(m);
    });
    let yearLabel = String(first.hijriYear);
    if (last.hijriYear !== first.hijriYear) {
      yearLabel = first.hijriYear + "-" + String(last.hijriYear).slice(-2);
    }
    return monthNames.join(" & ") + " " + yearLabel + " A.H.";
  };

  const getDaysInMonth = (year, monthIndex) =>
    new Date(year, monthIndex + 1, 0).getDate();

  const getMondayOfWeek = (date) => {
    const d = new Date(date.getTime());
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const findRecordForDate = (records, year, monthIndex, day) => {
    if (!Array.isArray(records)) return null;
    return (
      records.find(function (r) {
        return (
          r.gregorianYear === year &&
          r.gregorianMonth === monthIndex &&
          r.gregorianDay === day
        );
      }) || null
    );
  };

  const isFridayRecord = (record) =>
    record &&
    String(record.dayOfWeek || "")
      .toLowerCase()
      .indexOf("fri") === 0;

  const buildTimetableTableHead = (monthName) => {
    const monthLabel = (monthName || "Month").toUpperCase();
    return (
      "<thead>" +
      '<tr class="prayer-timetable-head-primary">' +
      '<th colspan="2" scope="colgroup" class="prayer-timetable-month-label">' +
      monthLabel +
      "</th>" +
      '<th rowspan="2" scope="col" class="prayer-timetable-hijri-head">Islamic<br>Hijri</th>' +
      '<th colspan="6" scope="colgroup" class="prayer-timetable-group-begin">Adhan Times</th>' +
      '<th colspan="5" scope="colgroup" class="prayer-timetable-group-jamaat">Iqamah Times</th>' +
      "</tr>" +
      '<tr class="prayer-timetable-head-secondary">' +
      '<th scope="col">Date</th><th scope="col">Day</th>' +
      "<th scope=\"col\">Fajr</th><th scope=\"col\">Sunrise</th><th scope=\"col\">Zohr</th><th scope=\"col\">Asar</th><th scope=\"col\">Magrib</th><th scope=\"col\">Isha</th>" +
      '<th scope="col" class="prayer-timetable-jamaat-start">Fajr</th><th scope="col">Zohr</th><th scope="col">Asar</th><th scope="col">Magrib</th><th scope="col">Isha</th>' +
      "</tr></thead>"
    );
  };

  const buildTimetableRowHtml = (record, options) => {
    if (!record) {
      return (
        "<tr><td colspan=\"14\">No data</td></tr>"
      );
    }
    const today = getDublinDate();
    const rowDate = new Date(
      record.gregorianYear,
      record.gregorianMonth,
      record.gregorianDay,
    );
    const classes = [];
    if (isFridayRecord(record)) classes.push("is-friday");
    if (options && options.highlightToday && isSameCalendarDay(rowDate, today)) {
      classes.push("is-today");
    }
    const classAttr = classes.length ? ' class="' + classes.join(" ") + '"' : "";
    return (
      "<tr" +
      classAttr +
      ">" +
      '<th scope="row" class="prayer-timetable-day-num">' +
      record.gregorianDay +
      "</th>" +
      '<td class="prayer-timetable-dow">' +
      (record.dayOfWeek || "—") +
      "</td>" +
      '<td class="prayer-timetable-hijri">' +
      formatHijriShort(record) +
      "</td>" +
      "<td>" +
      formatTimetableTime(record.fajarTime) +
      "</td>" +
      "<td>" +
      formatTimetableTime(record.sunriseTime) +
      "</td>" +
      "<td>" +
      formatTimetableTime(record.dhuharTime) +
      "</td>" +
      "<td>" +
      formatTimetableTime(record.asrTime) +
      "</td>" +
      "<td>" +
      formatTimetableTime(record.maghribTime) +
      "</td>" +
      "<td>" +
      formatTimetableTime(record.ishaTime) +
      "</td>" +
      '<td class="prayer-timetable-jamaat-start">' +
      formatTimetableTime(record.fajarJamahTime) +
      "</td>" +
      "<td>" +
      formatTimetableTime(record.zohrJamahTime) +
      "</td>" +
      "<td>" +
      formatTimetableTime(record.asarJamahTime) +
      "</td>" +
      "<td>" +
      formatTimetableTime(record.maghribJamahTime) +
      "</td>" +
      "<td>" +
      formatTimetableTime(record.ishaJamahTime) +
      "</td>" +
      "</tr>"
    );
  };

  const buildDailyTimetableHtml = (record) => {
    if (!record) {
      return '<p class="mb-0">No timetable data for this date.</p>';
    }
    const row = function (label, value) {
      return (
        "<tr><th scope=\"row\">" +
        label +
        "</th><td>" +
        formatTimetableTime(value) +
        "</td></tr>"
      );
    };
    return (
      '<div class="prayer-timetable-daily">' +
      '<div class="prayer-timetable-daily-meta">' +
      "<span><strong>Gregorian:</strong> " +
      (record.gregorianDateString || "—") +
      "</span>" +
      "<span><strong>Islamic:</strong> " +
      record.hijriDay +
      " " +
      (record.hijriMonthName || "") +
      " " +
      record.hijriYear +
      " AH</span>" +
      "<span><strong>Day:</strong> " +
      (record.dayOfWeek || "—") +
      "</span>" +
      "</div>" +
      '<div class="prayer-timetable-daily-card">' +
      "<h3>Adhan Times</h3>" +
      "<table>" +
      row("Fajr", record.fajarTime) +
      row("Sunrise", record.sunriseTime) +
      row("Zohr", record.dhuharTime) +
      row("Asar", record.asrTime) +
      row("Magrib", record.maghribTime) +
      row("Isha", record.ishaTime) +
      "</table></div>" +
      '<div class="prayer-timetable-daily-card">' +
      "<h3>Iqamah Times</h3>" +
      "<table>" +
      row("Fajr", record.fajarJamahTime) +
      row("Zohr", record.zohrJamahTime) +
      row("Asar", record.asarJamahTime) +
      row("Magrib", record.maghribJamahTime) +
      row("Isha", record.ishaJamahTime) +
      "</table></div></div>"
    );
  };

  let prayerTimesHeroTimer = null;
  let prayerTimesCountdownTimer = null;

  const PRAYER_HERO_ACCENT_CLASSES = [
    "is-prayer-fajr",
    "is-prayer-dhuhr",
    "is-prayer-asr",
    "is-prayer-maghrib",
    "is-prayer-isha",
  ];

  const applyPrayerHeroAccent = (cardEl, iconEl, slotId) => {
    if (!cardEl) return;
    cardEl.classList.remove.apply(cardEl.classList, PRAYER_HERO_ACCENT_CLASSES);
    if (slotId) {
      cardEl.classList.add("is-prayer-" + slotId);
    }
    if (iconEl && slotId && PRAYER_DECK_ICONS[slotId]) {
      iconEl.innerHTML =
        '<i class="fas ' + PRAYER_DECK_ICONS[slotId] + '" aria-hidden="true"></i>';
    }
  };

  const updatePrayerTimesHero = () => {
    if (!isPrayerTimesPage()) return;

    const gregorianEl = document.getElementById("prayer-hero-gregorian");
    const hijriEl = document.getElementById("prayer-hero-hijri");
    const currentEl = document.getElementById("prayer-hero-current");
    const sunriseEl = document.getElementById("prayer-hero-sunrise");
    const nextNameEl = document.getElementById("prayer-hero-next-name");
    const nextLabelEl = document.getElementById("prayer-hero-next-label");
    const countdownEl = document.getElementById("prayer-hero-countdown");
    const nowCard = document.getElementById("prayer-hero-now-card");
    const nextCard = document.getElementById("prayer-hero-next-card");
    const nowIcon = document.getElementById("prayer-hero-now-icon");
    const nextIcon = document.getElementById("prayer-hero-next-icon");
    const d = cachedPrayerDayData;
    const now = getDublinDate();

    if (gregorianEl) {
      gregorianEl.textContent = now.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    }

    if (hijriEl) {
      hijriEl.textContent = d
        ? d.hijriDay + " " + d.hijriMonthName + " " + d.hijriYear
        : "—";
    }

    const state = getSalahTimelineState();

    if (currentEl) {
      currentEl.textContent = state.current ? state.current.label : "—";
    }

    if (nowCard) {
      nowCard.classList.toggle("is-active-prayer", !!state.current);
      applyPrayerHeroAccent(
        nowCard,
        nowIcon,
        state.current ? state.current.id : null,
      );
    }

    if (sunriseEl) {
      sunriseEl.textContent =
        d && d.sunriseTime
          ? "Sunrise " + formatTimetableTime(d.sunriseTime)
          : "";
    }

    let nextSlotId = null;
    if (nextNameEl) {
      if (state.nextEvent) {
        nextNameEl.textContent = state.nextEvent.label;
        nextSlotId = state.nextEvent.prayerId || null;
      } else if (state.nextPrayer) {
        nextNameEl.textContent = state.nextPrayer.label;
        nextSlotId = state.nextPrayer.id;
      } else {
        nextNameEl.textContent = "—";
      }
    }

    if (nextCard) {
      applyPrayerHeroAccent(nextCard, nextIcon, nextSlotId);
      if (nextIcon && !nextSlotId) {
        nextIcon.innerHTML =
          '<i class="fas fa-hourglass-half" aria-hidden="true"></i>';
      }
    }

    if (nextLabelEl && countdownEl) {
      if (state.nextEvent && state.countdownTarget) {
        nextLabelEl.textContent = formatEventChipLabel(state.nextEvent) + " in";
        countdownEl.textContent = formatCountdown(state.countdownTarget);
      } else {
        nextLabelEl.textContent = "Next";
        countdownEl.textContent = "—";
      }
    }
  };

  const updatePrayerTimesViewIndicator = () => {
    const tabs = document.querySelector("[data-prayer-view-tabs]");
    if (!tabs) return;
    const activeTab = tabs.querySelector(".prayer-times-view-tab.is-active");
    const indicator = tabs.querySelector(".prayer-times-view-indicator");
    if (!activeTab || !indicator) return;

    const tabsRect = tabs.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    indicator.style.width = tabRect.width + "px";
    indicator.style.transform =
      "translateX(" + (tabRect.left - tabsRect.left) + "px)";
  };

  const initPrayerTimesPageMotion = () => {
    if (!isPrayerTimesPage()) return;
    if (document.body.dataset.prayerMotionInit) return;
    document.body.dataset.prayerMotionInit = "true";

    const heroEnter = document.querySelector(".prayer-times-hero-enter");
    const liveCards = document.querySelectorAll(".prayer-times-live-card");
    if (heroEnter) {
      requestAnimationFrame(function () {
        heroEnter.classList.add("is-visible");
        liveCards.forEach(function (card, index) {
          window.setTimeout(function () {
            card.classList.add("is-visible");
          }, 100 + index * 90);
        });
      });
    }

    updatePrayerTimesHero();
    if (prayerTimesHeroTimer) clearInterval(prayerTimesHeroTimer);
    prayerTimesHeroTimer = setInterval(updatePrayerTimesHero, 30000);
    if (prayerTimesCountdownTimer) clearInterval(prayerTimesCountdownTimer);
    prayerTimesCountdownTimer = setInterval(function () {
      const countdownEl = document.getElementById("prayer-hero-countdown");
      if (!countdownEl) return;
      const state = getSalahTimelineState();
      if (state.nextEvent && state.countdownTarget) {
        countdownEl.textContent = formatCountdown(state.countdownTarget);
      }
    }, 1000);

    const revealNodes = document.querySelectorAll(".prayer-reveal");
    if ("IntersectionObserver" in window && revealNodes.length) {
      const revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -5% 0px" },
      );
      revealNodes.forEach(function (el) {
        revealObserver.observe(el);
      });
    } else {
      revealNodes.forEach(function (el) {
        el.classList.add("is-visible");
      });
    }

    updatePrayerTimesViewIndicator();
    window.addEventListener("resize", updatePrayerTimesViewIndicator, {
      passive: true,
    });
  };

  const expandPrayerPrintSheetHeight = (sheet, extraPx) => {
    const rows = sheet.querySelectorAll(".prayer-timetable-table tbody tr");
    const rowCount = rows.length;
    if (!rowCount || extraPx <= 0) return;

    const perRow = extraPx / rowCount;

    rows.forEach(function (row) {
      row.style.height = row.offsetHeight + perRow + "px";
    });
  };

  const measurePrayerPrintScale = (clone, page) => {
    const printableWidth = page.clientWidth;
    const printableHeight = page.clientHeight;
    const sheetWidth = clone.offsetWidth;
    let sheetHeight = clone.scrollHeight;

    if (!sheetWidth || !sheetHeight || !printableWidth || !printableHeight) {
      return null;
    }

    let scale = Math.min(
      printableWidth / sheetWidth,
      printableHeight / sheetHeight,
    );

    const widthLimited =
      printableWidth / sheetWidth <= printableHeight / sheetHeight;
    if (widthLimited) {
      const targetUnscaledHeight = printableHeight / scale;
      const slack = targetUnscaledHeight - sheetHeight;
      if (slack > 10) {
        expandPrayerPrintSheetHeight(clone, slack);
        sheetHeight = clone.scrollHeight;
        scale = Math.min(
          printableWidth / sheetWidth,
          printableHeight / sheetHeight,
        );
      }
    }

    return {
      scale: scale,
      sheetWidth: sheetWidth,
      sheetHeight: sheetHeight,
      printableWidth: printableWidth,
      printableHeight: printableHeight,
    };
  };

  const printPrayerTimetableSheet = (sheetEl) => {
    if (!sheetEl) return;

    const cssLink = document.querySelector('link[href*="assets/css/main"]');
    const cssHref = cssLink
      ? cssLink.href
      : new URL("assets/css/main.css", window.location.href).href;
    const faLink = document.querySelector('link[href*="font-awesome"]');
    const faHref = faLink
      ? faLink.href
      : "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css";

    const layoutWidth = sheetEl.offsetWidth;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Prayer timetable print preview");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText =
      "position:fixed;left:-10000px;top:0;width:" +
      layoutWidth +
      "px;height:297mm;border:0;visibility:hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    if (!doc) {
      iframe.remove();
      return;
    }

    doc.open();
    doc.write(
      '<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8">' +
      '<link rel="stylesheet" href="' +
      cssHref +
      '">' +
      '<link rel="stylesheet" href="' +
      faHref +
      '" crossorigin="anonymous">' +
      "<style>" +
      "@page { size: A4 portrait; margin: 4mm; }" +
      "html, body { margin: 0; padding: 0; background: #fff; }" +
      "body.prayer-print-body { margin: 0; padding: 0; background: #fff; }" +
      "#prayer-print-page { width: 202mm; height: 289mm; overflow: hidden; box-sizing: border-box; position: relative; }" +
      "#prayer-print-root { transform-origin: top left; }" +
      ".prayer-timetable-scroll, .prayer-timetable-stage { overflow: visible !important; max-height: none !important; }" +
      "[data-prayer-sheet] { break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; }" +
      ".prayer-reveal { opacity: 1 !important; transform: none !important; }" +
      "a[href]::after { content: none !important; }" +
      ".prayer-print-layout .prayer-timetable-footer-cards { grid-template-columns: repeat(4, 1fr) !important; }" +
      ".prayer-print-layout .prayer-timetable-table tbody tr.is-today td," +
      ".prayer-print-layout .prayer-timetable-table tbody tr.is-today th { box-shadow: none !important; }" +
      ".prayer-print-layout .prayer-timetable-table tbody tr.is-friday.is-today td," +
      ".prayer-print-layout .prayer-timetable-table tbody tr.is-friday.is-today th { background: #b8b8b8 !important; }" +
      "@media print { html, body { margin: 0; padding: 0; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; } #prayer-print-page { width: 202mm; height: 289mm; margin: 0; padding: 0; } }" +
      "</style></head><body class=\"prayer-print-body page-prayer-times\">" +
      '<div id="prayer-print-page"><div id="prayer-print-root"></div></div>' +
      "</body></html>",
    );
    doc.close();

    const root = doc.getElementById("prayer-print-root");
    const page = doc.getElementById("prayer-print-page");
    if (!root || !page) {
      iframe.remove();
      return;
    }

    const clone = sheetEl.cloneNode(true);
    clone.classList.remove("prayer-reveal");
    clone.classList.add("prayer-print-layout");
    clone.style.width = layoutWidth + "px";
    clone.style.maxWidth = "none";

    const imageWaits = [];
    clone.querySelectorAll("img[src]").forEach(function (img) {
      const src = img.getAttribute("src");
      if (src) img.src = new URL(src, window.location.href).href;
      if (!img.complete) {
        imageWaits.push(
          new Promise(function (resolve) {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          }),
        );
      }
    });
    root.appendChild(clone);

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      iframe.remove();
    };

    const applyScale = (metrics) => {
      root.style.width = metrics.sheetWidth + "px";
      root.style.transformOrigin = "top left";
      page.style.paddingLeft = "0";
      page.style.paddingTop = "0";

      const view = doc.defaultView;
      if (view && view.CSS && view.CSS.supports("zoom", "1")) {
        root.style.zoom = String(metrics.scale);
        root.style.transform = "none";
      } else {
        root.style.zoom = "1";
        root.style.transform = "scale(" + metrics.scale + ")";
      }
    };

    const runPrint = () => {
      const metrics = measurePrayerPrintScale(clone, page);
      if (!metrics) {
        cleanup();
        return;
      }

      applyScale(metrics);

      const win = iframe.contentWindow;
      if (!win) {
        cleanup();
        return;
      }

      win.addEventListener("afterprint", cleanup, { once: true });
      window.setTimeout(cleanup, 60000);

      win.focus();
      win.print();
    };

    const waitForAssets = () => {
      const fontsReady = doc.fonts && doc.fonts.ready
        ? doc.fonts.ready
        : Promise.resolve();

      Promise.all([fontsReady].concat(imageWaits))
        .catch(function () {
          return undefined;
        })
        .then(function () {
          requestAnimationFrame(function () {
            requestAnimationFrame(runPrint);
          });
        });
    };

    iframe.addEventListener("load", waitForAssets, { once: true });
    if (doc.readyState === "complete") {
      waitForAssets();
    }
  };

  const initPrayerTimesPage = () => {
    const root = document.querySelector("[data-prayer-times-page]");
    if (!root || root.dataset.prayerInit) return;
    root.dataset.prayerInit = "true";

    const viewTabs = root.querySelectorAll("[data-prayer-view]");
    const yearSelect = root.querySelector("[data-prayer-year]");
    const monthTabs = root.querySelector("[data-prayer-month-tabs]");
    const daySelect = root.querySelector("[data-prayer-day]");
    const dayWrap = root.querySelector("[data-prayer-day-wrap]");
    const prevBtn = root.querySelector("[data-prayer-prev]");
    const nextBtn = root.querySelector("[data-prayer-next]");
    const todayBtn = root.querySelector("[data-prayer-today]");
    const tableHost = root.querySelector("[data-prayer-table-host]");
    const tableStage = root.querySelector("[data-prayer-table-stage]");
    const subtitleEl = root.querySelector("[data-prayer-sheet-subtitle]");
    const periodLabel = root.querySelector("[data-prayer-period-label]");
    const statusEl = root.querySelector("[data-prayer-status]");
    const printBtn = root.querySelector("[data-prayer-print]");

    if (
      !monthTabs ||
      !daySelect ||
      !tableHost ||
      !subtitleEl
    ) {
      return;
    }

    const dublinNow = getIrelandDateParts(getDublinDate());
    const state = {
      view: "month",
      year: dublinNow.year,
      month: dublinNow.monthName,
      monthIndex: PRAYER_TIMES_MONTH_NAMES.indexOf(dublinNow.monthName),
      day: dublinNow.day,
      weekStart: getMondayOfWeek(getDublinDate()),
      monthCache: Object.create(null),
      pdfCache: Object.create(null),
      pdfRequestKey: "",
      loading: false,
    };

    if (state.monthIndex < 0) state.monthIndex = getDublinDate().getMonth();

    const yearWrap = yearSelect ? yearSelect.closest(".prayer-times-selector") : null;
    if (yearWrap) yearWrap.hidden = true;

    const selectMonthPeriod = (periodKey) => {
      const parsed = parsePrayerTimesPeriodKey(periodKey);
      state.year = parsed.year;
      state.monthIndex = parsed.monthIndex;
      state.day = 1;
      refresh();
    };

    const populateMonthTabs = () => {
      const w = getWindow();
      const sameYear = w.currentYear === w.nextYear;
      const currentKey = prayerTimesPeriodKey(state.year, state.monthIndex);
      monthTabs.innerHTML = "";
      w.periods.forEach(function (period) {
        const key = prayerTimesPeriodKey(period.year, period.monthIndex);
        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = "prayer-times-month-tab";
        tab.setAttribute("role", "tab");
        tab.setAttribute("data-prayer-period-key", key);
        tab.setAttribute(
          "aria-selected",
          key === currentKey ? "true" : "false",
        );
        if (key === currentKey) tab.classList.add("is-active");
        tab.textContent = sameYear
          ? period.monthName
          : period.monthName + " " + period.year;
        tab.addEventListener("click", function () {
          if (key === prayerTimesPeriodKey(state.year, state.monthIndex)) {
            return;
          }
          selectMonthPeriod(key);
        });
        monthTabs.appendChild(tab);
      });
    };

    const clampStateToWindow = () => {
      const w = getWindow();
      if (!isPrayerPeriodAllowed(state.year, state.monthIndex, w)) {
        state.year = w.currentYear;
        state.monthIndex = w.currentMonthIndex;
      }
      const selected = clampPrayerDateToWindow(
        new Date(state.year, state.monthIndex, state.day),
        w,
      );
      state.year = selected.getFullYear();
      state.monthIndex = selected.getMonth();
      state.day = selected.getDate();
      state.month = PRAYER_TIMES_MONTH_NAMES[state.monthIndex];
      if (state.view === "week") {
        state.weekStart = getMondayOfWeek(selected);
        if (state.weekStart < w.rangeStart) {
          state.weekStart = new Date(w.rangeStart.getTime());
        }
        const weekEnd = new Date(state.weekStart.getTime());
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > w.rangeEnd) {
          state.weekStart = new Date(w.rangeEnd.getTime());
          state.weekStart.setDate(state.weekStart.getDate() - 6);
          if (state.weekStart < w.rangeStart) {
            state.weekStart = new Date(w.rangeStart.getTime());
          }
        }
      }
    };

    const updateNavButtons = () => {
      const w = getWindow();
      let atStart = false;
      let atEnd = false;
      if (state.view === "month") {
        atStart =
          state.year === w.currentYear &&
          state.monthIndex === w.currentMonthIndex;
        atEnd =
          state.year === w.nextYear && state.monthIndex === w.nextMonthIndex;
      } else if (state.view === "day") {
        const selected = new Date(state.year, state.monthIndex, state.day);
        atStart = selected <= w.rangeStart;
        atEnd = selected >= w.rangeEnd;
      } else {
        const weekEnd = new Date(state.weekStart.getTime());
        weekEnd.setDate(weekEnd.getDate() + 6);
        atStart = state.weekStart <= w.rangeStart;
        atEnd = weekEnd >= w.rangeEnd;
      }
      if (prevBtn) prevBtn.disabled = atStart;
      if (nextBtn) nextBtn.disabled = atEnd;
    };

    const setStatus = (message, visible) => {
      if (!statusEl) return;
      if (!visible) {
        statusEl.hidden = true;
        statusEl.textContent = "";
        return;
      }
      statusEl.hidden = false;
      statusEl.textContent = message;
    };

    const getWindow = () => getPrayerTimesAllowedWindow();

    const populateDayOptions = () => {
      const daysInMonth = getDaysInMonth(state.year, state.monthIndex);
      if (state.day > daysInMonth) state.day = daysInMonth;
      daySelect.innerHTML = "";
      for (let d = 1; d <= daysInMonth; d += 1) {
        const opt = document.createElement("option");
        opt.value = String(d);
        opt.textContent = String(d);
        if (d === state.day) opt.selected = true;
        daySelect.appendChild(opt);
      }
    };

    const syncSelectors = () => {
      state.month = PRAYER_TIMES_MONTH_NAMES[state.monthIndex];
      populateMonthTabs();
      populateDayOptions();
      daySelect.value = String(state.day);
      if (dayWrap) {
        dayWrap.hidden = state.view !== "day";
      }
      updateNavButtons();
    };

    const getMonthCacheKey = (year, monthName) => year + "-" + monthName;

    const loadMonthData = (year, monthName) => {
      const key = getMonthCacheKey(year, monthName);
      if (state.monthCache[key]) {
        return Promise.resolve(state.monthCache[key]);
      }
      setStatus("Loading timetable…", true);
      return fetchIqamahMonth(year, monthName)
        .then(function (records) {
          const sorted = (records || []).slice().sort(function (a, b) {
            return a.gregorianDay - b.gregorianDay;
          });
          state.monthCache[key] = sorted;
          return sorted;
        })
        .catch(function () {
          state.monthCache[key] = [];
          return [];
        });
    };

    const getMonthsNeededForWeek = () => {
      const seen = Object.create(null);
      const months = [];
      for (let i = 0; i < 7; i += 1) {
        const d = new Date(state.weekStart.getTime());
        d.setDate(d.getDate() + i);
        const monthName = PRAYER_TIMES_MONTH_NAMES[d.getMonth()];
        const key = d.getFullYear() + "-" + monthName;
        if (!seen[key]) {
          seen[key] = true;
          months.push({ year: d.getFullYear(), monthName: monthName });
        }
      }
      return months;
    };

    const loadRecordsForView = () => {
      const w = getWindow();
      if (state.view === "week") {
        const months = getMonthsNeededForWeek().filter(function (m) {
          return w.periods.some(function (p) {
            return p.year === m.year && p.monthName === m.monthName;
          });
        });
        return Promise.all(
          months.map(function (m) {
            return loadMonthData(m.year, m.monthName);
          }),
        ).then(function (results) {
          const merged = [];
          results.forEach(function (arr) {
            merged.push.apply(merged, arr);
          });
          return merged;
        });
      }
      return loadMonthData(state.year, state.month);
    };

    const updateSubtitle = (records) => {
      const hijriPart = buildHijriPeriodLabel(records);
      subtitleEl.textContent =
        state.month +
        " " +
        state.year +
        (hijriPart ? " – " + hijriPart : "");
    };

    const updatePeriodLabel = () => {
      if (state.view === "day") {
        periodLabel.textContent =
          "Showing daily times for " +
          state.day +
          " " +
          state.month +
          " " +
          state.year;
        return;
      }
      if (state.view === "week") {
        const weekEnd = new Date(state.weekStart.getTime());
        weekEnd.setDate(weekEnd.getDate() + 6);
        periodLabel.textContent =
          "Showing weekly times from " +
          state.weekStart.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }) +
          " to " +
          weekEnd.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        return;
      }
      periodLabel.textContent =
        "Showing full month for " + state.month + " " + state.year;
    };

    const paintTable = (records) => {
      updatePeriodLabel();
      setStatus("", false);

      if (state.view === "day") {
        const record = findRecordForDate(
          records,
          state.year,
          state.monthIndex,
          state.day,
        );
        updateSubtitle(record ? [record] : records);
        tableHost.innerHTML = buildDailyTimetableHtml(record);
        if (!record) {
          setStatus("No timetable data available for this date.", true);
        }
        return;
      }

      let rows = [];
      if (state.view === "month") {
        rows = records.slice();
      } else {
        for (let i = 0; i < 7; i += 1) {
          const d = new Date(state.weekStart.getTime());
          d.setDate(d.getDate() + i);
          rows.push(
            findRecordForDate(
              records,
              d.getFullYear(),
              d.getMonth(),
              d.getDate(),
            ),
          );
        }
      }

      const displayRecords = rows.filter(Boolean);
      updateSubtitle(displayRecords.length ? displayRecords : records);

      if (
        !rows.length ||
        rows.every(function (r) {
          return !r;
        })
      ) {
        tableHost.innerHTML =
          '<p class="mb-0">No timetable data available for this period.</p>';
        setStatus("No timetable data available for this period.", true);
        return;
      }

      const body = rows
        .map(function (record) {
          return buildTimetableRowHtml(record, { highlightToday: true });
        })
        .join("");

      tableHost.innerHTML =
        '<table class="prayer-timetable-table">' +
        buildTimetableTableHead(state.month) +
        "<tbody>" +
        body +
        "</tbody></table>";
    };

    const renderTable = (records) => {
      if (!tableStage) {
        paintTable(records);
        return;
      }

      tableStage.classList.add("is-swapping");
      window.setTimeout(function () {
        paintTable(records);
        tableStage.classList.remove("is-swapping");
      }, 180);
    };

    const updatePdfLinksForPeriod = () => {
      const month = state.month;
      const year = state.year;
      const cacheKey = year + "-" + month;

      if (state.pdfCache[cacheKey]) {
        applySalahTimesUrl(state.pdfCache[cacheKey], "all");
        setOfficialTimetableLabels(month);
        return;
      }

      state.pdfRequestKey = cacheKey;
      fetchSalahTimesAssetUrl(month, year, { isRamadan: isRamadan() })
        .then(function (asset) {
          if (!asset || state.pdfRequestKey !== cacheKey) return;
          state.pdfCache[cacheKey] = asset;
          applySalahTimesUrl(asset, "all");
          setOfficialTimetableLabels(month);
        })
        .catch(function (error) {
          console.error(
            "Error loading salah times PDF for " + cacheKey,
            error,
          );
        });
    };

    const refresh = () => {
      clampStateToWindow();
      syncSelectors();
      updatePdfLinksForPeriod();
      loadRecordsForView().then(function (records) {
        renderTable(records);
      });
    };

    const setView = (view) => {
      state.view = view;
      viewTabs.forEach(function (tab) {
        const active = tab.getAttribute("data-prayer-view") === view;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
      });
      updatePrayerTimesViewIndicator();
      if (view === "week") {
        const anchor = new Date(state.year, state.monthIndex, state.day);
        state.weekStart = getMondayOfWeek(anchor);
      }
      refresh();
    };

    const shiftPeriod = (direction) => {
      const w = getWindow();
      if (state.view === "day") {
        const next = new Date(state.year, state.monthIndex, state.day + direction);
        const clamped = clampPrayerDateToWindow(next, w);
        if (clamped.getTime() === new Date(state.year, state.monthIndex, state.day).getTime()) {
          return;
        }
        state.year = clamped.getFullYear();
        state.monthIndex = clamped.getMonth();
        state.day = clamped.getDate();
      } else if (state.view === "week") {
        const candidateStart = getMondayOfWeek(
          new Date(state.weekStart.getTime()),
        );
        candidateStart.setDate(candidateStart.getDate() + direction * 7);
        const candidateEnd = new Date(candidateStart.getTime());
        candidateEnd.setDate(candidateEnd.getDate() + 6);
        if (candidateStart < w.rangeStart || candidateEnd > w.rangeEnd) {
          return;
        }
        state.weekStart = candidateStart;
        const anchor = clampPrayerDateToWindow(candidateStart, w);
        state.year = anchor.getFullYear();
        state.monthIndex = anchor.getMonth();
        state.day = anchor.getDate();
      } else {
        const keys = w.periods.map(function (p) {
          return prayerTimesPeriodKey(p.year, p.monthIndex);
        });
        const currentKey = prayerTimesPeriodKey(state.year, state.monthIndex);
        const nextIdx = keys.indexOf(currentKey) + direction;
        if (nextIdx < 0 || nextIdx >= keys.length) return;
        const period = w.periods[nextIdx];
        state.year = period.year;
        state.monthIndex = period.monthIndex;
        state.day = 1;
      }
      refresh();
    };

    const goToday = () => {
      const parts = getIrelandDateParts(getDublinDate());
      state.year = parts.year;
      state.monthIndex = PRAYER_TIMES_MONTH_NAMES.indexOf(parts.monthName);
      if (state.monthIndex < 0) state.monthIndex = getDublinDate().getMonth();
      state.month = parts.monthName;
      state.day = parts.day;
      state.weekStart = getMondayOfWeek(getDublinDate());
      refresh();
    };

    populateMonthTabs();
    populateDayOptions();

    viewTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        setView(tab.getAttribute("data-prayer-view") || "month");
      });
    });

    daySelect.addEventListener("change", function () {
      state.day = Number(daySelect.value);
      refresh();
    });

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        shiftPeriod(-1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        shiftPeriod(1);
      });
    }
    if (todayBtn) {
      todayBtn.addEventListener("click", goToday);
    }

    const sheetEl = root.querySelector("[data-prayer-sheet]");

    if (printBtn && sheetEl) {
      printBtn.addEventListener("click", function () {
        printPrayerTimetableSheet(sheetEl);
      });
    }

    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get("view");
    if (viewParam === "week" || viewParam === "month" || viewParam === "day") {
      state.view = viewParam;
    }
    const yearParamRaw = params.get("year");
    const monthParamRaw = params.get("month");
    const dayParamRaw = params.get("day");
    if (yearParamRaw !== null && yearParamRaw !== "") {
      const yearParam = Number(yearParamRaw);
      if (!Number.isNaN(yearParam)) state.year = yearParam;
    }
    if (monthParamRaw !== null && monthParamRaw !== "") {
      const monthParam = Number(monthParamRaw);
      if (!Number.isNaN(monthParam) && monthParam >= 0 && monthParam <= 11) {
        state.monthIndex = monthParam;
      }
    }
    if (dayParamRaw !== null && dayParamRaw !== "") {
      const dayParam = Number(dayParamRaw);
      if (!Number.isNaN(dayParam) && dayParam >= 1) state.day = dayParam;
    }

    clampStateToWindow();

    viewTabs.forEach(function (tab) {
      const active = tab.getAttribute("data-prayer-view") === state.view;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (state.view === "week") {
      state.weekStart = getMondayOfWeek(
        new Date(state.year, state.monthIndex, state.day),
      );
    }
    updatePrayerTimesViewIndicator();
    renderPrayerTimesFooterListen();
    refresh();
  };

  const setLocationSpecific = () => {
    if (isHomePage()) {
      setLiveStreamStatus();
      loadProgrammes();
      return;
    }
    if (isActivitiesPage()) {
      setLiveStreamStatus();
      loadProgrammes();
      return;
    }
    if (isProjectsPage()) {
      initBaguetteBox();
    }
    if (isPrayerTimesPage()) {
      initPrayerTimesPage();
      loadProgrammes();
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (isHomePage()) {
      showNotices();
      initHomeNotices();
      initHomePillars();
    }
    if (isPrayerTimesPage()) {
      initPrayerTimesPage();
      initPrayerTimesPageMotion();
      loadProgrammes();
    }
    initSiteAnnouncements();
    initNavSalahPanel();
    initEnhancedFundraiserWidgets();
    initSumUpDonate();
    initCampaignPageMotion();
    initCampaignBankDetails();
    initAboutPageMotion();
    initContactPageMotion();
    if (isActivitiesPage()) {
      initProgrammesPageMotion();
    }
    initContactDirections();
    initContactFormEnhancements();
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
    initExternalLinkIcons();
  });

  window.onload = () => {
    syncStickyNavOffset();
    setSalahTimeUrl();
    setSalahTimes();
    getRandomHadith();
    loadFundraiserProgress();
    setLocationSpecific();
    scrollToLocationHash();
    initExternalLinkIcons();
  };
})();
