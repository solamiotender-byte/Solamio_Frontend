// utils/Locationtracker.js
// Single source of truth for GPS tracking.
// Call startTracking() on punch-in, stopTracking() on punch-out.
//
// ── Smart Auto-Visit Detection ─────────────────────────────────────────────
// • If you stay within 50 m of a spot for 10 minutes → auto-creates a visit
// • When you move more than 100 m from that spot → auto-completes the visit
// • Uses Nominatim reverse geocoding to auto-fill location name
// • Won't create duplicate visits at the same spot within 30 minutes

const API = import.meta.env.VITE_API_URL || "https://solar-backend-4bsb.onrender.com";

// ── Haversine distance in metres between two lat/lng points ──────────────────
function distanceMetres(lat1, lng1, lat2, lng2) {
  const R   = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Reverse geocode via Nominatim (free, no API key) ─────────────────────────
// Returns { name, address } — name is the short business/place name,
// address is the full readable street address for the visit timeline.
async function reverseGeocode(lat, lng) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();

    if (data) {
      const a    = data.address || {};
      const name = data.name || data.namedetails?.name || null;

      // Short name — business/place priority
      const placeName =
        name ||
        a.office || a.company ||
        a.shop || a.amenity || a.tourism || a.leisure ||
        a.building || a.residential || null;

      // Full address — street + city + state + pincode
      const fullAddress = [
        a.house_number && a.road ? `${a.house_number} ${a.road}` : (a.road || a.pedestrian || a.footway),
        a.suburb || a.neighbourhood || a.quarter,
        a.city || a.town || a.village || a.county,
        a.state,
        a.postcode,
        a.country,
      ].filter(Boolean).join(", ");

      const shortName = placeName ||
        [a.road || a.pedestrian, a.suburb || a.neighbourhood, a.city || a.town || a.village]
          .filter(Boolean).join(", ") ||
        data.display_name?.split(",").slice(0, 2).join(",").trim() ||
        `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;

      return {
        name:    shortName,
        address: fullAddress || data.display_name || shortName,
      };
    }
  } catch (e) {
    console.warn("[Tracker] Reverse geocode failed:", e.message);
  }
  return { name: `Stop at ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`, address: "" };
}

// ── Auto-visit state ──────────────────────────────────────────────────────────
const DWELL_RADIUS_M  = 50;               // metres — must stay within this to count as stopped
const DWELL_TIME_MS   = 10 * 60 * 1000;  // 10 minutes — how long to stay before visit is created
const COOLDOWN_MS     = 30 * 60 * 1000;  // 30 min — min gap before same spot gets another visit

let dwellAnchor      = null;  // { lat, lng, since: timestamp } — current stop being watched
let recentVisitSpots = [];    // [{ lat, lng, time }] — to avoid duplicate visits same spot

// ── Core tracker state ────────────────────────────────────────────────────────
let watchId         = null;
let buffer          = [];
let allPoints       = [];
let flushTimer      = null;
let isTracking      = false;
let onPointCallback = null;
let socketRef       = null;

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

  // Reset auto-visit state for new session
  dwellAnchor      = null;
  recentVisitSpots = [];

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
        time:     new Date(pos.timestamp).toISOString(),
      };

      // ── Filter bad GPS fixes ──────────────────────────────────────────
      const last = allPoints[allPoints.length - 1];

      // 1. Debounce — skip if last point was < 15 s ago
      if (last && new Date(pt.time) - new Date(last.time) < 15_000) return;

      // 2. Skip low-accuracy fixes (worse than 500m)
      if (pt.accuracy > 500) {
        console.warn(`[Tracker] Skipping low-accuracy point: ±${pt.accuracy}m`);
        return;
      }

      // 3. Skip impossible jumps — if distance from last point > 2km in one reading,
      //    it's a bad GPS fix (like the South Korea phantom point)
      if (last) {
        const jumpKm = distanceMetres(last.lat, last.lng, pt.lat, pt.lng) / 1000;
        const timeDiffSec = (new Date(pt.time) - new Date(last.time)) / 1000;
        // Max realistic speed: 150 km/h = 41.7 m/s. If jump exceeds that → bad fix
        const maxPossibleKm = (timeDiffSec / 3600) * 150;
        if (jumpKm > Math.max(maxPossibleKm, 0.5)) {
          console.warn(`[Tracker] Skipping impossible jump: ${jumpKm.toFixed(1)}km in ${timeDiffSec}s`);
          return;
        }
      }

      buffer.push(pt);
      allPoints.push(pt);

      // Flush immediately if buffer has 5+ points (don't wait for timer)
      if (buffer.length >= 5) flushBuffer();

      // Push live to socket
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

      // ── Smart auto-visit detection ──────────────────────────────────────
      handleAutoVisit(pt);
    },
    (err) => console.warn("[Tracker] GPS error:", err.message),
    {
      enableHighAccuracy: true,
      maximumAge:         10_000,
      timeout:            15_000,
    }
  );

  // Flush to REST every 30 s
  flushTimer = setInterval(() => flushBuffer(), 10_000); // flush every 10s so trail is saved frequently

  // Respond to UI requests for current dwell time (shows "stopped X min" badge on map)
  window.addEventListener("requestDwellInfo", () => {
    if (!dwellAnchor) return;
    const mins = Math.floor((Date.now() - dwellAnchor.since) / 60000);
    window.dispatchEvent(new CustomEvent("dwellInfoResponse", { detail: { mins } }));
  });

  console.log("[Tracker] ▶ Started");
}

/**
 * Called on every new GPS point.
 * Manages dwell detection → auto visit create / complete.
 */
/**
 * Called on every new GPS point.
 * Simple rule:
 *   - Still within 50m of the same spot for 10 min → create a visit
 *   - Moved more than 50m away → reset anchor to new position, start timing again
 *   - Once a visit is created at a spot, 30 min cooldown before same spot again
 */
async function handleAutoVisit(pt) {
  const now = Date.now();

  // No anchor yet — start watching from here
  if (!dwellAnchor) {
    dwellAnchor = { lat: pt.lat, lng: pt.lng, since: now };
    return;
  }

  const dist = distanceMetres(pt.lat, pt.lng, dwellAnchor.lat, dwellAnchor.lng);

  if (dist > DWELL_RADIUS_M) {
    // Moved away — reset anchor to current position, restart timer
    dwellAnchor = { lat: pt.lat, lng: pt.lng, since: now };
    return;
  }

  // Still at same spot — check how long
  const dwellMs = now - dwellAnchor.since;

  if (dwellMs >= DWELL_TIME_MS) {
    // Check cooldown — don't create duplicate at same spot within 30 min
    const tooRecent = recentVisitSpots.some(
      (s) =>
        distanceMetres(s.lat, s.lng, dwellAnchor.lat, dwellAnchor.lng) < DWELL_RADIUS_M &&
        now - s.time < COOLDOWN_MS
    );

    if (tooRecent) {
      // Still in cooldown — keep anchor but don't create again
      return;
    }

    // ✅ Stayed 10+ min → create visit, pass actual dwell time
    const dwellMins = Math.round(dwellMs / 60000);
    console.log(`[AutoVisit] Stopped for ${dwellMins} min — creating visit…`);
    await createAutoVisit(dwellAnchor.lat, dwellAnchor.lng, dwellMins);

    // After creating, reset anchor so if they stay even longer it won't re-trigger
    // The cooldown list handles the 30-min duplicate prevention
    dwellAnchor = null;
  }
}

/**
 * Create a visit at the stopped location.
 */
async function createAutoVisit(lat, lng, dwellMins = 10) {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  if (!token) return;

  // Get both place name and full street address
  const geo          = await reverseGeocode(lat, lng);
  const locationName = geo.name;
  const fullAddress  = geo.address;
  const mapsLink     = `https://maps.google.com/?q=${lat},${lng}`;

  try {
    const fd = new FormData();
    fd.append("latitude",      lat.toString());
    fd.append("longitude",     lng.toString());
    fd.append("locationName",  locationName);
    fd.append("address",       fullAddress);          // ← full street address
    fd.append("isLeadCreated", "no");
    fd.append("remarks",       `Auto-detected stop · stayed ${dwellMins} min · ${mapsLink}`);

    const res = await fetch(`${API}/api/v1/visit/create`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
      body:    fd,
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.message || `HTTP ${res.status}`);
    }

    const json    = await res.json();
    const visitId = json?.data?._id || json?.data?.id || json?._id || json?.id || null;

    // Add to cooldown list so same spot isn't created again for 30 min
    recentVisitSpots.push({ lat, lng, time: Date.now() });
    // Clean entries older than 2 hours
    recentVisitSpots = recentVisitSpots.filter(s => Date.now() - s.time < 2 * 60 * 60 * 1000);

    console.log(`[AutoVisit] ✅ Created: "${locationName}"`);

    // Fire DOM event → UI shows toast + refreshes visit list
    window.dispatchEvent(new CustomEvent("autoVisitCreated", {
      detail: { visitId, locationName, address: fullAddress, lat, lng, dwellMins },
    }));

  } catch (err) {
    console.warn("[AutoVisit] Failed to create visit:", err.message);
  }
}

/**
 * Stop GPS tracking on punch-out.
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

  if (socketRef?.connected) {
    socketRef.emit("location:stop");
  }
  socketRef = null;

  flushBuffer();

  isTracking      = false;
  onPointCallback = null;

  // Reset auto-visit state
  dwellAnchor      = null;
  recentVisitSpots = [];

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
 */
async function flushBuffer() {
  if (!buffer.length) return;

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  const points = [...buffer];
  buffer = [];

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
    buffer = [...points, ...buffer];
    console.warn("[Tracker] ⚠ Flush failed, re-queued:", err.message);
  }
}