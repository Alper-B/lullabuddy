// src/TestModePage.tsx
import { useState } from "react";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";

export default function TestModePage() {
  const [ip, setIp] = useState("");
  const [status, setStatus] = useState("");

  const sendCommand = async (on: boolean) => {
    if (!ip) return setStatus("Please enter device IP");
    const url = `http://${ip}/test/${on ? "on" : "off"}`;
    try {
      setStatus("Sending...");
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed: " + res.status);
      setStatus(`Test mode ${on ? "ON" : "OFF"} sent`);
    } catch (e: any) {
      setStatus(e.message);
    }
  };

  return (
    <div className="page-wrap page-center">
      <h2 className="text-xl mb-4 font-semibold">Test Mode</h2>

      <Input
        className="input-box"
        placeholder="Device IP (e.g. 192.168.1.42)"
        value={ip}
        onChange={e => setIp(e.target.value)}
      />

      <div className="flex gap-4 mt-4">
        <Button onClick={() => sendCommand(true)}>Enable Test Mode</Button>
        <Button onClick={() => sendCommand(false)} variant="secondary">Disable</Button>
      </div>

      <p className="mt-4 text-sm text-purple-300">{status}</p>
    </div>
  );
}
