// backend/notify.ts
import { messaging } from "./firebase";

export async function sendPushToDevice(token: string, condition: boolean) {
  if (!condition) return;

  await messaging.send({
    notification: {
      title: "Sleep Alert",
      body: "The baby is awake!",
    },
    token,
  });
}
