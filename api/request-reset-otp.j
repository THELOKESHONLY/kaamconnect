const admin = require("firebase-admin");

function initAdmin() {
  if (admin.apps.length) return;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: String(process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n")
    })
  });
}

function parseBody(req) {
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return req.body || {};
}

function cleanPhone(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

function otpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(email, otp) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing in Vercel Environment Variables.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || "KaamConnect <onboarding@resend.dev>",
      to: email,
      subject: "KaamConnect Password Reset OTP",
      html: `
        <h2>KaamConnect Password Reset</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this, ignore this email.</p>
      `
    })
  });

  if (!response.ok) {
    const data = await response.text();
    throw new Error("Email send failed: " + data);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    initAdmin();

    const body = parseBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const phone = cleanPhone(body.phone);

    if (!email || !phone) {
      res.status(400).json({ error: "Email and phone are required." });
      return;
    }

    const userRecord = await admin.auth().getUserByEmail(email);
    const db = admin.firestore();

    const userSnap = await db.collection("users").doc(userRecord.uid).get();

    if (!userSnap.exists) {
      res.status(404).json({ error: "User profile not found." });
      return;
    }

    const userData = userSnap.data();
    const savedPhone = cleanPhone(userData.phone || "");

    if (savedPhone !== phone) {
      res.status(403).json({ error: "Phone number does not match this email account." });
      return;
    }

    const otp = otpCode();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    await db.collection("passwordOtps").doc(email).set({
      email,
      uid: userRecord.uid,
      phone,
      otp,
      used: false,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await sendOtpEmail(email, otp);

    res.status(200).json({ success: true, message: "OTP sent." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
