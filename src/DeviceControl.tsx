// src/DeviceControl.tsx
import { useState } from "react";
import { sendDeviceCommand } from "./api";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

export default function DeviceControl() {
  const [deviceId, setDeviceId] = useState<number | "">("");
  const [status, setStatus] = useState<string>("");

  const send = async (type: "warning" | "vibrate") => {
    if (!deviceId) {
      setStatus("Please enter a device ID");
      return;
    }
    setStatus("Sending...");
    try {
      await sendDeviceCommand(Number(deviceId), type);
      setStatus(`✅ ${type} command sent`);
    } catch (err: any) {
      setStatus(`❌ ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="app-container space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="deviceId">Device ID</Label>
        <Input
          id="deviceId"
          type="number"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Enter device ID"
        />
      </div>

      <div className="flex gap-4">
        <Button onClick={() => send("warning")} className="btn lullaby-btn">
          Send Warning
        </Button>
        <Button onClick={() => send("vibrate")} className="btn lullaby-btn">
          Send Vibrate
        </Button>
      </div>

      {status && <p className="mt-2 text-center">{status}</p>}
    </div>
  );
}
