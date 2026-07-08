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

async function verifyUser(req) {
  const app = initAdmin();
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    throw new Error("Missing authorization token.");
  }

  const token = header.replace("Bearer ", "").trim();
  return app.auth().verifyIdToken(token);
}

function verifySignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    throw new Error("RAZORPAY_KEY_SECRET is missing.");
  }

  const body = `${orderId}|${paymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    const decodedUser = await verifyUser(req);

    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body || {};

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendJson(res, 400, { error: "Payment verification fields are required." });
    }

    const valid = verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!valid) {
      return sendJson(res, 400, { error: "Invalid payment signature." });
    }

    const app = initAdmin();
    const db = app.firestore();

    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return sendJson(res, 404, { error: "Booking not found." });
    }

    const booking = bookingSnap.data();

    if (booking.customerId !== decodedUser.uid) {
      return sendJson(res, 403, { error: "Only booking customer can verify payment." });
    }

    await bookingRef.set({
      paymentStatus: "paid",
      bookingStatus: "paid",
      jobProgress: "payment_verified",
      workerCanSeeContact: true,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await db.collection("publicJobs").doc(bookingId).set({
      biddingOpen: false,
      bookingStatus: "paid",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await db.collection("payments").doc(razorpay_order_id).set({
      bookingId,
      customerId: decodedUser.uid,
      workerUserId: booking.assignedWorkerId || booking.acceptedBid?.workerUserId || "",
      amount: booking.acceptedBid?.bidAmount || booking.budget || 0,
      currency: "INR",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      status: "paid",
      verifiedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const workerUserId = booking.assignedWorkerId || booking.acceptedBid?.workerUserId;

    if (workerUserId) {
      await db.collection("notifications").add({
        toUserId: workerUserId,
        title: "Payment verified",
        message: "Customer payment is verified. Customer contact is now unlocked.",
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await db.collection("notifications").add({
      toUserId: decodedUser.uid,
      title: "Payment successful",
      message: "Your RapideService payment was verified successfully.",
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return sendJson(res, 200, {
      success: true,
      message: "Payment verified successfully."
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: error.message || "Payment verification failed."
    });
  }
};
