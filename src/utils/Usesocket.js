// hooks/useSocket.js
// Singleton socket.io connection — one connection shared across the whole app.
//
// FIXES applied:
// 1. Returns a stable React ref instead of the raw globalSocket variable,
//    so consumers always hold the live socket even after reconnects.
// 2. Re-creates the socket if the token changes (e.g. after login).
// 3. Exposes `socketRef` (object) so Locationtracker.js can call
//    socketRef.current.emit() and always reach the live socket.
// 4. Added "reconnect_attempt" log so you can see retry activity in console.
// 5. setConnected(true/false) is now driven purely by socket events, not by
//    the initial globalSocket?.connected snapshot which was often stale.

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "https://solar-backend-1-4szm.onrender.com";

// ── Module-level singletons ────────────────────────────────────────────────────
let globalSocket  = null;
let currentToken  = null;

function getToken() {
  return (
    localStorage.getItem("token")       ||
    localStorage.getItem("authToken")   ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

/**
 * Returns the existing socket if the token hasn't changed,
 * otherwise tears down the old one and creates a fresh connection.
 */
function getOrCreateSocket() {
  const token = getToken();

  if (!token) {
    console.warn("[Socket] ⚠️  No auth token found — socket not created.");
    return null;
  }

  // Token changed (e.g. user logged out and back in) → reconnect
  if (globalSocket && currentToken !== token) {
    console.log("[Socket] 🔄 Token changed — reconnecting.");
    globalSocket.disconnect();
    globalSocket = null;
  }

  if (globalSocket) return globalSocket;

  currentToken  = token;
  globalSocket  = io(SOCKET_URL, {
    auth:                 { token },
    transports:           ["websocket", "polling"],
    reconnection:         true,
    reconnectionAttempts: 15,
    reconnectionDelay:    2_000,
    reconnectionDelayMax: 15_000,
    timeout:              12_000,
  });

  // ── Global-level debug logs (outside React) ──────────────────────────────
  globalSocket.on("connect",         () => console.log("[Socket] ✅ Connected  — id:", globalSocket.id));
  globalSocket.on("disconnect",      (r) => console.log("[Socket] ⛔ Disconnected —", r));
  globalSocket.on("connect_error",   (e) => console.warn("[Socket] ✖ Error:", e.message));
  globalSocket.on("reconnect_attempt",(n) => console.log(`[Socket] ↩ Reconnect attempt #${n}`));
  globalSocket.on("reconnect",       (n) => console.log(`[Socket] ✅ Reconnected after ${n} attempt(s)`));

  console.log("[Socket] 🔌 New socket created →", SOCKET_URL);
  return globalSocket;
}

// ── Hook ───────────────────────────────────────────────────────────────────────
/**
 * useSocket()
 *
 * Returns:
 *   socket     — the live socket.io instance (or null if no token)
 *   socketRef  — a React ref whose .current always points to the live socket
 *   connected  — boolean, true when the socket is connected
 *
 * Usage in Locationtracker.js (pass socketRef, not socket):
 *   startTracking(onPoint, socketRef, userId)
 *   // Inside tracker: socketRef.current?.emit(...)
 */
export function useSocket() {
  // socketRef.current always mirrors globalSocket so callers
  // never hold a stale reference across reconnects.
  const socketRef = useRef(null);

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getOrCreateSocket();

    if (!socket) {
      socketRef.current = null;
      setConnected(false);
      return;
    }

    // Keep the ref current
    socketRef.current = socket;

    // Sync initial state (socket may already be connected if this hook
    // mounts after a previous mount already established the connection)
    setConnected(socket.connected);

    // ── Event listeners ──────────────────────────────────────────────────────
    const onConnect = () => {
      socketRef.current = globalSocket; // always the freshest instance
      setConnected(true);
    };

    const onDisconnect = () => setConnected(false);

    const onError = (err) => {
      console.warn("[Socket] ✖ connect_error in hook:", err.message);
      setConnected(false);
    };

    const onReconnect = () => {
      socketRef.current = globalSocket;
      setConnected(true);
    };

    socket.on("connect",        onConnect);
    socket.on("disconnect",     onDisconnect);
    socket.on("connect_error",  onError);
    socket.on("reconnect",      onReconnect);

    return () => {
      socket.off("connect",       onConnect);
      socket.off("disconnect",    onDisconnect);
      socket.off("connect_error", onError);
      socket.off("reconnect",     onReconnect);
    };
  }, []); // run once — singleton pattern

  return {
    socket:    globalSocket, // direct instance (backward-compat)
    socketRef,               // ✅ stable ref — use this in Locationtracker
    connected,
  };
}

// ── Logout helper ──────────────────────────────────────────────────────────────
export function disconnectSocket() {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket  = null;
    currentToken  = null;
    console.log("[Socket] ■ Disconnected on logout");
  }
}
