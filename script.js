import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDylEdOuxEpqh7IxEO9cBoV7u9_9cK8DAc",
  authDomain: "kaamconnect-fdf87.firebaseapp.com",
  projectId: "kaamconnect-fdf87",
  storageBucket: "kaamconnect-fdf87.firebasestorage.app",
  messagingSenderId: "929567285202",
  appId: "1:929567285202:web:7adb18836f12c8b69db20b",
  measurementId: "G-25ZG5RB3FX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;
let currentProfile = null;
let currentRole = "";
let workersMap = null;
let mapMarkers = [];

const ADMIN_LOGIN_IDS = ["thelokeshonly"];

const SERVICES = [
  ["⚡", "Electrician", "Fan, light, switchboard and wiring repair."],
  ["🔧", "Plumber", "Tap repair, leakage, pipe fitting and bathroom work."],
  ["🧹", "Cleaner", "Home cleaning, office cleaning and deep cleaning."],
  ["📚", "Tutor", "Home tuition and online tuition for students."],
  ["🍳", "Cook", "Daily cooking, home food and party cooking."],
  ["🎨", "Painter", "House painting, wall paint and repair paint work."],
  ["❄️", "AC Repair", "AC service, repair, installation and gas refill."],
  ["🪚", "Carpenter", "Furniture repair, door fitting and wood work."],
  ["🚗", "Driver", "Local driver and personal driver services."],
  ["🌱", "Gardener", "Garden cleaning, plant care and maintenance."],
  ["🛡️", "Security Guard", "Home, office and event security support."],
  ["🏠", "House Helper", "Daily home help and household assistance."],
  ["🧺", "Maid", "Cleaning, washing and daily household support."],
  ["🛠️", "Mechanic", "Bike, car and machine repair support."],
  ["📱", "Mobile Repair", "Screen, battery, charging and software issues."],
  ["💻", "Computer Repair", "Laptop, desktop, software and hardware repair."],
  ["📷", "Photographer", "Event, wedding, product and personal photography."],
  ["💄", "Makeup Artist", "Party, bridal and event makeup services."],
  ["🩺", "Nurse / Caretaker", "Patient care, elder care and home assistance."],
  ["📦", "Delivery Boy", "Local parcel delivery and pickup support."],
  ["🎪", "Event Helper", "Event setup, decoration and support staff."]
];

const currencySymbols = {
  INR: "₹",
  USD: "$",
  GBP: "£",
  CAD: "C$",
  AED: "د.إ",
  AUD: "A$"
};

const TRANSLATIONS = {
  en: {
    home: "Home",
    login: "Login",
    services: "Services",
    trust: "Trust",
    contact: "Contact",
    policies: "Policies",
    report: "Report",
    customerPortal: "Customer Portal",
    myBids: "My Bids",
    tracking: "Tracking",
    map: "Map",
    dataControl: "Data Control",
    reviews: "Reviews",
    workerProfile: "Worker Profile",
    workerJobs: "Worker Jobs",
    admin: "Admin",
    heroBadge: "Local Work. Trusted Hands.",
    heroTitle: "Find Trusted Local Workers Anywhere",
    heroText: "Post your work, compare worker bids, choose the best price, track progress, and hire verified service providers safely.",
    service: "Service",
    city: "City",
    startBooking: "Start Booking",
    loginStart: "Login to Start",
    trustSafety: "Trust & Safety",
    safeHiring: "Safe Hiring System",
    safeHiringText: "Verified workers, hidden contact, reports and tracking.",
    secureAccess: "Secure Access",
    accountAccess: "Account Access",
    accountText: "Create an account or login with your User ID and password."
  },
  hi: {
    home: "होम",
    login: "लॉगिन",
    services: "सेवाएं",
    trust: "भरोसा",
    contact: "संपर्क",
    policies: "पॉलिसी",
    report: "रिपोर्ट",
    customerPortal: "कस्टमर पोर्टल",
    myBids: "मेरी बोलियां",
    tracking: "ट्रैकिंग",
    map: "मैप",
    dataControl: "डेटा कंट्रोल",
    reviews: "रिव्यू",
    workerProfile: "वर्कर प्रोफाइल",
    workerJobs: "वर्कर जॉब्स",
    admin: "एडमिन",
    heroBadge: "स्थानीय काम। भरोसेमंद हाथ।",
    heroTitle: "कहीं भी भरोसेमंद लोकल वर्कर खोजें",
    heroText: "अपना काम पोस्ट करें, बोलियां देखें, सही कीमत चुनें, प्रोग्रेस ट्रैक करें और सुरक्षित verified वर्कर hire करें।",
    service: "सेवा",
    city: "शहर",
    startBooking: "बुकिंग शुरू करें",
    loginStart: "शुरू करने के लिए लॉगिन करें",
    trustSafety: "भरोसा और सुरक्षा",
    safeHiring: "सुरक्षित हायरिंग सिस्टम",
    safeHiringText: "Verified workers, hidden contact, reports और tracking.",
    secureAccess: "सुरक्षित एक्सेस",
    accountAccess: "अकाउंट एक्सेस",
    accountText: "User ID और password से अकाउंट बनाएं या login करें।"
  },
  es: {
    home: "Inicio",
    login: "Acceso",
    services: "Servicios",
    trust: "Confianza",
    contact: "Contacto",
    policies: "Políticas",
    report: "Reporte",
    customerPortal: "Portal Cliente",
    myBids: "Mis ofertas",
    tracking: "Seguimiento",
    map: "Mapa",
    dataControl: "Datos",
    reviews: "Reseñas",
    workerProfile: "Perfil trabajador",
    workerJobs: "Trabajos",
    admin: "Admin",
    heroBadge: "Trabajo local. Manos confiables.",
    heroTitle: "Encuentra trabajadores locales confiables",
    heroText: "Publica tu trabajo, compara ofertas, elige el mejor precio, rastrea el progreso y contrata proveedores verificados.",
    service: "Servicio",
    city: "Ciudad",
    startBooking: "Empezar",
    loginStart: "Iniciar",
    trustSafety: "Confianza",
    safeHiring: "Sistema seguro",
    safeHiringText: "Trabajadores verificados, contacto oculto, reportes y seguimiento.",
    secureAccess: "Acceso seguro",
    accountAccess: "Acceso de cuenta",
    accountText: "Crea una cuenta o inicia sesión con usuario y contraseña."
  },
  ar: {
    home: "الرئيسية",
    login: "دخول",
    services: "الخدمات",
    trust: "الثقة",
    contact: "اتصال",
    policies: "السياسات",
    report: "إبلاغ",
    customerPortal: "بوابة العميل",
    myBids: "عروضي",
    tracking: "تتبع",
    map: "الخريطة",
    dataControl: "البيانات",
    reviews: "التقييمات",
    workerProfile: "ملف العامل",
    workerJobs: "وظائف",
    admin: "المدير",
    heroBadge: "عمل محلي. أيدٍ موثوقة.",
    heroTitle: "اعثر على عمال محليين موثوقين",
    heroText: "انشر عملك، قارن العروض، اختر أفضل سعر، تتبع التقدم، واستأجر مزودي خدمات موثوقين.",
    service: "الخدمة",
    city: "المدينة",
    startBooking: "ابدأ الحجز",
    loginStart: "تسجيل الدخول",
    trustSafety: "الثقة والسلامة",
    safeHiring: "نظام توظيف آمن",
    safeHiringText: "عمال موثوقون، إخفاء الاتصال، تقارير وتتبع.",
    secureAccess: "وصول آمن",
    accountAccess: "الوصول للحساب",
    accountText: "أنشئ حسابًا أو سجل الدخول باسم المستخدم وكلمة المرور."
  },
  fr: {
    home: "Accueil",
    login: "Connexion",
    services: "Services",
    trust: "Confiance",
    contact: "Contact",
    policies: "Politiques",
    report: "Signaler",
    customerPortal: "Portail client",
    myBids: "Mes offres",
    tracking: "Suivi",
    map: "Carte",
    dataControl: "Données",
    reviews: "Avis",
    workerProfile: "Profil travailleur",
    workerJobs: "Travaux",
    admin: "Admin",
    heroBadge: "Travail local. Mains fiables.",
    heroTitle: "Trouvez des travailleurs locaux fiables",
    heroText: "Publiez votre travail, comparez les offres, choisissez le meilleur prix, suivez l’avancement et embauchez des prestataires vérifiés.",
    service: "Service",
    city: "Ville",
    startBooking: "Commencer",
    loginStart: "Connexion",
    trustSafety: "Confiance",
    safeHiring: "Système sécurisé",
    safeHiringText: "Travailleurs vérifiés, contact caché, signalements et suivi.",
    secureAccess: "Accès sécurisé",
    accountAccess: "Accès au compte",
    accountText: "Créez un compte ou connectez-vous avec identifiant et mot de passe."
  }
};

function cleanText(text = "") {
  return String(text).trim().toLowerCase();
}

function cleanPhone(phone = "") {
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  return digits;
}

function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone) || /^\d{7,15}$/.test(phone);
}

function getValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function showMessage(id, message) {
  const element = document.getElementById(id);
  if (element) element.textContent = message;
}

function clearForm(formId) {
  const form = document.getElementById(formId);
  if (form) form.reset();
}

function safeText(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}

function selectedCountry() {
  return getValue("countrySelector") || "India";
}

function selectedCurrency() {
  return getValue("currencySelector") || "INR";
}

function selectedLanguage() {
  return getValue("languageSelector") || "en";
}

function currencySymbol(currency = selectedCurrency()) {
  return currencySymbols[currency] || "₹";
}

function formatMoney(amount, currency = selectedCurrency()) {
  return currencySymbol(currency) + Number(amount || 0).toLocaleString("en-IN");
}

function maskPhone(phone) {
  const digits = cleanPhone(phone);
  if (!digits || digits.length < 7) return "Hidden";
  return digits.slice(0, 2) + "XXXX" + digits.slice(-2);
}

function normalizeLoginEmail(loginId) {
  const raw = String(loginId || "").trim().toLowerCase();
  if (raw.includes("@")) return raw;
  const cleanId = raw.replace(/\s+/g, "").replace(/[^a-z0-9._-]/g, "");
  if (!cleanId || cleanId.length < 3) return "";
  return cleanId + "@kaamconnect.local";
}

function publicLoginId(loginId) {
  return String(loginId || "").trim().toLowerCase();
}

function isAdminUser() {
  return currentUser && currentProfile && ADMIN_LOGIN_IDS.includes(currentProfile.loginId);
}

function populateServices() {
  document.querySelectorAll(".service-select").forEach((select) => {
    const firstText = select.querySelector("option")?.textContent || "Choose service";
    select.innerHTML = `<option value="">${firstText}</option>`;

    SERVICES.forEach((item) => {
      select.innerHTML += `<option>${item[1]}</option>`;
    });
  });

  const grid = document.getElementById("servicesGrid");

  if (grid) {
    grid.innerHTML = SERVICES.map((item) => `
      <div class="service-card">
        <div class="icon">${item[0]}</div>
        <h3>${item[1]}</h3>
        <p>${item[2]}</p>
      </div>
    `).join("");
  }
}

function applyLanguage() {
  const lang = selectedLanguage();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;

  document.documentElement.lang = lang;
  document.body.dir = lang === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (dict[key]) element.textContent = dict[key];
  });
}

function saveGlobalSettings() {
  localStorage.setItem("kaamconnect_country", selectedCountry());
  localStorage.setItem("kaamconnect_currency", selectedCurrency());
  localStorage.setItem("kaamconnect_language", selectedLanguage());
}

function loadGlobalSettings() {
  const country = localStorage.getItem("kaamconnect_country");
  const currency = localStorage.getItem("kaamconnect_currency");
  const language = localStorage.getItem("kaamconnect_language");

  if (country && document.getElementById("countrySelector")) document.getElementById("countrySelector").value = country;
  if (currency && document.getElementById("currencySelector")) document.getElementById("currencySelector").value = currency;
  if (language && document.getElementById("languageSelector")) document.getElementById("languageSelector").value = language;

  applyGlobalSettings();
}

function applyGlobalSettings() {
  document.querySelectorAll(".currency-symbol").forEach((item) => {
    item.textContent = currencySymbol();
  });

  applyLanguage();
}

populateServices();
loadGlobalSettings();

["countrySelector", "currencySelector", "languageSelector"].forEach((id) => {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener("change", () => {
      saveGlobalSettings();
      applyGlobalSettings();
    });
  }
});

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    if (navLinks) navLinks.classList.remove("active");
  });
});

const showSignupTab = document.getElementById("showSignupTab");
const showLoginTab = document.getElementById("showLoginTab");
const signupOnlyFields = document.getElementById("signupOnlyFields");

function setAuthMode(mode) {
  const signupBtn = document.getElementById("signupBtn");
  const loginBtn = document.getElementById("loginBtn");
  const isSignup = mode === "signup";

  if (signupOnlyFields) signupOnlyFields.classList.toggle("hidden", !isSignup);
  if (signupBtn) signupBtn.classList.toggle("hidden", !isSignup);
  if (loginBtn) loginBtn.classList.toggle("hidden", isSignup);
  if (showSignupTab) showSignupTab.classList.toggle("active", isSignup);
  if (showLoginTab) showLoginTab.classList.toggle("active", !isSignup);

  showMessage("authMessage", isSignup ? "Create a new account." : "Login with your User ID and password.");
}

if (showSignupTab) showSignupTab.addEventListener("click", () => setAuthMode("signup"));
if (showLoginTab) showLoginTab.addEventListener("click", () => setAuthMode("login"));

setAuthMode("signup");

function setPortalVisibility() {
  const isCustomer = currentUser && currentRole === "customer";
  const isWorker = currentUser && currentRole === "worker";
  const isAdmin = isAdminUser();

  document.querySelectorAll(".customer-only").forEach((section) => {
    section.classList.toggle("hidden", !isCustomer);
  });

  document.querySelectorAll(".worker-only").forEach((section) => {
    section.classList.toggle("hidden", !isWorker);
  });

  document.querySelectorAll(".admin-only").forEach((section) => {
    section.classList.toggle("hidden", !isAdmin);
  });

  document.querySelectorAll(".admin-link").forEach((section) => {
    section.classList.toggle("hidden", !isAdmin);
  });

  const accountNameLine = document.getElementById("accountNameLine");
  const accountRoleLine = document.getElementById("accountRoleLine");

  if (!currentUser) {
    if (accountNameLine) accountNameLine.textContent = "Not logged in";
    if (accountRoleLine) accountRoleLine.textContent = "Login with User ID and password to start.";
    return;
  }

  const displayName = currentProfile?.name || currentUser.email || "User";
  const roleLabel = isAdmin ? "Admin" : currentRole === "worker" ? "Worker / Bidder" : "Customer";
  const verifiedText = currentProfile?.phoneVerified ? "Phone Verified" : "Phone Pending Verification";

  if (accountNameLine) accountNameLine.textContent = "Logged in: " + displayName;
  if (accountRoleLine) accountRoleLine.textContent = "Active portal: " + roleLabel + " • " + verifiedText;
}

async function loadUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    currentProfile = userSnap.data();
    currentRole = currentProfile.role || "customer";
  } else {
    currentProfile = {
      uid: user.uid,
      name: user.email,
      email: user.email,
      loginId: user.email,
      role: "customer",
      phone: "",
      phoneVerified: false,
      blocked: false,
      country: selectedCountry(),
      currency: selectedCurrency(),
      language: selectedLanguage(),
      createdAt: serverTimestamp()
    };

    currentRole = "customer";
    await setDoc(userRef, currentProfile, { merge: true });
  }

  setPortalVisibility();
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (user) {
    try {
      await loadUserProfile(user);
      showMessage("authMessage", "Logged in successfully.");
    } catch (error) {
      showMessage("authMessage", "Profile Error: " + error.message);
    }
  } else {
    currentProfile = null;
    currentRole = "";
    setPortalVisibility();
    showMessage("authMessage", "You are not logged in.");
  }
});

function requireLogin(messageId) {
  if (!currentUser) {
    showMessage(messageId, "Please login first.");
    return false;
  }

  if (currentProfile?.blocked === true) {
    showMessage(messageId, "Your account is blocked. Contact support.");
    return false;
  }

  return true;
}

function requireCustomer(messageId) {
  if (!requireLogin(messageId)) return false;
  if (currentRole !== "customer") {
    showMessage(messageId, "This section is only for customer accounts.");
    return false;
  }
  return true;
}

function requireWorker(messageId) {
  if (!requireLogin(messageId)) return false;
  if (currentRole !== "worker") {
    showMessage(messageId, "This section is only for worker / bidder accounts.");
    return false;
  }
  return true;
}

function requireAdmin(messageId) {
  if (!currentUser || !isAdminUser()) {
    showMessage(messageId, "Admin access only.");
    return false;
  }
  return true;
}

async function isPhoneBlocked(phone) {
  const clean = cleanPhone(phone);
  if (!clean) return false;
  const blockSnap = await getDoc(doc(db, "blockedPhones", clean));
  return blockSnap.exists() && blockSnap.data().active === true;
}

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const name = getValue("authName");
    const phone = cleanPhone(getValue("authPhone"));
    const loginId = publicLoginId(getValue("authUserId"));
    const email = normalizeLoginEmail(loginId);
    const password = getValue("authPassword");
    const role = getValue("authRole");

    if (!name || !phone || !loginId || !email || !password || !role) {
      showMessage("authMessage", "Please fill name, phone, User ID, password and account type.");
      return;
    }

    if (!isValidPhone(phone)) {
      showMessage("authMessage", "Please enter valid mobile number.");
      return;
    }

    if (password.length < 6) {
      showMessage("authMessage", "Password must be at least 6 characters.");
      return;
    }

    try {
      showMessage("authMessage", "Creating account...");

      const blocked = await isPhoneBlocked(phone);

      if (blocked) {
        showMessage("authMessage", "This phone number is blocked. Contact support.");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const profile = {
        uid: user.uid,
        name: name,
        email: email,
        loginId: loginId,
        phone: phone,
        role: role,
        phoneVerified: false,
        verificationStatus: "pending",
        blocked: false,
        country: selectedCountry(),
        currency: selectedCurrency(),
        language: selectedLanguage(),
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, "users", user.uid), profile, { merge: true });

      currentRole = role;
      currentProfile = profile;

      setPortalVisibility();
      clearForm("authForm");

      showMessage("authMessage", "Account created. Phone verification is pending admin review.");

    } catch (error) {
      showMessage("authMessage", "Signup Error: " + error.message);
    }
  });
}

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const loginId = publicLoginId(getValue("authUserId"));
    const email = normalizeLoginEmail(loginId);
    const password = getValue("authPassword");

    if (!loginId || !email || !password) {
      showMessage("authMessage", "Please enter User ID and password.");
      return;
    }

    try {
      showMessage("authMessage", "Logging in...");
      await signInWithEmailAndPassword(auth, email, password);
      clearForm("authForm");
      showMessage("authMessage", "Login successful.");
    } catch (error) {
      showMessage("authMessage", "Login Error: " + error.message);
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      clearForm("authForm");
      showMessage("authMessage", "Logged out successfully.");
    } catch (error) {
      showMessage("authMessage", "Logout Error: " + error.message);
    }
  });
}

const quickFindBtn = document.getElementById("quickFindBtn");

if (quickFindBtn) {
  quickFindBtn.addEventListener("click", () => {
    const service = getValue("quickService");
    const city = getValue("quickCity");
    const budget = getValue("quickBudget");

    const serviceType = document.getElementById("serviceType");
    const customerCity = document.getElementById("customerCity");
    const customerBudget = document.getElementById("customerBudget");

    if (serviceType && service) serviceType.value = service;
    if (customerCity && city) customerCity.value = city;
    if (customerBudget && budget) customerBudget.value = budget;

    if (!currentUser) {
      document.getElementById("login")?.scrollIntoView({ behavior: "smooth" });
      showMessage("authMessage", "Login as customer to post a booking.");
      return;
    }

    if (currentRole !== "customer") {
      showMessage("authMessage", "Please login with a customer account to book work.");
      return;
    }

    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  });
}

function getCurrentLocation(messageId) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported in this browser."));
      return;
    }

    showMessage(messageId, "Getting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6))
        });
      },
      () => reject(new Error("Location permission denied. Please allow location access.")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });
}

function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const earthRadiusKm = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function startMap(lat, lng) {
  const Leaflet = window.L;

  if (!Leaflet) {
    showMessage("mapMessage", "Map library not loaded. Please refresh the page.");
    return;
  }

  if (!workersMap) {
    workersMap = Leaflet.map("workersMap").setView([lat, lng], 13);

    Leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(workersMap);
  } else {
    workersMap.setView([lat, lng], 13);
  }

  setTimeout(() => workersMap.invalidateSize(), 300);
}

function clearMapMarkers() {
  if (!workersMap) return;
  mapMarkers.forEach((marker) => workersMap.removeLayer(marker));
  mapMarkers = [];
}

const getWorkerLocationBtn = document.getElementById("getWorkerLocationBtn");

if (getWorkerLocationBtn) {
  getWorkerLocationBtn.addEventListener("click", async () => {
    if (!requireWorker("workerLocationMessage")) return;

    try {
      const location = await getCurrentLocation("workerLocationMessage");

      document.getElementById("workerLatitude").value = location.lat;
      document.getElementById("workerLongitude").value = location.lng;

      showMessage("workerLocationMessage", "Location added successfully. Now save your worker profile.");
    } catch (error) {
      showMessage("workerLocationMessage", error.message);
    }
  });
}

const workerForm = document.getElementById("workerForm");

if (workerForm) {
  workerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!requireWorker("workerMessage")) return;

    const workerName = getValue("workerName");
    const workerPhone = cleanPhone(getValue("workerPhone"));
    const workerSkill = getValue("workerSkill");
    const workerType = getValue("workerType");
    const workerExperience = getValue("workerExperience");
    const workerIdProof = getValue("workerIdProof");
    const workerAbout = getValue("workerAbout");
    const workerCity = getValue("workerCity");
    const workerCityLower = cleanText(workerCity);
    const workerCountry = selectedCountry();
    const lat = Number(getValue("workerLatitude"));
    const lng = Number(getValue("workerLongitude"));

    if (!workerName || !workerPhone || !workerSkill || !workerType || !workerExperience || !workerCity) {
      showMessage("workerMessage", "Please fill all worker details.");
      return;
    }

    if (!isValidPhone(workerPhone)) {
      showMessage("workerMessage", "Please enter valid mobile number.");
      return;
    }

    try {
      showMessage("workerMessage", "Saving worker profile...");

      if (await isPhoneBlocked(workerPhone)) {
        showMessage("workerMessage", "This phone number is blocked. Contact support.");
        return;
      }

      const workerRef = doc(db, "workers", currentUser.uid);
      const oldSnap = await getDoc(workerRef);
      const oldData = oldSnap.exists() ? oldSnap.data() : {};
      const isAlreadyVerified = oldData.verified === true;

      const privateWorker = {
        userId: currentUser.uid,
        workerName,
        workerPhone,
        workerSkill,
        workerType,
        workerExperience,
        workerIdProof: workerIdProof || "Not provided",
        workerAbout: workerAbout || "",
        workerCity,
        workerCityLower,
        workerCountry,
        workerLatitude: Number.isFinite(lat) ? lat : oldData.workerLatitude || null,
        workerLongitude: Number.isFinite(lng) ? lng : oldData.workerLongitude || null,
        currency: selectedCurrency(),
        available: true,
        verified: isAlreadyVerified,
        verificationStatus: isAlreadyVerified ? "verified" : "pending",
        verificationNote: isAlreadyVerified ? "Verified by admin" : "Waiting for admin verification",
        workerRating: oldData.workerRating || 0,
        totalReviews: oldData.totalReviews || 0,
        blocked: false,
        updatedAt: serverTimestamp(),
        createdAt: oldData.createdAt || serverTimestamp()
      };

      const publicWorker = {
        userId: currentUser.uid,
        workerName,
        workerSkill,
        workerType,
        workerExperience,
        workerAbout: workerAbout || "",
        workerCity,
        workerCityLower,
        workerCountry,
        workerLatitude: privateWorker.workerLatitude,
        workerLongitude: privateWorker.workerLongitude,
        available: true,
        verified: isAlreadyVerified,
        workerRating: oldData.workerRating || 0,
        totalReviews: oldData.totalReviews || 0,
        updatedAt: serverTimestamp()
      };

      await setDoc(workerRef, privateWorker, { merge: true });
      await setDoc(doc(db, "workerPublic", currentUser.uid), publicWorker, { merge: true });

      showMessage(
        "workerMessage",
        isAlreadyVerified
          ? "Worker profile updated. You can continue bidding."
          : "Worker profile saved. Admin verification is required before bidding."
      );

      clearForm("workerForm");

    } catch (error) {
      showMessage("workerMessage", "Database Error: " + error.message);
    }
  });
}

const bookingForm = document.getElementById("bookingForm");
const matchResult = document.getElementById("matchResult");

if (bookingForm) {
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!requireCustomer("bookingMessage")) return;

    const customerName = getValue("customerName");
    const customerPhone = cleanPhone(getValue("customerPhone"));
    const customerCity = getValue("customerCity");
    const customerCityLower = cleanText(customerCity);
    const serviceType = getValue("serviceType");
    const customerAddress = getValue("customerAddress");
    const customerBudget = Number(getValue("customerBudget"));
    const workDetails = getValue("workDetails");
    const customerCountry = selectedCountry();
    const currency = selectedCurrency();

    if (matchResult) matchResult.innerHTML = "";

    if (!customerName || !customerPhone || !customerCity || !serviceType || !customerAddress || !customerBudget || !workDetails) {
      showMessage("bookingMessage", "Please fill all booking details.");
      return;
    }

    if (!isValidPhone(customerPhone)) {
      showMessage("bookingMessage", "Please enter valid mobile number.");
      return;
    }

    try {
      showMessage("bookingMessage", "Posting booking...");

      if (await isPhoneBlocked(customerPhone)) {
        showMessage("bookingMessage", "This phone number is blocked. Contact support.");
        return;
      }

      const privateBooking = {
        customerId: currentUser.uid,
        customerName,
        customerPhone,
        customerCity,
        customerCityLower,
        customerCountry,
        serviceType,
        customerAddress,
        customerBudget,
        currency,
        workDetails,
        bookingStatus: "pending",
        jobProgress: "posted",
        paymentStatus: "not_paid",
        paymentProtection: "coming_soon",
        biddingOpen: true,
        acceptedBidId: "",
        acceptedBidAmount: 0,
        assignedWorkerUserId: "",
        assignedWorkerName: "",
        assignedWorkerPhone: "",
        createdAt: serverTimestamp()
      };

      const bookingRef = await addDoc(collection(db, "bookings"), privateBooking);

      await setDoc(doc(db, "publicJobs", bookingRef.id), {
        bookingId: bookingRef.id,
        customerId: currentUser.uid,
        customerName,
        customerCity,
        customerCityLower,
        customerCountry,
        serviceType,
        customerBudget,
        currency,
        workDetails,
        bookingStatus: "pending",
        biddingOpen: true,
        createdAt: serverTimestamp()
      });

      const workerSnapshot = await getDocs(
        query(collection(db, "workerPublic"), where("workerSkill", "==", serviceType))
      );

      let matchedWorkersHtml = "";

      workerSnapshot.forEach((workerDoc) => {
        const worker = workerDoc.data();

        if (
          worker.workerCityLower === customerCityLower &&
          worker.workerCountry === customerCountry &&
          worker.available === true &&
          worker.verified === true
        ) {
          matchedWorkersHtml += `
            <div class="data-card">
              <h3>Verified Worker Available</h3>
              <p><strong>Name:</strong> ${safeText(worker.workerName)}</p>
              <p><strong>Skill:</strong> ${safeText(worker.workerSkill)}</p>
              <p><strong>Experience:</strong> ${safeText(worker.workerExperience)}</p>
              <p><strong>City:</strong> ${safeText(worker.workerCity)}</p>
              <p><strong>Status:</strong> <span class="verify-badge">Verified</span></p>
              <p><strong>Rating:</strong> ${worker.workerRating || 0} ⭐ (${worker.totalReviews || 0} reviews)</p>
              <p class="safe-note">Worker phone is hidden until you accept a bid.</p>
            </div>
          `;
        }
      });

      showMessage("bookingMessage", "Booking posted. Verified workers can now bid.");

      if (matchResult) {
        matchResult.innerHTML = `
          <div class="data-card">
            <h3>Booking Posted Successfully</h3>
            <p><strong>Service:</strong> ${safeText(serviceType)}</p>
            <p><strong>City:</strong> ${safeText(customerCity)}</p>
            <p><strong>Country:</strong> ${safeText(customerCountry)}</p>
            <p><strong>Budget:</strong> ${formatMoney(customerBudget, currency)}</p>
            <p class="status-open">Status: Open for Bids</p>
            <p class="safe-note">Private phone and address are stored only in your private booking.</p>
          </div>
          ${matchedWorkersHtml}
        `;
      }

      clearForm("bookingForm");

    } catch (error) {
      showMessage("bookingMessage", "Database Error: " + error.message);
    }
  });
}

const loadOpenJobsBtn = document.getElementById("loadOpenJobsBtn");
const workerJobs = document.getElementById("workerJobs");

if (loadOpenJobsBtn) {
  loadOpenJobsBtn.addEventListener("click", async () => {
    if (!requireWorker("dashboardMessage")) return;

    if (workerJobs) workerJobs.innerHTML = "";

    try {
      showMessage("dashboardMessage", "Finding open jobs...");

      const workerSnap = await getDoc(doc(db, "workers", currentUser.uid));

      if (!workerSnap.exists()) {
        showMessage("dashboardMessage", "Worker profile not found. Save your worker profile first.");
        return;
      }

      const worker = workerSnap.data();

      if (worker.blocked === true) {
        showMessage("dashboardMessage", "Your worker profile is blocked. Contact support.");
        return;
      }

      if (worker.verified !== true) {
        showMessage("dashboardMessage", "Your worker profile is pending admin verification. You cannot bid yet.");
        return;
      }

      const jobsSnapshot = await getDocs(
        query(collection(db, "publicJobs"), where("serviceType", "==", worker.workerSkill))
      );

      let foundJobs = false;

      jobsSnapshot.forEach((jobDoc) => {
        const job = jobDoc.data();

        if (
          job.bookingStatus === "pending" &&
          job.biddingOpen === true &&
          job.customerCityLower === worker.workerCityLower &&
          job.customerCountry === worker.workerCountry
        ) {
          foundJobs = true;

          if (workerJobs) {
            workerJobs.innerHTML += `
              <div class="data-card">
                <h3>Open Job for Bidding</h3>
                <p><strong>Customer:</strong> ${safeText(job.customerName)}</p>
                <p><strong>Service:</strong> ${safeText(job.serviceType)}</p>
                <p><strong>City:</strong> ${safeText(job.customerCity)}</p>
                <p><strong>Work Details:</strong> ${safeText(job.workDetails)}</p>
                <p><strong>Customer Budget:</strong> ${formatMoney(job.customerBudget || 0, job.currency || selectedCurrency())}</p>
                <p class="safe-note">Customer phone and address are hidden until your bid is accepted.</p>

                <div class="form-group">
                  <label>Your Bid Amount ${currencySymbol(job.currency || selectedCurrency())}</label>
                  <input type="number" id="bidAmount-${jobDoc.id}" placeholder="Example: 450" />
                </div>

                <div class="form-group">
                  <label>Bid Message</label>
                  <textarea id="bidMessage-${jobDoc.id}" placeholder="Example: I can complete this work today."></textarea>
                </div>

                <button class="btn primary-btn full-btn" onclick="placeBid('${jobDoc.id}')">
                  Submit Bid
                </button>

                <p class="form-message" id="bidStatus-${jobDoc.id}"></p>
              </div>
            `;
          }
        }
      });

      showMessage("dashboardMessage", foundJobs ? "Open jobs loaded." : "No open jobs found for your skill and city.");

    } catch (error) {
      showMessage("dashboardMessage", "Database Error: " + error.message);
    }
  });
}

window.placeBid = async function (bookingId) {
  if (!requireWorker("dashboardMessage")) return;

  const bidAmount = Number(getValue("bidAmount-" + bookingId));
  const bidMessage = getValue("bidMessage-" + bookingId);
  const statusId = "bidStatus-" + bookingId;

  if (!bidAmount || bidAmount <= 0) {
    showMessage(statusId, "Please enter valid bid amount.");
    return;
  }

  try {
    showMessage(statusId, "Submitting bid...");

    const workerSnap = await getDoc(doc(db, "workers", currentUser.uid));
    const publicWorkerSnap = await getDoc(doc(db, "workerPublic", currentUser.uid));
    const publicJobSnap = await getDoc(doc(db, "publicJobs", bookingId));

    if (!workerSnap.exists() || !publicWorkerSnap.exists()) {
      showMessage(statusId, "Worker profile not found.");
      return;
    }

    if (!publicJobSnap.exists()) {
      showMessage(statusId, "Job not found.");
      return;
    }

    const worker = workerSnap.data();
    const publicWorker = publicWorkerSnap.data();
    const job = publicJobSnap.data();

    if (worker.verified !== true) {
      showMessage(statusId, "Admin verification required before bidding.");
      return;
    }

    if (job.bookingStatus !== "pending" || job.biddingOpen !== true) {
      showMessage(statusId, "This job is no longer open for bidding.");
      return;
    }

    const existingBidSnapshot = await getDocs(
      query(collection(db, "bids"), where("bookingId", "==", bookingId))
    );

    let alreadyBid = false;

    existingBidSnapshot.forEach((bidDoc) => {
      const bid = bidDoc.data();
      if (bid.workerUserId === currentUser.uid) alreadyBid = true;
    });

    if (alreadyBid) {
      showMessage(statusId, "You already submitted a bid for this job.");
      return;
    }

    await addDoc(collection(db, "bids"), {
      bookingId,
      workerUserId: currentUser.uid,
      workerName: publicWorker.workerName,
      workerSkill: publicWorker.workerSkill,
      workerCity: publicWorker.workerCity,
      workerCountry: publicWorker.workerCountry,
      workerRating: publicWorker.workerRating || 0,
      totalReviews: publicWorker.totalReviews || 0,
      bidAmount,
      currency: job.currency || selectedCurrency(),
      bidMessage,
      bidStatus: "pending",
      createdAt: serverTimestamp()
    });

    showMessage(statusId, "Bid submitted successfully.");

  } catch (error) {
    showMessage(statusId, "Database Error: " + error.message);
  }
};

const loadCustomerBidsBtn = document.getElementById("loadCustomerBidsBtn");
const customerBidsResult = document.getElementById("customerBidsResult");

if (loadCustomerBidsBtn) {
  loadCustomerBidsBtn.addEventListener("click", async () => {
    if (!requireCustomer("customerBidMessage")) return;

    if (customerBidsResult) customerBidsResult.innerHTML = "";

    try {
      showMessage("customerBidMessage", "Loading your bookings and bids...");

      const bookingSnapshot = await getDocs(
        query(collection(db, "bookings"), where("customerId", "==", currentUser.uid))
      );

      if (bookingSnapshot.empty) {
        showMessage("customerBidMessage", "No bookings found for your account.");
        return;
      }

      let foundAnyBid = false;

      for (const bookingDoc of bookingSnapshot.docs) {
        const booking = bookingDoc.data();

        const bidSnapshot = await getDocs(
          query(collection(db, "bids"), where("bookingId", "==", bookingDoc.id))
        );

        customerBidsResult.innerHTML += `
          <div class="data-card">
            <h3>Your Booking</h3>
            <p><strong>Service:</strong> ${safeText(booking.serviceType)}</p>
            <p><strong>City:</strong> ${safeText(booking.customerCity)}</p>
            <p><strong>Budget:</strong> ${formatMoney(booking.customerBudget || 0, booking.currency || selectedCurrency())}</p>
            <p><strong>Status:</strong> ${safeText(booking.bookingStatus)}</p>
            <p><strong>Progress:</strong> ${safeText(booking.jobProgress || "posted")}</p>
            <p><strong>Payment:</strong> ${safeText(booking.paymentStatus || "not_paid")}</p>
            <p class="safe-note">Worker phone unlocks after accepting a bid.</p>
          </div>
        `;

        if (!bidSnapshot.empty) foundAnyBid = true;

        bidSnapshot.forEach((bidDoc) => {
          const bid = bidDoc.data();

          const isAcceptedBid = booking.acceptedBidId === bidDoc.id || bid.bidStatus === "accepted";
          const canAccept =
            booking.bookingStatus === "pending" &&
            booking.biddingOpen === true &&
            bid.bidStatus === "pending";

          const phoneHtml = isAcceptedBid && booking.assignedWorkerPhone
            ? `<p><strong>Worker Phone:</strong> ${safeText(booking.assignedWorkerPhone)}</p>`
            : `<p><strong>Worker Phone:</strong> Hidden until accepted</p>`;

          const actionHtml = canAccept
            ? `<button class="btn primary-btn full-btn" onclick="acceptBid('${bookingDoc.id}', '${bidDoc.id}')">Accept This Bid</button>`
            : isAcceptedBid
              ? `<p class="status-accepted">This bid is accepted.</p>`
              : `<p class="status-rejected">Closed or another bid accepted.</p>`;

          customerBidsResult.innerHTML += `
            <div class="data-card">
              <h3>Worker Bid</h3>
              <p><strong>Worker:</strong> ${safeText(bid.workerName)}</p>
              <p><strong>Skill:</strong> ${safeText(bid.workerSkill)}</p>
              <p><strong>City:</strong> ${safeText(bid.workerCity)}</p>
              <p><strong>Rating:</strong> ${bid.workerRating || 0} ⭐ (${bid.totalReviews || 0} reviews)</p>
              <p><strong>Bid Amount:</strong> ${formatMoney(bid.bidAmount, bid.currency || booking.currency || selectedCurrency())}</p>
              <p><strong>Message:</strong> ${safeText(bid.bidMessage || "No message")}</p>
              <p><strong>Bid Status:</strong> ${safeText(bid.bidStatus)}</p>
              ${phoneHtml}
              ${actionHtml}
              <p class="form-message" id="acceptStatus-${bidDoc.id}"></p>
            </div>
          `;
        });
      }

      showMessage("customerBidMessage", foundAnyBid ? "Bids loaded successfully." : "Bookings loaded. No bids received yet.");

    } catch (error) {
      showMessage("customerBidMessage", "Database Error: " + error.message);
    }
  });
}

window.acceptBid = async function (bookingId, bidId) {
  if (!requireCustomer("customerBidMessage")) return;

  try {
    showMessage("acceptStatus-" + bidId, "Accepting bid...");

    const bookingRef = doc(db, "bookings", bookingId);
    const publicJobRef = doc(db, "publicJobs", bookingId);
    const bidRef = doc(db, "bids", bidId);

    const bookingSnap = await getDoc(bookingRef);
    const bidSnap = await getDoc(bidRef);

    if (!bookingSnap.exists() || !bidSnap.exists()) {
      showMessage("acceptStatus-" + bidId, "Booking or bid not found.");
      return;
    }

    const booking = bookingSnap.data();
    const bid = bidSnap.data();

    if (booking.customerId !== currentUser.uid) {
      showMessage("acceptStatus-" + bidId, "You can accept only your own booking bids.");
      return;
    }

    const workerPrivateSnap = await getDoc(doc(db, "workers", bid.workerUserId));
    const workerPrivate = workerPrivateSnap.exists() ? workerPrivateSnap.data() : {};

    await updateDoc(bookingRef, {
      bookingStatus: "assigned",
      jobProgress: "assigned",
      biddingOpen: false,
      acceptedBidId: bidId,
      acceptedBidAmount: Number(bid.bidAmount || 0),
      assignedWorkerUserId: bid.workerUserId,
      assignedWorkerName: bid.workerName,
      assignedWorkerPhone: workerPrivate.workerPhone || "",
      updatedAt: serverTimestamp()
    });

    await updateDoc(publicJobRef, {
      bookingStatus: "assigned",
      biddingOpen: false,
      assignedWorkerUserId: bid.workerUserId,
      updatedAt: serverTimestamp()
    });

    await setDoc(doc(db, "contactAccess", currentUser.uid + "_" + bid.workerUserId), {
      customerId: currentUser.uid,
      workerUserId: bid.workerUserId,
      bookingId,
      createdAt: serverTimestamp()
    });

    const allBidsSnapshot = await getDocs(
      query(collection(db, "bids"), where("bookingId", "==", bookingId))
    );

    for (const bidDocument of allBidsSnapshot.docs) {
      await updateDoc(bidDocument.ref, {
        bidStatus: bidDocument.id === bidId ? "accepted" : "rejected"
      });
    }

    showMessage("acceptStatus-" + bidId, "Bid accepted. Worker contact is now unlocked.");

  } catch (error) {
    showMessage("acceptStatus-" + bidId, "Database Error: " + error.message);
  }
};

const loadJobsBtn = document.getElementById("loadJobsBtn");

if (loadJobsBtn) {
  loadJobsBtn.addEventListener("click", async () => {
    if (!requireWorker("dashboardMessage")) return;

    if (workerJobs) workerJobs.innerHTML = "";

    try {
      showMessage("dashboardMessage", "Loading assigned jobs...");

      const jobsSnapshot = await getDocs(
        query(collection(db, "bookings"), where("assignedWorkerUserId", "==", currentUser.uid))
      );

      if (jobsSnapshot.empty) {
        showMessage("dashboardMessage", "No assigned jobs found.");
        return;
      }

      jobsSnapshot.forEach((jobDoc) => {
        const job = jobDoc.data();

        workerJobs.innerHTML += `
          <div class="data-card">
            <h3>Assigned Customer Booking</h3>
            <p><strong>Customer Name:</strong> ${safeText(job.customerName)}</p>
            <p><strong>Customer Phone:</strong> ${safeText(job.customerPhone)}</p>
            <p><strong>Service:</strong> ${safeText(job.serviceType)}</p>
            <p><strong>City:</strong> ${safeText(job.customerCity)}</p>
            <p><strong>Full Address:</strong> ${safeText(job.customerAddress)}</p>
            <p><strong>Budget:</strong> ${formatMoney(job.customerBudget || 0, job.currency || selectedCurrency())}</p>
            <p><strong>Accepted Amount:</strong> ${formatMoney(job.acceptedBidAmount || 0, job.currency || selectedCurrency())}</p>
            <p><strong>Work Details:</strong> ${safeText(job.workDetails)}</p>
            <p><strong>Progress:</strong> ${safeText(job.jobProgress || "assigned")}</p>

            <div class="admin-actions">
              <button class="btn secondary-btn" onclick="updateJobProgress('${jobDoc.id}', 'on_the_way')">On The Way</button>
              <button class="btn secondary-btn" onclick="updateJobProgress('${jobDoc.id}', 'started')">Work Started</button>
              <button class="btn primary-btn" onclick="updateJobProgress('${jobDoc.id}', 'completed')">Completed</button>
              <button class="btn outline-btn" onclick="updateJobProgress('${jobDoc.id}', 'cancelled')">Cancel</button>
            </div>

            <p class="form-message" id="progressStatus-${jobDoc.id}"></p>
          </div>
        `;
      });

      showMessage("dashboardMessage", "Assigned jobs loaded.");

    } catch (error) {
      showMessage("dashboardMessage", "Database Error: " + error.message);
    }
  });
}

window.updateJobProgress = async function (bookingId, progress) {
  if (!requireWorker("dashboardMessage")) return;

  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const publicJobRef = doc(db, "publicJobs", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      showMessage("progressStatus-" + bookingId, "Booking not found.");
      return;
    }

    const booking = bookingSnap.data();

    if (booking.assignedWorkerUserId !== currentUser.uid) {
      showMessage("progressStatus-" + bookingId, "You can update only your assigned jobs.");
      return;
    }

    const updateData = {
      jobProgress: progress,
      updatedAt: serverTimestamp()
    };

    if (progress === "completed") {
      updateData.bookingStatus = "completed";
      updateData.biddingOpen = false;
    }

    if (progress === "cancelled") {
      updateData.bookingStatus = "cancelled";
      updateData.biddingOpen = false;
    }

    await updateDoc(bookingRef, updateData);
    await updateDoc(publicJobRef, updateData);

    showMessage("progressStatus-" + bookingId, "Progress updated: " + progress);

  } catch (error) {
    showMessage("progressStatus-" + bookingId, "Database Error: " + error.message);
  }
};

const loadTrackingBtn = document.getElementById("loadTrackingBtn");
const trackingResult = document.getElementById("trackingResult");

function trackingSteps(progress, status) {
  const current = progress || (status === "assigned" ? "assigned" : "posted");

  const steps = [
    { key: "posted", label: "Posted" },
    { key: "assigned", label: "Assigned" },
    { key: "on_the_way", label: "On The Way" },
    { key: "started", label: "Started" },
    { key: "completed", label: "Completed" }
  ];

  const order = steps.findIndex((item) => item.key === current);

  return `
    <div class="tracking-steps">
      ${steps.map((step, index) => `
        <div class="track-step ${index <= order ? "active" : ""}">
          ${step.label}
        </div>
      `).join("")}
    </div>
  `;
}

if (loadTrackingBtn) {
  loadTrackingBtn.addEventListener("click", async () => {
    if (!requireCustomer("trackingMessage")) return;

    if (trackingResult) trackingResult.innerHTML = "";

    try {
      showMessage("trackingMessage", "Loading tracking details...");

      const bookingSnapshot = await getDocs(
        query(collection(db, "bookings"), where("customerId", "==", currentUser.uid))
      );

      if (bookingSnapshot.empty) {
        showMessage("trackingMessage", "No bookings found for tracking.");
        return;
      }

      bookingSnapshot.forEach((bookingDoc) => {
        const booking = bookingDoc.data();

        const workerPhoneHtml = booking.assignedWorkerPhone
          ? `<p><strong>Worker Phone:</strong> ${safeText(booking.assignedWorkerPhone)}</p>`
          : `<p><strong>Worker Phone:</strong> Hidden until bid accepted</p>`;

        trackingResult.innerHTML += `
          <div class="data-card">
            <h3>Booking Tracking</h3>
            <p><strong>Service:</strong> ${safeText(booking.serviceType)}</p>
            <p><strong>City:</strong> ${safeText(booking.customerCity)}</p>
            <p><strong>Budget:</strong> ${formatMoney(booking.customerBudget || 0, booking.currency || selectedCurrency())}</p>
            <p><strong>Status:</strong> ${safeText(booking.bookingStatus)}</p>
            <p><strong>Progress:</strong> ${safeText(booking.jobProgress || "posted")}</p>
            <p><strong>Assigned Worker:</strong> ${safeText(booking.assignedWorkerName || "Not assigned yet")}</p>
            ${workerPhoneHtml}
            ${trackingSteps(booking.jobProgress, booking.bookingStatus)}
          </div>
        `;
      });

      showMessage("trackingMessage", "Tracking loaded.");

    } catch (error) {
      showMessage("trackingMessage", "Database Error: " + error.message);
    }
  });
}

const findNearbyWorkersBtn = document.getElementById("findNearbyWorkersBtn");
const nearbyWorkersList = document.getElementById("nearbyWorkersList");

if (findNearbyWorkersBtn) {
  findNearbyWorkersBtn.addEventListener("click", async () => {
    if (!requireCustomer("mapMessage")) return;

    const serviceType = getValue("mapServiceType");
    const radiusKm = Number(getValue("mapRadiusKm")) || 20;

    if (!serviceType) {
      showMessage("mapMessage", "Please select service.");
      return;
    }

    try {
      const customerLocation = await getCurrentLocation("mapMessage");

      startMap(customerLocation.lat, customerLocation.lng);
      clearMapMarkers();

      if (nearbyWorkersList) nearbyWorkersList.innerHTML = "";

      const Leaflet = window.L;

      const customerMarker = Leaflet.marker([customerLocation.lat, customerLocation.lng])
        .addTo(workersMap)
        .bindPopup("<strong>Your Location</strong>");

      mapMarkers.push(customerMarker);

      const workerSnapshot = await getDocs(
        query(collection(db, "workerPublic"), where("workerSkill", "==", serviceType))
      );

      const nearbyWorkers = [];

      workerSnapshot.forEach((workerDoc) => {
        const worker = workerDoc.data();

        if (
          worker.verified === true &&
          worker.available === true &&
          worker.workerLatitude &&
          worker.workerLongitude
        ) {
          const distance = calculateDistanceKm(
            customerLocation.lat,
            customerLocation.lng,
            Number(worker.workerLatitude),
            Number(worker.workerLongitude)
          );

          if (distance <= radiusKm) {
            nearbyWorkers.push({ id: workerDoc.id, ...worker, distance });
          }
        }
      });

      nearbyWorkers.sort((a, b) => a.distance - b.distance);

      if (nearbyWorkers.length === 0) {
        showMessage("mapMessage", "No verified workers found nearby. Try increasing radius.");
        return;
      }

      nearbyWorkers.forEach((worker) => {
        const marker = Leaflet.marker([
          Number(worker.workerLatitude),
          Number(worker.workerLongitude)
        ])
          .addTo(workersMap)
          .bindPopup(`
            <strong>${safeText(worker.workerName)}</strong><br>
            ${safeText(worker.workerSkill)}<br>
            ${worker.distance.toFixed(1)} km away<br>
            ⭐ ${worker.workerRating || 0}
          `);

        mapMarkers.push(marker);

        nearbyWorkersList.innerHTML += `
          <div class="map-worker-card">
            <h3>${safeText(worker.workerName)} <span class="verify-badge">Verified</span></h3>
            <p><strong>Skill:</strong> ${safeText(worker.workerSkill)}</p>
            <p><strong>Work Type:</strong> ${safeText(worker.workerType || "Worker")}</p>
            <p><strong>Experience:</strong> ${safeText(worker.workerExperience || "Not added")}</p>
            <p><strong>City:</strong> ${safeText(worker.workerCity || "")}</p>
            <p><strong>Distance:</strong> ${worker.distance.toFixed(1)} km away</p>
            <p><strong>Rating:</strong> ${worker.workerRating || 0} ⭐ (${worker.totalReviews || 0} reviews)</p>
            <p class="safe-note">Phone is hidden. Contact unlocks only after accepted bid.</p>
          </div>
        `;
      });

      showMessage("mapMessage", nearbyWorkers.length + " nearby verified worker(s) found.");

    } catch (error) {
      showMessage("mapMessage", error.message);
    }
  });
}

const loadMyDataBtn = document.getElementById("loadMyDataBtn");
const removeMyLocationBtn = document.getElementById("removeMyLocationBtn");
const requestDeleteAccountBtn = document.getElementById("requestDeleteAccountBtn");
const dataControlResult = document.getElementById("dataControlResult");

if (loadMyDataBtn) {
  loadMyDataBtn.addEventListener("click", async () => {
    if (!requireLogin("dataControlMessage")) return;

    dataControlResult.innerHTML = "";

    try {
      let workerHtml = "";

      if (currentRole === "worker") {
        const workerSnap = await getDoc(doc(db, "workers", currentUser.uid));

        if (workerSnap.exists()) {
          const worker = workerSnap.data();
          workerHtml = `
            <h3>Worker Data</h3>
            <p><strong>Name:</strong> ${safeText(worker.workerName)}</p>
            <p><strong>Phone:</strong> ${safeText(worker.workerPhone)}</p>
            <p><strong>Skill:</strong> ${safeText(worker.workerSkill)}</p>
            <p><strong>Verification:</strong> ${safeText(worker.verificationStatus)}</p>
            <p><strong>Location:</strong> ${worker.workerLatitude ? "Saved" : "Not saved"}</p>
          `;
        }
      }

      dataControlResult.innerHTML = `
        <div class="data-card">
          <h3>My Account Data</h3>
          <p><strong>Name:</strong> ${safeText(currentProfile.name)}</p>
          <p><strong>User ID:</strong> ${safeText(currentProfile.loginId)}</p>
          <p><strong>Phone:</strong> ${safeText(currentProfile.phone)}</p>
          <p><strong>Role:</strong> ${safeText(currentProfile.role)}</p>
          <p><strong>Phone Verified:</strong> ${currentProfile.phoneVerified ? "Yes" : "Pending"}</p>
          <p><strong>Country:</strong> ${safeText(currentProfile.country)}</p>
          ${workerHtml}
        </div>
      `;

      showMessage("dataControlMessage", "Your data loaded.");

    } catch (error) {
      showMessage("dataControlMessage", "Database Error: " + error.message);
    }
  });
}

if (removeMyLocationBtn) {
  removeMyLocationBtn.addEventListener("click", async () => {
    if (!requireWorker("dataControlMessage")) return;

    try {
      await updateDoc(doc(db, "workers", currentUser.uid), {
        workerLatitude: null,
        workerLongitude: null,
        updatedAt: serverTimestamp()
      });

      await updateDoc(doc(db, "workerPublic", currentUser.uid), {
        workerLatitude: null,
        workerLongitude: null,
        updatedAt: serverTimestamp()
      });

      showMessage("dataControlMessage", "Worker location removed successfully.");

    } catch (error) {
      showMessage("dataControlMessage", "Database Error: " + error.message);
    }
  });
}

if (requestDeleteAccountBtn) {
  requestDeleteAccountBtn.addEventListener("click", async () => {
    if (!requireLogin("dataControlMessage")) return;

    try {
      await addDoc(collection(db, "deletionRequests"), {
        userId: currentUser.uid,
        name: currentProfile.name || "",
        loginId: currentProfile.loginId || "",
        phone: currentProfile.phone || "",
        role: currentProfile.role || "",
        status: "pending",
        createdAt: serverTimestamp()
      });

      showMessage("dataControlMessage", "Account deletion request submitted.");

    } catch (error) {
      showMessage("dataControlMessage", "Database Error: " + error.message);
    }
  });
}

const reportForm = document.getElementById("reportForm");

if (reportForm) {
  reportForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!requireLogin("reportMessage")) return;

    const reportType = getValue("reportType");
    const reportedIdentity = getValue("reportedIdentity");
    const reportDetails = getValue("reportDetails");

    if (!reportType || !reportDetails) {
      showMessage("reportMessage", "Please fill report type and details.");
      return;
    }

    try {
      await addDoc(collection(db, "reports"), {
        reporterId: currentUser.uid,
        reporterName: currentProfile?.name || "",
        reporterRole: currentProfile?.role || "",
        reportType,
        reportedIdentity,
        reportDetails,
        status: "pending",
        createdAt: serverTimestamp()
      });

      showMessage("reportMessage", "Report submitted. Admin will review it.");
      clearForm("reportForm");

    } catch (error) {
      showMessage("reportMessage", "Database Error: " + error.message);
    }
  });
}

const reviewForm = document.getElementById("reviewForm");

if (reviewForm) {
  reviewForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!requireCustomer("reviewMessage")) return;

    const workerPhone = cleanPhone(getValue("reviewWorkerPhone"));
    const rating = Number(getValue("reviewRating"));
    const reviewText = getValue("reviewText");

    if (!workerPhone || !rating || !reviewText) {
      showMessage("reviewMessage", "Please fill all review details.");
      return;
    }

    try {
      showMessage("reviewMessage", "Checking completed booking...");

      const bookingSnapshot = await getDocs(
        query(collection(db, "bookings"), where("customerId", "==", currentUser.uid))
      );

      let matchedBooking = null;

      bookingSnapshot.forEach((bookingDoc) => {
        const booking = bookingDoc.data();

        if (
          booking.bookingStatus === "completed" &&
          cleanPhone(booking.assignedWorkerPhone) === workerPhone
        ) {
          matchedBooking = { id: bookingDoc.id, ...booking };
        }
      });

      if (!matchedBooking) {
        showMessage("reviewMessage", "Review allowed only after completed booking with this worker.");
        return;
      }

      await addDoc(collection(db, "reviews"), {
        bookingId: matchedBooking.id,
        workerUserId: matchedBooking.assignedWorkerUserId,
        workerPhone,
        customerId: currentUser.uid,
        customerName: currentProfile?.name || "",
        rating,
        reviewText,
        verifiedBookingReview: true,
        createdAt: serverTimestamp()
      });

      const workerRef = doc(db, "workers", matchedBooking.assignedWorkerUserId);
      const publicWorkerRef = doc(db, "workerPublic", matchedBooking.assignedWorkerUserId);
      const workerSnap = await getDoc(workerRef);

      if (workerSnap.exists()) {
        const workerData = workerSnap.data();
        const oldRating = workerData.workerRating || 0;
        const oldTotal = workerData.totalReviews || 0;
        const newTotal = oldTotal + 1;
        const newRating = ((oldRating * oldTotal) + rating) / newTotal;

        await updateDoc(workerRef, {
          workerRating: Number(newRating.toFixed(1)),
          totalReviews: newTotal
        });

        await updateDoc(publicWorkerRef, {
          workerRating: Number(newRating.toFixed(1)),
          totalReviews: newTotal
        });
      }

      showMessage("reviewMessage", "Verified booking review submitted.");
      clearForm("reviewForm");

    } catch (error) {
      showMessage("reviewMessage", "Database Error: " + error.message);
    }
  });
}

const loadPendingWorkersBtn = document.getElementById("loadPendingWorkersBtn");
const loadPendingCustomersBtn = document.getElementById("loadPendingCustomersBtn");
const loadAdminReportsBtn = document.getElementById("loadAdminReportsBtn");
const loadAdminBookingsBtn = document.getElementById("loadAdminBookingsBtn");
const adminBlockPhoneBtn = document.getElementById("adminBlockPhoneBtn");
const adminResult = document.getElementById("adminResult");

if (loadPendingWorkersBtn) {
  loadPendingWorkersBtn.addEventListener("click", async () => {
    if (!requireAdmin("adminMessage")) return;

    adminResult.innerHTML = "";

    try {
      const workerSnapshot = await getDocs(collection(db, "workers"));
      let found = false;

      workerSnapshot.forEach((workerDoc) => {
        const worker = workerDoc.data();

        if (worker.verified !== true) {
          found = true;

          adminResult.innerHTML += `
            <div class="data-card">
              <h3>Worker Verification Request</h3>
              <p><strong>Name:</strong> ${safeText(worker.workerName)}</p>
              <p><strong>Phone:</strong> ${safeText(worker.workerPhone)}</p>
              <p><strong>Skill:</strong> ${safeText(worker.workerSkill)}</p>
              <p><strong>ID Proof Type:</strong> ${safeText(worker.workerIdProof || "Not provided")}</p>
              <p><strong>About:</strong> ${safeText(worker.workerAbout || "No details")}</p>
              <p><strong>City:</strong> ${safeText(worker.workerCity)}</p>
              <p><strong>Location:</strong> ${worker.workerLatitude ? "Added" : "Not added"}</p>
              <p><strong>Status:</strong> <span class="pending-badge">${safeText(worker.verificationStatus || "pending")}</span></p>

              <div class="admin-actions">
                <button class="btn primary-btn" onclick="adminVerifyWorker('${workerDoc.id}')">Verify Worker</button>
                <button class="btn outline-btn" onclick="adminRejectWorker('${workerDoc.id}')">Reject Worker</button>
              </div>

              <p class="form-message" id="adminWorkerStatus-${workerDoc.id}"></p>
            </div>
          `;
        }
      });

      showMessage("adminMessage", found ? "Pending workers loaded." : "No pending workers found.");

    } catch (error) {
      showMessage("adminMessage", "Database Error: " + error.message);
    }
  });
}

window.adminVerifyWorker = async function (workerUserId) {
  if (!requireAdmin("adminMessage")) return;

  try {
    await updateDoc(doc(db, "workers", workerUserId), {
      verified: true,
      verificationStatus: "verified",
      verificationNote: "Verified by admin",
      verifiedAt: serverTimestamp()
    });

    await updateDoc(doc(db, "workerPublic", workerUserId), {
      verified: true,
      updatedAt: serverTimestamp()
    });

    showMessage("adminWorkerStatus-" + workerUserId, "Worker verified successfully.");

  } catch (error) {
    showMessage("adminWorkerStatus-" + workerUserId, "Database Error: " + error.message);
  }
};

window.adminRejectWorker = async function (workerUserId) {
  if (!requireAdmin("adminMessage")) return;

  try {
    await updateDoc(doc(db, "workers", workerUserId), {
      verified: false,
      verificationStatus: "rejected",
      verificationNote: "Rejected by admin",
      rejectedAt: serverTimestamp()
    });

    await updateDoc(doc(db, "workerPublic", workerUserId), {
      verified: false,
      updatedAt: serverTimestamp()
    });

    showMessage("adminWorkerStatus-" + workerUserId, "Worker rejected.");

  } catch (error) {
    showMessage("adminWorkerStatus-" + workerUserId, "Database Error: " + error.message);
  }
};

if (loadPendingCustomersBtn) {
  loadPendingCustomersBtn.addEventListener("click", async () => {
    if (!requireAdmin("adminMessage")) return;

    adminResult.innerHTML = "";

    try {
      const userSnapshot = await getDocs(collection(db, "users"));
      let found = false;

      userSnapshot.forEach((userDoc) => {
        const user = userDoc.data();

        if (user.role === "customer" && user.phoneVerified !== true) {
          found = true;

          adminResult.innerHTML += `
            <div class="data-card">
              <h3>Customer Verification</h3>
              <p><strong>Name:</strong> ${safeText(user.name)}</p>
              <p><strong>User ID:</strong> ${safeText(user.loginId)}</p>
              <p><strong>Phone:</strong> ${safeText(user.phone)}</p>
              <p><strong>Status:</strong> <span class="pending-badge">Phone Pending</span></p>

              <button class="btn primary-btn full-btn" onclick="adminVerifyCustomer('${userDoc.id}')">
                Mark Phone Verified
              </button>

              <p class="form-message" id="adminCustomerStatus-${userDoc.id}"></p>
            </div>
          `;
        }
      });

      showMessage("adminMessage", found ? "Pending customers loaded." : "No pending customers found.");

    } catch (error) {
      showMessage("adminMessage", "Database Error: " + error.message);
    }
  });
}

window.adminVerifyCustomer = async function (userId) {
  if (!requireAdmin("adminMessage")) return;

  try {
    await updateDoc(doc(db, "users", userId), {
      phoneVerified: true,
      verificationStatus: "verified",
      verifiedAt: serverTimestamp()
    });

    showMessage("adminCustomerStatus-" + userId, "Customer phone verified.");

  } catch (error) {
    showMessage("adminCustomerStatus-" + userId, "Database Error: " + error.message);
  }
};

if (loadAdminReportsBtn) {
  loadAdminReportsBtn.addEventListener("click", async () => {
    if (!requireAdmin("adminMessage")) return;

    adminResult.innerHTML = "";

    try {
      const reportSnapshot = await getDocs(collection(db, "reports"));

      if (reportSnapshot.empty) {
        showMessage("adminMessage", "No reports found.");
        return;
      }

      reportSnapshot.forEach((reportDoc) => {
        const report = reportDoc.data();
        const cleanReportedPhone = cleanPhone(report.reportedIdentity || "");

        adminResult.innerHTML += `
          <div class="data-card">
            <h3>Report</h3>
            <p><strong>Type:</strong> ${safeText(report.reportType)}</p>
            <p><strong>Reporter:</strong> ${safeText(report.reporterName)} (${safeText(report.reporterRole)})</p>
            <p><strong>Reported:</strong> ${safeText(report.reportedIdentity || "Not provided")}</p>
            <p><strong>Details:</strong> ${safeText(report.reportDetails)}</p>
            <p><strong>Status:</strong> ${safeText(report.status || "pending")}</p>

            <div class="admin-actions">
              <button class="btn primary-btn" onclick="adminMarkReportReviewed('${reportDoc.id}')">Mark Reviewed</button>
              ${
                cleanReportedPhone
                  ? `<button class="btn outline-btn" onclick="adminBlockPhone('${cleanReportedPhone}')">Block Reported Phone</button>`
                  : ""
              }
            </div>

            <p class="form-message" id="adminReportStatus-${reportDoc.id}"></p>
          </div>
        `;
      });

      showMessage("adminMessage", "Reports loaded.");

    } catch (error) {
      showMessage("adminMessage", "Database Error: " + error.message);
    }
  });
}

window.adminMarkReportReviewed = async function (reportId) {
  if (!requireAdmin("adminMessage")) return;

  try {
    await updateDoc(doc(db, "reports", reportId), {
      status: "reviewed",
      reviewedAt: serverTimestamp()
    });

    showMessage("adminReportStatus-" + reportId, "Report marked as reviewed.");

  } catch (error) {
    showMessage("adminReportStatus-" + reportId, "Database Error: " + error.message);
  }
};

window.adminBlockPhone = async function (phone) {
  if (!requireAdmin("adminMessage")) return;

  const clean = cleanPhone(phone);

  if (!clean) {
    showMessage("adminMessage", "Enter valid phone number.");
    return;
  }

  try {
    await setDoc(doc(db, "blockedPhones", clean), {
      phone: clean,
      active: true,
      blockedBy: currentUser.uid,
      createdAt: serverTimestamp()
    }, { merge: true });

    showMessage("adminMessage", "Phone blocked: " + clean);

  } catch (error) {
    showMessage("adminMessage", "Database Error: " + error.message);
  }
};

if (adminBlockPhoneBtn) {
  adminBlockPhoneBtn.addEventListener("click", () => {
    window.adminBlockPhone(getValue("adminBlockPhone"));
  });
}

if (loadAdminBookingsBtn) {
  loadAdminBookingsBtn.addEventListener("click", async () => {
    if (!requireAdmin("adminMessage")) return;

    adminResult.innerHTML = "";

    try {
      const bookingSnapshot = await getDocs(collection(db, "bookings"));

      if (bookingSnapshot.empty) {
        showMessage("adminMessage", "No bookings found.");
        return;
      }

      bookingSnapshot.forEach((bookingDoc) => {
        const booking = bookingDoc.data();

        adminResult.innerHTML += `
          <div class="data-card">
            <h3>Booking</h3>
            <p><strong>Customer:</strong> ${safeText(booking.customerName)}</p>
            <p><strong>Phone:</strong> ${safeText(booking.customerPhone)}</p>
            <p><strong>Service:</strong> ${safeText(booking.serviceType)}</p>
            <p><strong>City:</strong> ${safeText(booking.customerCity)}</p>
            <p><strong>Budget:</strong> ${formatMoney(booking.customerBudget || 0, booking.currency || selectedCurrency())}</p>
            <p><strong>Status:</strong> ${safeText(booking.bookingStatus)}</p>
            <p><strong>Progress:</strong> ${safeText(booking.jobProgress || "posted")}</p>
            <p><strong>Worker:</strong> ${safeText(booking.assignedWorkerName || "Not assigned")}</p>
            <p><strong>Payment:</strong> ${safeText(booking.paymentStatus || "not_paid")}</p>
          </div>
        `;
      });

      showMessage("adminMessage", "Bookings loaded.");

    } catch (error) {
      showMessage("adminMessage", "Database Error: " + error.message);
    }
  });
}
