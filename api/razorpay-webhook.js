const crypto = require("crypto");
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

function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    return true;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    const signature = req.headers["x-razorpay-signature"];
    const rawBody = JSON.stringify(req.body || {});

    const valid = verifyWebhookSignature(rawBody, signature);

    if (!valid) {
      return sendJson(res, 400, { error: "Invalid webhook signature." });
    }

    const app = initAdmin();
    const db = app.firestore();

    await db.collection("razorpayWebhooks").add({
      event: req.body?.event || "",
      payload: req.body || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return sendJson(res, 200, {
      success: true,
      message: "Webhook received."
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: error.message || "Webhook failed."
    });
  }
};
