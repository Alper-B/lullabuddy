// src/Sounds.tsx
import { useEffect, useRef, useState } from "react";
import { Button } from "./components/ui/button";
import { getDevices, uploadSound } from "./api";
import axios from "axios";

const BASE_URL = import.meta.env.PROD 
  ? "https://theta.proto.aalto.fi" 
  : "";

interface Sound {
  id: number;
  name: string;
  active: boolean;
}

export default function SoundsPage() {
  const [deviceId, setDeviceId] = useState<number | null>(null);
  const [sounds, setSounds] = useState<Sound[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const devices = await getDevices();
        if (!devices.length) return;
        const firstId = devices[0].id;
        setDeviceId(firstId);
        await refreshSounds(firstId);
      } catch (err) {
        console.error("Failed to load devices/sounds", err);
      }
    })();
  }, []);

  const refreshSounds = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get<Sound[]>(
        `${BASE_URL}/api/devices/${id}/sounds`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSounds(res.data.slice(0, 8));
    } catch (err) {
      console.error("getSounds error", err);
    }
  };

  const handleAdd = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || deviceId === null) return;
    try {
      await uploadSound(deviceId, file);
      await refreshSounds(deviceId);
    } catch (err) {
      console.error("upload error", err);
    }
  };

  const activateSound = async (soundId: number) => {
    if (!deviceId) return;
    try {
      const token = localStorage.getItem("token");
      const url = `${BASE_URL}/api/devices/${deviceId}/sounds/${soundId}/activate`;
      const res = await axios.put(url, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`Sound ${soundId} activated on device ${deviceId}.`);
      console.log("Response:", res.data);
      await refreshSounds(deviceId);
    } catch (err: any) {
      console.error("Failed to activate sound:", err.response?.status);
      console.error("Error:", err.response?.data);
    }
  };

  return (
    <div className="page-wrap page-center">
      <h1 className="page-title">Sounds</h1>

      <div className="sounds-grid">
        {sounds.map((s) => (
          <Button
            key={s.id}
            className={`sound-btn ${s.active ? "active" : ""}`}
            onClick={() => activateSound(s.id)}
          >
            {s.name.split(".")[0]}
          </Button>
        ))}
        {sounds.length === 0 && <p>No sounds yet.</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFile}
      />

      <button className="fab" onClick={handleAdd}>
        <span className="fab-plus">＋</span>
      </button>
    </div>
  );
}