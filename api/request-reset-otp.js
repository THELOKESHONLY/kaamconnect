const admin = require("firebase-admin");
const twilio = require("twilio");

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

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendResendEmail(to, otp) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || "RapideService <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject: "RapideService Password Reset OTP",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>RapideService Password Reset</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing:4px">${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you did not request this, ignore this email.</p>
        </div>
      `
    })
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Email send failed: ${text}`);
  }

  return true;
}

async function sendTwilioSms(toPhone, otp) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhone) {
    return false;
  }

  const client = twilio(accountSid, authToken);

  await client.messages.create({
    from: fromPhone,
    to: toPhone,
    body: `Your RapideService password reset OTP is ${otp}. It is valid for 10 minutes.`
  });

  return true;
}

async function resolveUserByEmail(email) {
  const app = initAdmin();
  const user = await app.auth().getUserByEmail(email);

  return {
    uid: user.uid,
    email: user.email || email,
    phone: user.phoneNumber || ""
  };
}

async function resolveUserByPhone(phone) {
  const app = initAdmin();
  const db = app.firestore();

  const phoneValue = String(phone || "").trim();

  const usersSnap = await db.collection("users")
    .where("phone", "==", phoneValue)
    .limit(1)
    .get();

  if (usersSnap.empty) {
    throw new Error("No user found with this phone number.");
  }

  const userDoc = usersSnap.docs[0];
  const userData = userDoc.data();

  let authUser = null;

  try {
    authUser = await app.auth().getUser(userDoc.id);
  } catch {
    authUser = null;
  }

  return {
    uid: userDoc.id,
    email: userData.email || authUser?.email || "",
    phone: userData.phone || phoneValue
  };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    const { method, identity } = req.body || {};

    if (!method || !identity) {
      return sendJson(res, 400, { error: "Method and identity are required." });
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

    const otp = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    await db.collection("passwordOtps").doc(resolvedUser.uid).set({
      uid: resolvedUser.uid,
      method,
      identity: String(identity).trim(),
      otp,
      used: false,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    let delivery = "email";

    if (method === "phone") {
      const smsSent = await sendTwilioSms(resolvedUser.phone, otp);

      if (smsSent) {
        delivery = "sms";
      } else {
        if (!resolvedUser.email) {
          return sendJson(res, 400, {
            error: "Twilio is not configured and no email is linked with this phone number."
          });
        }

        await sendResendEmail(resolvedUser.email, otp);
        delivery = "email_fallback";
      }
    } else {
      await sendResendEmail(resolvedUser.email, otp);
      delivery = "email";
    }

    return sendJson(res, 200, {
      success: true,
      delivery,
      message: delivery === "sms"
        ? "OTP sent to your mobile number."
        : "OTP sent to your registered email."
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: error.message || "OTP request failed."
    });
  }
};
