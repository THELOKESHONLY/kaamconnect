const admin = require("firebase-admin");
const crypto = require("crypto");

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
  if (typeof req.body === "object" && req.body !== null) return req.body;

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

function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expectedSignature === signature;
}

async function createNotification(db, toUserId, title, message) {
  if (!toUserId) return;

  await db.collection("notifications").add({
    toUserId,
    title,
    message,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
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

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return sendJson(res, 500, {
        error: "Razorpay secret environment variable is missing."
      });
    }

    const token = getToken(req);

    if (!token) {
      return sendJson(res, 401, { error: "Login token missing." });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const userId = decoded.uid;

    const body = getBody(req);

    const bookingId = body.bookingId;
    const razorpay_order_id = body.razorpay_order_id;
    const razorpay_payment_id = body.razorpay_payment_id;
    const razorpay_signature = body.razorpay_signature;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendJson(res, 400, {
        error: "Missing payment verification fields."
      });
    }

    const validSignature = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret
    );

    if (!validSignature) {
      return sendJson(res, 400, {
        error: "Invalid Razorpay payment signature."
      });
    }

    const db = admin.firestore();

    const bookingRef = db.collection("bookings").doc(bookingId);
    const paymentRef = db.collection("payments").doc(razorpay_order_id);
    const publicJobRef = db.collection("publicJobs").doc(bookingId);
    const earningRef = db.collection("earnings").doc(bookingId);

    let workerUserId = "";
    let workerAmount = 0;
    let grossAmount = 0;
    let platformCommission = 0;

    await db.runTransaction(async (transaction) => {
      const bookingSnap = await transaction.get(bookingRef);

      if (!bookingSnap.exists) {
        throw new Error("Booking not found.");
      }

      const booking = bookingSnap.data();

      if (booking.customerId !== userId) {
        throw new Error("Only booking customer can verify payment.");
      }

      if (!booking.acceptedBid || !booking.acceptedBid.workerUserId) {
        throw new Error("No accepted worker found for this booking.");
      }

      workerUserId = booking.acceptedBid.workerUserId;

      grossAmount = Number(
        booking.acceptedBid.bidAmount || booking.budget || 0
      );

      if (!grossAmount || grossAmount <= 0) {
        throw new Error("Invalid booking amount.");
      }

      platformCommission = Math.round(grossAmount * 0.10);
      workerAmount = grossAmount - platformCommission;

      transaction.set(paymentRef, {
        id: razorpay_order_id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        bookingId,
        customerId: booking.customerId,
        workerUserId,
        workerName: booking.acceptedBid.workerName || "",
        amount: grossAmount,
        amountPaise: Math.round(grossAmount * 100),
        currency: "INR",
        status: "paid",
        paymentStatus: "paid",
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      transaction.set(bookingRef, {
        paymentStatus: "paid",
        bookingStatus: booking.bookingStatus === "completed" ? "completed" : "paid",
        jobProgress: "payment_verified",
        workerCanSeeContact: true,
        chatOpen: true,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      transaction.set(publicJobRef, {
        paymentStatus: "paid",
        bookingStatus: "paid",
        biddingOpen: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      const earningSnap = await transaction.get(earningRef);

      if (!earningSnap.exists) {
        transaction.set(earningRef, {
          bookingId,
          customerId: booking.customerId,
          workerUserId,
          workerName: booking.acceptedBid.workerName || "",
          grossAmount,
          platformCommission,
          workerAmount,
          payoutStatus: "pending",
          currency: "INR",
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        transaction.set(db.collection("users").doc(workerUserId), {
          totalEarned: admin.firestore.FieldValue.increment(workerAmount),
          pendingPayout: admin.firestore.FieldValue.increment(workerAmount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    });

    await createNotification(
      db,
      userId,
      "Payment successful",
      "Your payment is verified. Worker contact and chat are unlocked."
    );

    await createNotification(
      db,
      workerUserId,
      "New earning added",
      `${workerAmount} INR has been added to your pending payout.`
    );

    return sendJson(res, 200, {
      success: true,
      message: "Payment verified successfully.",
      bookingId,
      workerUserId,
      grossAmount,
      platformCommission,
      workerAmount
    });
  } catch (error) {
    console.error("verify-payment error:", error);

    return sendJson(res, 500, {
      error: error.message || "Payment verification failed."
    });
  }
};
