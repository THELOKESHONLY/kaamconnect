/* =========================================================
   RapideService - Complete Frontend Script
   IMPORTANT:
   Firebase project stays same: kaamconnect-fdf87
   Only public brand changed to RapideService.
========================================================= */

/* ---------------- Firebase Config ---------------- */
const firebaseConfig = {
  apiKey: "AIzaSyDylEdOuxEpqh7IxEO9cBoV7u9_9cK8DAc",
  authDomain: "kaamconnect-fdf87.firebaseapp.com",
  projectId: "kaamconnect-fdf87",
  storageBucket: "kaamconnect-fdf87.firebasestorage.app",
  messagingSenderId: "929567285202",
  appId: "1:929567285202:web:7adb18836f12c8b69db20b",
  measurementId: "G-25ZG5RB3FX"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

const BRAND = {
  name: "RapideService",
  shortName: "RS",
  domain: "rapideservice.com",
  supportEmail: "support@rapideservice.com",
  otpEmail: "otp@rapideservice.com",
  phone: "+91 7303041394",
  tagline: "Hire trusted workers, freelancers and local helpers near you."
};

const ADMIN_LOGIN_IDS = ["thelokeshonly"];
const ADMIN_EMAILS = ["lokeshyadav4399@gmail.com"];

let currentUser = null;
let currentUserProfile = null;
let currentAuthMode = "login";
let currentDashboardTab = "bookings";
let currentAdminTab = "workers";
let allPublicJobsCache = [];

/* ---------------- Skills and Prices ---------------- */
const SKILLS = [
  "Electrician",
  "Plumber",
  "Cleaner",
  "Tutor",
  "Cook",
  "Painter",
  "AC Repair",
  "Carpenter",
  "Driver",
  "Gardener",
  "Security Guard",
  "House Helper",
  "Maid",
  "Mechanic",
  "Mobile Repair",
  "Computer Repair",
  "Photographer",
  "Makeup Artist",
  "Nurse / Caretaker",
  "Delivery Boy",
  "Event Helper",
  "Freelancer / General Helper"
];

const DEFAULT_MINIMUM_PRICES = {
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

const WORK_TYPE_MULTIPLIER = {
  "Freelancer": 1,
  "Part-time": 1.5,
  "Full-time": 3.5,
  "Contract": 5
};

let minimumPrices = { ...DEFAULT_MINIMUM_PRICES };

const SERVICE_IMAGES = {
  "Electrician": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80",
  "Plumber": "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=900&q=80",
  "Cleaner": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
  "Tutor": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
  "Cook": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80",
  "Painter": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=80",
  "AC Repair": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=900&q=80",
  "Carpenter": "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80",
  "Driver": "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=900&q=80",
  "Gardener": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80",
  "Security Guard": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=80",
  "House Helper": "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=900&q=80",
  "Maid": "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=900&q=80",
  "Mechanic": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=80",
  "Mobile Repair": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  "Computer Repair": "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80",
  "Photographer": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
  "Makeup Artist": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
  "Nurse / Caretaker": "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80",
  "Delivery Boy": "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=900&q=80",
  "Event Helper": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80",
  "Freelancer / General Helper": "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80"
};

/* ---------------- Helpers ---------------- */
function $(id) {
  return document.getElementById(id);
}

function safeText(value, fallback = "") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function currencySymbol(currency = "INR") {
  if (currency === "USD") return "$";
  if (currency === "GBP") return "£";
  if (currency === "AED") return "AED ";
  return "₹";
}

function getSelectedCurrency() {
  return $("currencySelect")?.value || "INR";
}

function formatMoney(amount, currency = getSelectedCurrency()) {
  const num = Number(amount || 0);
  return `${currencySymbol(currency)}${num.toLocaleString("en-IN")}`;
}

function nowServer() {
  return firebase.firestore.FieldValue.serverTimestamp();
}

function makeReferralCode(name = "RS") {
  const clean = String(name || "RS").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5);
  return `${clean}${Math.floor(10000 + Math.random() * 90000)}`;
}

function getEmailLoginId(email) {
  return String(email || "").split("@")[0].toLowerCase().trim();
}

function isAdminUser(profile = currentUserProfile, user = currentUser) {
  const email = String(user?.email || profile?.email || "").toLowerCase();
  const loginId = String(profile?.loginId || "").toLowerCase();

  return ADMIN_EMAILS.includes(email) || ADMIN_LOGIN_IDS.includes(loginId);
}

function showToast(message, type = "success") {
  const toast = $("toast");
  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3600);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function goToSection(id) {
  closeSidebar();

  document.querySelectorAll("main section").forEach((section) => {
    if (section.id === "settings" || section.id === "admin") {
      section.classList.add("hidden");
    }
  });

  const section = $(id);
  if (!section) return;

  if (id === "settings") section.classList.remove("hidden");
  if (id === "admin" && isAdminUser()) section.classList.remove("hidden");

  section.scrollIntoView({ behavior: "smooth", block: "start" });

  if (id === "jobs") loadPublicJobs();
  if (id === "dashboard") loadDashboard();
  if (id === "admin") loadAdminPanel();
}

function openSettingsSection() {
  goToSection("settings");
}

function setButtonLoading(button, loadingText, isLoading) {
  if (!button) return;

  if (isLoading) {
    button.dataset.oldText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.oldText || button.textContent;
    button.disabled = false;
  }
}

/* ---------------- Sidebar / Drawer ---------------- */
function openSidebar() {
  $("sidebar")?.classList.add("open");
  $("overlay")?.classList.remove("hidden");
  document.body.classList.add("no-scroll");
}

function closeSidebar() {
  $("sidebar")?.classList.remove("open");

  if (!$("notificationDrawer")?.classList.contains("open")) {
    $("overlay")?.classList.add("hidden");
    document.body.classList.remove("no-scroll");
  }
}

function toggleNotificationDrawer() {
  const drawer = $("notificationDrawer");
  if (!drawer) return;

  drawer.classList.toggle("open");

  if (drawer.classList.contains("open")) {
    $("overlay")?.classList.remove("hidden");
    document.body.classList.add("no-scroll");
    loadNotifications();
  } else {
    closeNotificationDrawer();
  }
}

function closeNotificationDrawer() {
  $("notificationDrawer")?.classList.remove("open");

  if (!$("sidebar")?.classList.contains("open")) {
    $("overlay")?.classList.add("hidden");
    document.body.classList.remove("no-scroll");
  }
}

/* ---------------- Auth Modal ---------------- */
function openAuthModal(mode = "login") {
  setAuthMode(mode);
  $("authModal")?.classList.remove("hidden");
  $("overlay")?.classList.remove("hidden");
  document.body.classList.add("no-scroll");
}

function closeAuthModal() {
  $("authModal")?.classList.add("hidden");
  $("overlay")?.classList.add("hidden");
  document.body.classList.remove("no-scroll");
}

function setAuthMode(mode = "login") {
  currentAuthMode = mode;

  $("authTitle").textContent = mode === "signup" ? "Create Account" : "Login";
  $("authSubmitBtn").textContent = mode === "signup" ? "Sign Up" : "Login";

  $("loginTab")?.classList.toggle("active", mode === "login");
  $("signupTab")?.classList.toggle("active", mode === "signup");
  $("signupFields")?.classList.toggle("hidden", mode !== "signup");
  $("confirmPasswordWrap")?.classList.toggle("hidden", mode !== "signup");

  const nameInput = $("authName");
  const phoneInput = $("authPhone");
  const confirmInput = $("authConfirmPassword");

  if (nameInput) nameInput.required = mode === "signup";
  if (phoneInput) phoneInput.required = mode === "signup";
  if (confirmInput) confirmInput.required = mode === "signup";
}

async function handleAuth(event) {
  event.preventDefault();

  const email = $("authEmail").value.trim().toLowerCase();
  const password = $("authPassword").value;
  const submitBtn = $("authSubmitBtn");

  if (!email || !password) {
    showToast("Please enter email and password.", "error");
    return;
  }

  try {
    setButtonLoading(submitBtn, "Please wait...", true);

    if (currentAuthMode === "signup") {
      const name = $("authName").value.trim();
      const phone = $("authPhone").value.trim();
      const role = $("authRole").value;
      const referral = $("authReferral").value.trim();
      const confirmPassword = $("authConfirmPassword").value;

      if (!name || !phone) {
        showToast("Please enter name and phone number.", "error");
        return;
      }

      if (password !== confirmPassword) {
        showToast("Password and confirm password do not match.", "error");
        return;
      }

      const cred = await auth.createUserWithEmailAndPassword(email, password);
      const user = cred.user;

      await user.updateProfile({ displayName: name });

      const userData = {
        uid: user.uid,
        name,
        phone,
        role,
        loginId: getEmailLoginId(email),
        email,
        phoneVerified: false,
        verificationStatus: "pending",
        blocked: false,
        referralCode: makeReferralCode(name),
        invitedBy: referral || "",
        country: $("countrySelect")?.value || "IN",
        currency: $("currencySelect")?.value || "INR",
        language: $("languageSelect")?.value || "en",
        authProvider: "email",
        photoUrl: "",
        city: "",
        bio: "",
        settings: {
          country: $("countrySelect")?.value || "IN",
          currency: $("currencySelect")?.value || "INR",
          language: $("languageSelect")?.value || "en"
        },
        createdAt: nowServer(),
        updatedAt: nowServer()
      };

      await db.collection("users").doc(user.uid).set(userData, { merge: true });

      if (referral) {
        await db.collection("referrals").add({
          invitedBy: referral,
          newUserId: user.uid,
          newUserEmail: email,
          status: "created",
          createdAt: nowServer()
        });
      }

      await createNotification(user.uid, "Welcome to RapideService", "Your account was created successfully.");

      showToast("Account created successfully.");
      closeAuthModal();

      if (role === "worker") {
        goToSection("worker");
      } else {
        goToSection("book");
      }
    } else {
      await auth.signInWithEmailAndPassword(email, password);
      showToast("Login successful.");
      closeAuthModal();
    }
  } catch (error) {
    showToast(error.message || "Authentication failed.", "error");
  } finally {
    setButtonLoading(submitBtn, "", false);
  }
}

async function socialLogin(providerName) {
  try {
    let provider;

    if (providerName === "google") {
      provider = new firebase.auth.GoogleAuthProvider();
    } else if (providerName === "github") {
      provider = new firebase.auth.GithubAuthProvider();
    } else if (providerName === "facebook") {
      provider = new firebase.auth.FacebookAuthProvider();
    }

    if (!provider) return;

    const result = await auth.signInWithPopup(provider);
    const user = result.user;
    const ref = db.collection("users").doc(user.uid);
    const snap = await ref.get();

    if (!snap.exists) {
      await ref.set({
        uid: user.uid,
        name: user.displayName || "User",
        phone: "",
        role: "customer",
        loginId: getEmailLoginId(user.email),
        email: user.email || "",
        phoneVerified: false,
        verificationStatus: "pending",
        blocked: false,
        referralCode: makeReferralCode(user.displayName || "RS"),
        invitedBy: "",
        country: $("countrySelect")?.value || "IN",
        currency: $("currencySelect")?.value || "INR",
        language: $("languageSelect")?.value || "en",
        photoUrl: user.photoURL || "",
        authProvider: providerName,
        settings: {
          country: $("countrySelect")?.value || "IN",
          currency: $("currencySelect")?.value || "INR",
          language: $("languageSelect")?.value || "en"
        },
        createdAt: nowServer(),
        updatedAt: nowServer()
      });
    }

    showToast("Login successful.");
    closeAuthModal();
  } catch (error) {
    if (String(error.message || "").includes("auth/unauthorized-domain")) {
      showToast("Add this domain in Firebase Authorized Domains.", "error");
    } else {
      showToast(error.message || "Social login failed.", "error");
    }
  }
}

async function logoutUser() {
  await auth.signOut();
  showToast("Logged out successfully.");
}

/* ---------------- Forgot Password ---------------- */
function openForgotModal() {
  closeAuthModal();
  $("forgotModal")?.classList.remove("hidden");
  $("overlay")?.classList.remove("hidden");
  document.body.classList.add("no-scroll");
}

function closeForgotModal() {
  $("forgotModal")?.classList.add("hidden");
  $("overlay")?.classList.add("hidden");
  document.body.classList.remove("no-scroll");
}

function changeResetMethod() {
  const method = $("resetMethod").value;
  const label = $("resetIdentityLabel");
  const input = $("resetIdentity");

  if (method === "phone") {
    label.textContent = "Registered Mobile Number";
    input.placeholder = "Enter registered mobile number";
  } else {
    label.textContent = "Registered Email";
    input.placeholder = "Enter registered email";
  }
}

async function requestResetOtp() {
  const method = $("resetMethod").value;
  const identity = $("resetIdentity").value.trim();
  const btn = $("sendOtpBtn");

  if (!identity) {
    showToast("Please enter your registered email or mobile number.", "error");
    return;
  }

  try {
    setButtonLoading(btn, "Sending OTP...", true);

    const res = await fetch("/api/request-reset-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ method, identity })
    });

    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("API is not returning JSON. Check Vercel API deployment.");
    }

    if (!res.ok) {
      throw new Error(data.error || data.message || "OTP send failed.");
    }

    $("resetOtpFields").classList.remove("hidden");
    showToast(data.message || "OTP sent successfully.");
  } catch (error) {
    showToast(`OTP Error: ${error.message}`, "error");
  } finally {
    setButtonLoading(btn, "", false);
  }
}

async function verifyResetOtp() {
  const method = $("resetMethod").value;
  const identity = $("resetIdentity").value.trim();
  const otp = $("resetOtp").value.trim();
  const newPassword = $("resetNewPassword").value;
  const confirmPassword = $("resetConfirmPassword").value;

  if (!identity || !otp || !newPassword || !confirmPassword) {
    showToast("Please fill all reset fields.", "error");
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast("New password and confirm password do not match.", "error");
    return;
  }

  if (newPassword.length < 6) {
    showToast("Password must be at least 6 characters.", "error");
    return;
  }

  try {
    const res = await fetch("/api/reset-password-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        method,
        identity,
        otp,
        newPassword
      })
    });

    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("API is not returning JSON. Check Vercel API deployment.");
    }

    if (!res.ok) {
      throw new Error(data.error || data.message || "Password reset failed.");
    }

    showToast("Password reset successful. Please login.");
    closeForgotModal();
    openAuthModal("login");
  } catch (error) {
    showToast(`Reset Error: ${error.message}`, "error");
  }
}

/* ---------------- Auth State ---------------- */
auth.onAuthStateChanged(async (user) => {
  currentUser = user || null;

  if (!user) {
    currentUserProfile = null;
    updateAuthUI();
    renderLoggedOutState();
    return;
  }

  try {
    const ref = db.collection("users").doc(user.uid);
    const snap = await ref.get();

    if (snap.exists) {
      currentUserProfile = snap.data();
    } else {
      currentUserProfile = {
        uid: user.uid,
        name: user.displayName || "User",
        phone: "",
        role: "customer",
        loginId: getEmailLoginId(user.email),
        email: user.email || "",
        referralCode: makeReferralCode(user.displayName || "RS"),
        createdAt: nowServer(),
        updatedAt: nowServer()
      };

      await ref.set(currentUserProfile, { merge: true });
    }

    updateAuthUI();
    applyUserSettingsToUI();
    loadDashboard();
    loadNotifications();
    loadPublicJobs();

    if (isAdminUser()) {
      $("admin")?.classList.remove("hidden");
      $("adminSideBtn")?.classList.remove("hidden");
      loadAdminPanel();
    }
  } catch (error) {
    showToast(error.message || "Profile loading failed.", "error");
  }
});

function updateAuthUI() {
  const loggedIn = !!currentUser;

  $("loginBtn")?.classList.toggle("hidden", loggedIn);
  $("signupBtn")?.classList.toggle("hidden", loggedIn);
  $("logoutBtn")?.classList.toggle("hidden", !loggedIn);

  if (isAdminUser()) {
    $("adminSideBtn")?.classList.remove("hidden");
  } else {
    $("adminSideBtn")?.classList.add("hidden");
    $("admin")?.classList.add("hidden");
  }
}

function renderLoggedOutState() {
  const userInfo = $("userInfoCard");
  if (userInfo) {
    userInfo.innerHTML = `<p class="muted">Login to view your dashboard.</p>`;
  }

  const dashboardContent = $("dashboardContent");
  if (dashboardContent) {
    dashboardContent.innerHTML = `<div class="empty-state">Please login to view bookings and bids.</div>`;
  }

  const notificationList = $("notificationList");
  if (notificationList) {
    notificationList.innerHTML = `<p class="muted">Login to view notifications.</p>`;
  }
}

/* ---------------- Init UI ---------------- */
document.addEventListener("DOMContentLoaded", async () => {
  await loadMinimumPrices();
  fillSkillDropdowns();
  renderServices();
  calculateMinimumPrice();
  loadPublicJobs();
  loadStats();

  $("countrySelect")?.addEventListener("change", syncHeaderSettings);
  $("currencySelect")?.addEventListener("change", syncHeaderSettings);
  $("languageSelect")?.addEventListener("change", syncHeaderSettings);
});

async function loadMinimumPrices() {
  try {
    const snap = await db.collection("platformSettings").doc("minimumPrices").get();

    if (snap.exists && snap.data().prices) {
      minimumPrices = {
        ...DEFAULT_MINIMUM_PRICES,
        ...snap.data().prices
      };
    }
  } catch {
    minimumPrices = { ...DEFAULT_MINIMUM_PRICES };
  }
}

function fillSkillDropdowns() {
  const selects = [
    $("bookingSkill"),
    $("workerSkill"),
    $("jobSkillFilter")
  ];

  selects.forEach((select) => {
    if (!select) return;

    const keepFirst = select.id === "jobSkillFilter";
    const firstOption = keepFirst ? `<option value="">All Skills</option>` : "";

    select.innerHTML = firstOption + SKILLS.map((skill) => {
      return `<option value="${escapeHtml(skill)}">${escapeHtml(skill)}</option>`;
    }).join("");
  });
}

function renderServices() {
  const grid = $("serviceGrid");
  if (!grid) return;

  grid.innerHTML = SKILLS.map((skill) => {
    const price = minimumPrices[skill] || DEFAULT_MINIMUM_PRICES[skill] || 200;
    const img = SERVICE_IMAGES[skill] || SERVICE_IMAGES["Freelancer / General Helper"];

    return `
      <article class="service-card">
        <div class="service-photo-wrap">
          <img
            src="${img}"
            alt="${escapeHtml(skill)}"
            onerror="this.style.display='none'; this.parentElement.classList.add('image-fallback');"
          />
        </div>
        <div class="service-body">
          <h3>${escapeHtml(skill)}</h3>
          <p>Find verified ${escapeHtml(skill.toLowerCase())} workers near your area.</p>
          <span class="price-chip">From ${formatMoney(price)}</span>
        </div>
      </article>
    `;
  }).join("");
}

async function loadStats() {
  try {
    const [workersSnap, jobsSnap, reviewsSnap] = await Promise.all([
      db.collection("workerPublic").limit(1000).get(),
      db.collection("bookings").limit(1000).get(),
      db.collection("reviews").limit(1000).get()
    ]);

    if ($("statWorkers")) $("statWorkers").textContent = workersSnap.size;
    if ($("statJobs")) $("statJobs").textContent = jobsSnap.size;
    if ($("statReviews")) $("statReviews").textContent = reviewsSnap.size;
  } catch {
    if ($("statWorkers")) $("statWorkers").textContent = "0";
    if ($("statJobs")) $("statJobs").textContent = "0";
    if ($("statReviews")) $("statReviews").textContent = "0";
  }
}

/* ---------------- Settings ---------------- */
function syncHeaderSettings() {
  calculateMinimumPrice();

  if ($("settingsCountry")) $("settingsCountry").value = $("countrySelect")?.value || "IN";
  if ($("settingsCurrency")) $("settingsCurrency").value = $("currencySelect")?.value || "INR";
  if ($("settingsLanguage")) $("settingsLanguage").value = $("languageSelect")?.value || "en";

  if (currentUser) {
    db.collection("users").doc(currentUser.uid).set({
      country: $("countrySelect")?.value || "IN",
      currency: $("currencySelect")?.value || "INR",
      language: $("languageSelect")?.value || "en",
      settings: {
        country: $("countrySelect")?.value || "IN",
        currency: $("currencySelect")?.value || "INR",
        language: $("languageSelect")?.value || "en"
      },
      updatedAt: nowServer()
    }, { merge: true }).catch(() => {});
  }
}

function applyUserSettingsToUI() {
  const settings = currentUserProfile?.settings || currentUserProfile || {};

  if ($("countrySelect") && settings.country) $("countrySelect").value = settings.country;
  if ($("currencySelect") && settings.currency) $("currencySelect").value = settings.currency;
  if ($("languageSelect") && settings.language) $("languageSelect").value = settings.language;

  if ($("settingsCountry")) $("settingsCountry").value = $("countrySelect")?.value || "IN";
  if ($("settingsCurrency")) $("settingsCurrency").value = $("currencySelect")?.value || "INR";
  if ($("settingsLanguage")) $("settingsLanguage").value = $("languageSelect")?.value || "en";
}

async function saveSettings() {
  const country = $("settingsCountry")?.value || "IN";
  const currency = $("settingsCurrency")?.value || "INR";
  const language = $("settingsLanguage")?.value || "en";

  if ($("countrySelect")) $("countrySelect").value = country;
  if ($("currencySelect")) $("currencySelect").value = currency;
  if ($("languageSelect")) $("languageSelect").value = language;

  if (!currentUser) {
    showToast("Settings saved on this device.");
    return;
  }

  await db.collection("users").doc(currentUser.uid).set({
    country,
    currency,
    language,
    settings: { country, currency, language },
    updatedAt: nowServer()
  }, { merge: true });

  currentUserProfile = {
    ...currentUserProfile,
    country,
    currency,
    language,
    settings: { country, currency, language }
  };

  showToast("Settings saved.");
}

/* ---------------- Price Calculator ---------------- */
function calculateMinimumPrice() {
  const skill = $("bookingSkill")?.value || SKILLS[0];
  const type = $("bookingType")?.value || "Freelancer";
  const base = Number(minimumPrices[skill] || DEFAULT_MINIMUM_PRICES[skill] || 200);
  const multiplier = Number(WORK_TYPE_MULTIPLIER[type] || 1);
  const amount = Math.round(base * multiplier);

  if ($("minimumPrice")) {
    $("minimumPrice").value = `${formatMoney(amount)} suggested minimum`;
  }

  return amount;
}

/* ---------------- Booking ---------------- */
async function createBooking(event) {
  event.preventDefault();

  if (!currentUser) {
    showToast("Please login before posting work.", "error");
    openAuthModal("login");
    return;
  }

  const name = $("customerName").value.trim();
  const phone = $("customerPhone").value.trim();
  const skill = $("bookingSkill").value;
  const type = $("bookingType").value;
  const city = $("bookingCity").value.trim();
  const area = $("bookingArea").value.trim();
  const budget = Number($("bookingBudget").value);
  const address = $("bookingAddress").value.trim();
  const details = $("bookingDetails").value.trim();
  const minPrice = calculateMinimumPrice();

  if (!name || !phone || !skill || !city || !area || !budget || !address || !details) {
    showToast("Please fill all booking fields.", "error");
    return;
  }

  try {
    const bookingRef = await db.collection("bookings").add({
      customerId: currentUser.uid,
      customerName: name,
      customerPhone: phone,
      customerEmail: currentUser.email || "",
      skill,
      workType: type,
      city,
      cityLower: city.toLowerCase(),
      area,
      budget,
      minimumPrice: minPrice,
      address,
      details,
      currency: getSelectedCurrency(),
      bookingStatus: "open",
      paymentStatus: "unpaid",
      jobProgress: "posted",
      biddingOpen: true,
      acceptedBid: null,
      assignedWorkerId: "",
      assignedWorkerName: "",
      workerCanSeeContact: false,
      reviewGiven: false,
      createdAt: nowServer(),
      updatedAt: nowServer()
    });

    await db.collection("publicJobs").doc(bookingRef.id).set({
      bookingId: bookingRef.id,
      customerId: currentUser.uid,
      skill,
      workType: type,
      city,
      cityLower: city.toLowerCase(),
      area,
      budget,
      minimumPrice: minPrice,
      currency: getSelectedCurrency(),
      details,
      biddingOpen: true,
      bookingStatus: "open",
      createdAt: nowServer(),
      updatedAt: nowServer()
    });

    await createNotification(currentUser.uid, "Work posted", `Your ${skill} work has been posted.`);

    $("bookingForm").reset();
    calculateMinimumPrice();

    showToast("Work posted successfully. Workers can now bid.");
    loadPublicJobs();
    loadDashboard();
    loadStats();
    goToSection("dashboard");
  } catch (error) {
    showToast(error.message || "Booking failed.", "error");
  }
}

/* ---------------- Worker Registration ---------------- */
async function registerWorker(event) {
  event.preventDefault();

  if (!currentUser) {
    showToast("Please login before worker registration.", "error");
    openAuthModal("login");
    return;
  }

  const workerName = $("workerName").value.trim();
  const workerPhone = $("workerPhone").value.trim();
  const workerSkill = $("workerSkill").value;
  const workerType = $("workerType").value;
  const workerCity = $("workerCity").value.trim();
  const availability = $("workerAvailability").value;
  const workerAbout = $("workerAbout").value.trim();

  if (!workerName || !workerPhone || !workerSkill || !workerCity || !workerAbout) {
    showToast("Please fill all worker fields.", "error");
    return;
  }

  try {
    const privateData = {
      uid: currentUser.uid,
      workerName,
      workerPhone,
      workerSkill,
      workerType,
      workerAbout,
      workerCity,
      workerCityLower: workerCity.toLowerCase(),
      workerCountry: $("countrySelect")?.value || "IN",
      availability,
      available: availability !== "Not Available",
      verified: false,
      verificationStatus: "pending",
      workerRating: 0,
      totalReviews: 0,
      totalJobs: 0,
      updatedAt: nowServer(),
      createdAt: nowServer()
    };

    const publicData = {
      uid: currentUser.uid,
      workerName,
      workerSkill,
      workerType,
      workerAbout,
      workerCity,
      workerCityLower: workerCity.toLowerCase(),
      workerCountry: $("countrySelect")?.value || "IN",
      availability,
      available: availability !== "Not Available",
      verified: false,
      verificationStatus: "pending",
      workerRating: 0,
      totalReviews: 0,
      totalJobs: 0,
      updatedAt: nowServer(),
      createdAt: nowServer()
    };

    const existingWorker = await db.collection("workers").doc(currentUser.uid).get();

    if (existingWorker.exists) {
      delete privateData.createdAt;
      delete publicData.createdAt;
    }

    await db.collection("workers").doc(currentUser.uid).set(privateData, { merge: true });
    await db.collection("workerPublic").doc(currentUser.uid).set(publicData, { merge: true });

    await db.collection("users").doc(currentUser.uid).set({
      role: "worker",
      phone: workerPhone,
      city: workerCity,
      updatedAt: nowServer()
    }, { merge: true });

    await createNotification(currentUser.uid, "Worker profile saved", "Your worker profile is now visible to customers.");

    showToast("Worker profile saved successfully.");
    loadDashboard();
    loadStats();
  } catch (error) {
    showToast(error.message || "Worker registration failed.", "error");
  }
}

/* ---------------- Public Jobs and Bids ---------------- */
async function loadPublicJobs() {
  const list = $("jobsList");
  if (!list) return;

  try {
    list.innerHTML = `<div class="empty-state">Loading jobs...</div>`;

    let query = db.collection("publicJobs")
      .where("biddingOpen", "==", true)
      .limit(50);

    const snap = await query.get();

    allPublicJobsCache = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    renderPublicJobs();
  } catch (error) {
    list.innerHTML = `<div class="empty-state">Login may be required to view jobs. ${escapeHtml(error.message)}</div>`;
  }
}

function renderPublicJobs() {
  const list = $("jobsList");
  if (!list) return;

  const search = ($("jobSearch")?.value || "").toLowerCase().trim();
  const skillFilter = $("jobSkillFilter")?.value || "";

  let jobs = [...allPublicJobsCache];

  if (skillFilter) {
    jobs = jobs.filter((job) => job.skill === skillFilter);
  }

  if (search) {
    jobs = jobs.filter((job) => {
      const text = `${job.skill} ${job.city} ${job.area} ${job.details} ${job.workType}`.toLowerCase();
      return text.includes(search);
    });
  }

  jobs.sort((a, b) => {
    const at = a.createdAt?.seconds || 0;
    const bt = b.createdAt?.seconds || 0;
    return bt - at;
  });

  if (!jobs.length) {
    list.innerHTML = `<div class="empty-state">No open jobs found.</div>`;
    return;
  }

  list.innerHTML = jobs.map((job) => {
    return `
      <article class="data-card">
        <span class="status open">Open for Bids</span>
        <h3>${escapeHtml(job.skill)} - ${escapeHtml(job.workType)}</h3>
        <p><strong>City:</strong> ${escapeHtml(job.city)}, ${escapeHtml(job.area)}</p>
        <p><strong>Budget:</strong> ${formatMoney(job.budget, job.currency)}</p>
        <p><strong>Minimum:</strong> ${formatMoney(job.minimumPrice, job.currency)}</p>
        <p>${escapeHtml(job.details)}</p>

        <div class="card-actions">
          <button class="btn primary" onclick="openBidPrompt('${job.bookingId}')">Send Bid</button>
        </div>
      </article>
    `;
  }).join("");
}

async function openBidPrompt(bookingId) {
  if (!currentUser) {
    showToast("Please login as worker to bid.", "error");
    openAuthModal("login");
    return;
  }

  try {
    const workerSnap = await db.collection("workers").doc(currentUser.uid).get();

    if (!workerSnap.exists) {
      showToast("Please register as worker before bidding.", "error");
      goToSection("worker");
      return;
    }

    const amount = prompt("Enter your bid amount:");
    if (!amount) return;

    const bidAmount = Number(amount);
    if (!bidAmount || bidAmount <= 0) {
      showToast("Please enter a valid bid amount.", "error");
      return;
    }

    const message = prompt("Enter message for customer:", "I can complete this work professionally.");
    if (message === null) return;

    await sendBid(bookingId, bidAmount, message);
  } catch (error) {
    showToast(error.message || "Bid failed.", "error");
  }
}

async function sendBid(bookingId, bidAmount, message) {
  const workerSnap = await db.collection("workers").doc(currentUser.uid).get();
  const worker = workerSnap.data();

  const bookingSnap = await db.collection("bookings").doc(bookingId).get();
  if (!bookingSnap.exists) {
    showToast("Booking not found.", "error");
    return;
  }

  const booking = bookingSnap.data();

  if (booking.customerId === currentUser.uid) {
    showToast("You cannot bid on your own job.", "error");
    return;
  }

  const oldBidSnap = await db.collection("bids")
    .where("bookingId", "==", bookingId)
    .where("workerUserId", "==", currentUser.uid)
    .limit(1)
    .get();

  if (!oldBidSnap.empty) {
    showToast("You already sent a bid for this job.", "warning");
    return;
  }

  await db.collection("bids").add({
    bookingId,
    customerId: booking.customerId,
    workerUserId: currentUser.uid,
    workerName: worker.workerName,
    workerSkill: worker.workerSkill,
    workerType: worker.workerType,
    workerCity: worker.workerCity,
    workerRating: worker.workerRating || 0,
    totalReviews: worker.totalReviews || 0,
    bidAmount,
    message,
    status: "pending",
    createdAt: nowServer(),
    updatedAt: nowServer()
  });

  await createNotification(booking.customerId, "New worker bid", `${worker.workerName} sent a bid of ${formatMoney(bidAmount, booking.currency)}.`);

  showToast("Bid sent successfully.");
  loadDashboard();
}

/* ---------------- Dashboard ---------------- */
function setDashboardTab(tab) {
  currentDashboardTab = tab;

  document.querySelectorAll("#dashboard .dash-tabs .tab").forEach((btn) => {
    btn.classList.remove("active");
  });

  const buttons = document.querySelectorAll("#dashboard .dash-tabs .tab");
  if (tab === "bookings") buttons[0]?.classList.add("active");
  if (tab === "bids") buttons[1]?.classList.add("active");
  if (tab === "profile") buttons[2]?.classList.add("active");

  loadDashboard();
}

async function loadDashboard() {
  const userInfo = $("userInfoCard");
  const content = $("dashboardContent");

  if (!userInfo || !content) return;

  if (!currentUser) {
    renderLoggedOutState();
    return;
  }

  userInfo.innerHTML = `
    <h3>${escapeHtml(currentUserProfile?.name || currentUser.displayName || "User")}</h3>
    <p><strong>Email:</strong> ${escapeHtml(currentUser.email || "")}</p>
    <p><strong>Role:</strong> ${escapeHtml(currentUserProfile?.role || "customer")}</p>
    <p><strong>Referral Code:</strong> ${escapeHtml(currentUserProfile?.referralCode || "-")}</p>
  `;

  if (currentDashboardTab === "bookings") {
    await loadMyBookings();
  } else if (currentDashboardTab === "bids") {
    await loadMyBids();
  } else {
    await loadMyWorkerProfile();
  }
}

async function loadMyBookings() {
  const content = $("dashboardContent");
  if (!content || !currentUser) return;

  content.innerHTML = `<div class="empty-state">Loading bookings...</div>`;

  try {
    const snap = await db.collection("bookings")
      .where("customerId", "==", currentUser.uid)
      .limit(50)
      .get();

    const bookings = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    if (!bookings.length) {
      content.innerHTML = `<div class="empty-state">No bookings yet.</div>`;
      return;
    }

    const cards = [];

    for (const booking of bookings) {
      const bidsSnap = await db.collection("bids")
        .where("bookingId", "==", booking.id)
        .limit(20)
        .get();

      const bids = bidsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      cards.push(renderBookingCard(booking, bids));
    }

    content.innerHTML = `<div class="card-grid">${cards.join("")}</div>`;
  } catch (error) {
    content.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

function renderBookingCard(booking, bids = []) {
  const accepted = booking.acceptedBid || null;

  const bidsHtml = bids.length ? bids.map((bid) => {
    return `
      <div class="bid-box">
        <strong>${escapeHtml(bid.workerName)}</strong>
        <p>${escapeHtml(bid.workerSkill)} • ${escapeHtml(bid.workerCity)}</p>
        <p><strong>Bid:</strong> ${formatMoney(bid.bidAmount, booking.currency)}</p>
        <p>${escapeHtml(bid.message)}</p>
        <p><span class="status ${bid.status === "accepted" ? "success" : "pending"}">${escapeHtml(bid.status)}</span></p>
        ${booking.bookingStatus === "open" ? `
          <button class="btn success" onclick="acceptBid('${booking.id}', '${bid.id}')">Accept Bid</button>
        ` : ""}
      </div>
    `;
  }).join("") : `<p class="muted">No bids yet.</p>`;

  return `
    <article class="data-card">
      <span class="status ${booking.bookingStatus === "open" ? "open" : "pending"}">${escapeHtml(booking.bookingStatus)}</span>
      <h3>${escapeHtml(booking.skill)} - ${escapeHtml(booking.workType)}</h3>
      <p><strong>City:</strong> ${escapeHtml(booking.city)}, ${escapeHtml(booking.area)}</p>
      <p><strong>Budget:</strong> ${formatMoney(booking.budget, booking.currency)}</p>
      <p>${escapeHtml(booking.details)}</p>

      <div class="timeline">
        ${timelineRow("Posted", true)}
        ${timelineRow("Worker accepted", !!accepted)}
        ${timelineRow("Payment verified", booking.paymentStatus === "paid")}
        ${timelineRow("Contact unlocked", !!booking.workerCanSeeContact)}
        ${timelineRow("Completed", booking.bookingStatus === "completed")}
      </div>

      ${accepted ? `
        <div class="bid-box">
          <strong>Accepted Worker: ${escapeHtml(accepted.workerName)}</strong>
          <p>Final Amount: ${formatMoney(accepted.bidAmount, booking.currency)}</p>
          ${booking.paymentStatus !== "paid" ? `
            <button class="btn primary" onclick="payForBooking('${booking.id}')">Pay Now</button>
          ` : `
            <span class="status success">Payment Paid</span>
          `}
          ${booking.bookingStatus !== "completed" ? `
            <button class="btn success" onclick="markBookingComplete('${booking.id}')">Mark Completed</button>
          ` : ""}
          ${booking.bookingStatus === "completed" && !booking.reviewGiven ? `
            <button class="btn primary" onclick="reviewWorker('${booking.id}', '${accepted.workerUserId}')">Give Review</button>
          ` : ""}
        </div>
      ` : `
        <h4>Worker Bids</h4>
        ${bidsHtml}
      `}
    </article>
  `;
}

function timelineRow(label, done) {
  return `
    <div class="timeline-item">
      <span class="timeline-dot ${done ? "done" : ""}"></span>
      <span>${escapeHtml(label)}</span>
    </div>
  `;
}

async function acceptBid(bookingId, bidId) {
  try {
    const bidSnap = await db.collection("bids").doc(bidId).get();
    if (!bidSnap.exists) {
      showToast("Bid not found.", "error");
      return;
    }

    const bid = bidSnap.data();

    await db.collection("bookings").doc(bookingId).set({
      acceptedBid: {
        bidId,
        workerUserId: bid.workerUserId,
        workerName: bid.workerName,
        workerSkill: bid.workerSkill,
        bidAmount: bid.bidAmount,
        message: bid.message
      },
      assignedWorkerId: bid.workerUserId,
      assignedWorkerName: bid.workerName,
      bookingStatus: "accepted",
      biddingOpen: false,
      jobProgress: "accepted",
      updatedAt: nowServer()
    }, { merge: true });

    await db.collection("publicJobs").doc(bookingId).set({
      biddingOpen: false,
      bookingStatus: "accepted",
      updatedAt: nowServer()
    }, { merge: true });

    await db.collection("bids").doc(bidId).set({
      status: "accepted",
      updatedAt: nowServer()
    }, { merge: true });

    await createNotification(bid.workerUserId, "Bid accepted", "Your bid was accepted. Payment/contact unlock will happen next.");

    showToast("Bid accepted. Customer can now pay.");
    loadDashboard();
    loadPublicJobs();
  } catch (error) {
    showToast(error.message || "Accept bid failed.", "error");
  }
}

async function payForBooking(bookingId) {
  if (!currentUser) return;

  try {
    const token = await currentUser.getIdToken();

    const orderRes = await fetch("/api/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ bookingId })
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      throw new Error(orderData.error || "Payment order failed.");
    }

    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency || "INR",
      name: "RapideService",
      description: "Service booking payment",
      order_id: orderData.orderId,
      handler: async function (response) {
        const verifyRes = await fetch("/api/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            bookingId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          })
        });

        const verifyData = await verifyRes.json();

        if (!verifyRes.ok) {
          throw new Error(verifyData.error || "Payment verification failed.");
        }

        showToast("Payment verified. Contact unlocked.");
        loadDashboard();
      },
      prefill: {
        name: currentUserProfile?.name || "",
        email: currentUser.email || "",
        contact: currentUserProfile?.phone || ""
      },
      theme: {
        color: "#2563eb"
      }
    };

    const razorpay = new Razorpay(options);
    razorpay.open();
  } catch (error) {
    showToast(error.message || "Payment failed.", "error");
  }
}

async function markBookingComplete(bookingId) {
  try {
    const snap = await db.collection("bookings").doc(bookingId).get();
    if (!snap.exists) return;

    const booking = snap.data();

    await db.collection("bookings").doc(bookingId).set({
      bookingStatus: "completed",
      jobProgress: "completed",
      updatedAt: nowServer()
    }, { merge: true });

    if (booking.assignedWorkerId) {
      await db.collection("workers").doc(booking.assignedWorkerId).set({
        totalJobs: firebase.firestore.FieldValue.increment(1),
        updatedAt: nowServer()
      }, { merge: true });

      await db.collection("workerPublic").doc(booking.assignedWorkerId).set({
        totalJobs: firebase.firestore.FieldValue.increment(1),
        updatedAt: nowServer()
      }, { merge: true });

      await createNotification(booking.assignedWorkerId, "Job completed", "Customer marked your job as completed.");
    }

    showToast("Booking marked completed.");
    loadDashboard();
  } catch (error) {
    showToast(error.message || "Completion failed.", "error");
  }
}

async function reviewWorker(bookingId, workerUserId) {
  const ratingValue = prompt("Give rating 1 to 5:");
  if (!ratingValue) return;

  const rating = Number(ratingValue);
  if (!rating || rating < 1 || rating > 5) {
    showToast("Rating must be between 1 and 5.", "error");
    return;
  }

  const reviewText = prompt("Write review:", "Good service.");
  if (reviewText === null) return;

  try {
    await db.collection("reviews").add({
      bookingId,
      workerUserId,
      customerId: currentUser.uid,
      customerName: currentUserProfile?.name || "Customer",
      rating,
      reviewText,
      createdAt: nowServer()
    });

    await db.collection("bookings").doc(bookingId).set({
      reviewGiven: true,
      updatedAt: nowServer()
    }, { merge: true });

    await recalculateWorkerRating(workerUserId);
    await createNotification(workerUserId, "New review received", `You received ${rating} star rating.`);

    showToast("Review submitted.");
    loadDashboard();
    loadStats();
  } catch (error) {
    showToast(error.message || "Review failed.", "error");
  }
}

async function recalculateWorkerRating(workerUserId) {
  const snap = await db.collection("reviews")
    .where("workerUserId", "==", workerUserId)
    .limit(200)
    .get();

  let total = 0;
  snap.forEach((doc) => {
    total += Number(doc.data().rating || 0);
  });

  const count = snap.size;
  const avg = count ? Number((total / count).toFixed(1)) : 0;

  await db.collection("workers").doc(workerUserId).set({
    workerRating: avg,
    totalReviews: count,
    updatedAt: nowServer()
  }, { merge: true });

  await db.collection("workerPublic").doc(workerUserId).set({
    workerRating: avg,
    totalReviews: count,
    updatedAt: nowServer()
  }, { merge: true });
}

async function loadMyBids() {
  const content = $("dashboardContent");
  if (!content || !currentUser) return;

  content.innerHTML = `<div class="empty-state">Loading bids...</div>`;

  try {
    const snap = await db.collection("bids")
      .where("workerUserId", "==", currentUser.uid)
      .limit(50)
      .get();

    const bids = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    if (!bids.length) {
      content.innerHTML = `<div class="empty-state">No bids sent yet.</div>`;
      return;
    }

    content.innerHTML = `
      <div class="card-grid">
        ${bids.map((bid) => `
          <article class="data-card">
            <span class="status ${bid.status === "accepted" ? "success" : "pending"}">${escapeHtml(bid.status)}</span>
            <h3>${escapeHtml(bid.workerSkill)}</h3>
            <p><strong>Bid Amount:</strong> ${formatMoney(bid.bidAmount)}</p>
            <p>${escapeHtml(bid.message)}</p>
            <p><strong>Booking ID:</strong> ${escapeHtml(bid.bookingId)}</p>
          </article>
        `).join("")}
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

async function loadMyWorkerProfile() {
  const content = $("dashboardContent");
  if (!content || !currentUser) return;

  content.innerHTML = `<div class="empty-state">Loading worker profile...</div>`;

  try {
    const snap = await db.collection("workers").doc(currentUser.uid).get();

    if (!snap.exists) {
      content.innerHTML = `
        <div class="empty-state">
          You have not registered as worker yet.
          <br><br>
          <button class="btn primary" onclick="goToSection('worker')">Register Worker Profile</button>
        </div>
      `;
      return;
    }

    const worker = snap.data();

    content.innerHTML = `
      <div class="worker-profile-card">
        <div class="avatar">${escapeHtml((worker.workerName || "R").charAt(0).toUpperCase())}</div>
        <h3>${escapeHtml(worker.workerName)}</h3>
        <p><strong>Skill:</strong> ${escapeHtml(worker.workerSkill)}</p>
        <p><strong>Type:</strong> ${escapeHtml(worker.workerType)}</p>
        <p><strong>City:</strong> ${escapeHtml(worker.workerCity)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(worker.workerPhone)}</p>
        <p><strong>Availability:</strong> ${escapeHtml(worker.availability)}</p>
        <p><strong>Verification:</strong> <span class="status ${worker.verified ? "success" : "pending"}">${worker.verified ? "Verified" : "Pending"}</span></p>
        <p><strong>Rating:</strong> <span class="rating">★ ${worker.workerRating || 0}</span> (${worker.totalReviews || 0} reviews)</p>
        <p>${escapeHtml(worker.workerAbout)}</p>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

/* ---------------- Support ---------------- */
async function createSupportTicket(event) {
  event.preventDefault();

  const name = $("supportName").value.trim();
  const contact = $("supportContact").value.trim();
  const type = $("supportType").value;
  const message = $("supportMessage").value.trim();

  if (!name || !contact || !message) {
    showToast("Please fill all support fields.", "error");
    return;
  }

  try {
    await db.collection("supportTickets").add({
      userId: currentUser?.uid || "",
      name,
      contact,
      type,
      message,
      status: "open",
      adminReply: "",
      createdAt: nowServer(),
      updatedAt: nowServer()
    });

    $("supportForm").reset();
    showToast("Support ticket submitted.");
  } catch (error) {
    showToast(error.message || "Support ticket failed.", "error");
  }
}

/* ---------------- Notifications ---------------- */
async function createNotification(toUserId, title, message) {
  if (!toUserId) return;

  try {
    await db.collection("notifications").add({
      toUserId,
      title,
      message,
      read: false,
      createdAt: nowServer()
    });
  } catch {
    // silent
  }
}

async function loadNotifications() {
  const list = $("notificationList");
  if (!list) return;

  if (!currentUser) {
    list.innerHTML = `<p class="muted">Login to view notifications.</p>`;
    return;
  }

  try {
    const snap = await db.collection("notifications")
      .where("toUserId", "==", currentUser.uid)
      .limit(30)
      .get();

    const notifications = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    if (!notifications.length) {
      list.innerHTML = `<p class="muted">No notifications yet.</p>`;
      return;
    }

    list.innerHTML = notifications.map((item) => `
      <div class="notification-item">
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.message)}</p>
      </div>
    `).join("");
  } catch (error) {
    list.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
  }
}

/* ---------------- Admin Panel ---------------- */
function setAdminTab(tab) {
  currentAdminTab = tab;

  document.querySelectorAll("#admin .dash-tabs .tab").forEach((btn) => {
    btn.classList.remove("active");
  });

  const buttons = document.querySelectorAll("#admin .dash-tabs .tab");
  if (tab === "workers") buttons[0]?.classList.add("active");
  if (tab === "bookings") buttons[1]?.classList.add("active");
  if (tab === "support") buttons[2]?.classList.add("active");
  if (tab === "prices") buttons[3]?.classList.add("active");

  loadAdminPanel();
}

async function loadAdminPanel() {
  if (!currentUser || !isAdminUser()) return;

  const content = $("adminContent");
  if (!content) return;

  await loadAdminStats();

  if (currentAdminTab === "workers") {
    await loadAdminWorkers();
  } else if (currentAdminTab === "bookings") {
    await loadAdminBookings();
  } else if (currentAdminTab === "support") {
    await loadAdminSupport();
  } else {
    renderAdminPrices();
  }
}

async function loadAdminStats() {
  try {
    const [users, workers, bookings, payments] = await Promise.all([
      db.collection("users").limit(1000).get(),
      db.collection("workers").limit(1000).get(),
      db.collection("bookings").limit(1000).get(),
      db.collection("payments").limit(1000).get()
    ]);

    if ($("adminUsers")) $("adminUsers").textContent = users.size;
    if ($("adminWorkers")) $("adminWorkers").textContent = workers.size;
    if ($("adminBookings")) $("adminBookings").textContent = bookings.size;
    if ($("adminPayments")) $("adminPayments").textContent = payments.size;
  } catch {
    // silent
  }
}

async function loadAdminWorkers() {
  const content = $("adminContent");
  content.innerHTML = `<div class="empty-state">Loading workers...</div>`;

  try {
    const snap = await db.collection("workers").limit(100).get();
    const workers = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    if (!workers.length) {
      content.innerHTML = `<div class="empty-state">No workers found.</div>`;
      return;
    }

    content.innerHTML = `
      <div class="card-grid">
        ${workers.map((worker) => `
          <article class="data-card">
            <span class="status ${worker.verified ? "success" : "pending"}">${worker.verified ? "Verified" : "Pending"}</span>
            <h3>${escapeHtml(worker.workerName)}</h3>
            <p><strong>Skill:</strong> ${escapeHtml(worker.workerSkill)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(worker.workerPhone)}</p>
            <p><strong>City:</strong> ${escapeHtml(worker.workerCity)}</p>
            <p>${escapeHtml(worker.workerAbout)}</p>
            <div class="card-actions">
              <button class="btn success" onclick="adminVerifyWorker('${worker.id}', true)">Verify</button>
              <button class="btn danger" onclick="adminVerifyWorker('${worker.id}', false)">Unverify</button>
            </div>
          </article>
        `).join("")}
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

async function adminVerifyWorker(workerId, verified) {
  if (!isAdminUser()) return;

  try {
    await db.collection("workers").doc(workerId).set({
      verified,
      verificationStatus: verified ? "verified" : "pending",
      updatedAt: nowServer()
    }, { merge: true });

    await db.collection("workerPublic").doc(workerId).set({
      verified,
      verificationStatus: verified ? "verified" : "pending",
      updatedAt: nowServer()
    }, { merge: true });

    await createNotification(workerId, "Worker verification updated", verified ? "Your worker profile is verified." : "Your worker profile verification was removed.");

    showToast(verified ? "Worker verified." : "Worker unverified.");
    loadAdminPanel();
  } catch (error) {
    showToast(error.message || "Worker update failed.", "error");
  }
}

async function loadAdminBookings() {
  const content = $("adminContent");
  content.innerHTML = `<div class="empty-state">Loading bookings...</div>`;

  try {
    const snap = await db.collection("bookings").limit(100).get();
    const bookings = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    if (!bookings.length) {
      content.innerHTML = `<div class="empty-state">No bookings found.</div>`;
      return;
    }

    content.innerHTML = `
      <div class="card-grid">
        ${bookings.map((booking) => `
          <article class="data-card">
            <span class="status">${escapeHtml(booking.bookingStatus)}</span>
            <h3>${escapeHtml(booking.skill)} - ${escapeHtml(booking.workType)}</h3>
            <p><strong>Customer:</strong> ${escapeHtml(booking.customerName)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(booking.customerPhone)}</p>
            <p><strong>City:</strong> ${escapeHtml(booking.city)}</p>
            <p><strong>Budget:</strong> ${formatMoney(booking.budget, booking.currency)}</p>
            <p><strong>Payment:</strong> ${escapeHtml(booking.paymentStatus)}</p>
            <p>${escapeHtml(booking.details)}</p>
          </article>
        `).join("")}
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

async function loadAdminSupport() {
  const content = $("adminContent");
  content.innerHTML = `<div class="empty-state">Loading support tickets...</div>`;

  try {
    const snap = await db.collection("supportTickets").limit(100).get();
    const tickets = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    if (!tickets.length) {
      content.innerHTML = `<div class="empty-state">No support tickets.</div>`;
      return;
    }

    content.innerHTML = `
      <div class="card-grid">
        ${tickets.map((ticket) => `
          <article class="data-card">
            <span class="status ${ticket.status === "closed" ? "success" : "pending"}">${escapeHtml(ticket.status)}</span>
            <h3>${escapeHtml(ticket.type)}</h3>
            <p><strong>Name:</strong> ${escapeHtml(ticket.name)}</p>
            <p><strong>Contact:</strong> ${escapeHtml(ticket.contact)}</p>
            <p>${escapeHtml(ticket.message)}</p>
            ${ticket.adminReply ? `<p><strong>Admin Reply:</strong> ${escapeHtml(ticket.adminReply)}</p>` : ""}
            <div class="card-actions">
              <button class="btn primary" onclick="adminReplyTicket('${ticket.id}')">Reply</button>
              <button class="btn success" onclick="adminCloseTicket('${ticket.id}')">Close</button>
            </div>
          </article>
        `).join("")}
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

async function adminReplyTicket(ticketId) {
  const reply = prompt("Enter support reply:");
  if (!reply) return;

  try {
    const snap = await db.collection("supportTickets").doc(ticketId).get();
    const ticket = snap.data();

    await db.collection("supportTickets").doc(ticketId).set({
      adminReply: reply,
      status: "replied",
      updatedAt: nowServer()
    }, { merge: true });

    if (ticket.userId) {
      await createNotification(ticket.userId, "Support replied", reply);
    }

    showToast("Reply saved.");
    loadAdminPanel();
  } catch (error) {
    showToast(error.message || "Reply failed.", "error");
  }
}

async function adminCloseTicket(ticketId) {
  try {
    await db.collection("supportTickets").doc(ticketId).set({
      status: "closed",
      updatedAt: nowServer()
    }, { merge: true });

    showToast("Ticket closed.");
    loadAdminPanel();
  } catch (error) {
    showToast(error.message || "Close failed.", "error");
  }
}

function renderAdminPrices() {
  const content = $("adminContent");
  if (!content) return;

  content.innerHTML = `
    <div class="form-card">
      <h3>Minimum Price Manager</h3>
      <p class="muted">Update suggested minimum prices for each skill.</p>

      <div id="priceRows">
        ${SKILLS.map((skill) => `
          <div class="price-row">
            <strong>${escapeHtml(skill)}</strong>
            <input id="price_${skill.replaceAll(" ", "_").replaceAll("/", "_")}" type="number" min="1" value="${minimumPrices[skill] || DEFAULT_MINIMUM_PRICES[skill]}" />
            <span>${getSelectedCurrency()}</span>
          </div>
        `).join("")}
      </div>

      <button class="btn primary full" onclick="adminSavePrices()">Save Prices</button>
    </div>
  `;
}

async function adminSavePrices() {
  if (!isAdminUser()) return;

  const prices = {};

  SKILLS.forEach((skill) => {
    const inputId = `price_${skill.replaceAll(" ", "_").replaceAll("/", "_")}`;
    prices[skill] = Number($(inputId)?.value || DEFAULT_MINIMUM_PRICES[skill] || 200);
  });

  try {
    await db.collection("platformSettings").doc("minimumPrices").set({
      prices,
      updatedAt: nowServer(),
      updatedBy: currentUser.uid
    }, { merge: true });

    minimumPrices = {
      ...DEFAULT_MINIMUM_PRICES,
      ...prices
    };

    renderServices();
    calculateMinimumPrice();

    showToast("Minimum prices saved.");
  } catch (error) {
    showToast(error.message || "Price save failed.", "error");
  }
}

/* ---------------- Make functions global ---------------- */
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleNotificationDrawer = toggleNotificationDrawer;
window.closeNotificationDrawer = closeNotificationDrawer;

window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.setAuthMode = setAuthMode;
window.handleAuth = handleAuth;
window.socialLogin = socialLogin;
window.logoutUser = logoutUser;

window.openForgotModal = openForgotModal;
window.closeForgotModal = closeForgotModal;
window.changeResetMethod = changeResetMethod;
window.requestResetOtp = requestResetOtp;
window.verifyResetOtp = verifyResetOtp;

window.goToSection = goToSection;
window.openSettingsSection = openSettingsSection;
window.saveSettings = saveSettings;

window.calculateMinimumPrice = calculateMinimumPrice;
window.createBooking = createBooking;
window.registerWorker = registerWorker;
window.loadPublicJobs = loadPublicJobs;
window.openBidPrompt = openBidPrompt;

window.setDashboardTab = setDashboardTab;
window.acceptBid = acceptBid;
window.payForBooking = payForBooking;
window.markBookingComplete = markBookingComplete;
window.reviewWorker = reviewWorker;

window.createSupportTicket = createSupportTicket;

window.setAdminTab = setAdminTab;
window.adminVerifyWorker = adminVerifyWorker;
window.adminReplyTicket = adminReplyTicket;
window.adminCloseTicket = adminCloseTicket;
window.adminSavePrices = adminSavePrices;
