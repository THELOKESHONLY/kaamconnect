// ===============================
// Firebase Imports
// ===============================
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
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ===============================
// Firebase Config
// Replace these values with your real Firebase config
// ===============================
const firebaseConfig = {
  apiKey: "PASTE_YOUR_REAL_API_KEY",
  authDomain: "kaamconnect-fdf87.firebaseapp.com",
  projectId: "kaamconnect-fdf87",
  storageBucket: "kaamconnect-fdf87.appspot.com",
  messagingSenderId: "PASTE_YOUR_REAL_MESSAGING_SENDER_ID",
  appId: "PASTE_YOUR_REAL_APP_ID"
};


// ===============================
// Start Firebase
// ===============================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;


// ===============================
// Helper Functions
// ===============================
function cleanText(text) {
  return text.trim().toLowerCase();
}

function cleanPhone(phone) {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }

  return digits;
}

function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
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


// ===============================
// Mobile Menu
// ===============================
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


// ===============================
// Auth State
// ===============================
onAuthStateChanged(auth, (user) => {
  currentUser = user;

  const authMessage = document.getElementById("authMessage");

  if (user && authMessage) {
    authMessage.textContent = "Logged in as: " + user.email;
  }

  if (!user && authMessage) {
    authMessage.textContent = "You are not logged in.";
  }
});


// ===============================
// Signup / Login / Logout
// ===============================
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const name = getValue("authName");
    const email = getValue("authEmail");
    const password = getValue("authPassword");
    const role = getValue("authRole");

    if (!name || !email || !password || !role) {
      showMessage("authMessage", "Please fill name, email, password and account type.");
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
        role: role,
        createdAt: serverTimestamp()
      });

      showMessage("authMessage", "Account created successfully. You are logged in.");
    } catch (error) {
      console.error("Signup error:", error);
      showMessage("authMessage", "Signup Error: " + error.message);
    }
  });
}

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = getValue("authEmail");
    const password = getValue("authPassword");

    if (!email || !password) {
      showMessage("authMessage", "Please enter email and password.");
      return;
    }

    try {
      showMessage("authMessage", "Logging in...");
      await signInWithEmailAndPassword(auth, email, password);
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
      showMessage("authMessage", "Logged out successfully.");
    } catch (error) {
      console.error("Logout error:", error);
      showMessage("authMessage", "Logout Error: " + error.message);
    }
  });
}


// ===============================
// Join as Worker Form
// ===============================
const workerForm = document.getElementById("workerForm");

if (workerForm) {
  workerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    showMessage("workerMessage", "Saving worker registration...");

    const workerName = getValue("workerName");
    const workerPhone = cleanPhone(getValue("workerPhone"));
    const workerSkill = getValue("workerSkill");
    const workerType = getValue("workerType") || "Freelancer";
    const workerExperience = getValue("workerExperience");
    const workerCity = getValue("workerCity");
    const workerCityLower = cleanText(workerCity);

    if (!workerName || !workerPhone || !workerSkill || !workerExperience || !workerCity) {
      showMessage("workerMessage", "Please fill all worker details.");
      return;
    }

    if (!isValidPhone(workerPhone)) {
      showMessage("workerMessage", "Please enter valid 10 digit mobile number.");
      return;
    }

    try {
      // Save worker profile using phone number as document ID
      await setDoc(doc(db, "workers", workerPhone), {
        userId: currentUser ? currentUser.uid : "",
        workerName: workerName,
        workerPhone: workerPhone,
        workerSkill: workerSkill,
        workerType: workerType,
        workerExperience: workerExperience,
        workerCity: workerCity,
        workerCityLower: workerCityLower,
        available: true,
        verified: true,
        workerRating: 0,
        totalReviews: 0,
        createdAt: serverTimestamp()
      });

      showMessage("workerMessage", "Worker registered successfully. Checking pending bookings...");

      // Find pending bookings for same skill
      const bookingQuery = query(
        collection(db, "bookings"),
        where("serviceType", "==", workerSkill)
      );

      const bookingSnapshot = await getDocs(bookingQuery);

      let assignedBooking = false;

      for (const bookingDoc of bookingSnapshot.docs) {
        const booking = bookingDoc.data();

        if (
          booking.bookingStatus === "pending" &&
          booking.customerCityLower === workerCityLower
        ) {
          await updateDoc(bookingDoc.ref, {
            bookingStatus: "assigned",
            assignedWorkerId: workerPhone,
            assignedWorkerName: workerName,
            assignedWorkerPhone: workerPhone
          });

          assignedBooking = true;
          break;
        }
      }

      if (assignedBooking) {
        showMessage(
          "workerMessage",
          "Worker registered successfully and one pending booking assigned."
        );
      } else {
        showMessage(
          "workerMessage",
          "Worker registered successfully. No pending booking found right now."
        );
      }

      workerForm.reset();
    } catch (error) {
      console.error("Worker registration error:", error);
      showMessage("workerMessage", "Firebase Error: " + error.message);
    }
  });
}


// ===============================
// Book a Worker Form
// ===============================
const bookingForm = document.getElementById("bookingForm");
const matchResult = document.getElementById("matchResult");

if (bookingForm) {
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    showMessage("bookingMessage", "Saving booking and searching worker...");

    if (matchResult) {
      matchResult.innerHTML = "";
    }

    const customerName = getValue("customerName");
    const customerPhone = cleanPhone(getValue("customerPhone"));
    const customerCity = getValue("customerCity");
    const customerCityLower = cleanText(customerCity);
    const serviceType = getValue("serviceType");
    const customerAddress = getValue("customerAddress");
    const workDetails = getValue("workDetails");

    if (!customerName || !customerPhone || !customerCity || !serviceType || !customerAddress || !workDetails) {
      showMessage("bookingMessage", "Please fill all booking details.");
      return;
    }

    if (!isValidPhone(customerPhone)) {
      showMessage("bookingMessage", "Please enter valid 10 digit mobile number.");
      return;
    }

    try {
      // Save booking as pending first
      const bookingRef = await addDoc(collection(db, "bookings"), {
        customerId: currentUser ? currentUser.uid : "",
        customerName: customerName,
        customerPhone: customerPhone,
        customerCity: customerCity,
        customerCityLower: customerCityLower,
        serviceType: serviceType,
        customerAddress: customerAddress,
        workDetails: workDetails,
        bookingStatus: "pending",
        assignedWorkerId: "",
        assignedWorkerName: "",
        assignedWorkerPhone: "",
        createdAt: serverTimestamp()
      });

      // Search workers by skill
      const workerQuery = query(
        collection(db, "workers"),
        where("workerSkill", "==", serviceType)
      );

      const workerSnapshot = await getDocs(workerQuery);

      let matchedWorkerDoc = null;
      let matchedWorker = null;

      workerSnapshot.forEach((docItem) => {
        const worker = docItem.data();

        if (
          !matchedWorker &&
          worker.workerCityLower === customerCityLower &&
          worker.available === true &&
          worker.verified === true
        ) {
          matchedWorkerDoc = docItem;
          matchedWorker = worker;
        }
      });

      if (matchedWorker) {
        await updateDoc(bookingRef, {
          bookingStatus: "assigned",
          assignedWorkerId: matchedWorkerDoc.id,
          assignedWorkerName: matchedWorker.workerName,
          assignedWorkerPhone: matchedWorker.workerPhone
        });

        showMessage("bookingMessage", "Booking saved. Worker matched successfully.");

        if (matchResult) {
          matchResult.innerHTML = `
            <div class="data-card">
              <h3>Worker Matched Successfully</h3>
              <p><strong>Worker Name:</strong> ${matchedWorker.workerName}</p>
              <p><strong>Skill:</strong> ${matchedWorker.workerSkill}</p>
              <p><strong>Work Type:</strong> ${matchedWorker.workerType || "Freelancer"}</p>
              <p><strong>Experience:</strong> ${matchedWorker.workerExperience}</p>
              <p><strong>City:</strong> ${matchedWorker.workerCity}</p>
              <p><strong>Worker Phone:</strong> ${matchedWorker.workerPhone}</p>
              <p><strong>Rating:</strong> ${matchedWorker.workerRating || 0} ⭐ (${matchedWorker.totalReviews || 0} reviews)</p>
              <p class="status-assigned">Status: Assigned</p>
            </div>
          `;
        }
      } else {
        showMessage("bookingMessage", "Booking saved. No matching worker found right now.");

        if (matchResult) {
          matchResult.innerHTML = `
            <div class="data-card">
              <h3>Booking Saved</h3>
              <p>No worker found for ${serviceType} in ${customerCity}.</p>
              <p class="status-pending">Status: Pending</p>
            </div>
          `;
        }
      }

      bookingForm.reset();
    } catch (error) {
      console.error("Booking error:", error);
      showMessage("bookingMessage", "Firebase Error: " + error.message);
    }
  });
}


// ===============================
// Worker Dashboard
// ===============================
const loadJobsBtn = document.getElementById("loadJobsBtn");
const workerJobs = document.getElementById("workerJobs");

if (loadJobsBtn) {
  loadJobsBtn.addEventListener("click", async () => {
    const phone = cleanPhone(getValue("dashboardWorkerPhone"));

    if (workerJobs) {
      workerJobs.innerHTML = "";
    }

    if (!isValidPhone(phone)) {
      showMessage("dashboardMessage", "Please enter valid 10 digit mobile number.");
      return;
    }

    try {
      showMessage("dashboardMessage", "Loading assigned jobs...");

      const jobsQuery = query(
        collection(db, "bookings"),
        where("assignedWorkerPhone", "==", phone)
      );

      const jobsSnapshot = await getDocs(jobsQuery);

      if (jobsSnapshot.empty) {
        showMessage("dashboardMessage", "No jobs found for this number.");

        if (workerJobs) {
          workerJobs.innerHTML = `
            <div class="data-card">
              <h3>No Assigned Jobs</h3>
              <p>When a customer books your service, assigned jobs will appear here.</p>
            </div>
          `;
        }

        return;
      }

      showMessage("dashboardMessage", "Jobs loaded successfully.");

      jobsSnapshot.forEach((docItem) => {
        const job = docItem.data();

        if (workerJobs) {
          workerJobs.innerHTML += `
            <div class="data-card">
              <h3>Customer Booking</h3>
              <p><strong>Customer Name:</strong> ${job.customerName}</p>
              <p><strong>Customer Phone:</strong> ${job.customerPhone}</p>
              <p><strong>Service:</strong> ${job.serviceType}</p>
              <p><strong>City:</strong> ${job.customerCity}</p>
              <p><strong>Address:</strong> ${job.customerAddress}</p>
              <p><strong>Work Details:</strong> ${job.workDetails}</p>
              <p class="status-assigned">Status: ${job.bookingStatus}</p>
            </div>
          `;
        }
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      showMessage("dashboardMessage", "Firebase Error: " + error.message);
    }
  });
}


// ===============================
// Review System
// ===============================
const reviewForm = document.getElementById("reviewForm");

if (reviewForm) {
  reviewForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
      showMessage("reviewMessage", "Please login before giving review.");
      return;
    }

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
        customerEmail: currentUser.email,
        rating: rating,
        reviewText: reviewText,
        createdAt: serverTimestamp()
      });

      const workerRef = doc(db, "workers", workerPhone);
      const workerQuery = query(
        collection(db, "workers"),
        where("workerPhone", "==", workerPhone),
        limit(1)
      );

      const workerSnapshot = await getDocs(workerQuery);

      if (!workerSnapshot.empty) {
        const workerDoc = workerSnapshot.docs[0];
        const workerData = workerDoc.data();

        const oldRating = workerData.workerRating || 0;
        const oldTotal = workerData.totalReviews || 0;

        const newTotal = oldTotal + 1;
        const newRating = ((oldRating * oldTotal) + rating) / newTotal;

        await updateDoc(workerDoc.ref, {
          workerRating: Number(newRating.toFixed(1)),
          totalReviews: newTotal
        });
      }

      showMessage("reviewMessage", "Review submitted successfully.");
      reviewForm.reset();
    } catch (error) {
      console.error("Review error:", error);
      showMessage("reviewMessage", "Firebase Error: " + error.message);
    }
  });
}
