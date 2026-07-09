const admin = require("firebase-admin");
const Razorpay = require("razorpay");

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

function getToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  return header.replace("Bearer ", "").trim();
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

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return sendJson(res, 500, {
        error: "Razorpay environment variables are missing."
      });
    }

    const token = getToken(req);

    if (!token) {
      return sendJson(res, 401, {
        error: "Login token missing."
      });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const userId = decoded.uid;

    const { bookingId } = getBody(req);

    if (!bookingId) {
      return sendJson(res, 400, {
        error: "bookingId is required."
      });
    }

    const db = admin.firestore();

    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return sendJson(res, 404, {
        error: "Booking not found."
      });
    }

    const booking = bookingSnap.data();

    if (booking.customerId !== userId) {
      return sendJson(res, 403, {
        error: "Only booking customer can create payment order."
      });
    }

    if (booking.paymentStatus === "paid") {
      return sendJson(res, 400, {
        error: "This booking is already paid."
      });
    }

    if (!booking.acceptedBid || !booking.acceptedBid.workerUserId) {
      return sendJson(res, 400, {
        error: "Please accept a worker bid before payment."
      });
    }

    const finalAmount = Number(
      booking.acceptedBid.bidAmount || booking.budget || 0
    );

    if (!finalAmount || finalAmount <= 0) {
      return sendJson(res, 400, {
        error: "Invalid payment amount."
      });
    }

    const currency = "INR";
    const amountPaise = Math.round(finalAmount * 100);

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency,
      receipt: `booking_${bookingId}_${Date.now()}`.slice(0, 40),
      notes: {
        bookingId,
        customerId: booking.customerId,
        workerUserId: booking.acceptedBid.workerUserId,
        platform: "RapideService"
      }
    });

    await db.collection("payments").doc(order.id).set({
      id: order.id,
      razorpayOrderId: order.id,
      bookingId,
      customerId: booking.customerId,
      workerUserId: booking.acceptedBid.workerUserId,
      workerName: booking.acceptedBid.workerName || "",
      amount: finalAmount,
      amountPaise,
      currency,
      status: "created",
      paymentStatus: "created",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await bookingRef.set({
      razorpayOrderId: order.id,
      paymentStatus: "order_created",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return sendJson(res, 200, {
      success: true,
      keyId,
      orderId: order.id,
      amount: amountPaise,
      displayAmount: finalAmount,
      currency
    });
  } catch (error) {
    console.error("create-order error:", error);

    return sendJson(res, 500, {
      error: error.message || "Payment order creation failed."
    });
  }
};