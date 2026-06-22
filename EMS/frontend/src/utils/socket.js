import { io } from "socket.io-client";

// Strip /api suffix to get the bare server origin
const SOCKET_URL = (process.env.REACT_APP_API_URL || "http://localhost:8000/api")
  .replace(/\/api\/?$/, "");

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem("token");
    socket = io(SOCKET_URL, {
      auth:                { token },
      autoConnect:         false,
      reconnection:        true,
      reconnectionDelay:   1000,
      reconnectionAttempts: 10,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null; // reset so next login gets a fresh instance with new token
  }
};
