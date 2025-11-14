/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import { onValueCreated } from "firebase-functions/v2/database";
import { initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";



initializeApp({
  databaseURL:
    "https://pentiaopgavechatapp-default-rtdb.europe-west1.firebasedatabase.app",
});


setGlobalOptions({ maxInstances: 10 });


export const notifyRoomOnMessage = onValueCreated(
  {
    ref: "/messages/{roomId}/{messageId}",
    instance: "pentiaopgavechatapp-default-rtdb",
    region: "europe-west1",
  },
  async (event) => {
    const message = event.data?.val();
    if (!message) return;

    const { roomId, messageId } = event.params;

    const notificationTitle = message.senderName || "New Message";
    const notificationBody = message.text?.trim()
      ? `${message.senderName}: ${message.text}`
      : message.imageUrl
      ? `${message.senderName} sent a photo 📷`
      : `${message.senderName} sent a message`;

    try {
      await getMessaging().send({
        topic: roomId,
        notification: { title: notificationTitle, body: notificationBody },
        data: {
          roomId,
          messageId,
          senderId: message.senderId || "",
          senderName: message.senderName || "",
          imageUrl: message.imageUrl || "",
        },
      });

      console.log(`Notification sent for message ${messageId} in room ${roomId}`);
    } catch (error) {
      console.error("Error sending FCM notification:", error);
    }
  }
);


// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
