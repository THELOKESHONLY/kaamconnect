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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Replace this with your own Firebase config
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Your admin WhatsApp number
const adminWhatsAppNumber = "917303041394";

// Mobile menu toggle
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

menuBtn.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});

// Close mobile menu after clicking any link
const links = document.querySelectorAll(".nav-links a");

links.forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("active");
  });
});

// Helper function to make city lowercase
function cleanText(text) {
  return text.trim().toLowerCase();
}

// ===============================
// Book a Worker Form
// ===============================
const bookingForm = document.getElementById("bookingForm");
const bookingMessage = document.getElementById("bookingMessage");

bookingForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const name = document.getElementById("customerName").value;
  const phone = document.getElementById("customerPhone").value;
  const city = document.getElementById("customerCity").value;
  const service = document.getElementById("serviceType").value;
  const address = document.getElementById("customerAddress").value;
  const details = document.getElementById("workDetails").value;

  try {
    // Save booking in Firebase
    await addDoc(collection(db, "bookings"), {
      customerName: name,
      customerPhone: phone,
      customerCity: city,
      customerCityLower: cleanText(city),
      serviceType: service,
      customerAddress: address,
      workDetails: details,
      bookingStatus: "pending",
      createdAt: serverTimestamp()
    });

    // Search matching verified worker
    const workersQuery = query(
      collection(db, "workers"),
      where("workerSkill", "==", service),
      where("workerCityLower", "==", cleanText(city)),
      where("available", "==", true),
      where("verified", "==", true),
      limit(1)
    );

    const workersSnapshot = await getDocs(workersQuery);

    if (!workersSnapshot.empty) {
      // Get first matching worker
      const workerData = workersSnapshot.docs[0].data();

      bookingMessage.textContent =
        "Worker found: " + workerData.workerName + ". Opening WhatsApp...";

      const whatsappMessage =
        "Hello " + workerData.workerName + ", I need " + service + " service.%0A" +
        "My Name: " + name + "%0A" +
        "Phone: " + phone + "%0A" +
        "City: " + city + "%0A" +
        "Address: " + address + "%0A" +
        "Work Details: " + details;

      window.open(
        "https://wa.me/91" + workerData.workerPhone + "?text=" + whatsappMessage,
        "_blank"
      );
    } else {
      // If no worker found, send request to admin
      bookingMessage.textContent =
        "Booking saved. No verified worker found now. Admin will contact you.";

      const adminMessage =
        "New Booking Request:%0A" +
        "Name: " + name + "%0A" +
        "Phone: " + phone + "%0A" +
        "City: " + city + "%0A" +
        "Service: " + service + "%0A" +
        "Address: " + address + "%0A" +
        "Work Details: " + details;

      window.open(
        "https://wa.me/" + adminWhatsAppNumber + "?text=" + adminMessage,
        "_blank"
      );
    }

    bookingForm.reset();
  } catch (error) {
    console.error("Booking error:", error);
    bookingMessage.textContent = "Something went wrong. Please try again.";
  }
});

// ===============================
// Join as Worker Form
// ===============================
const workerForm = document.getElementById("workerForm");
const workerMessage = document.getElementById("workerMessage");

workerForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const name = document.getElementById("workerName").value;
  const phone = document.getElementById("workerPhone").value;
  const skill = document.getElementById("workerSkill").value;
  const experience = document.getElementById("workerExperience").value;
  const city = document.getElementById("workerCity").value;

  try {
    // Save worker data in Firebase
    await addDoc(collection(db, "workers"), {
      workerName: name,
      workerPhone: phone,
      workerSkill: skill,
      workerExperience: experience,
      workerCity: city,
      workerCityLower: cleanText(city),
      available: true,
      verified: false,
      createdAt: serverTimestamp()
    });

    workerMessage.textContent =
      "Thank you " + name + "! Your registration is saved. Admin will verify you soon.";

    const whatsappMessage =
      "New Worker Registration:%0A" +
      "Name: " + name + "%0A" +
      "Phone: " + phone + "%0A" +
      "Skill: " + skill + "%0A" +
      "Experience: " + experience + "%0A" +
      "City: " + city;

    window.open(
      "https://wa.me/" + adminWhatsAppNumber + "?text=" + whatsappMessage,
      "_blank"
    );

    workerForm.reset();
  } catch (error) {
    console.error("Worker registration error:", error);
    workerMessage.textContent = "Something went wrong. Please try again.";
  }
});
