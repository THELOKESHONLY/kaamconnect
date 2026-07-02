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

// Booking form submit
const bookingForm = document.getElementById("bookingForm");
const bookingMessage = document.getElementById("bookingMessage");

bookingForm.addEventListener("submit", function (event) {
  //event.preventDefault(); // Stop page refresh

  // Get customer form values
  const name = document.getElementById("customerName").value;
  const phone = document.getElementById("customerPhone").value;
  const service = document.getElementById("serviceType").value;
  const address = document.getElementById("customerAddress").value;
  const details = document.getElementById("workDetails").value;

  // Show success message
  bookingMessage.textContent =
    "Thank you " + name + "! Your booking request for " + service + " has been received.";

  // Create WhatsApp message
  const whatsappMessage =
    "New Booking Request:%0A" +
    "Name: " + name + "%0A" +
    "Phone: " + phone + "%0A" +
    "Service: " + service + "%0A" +
    "Address: " + address + "%0A" +
    "Work Details: " + details;

  // Replace this number with your own WhatsApp number
  const adminWhatsAppNumber = "+91 7303041394";

  // Open WhatsApp with booking details
  window.open(
    "https://wa.me/" + adminWhatsAppNumber + "?text=" + whatsappMessage,
    "_blank"
  );

  // Reset form after submit
  bookingForm.reset();
});

// Worker registration form submit
const workerForm = document.getElementById("workerForm");
const workerMessage = document.getElementById("workerMessage");

workerForm.addEventListener("submit", function (event) {
  event.preventDefault(); // Stop page refresh

  // Get worker form values
  const name = document.getElementById("workerName").value;
  const phone = document.getElementById("workerPhone").value;
  const skill = document.getElementById("workerSkill").value;
  const experience = document.getElementById("workerExperience").value;
  const city = document.getElementById("workerCity").value;

  // Show success message
  workerMessage.textContent =
    "Thank you " + name + "! Your worker registration has been submitted.";

  // Create WhatsApp message
  const whatsappMessage =
    "New Worker Registration:%0A" +
    "Name: " + name + "%0A" +
    "Phone: " + phone + "%0A" +
    "Skill: " + skill + "%0A" +
    "Experience: " + experience + "%0A" +
    "City: " + city;

  // Replace this number with your own WhatsApp number
  const adminWhatsAppNumber = "+91 7303041394";

  // Open WhatsApp with worker details
  window.open(
    "https://wa.me/" + adminWhatsAppNumber + "?text=" + whatsappMessage,
    "_blank"
  );

  // Reset form after submit
  workerForm.reset();
});
