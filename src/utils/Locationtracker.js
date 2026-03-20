// utils/Locationtracker.js
// All errors now show as toasts instead of silent console.warn

import { toast } from "../components/useToast.jsx";

const API = import.meta.env.VITE_API_URL || "https://solar-backend-4bsb.onrender.com";

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
    // silent — non-critical, address is best-effort
    console.warn("[Tracker] Reverse geocode failed:", e.message);
  }
  return { name: `Stop at ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`, address: "" };
}

const DWELL_RADIUS_M = 50;
const DWELL_TIME_MS  = 10 * 60 * 1000;
const COOLDOWN_MS    = 30 * 60 * 1000;

let dwellAnchor      = null;
let recentVisitSpots = [];
let watchId          = null;
let buffer           = [];
let allPoints        = [];
let flushTimer       = null;
let isTracking       = false;
let onPointCallback  = null;
let socketRef        = null;

// Track whether we've already shown certain one-time toasts this session
let _shownPoorGpsToast  = false;
let _shownOfflineToast  = false;
let _flushFailCount     = 0;

const getToken = () =>
  localStorage.getItem("token")      ||
  localStorage.getItem("authToken")  ||
  localStorage.getItem("accessToken") || "";

export function startTracking(onPoint = null, socket = null) {
  if (isTracking) return;

  if (!navigator.geolocation) {
    toast.error("GPS not supported on this device.", { title: "Tracker Error" });
    return;
  }

  isTracking          = true;
  buffer              = [];
  allPoints           = [];
  onPointCallback     = onPoint;
  socketRef           = socket;
  dwellAnchor         = null;
  recentVisitSpots    = [];
  _shownPoorGpsToast  = false;
  _shownOfflineToast  = false;
  _flushFailCount     = 0;

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

      if (last &&
          Math.abs(pt.lat - last.lat) < 0.000001 &&
          Math.abs(pt.lng - last.lng) < 0.000001) {
        return;
      }

      // Poor accuracy toast — show once per session when accuracy > 200m
      if (pt.accuracy > 200 && !_shownPoorGpsToast) {
        toast.warn(`GPS accuracy is poor (±${Math.round(pt.accuracy)}m). Move to open sky for better tracking.`, {
          title: "Weak GPS Signal",
        });
        _shownPoorGpsToast = true;
        // Reset after 5 min so it can warn again if still bad
        setTimeout(() => { _shownPoorGpsToast = false; }, 5 * 60 * 1000);
      }

      if (pt.accuracy > 1000) {
        console.warn(`[Tracker] Skipping very poor accuracy: ±${pt.accuracy}m`);
        return;
      }

      if (last) {
        const jumpKm = distanceMetres(last.lat, last.lng, pt.lat, pt.lng) / 1000;
        if (jumpKm > 10) {
          toast.warn(`GPS jumped ${jumpKm.toFixed(1)} km — point skipped.`, { title: "GPS Jump Detected" });
          return;
        }
      }

      buffer.push(pt);
      allPoints.push(pt);

      flushBuffer();

      if (socketRef?.connected) {
        socketRef.emit("location:update", {
          lat:      pt.lat,
          lng:      pt.lng,
          speed:    pt.speed,
          accuracy: pt.accuracy,
          time:     pt.time,
        });
      } else if (!_shownOfflineToast) {
        toast.warn("Socket offline — location still saving to server via REST.", {
          title: "Live Sync Paused",
        });
        _shownOfflineToast = true;
        // Reset so it can re-warn if socket drops again after reconnect
        setTimeout(() => { _shownOfflineToast = false; }, 5 * 60 * 1000);
      }

      if (typeof onPointCallback === "function") {
        onPointCallback([...allPoints]);
      }

      handleAutoVisit(pt);
    },
    (err) => {
      // Map GeolocationPositionError codes to friendly messages
      const msgs = {
        1: "Location permission denied. Please allow location access in your browser settings.",
        2: "GPS signal unavailable. Check if location is enabled on your device.",
        3: "GPS timed out. Signal too weak — try moving to an open area.",
      };
      const msg = msgs[err.code] || `GPS error: ${err.message}`;
      toast.error(msg, { title: "Location Error" });
      console.warn("[Tracker] GPS error:", err.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge:         5_000,
      timeout:            15_000,
    }
  );

  flushTimer = setInterval(() => {
    if (buffer.length > 0) flushBuffer();
  }, 15_000);

  window.addEventListener("requestDwellInfo", handleDwellInfoRequest);
  toast.success("Location tracking started.", { title: "Tracking Active" });
  console.log("[Tracker] ▶ Started");
}

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
    const res = await fetch(`${API}/api/v1/visit/create`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
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

export function stopTracking() {
  if (!isTracking) return;
  if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
  if (flushTimer !== null) { clearInterval(flushTimer); flushTimer = null; }
  window.removeEventListener("requestDwellInfo", handleDwellInfoRequest);
  if (socketRef?.connected) socketRef.emit("location:stop");
  socketRef = null;
  flushBuffer();
  isTracking       = false;
  onPointCallback  = null;
  dwellAnchor      = null;
  recentVisitSpots = [];
  toast.info("Location tracking stopped.", { title: "Tracking Ended" });
  console.log("[Tracker] ■ Stopped");
}

export function getTrackPoints()      { return [...allPoints]; }
export function clearTrackPoints()    { allPoints = []; buffer = []; }
export function isCurrentlyTracking() { return isTracking; }

async function flushBuffer() {
  if (!buffer.length) return;

  const token  = getToken();
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
    _flushFailCount = 0;
    console.log(`[Tracker] ✅ Saved ${points.length} point(s)`);
  } catch (err) {
    buffer = [...points, ...buffer];
    _flushFailCount++;
    console.warn("[Tracker] ⚠ Save failed, re-queued:", err.message);

    // Only toast after 3 consecutive failures to avoid spam
    if (_flushFailCount === 3) {
      toast.error("Location data not reaching server. Check your connection.", {
        title: "Sync Failed",
      });
    }
  }
}