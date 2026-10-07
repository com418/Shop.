const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();

exports.sendNewOrderNotification = onDocumentCreated(
  "orders/{orderId}",
  async (event) => {
    const order = event.data?.data();

    if (!order) {
      console.log("No order data found.");
      return;
    }

    const orderId = event.params.orderId;

    const customerName =
      order.customer?.name || "A customer";

    const total = Number(order.total || 0);

    const tokensSnapshot = await db
      .collection("adminNotificationTokens")
      .get();

    if (tokensSnapshot.empty) {
      console.log("No admin notification tokens found.");
      return;
    }

    const tokens = [];

    tokensSnapshot.forEach((doc) => {
      const data = doc.data();

      if (data.token) {
        tokens.push(data.token);
      }
    });

    if (tokens.length === 0) {
      console.log("No valid notification tokens found.");
      return;
    }

    const message = {
      notification: {
        title: "🛍️ New LuxeStore Order!",
        body:
          `${customerName} placed a new order • ₦${total.toLocaleString()}`
      },

      data: {
        orderId: orderId,
        type: "new_order",
        url: "/admin.html"
      },

      webpush: {
        notification: {
          title: "🛍️ New LuxeStore Order!",
          body:
            `${customerName} placed a new order • ₦${total.toLocaleString()}`,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: "luxestore-new-order",
          renotify: true
        },

        fcmOptions: {
          link: "/admin.html"
        }
      },

      tokens: tokens
    };

    const response =
      await getMessaging().sendEachForMulticast(message);

    console.log(
      `Notifications sent: ${response.successCount}`
    );

    console.log(
      `Notifications failed: ${response.failureCount}`
    );

    const cleanupPromises = [];

    response.responses.forEach((result, index) => {
      if (!result.success) {
        const errorCode = result.error?.code || "";

        if (
          errorCode.includes("registration-token-not-registered") ||
          errorCode.includes("invalid-registration-token")
        ) {
          const token = tokens[index];

          const matchingDocs = tokensSnapshot.docs.filter(
            (doc) => doc.data().token === token
          );

          matchingDocs.forEach((doc) => {
            cleanupPromises.push(doc.ref.delete());
          });
        }
      }
    });

    await Promise.all(cleanupPromises);

    console.log("Notification process completed.");
  }
);
