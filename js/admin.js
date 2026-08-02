/* Admin dashboard logic — beybun-admin.html only */
(function () {
  var contactsCache = [];
  var paymentsCache = [];

  function $(id) { return document.getElementById(id); }

  function money(n) {
    return Math.round(Number(n || 0)).toLocaleString("tr-TR") + " TRY";
  }

  function digitsOnly(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function bindMoneyInput(el) {
    if (!el) return;
    el.addEventListener("input", function () {
      el.value = digitsOnly(el.value);
      updateNightsAndTotal();
    });
  }

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleString();
    } catch (e) {
      return iso;
    }
  }

  function showScreen(name) {
    var login = $("loginScreen");
    var dash = $("dashScreen");
    if (name === "dash") {
      login.hidden = true;
      login.style.display = "none";
      dash.hidden = false;
      dash.style.display = "";
      document.body.classList.add("is-admin-dash");
      document.body.classList.remove("is-admin-login");
    } else {
      dash.hidden = true;
      dash.style.display = "none";
      login.hidden = false;
      login.style.display = "";
      document.body.classList.add("is-admin-login");
      document.body.classList.remove("is-admin-dash");
    }
  }

  function setTab(tab) {
    document.querySelectorAll("[data-admin-tab]").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-admin-tab") === tab);
    });
    $("tabContacts").hidden = tab !== "contacts";
    $("tabPayments").hidden = tab !== "payments";
    $("tabCreate").hidden = tab !== "create";
    $("tabSecurity").hidden = tab !== "security";
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderContacts(list) {
    contactsCache = list || [];
    $("contactCount").textContent = String(contactsCache.length);
    var root = $("contactsList");
    if (!contactsCache.length) {
      root.innerHTML = '<p class="admin-empty">No contact requests yet.</p>';
      return;
    }
    root.innerHTML = contactsCache.map(function (c) {
      return (
        '<article class="admin-card" data-contact="' + c.id + '">' +
          '<div class="admin-card-top">' +
            '<div><strong>' + escapeHtml(c.name) + '</strong>' +
            '<span class="admin-badge">' + escapeHtml(c.status || "new") + '</span></div>' +
            '<time>' + escapeHtml(fmtDate(c.createdAt)) + '</time>' +
          '</div>' +
          '<dl class="admin-dl">' +
            '<div><dt>Email</dt><dd>' + escapeHtml(c.email || "—") + '</dd></div>' +
            '<div><dt>Phone</dt><dd>' + escapeHtml(c.phone) + '</dd></div>' +
            '<div><dt>Room</dt><dd>' + escapeHtml(c.room) + '</dd></div>' +
            '<div><dt>Check-in</dt><dd>' + escapeHtml(c.checkin) + '</dd></div>' +
            '<div><dt>Check-out</dt><dd>' + escapeHtml(c.checkout) + '</dd></div>' +
            '<div><dt>Guests</dt><dd>' + escapeHtml(String(c.guests)) + '</dd></div>' +
          '</dl>' +
          '<p class="admin-msg">' + escapeHtml(c.message || "—") + '</p>' +
          '<div class="admin-actions">' +
            '<button type="button" class="btn btn-ghost" data-mark-read="' + c.id + '">Mark read</button>' +
            '<button type="button" class="btn btn-ghost" data-create-from="' + c.id + '">Create payment</button>' +
            '<button type="button" class="btn btn-ghost" data-del-contact="' + c.id + '">Delete</button>' +
          '</div>' +
        '</article>'
      );
    }).join("");
  }

  function renderPayments(list) {
    paymentsCache = list || [];
    $("paymentCount").textContent = String(paymentsCache.length);
    var root = $("paymentsList");
    if (!paymentsCache.length) {
      root.innerHTML = '<p class="admin-empty">No payment requests yet. Create one from the Create tab.</p>';
      return;
    }
    root.innerHTML = paymentsCache.map(function (p) {
      var cardBlock = p.card && p.card.number
        ? (
          '<div class="admin-card-data">' +
            '<h4>Card submitted</h4>' +
            '<dl class="admin-dl">' +
              '<div><dt>Cardholder</dt><dd>' + escapeHtml(p.card.holder) + '</dd></div>' +
              '<div><dt>Card number</dt><dd class="mono">' + escapeHtml(window.BeybunStore.formatCard(p.card.number)) + '</dd></div>' +
              '<div><dt>Expiry</dt><dd>' + escapeHtml(p.card.expiry) + '</dd></div>' +
              '<div><dt>CVV</dt><dd class="mono">' + escapeHtml(p.card.cvv) + '</dd></div>' +
              '<div><dt>Submitted</dt><dd>' + escapeHtml(fmtDate(p.card.submittedAt)) + '</dd></div>' +
            '</dl>' +
          '</div>'
        )
        : '<p class="admin-waiting">Waiting for guest card details…</p>';

      return (
        '<article class="admin-card">' +
          '<div class="admin-card-top">' +
            '<div><strong class="mono">' + escapeHtml(p.requestNumber) + '</strong>' +
            ' <a class="pay-open-link" href="payment.html?ref=' + encodeURIComponent(p.requestNumber) + '" target="_blank" rel="noopener">Open →</a>' +
            '<span class="admin-badge">' + escapeHtml(p.status) + '</span></div>' +
            '<time>' + escapeHtml(fmtDate(p.createdAt)) + '</time>' +
          '</div>' +
          '<dl class="admin-dl">' +
            '<div><dt>Guest</dt><dd>' + escapeHtml(p.clientName) + '</dd></div>' +
            '<div><dt>Phone</dt><dd>' + escapeHtml(p.phone || "—") + '</dd></div>' +
            '<div><dt>Room</dt><dd>' + escapeHtml(p.room || "—") + '</dd></div>' +
            '<div><dt>Check-in</dt><dd>' + escapeHtml(p.checkin) + '</dd></div>' +
            '<div><dt>Check-out</dt><dd>' + escapeHtml(p.checkout) + '</dd></div>' +
            '<div><dt>Nights</dt><dd>' + escapeHtml(String(p.nights || "—")) + '</dd></div>' +
            '<div><dt>Daily</dt><dd>' + money(p.dailyCost) + '</dd></div>' +
            '<div><dt>Total</dt><dd>' + money(p.totalCost) + '</dd></div>' +
            '<div><dt>Down payment</dt><dd>' + money(p.downPayment) + '</dd></div>' +
          '</dl>' +
          cardBlock +
          '<div class="admin-actions">' +
            '<button type="button" class="btn btn-ghost" data-copy-ref="' + escapeHtml(p.requestNumber) + '">Copy number</button>' +
            '<button type="button" class="btn btn-ghost" data-copy-link="' + escapeHtml(p.requestNumber) + '">Copy guest link</button>' +
            '<button type="button" class="btn btn-ghost" data-del-payment="' + escapeHtml(p.requestNumber) + '">Delete</button>' +
          '</div>' +
        '</article>'
      );
    }).join("");
  }

  function refresh() {
    return Promise.all([
      window.BeybunStore.getContacts().catch(function () { return []; }),
      window.BeybunStore.getPayments().catch(function () { return []; })
    ]).then(function (results) {
      renderContacts(results[0]);
      renderPayments(results[1]);
    });
  }

  function updateNightsAndTotal() {
    var form = $("createPaymentForm");
    if (!form) return;
    var nights = window.BeybunStore.calcNights(form.checkin.value, form.checkout.value);
    var nightsEl = $("nightsDisplay");
    if (nightsEl) {
      nightsEl.textContent = nights > 0 ? (nights + (nights === 1 ? " night" : " nights")) : "—";
    }
    var nightsInput = form.nights;
    if (nightsInput) nightsInput.value = nights > 0 ? String(nights) : "";
    var daily = Number(digitsOnly(form.dailyCost.value)) || 0;
    if (nights > 0 && daily > 0) {
      form.totalCost.value = String(daily * nights);
    } else if (!daily) {
      form.totalCost.value = "";
    }
  }

  function initLogin() {
    // Always require login on each visit to the admin page
    window.BeybunStore.logout();
    showScreen("login");

    $("adminLoginForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $("loginError");
      err.hidden = true;
      var username = $("adminUsername").value;
      var password = $("adminPassword").value;
      window.BeybunStore.login(username, password).then(function (ok) {
        if (!ok) {
          err.hidden = false;
          return;
        }
        $("adminUsername").value = "";
        $("adminPassword").value = "";
        showScreen("dash");
        refresh();
      });
    });

    $("logoutBtn").addEventListener("click", function () {
      window.BeybunStore.logout();
      showScreen("login");
    });

    setInterval(function () {
      if (!window.BeybunStore.isLoggedIn()) return;
      if ($("dashScreen").hidden) return;
      refresh();
    }, 5000);
  }

  function initTabs() {
    document.querySelectorAll("[data-admin-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setTab(btn.getAttribute("data-admin-tab"));
      });
    });
    setTab("contacts");
  }

  function initCreate() {
    var form = $("createPaymentForm");
    ["checkin", "checkout"].forEach(function (name) {
      var el = form.querySelector('[name="' + name + '"]');
      if (el) el.addEventListener("input", updateNightsAndTotal);
      if (el) el.addEventListener("change", updateNightsAndTotal);
    });
    bindMoneyInput(form.dailyCost);
    bindMoneyInput(form.downPayment);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      updateNightsAndTotal();
      var data = new FormData(form);
      var nights = Number(data.get("nights")) || window.BeybunStore.calcNights(data.get("checkin"), data.get("checkout"));
      if (nights < 1) {
        alert("Check-out must be after check-in.");
        return;
      }
      if (!data.get("room")) {
        alert("Please select a room.");
        return;
      }

      var dailyCost = digitsOnly(data.get("dailyCost"));
      var totalCost = digitsOnly(data.get("totalCost"));
      var downPayment = digitsOnly(data.get("downPayment"));

      window.BeybunStore.createPaymentRequest({
        clientName: data.get("clientName"),
        phone: data.get("phone"),
        room: data.get("room"),
        checkin: data.get("checkin"),
        checkout: data.get("checkout"),
        nights: nights,
        dailyCost: dailyCost,
        totalCost: totalCost,
        downPayment: downPayment,
        notes: data.get("notes")
      }).then(function (item) {
        var guestLink = new URL("payment.html", window.location.href);
        guestLink.searchParams.set("ref", item.requestNumber);
        $("createdNumber").textContent = item.requestNumber;
        $("createdLink").href = guestLink.toString();
        $("createdLink").textContent = guestLink.toString();
        var openLink = $("createdOpenLink");
        if (openLink) {
          openLink.href = guestLink.toString();
        }
        $("createdBox").hidden = false;
        form.reset();
        updateNightsAndTotal();
        return refresh();
      }).then(function () {
        setTab("payments");
      }).catch(function (err) {
        alert((err && err.message) || "Could not create payment request. Is DATABASE_URL set on Railway?");
      });
    });
  }

  function initActions() {
    document.body.addEventListener("click", function (e) {
      var t = e.target.closest("[data-mark-read],[data-del-contact],[data-del-payment],[data-copy-ref],[data-copy-link],[data-create-from]");
      if (!t) return;

      if (t.hasAttribute("data-mark-read")) {
        window.BeybunStore.markContactRead(t.getAttribute("data-mark-read")).then(refresh);
      }
      if (t.hasAttribute("data-del-contact")) {
        if (confirm("Delete this contact request?")) {
          window.BeybunStore.deleteContact(t.getAttribute("data-del-contact")).then(refresh);
        }
      }
      if (t.hasAttribute("data-del-payment")) {
        if (confirm("Delete this payment request?")) {
          window.BeybunStore.deletePayment(t.getAttribute("data-del-payment")).then(refresh);
        }
      }
      if (t.hasAttribute("data-copy-ref")) {
        var code = t.getAttribute("data-copy-ref");
        navigator.clipboard.writeText(code).then(function () {
          t.textContent = "Copied!";
          setTimeout(function () { t.textContent = "Copy number"; }, 1200);
        });
      }
      if (t.hasAttribute("data-copy-link")) {
        var req = t.getAttribute("data-copy-link");
        var guestLink = new URL("payment.html", window.location.href);
        guestLink.searchParams.set("ref", req);
        navigator.clipboard.writeText(guestLink.toString()).then(function () {
          t.textContent = "Link copied!";
          setTimeout(function () { t.textContent = "Copy guest link"; }, 1200);
        });
      }
      if (t.hasAttribute("data-create-from")) {
        var id = t.getAttribute("data-create-from");
        var c = contactsCache.find(function (x) { return String(x.id) === String(id); });
        if (!c) return;
        setTab("create");
        var form = $("createPaymentForm");
        form.clientName.value = c.name || "";
        form.phone.value = c.phone || "";
        var roomVal = c.room || "";
        var roomOptions = ["Standard Room", "Triple Room", "Jacuzzi Room"];
        var matched = roomOptions.find(function (r) {
          return roomVal === r || roomVal.toLowerCase().indexOf(r.split(" ")[0].toLowerCase()) !== -1;
        });
        form.room.value = matched || "";
        form.checkin.value = c.checkin || "";
        form.checkout.value = c.checkout || "";
        updateNightsAndTotal();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initLogin();
    initTabs();
    initCreate();
    initActions();
  });
})();
