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
    // Ramadan 2026 is on: February 17, 2026, 17:56:00 AM
    var ramadanStartDate = new Date(2026, 1, 17, 17, 56, 0, 0);
    return (
      addDays(getToday(), 4) >= ramadanStartDate &&
      getToday() < addDays(ramadanStartDate, 27)
    );
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

    fetch("https://api.mixlr.com/users/7752720")
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((mixlrData) => {
        // Live / Off Air badge
        const isLive = !!mixlrData.is_live;
        liveNowEl.innerHTML = isLive
          ? '<span style="border-style: solid; font-size: 0.8em; padding: 5px; color: #B80000">LIVE NOW</span>'
          : '<span style="border-style: solid; font-size: 0.8em; padding: 5px; color: #808080">Off Air</span>';

        const allEvents = Array.isArray(mixlrData.events)
          ? mixlrData.events
          : [];

        // Sort safely
        const sortedEvents = allEvents.length
          ? allEvents
              .slice()
              .sort(
                (a, b) =>
                  Number(a.starts_at_timestamp) - Number(b.starts_at_timestamp)
              )
          : [];

        const today = getToday();
        const todayMs = today.getTime();
        const defaultStarts = Math.floor((todayMs + 86400 * 1000) / 1000); // +1 day
        const defaultEnds = Math.floor((todayMs + 90000 * 1000) / 1000); // +1d 1h

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
    document.getElementById("fajr").innerHTML = lower(d.fajarTime);
    document.getElementById("sunrise").innerHTML = lower(d.sunriseTime);
    document.getElementById("dhuhr").innerHTML = lower(d.dhuharTime);
    document.getElementById("asr").innerHTML = lower(d.asrTime);
    document.getElementById("maghrib").innerHTML = lower(d.maghribTime);
    document.getElementById("isha").innerHTML = lower(d.ishaTime);
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
    document.getElementById(
      "nav-hijri"
    ).innerHTML = `${d.hijriDay} ${d.hijriMonthName} ${d.hijriYear}`;
    const today = new Date();
    const addedDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const monthName = isRamadan()
      ? "Ramadan"
      : addedDays.toLocaleString("default", { month: "long" });
    document.getElementById("nav-cur-month").innerHTML = monthName;
    document.getElementById("footer-cur-month").innerHTML = monthName;
    document.getElementById("nav-fajr-begins").innerHTML = lower(d.fajarTime);
    document.getElementById("nav-fajr-jamaat").innerHTML = lower(
      d.fajarJamahTime
    );
    document.getElementById("nav-sunrise").innerHTML = lower(d.sunriseTime);
    document.getElementById("nav-zohr-begins").innerHTML = lower(d.dhuharTime);
    document.getElementById("nav-zohr-jamaat").innerHTML = lower(
      d.zohrJamahTime
    );
    document.getElementById("nav-asar-begins").innerHTML = lower(d.asrTime);
    document.getElementById("nav-asar-jamaat").innerHTML = lower(
      d.asarJamahTime
    );
    document.getElementById("nav-magrib-begins").innerHTML = lower(
      d.maghribTime
    );
    document.getElementById("nav-magrib-jamaat").innerHTML = lower(
      d.maghribJamahTime
    );
    document.getElementById("nav-isha-begins").innerHTML = lower(d.ishaTime);
    document.getElementById("nav-isha-jamaat").innerHTML = lower(
      d.ishaJamahTime
    );
  };

  const setSalahTimes = async () => {
    const STORAGE_KEY = "iqamah-today";
    const { year, monthName, day } = getTodayInIreland();
    const cacheKey = `${STORAGE_KEY}`;
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
    const url = `https://getiqamahtimes-rds3nxm6za-ew.a.run.app?year=${year}&month=${encodeURIComponent(
      monthName
    )}&day=${day}`;
    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        console.error(
          "Error fetching iqamah times",
          resp.status,
          resp.statusText
        );
        return;
      }
      const json = await resp.json();
      console.log("Fetched iqamah from API", json);
      // Expecting shape { scope: "day", year, month, day, data: [ {...} ] }
      const d = json.data && json.data[0];
      if (!d) {
        console.warn("No data for today in API response");
        return;
      }
      // Update cache
      localStorage.setItem(cacheKey, JSON.stringify(json));
      // Update UI (fresh)
      applyToHomePage(d);
      applyToNav(d);
    } catch (err) {
      console.error("Failed to fetch iqamah times", err);
    }
  };

  const pillarsOfFaith = () => {
    let i = 2;
    $(document).ready(function () {
      var radius = 200;
      var fields = $(".itemDot");
      var container = $(".dotCircle");
      var width = container.width();
      radius = width / 2.5;
      var height = container.height();
      var angle = 0,
        step = (2 * Math.PI) / fields.length;
      fields.each(function () {
        var x = Math.round(
          width / 2 + radius * Math.cos(angle) - $(this).width() / 2
        );
        var y = Math.round(
          height / 2 + radius * Math.sin(angle) - $(this).height() / 2
        );
        // if (window.console) {
        // console.log($(this).text(), x, y);
        // }
        $(this).css({
          left: x + "px",
          top: y + "px",
        });
        angle += step;
      });
      $(".itemDot").click(function () {
        var dataTab = $(this).data("tab");
        $(".itemDot").removeClass("active");
        $(this).addClass("active");
        $(".CirItem").removeClass("active");
        $(".CirItem" + dataTab).addClass("active");
        i = dataTab;
        $(".dotCircle").css({
          transform: "rotate(" + (360 - (i - 1) * 36) + "deg)",
          transition: "2s",
        });
        $(".itemDot").css({
          transform: "rotate(" + (i - 1) * 36 + "deg)",
          transition: "1s",
        });
      });
      setInterval(function () {
        var dataTab = $(".itemDot.active").data("tab");
        if (dataTab > 6 || i > 6) {
          dataTab = 1;
          i = 1;
        }
        $(".itemDot").removeClass("active");
        $('[data-tab="' + i + '"]').addClass("active");
        $(".CirItem").removeClass("active");
        $(".CirItem" + i).addClass("active");
        i++;
        $(".dotCircle").css({
          transform: "rotate(" + (360 - (i - 2) * 36) + "deg)",
          transition: "2s",
        });
        $(".itemDot").css({
          transform: "rotate(" + (i - 2) * 36 + "deg)",
          transition: "1s",
        });
      }, 10000);
    });
  };

  const showSignUpModal = () => {
    setSignUpCookies();
    if (!Cookies.get("kicc-modal-tmw")) {
      $("#myModal").modal("show");
      setTimeout(function () {
        $("#myModal").modal("hide");
      }, 30000);
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

  const formatTimeToAmPm = (time24) => {
    if (!time24) return "";
    const parts = String(time24).split(":");
    if (parts.length < 2) return "";
    let hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return "";

    const period = hour >= 12 ? "pm" : "am";
    hour = hour % 12;
    if (hour === 0) hour = 12;

    const minutePadded = minute.toString().padStart(2, "0");
    return `${hour}:${minutePadded} ${period}`;
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
        jummahTimes.length === 1 ? "Khutbah" : `Khutbah ${index + 1}`;

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

    if (typeof baguetteBox !== "undefined") {
      baguetteBox.run(".grid-gallery", { animation: "slideIn" });
    }
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

  const renderProgrammeTable = (programmes) => {
    var tbody = document.getElementById("weekly-programmes-tbody");
    if (!tbody) return;

    // clear existing dynamic rows
    tbody.innerHTML = "";

    // fallback rows if nothing from API
    if (!Array.isArray(programmes) || programmes.length === 0) {
      var fallback = [
        {
          name: "Children's Youth Programme",
          time: "Check Events or Masjid Notice Board",
        },
        {
          name: "Adult's Monthly Programme",
          time: "Check Events or Masjid Notice Board",
        },
      ];
      fallback.forEach(function (p) {
        var tr = document.createElement("tr");
        var tdName = document.createElement("td");
        tdName.textContent = p.name;
        var tdTime = document.createElement("td");
        tdTime.textContent = p.time;
        tr.appendChild(tdName);
        tr.appendChild(tdTime);
        tbody.appendChild(tr);
      });
      return;
    }

    programmes.forEach(function (p) {
      var tr = document.createElement("tr");
      var tdName = document.createElement("td");
      tdName.textContent = p.name || "";
      var tdTime = document.createElement("td");
      tdTime.textContent =
        p.timeDescription || (p.clockTime ? "At " + p.clockTime : "");
      tr.appendChild(tdName);
      tr.appendChild(tdTime);
      tbody.appendChild(tr);
    });
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

    var row = document.createElement("div");
    // g-4 adds gaps between rows and columns (Bootstrap 5)
    row.className = "row g-4";

    withImages.forEach(function (p) {
      var col = document.createElement("div");
      // mb-4 ensures extra vertical spacing between rows even if not using g-*
      col.className = "col-md-4 mb-4";

      var card = document.createElement("article");
      card.className =
        "weekly-programme-card shadow-sm h-100 border-0 rounded-3 overflow-hidden";

      var imgWrapper = document.createElement("div");
      imgWrapper.className = "weekly-programme-image-wrapper";

      var img = document.createElement("img");
      img.src = p.imageUrl;
      img.alt = p.name || "Masjid programme";
      img.className = "weekly-programme-image";
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

      var metaText =
        p.timeDescription || (p.clockTime ? "At " + p.clockTime : "");
      if (metaText) {
        var meta = document.createElement("p");
        meta.className = "weekly-programme-meta";
        meta.textContent = metaText;
        body.appendChild(meta);
      }

      // SUMMARY / DESCRIPTION: allow HTML from Firestore (e.g. blockquote)
      if (p.description) {
        var desc = document.createElement("div");
        desc.className = "weekly-programme-description";
        desc.innerHTML = p.description; // renders HTML tags
        body.appendChild(desc);
      }

      // FOOTER: everything after summary (topic, speaker, location etc.)
      var footer = document.createElement("div");
      footer.className = "weekly-programme-footer";

      if (p.topic) {
        var topic = document.createElement("p");
        topic.innerHTML = "<strong>Topic:</strong> " + p.topic;
        footer.appendChild(topic);
      }

      if (p.speaker) {
        var speaker = document.createElement("p");
        speaker.innerHTML = "<strong>Speaker:</strong> " + p.speaker;
        footer.appendChild(speaker);
      }

      if (p.location) {
        var loc = document.createElement("p");
        loc.innerHTML = "<strong>Location:</strong> " + p.location;
        footer.appendChild(loc);
      }

      if (p.listenUrl) {
        var link = document.createElement("a");
        link.href = p.listenUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "weekly-programme-link";
        link.textContent = "Listen / Watch live";
        footer.appendChild(link);
      }

      if (footer.childNodes.length > 0) {
        body.appendChild(footer);
      }

      card.appendChild(body);
      col.appendChild(card);
      row.appendChild(col);
    });

    container.appendChild(row);
  };

  const loadProgrammes = () => {
    // NEW: Weekly Programmes (programmes with images) on activities page
    const PROGRAMMES_API_URL =
      "https://getmasjidprogrammes-rds3nxm6za-ew.a.run.app?type=programme&active=true";
    const PROGRAMMES_STORAGE_KEY = "masjidProgrammes_programme_active_true_v1";
    var cachedJson = localStorage.getItem(PROGRAMMES_STORAGE_KEY);
    if (cachedJson) {
      try {
        var cached = JSON.parse(cachedJson);
        console.log("Cached programmes:", cached); // log cached
        if (cached && Array.isArray(cached.programmes)) {
          renderProgrammeTable(cached.programmes);
          renderWeeklyProgrammes(cached.programmes);
        } else {
          renderProgrammeTable([]);
          renderWeeklyProgrammes([]);
        }
      } catch (e) {
        console.error("Failed to parse cached programmes", e);
        renderProgrammeTable([]);
        renderWeeklyProgrammes([]);
      }
    } else {
      // if no cache at all, show fallback in table, hide card initially
      renderProgrammeTable([]);
      renderWeeklyProgrammes([]);
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
        console.log("Programmes API response:", data); // log response
        if (data && Array.isArray(data.programmes)) {
          localStorage.setItem(PROGRAMMES_STORAGE_KEY, JSON.stringify(data));
          renderProgrammeTable(data.programmes);
          renderWeeklyProgrammes(data.programmes);
        } else {
          renderProgrammeTable([]);
          renderWeeklyProgrammes([]);
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

  const setLocationSpecific = () => {
    var href = window.location.href;
    switch (true) {
      case href.endsWith("/"):
        pillarsOfFaith();
        showSignUpModal();
        getAnnouncement();
        setEvent();
        break;
      case href.endsWith("activities.html"):
        setEvent();
        loadProgrammes();
        break;
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    const href = window.location.href;
    if (href.endsWith("/")) {
      showNotices();
    }
    addWhatsAppButton();
    setFooterYear();
    showCookiePolicy();
  });

  window.onload = () => {
    setSalahTimeUrl();
    setSalahTimes();
    getRandomHadith();
    setLocationSpecific();
  };
})();
