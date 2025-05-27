import axios from "axios";

const BASE_URL = import.meta.env.PROD 
  ? "https://theta.proto.aalto.fi" 
  : "";

const API_BASE = `${BASE_URL}/api/users`;
const DEVICE_BASE = `${BASE_URL}/api/devices`;

/**
 * Join a device by ID with the given password.
 */
export async function joinDevice(deviceId: string, password: string) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("User is not logged in");

  const res = await axios.post(
    `${DEVICE_BASE}/${encodeURIComponent(deviceId)}/join`,
    { password },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  // ✅ Save deviceId for CommandListener
  localStorage.setItem("deviceId", deviceId);

  return res.data;
}

/**
 * Login and retrieve JWT token.
 */
export async function login(username: string, password: string): Promise<string> {
  const res = await axios.post(`${API_BASE}/login`, { username, password });
  return res.data.token;
}

/**
 * Login, store token, fetch devices, and set default deviceId in localStorage.
 */
export async function loginAndInitialize(
  username: string,
  password: string
): Promise<string> {
  // 1. Authenticate and get token
  const token = await login(username, password);

  // 2. Store JWT in localStorage for future requests
  localStorage.setItem("token", token);

  // 3. Fetch all devices for the user
  const devices = await getDevices();

  // 4. Pick a default device (first in list) and store its ID
  if (devices.length > 0) {
    const defaultDeviceId = devices[0].id.toString();
    localStorage.setItem("deviceId", defaultDeviceId);
  }

  return token;
}

export async function register(username: string, password: string): Promise<void> {
  await axios.post(`${API_BASE}/register`, { username, password });
}

export interface Device {
  id: number;
  name: string;
}

export async function getDevices(): Promise<Device[]> {
  const token = localStorage.getItem("token");
  const res = await axios.get(DEVICE_BASE, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log(res)
  return res.data;
}

export async function uploadSound(
  deviceId: number,
  file: File
): Promise<void> {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("soundFile", file);

  await axios.post(
    `${DEVICE_BASE}/${deviceId}/sounds`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );
}
export interface Command {
  type:
    | "warning"
    | "vibrate"
    | "silent"
    | "notification"         // if you need this one too
    | "motion_detected"
    | "sound_detected";
  timestamp: string;
}

export async function getDeviceCommands(
  deviceId: number
): Promise<Command[]> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const res = await axios.get<Command[]>(
    `${DEVICE_BASE}/${deviceId}/commands`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
}

export async function sendDeviceCommand(
  deviceId: number,
  type: "warning" | "vibrate" | "silent" | "notification"
): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  await axios.post(
    `${DEVICE_BASE}/${deviceId}/commands`,
    { type },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function getDeviceIP(
  deviceId: number
): Promise<string> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const res = await axios.get(
    `${DEVICE_BASE}/${deviceId}/ip`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.ip; // assumes `{ ip: "192.168.1.4" }` format
}
