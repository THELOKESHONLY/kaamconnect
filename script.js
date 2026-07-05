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
  ["⚡", "Electrician", "Fan, light, switchboard and wiring repair."],
  ["🔧", "Plumber", "Tap repair, pipe fitting and bathroom work."],
  ["🧹", "Cleaner", "Home, office and deep cleaning."],
  ["📚", "Tutor", "Home tuition and online tuition."],
  ["🍳", "Cook", "Daily cooking and party cooking."],
  ["🎨", "Painter", "House painting and wall repair."],
  ["❄️", "AC Repair", "AC service, repair and installation."],
  ["🪚", "Carpenter", "Furniture, door and wood work."],
  ["🚗", "Driver", "Local driver and personal driver service."],
  ["🌱", "Gardener", "Garden cleaning and plant care."],
  ["🛡️", "Security Guard", "Home, office and event security."],
  ["🏠", "House Helper", "Daily household help."],
  ["🧺", "Maid", "Cleaning, washing and daily support."],
  ["🛠️", "Mechanic", "Bike, car and machine repair support."],
  ["📱", "Mobile Repair", "Screen, battery and software issues."],
  ["💻", "Computer Repair", "Laptop, desktop and software repair."],
  ["📷", "Photographer", "Event and personal photography."],
  ["💄", "Makeup Artist", "Party, bridal and event makeup."],
  ["🩺", "Nurse / Caretaker", "Patient care and elder care."],
  ["📦", "Delivery Boy", "Local parcel pickup and delivery."],
  ["🎪", "Event Helper", "Event setup and support staff."],
  ["🧑‍💼", "Freelancer / General Helper", "Queue standing, hospital line, errands, travel help, pickup, small legal tasks and basic helper work."]
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

function fillServices() {
  document.querySelectorAll(".service-select").forEach((select) => {
    const first = select.querySelector("option")?.textContent || "Choose service";
    select.innerHTML = `<option value="">${first}</option>`;

    SERVICES.forEach((service) => {
      select.innerHTML += `<option>${service[1]}</option>`;
    });
  });

  const grid = document.getElementById("servicesGrid");

  if (grid) {
    grid.innerHTML = SERVICES.map((service) => `
      <div class="service-card">
        <div class="icon">${service[0]}</div>
        <h3>${service[1]}</h3>
        <p>${service[2]}</p>
      </div>
    `).join("");
  }
}

function updateCurrencySymbols() {
  document.querySelectorAll(".currency-symbol").forEach((item) => {
    item.textContent = currencySymbol();
  });
}

fillServices();
updateCurrencySymbols();

document.getElementById("currencySelector")?.addEventListener("change", updateCurrencySymbols);

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

menuBtn?.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => navLinks.classList.remove("active"));
});

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
    accountNameLine.textContent = "Not logged in";
    accountRoleLine.textContent = "Login to start.";
    return;
  }

  const roleText = isAdmin ? "Admin" : currentRole === "worker" ? "Worker / Freelancer" : "Customer";

  accountNameLine.textContent = "Logged in: " + (currentProfile?.name || currentUser.email);
  accountRoleLine.textContent = "Portal: " + roleText;
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

document.getElementById("signupBtn")?.addEventListener("click", async () => {
  const name = getValue("authName");
  const phone = cleanPhone(getValue("authPhone"));
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

    const profile = {
      uid: user.uid,
      name,
      phone,
      role,
      loginId,
      email,
      phoneVerified: false,
      blocked: false,
      country: selectedCountry(),
      currency: selectedCurrency(),
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, "users", user.uid), profile, { merge: true });

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
      biddingOpen: true,
      acceptedBidId: "",
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

    document.getElementById("matchResult").innerHTML = `
      <div class="data-card">
        <h3>Work Posted Successfully</h3>
        <p><strong>Service:</strong> ${safeText(serviceType)}</p>
        <p><strong>City:</strong> ${safeText(customerCity)}</p>
        <p><strong>Budget:</strong> ${formatMoney(customerBudget)}</p>
        <p><strong>Status:</strong> <span class="badge badge-yellow">Open for bids</span></p>
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
                : `<p><span class="badge badge-yellow">Bid closed or already accepted</span></p>`
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

    showMessage("acceptStatus-" + bidId, "Bid accepted. Worker phone unlocked.");
    loadCustomerBookings();

  } catch (error) {
    showMessage("acceptStatus-" + bidId, "Database Error: " + error.message);
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

      if (worker.verified !== true) {
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
            <p><strong>Status:</strong> <span class="badge badge-yellow">${safeText(worker.verificationStatus || "pending")}</span></p>

            <div class="admin-actions">
              <button class="btn primary-btn" onclick="adminVerifyWorker('${workerDoc.id}')">Verify</button>
              <button class="btn outline-btn" onclick="adminRejectWorker('${workerDoc.id}')">Reject</button>
            </div>

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

    showMessage("workerAdminStatus-" + workerId, "Worker rejected.");
  } catch (error) {
    showMessage("workerAdminStatus-" + workerId, "Database Error: " + error.message);
  }
};

document.getElementById("loadUsersBtn")?.addEventListener("click", async () => {
  if (!requireAdmin("adminMessage")) return;

  const box = document.getElementById("adminResult");
  box.innerHTML = "";

  try {
    const usersSnap = await getDocs(collection(db, "users"));

    usersSnap.forEach((userDoc) => {
      const user = userDoc.data();

      box.innerHTML += `
        <div class="data-card">
          <h3>User</h3>
          <p><strong>Name:</strong> ${safeText(user.name)}</p>
          <p><strong>User ID:</strong> ${safeText(user.loginId)}</p>
          <p><strong>Role:</strong> ${safeText(user.role)}</p>
          <p><strong>Phone:</strong> ${safeText(user.phone)}</p>
        </div>
      `;
    });

    showMessage("adminMessage", "Users loaded.");
  } catch (error) {
    showMessage("adminMessage", "Database Error: " + error.message);
  }
});

document.getElementById("loadAllBookingsBtn")?.addEventListener("click", async () => {
  if (!requireAdmin("adminMessage")) return;

  const box = document.getElementById("adminResult");
  box.innerHTML = "";

  try {
    const bookingSnap = await getDocs(collection(db, "bookings"));

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
