(function () {
  var LANG_KEY = "beybun-lang";
  var supported = ["en", "it", "es", "fa"];

  function getLang() {
    var stored = localStorage.getItem(LANG_KEY);
    if (supported.indexOf(stored) !== -1) return stored;
    var browser = (navigator.language || "en").slice(0, 2).toLowerCase();
    if (browser === "fa" || browser === "it" || browser === "es") return browser;
    return "en";
  }

  function t(lang, path) {
    var parts = path.split(".");
    var node = window.BEYBUN_I18N[lang];
    for (var i = 0; i < parts.length; i++) {
      if (!node) return path;
      node = node[parts[i]];
    }
    return typeof node === "string" ? node : path;
  }

  function applyTranslations(lang) {
    var pack = window.BEYBUN_I18N[lang] || window.BEYBUN_I18N.en;
    document.documentElement.lang = lang;
    document.documentElement.dir = pack.dir || "ltr";

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var value = t(lang, key);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = value;
      } else {
        el.textContent = value;
      }
    });

    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(lang, el.getAttribute("data-i18n-html"));
    });

    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      var map = el.getAttribute("data-i18n-attr").split(";");
      map.forEach(function (pair) {
        var bits = pair.split(":");
        if (bits.length === 2) {
          el.setAttribute(bits[0].trim(), t(lang, bits[1].trim()));
        }
      });
    });

    var page = document.body.getAttribute("data-page") || "home";
    var titleKey = {
      home: "meta.homeTitle",
      rooms: "meta.roomsTitle",
      standard: "meta.standardTitle",
      triple: "meta.tripleTitle",
      jacuzzi: "meta.jacuzziTitle",
      about: "meta.aboutTitle",
      gallery: "meta.galleryTitle",
      contact: "meta.contactTitle"
    }[page];
    if (titleKey) document.title = t(lang, titleKey);

    var select = document.getElementById("langSelect");
    if (select) select.value = lang;
  }

  function setLang(lang) {
    if (supported.indexOf(lang) === -1) lang = "en";
    localStorage.setItem(LANG_KEY, lang);
    applyTranslations(lang);
  }

  function initNav() {
    var toggle = document.querySelector(".menu-toggle");
    var nav = document.querySelector(".nav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        nav.classList.toggle("is-open");
      });
      nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          nav.classList.remove("is-open");
        });
      });
    }

    var page = document.body.getAttribute("data-page");
    document.querySelectorAll(".nav a[data-nav]").forEach(function (link) {
      if (link.getAttribute("data-nav") === page) {
        link.classList.add("is-active");
      }
      if (page === "standard" || page === "triple" || page === "jacuzzi") {
        if (link.getAttribute("data-nav") === "rooms") link.classList.add("is-active");
      }
    });

    var header = document.querySelector(".site-header");
    if (header) {
      var onScroll = function () {
        header.classList.toggle("is-scrolled", window.scrollY > 12);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  }

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    items.forEach(function (el) { io.observe(el); });
  }

  function initRoomGallery() {
    var main = document.getElementById("roomMainImage");
    var thumbs = document.querySelectorAll("[data-room-thumb]");
    if (!main || !thumbs.length) return;
    thumbs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var src = btn.getAttribute("data-room-thumb");
        main.src = src;
        thumbs.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
      });
    });
  }

  function initContactForm() {
    var form = document.getElementById("bookingForm");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var lang = getLang();
      var data = new FormData(form);
      var roomLabels = {
        standard: t(lang, "roomCards.standardName"),
        triple: t(lang, "roomCards.tripleName"),
        jacuzzi: t(lang, "roomCards.jacuzziName")
      };
      var room = data.get("room");
      var subject = "Booking request — THE BEYBÛN HOTEL";
      var body = [
        "Name: " + data.get("name"),
        "Email: " + data.get("email"),
        "Phone: " + data.get("phone"),
        "Room: " + (roomLabels[room] || room),
        "Check-in: " + data.get("checkin"),
        "Check-out: " + data.get("checkout"),
        "Guests: " + data.get("guests"),
        "",
        "Message:",
        data.get("message") || "-"
      ].join("\n");
      var mailto = "mailto:info@beybunhotel.com?subject=" +
        encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      window.location.href = mailto;
      var success = document.getElementById("formSuccess");
      if (success) success.classList.add("is-visible");
    });

    var params = new URLSearchParams(window.location.search);
    var preselect = params.get("room");
    if (preselect && form.room) form.room.value = preselect;
  }

  function yearStamp() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  document.addEventListener("DOMContentLoaded", function () {
    var lang = getLang();
    applyTranslations(lang);

    var select = document.getElementById("langSelect");
    if (select) {
      select.addEventListener("change", function () {
        setLang(select.value);
      });
    }

    initNav();
    initReveal();
    initRoomGallery();
    initContactForm();
    yearStamp();
  });
})();
