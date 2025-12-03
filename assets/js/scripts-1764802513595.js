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
    // Ramadan 2025 is on: March 1, 2025, 00:00:01 AM
    var ramadanStartDate = new Date(2025, 2, 1, 0, 0, 1, 0);
    return (
      addDays(getToday(), 4) >= ramadanStartDate &&
      getToday() < addDays(ramadanStartDate, 27)
    );
  };

  const getAssetName = (date, format) => {
    const month = new Intl.DateTimeFormat("en", { month: "short" })
      .format(date)
      .toUpperCase();
    const year = date.getFullYear();
    return `assets/${format}/${month}${year}.${format}`;
  };

  const setFooterYear = () => {
    const year = getToday().getFullYear();
    document.getElementById("footer-year").innerHTML = year;
    console.log(`Footer year set to ${year}`);
  };

  const setSalahTimeUrl = () => {
    try {
      var baseUrl = "https://getsalahtimes-rds3nxm6za-ew.a.run.app";

      // Month = today + 3 days, full month name
      var targetDate = addDays(getToday(), 3);
      var month = targetDate.toLocaleString("en-GB", { month: "long" });

      // Use actual current year
      var year = targetDate.getFullYear();

      // isRamadan from your existing function
      var ramadan = isRamadan();

      var url =
        baseUrl +
        "?month=" +
        encodeURIComponent(month) +
        "&year=" +
        encodeURIComponent(year) +
        "&isRamadan=" +
        encodeURIComponent(ramadan);

      fetch(url, { method: "GET" })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("HTTP " + response.status);
          }
          return response.json();
        })
        .then(function (json) {
          // expecting { data: [ { url: string, ... } ] }
          var data = json && json.data;
          if (!data || !data.length || !data[0].url) {
            console.error("No salah times data returned");
            return;
          }

          var asset = data[0].url;

          var elMain = document.getElementById("salah-times");
          var elFooter = document.getElementById("salah-times-footer");
          var elBody = document.getElementById("salah-times-body");

          if (elMain) elMain.href = asset;
          if (elFooter) elFooter.href = asset;
          if (window.location.href.endsWith("/") && elBody) {
            elBody.href = asset;
          }
        })
        .catch(function (error) {
          console.error("Error loading salah times", error);
        });
    } catch (error) {
      console.error("Error loading salah times", error);
    }
  };

  const setEvent = () => {
    var request = new XMLHttpRequest();
    request.responseType = "json";
    request.open(
      "GET",
      "https://api.mixlr.com/users/7752720?source=embed",
      true
    );
    request.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        var mixlrData = this.response;
        if (!mixlrData.is_live) {
          var code =
            '<span style="border-style: solid; font-size: 0.8em; padding: 5px; color: #808080">Off Air</span>';
          document.getElementById("live-now").innerHTML = code;
        } else {
          var code =
            '<span style="border-style: solid; font-size: 0.8em; padding: 5px; color: #B80000">LIVE NOW</span>';
          document.getElementById("live-now").innerHTML = code;
        }
        var allEvents = mixlrData.events;
        var sortedEvents = [];
        if (allEvents.length > 0) {
          sortedEvents = allEvents.sort(
            (a, b) =>
              parseInt(a.starts_at_timestamp) - parseInt(b.starts_at_timestamp)
          );
        }
        var events = {
          title: "Nothing Scheduled Yet",
          starts_at_timestamp: 1672531201,
          ends_at_timestamp: 1672534799,
        };
        var eventsData =
          typeof sortedEvents[0] === "undefined" || sortedEvents[0] == null
            ? events
            : sortedEvents[0];
        var startsAt = new Date(
          eventsData.starts_at_timestamp * 1000
        ).toLocaleTimeString("en-GB", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        });
        var endsAt = new Date(
          eventsData.ends_at_timestamp * 1000
        ).toLocaleTimeString("en-GB", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        });
        var startAtTimestamp = eventsData.starts_at_timestamp;
        var eventDate = new Date(startAtTimestamp * 1000).toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
          }
        );
        var eventMonth = new Date(startAtTimestamp * 1000).toLocaleDateString(
          "en-GB",
          {
            month: "short",
          }
        );
        var eventYear = new Date(startAtTimestamp * 1000).toLocaleDateString(
          "en-GB",
          {
            year: "numeric",
          }
        );
        var eventDay = new Date(startAtTimestamp * 1000).toLocaleDateString(
          "en-GB",
          {
            weekday: "short",
          }
        );
        if (isToday(new Date(eventsData.starts_at_timestamp * 1000))) {
          eventDay = "Today";
        }
        document.getElementById("event-name").innerHTML = eventsData.title;
        document.getElementById("starts-at").innerHTML = startsAt;
        // document.getElementById('ends-at').innerHTML = endsAt;
        document.getElementById("event-day").innerHTML = eventDay;
        document.getElementById("event-date").innerHTML = eventDate;
        document.getElementById("event-month").innerHTML = eventMonth;
        document.getElementById("event-year").innerHTML = eventYear;
      }
    };
    request.send(null);
  };

  // Helpers
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

  const STORAGE_KEY = "iqamah-today";

  // Render into homepage if we are on "/"
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
      const monthName = addedDays.toLocaleString("default", { month: "long" });
      document.getElementById("cur-month").innerHTML = monthName;
    }
  };

  // Render nav/footer elements (independent of path)
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

  // Main function
  const setSalahTimes = async () => {
    const { year, monthName, day } = getTodayInIreland();
    const cacheKey = `${STORAGE_KEY}:${year}-${monthName}-${day}`;

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

  const showWhatsAppButton = () => {
    var url =
      "https://wati-integration-service.clare.ai/ShopifyWidget/shopifyWidget.js?69866";
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.async = true;
    s.src = url;
    var options = {
      enabled: true,
      chatButtonSetting: {
        backgroundColor: "#247a1f",
        ctaText: "",
        borderRadius: "25",
        marginLeft: "0",
        marginBottom: "100",
        marginRight: "20",
        position: "right",
      },
      brandSetting: {
        brandName: "Tralee Masjid",
        brandSubTitle: "Kerry Islamic Cultural Centre",
        brandImg: "https://traleemasjidkicc.ie/assets/images/logo.png",
        welcomeText: "As-salamu alaikum! How may I help you?",
        backgroundColor: "#0a5f54",
        ctaText: "Start Chat",
        borderRadius: "25",
        autoShow: false,
        phoneNumber: "353862440556",
      },
    };
    s.onload = function () {
      CreateWhatsappChatWidget(options);
    };
    var x = document.getElementsByTagName("script")[0];
    x.parentNode.insertBefore(s, x);
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
        //   console.log($(this).text(), x, y);
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

  const getHadithTitle = (key) => {
    const hadithCollectionMap = new Map();
    const collections = [
      "bukhari",
      "muslim",
      "nasai",
      "abudawud",
      "tirmidhi",
      "ibnmajah",
      "riyadussalihin",
    ];
    const titles = [
      "Sahih al-Bukhari",
      "Sahih Muslim",
      "Sunan an-Nasa'i",
      "Sunan Abi Dawud",
      "Jami` at-Tirmidhi",
      "Sunan Ibn Majah",
      "Riyad as-Salihin",
    ];

    for (let i = 0; i < collections.length; i++) {
      hadithCollectionMap.set(collections[i], titles[i]);
    }

    return hadithCollectionMap.get(key);
  };

  const getRandomHadith = () => {
    try {
      var xhr = new XMLHttpRequest();

      xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE && this.status === 200) {
          const randomHadith = JSON.parse(this.responseText);
          console.log(randomHadith);

          document.getElementById("hadith-body").innerHTML =
            randomHadith.hadith.body;
          document.getElementById("hadith-cite").innerHTML = `${getHadithTitle(
            randomHadith.collection
          )} ${randomHadith.hadith.chapterNumber}:${randomHadith.hadithNumber}`;
          document.getElementById(
            "hadith-link"
          ).href = `https://sunnah.com/${randomHadith.collection}:${randomHadith.hadithNumber}`;
        }
      });

      xhr.open("GET", "https://randomhadith-rds3nxm6za-ew.a.run.app");
      xhr.send();
    } catch {
      document.getElementById("hadith-body").innerHTML =
        "<p>Abu Hurairah (May Allah be pleased with him) reported: Messenger of Allah (ﷺ) said, \"The five (daily) Salat (prayers), and from one Jumu'ah prayer to the (next) Jumu'ah prayer, and from Ramadan to Ramadan are expiations for the (sins) committed in between (their intervals); provided the major sins are not committed\".<br/><br/><b>[Muslim]</b>.<br/><br/></p>";
      document.getElementById("hadith-cite").innerHTML =
        "Riyad as-Salihin 189:1059";
      document.getElementById(
        "hadith-link"
      ).href = `https://sunnah.com/riyadussalihin:1059`;
    }
  };

  const formatTimeToAmPm = (time24) => {
    if (!time24) return "";
    const [hourStr, minuteStr] = time24.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    const period = hour >= 12 ? "pm" : "am";
    hour = hour % 12;
    if (hour === 0) hour = 12;

    const minutePadded = minute.toString().padStart(2, "0");
    return `${hour}:${minutePadded} ${period}`;
  };

  const renderJummahSchedule = (jummahTimes = []) => {
    const list = document.getElementById("jummah-schedule");
    if (!list) return;

    // Remove previously rendered dynamic items, keep the header (first li)
    while (list.children.length > 1) {
      list.removeChild(list.lastElementChild);
    }

    if (!Array.isArray(jummahTimes) || jummahTimes.length === 0) {
      return;
    }

    // For each entry in jummahTimes create a row
    jummahTimes.forEach((slot, index) => {
      const khutbahLabel =
        jummahTimes.length === 1 ? "Khutbah" : `Khutbah ${index + 1}`;
      const speechTime = formatTimeToAmPm(slot.speech);
      const khutbahTime = formatTimeToAmPm(slot.khutbah);

      // Speech row
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

      // Khutbah row
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

  const getAnnouncement = () => {
    try {
      var xhr = new XMLHttpRequest();

      xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE && this.status === 200) {
          const announcements = JSON.parse(this.responseText);

          const jumuah = announcements.find((a) => a.type === "jumuah");
          const breaking = announcements.find((a) => a.type === "breaking");
          const selected = jumuah?.active
            ? jumuah
            : breaking || announcements[0];

          if (!selected) {
            document.getElementById(
              "announcement"
            ).innerHTML = `<p>Please check the masjid <a href="#notice-board">notice board.</a></p>`;
            return;
          }

          console.log(selected);
          document.getElementById("announcement").innerHTML = selected.message;

          // Only render schedule for Jumu'ah type
          if (selected.type === "jumuah") {
            renderJummahSchedule(selected.jummahTimes);
          } else {
            // Clear any existing schedule rows
            renderJummahSchedule([]);
          }

          if (selected.active) {
            const bar = document.getElementById("announcement-bar");
            bar.classList.add("bigEntrance", "stretchLeft");
            bar.classList.remove("d-none");
          }
        } else if (this.readyState === this.DONE) {
          document.getElementById(
            "announcement"
          ).innerHTML = `<p>Please check the masjid <a href="#notice-board">notice board.</a></p>`;
        }
      });

      xhr.open("GET", "https://getannouncements-rds3nxm6za-ew.a.run.app");
      xhr.send();
    } catch {
      console.log("error get announces");
      document.getElementById(
        "announcement"
      ).innerHTML = `<p>Please check the masjid <a href="#notice-board">notice board.</a></p>`;
    }
  };

  const getNotices = () => {
    const NOTICES_KEY = "notices";
    const NOTICE_API_URL = "https://getnotices-rds3nxm6za-ew.a.run.app";

    try {
      var xhr = new XMLHttpRequest();
      xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE && this.status === 200) {
          const response = JSON.parse(this.responseText);
          console.log("API response:", response);
          const notices = response.notices;

          // Update local storage with the fetched notices
          localStorage.setItem(NOTICES_KEY, JSON.stringify(notices));
          console.log("Local storage updated with fetched notices:", notices);

          // Render notices
          renderNotices(notices);
        }
      });

      xhr.open("GET", NOTICE_API_URL);
      xhr.send();
    } catch {
      console.log("Error loading notices");
    }
  };

  const renderNotices = (notices) => {
    const noticeContainer = document.getElementById("noticeContainer");
    noticeContainer.innerHTML = ""; // Clear previous notices
    notices.forEach(function (notice) {
      const div = document.createElement("div");
      div.classList.add("col-md-6", "col-lg-4", "mx-auto", "fadeIn");
      const a = document.createElement("a");
      a.classList.add("lightbox");
      a.href = notice.url;
      const img = document.createElement("img");
      img.classList.add("img-fluid", "image", "scale-on-hover", "pb-4");
      img.src = notice.url;
      a.appendChild(img);
      div.appendChild(a);
      noticeContainer.appendChild(div);
    });

    // After dynamically creating div elements, run baguetteBox
    baguetteBox.run(".grid-gallery", {
      animation: "slideIn",
    });
  };

  const showNotices = () => {
    // Try to load notices from local storage on page load
    const NOTICES_KEY = "notices";

    const cachedNotices = localStorage.getItem(NOTICES_KEY);
    if (cachedNotices) {
      console.log(
        "Loaded notices from local storage:",
        JSON.parse(cachedNotices)
      );
      renderNotices(JSON.parse(cachedNotices));
    } else {
      console.log("No notices found in local storage.");
    }
    // Fetch latest notices and update local storage
    getNotices();
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
        break;
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    var href = window.location.href;
    if (href.endsWith("/")) {
      showNotices();
    }
  });

  window.onload = () => {
    setFooterYear();
    setSalahTimeUrl();
    setSalahTimes();
    showCookiePolicy();
    showWhatsAppButton();
    getRandomHadith();
    setLocationSpecific();
  };
})();
