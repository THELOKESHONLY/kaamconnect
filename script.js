/* =====================================================
   RapideService Clean Final JavaScript
   Fixed:
   - Login/Signup/Menu/Notification buttons
   - Skills dropdown
   - Booking/Worker/Jobs/Dashboard hidden before login
   - Firebase/Auth/Firestore flow
===================================================== */

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

const ADMIN_EMAILS = ["lokeshyadav4399@gmail.com"];
const ADMIN_LOGIN_IDS = ["thelokeshonly"];

let currentUser = null;
let currentUserProfile = null;
let currentAuthMode = "login";
let currentDashboardTab = "bookings";
let currentAdminTab = "workers";
let allPublicJobsCache = [];

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

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function nowServer() {
  return firebase.firestore.FieldValue.serverTimestamp();
}

function getEmailLoginId(email) {
  return String(email || "").split("@")[0].toLowerCase().trim();
}

function makeReferralCode(name = "RS") {
  const clean = String(name || "RS").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5);
  return `${clean}${Math.floor(10000 + Math.random() * 90000)}`;
}

function currencySymbol(currency = "INR") {
  if (currency === "USD") return "$";
  if (currency === "GBP") return "£";
  if (currency === "AED") return "AED ";
  return "₹";
}

function getSelectedCurrency() {
  return $("sideCurrencySelect")?.value || $("settingsCurrency")?.value || currentUserProfile?.currency || "INR";
}

function getSelectedCountry() {
  return $("sideCountrySelect")?.value || $("settingsCountry")?.value || currentUserProfile?.country || "IN";
}

function getSelectedLanguage() {
  return $("sideLanguageSelect")?.value || $("settingsLanguage")?.value || currentUserProfile?.language || "en";
}

function formatMoney(amount, currency = getSelectedCurrency()) {
  return `${currencySymbol(currency)}${Number(amount || 0).toLocaleString("en-IN")}`;
}

function isAdminUser() {
  const email = String(currentUser?.email || currentUserProfile?.email || "").toLowerCase();
  const loginId = String(currentUserProfile?.loginId || "").toLowerCase();
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
  }, 3500);
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

/* UI CONTROLS */
function openOverlay() {
  $("overlay")?.classList.remove("hidden");
  document.body.classList.add("no-scroll");
}

function closeOverlayIfNothingOpen() {
  const sidebarOpen = $("sidebar")?.classList.contains("open");
  const drawerOpen = $("notificationDrawer")?.classList.contains("open");
  const authOpen = !$("authModal")?.classList.contains("hidden");
  const forgotOpen = !$("forgotModal")?.classList.contains("hidden");

  if (!sidebarOpen && !drawerOpen && !authOpen && !forgotOpen) {
    $("overlay")?.classList.add("hidden");
    document.body.classList.remove("no-scroll");
  }
}

function openSidebar() {
  $("sidebar")?.classList.add("open");
  openOverlay();
}

function closeSidebar() {
  $("sidebar")?.classList.remove("open");
  closeOverlayIfNothingOpen();
}

function toggleNotificationDrawer() {
  $("notificationDrawer")?.classList.toggle("open");
  openOverlay();
  loadNotifications();
}

function closeNotificationDrawer() {
  $("notificationDrawer")?.classList.remove("open");
  closeOverlayIfNothingOpen();
}

function closeAllOverlays() {
  $("sidebar")?.classList.remove("open");
  $("notificationDrawer")?.classList.remove("open");
  $("authModal")?.classList.add("hidden");
  $("forgotModal")?.classList.add("hidden");
  $("overlay")?.classList.add("hidden");
  document.body.classList.remove("no-scroll");
}

function updateProtectedSections() {
  const loggedIn = !!currentUser;

  ["book", "worker", "jobs", "dashboard"].forEach((id) => {
    const section = $(id);
    if (!section) return;
    section.classList.toggle("hidden", !loggedIn);
  });
}

function goToSection(id) {
  closeSidebar();

  const protectedSections = ["book", "worker", "jobs", "dashboard"];

  if (protectedSections.includes(id) && !currentUser) {
    showToast("Please login first.", "error");
    openAuthModal("login");
    return;
  }

  document.querySelectorAll("main section").forEach((section) => {
    if (section.id === "settings" || section.id === "admin") {
      section.classList.add("hidden");
    }
  });

  const section = $(id);
  if (!section) return;

  if (id === "settings") {
    section.classList.remove("hidden");
  }

  if (id === "admin") {
    if (!isAdminUser()) {
      showToast("Admin access required.", "error");
      return;
    }
    section.classList.remove("hidden");
  }

  section.scrollIntoView({ behavior: "smooth", block: "start" });

  if (id === "jobs") loadPublicJobs();
  if (id === "dashboard") loadDashboard();
  if (id === "admin") loadAdminPanel();
}

function openSettingsSection() {
  goToSection("settings");
}

/* AUTH */
function openAuthModal(mode = "login") {
  setAuthMode(mode);
  $("authModal")?.classList.remove("hidden");
  openOverlay();
}

function closeAuthModal() {
  $("authModal")?.classList.add("hidden");
  closeOverlayIfNothingOpen();
}

function setAuthMode(mode = "login") {
  currentAuthMode = mode;

  if ($("authTitle")) $("authTitle").textContent = mode === "signup" ? "Create Account" : "Login";
  if ($("authSubmitBtn")) $("authSubmitBtn").textContent = mode === "signup" ? "Create Account" : "Login";

  $("loginTab")?.classList.toggle("active", mode === "login");
  $("signupTab")?.classList.toggle("active", mode === "signup");
  $("signupFields")?.classList.toggle("hidden", mode !== "signup");
  $("confirmPasswordWrap")?.classList.toggle("hidden", mode !== "signup");

  if ($("authName")) $("authName").required = mode === "signup";
  if ($("authPhone")) $("authPhone").required = mode === "signup";
  if ($("authConfirmPassword")) $("authConfirmPassword").required = mode === "signup";
}

async function handleAuth(event) {
  event.preventDefault();

  const email = $("authEmail").value.trim().toLowerCase();
  const password = $("authPassword").value;
  const submitBtn = $("authSubmitBtn");

  try {
    setButtonLoading(submitBtn, "Please wait...", true);

    if (currentAuthMode === "signup") {
      const name = $("authName").value.trim();
      const phone = $("authPhone").value.trim();
      const role = $("authRole").value;
      const referral = $("authReferral").value.trim();
      const confirmPassword = $("authConfirmPassword").value;

      if (!name || !phone) throw new Error("Please enter name and phone.");
      if (password.length < 6) throw new Error("Password must be at least 6 characters.");
      if (password !== confirmPassword) throw new Error("Passwords do not match.");

      const cred = await auth.createUserWithEmailAndPassword(email, password);
      const user = cred.user;

      await user.updateProfile({ displayName: name });

      await db.collection("users").doc(user.uid).set({
        uid: user.uid,
        name,
        phone,
        role,
        loginId: getEmailLoginId(email),
        email,
        referralCode: makeReferralCode(name),
        invitedBy: referral || "",
        country: getSelectedCountry(),
        currency: getSelectedCurrency(),
        language: getSelectedLanguage(),
        settings: {
          country: getSelectedCountry(),
          currency: getSelectedCurrency(),
          language: getSelectedLanguage()
        },
        createdAt: nowServer(),
        updatedAt: nowServer()
      }, { merge: true });

      await createNotification(user.uid, "Welcome to RapideService", "Your account was created successfully.");

      showToast("Account created successfully.");
      closeAuthModal();

      if (role === "worker") goToSection("worker");
      else goToSection("book");
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

    if (providerName === "google") provider = new firebase.auth.GoogleAuthProvider();
    if (providerName === "github") provider = new firebase.auth.GithubAuthProvider();
    if (providerName === "facebook") provider = new firebase.auth.FacebookAuthProvider();

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
        referralCode: makeReferralCode(user.displayName || "RS"),
        country: "IN",
        currency: "INR",
        language: "en",
        createdAt: nowServer(),
        updatedAt: nowServer()
      }, { merge: true });
    }

    showToast("Login successful.");
    closeAuthModal();
  } catch (error) {
    showToast(error.message || "Social login failed.", "error");
  }
}

async function logoutUser() {
  await auth.signOut();
  showToast("Logged out successfully.");
}

auth.onAuthStateChanged(async (user) => {
  currentUser = user || null;

  if (!user) {
    currentUserProfile = null;
    updateAuthUI();
    renderLoggedOutState();
    return;
  }

  try {
    const snap = await db.collection("users").doc(user.uid).get();

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
        country: "IN",
        currency: "INR",
        language: "en",
        createdAt: nowServer(),
        updatedAt: nowServer()
      };

      await db.collection("users").doc(user.uid).set(currentUserProfile, { merge: true });
    }

    updateAuthUI();
    applyUserSettingsToUI();

    await Promise.all([
      loadDashboard(),
      loadNotifications(),
      loadPublicJobs(),
      loadFeaturedWorkers(),
      loadStats()
    ]);
  } catch (error) {
    showToast(error.message || "Profile loading failed.", "error");
  }
});

function updateAuthUI() {
  updateProtectedSections();

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
  if ($("userInfoCard")) {
    $("userInfoCard").innerHTML = `<p class="muted">Login to view your dashboard.</p>`;
  }

  if ($("dashboardContent")) {
    $("dashboardContent").innerHTML = `
      <div class="empty-state">
        Please login to view bookings and bids.
        <br><br>
        <button class="btn primary" onclick="openAuthModal('login')">Login Now</button>
      </div>
    `;
  }

  if ($("notificationList")) {
    $("notificationList").innerHTML = `<p class="muted">Login to view notifications.</p>`;
  }

  $("notifyDot")?.classList.add("hidden");
}

/* FORGOT PASSWORD */
function openForgotModal() {
  closeAuthModal();
  $("forgotModal")?.classList.remove("hidden");
  openOverlay();
}

function closeForgotModal() {
  $("forgotModal")?.classList.add("hidden");
  closeOverlayIfNothingOpen();
}

function changeResetMethod() {
  const method = $("resetMethod")?.value || "email";

  if (method === "phone") {
    $("resetIdentityLabel").textContent = "Registered Mobile Number";
    $("resetIdentity").placeholder = "Enter registered mobile number";
  } else {
    $("resetIdentityLabel").textContent = "Registered Email";
    $("resetIdentity").placeholder = "Enter registered email";
  }
}

async function requestResetOtp() {
  const method = $("resetMethod")?.value || "email";
  const identity = $("resetIdentity")?.value.trim() || "";
  const btn = $("sendOtpBtn");

  if (!identity) {
    showToast("Please enter email or phone.", "error");
    return;
  }

  try {
    setButtonLoading(btn, "Sending OTP...", true);

    const res = await fetch("/api/request-reset-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, identity })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "OTP send failed.");

    $("resetOtpFields")?.classList.remove("hidden");
    showToast(data.message || "OTP sent successfully.");
  } catch (error) {
    showToast(error.message || "OTP failed.", "error");
  } finally {
    setButtonLoading(btn, "", false);
  }
}

async function verifyResetOtp() {
  const method = $("resetMethod")?.value || "email";
  const identity = $("resetIdentity")?.value.trim() || "";
  const otp = $("resetOtp")?.value.trim() || "";
  const newPassword = $("resetNewPassword")?.value || "";
  const confirmPassword = $("resetConfirmPassword")?.value || "";

  if (!identity || !otp || !newPassword || !confirmPassword) {
    showToast("Please fill all reset fields.", "error");
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast("Passwords do not match.", "error");
    return;
  }

  try {
    const res = await fetch("/api/reset-password-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, identity, otp, newPassword })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Password reset failed.");

    showToast("Password reset successful.");
    closeForgotModal();
    openAuthModal("login");
  } catch (error) {
    showToast(error.message || "Reset failed.", "error");
  }
}

/* INIT */
document.addEventListener("DOMContentLoaded", async () => {
  if ($("footerYear")) $("footerYear").textContent = new Date().getFullYear();

  fillSkillDropdowns();
  applyDefaultSettings();
  bindSettingEvents();
  calculateMinimumPrice();
  updateProtectedSections();

  await Promise.all([
    loadMinimumPrices(),
    loadStats(),
    loadPublicJobs(),
    loadFeaturedWorkers()
  ]);

  fillSkillDropdowns();
  calculateMinimumPrice();
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
  const skillOptions = SKILLS.map((skill) => `<option value="${escapeHtml(skill)}">${escapeHtml(skill)}</option>`).join("");

  if ($("homeServiceSelect")) {
    $("homeServiceSelect").innerHTML = skillOptions;
  }

  if ($("bookingSkill")) {
    $("bookingSkill").innerHTML = `<option value="">Choose service skill</option>${skillOptions}`;
  }

  if ($("workerSkill")) {
    $("workerSkill").innerHTML = `<option value="">Choose your skill</option>${skillOptions}`;
  }

  if ($("jobSkillFilter")) {
    $("jobSkillFilter").innerHTML = `<option value="">All Skills</option>${skillOptions}`;
  }

  renderServices();
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
          <img src="${img}" alt="${escapeHtml(skill)}" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('image-fallback');" />
        </div>
        <div class="service-body">
          <h3>${escapeHtml(skill)}</h3>
          <p>Find trusted ${escapeHtml(skill.toLowerCase())} workers near your area.</p>
          <span class="price-chip">From ${formatMoney(price)}</span>
          <div class="card-actions">
            <button class="btn light" onclick="selectServiceAndBook('${escapeHtml(skill)}')">Book Now</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function selectServiceAndBook(skill) {
  if ($("bookingSkill")) {
    $("bookingSkill").value = skill;
    calculateMinimumPrice();
  }

  if ($("homeServiceSelect")) {
    $("homeServiceSelect").value = skill;
  }

  goToSection("book");
}

async function loadStats() {
  try {
    const [workersSnap, jobsSnap, reviewsSnap] = await Promise.all([
      db.collection("workerPublic").limit(1000).get(),
      db.collection("bookings").limit(1000).get(),
      db.collection("reviews").limit(1000).get()
    ]);

    const workers = workersSnap.size;
    const jobs = jobsSnap.size;
    const reviews = reviewsSnap.size;

    if ($("statWorkers")) $("statWorkers").textContent = workers;
    if ($("statJobs")) $("statJobs").textContent = jobs;
    if ($("statReviews")) $("statReviews").textContent = reviews;

    if (workers + jobs + reviews > 0) {
      $("liveStats")?.classList.remove("hidden");
      $("launchTrustRow")?.classList.add("hidden");
    } else {
      $("liveStats")?.classList.add("hidden");
      $("launchTrustRow")?.classList.remove("hidden");
    }
  } catch {
    $("liveStats")?.classList.add("hidden");
    $("launchTrustRow")?.classList.remove("hidden");
  }
}

/* SETTINGS */
function applyDefaultSettings() {
  if ($("sideCountrySelect")) $("sideCountrySelect").value = "IN";
  if ($("sideCurrencySelect")) $("sideCurrencySelect").value = "INR";
  if ($("sideLanguageSelect")) $("sideLanguageSelect").value = "en";
  if ($("settingsCountry")) $("settingsCountry").value = "IN";
  if ($("settingsCurrency")) $("settingsCurrency").value = "INR";
  if ($("settingsLanguage")) $("settingsLanguage").value = "en";
}

function applyUserSettingsToUI() {
  const country = currentUserProfile?.country || currentUserProfile?.settings?.country || "IN";
  const currency = currentUserProfile?.currency || currentUserProfile?.settings?.currency || "INR";
  const language = currentUserProfile?.language || currentUserProfile?.settings?.language || "en";

  if ($("sideCountrySelect")) $("sideCountrySelect").value = country;
  if ($("sideCurrencySelect")) $("sideCurrencySelect").value = currency;
  if ($("sideLanguageSelect")) $("sideLanguageSelect").value = language;
  if ($("settingsCountry")) $("settingsCountry").value = country;
  if ($("settingsCurrency")) $("settingsCurrency").value = currency;
  if ($("settingsLanguage")) $("settingsLanguage").value = language;
}

function bindSettingEvents() {
  ["sideCountrySelect", "sideCurrencySelect", "sideLanguageSelect", "settingsCountry", "settingsCurrency", "settingsLanguage"].forEach((id) => {
    const el = $(id);
    if (!el) return;

    el.addEventListener("change", () => {
      calculateMinimumPrice();
      renderServices();
    });
  });
}

async function saveSideSettings() {
  if ($("settingsCountry") && $("sideCountrySelect")) $("settingsCountry").value = $("sideCountrySelect").value;
  if ($("settingsCurrency") && $("sideCurrencySelect")) $("settingsCurrency").value = $("sideCurrencySelect").value;
  if ($("settingsLanguage") && $("sideLanguageSelect")) $("settingsLanguage").value = $("sideLanguageSelect").value;

  await saveSettings();
  closeSidebar();
}

async function saveSettings() {
  const country = $("settingsCountry")?.value || $("sideCountrySelect")?.value || "IN";
  const currency = $("settingsCurrency")?.value || $("sideCurrencySelect")?.value || "INR";
  const language = $("settingsLanguage")?.value || $("sideLanguageSelect")?.value || "en";

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

/* HERO */
function heroFindWorkers() {
  const service = $("homeServiceSelect")?.value || "";
  const city = $("homeCityInput")?.value.trim() || "";

  if ($("bookingSkill")) {
    $("bookingSkill").value = service;
    calculateMinimumPrice();
  }

  if ($("bookingCity")) {
    $("bookingCity").value = city;
  }

  goToSection("book");
}

function calculateMinimumPrice() {
  const skill = $("bookingSkill")?.value || "Electrician";
  const type = $("bookingType")?.value || "Freelancer";
  const base = Number(minimumPrices[skill] || DEFAULT_MINIMUM_PRICES[skill] || 200);
  const multiplier = Number(WORK_TYPE_MULTIPLIER[type] || 1);
  const amount = Math.round(base * multiplier);

  if ($("minimumPrice")) {
    $("minimumPrice").value = `${formatMoney(amount)} suggested minimum`;
  }

  return amount;
}

/* BOOKING */
async function createBooking(event) {
  event.preventDefault();

  if (!currentUser) {
    showToast("Please login first.", "error");
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

  if (!skill) {
    showToast("Please select service skill.", "error");
    return;
  }

  if (!name || !phone || !city || !area || !budget || !address || !details) {
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
      country: getSelectedCountry(),
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
      country: getSelectedCountry(),
      details,
      biddingOpen: true,
      bookingStatus: "open",
      createdAt: nowServer(),
      updatedAt: nowServer()
    });

    await createNotification(currentUser.uid, "Work posted", `Your ${skill} work was posted successfully.`);

    $("bookingForm").reset();
    fillSkillDropdowns();
    calculateMinimumPrice();

    showToast("Work posted successfully.");
    await Promise.all([loadPublicJobs(), loadDashboard(), loadStats()]);
    goToSection("dashboard");
  } catch (error) {
    showToast(error.message || "Booking failed.", "error");
  }
}

/* WORKER */
async function registerWorker(event) {
  event.preventDefault();

  if (!currentUser) {
    showToast("Please login first.", "error");
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

  if (!workerSkill) {
    showToast("Please select worker skill.", "error");
    return;
  }

  if (!workerName || !workerPhone || !workerCity || !workerAbout) {
    showToast("Please fill all worker fields.", "error");
    return;
  }

  try {
    const existingSnap = await db.collection("workers").doc(currentUser.uid).get();
    const existing = existingSnap.exists ? existingSnap.data() : {};

    const privateData = {
      uid: currentUser.uid,
      workerName,
      workerPhone,
      workerSkill,
      workerType,
      workerAbout,
      workerCity,
      workerCityLower: workerCity.toLowerCase(),
      workerCountry: getSelectedCountry(),
      availability,
      available: availability !== "Not Available",
      verified: !!existing.verified,
      verificationStatus: existing.verificationStatus || "pending",
      workerRating: Number(existing.workerRating || 0),
      totalReviews: Number(existing.totalReviews || 0),
      totalJobs: Number(existing.totalJobs || 0),
      createdAt: existing.createdAt || nowServer(),
      updatedAt: nowServer()
    };

    const publicData = {
      uid: currentUser.uid,
      workerName,
      workerSkill,
      workerType,
      workerAbout,
      workerCity,
      workerCityLower: workerCity.toLowerCase(),
      workerCountry: getSelectedCountry(),
      availability,
      available: availability !== "Not Available",
      verified: privateData.verified,
      verificationStatus: privateData.verificationStatus,
      workerRating: privateData.workerRating,
      totalReviews: privateData.totalReviews,
      totalJobs: privateData.totalJobs,
      createdAt: privateData.createdAt,
      updatedAt: nowServer()
    };

    await db.collection("workers").doc(currentUser.uid).set(privateData, { merge: true });
    await db.collection("workerPublic").doc(currentUser.uid).set(publicData, { merge: true });

    await db.collection("users").doc(currentUser.uid).set({
      role: "worker",
      phone: workerPhone,
      city: workerCity,
      updatedAt: nowServer()
    }, { merge: true });

    currentUserProfile = {
      ...currentUserProfile,
      role: "worker",
      phone: workerPhone,
      city: workerCity
    };

    await createNotification(currentUser.uid, "Worker profile saved", "Your worker profile is now visible.");

    showToast("Worker profile saved successfully.");
    await Promise.all([loadDashboard(), loadFeaturedWorkers(), loadStats()]);
  } catch (error) {
    showToast(error.message || "Worker registration failed.", "error");
  }
}

/* FEATURED WORKERS */
async function loadFeaturedWorkers() {
  const grid = $("featuredWorkersGrid");
  if (!grid) return;

  try {
    const snap = await db.collection("workerPublic").limit(6).get();

    const workers = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    if (!workers.length) {
      grid.innerHTML = `
        <div class="empty-state">
          Worker profiles will appear here after workers register.
          <br><br>
          <button class="btn primary" onclick="goToSection('worker')">Register as Worker</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = workers.map(renderWorkerPublicCard).join("");
  } catch (error) {
    grid.innerHTML = `<div class="empty-state">Could not load worker profiles.</div>`;
  }
}

function renderWorkerPublicCard(worker) {
  const firstLetter = String(worker.workerName || "R").charAt(0).toUpperCase();

  return `
    <article class="worker-public-card">
      <div class="avatar">${escapeHtml(firstLetter)}</div>
      <span class="status ${worker.verified ? "success" : "pending"}">${worker.verified ? "Verified" : "Pending Verification"}</span>
      <h3>${escapeHtml(worker.workerName || "Worker")}</h3>
      <p><strong>Skill:</strong> ${escapeHtml(worker.workerSkill || "-")}</p>
      <p><strong>City:</strong> ${escapeHtml(worker.workerCity || "-")}</p>
      <p><strong>Type:</strong> ${escapeHtml(worker.workerType || "Freelancer")}</p>
      <p><strong>Availability:</strong> ${escapeHtml(worker.availability || "-")}</p>
      <p><span class="rating">★ ${Number(worker.workerRating || 0).toFixed(1)}</span> (${worker.totalReviews || 0} reviews)</p>
      <p>${escapeHtml(worker.workerAbout || "Trusted RapideService worker.")}</p>
      <div class="card-actions">
        <button class="btn primary" onclick="selectServiceAndBook('${escapeHtml(worker.workerSkill || "Freelancer / General Helper")}')">Book Similar</button>
      </div>
    </article>
  `;
}

/* JOBS AND BIDS */
async function loadPublicJobs() {
  const list = $("jobsList");
  if (!list) return;

  try {
    const snap = await db.collection("publicJobs")
      .where("biddingOpen", "==", true)
      .limit(50)
      .get();

    allPublicJobsCache = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    renderPublicJobs();
  } catch (error) {
    list.innerHTML = `<div class="empty-state">Login may be required to view jobs.</div>`;
  }
}

function renderPublicJobs() {
  const list = $("jobsList");
  if (!list) return;

  const search = ($("jobSearch")?.value || "").toLowerCase().trim();
  const skillFilter = $("jobSkillFilter")?.value || "";

  let jobs = [...allPublicJobsCache];

  if (skillFilter) jobs = jobs.filter((job) => job.skill === skillFilter);

  if (search) {
    jobs = jobs.filter((job) => {
      const text = `${job.skill} ${job.city} ${job.area} ${job.details} ${job.workType}`.toLowerCase();
      return text.includes(search);
    });
  }

  jobs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  if (!jobs.length) {
    list.innerHTML = `
      <div class="empty-state">
        No open jobs found.
        <br><br>
        <button class="btn primary" onclick="goToSection('book')">Post First Work</button>
      </div>
    `;
    return;
  }

  list.innerHTML = jobs.map((job) => `
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
  `).join("");
}

async function openBidPrompt(bookingId) {
  if (!currentUser) {
    showToast("Please login as worker to bid.", "error");
    openAuthModal("login");
    return;
  }

  const workerSnap = await db.collection("workers").doc(currentUser.uid).get();

  if (!workerSnap.exists) {
    showToast("Please register as worker first.", "error");
    goToSection("worker");
    return;
  }

  const amount = prompt("Enter your bid amount:");
  if (!amount) return;

  const bidAmount = Number(amount);

  if (!bidAmount || bidAmount <= 0) {
    showToast("Please enter valid amount.", "error");
    return;
  }

  const message = prompt("Enter message for customer:", "I can complete this work professionally.");
  if (message === null) return;

  await sendBid(bookingId, bidAmount, message);
}

async function sendBid(bookingId, bidAmount, message) {
  try {
    const workerSnap = await db.collection("workers").doc(currentUser.uid).get();
    const bookingSnap = await db.collection("bookings").doc(bookingId).get();

    if (!workerSnap.exists || !bookingSnap.exists) {
      showToast("Worker or booking not found.", "error");
      return;
    }

    const worker = workerSnap.data();
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
    await loadDashboard();
  } catch (error) {
    showToast(error.message || "Bid failed.", "error");
  }
}

/* DASHBOARD */
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
  if (!currentUser) return;

  if ($("userInfoCard")) {
    $("userInfoCard").innerHTML = `
      <h3>${escapeHtml(currentUserProfile?.name || currentUser.displayName || "User")}</h3>
      <p><strong>Email:</strong> ${escapeHtml(currentUser.email || "")}</p>
      <p><strong>Role:</strong> ${escapeHtml(currentUserProfile?.role || "customer")}</p>
      <p><strong>Referral Code:</strong> ${escapeHtml(currentUserProfile?.referralCode || "-")}</p>
    `;
  }

  if (currentDashboardTab === "bookings") await loadMyBookings();
  if (currentDashboardTab === "bids") await loadMyBids();
  if (currentDashboardTab === "profile") await loadMyWorkerProfile();
}

async function loadMyBookings() {
  const content = $("dashboardContent");
  if (!content) return;

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
      content.innerHTML = `<div class="empty-state">No bookings yet.<br><br><button class="btn primary" onclick="goToSection('book')">Post Work</button></div>`;
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

  const bidsHtml = bids.length ? bids.map((bid) => `
    <div class="bid-box">
      <strong>${escapeHtml(bid.workerName)}</strong>
      <p>${escapeHtml(bid.workerSkill)} • ${escapeHtml(bid.workerCity)}</p>
      <p><strong>Bid:</strong> ${formatMoney(bid.bidAmount, booking.currency)}</p>
      <p>${escapeHtml(bid.message)}</p>
      <p><span class="status ${bid.status === "accepted" ? "success" : "pending"}">${escapeHtml(bid.status)}</span></p>
      ${booking.bookingStatus === "open" ? `<button class="btn success" onclick="acceptBid('${booking.id}', '${bid.id}')">Accept Bid</button>` : ""}
    </div>
  `).join("") : `<p class="muted">No bids yet.</p>`;

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

          ${booking.paymentStatus !== "paid" ? `<button class="btn primary" onclick="payForBooking('${booking.id}')">Pay Now</button>` : `<span class="status success">Payment Paid</span>`}

          ${booking.bookingStatus !== "completed" ? `<button class="btn success" onclick="markBookingComplete('${booking.id}')">Mark Completed</button>` : ""}

          ${booking.bookingStatus === "completed" && !booking.reviewGiven ? `<button class="btn primary" onclick="reviewWorker('${booking.id}', '${accepted.workerUserId}')">Give Review</button>` : ""}
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
    if (!bidSnap.exists) return;

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

    await createNotification(bid.workerUserId, "Bid accepted", "Your bid was accepted.");

    showToast("Bid accepted.");
    await Promise.all([loadDashboard(), loadPublicJobs()]);
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

    if (!orderRes.ok) throw new Error(orderData.error || "Payment order failed.");

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

        if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed.");

        showToast("Payment verified. Contact unlocked.");
        await loadDashboard();
      },
      prefill: {
        name: currentUserProfile?.name || "",
        email: currentUser.email || "",
        contact: currentUserProfile?.phone || ""
      },
      theme: { color: "#2563eb" }
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
    }

    showToast("Booking marked completed.");
    await loadDashboard();
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

    showToast("Review submitted.");
    await Promise.all([loadDashboard(), loadFeaturedWorkers(), loadStats()]);
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
  if (!content) return;

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
      content.innerHTML = `<div class="empty-state">No bids sent yet.<br><br><button class="btn primary" onclick="goToSection('jobs')">View Open Jobs</button></div>`;
      return;
    }

    const cards = [];

    for (const bid of bids) {
      let bookingHtml = "";

      try {
        const bookingSnap = await db.collection("bookings").doc(bid.bookingId).get();

        if (bookingSnap.exists) {
          const booking = bookingSnap.data();

          if (bid.status === "accepted" && booking.workerCanSeeContact && booking.paymentStatus === "paid") {
            bookingHtml = `
              <div class="bid-box">
                <strong>Customer Contact Unlocked</strong>
                <p><strong>Name:</strong> ${escapeHtml(booking.customerName)}</p>
                <p><strong>Phone:</strong> ${escapeHtml(booking.customerPhone)}</p>
                <p><strong>Address:</strong> ${escapeHtml(booking.address)}</p>
              </div>
            `;
          }
        }
      } catch {
        bookingHtml = "";
      }

      cards.push(`
        <article class="data-card">
          <span class="status ${bid.status === "accepted" ? "success" : "pending"}">${escapeHtml(bid.status)}</span>
          <h3>${escapeHtml(bid.workerSkill)}</h3>
          <p><strong>Bid Amount:</strong> ${formatMoney(bid.bidAmount)}</p>
          <p>${escapeHtml(bid.message)}</p>
          ${bookingHtml}
        </article>
      `);
    }

    content.innerHTML = `<div class="card-grid">${cards.join("")}</div>`;
  } catch (error) {
    content.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

async function loadMyWorkerProfile() {
  const content = $("dashboardContent");
  if (!content) return;

  content.innerHTML = `<div class="empty-state">Loading worker profile...</div>`;

  try {
    const snap = await db.collection("workers").doc(currentUser.uid).get();

    if (!snap.exists) {
      content.innerHTML = `<div class="empty-state">You have not registered as worker yet.<br><br><button class="btn primary" onclick="goToSection('worker')">Register Worker Profile</button></div>`;
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
        <p><strong>Rating:</strong> <span class="rating">★ ${Number(worker.workerRating || 0).toFixed(1)}</span> (${worker.totalReviews || 0} reviews)</p>
        <p>${escapeHtml(worker.workerAbout)}</p>

        <div class="card-actions">
          <button class="btn primary" onclick="goToSection('worker')">Update Profile</button>
          <button class="btn light" onclick="goToSection('jobs')">View Open Jobs</button>
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

/* SUPPORT */
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

/* NOTIFICATIONS */
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
    $("notifyDot")?.classList.add("hidden");
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

    const unreadCount = notifications.filter((n) => !n.read).length;

    $("notifyDot")?.classList.toggle("hidden", unreadCount === 0);

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

/* ADMIN */
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

  await loadAdminStats();

  if (currentAdminTab === "workers") await loadAdminWorkers();
  else if (currentAdminTab === "bookings") await loadAdminBookings();
  else if (currentAdminTab === "support") await loadAdminSupport();
  else renderAdminPrices();
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
  if (!content) return;

  content.innerHTML = `<div class="empty-state">Loading workers...</div>`;

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
}

async function adminVerifyWorker(workerId, verified) {
  if (!isAdminUser()) return;

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

  await createNotification(workerId, "Worker verification updated", verified ? "Your worker profile is verified." : "Your worker verification was removed.");

  showToast(verified ? "Worker verified." : "Worker unverified.");
  await Promise.all([loadAdminPanel(), loadFeaturedWorkers()]);
}

async function loadAdminBookings() {
  const content = $("adminContent");
  if (!content) return;

  const snap = await db.collection("bookings").limit(100).get();

  const bookings = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));

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
}

async function loadAdminSupport() {
  const content = $("adminContent");
  if (!content) return;

  const snap = await db.collection("supportTickets").limit(100).get();

  const tickets = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));

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
}

async function adminReplyTicket(ticketId) {
  const reply = prompt("Enter support reply:");
  if (!reply) return;

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
  await loadAdminPanel();
}

async function adminCloseTicket(ticketId) {
  await db.collection("supportTickets").doc(ticketId).set({
    status: "closed",
    updatedAt: nowServer()
  }, { merge: true });

  showToast("Ticket closed.");
  await loadAdminPanel();
}

function skillInputId(skill) {
  return `price_${String(skill).replace(/[^a-zA-Z0-9]/g, "_")}`;
}

function renderAdminPrices() {
  const content = $("adminContent");
  if (!content) return;

  content.innerHTML = `
    <div class="form-card premium-form">
      <h3>Minimum Price Manager</h3>
      <p class="muted">Update suggested minimum prices for each skill.</p>

      <div id="priceRows">
        ${SKILLS.map((skill) => `
          <div class="price-row">
            <strong>${escapeHtml(skill)}</strong>
            <input id="${skillInputId(skill)}" type="number" min="1" value="${minimumPrices[skill] || DEFAULT_MINIMUM_PRICES[skill]}" />
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
    prices[skill] = Number($(skillInputId(skill))?.value || DEFAULT_MINIMUM_PRICES[skill] || 200);
  });

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
}

/* GLOBAL */
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleNotificationDrawer = toggleNotificationDrawer;
window.closeNotificationDrawer = closeNotificationDrawer;
window.closeAllOverlays = closeAllOverlays;

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
window.saveSideSettings = saveSideSettings;

window.heroFindWorkers = heroFindWorkers;
window.selectServiceAndBook = selectServiceAndBook;
window.calculateMinimumPrice = calculateMinimumPrice;

window.createBooking = createBooking;
window.registerWorker = registerWorker;

window.loadPublicJobs = loadPublicJobs;
window.renderPublicJobs = renderPublicJobs;
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
