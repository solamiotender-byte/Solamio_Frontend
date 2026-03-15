// utils/Locationtracker.js
// Single source of truth for GPS tracking.
// Call startTracking() on punch-in, stopTracking() on punch-out.

const API = import.meta.env.VITE_API_URL || "https://solar-backend-4bsb.onrender.com";

let watchId         = null;
let buffer          = [];        // unsent points waiting for next flush
let allPoints       = [];        // every point collected this session
let flushTimer      = null;
let isTracking      = false;
let onPointCallback = null;      // callback([...allPoints]) on every new GPS fix
let socketRef       = null;      // socket.io instance for live push

/**
 * Start GPS tracking after punch-in.
 * @param {Function} onPoint - optional callback([...allPoints]) on every new fix
 * @param {Object}   socket  - optional socket.io instance for live admin push
 */
export function startTracking(onPoint = null, socket = null) {
  if (isTracking) return;
  if (!navigator.geolocation) {
    console.warn("[Tracker] Geolocation not supported.");
    return;
  }

  isTracking      = true;
  buffer          = [];
  allPoints       = [];
  onPointCallback = onPoint;
  socketRef       = socket;

  // Emit location:start immediately so admin map shows user as online
  if (socketRef?.connected) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        socketRef.emit("location:start", {
          lat:      pos.coords.latitude,
          lng:      pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? 0,
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
    );
  }

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const pt = {
        lat:      pos.coords.latitude,
        lng:      pos.coords.longitude,
        speed:    pos.coords.speed    ?? 0,
        accuracy: pos.coords.accuracy ?? 0,
        time:     new Date(pos.timestamp).toISOString(), // real device timestamp
      };

      // Skip if last point was < 15 s ago (debounce slow walkers)
      const last = allPoints[allPoints.length - 1];
      if (last && new Date(pt.time) - new Date(last.time) < 15_000) return;

      buffer.push(pt);
      allPoints.push(pt);

      // Push live to socket so admin map moves instantly
      if (socketRef?.connected) {
        socketRef.emit("location:update", {
          lat:      pt.lat,
          lng:      pt.lng,
          speed:    pt.speed,
          accuracy: pt.accuracy,
          time:     pt.time,
        });
      }

      if (typeof onPointCallback === "function") {
        onPointCallback([...allPoints]);
      }
    },
    (err) => console.warn("[Tracker] GPS error:", err.message),
    {
      enableHighAccuracy: true,
      maximumAge:         10_000,
      timeout:            15_000,
    }
  );

  // Flush to REST every 30 s — backup when socket is down / offline
  flushTimer = setInterval(() => flushBuffer(), 30_000);

  console.log("[Tracker] ▶ Started");
}

/**
 * Stop GPS tracking on punch-out.
 * Flushes remaining buffered points to DB before stopping.
 */
export function stopTracking() {
  if (!isTracking) return;

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  if (flushTimer !== null) {
    clearInterval(flushTimer);
    flushTimer = null;
  }

  // Tell backend user is going offline
  if (socketRef?.connected) {
    socketRef.emit("location:stop");
  }
  socketRef = null;

  // Final flush — don't lose the last points
  flushBuffer();

  isTracking      = false;
  onPointCallback = null;

  console.log("[Tracker] ■ Stopped");
}

/** Returns a snapshot of all points collected this session */
export function getTrackPoints() {
  return [...allPoints];
}

/** Reset — call when starting fresh next day after punch-out */
export function clearTrackPoints() {
  allPoints = [];
  buffer    = [];
}

/** Whether GPS tracking is currently active */
export function isCurrentlyTracking() {
  return isTracking;
}

/**
 * POST buffered points to /api/v1/location/track/bulk
 * Re-queues on network failure (offline support).
 */
async function flushBuffer() {
  if (!buffer.length) return;

  // Always read the latest token — no stale closure after token refresh
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  const points = [...buffer];
  buffer = []; // clear before await so new GPS hits go to a fresh buffer

  try {
    const res = await fetch(`${API}/api/v1/location/track/bulk`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ points }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    console.log(`[Tracker] ✅ Flushed ${points.length} point(s) to DB`);
  } catch (err) {
    // Put points back so next flush picks them up
    buffer = [...points, ...buffer];
    console.warn("[Tracker] ⚠ Flush failed, re-queued:", err.message);
  }
}