importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDOVm_YMeA2AdVRy7oW6uUHwGoGmNZ6QAc",
  projectId: "lullabuddy-3be5a",
  messagingSenderId: "215654225519",
  appId: "1:215654225519:web:1f03192707043dec3cdf9a"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log("[firebase-messaging-sw.js] Received background message", payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icon.png"
  });
});
