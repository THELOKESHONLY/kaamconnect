const Razorpay = require("razorpay");
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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    initAdmin();

    const user = await getUserFromToken(req);
    const body = parseBody(req);
    const bookingId = body.bookingId;

    if (!bookingId) {
      res.status(400).json({ error: "Missing bookingId." });
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

    if (booking.bookingStatus !== "payment_pending") {
      res.status(400).json({ error: "Booking is not ready for payment." });
      return;
    }

    const amount = Number(booking.acceptedBidAmount || 0);

    if (!amount || amount <= 0) {
      res.status(400).json({ error: "Invalid payment amount." });
      return;
    }

    const currency = booking.currency || "INR";
    const commission = Math.ceil(amount * 0.10);
    const workerAmount = amount - commission;

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency,
      receipt: `booking_${bookingId}`,
      notes: {
        bookingId,
        customerId: booking.customerId,
        workerId: booking.assignedWorkerUserId || ""
      }
    });

    await db.collection("payments").doc(order.id).set({
      paymentProviderOrderId: order.id,
      bookingId,
      customerId: booking.customerId,
      workerId: booking.assignedWorkerUserId || "",
      amount,
      commission,
      workerAmount,
      currency,
      paymentStatus: "order_created",
      provider: "razorpay",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await bookingRef.set({
      razorpayOrderId: order.id,
      paymentStatus: "order_created",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.status(200).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
