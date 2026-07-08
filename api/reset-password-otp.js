const admin = require("firebase-admin");

function sendJson(res, status, data) {
  res.setHeader("Content-Type", "application/json");
  res.status(status).json(data);
}

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

async function findUserByPhone(db, phone) {
  const phoneDigits = cleanPhone(phone);

  const exactSnap = await db.collection("users").where("phone", "==", phoneDigits).limit(1).get();

  if (!exactSnap.empty) {
    const docSnap = exactSnap.docs[0];
    return {
      uid: docSnap.id,
      data: docSnap.data()
    };
  }

  const allUsers = await db.collection("users").get();
  let found = null;

  allUsers.forEach((docSnap) => {
    const data = docSnap.data();
    if (cleanPhone(data.phone) === phoneDigits) {
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

    if (!email.includes("@")) {
      throw new Error("Enter valid registered email.");
    }

    const userRecord = await admin.auth().getUserByEmail(email);

    return {
      uid: userRecord.uid
    };
  }

  if (method === "phone") {
    const found = await findUserByPhone(db, identifier);

    if (!found) {
      throw new Error("No account found with this phone number.");
    }

    return {
      uid: found.uid
    };
  }

  throw new Error("Invalid reset method.");
}

module.exports = async function handler(req, res) {
  try {
    res.setHeader("Content-Type", "application/json");

    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    initAdmin();

    const body = parseBody(req);
    const method = String(body.method || "email").trim();
    const identifier = String(body.identifier || "").trim();
    const otp = String(body.otp || "").trim();
    const newPassword = String(body.newPassword || "");

    if (!identifier || !otp || !newPassword) {
      return sendJson(res, 400, { error: "All fields are required." });
    }

    if (newPassword.length < 6) {
      return sendJson(res, 400, { error: "Password must be at least 6 characters." });
    }

    const resolved = await resolveUser(method, identifier);

    const db = admin.firestore();
    const otpRef = db.collection("passwordOtps").doc(resolved.uid);
    const otpSnap = await otpRef.get();

    if (!otpSnap.exists) {
      return sendJson(res, 404, { error: "OTP not found. Request a new OTP." });
    }

    const otpData = otpSnap.data();

    if (otpData.used) {
      return sendJson(res, 400, { error: "OTP already used." });
    }

    if (Date.now() > Number(otpData.expiresAt || 0)) {
      return sendJson(res, 400, { error: "OTP expired. Request a new OTP." });
    }

    if (String(otpData.otp) !== otp) {
      return sendJson(res, 400, { error: "Invalid OTP." });
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

    return sendJson(res, 200, {
      success: true,
      message: "Password reset successful."
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: error.message
    });
  }
};
