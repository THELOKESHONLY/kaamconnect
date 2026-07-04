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
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "PASTE_YOUR_REAL_API_KEY",
  authDomain: "kaamconnect-fdf87.firebaseapp.com",
  projectId: "kaamconnect-fdf87",
  storageBucket: "kaamconnect-fdf87.appspot.com",
  messagingSenderId: "PASTE_YOUR_REAL_SENDER_ID",
  appId: "PASTE_YOUR_REAL_APP_ID"
};

// Start Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mobile menu
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("active");
  });
});

// Clean city text
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

// Validate Indian mobile number
function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

// Timeout helper: prevents infinite "Saving..."
function withTimeout(promise, seconds = 12) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout. Check Firebase config, internet, or rules.")), seconds * 1000)
    )
  ]);
}

// ===============================
// Join as Worker Form
// ===============================
const workerForm = document.getElementById("workerForm");
const workerMessage = document.getElementById("workerMessage");

if (workerForm) {
  workerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    workerMessage.textContent = "Saving worker registration...";

    const workerName = document.getElementById("workerName").value.trim();
    const workerPhone = cleanPhone(document.getElementById("workerPhone").value);
    const workerSkill = document.getElementById("workerSkill").value;
    const workerExperience = document.getElementById("workerExperience").value.trim();
    const workerCity = document.getElementById("workerCity").value.trim();

    if (!workerName || !workerPhone || !workerSkill || !workerExperience || !workerCity) {
      workerMessage.textContent = "Please fill all worker details.";
      return;
    }

    if (!isValidPhone(workerPhone)) {
      workerMessage.textContent = "Please enter valid 10 digit mobile number.";
      return;
    }

    try {
      // Save worker automatically
      const workerRef = await withTimeout(
        addDoc(collection(db, "workers"), {
          workerName: workerName,
          workerPhone: workerPhone,
          workerSkill: workerSkill,
          workerExperience: workerExperience,
          workerCity: workerCity,
          workerCityLower: cleanText(workerCity),
          available: true,
          verified: true,
          createdAt: serverTimestamp()
        })
      );

      console.log("Worker saved:", workerRef.id);

      // Find one pending booking for this worker
      const pendingBookingQuery = query(
        collection(db, "bookings"),
        where("serviceType", "==", workerSkill),
        where("customerCityLower", "==", cleanText(workerCity)),
        where("bookingStatus", "==", "pending"),
        limit(1)
      );

      const pendingBookingSnapshot = await withTimeout(getDocs(pendingBookingQuery));

      if (!pendingBookingSnapshot.empty) {
        const bookingDoc = pendingBookingSnapshot.docs[0];

        await withTimeout(
          updateDoc(bookingDoc.ref, {
            bookingStatus: "assigned",
            assignedWorkerId: workerRef.id,
            assignedWorkerName: workerName,
            assignedWorkerPhone: workerPhone
          })
        );

        workerMessage.textContent =
          "Worker registered successfully and one pending booking assigned.";
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
}

// ===============================
// Book a Worker Form
// ===============================
const bookingForm = document.getElementById("bookingForm");
const bookingMessage = document.getElementById("bookingMessage");
const matchResult = document.getElementById("matchResult");

if (bookingForm) {
  bookingForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    bookingMessage.textContent = "Saving booking and searching worker...";
    if (matchResult) matchResult.innerHTML = "";

    const customerName = document.getElementById("customerName").value.trim();
    const customerPhone = cleanPhone(document.getElementById("customerPhone").value);
    const customerCity = document.getElementById("customerCity").value.trim();
    const serviceType = document.getElementById("serviceType").value;
    const customerAddress = document.getElementById("customerAddress").value.trim();
    const workDetails = document.getElementById("workDetails").value.trim();

    if (!isValidPhone(customerPhone)) {
      bookingMessage.textContent = "Please enter valid 10 digit mobile number.";
      return;
    }

    try {
      // Save booking first
      const bookingRef = await withTimeout(
        addDoc(collection(db, "bookings"), {
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
        })
      );

      // Search matching worker
      const workerQuery = query(
        collection(db, "workers"),
        where("workerSkill", "==", serviceType),
        where("workerCityLower", "==", cleanText(customerCity)),
        where("available", "==", true),
        where("verified", "==", true),
        limit(1)
      );

      const workerSnapshot = await withTimeout(getDocs(workerQuery));

      if (!workerSnapshot.empty) {
        const workerDoc = workerSnapshot.docs[0];
        const worker = workerDoc.data();

        await withTimeout(
          updateDoc(bookingRef, {
            bookingStatus: "assigned",
            assignedWorkerId: workerDoc.id,
            assignedWorkerName: worker.workerName,
            assignedWorkerPhone: worker.workerPhone
          })
        );

        bookingMessage.textContent = "Booking saved. Worker matched successfully.";

        if (matchResult) {
          matchResult.innerHTML = `
            <div class="data-card">
              <h3>Worker Matched Successfully</h3>
              <p><strong>Worker Name:</strong> ${worker.workerName}</p>
              <p><strong>Skill:</strong> ${worker.workerSkill}</p>
              <p><strong>Experience:</strong> ${worker.workerExperience}</p>
              <p><strong>City:</strong> ${worker.workerCity}</p>
              <p><strong>Worker Phone:</strong> ${worker.workerPhone}</p>
              <p class="status-assigned">Status: Assigned</p>
            </div>
          `;
        }
      } else {
        bookingMessage.textContent = "Booking saved. No matching worker found right now.";

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
      bookingMessage.textContent = "Firebase Error: " + error.message;
    }
  });
}

// ===============================
// Worker Dashboard
// ===============================
const loadJobsBtn = document.getElementById("loadJobsBtn");
const dashboardMessage = document.getElementById("dashboardMessage");
const workerJobs = document.getElementById("workerJobs");

if (loadJobsBtn) {
  loadJobsBtn.addEventListener("click", async function () {
    const phone = cleanPhone(document.getElementById("dashboardWorkerPhone").value);

    workerJobs.innerHTML = "";

    if (!isValidPhone(phone)) {
      dashboardMessage.textContent = "Please enter valid 10 digit mobile number.";
      return;
    }

    dashboardMessage.textContent = "Loading assigned jobs...";

    try {
      const jobsQuery = query(
        collection(db, "bookings"),
        where("assignedWorkerPhone", "==", phone)
      );

      const jobsSnapshot = await withTimeout(getDocs(jobsQuery));

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
      dashboardMessage.textContent = "Firebase Error: " + error.message;
    }
  });
}
