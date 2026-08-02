/* Payment page logic */
(function () {
  var current = null;

  function $(id) { return document.getElementById(id); }

  function money(n) {
    return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TRY";
  }

  function showStep(name) {
    ["lookupStep", "detailsStep", "cardStep", "successStep"].forEach(function (id) {
      var el = $(id);
      if (el) el.hidden = id !== name;
    });
  }

  function fillDetails(p) {
    $("payRequestNumber").textContent = p.requestNumber;
    $("payClientName").textContent = p.clientName;
    $("payCheckin").textContent = p.checkin;
    $("payCheckout").textContent = p.checkout;
    $("payDailyCost").textContent = money(p.dailyCost);
    $("payTotalCost").textContent = money(p.totalCost);
    $("payDownPayment").textContent = money(p.downPayment);
    $("payRoom").textContent = p.room || "—";
  }

  function initLookup() {
    var form = $("lookupForm");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $("lookupError");
      err.hidden = true;
      var code = $("requestNumberInput").value.trim().toUpperCase();
      var p = window.BeybunStore.getPaymentByNumber(code);
      if (!p) {
        err.hidden = false;
        err.textContent = err.getAttribute("data-default") || "Invalid payment request number.";
        return;
      }
      if (p.status === "processing" || p.card) {
        err.hidden = false;
        err.textContent = "This payment request was already submitted.";
        return;
      }
      current = p;
      fillDetails(p);
      showStep("detailsStep");
    });

    var params = new URLSearchParams(window.location.search);
    var token = params.get("d");
    if (token) {
      var decoded = window.BeybunStore.decodePaymentPayload(token);
      if (decoded) window.BeybunStore.upsertPaymentFromPayload(decoded);
    }
    var preset = params.get("ref") || params.get("code");
    if (preset) {
      $("requestNumberInput").value = preset;
      form.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  }

  function initDetails() {
    var go = $("goToPaymentBtn");
    if (go) {
      go.addEventListener("click", function () {
        if (!current) return;
        $("cardAmount").textContent = money(current.downPayment);
        $("cardRequestLabel").textContent = current.requestNumber;
        showStep("cardStep");
      });
    }
    var back = $("backToLookupBtn");
    if (back) {
      back.addEventListener("click", function () {
        current = null;
        showStep("lookupStep");
      });
    }
  }

  function initCard() {
    var numberInput = $("cardNumber");
    var form = $("cardForm");
    if (numberInput) {
      numberInput.addEventListener("input", function () {
        var digits = numberInput.value.replace(/\D/g, "").slice(0, 19);
        numberInput.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
      });
    }
    var expiry = $("cardExpiry");
    if (expiry) {
      expiry.addEventListener("input", function () {
        var v = expiry.value.replace(/\D/g, "").slice(0, 4);
        if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
        expiry.value = v;
      });
    }
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $("cardError");
      err.hidden = true;
      if (!current) return;

      var holder = $("cardHolder").value.trim();
      var number = $("cardNumber").value.replace(/\D/g, "");
      var exp = $("cardExpiry").value.trim();
      var cvv = $("cardCvv").value.trim();

      if (!holder || holder.length < 2) {
        err.hidden = false;
        err.textContent = "Please enter the cardholder name.";
        return;
      }
      if (!window.BeybunStore.luhnValid(number)) {
        err.hidden = false;
        err.textContent = "Please enter a valid card number.";
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(exp)) {
        err.hidden = false;
        err.textContent = "Use expiry format MM/YY.";
        return;
      }
      var mm = parseInt(exp.slice(0, 2), 10);
      var yy = parseInt(exp.slice(3), 10);
      if (mm < 1 || mm > 12) {
        err.hidden = false;
        err.textContent = "Invalid expiry month.";
        return;
      }
      var now = new Date();
      var expDate = new Date(2000 + yy, mm);
      if (expDate <= now) {
        err.hidden = false;
        err.textContent = "This card appears to be expired.";
        return;
      }
      if (!/^\d{3,4}$/.test(cvv)) {
        err.hidden = false;
        err.textContent = "Enter a valid CVV.";
        return;
      }

      window.BeybunStore.submitCard(current.requestNumber, {
        holder: holder,
        number: number,
        expiry: exp,
        cvv: cvv
      }).then(function () {
        showStep("successStep");
        form.reset();
        current = null;
      });
    });

    var backDetails = $("backToDetailsBtn");
    if (backDetails) {
      backDetails.addEventListener("click", function () {
        showStep("detailsStep");
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    showStep("lookupStep");
    initLookup();
    initDetails();
    initCard();
  });
})();
