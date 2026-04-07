// hooks/useSocket.js
// Singleton socket.io connection — one connection shared across the whole app.
// Matches the JWT auth pattern in your socket/index.js (_id, role, supervisor).

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL ="http://localhost:9001";

// Module-level singleton — never opens two connections
let globalSocket = null;

/**
 * getOrCreateSocket()
 * Creates the socket once at module level using the stored auth token.
 * Returns null if no token is found.
 */
function getOrCreateSocket() {
  const token =
    localStorage.getItem("token")      ||
    localStorage.getItem("authToken")  ||
    localStorage.getItem("accessToken");

  if (!token) {
    console.warn("[Socket] No auth token found — socket not created.");
    return null;
  }

  // Reuse existing singleton
  if (globalSocket) return globalSocket;

  globalSocket = io(SOCKET_URL, {
    auth:                 { token },
    transports:           ["websocket", "polling"],
    reconnection:         true,
    reconnectionAttempts: 10,
    reconnectionDelay:    2000,
    reconnectionDelayMax: 10_000,
    timeout:              10_000,
  });

  console.log("[Socket] 🔌 New socket created →", SOCKET_URL);
  return globalSocket;
}

/**
 * useSocket()
 * Returns { socket, connected }
 * Safe to call in any component — always returns the same socket instance.
 *
 * FIX: Previously, if globalSocket already existed the hook returned early
 * without attaching connect/disconnect listeners, so `connected` would never
 * update in components that mounted after the first one.
 * Now we ALWAYS attach listeners (and clean them up on unmount).
 */
export function useSocket() {
  // Initialise from the current live state so the first render is correct
  const [connected, setConnected] = useState(
    () => globalSocket?.connected ?? false
  );

  useEffect(() => {
    // Always get-or-create — never skip listener attachment
    const socket = getOrCreateSocket();
    if (!socket) return;

    // Sync immediately with current connection state
    setConnected(socket.connected);

    // Attach per-component listeners
    const onConnect    = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onError      = (err) => {
      console.warn("[Socket] ✖ Connection error:", err.message);
      setConnected(false);
    };
    const onReconnect  = () => {
      console.log("[Socket] ↩ Reconnected");
      setConnected(true);
    };

    socket.on("connect",       onConnect);
    socket.on("disconnect",    onDisconnect);
    socket.on("connect_error", onError);
    socket.on("reconnect",     onReconnect);

    // Clean up THIS component's listeners on unmount.
    // Does NOT disconnect the socket — it stays alive globally.
    return () => {
      socket.off("connect",       onConnect);
      socket.off("disconnect",    onDisconnect);
      socket.off("connect_error", onError);
      socket.off("reconnect",     onReconnect);
    };
  }, []);

  // Return globalSocket directly — never null after getOrCreateSocket() ran
  return { socket: globalSocket, connected };
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