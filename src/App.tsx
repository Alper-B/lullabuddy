import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";

import {
  requestNotificationPermission,
  listenToForegroundMessages,
} from "./firebase-messaging";

import "./vite-env.d.ts";
import { loginAndInitialize, register, joinDevice } from "./api";
import { Button } from "./components/ui/button";
import { Label } from "./components/ui/label";
import BluetoothProvisioning from "./bluetooth";
import DeviceControl from "./CommandListener";
import SleepPatternGraph from "./SleepPatternGraph";
import SoundsPage from "./Sounds";
import CommandListener from "./CommandListener";
import LandingPage from "./LandingPage";
import TestModePage from "./TestmodePage";
import TestIntroPage from "./TestIntroPage";
import { useCommandChecker } from "./useCommandChecker";

import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Switch } from "@headlessui/react";

import homeIcon from "./assets/home.png";
import soundsIcon from "./assets/sounds.png";
import insightsIcon from "./assets/insights.png";
import settingsIcon from "./assets/settings.png";

import "./App.css";

import { registerSW } from 'virtual:pwa-register';


import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

export function useNativeNotifications() {
  useEffect(() => {
    // 1) Request permission for push notifications
    PushNotifications.requestPermissions()
      .then(result => {
        if (result.receive === 'granted') {
          // 2) Register with FCM
          return PushNotifications.register();
        } else {
          console.warn('Push permission not granted:', result);
        }
      })
      .catch(err => console.error('Push permission error', err));

    // 3) Listen for the FCM token
    PushNotifications.addListener('registration', (token) => {
      console.log('🔑 FCM token:', token.value);
      // TODO: send token.value to your server so you can push to this device
    });

    // 4) Handle push received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📥 Push received:', notification);
      // Mirror it as a local notification (so it shows in the shade with vibration)
      LocalNotifications.schedule({
  notifications: [{
    id: Date.now(),
    title: notification.title ?? 'Alert',
    body: notification.body ?? '',
    channelId: 'default',
    sound: 'default',
    // vibrate: true,     ← remove this line
    smallIcon: 'ic_notification',
  }]
});
    });

    // 5) (Optional) Handle notification taps
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('🖱️ Notification tapped', action);
      // e.g. navigate to a particular screen
    });
  }, []);
}

// Register the service worker
registerSW({
  onNeedRefresh() {
    console.log("New content available – please refresh.");
  },
  onOfflineReady() {
    console.log("App is ready to work offline.");
  },
});

export function Home() {
  const [soundOn, setSoundOn] = useState(false);

  return (
    <div className="page-wrap">
      <div className="page-center">
        <div className="avatar" />
        <h2 className="sleep-label">your kid is sleeping</h2>
        <h3 className="timer">1:00:00</h3>

        <div className="toggle-row">
          <span className="toggle-label">Sound</span>
          <div className="switch-on">
            <Switch checked={soundOn} onChange={setSoundOn} />
          </div>
        </div>

        <button className="btn end-btn">End</button>
      </div>
    </div>
  );
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      await loginAndInitialize(username, pw);
      onDone();
    } catch (e: any) {
      setErr(e.response?.data?.message || e.message || "Login failed");
    }
  };

  return (
    <div className="auth-wrap page-center">
      <button onClick={() => history.back()} className="arrow-btn">←</button>
      <div className="auth-avatar" />
      <h2 className="auth-title">Log In</h2>

      <Card className="auth-card">
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Input
              placeholder="Username"
              className="auth-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
            <Input
              placeholder="Password"
              type="password"
              className="auth-input"
              value={pw}
              onChange={e => setPw(e.target.value)}
              required
            />

            <Button className="auth-btn-primary">Log In</Button>
            {err && <p className="text-red-500 text-xs mt-2">{err}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfo("");
    try {
      await register(email, pw);
      onDone();
    } catch (e: any) {
      setInfo(e.response?.data?.message || e.message || "Failed");
    }
  };

  return (
    <div className="auth-wrap page-center">
      <button onClick={() => history.back()} className="arrow-btn">←</button>
      <div className="auth-avatar" />
      <h2 className="auth-title">Sign Up</h2>

      <Card className="auth-card">
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Input
              placeholder="Email"
              className="auth-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              placeholder="Password"
              type="password"
              className="auth-input"
              value={pw}
              onChange={e => setPw(e.target.value)}
              required
            />

            <Button className="auth-btn-primary">Create account</Button>
            {info && <p className="text-xs mt-2">{info}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function PairDevicePage({ onDone }: { onDone: () => void }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [info, setInfo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfo("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not logged in");
      await joinDevice(id, pw);
      setInfo("✅ Device paired!");
      onDone();
    } catch (err: any) {
      setInfo(err.response?.data?.message || err.message || "Failed to pair device");
    }
  };

  return (
    <div className="page-wrap">
      <div className="page-center">
        <h2 className="mb-4 text-2xl font-semibold">Pair Your Device</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs">
          <Label htmlFor="pair-id">Device ID</Label>
          <Input
            id="pair-id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />
          <Label htmlFor="pair-pw">Password</Label>
          <Input
            id="pair-pw"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
          />
          <Button className="btn end-btn">Pair Device</Button>
        </form>
        {info && <p className="text-sm mt-2">{info}</p>}
        <Button variant="outline" className="btn end-btn mt-4" onClick={() => onDone()}>
          Skip Pairing
        </Button>
      </div>
    </div>
  );
}

export default function App() {
  const [stage, setStage] = useState<"anon" | "pair" | "intro" | "auth">("anon");
  const { status, debug } = useCommandChecker();

  // --- REQUEST NECESSARY PERMISSIONS AT STARTUP ---
  useEffect(() => {
    // 1) Notifications
    requestNotificationPermission().catch(console.error);

    // 2) Bluetooth (for Web Bluetooth API)
    if ("bluetooth" in navigator) {
      navigator.bluetooth
        .requestDevice({ acceptAllDevices: true })
        .catch(err => console.warn("Bluetooth permission denied", err));
    }
  }, []);

  // After auth stage begins, start FCM
  useEffect(() => {
    if (stage === "auth") {
      listenToForegroundMessages();
    }
  }, [stage]);

  return (
    <Router>
      {stage === "pair" ? (
        <Routes>
          <Route path="*" element={<PairDevicePage onDone={() => setStage("intro")} />} />
        </Routes>
      ) : stage === "intro" ? (
        <Routes>
          <Route path="*" element={<TestIntroPage onContinue={() => setStage("auth")} />} />
        </Routes>
      ) : stage === "auth" ? (
        <>
          <CommandListener />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sounds" element={<SoundsPage />} />
            <Route path="/insights" element={<SleepPatternGraph />} />
            <Route path="/settings" element={<BluetoothProvisioning />} />
            <Route path="/control" element={<DeviceControl />} />
            <Route path="/test-mode" element={<TestModePage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>

          <nav className="tab-bar">
            <NavLink to="/" end className="tab-btn">
              <img src={homeIcon} className="icon-img" alt="Home" />
              <span className="label">Home</span>
            </NavLink>
            <NavLink to="/sounds" className="tab-btn">
              <img src={soundsIcon} className="icon-img" alt="Sounds" />
              <span className="label">Sounds</span>
            </NavLink>
            <NavLink to="/insights" className="tab-btn">
              <img src={insightsIcon} className="icon-img" alt="Insights" />
              <span className="label">Insights</span>
            </NavLink>
            <NavLink to="/settings" className="tab-btn">
              <img src={settingsIcon} className="icon-img" alt="Settings" />
              <span className="label">Settings</span>
            </NavLink>
          </nav>

          <div className="debug-box">Debug: {status} {debug && <strong>{debug}</strong>}</div>
        </>
      ) : (
        <Routes>
          <Route path="/login" element={<LoginForm onDone={() => setStage("pair")} />} />
          <Route path="/register" element={<RegisterForm onDone={() => setStage("pair")} />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      )}
    </Router>
  );
}
