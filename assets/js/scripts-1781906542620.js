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

  const setSalahTimeUrl = () => {
    const SALAH_TIMES_KEY = "salahTimesAssetUrl";
    const baseUrl = "https://getsalahtimes-rds3nxm6za-ew.a.run.app";

    // 1) Try to use cached URL first (non-blocking)
    try {
      const cached = localStorage.getItem(SALAH_TIMES_KEY);
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
          localStorage.setItem(SALAH_TIMES_KEY, asset);
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

  const getTodayInIreland = () => {
    // Europe/Dublin handles Irish TZ including DST
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-IE", {
      timeZone: "Europe/Dublin",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).formatToParts(now);
    const day = Number(parts.find((p) => p.type === "day").value);
    const monthName = parts.find((p) => p.type === "month").value; // e.g. "December"
    const year = Number(parts.find((p) => p.type === "year").value);
    return { year, monthName, day, date: now };
  };

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
    document.querySelectorAll(".kicc-nav-prayer-row").forEach(function (el) {
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
      var navRow = navBegins.closest("tr");
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

  const applyToNav = (d) => {
    const lower = (s) => s.toLowerCase();
    setElHtml(
      "nav-hijri",
      `${d.hijriDay} ${d.hijriMonthName} ${d.hijriYear}`,
    );
    const today = new Date();
    const addedDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const monthName = isRamadan()
      ? "Ramadan"
      : addedDays.toLocaleString("default", { month: "long" });
    setElHtml("nav-cur-month", monthName);
    setElHtml("footer-cur-month", monthName);
    setElHtml("nav-fajr-begins", lower(d.fajarTime));
    setElHtml("nav-fajr-jamaat", lower(d.fajarJamahTime));
    setElHtml("nav-sunrise", lower(d.sunriseTime));
    setElHtml("nav-zohr-begins", lower(d.dhuharTime));
    setElHtml("nav-zohr-jamaat", lower(d.zohrJamahTime));
    setElHtml("nav-asar-begins", lower(d.asrTime));
    setElHtml("nav-asar-jamaat", lower(d.asarJamahTime));
    setElHtml("nav-magrib-begins", lower(d.maghribTime));
    setElHtml("nav-magrib-jamaat", lower(d.maghribJamahTime));
    setElHtml("nav-isha-begins", lower(d.ishaTime));
    setElHtml("nav-isha-jamaat", lower(d.ishaJamahTime));
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
    const STORAGE_KEY = "iqamah-today";
    const { year, monthName, day } = getTodayInIreland();
    const cacheKey = STORAGE_KEY;

    // 1. Try localStorage first
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        console.log("Loaded iqamah from localStorage", JSON.stringify(parsed));
        const d = parsed.data && parsed.data[0];
        if (d) {
          applyToHomePage(d);
          applyToNav(d);
          schedulePrayerHighlights(d);
          setDynamicCelebrationToBanner(d);
        }
      } catch (e) {
        console.warn("Failed to parse cached iqamah", e);
      }
    }

    // 2. Always fetch latest data and update UI + cache
    const url =
      "https://getiqamahtimes-rds3nxm6za-ew.a.run.app" +
      `?year=${year}&month=${encodeURIComponent(monthName)}&day=${day}`;

    return fetch(url)
      .then(function (resp) {
        if (!resp.ok) {
          console.error(
            "Error fetching iqamah times",
            resp.status,
            resp.statusText,
          );
          return null;
        }
        return resp.json();
      })
      .then(function (json) {
        if (!json) {
          return;
        }
        console.log("Fetched iqamah from API", json);
        const d = json.data && json.data[0];
        if (!d) {
          console.warn("No data for today in API response");
          return;
        }
        localStorage.setItem(cacheKey, JSON.stringify(json));
        applyToHomePage(d);
        applyToNav(d);
        schedulePrayerHighlights(d);
        setDynamicCelebrationToBanner(d);
      })
      .catch(function (err) {
        console.error("Failed to fetch iqamah times", err);
      });
  };

  const COOKIE_CONSENT_KEY = "kicc-accept-cookie";
  let postCookieConsentDone = false;

  const hasCookieConsent = () => {
    try {
      if (typeof Cookies === "undefined") return false;
      const val = Cookies.get(COOKIE_CONSENT_KEY);
      return val !== undefined && val !== "false";
    } catch {
      return false;
    }
  };

  const runPostCookieConsent = () => {
    if (!hasCookieConsent() || postCookieConsentDone) return;
    postCookieConsentDone = true;
    document.documentElement.classList.remove("cookie-consent-pending");
    document.body.classList.remove("cookie-consent-active");
    if (isHomePage()) {
      showSignUpModal();
    }
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

  const showCookieConsent = () => {
    const el = document.getElementById("cookie-consent");
    if (!el) return;

    el.setAttribute("aria-hidden", "false");
    document.body.classList.add("cookie-consent-active");
    document.documentElement.classList.add("cookie-consent-pending");

    requestAnimationFrame(function () {
      el.classList.add("is-visible");
    });
  };

  const acceptCookiePolicy = () => {
    Cookies.set(COOKIE_CONSENT_KEY, true, { expires: 10 });
    hideCookieConsent(true);
    runPostCookieConsent();
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
      });
    }

    $("#sub-btn-tomorrow").on("click", function () {
      Cookies.set("kicc-modal-tmw", true, { expires: 1 });
      $("#myModal").modal("hide");
    });
    $("#sub-btn-registered").on("click", function () {
      Cookies.set("kicc-modal-registered", true, { expires: 10 });
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
    if (!hasCookieConsent()) return;
    setSignUpCookies();
    initSignUpModal();

    if (!Cookies.get("kicc-modal-tmw")) {
      setTimeout(function () {
        $("#myModal").modal("show");
        setTimeout(function () {
          $("#myModal").modal("hide");
        }, 30000);
      }, 2500);
    }
  };

  const showCookiePolicy = () => {
    const btn = document.getElementById("cookie-accept");
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = "true";
      btn.addEventListener("click", acceptCookiePolicy);
    }

    if (typeof $ !== "undefined") {
      $(document).on("show.bs.modal", function (e) {
        if (!hasCookieConsent()) {
          e.preventDefault();
        }
      });
    }

    if (hasCookieConsent()) {
      hideCookieConsent(false);
      runPostCookieConsent();
    } else {
      showCookieConsent();
    }
  };

  const setSignUpCookies = () => {
    if (Cookies.get("kicc-modal-registered")) {
      Cookies.set("kicc-modal-tmw", true, { expires: 1 });
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
        const raw = localStorage.getItem(HADITH_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };

    const saveToCache = (randomHadith) => {
      try {
        if (!randomHadith) return;
        localStorage.setItem(HADITH_KEY, JSON.stringify(randomHadith));
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
      const cached = localStorage.getItem("iqamah-today");
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

  const getJumuahBannerBadge = () =>
    getDublinDate().getDay() === 5 ? "Today" : "This Friday";

  const refreshJumuahDisplay = () => {
    const cached = loadAnnouncementsFromCache();
    renderJumuahFridayBanner(cached || []);
  };

  const isFridayInDublin = () => getDublinDate().getDay() === 5;

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
    const zohrRow = zohrBegins ? zohrBegins.closest("tr") : null;
    const existing = document.getElementById("nav-jumuah-row");

    if (!isJumuahDisplayWindow() || !jummahTimes || jummahTimes.length === 0) {
      if (existing) existing.remove();
      return;
    }

    if (!zohrRow) return;

    const slot = jummahTimes[0];
    const speech = formatTimeToAmPm(slot.speech) || "—";
    const khutbah = formatTimeToAmPm(slot.khutbah) || "—";

    let row = existing;
    if (!row) {
      row = document.createElement("tr");
      row.id = "nav-jumuah-row";
      row.className = "kicc-nav-jumuah-row kicc-nav-prayer-row";
      zohrRow.insertAdjacentElement("afterend", row);
    }

    row.innerHTML =
      "<th scope=\"row\">Jumu'ah</th>" +
      '<td><span class="nav-jumuah-time">' +
      speech +
      '</span> <span class="nav-jumuah-hint">speech</span></td>' +
      '<td><span class="nav-jumuah-time">' +
      khutbah +
      '</span> <span class="nav-jumuah-hint">khutbah</span></td>';
  };

  const renderJumuahFridayBanner = (announcements) => {
    const banners = document.querySelectorAll(".jumuah-friday-banner");
    const jummahTimes = getJumuahTimes(announcements);
    const show = isJumuahDisplayWindow() && jummahTimes;

    if (banners.length) {
      banners.forEach(function (banner) {
        if (!show) {
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

    renderNavJumuahRow(show ? jummahTimes : null);
  };

  const loadJumuahFridayTimes = () => {
    const cached = loadAnnouncementsFromCache();
    if (cached) {
      renderJumuahFridayBanner(cached);
    }

    const isHome = isHomePage();
    if (isHome && document.getElementById("announcement")) {
      return;
    }

    fetch("https://getannouncements-rds3nxm6za-ew.a.run.app")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (announcements) {
        saveAnnouncementsToCache(announcements);
        renderJumuahFridayBanner(announcements);
      })
      .catch(function () {
        if (!cached) {
          renderJumuahFridayBanner([]);
        }
      });
  };

  const selectAnnouncement = (announcements) => {
    if (!Array.isArray(announcements) || announcements.length === 0) {
      return null;
    }

    const jumuah = announcements.find((a) => a.type === "jumuah") || null;
    const breaking = announcements.find((a) => a.type === "breaking") || null;
    const general = announcements.find((a) => a.type === "general") || null;

    const breakingActive = !!(breaking && breaking.active);
    if (breakingActive) return breaking;

    const isFriday = isFridayInDublin();
    const jumuahActive = !!(jumuah && jumuah.active);
    const generalActive = !!(general && general.active);

    if (isJumuahDisplayWindow() && jumuahActive) return jumuah;

    if (!isFriday && generalActive) return general;

    return null;
  };

  const showDefaultNotice = () => {
    const announcementEl = document.getElementById("announcement");
    if (!announcementEl) return;
    announcementEl.innerHTML =
      '<p>Please check the masjid <a href="#notice-board">notice board.</a></p>';
  };

  const loadAnnouncementsFromCache = () => {
    const ANNOUNCEMENTS_KEY = "kicc-announcements";
    try {
      const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
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
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
    } catch {
      // ignore storage errors
    }
  };

  const getAnnouncement = () => {
    const announcementEl = document.getElementById("announcement");
    const bar = document.getElementById("announcement-bar");
    if (!announcementEl) return;

    const applySelectionToDom = (selected) => {
      if (!selected) {
        if (bar) {
          bar.classList.add("d-none");
          bar.classList.remove("bigEntrance", "stretchLeft");
        }
        announcementEl.innerHTML = "";
        return;
      }

      announcementEl.innerHTML = selected.message || "";

      if (selected.active && bar) {
        bar.classList.add("bigEntrance", "stretchLeft");
        bar.classList.remove("d-none");
      } else if (bar) {
        bar.classList.add("d-none");
        bar.classList.remove("bigEntrance", "stretchLeft");
      }
    };

    // 1) Use cached announcements for fast first paint
    const cached = loadAnnouncementsFromCache();
    if (cached) {
      const selectedCached = selectAnnouncement(cached);
      applySelectionToDom(selectedCached);
      renderJumuahFridayBanner(cached);
    }

    // 2) Always fetch latest, update cache + DOM
    fetch("https://getannouncements-rds3nxm6za-ew.a.run.app")
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((announcements) => {
        saveAnnouncementsToCache(announcements);

        const selected = selectAnnouncement(announcements);
        applySelectionToDom(selected);
        renderJumuahFridayBanner(announcements);
      })
      .catch(() => {
        if (!cached) {
          showDefaultNotice();
        }
      });
  };

  const loadNoticesFromCache = () => {
    const NOTICES_KEY = "notices";
    try {
      const raw = localStorage.getItem(NOTICES_KEY);
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
      localStorage.setItem(NOTICES_KEY, JSON.stringify(notices));
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
      const dismissed = sessionStorage.getItem("kicc-notices-spotlight-dismissed");
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
        sessionStorage.setItem(
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
    var cachedJson = localStorage.getItem(PROGRAMMES_STORAGE_KEY);
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
          localStorage.setItem(PROGRAMMES_STORAGE_KEY, JSON.stringify(data));
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

  const SITE_PAGE_NAV = {
    home: [
      { href: "#home-hero", icon: "fas fa-clock", label: "Salah" },
      { href: "activities.html", icon: "fas fa-book-open", label: "Programmes" },
      { href: "madrasa.html", icon: "fas fa-child", label: "Madrasa" },
      { href: "projects.html", icon: "fas fa-mosque", label: "New Masjid" },
      { href: "contact.html", icon: "fas fa-map-marker-alt", label: "Visit" },
      {
        href: "https://kicc.page.link/gfm",
        icon: "fas fa-hand-holding-heart",
        label: "Donate",
        accent: true,
        external: true,
      },
    ],
    activities: [
      { href: "#listen", icon: "fas fa-broadcast-tower", label: "Listen" },
      { href: "#schedule", icon: "fas fa-calendar-week", label: "Schedule" },
      {
        href: "#weekly-programmes-section",
        icon: "fas fa-book-open",
        label: "Programmes",
      },
      { href: "/", icon: "fas fa-clock", label: "Salah" },
      { href: "contact.html", icon: "fas fa-map-marker-alt", label: "Visit" },
    ],
    madrasa: [
      { href: "#madrasa-schedule", icon: "fas fa-calendar-alt", label: "Schedule" },
      { href: "#madrasa-register", icon: "fas fa-user-plus", label: "Register" },
      { href: "activities.html", icon: "fas fa-book-open", label: "Programmes" },
      { href: "contact.html", icon: "fas fa-map-marker-alt", label: "Visit" },
    ],
    projects: [
      { href: "#campaign-hero", icon: "fas fa-mosque", label: "Campaign" },
      { href: "#campaign-progress", icon: "fas fa-hard-hat", label: "Progress" },
      {
        href: "https://kicc.page.link/gfm",
        icon: "fas fa-hand-holding-heart",
        label: "Donate",
        accent: true,
        external: true,
      },
      { href: "contact.html", icon: "fas fa-map-marker-alt", label: "Visit" },
    ],
    about: [
      { href: "#intro", icon: "fas fa-info-circle", label: "About" },
      { href: "#our-story", icon: "fas fa-book", label: "Story" },
      { href: "#community-today", icon: "fas fa-users", label: "Community" },
      { href: "#our-team", icon: "fas fa-user-friends", label: "Team" },
      { href: "contact.html", icon: "fas fa-map-marker-alt", label: "Visit" },
    ],
    contact: [
      { href: "#contact-heading", icon: "fas fa-envelope", label: "Contact" },
      { href: "#contact-map", icon: "fas fa-map-marker-alt", label: "Map" },
      { href: "/", icon: "fas fa-clock", label: "Salah" },
      { href: "activities.html", icon: "fas fa-book-open", label: "Programmes" },
    ],
  };

  const buildSitePageNavLink = (item, index) => {
    const li = document.createElement("li");
    li.className = "site-page-nav-item";
    li.style.setProperty("--nav-i", index);

    const a = document.createElement("a");
    a.className =
      "site-page-nav-link" + (item.accent ? " site-page-nav-link-accent" : "");
    a.href = item.href;
    if (item.external) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }

    const icon = document.createElement("span");
    icon.className = "site-page-nav-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = '<i class="' + item.icon + '"></i>';

    const label = document.createElement("span");
    label.className = "site-page-nav-label";
    label.textContent = item.label;

    a.appendChild(icon);
    a.appendChild(label);
    li.appendChild(a);
    return li;
  };

  const initSitePageNav = () => {
    const pageKey = getPageKey();
    const items = pageKey ? SITE_PAGE_NAV[pageKey] : null;
    if (!items || items.length === 0) return;

    document.querySelector(".home-quick-nav-section")?.remove();
    document.querySelector(".programmes-quick-nav")?.remove();

    if (document.querySelector(".site-page-nav-section")) return;

    const mainNav = document.querySelector(".kicc-nav-v2");
    if (!mainNav) return;

    const section = document.createElement("nav");
    section.className = "site-page-nav-section site-page-nav-section--ready";
    section.setAttribute("aria-label", "Page quick links");

    const container = document.createElement("div");
    container.className = "container";

    const list = document.createElement("ul");
    list.className = "site-page-nav list-unstyled mb-0";

    items.forEach(function (item, index) {
      list.appendChild(buildSitePageNavLink(item, index));
    });

    container.appendChild(list);
    section.appendChild(container);
    mainNav.insertAdjacentElement("afterend", section);
  };

  const PAGE_SECTION_NAV_SELECTOR =
    ".madrasa-section-nav, .about-section-nav, .campaign-section-nav";

  const initPageSectionNavDock = () => {
    const nav = document.querySelector(PAGE_SECTION_NAV_SELECTOR);
    if (!nav || nav.classList.contains("page-section-nav-dock--ready")) return;

    nav.classList.add("page-section-nav-dock--ready");
    document.body.classList.add("has-page-section-nav");
    document.body.appendChild(nav);

    const lists = nav.querySelectorAll(
      ".madrasa-section-nav-list, .about-section-nav-list, .campaign-section-nav-list"
    );
    lists.forEach(function (list) {
      list.querySelectorAll("li").forEach(function (li, index) {
        li.style.setProperty("--pill-i", index);
      });
    });

    const revealDock = () => {
      nav.classList.add("is-visible");
    };

    requestAnimationFrame(revealDock);

    const links = nav.querySelectorAll('a[href^="#"]');
    const sections = [];
    links.forEach(function (link) {
      const id = decodeURIComponent(link.getAttribute("href").slice(1));
      const el = document.getElementById(id);
      if (el) sections.push({ link: link, el: el });
    });

    const setActiveLink = (activeEl) => {
      sections.forEach(function (item) {
        item.link.classList.toggle("is-active", item.el === activeEl);
      });
    };

    if (sections.length && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              setActiveLink(entry.target);
            }
          });
        },
        {
          rootMargin: "-42% 0px -38% 0px",
          threshold: 0,
        }
      );
      sections.forEach(function (item) {
        observer.observe(item.el);
      });
    }

    links.forEach(function (link) {
      link.addEventListener("click", function () {
        const id = decodeURIComponent(link.getAttribute("href").slice(1));
        const el = document.getElementById(id);
        if (el) setActiveLink(el);
      });
    });
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

      if (nameEl) nameEl.textContent = fundraiser.fundName;
      if (raisedEl) raisedEl.textContent = formatFundraiserAmount(raised, currencyCode);
      if (goalEl) {
        goalEl.textContent =
          "raised of " + formatFundraiserAmount(goal, currencyCode) + " goal";
      }
      if (fillEl) fillEl.style.width = pct + "%";
      if (pctEl) pctEl.textContent = pctLabel;
      if (trackEl) {
        trackEl.setAttribute("aria-valuenow", pctLabel);
        trackEl.setAttribute("aria-valuemin", "0");
        trackEl.setAttribute("aria-valuemax", "100");
        trackEl.setAttribute(
          "aria-label",
          "Campaign " + pctLabel + "% funded"
        );
      }
      el.classList.remove("gfm-progress-loading");
    });
  };

  const loadFundraiserProgress = () => {
    const widgets = document.querySelectorAll("[data-gfm-progress]");
    if (!widgets.length) return;

    try {
      const cached = localStorage.getItem(CAMPAIGN_PROGRESS_KEY);
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
          localStorage.setItem(CAMPAIGN_PROGRESS_KEY, JSON.stringify(fundraiser));
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
      })
      .on("hidden.bs.collapse", function () {
        backdrop.classList.remove("is-visible");
        document.body.classList.remove("kicc-nav-open");
        closeOpenDropdowns();
      });

    nav.querySelectorAll(
      ".kicc-nav-mega-link, .kicc-nav-main > .nav-item:not(.dropdown) .kicc-nav-link, .kicc-nav-donate-btn, .kicc-nav-salah-menu a",
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
      getAnnouncement();
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
    initMobileNav();
    initSitePageNav();
    initPageSectionNavDock();
    addWhatsAppButton();
    addBackToTopButton();
    setFooterYear();
    showCookiePolicy();
  });

  window.onload = () => {
    setSalahTimeUrl();
    setSalahTimes();
    getRandomHadith();
    loadFundraiserProgress();
    loadJumuahFridayTimes();
    setLocationSpecific();
    scrollToLocationHash();
  };
})();
