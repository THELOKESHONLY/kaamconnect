const crypto = require("crypto");
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

async function getUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) throw new Error("Missing auth token.");

  return admin.auth().verifyIdToken(token);
}

function parseBody(req) {
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return req.body || {};
}

function verifyRazorpaySignature(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    initAdmin();

    const user = await getUserFromToken(req);
    const body = parseBody(req);

    const {
      bookingId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = body;

    if (!bookingId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      res.status(400).json({ error: "Missing payment verification data." });
      return;
    }

    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      res.status(400).json({ error: "Invalid payment signature." });
      return;
    }

    const db = admin.firestore();
    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      res.status(404).json({ error: "Booking not found." });
      return;
    }

    const booking = bookingSnap.data();

    if (booking.customerId !== user.uid) {
      res.status(403).json({ error: "This booking does not belong to you." });
      return;
    }

    const amount = Number(booking.acceptedBidAmount || 0);
    const commission = Math.ceil(amount * 0.10);
    const workerAmount = amount - commission;

    await bookingRef.set({
      bookingStatus: "assigned",
      paymentStatus: "paid",
      jobProgress: "payment_done_job_assigned",
      workerCanSeeContact: true,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await db.collection("publicJobs").doc(bookingId).set({
      bookingStatus: "assigned",
      paymentStatus: "paid",
      jobProgress: "payment_done_job_assigned",
      workerCanSeeContact: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await db.collection("payments").doc(razorpay_order_id).set({
      paymentProviderOrderId: razorpay_order_id,
      paymentProviderPaymentId: razorpay_payment_id,
      bookingId,
      customerId: booking.customerId,
      workerId: booking.assignedWorkerUserId || "",
      amount,
      commission,
      workerAmount,
      currency: booking.currency || "INR",
      paymentStatus: "paid",
      provider: "razorpay",
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    if (booking.assignedWorkerUserId) {
      await db.collection("notifications").add({
        toUserId: booking.assignedWorkerUserId,
        title: "Payment Received",
        message: "Customer payment is verified. Job is assigned and contact details are unlocked.",
        type: "payment_success",
        refId: bookingId,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await db.collection("notifications").add({
      toUserId: booking.customerId,
      title: "Payment Successful",
      message: "Your worker booking payment is verified and job is assigned.",
      type: "payment_success",
      refId: bookingId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({
      success: true,
      bookingStatus: "assigned",
      paymentStatus: "paid"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
