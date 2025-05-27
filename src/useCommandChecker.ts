// src/useCommandChecker.ts
import './notification.d.ts';
import { useEffect, useState } from "react";

export interface CommandEnvelope {
  id?: number;
  command: any;
  message?: string;
}

export function useCommandChecker(): { status: string | null; debug: string } {
  const [status, setStatus] = useState<string | null>(null);
  const [debug, setDebug] = useState<string>("Waiting for first check…");

  useEffect(() => {
    let isMounted = true;
    let lastId: number | null = null;

    const poll = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted) setDebug("⚠️ No JWT token in localStorage");
        return;
      }

      try {
        if (isMounted) setDebug("🔄 Polling /commands…");
        const res = await fetch(
          "https://theta.proto.aalto.fi/api/devices/1/commands",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.status === 204) {
          if (isMounted) setDebug("ℹ️ No new command (204 – empty)");
          return;
        }

        if (!res.ok) {
          if (isMounted) setDebug(`🚫 Server responded ${res.status}`);
          return;
        }

        const data = (await res.json()) as CommandEnvelope;
        console.log("API payload", data);

        let cmdName: string | undefined;
        let cmdId: number | undefined;

        if (typeof data.command === "string") {
          cmdName = data.command;
          cmdId = data.id;
        } else if (data.command && typeof data.command === "object") {
          cmdName = data.command.command;
          cmdId = data.command.id;
        }

        if (!cmdName) {
          if (isMounted) setDebug("ℹ️ No parsable command in payload");
          return;
        }

        if (cmdId !== undefined && cmdId === lastId) return;
        if (cmdId !== undefined) lastId = cmdId;

        if (isMounted) setDebug(`📦 Received command: ${cmdName}`);

        if (cmdName === "notification") {
          // Only show a silent notification
          if (typeof Notification !== "undefined") {
            const showNotification = () => {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then((reg) => {
                  reg.showNotification("Your kid is awake", {
                    body: "Don't worry, we are putting them back to sleep.",
                    icon: "/icon.png",
                    silent: true, // Silent notification
                    vibrate: [] // Ensure no vibration
                  });
                });
              }
            };

            if (Notification.permission === "granted") {
              showNotification();
            } else if (Notification.permission !== "denied") {
              Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                  showNotification();
                }
              });
            }
          }

          if (isMounted) {
            setStatus(`✅ Silent notification @ ${new Date().toLocaleTimeString()}`);
          }
        } else if (cmdName === "vibrate") {
  // Show a persistent SW notification + looping vibration
  if ('serviceWorker' in navigator && Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification("🚨 Alarm!", {
        body: "Your kid is awake — please check on them.",
        icon: "/icon.png",
        requireInteraction: true,
        vibrate: [500, 200, 500],
      });
    });
  }

  if ('vibrate' in navigator) {
    const pattern = [500, 200, 500, 200, 500];
    navigator.vibrate(pattern);
    const alarmInterval = window.setInterval(() => navigator.vibrate(pattern), 3200);
    // clean up after  user taps anywhere in the app
    const stopAlarm = () => {
      clearInterval(alarmInterval);
      navigator.vibrate(0);
      window.removeEventListener('click', stopAlarm);
    };
    window.addEventListener('click', stopAlarm);
  }

  setStatus(`🚨 Alarm activated @ ${new Date().toLocaleTimeString()}`);
}
      } catch (err) {
        if (isMounted) setDebug(`❌ Fetch error: ${(err as Error).message}`);
        console.error(err);
      }
    };

    poll();
    const id = setInterval(poll, 5000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, []);

  return { status, debug };
}