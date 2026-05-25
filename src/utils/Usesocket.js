import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "https://solar-backend-2-r6k9.onrender.com";

let globalSocket = null;
let currentToken = null;

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

function getOrCreateSocket() {
  const token = getToken();

  if (!token) {
    return null;
  }

  if (globalSocket && currentToken !== token) {
    globalSocket.disconnect();
    globalSocket = null;
  }

  if (globalSocket) return globalSocket;

  currentToken = token;
  globalSocket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 15000,
    timeout: 12000,
  });

  globalSocket.on("connect", () => {
    console.log("[Socket] Connected:", globalSocket.id);
  });
  globalSocket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
  });
  globalSocket.on("connect_error", (error) => {
    console.warn("[Socket] connect_error:", error.message);
  });
  globalSocket.on("reconnect_attempt", (attempt) => {
    console.log(`[Socket] reconnect attempt #${attempt}`);
  });
  globalSocket.on("reconnect", (attempt) => {
    console.log(`[Socket] reconnected after ${attempt} attempt(s)`);
  });

  return globalSocket;
}

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let activeSocket = null;

    const onConnect = () => {
      socketRef.current = globalSocket;
      setConnected(true);
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onError = (error) => {
      console.warn("[Socket] hook connect_error:", error.message);
      setConnected(false);
    };

    const onReconnect = () => {
      socketRef.current = globalSocket;
      setConnected(true);
    };

    const attachListeners = (socket) => {
      if (!socket || socket === activeSocket) return;

      if (activeSocket) {
        activeSocket.off("connect", onConnect);
        activeSocket.off("disconnect", onDisconnect);
        activeSocket.off("connect_error", onError);
        activeSocket.off("reconnect", onReconnect);
      }

      activeSocket = socket;
      socketRef.current = socket;
      setConnected(socket.connected);

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("connect_error", onError);
      socket.on("reconnect", onReconnect);
    };

    const ensureSocket = () => {
      const socket = getOrCreateSocket();

      if (!socket) {
        socketRef.current = null;
        setConnected(false);
        return;
      }

      attachListeners(socket);
    };

    ensureSocket();

    const intervalId = window.setInterval(ensureSocket, 2000);
    window.addEventListener("focus", ensureSocket);
    window.addEventListener("storage", ensureSocket);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", ensureSocket);
      window.removeEventListener("storage", ensureSocket);

      if (activeSocket) {
        activeSocket.off("connect", onConnect);
        activeSocket.off("disconnect", onDisconnect);
        activeSocket.off("connect_error", onError);
        activeSocket.off("reconnect", onReconnect);
      }
    };
  }, []);

  return {
    socket: globalSocket,
    socketRef,
    connected,
  };
}

export function disconnectSocket() {
  if (!globalSocket) return;

  globalSocket.disconnect();
  globalSocket = null;
  currentToken = null;
}
