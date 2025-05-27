import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from './components/ui/button';

interface Props {
  onContinue: () => void;
}

type RawCommand = {
  id: number;
  command: string;
};

export default function TestIntroPage({ onContinue }: Props) {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const deviceIdStr = localStorage.getItem('deviceId');
  const deviceId = deviceIdStr ? parseInt(deviceIdStr, 10) : NaN;

  useEffect(() => {
    if (!deviceIdStr || isNaN(deviceId)) {
      console.warn('Invalid deviceId:', deviceIdStr);
      return;
    }

    let lastId: number | null = null;
    let clearTimer: NodeJS.Timeout;

    const poll = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await axios.get<RawCommand>(
          `/api/devices/${encodeURIComponent(deviceId)}/commands`,
          {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: (s) => s === 200 || s === 204,
          }
        );

        if (res.status === 204) return;

        const { id, command } = res.data;
        if (id === lastId) return;
        lastId = id;

        switch (command) {
          case 'motion_detected':
            setAlertMessage('🚨 Motion detected');
            break;
          case 'sound_detected':
            setAlertMessage('🔊 Sound detected');
            break;
          default:
            return;
        }

        // clear the alert after 1 second
        clearTimer = setTimeout(() => {
          setAlertMessage(null);
        }, 1000);
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    poll();
    const iv = setInterval(poll, 1000);
    return () => {
      clearInterval(iv);
      clearTimeout(clearTimer);
    };
  }, [deviceIdStr, deviceId]);

  return (
    <div className="page-wrap page-center">
      <button
        onClick={() => history.back()}
        className="arrow-btn self-start text-2xl ml-3"
      >
        ←
      </button>
      <h2 className="text-2xl font-bold mb-4">Testing mode</h2>

      <p className="mb-4">Stand near your kid's bed and wave at the device</p>

      <img
        src="/testmode-graphic.png"
        alt="Wave at the device"
        className="mb-6"
        style={{ maxWidth: '80%' }}
      />

      {alertMessage && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          {alertMessage}
        </div>
      )}

      <p className="mb-4">If nothing pops up after a while, please check your setup</p>

      <Button onClick={onContinue} className="btn end-btn">
        Continue
      </Button>
    </div>
  );
}
