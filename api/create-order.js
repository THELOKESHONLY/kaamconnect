const admin = require("firebase-admin");
const Razorpay = require("razorpay");

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

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return sendJson(res, 500, { error: "Razorpay environment variables are missing." });
    }

    const decodedUser = await verifyUser(req);
    const { bookingId } = req.body || {};

    if (!bookingId) {
      return sendJson(res, 400, { error: "bookingId is required." });
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
      return sendJson(res, 403, { error: "Only booking customer can pay." });
    }

    if (!booking.acceptedBid || !booking.acceptedBid.bidAmount) {
      return sendJson(res, 400, { error: "No accepted bid found for this booking." });
    }

    if (booking.paymentStatus === "paid") {
      return sendJson(res, 400, { error: "Payment already completed." });
    }

    const amountInRupees = Number(booking.acceptedBid.bidAmount || booking.budget || 0);

    if (!amountInRupees || amountInRupees <= 0) {
      return sendJson(res, 400, { error: "Invalid payment amount." });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amountInRupees * 100),
      currency: "INR",
      receipt: `rs_${bookingId.slice(0, 20)}`,
      notes: {
        bookingId,
        customerId: decodedUser.uid,
        brand: "RapideService"
      }
    });

    await db.collection("payments").doc(order.id).set({
      bookingId,
      customerId: decodedUser.uid,
      workerUserId: booking.acceptedBid.workerUserId || booking.assignedWorkerId || "",
      amount: amountInRupees,
      amountPaise: Math.round(amountInRupees * 100),
      currency: "INR",
      razorpayOrderId: order.id,
      status: "created",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return sendJson(res, 200, {
      success: true,
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: error.message || "Create order failed."
    });
  }
};
