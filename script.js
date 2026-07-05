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
  limit,
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

const ADMIN_EMAILS = [
  "lokeshyadav4399@gmail.com"
];

let currentUser = null;
let currentUserProfile = null;

const $ = (id) => document.getElementById(id);

function cleanText(text) {
  return String(text || "").trim().toLowerCase();
}

function cleanPhone(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  return digits;
}

function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

function safe(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showMessage(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("error-text", isError);
}

function statusBadge(status) {
  const value = safe(status || "pending");
  return `<span class="badge badge-${value}">${value}</span>`;
}

function requireLogin(messageElement) {
  if (!currentUser) {
    showMessage(messageElement, "Please login first.", true);
    location.hash = "#login";
    return false;
  }
  return true;
}

function isAdmin() {
  return currentUser && ADMIN_EMAILS.includes(currentUser.email);
}

const menuBtn = $("menuBtn");
const navLinks = $("navLinks");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => navLinks.classList.toggle("active"));
}

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => navLinks?.classList.remove("active"));
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  currentUserProfile = null;

  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    currentUserProfile = userDoc.exists() ? userDoc.data() : null;
    showMessage($("authMessage"), `Logged in as ${user.email}`);
  } else {
    showMessage($("authMessage"), "Not logged in.");
  }
});

const signupBtn = $("signupBtn");
const loginBtn = $("loginBtn");
const logoutBtn = $("logoutBtn");
const authMessage = $("authMessage");

if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const name = $("authName").value.trim();
    const phone = cleanPhone($("authPhone").value);
    const email = $("authEmail").value.trim();
    const password = $("authPassword").value;
    const role = $("authRole").value;

    if (!name || !phone || !email || !password || !role) {
      showMessage(authMessage, "Please fill name, phone, email, password and account type.", true);
      return;
    }

    if (!isValidPhone(phone)) {
      showMessage(authMessage, "Please enter a valid 10 digit mobile number.", true);
      return;
    }

    try {
      showMessage(authMessage, "Creating account...");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        phone,
        email,
        role,
        createdAt: serverTimestamp()
      });

      showMessage(authMessage, "Account created successfully. You are logged in.");
    } catch (error) {
      console.error("Signup error:", error);
      showMessage(authMessage, "Signup Error: " + error.message, true);
    }
  });
}

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = $("authEmail").value.trim();
    const password = $("authPassword").value;

    if (!email || !password) {
      showMessage(authMessage, "Please enter email and password.", true);
      return;
    }

    try {
      showMessage(authMessage, "Logging in...");
      await signInWithEmailAndPassword(auth, email, password);
      showMessage(authMessage, "Login successful.");
    } catch (error) {
      console.error("Login error:", error);
      showMessage(authMessage, "Login Error: " + error.message, true);
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      showMessage(authMessage, "Logged out successfully.");
    } catch (error) {
      showMessage(authMessage, "Logout Error: " + error.message, true);
    }
  });
}

const workerForm = $("workerForm");
const workerMessage = $("workerMessage");

if (workerForm) {
  workerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!requireLogin(workerMessage)) return;

    const workerName = $("workerName").value.trim();
    const workerPhone = cleanPhone($("workerPhone").value);
    const workerSkill = $("workerSkill").value;
    const workerType = $("workerType").value;
    const workerExperience = $("workerExperience").value.trim();
    const workerPrice = Number($("workerPrice").value);
    const workerCity = $("workerCity").value.trim();
    const workerBio = $("workerBio").value.trim();
    const available = $("workerAvailable").checked;

    if (!workerName || !workerPhone || !workerSkill || !workerType || !workerExperience || !workerPrice || !workerCity || !workerBio) {
      showMessage(workerMessage, "Please fill all worker profile details.", true);
      return;
    }

    if (!isValidPhone(workerPhone)) {
      showMessage(workerMessage, "Please enter a valid 10 digit mobile number.", true);
      return;
    }

    try {
      showMessage(workerMessage, "Saving worker profile...");

      await setDoc(doc(db, "workers", currentUser.uid), {
        workerId: currentUser.uid,
        userId: currentUser.uid,
        workerName,
        workerPhone,
        workerSkill,
        workerType,
        workerExperience,
        workerPrice,
        workerCity,
        workerCityLower: cleanText(workerCity),
        workerBio,
        available,
        verified: false,
        workerRating: 0,
        totalReviews: 0,
        completedJobs: 0,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });

      showMessage(workerMessage, "Worker profile saved. Admin verification is required before matching.");
      workerForm.reset();
    } catch (error) {
      console.error("Worker profile error:", error);
      showMessage(workerMessage, "Firebase Error: " + error.message, true);
    }
  });
}

async function findMatchingWorker(serviceType, cityLower) {
  const workersSnapshot = await getDocs(
    query(collection(db, "workers"), where("workerSkill", "==", serviceType), limit(50))
  );

  let bestWorkerDoc = null;
  let bestRating = -1;

  workersSnapshot.forEach((workerDoc) => {
    const worker = workerDoc.data();
    const match =
      worker.workerCityLower === cityLower &&
      worker.available === true &&
      worker.verified === true;

    if (match) {
      const rating = Number(worker.workerRating || 0);
      if (rating > bestRating) {
        bestRating = rating;
        bestWorkerDoc = workerDoc;
      }
    }
  });

  return bestWorkerDoc;
}

const bookingForm = $("bookingForm");
const bookingMessage = $("bookingMessage");
const matchResult = $("matchResult");

if (bookingForm) {
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!requireLogin(bookingMessage)) return;

    const customerName = $("customerName").value.trim();
    const customerPhone = cleanPhone($("customerPhone").value);
    const customerCity = $("customerCity").value.trim();
    const serviceType = $("serviceType").value;
    const customerAddress = $("customerAddress").value.trim();
    const workDetails = $("workDetails").value.trim();
    const customerCityLower = cleanText(customerCity);

    matchResult.innerHTML = "";

    if (!customerName || !customerPhone || !customerCity || !serviceType || !customerAddress || !workDetails) {
      showMessage(bookingMessage, "Please fill all booking details.", true);
      return;
    }

    if (!isValidPhone(customerPhone)) {
      showMessage(bookingMessage, "Please enter a valid 10 digit mobile number.", true);
      return;
    }

    try {
      showMessage(bookingMessage, "Saving booking and searching verified worker...");

      const bookingRef = await addDoc(collection(db, "bookings"), {
        customerUid: currentUser.uid,
        customerEmail: currentUser.email,
        customerName,
        customerPhone,
        customerCity,
        customerCityLower,
        serviceType,
        customerAddress,
        workDetails,
        bookingStatus: "pending",
        assignedWorkerId: "",
        assignedWorkerUid: "",
        assignedWorkerName: "",
        assignedWorkerPhone: "",
        reviewGiven: false,
        createdAt: serverTimestamp()
      });

      const matchedWorkerDoc = await findMatchingWorker(serviceType, customerCityLower);

      if (matchedWorkerDoc) {
        const worker = matchedWorkerDoc.data();

        await updateDoc(bookingRef, {
          bookingStatus: "assigned",
          assignedWorkerId: matchedWorkerDoc.id,
          assignedWorkerUid: worker.userId || matchedWorkerDoc.id,
          assignedWorkerName: worker.workerName,
          assignedWorkerPhone: worker.workerPhone
        });

        showMessage(bookingMessage, "Booking saved. Worker matched successfully.");
        matchResult.innerHTML = renderWorkerMatchCard(bookingRef.id, worker);
      } else {
        showMessage(bookingMessage, "Booking saved. No verified worker found right now.");
        matchResult.innerHTML = `
          <div class="data-card">
            <h3>Booking Saved ${statusBadge("pending")}</h3>
            <p><strong>Booking ID:</strong> ${bookingRef.id}</p>
            <p>No verified worker found for <strong>${safe(serviceType)}</strong> in <strong>${safe(customerCity)}</strong>.</p>
            <p>Admin can verify workers or assign this booking later.</p>
          </div>
        `;
      }

      bookingForm.reset();
    } catch (error) {
      console.error("Booking error:", error);
      showMessage(bookingMessage, "Firebase Error: " + error.message, true);
    }
  });
}

function renderWorkerMatchCard(bookingId, worker) {
  return `
    <div class="data-card">
      <h3>Worker Matched Successfully ${statusBadge("assigned")}</h3>
      <p><strong>Booking ID:</strong> ${bookingId}</p>
      <p><strong>Name:</strong> ${safe(worker.workerName)}</p>
      <p><strong>Skill:</strong> ${safe(worker.workerSkill)} · ${safe(worker.workerType || "Worker")}</p>
      <p><strong>Experience:</strong> ${safe(worker.workerExperience)}</p>
      <p><strong>City:</strong> ${safe(worker.workerCity)}</p>
      <p><strong>Starting Price:</strong> ₹${safe(worker.workerPrice || "")}</p>
      <p><strong>Rating:</strong> ${safe(worker.workerRating || 0)} ⭐ (${safe(worker.totalReviews || 0)} reviews)</p>
      <p><strong>About:</strong> ${safe(worker.workerBio || "")}</p>
      <p><strong>Phone:</strong> ${safe(worker.workerPhone)}</p>
    </div>
  `;
}

const loadCustomerBookingsBtn = $("loadCustomerBookingsBtn");
const customerDashboardMessage = $("customerDashboardMessage");
const customerBookings = $("customerBookings");

if (loadCustomerBookingsBtn) {
  loadCustomerBookingsBtn.addEventListener("click", loadCustomerBookings);
}

async function loadCustomerBookings() {
  if (!requireLogin(customerDashboardMessage)) return;
  customerBookings.innerHTML = "";
  showMessage(customerDashboardMessage, "Loading your bookings...");

  try {
    const snapshot = await getDocs(
      query(collection(db, "bookings"), where("customerUid", "==", currentUser.uid))
    );

    if (snapshot.empty) {
      showMessage(customerDashboardMessage, "No bookings found.");
      return;
    }

    showMessage(customerDashboardMessage, "Bookings loaded.");

    snapshot.forEach((docItem) => {
      const booking = docItem.data();
      customerBookings.innerHTML += `
        <div class="data-card">
          <h3>${safe(booking.serviceType)} ${statusBadge(booking.bookingStatus)}</h3>
          <p><strong>Booking ID:</strong> ${docItem.id}</p>
          <p><strong>City:</strong> ${safe(booking.customerCity)}</p>
          <p><strong>Address:</strong> ${safe(booking.customerAddress)}</p>
          <p><strong>Work:</strong> ${safe(booking.workDetails)}</p>
          <p><strong>Worker:</strong> ${safe(booking.assignedWorkerName || "Not assigned")}</p>
          <p><strong>Worker Phone:</strong> ${safe(booking.assignedWorkerPhone || "Not assigned")}</p>
          <p><strong>Review:</strong> ${booking.reviewGiven ? "Given" : "Not given"}</p>
          ${booking.bookingStatus === "completed" && !booking.reviewGiven ? `<p>Use this Booking ID in the review form below.</p>` : ""}
        </div>
      `;
    });
  } catch (error) {
    console.error("Customer dashboard error:", error);
    showMessage(customerDashboardMessage, "Firebase Error: " + error.message, true);
  }
}

const loadWorkerJobsBtn = $("loadWorkerJobsBtn");
const workerDashboardMessage = $("workerDashboardMessage");
const workerJobs = $("workerJobs");

if (loadWorkerJobsBtn) {
  loadWorkerJobsBtn.addEventListener("click", loadWorkerJobs);
}

async function loadWorkerJobs() {
  if (!requireLogin(workerDashboardMessage)) return;
  workerJobs.innerHTML = "";
  showMessage(workerDashboardMessage, "Loading assigned jobs...");

  try {
    const snapshot = await getDocs(
      query(collection(db, "bookings"), where("assignedWorkerUid", "==", currentUser.uid))
    );

    if (snapshot.empty) {
      showMessage(workerDashboardMessage, "No assigned jobs found.");
      return;
    }

    showMessage(workerDashboardMessage, "Jobs loaded.");

    snapshot.forEach((docItem) => {
      const job = docItem.data();
      workerJobs.innerHTML += `
        <div class="data-card">
          <h3>${safe(job.serviceType)} ${statusBadge(job.bookingStatus)}</h3>
          <p><strong>Booking ID:</strong> ${docItem.id}</p>
          <p><strong>Customer:</strong> ${safe(job.customerName)}</p>
          <p><strong>Phone:</strong> ${safe(job.customerPhone)}</p>
          <p><strong>City:</strong> ${safe(job.customerCity)}</p>
          <p><strong>Address:</strong> ${safe(job.customerAddress)}</p>
          <p><strong>Work:</strong> ${safe(job.workDetails)}</p>
          <div class="card-actions">
            <button class="btn small-btn accept-btn" onclick="acceptJob('${docItem.id}')">Accept</button>
            <button class="btn small-btn reject-btn" onclick="rejectJob('${docItem.id}')">Reject</button>
            <button class="btn small-btn complete-btn" onclick="completeJob('${docItem.id}')">Mark Completed</button>
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error("Worker dashboard error:", error);
    showMessage(workerDashboardMessage, "Firebase Error: " + error.message, true);
  }
}

window.acceptJob = async function (bookingId) {
  await updateDoc(doc(db, "bookings", bookingId), { bookingStatus: "accepted" });
  loadWorkerJobs();
};

window.rejectJob = async function (bookingId) {
  await updateDoc(doc(db, "bookings", bookingId), {
    bookingStatus: "pending",
    assignedWorkerId: "",
    assignedWorkerUid: "",
    assignedWorkerName: "",
    assignedWorkerPhone: ""
  });

  loadWorkerJobs();
};

window.completeJob = async function (bookingId) {
  await updateDoc(doc(db, "bookings", bookingId), { bookingStatus: "completed" });

  const workerRef = doc(db, "workers", currentUser.uid);
  const workerSnap = await getDoc(workerRef);

  if (workerSnap.exists()) {
    const worker = workerSnap.data();
    await updateDoc(workerRef, {
      completedJobs: Number(worker.completedJobs || 0) + 1
    });
  }

  loadWorkerJobs();
};

const reviewForm = $("reviewForm");
const reviewMessage = $("reviewMessage");

if (reviewForm) {
  reviewForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!requireLogin(reviewMessage)) return;

    const bookingId = $("reviewBookingId").value.trim();
    const rating = Number($("reviewRating").value);
    const reviewText = $("reviewText").value.trim();

    if (!bookingId || !rating || !reviewText) {
      showMessage(reviewMessage, "Please fill all review details.", true);
      return;
    }

    try {
      showMessage(reviewMessage, "Saving review...");

      const bookingRef = doc(db, "bookings", bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        showMessage(reviewMessage, "Booking not found.", true);
        return;
      }

      const booking = bookingSnap.data();

      if (booking.customerUid !== currentUser.uid) {
        showMessage(reviewMessage, "You can review only your own booking.", true);
        return;
      }

      if (booking.bookingStatus !== "completed") {
        showMessage(reviewMessage, "Review is allowed only after work is completed.", true);
        return;
      }

      if (booking.reviewGiven) {
        showMessage(reviewMessage, "Review already submitted for this booking.", true);
        return;
      }

      const workerId = booking.assignedWorkerId;
      const workerRef = doc(db, "workers", workerId);
      const workerSnap = await getDoc(workerRef);

      if (!workerSnap.exists()) {
        showMessage(reviewMessage, "Worker profile not found.", true);
        return;
      }

      await addDoc(collection(db, "reviews"), {
        bookingId,
        workerId,
        workerPhone: booking.assignedWorkerPhone,
        customerUid: currentUser.uid,
        customerEmail: currentUser.email,
        rating,
        reviewText,
        createdAt: serverTimestamp()
      });

      const worker = workerSnap.data();
      const oldRating = Number(worker.workerRating || 0);
      const oldTotal = Number(worker.totalReviews || 0);
      const newTotal = oldTotal + 1;
      const newRating = ((oldRating * oldTotal) + rating) / newTotal;

      await updateDoc(workerRef, {
        workerRating: Number(newRating.toFixed(1)),
        totalReviews: newTotal
      });

      await updateDoc(bookingRef, {
        reviewGiven: true
      });

      showMessage(reviewMessage, "Review submitted successfully.");
      reviewForm.reset();
    } catch (error) {
      console.error("Review error:", error);
      showMessage(reviewMessage, "Firebase Error: " + error.message, true);
    }
  });
}

const loadAdminBtn = $("loadAdminBtn");
const adminMessage = $("adminMessage");
const adminStats = $("adminStats");
const adminContent = $("adminContent");

if (loadAdminBtn) {
  loadAdminBtn.addEventListener("click", loadAdminDashboard);
}

async function loadAdminDashboard() {
  if (!requireLogin(adminMessage)) return;

  if (!isAdmin()) {
    showMessage(adminMessage, "Admin access denied. Add your email in ADMIN_EMAILS inside script.js.", true);
    return;
  }

  adminStats.innerHTML = "";
  adminContent.innerHTML = "";
  showMessage(adminMessage, "Loading admin dashboard...");

  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const workersSnap = await getDocs(collection(db, "workers"));
    const bookingsSnap = await getDocs(collection(db, "bookings"));
    const reviewsSnap = await getDocs(collection(db, "reviews"));

    let pendingWorkers = 0;
    workersSnap.forEach((item) => {
      if (!item.data().verified) pendingWorkers++;
    });

    let pendingBookings = 0;
    bookingsSnap.forEach((item) => {
      if (item.data().bookingStatus === "pending") pendingBookings++;
    });

    adminStats.innerHTML = `
      <div class="admin-stat"><h3>${usersSnap.size}</h3><p>Users</p></div>
      <div class="admin-stat"><h3>${workersSnap.size}</h3><p>Workers</p></div>
      <div class="admin-stat"><h3>${bookingsSnap.size}</h3><p>Bookings</p></div>
      <div class="admin-stat"><h3>${reviewsSnap.size}</h3><p>Reviews</p></div>
    `;

    adminContent.innerHTML += `<h2 style="margin: 20px 0;">Workers needing verification: ${pendingWorkers}</h2>`;

    workersSnap.forEach((workerDoc) => {
      const worker = workerDoc.data();

      adminContent.innerHTML += `
        <div class="data-card">
          <h3>${safe(worker.workerName)} ${worker.verified ? statusBadge("accepted") : statusBadge("pending")}</h3>
          <p><strong>ID:</strong> ${workerDoc.id}</p>
          <p><strong>Skill:</strong> ${safe(worker.workerSkill)} · ${safe(worker.workerType || "")}</p>
          <p><strong>Phone:</strong> ${safe(worker.workerPhone)}</p>
          <p><strong>City:</strong> ${safe(worker.workerCity)}</p>
          <p><strong>Price:</strong> ₹${safe(worker.workerPrice || "")}</p>
          <p><strong>Rating:</strong> ${safe(worker.workerRating || 0)} ⭐ (${safe(worker.totalReviews || 0)} reviews)</p>
          <div class="card-actions">
            <button class="btn small-btn accept-btn" onclick="verifyWorker('${workerDoc.id}')">Verify Worker</button>
            <button class="btn small-btn reject-btn" onclick="unverifyWorker('${workerDoc.id}')">Unverify</button>
          </div>
        </div>
      `;
    });

    adminContent.innerHTML += `<h2 style="margin: 28px 0 20px;">All Bookings</h2>`;

    bookingsSnap.forEach((bookingDoc) => {
      const booking = bookingDoc.data();

      adminContent.innerHTML += `
        <div class="data-card">
          <h3>${safe(booking.serviceType)} ${statusBadge(booking.bookingStatus)}</h3>
          <p><strong>Booking ID:</strong> ${bookingDoc.id}</p>
          <p><strong>Customer:</strong> ${safe(booking.customerName)} · ${safe(booking.customerPhone)}</p>
          <p><strong>City:</strong> ${safe(booking.customerCity)}</p>
          <p><strong>Worker:</strong> ${safe(booking.assignedWorkerName || "Not assigned")}</p>
        </div>
      `;
    });

    showMessage(adminMessage, `Admin dashboard loaded. Pending bookings: ${pendingBookings}`);
  } catch (error) {
    console.error("Admin dashboard error:", error);
    showMessage(adminMessage, "Firebase Error: " + error.message, true);
  }
}

window.verifyWorker = async function (workerId) {
  if (!isAdmin()) return;
  await updateDoc(doc(db, "workers", workerId), {
    verified: true
  });

  await assignPendingBookingsToWorker(workerId);
  loadAdminDashboard();
};

window.unverifyWorker = async function (workerId) {
  if (!isAdmin()) return;
  await updateDoc(doc(db, "workers", workerId), {
    verified: false
  });

  loadAdminDashboard();
};

async function assignPendingBookingsToWorker(workerId) {
  const workerRef = doc(db, "workers", workerId);
  const workerSnap = await getDoc(workerRef);
  if (!workerSnap.exists()) return;

  const worker = workerSnap.data();

  const bookingsSnap = await getDocs(
    query(collection(db, "bookings"), where("serviceType", "==", worker.workerSkill), limit(50))
  );

  for (const bookingDoc of bookingsSnap.docs) {
    const booking = bookingDoc.data();

    const match =
      booking.bookingStatus === "pending" &&
      booking.customerCityLower === worker.workerCityLower &&
      worker.available === true &&
      worker.verified === true;

    if (match) {
      await updateDoc(bookingDoc.ref, {
        bookingStatus: "assigned",
        assignedWorkerId: workerId,
        assignedWorkerUid: worker.userId || workerId,
        assignedWorkerName: worker.workerName,
        assignedWorkerPhone: worker.workerPhone
      });
      break;
    }
  }
}
