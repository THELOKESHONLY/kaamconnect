import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp
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
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_LOGIN_IDS = ["thelokeshonly"];

let currentUser = null;
let currentProfile = null;
let currentRole = "";
let currentAuthMode = "signup";

const SERVICES = [
  ["Electrician", "Fan, light, switchboard and wiring repair."],
  ["Plumber", "Tap repair, pipe fitting and bathroom work."],
  ["Cleaner", "Home, office and deep cleaning."],
  ["Tutor", "Home tuition and online tuition."],
  ["Cook", "Daily cooking and party cooking."],
  ["Painter", "House painting and wall repair."],
  ["AC Repair", "Cooling, gas refill and AC maintenance."],
  ["Carpenter", "Furniture work, fittings and repairs."],
  ["Driver", "Local driving, pickup and travel help."],
  ["Gardener", "Garden cleaning, plants and outdoor care."],
  ["Security Guard", "Security support for home, office and event."],
  ["House Helper", "General household help and errands."],
  ["Maid", "Cleaning, washing and daily home support."],
  ["Mechanic", "Bike, car and machine repair support."],
  ["Mobile Repair", "Mobile screen, charging and software support."],
  ["Computer Repair", "Laptop, desktop, printer and software support."],
  ["Photographer", "Event, product and personal photography."],
  ["Makeup Artist", "Makeup for wedding, party and events."],
  ["Nurse / Caretaker", "Patient care, elder care and home support."],
  ["Delivery Boy", "Parcel, documents and local delivery."],
  ["Event Helper", "Event setup, decoration and management help."],
  ["Freelancer / General Helper", "Queue standing, hospital line, errands, pickup, travel help and legal small tasks."]
];

const SERVICE_IMAGES = {
  "Electrician": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80",
  "Plumber": "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=900&q=80",
  "Cleaner": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
  "Tutor": "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80",
  "Cook": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80",
  "Painter": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=80",
  "AC Repair": "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=80",
  "Carpenter": "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80",
  "Driver": "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=900&q=80",
  "Gardener": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80",
  "Security Guard": "https://images.unsplash.com/photo-1521790797524-b2497295b8a0?auto=format&fit=crop&w=900&q=80",
  "House Helper": "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=900&q=80",
  "Maid": "https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?auto=format&fit=crop&w=900&q=80",
  "Mechanic": "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80",
  "Mobile Repair": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  "Computer Repair": "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80",
  "Photographer": "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=900&q=80",
  "Makeup Artist": "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=900&q=80",
  "Nurse / Caretaker": "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80",
  "Delivery Boy": "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=900&q=80",
  "Event Helper": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80",
  "Freelancer / General Helper": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80"
};

let MIN_PRICE_BY_SKILL = {
  "Electrician": 300,
  "Plumber": 300,
  "Cleaner": 250,
  "Tutor": 400,
  "Cook": 350,
  "Painter": 600,
  "AC Repair": 500,
  "Carpenter": 450,
  "Driver": 500,
  "Gardener": 300,
  "Security Guard": 600,
  "House Helper": 350,
  "Maid": 300,
  "Mechanic": 400,
  "Mobile Repair": 300,
  "Computer Repair": 400,
  "Photographer": 1500,
  "Makeup Artist": 1200,
  "Nurse / Caretaker": 700,
  "Delivery Boy": 150,
  "Event Helper": 500,
  "Freelancer / General Helper": 200
};

let WORK_TYPE_PRICE_RULES = {
  "Freelancer": { label: "Per task / flexible work", multiplier: 1 },
  "Part-time": { label: "Part-time work", multiplier: 1.5 },
  "Full-time": { label: "Full-day work", multiplier: 3.5 },
  "Contract": { label: "Contract work", multiplier: 5 }
};

const APP_CONTROLS_DOC_ID = "appControls";
const PRICE_SETTINGS_DOC_ID = "minimumPrices";

let appControls = {
  requireWorkerVerification: true
};

const translations = {
  en: {
    top_status: "Trusted Local Service Marketplace",
    my_profile: "My Profile",
    account_access: "Account Access",
    how_it_works: "How It Works",
    services: "Services",
    post_work: "Post Work",
    my_bookings: "My Bookings",
    worker_profile: "Worker Profile",
    open_jobs: "Open Jobs",
    notifications: "Notifications",
    support_center: "Support Center",
    city_growth: "City Growth",
    admin_portal: "Admin Portal",
    trust_safety: "Trust & Safety",
    contact: "Contact"
  },
  hi: {
    top_status: "भरोसेमंद लोकल सर्विस मार्केटप्लेस",
    my_profile: "मेरी प्रोफाइल",
    account_access: "अकाउंट एक्सेस",
    how_it_works: "कैसे काम करता है",
    services: "सेवाएं",
    post_work: "काम पोस्ट करें",
    my_bookings: "मेरी बुकिंग",
    worker_profile: "वर्कर प्रोफाइल",
    open_jobs: "ओपन जॉब्स",
    notifications: "नोटिफिकेशन",
    support_center: "सपोर्ट सेंटर",
    city_growth: "सिटी ग्रोथ",
    admin_portal: "एडमिन पोर्टल",
    trust_safety: "ट्रस्ट और सेफ्टी",
    contact: "संपर्क"
  },
  es: {
    top_status: "Mercado local de servicios confiable",
    my_profile: "Mi perfil",
    account_access: "Acceso de cuenta",
    how_it_works: "Cómo funciona",
    services: "Servicios",
    post_work: "Publicar trabajo",
    my_bookings: "Mis reservas",
    worker_profile: "Perfil de trabajador",
    open_jobs: "Trabajos abiertos",
    notifications: "Notificaciones",
    support_center: "Centro de soporte",
    city_growth: "Crecimiento de ciudad",
    admin_portal: "Portal admin",
    trust_safety: "Confianza y seguridad",
    contact: "Contacto"
  },
  ar: {
    top_status: "سوق خدمات محلي موثوق",
    my_profile: "ملفي الشخصي",
    account_access: "الوصول للحساب",
    how_it_works: "كيف يعمل",
    services: "الخدمات",
    post_work: "نشر عمل",
    my_bookings: "حجوزاتي",
    worker_profile: "ملف العامل",
    open_jobs: "الأعمال المفتوحة",
    notifications: "الإشعارات",
    support_center: "مركز الدعم",
    city_growth: "نمو المدينة",
    admin_portal: "لوحة الإدارة",
    trust_safety: "الثقة والأمان",
    contact: "اتصال"
  },
  fr: {
    top_status: "Marché local de services fiable",
    my_profile: "Mon profil",
    account_access: "Accès au compte",
    how_it_works: "Comment ça marche",
    services: "Services",
    post_work: "Publier un travail",
    my_bookings: "Mes réservations",
    worker_profile: "Profil travailleur",
    open_jobs: "Travaux ouverts",
    notifications: "Notifications",
    support_center: "Centre d’aide",
    city_growth: "Croissance de ville",
    admin_portal: "Portail admin",
    trust_safety: "Confiance et sécurité",
    contact: "Contact"
  }
};

function getValue(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function showMessage(id, message) {
  const box = document.getElementById(id);
  if (box) box.textContent = message;
}

function safeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanText(value) {
  return String(value || "").trim().toLowerCase();
}

function cleanPhone(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

function isValidPhone(phone) {
  return phone.replace(/[^\d]/g, "").length >= 10;
}

function selectedCountry() {
  return getValue("countrySelector") || "India";
}

function selectedCurrency() {
  return getValue("currencySelector") || "INR";
}

function currencySymbol(currency = selectedCurrency()) {
  const symbols = {
    INR: "₹",
    AED: "د.إ",
    USD: "$",
    GBP: "£",
    CAD: "C$",
    AUD: "A$"
  };

  return symbols[currency] || "₹";
}

function formatMoney(amount, currency = selectedCurrency()) {
  return `${currencySymbol(currency)}${Number(amount || 0).toLocaleString("en-IN")}`;
}

function normalizeLoginEmail(loginId) {
  const value = cleanText(loginId);
  if (value.includes("@")) return value;
  return `${value}@kaamconnect.local`;
}

function makeReferralCode(name) {
  const base = cleanText(name).replace(/[^a-z0-9]/g, "").slice(0, 5).toUpperCase() || "KC";
  return `${base}${Math.floor(1000 + Math.random() * 9000)}`;
}

function isAdminUser() {
  const loginId = cleanText(currentProfile?.loginId || "");
  return ADMIN_LOGIN_IDS.includes(loginId);
}

function isFreelancerSkill(skill) {
  return skill === "Freelancer / General Helper" || skill === "Freelancer";
}

function clearForm(formId) {
  document.getElementById(formId)?.reset();
}

function profileTrustScore(profile) {
  if (!profile) return 0;

  let score = 20;
  if (profile.name) score += 15;
  if (profile.phone) score += 15;
  if (profile.city) score += 10;
  if (profile.bio) score += 10;
  if (profile.photoUrl) score += 10;
  if (profile.phoneVerified) score += 10;
  if (profile.verificationStatus === "verified") score += 10;

  return Math.min(score, 100);
}

function profileRoleText(role) {
  if (role === "customer") return "Customer Account";
  if (role === "worker") return "Worker / Freelancer Account";
  return "Account";
}

function updateCurrencySymbols() {
  document.querySelectorAll(".currency-symbol").forEach((el) => {
    el.textContent = currencySymbol();
  });
}

function applyLanguage() {
  const lang = getValue("languageSelector") || "en";
  const data = translations[lang] || translations.en;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (data[key]) el.textContent = data[key];
  });
}

function roundPrice(value) {
  return Math.ceil(Number(value || 0) / 10) * 10;
}

function minimumPriceForSkill(skillName, workType = "Freelancer", quantity = 1) {
  const basePrice = MIN_PRICE_BY_SKILL[skillName] || 200;
  const rule = WORK_TYPE_PRICE_RULES[workType] || WORK_TYPE_PRICE_RULES.Freelancer;
  return roundPrice(basePrice * rule.multiplier * Number(quantity || 1));
}

function suggestedMaxPrice(skillName, workType = "Freelancer", quantity = 1) {
  return roundPrice(minimumPriceForSkill(skillName, workType, quantity) * 1.5);
}

function workerCanBid(worker) {
  if (!appControls.requireWorkerVerification) return true;
  return worker.verified === true;
}

function fillServices() {
  document.querySelectorAll(".service-select").forEach((select) => {
    const first = select.querySelector("option")?.textContent || "Choose service";
    select.innerHTML = `<option value="">${safeText(first)}</option>`;

    SERVICES.forEach((service) => {
      select.innerHTML += `<option value="${safeText(service[0])}">${safeText(service[0])}</option>`;
    });
  });

  const grid = document.getElementById("servicesGrid");

  if (grid) {
    grid.innerHTML = SERVICES.map((service) => {
      const serviceName = service[0];
      const serviceDesc = service[1];
      const imageUrl = SERVICE_IMAGES[serviceName] || SERVICE_IMAGES["Freelancer / General Helper"];

      return `
        <button class="service-card service-card-click" data-service="${safeText(serviceName)}" type="button">
          <div class="service-photo-wrap">
            <img src="${safeText(imageUrl)}" alt="${safeText(serviceName)}" class="service-photo" loading="lazy">
          </div>

          <div class="service-content">
            <h3>${safeText(serviceName)}</h3>
            <p>${safeText(serviceDesc)}</p>
            <strong>Book this service →</strong>
          </div>
        </button>
      `;
    }).join("");

    grid.querySelectorAll(".service-card-click").forEach((card) => {
      card.addEventListener("click", () => {
        handleServiceClick(card.dataset.service);
      });
    });
  }
}

function showPriceCalculatorResult() {
  const skill = getValue("priceSkill");
  const workType = getValue("priceWorkType") || "Freelancer";
  const quantity = Number(getValue("priceQuantity") || 1);
  const box = document.getElementById("priceCalcResult");

  if (!box) return;

  if (!skill) {
    box.innerHTML = "Select skill and work type to calculate price.";
    return;
  }

  const minPrice = minimumPriceForSkill(skill, workType, quantity);
  const maxPrice = suggestedMaxPrice(skill, workType, quantity);
  const rule = WORK_TYPE_PRICE_RULES[workType] || WORK_TYPE_PRICE_RULES.Freelancer;

  box.innerHTML = `
    <h3>${safeText(skill)}</h3>
    <p><strong>Work Type:</strong> ${safeText(workType)} - ${safeText(rule.label)}</p>
    <p><strong>Quantity:</strong> ${quantity}</p>
    <p><strong>Minimum Starting Price:</strong> ${formatMoney(minPrice)}</p>
    <p><strong>Suggested Negotiation Range:</strong> ${formatMoney(minPrice)} - ${formatMoney(maxPrice)}</p>
    <p class="safe-note">Customer can offer an amount. Worker can send a counter bid, but bid should not be below minimum price.</p>
  `;
}

function showBookingPriceGuide() {
  const service = getValue("serviceType");
  const workType = getValue("bookingWorkType") || "Freelancer";
  const quantity = Number(getValue("bookingQuantity") || 1);
  const box = document.getElementById("bookingPriceGuide");

  if (!box) return;

  if (!service) {
    box.innerHTML = "Select a service to see minimum customer offer amount.";
    return;
  }

  const freelancerPrice = minimumPriceForSkill(service, "Freelancer", quantity);
  const partTimePrice = minimumPriceForSkill(service, "Part-time", quantity);
  const fullTimePrice = minimumPriceForSkill(service, "Full-time", quantity);
  const contractPrice = minimumPriceForSkill(service, "Contract", quantity);
  const selectedMinimum = minimumPriceForSkill(service, workType, quantity);

  box.innerHTML = `
    <strong>${safeText(service)} minimum price guide</strong>
    <p>Selected work type minimum: <strong>${formatMoney(selectedMinimum)}</strong></p>

    <div class="price-mini-grid">
      <div class="price-mini-card">
        <span>Freelancer / Per Task</span>
        <strong>${formatMoney(freelancerPrice)}</strong>
      </div>

      <div class="price-mini-card">
        <span>Part-time</span>
        <strong>${formatMoney(partTimePrice)}</strong>
      </div>

      <div class="price-mini-card">
        <span>Full-time / Day</span>
        <strong>${formatMoney(fullTimePrice)}</strong>
      </div>

      <div class="price-mini-card">
        <span>Contract Starting</span>
        <strong>${formatMoney(contractPrice)}</strong>
      </div>
    </div>

    <p class="safe-note">Customer offer must start from at least ${formatMoney(selectedMinimum)} for selected work type.</p>
  `;
}

function setAuthMode(mode = "signup") {
  currentAuthMode = mode;

  const signupFields = document.getElementById("signupFields");
  const signupBtn = document.getElementById("signupBtn");
  const loginBtn = document.getElementById("loginBtn");
  const showSignupTab = document.getElementById("showSignupTab");
  const showLoginTab = document.getElementById("showLoginTab");

  const isSignup = mode === "signup";

  signupFields?.classList.toggle("hidden", !isSignup);
  signupBtn?.classList.toggle("hidden", !isSignup);
  loginBtn?.classList.toggle("hidden", isSignup);
  showSignupTab?.classList.toggle("active", isSignup);
  showLoginTab?.classList.toggle("active", !isSignup);
}

function openAuthModal(mode = "login") {
  setAuthMode(mode);
  document.getElementById("authModal")?.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeAuthModal() {
  document.getElementById("authModal")?.classList.remove("open");
  document.body.style.overflow = "";
}

function closeSidebar() {
  document.getElementById("sidePanel")?.classList.remove("open");
  document.getElementById("sidebarOverlay")?.classList.remove("open");
}

function toggleSidebar() {
  document.getElementById("sidePanel")?.classList.toggle("open");
  document.getElementById("sidebarOverlay")?.classList.toggle("open");
}

function openNotificationPanel() {
  document.getElementById("notificationPanel")?.classList.add("open");
  loadNotifications();
}

function closeNotificationPanel() {
  document.getElementById("notificationPanel")?.classList.remove("open");
}

function openProfilePanel() {
  if (!currentUser) {
    openAuthModal("login");
    showMessage("authMessage", "Login first to view profile.");
    return;
  }

  document.getElementById("profile-update")?.classList.remove("hidden");
  document.getElementById("profile-update")?.scrollIntoView({ behavior: "smooth" });
}

function openSettingsSection() {
  if (!currentUser) {
    openAuthModal("login");
    showMessage("authMessage", "Login first to open settings.");
    return;
  }

  document.getElementById("settings")?.scrollIntoView({ behavior: "smooth" });
  loadUserSettingsPanel();
}

function requireLogin(messageId = "authMessage") {
  if (!currentUser) {
    openAuthModal("login");
    showMessage(messageId, "Login first to continue.");
    return false;
  }

  if (currentProfile?.blocked) {
    showMessage(messageId, "Your account is blocked. Contact support.");
    return false;
  }

  return true;
}

function requireCustomer(messageId) {
  if (!requireLogin(messageId)) return false;

  if (currentRole !== "customer") {
    showMessage(messageId, "Please use a customer account.");
    return false;
  }

  return true;
}

function requireWorker(messageId) {
  if (!requireLogin(messageId)) return false;

  if (currentRole !== "worker") {
    showMessage(messageId, "Please use a worker account.");
    return false;
  }

  return true;
}

function requireAdmin(messageId) {
  if (!requireLogin(messageId)) return false;

  if (!isAdminUser()) {
    showMessage(messageId, "Only admin can use this feature.");
    return false;
  }

  return true;
}

function setPortalVisibility() {
  const isCustomer = currentUser && currentRole === "customer";
  const isWorker = currentUser && currentRole === "worker";
  const isAdmin = currentUser && isAdminUser();

  document.querySelectorAll(".customer-only").forEach((el) => el.classList.toggle("hidden", !isCustomer));
  document.querySelectorAll(".worker-only").forEach((el) => el.classList.toggle("hidden", !isWorker));
  document.querySelectorAll(".admin-only").forEach((el) => el.classList.toggle("hidden", !isAdmin));

  document.getElementById("topLoginBtn")?.classList.toggle("hidden", !!currentUser);
  document.getElementById("topSignupBtn")?.classList.toggle("hidden", !!currentUser);
  document.getElementById("topLogoutBtn")?.classList.toggle("hidden", !currentUser);
}

function refreshProfessionalProfileUI() {
  const name = currentProfile?.name || "Not logged in";
  const role = currentProfile ? profileRoleText(currentProfile.role) : "Login to start.";
  const score = profileTrustScore(currentProfile);

  const accountNameLine = document.getElementById("accountNameLine");
  const accountRoleLine = document.getElementById("accountRoleLine");
  const profilePreviewName = document.getElementById("profilePreviewName");
  const profilePreviewRole = document.getElementById("profilePreviewRole");
  const profileTrust = document.getElementById("profileTrustScore");
  const profileAvatarBox = document.getElementById("profileAvatarBox");

  if (accountNameLine) accountNameLine.textContent = name;
  if (accountRoleLine) accountRoleLine.textContent = role;
  if (profilePreviewName) profilePreviewName.textContent = name;
  if (profilePreviewRole) profilePreviewRole.textContent = role;
  if (profileTrust) profileTrust.textContent = `${score}%`;

  if (profileAvatarBox) {
    if (currentProfile?.photoUrl) {
      profileAvatarBox.innerHTML = `<img src="${safeText(currentProfile.photoUrl)}" alt="Profile photo">`;
    } else {
      profileAvatarBox.textContent = (currentProfile?.name || "U").charAt(0).toUpperCase();
    }
  }

  const cityInput = document.getElementById("profileCity");
  const bioInput = document.getElementById("profileBio");

  if (cityInput && currentProfile?.city) cityInput.value = currentProfile.city;
  if (bioInput && currentProfile?.bio) bioInput.value = currentProfile.bio;
}

async function loadUserProfile(user) {
  const snap = await getDoc(doc(db, "users", user.uid));

  if (snap.exists()) {
    currentProfile = snap.data();
    currentRole = currentProfile.role || "";
  } else {
    currentProfile = null;
    currentRole = "";
  }

  setPortalVisibility();
  refreshProfessionalProfileUI();
}

async function createNotification(toUserId, title, message, type = "general", refId = "") {
  if (!toUserId) return;

  await addDoc(collection(db, "notifications"), {
    toUserId,
    title,
    message,
    type,
    refId,
    read: false,
    createdAt: serverTimestamp()
  });
}

async function loadNotifications() {
  const list = document.getElementById("notificationList");
  const countText = document.getElementById("notificationCountText");

  if (!list) return;

  if (!currentUser) {
    list.innerHTML = `<p class="empty-text">Login to view notifications.</p>`;
    if (countText) countText.textContent = "No notifications yet";
    return;
  }

  const snap = await getDocs(query(collection(db, "notifications"), where("toUserId", "==", currentUser.uid)));
  const items = [];

  snap.forEach((docSnap) => {
    items.push({ id: docSnap.id, ...docSnap.data() });
  });

  items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  if (countText) countText.textContent = `${items.length} notifications`;

  if (!items.length) {
    list.innerHTML = `<p class="empty-text">No notifications yet.</p>`;
    updateNotificationBadge(0);
    return;
  }

  list.innerHTML = items.slice(0, 30).map((item) => `
    <div class="notification-item">
      <h4>${safeText(item.title)}</h4>
      <p>${safeText(item.message)}</p>
    </div>
  `).join("");

  updateNotificationBadge(items.filter((item) => !item.read).length);
}

function updateNotificationBadge(count) {
  const badge = document.getElementById("notificationBadge");
  if (badge) badge.textContent = String(count || 0);
}

async function updateNotificationCount() {
  if (!currentUser) {
    updateNotificationBadge(0);
    return;
  }

  const snap = await getDocs(query(collection(db, "notifications"), where("toUserId", "==", currentUser.uid)));
  let unread = 0;

  snap.forEach((docSnap) => {
    if (!docSnap.data().read) unread += 1;
  });

  updateNotificationBadge(unread);
}

async function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 420;
        const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1);

        canvas.width = image.width * ratio;
        canvas.height = image.height * ratio;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };

      image.onerror = reject;
      image.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function signupUser() {
  const name = getValue("authName");
  const phone = cleanPhone(getValue("authPhone"));
  const role = getValue("authRole");
  const loginId = cleanText(getValue("authUserId"));
  const email = normalizeLoginEmail(loginId);
  const password = getValue("authPassword");
  const referral = getValue("authReferral");

  if (!name || !phone || !role || !loginId || !password) {
    showMessage("authMessage", "Fill all signup details.");
    return;
  }

  if (!isValidPhone(phone)) {
    showMessage("authMessage", "Enter valid mobile number.");
    return;
  }

  if (password.length < 6) {
    showMessage("authMessage", "Password must be at least 6 characters.");
    return;
  }

  try {
    showMessage("authMessage", "Creating account...");

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const profile = {
      uid: user.uid,
      name,
      phone,
      role,
      loginId,
      email,
      phoneVerified: false,
      verificationStatus: "pending",
      blocked: false,
      referralCode: makeReferralCode(name),
      invitedBy: referral || "",
      country: selectedCountry(),
      currency: selectedCurrency(),
      photoUrl: "",
      city: "",
      bio: "",
      settings: {
        language: getValue("languageSelector") || "en",
        defaultRadius: "5",
        notifyBookings: true,
        notifyBids: true,
        notifyPayments: true,
        notifySupport: true,
        allowLocationMatching: true,
        showWorkerLocation: true,
        hidePhoneUntilAccepted: true
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, "users", user.uid), profile);

    if (referral) {
      await addDoc(collection(db, "referrals"), {
        invitedBy: referral,
        newUserId: user.uid,
        newUserName: name,
        createdAt: serverTimestamp()
      });
    }

    showMessage("authMessage", "Account created successfully.");
    closeAuthModal();
  } catch (error) {
    showMessage("authMessage", "Signup Error: " + error.message);
  }
}

async function loginUser() {
  const loginId = getValue("authUserId");
  const email = normalizeLoginEmail(loginId);
  const password = getValue("authPassword");

  if (!loginId || !password) {
    showMessage("authMessage", "Enter user ID/email and password.");
    return;
  }

  try {
    showMessage("authMessage", "Logging in...");
    await signInWithEmailAndPassword(auth, email, password);
    showMessage("authMessage", "Logged in successfully.");
    closeAuthModal();
  } catch (error) {
    showMessage("authMessage", "Login Error: " + error.message);
  }
}

async function forgotPassword() {
  const loginId = getValue("authUserId");

  if (!loginId) {
    showMessage("authMessage", "Enter your email first, then click Forgot Password.");
    return;
  }

  if (!loginId.includes("@")) {
    showMessage("authMessage", "Password reset needs a real email. Username accounts cannot receive reset email.");
    return;
  }

  try {
    const email = normalizeLoginEmail(loginId);
    await sendPasswordResetEmail(auth, email);
    showMessage("authMessage", "Password reset link sent to your email. Check inbox/spam folder.");
  } catch (error) {
    showMessage("authMessage", "Reset Error: " + error.message);
  }
}

async function logoutUser() {
  try {
    await signOut(auth);
    currentUser = null;
    currentProfile = null;
    currentRole = "";
    setPortalVisibility();
    refreshProfessionalProfileUI();
    updateNotificationBadge(0);
    closeAuthModal();
  } catch (error) {
    showMessage("authMessage", "Logout Error: " + error.message);
  }
}

function handleServiceClick(serviceName) {
  const serviceType = document.getElementById("serviceType");
  const mapServiceType = document.getElementById("mapServiceType");

  if (mapServiceType) mapServiceType.value = serviceName;
  if (serviceType) serviceType.value = serviceName;

  showBookingPriceGuide();

  if (!currentUser) {
    openAuthModal("login");
    showMessage("authMessage", "Login or signup first to book " + serviceName + ".");
    return;
  }

  if (currentRole !== "customer") {
    openAuthModal("login");
    showMessage("authMessage", "Please use a customer account to book a worker.");
    return;
  }

  document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  showMessage("bookingMessage", serviceName + " selected. Fill your work details.");
}

async function saveProfile(event) {
  event.preventDefault();

  if (!requireLogin("profileMessage")) return;

  try {
    showMessage("profileMessage", "Saving profile...");

    const city = getValue("profileCity");
    const bio = getValue("profileBio");
    const file = document.getElementById("profilePhoto")?.files?.[0];
    const photoUrl = file ? await compressImageFile(file) : currentProfile?.photoUrl || "";

    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        city,
        bio,
        photoUrl,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    await loadUserProfile(currentUser);
    showMessage("profileMessage", "Profile saved successfully.");
  } catch (error) {
    showMessage("profileMessage", "Profile Error: " + error.message);
  }
}

function settingsCheckboxValue(id) {
  return document.getElementById(id)?.checked === true;
}

function setSettingsCheckbox(id, value) {
  const input = document.getElementById(id);
  if (input) input.checked = value !== false;
}

async function loadUserSettingsPanel() {
  if (!currentUser || !currentProfile) return;

  const settings = currentProfile.settings || {};

  const settingsCountry = document.getElementById("settingsCountry");
  const settingsCurrency = document.getElementById("settingsCurrency");
  const settingsLanguage = document.getElementById("settingsLanguage");
  const settingsCity = document.getElementById("settingsCity");
  const settingsRadius = document.getElementById("settingsRadius");

  if (settingsCountry) settingsCountry.value = currentProfile.country || selectedCountry();
  if (settingsCurrency) settingsCurrency.value = currentProfile.currency || selectedCurrency();
  if (settingsLanguage) settingsLanguage.value = settings.language || getValue("languageSelector") || "en";
  if (settingsCity) settingsCity.value = currentProfile.city || "";
  if (settingsRadius) settingsRadius.value = settings.defaultRadius || "5";

  setSettingsCheckbox("notifyBookings", settings.notifyBookings);
  setSettingsCheckbox("notifyBids", settings.notifyBids);
  setSettingsCheckbox("notifyPayments", settings.notifyPayments);
  setSettingsCheckbox("notifySupport", settings.notifySupport);
  setSettingsCheckbox("allowLocationMatching", settings.allowLocationMatching);
  setSettingsCheckbox("showWorkerLocation", settings.showWorkerLocation);
  setSettingsCheckbox("hidePhoneUntilAccepted", settings.hidePhoneUntilAccepted);

  const workerAvailableSetting = document.getElementById("workerAvailableSetting");

  if (workerAvailableSetting && currentRole === "worker") {
    try {
      const workerSnap = await getDoc(doc(db, "workers", currentUser.uid));
      if (workerSnap.exists()) {
        workerAvailableSetting.checked = workerSnap.data().available !== false;
      }
    } catch (error) {
      console.log("Worker setting load error:", error.message);
    }
  }

  showMessage("settingsMessage", "Settings loaded.");
}

async function saveUserSettingsPanel() {
  if (!requireLogin("settingsMessage")) return;

  try {
    const country = getValue("settingsCountry") || selectedCountry();
    const currency = getValue("settingsCurrency") || selectedCurrency();
    const language = getValue("settingsLanguage") || "en";
    const city = getValue("settingsCity");
    const defaultRadius = getValue("settingsRadius") || "5";

    const settings = {
      language,
      defaultRadius,
      notifyBookings: settingsCheckboxValue("notifyBookings"),
      notifyBids: settingsCheckboxValue("notifyBids"),
      notifyPayments: settingsCheckboxValue("notifyPayments"),
      notifySupport: settingsCheckboxValue("notifySupport"),
      allowLocationMatching: settingsCheckboxValue("allowLocationMatching"),
      showWorkerLocation: settingsCheckboxValue("showWorkerLocation"),
      hidePhoneUntilAccepted: settingsCheckboxValue("hidePhoneUntilAccepted")
    };

    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        country,
        currency,
        city,
        settings,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    if (currentRole === "worker") {
      const available = settingsCheckboxValue("workerAvailableSetting");

      await setDoc(doc(db, "workers", currentUser.uid), { available, updatedAt: serverTimestamp() }, { merge: true });
      await setDoc(doc(db, "workerPublic", currentUser.uid), { available, updatedAt: serverTimestamp() }, { merge: true });
    }

    const countrySelector = document.getElementById("countrySelector");
    const currencySelector = document.getElementById("currencySelector");
    const languageSelector = document.getElementById("languageSelector");
    const mapRadius = document.getElementById("mapRadius");

    if (countrySelector) countrySelector.value = country;
    if (currencySelector) currencySelector.value = currency;
    if (languageSelector) languageSelector.value = language;
    if (mapRadius) mapRadius.value = defaultRadius;

    updateCurrencySymbols();
    applyLanguage();

    await loadUserProfile(currentUser);

    showMessage("settingsMessage", "Settings saved successfully.");
  } catch (error) {
    showMessage("settingsMessage", "Settings Error: " + error.message);
  }
}

async function saveWorkerProfile(event) {
  event.preventDefault();

  if (!requireWorker("workerProfileMessage")) return;

  const workerName = getValue("workerName");
  const workerPhone = cleanPhone(getValue("workerPhone"));
  const workerSkill = getValue("workerSkill");
  const workerType = getValue("workerType");
  const workerCity = getValue("workerCity");
  const workerAvailability = getValue("workerAvailability");
  const workerAbout = getValue("workerAbout");

  if (!workerName || !workerPhone || !workerSkill || !workerType || !workerCity) {
    showMessage("workerProfileMessage", "Fill all required worker details.");
    return;
  }

  if (!isValidPhone(workerPhone)) {
    showMessage("workerProfileMessage", "Enter valid worker phone number.");
    return;
  }

  try {
    showMessage("workerProfileMessage", "Saving worker profile...");

    const existingWorker = await getDoc(doc(db, "workers", currentUser.uid));
    const existingWorkerData = existingWorker.exists() ? existingWorker.data() : {};
    const alreadyVerified = !!existingWorkerData.verified;

    const existingPublic = await getDoc(doc(db, "workerPublic", currentUser.uid));
    const oldPublic = existingPublic.exists() ? existingPublic.data() : {};

    const privateWorker = {
      workerUserId: currentUser.uid,
      workerName,
      workerPhone,
      workerSkill,
      workerType,
      workerAbout,
      workerCity,
      workerCityLower: cleanText(workerCity),
      workerCountry: selectedCountry(),
      workerAvailability,
      available: true,
      verified: alreadyVerified,
      verificationStatus: alreadyVerified ? "verified" : "pending",
      workerRating: existingWorkerData.workerRating || 0,
      totalReviews: existingWorkerData.totalReviews || 0,
      totalJobs: existingWorkerData.totalJobs || 0,
      updatedAt: serverTimestamp(),
      createdAt: existingWorker.exists() ? existingWorkerData.createdAt || serverTimestamp() : serverTimestamp()
    };

    const publicWorker = {
      workerUserId: currentUser.uid,
      workerName,
      workerSkill,
      workerType,
      workerAbout,
      workerCity,
      workerCityLower: cleanText(workerCity),
      workerCountry: selectedCountry(),
      workerAvailability,
      available: true,
      verified: alreadyVerified,
      verificationStatus: alreadyVerified ? "verified" : "pending",
      workerRating: oldPublic.workerRating || 0,
      totalReviews: oldPublic.totalReviews || 0,
      totalJobs: oldPublic.totalJobs || 0,
      locationEnabled: oldPublic.locationEnabled || false,
      latitude: oldPublic.latitude || 0,
      longitude: oldPublic.longitude || 0,
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, "workers", currentUser.uid), privateWorker, { merge: true });
    await setDoc(doc(db, "workerPublic", currentUser.uid), publicWorker, { merge: true });

    showMessage("workerProfileMessage", "Worker profile saved successfully.");
  } catch (error) {
    showMessage("workerProfileMessage", "Worker Profile Error: " + error.message);
  }
}

async function postBookingWithMinimumPrice(event) {
  event.preventDefault();

  if (!requireCustomer("bookingMessage")) return;

  const customerName = getValue("customerName");
  const customerPhone = cleanPhone(getValue("customerPhone"));
  const customerCity = getValue("customerCity");
  const serviceType = getValue("serviceType");
  const workType = getValue("bookingWorkType") || "Freelancer";
  const quantity = Number(getValue("bookingQuantity") || 1);
  const customerAddress = getValue("customerAddress");
  const customerBudget = Number(getValue("customerBudget"));
  const workDetails = getValue("workDetails");

  if (!customerName || !customerPhone || !customerCity || !serviceType || !customerAddress || !customerBudget || !workDetails) {
    showMessage("bookingMessage", "Fill all booking details.");
    return;
  }

  if (!isValidPhone(customerPhone)) {
    showMessage("bookingMessage", "Enter valid mobile number.");
    return;
  }

  const minimumCustomerOffer = minimumPriceForSkill(serviceType, workType, quantity);

  if (customerBudget < minimumCustomerOffer) {
    showMessage("bookingMessage", "Minimum offer for " + serviceType + " is " + formatMoney(minimumCustomerOffer) + ". Please increase your offer amount.");
    return;
  }

  try {
    showMessage("bookingMessage", "Posting work with price negotiation...");

    const bookingData = {
      customerId: currentUser.uid,
      customerName,
      customerPhone,
      customerCity,
      customerCityLower: cleanText(customerCity),
      customerCountry: selectedCountry(),
      serviceType,
      workType,
      quantity,
      customerAddress,
      customerBudget,
      customerOfferAmount: customerBudget,
      minimumPrice: minimumCustomerOffer,
      priceMode: "negotiable",
      currency: selectedCurrency(),
      workDetails,
      bookingStatus: "pending",
      paymentStatus: "not_required_yet",
      jobProgress: "posted",
      biddingOpen: true,
      acceptedBidId: "",
      acceptedBidAmount: 0,
      assignedWorkerUserId: "",
      assignedWorkerName: "",
      assignedWorkerPhone: "",
      workerCanSeeContact: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const bookingRef = await addDoc(collection(db, "bookings"), bookingData);

    await setDoc(doc(db, "publicJobs", bookingRef.id), {
      bookingId: bookingRef.id,
      customerId: currentUser.uid,
      customerName,
      customerCity,
      customerCityLower: cleanText(customerCity),
      customerCountry: selectedCountry(),
      serviceType,
      workType,
      quantity,
      customerBudget,
      customerOfferAmount: customerBudget,
      minimumPrice: minimumCustomerOffer,
      priceMode: "negotiable",
      currency: selectedCurrency(),
      workDetails,
      bookingStatus: "pending",
      biddingOpen: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await createNotification(currentUser.uid, "Booking Posted", "Your booking is open for worker bids.", "booking", bookingRef.id);
    await updateNotificationCount();

    document.getElementById("matchResult").innerHTML = `
      <div class="data-card">
        <h3>Work Posted Successfully</h3>
        <p><strong>Service:</strong> ${safeText(serviceType)}</p>
        <p><strong>Work Type:</strong> ${safeText(workType)}</p>
        <p><strong>City:</strong> ${safeText(customerCity)}</p>
        <p><strong>Your Offer:</strong> ${formatMoney(customerBudget)}</p>
        <p><strong>Minimum Allowed:</strong> ${formatMoney(minimumCustomerOffer)}</p>
        <p><strong>Price Mode:</strong> Negotiable bidding</p>
        <p><strong>Status:</strong> <span class="status-badge pending">Open for bids</span></p>
        <p class="safe-note">Workers can send counter bids. You can accept the best bid.</p>
      </div>
    `;

    showMessage("bookingMessage", "Work posted successfully. Workers can now send bids.");
    clearForm("bookingForm");
    showBookingPriceGuide();
    loadCustomerBookings();
  } catch (error) {
    showMessage("bookingMessage", "Database Error: " + error.message);
  }
}

async function loadCustomerBookings() {
  const list = document.getElementById("customerBookingsList");
  if (!list || !currentUser || currentRole !== "customer") return;

  list.innerHTML = `<p class="empty-text">Loading bookings...</p>`;

  try {
    const bookingSnap = await getDocs(query(collection(db, "bookings"), where("customerId", "==", currentUser.uid)));
    const bookings = [];

    bookingSnap.forEach((docSnap) => {
      bookings.push({ id: docSnap.id, ...docSnap.data() });
    });

    bookings.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    if (!bookings.length) {
      list.innerHTML = `<p class="empty-text">No bookings yet.</p>`;
      return;
    }

    const htmlParts = [];

    for (const booking of bookings) {
      const bidSnap = await getDocs(query(collection(db, "bids"), where("bookingId", "==", booking.id)));
      const bids = [];

      bidSnap.forEach((bidDoc) => {
        bids.push({ id: bidDoc.id, ...bidDoc.data() });
      });

      bids.sort((a, b) => Number(a.bidAmount || 0) - Number(b.bidAmount || 0));

      const bidHtml = bids.length
        ? bids.map((bid) => `
          <div class="bid-card">
            <h4>${safeText(bid.workerName)} • ${safeText(bid.workerSkill)}</h4>
            <p><strong>Worker Type:</strong> ${safeText(bid.workerType || "Freelancer")}</p>
            <p><strong>Bid Amount:</strong> ${formatMoney(bid.bidAmount, bid.currency || booking.currency)}</p>
            <p><strong>Message:</strong> ${safeText(bid.bidMessage || "No message")}</p>
            <p><strong>Status:</strong> <span class="status-badge ${bid.bidStatus === "accepted" ? "success" : "pending"}">${safeText(bid.bidStatus || "pending")}</span></p>
            ${
              booking.bookingStatus === "pending"
                ? `<button class="btn primary-btn" type="button" onclick="acceptBid('${booking.id}', '${bid.id}')">Accept This Bid</button>`
                : ""
            }
          </div>
        `).join("")
        : `<p class="empty-text">No worker bids yet.</p>`;

      const payButton = booking.bookingStatus === "payment_pending"
        ? `<button class="btn primary-btn" type="button" onclick="payForBooking('${booking.id}')">Pay Now ${formatMoney(booking.acceptedBidAmount, booking.currency)}</button>`
        : "";

      htmlParts.push(`
        <div class="data-card">
          <div class="data-card-header">
            <div>
              <h3>${safeText(booking.serviceType)} • ${safeText(booking.customerCity)}</h3>
              <p>${safeText(booking.workDetails)}</p>
            </div>
            <span class="status-badge ${booking.bookingStatus === "assigned" ? "success" : booking.bookingStatus === "payment_pending" ? "info" : "pending"}">
              ${safeText(booking.bookingStatus)}
            </span>
          </div>

          <p><strong>Your Offer:</strong> ${formatMoney(booking.customerOfferAmount, booking.currency)}</p>
          <p><strong>Minimum:</strong> ${formatMoney(booking.minimumPrice, booking.currency)}</p>
          <p><strong>Accepted Amount:</strong> ${booking.acceptedBidAmount ? formatMoney(booking.acceptedBidAmount, booking.currency) : "Not accepted yet"}</p>
          <p><strong>Payment:</strong> ${safeText(booking.paymentStatus || "not_required_yet")}</p>

          <div class="bid-actions">
            ${payButton}
            <button class="btn outline-btn" type="button" onclick="loadCustomerBookings()">Refresh</button>
          </div>

          <div class="bid-list">
            ${bidHtml}
          </div>
        </div>
      `);
    }

    list.innerHTML = htmlParts.join("");
  } catch (error) {
    list.innerHTML = `<p class="empty-text">Error: ${safeText(error.message)}</p>`;
  }
}

window.loadCustomerBookings = loadCustomerBookings;

window.acceptBid = async function (bookingId, bidId) {
  if (!requireCustomer("bookingMessage")) return;

  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const publicRef = doc(db, "publicJobs", bookingId);
    const bidRef = doc(db, "bids", bidId);

    const bookingSnap = await getDoc(bookingRef);
    const bidSnap = await getDoc(bidRef);

    if (!bookingSnap.exists() || !bidSnap.exists()) {
      alert("Booking or bid not found.");
      return;
    }

    const booking = bookingSnap.data();
    const bid = bidSnap.data();

    if (booking.customerId !== currentUser.uid) {
      alert("This booking does not belong to you.");
      return;
    }

    const workerSnap = await getDoc(doc(db, "workers", bid.workerUserId));
    const worker = workerSnap.exists() ? workerSnap.data() : {};

    await updateDoc(bidRef, {
      bidStatus: "accepted",
      acceptedAt: serverTimestamp()
    });

    await updateDoc(bookingRef, {
      bookingStatus: "payment_pending",
      paymentStatus: "pending",
      biddingOpen: false,
      acceptedBidId: bidId,
      acceptedBidAmount: Number(bid.bidAmount),
      assignedWorkerUserId: bid.workerUserId,
      assignedWorkerName: bid.workerName,
      assignedWorkerPhone: worker.workerPhone || "",
      jobProgress: "bid_accepted_waiting_payment",
      updatedAt: serverTimestamp()
    });

    await updateDoc(publicRef, {
      bookingStatus: "payment_pending",
      biddingOpen: false,
      acceptedBidId: bidId,
      acceptedBidAmount: Number(bid.bidAmount),
      assignedWorkerUserId: bid.workerUserId,
      jobProgress: "bid_accepted_waiting_payment",
      updatedAt: serverTimestamp()
    });

    await createNotification(bid.workerUserId, "Bid Accepted", "Customer accepted your bid. Waiting for payment verification.", "bid_accepted", bookingId);
    await createNotification(currentUser.uid, "Bid Accepted", "Now pay online to assign the job and unlock contact details.", "payment_pending", bookingId);

    alert("Bid accepted. Now click Pay Now to complete payment.");
    loadCustomerBookings();
  } catch (error) {
    alert("Accept Bid Error: " + error.message);
  }
};

window.payForBooking = async function (bookingId) {
  if (!requireCustomer("bookingMessage")) return;

  try {
    const token = await currentUser.getIdToken();

    const orderResponse = await fetch("/api/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ bookingId })
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      alert(orderData.error || "Payment order error.");
      return;
    }

    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "KaamConnect",
      description: "Worker booking payment",
      order_id: orderData.orderId,
      handler: async function (response) {
        const verifyResponse = await fetch("/api/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            bookingId,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          })
        });

        const verifyData = await verifyResponse.json();

        if (!verifyResponse.ok) {
          alert(verifyData.error || "Payment verification failed.");
          return;
        }

        alert("Payment verified. Job assigned successfully.");
        loadCustomerBookings();
      },
      prefill: {
        name: currentProfile?.name || "",
        email: currentProfile?.email || "",
        contact: currentProfile?.phone || ""
      },
      theme: { color: "#2563eb" }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    alert("Payment Error: " + error.message + "\n\nCheck Vercel environment variables and API files.");
  }
};

async function loadWorkerDashboard() {
  const list = document.getElementById("openJobsList");
  if (!list || !currentUser || currentRole !== "worker") return;

  list.innerHTML = `<p class="empty-text">Loading worker dashboard...</p>`;

  try {
    const workerSnap = await getDoc(doc(db, "workers", currentUser.uid));

    if (!workerSnap.exists()) {
      list.innerHTML = `<p class="empty-text">Create your worker profile first.</p>`;
      return;
    }

    const worker = workerSnap.data();

    if (!workerCanBid(worker)) {
      list.innerHTML = `<p class="empty-text">Your worker profile is pending admin verification.</p>`;
      return;
    }

    if (!worker.available) {
      list.innerHTML = `<p class="empty-text">Your availability is off.</p>`;
      return;
    }

    const publicSnap = await getDocs(query(collection(db, "publicJobs"), where("customerCountry", "==", selectedCountry())));
    const openJobs = [];

    publicSnap.forEach((docSnap) => {
      const job = { id: docSnap.id, ...docSnap.data() };

      if (job.bookingStatus !== "pending" || !job.biddingOpen) return;

      const sameCity = cleanText(job.customerCity) === cleanText(worker.workerCity);
      const sameSkill = job.serviceType === worker.workerSkill || isFreelancerSkill(worker.workerSkill);

      if (sameCity && sameSkill) openJobs.push(job);
    });

    const assignedSnap = await getDocs(query(collection(db, "bookings"), where("assignedWorkerUserId", "==", currentUser.uid)));
    const assignedJobs = [];

    assignedSnap.forEach((docSnap) => {
      assignedJobs.push({ id: docSnap.id, ...docSnap.data() });
    });

    const openHtml = openJobs.length
      ? openJobs.map((job) => `
        <div class="data-card">
          <div class="data-card-header">
            <div>
              <h3>${safeText(job.serviceType)} • ${safeText(job.customerCity)}</h3>
              <p>${safeText(job.workDetails)}</p>
            </div>
            <span class="status-badge pending">Open</span>
          </div>

          <p><strong>Customer Offer:</strong> ${formatMoney(job.customerOfferAmount, job.currency)}</p>
          <p><strong>Minimum:</strong> ${formatMoney(job.minimumPrice, job.currency)}</p>
          <p><strong>Phone/Address:</strong> Hidden until accepted and paid</p>

          <div class="form-grid">
            <div class="form-group">
              <label>Your Bid Amount</label>
              <input type="number" id="bidAmount-${safeText(job.id)}" placeholder="Enter your counter amount">
            </div>

            <div class="form-group">
              <label>Message</label>
              <input type="text" id="bidMessage-${safeText(job.id)}" placeholder="Explain your offer">
            </div>
          </div>

          <button class="btn primary-btn" type="button" onclick="placeBid('${job.id}')">Send Bid</button>
          <p class="message" id="bidStatus-${safeText(job.id)}"></p>
        </div>
      `).join("")
      : `<p class="empty-text">No matching open jobs in your city right now.</p>`;

    const assignedHtml = assignedJobs.length
      ? assignedJobs.map((job) => `
        <div class="data-card">
          <div class="data-card-header">
            <div>
              <h3>Assigned: ${safeText(job.serviceType)} • ${safeText(job.customerCity)}</h3>
              <p>${safeText(job.workDetails)}</p>
            </div>
            <span class="status-badge ${job.paymentStatus === "paid" ? "success" : "info"}">${safeText(job.paymentStatus || "pending")}</span>
          </div>

          <p><strong>Accepted Amount:</strong> ${formatMoney(job.acceptedBidAmount, job.currency)}</p>
          <p><strong>Customer:</strong> ${safeText(job.customerName)}</p>
          <p><strong>Phone:</strong> ${job.workerCanSeeContact ? safeText(job.customerPhone) : "Hidden until payment"}</p>
          <p><strong>Address:</strong> ${job.workerCanSeeContact ? safeText(job.customerAddress) : "Hidden until payment"}</p>
        </div>
      `).join("")
      : `<p class="empty-text">No assigned jobs yet.</p>`;

    list.innerHTML = `
      <h3>Open Jobs</h3>
      ${openHtml}
      <h3 style="margin-top:28px;">Assigned Jobs</h3>
      ${assignedHtml}
    `;
  } catch (error) {
    list.innerHTML = `<p class="empty-text">Error: ${safeText(error.message)}</p>`;
  }
}

window.placeBid = async function (bookingId) {
  if (!requireWorker("workerDashboardMessage")) return;

  const bidAmount = Number(getValue("bidAmount-" + bookingId));
  const bidMessage = getValue("bidMessage-" + bookingId);

  if (!bidAmount || bidAmount <= 0) {
    showMessage("bidStatus-" + bookingId, "Enter valid bid amount.");
    return;
  }

  try {
    showMessage("bidStatus-" + bookingId, "Checking minimum bid...");

    const workerSnap = await getDoc(doc(db, "workers", currentUser.uid));
    const jobSnap = await getDoc(doc(db, "publicJobs", bookingId));

    if (!workerSnap.exists() || !jobSnap.exists()) {
      showMessage("bidStatus-" + bookingId, "Worker profile or job not found.");
      return;
    }

    const worker = workerSnap.data();
    const job = jobSnap.data();

    if (!workerCanBid(worker)) {
      showMessage("bidStatus-" + bookingId, "Admin verification required before bidding.");
      return;
    }

    const workerType = worker.workerType || "Freelancer";
    const minimumWorkerBid = minimumPriceForSkill(job.serviceType, workerType, job.quantity || 1);

    if (bidAmount < minimumWorkerBid) {
      showMessage("bidStatus-" + bookingId, "Minimum bid for your work type (" + workerType + ") is " + formatMoney(minimumWorkerBid, job.currency || selectedCurrency()) + ".");
      return;
    }

    const oldBids = await getDocs(query(collection(db, "bids"), where("bookingId", "==", bookingId)));
    let alreadyBid = false;

    oldBids.forEach((bidDoc) => {
      if (bidDoc.data().workerUserId === currentUser.uid) alreadyBid = true;
    });

    if (alreadyBid) {
      showMessage("bidStatus-" + bookingId, "You already submitted a bid for this job.");
      return;
    }

    await addDoc(collection(db, "bids"), {
      bookingId,
      customerId: job.customerId,
      workerUserId: currentUser.uid,
      workerName: worker.workerName,
      workerSkill: worker.workerSkill,
      workerType,
      workerCity: worker.workerCity,
      workerCountry: worker.workerCountry,
      workerRating: worker.workerRating || 0,
      totalReviews: worker.totalReviews || 0,
      customerOfferAmount: job.customerOfferAmount || job.customerBudget || 0,
      minimumWorkerBid,
      bidAmount,
      currency: job.currency || selectedCurrency(),
      bidMessage,
      bidStatus: "pending",
      priceMode: "worker_counter_offer",
      createdAt: serverTimestamp()
    });

    await createNotification(job.customerId, "New Bid Received", worker.workerName + " submitted a bid of " + formatMoney(bidAmount, job.currency || selectedCurrency()) + ".", "bid", bookingId);

    showMessage("bidStatus-" + bookingId, "Bid submitted successfully.");
  } catch (error) {
    showMessage("bidStatus-" + bookingId, "Database Error: " + error.message);
  }
};

async function submitSupportTicket(event) {
  event.preventDefault();

  if (!requireLogin("supportMessage")) return;

  const type = getValue("supportType");
  const message = getValue("supportMessageText");

  if (!message) {
    showMessage("supportMessage", "Enter support message.");
    return;
  }

  try {
    await addDoc(collection(db, "supportTickets"), {
      userId: currentUser.uid,
      userName: currentProfile?.name || "",
      userRole: currentRole,
      type,
      message,
      status: "open",
      createdAt: serverTimestamp()
    });

    clearForm("supportForm");
    showMessage("supportMessage", "Support ticket submitted.");
  } catch (error) {
    showMessage("supportMessage", "Support Error: " + error.message);
  }
}

async function submitCityRequest(event) {
  event.preventDefault();

  const city = getValue("growthCity");
  const demand = getValue("growthDemand");

  if (!city || !demand) {
    showMessage("growthMessage", "Enter city and demand.");
    return;
  }

  try {
    await addDoc(collection(db, "cityRequests"), {
      city,
      cityLower: cleanText(city),
      demand,
      country: selectedCountry(),
      userId: currentUser?.uid || "",
      createdAt: serverTimestamp()
    });

    clearForm("cityRequestForm");
    showMessage("growthMessage", "City request submitted.");
  } catch (error) {
    showMessage("growthMessage", "City Request Error: " + error.message);
  }
}

function buildAdminPriceManager() {
  const box = document.getElementById("priceAdminSkillRows");
  if (!box) return;

  box.innerHTML = Object.keys(MIN_PRICE_BY_SKILL).map((skill) => {
    return `
      <div class="price-admin-row">
        <label>${safeText(skill)}</label>
        <input type="number" min="1" id="adminPrice-${safeText(skill)}" value="${Number(MIN_PRICE_BY_SKILL[skill] || 0)}">
      </div>
    `;
  }).join("");

  const freelancerInput = document.getElementById("adminMultiplierFreelancer");
  const partTimeInput = document.getElementById("adminMultiplierPartTime");
  const fullTimeInput = document.getElementById("adminMultiplierFullTime");
  const contractInput = document.getElementById("adminMultiplierContract");

  if (freelancerInput) freelancerInput.value = WORK_TYPE_PRICE_RULES["Freelancer"]?.multiplier || 1;
  if (partTimeInput) partTimeInput.value = WORK_TYPE_PRICE_RULES["Part-time"]?.multiplier || 1.5;
  if (fullTimeInput) fullTimeInput.value = WORK_TYPE_PRICE_RULES["Full-time"]?.multiplier || 3.5;
  if (contractInput) contractInput.value = WORK_TYPE_PRICE_RULES["Contract"]?.multiplier || 5;
}

async function loadMinimumPriceSettings() {
  try {
    const settingRef = doc(db, "platformSettings", PRICE_SETTINGS_DOC_ID);
    const snap = await getDoc(settingRef);

    if (snap.exists()) {
      const data = snap.data();

      if (data.minPrices) {
        Object.keys(data.minPrices).forEach((skill) => {
          MIN_PRICE_BY_SKILL[skill] = Number(data.minPrices[skill]);
        });
      }

      if (data.workTypeMultipliers) {
        WORK_TYPE_PRICE_RULES["Freelancer"].multiplier = Number(data.workTypeMultipliers["Freelancer"] || 1);
        WORK_TYPE_PRICE_RULES["Part-time"].multiplier = Number(data.workTypeMultipliers["Part-time"] || 1.5);
        WORK_TYPE_PRICE_RULES["Full-time"].multiplier = Number(data.workTypeMultipliers["Full-time"] || 3.5);
        WORK_TYPE_PRICE_RULES["Contract"].multiplier = Number(data.workTypeMultipliers["Contract"] || 5);
      }
    }

    buildAdminPriceManager();
    showBookingPriceGuide();
    showPriceCalculatorResult();
    showMessage("adminPriceMessage", "Latest price settings loaded.");
  } catch (error) {
    console.log("Price settings load error:", error.message);
  }
}

async function saveMinimumPriceSettings() {
  if (!requireAdmin("adminPriceMessage")) return;

  try {
    const minPrices = {};

    Object.keys(MIN_PRICE_BY_SKILL).forEach((skill) => {
      const input = document.getElementById("adminPrice-" + skill);
      const value = Number(input?.value || MIN_PRICE_BY_SKILL[skill] || 0);
      if (value > 0) minPrices[skill] = value;
    });

    const workTypeMultipliers = {
      "Freelancer": Number(document.getElementById("adminMultiplierFreelancer")?.value || 1),
      "Part-time": Number(document.getElementById("adminMultiplierPartTime")?.value || 1.5),
      "Full-time": Number(document.getElementById("adminMultiplierFullTime")?.value || 3.5),
      "Contract": Number(document.getElementById("adminMultiplierContract")?.value || 5)
    };

    await setDoc(doc(db, "platformSettings", PRICE_SETTINGS_DOC_ID), {
      minPrices,
      workTypeMultipliers,
      updatedBy: currentUser.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });

    Object.keys(minPrices).forEach((skill) => {
      MIN_PRICE_BY_SKILL[skill] = Number(minPrices[skill]);
    });

    WORK_TYPE_PRICE_RULES["Freelancer"].multiplier = workTypeMultipliers["Freelancer"];
    WORK_TYPE_PRICE_RULES["Part-time"].multiplier = workTypeMultipliers["Part-time"];
    WORK_TYPE_PRICE_RULES["Full-time"].multiplier = workTypeMultipliers["Full-time"];
    WORK_TYPE_PRICE_RULES["Contract"].multiplier = workTypeMultipliers["Contract"];

    showMessage("adminPriceMessage", "Minimum prices updated successfully.");
    buildAdminPriceManager();
    showBookingPriceGuide();
    showPriceCalculatorResult();
  } catch (error) {
    showMessage("adminPriceMessage", "Price Update Error: " + error.message);
  }
}

async function loadAppControls() {
  try {
    const snap = await getDoc(doc(db, "platformSettings", APP_CONTROLS_DOC_ID));

    if (snap.exists()) {
      appControls = {
        ...appControls,
        ...snap.data()
      };
    }

    updateVerificationControlUI();
  } catch (error) {
    console.log("App controls load error:", error.message);
  }
}

function updateVerificationControlUI() {
  const text = document.getElementById("verificationModeText");
  if (!text) return;

  if (appControls.requireWorkerVerification) {
    text.textContent = "Verification ON - workers need admin approval before bidding";
  } else {
    text.textContent = "Verification OFF - workers can bid without admin approval";
  }
}

async function setWorkerVerificationMode(required) {
  if (!requireAdmin("verificationControlMessage")) return;

  try {
    await setDoc(doc(db, "platformSettings", APP_CONTROLS_DOC_ID), {
      requireWorkerVerification: required,
      updatedBy: currentUser.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });

    appControls.requireWorkerVerification = required;
    updateVerificationControlUI();

    showMessage(
      "verificationControlMessage",
      required
        ? "Worker verification is now ON."
        : "Worker verification is now OFF. Workers can bid without admin verification."
    );
  } catch (error) {
    showMessage("verificationControlMessage", "Verification Setting Error: " + error.message);
  }
}

async function loadAdminData() {
  if (!requireAdmin("adminMessage")) return;

  await Promise.all([
    loadAdminUsers(),
    loadAdminWorkers(),
    loadAdminBookings(),
    loadAdminPayments(),
    loadAdminTickets()
  ]);

  showMessage("adminMessage", "Admin data loaded.");
}

async function loadAdminUsers() {
  const box = document.getElementById("adminUserList");
  if (!box) return;

  const snap = await getDocs(collection(db, "users"));
  const users = [];

  snap.forEach((docSnap) => users.push({ id: docSnap.id, ...docSnap.data() }));

  box.innerHTML = users.map((user) => {
    const isVerified = user.verificationStatus === "verified";
    const isBlocked = user.blocked === true;

    return `
      <div class="admin-item">
        <p><strong>${safeText(user.name || user.loginId || "User")}</strong> • ${safeText(user.role || "user")}</p>
        <p>ID: ${safeText(user.loginId || user.email || "")} • ${safeText(user.phone || "")}</p>
        <p>Status: ${safeText(user.verificationStatus || "pending")} • Phone Verified: ${user.phoneVerified ? "Yes" : "No"} • Blocked: ${isBlocked ? "Yes" : "No"}</p>

        <div class="admin-actions">
          ${
            isVerified
              ? `<button class="btn secondary-btn" type="button" disabled>Verified</button>`
              : `<button class="btn primary-btn" type="button" onclick="adminVerifyUser('${user.id}')">Verify</button>`
          }

          <button class="btn outline-btn" type="button" onclick="adminBlockUser('${user.id}', ${isBlocked ? "false" : "true"})">
            ${isBlocked ? "Unblock" : "Block"}
          </button>
        </div>
      </div>
    `;
  }).join("") || `<p class="empty-text">No users.</p>`;
}

async function loadAdminWorkers() {
  const box = document.getElementById("adminWorkerList");
  if (!box) return;

  const snap = await getDocs(collection(db, "workers"));
  const workers = [];

  snap.forEach((docSnap) => workers.push({ id: docSnap.id, ...docSnap.data() }));

  box.innerHTML = workers.map((worker) => {
    const isVerified = worker.verified === true;
    const isAvailable = worker.available === true;

    return `
      <div class="admin-item">
        <p><strong>${safeText(worker.workerName || "Worker")}</strong> • ${safeText(worker.workerSkill || "")}</p>
        <p>${safeText(worker.workerType || "Freelancer")} • ${safeText(worker.workerCity || "")}</p>
        <p>Verified: ${isVerified ? "Yes" : "No"} • Available: ${isAvailable ? "Yes" : "No"}</p>

        <div class="admin-actions">
          ${
            isVerified
              ? `<button class="btn secondary-btn" type="button" disabled>Verified</button>`
              : `<button class="btn primary-btn" type="button" onclick="adminVerifyWorker('${worker.id}')">Verify</button>`
          }

          <button class="btn outline-btn" type="button" onclick="adminRejectWorker('${worker.id}')">Reject</button>

          <button class="btn secondary-btn" type="button" onclick="adminToggleWorkerAvailability('${worker.id}', ${isAvailable ? "false" : "true"})">
            ${isAvailable ? "Set Unavailable" : "Set Available"}
          </button>
        </div>
      </div>
    `;
  }).join("") || `<p class="empty-text">No workers.</p>`;
}

async function loadAdminBookings() {
  const box = document.getElementById("adminBookingList");
  if (!box) return;

  const snap = await getDocs(collection(db, "bookings"));
  const bookings = [];

  snap.forEach((docSnap) => bookings.push({ id: docSnap.id, ...docSnap.data() }));
  bookings.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  box.innerHTML = bookings.slice(0, 50).map((booking) => `
    <div class="admin-item">
      <p><strong>${safeText(booking.serviceType)}</strong> • ${safeText(booking.customerCity)}</p>
      <p>Customer: ${safeText(booking.customerName)} • ${safeText(booking.customerPhone)}</p>
      <p>Offer: ${formatMoney(booking.customerOfferAmount, booking.currency)} • Accepted: ${formatMoney(booking.acceptedBidAmount, booking.currency)}</p>
      <p>Status: ${safeText(booking.bookingStatus)} • Payment: ${safeText(booking.paymentStatus)}</p>
    </div>
  `).join("") || `<p class="empty-text">No bookings.</p>`;
}

async function loadAdminPayments() {
  const box = document.getElementById("adminPaymentList");
  if (!box) return;

  const snap = await getDocs(collection(db, "payments"));
  const payments = [];

  snap.forEach((docSnap) => payments.push({ id: docSnap.id, ...docSnap.data() }));
  payments.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  box.innerHTML = payments.slice(0, 50).map((payment) => `
    <div class="admin-item">
      <p><strong>${safeText(payment.provider || "Payment")}</strong> • ${safeText(payment.paymentStatus)}</p>
      <p>Booking: ${safeText(payment.bookingId)}</p>
      <p>Amount: ${formatMoney(payment.amount, payment.currency)} • Commission: ${formatMoney(payment.commission, payment.currency)}</p>
      <p>Worker Amount: ${formatMoney(payment.workerAmount, payment.currency)}</p>
    </div>
  `).join("") || `<p class="empty-text">No payments yet.</p>`;
}

async function loadAdminTickets() {
  const box = document.getElementById("adminSupportList");
  if (!box) return;

  const snap = await getDocs(collection(db, "supportTickets"));
  const tickets = [];

  snap.forEach((docSnap) => tickets.push({ id: docSnap.id, ...docSnap.data() }));
  tickets.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  box.innerHTML = tickets.slice(0, 50).map((ticket) => `
    <div class="admin-item">
      <p><strong>${safeText(ticket.type)}</strong> • ${safeText(ticket.status)}</p>
      <p>${safeText(ticket.message)}</p>
      <p>User: ${safeText(ticket.userName)} • ${safeText(ticket.userRole)}</p>
      <button class="btn primary-btn" type="button" onclick="adminCloseTicket('${ticket.id}')">Mark Closed</button>
    </div>
  `).join("") || `<p class="empty-text">No support tickets.</p>`;
}

window.adminVerifyUser = async function (userId) {
  if (!requireAdmin("adminMessage")) return;

  try {
    await updateDoc(doc(db, "users", userId), {
      verificationStatus: "verified",
      phoneVerified: true,
      blocked: false,
      updatedAt: serverTimestamp()
    });

    await createNotification(userId, "Account Verified", "Admin verified your KaamConnect account.", "account_verified", userId);

    showMessage("adminMessage", "User verified successfully.");
    await loadAdminData();
  } catch (error) {
    showMessage("adminMessage", "User Verify Error: " + error.message);
  }
};

window.adminBlockUser = async function (userId, blocked) {
  if (!requireAdmin("adminMessage")) return;

  await updateDoc(doc(db, "users", userId), {
    blocked,
    updatedAt: serverTimestamp()
  });

  loadAdminData();
};

window.adminVerifyWorker = async function (workerId) {
  if (!requireAdmin("adminMessage")) return;

  await updateDoc(doc(db, "workers", workerId), {
    verified: true,
    verificationStatus: "verified",
    updatedAt: serverTimestamp()
  });

  await setDoc(doc(db, "workerPublic", workerId), {
    verified: true,
    verificationStatus: "verified",
    updatedAt: serverTimestamp()
  }, { merge: true });

  await createNotification(workerId, "Worker Verified", "Admin verified your worker profile. You can now bid on jobs.", "worker_verified", workerId);
  loadAdminData();
};

window.adminRejectWorker = async function (workerId) {
  if (!requireAdmin("adminMessage")) return;

  await updateDoc(doc(db, "workers", workerId), {
    verified: false,
    verificationStatus: "rejected",
    updatedAt: serverTimestamp()
  });

  await setDoc(doc(db, "workerPublic", workerId), {
    verified: false,
    verificationStatus: "rejected",
    updatedAt: serverTimestamp()
  }, { merge: true });

  await createNotification(workerId, "Worker Rejected", "Admin rejected your worker profile. Update details and contact support.", "worker_rejected", workerId);
  loadAdminData();
};

window.adminToggleWorkerAvailability = async function (workerId, available) {
  if (!requireAdmin("adminMessage")) return;

  await updateDoc(doc(db, "workers", workerId), {
    available,
    updatedAt: serverTimestamp()
  });

  await setDoc(doc(db, "workerPublic", workerId), {
    available,
    updatedAt: serverTimestamp()
  }, { merge: true });

  loadAdminData();
};

window.adminCloseTicket = async function (ticketId) {
  if (!requireAdmin("adminMessage")) return;

  await updateDoc(doc(db, "supportTickets", ticketId), {
    status: "closed",
    updatedAt: serverTimestamp()
  });

  loadAdminData();
};

let localityMap = null;
let customerMapMarker = null;
let workerMapMarkers = [];

function initLocalityMap() {
  const mapBox = document.getElementById("localityMap");
  if (!mapBox || localityMap || !window.L) return;

  localityMap = window.L.map("localityMap").setView([28.6139, 77.2090], 11);

  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap"
  }).addTo(localityMap);
}

function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported on this device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      () => {
        reject(new Error("Location permission denied or unavailable."));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );
  });
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371;
  const dLat = (Number(lat2) - Number(lat1)) * Math.PI / 180;
  const dLon = (Number(lon2) - Number(lon1)) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(Number(lat1) * Math.PI / 180) *
    Math.cos(Number(lat2) * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function clearWorkerMarkers() {
  workerMapMarkers.forEach((marker) => marker.remove());
  workerMapMarkers = [];
}

function setCustomerMarker(location) {
  initLocalityMap();
  if (!localityMap) return;

  if (customerMapMarker) customerMapMarker.remove();

  customerMapMarker = window.L.marker([location.lat, location.lng])
    .addTo(localityMap)
    .bindPopup("Your location")
    .openPopup();

  localityMap.setView([location.lat, location.lng], 14);
}

function addWorkerMarker(worker, distance) {
  if (!localityMap || !worker.latitude || !worker.longitude) return;

  const marker = window.L.marker([worker.latitude, worker.longitude])
    .addTo(localityMap)
    .bindPopup(`
      <strong>${safeText(worker.workerName || "Worker")}</strong><br>
      ${safeText(worker.workerSkill || "Service Worker")}<br>
      ${distance.toFixed(1)} km away<br>
      Phone hidden until booking accepted
    `);

  workerMapMarkers.push(marker);
}

async function saveWorkerCurrentLocation() {
  if (!requireWorker("nearbyWorkersResult")) return;

  try {
    showMessage("nearbyWorkersResult", "Allow location permission to save your work location...");

    const location = await getBrowserLocation();

    await setDoc(doc(db, "workers", currentUser.uid), {
      latitude: location.lat,
      longitude: location.lng,
      locationAccuracy: location.accuracy,
      locationEnabled: true,
      locationUpdatedAt: serverTimestamp()
    }, { merge: true });

    await setDoc(doc(db, "workerPublic", currentUser.uid), {
      latitude: location.lat,
      longitude: location.lng,
      locationAccuracy: location.accuracy,
      locationEnabled: true,
      locationUpdatedAt: serverTimestamp()
    }, { merge: true });

    setCustomerMarker(location);

    document.getElementById("nearbyWorkersResult").innerHTML = `
      <strong>Location saved successfully.</strong><br>
      Your work location is now visible for nearby customer search.
      <br><span class="safe-note">Your phone number is still hidden until customer accepts your bid.</span>
    `;
  } catch (error) {
    showMessage("nearbyWorkersResult", error.message);
  }
}

async function findNearbyWorkers() {
  const service = getValue("mapServiceType");
  const radius = Number(getValue("mapRadius") || 5);
  const resultBox = document.getElementById("nearbyWorkersResult");

  if (!service) {
    showMessage("nearbyWorkersResult", "Please select a service first.");
    return;
  }

  try {
    initLocalityMap();
    clearWorkerMarkers();

    resultBox.innerHTML = "Allow location permission. Searching nearby workers...";

    const location = await getBrowserLocation();
    setCustomerMarker(location);

    const workersSnap = await getDocs(query(
      collection(db, "workerPublic"),
      where("workerCountry", "==", selectedCountry()),
      where("available", "==", true)
    ));

    const nearbyWorkers = [];

    workersSnap.forEach((docSnap) => {
      const worker = docSnap.data();

      if (appControls.requireWorkerVerification && worker.verified !== true) return;
      if (!worker.latitude || !worker.longitude) return;

      const workerSkill = worker.workerSkill || "";
      const isGeneralHelper = isFreelancerSkill(workerSkill);
      const skillMatched = workerSkill === service || isGeneralHelper;

      if (!skillMatched) return;

      const distance = distanceKm(location.lat, location.lng, worker.latitude, worker.longitude);

      if (distance <= radius) {
        nearbyWorkers.push({ id: docSnap.id, ...worker, distance });
        addWorkerMarker(worker, distance);
      }
    });

    nearbyWorkers.sort((a, b) => a.distance - b.distance);

    if (nearbyWorkers.length === 0) {
      resultBox.innerHTML = `
        <strong>No ${safeText(service)} workers found within ${radius} km.</strong><br>
        You can still post work. Workers from your city can send bids.
      `;
      return;
    }

    resultBox.innerHTML = `
      <div class="map-count-big">${nearbyWorkers.length}</div>
      <strong>${safeText(service)} workers available within ${radius} km</strong>
      <div class="map-worker-list">
        ${nearbyWorkers.slice(0, 8).map((worker) => `
          <div class="map-worker-card">
            <strong>${safeText(worker.workerName || "Worker")}</strong>
            <span>${safeText(worker.workerSkill || service)} • ${worker.distance.toFixed(1)} km away</span><br>
            <span>Rating: ${worker.workerRating || 0} ⭐ • Phone hidden until accepted</span>
          </div>
        `).join("")}
      </div>
    `;

    const allPoints = [
      [location.lat, location.lng],
      ...nearbyWorkers.map((worker) => [worker.latitude, worker.longitude])
    ];

    localityMap.fitBounds(allPoints, { padding: [40, 40] });
  } catch (error) {
    resultBox.innerHTML = error.message;
  }
}

function wireEvents() {
  document.getElementById("sideToggle")?.addEventListener("click", toggleSidebar);
  document.getElementById("sideCloseBtn")?.addEventListener("click", closeSidebar);
  document.getElementById("sidebarOverlay")?.addEventListener("click", closeSidebar);

  document.querySelectorAll(".sidebar-menu a").forEach((link) => {
    link.addEventListener("click", () => {
      closeSidebar();

      if (link.classList.contains("profile-open-link")) {
        setTimeout(openProfilePanel, 50);
      }
    });
  });

  document.getElementById("notificationIconBtn")?.addEventListener("click", openNotificationPanel);
  document.getElementById("openNotificationSideBtn")?.addEventListener("click", () => {
    closeSidebar();
    openNotificationPanel();
  });
  document.getElementById("notificationCloseBtn")?.addEventListener("click", closeNotificationPanel);

  document.getElementById("topSettingsBtn")?.addEventListener("click", openSettingsSection);

  document.getElementById("topLoginBtn")?.addEventListener("click", () => openAuthModal("login"));
  document.getElementById("topSignupBtn")?.addEventListener("click", () => openAuthModal("signup"));
  document.getElementById("heroSignupBtn")?.addEventListener("click", () => openAuthModal("signup"));
  document.getElementById("footerLoginBtn")?.addEventListener("click", () => openAuthModal("login"));
  document.getElementById("footerSignupBtn")?.addEventListener("click", () => openAuthModal("signup"));
  document.getElementById("openLoginFromPage")?.addEventListener("click", () => openAuthModal("login"));
  document.getElementById("openSignupFromPage")?.addEventListener("click", () => openAuthModal("signup"));
  document.getElementById("authCloseBtn")?.addEventListener("click", closeAuthModal);

  document.getElementById("authModal")?.addEventListener("click", (event) => {
    if (event.target === document.getElementById("authModal")) closeAuthModal();
  });

  document.getElementById("showSignupTab")?.addEventListener("click", () => setAuthMode("signup"));
  document.getElementById("showLoginTab")?.addEventListener("click", () => setAuthMode("login"));

  document.getElementById("signupBtn")?.addEventListener("click", signupUser);
  document.getElementById("loginBtn")?.addEventListener("click", loginUser);
  document.getElementById("forgotPasswordBtn")?.addEventListener("click", forgotPassword);
  document.getElementById("logoutBtn")?.addEventListener("click", logoutUser);
  document.getElementById("topLogoutBtn")?.addEventListener("click", logoutUser);

  document.getElementById("profileForm")?.addEventListener("submit", saveProfile);
  document.getElementById("workerProfileForm")?.addEventListener("submit", saveWorkerProfile);
  document.getElementById("bookingForm")?.addEventListener("submit", postBookingWithMinimumPrice);
  document.getElementById("supportForm")?.addEventListener("submit", submitSupportTicket);
  document.getElementById("cityRequestForm")?.addEventListener("submit", submitCityRequest);

  document.getElementById("calculatePriceBtn")?.addEventListener("click", showPriceCalculatorResult);
  document.getElementById("priceSkill")?.addEventListener("change", showPriceCalculatorResult);
  document.getElementById("priceWorkType")?.addEventListener("change", showPriceCalculatorResult);
  document.getElementById("priceQuantity")?.addEventListener("input", showPriceCalculatorResult);

  document.getElementById("serviceType")?.addEventListener("change", showBookingPriceGuide);
  document.getElementById("bookingWorkType")?.addEventListener("change", showBookingPriceGuide);
  document.getElementById("bookingQuantity")?.addEventListener("input", showBookingPriceGuide);

  document.getElementById("findNearbyWorkersBtn")?.addEventListener("click", findNearbyWorkers);
  document.getElementById("saveWorkerLocationBtn")?.addEventListener("click", saveWorkerCurrentLocation);
  document.getElementById("settingsShareLocationBtn")?.addEventListener("click", saveWorkerCurrentLocation);

  document.getElementById("loadOpenJobsBtn")?.addEventListener("click", loadWorkerDashboard);

  document.getElementById("savePriceSettingsBtn")?.addEventListener("click", saveMinimumPriceSettings);
  document.getElementById("loadPriceSettingsBtn")?.addEventListener("click", loadMinimumPriceSettings);
  document.getElementById("refreshAdminBtn")?.addEventListener("click", loadAdminData);

  document.getElementById("verificationOnBtn")?.addEventListener("click", () => setWorkerVerificationMode(true));
  document.getElementById("verificationOffBtn")?.addEventListener("click", () => setWorkerVerificationMode(false));

  document.getElementById("saveSettingsBtn")?.addEventListener("click", saveUserSettingsPanel);
  document.getElementById("loadSettingsBtn")?.addEventListener("click", loadUserSettingsPanel);
  document.getElementById("settingsLoginBtn")?.addEventListener("click", () => openAuthModal("login"));
  document.getElementById("settingsForgotBtn")?.addEventListener("click", () => {
    openAuthModal("login");
    showMessage("authMessage", "Enter your real email, then click Forgot Password.");
  });
  document.getElementById("settingsLogoutBtn")?.addEventListener("click", logoutUser);

  document.getElementById("countrySelector")?.addEventListener("change", () => {
    updateCurrencySymbols();
    showBookingPriceGuide();
  });

  document.getElementById("currencySelector")?.addEventListener("change", () => {
    updateCurrencySymbols();
    showBookingPriceGuide();
    showPriceCalculatorResult();
  });

  document.getElementById("languageSelector")?.addEventListener("change", applyLanguage);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSidebar();
      closeNotificationPanel();
      closeAuthModal();
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user || null;

  if (user) {
    await loadUserProfile(user);
    await loadAppControls();
    loadUserSettingsPanel();
    await updateNotificationCount();

    if (currentRole === "customer") loadCustomerBookings();
    if (currentRole === "worker") loadWorkerDashboard();
    if (isAdminUser()) loadAdminData();
  } else {
    currentProfile = null;
    currentRole = "";
    setPortalVisibility();
    refreshProfessionalProfileUI();
    updateNotificationBadge(0);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  fillServices();
  wireEvents();
  updateCurrencySymbols();
  applyLanguage();
  setAuthMode("signup");
  initLocalityMap();
  buildAdminPriceManager();
  await loadMinimumPriceSettings();
  await loadAppControls();
});
