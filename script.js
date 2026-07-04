// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

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

// Replace this config with your own Firebase web app config
const firebaseConfig = {
  apiKey: "AIzaSyDylEdOuxEpqh7IxEO9cBoV7u9_9cK8DAc",
  authDomain: "kaamconnect-fdf87.firebaseapp.com",
  projectId: "kaamconnect-fdf87",
  storageBucket: "kaamconnect-fdf87.firebasestorage.app",
  messagingSenderId: "929567285202",
  appId: "1:929567285202:web:7adb18836f12c8b69db20b",
  measurementId: "G-25ZG5RB3FX"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mobile menu
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("active");
  });
});

// Clean city text for matching
function cleanText(text) {
  return text.trim().toLowerCase();
}

// Clean phone number
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

// Check valid Indian mobile number
function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

// ===============================
// Book a Worker Form
// ===============================
const bookingForm = document.getElementById("bookingForm");
const bookingMessage = document.getElementById("bookingMessage");
const matchResult = document.getElementById("matchResult");

bookingForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  bookingMessage.textContent = "Saving booking and searching worker...";
  matchResult.innerHTML = "";

  const customerName = document.getElementById("customerName").value.trim();
  const customerPhone = cleanPhone(document.getElementById("customerPhone").value);
  const customerCity = document.getElementById("customerCity").value.trim();
  const serviceType = document.getElementById("serviceType").value;
  const customerAddress = document.getElementById("customerAddress").value.trim();
  const workDetails = document.getElementById("workDetails").value.trim();

  if (!isValidPhone(customerPhone)) {
    bookingMessage.textContent = "Please enter a valid 10 digit mobile number.";
    return;
  }

  try {
    // First save booking as pending
    const bookingRef = await addDoc(collection(db, "bookings"), {
      customerName: customerName,
      customerPhone: customerPhone,
      customerCity: customerCity,
      customerCityLower: cleanText(customerCity),
      serviceType: serviceType,
      customerAddress: customerAddress,
      workDetails: workDetails,
      bookingStatus: "pending",
      assignedWorkerId: "",
      assignedWorkerName: "",
      assignedWorkerPhone: "",
      createdAt: serverTimestamp()
    });

    // Find matching worker by skill and city
    const workerQuery = query(
      collection(db, "workers"),
      where("workerSkill", "==", serviceType),
      where("workerCityLower", "==", cleanText(customerCity)),
      where("available", "==", true),
      where("verified", "==", true),
      limit(1)
    );

    const workerSnapshot = await getDocs(workerQuery);

    if (!workerSnapshot.empty) {
      const workerDoc = workerSnapshot.docs[0];
      const worker = workerDoc.data();

      // Update booking with assigned worker details
      await updateDoc(bookingRef, {
        bookingStatus: "assigned",
        assignedWorkerId: workerDoc.id,
        assignedWorkerName: worker.workerName,
        assignedWorkerPhone: worker.workerPhone
      });

      bookingMessage.textContent = "Booking saved. Matching worker found.";

      matchResult.innerHTML = `
        <div class="data-card">
          <h3>Worker Matched Successfully</h3>
          <p><strong>Worker Name:</strong> ${worker.workerName}</p>
          <p><strong>Skill:</strong> ${worker.workerSkill}</p>
          <p><strong>Experience:</strong> ${worker.workerExperience}</p>
          <p><strong>City:</strong> ${worker.workerCity}</p>
          <p><strong>Worker Phone:</strong> ${worker.workerPhone}</p>
          <p class="status-assigned">Status: Assigned</p>
          <p>Your booking is also visible in the worker dashboard.</p>
        </div>
      `;
    } else {
      bookingMessage.textContent = "Booking saved. No matching worker found right now.";

      matchResult.innerHTML = `
        <div class="data-card">
          <h3>Booking Saved</h3>
          <p>No verified worker is available for ${serviceType} in ${customerCity} right now.</p>
          <p class="status-pending">Status: Pending</p>
          <p>When a worker registers in the same city and skill, you can assign later from Firebase.</p>
        </div>
      `;
    }

    bookingForm.reset();
  } catch (error) {
    console.error("Booking error:", error);
    bookingMessage.textContent = "Error: Booking not saved. Check Firebase config and rules.";
  }
});

// ===============================
// Join as Worker Form
// ===============================
const workerForm = document.getElementById("workerForm");
const workerMessage = document.getElementById("workerMessage");

workerForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  workerMessage.textContent = "Saving worker registration...";

  const workerName = document.getElementById("workerName").value.trim();
  const workerPhone = cleanPhone(document.getElementById("workerPhone").value);
  const workerSkill = document.getElementById("workerSkill").value;
  const workerExperience = document.getElementById("workerExperience").value.trim();
  const workerCity = document.getElementById("workerCity").value.trim();
  const workerCityLower = cleanText(workerCity);

  if (!isValidPhone(workerPhone)) {
    workerMessage.textContent = "Please enter a valid 10 digit mobile number.";
    return;
  }

  try {
    // Save worker automatically in Firebase
    // Document ID will be worker phone number
    await setDoc(doc(db, "workers", workerPhone), {
      workerName: workerName,
      workerPhone: workerPhone,
      workerSkill: workerSkill,
      workerExperience: workerExperience,
      workerCity: workerCity,
      workerCityLower: workerCityLower,
      available: true,
      verified: true,
      createdAt: serverTimestamp()
    });

    workerMessage.textContent = "Worker registered successfully. Checking pending bookings...";

    // Now search pending bookings that match this worker
    const pendingBookingQuery = query(
      collection(db, "bookings"),
      where("serviceType", "==", workerSkill),
      where("customerCityLower", "==", workerCityLower),
      where("bookingStatus", "==", "pending"),
      limit(1)
    );

    const pendingBookingSnapshot = await getDocs(pendingBookingQuery);

    if (!pendingBookingSnapshot.empty) {
      const bookingDoc = pendingBookingSnapshot.docs[0];

      // Assign this worker to pending booking
      await updateDoc(bookingDoc.ref, {
        bookingStatus: "assigned",
        assignedWorkerId: workerPhone,
        assignedWorkerName: workerName,
        assignedWorkerPhone: workerPhone
      });

      workerMessage.textContent =
        "Worker registered successfully and one pending booking is assigned to this worker.";
    } else {
      workerMessage.textContent =
        "Worker registered successfully. No pending booking found right now.";
    }

    workerForm.reset();

  } catch (error) {
    console.error("Worker registration error:", error);
    workerMessage.textContent = "Firebase Error: " + error.message;
  }
});
// ===============================
// Worker Dashboard
// ===============================
const loadJobsBtn = document.getElementById("loadJobsBtn");
const dashboardMessage = document.getElementById("dashboardMessage");
const workerJobs = document.getElementById("workerJobs");

loadJobsBtn.addEventListener("click", async function () {
  const phone = cleanPhone(document.getElementById("dashboardWorkerPhone").value);

  workerJobs.innerHTML = "";

  if (!isValidPhone(phone)) {
    dashboardMessage.textContent = "Please enter your registered 10 digit mobile number.";
    return;
  }

  dashboardMessage.textContent = "Loading assigned jobs...";

  try {
    const jobsQuery = query(
      collection(db, "bookings"),
      where("assignedWorkerPhone", "==", phone)
    );

    const jobsSnapshot = await getDocs(jobsQuery);

    if (jobsSnapshot.empty) {
      dashboardMessage.textContent = "No jobs found for this number.";
      workerJobs.innerHTML = `
        <div class="data-card">
          <h3>No Assigned Jobs</h3>
          <p>When a customer books your service, assigned jobs will appear here.</p>
        </div>
      `;
      return;
    }

    dashboardMessage.textContent = "Jobs loaded successfully.";

    jobsSnapshot.forEach((docItem) => {
      const job = docItem.data();

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
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    dashboardMessage.textContent = "Error loading jobs. Check Firebase rules.";
  }
});
