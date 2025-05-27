// src/bluetooth.tsx
import { useState } from "react";

const SERVICE_UUID        = "12345678-1234-5678-1234-56789abcdef0";
const CHARACTERISTIC_UUID = "abcdef01-1234-5678-1234-56789abcdef0";

export default function BluetoothProvisioner() {
  const [ssid, setSsid]       = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus]    = useState("Waiting to connect...");

  const handleProvision = async () => {
    setStatus("Requesting device...");
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
      });

      setStatus("Connecting to GATT server...");
      const server = await device.gatt?.connect();

      setStatus("Discovering service...");
      const service = await server!.getPrimaryService(SERVICE_UUID);

      setStatus("Getting characteristic...");
      const char = await service.getCharacteristic(CHARACTERISTIC_UUID);

      const wifiString = `${ssid},${password}`;
      const encoder    = new TextEncoder();
      const value      = encoder.encode(wifiString);

      setStatus("Sending Wi-Fi credentials...");
      await char.writeValueWithResponse(value);

      setStatus("✅ Credentials sent! Device should reboot.");
      device.gatt?.disconnect();
    } catch (err: any) {
      console.error(err);
      setStatus(`Failed: ${err.message}`);
    }
  };

  return (
    <div className="provision-wrap page-center">
      <h2 className="sleep-label">Provision your device</h2>

      <input
        type="text"
        placeholder="Wi-Fi name"
        value={ssid}
        onChange={(e) => setSsid(e.target.value)}
        className="input-box"
      />

      <input
        type="password"
        placeholder="Wi-Fi Password (if any)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="input-box"
      />

      <button
        onClick={handleProvision}
        className="provision-btn"
      >
        Send Credentials
      </button>

      <p className="text-sm mt-2 text-[#E7E8FC]">{status}</p>
    </div>
  );
}
