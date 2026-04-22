// This a service worker file for receiving push notifitications.
// See `Access registration token section` @ https://firebase.google.com/docs/cloud-messaging/js/client#retrieve-the-current-registration-token

self.addEventListener("notificationclick", function (event) {
  console.log("notification click", event, event.notification);
  event.waitUntil(
    (async function () {
      const allClients = await clients.matchAll({
        includeUncontrolled: true
      });
      const [firstClient] = allClients;
      // 没有数据
      const customData = event.notification?.data?.FCM_MSG?.data;
      if (!customData) {
        firstClient.focus();
        return;
      }
      const { vocechat_from_uid, vocechat_to_uid, vocechat_to_gid } = customData;
      let chatClient;
      let redirectPath = vocechat_to_uid
        ? `/chat/dm/${vocechat_from_uid}`
        : vocechat_to_gid
        ? `/chat/channel/${vocechat_to_gid}`
        : "";
      if (!redirectPath) {
        firstClient.focus();
        return;
      }
      if (allClients.length == 0) {
        // hash路由
        chatClient = await clients.openWindow(`/#${redirectPath}`);
      } else {
        firstClient.postMessage({ newPath: redirectPath });
        firstClient.focus();
      }
    })()
  );
});
// Scripts for firebase and firebase messaging
// importScripts(
//   "https://www.gstatic.com/firebasejs/9.8.1/firebase-app-compat.js"
// );
// importScripts(
//   "https://www.gstatic.com/firebasejs/9.8.1/firebase-messaging-compat.js"
// );
importScripts("https://cdnjs.cloudflare.com/ajax/libs/firebase/9.8.1/firebase-app-compat.min.js");
importScripts(
  "https://cdnjs.cloudflare.com/ajax/libs/firebase/9.8.1/firebase-messaging-compat.min.js"
);

// Initialize the Firebase app in the service worker by passing the generated config
const firebaseConfig = {
  apiKey: "AIzaSyAa2478MzY69Kx7prkAkmLGi8vUUx7IKZ0",
  authDomain: "adam-chat-7dc02.firebaseapp.com",
  projectId: "adam-chat-7dc02",
  storageBucket: "adam-chat-7dc02.firebasestorage.app",
  messagingSenderId: "538560352843",
  appId: "1:538560352843:web:03fd2c1b5a55d8a92273ce"
};

firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();
// Handle incoming messages while the app is not in focus (i.e in the background, hidden behind other tabs, or completely closed).
// data:{from_server_id}
// messaging.onBackgroundMessage((payload) => {
//   console.log("Received background message ", payload);

//   const notificationTitle = payload.notification.title;
//   const notificationOptions = {
//     data: payload.data,
//     body: payload.notification.body,
//   };

//   self.registration.showNotification(notificationTitle, notificationOptions);
// });

// self.addEventListener("notificationclose", function (event) {});
