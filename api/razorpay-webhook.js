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

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      resolve(data);
    });

    req.on("error", reject);
  });
}

function verifyWebhook(rawBody, signature) {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
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

    const rawBody = await readRawBody(req);
    const signature = req.headers["x-razorpay-signature"];

    if (!signature || !verifyWebhook(rawBody, signature)) {
      res.status(400).json({ error: "Invalid webhook signature." });
      return;
    }

    const event = JSON.parse(rawBody);
    const db = admin.firestore();

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity || {};
      const orderEntity = event.payload?.order?.entity || {};
      const orderId = paymentEntity.order_id || orderEntity.id;
      const bookingId = paymentEntity.notes?.bookingId || orderEntity.notes?.bookingId;

      if (bookingId && orderId) {
        const bookingRef = db.collection("bookings").doc(bookingId);
        const bookingSnap = await bookingRef.get();

        if (bookingSnap.exists) {
          const booking = bookingSnap.data();
          const amount = Number(booking.acceptedBidAmount || 0);
          const commission = Math.ceil(amount * 0.10);
          const workerAmount = amount - commission;

          await bookingRef.set({
            bookingStatus: "assigned",
            paymentStatus: "paid",
            jobProgress: "payment_done_job_assigned",
            workerCanSeeContact: true,
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentEntity.id || "",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          await db.collection("publicJobs").doc(bookingId).set({
            bookingStatus: "assigned",
            paymentStatus: "paid",
            jobProgress: "payment_done_job_assigned",
            workerCanSeeContact: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          await db.collection("payments").doc(orderId).set({
            paymentProviderOrderId: orderId,
            paymentProviderPaymentId: paymentEntity.id || "",
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
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
