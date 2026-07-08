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

function formatIndianPhone(phone) {
  const clean = cleanPhone(phone);

  if (String(phone || "").trim().startsWith("+")) {
    return String(phone).trim();
  }

  if (clean.length === 10) {
    return "+91" + clean;
  }

  if (clean.length === 12 && clean.startsWith("91")) {
    return "+" + clean;
  }

  return "+" + clean;
}

function otpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(email, otp) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing.");
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
      `
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error("Email send failed: " + text);
  }
}

async function sendOtpSms(phone, otp) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    throw new Error("Twilio SMS variables are missing.");
  }

  const twilio = require("twilio");
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  await client.messages.create({
    body: `Your KaamConnect password reset OTP is ${otp}. It will expire in 10 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: formatIndianPhone(phone)
  });
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
    const userSnap = await db.collection("users").doc(userRecord.uid).get();

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      phone: userSnap.exists ? userSnap.data().phone || "" : ""
    };
  }

  if (method === "phone") {
    const found = await findUserByPhone(db, identifier);

    if (!found) {
      throw new Error("No account found with this phone number.");
    }

    const userRecord = await admin.auth().getUser(found.uid);

    return {
      uid: found.uid,
      email: userRecord.email || found.data.email || "",
      phone: found.data.phone || identifier
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

    if (!identifier) {
      return sendJson(res, 400, { error: "Email or phone is required." });
    }

    const resolved = await resolveUser(method, identifier);

    const otp = otpCode();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    const db = admin.firestore();

    await db.collection("passwordOtps").doc(resolved.uid).set({
      uid: resolved.uid,
      method,
      identifier,
      email: resolved.email || "",
      phone: resolved.phone || "",
      otp,
      used: false,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    let delivery = "email";

    if (method === "phone") {
      try {
        await sendOtpSms(resolved.phone || identifier, otp);
        delivery = "phone";
      } catch (smsError) {
        if (!resolved.email) {
          throw new Error("SMS failed and no email is linked with this phone. SMS error: " + smsError.message);
        }

        await sendOtpEmail(resolved.email, otp);
        delivery = "email_fallback";
      }
    } else {
      await sendOtpEmail(resolved.email, otp);
    }

    return sendJson(res, 200, {
      success: true,
      delivery,
      message:
        delivery === "phone"
          ? "OTP sent to your registered mobile number."
          : delivery === "email_fallback"
            ? "SMS is not configured, so OTP was sent to email linked with this phone."
            : "OTP sent to your registered email."
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: error.message
    });
  }
};
