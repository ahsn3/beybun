(function () {
  var LANG_KEY = "beybun-lang";
  var supported = ["en", "tr", "ar", "it", "es", "fa"];
  var langMeta = {
    en: { label: "English" },
    tr: { label: "Türkçe" },
    ar: { label: "العربية" },
    it: { label: "Italiano" },
    es: { label: "Español" },
    fa: { label: "فارسی" }
  };

  function getLang() {
    var stored = localStorage.getItem(LANG_KEY);
    if (supported.indexOf(stored) !== -1) return stored;
    var browser = (navigator.language || "en").slice(0, 2).toLowerCase();
    if (supported.indexOf(browser) !== -1) return browser;
    return "en";
  }

  function t(lang, path) {
    var parts = path.split(".");
    var node = window.BEYBUN_I18N[lang] || window.BEYBUN_I18N.en;
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
      contact: "meta.contactTitle",
      payment: "meta.paymentTitle"
    }[page];
    if (titleKey) document.title = t(lang, titleKey);

    syncLangSwitcher(lang);
  }

  function setLang(lang) {
    if (supported.indexOf(lang) === -1) lang = "en";
    localStorage.setItem(LANG_KEY, lang);
    applyTranslations(lang);
  }

  function buildLangSwitcher(root, current) {
    var meta = langMeta[current] || langMeta.en;
    root.innerHTML =
      '<button type="button" class="lang-toggle" aria-haspopup="listbox" aria-expanded="false" aria-label="Language">' +
        '<span class="lang-label">' + meta.label + "</span>" +
      "</button>" +
      '<ul class="lang-menu" role="listbox"></ul>';

    var menu = root.querySelector(".lang-menu");
    supported.forEach(function (code) {
      var item = langMeta[code];
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("role", "option");
      btn.dataset.lang = code;
      if (code === current) btn.classList.add("is-active");
      btn.textContent = item.label;
      btn.addEventListener("click", function () {
        root.classList.remove("is-open");
        root.querySelector(".lang-toggle").setAttribute("aria-expanded", "false");
        setLang(code);
      });
      li.appendChild(btn);
      menu.appendChild(li);
    });

    var toggle = root.querySelector(".lang-toggle");
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = root.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function syncLangSwitcher(lang) {
    document.querySelectorAll(".lang-switch").forEach(function (root) {
      buildLangSwitcher(root, lang);
    });
  }

  function initLangSwitcher() {
    document.addEventListener("click", function () {
      document.querySelectorAll(".lang-switch.is-open").forEach(function (root) {
        root.classList.remove("is-open");
        var toggle = root.querySelector(".lang-toggle");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      });
    });
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
      var roomLabel = roomLabels[room] || room;

      if (window.BeybunStore) {
        window.BeybunStore.addContact({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          room: roomLabel,
          checkin: data.get("checkin"),
          checkout: data.get("checkout"),
          guests: data.get("guests"),
          message: data.get("message") || ""
        }).catch(function () { /* WhatsApp still delivers the request */ });
      }

      var body = [
        "Name: " + data.get("name"),
        "Email: " + data.get("email"),
        "Phone: " + data.get("phone"),
        "Room: " + roomLabel,
        "Check-in: " + data.get("checkin"),
        "Check-out: " + data.get("checkout"),
        "Guests: " + data.get("guests"),
        "",
        "Message:",
        data.get("message") || "-"
      ].join("\n");

      // Deliver request to hotel WhatsApp so staff always receive it
      window.open("https://wa.me/905302296779?text=" + encodeURIComponent("New booking request\n\n" + body), "_blank", "noopener");

      var success = document.getElementById("formSuccess");
      if (success) success.classList.add("is-visible");
      form.reset();
    });

    var params = new URLSearchParams(window.location.search);
    var preselect = params.get("room");
    if (preselect && form.room) form.room.value = preselect;
  }

  function yearStamp() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function upgradeLegacyLangSelects() {
    document.querySelectorAll(".lang-switch").forEach(function (root) {
      var select = root.querySelector("select");
      if (select) select.remove();
      root.innerHTML = "";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    upgradeLegacyLangSelects();
    initLangSwitcher();
    var lang = getLang();
    applyTranslations(lang);
    initNav();
    initReveal();
    initRoomGallery();
    initContactForm();
    yearStamp();
  });
})();
