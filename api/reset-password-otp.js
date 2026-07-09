const admin = require("firebase-admin");

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function initFirebaseAdmin() {
  if (admin.apps.length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : "";

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
}

function getBody(req) {
  if (typeof req.body === "object" && req.body !== null) {
    return req.body;
  }

  try {
    return JSON.parse(req.body || "{}");
  } catch {
    return {};
  }
}

async function findUserByPhone(db, phone) {
  const snap = await db.collection("users")
    .where("phone", "==", phone)
    .limit(1)
    .get();

  if (snap.empty) return null;

  return {
    uid: snap.docs[0].id,
    ...snap.docs[0].data()
  };
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    initFirebaseAdmin();

    const body = getBody(req);

    const method = body.method || "email";
    const identity = String(body.identity || "").trim().toLowerCase();
    const otp = String(body.otp || "").trim();
    const newPassword = String(body.newPassword || "");

    if (!identity || !otp || !newPassword) {
      return sendJson(res, 400, {
        error: "All fields are required."
      });
    }

    if (newPassword.length < 6) {
      return sendJson(res, 400, {
        error: "Password must be at least 6 characters."
      });
    }

    const db = admin.firestore();

    let uid = "";

    if (method === "phone") {
      const profile = await findUserByPhone(db, identity);

      if (!profile) {
        return sendJson(res, 404, {
          error: "No account found with this phone."
        });
      }

      uid = profile.uid;
    } else {
      const userRecord = await admin.auth().getUserByEmail(identity);
      uid = userRecord.uid;
    }

    const otpRef = db.collection("passwordOtps").doc(uid);
    const otpSnap = await otpRef.get();

    if (!otpSnap.exists) {
      return sendJson(res, 400, {
        error: "OTP not found. Please request again."
      });
    }

    const otpData = otpSnap.data();

    if (otpData.used) {
      return sendJson(res, 400, {
        error: "OTP already used."
      });
    }

    if (Date.now() > Number(otpData.expiresAt || 0)) {
      return sendJson(res, 400, {
        error: "OTP expired. Please request again."
      });
    }

    if (String(otpData.otp) !== otp) {
      return sendJson(res, 400, {
        error: "Invalid OTP."
      });
    }

    await admin.auth().updateUser(uid, {
      password: newPassword
    });

    await otpRef.set({
      used: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return sendJson(res, 200, {
      success: true,
      message: "Password reset successful."
    });
  } catch (error) {
    console.error("reset-password-otp error:", error);

    return sendJson(res, 500, {
      error: error.message || "Password reset failed."
    });
  }
};