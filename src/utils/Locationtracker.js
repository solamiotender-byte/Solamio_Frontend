// locationTracker.js
// Single source of truth for GPS tracking.
// Call startTracking() on punch-in, stopTracking() on punch-out.

const API = import.meta.env.VITE_API_URL || "https://solar-backend-4bsb.onrender.com";

let watchId = null;
let buffer = [];       // unsent points waiting for next flush
let allPoints = [];    // every point collected this session
let flushTimer = null;
let isTracking = false;
let onPointCallback = null; // optional callback fired on every new point

/**
 * Start GPS tracking after punch-in.
 * @param {Function} onPoint - optional callback(point) fired on every new GPS fix
 */
export function startTracking(onPoint = null) {
  if (isTracking) return;
  if (!navigator.geolocation) {
    console.warn("Geolocation not supported in this browser.");
    return;
  }

  isTracking = true;
  buffer = [];
  allPoints = [];
  onPointCallback = onPoint;

  const token = localStorage.getItem("token");

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const pt = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        speed: pos.coords.speed ?? 0,
        accuracy: pos.coords.accuracy ?? 0,
        time: new Date().toISOString(),
      };

      // Skip duplicate points (moved less than ~10m)
      const last = allPoints[allPoints.length - 1];
      if (
        last &&
        Math.abs(last.lat - pt.lat) < 0.0001 &&
        Math.abs(last.lng - pt.lng) < 0.0001
      ) {
        return;
      }

      buffer.push(pt);
      allPoints.push(pt);

      if (typeof onPointCallback === "function") {
        onPointCallback([...allPoints]);
      }
    },
    (err) => {
      console.warn("GPS error:", err.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 15000,
    }
  );

  // Flush buffer to backend every 30 seconds
  flushTimer = setInterval(() => flushBuffer(token), 30000);

  console.log("📍 Location tracking started");
}

/**
 * Stop GPS tracking on punch-out.
 * Flushes any remaining buffered points before stopping.
 */
export function stopTracking() {
  if (!isTracking) return;

  const token = localStorage.getItem("token");

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  if (flushTimer !== null) {
    clearInterval(flushTimer);
    flushTimer = null;
  }

  // Final flush — make sure last points are sent
  flushBuffer(token);

  isTracking = false;
  onPointCallback = null;

  console.log("📍 Location tracking stopped");
}

/**
 * Returns a copy of all points collected this session.
 */
export function getTrackPoints() {
  return [...allPoints];
}

/**
 * Clears all collected points (call after punch-out if starting fresh next day).
 */
export function clearTrackPoints() {
  allPoints = [];
  buffer = [];
}

/**
 * Returns whether tracking is currently active.
 */
export function isCurrentlyTracking() {
  return isTracking;
}

/**
 * Send buffered points to backend in bulk.
 * Re-queues on network failure (offline support).
 */
async function flushBuffer(token) {
  if (!buffer.length) return;

  const points = [...buffer];
  buffer = []; // clear before sending so new points go into fresh buffer

  try {
    const res = await fetch(`${API}/api/v1/location/bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ points }),
    });

    if (!res.ok) {
      throw new Error(`Server responded ${res.status}`);
    }

    console.log(`📍 Sent ${points.length} location point(s)`);
  } catch (err) {
    // Network failed — put points back so they go on next flush
    buffer = [...points, ...buffer];
    console.warn("📍 Flush failed, re-queued:", err.message);
  }
}