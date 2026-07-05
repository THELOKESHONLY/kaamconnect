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

const currencySymbols = {
  INR: "₹",
  USD: "$",
  GBP: "£",
  CAD: "C$",
  AED: "د.إ",
  AUD: "A$"
};

function cleanText(text = "") {
  return String(text).trim().toLowerCase();
}

function cleanPhone(phone = "") {
  let digits = String(phone).replace(/\D/g, "");

  if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }

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
  if (element) {
    element.textContent = message;
  }
}

function clearForm(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.reset();
  }
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

  if (!digits || digits.length < 7) {
    return "Hidden";
  }

  return digits.slice(0, 2) + "XXXX" + digits.slice(-2);
}

function normalizeLoginEmail(loginId) {
  const raw = String(loginId || "").trim().toLowerCase();

  if (raw.includes("@")) {
    return raw;
  }

  const cleanId = raw.replace(/\s+/g, "").replace(/[^a-z0-9._-]/g, "");

  if (!cleanId || cleanId.length < 3) {
    return "";
  }

  return cleanId + "@kaamconnect.local";
}

function publicLoginId(loginId) {
  return String(loginId || "").trim().toLowerCase();
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

  const countrySelector = document.getElementById("countrySelector");
  const currencySelector = document.getElementById("currencySelector");
  const languageSelector = document.getElementById("languageSelector");

  if (countrySelector && country) countrySelector.value = country;
  if (currencySelector && currency) currencySelector.value = currency;
  if (languageSelector && language) languageSelector.value = language;

  applyGlobalSettings();
}

function applyGlobalSettings() {
  document.querySelectorAll(".currency-symbol").forEach((item) => {
    item.textContent = currencySymbol();
  });

  document.documentElement.lang = selectedLanguage();
}

["countrySelector", "currencySelector", "languageSelector"].forEach((id) => {
  const element = document.getElementById(id);

  if (element) {
    element.addEventListener("change", () => {
      saveGlobalSettings();
      applyGlobalSettings();
    });
  }
});

loadGlobalSettings();

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    if (navLinks) {
      navLinks.classList.remove("active");
    }
  });
});

function setPortalVisibility() {
  const isCustomer = currentUser && currentRole === "customer";
  const isWorker = currentUser && currentRole === "worker";

  document.querySelectorAll(".customer-only").forEach((section) => {
    section.classList.toggle("hidden", !isCustomer);
  });

  document.querySelectorAll(".worker-only").forEach((section) => {
    section.classList.toggle("hidden", !isWorker);
  });

  const accountNameLine = document.getElementById("accountNameLine");
  const accountRoleLine = document.getElementById("accountRoleLine");

  if (!currentUser) {
    if (accountNameLine) accountNameLine.textContent = "Not logged in";
    if (accountRoleLine) accountRoleLine.textContent = "Login with User ID and password to start.";
    return;
  }

  const displayName = currentProfile?.name || currentUser.email || "User";
  const roleLabel = currentRole === "worker" ? "Worker / Bidder" : "Customer";

  if (accountNameLine) {
    accountNameLine.textContent = "Logged in: " + displayName;
  }

  if (accountRoleLine) {
    accountRoleLine.textContent = "Active portal: " + roleLabel;
  }
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
      console.error("Profile load error:", error);
      showMessage("authMessage", "Profile Error: " + error.message);
    }
  } else {
    currentProfile = null;
    currentRole = "";
    setPortalVisibility();
    showMessage("authMessage", "You are not logged in.");
  }
});

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const name = getValue("authName");
    const loginId = publicLoginId(getValue("authUserId"));
    const email = normalizeLoginEmail(loginId);
    const password = getValue("authPassword");
    const role = getValue("authRole");

    if (!name || !loginId || !email || !password || !role) {
      showMessage("authMessage", "Please fill name, User ID, password and account type.");
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

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        loginId: loginId,
        role: role,
        country: selectedCountry(),
        currency: selectedCurrency(),
        language: selectedLanguage(),
        createdAt: serverTimestamp()
      }, { merge: true });

      currentRole = role;
      currentProfile = {
        uid: user.uid,
        name: name,
        email: email,
        loginId: loginId,
        role: role
      };

      setPortalVisibility();
      clearForm("authForm");

      showMessage("authMessage", "Account created. You can start now.");

    } catch (error) {
      console.error("Signup error:", error);
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
      console.error("Login error:", error);
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
      console.error("Logout error:", error);
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
      const loginSection = document.getElementById("login");
      if (loginSection) loginSection.scrollIntoView({ behavior: "smooth" });
      showMessage("authMessage", "Login as customer to post a booking.");
      return;
    }

    if (currentRole !== "customer") {
      showMessage("authMessage", "Please login with a customer account to book work.");
      return;
    }

    const bookSection = document.getElementById("book");
    if (bookSection) bookSection.scrollIntoView({ behavior: "smooth" });
  });
}

function requireCustomer(messageId) {
  if (!currentUser) {
    showMessage(messageId, "Please login first.");
    return false;
  }

  if (currentRole !== "customer") {
    showMessage(messageId, "This section is only for customer accounts.");
    return false;
  }

  return true;
}

function requireWorker(messageId) {
  if (!currentUser) {
    showMessage(messageId, "Please login first.");
    return false;
  }

  if (currentRole !== "worker") {
    showMessage(messageId, "This section is only for worker / bidder accounts.");
    return false;
  }

  return true;
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
    const workerCity = getValue("workerCity");
    const workerCityLower = cleanText(workerCity);
    const workerCountry = selectedCountry();

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

      const workerRef = doc(db, "workers", workerPhone);
      const existingWorker = await getDoc(workerRef);

      if (existingWorker.exists()) {
        const existingData = existingWorker.data();

        if (existingData.userId && existingData.userId !== currentUser.uid) {
          showMessage("workerMessage", "This phone number is already used by another worker account.");
          return;
        }
      }

      const oldData = existingWorker.exists() ? existingWorker.data() : {};

      await setDoc(workerRef, {
        userId: currentUser.uid,
        workerName: workerName,
        workerPhone: workerPhone,
        workerSkill: workerSkill,
        workerType: workerType,
        workerExperience: workerExperience,
        workerCity: workerCity,
        workerCityLower: workerCityLower,
        workerCountry: workerCountry,
        currency: selectedCurrency(),
        available: true,
        verified: true,
        workerRating: oldData.workerRating || 0,
        totalReviews: oldData.totalReviews || 0,
        updatedAt: serverTimestamp(),
        createdAt: oldData.createdAt || serverTimestamp()
      }, { merge: true });

      showMessage("workerMessage", "Worker profile saved. Open Worker Jobs to start bidding.");
      clearForm("workerForm");

    } catch (error) {
      console.error("Worker error:", error);
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
    const bookingCurrency = selectedCurrency();

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

      await addDoc(collection(db, "bookings"), {
        customerId: currentUser.uid,
        customerName: customerName,
        customerPhone: customerPhone,
        customerCity: customerCity,
        customerCityLower: customerCityLower,
        customerCountry: customerCountry,
        serviceType: serviceType,
        customerAddress: customerAddress,
        customerBudget: customerBudget,
        currency: bookingCurrency,
        workDetails: workDetails,
        bookingStatus: "pending",
        biddingOpen: true,
        acceptedBidId: "",
        acceptedBidAmount: 0,
        assignedWorkerId: "",
        assignedWorkerName: "",
        assignedWorkerPhone: "",
        createdAt: serverTimestamp()
      });

      const workerQuery = query(
        collection(db, "workers"),
        where("workerSkill", "==", serviceType)
      );

      const workerSnapshot = await getDocs(workerQuery);

      let matchedWorkersHtml = "";

      workerSnapshot.forEach((workerDoc) => {
        const worker = workerDoc.data();
        const workerCountry = worker.workerCountry || "India";

        if (
          worker.workerCityLower === customerCityLower &&
          workerCountry === customerCountry &&
          worker.available === true &&
          worker.verified === true
        ) {
          matchedWorkersHtml += `
            <div class="data-card">
              <h3>Matching Worker Available</h3>
              <p><strong>Name:</strong> ${safeText(worker.workerName)}</p>
              <p><strong>Skill:</strong> ${safeText(worker.workerSkill)}</p>
              <p><strong>Work Type:</strong> ${safeText(worker.workerType)}</p>
              <p><strong>Experience:</strong> ${safeText(worker.workerExperience)}</p>
              <p><strong>City:</strong> ${safeText(worker.workerCity)}</p>
              <p><strong>Rating:</strong> ${worker.workerRating || 0} ⭐ (${worker.totalReviews || 0} reviews)</p>
              <p class="safe-note">Worker contact is hidden until you accept a bid.</p>
            </div>
          `;
        }
      });

      showMessage("bookingMessage", "Booking posted. Matching workers can now bid.");

      if (matchResult) {
        matchResult.innerHTML = `
          <div class="data-card">
            <h3>Booking Posted Successfully</h3>
            <p><strong>Service:</strong> ${safeText(serviceType)}</p>
            <p><strong>City:</strong> ${safeText(customerCity)}</p>
            <p><strong>Country:</strong> ${safeText(customerCountry)}</p>
            <p><strong>Budget:</strong> ${formatMoney(customerBudget, bookingCurrency)}</p>
            <p class="status-open">Status: Open for Bids</p>
            <p class="safe-note">Your phone and address are hidden until you accept a worker bid.</p>
          </div>
          ${matchedWorkersHtml}
        `;
      }

      clearForm("bookingForm");

    } catch (error) {
      console.error("Booking error:", error);
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

    const phone = cleanPhone(getValue("dashboardWorkerPhone"));

    if (workerJobs) workerJobs.innerHTML = "";

    if (!isValidPhone(phone)) {
      showMessage("dashboardMessage", "Please enter your registered mobile number.");
      return;
    }

    try {
      showMessage("dashboardMessage", "Finding open jobs...");

      const workerRef = doc(db, "workers", phone);
      const workerSnap = await getDoc(workerRef);

      if (!workerSnap.exists()) {
        showMessage("dashboardMessage", "Worker profile not found. Save your worker profile first.");
        return;
      }

      const worker = workerSnap.data();

      if (worker.userId && worker.userId !== currentUser.uid) {
        showMessage("dashboardMessage", "This worker number is not linked with your login account.");
        return;
      }

      const openJobsQuery = query(
        collection(db, "bookings"),
        where("serviceType", "==", worker.workerSkill)
      );

      const openJobsSnapshot = await getDocs(openJobsQuery);

      let foundJobs = false;

      openJobsSnapshot.forEach((jobDoc) => {
        const job = jobDoc.data();
        const jobCountry = job.customerCountry || "India";
        const workerCountry = worker.workerCountry || "India";

        if (
          job.bookingStatus === "pending" &&
          job.biddingOpen === true &&
          job.customerCityLower === worker.workerCityLower &&
          jobCountry === workerCountry
        ) {
          foundJobs = true;

          if (workerJobs) {
            workerJobs.innerHTML += `
              <div class="data-card">
                <h3>Open Job for Bidding</h3>
                <p><strong>Customer:</strong> ${safeText(job.customerName)}</p>
                <p><strong>Customer Phone:</strong> ${maskPhone(job.customerPhone)}</p>
                <p><strong>Service:</strong> ${safeText(job.serviceType)}</p>
                <p><strong>City:</strong> ${safeText(job.customerCity)}</p>
                <p><strong>Country:</strong> ${safeText(jobCountry)}</p>
                <p><strong>Work Details:</strong> ${safeText(job.workDetails)}</p>
                <p><strong>Customer Budget:</strong> ${formatMoney(job.customerBudget || 0, job.currency || selectedCurrency())}</p>
                <p class="safe-note">Full address and phone unlock only if the customer accepts your bid.</p>

                <div class="form-group">
                  <label>Your Bid Amount ${currencySymbol(job.currency || selectedCurrency())}</label>
                  <input type="number" id="bidAmount-${jobDoc.id}" placeholder="Example: 450" />
                </div>

                <div class="form-group">
                  <label>Bid Message</label>
                  <textarea id="bidMessage-${jobDoc.id}" placeholder="Example: I can complete this work today."></textarea>
                </div>

                <button class="btn primary-btn full-btn" onclick="placeBid('${jobDoc.id}', '${phone}')">
                  Submit Bid
                </button>

                <p class="form-message" id="bidStatus-${jobDoc.id}"></p>
              </div>
            `;
          }
        }
      });

      showMessage(
        "dashboardMessage",
        foundJobs ? "Open jobs loaded." : "No open jobs found for your skill and city."
      );

    } catch (error) {
      console.error("Open jobs error:", error);
      showMessage("dashboardMessage", "Database Error: " + error.message);
    }
  });
}

window.placeBid = async function (bookingId, workerPhone) {
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

    const workerRef = doc(db, "workers", workerPhone);
    const workerSnap = await getDoc(workerRef);

    if (!workerSnap.exists()) {
      showMessage(statusId, "Worker profile not found.");
      return;
    }

    const worker = workerSnap.data();

    if (worker.userId && worker.userId !== currentUser.uid) {
      showMessage(statusId, "This worker profile is not linked with your login.");
      return;
    }

    const bookingRef = doc(db, "bookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      showMessage(statusId, "Booking not found.");
      return;
    }

    const booking = bookingSnap.data();

    if (booking.bookingStatus !== "pending" || booking.biddingOpen !== true) {
      showMessage(statusId, "This booking is no longer open for bidding.");
      return;
    }

    const existingBidQuery = query(
      collection(db, "bids"),
      where("bookingId", "==", bookingId)
    );

    const existingBidSnapshot = await getDocs(existingBidQuery);

    let alreadyBid = false;

    existingBidSnapshot.forEach((bidDoc) => {
      const bid = bidDoc.data();

      if (bid.workerPhone === workerPhone) {
        alreadyBid = true;
      }
    });

    if (alreadyBid) {
      showMessage(statusId, "You already submitted a bid for this job.");
      return;
    }

    await addDoc(collection(db, "bids"), {
      bookingId: bookingId,
      workerUserId: currentUser.uid,
      workerPhone: workerPhone,
      workerName: worker.workerName,
      workerSkill: worker.workerSkill,
      workerCity: worker.workerCity,
      workerCountry: worker.workerCountry || selectedCountry(),
      workerRating: worker.workerRating || 0,
      totalReviews: worker.totalReviews || 0,
      bidAmount: bidAmount,
      currency: booking.currency || selectedCurrency(),
      bidMessage: bidMessage,
      bidStatus: "pending",
      createdAt: serverTimestamp()
    });

    showMessage(statusId, "Bid submitted successfully.");

  } catch (error) {
    console.error("Bid error:", error);
    showMessage(statusId, "Database Error: " + error.message);
  }
};

if (loadJobsBtn) {
  loadJobsBtn.addEventListener("click", async () => {
    if (!requireWorker("dashboardMessage")) return;

    const phone = cleanPhone(getValue("dashboardWorkerPhone"));

    if (workerJobs) workerJobs.innerHTML = "";

    if (!isValidPhone(phone)) {
      showMessage("dashboardMessage", "Please enter valid registered mobile number.");
      return;
    }

    try {
      showMessage("dashboardMessage", "Loading assigned jobs...");

      const workerRef = doc(db, "workers", phone);
      const workerSnap = await getDoc(workerRef);

      if (!workerSnap.exists()) {
        showMessage("dashboardMessage", "Worker profile not found.");
        return;
      }

      const worker = workerSnap.data();

      if (worker.userId && worker.userId !== currentUser.uid) {
        showMessage("dashboardMessage", "This worker number is not linked with your login account.");
        return;
      }

      const jobsQuery = query(
        collection(db, "bookings"),
        where("assignedWorkerPhone", "==", phone)
      );

      const jobsSnapshot = await getDocs(jobsQuery);

      if (jobsSnapshot.empty) {
        showMessage("dashboardMessage", "No assigned jobs found.");
        return;
      }

      jobsSnapshot.forEach((jobDoc) => {
        const job = jobDoc.data();

        if (workerJobs) {
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
              <p class="status-assigned">Status: Assigned</p>
            </div>
          `;
        }
      });

      showMessage("dashboardMessage", "Assigned jobs loaded.");

    } catch (error) {
      console.error("Assigned jobs error:", error);
      showMessage("dashboardMessage", "Database Error: " + error.message);
    }
  });
}

const loadCustomerBidsBtn = document.getElementById("loadCustomerBidsBtn");
const customerBidsResult = document.getElementById("customerBidsResult");

if (loadCustomerBidsBtn) {
  loadCustomerBidsBtn.addEventListener("click", async () => {
    if (!requireCustomer("customerBidMessage")) return;

    if (customerBidsResult) customerBidsResult.innerHTML = "";

    try {
      showMessage("customerBidMessage", "Loading your bookings and bids...");

      let bookingSnapshot = await getDocs(
        query(collection(db, "bookings"), where("customerId", "==", currentUser.uid))
      );

      const oldPhone = cleanPhone(getValue("customerPhoneLookup"));
      let oldBookingDocs = [];

      if (bookingSnapshot.empty && oldPhone && isValidPhone(oldPhone)) {
        const oldBookingSnapshot = await getDocs(
          query(collection(db, "bookings"), where("customerPhone", "==", oldPhone))
        );

        oldBookingSnapshot.forEach((docItem) => {
          const booking = docItem.data();

          if (!booking.customerId || booking.customerId === currentUser.uid) {
            oldBookingDocs.push(docItem);
          }
        });
      }

      const bookingDocs = bookingSnapshot.empty ? oldBookingDocs : bookingSnapshot.docs;

      if (!bookingDocs.length) {
        showMessage("customerBidMessage", "No bookings found for your account.");
        return;
      }

      let foundAnyBid = false;

      for (const bookingDoc of bookingDocs) {
        const booking = bookingDoc.data();

        const bidSnapshot = await getDocs(
          query(collection(db, "bids"), where("bookingId", "==", bookingDoc.id))
        );

        if (customerBidsResult) {
          customerBidsResult.innerHTML += `
            <div class="data-card">
              <h3>Your Booking</h3>
              <p><strong>Service:</strong> ${safeText(booking.serviceType)}</p>
              <p><strong>City:</strong> ${safeText(booking.customerCity)}</p>
              <p><strong>Budget:</strong> ${formatMoney(booking.customerBudget || 0, booking.currency || selectedCurrency())}</p>
              <p><strong>Status:</strong> ${safeText(booking.bookingStatus)}</p>
              <p class="safe-note">Worker phone is hidden until you accept a bid.</p>
            </div>
          `;
        }

        if (!bidSnapshot.empty) {
          foundAnyBid = true;
        }

        bidSnapshot.forEach((bidDoc) => {
          const bid = bidDoc.data();

          const isAcceptedBid =
            booking.acceptedBidId === bidDoc.id ||
            bid.bidStatus === "accepted";

          const canAccept =
            booking.bookingStatus === "pending" &&
            booking.biddingOpen === true &&
            bid.bidStatus === "pending";

          const phoneHtml = isAcceptedBid
            ? `<p><strong>Worker Phone:</strong> ${safeText(bid.workerPhone)}</p>`
            : `<p><strong>Worker Phone:</strong> Hidden until accepted</p>`;

          const actionHtml = canAccept
            ? `<button class="btn primary-btn full-btn" onclick="acceptBid('${bookingDoc.id}', '${bidDoc.id}')">Accept This Bid</button>`
            : isAcceptedBid
              ? `<p class="status-accepted">This bid is accepted.</p>`
              : `<p class="status-rejected">Closed or another bid accepted.</p>`;

          if (customerBidsResult) {
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
          }
        });
      }

      showMessage(
        "customerBidMessage",
        foundAnyBid ? "Bids loaded successfully." : "Bookings loaded. No bids received yet."
      );

    } catch (error) {
      console.error("Customer bids error:", error);
      showMessage("customerBidMessage", "Database Error: " + error.message);
    }
  });
}

window.acceptBid = async function (bookingId, bidId) {
  if (!requireCustomer("customerBidMessage")) return;

  try {
    showMessage("acceptStatus-" + bidId, "Accepting bid...");

    const bookingRef = doc(db, "bookings", bookingId);
    const bidRef = doc(db, "bids", bidId);

    const bookingSnap = await getDoc(bookingRef);
    const bidSnap = await getDoc(bidRef);

    if (!bookingSnap.exists()) {
      showMessage("acceptStatus-" + bidId, "Booking not found.");
      return;
    }

    if (!bidSnap.exists()) {
      showMessage("acceptStatus-" + bidId, "Bid not found.");
      return;
    }

    const booking = bookingSnap.data();
    const bid = bidSnap.data();

    if (booking.customerId && booking.customerId !== currentUser.uid) {
      showMessage("acceptStatus-" + bidId, "You can accept only your own booking bids.");
      return;
    }

    await updateDoc(bookingRef, {
      bookingStatus: "assigned",
      biddingOpen: false,
      acceptedBidId: bidId,
      acceptedBidAmount: Number(bid.bidAmount || 0),
      assignedWorkerId: bid.workerPhone,
      assignedWorkerName: bid.workerName,
      assignedWorkerPhone: bid.workerPhone
    });

    const allBidsSnapshot = await getDocs(
      query(collection(db, "bids"), where("bookingId", "==", bookingId))
    );

    for (const bidDocument of allBidsSnapshot.docs) {
      if (bidDocument.id === bidId) {
        await updateDoc(bidDocument.ref, { bidStatus: "accepted" });
      } else {
        await updateDoc(bidDocument.ref, { bidStatus: "rejected" });
      }
    }

    showMessage("acceptStatus-" + bidId, "Bid accepted. Worker contact is now unlocked.");

  } catch (error) {
    console.error("Accept bid error:", error);
    showMessage("acceptStatus-" + bidId, "Database Error: " + error.message);
  }
};

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

    if (!isValidPhone(workerPhone)) {
      showMessage("reviewMessage", "Please enter valid worker phone number.");
      return;
    }

    try {
      showMessage("reviewMessage", "Saving review...");

      await addDoc(collection(db, "reviews"), {
        workerPhone: workerPhone,
        customerId: currentUser.uid,
        customerName: currentProfile?.name || "",
        rating: rating,
        reviewText: reviewText,
        createdAt: serverTimestamp()
      });

      const workerRef = doc(db, "workers", workerPhone);
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
      }

      showMessage("reviewMessage", "Review submitted successfully.");
      clearForm("reviewForm");

    } catch (error) {
      console.error("Review error:", error);
      showMessage("reviewMessage", "Database Error: " + error.message);
    }
  });
}
