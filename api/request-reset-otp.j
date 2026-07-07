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
  return String(value || "").replace(/[^\d]/g, "");
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
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || "KaamConnect <onboarding@resend.dev>",
      to: email,
      subject: "KaamConnect Password Reset OTP",
      html: `
        <h2>KaamConnect Password Reset</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing:4px;">${otp}</h1>
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

async function findUserByPhone(db, phoneDigits) {
  const usersSnap = await db.collection("users").get();

  let found = null;

  usersSnap.forEach((docSnap) => {
    const data = docSnap.data();
    const savedPhone = cleanPhone(data.phone || "");

    if (savedPhone === phoneDigits) {
      found = {
        uid: docSnap.id,
        data
      };
    }
  });

  return found;
}

async function resolveUser(method, identifier) {
  const db = admin.firestore();

  if (method === "email") {
    const email = String(identifier || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      throw new Error("Enter valid registered email.");
    }

    const userRecord = await admin.auth().getUserByEmail(email);
    const userSnap = await db.collection("users").doc(userRecord.uid).get();

    if (!userSnap.exists) {
      throw new Error("User profile not found.");
    }

    const userData = userSnap.data();

    return {
      uid: userRecord.uid,
      email: userRecord.email || userData.email,
      userData
    };
  }

  if (method === "phone") {
    const phoneDigits = cleanPhone(identifier);

    if (!phoneDigits || phoneDigits.length < 10) {
      throw new Error("Enter valid registered mobile number.");
    }

    const found = await findUserByPhone(db, phoneDigits);

    if (!found) {
      throw new Error("No account found with this phone number.");
    }

    const userRecord = await admin.auth().getUser(found.uid);
    const deliveryEmail = userRecord.email || found.data.email;

    if (!deliveryEmail) {
      throw new Error("This phone account has no email linked. Use email reset or contact support.");
    }

    return {
      uid: found.uid,
      email: deliveryEmail,
      userData: found.data
    };
  }

  throw new Error("Invalid reset method.");
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    initAdmin();

    const body = parseBody(req);
    const method = String(body.method || "email").trim();
    const identifier = String(body.identifier || "").trim();

    if (!identifier) {
      res.status(400).json({ error: "Email or phone is required." });
      return;
    }

    const resolved = await resolveUser(method, identifier);

    const otp = otpCode();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    const db = admin.firestore();

    await db.collection("passwordOtps").doc(resolved.uid).set({
      uid: resolved.uid,
      method,
      email: resolved.email,
      identifier,
      otp,
      used: false,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await sendOtpEmail(resolved.email, otp);

    res.status(200).json({
      success: true,
      message: "OTP sent."
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
