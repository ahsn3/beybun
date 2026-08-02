/* THE BEYBÛN HOTEL — API store (PostgreSQL via /api on Railway) */
(function (global) {
  var TOKEN_KEY = "beybun-admin-token";
  var ADMIN_USERNAME = "Mustafa.Beybun";

  function api(path, options) {
    options = options || {};
    var headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
    var token = sessionStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = "Bearer " + token;
    return fetch(path, {
      method: options.method || "GET",
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var err = new Error((data && data.error) || ("Request failed (" + res.status + ")"));
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  function normalizePayment(p) {
    if (!p) return null;
    return {
      id: p.id,
      requestNumber: p.requestNumber,
      clientName: p.clientName,
      phone: p.phone || "",
      room: p.room || "",
      checkin: p.checkin,
      checkout: p.checkout,
      nights: Number(p.nights) || 0,
      dailyCost: Number(p.dailyCost) || 0,
      totalCost: Number(p.totalCost) || 0,
      downPayment: Number(p.downPayment) || 0,
      notes: p.notes || "",
      status: p.status,
      createdAt: p.createdAt,
      card: p.card || null
    };
  }

  var Store = {
    adminUsername: ADMIN_USERNAME,

    login: function (username, password) {
      return api("/api/admin/login", {
        method: "POST",
        body: { username: username, password: password }
      }).then(function (data) {
        sessionStorage.setItem(TOKEN_KEY, data.token);
        return true;
      }).catch(function () {
        return false;
      });
    },

    logout: function () {
      sessionStorage.removeItem(TOKEN_KEY);
    },

    isLoggedIn: function () {
      return Boolean(sessionStorage.getItem(TOKEN_KEY));
    },

    ensureAdmin: function () {
      return Promise.resolve();
    },

    ensureSync: function () {
      return Promise.resolve();
    },

    pullCloud: function () {
      if (!Store.isLoggedIn()) return Promise.resolve(null);
      return Promise.all([Store.getContacts(), Store.getPayments()]).then(function () {
        return { ok: true };
      }).catch(function () {
        return null;
      });
    },

    getContacts: function () {
      return api("/api/admin/contacts");
    },

    addContact: function (payload) {
      return api("/api/contacts", { method: "POST", body: payload });
    },

    markContactRead: function (id) {
      return api("/api/admin/contacts/" + encodeURIComponent(id), {
        method: "PATCH",
        body: { status: "read" }
      });
    },

    deleteContact: function (id) {
      return api("/api/admin/contacts/" + encodeURIComponent(id), { method: "DELETE" });
    },

    getPayments: function () {
      return api("/api/admin/payments").then(function (list) {
        return (list || []).map(normalizePayment);
      });
    },

    getPaymentByNumber: function (number) {
      var code = String(number || "").trim().toUpperCase();
      return api("/api/payments/" + encodeURIComponent(code)).then(normalizePayment);
    },

    createPaymentRequest: function (payload) {
      return api("/api/admin/payments", { method: "POST", body: payload }).then(normalizePayment);
    },

    deletePayment: function (requestNumber) {
      return api("/api/admin/payments/" + encodeURIComponent(requestNumber), { method: "DELETE" });
    },

    submitCard: function (requestNumber, card) {
      return api("/api/payments/" + encodeURIComponent(requestNumber) + "/card", {
        method: "POST",
        body: card
      });
    },

    // Guest links only need the request number now (DB lookup)
    encodePaymentPayload: function (payment) {
      return "";
    },

    decodePaymentPayload: function () {
      return null;
    },

    upsertPaymentFromPayload: function () {
      return null;
    },

    changePassword: function () {
      return Promise.resolve(false);
    },

    luhnValid: function (number) {
      var digits = String(number).replace(/\D/g, "");
      if (digits.length < 13 || digits.length > 19) return false;
      var sum = 0;
      var alt = false;
      for (var i = digits.length - 1; i >= 0; i--) {
        var n = parseInt(digits.charAt(i), 10);
        if (alt) {
          n *= 2;
          if (n > 9) n -= 9;
        }
        sum += n;
        alt = !alt;
      }
      return sum % 10 === 0;
    },

    formatCard: function (number) {
      return String(number).replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    },

    maskCard: function (number) {
      var d = String(number).replace(/\D/g, "");
      if (d.length < 4) return d;
      return "•••• •••• •••• " + d.slice(-4);
    },

    calcNights: function (checkin, checkout) {
      if (!checkin || !checkout) return 0;
      var a = new Date(checkin + "T00:00:00");
      var b = new Date(checkout + "T00:00:00");
      var ms = b - a;
      if (isNaN(ms) || ms <= 0) return 0;
      return Math.round(ms / (1000 * 60 * 60 * 24));
    }
  };

  global.BeybunStore = Store;
})(window);
