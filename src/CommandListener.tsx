import { useEffect, useRef } from "react";
import { getDeviceCommands } from "./api";

export default function CommandListener() {
  const lastTimestamp = useRef<string>("");

  useEffect(() => {
    const deviceIdStr = localStorage.getItem("deviceId");
    if (!deviceIdStr) {
      console.warn("No deviceId in localStorage—CommandListener inactive.");
      return;
    }
    const deviceId = Number(deviceIdStr);

    let canceled = false;
    const poll = async () => {
      if (canceled) return;
      try {
        const commands = await getDeviceCommands(deviceId);
        // Sort ascending by timestamp
        commands.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        for (const cmd of commands) {
          if (cmd.timestamp <= lastTimestamp.current) continue;
          // New command → handle it
          if (cmd.type === "warning") {
            alert("⚠️ Warning from baby device");
          }
          lastTimestamp.current = cmd.timestamp;
        }
      } catch (err) {
        console.error("CommandListener error:", err);
      }
    };

    // Initial fetch to set baseline
    poll();
    // Poll every 5 seconds
    const id = setInterval(poll, 5000);

    return () => {
      canceled = true;
      clearInterval(id);
    };
  }, []);

  return null; // this component renders nothing
}