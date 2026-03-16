// hooks/useSocket.js
// Singleton socket.io connection — one connection shared across the whole app.
// Matches the JWT auth pattern in your socket/index.js (_id, role, supervisor).

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_URL || " http://localhost:9001";

// Module-level singleton — never opens two connections
let globalSocket = null;

/**
 * useSocket()
 * Returns { socket, connected }
 * Safe to call in any component — always returns the same socket instance.
 */
export function useSocket() {
  const [connected, setConnected] = useState(
    () => globalSocket?.connected ?? false
  );
  const socketRef = useRef(null);

  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken");

    if (!token) {
      console.warn("[Socket] No auth token found — socket not connected.");
      return;
    }

    // Reuse existing live socket
    if (globalSocket?.connected) {
      socketRef.current = globalSocket;
      setConnected(true);
      return;
    }

    // Create new connection
    globalSocket = io(SOCKET_URL, {
      // Matches socket/index.js: socket.handshake.auth.token
      auth:       { token },
      transports: ["websocket", "polling"],
      reconnection:         true,
      reconnectionAttempts: 10,
      reconnectionDelay:    2000,
      reconnectionDelayMax: 10_000,
    });

    socketRef.current = globalSocket;

    globalSocket.on("connect", () => {
      console.log("[Socket] ✅ Connected:", globalSocket.id);
      setConnected(true);
    });

    globalSocket.on("disconnect", (reason) => {
      console.log("[Socket] ⚠ Disconnected:", reason);
      setConnected(false);
    });

    globalSocket.on("connect_error", (err) => {
      console.warn("[Socket] ✖ Connection error:", err.message);
      setConnected(false);
    });

    globalSocket.on("reconnect", () => {
      console.log("[Socket] ↩ Reconnected");
      setConnected(true);
    });

    // Don't destroy on component unmount — keep singleton alive across pages
    return () => {};
  }, []);

  return { socket: socketRef.current ?? globalSocket, connected };
}

/**
 * Call this on logout to fully close the socket connection.
 */
export function disconnectSocket() {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
    console.log("[Socket] ■ Disconnected on logout");
  }
}