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
  getDoc,
  limit
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
let deferredInstallPrompt = null;

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
    home: "Home", login: "Login", services: "Services", trust: "Trust",
    customerPortal: "Customer", myBids: "Bids", history: "History",
    tracking: "Tracking", map: "Map", reviews: "Reviews",
    workerProfile: "Profile", workerJobs: "Jobs", earnings: "Earnings",
    notifications: "Notifications", support: "Support", growth: "Growth",
    admin: "Admin", policies: "Policies",
    heroBadge: "Local Work. Trusted Hands.",
    heroTitle: "Hire Trusted Local Workers Safely",
    heroText: "Post work, compare bids, find nearby verified workers, track progress and protect your data.",
    service: "Service", city: "City", startBooking: "Start Booking",
    loginStart: "Login to Start", trustSafety: "Trust & Safety",
    secureAccess: "Secure Access", accountAccess: "Account Access",
    accountText: "Create an account or login with your User ID and password."
  },
  hi: {
    home: "होम", login: "लॉगिन", services: "सेवाएं", trust: "भरोसा",
    customerPortal: "कस्टमर", myBids: "बोलियां", history: "इतिहास",
    tracking: "ट्रैकिंग", map: "मैप", reviews: "रिव्यू",
    workerProfile: "प्रोफाइल", workerJobs: "जॉब्स", earnings: "कमाई",
    notifications: "सूचनाएं", support: "सपोर्ट", growth: "ग्रोथ",
    admin: "एडमिन", policies: "पॉलिसी",
    heroBadge: "स्थानीय काम। भरोसेमंद हाथ।",
    heroTitle: "सुरक्षित तरीके से भरोसेमंद वर्कर hire करें",
    heroText: "काम पोस्ट करें, बोलियां देखें, nearby verified workers खोजें, progress track करें और data protect रखें।",
    service: "सेवा", city: "शहर", startBooking: "बुकिंग शुरू करें",
    loginStart: "लॉगिन करें", trustSafety: "भरोसा और सुरक्षा",
    secureAccess: "सुरक्षित एक्सेस", accountAccess: "अकाउंट एक्सेस",
    accountText: "User ID और password से account बनाएं या login करें।"
  },
  es: {
    home: "Inicio", login: "Acceso", services: "Servicios", trust: "Confianza",
    customerPortal: "Cliente", myBids: "Ofertas", history: "Historial",
    tracking: "Seguimiento", map: "Mapa", reviews: "Reseñas",
    workerProfile: "Perfil", workerJobs: "Trabajos", earnings: "Ganancias",
    notifications: "Avisos", support: "Soporte", growth: "Crecimiento",
    admin: "Admin", policies: "Políticas",
    heroBadge: "Trabajo local. Manos confiables.",
    heroTitle: "Contrata trabajadores locales con seguridad",
    heroText: "Publica trabajo, compara ofertas, encuentra trabajadores cercanos verificados y protege tus datos.",
    service: "Servicio", city: "Ciudad", startBooking: "Empezar",
    loginStart: "Acceder", trustSafety: "Confianza",
    secureAccess: "Acceso seguro", accountAccess: "Acceso cuenta",
    accountText: "Crea cuenta o inicia sesión con usuario y contraseña."
  },
  ar: {
    home: "الرئيسية", login: "دخول", services: "الخدمات", trust: "الثقة",
    customerPortal: "العميل", myBids: "العروض", history: "السجل",
    tracking: "تتبع", map: "الخريطة", reviews: "التقييمات",
    workerProfile: "الملف", workerJobs: "وظائف", earnings: "الأرباح",
    notifications: "الإشعارات", support: "الدعم", growth: "النمو",
    admin: "المدير", policies: "السياسات",
    heroBadge: "عمل محلي. أيدٍ موثوقة.",
    heroTitle: "استأجر عمالًا موثوقين بأمان",
    heroText: "انشر العمل، قارن العروض، اعثر على عمال قريبين موثوقين واحم بياناتك.",
    service: "الخدمة", city: "المدينة", startBooking: "ابدأ",
    loginStart: "دخول", trustSafety: "الثقة والسلامة",
    secureAccess: "وصول آمن", accountAccess: "الحساب",
    accountText: "أنشئ حسابًا أو سجل الدخول باسم المستخدم وكلمة المرور."
  },
  fr: {
    home: "Accueil", login: "Connexion", services: "Services", trust: "Confiance",
    customerPortal: "Client", myBids: "Offres", history: "Historique",
    tracking: "Suivi", map: "Carte", reviews: "Avis",
    workerProfile: "Profil", workerJobs: "Travaux", earnings: "Gains",
    notifications: "Notifications", support: "Support", growth: "Croissance",
    admin: "Admin", policies: "Politiques",
    heroBadge: "Travail local. Mains fiables.",
    heroTitle: "Embauchez des travailleurs locaux en sécurité",
    heroText: "Publiez le travail, comparez les offres, trouvez des travailleurs vérifiés proches et protégez vos données.",
    service: "Service", city: "Ville", startBooking: "Commencer",
    loginStart: "Connexion", trustSafety: "Confiance",
    secureAccess: "Accès sécurisé", accountAccess: "Compte",
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

function makeReferralCode(loginId) {
  return "KC" + String(loginId || "USER").replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 8);
}

function populateServices() {
  document.querySelectorAll(".service-select").forEach((select) => {
    const firstText = select.querySelector("option")?.textContent || "Choose service";
    select.innerHTML = `<option value="">${firstText}</option>`;
    SERVICES.forEach((item) => select.innerHTML += `<option>${item[1]}</option>`);
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
  document.querySelectorAll(".currency-symbol").forEach((item) => item.textContent = currencySymbol());
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

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

const installAppBtn = document.getElementById("installAppBtn");

if (installAppBtn) {
  installAppBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      alert("Install option will appear after browser allows PWA installation.");
      return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
  });
}

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => navLinks.classList.toggle("active"));
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

  document.querySelectorAll(".customer-only").forEach((section) => section.classList.toggle("hidden", !isCustomer));
  document.querySelectorAll(".worker-only").forEach((section) => section.classList.toggle("hidden", !isWorker));
  document.querySelectorAll(".admin-only").forEach((section) => section.classList.toggle("hidden", !isAdmin));
  document.querySelectorAll(".admin-link").forEach((section) => section.classList.toggle("hidden", !isAdmin));

  const accountNameLine = document.getElementById("accountNameLine");
  const accountRoleLine = document.getElementById("accountRoleLine");

  if (!currentUser) {
    if (accountNameLine) accountNameLine.textContent = "Not logged in";
    if (accountRoleLine) accountRoleLine.textContent = "Login with User ID and password to start.";
    return;
  }

  const displayName = currentProfile?.name || currentUser.email || "User";
  const roleLabel = isAdmin ? "Admin" : currentRole === "worker" ? "Worker / Bidder" : "Customer";
  const trustScore = calculateCustomerTrustScore(currentProfile);

  if (accountNameLine) accountNameLine.textContent = "Logged in: " + displayName;
  if (accountRoleLine) accountRoleLine.textContent = `Active portal: ${roleLabel} • Trust Score: ${trustScore}%`;
}

function calculateCustomerTrustScore(profile) {
  let score = 30;
  if (profile?.phoneVerified) score += 30;
  if (profile?.email) score += 10;
  if (profile?.completedBookings) score += Math.min(Number(profile.completedBookings) * 5, 20);
  if (!profile?.blocked) score += 10;
  return Math.min(score, 100);
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
      completedBookings: 0,
      referralCode: makeReferralCode(user.email),
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
      loadStats();
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

async function createNotification(toUserId, title, message, type = "general", relatedId = "") {
  if (!toUserId) return;

  await addDoc(collection(db, "notifications"), {
    toUserId,
    title,
    message,
    type,
    relatedId,
    isRead: false,
    createdAt: serverTimestamp()
  });
}

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const name = getValue("authName");
    const phone = cleanPhone(getValue("authPhone"));
    const invitedBy = getValue("authReferral").toUpperCase();
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

      if (await isPhoneBlocked(phone)) {
        showMessage("authMessage", "This phone number is blocked. Contact support.");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const referralCode = makeReferralCode(loginId);

      const profile = {
        uid: user.uid,
        name,
        email,
        loginId,
        phone,
        role,
        phoneVerified: false,
        verificationStatus: "pending",
        blocked: false,
        completedBookings: 0,
        referralCode,
        invitedBy,
        country: selectedCountry(),
        currency: selectedCurrency(),
        language: selectedLanguage(),
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, "users", user.uid), profile, { merge: true });

      if (invitedBy) {
        await addDoc(collection(db, "referrals"), {
          invitedBy,
          newUserId: user.uid,
          newUserName: name,
          newUserRole: role,
          status: "joined",
          createdAt: serverTimestamp()
        });
      }

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

function matchScore(worker, job, distance = null) {
  let score = 0;

  if (worker.workerSkill === job.serviceType) score += 30;
  if (worker.workerCityLower === job.customerCityLower) score += 25;
  if (worker.workerCountry === job.customerCountry) score += 15;
  if (worker.verified === true) score += 15;
  if ((worker.workerRating || 0) >= 4) score += 10;
  if (distance !== null && distance <= 10) score += 5;

  return Math.min(score, 100);
}

function startMap(lat, lng) {
  const Leaflet = window.L;

  if (!Leaflet) {
    showMessage("mapMessage", "Map library not loaded. Please refresh.");
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

      showMessage("workerLocationMessage", "Location added. Now save profile.");
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
    const workerPhotoUrl = getValue("workerPhotoUrl");
    const workerDocumentUrl = getValue("workerDocumentUrl");
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
      showMessage("workerMessage", "Please fill all required details.");
      return;
    }

    if (!isValidPhone(workerPhone)) {
      showMessage("workerMessage", "Please enter valid mobile number.");
      return;
    }

    try {
      showMessage("workerMessage", "Saving worker profile...");

      if (await isPhoneBlocked(workerPhone)) {
        showMessage("workerMessage", "This phone number is blocked.");
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
        workerPhotoUrl,
        workerDocumentUrl,
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
        jobsCompleted: oldData.jobsCompleted || 0,
        workerRating: oldData.workerRating || 0,
        totalReviews: oldData.totalReviews || 0,
        totalEarning: oldData.totalEarning || 0,
        blocked: false,
        updatedAt: serverTimestamp(),
        createdAt: oldData.createdAt || serverTimestamp()
      };

      const publicWorker = {
        userId: currentUser.uid,
        workerName,
        workerPhotoUrl,
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
        jobsCompleted: oldData.jobsCompleted || 0,
        workerRating: oldData.workerRating || 0,
        totalReviews: oldData.totalReviews || 0,
        updatedAt: serverTimestamp()
      };

      await setDoc(workerRef, privateWorker, { merge: true });
      await setDoc(doc(db, "workerPublic", currentUser.uid), publicWorker, { merge: true });

      showMessage(
        "workerMessage",
        isAlreadyVerified
          ? "Worker profile updated."
          : "Worker profile saved. Admin verification required before bidding."
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
        showMessage("bookingMessage", "This phone number is blocked.");
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
        biddingOpen: true,
        acceptedBidId: "",
        acceptedBidAmount: 0,
        assignedWorkerUserId: "",
        assignedWorkerName: "",
        assignedWorkerPhone: "",
        completionProof: null,
        cancellationReason: "",
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
        const jobLike = { serviceType, customerCityLower, customerCountry };
        const score = matchScore(worker, jobLike);

        if (
          worker.workerCityLower === customerCityLower &&
          worker.workerCountry === customerCountry &&
          worker.available === true &&
          worker.verified === true
        ) {
          matchedWorkersHtml += `
            <div class="data-card">
              ${worker.workerPhotoUrl ? `<div class="worker-photo"><img src="${safeText(worker.workerPhotoUrl)}" alt="worker"></div>` : `<div class="worker-photo">KC</div>`}
              <h3>${safeText(worker.workerName)} <span class="verify-badge">Verified</span></h3>
              <p><strong>Skill:</strong> ${safeText(worker.workerSkill)}</p>
              <p><strong>Experience:</strong> ${safeText(worker.workerExperience)}</p>
              <p><strong>City:</strong> ${safeText(worker.workerCity)}</p>
              <p><strong>Match:</strong> <span class="score-badge">${score}% Match</span></p>
              <p><strong>Rating:</strong> ${worker.workerRating || 0} ⭐ (${worker.totalReviews || 0} reviews)</p>
              <p class="safe-note">Worker phone is hidden until accepted bid.</p>
            </div>
          `;
        }
      });

      await createNotification(currentUser.uid, "Booking Posted", "Your booking is open for bids.", "booking", bookingRef.id);

      showMessage("bookingMessage", "Booking posted. Verified workers can now bid.");

      if (matchResult) {
        matchResult.innerHTML = `
          <div class="data-card">
            <h3>Booking Posted Successfully</h3>
            <p><strong>Service:</strong> ${safeText(serviceType)}</p>
            <p><strong>City:</strong> ${safeText(customerCity)}</p>
            <p><strong>Budget:</strong> ${formatMoney(customerBudget, currency)}</p>
            <p class="status-open">Status: Open for Bids</p>
          </div>
          ${matchedWorkersHtml}
        `;
      }

      clearForm("bookingForm");
      loadStats();

    } catch (error) {
      showMessage("bookingMessage", "Database Error: " + error.message);
    }
  });
}

const loadOpenJobsBtn = document.getElementById("loadOpenJobsBtn");
const loadJobsBtn = document.getElementById("loadJobsBtn");
const workerJobs = document.getElementById("workerJobs");

if (loadOpenJobsBtn) {
  loadOpenJobsBtn.addEventListener("click", async () => {
    if (!requireWorker("dashboardMessage")) return;

    if (workerJobs) workerJobs.innerHTML = "";

    try {
      showMessage("dashboardMessage", "Finding open jobs...");

      const workerSnap = await getDoc(doc(db, "workers", currentUser.uid));

      if (!workerSnap.exists()) {
        showMessage("dashboardMessage", "Save worker profile first.");
        return;
      }

      const worker = workerSnap.data();

      if (worker.verified !== true) {
        showMessage("dashboardMessage", "Admin verification required before bidding.");
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
          const score = matchScore(worker, job);

          workerJobs.innerHTML += `
            <div class="data-card">
              <h3>Open Job <span class="score-badge">${score}% Match</span></h3>
              <p><strong>Customer:</strong> ${safeText(job.customerName)}</p>
              <p><strong>Service:</strong> ${safeText(job.serviceType)}</p>
              <p><strong>City:</strong> ${safeText(job.customerCity)}</p>
              <p><strong>Work:</strong> ${safeText(job.workDetails)}</p>
              <p><strong>Budget:</strong> ${formatMoney(job.customerBudget || 0, job.currency || selectedCurrency())}</p>
              <p class="safe-note">Phone and full address unlock only if your bid is accepted.</p>

              <div class="form-group">
                <label>Your Bid Amount ${currencySymbol(job.currency || selectedCurrency())}</label>
                <input type="number" id="bidAmount-${jobDoc.id}" />
              </div>

              <div class="form-group">
                <label>Bid Message</label>
                <textarea id="bidMessage-${jobDoc.id}"></textarea>
              </div>

              <button class="btn primary-btn full-btn" onclick="placeBid('${jobDoc.id}')">Submit Bid</button>
              <p class="form-message" id="bidStatus-${jobDoc.id}"></p>
            </div>
          `;
        }
      });

      showMessage("dashboardMessage", foundJobs ? "Open jobs loaded." : "No matching jobs found.");

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
    showMessage(statusId, "Enter valid bid amount.");
    return;
  }

  try {
    showMessage(statusId, "Submitting bid...");

    const workerSnap = await getDoc(doc(db, "workers", currentUser.uid));
    const publicWorkerSnap = await getDoc(doc(db, "workerPublic", currentUser.uid));
    const publicJobSnap = await getDoc(doc(db, "publicJobs", bookingId));

    if (!workerSnap.exists() || !publicWorkerSnap.exists() || !publicJobSnap.exists()) {
      showMessage(statusId, "Profile or job not found.");
      return;
    }

    const worker = workerSnap.data();
    const publicWorker = publicWorkerSnap.data();
    const job = publicJobSnap.data();

    if (worker.verified !== true) {
      showMessage(statusId, "Admin verification required.");
      return;
    }

    const existingBidSnapshot = await getDocs(
      query(collection(db, "bids"), where("bookingId", "==", bookingId))
    );

    let alreadyBid = false;
    existingBidSnapshot.forEach((bidDoc) => {
      if (bidDoc.data().workerUserId === currentUser.uid) alreadyBid = true;
    });

    if (alreadyBid) {
      showMessage(statusId, "You already submitted bid for this job.");
      return;
    }

    await addDoc(collection(db, "bids"), {
      bookingId,
      customerId: job.customerId,
      workerUserId: currentUser.uid,
      workerName: publicWorker.workerName,
      workerPhoneHidden: true,
      workerSkill: publicWorker.workerSkill,
      workerCity: publicWorker.workerCity,
      workerCountry: publicWorker.workerCountry,
      workerPhotoUrl: publicWorker.workerPhotoUrl || "",
      workerRating: publicWorker.workerRating || 0,
      totalReviews: publicWorker.totalReviews || 0,
      matchScore: matchScore(publicWorker, job),
      bidAmount,
      currency: job.currency || selectedCurrency(),
      bidMessage,
      bidStatus: "pending",
      createdAt: serverTimestamp()
    });

    await createNotification(job.customerId, "New Bid Received", `${publicWorker.workerName} submitted a bid.`, "bid", bookingId);

    showMessage(statusId, "Bid submitted successfully.");

  } catch (error) {
    showMessage(statusId, "Database Error: " + error.message);
  }
};

const loadCustomerBidsBtn = document.getElementById("loadCustomerBidsBtn");
const customerBidsResult = document.getElementById("customerBidsResult");

if (loadCustomerBidsBtn) {
  loadCustomerBidsBtn.addEventListener("click", loadCustomerBids);
}

async function loadCustomerBids() {
  if (!requireCustomer("customerBidMessage")) return;

  customerBidsResult.innerHTML = "";

  try {
    showMessage("customerBidMessage", "Loading bids...");

    const bookingSnapshot = await getDocs(
      query(collection(db, "bookings"), where("customerId", "==", currentUser.uid))
    );

    if (bookingSnapshot.empty) {
      showMessage("customerBidMessage", "No bookings found.");
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
            ${bid.workerPhotoUrl ? `<div class="worker-photo"><img src="${safeText(bid.workerPhotoUrl)}" alt="worker"></div>` : `<div class="worker-photo">KC</div>`}
            <h3>${safeText(bid.workerName)}</h3>
            <p><strong>Skill:</strong> ${safeText(bid.workerSkill)}</p>
            <p><strong>City:</strong> ${safeText(bid.workerCity)}</p>
            <p><strong>Match:</strong> <span class="score-badge">${bid.matchScore || 0}% Match</span></p>
            <p><strong>Rating:</strong> ${bid.workerRating || 0} ⭐ (${bid.totalReviews || 0} reviews)</p>
            <p><strong>Bid Amount:</strong> ${formatMoney(bid.bidAmount, bid.currency || booking.currency || selectedCurrency())}</p>
            <p><strong>Message:</strong> ${safeText(bid.bidMessage || "No message")}</p>
            <p><strong>Status:</strong> ${safeText(bid.bidStatus)}</p>
            ${phoneHtml}
            ${actionHtml}
            <p class="form-message" id="acceptStatus-${bidDoc.id}"></p>
          </div>
        `;
      });
    }

    showMessage("customerBidMessage", foundAnyBid ? "Bids loaded." : "No bids received yet.");

  } catch (error) {
    showMessage("customerBidMessage", "Database Error: " + error.message);
  }
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
      showMessage("acceptStatus-" + bidId, "You can accept only your own booking.");
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

    const allBidsSnapshot = await getDocs(
      query(collection(db, "bids"), where("bookingId", "==", bookingId))
    );

    for (const bidDocument of allBidsSnapshot.docs) {
      await updateDoc(bidDocument.ref, {
        bidStatus: bidDocument.id === bidId ? "accepted" : "rejected"
      });
    }

    await createNotification(bid.workerUserId, "Bid Accepted", "Customer accepted your bid.", "accepted", bookingId);
    await createNotification(currentUser.uid, "Worker Assigned", `${bid.workerName} is assigned to your booking.`, "assigned", bookingId);

    showMessage("acceptStatus-" + bidId, "Bid accepted. Worker contact unlocked.");
    loadCustomerBids();

  } catch (error) {
    showMessage("acceptStatus-" + bidId, "Database Error: " + error.message);
  }
};

if (loadJobsBtn) {
  loadJobsBtn.addEventListener("click", loadAssignedJobs);
}

async function loadAssignedJobs() {
  if (!requireWorker("dashboardMessage")) return;

  workerJobs.innerHTML = "";

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
          <h3>Assigned Booking</h3>
          <p><strong>Customer:</strong> ${safeText(job.customerName)}</p>
          <p><strong>Phone:</strong> ${safeText(job.customerPhone)}</p>
          <p><strong>Service:</strong> ${safeText(job.serviceType)}</p>
          <p><strong>Address:</strong> ${safeText(job.customerAddress)}</p>
          <p><strong>Accepted Amount:</strong> ${formatMoney(job.acceptedBidAmount || 0, job.currency || selectedCurrency())}</p>
          <p><strong>Progress:</strong> ${safeText(job.jobProgress || "assigned")}</p>

          <div class="admin-actions">
            <button class="btn secondary-btn" onclick="updateJobProgress('${jobDoc.id}', 'on_the_way')">On The Way</button>
            <button class="btn secondary-btn" onclick="updateJobProgress('${jobDoc.id}', 'started')">Started</button>
            <button class="btn outline-btn" onclick="showCompletionForm('${jobDoc.id}')">Submit Proof</button>
            <button class="btn outline-btn" onclick="showCancelForm('${jobDoc.id}', 'worker')">Cancel</button>
          </div>

          <div class="hidden" id="proofBox-${jobDoc.id}">
            <div class="form-group"><label>Before Photo URL</label><input type="url" id="beforePhoto-${jobDoc.id}"></div>
            <div class="form-group"><label>After Photo URL</label><input type="url" id="afterPhoto-${jobDoc.id}"></div>
            <div class="form-group"><label>Completion Note</label><textarea id="completionNote-${jobDoc.id}"></textarea></div>
            <button class="btn primary-btn full-btn" onclick="submitCompletionProof('${jobDoc.id}')">Submit Completion Proof</button>
          </div>

          <div class="hidden" id="cancelBox-worker-${jobDoc.id}">
            <div class="form-group">
              <label>Cancel Reason</label>
              <select id="cancelReason-worker-${jobDoc.id}">
                <option>Worker not available</option>
                <option>Customer not responding</option>
                <option>Price issue</option>
                <option>Wrong address</option>
                <option>Emergency</option>
                <option>Other</option>
              </select>
            </div>
            <button class="btn outline-btn full-btn" onclick="cancelBooking('${jobDoc.id}', 'worker')">Submit Cancel</button>
          </div>

          <p class="form-message" id="progressStatus-${jobDoc.id}"></p>
        </div>
      `;
    });

    showMessage("dashboardMessage", "Assigned jobs loaded.");

  } catch (error) {
    showMessage("dashboardMessage", "Database Error: " + error.message);
  }
}

window.showCompletionForm = function (bookingId) {
  document.getElementById("proofBox-" + bookingId)?.classList.toggle("hidden");
};

window.showCancelForm = function (bookingId, role) {
  document.getElementById(`cancelBox-${role}-${bookingId}`)?.classList.toggle("hidden");
};

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

    await updateDoc(bookingRef, {
      jobProgress: progress,
      updatedAt: serverTimestamp()
    });

    await updateDoc(publicJobRef, {
      jobProgress: progress,
      updatedAt: serverTimestamp()
    });

    await createNotification(booking.customerId, "Job Progress Updated", `Worker marked job as ${progress}.`, "progress", bookingId);

    showMessage("progressStatus-" + bookingId, "Progress updated: " + progress);

  } catch (error) {
    showMessage("progressStatus-" + bookingId, "Database Error: " + error.message);
  }
};

window.submitCompletionProof = async function (bookingId) {
  if (!requireWorker("dashboardMessage")) return;

  const beforePhoto = getValue("beforePhoto-" + bookingId);
  const afterPhoto = getValue("afterPhoto-" + bookingId);
  const completionNote = getValue("completionNote-" + bookingId);

  if (!completionNote) {
    showMessage("progressStatus-" + bookingId, "Please add completion note.");
    return;
  }

  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const publicJobRef = doc(db, "publicJobs", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) return;

    const booking = bookingSnap.data();

    await updateDoc(bookingRef, {
      jobProgress: "completion_submitted",
      completionProof: {
        beforePhoto,
        afterPhoto,
        completionNote,
        submittedAt: new Date().toISOString()
      },
      updatedAt: serverTimestamp()
    });

    await updateDoc(publicJobRef, {
      jobProgress: "completion_submitted",
      updatedAt: serverTimestamp()
    });

    await createNotification(booking.customerId, "Completion Proof Submitted", "Worker submitted completion proof. Please confirm.", "proof", bookingId);

    showMessage("progressStatus-" + bookingId, "Completion proof submitted.");

  } catch (error) {
    showMessage("progressStatus-" + bookingId, "Database Error: " + error.message);
  }
};

window.confirmCompletion = async function (bookingId) {
  if (!requireCustomer("trackingMessage")) return;

  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const publicJobRef = doc(db, "publicJobs", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) return;

    const booking = bookingSnap.data();

    if (booking.customerId !== currentUser.uid) {
      showMessage("trackingMessage", "You can confirm only your booking.");
      return;
    }

    await updateDoc(bookingRef, {
      bookingStatus: "completed",
      jobProgress: "completed",
      biddingOpen: false,
      completedAt: serverTimestamp()
    });

    await updateDoc(publicJobRef, {
      bookingStatus: "completed",
      jobProgress: "completed",
      biddingOpen: false
    });

    if (booking.assignedWorkerUserId) {
      const workerRef = doc(db, "workers", booking.assignedWorkerUserId);
      const publicWorkerRef = doc(db, "workerPublic", booking.assignedWorkerUserId);
      const workerSnap = await getDoc(workerRef);
      const old = workerSnap.exists() ? workerSnap.data() : {};

      await updateDoc(workerRef, {
        jobsCompleted: Number(old.jobsCompleted || 0) + 1,
        totalEarning: Number(old.totalEarning || 0) + Number(booking.acceptedBidAmount || 0)
      });

      await updateDoc(publicWorkerRef, {
        jobsCompleted: Number(old.jobsCompleted || 0) + 1
      });

      await createNotification(booking.assignedWorkerUserId, "Job Completed", "Customer confirmed job completion.", "completed", bookingId);
    }

    await updateDoc(doc(db, "users", currentUser.uid), {
      completedBookings: Number(currentProfile.completedBookings || 0) + 1
    });

    showMessage("trackingMessage", "Job confirmed completed.");
    loadTracking();

  } catch (error) {
    showMessage("trackingMessage", "Database Error: " + error.message);
  }
};

window.cancelBooking = async function (bookingId, byRole) {
  const messageId = byRole === "worker" ? "dashboardMessage" : "customerHistoryMessage";

  if (!requireLogin(messageId)) return;

  const reason = getValue(`cancelReason-${byRole}-${bookingId}`) || "Other";

  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const publicJobRef = doc(db, "publicJobs", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) return;

    const booking = bookingSnap.data();

    if (byRole === "worker" && booking.assignedWorkerUserId !== currentUser.uid) {
      showMessage(messageId, "Only assigned worker can cancel.");
      return;
    }

    if (byRole === "customer" && booking.customerId !== currentUser.uid) {
      showMessage(messageId, "Only booking customer can cancel.");
      return;
    }

    await updateDoc(bookingRef, {
      bookingStatus: "cancelled",
      jobProgress: "cancelled",
      biddingOpen: false,
      cancellationReason: reason,
      cancelledBy: byRole,
      cancelledAt: serverTimestamp()
    });

    await updateDoc(publicJobRef, {
      bookingStatus: "cancelled",
      jobProgress: "cancelled",
      biddingOpen: false
    });

    await addDoc(collection(db, "cancellations"), {
      bookingId,
      cancelledBy: byRole,
      userId: currentUser.uid,
      reason,
      createdAt: serverTimestamp()
    });

    showMessage(messageId, "Booking cancelled with reason: " + reason);

  } catch (error) {
    showMessage(messageId, "Database Error: " + error.message);
  }
};

const loadTrackingBtn = document.getElementById("loadTrackingBtn");
const trackingResult = document.getElementById("trackingResult");

if (loadTrackingBtn) {
  loadTrackingBtn.addEventListener("click", loadTracking);
}

function trackingSteps(progress, status) {
  const current = progress || (status === "assigned" ? "assigned" : "posted");

  const steps = [
    { key: "posted", label: "Posted" },
    { key: "assigned", label: "Assigned" },
    { key: "on_the_way", label: "On Way" },
    { key: "started", label: "Started" },
    { key: "completion_submitted", label: "Proof" },
    { key: "completed", label: "Done" }
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

async function loadTracking() {
  if (!requireCustomer("trackingMessage")) return;

  trackingResult.innerHTML = "";

  try {
    const bookingSnapshot = await getDocs(
      query(collection(db, "bookings"), where("customerId", "==", currentUser.uid))
    );

    if (bookingSnapshot.empty) {
      showMessage("trackingMessage", "No bookings found.");
      return;
    }

    bookingSnapshot.forEach((bookingDoc) => {
      const booking = bookingDoc.data();
      const proof = booking.completionProof || null;

      const proofHtml = proof ? `
        <p><strong>Completion Note:</strong> ${safeText(proof.completionNote)}</p>
        ${proof.beforePhoto ? `<p><a href="${safeText(proof.beforePhoto)}" target="_blank">Before Photo</a></p>` : ""}
        ${proof.afterPhoto ? `<p><a href="${safeText(proof.afterPhoto)}" target="_blank">After Photo</a></p>` : ""}
        ${
          booking.jobProgress === "completion_submitted"
            ? `<button class="btn primary-btn full-btn" onclick="confirmCompletion('${bookingDoc.id}')">Confirm Completed Work</button>`
            : ""
        }
      ` : "";

      trackingResult.innerHTML += `
        <div class="data-card">
          <h3>Booking Tracking</h3>
          <p><strong>Service:</strong> ${safeText(booking.serviceType)}</p>
          <p><strong>City:</strong> ${safeText(booking.customerCity)}</p>
          <p><strong>Status:</strong> ${safeText(booking.bookingStatus)}</p>
          <p><strong>Progress:</strong> ${safeText(booking.jobProgress || "posted")}</p>
          <p><strong>Worker:</strong> ${safeText(booking.assignedWorkerName || "Not assigned yet")}</p>
          <p><strong>Worker Phone:</strong> ${booking.assignedWorkerPhone ? safeText(booking.assignedWorkerPhone) : "Hidden until accepted"}</p>
          ${trackingSteps(booking.jobProgress, booking.bookingStatus)}
          ${proofHtml}
        </div>
      `;
    });

    showMessage("trackingMessage", "Tracking loaded.");

  } catch (error) {
    showMessage("trackingMessage", "Database Error: " + error.message);
  }
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

      nearbyWorkersList.innerHTML = "";

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
        showMessage("mapMessage", "No verified workers nearby.");
        return;
      }

      nearbyWorkers.forEach((worker) => {
        const marker = Leaflet.marker([Number(worker.workerLatitude), Number(worker.workerLongitude)])
          .addTo(workersMap)
          .bindPopup(`
            <strong>${safeText(worker.workerName)}</strong><br>
            ${safeText(worker.workerSkill)}<br>
            ${worker.distance.toFixed(1)} km away
          `);

        mapMarkers.push(marker);

        nearbyWorkersList.innerHTML += `
          <div class="map-worker-card">
            ${worker.workerPhotoUrl ? `<div class="worker-photo"><img src="${safeText(worker.workerPhotoUrl)}" alt="worker"></div>` : `<div class="worker-photo">KC</div>`}
            <h3>${safeText(worker.workerName)} <span class="verify-badge">Verified</span></h3>
            <p><strong>Skill:</strong> ${safeText(worker.workerSkill)}</p>
            <p><strong>Distance:</strong> ${worker.distance.toFixed(1)} km away</p>
            <p><strong>Jobs Completed:</strong> ${worker.jobsCompleted || 0}</p>
            <p><strong>Rating:</strong> ${worker.workerRating || 0} ⭐ (${worker.totalReviews || 0} reviews)</p>
            <p class="safe-note">Phone unlocks after accepted bid.</p>
          </div>
        `;
      });

      showMessage("mapMessage", nearbyWorkers.length + " worker(s) found.");

    } catch (error) {
      showMessage("mapMessage", error.message);
    }
  });
}

const loadCustomerHistoryBtn = document.getElementById("loadCustomerHistoryBtn");
const customerHistoryResult = document.getElementById("customerHistoryResult");

if (loadCustomerHistoryBtn) {
  loadCustomerHistoryBtn.addEventListener("click", async () => {
    if (!requireCustomer("customerHistoryMessage")) return;

    customerHistoryResult.innerHTML = "";

    try {
      const bookingSnapshot = await getDocs(
        query(collection(db, "bookings"), where("customerId", "==", currentUser.uid))
      );

      if (bookingSnapshot.empty) {
        showMessage("customerHistoryMessage", "No history found.");
        return;
      }

      bookingSnapshot.forEach((docItem) => {
        const booking = docItem.data();

        customerHistoryResult.innerHTML += `
          <div class="data-card">
            <h3>${safeText(booking.serviceType)} - ${safeText(booking.bookingStatus)}</h3>
            <p><strong>City:</strong> ${safeText(booking.customerCity)}</p>
            <p><strong>Amount:</strong> ${formatMoney(booking.acceptedBidAmount || booking.customerBudget || 0, booking.currency)}</p>
            <p><strong>Progress:</strong> ${safeText(booking.jobProgress || "posted")}</p>
            <p><strong>Worker:</strong> ${safeText(booking.assignedWorkerName || "Not assigned")}</p>
            ${
              booking.bookingStatus !== "completed" && booking.bookingStatus !== "cancelled"
                ? `
                  <div class="hidden" id="cancelBox-customer-${docItem.id}">
                    <div class="form-group">
                      <label>Cancel Reason</label>
                      <select id="cancelReason-customer-${docItem.id}">
                        <option>Worker not available</option>
                        <option>Customer not responding</option>
                        <option>Price issue</option>
                        <option>Wrong address</option>
                        <option>Emergency</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <button class="btn outline-btn full-btn" onclick="cancelBooking('${docItem.id}', 'customer')">Submit Cancel</button>
                  </div>
                  <button class="btn outline-btn full-btn" onclick="showCancelForm('${docItem.id}', 'customer')">Cancel Booking</button>
                `
                : ""
            }
          </div>
        `;
      });

      showMessage("customerHistoryMessage", "History loaded.");

    } catch (error) {
      showMessage("customerHistoryMessage", "Database Error: " + error.message);
    }
  });
}

const loadEarningsBtn = document.getElementById("loadEarningsBtn");
const earningsResult = document.getElementById("earningsResult");

if (loadEarningsBtn) {
  loadEarningsBtn.addEventListener("click", async () => {
    if (!requireWorker("earningsMessage")) return;

    earningsResult.innerHTML = "";

    try {
      const workerSnap = await getDoc(doc(db, "workers", currentUser.uid));
      const bidSnapshot = await getDocs(
        query(collection(db, "bids"), where("workerUserId", "==", currentUser.uid))
      );
      const jobSnapshot = await getDocs(
        query(collection(db, "bookings"), where("assignedWorkerUserId", "==", currentUser.uid))
      );

      const worker = workerSnap.exists() ? workerSnap.data() : {};
      let accepted = 0;
      let completed = 0;
      let earning = 0;

      jobSnapshot.forEach((jobDoc) => {
        const job = jobDoc.data();
        if (job.bookingStatus === "assigned" || job.bookingStatus === "completed") accepted++;
        if (job.bookingStatus === "completed") {
          completed++;
          earning += Number(job.acceptedBidAmount || 0);
        }
      });

      earningsResult.innerHTML = `
        <div class="data-card">
          <h3>Worker Earnings</h3>
          <p><strong>Total Bids Sent:</strong> ${bidSnapshot.size}</p>
          <p><strong>Accepted Jobs:</strong> ${accepted}</p>
          <p><strong>Completed Jobs:</strong> ${completed}</p>
          <p><strong>Total Earning Estimate:</strong> ${formatMoney(earning)}</p>
          <p><strong>Rating:</strong> ${worker.workerRating || 0} ⭐</p>
          <p><strong>Verification:</strong> ${worker.verificationStatus || "pending"}</p>
        </div>
      `;

      showMessage("earningsMessage", "Earnings loaded.");

    } catch (error) {
      showMessage("earningsMessage", "Database Error: " + error.message);
    }
  });
}

const loadNotificationsBtn = document.getElementById("loadNotificationsBtn");
const notificationResult = document.getElementById("notificationResult");

if (loadNotificationsBtn) {
  loadNotificationsBtn.addEventListener("click", async () => {
    if (!requireLogin("notificationMessage")) return;

    notificationResult.innerHTML = "";

    try {
      const notificationSnapshot = await getDocs(
        query(collection(db, "notifications"), where("toUserId", "==", currentUser.uid), limit(30))
      );

      if (notificationSnapshot.empty) {
        showMessage("notificationMessage", "No notifications found.");
        return;
      }

      notificationSnapshot.forEach((notificationDoc) => {
        const n = notificationDoc.data();

        notificationResult.innerHTML += `
          <div class="notification-card">
            <h3>${safeText(n.title)}</h3>
            <p>${safeText(n.message)}</p>
            <p><strong>Type:</strong> ${safeText(n.type || "general")}</p>
            <button class="btn outline-btn full-btn" onclick="markNotificationRead('${notificationDoc.id}')">Mark Read</button>
            <p class="form-message" id="notiStatus-${notificationDoc.id}"></p>
          </div>
        `;
      });

      showMessage("notificationMessage", "Notifications loaded.");

    } catch (error) {
      showMessage("notificationMessage", "Database Error: " + error.message);
    }
  });
}

window.markNotificationRead = async function (notificationId) {
  if (!requireLogin("notificationMessage")) return;

  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      isRead: true,
      readAt: serverTimestamp()
    });

    showMessage("notiStatus-" + notificationId, "Marked as read.");

  } catch (error) {
    showMessage("notiStatus-" + notificationId, "Database Error: " + error.message);
  }
};

const supportForm = document.getElementById("supportForm");

if (supportForm) {
  supportForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!requireLogin("supportMessage")) return;

    const supportType = getValue("supportType");
    const supportDetails = getValue("supportDetails");

    if (!supportType || !supportDetails) {
      showMessage("supportMessage", "Please fill support type and details.");
      return;
    }

    try {
      await addDoc(collection(db, "supportTickets"), {
        userId: currentUser.uid,
        userName: currentProfile.name || "",
        userRole: currentProfile.role || "",
        supportType,
        supportDetails,
        status: "pending",
        createdAt: serverTimestamp()
      });

      showMessage("supportMessage", "Support ticket submitted.");
      clearForm("supportForm");

    } catch (error) {
      showMessage("supportMessage", "Database Error: " + error.message);
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
        reporterName: currentProfile.name || "",
        reporterRole: currentProfile.role || "",
        reportType,
        reportedIdentity,
        reportDetails,
        status: "pending",
        createdAt: serverTimestamp()
      });

      showMessage("reportMessage", "Report submitted.");
      clearForm("reportForm");

    } catch (error) {
      showMessage("reportMessage", "Database Error: " + error.message);
    }
  });
}

const cityRequestForm = document.getElementById("cityRequestForm");

if (cityRequestForm) {
  cityRequestForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const city = getValue("requestCityName");
    const country = getValue("requestCountryName");

    if (!city || !country) {
      showMessage("cityRequestMessage", "Please fill city and country.");
      return;
    }

    try {
      await addDoc(collection(db, "cityRequests"), {
        userId: currentUser?.uid || "",
        city,
        country,
        status: "requested",
        createdAt: serverTimestamp()
      });

      showMessage("cityRequestMessage", "City request submitted.");
      clearForm("cityRequestForm");

    } catch (error) {
      showMessage("cityRequestMessage", "Database Error: " + error.message);
    }
  });
}

const loadReferralBtn = document.getElementById("loadReferralBtn");
const referralResult = document.getElementById("referralResult");

if (loadReferralBtn) {
  loadReferralBtn.addEventListener("click", async () => {
    if (!requireLogin("referralMessage")) return;

    try {
      const referralCode = currentProfile.referralCode || makeReferralCode(currentProfile.loginId);
      const referralSnapshot = await getDocs(
        query(collection(db, "referrals"), where("invitedBy", "==", referralCode))
      );

      referralResult.innerHTML = `
        <div class="data-card">
          <h3>Your Referral Code</h3>
          <p><strong>${safeText(referralCode)}</strong></p>
          <p>Share this code with customers or workers.</p>
          <p><strong>Total Joined:</strong> ${referralSnapshot.size}</p>
        </div>
      `;

      showMessage("referralMessage", "Referral loaded.");

    } catch (error) {
      showMessage("referralMessage", "Database Error: " + error.message);
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

      const oldReviewSnapshot = await getDocs(
        query(collection(db, "reviews"), where("bookingId", "==", matchedBooking.id))
      );

      if (!oldReviewSnapshot.empty) {
        showMessage("reviewMessage", "You already reviewed this booking.");
        return;
      }

      await addDoc(collection(db, "reviews"), {
        bookingId: matchedBooking.id,
        workerUserId: matchedBooking.assignedWorkerUserId,
        workerPhone,
        customerId: currentUser.uid,
        customerName: currentProfile.name || "",
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

      showMessage("reviewMessage", "Verified review submitted.");
      clearForm("reviewForm");

    } catch (error) {
      showMessage("reviewMessage", "Database Error: " + error.message);
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

    dataControlResult.innerHTML = `
      <div class="data-card">
        <h3>My Account Data</h3>
        <p><strong>Name:</strong> ${safeText(currentProfile.name)}</p>
        <p><strong>User ID:</strong> ${safeText(currentProfile.loginId)}</p>
        <p><strong>Phone:</strong> ${safeText(currentProfile.phone)}</p>
        <p><strong>Role:</strong> ${safeText(currentProfile.role)}</p>
        <p><strong>Phone Verified:</strong> ${currentProfile.phoneVerified ? "Yes" : "Pending"}</p>
        <p><strong>Trust Score:</strong> ${calculateCustomerTrustScore(currentProfile)}%</p>
        <p><strong>Referral Code:</strong> ${safeText(currentProfile.referralCode || "")}</p>
      </div>
    `;

    showMessage("dataControlMessage", "Your data loaded.");
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

      showMessage("dataControlMessage", "Worker location removed.");

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

async function loadStats() {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const workersSnap = await getDocs(collection(db, "workerPublic"));
    const bookingsSnap = await getDocs(collection(db, "bookings"));

    let completed = 0;
    bookingsSnap.forEach((docItem) => {
      if (docItem.data().bookingStatus === "completed") completed++;
    });

    if (document.getElementById("statUsers")) document.getElementById("statUsers").textContent = usersSnap.size;
    if (document.getElementById("statWorkers")) document.getElementById("statWorkers").textContent = workersSnap.size;
    if (document.getElementById("statBookings")) document.getElementById("statBookings").textContent = bookingsSnap.size;
    if (document.getElementById("statCompleted")) document.getElementById("statCompleted").textContent = completed;
  } catch (error) {
    console.warn(error);
  }
}

loadStats();

const adminResult = document.getElementById("adminResult");

function adminCard(title, body) {
  return `<div class="data-card"><h3>${title}</h3>${body}</div>`;
}

const loadAdminAnalyticsBtn = document.getElementById("loadAdminAnalyticsBtn");
const loadPendingWorkersBtn = document.getElementById("loadPendingWorkersBtn");
const loadPendingCustomersBtn = document.getElementById("loadPendingCustomersBtn");
const loadAdminBookingsBtn = document.getElementById("loadAdminBookingsBtn");
const loadAdminReportsBtn = document.getElementById("loadAdminReportsBtn");
const loadAdminSupportBtn = document.getElementById("loadAdminSupportBtn");
const loadCityRequestsBtn = document.getElementById("loadCityRequestsBtn");
const adminBlockPhoneBtn = document.getElementById("adminBlockPhoneBtn");

if (loadAdminAnalyticsBtn) {
  loadAdminAnalyticsBtn.addEventListener("click", async () => {
    if (!requireAdmin("adminMessage")) return;

    adminResult.innerHTML = "";

    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const workersSnap = await getDocs(collection(db, "workers"));
      const bookingsSnap = await getDocs(collection(db, "bookings"));
      const reportsSnap = await getDocs(collection(db, "reports"));
      const supportSnap = await getDocs(collection(db, "supportTickets"));

      let pendingWorkers = 0;
      let completedJobs = 0;
      let openBookings = 0;

      workersSnap.forEach((w) => {
        if (w.data().verified !== true) pendingWorkers++;
      });

      bookingsSnap.forEach((b) => {
        if (b.data().bookingStatus === "completed") completedJobs++;
        if (b.data().bookingStatus === "pending") openBookings++;
      });

      adminResult.innerHTML = adminCard("Admin Analytics", `
        <p><strong>Total Users:</strong> ${usersSnap.size}</p>
        <p><strong>Total Workers:</strong> ${workersSnap.size}</p>
        <p><strong>Pending Worker Verification:</strong> ${pendingWorkers}</p>
        <p><strong>Total Bookings:</strong> ${bookingsSnap.size}</p>
        <p><strong>Open Bookings:</strong> ${openBookings}</p>
        <p><strong>Completed Jobs:</strong> ${completedJobs}</p>
        <p><strong>Total Reports:</strong> ${reportsSnap.size}</p>
        <p><strong>Support Tickets:</strong> ${supportSnap.size}</p>
      `);

      showMessage("adminMessage", "Analytics loaded.");

    } catch (error) {
      showMessage("adminMessage", "Database Error: " + error.message);
    }
  });
}

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

          adminResult.innerHTML += adminCard("Worker Verification Request", `
            ${worker.workerPhotoUrl ? `<div class="worker-photo"><img src="${safeText(worker.workerPhotoUrl)}" alt="worker"></div>` : `<div class="worker-photo">KC</div>`}
            <p><strong>Name:</strong> ${safeText(worker.workerName)}</p>
            <p><strong>Phone:</strong> ${safeText(worker.workerPhone)}</p>
            <p><strong>Skill:</strong> ${safeText(worker.workerSkill)}</p>
            <p><strong>ID Proof Type:</strong> ${safeText(worker.workerIdProof || "Not provided")}</p>
            <p><strong>Document:</strong> ${worker.workerDocumentUrl ? `<a href="${safeText(worker.workerDocumentUrl)}" target="_blank">View Document</a>` : "Not added"}</p>
            <p><strong>City:</strong> ${safeText(worker.workerCity)}</p>
            <p><strong>Status:</strong> <span class="pending-badge">${safeText(worker.verificationStatus || "pending")}</span></p>
            <div class="admin-actions">
              <button class="btn primary-btn" onclick="adminVerifyWorker('${workerDoc.id}')">Verify Worker</button>
              <button class="btn outline-btn" onclick="adminRejectWorker('${workerDoc.id}')">Reject Worker</button>
            </div>
            <p class="form-message" id="adminWorkerStatus-${workerDoc.id}"></p>
          `);
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
      verifiedAt: serverTimestamp()
    });

    await updateDoc(doc(db, "workerPublic", workerUserId), {
      verified: true,
      updatedAt: serverTimestamp()
    });

    await createNotification(workerUserId, "Worker Verified", "Your worker profile is verified. You can now bid.", "verification", workerUserId);

    showMessage("adminWorkerStatus-" + workerUserId, "Worker verified.");

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
      rejectedAt: serverTimestamp()
    });

    await updateDoc(doc(db, "workerPublic", workerUserId), {
      verified: false,
      updatedAt: serverTimestamp()
    });

    await createNotification(workerUserId, "Worker Verification Rejected", "Your worker verification was rejected. Contact support.", "verification", workerUserId);

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

        if (user.phoneVerified !== true) {
          found = true;

          adminResult.innerHTML += adminCard("Customer/User Verification", `
            <p><strong>Name:</strong> ${safeText(user.name)}</p>
            <p><strong>User ID:</strong> ${safeText(user.loginId)}</p>
            <p><strong>Role:</strong> ${safeText(user.role)}</p>
            <p><strong>Phone:</strong> ${safeText(user.phone)}</p>
            <p><strong>Status:</strong> <span class="pending-badge">Phone Pending</span></p>
            <button class="btn primary-btn full-btn" onclick="adminVerifyCustomer('${userDoc.id}')">Mark Phone Verified</button>
            <p class="form-message" id="adminCustomerStatus-${userDoc.id}"></p>
          `);
        }
      });

      showMessage("adminMessage", found ? "Pending users loaded." : "No pending users found.");

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

    await createNotification(userId, "Phone Verified", "Your phone number is verified.", "verification", userId);

    showMessage("adminCustomerStatus-" + userId, "Phone verified.");

  } catch (error) {
    showMessage("adminCustomerStatus-" + userId, "Database Error: " + error.message);
  }
};

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

        adminResult.innerHTML += adminCard("Booking", `
          <p><strong>Customer:</strong> ${safeText(booking.customerName)}</p>
          <p><strong>Phone:</strong> ${safeText(booking.customerPhone)}</p>
          <p><strong>Service:</strong> ${safeText(booking.serviceType)}</p>
          <p><strong>City:</strong> ${safeText(booking.customerCity)}</p>
          <p><strong>Status:</strong> ${safeText(booking.bookingStatus)}</p>
          <p><strong>Progress:</strong> ${safeText(booking.jobProgress || "posted")}</p>
          <p><strong>Worker:</strong> ${safeText(booking.assignedWorkerName || "Not assigned")}</p>
          <p><strong>Amount:</strong> ${formatMoney(booking.acceptedBidAmount || booking.customerBudget || 0, booking.currency)}</p>
        `);
      });

      showMessage("adminMessage", "Bookings loaded.");

    } catch (error) {
      showMessage("adminMessage", "Database Error: " + error.message);
    }
  });
}

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

        adminResult.innerHTML += adminCard("Report", `
          <p><strong>Type:</strong> ${safeText(report.reportType)}</p>
          <p><strong>Reporter:</strong> ${safeText(report.reporterName)} (${safeText(report.reporterRole)})</p>
          <p><strong>Reported:</strong> ${safeText(report.reportedIdentity || "Not provided")}</p>
          <p><strong>Details:</strong> ${safeText(report.reportDetails)}</p>
          <p><strong>Status:</strong> ${safeText(report.status || "pending")}</p>
          <div class="admin-actions">
            <button class="btn primary-btn" onclick="adminMarkReportReviewed('${reportDoc.id}')">Mark Reviewed</button>
            ${cleanReportedPhone ? `<button class="btn outline-btn" onclick="adminBlockPhone('${cleanReportedPhone}')">Block Phone</button>` : ""}
          </div>
          <p class="form-message" id="adminReportStatus-${reportDoc.id}"></p>
        `);
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

    showMessage("adminReportStatus-" + reportId, "Report reviewed.");

  } catch (error) {
    showMessage("adminReportStatus-" + reportId, "Database Error: " + error.message);
  }
};

if (loadAdminSupportBtn) {
  loadAdminSupportBtn.addEventListener("click", async () => {
    if (!requireAdmin("adminMessage")) return;

    adminResult.innerHTML = "";

    try {
      const supportSnapshot = await getDocs(collection(db, "supportTickets"));

      if (supportSnapshot.empty) {
        showMessage("adminMessage", "No support tickets.");
        return;
      }

      supportSnapshot.forEach((ticketDoc) => {
        const ticket = ticketDoc.data();

        adminResult.innerHTML += adminCard("Support Ticket", `
          <p><strong>User:</strong> ${safeText(ticket.userName)} (${safeText(ticket.userRole)})</p>
          <p><strong>Type:</strong> ${safeText(ticket.supportType)}</p>
          <p><strong>Details:</strong> ${safeText(ticket.supportDetails)}</p>
          <p><strong>Status:</strong> ${safeText(ticket.status)}</p>
          <div class="admin-actions">
            <button class="btn secondary-btn" onclick="adminUpdateTicket('${ticketDoc.id}', 'in_review')">In Review</button>
            <button class="btn primary-btn" onclick="adminUpdateTicket('${ticketDoc.id}', 'solved')">Solved</button>
            <button class="btn outline-btn" onclick="adminUpdateTicket('${ticketDoc.id}', 'rejected')">Rejected</button>
          </div>
          <p class="form-message" id="ticketStatus-${ticketDoc.id}"></p>
        `);
      });

      showMessage("adminMessage", "Support tickets loaded.");

    } catch (error) {
      showMessage("adminMessage", "Database Error: " + error.message);
    }
  });
}

window.adminUpdateTicket = async function (ticketId, status) {
  if (!requireAdmin("adminMessage")) return;

  try {
    const ticketRef = doc(db, "supportTickets", ticketId);
    const ticketSnap = await getDoc(ticketRef);
    const ticket = ticketSnap.exists() ? ticketSnap.data() : {};

    await updateDoc(ticketRef, {
      status,
      updatedAt: serverTimestamp()
    });

    if (ticket.userId) {
      await createNotification(ticket.userId, "Support Ticket Updated", `Your ticket is now ${status}.`, "support", ticketId);
    }

    showMessage("ticketStatus-" + ticketId, "Ticket updated: " + status);

  } catch (error) {
    showMessage("ticketStatus-" + ticketId, "Database Error: " + error.message);
  }
};

if (loadCityRequestsBtn) {
  loadCityRequestsBtn.addEventListener("click", async () => {
    if (!requireAdmin("adminMessage")) return;

    adminResult.innerHTML = "";

    try {
      const citySnapshot = await getDocs(collection(db, "cityRequests"));

      if (citySnapshot.empty) {
        showMessage("adminMessage", "No city requests.");
        return;
      }

      citySnapshot.forEach((cityDoc) => {
        const city = cityDoc.data();

        adminResult.innerHTML += adminCard("City Request", `
          <p><strong>City:</strong> ${safeText(city.city)}</p>
          <p><strong>Country:</strong> ${safeText(city.country)}</p>
          <p><strong>Status:</strong> ${safeText(city.status)}</p>
          <div class="admin-actions">
            <button class="btn primary-btn" onclick="adminUpdateCityRequest('${cityDoc.id}', 'live')">Mark Live</button>
            <button class="btn secondary-btn" onclick="adminUpdateCityRequest('${cityDoc.id}', 'coming_soon')">Coming Soon</button>
          </div>
          <p class="form-message" id="cityStatus-${cityDoc.id}"></p>
        `);
      });

      showMessage("adminMessage", "City requests loaded.");

    } catch (error) {
      showMessage("adminMessage", "Database Error: " + error.message);
    }
  });
}

window.adminUpdateCityRequest = async function (cityRequestId, status) {
  if (!requireAdmin("adminMessage")) return;

  try {
    await updateDoc(doc(db, "cityRequests", cityRequestId), {
      status,
      updatedAt: serverTimestamp()
    });

    showMessage("cityStatus-" + cityRequestId, "City request updated: " + status);

  } catch (error) {
    showMessage("cityStatus-" + cityRequestId, "Database Error: " + error.message);
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
