(function () {
  "use strict";

  const getToday = () => {
    return new Date();
  };

  const getMonthNames = () => {
    return [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
  };

  const isToday = (someDate) => {
    var today = getToday();
    return (
      someDate.getDate() == today.getDate() &&
      someDate.getMonth() == today.getMonth() &&
      someDate.getFullYear() == today.getFullYear()
    );
  };

  const getAssetName = (format) => {
    const month = getMonthNames()[getToday().getMonth()];
    const year = getToday().getFullYear();
    return `assets/${format}/${month}${year}.${format}`;
  };

  const setFooterYear = () => {
    const year = getToday().getFullYear();
    document.getElementById("footer-year").innerHTML = year;
    console.log(`Footer year set to ${year}`);
  };

  const setSalahTimeUrl = () => {
    try {
      const asset = getAssetName(`pdf`);
      console.log(`Salah time loaded for = ${asset}`);
      document.getElementById("salah-times").href = asset;
      document.getElementById("salah-times-footer").href = asset;

      if (window.location.href.endsWith(`/`)) {
        document.getElementById("salah-times-body").href = asset;
      }
    } catch (error) {
      console.error(`Error loading salah times ${error}`);
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
          starts_at_timestamp: 1640995201,
          ends_at_timestamp: 1641081599,
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

  const setSalahTimes = () => {
    var xmlhttp = new XMLHttpRequest();
    var d = new Date();
    xmlhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        var myObj = JSON.parse(this.responseText);
        if (window.location.href.endsWith(`/`)) {
          document.getElementById("fajr").innerHTML =
            myObj.dailyPrayers[d.getDate() - 1].fajarTime.toLowerCase();
          document.getElementById("sunrise").innerHTML =
            myObj.dailyPrayers[d.getDate() - 1].sunriseTime.toLowerCase();
          document.getElementById("dhuhr").innerHTML =
            myObj.dailyPrayers[d.getDate() - 1].dhuharTime.toLowerCase();
          document.getElementById("asr").innerHTML =
            myObj.dailyPrayers[d.getDate() - 1].asrTime.toLowerCase();
          document.getElementById("maghrib").innerHTML =
            myObj.dailyPrayers[d.getDate() - 1].maghribTime.toLowerCase();
          document.getElementById("isha").innerHTML =
            myObj.dailyPrayers[d.getDate() - 1].ishaTime.toLowerCase();
          document.getElementById("cur-month").innerHTML =
            myObj.dailyPrayers[d.getDate() - 1].gregorianMonthName;
        }
        document.getElementById("nav-hijri").innerHTML =
          myObj.dailyPrayers[d.getDate() - 1].hijriDate;
        document.getElementById("nav-cur-month").innerHTML =
          myObj.dailyPrayers[d.getDate() - 1].gregorianMonthName;
        document.getElementById("footer-cur-month").innerHTML =
          myObj.dailyPrayers[d.getDate() - 1].gregorianMonthName;

        document.getElementById("nav-fajr-begins").innerHTML =
          myObj.dailyPrayers[d.getDate() - 1].fajarTime.toLowerCase();
        document.getElementById("nav-fajr-jamaat").innerHTML =
          myObj.dailyPrayers[d.getDate() - 1].fajarJamahTime.toLowerCase();

        document.getElementById("nav-sunrise").innerHTML =
          myObj.dailyPrayers[d.getDate() - 1].sunriseTime.toLowerCase();

        document.getElementById("nav-zohr-begins").innerHTML =
          myObj.dailyPrayers[d.getDate() - 1].dhuharTime.toLowerCase();
        document.getElementById("nav-zohr-jamaat").innerHTML =
          myObj.dailyPrayers[d.getDate() - 1].zohrJamahTime.toLowerCase();

        document.getElementById("nav-asar-begins").innerHTML =
          myObj.dailyPrayers[d.getDate() - 1].asrTime.toLowerCase();
        document.getElementById("nav-asar-jamaat").innerHTML =
          myObj.dailyPrayers[d.getDate() - 1].asarJamahTime.toLowerCase();

        document.getElementById("nav-magrib-begins").innerHTML =
          myObj.dailyPrayers[d.getDate() - 1].maghribTime.toLowerCase();
        document.getElementById("nav-magrib-jamaat").innerHTML =
          myObj.dailyPrayers[d.getDate() - 1].magribJamahTime.toLowerCase();

        document.getElementById("nav-isha-begins").innerHTML =
          myObj.dailyPrayers[d.getDate() - 1].ishaTime.toLowerCase();
        document.getElementById("nav-isha-jamaat").innerHTML =
          myObj.dailyPrayers[d.getDate() - 1].ishaJamahTime.toLowerCase();
      }
    };
    var asset = getAssetName(`json`);
    console.log(asset);
    xmlhttp.open("GET", asset, true);
    xmlhttp.send();
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

    if (Cookies.get("kicc-accept-cookie") === true) {
      $("#cookie-bar").hide();
    } else {
      // $("#cookie-bar").show();
      $("#cookie-bar").toggleClass('show');
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

  window.onload = () => {
    setFooterYear();
    setSalahTimeUrl();
    setSalahTimes();
    showCookiePolicy();

    if (window.location.href.endsWith(`/`)) {
      setEvent();
      pillarsOfFaith();
      showSignUpModal();
    }
    showWhatsAppButton();
  };
})();
