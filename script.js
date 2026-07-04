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
  setDoc,
  getDoc
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

function clearForm(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.reset();
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

  if (user) {
    showMessage("authMessage", "Logged in as: " + user.email);
  } else {
    showMessage("authMessage", "You are not logged in.");
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
      clearForm("authForm");

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
      clearForm("authForm");

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
      clearForm("authForm");
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
    const workerType = getValue("workerType");
    const workerExperience = getValue("workerExperience");
    const workerCity = getValue("workerCity");
    const workerCityLower = cleanText(workerCity);

    if (!workerName || !workerPhone || !workerSkill || !workerType || !workerExperience || !workerCity) {
      showMessage("workerMessage", "Please fill all worker details.");
      return;
    }

    if (!isValidPhone(workerPhone)) {
      showMessage("workerMessage", "Please enter valid 10 digit mobile number.");
      return;
    }

    try {
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
            biddingOpen: false,
            assignedWorkerId: workerPhone,
            assignedWorkerName: workerName,
            assignedWorkerPhone: workerPhone
          });

          assignedBooking = true;
          break;
        }
      }

      if (assignedBooking) {
        showMessage("workerMessage", "Worker registered successfully and one pending booking assigned.");
      } else {
        showMessage("workerMessage", "Worker registered successfully. No pending booking found right now.");
      }

      clearForm("workerForm");

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
    const customerBudget = Number(getValue("customerBudget"));
    const workDetails = getValue("workDetails");

    if (!customerName || !customerPhone || !customerCity || !serviceType || !customerAddress || !customerBudget || !workDetails) {
      showMessage("bookingMessage", "Please fill all booking details.");
      return;
    }

    if (!isValidPhone(customerPhone)) {
      showMessage("bookingMessage", "Please enter valid 10 digit mobile number.");
      return;
    }

    try {
      const bookingRef = await addDoc(collection(db, "bookings"), {
        customerId: currentUser ? currentUser.uid : "",
        customerName: customerName,
        customerPhone: customerPhone,
        customerCity: customerCity,
        customerCityLower: customerCityLower,
        serviceType: serviceType,
        customerAddress: customerAddress,
        customerBudget: customerBudget,
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

      workerSnapshot.forEach((docItem) => {
        const worker = docItem.data();

        if (
          worker.workerCityLower === customerCityLower &&
          worker.available === true &&
          worker.verified === true
        ) {
          matchedWorkersHtml += `
            <div class="data-card">
              <h3>Matching Worker Found</h3>
              <p><strong>Name:</strong> ${worker.workerName}</p>
              <p><strong>Skill:</strong> ${worker.workerSkill}</p>
              <p><strong>Work Type:</strong> ${worker.workerType}</p>
              <p><strong>Experience:</strong> ${worker.workerExperience}</p>
              <p><strong>City:</strong> ${worker.workerCity}</p>
              <p><strong>Phone:</strong> ${worker.workerPhone}</p>
              <p><strong>Rating:</strong> ${worker.workerRating || 0} ⭐ (${worker.totalReviews || 0} reviews)</p>
              <p class="status-pending">Booking is open for bids. Workers can bid from dashboard.</p>
            </div>
          `;
        }
      });

      showMessage("bookingMessage", "Booking saved successfully. Workers can now bid on your work.");

      if (matchResult) {
        matchResult.innerHTML = `
          <div class="data-card">
            <h3>Booking Posted Successfully</h3>
            <p><strong>Service:</strong> ${serviceType}</p>
            <p><strong>City:</strong> ${customerCity}</p>
            <p><strong>Your Budget:</strong> ₹${customerBudget}</p>
            <p><strong>Status:</strong> Pending / Open for Bids</p>
            <p>Ask workers to check Worker Dashboard and submit bids.</p>
          </div>
          ${matchedWorkersHtml || ""}
        `;
      }

      clearForm("bookingForm");

    } catch (error) {
      console.error("Booking error:", error);
      showMessage("bookingMessage", "Firebase Error: " + error.message);
    }
  });
}


// ===============================
// Worker Assigned Jobs Dashboard
// ===============================
const loadJobsBtn = document.getElementById("loadJobsBtn");
const loadOpenJobsBtn = document.getElementById("loadOpenJobsBtn");
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
        showMessage("dashboardMessage", "No assigned jobs found for this number.");
        return;
      }

      showMessage("dashboardMessage", "Assigned jobs loaded successfully.");

      jobsSnapshot.forEach((docItem) => {
        const job = docItem.data();

        if (workerJobs) {
          workerJobs.innerHTML += `
            <div class="data-card">
              <h3>Assigned Customer Booking</h3>
              <p><strong>Customer Name:</strong> ${job.customerName}</p>
              <p><strong>Customer Phone:</strong> ${job.customerPhone}</p>
              <p><strong>Service:</strong> ${job.serviceType}</p>
              <p><strong>City:</strong> ${job.customerCity}</p>
              <p><strong>Address:</strong> ${job.customerAddress}</p>
              <p><strong>Budget:</strong> ₹${job.customerBudget || 0}</p>
              <p><strong>Accepted Amount:</strong> ₹${job.acceptedBidAmount || 0}</p>
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
// Worker Open Jobs Bidding System
// ===============================
if (loadOpenJobsBtn) {
  loadOpenJobsBtn.addEventListener("click", async () => {
    const phone = cleanPhone(getValue("dashboardWorkerPhone"));

    if (workerJobs) {
      workerJobs.innerHTML = "";
    }

    if (!isValidPhone(phone)) {
      showMessage("dashboardMessage", "Please enter valid registered worker mobile number.");
      return;
    }

    try {
      showMessage("dashboardMessage", "Finding open jobs for bidding...");

      const workerRef = doc(db, "workers", phone);
      const workerSnap = await getDoc(workerRef);

      if (!workerSnap.exists()) {
        showMessage("dashboardMessage", "Worker profile not found. Please register first.");
        return;
      }

      const worker = workerSnap.data();

      const openJobsQuery = query(
        collection(db, "bookings"),
        where("serviceType", "==", worker.workerSkill)
      );

      const openJobsSnapshot = await getDocs(openJobsQuery);

      let foundJobs = false;

      openJobsSnapshot.forEach((jobDoc) => {
        const job = jobDoc.data();

        if (
          job.bookingStatus === "pending" &&
          job.biddingOpen === true &&
          job.customerCityLower === worker.workerCityLower
        ) {
          foundJobs = true;

          if (workerJobs) {
            workerJobs.innerHTML += `
              <div class="data-card">
                <h3>Open Job for Bidding</h3>
                <p><strong>Customer:</strong> ${job.customerName}</p>
                <p><strong>Service:</strong> ${job.serviceType}</p>
                <p><strong>City:</strong> ${job.customerCity}</p>
                <p><strong>Address:</strong> ${job.customerAddress}</p>
                <p><strong>Work Details:</strong> ${job.workDetails}</p>
                <p><strong>Customer Budget:</strong> ₹${job.customerBudget || 0}</p>

                <div class="form-group">
                  <label>Your Bid Amount ₹</label>
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

      if (!foundJobs) {
        showMessage("dashboardMessage", "No open jobs found for your skill and city.");
      } else {
        showMessage("dashboardMessage", "Open jobs loaded. Submit your bid.");
      }

    } catch (error) {
      console.error("Open jobs error:", error);
      showMessage("dashboardMessage", "Firebase Error: " + error.message);
    }
  });
}


// ===============================
// Place Bid Function
// ===============================
window.placeBid = async function (bookingId, workerPhone) {
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

    await addDoc(collection(db, "bids"), {
      bookingId: bookingId,
      workerPhone: workerPhone,
      workerName: worker.workerName,
      workerSkill: worker.workerSkill,
      workerCity: worker.workerCity,
      workerRating: worker.workerRating || 0,
      totalReviews: worker.totalReviews || 0,
      bidAmount: bidAmount,
      bidMessage: bidMessage,
      bidStatus: "pending",
      createdAt: serverTimestamp()
    });

    showMessage(statusId, "Bid submitted successfully.");

  } catch (error) {
    console.error("Bid error:", error);
    showMessage(statusId, "Firebase Error: " + error.message);
  }
};


// ===============================
// Customer Load Bids System
// ===============================
const loadCustomerBidsBtn = document.getElementById("loadCustomerBidsBtn");
const customerBidsResult = document.getElementById("customerBidsResult");

if (loadCustomerBidsBtn) {
  loadCustomerBidsBtn.addEventListener("click", async () => {
    const customerPhone = cleanPhone(getValue("bidCustomerPhone"));

    if (customerBidsResult) {
      customerBidsResult.innerHTML = "";
    }

    if (!isValidPhone(customerPhone)) {
      showMessage("customerBidMessage", "Please enter valid customer mobile number.");
      return;
    }

    try {
      showMessage("customerBidMessage", "Loading your bookings and bids...");

      const bookingQuery = query(
        collection(db, "bookings"),
        where("customerPhone", "==", customerPhone)
      );

      const bookingSnapshot = await getDocs(bookingQuery);

      if (bookingSnapshot.empty) {
        showMessage("customerBidMessage", "No bookings found for this number.");
        return;
      }

      let foundAnyBid = false;

      for (const bookingDoc of bookingSnapshot.docs) {
        const booking = bookingDoc.data();

        const bidQuery = query(
          collection(db, "bids"),
          where("bookingId", "==", bookingDoc.id)
        );

        const bidSnapshot = await getDocs(bidQuery);

        if (!bidSnapshot.empty) {
          foundAnyBid = true;

          if (customerBidsResult) {
            customerBidsResult.innerHTML += `
              <div class="data-card">
                <h3>Your Booking</h3>
                <p><strong>Service:</strong> ${booking.serviceType}</p>
                <p><strong>City:</strong> ${booking.customerCity}</p>
                <p><strong>Your Budget:</strong> ₹${booking.customerBudget || 0}</p>
                <p><strong>Status:</strong> ${booking.bookingStatus}</p>
              </div>
            `;
          }

          bidSnapshot.forEach((bidDoc) => {
            const bid = bidDoc.data();

            if (customerBidsResult) {
              customerBidsResult.innerHTML += `
                <div class="data-card">
                  <h3>Worker Bid</h3>
                  <p><strong>Worker:</strong> ${bid.workerName}</p>
                  <p><strong>Skill:</strong> ${bid.workerSkill}</p>
                  <p><strong>City:</strong> ${bid.workerCity}</p>
                  <p><strong>Rating:</strong> ${bid.workerRating || 0} ⭐ (${bid.totalReviews || 0} reviews)</p>
                  <p><strong>Bid Amount:</strong> ₹${bid.bidAmount}</p>
                  <p><strong>Message:</strong> ${bid.bidMessage || "No message"}</p>
                  <p><strong>Bid Status:</strong> ${bid.bidStatus}</p>

                  <button class="btn primary-btn full-btn" onclick="acceptBid('${bookingDoc.id}', '${bidDoc.id}', '${bid.workerPhone}', '${bid.workerName}', ${bid.bidAmount})">
                    Accept This Bid
                  </button>

                  <p class="form-message" id="acceptStatus-${bidDoc.id}"></p>
                </div>
              `;
            }
          });
        }
      }

      if (!foundAnyBid) {
        showMessage("customerBidMessage", "No bids received yet.");
      } else {
        showMessage("customerBidMessage", "Bids loaded successfully.");
      }

    } catch (error) {
      console.error("Load bids error:", error);
      showMessage("customerBidMessage", "Firebase Error: " + error.message);
    }
  });
}


// ===============================
// Accept Bid Function
// ===============================
window.acceptBid = async function (bookingId, bidId, workerPhone, workerName, bidAmount) {
  try {
    showMessage("acceptStatus-" + bidId, "Accepting bid...");

    const bookingRef = doc(db, "bookings", bookingId);
    const bidRef = doc(db, "bids", bidId);

    await updateDoc(bookingRef, {
      bookingStatus: "assigned",
      biddingOpen: false,
      acceptedBidId: bidId,
      acceptedBidAmount: bidAmount,
      assignedWorkerId: workerPhone,
      assignedWorkerName: workerName,
      assignedWorkerPhone: workerPhone
    });

    await updateDoc(bidRef, {
      bidStatus: "accepted"
    });

    showMessage("acceptStatus-" + bidId, "Bid accepted successfully. Worker assigned.");

  } catch (error) {
    console.error("Accept bid error:", error);
    showMessage("acceptStatus-" + bidId, "Firebase Error: " + error.message);
  }
};


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
      showMessage("reviewMessage", "Firebase Error: " + error.message);
    }
  });
}
