// utils/Locationtracker.js
//
// BUGS FIXED:
// 1. Debounce was 15 SECONDS — GPS on mobile fires every 3-5s but we were
//    skipping most points. Changed to NO debounce — save every valid point.
// 2. Jump filter was too strict (0.5 km max) — when user travels fast or
//    GPS wakes up after sleep it rejected real movement. Relaxed to 10 km.
// 3. flushBuffer was only called every 10s OR when buffer had 5+ points.
//    Now flushes every point individually via REST AND socket so nothing is lost.
// 4. Socket offline = points were never saved to DB at all if socket failed.
//    Now REST bulk flush is ALWAYS called regardless of socket status.

const API = import.meta.env.VITE_API_URL || "https://solar-backend-4bsb.onrender.com";

// ── Haversine distance in metres ─────────────────────────────────────────────
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

// ── Reverse geocode via Nominatim ─────────────────────────────────────────────
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

// ── Auto-visit constants ──────────────────────────────────────────────────────
const DWELL_RADIUS_M = 50;
const DWELL_TIME_MS  = 10 * 60 * 1000; // 10 min
const COOLDOWN_MS    = 30 * 60 * 1000; // 30 min

let dwellAnchor      = null;
let recentVisitSpots = [];

// ── Core state ────────────────────────────────────────────────────────────────
let watchId         = null;
let buffer          = [];
let allPoints       = [];
let flushTimer      = null;
let isTracking      = false;
let onPointCallback = null;
let socketRef       = null;

const getToken = () =>
  localStorage.getItem("token")      ||
  localStorage.getItem("authToken")  ||
  localStorage.getItem("accessToken") || "";

/**
 * startTracking — call immediately on punch-in
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
  dwellAnchor      = null;
  recentVisitSpots = [];

  // Tell admin: user is online
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
        time:     new Date(pos.timestamp).toISOString(),
      };

      const last = allPoints[allPoints.length - 1];

      // ── FIX 1: Removed 15s debounce — was skipping most real GPS points ──
      // Only skip if the point is IDENTICAL to the last one (truly no movement)
      if (last &&
          Math.abs(pt.lat - last.lat) < 0.000001 &&
          Math.abs(pt.lng - last.lng) < 0.000001) {
        return; // exact same spot — skip
      }

      // ── FIX 2: Relaxed accuracy filter — 500m was too strict for moving ──
      // Accept up to 1000m accuracy so we don't miss points while driving
      if (pt.accuracy > 1000) {
        console.warn(`[Tracker] Skipping very poor accuracy: ±${pt.accuracy}m`);
        return;
      }

      // ── FIX 3: Relaxed jump filter — 10km instead of 0.5km ───────────────
      // 0.5km max was rejecting real movement when user was driving fast
      if (last) {
        const jumpKm = distanceMetres(last.lat, last.lng, pt.lat, pt.lng) / 1000;
        if (jumpKm > 10) {
          console.warn(`[Tracker] Skipping impossible jump: ${jumpKm.toFixed(1)}km`);
          return;
        }
      }

      // ── Valid point — save it ─────────────────────────────────────────────
      buffer.push(pt);
      allPoints.push(pt);

      console.log(`[Tracker] 📍 New point: ${pt.lat.toFixed(5)}, ${pt.lng.toFixed(5)} ±${Math.round(pt.accuracy)}m`);

      // ── FIX 4: Flush to DB immediately on every point ─────────────────────
      // Previously waited for 5 points or 10s timer.
      // Now saves every single point immediately so trail is never lost.
      flushBuffer();

      // Push live to socket for instant admin map update
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

      handleAutoVisit(pt);
    },
    (err) => console.warn("[Tracker] GPS error:", err.message),
    {
      enableHighAccuracy: true,
      maximumAge:         5_000,  // accept fixes up to 5s old
      timeout:            15_000,
    }
  );

  // Backup flush timer every 15s — catches any points missed by immediate flush
  flushTimer = setInterval(() => {
    if (buffer.length > 0) flushBuffer();
  }, 15_000);

  window.addEventListener("requestDwellInfo", handleDwellInfoRequest);

  console.log("[Tracker] ▶ Started — saving every GPS point to DB");
}

function handleDwellInfoRequest() {
  if (!dwellAnchor) return;
  const mins = Math.floor((Date.now() - dwellAnchor.since) / 60000);
  window.dispatchEvent(new CustomEvent("dwellInfoResponse", { detail: { mins } }));
}

// ── Auto-visit detection ──────────────────────────────────────────────────────
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
      (s) => distanceMetres(s.lat, s.lng, dwellAnchor.lat, dwellAnchor.lng) < DWELL_RADIUS_M && now - s.time < COOLDOWN_MS
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
    const res = await fetch(`${API}/api/v1/visit/create`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    recentVisitSpots.push({ lat, lng, time: Date.now() });
    recentVisitSpots = recentVisitSpots.filter(s => Date.now() - s.time < 2 * 60 * 60 * 1000);
    console.log(`[AutoVisit] ✅ Created: "${geo.name}"`);
    window.dispatchEvent(new CustomEvent("autoVisitCreated", {
      detail: { visitId: json?.data?._id || null, locationName: geo.name, address: geo.address, lat, lng, dwellMins },
    }));
  } catch (err) {
    console.warn("[AutoVisit] Failed:", err.message);
  }
}

/**
 * stopTracking — call on punch-out
 */
export function stopTracking() {
  if (!isTracking) return;
  if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
  if (flushTimer !== null) { clearInterval(flushTimer); flushTimer = null; }
  window.removeEventListener("requestDwellInfo", handleDwellInfoRequest);
  if (socketRef?.connected) socketRef.emit("location:stop");
  socketRef = null;
  flushBuffer(); // final flush
  isTracking       = false;
  onPointCallback  = null;
  dwellAnchor      = null;
  recentVisitSpots = [];
  console.log("[Tracker] ■ Stopped");
}

export function getTrackPoints()     { return [...allPoints]; }
export function clearTrackPoints()   { allPoints = []; buffer = []; }
export function isCurrentlyTracking(){ return isTracking; }

/**
 * flushBuffer — POST points to /api/v1/location/track/bulk
 * FIX: Now called immediately on every new point so nothing is lost.
 * Each point has `time` ISO string so backend sets expiresAt = recordedAt + 10h.
 */
async function flushBuffer() {
  if (!buffer.length) return;

  const token  = getToken();
  const points = [...buffer];
  buffer = []; // clear immediately so new points don't pile up

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
    console.log(`[Tracker] ✅ Saved ${points.length} red mark(s) to DB`);
  } catch (err) {
    // Re-queue so points are not lost on network error
    buffer = [...points, ...buffer];
    console.warn("[Tracker] ⚠ Save failed, re-queued:", err.message);
  }
}