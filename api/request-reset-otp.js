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

async function sendEmailOtp(email, otp) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || "support@rapideservice.com";

  if (!apiKey) {
    console.log("OTP for", email, otp);
    return {
      skipped: true
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: email,
      subject: "RapideService password reset OTP",
      html: `
        <h2>Your RapideService OTP is ${otp}</h2>
        <p>This OTP is valid for 10 minutes.</p>
      `
    })
  });

  if (!response.ok) {
    const data = await response.text();
    throw new Error(data || "Email OTP failed.");
  }

  return response.json();
}

async function findUserByPhone(db, phone) {
  const snap = await db.collection("users")
    .where("phone", "==", phone)
    .limit(1)
    .get();

  if (snap.empty) return null;

  return {
    uid: snap.docs[0].id,
    ...