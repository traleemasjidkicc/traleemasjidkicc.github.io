(function () {
  "use strict";

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
    const year = getToday().getFullYear();
    document.getElementById("footer-year").innerHTML = year;
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
    if (elBody && window.location.pathname === "/") {
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

  const applyToHomePage = (d) => {
    if (!window.location.pathname.endsWith("/")) return;
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

    const today = new Date();
    const addedDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    if (isRamadan()) {
      document.getElementById("cur-month").innerHTML = "Ramadan";
    } else {
      const monthName = addedDays.toLocaleString("default", {
        month: "long",
      });
      document.getElementById("cur-month").innerHTML = monthName;
    }
  };

  const applyToNav = (d) => {
    const lower = (s) => s.toLowerCase();
    document.getElementById("nav-hijri").innerHTML =
      `${d.hijriDay} ${d.hijriMonthName} ${d.hijriYear}`;
    const today = new Date();
    const addedDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const monthName = isRamadan()
      ? "Ramadan"
      : addedDays.toLocaleString("default", { month: "long" });
    document.getElementById("nav-cur-month").innerHTML = monthName;
    document.getElementById("footer-cur-month").innerHTML = monthName;
    document.getElementById("nav-fajr-begins").innerHTML = lower(d.fajarTime);
    document.getElementById("nav-fajr-jamaat").innerHTML = lower(
      d.fajarJamahTime,
    );
    document.getElementById("nav-sunrise").innerHTML = lower(d.sunriseTime);
    document.getElementById("nav-zohr-begins").innerHTML = lower(d.dhuharTime);
    document.getElementById("nav-zohr-jamaat").innerHTML = lower(
      d.zohrJamahTime,
    );
    document.getElementById("nav-asar-begins").innerHTML = lower(d.asrTime);
    document.getElementById("nav-asar-jamaat").innerHTML = lower(
      d.asarJamahTime,
    );
    document.getElementById("nav-magrib-begins").innerHTML = lower(
      d.maghribTime,
    );
    document.getElementById("nav-magrib-jamaat").innerHTML = lower(
      d.maghribJamahTime,
    );
    document.getElementById("nav-isha-begins").innerHTML = lower(d.ishaTime);
    document.getElementById("nav-isha-jamaat").innerHTML = lower(
      d.ishaJamahTime,
    );
  };

  const setDynamicCelebrationToBanner = (date) => {
    try {
      const titleElement = document.getElementById("dynamic-celeb-title");
      const messageElement = document.getElementById("dynamic-celeb-message");
      const dynamicTimeOneLabel = document.getElementById("dynamic-time-one-label");
      const dynamicTimeTwoLabel = document.getElementById("dynamic-time-two-label");
      const dynamicTimeOne = document.getElementById("dynamic-time-one");
      const dynamicTimeTwo = document.getElementById("dynamic-time-two");
      const dynamicTimeOneCircle = document.getElementById("dynamic-time-one-circle");
      const dynamicTimeTwoCircle = document.getElementById("dynamic-time-two-circle");

      // Set all to none initially
      titleElement.style.display = 'none';
      messageElement.style.display = 'none';
      dynamicTimeOneLabel.style.display = 'none';
      dynamicTimeTwoLabel.style.display = 'none';
      dynamicTimeOne.style.display = 'none';
      dynamicTimeTwo.style.display = 'none';
      dynamicTimeOneCircle.style.display = 'none';
      dynamicTimeTwoCircle.style.display = 'none';

      if (isRamadan()) {
        // Ramadan logic
        dynamicTimeOneLabel.innerHTML = "Suhoor ends";
        dynamicTimeTwoLabel.innerHTML = "Iftaar";
        if (date.fajarTime) {
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
        if (date.maghribTime) {
          const partsM = splitTimeAndPeriod(date.maghribTime);
          dynamicTimeTwo.innerHTML = `${partsM.time} <small>${partsM.period}</small>`;
        }
        titleElement.innerHTML = "Ramadan Mubarak";
        messageElement.innerHTML = "";
        titleElement.style.display = '';
        dynamicTimeOneLabel.style.display = '';
        dynamicTimeTwoLabel.style.display = '';
        dynamicTimeOne.style.display = '';
        dynamicTimeTwo.style.display = '';
        dynamicTimeOneCircle.style.display = '';
        dynamicTimeTwoCircle.style.display = '';
      } else if (isEid()) {
        // Eid logic
        dynamicTimeOneLabel.innerHTML = "Speech";
        dynamicTimeTwoLabel.innerHTML = "Salah";
        const partsSpeech = splitTimeAndPeriod("7:30 AM");
        dynamicTimeOne.innerHTML = `${partsSpeech.time} <small>${partsSpeech.period}</small>`;
        const partsSalah = splitTimeAndPeriod("8:00 AM");
        dynamicTimeTwo.innerHTML = `${partsSalah.time} <small>${partsSalah.period}</small>`;
        titleElement.innerHTML = "Eid Mubarak";
        messageElement.innerHTML =
          "Taqabbal Allahu minna wa minkum (May Allah accept from us and from you) and bless you and your family with happiness and prosperity";
        titleElement.style.display = '';
        messageElement.style.display = '';
        dynamicTimeOneLabel.style.display = '';
        dynamicTimeTwoLabel.style.display = '';
        dynamicTimeOne.style.display = '';
        dynamicTimeTwo.style.display = '';
        dynamicTimeOneCircle.style.display = '';
        dynamicTimeTwoCircle.style.display = '';
      } else {
        // Default
        titleElement.innerHTML = "السلام عليكم";
        messageElement.innerHTML =
          "Peace be upon you — welcome to Kerry Islamic Cultural Centre, Tralee.";
        titleElement.style.display = '';
        messageElement.style.display = '';
      }
    } catch (e) {
      console.warn("Unable to set banner elements", e);
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
        setDynamicCelebrationToBanner(d);
      })
      .catch(function (err) {
        console.error("Failed to fetch iqamah times", err);
      });
  };

  const showSignUpModal = () => {
    setSignUpCookies();
    if (!Cookies.get("kicc-modal-tmw")) {
      setTimeout(function () {
        $("#myModal").modal("show");
        setTimeout(function () {
          $("#myModal").modal("hide");
        }, 30000);
      }, 2500);
    }
    $("#sub-btn-tomorrow").on("click", function () {
      $("#myModal").modal("hide");
    });
    $("#sub-btn-registered").on("click", function () {
      $("#myModal").modal("hide");
    });
    $("#nav-news-tab").on("click", function () {
      $("#myModal").modal("show");
    });
  };

  const showCookiePolicy = () => {
    $("#cookie-accept").click(function () {
      Cookies.set("kicc-accept-cookie", true, { expires: 10 });
    });
    if (
      Cookies.get("kicc-accept-cookie") === undefined ||
      Cookies.get("kicc-accept-cookie") === "false"
    ) {
      $("#cookie-bar").toggleClass("show");
      // $("#cookie-bar").show();
    } else {
      $("#cookie-bar").hide();
    }
  };

  const setSignUpCookies = () => {
    if (Cookies.get("kicc-modal-registered")) {
      Cookies.set("kicc-modal-tmw", true, { expires: 1 });
    }
    $("#sub-btn-tomorrow").click(function () {
      Cookies.set("kicc-modal-tmw", true, { expires: 1 });
    });
    $("#sub-btn-registered").click(function () {
      Cookies.set("kicc-modal-registered", true, { expires: 10 });
    });
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

  const renderJummahSchedule = (jummahTimes = []) => {
    const list = document.getElementById("jummah-schedule");
    if (!list) return;

    // keep first li as header
    while (list.children.length > 1) {
      list.removeChild(list.lastElementChild);
    }

    if (!Array.isArray(jummahTimes) || jummahTimes.length === 0) return;

    jummahTimes.forEach((slot, index) => {
      const speechTime = formatTimeToAmPm(slot.speech);
      const khutbahTime = formatTimeToAmPm(slot.khutbah);
      const khutbahLabel =
        jummahTimes.length === 1 ? "Adhan/Khutbah" : `Adhan/Khutbah ${index + 1}`;

      if (speechTime) {
        const liSpeech = document.createElement("li");
        liSpeech.className =
          "list-group-item d-flex justify-content-between align-items-center h5";
        liSpeech.innerHTML = `
        <span>Speech ${jummahTimes.length > 1 ? index + 1 : ""}</span>
        <span class="badge badge-primary badge-pill badge-danger">
          ${speechTime}
        </span>
      `;
        list.appendChild(liSpeech);
      }

      if (khutbahTime) {
        const liKhutbah = document.createElement("li");
        liKhutbah.className =
          "list-group-item d-flex justify-content-between align-items-center h5";
        liKhutbah.innerHTML = `
        <span>${khutbahLabel}</span>
        <span class="badge badge-primary badge-pill badge-danger">
          ${khutbahTime}
        </span>
      `;
        list.appendChild(liKhutbah);
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

    const today = new Date();
    const isFriday = today.getDay() === 5; // 0=Sun .. 5=Fri [web:108][web:111]

    const jumuahActive = !!(jumuah && jumuah.active);
    const breakingActive = !!(breaking && breaking.active);

    if (isFriday) {
      // On Friday: if Jumuah active, use it; else fall back to general / first
      if (jumuahActive) return jumuah;
      if (general) return general;
      return announcements[0];
    }

    // Not Friday:
    // - Prefer active breaking
    if (breakingActive) return breaking;

    // - If both breaking and jumuah inactive, prefer general
    if (!breakingActive && !jumuahActive && general) return general;

    // - Otherwise, fall back to first entry
    return announcements[0];
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
        showDefaultNotice();
        renderJummahSchedule([]);
        return;
      }

      // Always render Jumuah schedule if times exist, even if not Friday or inactive
      if (selected.type === "jumuah" && Array.isArray(selected.jummahTimes)) {
        renderJummahSchedule(selected.jummahTimes);
      } else {
        // But schedule comes only from jumuah; if selected is not jumuah,
        // still try to render schedule from the jumuah announcement if available in cache/data
        renderJummahSchedule([]);
      }

      announcementEl.innerHTML = selected.message || "";

      if (selected.active && bar) {
        bar.classList.add("bigEntrance", "stretchLeft");
        bar.classList.remove("d-none");
      }
    };

    // 1) Use cached announcements for fast first paint
    const cached = loadAnnouncementsFromCache();
    if (cached) {
      const selectedCached = selectAnnouncement(cached);
      applySelectionToDom(selectedCached);
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

        // Additionally, if selected is not jumuah, still ensure schedule is set
        const jumuah = announcements.find((a) => a.type === "jumuah");
        if (jumuah && Array.isArray(jumuah.jummahTimes)) {
          renderJummahSchedule(jumuah.jummahTimes);
        }
      })
      .catch(() => {
        if (!cached) {
          showDefaultNotice();
          renderJummahSchedule([]);
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

  const renderNotices = (notices = []) => {
    const noticeContainer = document.getElementById("noticeContainer");
    if (!noticeContainer) return;

    noticeContainer.innerHTML = "";

    if (!Array.isArray(notices) || notices.length === 0) return;

    notices.forEach((notice) => {
      if (!notice || !notice.url) return;

      const div = document.createElement("div");
      div.classList.add("col-md-6", "col-lg-4", "mx-auto", "fadeIn");

      const a = document.createElement("a");
      a.classList.add("lightbox");
      a.href = notice.url;

      const img = document.createElement("img");
      img.classList.add("img-fluid", "image", "scale-on-hover", "pb-4");
      img.src = notice.url;
      img.alt = "Notice";

      a.appendChild(img);
      div.appendChild(a);
      noticeContainer.appendChild(div);
    });

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

      var bannerLabel = document.createElement("p");
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
    // Avoid duplicates
    if (document.querySelector(".whatsapp-float")) return;

    const waLink = document.createElement("a");
    waLink.href = "https://wa.me/353862440556";
    waLink.target = "_blank";
    waLink.rel = "noopener";
    waLink.className = "whatsapp-float";
    waLink.setAttribute("aria-label", "Chat on WhatsApp");

    const waIcon = document.createElement("i");
    waIcon.className = "fa-brands fa-whatsapp whatsapp-icon";

    waLink.appendChild(waIcon);
    document.body.appendChild(waLink);
  };

  const addBackToTopButton = () => {
    if (!document.body.classList.contains("page-about")) return;
    if (document.querySelector(".back-to-top")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "back-to-top";
    btn.setAttribute("aria-label", "Back to top");
    btn.innerHTML = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const toggleVisibility = () => {
      btn.classList.toggle("is-visible", window.scrollY > 400);
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    toggleVisibility();
    document.body.appendChild(btn);
  };

  const initBaguetteBox = () => {
    if (typeof baguetteBox !== "undefined") {
      baguetteBox.run(".grid-gallery", { animation: "slideIn" });
    }
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

  const setLocationSpecific = () => {
    var href = window.location.href;
    switch (true) {
      case href.endsWith("/"):
        showSignUpModal();
        getAnnouncement();
        setEvent();
        break;
      case href.endsWith("activities.html"):
        setEvent();
        loadProgrammes();
        break;
      case href.endsWith("projects.html"):
        initBaguetteBox();
        break;
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    const href = window.location.href;
    if (href.endsWith("/")) {
      showNotices();
    }
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
    setLocationSpecific();
  };
})();
