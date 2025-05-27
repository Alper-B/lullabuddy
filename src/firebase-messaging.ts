import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { firebaseConfig } from "./firebase-config.ts";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Call this in your app
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return null;
    }

    // First register the service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    console.log('Service Worker registered with scope:', registration.scope);

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log("Notification permission was not granted");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: "BPBll7QCVkKeWIrgdwsCeNeSsltlsfuIatXwWXHAb2-mqfgtXiVexB_AVb3EcZZPISv6NoDL4GDb_qz_QFUBF2g",
      serviceWorkerRegistration: registration
    });

    console.log("🔔 FCM Token:", token);
    return token;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
}

export function listenToForegroundMessages() {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    console.warn("Notifications not supported or permission not granted");
    return;
  }

  onMessage(messaging, (payload) => {
    if (payload.data?.type === "vibrate") {
    // 1) Show a persistent notification
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification("🚨 Alarm!", {
          body: payload.notification?.body || "Your kid is awake",
          icon: "/icon.png",
          requireInteraction: true,     // <-- stays until user taps/dismisses
          vibrate: [500, 200, 500],    // one burst to kick things off
        });
      });
    }

    // 2) Kick off a looping vibration pattern
    if ('vibrate' in navigator) {
      const pattern = [500, 200, 500, 200, 500, 200];
      // Immediately vibrate once…
      navigator.vibrate(pattern);
      // …then keep it going every 3.6s
      const alarmInterval = window.setInterval(() => {
        navigator.vibrate(pattern);
      }, 3600);

      // And stop it when the user finally interacts with the page/notification:
      const stopAlarm = () => {
        window.clearInterval(alarmInterval);
        navigator.vibrate(0); // cancel any in-flight buzz
        window.removeEventListener('click', stopAlarm);
      };
      window.addEventListener('click', stopAlarm);
    }
    } 
    else if (payload.notification) {
      // Handle regular notifications
      const { title, body } = payload.notification;
      new Notification(title || "New Message", {
        body: body || "",
      });
    }
  });
}

// Only attempt to show notifications if they're supported and permission is granted
if ("Notification" in window && Notification.permission === "granted") {
  new Notification("Your message here");
} else {
  console.warn("Notifications not supported on this browser or permission not granted.");
}