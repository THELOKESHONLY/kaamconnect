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
  doc,
  setDoc,
  getDoc,
  updateDoc,
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

let currentUser = null;
let currentProfile = null;
let currentRole = "";

const ADMIN_LOGIN_IDS = ["thelokeshonly"];

const SERVICES = [
  ["Electrician", "Fan, light, switchboard and wiring repair."],
  ["Plumber", "Tap repair, pipe fitting and bathroom work."],
  ["Cleaner", "Home, office and deep cleaning."],
  ["Tutor", "Home tuition and online tuition."],
  ["Cook", "Daily cooking and party cooking."],
  ["Painter", "House painting and wall repair."],
  ["AC Repair", "AC service, repair and installation."],
  ["Carpenter", "Furniture, door and wood work."],
  ["Driver", "Local driver and personal driver service."],
  ["Gardener", "Garden cleaning and plant care."],
  ["Security Guard", "Home, office and event security."],
  ["House Helper", "Daily household help."],
  ["Maid", "Cleaning, washing and daily support."],
  ["Mechanic", "Bike, car and machine repair support."],
  ["Mobile Repair", "Screen, battery and software issues."],
  ["Computer Repair", "Laptop, desktop and software repair."],
  ["Photographer", "Event and personal photography."],
  ["Makeup Artist", "Party, bridal and event makeup."],
  ["Nurse / Caretaker", "Patient care and elder care."],
  ["Delivery Boy", "Local parcel pickup and delivery."],
  ["Event Helper", "Event setup and support staff."],
  ["Freelancer / General Helper", "Queue standing, hospital line, errands, travel help, pickup, small legal tasks and basic helper work."]
];

const currencySymbols = {
  INR: "₹",
  AED: "د.إ",
  USD: "$",
  GBP: "£",
  CAD: "C$",
  AUD: "A$"
};

function getValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function showMessage(id, message) {
  const element = document.getElementById(id);
  if (element) element.textContent = message;
}

function safeText(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}

function cleanText(value = "") {
  return String(value).trim().toLowerCase();
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

function selectedCountry() {
  return getValue("countrySelector") || "India";
}

function selectedCurrency() {
  return getValue("currencySelector") || "INR";
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

function isFreelancerSkill(skill) {
  return skill === "Freelancer / General Helper";
}

function clearForm(formId) {
  const form = document.getElementById(formId);
  if (form) form.reset();
}

function makeReferralCode(loginId) {
  return "KC" + String(loginId || "USER").replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 8);
}

function serviceShortCode(serviceName) {
  return String(serviceName)
    .replace(/[^a-zA-Z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "KC";
}

function handleServiceClick(serviceName) {
  const serviceType = document.getElementById("serviceType");
  const quickService = document.getElementById("quickService");

  if (quickService) quickService.value = serviceName;
  if (serviceType) serviceType.value = serviceName;

  if (!currentUser) {
    document.getElementById("login")?.scrollIntoView({ behavior: "smooth" });
    showMessage("authMessage", "Login or signup first to book " + serviceName + ".");
    return;
  }

  if (currentRole !== "customer") {
    document.getElementById("login")?.scrollIntoView({ behavior: "smooth" });
    showMessage("authMessage", "Please use a customer account to book a worker.");
    return;
  }

  document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  showMessage("bookingMessage", serviceName + " selected. Fill your work details.");
}

function fillServices() {
  document.querySelectorAll(".service-select").forEach((select) => {
    const first = select.querySelector("option")?.textContent || "Choose service";
    select.innerHTML = `<option value="">${first}</option>`;

    SERVICES.forEach((service) => {
      select.innerHTML += `<option>${safeText(service[0])}</option>`;
    });
  });

  const grid = document.getElementById("servicesGrid");

  if (grid) {
    grid.innerHTML = SERVICES.map((service, index) => `
      <button class="service-card service-card-click" data-service="${safeText(service[0])}" type="button">
        <div class="service-image service-image-${(index % 6) + 1}">
          <span>${safeText(serviceShortCode(service[0]))}</span>
        </div>

        <div class="service-content">
          <h3>${safeText(service[0])}</h3>
          <p>${safeText(service[1])}</p>
          <strong>Book this service →</strong>
        </div>
      </button>
    `).join("");

    grid.querySelectorAll(".service-card-click").forEach((card) => {
      card.addEventListener("click", () => {
        handleServiceClick(card.dataset.service);
      });
    });
  }
}

function updateCurrencySymbols() {
  document.querySelectorAll(".currency-symbol").forEach((item) => {
    item.textContent = currencySymbol();
  });
}

function profileTrustScore(profile) {
  let score = 25;

  if (profile?.phoneVerified === true) score += 35;
  if (profile?.phone) score += 15;
  if (profile?.city) score += 10;
  if (profile?.bio) score += 10;
  if (profile?.photoUrl) score += 5;

  return Math.min(score, 100);
}

function profileRoleText() {
  if (!currentUser) return "Guest";
  if (isAdminUser()) return "Admin";
  if (currentRole === "worker") return "Worker";
  return "Customer";
}

function avatarHTML(profile) {
  if (profile?.photoUrl) {
    return `<img src="${safeText(profile.photoUrl)}" alt="Profile">`;
  }

  const name = profile?.name || "KC";
  return safeText(name.slice(0, 2).toUpperCase());
}

function refreshProfessionalProfileUI() {
  const loggedIn = !!currentUser;
  const profile = currentProfile || {};
  const name = loggedIn ? (profile.name || currentUser.email || "User") : "Guest User";
  const role = profileRoleText();
  const score = loggedIn ? profileTrustScore(profile) : 0;
  const verified = profile.phoneVerified === true;

  const previewAvatar = document.getElementById("profilePreviewAvatar");
  const previewName = document.getElementById("profilePreviewName");
  const previewRole = document.getElementById("profilePreviewRole");
  const previewVerify = document.getElementById("profilePreviewVerify");
  const previewCountry = document.getElementById("profilePreviewCountry");
  const trustScore = document.getElementById("profileTrustScore");
  const roleStat = document.getElementById("profileRoleStat");
  const uploadPreview = document.getElementById("profileUploadPreview");

  if (previewAvatar) previewAvatar.innerHTML = avatarHTML(profile);
  if (uploadPreview) uploadPreview.innerHTML = avatarHTML(profile);
  if (previewName) previewName.textContent = name;
  if (previewRole) previewRole.textContent = loggedIn ? role + " Account" : "Login to update your profile";
  if (previewVerify) previewVerify.textContent = verified ? "Phone Verified" : loggedIn ? "Verification Pending" : "Not Verified";
  if (previewCountry) previewCountry.textContent = profile.country || selectedCountry();
  if (trustScore) trustScore.textContent = score + "%";
  if (roleStat) roleStat.textContent = role;
}

fillServices();
updateCurrencySymbols();

document.getElementById("currencySelector")?.addEventListener("change", updateCurrencySymbols);

const sideToggle = document.getElementById("sideToggle");
const sideDashboard = document.getElementById("sideDashboard");

function closeSidebar() {
  if (sideDashboard) sideDashboard.classList.add("closed");
}

function toggleSidebar() {
  if (sideDashboard) sideDashboard.classList.toggle("closed");
}

if (sideDashboard) {
  sideDashboard.classList.add("closed");
}

if (sideToggle && sideDashboard) {
  sideToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleSidebar();
  });

  sideDashboard.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", () => {
    closeSidebar();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSidebar();
  });
}

document.querySelectorAll(".sidebar-menu a").forEach((link) => {
  link.addEventListener("click", () => {
    closeSidebar();
  });
});

const profilePanel = document.getElementById("profile-update");
const closeProfilePanelBtn = document.getElementById("closeProfilePanelBtn");

function openProfilePanel() {
  if (!profilePanel) return;

  profilePanel.classList.remove("hidden");

  setTimeout(() => {
    profilePanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 80);

  refreshProfessionalProfileUI();
}

function closeProfilePanel() {
  if (!profilePanel) return;
  profilePanel.classList.add("hidden");
}

document.querySelectorAll(".profile-open-link").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openProfilePanel();
  });
});

if (closeProfilePanelBtn) {
  closeProfilePanelBtn.addEventListener("click", closeProfilePanel);
}

function setAuthMode(mode) {
  const signup = mode === "signup";

  document.getElementById("signupFields").classList.toggle("hidden", !signup);
  document.getElementById("signupBtn").classList.toggle("hidden", !signup);
  document.getElementById("loginBtn").classList.toggle("hidden", signup);

  document.getElementById("showSignupTab").classList.toggle("active", signup);
  document.getElementById("showLoginTab").classList.toggle("active", !signup);

  showMessage("authMessage", signup ? "Create your account." : "Login with User ID and password.");
}

document.getElementById("showSignupTab")?.addEventListener("click", () => setAuthMode("signup"));
document.getElementById("showLoginTab")?.addEventListener("click", () => setAuthMode("login"));

setAuthMode("signup");

function setPortalVisibility() {
  const isCustomer = currentUser && currentRole === "customer";
  const isWorker = currentUser && currentRole === "worker";
  const isAdmin = isAdminUser();

  document.querySelectorAll(".customer-only").forEach((item) => item.classList.toggle("hidden", !isCustomer));
  document.querySelectorAll(".worker-only").forEach((item) => item.classList.toggle("hidden", !isWorker));
  document.querySelectorAll(".admin-only").forEach((item) => item.classList.toggle("hidden", !isAdmin));

  const accountNameLine = document.getElementById("accountNameLine");
  const accountRoleLine = document.getElementById("accountRoleLine");

  if (!currentUser) {
    if (accountNameLine) accountNameLine.textContent = "Not logged in";
    if (accountRoleLine) accountRoleLine.textContent = "Login to start.";
    refreshProfessionalProfileUI();
    return;
  }

  const roleText = isAdmin ? "Admin" : currentRole === "worker" ? "Worker / Freelancer" : "Customer";

  if (accountNameLine) accountNameLine.textContent = "Logged in: " + (currentProfile?.name || currentUser.email);
  if (accountRoleLine) accountRoleLine.textContent = "Portal: " + roleText;

  refreshProfessionalProfileUI();
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
      phone: "",
      role: "customer",
      phoneVerified: false,
      blocked: false,
      referralCode: makeReferralCode(user.email),
      country: selectedCountry(),
      currency: selectedCurrency(),
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
    showMessage(messageId, "This section is only for worker / freelancer accounts.");
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

document.getElementById("signupBtn")?.addEventListener("click", async () => {
  const name = getValue("authName");
  const phone = cleanPhone(getValue("authPhone"));
  const invitedBy = getValue("authReferral").toUpperCase();
  const role = getValue("authRole");
  const loginId = publicLoginId(getValue("authUserId"));
  const email = normalizeLoginEmail(loginId);
  const password = getValue("authPassword");

  if (!name || !phone || !role || !loginId || !email || !password) {
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
    const referralCode = makeReferralCode(loginId);

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
      referralCode,
      invitedBy,
      country: selectedCountry(),
      currency: selectedCurrency(),
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

    currentProfile = profile;
    currentRole = role;
    setPortalVisibility();
    clearForm("authForm");

    showMessage("authMessage", "Account created successfully.");
  } catch (error) {
    showMessage("authMessage", "Signup Error: " + error.message);
  }
});

document.getElementById("loginBtn")?.addEventListener("click", async () => {
  const loginId = publicLoginId(getValue("authUserId"));
  const email = normalizeLoginEmail(loginId);
  const password = getValue("authPassword");

  if (!loginId || !email || !password) {
    showMessage("authMessage", "Enter User ID and password.");
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

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    clearForm("authForm");
    closeProfilePanel();
    showMessage("authMessage", "Logged out successfully.");
  } catch (error) {
    showMessage("authMessage", "Logout Error: " + error.message);
  }
});

document.getElementById("quickFindBtn")?.addEventListener("click", () => {
  const service = getValue("quickService");
  const city = getValue("quickCity");
  const budget = getValue("quickBudget");

  if (document.getElementById("serviceType") && service) document.getElementById("serviceType").value = service;
  if (document.getElementById("customerCity") && city) document.getElementById("customerCity").value = city;
  if (document.getElementById("customerBudget") && budget) document.getElementById("customerBudget").value = budget;

  if (!currentUser) {
    document.getElementById("login").scrollIntoView({ behavior: "smooth" });
    showMessage("authMessage", "Login as customer to post work.");
    return;
  }

  if (currentRole !== "customer") {
    showMessage("authMessage", "Use customer account for booking.");
    return;
  }

  document.getElementById("book").scrollIntoView({ behavior: "smooth" });
});

function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please select a valid image file."));
      return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
      const img = new Image();

      img.onload = function () {
        const canvas = document.createElement("canvas");
        const maxSize = 420;

        let width = img.width;
        let height = img.height;

        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };

      img.onerror = function () {
        reject(new Error("Could not read image."));
      };

      img.src = event.target.result;
    };

    reader.onerror = function () {
      reject(new Error("Could not upload image."));
    };

    reader.readAsDataURL(file);
  });
}

const profilePhotoFile = document.getElementById("profilePhotoFile");
const profilePhotoUrlHidden = document.getElementById("profilePhotoUrl");
const removeProfilePhotoBtn = document.getElementById("removeProfilePhotoBtn");

if (profilePhotoFile) {
  profilePhotoFile.addEventListener("change", async () => {
    const file = profilePhotoFile.files[0];

    if (!file) return;

    try {
      showMessage("profileUpdateMessage", "Preparing photo...");
      const compressedPhoto = await compressImageFile(file);

      if (profilePhotoUrlHidden) {
        profilePhotoUrlHidden.value = compressedPhoto;
      }

      const profileUploadPreview = document.getElementById("profileUploadPreview");
      const profilePreviewAvatar = document.getElementById("profilePreviewAvatar");

      if (profileUploadPreview) profileUploadPreview.innerHTML = `<img src="${safeText(compressedPhoto)}" alt="Profile photo">`;
      if (profilePreviewAvatar) profilePreviewAvatar.innerHTML = `<img src="${safeText(compressedPhoto)}" alt="Profile photo">`;

      showMessage("profileUpdateMessage", "Photo selected. Click Save Profile Update.");
    } catch (error) {
      showMessage("profileUpdateMessage", error.message);
    }
  });
}

if (removeProfilePhotoBtn) {
  removeProfilePhotoBtn.addEventListener("click", () => {
    if (profilePhotoUrlHidden) profilePhotoUrlHidden.value = "";
    if (profilePhotoFile) profilePhotoFile.value = "";

    const initials = (currentProfile?.name || "KC").slice(0, 2).toUpperCase();

    const profileUploadPreview = document.getElementById("profileUploadPreview");
    const profilePreviewAvatar = document.getElementById("profilePreviewAvatar");

    if (profileUploadPreview) profileUploadPreview.textContent = initials;
    if (profilePreviewAvatar) profilePreviewAvatar.textContent = initials;

    showMessage("profileUpdateMessage", "Photo removed. Click Save Profile Update.");
  });
}

document.getElementById("loadProfileBtn")?.addEventListener("click", () => {
  if (!requireLogin("profileUpdateMessage")) return;

  document.getElementById("profilePhotoUrl").value = currentProfile.photoUrl || "";
  document.getElementById("profileFullName").value = currentProfile.name || "";
  document.getElementById("profilePhone").value = currentProfile.phone || "";
  document.getElementById("profileCity").value = currentProfile.city || "";
  document.getElementById("profileBio").value = currentProfile.bio || "";

  refreshProfessionalProfileUI();
  showMessage("profileUpdateMessage", "Profile loaded.");
});

document.getElementById("profileUpdateForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!requireLogin("profileUpdateMessage")) return;

  const photoUrl = getValue("profilePhotoUrl");
  const name = getValue("profileFullName");
  const phone = cleanPhone(getValue("profilePhone"));
  const city = getValue("profileCity");
  const bio = getValue("profileBio");

  if (!name || !phone) {
    showMessage("profileUpdateMessage", "Name and phone are required.");
    return;
  }

  if (!isValidPhone(phone)) {
    showMessage("profileUpdateMessage", "Enter valid mobile number.");
    return;
  }

  try {
    showMessage("profileUpdateMessage", "Saving profile...");

    const updateData = {
      photoUrl,
      name,
      phone,
      city,
      bio,
      country: selectedCountry(),
      currency: selectedCurrency(),
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, "users", currentUser.uid), updateData);

    currentProfile = {
      ...currentProfile,
      ...updateData
    };

    refreshProfessionalProfileUI();
    setPortalVisibility();

    showMessage("profileUpdateMessage", "Profile updated successfully.");
  } catch (error) {
    showMessage("profileUpdateMessage", "Database Error: " + error.message);
  }
});

document.getElementById("workerForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!requireWorker("workerMessage")) return;

  const workerName = getValue("workerName");
  const workerPhone = cleanPhone(getValue("workerPhone"));
  const workerSkill = getValue("workerSkill");
  const workerType = getValue("workerType");
  const workerAbout = getValue("workerAbout");
  const workerCity = getValue("workerCity");
  const workerAvailability = getValue("workerAvailability");

  if (!workerName || !workerPhone || !workerSkill || !workerType || !workerCity) {
    showMessage("workerMessage", "Fill all worker details.");
    return;
  }

  if (!isValidPhone(workerPhone)) {
    showMessage("workerMessage", "Enter valid mobile number.");
    return;
  }

  try {
    showMessage("workerMessage", "Saving worker profile...");

    const workerRef = doc(db, "workers", currentUser.uid);
    const oldSnap = await getDoc(workerRef);
    const oldData = oldSnap.exists() ? oldSnap.data() : {};
    const alreadyVerified = oldData.verified === true;

    const workerData = {
      userId: currentUser.uid,
      workerName,
      workerPhone,
      workerSkill,
      workerType,
      workerAbout,
      workerCity,
      workerCityLower: cleanText(workerCity),
      workerCountry: selectedCountry(),
      workerAvailability,
      available: workerAvailability === "available" || workerAvailability === "emergency",
      verified: alreadyVerified,
      verificationStatus: alreadyVerified ? "verified" : "pending",
      workerRating: oldData.workerRating || 0,
      totalReviews: oldData.totalReviews || 0,
      jobsCompleted: oldData.jobsCompleted || 0,
      updatedAt: serverTimestamp(),
      createdAt: oldData.createdAt || serverTimestamp()
    };

    await setDoc(workerRef, workerData, { merge: true });

    await setDoc(doc(db, "workerPublic", currentUser.uid), {
      userId: currentUser.uid,
      workerName,
      workerSkill,
      workerType,
      workerAbout,
      workerCity,
      workerCityLower: cleanText(workerCity),
      workerCountry: selectedCountry(),
      workerAvailability,
      available: workerData.available,
      verified: alreadyVerified,
      workerRating: oldData.workerRating || 0,
      totalReviews: oldData.totalReviews || 0,
      jobsCompleted: oldData.jobsCompleted || 0,
      updatedAt: serverTimestamp()
    }, { merge: true });

    showMessage(
      "workerMessage",
      alreadyVerified
        ? "Worker profile updated."
        : "Profile saved. Admin verification required before bidding."
    );

    clearForm("workerForm");
  } catch (error) {
    showMessage("workerMessage", "Database Error: " + error.message);
  }
});

document.getElementById("bookingForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!requireCustomer("bookingMessage")) return;

  const customerName = getValue("customerName");
  const customerPhone = cleanPhone(getValue("customerPhone"));
  const customerCity = getValue("customerCity");
  const serviceType = getValue("serviceType");
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
      customerAddress,
      customerBudget,
      currency: selectedCurrency(),
      workDetails,
      bookingStatus: "pending",
      jobProgress: "posted",
      biddingOpen: true,
      acceptedBidId: "",
      acceptedBidAmount: 0,
      assignedWorkerUserId: "",
      assignedWorkerName: "",
      assignedWorkerPhone: "",
      createdAt: serverTimestamp()
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
      customerBudget,
      currency: selectedCurrency(),
      workDetails,
      bookingStatus: "pending",
      biddingOpen: true,
      createdAt: serverTimestamp()
    });

    await createNotification(currentUser.uid, "Booking Posted", "Your booking is open for bids.", "booking", bookingRef.id);

    document.getElementById("matchResult").innerHTML = `
      <div class="data-card">
        <h3>Work Posted Successfully</h3>
        <p><strong>Service:</strong> ${safeText(serviceType)}</p>
        <p><strong>City:</strong> ${safeText(customerCity)}</p>
        <p><strong>Budget:</strong> ${formatMoney(customerBudget)}</p>
        <p><strong>Status:</strong> <span class="status-badge pending">Open for bids</span></p>
        <p class="safe-note">Phone and address are hidden from workers until bid acceptance.</p>
      </div>
    `;

    showMessage("bookingMessage", "Work posted successfully.");
    clearForm("bookingForm");
  } catch (error) {
    showMessage("bookingMessage", "Database Error: " + error.message);
  }
});

document.getElementById("loadOpenJobsBtn")?.addEventListener("click", async () => {
  if (!requireWorker("workerDashboardMessage")) return;

  const box = document.getElementById("workerJobsResult");
  box.innerHTML = "";

  try {
    showMessage("workerDashboardMessage", "Loading open jobs...");

    const workerSnap = await getDoc(doc(db, "workers", currentUser.uid));

    if (!workerSnap.exists()) {
      showMessage("workerDashboardMessage", "Save worker profile first.");
      return;
    }

    const worker = workerSnap.data();

    if (worker.verified !== true) {
      showMessage("workerDashboardMessage", "Admin verification required before bidding.");
      return;
    }

    if (worker.available !== true) {
      showMessage("workerDashboardMessage", "Set availability to Available Now or Emergency Only.");
      return;
    }

    const jobsSnap = await getDocs(collection(db, "publicJobs"));
    let found = false;

    jobsSnap.forEach((jobDoc) => {
      const job = jobDoc.data();

      const cityMatch = job.customerCityLower === worker.workerCityLower;
      const countryMatch = job.customerCountry === worker.workerCountry;
      const serviceMatch = job.serviceType === worker.workerSkill || isFreelancerSkill(worker.workerSkill);

      if (
        job.bookingStatus === "pending" &&
        job.biddingOpen === true &&
        cityMatch &&
        countryMatch &&
        serviceMatch
      ) {
        found = true;

        const freelancerNote = isFreelancerSkill(worker.workerSkill)
          ? `<p class="safe-note">You are seeing this because your skill is Freelancer / General Helper. Accept only legal and safe tasks.</p>`
          : "";

        box.innerHTML += `
          <div class="data-card">
            <h3>Open Job</h3>
            <p><strong>Service:</strong> ${safeText(job.serviceType)}</p>
            <p><strong>Customer:</strong> ${safeText(job.customerName)}</p>
            <p><strong>City:</strong> ${safeText(job.customerCity)}</p>
            <p><strong>Budget:</strong> ${formatMoney(job.customerBudget, job.currency)}</p>
            <p><strong>Work Details:</strong> ${safeText(job.workDetails)}</p>
            <p class="safe-note">Customer phone and full address are hidden until your bid is accepted.</p>
            ${freelancerNote}

            <div class="bid-box">
              <div class="form-group">
                <label>Your Bid Amount</label>
                <input type="number" id="bidAmount-${jobDoc.id}" />
              </div>

              <div class="form-group">
                <label>Bid Message</label>
                <textarea id="bidMessage-${jobDoc.id}" placeholder="Example: I can complete this work today."></textarea>
              </div>

              <button class="btn primary-btn full-btn" onclick="placeBid('${jobDoc.id}')">Submit Bid</button>
              <p class="message" id="bidStatus-${jobDoc.id}"></p>
            </div>
          </div>
        `;
      }
    });

    showMessage("workerDashboardMessage", found ? "Open jobs loaded." : "No matching open jobs found.");
  } catch (error) {
    showMessage("workerDashboardMessage", "Database Error: " + error.message);
  }
});

window.placeBid = async function (bookingId) {
  if (!requireWorker("workerDashboardMessage")) return;

  const bidAmount = Number(getValue("bidAmount-" + bookingId));
  const bidMessage = getValue("bidMessage-" + bookingId);

  if (!bidAmount || bidAmount <= 0) {
    showMessage("bidStatus-" + bookingId, "Enter valid bid amount.");
    return;
  }

  try {
    showMessage("bidStatus-" + bookingId, "Submitting bid...");

    const workerSnap = await getDoc(doc(db, "workers", currentUser.uid));
    const jobSnap = await getDoc(doc(db, "publicJobs", bookingId));

    if (!workerSnap.exists() || !jobSnap.exists()) {
      showMessage("bidStatus-" + bookingId, "Worker profile or job not found.");
      return;
    }

    const worker = workerSnap.data();
    const job = jobSnap.data();

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
      workerCity: worker.workerCity,
      workerCountry: worker.workerCountry,
      workerRating: worker.workerRating || 0,
      totalReviews: worker.totalReviews || 0,
      bidAmount,
      currency: job.currency || selectedCurrency(),
      bidMessage,
      bidStatus: "pending",
      createdAt: serverTimestamp()
    });

    await createNotification(job.customerId, "New Bid Received", worker.workerName + " submitted a bid.", "bid", bookingId);

    showMessage("bidStatus-" + bookingId, "Bid submitted successfully.");
  } catch (error) {
    showMessage("bidStatus-" + bookingId, "Database Error: " + error.message);
  }
};

document.getElementById("loadAssignedJobsBtn")?.addEventListener("click", async () => {
  if (!requireWorker("workerDashboardMessage")) return;

  const box = document.getElementById("workerJobsResult");
  box.innerHTML = "";

  try {
    const jobsSnap = await getDocs(query(collection(db, "bookings"), where("assignedWorkerUserId", "==", currentUser.uid)));

    if (jobsSnap.empty) {
      showMessage("workerDashboardMessage", "No assigned jobs found.");
      return;
    }

    jobsSnap.forEach((jobDoc) => {
      const job = jobDoc.data();

      box.innerHTML += `
        <div class="data-card">
          <h3>Assigned Job</h3>
          <p><strong>Customer:</strong> ${safeText(job.customerName)}</p>
          <p><strong>Phone:</strong> ${safeText(job.customerPhone)}</p>
          <p><strong>Service:</strong> ${safeText(job.serviceType)}</p>
          <p><strong>City:</strong> ${safeText(job.customerCity)}</p>
          <p><strong>Address:</strong> ${safeText(job.customerAddress)}</p>
          <p><strong>Amount:</strong> ${formatMoney(job.acceptedBidAmount || job.customerBudget, job.currency)}</p>
          <p><strong>Work:</strong> ${safeText(job.workDetails)}</p>
        </div>
      `;
    });

    showMessage("workerDashboardMessage", "Assigned jobs loaded.");
  } catch (error) {
    showMessage("workerDashboardMessage", "Database Error: " + error.message);
  }
});

document.getElementById("loadCustomerBookingsBtn")?.addEventListener("click", loadCustomerBookings);

async function loadCustomerBookings() {
  if (!requireCustomer("customerDashboardMessage")) return;

  const box = document.getElementById("customerBookingsResult");
  box.innerHTML = "";

  try {
    showMessage("customerDashboardMessage", "Loading bookings...");

    const bookingSnap = await getDocs(query(collection(db, "bookings"), where("customerId", "==", currentUser.uid)));

    if (bookingSnap.empty) {
      showMessage("customerDashboardMessage", "No booking found.");
      return;
    }

    for (const bookingDoc of bookingSnap.docs) {
      const booking = bookingDoc.data();

      box.innerHTML += `
        <div class="data-card">
          <h3>Your Booking</h3>
          <p><strong>Service:</strong> ${safeText(booking.serviceType)}</p>
          <p><strong>City:</strong> ${safeText(booking.customerCity)}</p>
          <p><strong>Budget:</strong> ${formatMoney(booking.customerBudget, booking.currency)}</p>
          <p><strong>Status:</strong> ${safeText(booking.bookingStatus)}</p>
          <p><strong>Assigned Worker:</strong> ${safeText(booking.assignedWorkerName || "Not assigned")}</p>
          <p><strong>Worker Phone:</strong> ${booking.assignedWorkerPhone ? safeText(booking.assignedWorkerPhone) : "Hidden until bid accepted"}</p>
        </div>
      `;

      const bidSnap = await getDocs(query(collection(db, "bids"), where("bookingId", "==", bookingDoc.id)));

      bidSnap.forEach((bidDoc) => {
        const bid = bidDoc.data();

        const canAccept =
          booking.bookingStatus === "pending" &&
          booking.biddingOpen === true &&
          bid.bidStatus === "pending";

        box.innerHTML += `
          <div class="data-card">
            <h3>Worker Bid</h3>
            <p><strong>Worker:</strong> ${safeText(bid.workerName)}</p>
            <p><strong>Skill:</strong> ${safeText(bid.workerSkill)}</p>
            <p><strong>City:</strong> ${safeText(bid.workerCity)}</p>
            <p><strong>Bid Amount:</strong> ${formatMoney(bid.bidAmount, bid.currency)}</p>
            <p><strong>Message:</strong> ${safeText(bid.bidMessage || "No message")}</p>
            <p><strong>Status:</strong> ${safeText(bid.bidStatus)}</p>

            ${
              canAccept
                ? `<button class="btn primary-btn full-btn" onclick="acceptBid('${bookingDoc.id}', '${bidDoc.id}')">Accept Bid</button>`
                : `<p><span class="status-badge pending">Bid closed or already accepted</span></p>`
            }

            <p class="message" id="acceptStatus-${bidDoc.id}"></p>
          </div>
        `;
      });
    }

    showMessage("customerDashboardMessage", "Bookings loaded.");
  } catch (error) {
    showMessage("customerDashboardMessage", "Database Error: " + error.message);
  }
}

window.acceptBid = async function (bookingId, bidId) {
  if (!requireCustomer("customerDashboardMessage")) return;

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

    const workerSnap = await getDoc(doc(db, "workers", bid.workerUserId));
    const worker = workerSnap.exists() ? workerSnap.data() : {};

    await updateDoc(bookingRef, {
      bookingStatus: "assigned",
      jobProgress: "assigned",
      biddingOpen: false,
      acceptedBidId: bidId,
      acceptedBidAmount: Number(bid.bidAmount || 0),
      assignedWorkerUserId: bid.workerUserId,
      assignedWorkerName: bid.workerName,
      assignedWorkerPhone: worker.workerPhone || "",
      updatedAt: serverTimestamp()
    });

    await updateDoc(publicJobRef, {
      bookingStatus: "assigned",
      biddingOpen: false,
      assignedWorkerUserId: bid.workerUserId,
      updatedAt: serverTimestamp()
    });

    const allBids = await getDocs(query(collection(db, "bids"), where("bookingId", "==", bookingId)));

    for (const bidDocument of allBids.docs) {
      await updateDoc(bidDocument.ref, {
        bidStatus: bidDocument.id === bidId ? "accepted" : "rejected"
      });
    }

    await createNotification(bid.workerUserId, "Bid Accepted", "Customer accepted your bid.", "accepted", bookingId);

    showMessage("acceptStatus-" + bidId, "Bid accepted. Worker phone unlocked.");
    loadCustomerBookings();
  } catch (error) {
    showMessage("acceptStatus-" + bidId, "Database Error: " + error.message);
  }
};

document.getElementById("loadNotificationsBtn")?.addEventListener("click", async () => {
  if (!requireLogin("notificationMessage")) return;

  const box = document.getElementById("notificationResult");
  box.innerHTML = "";

  try {
    const notificationSnap = await getDocs(query(collection(db, "notifications"), where("toUserId", "==", currentUser.uid)));

    if (notificationSnap.empty) {
      showMessage("notificationMessage", "No notifications found.");
      return;
    }

    notificationSnap.forEach((notificationDoc) => {
      const n = notificationDoc.data();

      box.innerHTML += `
        <div class="data-card">
          <h3>${safeText(n.title)}</h3>
          <p>${safeText(n.message)}</p>
          <p><strong>Type:</strong> ${safeText(n.type || "general")}</p>
        </div>
      `;
    });

    showMessage("notificationMessage", "Notifications loaded.");
  } catch (error) {
    showMessage("notificationMessage", "Database Error: " + error.message);
  }
});

document.getElementById("supportForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!requireLogin("supportMessage")) return;

  const supportType = getValue("supportType");
  const supportDetails = getValue("supportDetails");

  if (!supportType || !supportDetails) {
    showMessage("supportMessage", "Fill support type and details.");
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

document.getElementById("reportForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!requireLogin("reportMessage")) return;

  const reportType = getValue("reportType");
  const reportedIdentity = getValue("reportedIdentity");
  const reportDetails = getValue("reportDetails");

  if (!reportType || !reportDetails) {
    showMessage("reportMessage", "Fill report type and details.");
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

document.getElementById("cityRequestForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const city = getValue("requestCityName");
  const country = getValue("requestCountryName");

  if (!city || !country) {
    showMessage("cityRequestMessage", "Fill city and country.");
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

document.getElementById("loadReferralBtn")?.addEventListener("click", async () => {
  if (!requireLogin("referralMessage")) return;

  try {
    const referralCode = currentProfile.referralCode || makeReferralCode(currentProfile.loginId);
    const referralSnap = await getDocs(query(collection(db, "referrals"), where("invitedBy", "==", referralCode)));

    document.getElementById("referralResult").innerHTML = `
      <div class="data-card">
        <h3>Your Referral Code</h3>
        <p><strong>${safeText(referralCode)}</strong></p>
        <p>Share this code with customers or workers.</p>
        <p><strong>Total Joined:</strong> ${referralSnap.size}</p>
      </div>
    `;

    showMessage("referralMessage", "Referral loaded.");
  } catch (error) {
    showMessage("referralMessage", "Database Error: " + error.message);
  }
});

document.getElementById("loadPendingUsersBtn")?.addEventListener("click", async () => {
  if (!requireAdmin("adminMessage")) return;

  const box = document.getElementById("adminResult");
  box.innerHTML = "";

  try {
    const usersSnap = await getDocs(collection(db, "users"));
    let found = false;

    usersSnap.forEach((userDoc) => {
      const user = userDoc.data();

      if (user.phoneVerified !== true && user.blocked !== true) {
        found = true;

        box.innerHTML += `
          <div class="data-card">
            <h3>Customer/User Verification</h3>
            <p><strong>Name:</strong> ${safeText(user.name)}</p>
            <p><strong>User ID:</strong> ${safeText(user.loginId)}</p>
            <p><strong>Role:</strong> ${safeText(user.role)}</p>
            <p><strong>Phone:</strong> ${safeText(user.phone || "Not added")}</p>
            <p><strong>Status:</strong> <span class="status-badge pending">${safeText(user.verificationStatus || "Phone Pending")}</span></p>

            <div class="admin-actions">
              <button class="btn primary-btn" onclick="adminVerifyCustomer('${userDoc.id}')">Mark Phone Verified</button>
              <button class="btn outline-btn" onclick="adminRejectCustomer('${userDoc.id}')">Reject User</button>
            </div>

            <button class="btn danger-btn full-btn" onclick="adminBlockUser('${userDoc.id}')">Block User</button>
            <p class="message" id="adminCustomerStatus-${userDoc.id}"></p>
          </div>
        `;
      }
    });

    showMessage("adminMessage", found ? "Pending users loaded." : "No pending users found.");
  } catch (error) {
    showMessage("adminMessage", "Database Error: " + error.message);
  }
});

window.adminVerifyCustomer = async function (userId) {
  if (!requireAdmin("adminMessage")) return;

  try {
    await updateDoc(doc(db, "users", userId), {
      phoneVerified: true,
      verificationStatus: "verified",
      verifiedAt: serverTimestamp()
    });

    await createNotification(userId, "Phone Verified", "Your phone number is verified.", "verification", userId);

    showMessage("adminCustomerStatus-" + userId, "User verified.");
  } catch (error) {
    showMessage("adminCustomerStatus-" + userId, "Database Error: " + error.message);
  }
};

window.adminRejectCustomer = async function (userId) {
  if (!requireAdmin("adminMessage")) return;

  if (currentUser && currentUser.uid === userId) {
    showMessage("adminMessage", "You cannot reject your own admin account.");
    return;
  }

  try {
    await updateDoc(doc(db, "users", userId), {
      phoneVerified: false,
      verificationStatus: "rejected",
      rejectedAt: serverTimestamp()
    });

    await createNotification(userId, "Verification Rejected", "Your account verification was rejected. Please contact support.", "verification", userId);

    showMessage("adminCustomerStatus-" + userId, "User rejected.");
  } catch (error) {
    showMessage("adminCustomerStatus-" + userId, "Database Error: " + error.message);
  }
};

window.adminBlockUser = async function (userId) {
  if (!requireAdmin("adminMessage")) return;

  if (currentUser && currentUser.uid === userId) {
    showMessage("adminMessage", "You cannot block your own admin account.");
    return;
  }

  try {
    await updateDoc(doc(db, "users", userId), {
      blocked: true,
      verificationStatus: "blocked",
      blockedAt: serverTimestamp()
    });

    await createNotification(userId, "Account Blocked", "Your account has been blocked by admin.", "account", userId);

    showMessage("adminCustomerStatus-" + userId, "User blocked.");
  } catch (error) {
    showMessage("adminCustomerStatus-" + userId, "Database Error: " + error.message);
  }
};

document.getElementById("loadPendingWorkersBtn")?.addEventListener("click", async () => {
  if (!requireAdmin("adminMessage")) return;

  const box = document.getElementById("adminResult");
  box.innerHTML = "";

  try {
    const workersSnap = await getDocs(collection(db, "workers"));
    let found = false;

    workersSnap.forEach((workerDoc) => {
      const worker = workerDoc.data();

      if (worker.verified !== true && worker.blocked !== true) {
        found = true;

        box.innerHTML += `
          <div class="data-card">
            <h3>Pending Worker</h3>
            <p><strong>Name:</strong> ${safeText(worker.workerName)}</p>
            <p><strong>Phone:</strong> ${safeText(worker.workerPhone)}</p>
            <p><strong>Skill:</strong> ${safeText(worker.workerSkill)}</p>
            <p><strong>Type:</strong> ${safeText(worker.workerType)}</p>
            <p><strong>City:</strong> ${safeText(worker.workerCity)}</p>
            <p><strong>About:</strong> ${safeText(worker.workerAbout || "Not added")}</p>
            <p><strong>Status:</strong> <span class="status-badge pending">${safeText(worker.verificationStatus || "pending")}</span></p>

            <div class="admin-actions">
              <button class="btn primary-btn" onclick="adminVerifyWorker('${workerDoc.id}')">Verify Worker</button>
              <button class="btn outline-btn" onclick="adminRejectWorker('${workerDoc.id}')">Reject Worker</button>
            </div>

            <button class="btn danger-btn full-btn" onclick="adminBlockWorker('${workerDoc.id}')">Block Worker</button>
            <p class="message" id="workerAdminStatus-${workerDoc.id}"></p>
          </div>
        `;
      }
    });

    showMessage("adminMessage", found ? "Pending workers loaded." : "No pending worker found.");
  } catch (error) {
    showMessage("adminMessage", "Database Error: " + error.message);
  }
});

window.adminVerifyWorker = async function (workerId) {
  if (!requireAdmin("adminMessage")) return;

  try {
    await updateDoc(doc(db, "workers", workerId), {
      verified: true,
      verificationStatus: "verified",
      verifiedAt: serverTimestamp()
    });

    await setDoc(doc(db, "workerPublic", workerId), {
      verified: true,
      updatedAt: serverTimestamp()
    }, { merge: true });

    await createNotification(workerId, "Worker Verified", "Your worker profile is verified. You can now bid.", "verification", workerId);

    showMessage("workerAdminStatus-" + workerId, "Worker verified.");
  } catch (error) {
    showMessage("workerAdminStatus-" + workerId, "Database Error: " + error.message);
  }
};

window.adminRejectWorker = async function (workerId) {
  if (!requireAdmin("adminMessage")) return;

  try {
    await updateDoc(doc(db, "workers", workerId), {
      verified: false,
      verificationStatus: "rejected",
      rejectedAt: serverTimestamp()
    });

    await setDoc(doc(db, "workerPublic", workerId), {
      verified: false,
      updatedAt: serverTimestamp()
    }, { merge: true });

    await createNotification(workerId, "Worker Rejected", "Your worker verification was rejected. Contact support.", "verification", workerId);

    showMessage("workerAdminStatus-" + workerId, "Worker rejected.");
  } catch (error) {
    showMessage("workerAdminStatus-" + workerId, "Database Error: " + error.message);
  }
};

window.adminBlockWorker = async function (workerId) {
  if (!requireAdmin("adminMessage")) return;

  try {
    await updateDoc(doc(db, "workers", workerId), {
      blocked: true,
      verified: false,
      verificationStatus: "blocked",
      blockedAt: serverTimestamp()
    });

    await setDoc(doc(db, "workerPublic", workerId), {
      blocked: true,
      verified: false,
      updatedAt: serverTimestamp()
    }, { merge: true });

    await updateDoc(doc(db, "users", workerId), {
      blocked: true,
      verificationStatus: "blocked",
      blockedAt: serverTimestamp()
    });

    await createNotification(workerId, "Worker Account Blocked", "Your worker account has been blocked by admin.", "account", workerId);

    showMessage("workerAdminStatus-" + workerId, "Worker blocked.");
  } catch (error) {
    showMessage("workerAdminStatus-" + workerId, "Database Error: " + error.message);
  }
};

document.getElementById("loadAllBookingsBtn")?.addEventListener("click", async () => {
  if (!requireAdmin("adminMessage")) return;

  const box = document.getElementById("adminResult");
  box.innerHTML = "";

  try {
    const bookingSnap = await getDocs(collection(db, "bookings"));

    if (bookingSnap.empty) {
      showMessage("adminMessage", "No bookings found.");
      return;
    }

    bookingSnap.forEach((bookingDoc) => {
      const booking = bookingDoc.data();

      box.innerHTML += `
        <div class="data-card">
          <h3>Booking</h3>
          <p><strong>Customer:</strong> ${safeText(booking.customerName)}</p>
          <p><strong>Phone:</strong> ${safeText(booking.customerPhone)}</p>
          <p><strong>Service:</strong> ${safeText(booking.serviceType)}</p>
          <p><strong>City:</strong> ${safeText(booking.customerCity)}</p>
          <p><strong>Status:</strong> ${safeText(booking.bookingStatus)}</p>
          <p><strong>Worker:</strong> ${safeText(booking.assignedWorkerName || "Not assigned")}</p>
        </div>
      `;
    });

    showMessage("adminMessage", "Bookings loaded.");
  } catch (error) {
    showMessage("adminMessage", "Database Error: " + error.message);
  }
});

document.getElementById("loadSupportTicketsBtn")?.addEventListener("click", async () => {
  if (!requireAdmin("adminMessage")) return;

  const box = document.getElementById("adminResult");
  box.innerHTML = "";

  try {
    const supportSnap = await getDocs(collection(db, "supportTickets"));

    if (supportSnap.empty) {
      showMessage("adminMessage", "No support tickets found.");
      return;
    }

    supportSnap.forEach((ticketDoc) => {
      const ticket = ticketDoc.data();

      box.innerHTML += `
        <div class="data-card">
          <h3>Support Ticket</h3>
          <p><strong>User:</strong> ${safeText(ticket.userName)}</p>
          <p><strong>Role:</strong> ${safeText(ticket.userRole)}</p>
          <p><strong>Type:</strong> ${safeText(ticket.supportType)}</p>
          <p><strong>Details:</strong> ${safeText(ticket.supportDetails)}</p>
          <p><strong>Status:</strong> ${safeText(ticket.status)}</p>
          <div class="admin-actions">
            <button class="btn primary-btn" onclick="adminUpdateTicket('${ticketDoc.id}', 'solved')">Mark Solved</button>
            <button class="btn outline-btn" onclick="adminUpdateTicket('${ticketDoc.id}', 'rejected')">Reject Ticket</button>
          </div>
          <p class="message" id="ticketStatus-${ticketDoc.id}"></p>
        </div>
      `;
    });

    showMessage("adminMessage", "Support tickets loaded.");
  } catch (error) {
    showMessage("adminMessage", "Database Error: " + error.message);
  }
});

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
      await createNotification(ticket.userId, "Support Ticket Updated", "Your support ticket is now " + status + ".", "support", ticketId);
    }

    showMessage("ticketStatus-" + ticketId, "Ticket updated: " + status);
  } catch (error) {
    showMessage("ticketStatus-" + ticketId, "Database Error: " + error.message);
  }
};

refreshProfessionalProfileUI();
setInterval(refreshProfessionalProfileUI, 2000);
