#!/usr/bin/env node
/**
 * Build themed error pages (404.html, 403.html, 500.html).
 *
 * Copies shared chrome (nav, cookie consent, footer) from contact.html,
 * injects page-specific error hero content, and writes root-relative paths
 * so 404.html works when GitHub Pages serves it from any missing URL.
 *
 * Run after nav, footer, or cookie-consent markup changes:
 *   yarn build:error-pages
 *
 * Do not hand-edit the generated HTML files for chrome — edit contact.html
 * or the `pages` config below, then regenerate.
 */
"use strict";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT = path.join(__dirname, "..");
const contactHtml = fs.readFileSync(path.join(ROOT, "contact.html"), "utf8");

const navStart = contactHtml.indexOf("<!-- START OF NAV -->");
const navEnd = contactHtml.indexOf("<!-- END OF NAV -->") + "<!-- END OF NAV -->".length;
const cookieStart = contactHtml.indexOf("<!-- COOKIE POLICY START -->");
const footerStart = contactHtml.indexOf("<!-- FOOTER START -->");
const footerEnd = contactHtml.indexOf("<!-- FOOTER END -->") + "<!-- FOOTER END -->".length;

const navBlock = contactHtml.slice(navStart, navEnd)
  .replace(
    'dropdown kicc-nav-mega-item active"',
    'dropdown kicc-nav-mega-item"'
  )
  .replace(
    'About <span class="sr-only">(current)</span>',
    "About"
  );
const cookieBlock = contactHtml.slice(cookieStart, footerStart);
const footerBlock = contactHtml.slice(footerStart, footerEnd);

const headCommon = `<!DOCTYPE html>
<html lang="en-GB">

<head>
  <meta charset="utf-8">
  <meta name="viewport"
    content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <meta name="author" content="Nazmul Alam">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#0a8a8e">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="Tralee Masjid">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="mobile-web-app-capable" content="yes">
  <title>{{TITLE}}</title>

  <meta name="robots" content="noindex, nofollow">
  <meta name="description" content="{{DESCRIPTION}}">
  <link rel="canonical" href="https://traleemasjidkicc.ie/{{FILENAME}}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Tralee Masjid — Kerry Islamic Cultural Centre">
  <meta property="og:locale" content="en_GB">
  <meta property="og:url" content="https://traleemasjidkicc.ie/{{FILENAME}}">
  <meta property="og:title" content="{{TITLE}}">
  <meta property="og:description" content="{{DESCRIPTION}}">
  <meta property="og:image" content="https://traleemasjidkicc.ie/assets/images/brand/logo.png">
  <meta property="og:image:alt" content="Kerry Islamic Cultural Centre logo">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{{TITLE}}">
  <meta name="twitter:description" content="{{DESCRIPTION}}">
  <meta name="twitter:image" content="https://traleemasjidkicc.ie/assets/images/brand/logo.png">

  <link rel="stylesheet"
    href="//stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
    integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
    crossorigin="anonymous">
  <link rel="stylesheet" href="assets/css/main-1782651170940.css">

  <link rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css"
    integrity="sha512-xh6O/CkQoPOWDdYTDqeRdPCVd1SpvCA9XXcUnZS2FmJNp1coAFzvtCN9BmamE+4aHK8yyUHUSCcJHgXloTyT2A=="
    crossorigin="anonymous" referrerpolicy="no-referrer" />
  <script src="//code.jquery.com/jquery-3.3.1.slim.min.js"
    integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo"
    crossorigin="anonymous">
    </script>
  <script
    src="//cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"
    integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1"
    crossorigin="anonymous">
    </script>
  <script src="//stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"
    integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM"
    crossorigin="anonymous">
    </script>

  <script
    src="https://cdnjs.cloudflare.com/ajax/libs/js-cookie/3.0.1/js.cookie.min.js"
    integrity="sha512-wT7uPE7tOP6w4o28u1DN775jYjHQApdBnib5Pho4RB0Pgd9y7eSkAV1BTqQydupYDB9GBhTcQQzyNMPMV3cAew=="
    crossorigin="anonymous" referrerpolicy="no-referrer"></script>

  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500
    });
  </script>
  <script defer type="text/javascript" src="assets/js/scripts-1782609670001.js"></script>
  <script>
    (function () {
      var hasConsent = /(?:^|;\\s*)kicc-cookie-consent=/.test(document.cookie)
        || /(?:^|;\\s*)kicc-accept-cookie=/.test(document.cookie);
      if (!hasConsent) {
        document.documentElement.classList.add("cookie-consent-pending");
      }
    })();
  </script>
</head>`;

const mainTemplate = (config) => `  <main class="error-main" id="main-content">
    <section class="error-hero" aria-labelledby="error-heading">
      <div class="error-hero-bg" aria-hidden="true"></div>
      <div class="container">
        <div class="error-hero-inner error-hero-enter is-visible">
          <p class="error-code" aria-hidden="true">${config.code}</p>
          <p class="error-eyebrow arabic-greeting" lang="ar" dir="rtl">اَلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ</p>
          <h1 id="error-heading" class="error-title">${config.heading}</h1>
          <p class="error-lead">${config.lead}</p>
          ${config.pathBlock}
          <div class="error-actions">
            <a class="btn btn-kicc btn-kicc-primary btn-kicc-lg" href="/">
              <i class="fas fa-home" aria-hidden="true"></i>
              Return home
            </a>
            <a class="btn btn-kicc btn-kicc-secondary btn-kicc-lg" href="/prayer-times.html">
              <i class="fas fa-clock" aria-hidden="true"></i>
              Salah timetable
            </a>
            <a class="btn btn-kicc btn-kicc-secondary btn-kicc-lg" href="/contact.html">
              <i class="fas fa-envelope" aria-hidden="true"></i>
              Contact us
            </a>
          </div>
          <nav class="error-quick-links" aria-label="Popular pages">
            <p class="error-quick-links-label">You might be looking for</p>
            <ul class="error-quick-links-list list-unstyled mb-0">
              <li><a href="/activities.html">Weekly programmes</a></li>
              <li><a href="/madrasa.html">Children&rsquo;s madrasa</a></li>
              <li><a href="/projects.html">New Masjid campaign</a></li>
              <li><a href="/about.html">About our centre</a></li>
            </ul>
          </nav>
        </div>
      </div>
    </section>
  </main>
  ${config.extraScript}`;

const pages = [
  {
    filename: "404.html",
    code: "404",
    title: "Page Not Found | Tralee Masjid — Kerry Islamic Cultural Centre",
    description:
      "The page you requested could not be found on the Kerry Islamic Cultural Centre website.",
    heading: "This page could not be found",
    lead:
      "The link may be out of date, or the page may have moved. Try one of the links below, or return to the homepage.",
    pathBlock: `<p class="error-path-wrap" id="error-path-wrap" hidden>
            <span class="error-path-label">Requested address:</span>
            <code class="error-path" id="error-requested-path"></code>
          </p>`,
    extraScript: `  <script>
    (function () {
      var path = window.location.pathname || "";
      var search = window.location.search || "";
      var hash = window.location.hash || "";
      var requested = path + search + hash;
      if (!requested || requested === "/404.html") return;
      var wrap = document.getElementById("error-path-wrap");
      var el = document.getElementById("error-requested-path");
      if (!wrap || !el) return;
      el.textContent = requested;
      wrap.hidden = false;
    })();
  </script>`,
    bodyClass: "page-error page-error-404",
  },
  {
    filename: "403.html",
    code: "403",
    title: "Access Denied | Tralee Masjid — Kerry Islamic Cultural Centre",
    description:
      "You do not have permission to view this page on the Kerry Islamic Cultural Centre website.",
    heading: "Access to this page is restricted",
    lead:
      "You do not have permission to open this address. If you believe this is a mistake, please contact the masjid team.",
    pathBlock: "",
    extraScript: "",
    bodyClass: "page-error page-error-403",
  },
  {
    filename: "500.html",
    code: "500",
    title: "Something Went Wrong | Tralee Masjid — Kerry Islamic Cultural Centre",
    description:
      "Something went wrong while loading this page on the Kerry Islamic Cultural Centre website.",
    heading: "Something went wrong",
    lead:
      "We could not load this page just now. Please wait a few minutes and try again. Salah times and other main pages should still be available.",
    pathBlock: "",
    extraScript: "",
    bodyClass: "page-error page-error-500",
  },
];

const rootNav = (html) =>
  html
    .replace(/href="assets\//g, 'href="/assets/')
    .replace(/src="assets\//g, 'src="/assets/')
    .replace(/href="activities\.html/g, 'href="/activities.html')
    .replace(/href="madrasa\.html/g, 'href="/madrasa.html')
    .replace(/href="projects\.html/g, 'href="/projects.html')
    .replace(/href="about\.html/g, 'href="/about.html')
    .replace(/href="contact\.html/g, 'href="/contact.html')
    .replace(/href="prayer-times\.html/g, 'href="/prayer-times.html');

for (const page of pages) {
  const head = headCommon
    .replace(/{{TITLE}}/g, page.title)
    .replace(/{{DESCRIPTION}}/g, page.description)
    .replace(/{{FILENAME}}/g, page.filename);

  const html = `${head}

<body class="${page.bodyClass}">
  <a class="skip-link" href="#main-content">Skip to main content</a>
${rootNav(navBlock)}
${mainTemplate(page)}
${cookieBlock}
${rootNav(footerBlock)}
</body>

</html>
`;

  fs.writeFileSync(path.join(ROOT, page.filename), html);
}

console.log("Built 404.html, 403.html, and 500.html");
