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
let currentAdminTab = "users";
let currentChatBookingId = "";
let currentChatBookingData = null;
let chatUnsubscribe = null;
let allPublicJobsCache = [];
let allNearbyWorkersCache = [];
let mapInstance = null;
let userMapMarker = null;
let workerMarkers = [];

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
  const clean = String(name || "RS")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 5);

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

  return (
    ADMIN_EMAILS.includes(email) ||
    ADMIN_LOGIN_IDS.includes(loginId) ||
    currentUserProfile?.role === "admin"
  );
}

function getUserRole() {
  if (!currentUser) return "guest";
  if (isAdminUser()) return "admin";
  return currentUserProfile?.role || "customer";
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
  }, 3800);
}

function setButtonLoading(button, text, isLoading) {
  if (!button) return;

  if (isLoading) {
    button.dataset.oldText = button.textContent;
    button.textContent = text;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.oldText || button.textContent;
    button.disabled = false;
  }
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

function imageFileToDataUrl(file, maxSize = 420, quality = 0.68) {
  return new Promise((resolve) => {
    if (!file) return resolve("");

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.", "error");
      return resolve("");
    }

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);

        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      img.onerror = () => resolve("");
      img.src = reader.result;
    };

    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

/* UI */
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

function closeAllOverlays() {
  $("sidebar")?.classList.remove("open");
  $("notificationDrawer")?.classList.remove("open");
  $("authModal")?.classList.add("hidden");
  $("forgotModal")?.classList.add("hidden");
  $("overlay")?.classList.add("hidden");
  document.body.classList.remove("no-scroll");
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

function openSettingsSection() {
  $("settings")?.classList.remove("hidden");
  $("settings")?.scrollIntoView({ behavior: "smooth" });
}

function isProtectedSection(id) {
  return [
    "profile",
    "book",
    "customerDashboard",
    "workerProfile",
    "workerJobs",
    "workerEarnings",
    "accounts",
    "chat"
  ].includes(id);
}

function goToSection(id) {
  closeSidebar();

  if (isProtectedSection(id) && !currentUser) {
    showToast("Please login first.", "error");
    openAuthModal("login");
    return;
  }

  if (id === "admin" && !isAdminUser()) {
    showToast("Admin access required.", "error");
    return;
  }

  const role = getUserRole();

  if ($(id)?.classList.contains("customer-only") && role !== "customer") {
    showToast("This section is for customers.", "error");
    return;
  }

  if ($(id)?.classList.contains("worker-only") && role !== "worker") {
    showToast("This section is for workers.", "error");
    return;
  }

  const section = $(id);
  if (!section) return;

  section.classList.remove("hidden");
  section.scrollIntoView({ behavior: "smooth", block: "start" });

  if (id === "nearby") setTimeout(initMap, 250);
  if (id === "customerDashboard") loadCustomerDashboard();
  if (id === "workerProfile") loadWorkerProfileForm();
  if (id === "workerJobs") loadPublicJobs();
  if (id === "workerEarnings") loadWorkerEarnings();
  if (id === "profile") loadProfileForm();
  if (id === "accounts") loadAccountDetails();
  if (id === "chat") loadChatBookings();
  if (id === "admin") loadAdminPanel();
}

/* Auth */
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

  if ($("authTitle")) {
    $("authTitle").textContent = mode === "signup" ? "Create Account" : "Login";
  }

  if ($("authSubmitBtn")) {
    $("authSubmitBtn").textContent = mode === "signup" ? "Create Account" : "Login";
  }

  $("loginTab")?.classList.toggle("active", mode === "login");
  $("signupTab")?.classList.toggle("active", mode === "signup");
  $("signupFields")?.classList.toggle("hidden", mode !== "signup");
  $("confirmPasswordWrap")?.classList.toggle("hidden", mode !== "signup");

  if ($("authName")) $("authName").required = mode === "signup";
  if ($("authPhone")) $("authPhone").required = mode === "signup";
  if ($("authConfirmPassword")) $("authConfirmPassword").required = mode === "signup";
}

function goToRoleHome() {
  if (isAdminUser()) {
    goToSection("admin");
    return;
  }

  if (getUserRole() === "worker") {
    goToSection("workerProfile");
    return;
  }

  goToSection("customerDashboard");
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

      if (role === "admin") {
        const loginId = getEmailLoginId(email);

        if (!ADMIN_EMAILS.includes(email) && !ADMIN_LOGIN_IDS.includes(loginId)) {
          throw new Error("Admin Portal is only for RapideService admin.");
        }
      }

      if (!name || !phone) {
        throw new Error("Please enter name and phone.");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

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
        city: "",
        area: "",
        about: "",
        photoDataUrl: "",
        totalSpent: 0,
        totalEarned: 0,
        pendingPayout: 0,
        paidPayout: 0,
        createdAt: nowServer(),
        updatedAt: nowServer()
      }, { merge: true });

      await createNotification(
        user.uid,
        "Welcome to RapideService",
        `Your ${role} account was created successfully.`
      );

      window.__afterLoginRedirect = true;

      showToast("Account created successfully.");
      closeAuthModal();
    } else {
      window.__afterLoginRedirect = true;

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
        city: "",
        area: "",
        about: "",
        photoDataUrl: "",
        totalSpent: 0,
        totalEarned: 0,
        pendingPayout: 0,
        paidPayout: 0,
        createdAt: nowServer(),
        updatedAt: nowServer()
      }, { merge: true });
    }

    window.__afterLoginRedirect = true;

    showToast("Login successful.");
    closeAuthModal();
  } catch (error) {
    showToast(error.message || "Social login failed.", "error");
  }
}

async function logoutUser() {
  await auth.signOut();

  showToast("Logged out successfully.");
  goToSection("home");
}

auth.onAuthStateChanged(async (user) => {
  currentUser = user || null;

  if (!user) {
    currentUserProfile = null;
    updateAuthUI();
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
        country: "IN",
        currency: "INR",
        language: "en",
        photoDataUrl: "",
        createdAt: nowServer(),
        updatedAt: nowServer()
      };

      await ref.set(currentUserProfile, { merge: true });
    }

    updateAuthUI();
    applyUserSettingsToUI();
    prefillFormsFromProfile();

    await Promise.all([
      loadStats(),
      loadFeaturedWorkers(),
      loadNotifications(),
      loadNearbyWorkers()
    ]);

    if (window.__afterLoginRedirect) {
      window.__afterLoginRedirect = false;

      setTimeout(() => {
        goToRoleHome();
      }, 250);
    }
  } catch (error) {
    showToast(error.message || "Profile loading failed.", "error");
  }
});

function updateAuthUI() {
  const loggedIn = !!currentUser;
  const role = getUserRole();
  const admin = isAdminUser();

  $("loginBtn")?.classList.toggle("hidden", loggedIn);
  $("signupBtn")?.classList.toggle("hidden", loggedIn);
  $("logoutBtn")?.classList.toggle("hidden", !loggedIn);

  document.querySelectorAll(".customer-link").forEach((el) => {
    el.classList.toggle("hidden", !loggedIn || role !== "customer");
  });

  document.querySelectorAll(".worker-link").forEach((el) => {
    el.classList.toggle("hidden", !loggedIn || role !== "worker");
  });

  document.querySelectorAll(".shared-link").forEach((el) => {
    el.classList.toggle("hidden", !loggedIn || admin);
  });

  document.querySelectorAll(".customer-only").forEach((el) => {
    el.classList.toggle("hidden", !loggedIn || role !== "customer");
  });

  document.querySelectorAll(".worker-only").forEach((el) => {
    el.classList.toggle("hidden", !loggedIn || role !== "worker");
  });

  $("adminSideBtn")?.classList.toggle("hidden", !admin);

  if (!admin) {
    $("admin")?.classList.add("hidden");
  }

  if (role !== "customer") {
    $("book")?.classList.add("hidden");
    $("customerDashboard")?.classList.add("hidden");
  }

  if (role !== "worker") {
    $("workerProfile")?.classList.add("hidden");
    $("workerJobs")?.classList.add("hidden");
    $("workerEarnings")?.classList.add("hidden");
  }
}

/* Forgot Password */
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
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ method, identity })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "OTP send failed.");
    }

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
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ method, identity, otp, newPassword })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Password reset failed.");
    }

    showToast("Password reset successful.");
    closeForgotModal();
    openAuthModal("login");
  } catch (error) {
    showToast(error.message || "Reset failed.", "error");
  }
}

/* Init */
document.addEventListener("DOMContentLoaded", async () => {
  if ($("footerYear")) {
    $("footerYear").textContent = new Date().getFullYear();
  }

  fillSkillDropdowns();
  applyDefaultSettings();
  bindSettingEvents();
  calculateMinimumPrice();

  await Promise.all([
    loadMinimumPrices(),
    loadStats(),
    loadFeaturedWorkers(),
    loadNearbyWorkers()
  ]);

  fillSkillDropdowns();
  calculateMinimumPrice();
});

/* Prices / Services */
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
    minimumPrices = {
      ...DEFAULT_MINIMUM_PRICES
    };
  }
}

function fillSkillDropdowns() {
  const skillOptions = SKILLS.map((skill) => {
    return `<option value="${escapeHtml(skill)}">${escapeHtml(skill)}</option>`;
  }).join("");

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
          <img src="${img}" alt="${escapeHtml(skill)}" loading="lazy" />
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

    $("liveStats")?.classList.remove("hidden");
  } catch {
    $("liveStats")?.classList.add("hidden");
  }
}

/* Settings */
function applyDefaultSettings() {
  if ($("sideCountrySelect")) $("sideCountrySelect").value = "IN";
  if ($("sideCurrencySelect")) $("sideCurrencySelect").value = "INR";
  if ($("sideLanguageSelect")) $("sideLanguageSelect").value = "en";

  if ($("settingsCountry")) $("settingsCountry").value = "IN";
  if ($("settingsCurrency")) $("settingsCurrency").value = "INR";
  if ($("settingsLanguage")) $("settingsLanguage").value = "en";
}

function applyUserSettingsToUI() {
  const country = currentUserProfile?.country || "IN";
  const currency = currentUserProfile?.currency || "INR";
  const language = currentUserProfile?.language || "en";

  if ($("sideCountrySelect")) $("sideCountrySelect").value = country;
  if ($("sideCurrencySelect")) $("sideCurrencySelect").value = currency;
  if ($("sideLanguageSelect")) $("sideLanguageSelect").value = language;

  if ($("settingsCountry")) $("settingsCountry").value = country;
  if ($("settingsCurrency")) $("settingsCurrency").value = currency;
  if ($("settingsLanguage")) $("settingsLanguage").value = language;
}

function bindSettingEvents() {
  [
    "sideCountrySelect",
    "sideCurrencySelect",
    "sideLanguageSelect",
    "settingsCountry",
    "settingsCurrency",
    "settingsLanguage"
  ].forEach((id) => {
    const el = $(id);

    if (!el) return;

    el.addEventListener("change", () => {
      calculateMinimumPrice();
      renderServices();
    });
  });
}

async function saveSideSettings() {
  if ($("settingsCountry") && $("sideCountrySelect")) {
    $("settingsCountry").value = $("sideCountrySelect").value;
  }

  if ($("settingsCurrency") && $("sideCurrencySelect")) {
    $("settingsCurrency").value = $("sideCurrencySelect").value;
  }

  if ($("settingsLanguage") && $("sideLanguageSelect")) {
    $("settingsLanguage").value = $("sideLanguageSelect").value;
  }

  await saveSettings();
  closeSidebar();
}

async function saveSettings() {
  const country = $("settingsCountry")?.value || "IN";
  const currency = $("settingsCurrency")?.value || "INR";
  const language = $("settingsLanguage")?.value || "en";

  if (!currentUser) {
    showToast("Settings saved on this device.");
    return;
  }

  await db.collection("users").doc(currentUser.uid).set({
    country,
    currency,
    language,
    updatedAt: nowServer()
  }, { merge: true });

  currentUserProfile = {
    ...currentUserProfile,
    country,
    currency,
    language
  };

  showToast("Settings saved.");
}

/* Profile */
function prefillFormsFromProfile() {
  if (!currentUserProfile) return;

  if ($("profileName")) $("profileName").value = currentUserProfile.name || "";
  if ($("profilePhone")) $("profilePhone").value = currentUserProfile.phone || "";
  if ($("profileCity")) $("profileCity").value = currentUserProfile.city || "";
  if ($("profileArea")) $("profileArea").value = currentUserProfile.area || "";
  if ($("profileAbout")) $("profileAbout").value = currentUserProfile.about || "";

  if ($("customerName")) $("customerName").value = currentUserProfile.name || "";
  if ($("customerPhone")) $("customerPhone").value = currentUserProfile.phone || "";
  if ($("bookingCity")) $("bookingCity").value = currentUserProfile.city || "";
  if ($("bookingArea")) $("bookingArea").value = currentUserProfile.area || "";
}

function loadProfileForm() {
  prefillFormsFromProfile();
  renderProfilePreview();
}

function renderProfilePreview() {
  const box = $("profilePreview");
  if (!box) return;

  const img = currentUserProfile?.photoDataUrl || currentUserProfile?.photoUrl || "";
  const name = currentUserProfile?.name || "User";
  const role = getUserRole();
  const phone = currentUserProfile?.phone || "-";
  const city = currentUserProfile?.city || "-";
  const email = currentUser?.email || currentUserProfile?.email || "-";

  box.innerHTML = `
    <div class="profile-card-inline">
      ${
        img
          ? `<img src="${img}" alt="Profile" />`
          : `<div class="avatar">${escapeHtml(name.charAt(0).toUpperCase())}</div>`
      }

      <div>
        <h3>${escapeHtml(name)}</h3>
        <p><strong>1.</strong> Email: ${escapeHtml(email)}</p>
        <p><strong>2.</strong> Phone: ${escapeHtml(phone)} | City: ${escapeHtml(city)}</p>
        <p><strong>3.</strong> Account Type: ${escapeHtml(role)}</p>
      </div>
    </div>
  `;
}

async function saveUserProfile(event) {
  event.preventDefault();

  if (!currentUser) return;

  const file = $("profilePhoto")?.files?.[0] || null;
  let photoDataUrl = currentUserProfile?.photoDataUrl || "";

  if (file) {
    photoDataUrl = await imageFileToDataUrl(file);

    if (!photoDataUrl) {
      showToast("Photo was not saved.", "warning");
    }
  }

  const profileData = {
    name: $("profileName")?.value.trim() || "",
    phone: $("profilePhone")?.value.trim() || "",
    city: $("profileCity")?.value.trim() || "",
    area: $("profileArea")?.value.trim() || "",
    about: $("profileAbout")?.value.trim() || "",
    photoDataUrl,
    updatedAt: nowServer()
  };

  await db.collection("users").doc(currentUser.uid).set(profileData, { merge: true });

  currentUserProfile = {
    ...currentUserProfile,
    ...profileData
  };

  await currentUser.updateProfile({
    displayName: profileData.name || currentUser.displayName
  });

  prefillFormsFromProfile();
  renderProfilePreview();

  showToast("Profile saved successfully.");
}

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

/* Booking */
async function createBooking(event) {
  event.preventDefault();

  if (!currentUser) {
    openAuthModal("login");
    return;
  }

  if (getUserRole() !== "customer") {
    showToast("Only customers can post work.", "error");
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
      customerPhotoDataUrl: currentUserProfile?.photoDataUrl || "",
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
      chatOpen: false,
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

    await createNotification(
      currentUser.uid,
      "Work posted",
      `Your ${skill} work was posted successfully.`
    );

    $("bookingForm").reset();

    prefillFormsFromProfile();
    fillSkillDropdowns();
    calculateMinimumPrice();

    showToast("Work posted successfully.");

    await Promise.all([
      loadPublicJobs(),
      loadCustomerDashboard(),
      loadStats()
    ]);

    goToSection("customerDashboard");
  } catch (error) {
    showToast(error.message || "Booking failed.", "error");
  }
}

async function loadCustomerDashboard() {
  const info = $("customerInfoCard");
  const list = $("customerBookingsList");

  if (!currentUser || !info || !list) return;

  info.innerHTML = `
    <h3>${escapeHtml(currentUserProfile?.name || "Customer")}</h3>
    <p><strong>Email:</strong> ${escapeHtml(currentUser.email || "")}</p>
    <p><strong>Phone:</strong> ${escapeHtml(currentUserProfile?.phone || "-")}</p>
    <p><strong>City:</strong> ${escapeHtml(currentUserProfile?.city || "-")}</p>
  `;

  list.innerHTML = `<div class="empty-state">Loading your bookings...</div>`;

  try {
    const snap = await db.collection("bookings")
      .where("customerId", "==", currentUser.uid)
      .limit(50)
      .get();

    const bookings = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    if (!bookings.length) {
      list.innerHTML = `
        <div class="empty-state">
          No bookings yet.
          <br><br>
          <button class="btn primary" onclick="goToSection('book')">Post Work</button>
        </div>
      `;
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

      cards.push(renderCustomerBookingCard(booking, bids));
    }

    list.innerHTML = cards.join("");
  } catch (error) {
    list.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

function timelineRow(label, done) {
  return `
    <div class="timeline-item">
      <span class="timeline-dot ${done ? "done" : ""}"></span>
      <span>${escapeHtml(label)}</span>
    </div>
  `;
}

function renderCustomerBookingCard(booking, bids = []) {
  const accepted = booking.acceptedBid || null;

  const bidsHtml = bids.length
    ? bids.map((bid) => `
      <div class="bid-box">
        <strong>${escapeHtml(bid.workerName)}</strong>
        <p>${escapeHtml(bid.workerSkill)} • ${escapeHtml(bid.workerCity)}</p>
        <p><strong>Bid:</strong> ${formatMoney(bid.bidAmount, booking.currency)}</p>
        <p>${escapeHtml(bid.message)}</p>
        <p>
          <span class="status ${bid.status === "accepted" ? "success" : "pending"}">
            ${escapeHtml(bid.status)}
          </span>
        </p>

        ${
          booking.bookingStatus === "open"
            ? `<button class="btn success" onclick="acceptBid('${booking.id}', '${bid.id}')">Accept Bid</button>`
            : ""
        }
      </div>
    `).join("")
    : `<p class="muted">No bids yet.</p>`;

  return `
    <article class="data-card">
      <span class="status ${booking.bookingStatus === "open" ? "open" : "pending"}">
        ${escapeHtml(booking.bookingStatus)}
      </span>

      <h3>${escapeHtml(booking.skill)} - ${escapeHtml(booking.workType)}</h3>

      <p><strong>City:</strong> ${escapeHtml(booking.city)}, ${escapeHtml(booking.area)}</p>
      <p><strong>Budget:</strong> ${formatMoney(booking.budget, booking.currency)}</p>
      <p>${escapeHtml(booking.details)}</p>

      <div class="timeline">
        ${timelineRow("Posted", true)}
        ${timelineRow("Worker accepted", !!accepted)}
        ${timelineRow("Payment verified", booking.paymentStatus === "paid")}
        ${timelineRow("Chat unlocked", !!booking.chatOpen)}
        ${timelineRow("Completed", booking.bookingStatus === "completed")}
      </div>

      ${
        accepted
          ? `
            <div class="bid-box">
              <strong>Accepted Worker: ${escapeHtml(accepted.workerName)}</strong>
              <p>Final Amount: ${formatMoney(accepted.bidAmount, booking.currency)}</p>

              ${
                booking.paymentStatus !== "paid"
                  ? `<button class="btn primary" onclick="payForBooking('${booking.id}')">Pay Now</button>`
                  : `<span class="status success">Payment Paid</span>`
              }

              <button class="btn light" onclick="openBookingChat('${booking.id}')">💬 Chat</button>

              ${
                booking.workerCanSeeContact
                  ? `<a class="btn success" href="tel:${escapeHtml(accepted.workerPhone || "")}">📞 Call Worker</a>`
                  : ""
              }

              ${
                booking.bookingStatus !== "completed"
                  ? `<button class="btn success" onclick="markBookingComplete('${booking.id}')">Mark Completed</button>`
                  : ""
              }

              ${
                booking.bookingStatus === "completed" && !booking.reviewGiven
                  ? `<button class="btn primary" onclick="reviewWorker('${booking.id}', '${accepted.workerUserId}')">Give Review</button>`
                  : ""
              }
            </div>
          `
          : `<h4>Worker Bids</h4>${bidsHtml}`
      }
    </article>
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
        workerPhone: bid.workerPhone || "",
        workerSkill: bid.workerSkill,
        bidAmount: bid.bidAmount,
        message: bid.message
      },
      assignedWorkerId: bid.workerUserId,
      assignedWorkerName: bid.workerName,
      bookingStatus: "accepted",
      biddingOpen: false,
      chatOpen: true,
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

    await db.collection("chats").doc(bookingId).set({
      bookingId,
      customerId: bid.customerId,
      workerUserId: bid.workerUserId,
      active: true,
      createdAt: nowServer(),
      updatedAt: nowServer()
    }, { merge: true });

    await createNotification(
      bid.workerUserId,
      "Bid accepted",
      "Your bid was accepted. Chat is now open."
    );

    showToast("Bid accepted. Chat is now open.");

    await Promise.all([
      loadCustomerDashboard(),
      loadPublicJobs()
    ]);
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

        showToast("Payment verified. Worker earning reflected.");

        await Promise.all([
          loadCustomerDashboard(),
          loadWorkerEarnings(),
          loadAdminPanel()
        ]);
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

    new Razorpay(options).open();
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
      chatOpen: false,
      updatedAt: nowServer()
    }, { merge: true });

    await db.collection("chats").doc(bookingId).set({
      active: false,
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

    showToast("Booking marked completed. Chat closed.");

    await Promise.all([
      loadCustomerDashboard(),
      loadChatBookings()
    ]);
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

    await Promise.all([
      loadCustomerDashboard(),
      loadFeaturedWorkers(),
      loadStats()
    ]);
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

/* Worker */
async function loadWorkerProfileForm() {
  if (!currentUser) return;

  const snap = await db.collection("workers").doc(currentUser.uid).get();

  if (snap.exists) {
    const worker = snap.data();

    if ($("workerName")) $("workerName").value = worker.workerName || "";
    if ($("workerPhone")) $("workerPhone").value = worker.workerPhone || "";
    if ($("workerSkill")) $("workerSkill").value = worker.workerSkill || "";
    if ($("workerType")) $("workerType").value = worker.workerType || "Freelancer";
    if ($("workerCity")) $("workerCity").value = worker.workerCity || "";
    if ($("workerAvailability")) $("workerAvailability").value = worker.availability || "Available Now";
    if ($("workerAbout")) $("workerAbout").value = worker.workerAbout || "";
  } else {
    if ($("workerName")) $("workerName").value = currentUserProfile?.name || "";
    if ($("workerPhone")) $("workerPhone").value = currentUserProfile?.phone || "";
    if ($("workerCity")) $("workerCity").value = currentUserProfile?.city || "";
  }
}

async function registerWorker(event) {
  event.preventDefault();

  if (!currentUser) {
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

    const file = $("workerPhoto")?.files?.[0] || null;
    let workerPhotoDataUrl = existing.workerPhotoDataUrl || currentUserProfile?.photoDataUrl || "";

    if (file) {
      workerPhotoDataUrl = await imageFileToDataUrl(file);

      if (!workerPhotoDataUrl) {
        showToast("Worker photo was not saved.", "warning");
      }
    }

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
      workerPhotoDataUrl,
      availability,
      available: availability !== "Not Available",
      verified: !!existing.verified,
      verificationStatus: existing.verificationStatus || "pending",
      workerRating: Number(existing.workerRating || 0),
      totalReviews: Number(existing.totalReviews || 0),
      totalJobs: Number(existing.totalJobs || 0),
      location: existing.location || null,
      createdAt: existing.createdAt || nowServer(),
      updatedAt: nowServer()
    };

    const publicData = {
      ...privateData
    };

    delete publicData.workerPhone;

    await db.collection("workers").doc(currentUser.uid).set(privateData, { merge: true });
    await db.collection("workerPublic").doc(currentUser.uid).set(publicData, { merge: true });

    await db.collection("users").doc(currentUser.uid).set({
      role: "worker",
      phone: workerPhone,
      city: workerCity,
      photoDataUrl: workerPhotoDataUrl || currentUserProfile?.photoDataUrl || "",
      updatedAt: nowServer()
    }, { merge: true });

    currentUserProfile = {
      ...currentUserProfile,
      role: "worker",
      phone: workerPhone,
      city: workerCity,
      photoDataUrl: workerPhotoDataUrl || currentUserProfile?.photoDataUrl || ""
    };

    showToast("Worker profile saved successfully.");

    updateAuthUI();

    await Promise.all([
      loadFeaturedWorkers(),
      loadStats(),
      loadNearbyWorkers()
    ]);
  } catch (error) {
    showToast(error.message || "Worker registration failed.", "error");
  }
}

async function saveWorkerCurrentLocation() {
  if (!currentUser) {
    showToast("Please login first.", "error");
    return;
  }

  if (!navigator.geolocation) {
    showToast("Location is not supported by your browser.", "error");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const location = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        updatedAt: Date.now()
      };

      await db.collection("workers").doc(currentUser.uid).set({
        location,
        updatedAt: nowServer()
      }, { merge: true });

      await db.collection("workerPublic").doc(currentUser.uid).set({
        location,
        updatedAt: nowServer()
      }, { merge: true });

      showToast("Worker location saved.");

      await loadNearbyWorkers();
    },
    () => {
      showToast("Location permission denied.", "error");
    }
  );
}

/* Jobs / Bids */
async function loadPublicJobs() {
  const list = $("jobsList");
  if (!list) return;

  try {
    list.innerHTML = `<div class="empty-state">Loading jobs...</div>`;

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
    list.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
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
      return `${job.skill} ${job.city} ${job.area} ${job.details} ${job.workType}`
        .toLowerCase()
        .includes(search);
    });
  }

  jobs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  if (!jobs.length) {
    list.innerHTML = `<div class="empty-state">No open jobs found.</div>`;
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
    openAuthModal("login");
    return;
  }

  if (getUserRole() !== "worker") {
    showToast("Only workers can bid on jobs.", "error");
    return;
  }

  const workerSnap = await db.collection("workers").doc(currentUser.uid).get();

  if (!workerSnap.exists) {
    showToast("Please create worker profile first.", "error");
    goToSection("workerProfile");
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
      workerPhone: worker.workerPhone,
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

    await createNotification(
      booking.customerId,
      "New worker bid",
      `${worker.workerName} sent a bid of ${formatMoney(bidAmount, booking.currency)}.`
    );

    showToast("Bid sent successfully.");
  } catch (error) {
    showToast(error.message || "Bid failed.", "error");
  }
}

/* Workers / Map */
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
      grid.innerHTML = `<div class="empty-state">Worker profiles will appear here after workers register.</div>`;
      return;
    }

    grid.innerHTML = workers.map((worker) => {
      return renderWorkerPublicCard(worker, "", { showVerification: true });
    }).join("");
  } catch {
    grid.innerHTML = `<div class="empty-state">Could not load worker profiles.</div>`;
  }
}

function renderWorkerPublicCard(worker, distanceText = "", options = {}) {
  const name = worker.workerName || "Worker";
  const img = worker.workerPhotoDataUrl || worker.workerPhotoUrl || "";
  const showVerification = options.showVerification !== false;

  return `
    <article class="worker-public-card">
      ${
        img
          ? `<img class="worker-card-img" src="${img}" alt="${escapeHtml(name)}" />`
          : `<div class="avatar">${escapeHtml(name.charAt(0).toUpperCase())}</div>`
      }

      ${
        showVerification
          ? `<span class="status ${worker.verified ? "success" : "pending"}">
              ${worker.verified ? "Verified" : "Pending Verification"}
            </span>`
          : ""
      }

      <h3>${escapeHtml(name)}</h3>

      <p><strong>Skill:</strong> ${escapeHtml(worker.workerSkill || "-")}</p>
      <p><strong>City:</strong> ${escapeHtml(worker.workerCity || "-")}</p>
      <p><strong>Type:</strong> ${escapeHtml(worker.workerType || "Freelancer")}</p>
      <p><strong>Availability:</strong> ${escapeHtml(worker.availability || "-")}</p>

      ${
        distanceText
          ? `<p><strong>Distance from you:</strong> ${escapeHtml(distanceText)}</p>`
          : ""
      }

      <p>
        <span class="rating">★ ${Number(worker.workerRating || 0).toFixed(1)}</span>
        (${worker.totalReviews || 0} reviews)
      </p>

      <p>${escapeHtml(worker.workerAbout || "Trusted RapideService worker.")}</p>

      <div class="card-actions">
        <button class="btn primary" onclick="selectServiceAndBook('${escapeHtml(worker.workerSkill || "Freelancer / General Helper")}')">
          Book Similar
        </button>
      </div>
    </article>
  `;
}

async function loadNearbyWorkers(centerLat = null, centerLng = null) {
  const list = $("nearbyWorkersList");

  try {
    const snap = await db.collection("workerPublic").limit(100).get();

    allNearbyWorkersCache = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    if (list) {
      if (!centerLat || !centerLng) {
        list.innerHTML = `
          <div class="empty-state">
            Click <strong>Use My Current Location</strong> to find nearby workers and see distance in KM.
          </div>
        `;
      } else {
        const workersWithDistance = allNearbyWorkersCache
          .filter((worker) => worker.location?.lat && worker.location?.lng)
          .map((worker) => ({
            worker,
            km: distanceKm(centerLat, centerLng, worker.location.lat, worker.location.lng)
          }))
          .sort((a, b) => a.km - b.km);

        if (!workersWithDistance.length) {
          list.innerHTML = `<div class="empty-state">No nearby workers with saved location found.</div>`;
        } else {
          list.innerHTML = workersWithDistance.map((item) => {
            return renderWorkerPublicCard(
              item.worker,
              `${item.km} km away`,
              { showVerification: false }
            );
          }).join("");
        }
      }
    }

    renderWorkersOnMap();
  } catch {
    if (list) {
      list.innerHTML = `<div class="empty-state">Could not load nearby workers.</div>`;
    }
  }
}

function initMap() {
  if (!$("map")) return;

  if (!window.L) {
    showToast("Map library not loaded.", "error");
    return;
  }

  if (mapInstance) {
    setTimeout(() => {
      mapInstance.invalidateSize();
    }, 200);

    renderWorkersOnMap();
    return;
  }

  mapInstance = L.map("map").setView([28.6139, 77.2090], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap"
  }).addTo(mapInstance);

  renderWorkersOnMap();
}

function renderWorkersOnMap() {
  if (!mapInstance || !window.L) return;

  workerMarkers.forEach((marker) => marker.remove());
  workerMarkers = [];

  allNearbyWorkersCache.forEach((worker) => {
    if (!worker.location?.lat || !worker.location?.lng) return;

    const marker = L.marker([worker.location.lat, worker.location.lng])
      .addTo(mapInstance)
      .bindPopup(`
        <strong>${escapeHtml(worker.workerName || "Worker")}</strong>
        <br>
        ${escapeHtml(worker.workerSkill || "")}
        <br>
        ${escapeHtml(worker.workerCity || "")}
      `);

    workerMarkers.push(marker);
  });
}

function useCurrentLocationForMap() {
  if (!navigator.geolocation) {
    showToast("Location is not supported.", "error");
    return;
  }

  initMap();

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      if (mapInstance) {
        mapInstance.setView([lat, lng], 13);

        if (userMapMarker) {
          userMapMarker.remove();
        }

        userMapMarker = L.marker([lat, lng])
          .addTo(mapInstance)
          .bindPopup("You are here")
          .openPopup();
      }

      await loadNearbyWorkers(lat, lng);
    },
    () => {
      showToast("Location permission denied.", "error");
    }
  );
}

/* Accounts */
async function saveAccountDetails(event) {
  event.preventDefault();

  if (!currentUser) {
    showToast("Please login first.", "error");
    return;
  }

  const accountData = {
    uid: currentUser.uid,
    accountHolder: $("accountHolder")?.value.trim() || "",
    bankName: $("bankName")?.value.trim() || "",
    bankAccountNumber: $("bankAccountNumber")?.value.trim() || "",
    ifscCode: $("ifscCode")?.value.trim() || "",
    upiId: $("upiId")?.value.trim() || "",
    preferredPayout: $("preferredPayout")?.value || "upi",
    updatedAt: nowServer()
  };

  await db.collection("workerAccounts").doc(currentUser.uid).set(accountData, { merge: true });

  showToast("Account details saved.");
}

async function loadAccountDetails() {
  if (!currentUser) return;

  const snap = await db.collection("workerAccounts").doc(currentUser.uid).get();

  if (snap.exists) {
    const data = snap.data();

    if ($("accountHolder")) $("accountHolder").value = data.accountHolder || "";
    if ($("bankName")) $("bankName").value = data.bankName || "";
    if ($("bankAccountNumber")) $("bankAccountNumber").value = data.bankAccountNumber || "";
    if ($("ifscCode")) $("ifscCode").value = data.ifscCode || "";
    if ($("upiId")) $("upiId").value = data.upiId || "";
    if ($("preferredPayout")) $("preferredPayout").value = data.preferredPayout || "upi";
  }
}

/* Earnings */
async function loadWorkerEarnings() {
  if (!currentUser) return;

  const list = $("workerEarningsList");

  try {
    const snap = await db.collection("earnings")
      .where("workerUserId", "==", currentUser.uid)
      .limit(100)
      .get();

    const earnings = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    let total = 0;
    let pending = 0;
    let paid = 0;

    earnings.forEach((item) => {
      const amount = Number(item.workerAmount || 0);
      total += amount;

      if (item.payoutStatus === "paid") {
        paid += amount;
      } else {
        pending += amount;
      }
    });

    if ($("workerTotalEarned")) $("workerTotalEarned").textContent = formatMoney(total);
    if ($("workerPendingPayout")) $("workerPendingPayout").textContent = formatMoney(pending);
    if ($("workerPaidPayout")) $("workerPaidPayout").textContent = formatMoney(paid);

    const workerSnap = await db.collection("workers").doc(currentUser.uid).get();

    if ($("workerTotalJobs")) {
      $("workerTotalJobs").textContent = workerSnap.data()?.totalJobs || 0;
    }

    if (!list) return;

    if (!earnings.length) {
      list.innerHTML = `<div class="empty-state">No earnings yet.</div>`;
      return;
    }

    list.innerHTML = `
      <div class="card-grid">
        ${earnings.map((item) => `
          <article class="data-card">
            <span class="status ${item.payoutStatus === "paid" ? "success" : "pending"}">
              ${escapeHtml(item.payoutStatus || "pending")}
            </span>

            <h3>${formatMoney(item.workerAmount)}</h3>

            <p><strong>Booking:</strong> ${escapeHtml(item.bookingId)}</p>
            <p><strong>Gross:</strong> ${formatMoney(item.grossAmount)}</p>
            <p><strong>Platform Commission:</strong> ${formatMoney(item.platformCommission)}</p>
          </article>
        `).join("")}
      </div>
    `;
  } catch (error) {
    if (list) {
      list.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    }
  }
}

/* Chat */
async function loadChatBookings() {
  const list = $("chatBookingList");

  if (!currentUser || !list) return;

  list.innerHTML = `<div class="empty-state">Loading chats...</div>`;

  try {
    let snap;

    if (getUserRole() === "worker") {
      snap = await db.collection("bookings")
        .where("assignedWorkerId", "==", currentUser.uid)
        .limit(50)
        .get();
    } else {
      snap = await db.collection("bookings")
        .where("customerId", "==", currentUser.uid)
        .limit(50)
        .get();
    }

    const bookings = snap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter((b) => b.acceptedBid);

    if (!bookings.length) {
      list.innerHTML = `<p class="muted">No active chats yet.</p>`;
      return;
    }

    list.innerHTML = bookings.map((booking) => `
      <button class="chat-booking-btn" onclick="openBookingChat('${booking.id}')">
        <strong>${escapeHtml(booking.skill)}</strong>
        <span>${escapeHtml(booking.bookingStatus)}</span>
      </button>
    `).join("");
  } catch (error) {
    list.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
  }
}

async function openBookingChat(bookingId) {
  goToSection("chat");

  currentChatBookingId = bookingId;

  const bookingSnap = await db.collection("bookings").doc(bookingId).get();

  if (!bookingSnap.exists) {
    showToast("Booking not found.", "error");
    return;
  }

  currentChatBookingData = {
    id: bookingId,
    ...bookingSnap.data()
  };

  if ($("chatHeader")) {
    $("chatHeader").innerHTML = `
      <strong>${escapeHtml(currentChatBookingData.skill)}</strong>
      <span>${escapeHtml(currentChatBookingData.bookingStatus)}</span>
    `;
  }

  const canCall =
    currentChatBookingData.paymentStatus === "paid" &&
    currentChatBookingData.workerCanSeeContact &&
    currentChatBookingData.bookingStatus !== "completed";

  $("callBox")?.classList.toggle("hidden", !canCall);

  if ($("callButton")) {
    const phone =
      getUserRole() === "worker"
        ? currentChatBookingData.customerPhone
        : currentChatBookingData.acceptedBid?.workerPhone || "";

    $("callButton").onclick = () => {
      if (phone) {
        window.location.href = `tel:${phone}`;
      } else {
        showToast("Phone number not available.", "error");
      }
    };
  }

  if (chatUnsubscribe) {
    chatUnsubscribe();
  }

  chatUnsubscribe = db.collection("chats")
    .doc(bookingId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .limit(100)
    .onSnapshot((snap) => {
      const messages = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      renderChatMessages(messages);
    });
}

function renderChatMessages(messages) {
  const box = $("chatMessages");

  if (!box) return;

  if (!messages.length) {
    box.innerHTML = `<p class="muted">No messages yet. Start the conversation.</p>`;
    return;
  }

  box.innerHTML = messages.map((msg) => {
    const mine = msg.senderId === currentUser?.uid;

    return `
      <div class="message ${mine ? "mine" : "theirs"}">
        <strong>${escapeHtml(msg.senderName || "User")}</strong>
        <p>${escapeHtml(msg.text)}</p>
      </div>
    `;
  }).join("");

  box.scrollTop = box.scrollHeight;
}

async function sendChatMessage(event) {
  event.preventDefault();

  if (!currentUser || !currentChatBookingId) {
    showToast("Select a chat first.", "error");
    return;
  }

  if (currentChatBookingData?.bookingStatus === "completed") {
    showToast("Chat is closed after work completion.", "error");
    return;
  }

  const input = $("chatInput");
  const text = input?.value.trim() || "";

  if (!text) return;

  await db.collection("chats")
    .doc(currentChatBookingId)
    .collection("messages")
    .add({
      bookingId: currentChatBookingId,
      senderId: currentUser.uid,
      senderName: currentUserProfile?.name || currentUser.email || "User",
      text,
      createdAt: nowServer()
    });

  await db.collection("chats").doc(currentChatBookingId).set({
    updatedAt: nowServer(),
    lastMessage: text
  }, { merge: true });

  input.value = "";
}

/* Support / Notifications */
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
}

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
  } catch {}
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

    const notifications = snap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    const unread = notifications.filter((n) => !n.read).length;

    $("notifyDot")?.classList.toggle("hidden", unread === 0);

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

/* Admin */
function setAdminTab(tab) {
  currentAdminTab = tab;

  document.querySelectorAll("#admin .dash-tabs .tab").forEach((btn) => {
    btn.classList.remove("active");
  });

  const tabs = [
    "users",
    "workers",
    "bookings",
    "payments",
    "payouts",
    "support",
    "prices"
  ];

  const index = tabs.indexOf(tab);
  const buttons = document.querySelectorAll("#admin .dash-tabs .tab");

  if (buttons[index]) {
    buttons[index].classList.add("active");
  }

  loadAdminPanel();
}

async function loadAdminPanel() {
  if (!currentUser || !isAdminUser()) return;

  await loadAdminStats();

  if (currentAdminTab === "users") await loadAdminUsers();
  else if (currentAdminTab === "workers") await loadAdminWorkers();
  else if (currentAdminTab === "bookings") await loadAdminBookings();
  else if (currentAdminTab === "payments") await loadAdminPayments();
  else if (currentAdminTab === "payouts") await loadAdminPayouts();
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
  } catch {}
}

async function loadAdminUsers() {
  const content = $("adminContent");

  if (!content) return;

  const snap = await db.collection("users").limit(100).get();

  const users = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));

  content.innerHTML = `
    <div class="card-grid">
      ${users.map((user) => `
        <article class="data-card">
          <span class="status">${escapeHtml(user.role || "customer")}</span>

          <h3>${escapeHtml(user.name || "User")}</h3>

          <p><strong>Email:</strong> ${escapeHtml(user.email || "-")}</p>
          <p><strong>Phone:</strong> ${escapeHtml(user.phone || "-")}</p>
          <p><strong>City:</strong> ${escapeHtml(user.city || "-")}</p>
          <p><strong>Total Earned:</strong> ${formatMoney(user.totalEarned || 0)}</p>
          <p><strong>Pending Payout:</strong> ${formatMoney(user.pendingPayout || 0)}</p>
        </article>
      `).join("")}
    </div>
  `;
}

async function loadAdminWorkers() {
  const content = $("adminContent");

  if (!content) return;

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
          <span class="status ${worker.verified ? "success" : "pending"}">
            ${worker.verified ? "Verified" : "Pending"}
          </span>

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

  await createNotification(
    workerId,
    "Worker verification updated",
    verified ? "Your worker profile is verified." : "Your verification was removed."
  );

  showToast(verified ? "Worker verified." : "Worker unverified.");

  await Promise.all([
    loadAdminPanel(),
    loadFeaturedWorkers(),
    loadNearbyWorkers()
  ]);
}

async function loadAdminBookings() {
  const content = $("adminContent");

  if (!content) return;

  const snap = await db.collection("bookings").limit(100).get();

  const bookings = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));

  content.innerHTML = `
    <div class="card-grid">
      ${bookings.map((booking) => `
        <article class="data-card">
          <span class="status">${escapeHtml(booking.bookingStatus || "-")}</span>

          <h3>${escapeHtml(booking.skill || "-")}</h3>

          <p><strong>Customer:</strong> ${escapeHtml(booking.customerName || "-")}</p>
          <p><strong>Worker:</strong> ${escapeHtml(booking.assignedWorkerName || "-")}</p>
          <p><strong>Budget:</strong> ${formatMoney(booking.budget || 0)}</p>
          <p><strong>Payment:</strong> ${escapeHtml(booking.paymentStatus || "-")}</p>
          <p>${escapeHtml(booking.details || "")}</p>
        </article>
      `).join("")}
    </div>
  `;
}

async function loadAdminPayments() {
  const content = $("adminContent");

  if (!content) return;

  const snap = await db.collection("payments").limit(100).get();

  const payments = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));

  if (!payments.length) {
    content.innerHTML = `<div class="empty-state">No payments found.</div>`;
    return;
  }

  content.innerHTML = `
    <div class="card-grid">
      ${payments.map((p) => `
        <article class="data-card">
          <span class="status ${p.status === "paid" ? "success" : "pending"}">
            ${escapeHtml(p.status || "created")}
          </span>

          <h3>${formatMoney(p.amount || 0, p.currency || "INR")}</h3>

          <p><strong>Booking:</strong> ${escapeHtml(p.bookingId || "-")}</p>
          <p><strong>Order:</strong> ${escapeHtml(p.razorpayOrderId || p.id)}</p>
          <p><strong>Worker:</strong> ${escapeHtml(p.workerUserId || "-")}</p>
        </article>
      `).join("")}
    </div>
  `;
}

async function loadAdminPayouts() {
  const content = $("adminContent");

  if (!content) return;

  const snap = await db.collection("earnings").limit(100).get();

  const earnings = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));

  if (!earnings.length) {
    content.innerHTML = `<div class="empty-state">No payout ledger found.</div>`;
    return;
  }

  content.innerHTML = `
    <div class="card-grid">
      ${earnings.map((e) => `
        <article class="data-card">
          <span class="status ${e.payoutStatus === "paid" ? "success" : "pending"}">
            ${escapeHtml(e.payoutStatus || "pending")}
          </span>

          <h3>${formatMoney(e.workerAmount || 0)}</h3>

          <p><strong>Worker:</strong> ${escapeHtml(e.workerUserId || "-")}</p>
          <p><strong>Booking:</strong> ${escapeHtml(e.bookingId || "-")}</p>
          <p><strong>Gross:</strong> ${formatMoney(e.grossAmount || 0)}</p>
          <p><strong>Commission:</strong> ${formatMoney(e.platformCommission || 0)}</p>

          ${
            e.payoutStatus !== "paid"
              ? `<button class="btn success" onclick="adminMarkPayoutPaid('${e.id}', '${e.workerUserId}', ${Number(e.workerAmount || 0)})">Mark Paid</button>`
              : ""
          }
        </article>
      `).join("")}
    </div>
  `;
}

async function adminMarkPayoutPaid(earningId, workerUserId, amount) {
  if (!isAdminUser()) return;

  await db.collection("earnings").doc(earningId).set({
    payoutStatus: "paid",
    paidAt: nowServer(),
    updatedAt: nowServer()
  }, { merge: true });

  await db.collection("users").doc(workerUserId).set({
    pendingPayout: firebase.firestore.FieldValue.increment(-amount),
    paidPayout: firebase.firestore.FieldValue.increment(amount),
    updatedAt: nowServer()
  }, { merge: true });

  await createNotification(
    workerUserId,
    "Payout marked paid",
    `${formatMoney(amount)} payout marked as paid by admin.`
  );

  showToast("Payout marked as paid.");

  await loadAdminPayouts();
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
          <span class="status ${ticket.status === "closed" ? "success" : "pending"}">
            ${escapeHtml(ticket.status)}
          </span>

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

  await loadAdminSupport();
}

async function adminCloseTicket(ticketId) {
  await db.collection("supportTickets").doc(ticketId).set({
    status: "closed",
    updatedAt: nowServer()
  }, { merge: true });

  showToast("Ticket closed.");

  await loadAdminSupport();
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

/* Global Exports */
Object.assign(window, {
  openSidebar,
  closeSidebar,
  closeAllOverlays,
  toggleNotificationDrawer,
  closeNotificationDrawer,
  openAuthModal,
  closeAuthModal,
  setAuthMode,
  handleAuth,
  socialLogin,
  logoutUser,
  openForgotModal,
  closeForgotModal,
  changeResetMethod,
  requestResetOtp,
  verifyResetOtp,
  goToSection,
  openSettingsSection,
  saveSettings,
  saveSideSettings,
  heroFindWorkers,
  selectServiceAndBook,
  calculateMinimumPrice,
  saveUserProfile,
  registerWorker,
  saveWorkerCurrentLocation,
  createBooking,
  acceptBid,
  payForBooking,
  markBookingComplete,
  reviewWorker,
  loadPublicJobs,
  renderPublicJobs,
  openBidPrompt,
  useCurrentLocationForMap,
  loadNearbyWorkers,
  saveAccountDetails,
  openBookingChat,
  sendChatMessage,
  createSupportTicket,
  setAdminTab,
  adminVerifyWorker,
  adminMarkPayoutPaid,
  adminReplyTicket,
  adminCloseTicket,
  adminSavePrices
});
/* ===== RAPIDESERVICE PORTAL FIX PATCH 3 ===== */

(function () {
  function clean(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function notificationTarget(title = "", message = "") {
    const text = `${title} ${message}`.toLowerCase();

    if (text.includes("support") || text.includes("query") || text.includes("problem")) {
      return isAdminUser() ? "admin" : "support";
    }

    if (text.includes("payment") || text.includes("paid") || text.includes("booking")) {
      return getUserRole() === "worker" ? "workerEarnings" : "customerDashboard";
    }

    if (text.includes("earning") || text.includes("payout")) {
      return "workerEarnings";
    }

    if (text.includes("bid") || text.includes("job") || text.includes("work")) {
      return getUserRole() === "worker" ? "workerJobs" : "customerDashboard";
    }

    if (text.includes("chat")) {
      return "chat";
    }

    return getUserRole() === "worker" ? "workerJobs" : "customerDashboard";
  }

  window.openNotificationTarget = async function (notificationId, sectionId) {
    try {
      if (notificationId && currentUser) {
        await db.collection("notifications").doc(notificationId).set({
          read: true,
          updatedAt: nowServer()
        }, { merge: true });
      }
    } catch {}

    closeNotificationDrawer();

    if (sectionId === "admin") {
      goToSection("admin");
      setTimeout(function () {
        setAdminTab("support");
      }, 300);
      return;
    }

    goToSection(sectionId || "customerDashboard");
    setTimeout(loadNotifications, 500);
  };

  window.loadNotifications = async function () {
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

      const notifications = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      const unread = notifications.filter((item) => !item.read).length;
      $("notifyDot")?.classList.toggle("hidden", unread === 0);

      if (!notifications.length) {
        list.innerHTML = `<p class="muted">No notifications yet.</p>`;
        return;
      }

      list.innerHTML = notifications.map((item) => {
        const target = item.targetSection || notificationTarget(item.title, item.message);

        return `
          <button
            class="notification-item"
            style="width:100%;text-align:left;cursor:pointer;border:none;"
            onclick="openNotificationTarget('${item.id}', '${target}')"
          >
            <strong>${clean(item.title)}</strong>
            <p>${clean(item.message)}</p>
            <small>${item.read ? "Opened" : "Click to open"}</small>
          </button>
        `;
      }).join("");
    } catch (error) {
      list.innerHTML = `<p class="muted">${clean(error.message)}</p>`;
    }
  };

  try {
    loadNotifications = window.loadNotifications;
  } catch {}

  window.createNotification = async function (toUserId, title, message, targetSection = "") {
    if (!toUserId) return;

    try {
      await db.collection("notifications").add({
        toUserId,
        title,
        message,
        targetSection: targetSection || notificationTarget(title, message),
        read: false,
        createdAt: nowServer()
      });
    } catch {}
  };

  try {
    createNotification = window.createNotification;
  } catch {}

  function makeAdminPortalClean() {
    if (!currentUser || !isAdminUser()) return;

    document.querySelectorAll(".desktop-nav a").forEach((link) => {
      link.classList.add("hidden");
    });

    if (!document.getElementById("adminOnlyTopLink")) {
      const nav = document.querySelector(".desktop-nav");

      if (nav) {
        nav.insertAdjacentHTML(
          "beforeend",
          `<a id="adminOnlyTopLink" href="javascript:void(0)" onclick="goToSection('admin')">Admin Panel</a>`
        );
      }
    }

    document.querySelectorAll(".side-nav button").forEach((btn) => {
      btn.classList.add("hidden");
    });

    $("adminSideBtn")?.classList.remove("hidden");

    if (!document.getElementById("adminWorkBox")) {
      const sidebar = document.querySelector(".side-nav");

      if (sidebar) {
        sidebar.insertAdjacentHTML(
          "afterend",
          `
          <div id="adminWorkBox" class="side-settings-card">
            <h4>Admin Work</h4>
            <button class="btn light full" onclick="goToSection('admin'); setAdminTab('support')">Solve Queries</button>
            <button class="btn light full" onclick="goToSection('admin'); setAdminTab('users')">Customers / Users</button>
            <button class="btn light full" onclick="goToSection('admin'); setAdminTab('workers')">Workers</button>
            <button class="btn light full" onclick="goToSection('admin'); setAdminTab('bookings')">Bookings</button>
            <button class="btn light full" onclick="goToSection('admin'); setAdminTab('payments')">Payments</button>
            <button class="btn light full" onclick="goToSection('admin'); setAdminTab('payouts')">Payouts</button>
          </div>
          `
        );
      }
    }

    [
      "services",
      "nearby",
      "howItWorks",
      "featuredWorkers",
      "profile",
      "book",
      "customerDashboard",
      "workerProfile",
      "workerJobs",
      "workerEarnings",
      "accounts",
      "chat",
      "support",
      "settings"
    ].forEach((id) => {
      $(id)?.classList.add("hidden");
    });

    $("admin")?.classList.remove("hidden");

    if (!document.getElementById("adminPurposeBox")) {
      const head = $("admin")?.querySelector(".section-head");

      if (head) {
        head.insertAdjacentHTML(
          "afterend",
          `
          <div id="adminPurposeBox" class="info-card">
            <h3>Admin Portal Purpose</h3>
            <p><strong>1.</strong> Admin helps customers and workers.</p>
            <p><strong>2.</strong> Admin solves support queries, booking problems, payment issues and worker payout problems.</p>
            <p><strong>3.</strong> Admin portal is not for browsing services like customer or worker.</p>
          </div>
          `
        );
      }
    }
  }

  function makeNormalPortalMenu() {
    if (isAdminUser()) return;

    document.getElementById("adminOnlyTopLink")?.remove();
    document.getElementById("adminWorkBox")?.remove();

    document.querySelectorAll(".desktop-nav a").forEach((link) => {
      link.classList.remove("hidden");
    });
  }

  function addWorkerEarnBox() {
    if (!currentUser || getUserRole() !== "worker") return;

    const workerJobs = $("workerJobs");
    if (!workerJobs) return;

    if (!document.getElementById("workerEarnBox")) {
      const head = workerJobs.querySelector(".section-head");

      if (head) {
        head.insertAdjacentHTML(
          "afterend",
          `
          <div id="workerEarnBox" class="info-card">
            <h3>Worker Earning Status</h3>
            <p id="workerEarnText">Checking status...</p>

            <div class="grid-2">
              <button class="btn success full" onclick="setWorkerEarnStatus(true)">🟢 Earn ON</button>
              <button class="btn danger full" onclick="setWorkerEarnStatus(false)">🔴 Earn OFF</button>
            </div>

            <p class="muted">Earn ON means worker can receive jobs and send bids. Earn OFF means worker is not available for new jobs.</p>
          </div>
          `
        );
      }
    }

    loadWorkerEarnStatus();
  }

  window.loadWorkerEarnStatus = async function () {
    if (!currentUser || getUserRole() !== "worker") return;

    try {
      const snap = await db.collection("workers").doc(currentUser.uid).get();

      if (!snap.exists) return;

      const worker = snap.data();
      const available = worker.available !== false;

      const text = $("workerEarnText");

      if (text) {
        text.innerHTML = available
          ? `<span class="status success">Earn ON</span> You can receive work requests and send bids.`
          : `<span class="status pending">Earn OFF</span> You are not receiving new work now.`;
      }
    } catch {}
  };

  window.setWorkerEarnStatus = async function (available) {
    if (!currentUser || getUserRole() !== "worker") {
      showToast("Only workers can change earning status.", "error");
      return;
    }

    const availability = available ? "Available Now" : "Not Available";

    try {
      await db.collection("workers").doc(currentUser.uid).set({
        available,
        availability,
        updatedAt: nowServer()
      }, { merge: true });

      await db.collection("workerPublic").doc(currentUser.uid).set({
        available,
        availability,
        updatedAt: nowServer()
      }, { merge: true });

      showToast(available ? "Earn ON. You can receive jobs." : "Earn OFF. You are not available now.");

      await loadWorkerEarnStatus();
      await loadNearbyWorkers();
    } catch (error) {
      showToast(error.message || "Status update failed.", "error");
    }
  };

  const oldOpenBidPrompt = window.openBidPrompt;

  window.openBidPrompt = async function (bookingId) {
    if (!currentUser) {
      openAuthModal("login");
      return;
    }

    if (getUserRole() !== "worker") {
      showToast("Only workers can bid on jobs.", "error");
      return;
    }

    const workerSnap = await db.collection("workers").doc(currentUser.uid).get();

    if (!workerSnap.exists) {
      showToast("Please save worker profile first.", "error");
      goToSection("workerProfile");
      return;
    }

    const worker = workerSnap.data();

    if (worker.available === false || worker.availability === "Not Available") {
      showToast("Earn is OFF. Turn ON to send bid.", "error");
      goToSection("workerJobs");
      addWorkerEarnBox();
      return;
    }

    return oldOpenBidPrompt(bookingId);
  };

  try {
    openBidPrompt = window.openBidPrompt;
  } catch {}

  window.goToRoleHome = async function () {
    if (!currentUser) {
      goToSection("home");
      return;
    }

    if (isAdminUser()) {
      goToSection("admin");
      setTimeout(function () {
        makeAdminPortalClean();
        setAdminTab("support");
      }, 300);
      return;
    }

    if (getUserRole() === "worker") {
      const snap = await db.collection("workers").doc(currentUser.uid).get();

      if (snap.exists) {
        goToSection("workerJobs");
        setTimeout(addWorkerEarnBox, 500);
      } else {
        goToSection("workerProfile");
      }

      return;
    }

    goToSection("customerDashboard");
  };

  try {
    goToRoleHome = window.goToRoleHome;
  } catch {}

  const oldGoToSection = window.goToSection;

  window.goToSection = function (id) {
    if (isAdminUser() && id !== "admin") {
      oldGoToSection("admin");
      setTimeout(function () {
        makeAdminPortalClean();
        setAdminTab("support");
      }, 300);
      return;
    }

    oldGoToSection(id);

    setTimeout(function () {
      if (isAdminUser()) {
        makeAdminPortalClean();
      } else {
        makeNormalPortalMenu();
      }

      if (id === "workerJobs" && getUserRole() === "worker") {
        addWorkerEarnBox();
      }
    }, 300);
  };

  try {
    goToSection = window.goToSection;
  } catch {}

  const oldUpdateAuthUI = window.updateAuthUI;

  window.updateAuthUI = function () {
    if (oldUpdateAuthUI) oldUpdateAuthUI();

    setTimeout(function () {
      if (isAdminUser()) {
        makeAdminPortalClean();
      } else {
        makeNormalPortalMenu();
      }

      if (getUserRole() === "worker") {
        addWorkerEarnBox();
      }
    }, 400);
  };

  try {
    updateAuthUI = window.updateAuthUI;
  } catch {}

  const oldLoadPublicJobs = window.loadPublicJobs;

  window.loadPublicJobs = async function () {
    if (oldLoadPublicJobs) {
      await oldLoadPublicJobs();
    }

    if (getUserRole() === "worker") {
      addWorkerEarnBox();
    }
  };

  try {
    loadPublicJobs = window.loadPublicJobs;
  } catch {}

  setTimeout(function () {
    if (!currentUser) return;

    updateAuthUI();

    if (isAdminUser()) {
      makeAdminPortalClean();
    }

    if (getUserRole() === "worker") {
      addWorkerEarnBox();
    }
  }, 1200);
})();
