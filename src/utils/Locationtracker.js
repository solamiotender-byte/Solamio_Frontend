// utils/Locationtracker.js

import { toast } from "../components/useToast.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:9001";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function distanceMetres(lat1, lng1, lat2, lng2) {
  const R    = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function reverseGeocode(lat, lng) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data) {
      const a         = data.address || {};
      const name      = data.name || data.namedetails?.name || null;
      const placeName = name || a.office || a.company || a.shop || a.amenity || a.tourism || a.leisure || a.building || null;
      const fullAddress = [
        a.house_number && a.road ? `${a.house_number} ${a.road}` : (a.road || a.pedestrian || a.footway),
        a.suburb || a.neighbourhood || a.quarter,
        a.city || a.town || a.village || a.county,
        a.state, a.postcode, a.country,
      ].filter(Boolean).join(", ");
      const shortName = placeName ||
        [a.road || a.pedestrian, a.suburb || a.neighbourhood, a.city || a.town || a.village].filter(Boolean).join(", ") ||
        data.display_name?.split(",").slice(0, 2).join(",").trim() ||
        `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
      return { name: shortName, address: fullAddress || data.display_name || shortName };
    }
  } catch (e) {
    console.warn("[Tracker] Reverse geocode failed:", e.message);
  }
  return { name: `Stop at ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`, address: "" };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DWELL_RADIUS_M = 50;
const DWELL_TIME_MS  = 10 * 60 * 1000;  // 10 minutes
const COOLDOWN_MS    = 30 * 60 * 1000;  // 30 minutes

// GPS jitter on phones is typically ±5–15 m indoors.
// Require 15 m of confirmed movement before accepting a new trail point.
// FIX: Previously this was 5 m, which caused fake red lines while sitting still.
const MIN_MOVE_METRES = 15;

// ─── Module-level state ───────────────────────────────────────────────────────

let dwellAnchor      = null;
let recentVisitSpots = [];
let watchId          = null;   // watchPosition handle — NOT an interval
let buffer           = [];     // points waiting to be flushed to DB
let allPoints        = [];     // all accepted trail points this session
let flushTimer       = null;   // setInterval handle for DB flush
let isTracking       = false;
let onPointCallback  = null;
let socketRef        = null;
let _userId          = null;   // FIX: must be passed in so flushBuffer can send it

let _shownPoorGpsToast = false;
let _shownOfflineToast = false;
let _flushFailCount    = 0;

const getToken = () =>
  localStorage.getItem("token")      ||
  localStorage.getItem("authToken")  ||
  localStorage.getItem("accessToken") || "";

function safeEmit(event, data) {
  if (socketRef?.connected) socketRef.emit(event, data);
}

// ─── startTracking ────────────────────────────────────────────────────────────
/**
 * @param {Function} onPoint   - callback(allPoints[]) fired on every accepted GPS point
 * @param {Socket}   socket    - socket.io instance (from useSocket)
 * @param {string}   userId    - user._id from your auth context / Attendance.jsx
 *
 * FIX: userId is now a required 3rd param. Without it, flushBuffer sends points
 * to the server with no owner — the server silently discards them → raw=0 in logs.
 *
 * FIX: Removed the forcePollTimer (setInterval → getCurrentPosition every 30s).
 * That was duplicating points already captured by watchPosition and causing the
 * same coordinates to appear in logs repeatedly. watchPosition with maximumAge:0
 * handles mobile stalls correctly on its own.
 */
export function startTracking(onPoint = null, socket = null, userId = null) {
  if (isTracking) {
    console.warn("[Tracker] Already tracking — ignoring duplicate startTracking call.");
    return;
  }

  if (!navigator.geolocation) {
    toast.error("GPS not supported on this device.", { title: "Tracker Error" });
    return;
  }

  // FIX: warn immediately if userId is missing so the bug is obvious in the console
  if (!userId) {
    console.error("[Tracker] ❌ startTracking called WITHOUT userId! Points will NOT save to DB.");
  }

  console.log("🟢 TRACKING STARTED — userId:", userId, "| 15 m jitter filter | DB flush every 30 s");

  isTracking         = true;
  buffer             = [];
  allPoints          = [];
  onPointCallback    = onPoint;
  socketRef          = socket;
  dwellAnchor        = null;
  recentVisitSpots   = [];
  _shownPoorGpsToast = false;
  _shownOfflineToast = false;
  _flushFailCount    = 0;
  _userId            = userId;  // FIX: store for use in flushBuffer

  // Emit location:start with the initial position
  if (socketRef?.connected) {
    const capturedSocket = socketRef;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!capturedSocket?.connected) return;
        capturedSocket.emit("location:start", {
          lat:      pos.coords.latitude,
          lng:      pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? 0,
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
    );
  }

  // ── watchPosition ──────────────────────────────────────────────────────────
  // FIX: watchPosition with maximumAge:0 is the ONLY GPS source.
  // The old forcePollTimer (getCurrentPosition every 30s) has been removed
  // because it caused the same coordinates to appear repeatedly in logs and
  // double-counted points in the DB.
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const pt = {
        lat:      pos.coords.latitude,
        lng:      pos.coords.longitude,
        speed:    pos.coords.speed    ?? 0,
        accuracy: pos.coords.accuracy ?? 0,
        time:     new Date(pos.timestamp).toISOString(),
      };

      // Skip poor-accuracy readings first
      if (pt.accuracy > 150) {
        console.log(`[GPS] ⏭ Skipped — accuracy ±${Math.round(pt.accuracy)} m too poor`);
        return;
      }

      const last = allPoints[allPoints.length - 1];

      // FIX: require 15 m of real movement (was 5 m — too sensitive, caused jitter lines)
      if (last) {
        const dist = distanceMetres(last.lat, last.lng, pt.lat, pt.lng);
        if (dist < MIN_MOVE_METRES) {
          console.log(`[GPS] ⏭ Jitter ${dist.toFixed(1)} m < ${MIN_MOVE_METRES} m — skipped`);
          return;
        }
      }

      // Warn about weak signal (but don't skip — accuracy already checked above)
      if (pt.accuracy > 100 && !_shownPoorGpsToast) {
        toast.warn(`GPS accuracy is poor (±${Math.round(pt.accuracy)} m). Move to open sky.`, {
          title: "Weak GPS Signal",
        });
        _shownPoorGpsToast = true;
        setTimeout(() => { _shownPoorGpsToast = false; }, 5 * 60 * 1000);
      }

      // Skip impossible GPS jumps (teleportation > 10 km instantly)
      if (last) {
        const jumpKm = distanceMetres(last.lat, last.lng, pt.lat, pt.lng) / 1000;
        if (jumpKm > 10) {
          console.warn(`[GPS] ❌ Jump ${jumpKm.toFixed(1)} km — skipped`);
          toast.warn(`GPS jumped ${jumpKm.toFixed(1)} km — point skipped.`, { title: "GPS Jump Detected" });
          return;
        }
      }

      buffer.push(pt);
      allPoints.push(pt);

      const moveDist = last
        ? distanceMetres(last.lat, last.lng, pt.lat, pt.lng).toFixed(0) + " m"
        : "first point";
      console.log(`[GPS] ✅ Real movement ${moveDist} — buffer:${buffer.length} total:${allPoints.length}`);

      // Emit live position via socket
      if (socketRef?.connected) {
        safeEmit("location:update", {
          lat:      pt.lat,
          lng:      pt.lng,
          speed:    pt.speed,
          accuracy: pt.accuracy,
          time:     pt.time,
        });
      } else if (!_shownOfflineToast) {
        toast.warn("Socket offline — location not syncing live.", { title: "Live Sync Paused" });
        _shownOfflineToast = true;
        setTimeout(() => { _shownOfflineToast = false; }, 5 * 60 * 1000);
      }

      // Notify the map component
      if (typeof onPointCallback === "function") {
        onPointCallback([...allPoints]);
      }

      handleAutoVisit(pt);
    },
    (err) => {
      const msgs = {
        1: "Location permission denied. Please allow location access in your browser settings.",
        2: "GPS signal unavailable. Check if location is enabled on your device.",
        3: "GPS timed out. Signal too weak — try moving to an open area.",
      };
      toast.error(msgs[err.code] || `GPS error: ${err.message}`, { title: "Location Error" });
      console.warn("[Tracker] GPS error:", err.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge:         0,       // FIX: always fresh — never use cached position
      timeout:            20_000,
    }
  );

  // ── DB flush every 30 s ────────────────────────────────────────────────────
  flushTimer = setInterval(() => flushBuffer(), 30_000);

  window.addEventListener("requestDwellInfo", handleDwellInfoRequest);
  toast.success("Location tracking started.", { title: "Tracking Active" });
  console.log("[Tracker] ▶ Started — watchId:", watchId, "| userId:", _userId);
}

// ─── stopTracking ─────────────────────────────────────────────────────────────

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

  window.removeEventListener("requestDwellInfo", handleDwellInfoRequest);
  safeEmit("location:stop");
  socketRef = null;

  // Flush any remaining points before clearing state
  flushBuffer();

  isTracking       = false;
  onPointCallback  = null;
  dwellAnchor      = null;
  recentVisitSpots = [];
  _userId          = null;

  toast.info("Location tracking stopped.", { title: "Tracking Ended" });
  console.log("[Tracker] ■ Stopped");
}

// ─── Public helpers ───────────────────────────────────────────────────────────

export function getTrackPoints()      { return [...allPoints]; }
export function clearTrackPoints()    { allPoints = []; buffer = []; }
export function isCurrentlyTracking() { return isTracking; }

// ─── flushBuffer ──────────────────────────────────────────────────────────────
/**
 * Sends buffered GPS points to the backend in one bulk POST.
 *
 * FIX: userId is now included in every request body.
 * Previously _userId was null (never passed from LiveTrackingMap),
 * so the server received points with no owner and stored nothing → raw=0.
 */
async function flushBuffer() {
  if (!buffer.length) {
    console.log("[Flush] 🔄 Skipped — buffer empty");
    return;
  }

  const token  = getToken();
  const points = [...buffer];
  buffer = []; // optimistically clear

  if (!_userId) {
    console.error("[Flush] ❌ No userId — aborting flush! Points will be lost.");
    buffer = [...points, ...buffer]; // re-queue so they aren't lost
    return;
  }

  console.log(`[Flush] 📤 Sending ${points.length} point(s) — userId:`, _userId);

  try {
    const res = await fetch(`${API}/api/v1/location/track/bulk`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ points, userId: _userId }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    _flushFailCount = 0;
    console.log(`[Flush] ✅ Saved ${points.length} point(s) for userId:`, _userId);
  } catch (err) {
    buffer = [...points, ...buffer]; // re-queue failed points
    _flushFailCount++;
    console.error(`[Flush] ❌ Failed (attempt ${_flushFailCount}):`, err.message);
    if (_flushFailCount === 3) {
      toast.error("Location data not reaching server. Check your connection.", {
        title: "Sync Failed",
      });
    }
  }
}

// ─── Auto-visit (dwell detection) ────────────────────────────────────────────

function handleDwellInfoRequest() {
  if (!dwellAnchor) return;
  const mins = Math.floor((Date.now() - dwellAnchor.since) / 60000);
  window.dispatchEvent(new CustomEvent("dwellInfoResponse", { detail: { mins } }));
}

async function handleAutoVisit(pt) {
  const now = Date.now();
  if (!dwellAnchor) {
    dwellAnchor = { lat: pt.lat, lng: pt.lng, since: now };
    return;
  }
  const dist = distanceMetres(pt.lat, pt.lng, dwellAnchor.lat, dwellAnchor.lng);
  if (dist > DWELL_RADIUS_M) {
    dwellAnchor = { lat: pt.lat, lng: pt.lng, since: now };
    return;
  }
  const dwellMs = now - dwellAnchor.since;
  if (dwellMs >= DWELL_TIME_MS) {
    const tooRecent = recentVisitSpots.some(
      (s) =>
        distanceMetres(s.lat, s.lng, dwellAnchor.lat, dwellAnchor.lng) < DWELL_RADIUS_M &&
        now - s.time < COOLDOWN_MS
    );
    if (tooRecent) return;
    const dwellMins = Math.round(dwellMs / 60000);
    await createAutoVisit(dwellAnchor.lat, dwellAnchor.lng, dwellMins);
    dwellAnchor = null;
  }
}

async function createAutoVisit(lat, lng, dwellMins = 10) {
  const token = getToken();
  if (!token) return;
  const geo = await reverseGeocode(lat, lng);
  try {
    const fd = new FormData();
    fd.append("latitude",      lat.toString());
    fd.append("longitude",     lng.toString());
    fd.append("locationName",  geo.name);
    fd.append("address",       geo.address);
    fd.append("isLeadCreated", "no");
    fd.append("remarks",       `Auto-detected stop · stayed ${dwellMins} min · https://maps.google.com/?q=${lat},${lng}`);
    const res = await fetch(`${API}/api/v1/visit`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
      body:    fd,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    recentVisitSpots.push({ lat, lng, time: Date.now() });
    recentVisitSpots = recentVisitSpots.filter((s) => Date.now() - s.time < 2 * 60 * 60 * 1000);
    toast.info(`Auto-visit logged: "${geo.name}" (${dwellMins} min)`, { title: "Visit Detected" });
    console.log(`[AutoVisit] ✅ Created: "${geo.name}"`);
    window.dispatchEvent(new CustomEvent("autoVisitCreated", {
      detail: {
        visitId:      json?.data?._id || null,
        locationName: geo.name,
        address:      geo.address,
        lat, lng, dwellMins,
      },
    }));
  } catch (err) {
    toast.error(`Could not save visit at "${geo.name}". Will retry next stop.`, { title: "Visit Save Failed" });
    console.warn("[AutoVisit] Failed:", err.message);
  }
}