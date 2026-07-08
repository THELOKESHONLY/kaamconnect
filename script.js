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
  "Electrician": "https://source.unsplash.com/900x600/?india,electrician,worker",
  "Plumber": "https://source.unsplash.com/900x600/?india,plumber,worker",
  "Cleaner": "https://source.unsplash.com/900x600/?india,cleaner,home-service",
  "Tutor": "https://source.unsplash.com/900x600/?india,tutor,student",
  "Cook": "https://source.unsplash.com/900x600/?india,cook,kitchen",
  "Painter": "https://source.unsplash.com/900x600/?india,painter,house",
  "AC Repair": "https://source.unsplash.com/900x600/?india,technician,air-conditioner",
  "Carpenter": "https://source.unsplash.com/900x600/?india,carpenter,woodwork",
  "Driver": "https://source.unsplash.com/900x600/?india,driver,car",
  "Gardener": "https://source.unsplash.com/900x600/?india,gardener,plants",
  "Security Guard": "https://source.unsplash.com/900x600/?india,security-guard",
  "House Helper": "https://source.unsplash.com/900x600/?india,home-helper",
  "Maid": "https://source.unsplash.com/900x600/?india,house-cleaning",
  "Mechanic": "https://source.unsplash.com/900x600/?india,mechanic,garage",
  "Mobile Repair": "https://source.unsplash.com/900x600/?india,mobile-repair",
  "Computer Repair": "https://source.unsplash.com/900x600/?india,computer-repair",
  "Photographer": "https://source.unsplash.com/900x600/?india,photographer,event",
  "Makeup Artist": "https://source.unsplash.com/900x600/?india,makeup-artist",
  "Nurse / Caretaker": "https://source.unsplash.com/900x600/?india,nurse,caretaker",
  "Delivery Boy": "https://source.unsplash.com/900x600/?india,delivery-boy",
  "Event Helper": "https://source.unsplash.com/900x600/?india,event,helper",
  "Freelancer / General Helper": "https://source.unsplash.com/900x600/?india,local-worker,helper"
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

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function showMessage(id, message) {
  const element = document.getElementById(id);
  if (element) element.textContent = message;
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

function isValidPhone(value) {
  return cleanPhone(value).length >= 10;
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
  document.querySelectorAll(".currency-symbol").forEach((element) => {
    element.textContent = currencySymbol();
  });
}

function fillServices() {
  document.querySelectorAll(".service-select").forEach((select) => {
    const firstText = select.querySelector("option")?.textContent || "Choose service";

    select.innerHTML = `<option value="">${safeText(firstText)}</option>`;

    SERVICES.forEach(([name]) => {
      select.innerHTML += `<option value="${safeText(name)}">${safeText(name)}</option>`;
    });
  });

  const grid = document.getElementById("servicesGrid");

  if (!grid) return;

  grid.innerHTML = SERVICES.map(([name, desc]) => {
    const image = SERVICE_IMAGES[name] || SERVICE_IMAGES["Freelancer / General Helper"];

    return `
      <button class="service-card service-card-click" data-service="${safeText(name)}" type="button">
        <div class="service-photo-wrap">
          <img src="${safeText(image)}" alt="${safeText(name)}" class="service-photo" loading="lazy">
        </div>

        <div class="service-content">
          <h3>${safeText(name)}</h3>
          <p>${safeText(desc)}</p>
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
    <p class="safe-note">Customer can offer amount. Worker can send counter bid. Bid should not be below minimum price.</p>
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
  const resetIdentifierLabel = document.getElementById("resetIdentifierLabel");

  if (resetStepTwo) resetStepTwo.classList.add("hidden");
  if (resetMethod) resetMethod.value = "email";
  if (resetIdentifierLabel) resetIdentifierLabel.textContent = "Registered Email";

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

    showMessage("forgotMessage", "Enter registered mobile number. OTP will be sent to email linked with this phone.");
  } else {
    if (label) label.textContent = "Registered Email";

    if (input) {
      input.value = "";
      input.placeholder = "Enter your registered email";
      input.type = "email";
    }

    showMessage("forgotMessage", "Enter registered email. OTP will be sent to this email.");
  }
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
    throw new Error("API is not returning JSON. Check /api files, Vercel environment variables and redeploy.");
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
    showMessage("forgotMessage", method === "phone" ? "Enter registered mobile number." : "Enter registered email.");
    return;
  }

  if (method === "phone" && !isValidPhone(identifier)) {
    showMessage("forgotMessage", "Enter valid registered mobile number.");
    return;
  }

  if (method === "email" && !identifier.includes("@")) {
    showMessage("forgotMessage", "Enter valid registered email address.");
    return;
  }

  try {
    showMessage("forgotMessage", "Sending OTP...");

    const data = await postJsonSafe("/api/request-reset-otp", {
      method,
      identifier
    });

    document.getElementById("resetStepTwo")?.classList.remove("hidden");

    showMessage("forgotMessage", data.message || "OTP sent successfully.");
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
    showMessage(messageId, "Please use customer account.");
    return false;
  }

  return true;
}

function requireWorker(messageId) {
  if (!requireLogin(messageId)) return false;

  if (currentRole !== "worker") {
    showMessage(messageId, "Please use worker account.");
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

  setText("accountNameLine", name);
  setText("accountRoleLine", role);
  setText("profilePreviewName", name);
  setText("profilePreviewRole", role);
  setText("profileTrustScore", `${score}%`);

  const profileAvatarBox = document.getElementById("profileAvatarBox");

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
    showMessage("authMessage", "Use real email for signup so password reset can work.");
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
      authProvider: "email",
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
        authProvider: providerName,
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
  const searchSkill = document.getElementById("searchSkill");

  if (serviceType) serviceType.value = serviceName;
  if (mapServiceType) mapServiceType.value = serviceName;
  if (searchSkill) searchSkill.value = serviceName;

  showBookingPriceGuide();

  if (!currentUser) {
    openAuthModal("login");
    showMessage("authMessage", "Login or signup first to book " + serviceName + ".");
    return;
  }

  if (currentRole !== "customer") {
    openAuthModal("login");
    showMessage("authMessage", "Please use customer account to book worker.");
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

    await setDoc(doc(db, "users", currentUser.uid), {
      city,
      bio,
      photoUrl,
      updatedAt: serverTimestamp()
    }, { merge: true });

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
      console.log("Worker settings load error:", error.message);
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

    await setDoc(doc(db, "users", currentUser.uid), {
      country,
      currency,
      city,
      settings,
      updatedAt: serverTimestamp()
    }, { merge: true });

    if (currentRole === "worker") {
      const available = settingsCheckboxValue("workerAvailableSetting");

      await setDoc(doc(db, "workers", currentUser.uid), {
        available,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await setDoc(doc(db, "workerPublic", currentUser.uid), {
        available,
        updatedAt: serverTimestamp()
      }, { merge: true });
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
    const existingData = existingWorker.exists() ? existingWorker.data() : {};
    const alreadyVerified = !!existingData.verified;

    const publicSnap = await getDoc(doc(db, "workerPublic", currentUser.uid));
    const publicData = publicSnap.exists() ? publicSnap.data() : {};

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
      workerRating: existingData.workerRating || 0,
      totalReviews: existingData.totalReviews || 0,
      totalJobs: existingData.totalJobs || 0,
      updatedAt: serverTimestamp(),
      createdAt: existingWorker.exists() ? existingData.createdAt || serverTimestamp() : serverTimestamp()
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
      workerRating: publicData.workerRating || existingData.workerRating || 0,
      totalReviews: publicData.totalReviews || existingData.totalReviews || 0,
      totalJobs: publicData.totalJobs || existingData.totalJobs || 0,
      locationEnabled: publicData.locationEnabled || false,
      latitude: publicData.latitude || 0,
      longitude: publicData.longitude || 0,
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, "workers", currentUser.uid), privateWorker, { merge: true });
    await setDoc(doc(db, "workerPublic", currentUser.uid), publicWorker, { merge: true });

    showMessage("workerProfileMessage", "Worker profile saved successfully.");
    await loadPublicWorkers();
  } catch (error) {
    showMessage("workerProfileMessage", "Worker Profile Error: " + error.message);
  }
}

function timelineHTML(booking) {
  const progress = booking.jobProgress || booking.bookingStatus || "posted";

  const steps = [
    ["posted", "Posted"],
    ["bid_accepted", "Bid Accepted"],
    ["paid", "Paid"],
    ["worker_arrived", "Worker Arrived"],
    ["completed", "Completed"]
  ];

  let activeIndex = 0;

  if (progress === "posted" || booking.bookingStatus === "pending") activeIndex = 0;
  if (progress === "bid_accepted" || booking.bookingStatus === "payment_pending") activeIndex = 1;
  if (progress === "paid" || booking.paymentStatus === "paid") activeIndex = 2;
  if (progress === "worker_arrived" || booking.bookingStatus === "worker_arrived") activeIndex = 3;
  if (progress === "completed" || booking.bookingStatus === "completed") activeIndex = 4;

  return `
    <div class="booking-timeline">
      ${steps.map((step, index) => `
        <div class="timeline-step ${index <= activeIndex ? "active" : ""}">
          <span>${index + 1}</span>
          <p>${safeText(step[1])}</p>
        </div>
      `).join("")}
    </div>
  `;
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
    showMessage("bookingMessage", "Minimum offer for " + serviceType + " is " + formatMoney(minimumCustomerOffer) + ".");
    return;
  }

  try {
    showMessage("bookingMessage", "Posting work...");

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
      reviewGiven: false,
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
      jobProgress: "posted",
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
        <p><strong>City:</strong> ${safeText(customerCity)}</p>
        <p><strong>Your Offer:</strong> ${formatMoney(customerBudget)}</p>
        <p><strong>Minimum Allowed:</strong> ${formatMoney(minimumCustomerOffer)}</p>
        <p><strong>Status:</strong> <span class="status-badge pending">Open for bids</span></p>
      </div>
    `;

    showMessage("bookingMessage", "Work posted successfully.");
    clearForm("bookingForm");
    showBookingPriceGuide();
    await loadCustomerBookings();
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
            <p><strong>Rating:</strong> ${Number(bid.workerRating || 0).toFixed(1)} ⭐</p>
            <p><strong>Bid Amount:</strong> ${formatMoney(bid.bidAmount, bid.currency || booking.currency)}</p>
            <p><strong>Message:</strong> ${safeText(bid.bidMessage || "No message")}</p>
            <p><strong>Status:</strong> <span class="status-badge ${bid.bidStatus === "accepted" ? "success" : "pending"}">${safeText(bid.bidStatus || "pending")}</span></p>

            <div class="bid-actions">
              <button class="btn outline-btn" type="button" onclick="viewWorkerPublicProfile('${bid.workerUserId}')">View Profile</button>
              ${
                booking.bookingStatus === "pending"
                  ? `<button class="btn primary-btn" type="button" onclick="acceptBid('${booking.id}', '${bid.id}')">Accept This Bid</button>`
                  : ""
              }
            </div>
          </div>
        `).join("")
        : `<p class="empty-text">No worker bids yet.</p>`;

      const payButton = booking.bookingStatus === "payment_pending"
        ? `<button class="btn primary-btn" type="button" onclick="payForBooking('${booking.id}')">Pay Now ${formatMoney(booking.acceptedBidAmount, booking.currency)}</button>`
        : "";

      const completeButton = booking.bookingStatus === "worker_arrived" || booking.jobProgress === "worker_arrived"
        ? `<button class="btn secondary-btn" type="button" onclick="customerMarkCompleted('${booking.id}')">Mark Work Completed</button>`
        : "";

      const reviewBox = booking.bookingStatus === "completed" && booking.assignedWorkerUserId && !booking.reviewGiven
        ? `
          <div class="review-box">
            <h4>Give Review</h4>
            <div class="form-grid">
              <div class="form-group">
                <label>Rating</label>
                <select id="reviewRating-${booking.id}">
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              <div class="form-group">
                <label>Review</label>
                <input type="text" id="reviewText-${booking.id}" placeholder="Write your review">
              </div>
            </div>

            <button class="btn primary-btn" type="button" onclick="submitWorkerReview('${booking.id}', '${booking.assignedWorkerUserId}')">
              Submit Review
            </button>

            <p class="message" id="reviewMessage-${booking.id}"></p>
          </div>
        `
        : booking.reviewGiven
          ? `<p class="safe-note">Review submitted. Thank you.</p>`
          : "";

      htmlParts.push(`
        <div class="data-card">
          <div class="data-card-header">
            <div>
              <h3>${safeText(booking.serviceType)} • ${safeText(booking.customerCity)}</h3>
              <p>${safeText(booking.workDetails)}</p>
            </div>
            <span class="status-badge ${booking.bookingStatus === "completed" ? "success" : booking.bookingStatus === "payment_pending" ? "info" : "pending"}">
              ${safeText(booking.bookingStatus)}
            </span>
          </div>

          ${timelineHTML(booking)}

          <p><strong>Your Offer:</strong> ${formatMoney(booking.customerOfferAmount, booking.currency)}</p>
          <p><strong>Accepted Amount:</strong> ${booking.acceptedBidAmount ? formatMoney(booking.acceptedBidAmount, booking.currency) : "Not accepted yet"}</p>
          <p><strong>Assigned Worker:</strong> ${safeText(booking.assignedWorkerName || "Not assigned yet")}</p>
          <p><strong>Payment:</strong> ${safeText(booking.paymentStatus || "not_required_yet")}</p>

          <div class="bid-actions">
            ${payButton}
            ${completeButton}
            <button class="btn outline-btn" type="button" onclick="loadCustomerBookings()">Refresh</button>
          </div>

          ${reviewBox}

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
      jobProgress: "bid_accepted",
      updatedAt: serverTimestamp()
    });

    await updateDoc(publicRef, {
      bookingStatus: "payment_pending",
      biddingOpen: false,
      acceptedBidId: bidId,
      acceptedBidAmount: Number(bid.bidAmount),
      assignedWorkerUserId: bid.workerUserId,
      jobProgress: "bid_accepted",
      updatedAt: serverTimestamp()
    });

    await createNotification(bid.workerUserId, "Bid Accepted", "Customer accepted your bid. Waiting for payment.", "bid_accepted", bookingId);
    await createNotification(currentUser.uid, "Bid Accepted", "Pay online to assign job and unlock contact details.", "payment_pending", bookingId);

    alert("Bid accepted. Now click Pay Now.");
    await loadCustomerBookings();
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
        await loadCustomerBookings();
      },
      prefill: {
        name: currentProfile?.name || "",
        email: currentProfile?.email || "",
        contact: currentProfile?.phone || ""
      },
      theme: {
        color: "#2563eb"
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    alert("Payment Error: " + error.message);
  }
};

window.customerMarkCompleted = async function (bookingId) {
  if (!requireCustomer("bookingMessage")) return;

  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const publicRef = doc(db, "publicJobs", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      alert("Booking not found.");
      return;
    }

    const booking = bookingSnap.data();

    if (booking.customerId !== currentUser.uid) {
      alert("This booking does not belong to you.");
      return;
    }

    await updateDoc(bookingRef, {
      bookingStatus: "completed",
      jobProgress: "completed",
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await setDoc(publicRef, {
      bookingStatus: "completed",
      jobProgress: "completed",
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    if (booking.assignedWorkerUserId) {
      await createNotification(booking.assignedWorkerUserId, "Work Completed", "Customer marked the work as completed.", "completed", bookingId);

      const workerRef = doc(db, "workers", booking.assignedWorkerUserId);
      const workerPublicRef = doc(db, "workerPublic", booking.assignedWorkerUserId);
      const workerSnap = await getDoc(workerRef);
      const oldJobs = workerSnap.exists() ? Number(workerSnap.data().totalJobs || 0) : 0;

      await setDoc(workerRef, {
        totalJobs: oldJobs + 1,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await setDoc(workerPublicRef, {
        totalJobs: oldJobs + 1,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    alert("Work marked completed. Now you can give review.");
    await loadCustomerBookings();
  } catch (error) {
    alert("Complete Error: " + error.message);
  }
};

async function recalculateWorkerRating(workerUserId) {
  const reviewSnap = await getDocs(query(collection(db, "reviews"), where("workerUserId", "==", workerUserId)));
  let total = 0;
  let count = 0;

  reviewSnap.forEach((docSnap) => {
    total += Number(docSnap.data().rating || 0);
    count += 1;
  });

  const rating = count ? Number((total / count).toFixed(1)) : 0;

  await setDoc(doc(db, "workers", workerUserId), {
    workerRating: rating,
    totalReviews: count,
    updatedAt: serverTimestamp()
  }, { merge: true });

  await setDoc(doc(db, "workerPublic", workerUserId), {
    workerRating: rating,
    totalReviews: count,
    updatedAt: serverTimestamp()
  }, { merge: true });

  return { rating, count };
}

window.submitWorkerReview = async function (bookingId, workerUserId) {
  if (!requireCustomer("bookingMessage")) return;

  const rating = Number(getValue("reviewRating-" + bookingId));
  const reviewText = getValue("reviewText-" + bookingId);

  if (!rating || !reviewText) {
    showMessage("reviewMessage-" + bookingId, "Select rating and write review.");
    return;
  }

  try {
    const bookingSnap = await getDoc(doc(db, "bookings", bookingId));

    if (!bookingSnap.exists()) {
      showMessage("reviewMessage-" + bookingId, "Booking not found.");
      return;
    }

    const booking = bookingSnap.data();

    if (booking.customerId !== currentUser.uid) {
      showMessage("reviewMessage-" + bookingId, "This booking does not belong to you.");
      return;
    }

    if (booking.reviewGiven) {
      showMessage("reviewMessage-" + bookingId, "Review already submitted.");
      return;
    }

    await addDoc(collection(db, "reviews"), {
      bookingId,
      workerUserId,
      customerId: currentUser.uid,
      customerName: currentProfile?.name || "Customer",
      serviceType: booking.serviceType || "",
      rating,
      reviewText,
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, "bookings", bookingId), {
      reviewGiven: true,
      updatedAt: serverTimestamp()
    });

    await recalculateWorkerRating(workerUserId);
    await createNotification(workerUserId, "New Review", "Customer gave you a " + rating + " star review.", "review", bookingId);

    showMessage("reviewMessage-" + bookingId, "Review submitted successfully.");
    await loadCustomerBookings();
    await loadPublicWorkers();
  } catch (error) {
    showMessage("reviewMessage-" + bookingId, "Review Error: " + error.message);
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

    const publicSnap = await getDocs(collection(db, "publicJobs"));
    const openJobs = [];

    publicSnap.forEach((docSnap) => {
      const job = { id: docSnap.id, ...docSnap.data() };

      if (job.customerCountry !== selectedCountry()) return;
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
            <span class="status-badge ${job.bookingStatus === "completed" ? "success" : "info"}">${safeText(job.bookingStatus)}</span>
          </div>

          ${timelineHTML(job)}

          <p><strong>Accepted Amount:</strong> ${formatMoney(job.acceptedBidAmount, job.currency)}</p>
          <p><strong>Customer:</strong> ${safeText(job.customerName)}</p>
          <p><strong>Phone:</strong> ${job.workerCanSeeContact ? safeText(job.customerPhone) : "Hidden until payment"}</p>
          <p><strong>Address:</strong> ${job.workerCanSeeContact ? safeText(job.customerAddress) : "Hidden until payment"}</p>

          <div class="bid-actions">
            ${
              job.paymentStatus === "paid" && job.bookingStatus !== "worker_arrived" && job.bookingStatus !== "completed"
                ? `<button class="btn primary-btn" type="button" onclick="workerUpdateJobStatus('${job.id}', 'worker_arrived')">Mark Arrived</button>`
                : ""
            }

            ${
              job.bookingStatus === "worker_arrived"
                ? `<button class="btn secondary-btn" type="button" onclick="workerUpdateJobStatus('${job.id}', 'completed')">Request Completion</button>`
                : ""
            }
          </div>
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
    showMessage("bidStatus-" + bookingId, "Checking bid...");

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
      showMessage("bidStatus-" + bookingId, "Minimum bid for " + workerType + " is " + formatMoney(minimumWorkerBid, job.currency || selectedCurrency()) + ".");
      return;
    }

    const oldBids = await getDocs(query(collection(db, "bids"), where("bookingId", "==", bookingId)));
    let alreadyBid = false;

    oldBids.forEach((bidDoc) => {
      if (bidDoc.data().workerUserId === currentUser.uid) alreadyBid = true;
    });

    if (alreadyBid) {
      showMessage("bidStatus-" + bookingId, "You already submitted bid for this job.");
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

    await createNotification(job.customerId, "New Bid Received", worker.workerName + " submitted bid of " + formatMoney(bidAmount, job.currency || selectedCurrency()) + ".", "bid", bookingId);

    showMessage("bidStatus-" + bookingId, "Bid submitted successfully.");
  } catch (error) {
    showMessage("bidStatus-" + bookingId, "Database Error: " + error.message);
  }
};

window.workerUpdateJobStatus = async function (bookingId, nextStatus) {
  if (!requireWorker("workerDashboardMessage")) return;

  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const publicRef = doc(db, "publicJobs", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      alert("Booking not found.");
      return;
    }

    const booking = bookingSnap.data();

    if (booking.assignedWorkerUserId !== currentUser.uid) {
      alert("This job is not assigned to you.");
      return;
    }

    const update = {
      updatedAt: serverTimestamp()
    };

    if (nextStatus === "worker_arrived") {
      update.bookingStatus = "worker_arrived";
      update.jobProgress = "worker_arrived";
      update.workerArrivedAt = serverTimestamp();
    }

    if (nextStatus === "completed") {
      update.bookingStatus = "worker_arrived";
      update.jobProgress = "worker_arrived";
      update.workerCompletionRequested = true;
      update.workerCompletionRequestedAt = serverTimestamp();
    }

    await updateDoc(bookingRef, update);
    await setDoc(publicRef, update, { merge: true });

    await createNotification(booking.customerId, "Job Update", nextStatus === "worker_arrived" ? "Worker has arrived at your location." : "Worker requested completion. Please mark work completed.", "job_update", bookingId);

    alert("Status updated.");
    await loadWorkerDashboard();
  } catch (error) {
    alert("Status Update Error: " + error.message);
  }
};

function workerCardHTML(worker) {
  const rating = Number(worker.workerRating || 0).toFixed(1);
  const totalReviews = Number(worker.totalReviews || 0);
  const totalJobs = Number(worker.totalJobs || 0);
  const image = SERVICE_IMAGES[worker.workerSkill] || SERVICE_IMAGES["Freelancer / General Helper"];

  return `
    <div class="worker-public-card">
      <div class="worker-public-photo-wrap">
        <img src="${safeText(image)}" alt="${safeText(worker.workerSkill || "Worker")}" class="worker-public-photo" loading="lazy">
      </div>

      <div class="worker-public-body">
        <div class="worker-public-top">
          <div>
            <h3>${safeText(worker.workerName || "Worker")}</h3>
            <p>${safeText(worker.workerSkill || "Local Worker")} • ${safeText(worker.workerCity || "City")}</p>
          </div>

          <span class="rating-pill">${rating} ⭐</span>
        </div>

        <p>${safeText(worker.workerAbout || "Professional local service worker available for safe work.")}</p>

        <div class="worker-public-stats">
          <span>${safeText(worker.workerType || "Freelancer")}</span>
          <span>${totalReviews} reviews</span>
          <span>${totalJobs} jobs</span>
        </div>

        <div class="worker-public-actions">
          <button class="btn outline-btn" type="button" onclick="viewWorkerPublicProfile('${worker.workerUserId || worker.id}')">View Details</button>
          <button class="btn primary-btn" type="button" onclick="quickBookWorker('${safeText(worker.workerSkill || "")}', '${safeText(worker.workerCity || "")}')">Book Similar</button>
        </div>

        <div class="review-list-mini" id="workerReviews-${safeText(worker.workerUserId || worker.id)}"></div>
      </div>
    </div>
  `;
}

async function loadPublicWorkers() {
  const box = document.getElementById("workerPublicList");

  if (!box) return;

  box.innerHTML = `<p class="empty-text">Loading public worker profiles...</p>`;

  try {
    const snap = await getDocs(collection(db, "workerPublic"));
    const workers = [];

    snap.forEach((docSnap) => {
      const worker = { id: docSnap.id, ...docSnap.data() };

      if (worker.available === false) return;
      if (appControls.requireWorkerVerification && worker.verified !== true) return;

      workers.push(worker);
    });

    workers.sort((a, b) => Number(b.workerRating || 0) - Number(a.workerRating || 0));

    if (!workers.length) {
      box.innerHTML = `<p class="empty-text">No public workers found yet. Create and verify worker profile first.</p>`;
      return;
    }

    box.innerHTML = workers.slice(0, 24).map(workerCardHTML).join("");
  } catch (error) {
    box.innerHTML = `<p class="empty-text">Public Worker Error: ${safeText(error.message)}</p>`;
  }
}

async function loadWorkerReviews(workerUserId, targetId) {
  const target = document.getElementById(targetId);

  if (!target) return;

  try {
    const snap = await getDocs(query(collection(db, "reviews"), where("workerUserId", "==", workerUserId)));
    const reviews = [];

    snap.forEach((docSnap) => {
      reviews.push({ id: docSnap.id, ...docSnap.data() });
    });

    reviews.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    if (!reviews.length) {
      target.innerHTML = `<p class="safe-note">No reviews yet.</p>`;
      return;
    }

    target.innerHTML = reviews.slice(0, 5).map((review) => `
      <div class="mini-review">
        <strong>${Number(review.rating || 0)} ⭐ • ${safeText(review.customerName || "Customer")}</strong>
        <p>${safeText(review.reviewText || "")}</p>
      </div>
    `).join("");
  } catch (error) {
    target.innerHTML = `<p class="safe-note">Review load error.</p>`;
  }
}

window.viewWorkerPublicProfile = async function (workerUserId) {
  try {
    const snap = await getDoc(doc(db, "workerPublic", workerUserId));

    if (!snap.exists()) {
      alert("Worker public profile not found.");
      return;
    }

    const worker = { id: snap.id, ...snap.data() };

    const box = document.getElementById("workerPublicList") || document.getElementById("searchWorkerResults");

    if (box) {
      box.innerHTML = `
        <div class="worker-profile-detail-card">
          ${workerCardHTML(worker)}

          <div class="full-review-box">
            <h3>Customer Reviews</h3>
            <div id="fullWorkerReviews-${safeText(workerUserId)}">
              Loading reviews...
            </div>
          </div>
        </div>
      `;

      await loadWorkerReviews(workerUserId, "fullWorkerReviews-" + workerUserId);
      document.getElementById("worker-public")?.scrollIntoView({ behavior: "smooth" });
    }
  } catch (error) {
    alert("Worker Profile Error: " + error.message);
  }
};

window.quickBookWorker = function (skill, city) {
  if (!currentUser) {
    openAuthModal("login");
    return;
  }

  if (currentRole !== "customer") {
    alert("Use customer account to book worker.");
    return;
  }

  const serviceType = document.getElementById("serviceType");
  const customerCity = document.getElementById("customerCity");

  if (serviceType) serviceType.value = skill;
  if (customerCity && city) customerCity.value = city;

  showBookingPriceGuide();
  document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
};

async function searchWorkers() {
  const box = document.getElementById("searchWorkerResults");
  const city = cleanText(getValue("searchCity"));
  const skill = getValue("searchSkill");
  const minRating = Number(getValue("searchMinRating") || 0);
  const distanceRadius = Number(getValue("searchDistance") || 0);

  if (!box) return;

  box.innerHTML = `<p class="empty-text">Searching workers...</p>`;

  try {
    let userLocation = null;

    if (distanceRadius > 0) {
      try {
        userLocation = await getBrowserLocation();
      } catch {
        showMessage("searchWorkerMessage", "Location permission needed for distance filter. Searching without distance.");
      }
    }

    const snap = await getDocs(collection(db, "workerPublic"));
    const results = [];

    snap.forEach((docSnap) => {
      const worker = { id: docSnap.id, ...docSnap.data() };

      if (worker.available === false) return;
      if (appControls.requireWorkerVerification && worker.verified !== true) return;
      if (city && cleanText(worker.workerCity) !== city) return;
      if (skill && worker.workerSkill !== skill && !isFreelancerSkill(worker.workerSkill)) return;
      if (Number(worker.workerRating || 0) < minRating) return;

      if (distanceRadius > 0 && userLocation && worker.latitude && worker.longitude) {
        const distance = distanceKm(userLocation.lat, userLocation.lng, worker.latitude, worker.longitude);

        if (distance > distanceRadius) return;

        worker.distance = distance;
      }

      results.push(worker);
    });

    results.sort((a, b) => {
      if (a.distance && b.distance) return a.distance - b.distance;
      return Number(b.workerRating || 0) - Number(a.workerRating || 0);
    });

    if (!results.length) {
      box.innerHTML = `<p class="empty-text">No workers found with these filters.</p>`;
      return;
    }

    box.innerHTML = results.map(workerCardHTML).join("");
    showMessage("searchWorkerMessage", `${results.length} worker(s) found.`);
  } catch (error) {
    box.innerHTML = `<p class="empty-text">Search Error: ${safeText(error.message)}</p>`;
  }
}

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
      Rating: ${Number(worker.workerRating || 0).toFixed(1)} ⭐<br>
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

    const workersSnap = await getDocs(collection(db, "workerPublic"));
    const nearbyWorkers = [];

    workersSnap.forEach((docSnap) => {
      const worker = { id: docSnap.id, ...docSnap.data() };

      if (worker.workerCountry !== selectedCountry()) return;
      if (worker.available !== true) return;
      if (appControls.requireWorkerVerification && worker.verified !== true) return;
      if (!worker.latitude || !worker.longitude) return;

      const workerSkill = worker.workerSkill || "";
      const skillMatched = workerSkill === service || isFreelancerSkill(workerSkill);

      if (!skillMatched) return;

      const distance = distanceKm(location.lat, location.lng, worker.latitude, worker.longitude);

      if (distance <= radius) {
        nearbyWorkers.push({ ...worker, distance });
        addWorkerMarker(worker, distance);
      }
    });

    nearbyWorkers.sort((a, b) => a.distance - b.distance);

    if (!nearbyWorkers.length) {
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
            <span>Rating: ${Number(worker.workerRating || 0).toFixed(1)} ⭐ • Phone hidden until accepted</span>
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
      adminReply: "",
      status: "open",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    clearForm("supportForm");
    showMessage("supportMessage", "Support ticket submitted.");
    await loadMySupportTickets();
  } catch (error) {
    showMessage("supportMessage", "Support Error: " + error.message);
  }
}

async function loadMySupportTickets() {
  const box = document.getElementById("mySupportTicketsList");

  if (!box) return;

  if (!currentUser) {
    box.innerHTML = `<p class="empty-text">Login to view your support tickets.</p>`;
    return;
  }

  box.innerHTML = `<p class="empty-text">Loading tickets...</p>`;

  try {
    const snap = await getDocs(query(collection(db, "supportTickets"), where("userId", "==", currentUser.uid)));
    const tickets = [];

    snap.forEach((docSnap) => {
      tickets.push({ id: docSnap.id, ...docSnap.data() });
    });

    tickets.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    if (!tickets.length) {
      box.innerHTML = `<p class="empty-text">No support tickets yet.</p>`;
      return;
    }

    box.innerHTML = tickets.map((ticket) => `
      <div class="data-card">
        <div class="data-card-header">
          <div>
            <h3>${safeText(ticket.type)}</h3>
            <p>${safeText(ticket.message)}</p>
          </div>
          <span class="status-badge ${ticket.status === "closed" ? "success" : "pending"}">${safeText(ticket.status)}</span>
        </div>

        <div class="support-reply-box">
          <strong>Admin Reply:</strong>
          <p>${safeText(ticket.adminReply || "No reply yet.")}</p>
        </div>
      </div>
    `).join("");
  } catch (error) {
    box.innerHTML = `<p class="empty-text">Ticket Error: ${safeText(error.message)}</p>`;
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

  box.innerHTML = Object.keys(MIN_PRICE_BY_SKILL).map((skill) => `
    <div class="price-admin-row">
      <label>${safeText(skill)}</label>
      <input type="number" min="1" id="adminPrice-${safeText(skill)}" value="${Number(MIN_PRICE_BY_SKILL[skill] || 0)}">
    </div>
  `).join("");

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
    const snap = await getDoc(doc(db, "platformSettings", PRICE_SETTINGS_DOC_ID));

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

    showMessage("verificationControlMessage", required ? "Worker verification is now ON." : "Worker verification is now OFF.");
  } catch (error) {
    showMessage("verificationControlMessage", "Verification Setting Error: " + error.message);
  }
}

async function loadAdminData() {
  if (!requireAdmin("adminMessage")) return;

  await Promise.all([
    loadAdminStats(),
    loadAdminUsers(),
    loadAdminWorkers(),
    loadAdminBookings(),
    loadAdminPayments(),
    loadAdminTickets()
  ]);

  showMessage("adminMessage", "Admin data loaded.");
}

async function loadAdminStats() {
  const usersSnap = await getDocs(collection(db, "users"));
  const workersSnap = await getDocs(collection(db, "workers"));
  const bookingsSnap = await getDocs(collection(db, "bookings"));
  const paymentsSnap = await getDocs(collection(db, "payments"));

  let revenue = 0;

  paymentsSnap.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.paymentStatus === "paid" || data.paymentStatus === "captured") {
      revenue += Number(data.amount || 0);
    }
  });

  setText("statTotalUsers", usersSnap.size);
  setText("statTotalWorkers", workersSnap.size);
  setText("statTotalBookings", bookingsSnap.size);
  setText("statTotalRevenue", formatMoney(revenue));
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
        <p>Status: ${safeText(user.verificationStatus || "pending")} • Blocked: ${isBlocked ? "Yes" : "No"}</p>

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
        <p>Rating: ${Number(worker.workerRating || 0).toFixed(1)} ⭐ • Reviews: ${Number(worker.totalReviews || 0)}</p>
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
      <p><strong>User:</strong> ${safeText(ticket.userName)} • ${safeText(ticket.userRole)}</p>
      <p><strong>Issue:</strong> ${safeText(ticket.message)}</p>
      <p><strong>Reply:</strong> ${safeText(ticket.adminReply || "No reply yet")}</p>

      <div class="form-group">
        <label>Admin Reply</label>
        <textarea id="ticketReply-${ticket.id}" placeholder="Write reply to user">${safeText(ticket.adminReply || "")}</textarea>
      </div>

      <div class="admin-actions">
        <button class="btn primary-btn" type="button" onclick="adminReplyTicket('${ticket.id}')">Send Reply</button>
        <button class="btn outline-btn" type="button" onclick="adminCloseTicket('${ticket.id}')">Mark Closed</button>
      </div>
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

  await loadAdminData();
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

  await loadAdminData();
  await loadPublicWorkers();
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

  await loadAdminData();
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

  await loadAdminData();
};

window.adminReplyTicket = async function (ticketId) {
  if (!requireAdmin("adminMessage")) return;

  const reply = getValue("ticketReply-" + ticketId);

  if (!reply) {
    alert("Write reply first.");
    return;
  }

  const ticketSnap = await getDoc(doc(db, "supportTickets", ticketId));

  if (!ticketSnap.exists()) {
    alert("Ticket not found.");
    return;
  }

  const ticket = ticketSnap.data();

  await updateDoc(doc(db, "supportTickets", ticketId), {
    adminReply: reply,
    status: "replied",
    updatedAt: serverTimestamp()
  });

  await createNotification(ticket.userId, "Support Reply", "Admin replied to your support ticket.", "support_reply", ticketId);

  alert("Reply sent.");
  await loadAdminTickets();
};

window.adminCloseTicket = async function (ticketId) {
  if (!requireAdmin("adminMessage")) return;

  await updateDoc(doc(db, "supportTickets", ticketId), {
    status: "closed",
    updatedAt: serverTimestamp()
  });

  await loadAdminTickets();
};

function runAiWebsiteCheck() {
  const result = document.getElementById("aiCheckResult");

  if (!result) return;

  const checks = [];

  checks.push(document.querySelector("#servicesGrid .service-card") ? "Services loaded." : "Services are not loaded.");
  checks.push(document.getElementById("localityMap") ? "Locality map section available." : "Locality map missing.");
  checks.push(document.getElementById("price-calculator") ? "Price calculator available." : "Price calculator missing.");
  checks.push(document.getElementById("worker-public") ? "Worker public profile section added." : "Worker public profile section missing.");
  checks.push(document.getElementById("search-workers") ? "Worker search/filter section added." : "Worker search/filter missing.");
  checks.push(document.getElementById("my-support-tickets") ? "Support reply section added." : "Support reply section missing.");
  checks.push(document.getElementById("policies") ? "Policies section added." : "Policies section missing.");
  checks.push(document.getElementById("app-coming-soon") ? "Download app coming soon section added." : "App coming soon section missing.");

  if (!currentUser) {
    checks.push("Login system visible, but no user currently logged in.");
  } else {
    checks.push("Logged-in user detected: " + (currentProfile?.name || currentUser.email || currentUser.uid));
  }

  checks.push("Backend OTP requires /api/request-reset-otp.js and /api/reset-password-otp.js.");
  checks.push("Social login requires Firebase authorized domain: kaamconnect-one.vercel.app.");
  checks.push("Payment requires Razorpay API keys and create-order/verify-payment APIs.");
  checks.push("Final launch recommendation: use real business email, real phone number, real Indian service images and legal policy review.");

  result.innerHTML = checks.map((item) => `<p>✅ ${safeText(item)}</p>`).join("");
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

  document.getElementById("topLoginBtn")?.addEventListener("click", () => openAuthModal("login"));
  document.getElementById("topSignupBtn")?.addEventListener("click", () => openAuthModal("signup"));
  document.getElementById("heroSignupBtn")?.addEventListener("click", () => openAuthModal("signup"));
  document.getElementById("openSignupFromPage")?.addEventListener("click", () => openAuthModal("signup"));
  document.getElementById("openLoginFromPage")?.addEventListener("click", () => openAuthModal("login"));
  document.getElementById("authCloseBtn")?.addEventListener("click", closeAuthModal);

  document.getElementById("authModal")?.addEventListener("click", (event) => {
    if (event.target === document.getElementById("authModal")) closeAuthModal();
  });

  document.getElementById("forgotModal")?.addEventListener("click", (event) => {
    if (event.target === document.getElementById("forgotModal")) closeForgotModal();
  });

  document.getElementById("showSignupTab")?.addEventListener("click", () => setAuthMode("signup"));
  document.getElementById("showLoginTab")?.addEventListener("click", () => setAuthMode("login"));

  document.getElementById("signupBtn")?.addEventListener("click", signupUser);
  document.getElementById("loginBtn")?.addEventListener("click", loginUser);
  document.getElementById("logoutBtn")?.addEventListener("click", logoutUser);
  document.getElementById("topLogoutBtn")?.addEventListener("click", logoutUser);

  document.getElementById("googleLoginBtn")?.addEventListener("click", () => socialLogin("google"));
  document.getElementById("githubLoginBtn")?.addEventListener("click", () => socialLogin("github"));
  document.getElementById("facebookLoginBtn")?.addEventListener("click", () => socialLogin("facebook"));

  document.getElementById("openForgotPasswordBtn")?.addEventListener("click", openForgotModal);
  document.getElementById("forgotCloseBtn")?.addEventListener("click", closeForgotModal);
  document.getElementById("resetMethod")?.addEventListener("change", updateResetMethodUI);
  document.getElementById("sendOtpBtn")?.addEventListener("click", requestResetOtp);
  document.getElementById("resetPasswordBtn")?.addEventListener("click", resetPasswordWithOtp);

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
  document.getElementById("loadPublicWorkersBtn")?.addEventListener("click", loadPublicWorkers);
  document.getElementById("searchWorkersBtn")?.addEventListener("click", searchWorkers);
  document.getElementById("loadMyTicketsBtn")?.addEventListener("click", loadMySupportTickets);

  document.getElementById("savePriceSettingsBtn")?.addEventListener("click", saveMinimumPriceSettings);
  document.getElementById("loadPriceSettingsBtn")?.addEventListener("click", loadMinimumPriceSettings);
  document.getElementById("refreshAdminBtn")?.addEventListener("click", loadAdminData);

  document.getElementById("verificationOnBtn")?.addEventListener("click", () => setWorkerVerificationMode(true));
  document.getElementById("verificationOffBtn")?.addEventListener("click", () => setWorkerVerificationMode(false));

  document.getElementById("saveSettingsBtn")?.addEventListener("click", saveUserSettingsPanel);
  document.getElementById("loadSettingsBtn")?.addEventListener("click", loadUserSettingsPanel);
  document.getElementById("settingsLoginBtn")?.addEventListener("click", () => openAuthModal("login"));
  document.getElementById("settingsForgotBtn")?.addEventListener("click", openForgotModal);
  document.getElementById("settingsLogoutBtn")?.addEventListener("click", logoutUser);

  document.getElementById("runAiCheckBtn")?.addEventListener("click", runAiWebsiteCheck);

  document.getElementById("countrySelector")?.addEventListener("change", () => {
    updateCurrencySymbols();
    showBookingPriceGuide();
  });

  document.getElementById("currencySelector")?.addEventListener("change", () => {
    updateCurrencySymbols();
    showBookingPriceGuide();
    showPriceCalculatorResult();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSidebar();
      closeNotificationPanel();
      closeAuthModal();
      closeForgotModal();
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user || null;

  if (user) {
    await loadUserProfile(user);
    await loadAppControls();
    await loadUserSettingsPanel();
    await updateNotificationCount();

    if (currentRole === "customer") {
      await loadCustomerBookings();
    }

    if (currentRole === "worker") {
      await loadWorkerDashboard();
    }

    if (isAdminUser()) {
      await loadAdminData();
    }
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
  setAuthMode("signup");
  initLocalityMap();
  buildAdminPriceManager();

  await loadMinimumPriceSettings();
  await loadAppControls();
  await loadPublicWorkers();
});
