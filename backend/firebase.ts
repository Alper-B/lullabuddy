// backend/firebase.ts
import admin, { ServiceAccount } from "firebase-admin";
import serviceAccountJson from "./service-account.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountJson as ServiceAccount),
});

export const messaging = admin.messaging();
