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

    return {
      uid: userRecord.uid,
      email: userRecord.email
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

    return {
      uid: found.uid,
      email: userRecord.email || found.data.email
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
    const otp = String(body.otp || "").trim();
    const newPassword = String(body.newPassword || "");

    if (!identifier || !otp || !newPassword) {
      res.status(400).json({ error: "All fields are required." });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters." });
      return;
    }

    const resolved = await resolveUser(method, identifier);

    const db = admin.firestore();
    const otpRef = db.collection("passwordOtps").doc(resolved.uid);
    const otpSnap = await otpRef.get();

    if (!otpSnap.exists) {
      res.status(404).json({ error: "OTP not found. Request a new OTP." });
      return;
    }

    const otpData = otpSnap.data();

    if (otpData.used) {
      res.status(400).json({ error: "OTP already used." });
      return;
    }

    if (Date.now() > Number(otpData.expiresAt || 0)) {
      res.status(400).json({ error: "OTP expired. Request a new OTP." });
      return;
    }

    if (otpData.otp !== otp) {
      res.status(400).json({ error: "Invalid OTP." });
      return;
    }

    await admin.auth().updateUser(resolved.uid, {
      password: newPassword
    });

    await otpRef.set(
      {
        used: true,
        usedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    await db.collection("notifications").add({
      toUserId: resolved.uid,
      title: "Password Reset",
      message: "Your KaamConnect password was reset successfully.",
      type: "security",
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({
      success: true,
      message: "Password reset successful."
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
