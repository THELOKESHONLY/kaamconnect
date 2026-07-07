import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
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

const APP_CONTROLS_DOC_ID = "appControls";
const PRICE_SETTINGS_DOC_ID = "minimumPrices";

let appControls = {
  requireWorkerVerification: true
};

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
  "Freelancer": {
    label: "Per task / flexible work",
    multiplier: 1
  },
  "Part-time": {
    label: "Part-time work",
    multiplier: 1.5
  },
  "Full-time": {
    label: "Full-day work",
    multiplier: 3.5
  },
  "Contract": {
    label: "Contract work",
    multiplier: 5
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
  return String(value || "").replace(/[^\d]/g, "");
}

function isValidPhone(phone) {
  return cleanPhone(phone).length >= 10;
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

function profileRoleText(role) {
  if (role === "customer") return "Customer Account";
  if (role === "worker") return "Worker / Freelancer Account";
  return "Account";
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

function updateCurrencySymbols() {
  document.querySelectorAll(".currency-symbol").forEach((el) => {
    el.textContent = currencySymbol();
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
    <p class="safe-note">Customer can offer an amount. Worker can send counter bid, but bid should not be below minimum price.</p>
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
  const confirmPasswordGroup = document.getElementById("confirmPasswordGroup");

  const isSignup = mode === "signup";

  signupFields?.classList.toggle("hidden", !isSignup);
  signupBtn?.classList.toggle("hidden", !isSignup);
  loginBtn?.classList.toggle("hidden", isSignup);
  confirmPasswordGroup?.classList.toggle("hidden", !isSignup);
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

function openForgotModal() {
  closeAuthModal();

  const forgotModal = document.getElementById("forgotModal");
  const resetStepTwo = document.getElementById("resetStepTwo");
  const resetMethod = document.getElementById("resetMethod");
  const resetIdentifier = document.getElementById("resetIdentifier");

  if (resetStepTwo) resetStepTwo.classList.add("hidden");
  if (resetMethod) resetMethod.value = "email";

  if (resetIdentifier) {
    resetIdentifier.value = "";
    resetIdentifier.placeholder = "Enter your registered email";
    resetIdentifier.type = "email";
  }

  showMessage("forgotMessage", "");

  forgotModal?.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeForgotModal() {
  document.getElementById("forgotModal")?.classList.remove("open");
  document.body.style.overflow = "";
}

function updateResetMethodUI() {
  const method = getValue("resetMethod") || "email";
  const label = document.getElementById("resetIdentifierLabel");
  const input = document.getElementById("resetIdentifier");
  const stepTwo = document.getElementById("resetStepTwo");

  if (stepTwo) stepTwo.classList.add("hidden");

  if (method === "phone") {
    if (label) label.textContent = "Registered Mobile Number";

    if (input) {
      input.value = "";
      input.placeholder = "Enter your registered mobile number";
      input.type = "tel";
    }
  } else {
    if (label) label.textContent = "Registered Email";

    if (input) {
      input.value = "";
      input.placeholder = "Enter your registered email";
      input.type = "email";
    }
  }

  showMessage("forgotMessage", "");
}

async function postJsonSafe(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();

  let data = {};

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      "API is not returning JSON. Check /api file, Vercel env variables, and redeploy."
    );
  }

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

async function requestResetOtp() {
  const method = getValue("resetMethod") || "email";
  const identifier = getValue("resetIdentifier");

  if (!identifier) {
    showMessage(
      "forgotMessage",
      method === "phone"
        ? "Enter your registered mobile number."
        : "Enter your registered email."
    );
    return;
  }

  if (method === "phone" && !isValidPhone(identifier)) {
    showMessage("forgotMessage", "Enter valid registered mobile number.");
    return;
  }

  try {
    showMessage("forgotMessage", "Sending OTP...");

    await postJsonSafe("/api/request-reset-otp", {
      method,
      identifier
    });

    document.getElementById("resetStepTwo")?.classList.remove("hidden");

    showMessage(
      "forgotMessage",
      method === "phone"
        ? "OTP sent to the email linked with this phone number."
        : "OTP sent to your registered email."
    );
  } catch (error) {
    showMessage("forgotMessage", "OTP Error: " + error.message);
  }
}

async function resetPasswordWithOtp() {
  const method = getValue("resetMethod") || "email";
  const identifier = getValue("resetIdentifier");
  const otp = getValue("resetOtp");
  const newPassword = getValue("resetNewPassword");
  const confirmPassword = getValue("resetConfirmPassword");

  if (!identifier || !otp || !newPassword || !confirmPassword) {
    showMessage("forgotMessage", "Fill OTP, new password and confirm password.");
    return;
  }

  if (newPassword.length < 6) {
    showMessage("forgotMessage", "Password must be minimum 6 characters.");
    return;
  }

  if (newPassword !== confirmPassword) {
    showMessage("forgotMessage", "New password and confirm password do not match.");
    return;
  }

  try {
    showMessage("forgotMessage", "Resetting password...");

    await postJsonSafe("/api/reset-password-otp", {
      method,
      identifier,
      otp,
      newPassword
    });

    showMessage("forgotMessage", "Password reset successfully. You can login now.");

    setTimeout(() => {
      closeForgotModal();
      openAuthModal("login");
    }, 1200);
  } catch (error) {
    showMessage("forgotMessage", "Reset Error: " + error.message);
  }
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
  const confirmPassword = getValue("authConfirmPassword");
  const referral = getValue("authReferral");

  if (!name || !phone || !role || !loginId || !password || !confirmPassword) {
    showMessage("authMessage", "Fill all signup details.");
    return;
  }

  if (!loginId.includes("@")) {
    showMessage("authMessage", "Please use a real email for signup so password reset can work.");
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

  if (password !== confirmPassword) {
    showMessage("authMessage", "Password and confirm password do not match.");
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
      authProvider: "email",
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
    showMessage("authMessage", "Enter email/user ID and password.");
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

async function socialLogin(providerName) {
  try {
    let provider;

    if (providerName === "google") provider = new GoogleAuthProvider();
    if (providerName === "github") provider = new GithubAuthProvider();
    if (providerName === "facebook") provider = new FacebookAuthProvider();

    if (!provider) return;

    showMessage("authMessage", "Opening " + providerName + " login...");

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      const role = getValue("authRole") || "customer";
      const phone = cleanPhone(getValue("authPhone"));

      if (!role || !phone || !isValidPhone(phone)) {
        await signOut(auth);
        showMessage("authMessage", "For new social account, first enter mobile number and select account type, then click social login.");
        return;
      }

      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || "KaamConnect User",
        phone,
        role,
        loginId: user.email || user.uid,
        email: user.email || "",
        phoneVerified: false,
        verificationStatus: "pending",
        blocked: false,
        referralCode: makeReferralCode(user.displayName || "KC"),
        country: selectedCountry(),
        currency: selectedCurrency(),
        photoUrl: user.photoURL || "",
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
        authProvider: providerName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    showMessage("authMessage", "Logged in successfully with " + providerName + ".");
    closeAuthModal();
  } catch (error) {
    showMessage("authMessage", "Social Login Error: " + error.message);
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
  const settingsCity = document.getElementById("settingsCity");
  const settingsRadius = document.getElementById("settingsRadius");

  if (settingsCountry) settingsCountry.value = currentProfile.country || selectedCountry();
  if (settingsCurrency) settingsCurrency.value = currentProfile.currency || selectedCurrency();
  if (settingsCity) settingsCity.value = currentProfile.city || "";
  if (settingsRadius) settingsRadius.value = settings.defaultRadius || "5";

  setSettingsCheckbox("notifyBookings", settings.notifyBookings);
  setSettingsCheckbox("notifyBids", settings.notifyBids);
  setSettingsCheckbox("notifyPayments", settings.notifyPayments);
  setSettingsCheckbox("allowLocationMatching", settings.allowLocationMatching);
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
    const city = getValue("settingsCity");
    const defaultRadius = getValue("settingsRadius") || "5";

    const settings = {
      language: getValue("languageSelector") || "en",
      defaultRadius,
      notifyBookings: settingsCheckboxValue("notifyBookings"),
      notifyBids: settingsCheckboxValue("notifyBids"),
      notifyPayments: settingsCheckboxValue("notifyPayments"),
      notifySupport: true,
      allowLocationMatching: settingsCheckboxValue("allowLocationMatching"),
      showWorkerLocation: true,
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

      await setDoc(
        doc(db, "workers", currentUser.uid),
        {
          available,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      await setDoc(
        doc(db, "workerPublic", currentUser.uid),
        {
          available,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    }

    const countrySelector = document.getElementById("countrySelector");
    const currencySelector = document.getElementById("currencySelector");
    const mapRadius = document.getElementById("mapRadius");

    if (countrySelector) countrySelector.value = country;
    if (currencySelector) currencySelector.value = currency;
    if (mapRadius) mapRadius.value = defaultRadius;

    updateCurrencySymbols();

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
            <p><strong>Status:</strong> <span class="status-badge ${bid.bidStatus === "accepted" ? "success" : "pending"}">${safeText(bid.bidStatus || "
