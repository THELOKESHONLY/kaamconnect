const admin = require("firebase-admin");

function initAdmin() {
  if (admin.apps.length) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = String(process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin environment variables are missing.");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });

  return admin;
}

function sendJson(res, status, data) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

async function resolveUserByEmail(email) {
  const app = initAdmin();
  const user = await app.auth().getUserByEmail(email);

  return {
    uid: user.uid,
    email: user.email || email
  };
}

async function resolveUserByPhone(phone) {
  const app = initAdmin();
  const db = app.firestore();

  const usersSnap = await db.collection("users")
    .where("phone", "==", String(phone || "").trim())
    .limit(1)
    .get();

  if (usersSnap.empty) {
    throw new Error("No user found with this phone number.");
  }

  const userDoc = usersSnap.docs[0];

  return {
    uid: userDoc.id,
    email: userDoc.data().email || ""
  };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    const { method, identity, otp, newPassword } = req.body || {};

    if (!method || !identity || !otp || !newPassword) {
      return sendJson(res, 400, { error: "All fields are required." });
    }

    if (String(newPassword).length < 6) {
      return sendJson(res, 400, { error: "Password must be at least 6 characters." });
    }

    const app = initAdmin();
    const db = app.firestore();

    let resolvedUser;

    if (method === "email") {
      resolvedUser = await resolveUserByEmail(String(identity).trim().toLowerCase());
    } else if (method === "phone") {
      resolvedUser = await resolveUserByPhone(String(identity).trim());
    } else {
      return sendJson(res, 400, { error: "Invalid reset method." });
    }

    const otpRef = db.collection("passwordOtps").doc(resolvedUser.uid);
    const otpSnap = await otpRef.get();

    if (!otpSnap.exists) {
      return sendJson(res, 400, { error: "OTP not found. Please request a new OTP." });
    }

    const otpData = otpSnap.data();

    if (otpData.used) {
      return sendJson(res, 400, { error: "OTP already used. Please request a new OTP." });
    }

    if (Date.now() > Number(otpData.expiresAt || 0)) {
      return sendJson(res, 400, { error: "OTP expired. Please request a new OTP." });
    }

    if (String(otpData.otp) !== String(otp).trim()) {
      return sendJson(res, 400, { error: "Invalid OTP." });
    }

    await app.auth().updateUser(resolvedUser.uid, {
      password: String(newPassword)
    });

    await otpRef.set({
      used: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await db.collection("notifications").add({
      toUserId: resolvedUser.uid,
      title: "Password changed",
      message: "Your RapideService account password was changed successfully.",
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return sendJson(res, 200, {
      success: true,
      message: "Password reset successful."
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: error.message || "Password reset failed."
    });
  }
};
