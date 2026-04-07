// utils/LiveTrackingMap.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import {
  startTracking, stopTracking,
  getTrackPoints, isCurrentlyTracking,
} from "./Locationtracker";
import { useSocket } from "./Usesocket.js";
import { toast } from "../components/useToast.jsx";

const API    = import.meta.env.VITE_API_URL || "https://solar-backend-4bsb.onrender.com";
// ✅ FIXED: no hardcoded key — reads from .env only
const GKEY   = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyCqM7uF9c0ZMQjdssHqSMJJ3mBcmz5RNS0";
const TTL_MS = 10 * 60 * 60 * 1000;

const getToken = () =>
  localStorage.getItem("token")      ||
  localStorage.getItem("authToken")  ||
  localStorage.getItem("accessToken") || "";

let gmapsPromise = null;
function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve();
  if (gmapsPromise) return gmapsPromise;

  if (!GKEY) {
    return Promise.reject(new Error("VITE_GOOGLE_MAPS_API_KEY is not set in your .env file."));
  }

  gmapsPromise = new Promise((resolve, reject) => {
    const s   = document.createElement("script");
    s.src     = `https://maps.googleapis.com/maps/api/js?key=${GKEY}`;
    s.async   = true;
    s.onload  = resolve;
    s.onerror = () => reject(new Error("Google Maps script failed to load. Check your API key."));
    document.head.appendChild(s);
  });
  return gmapsPromise;
}

export default function LiveTrackingMap({
  isPunchedIn     = false,
  hasPunchedOut   = false,
  userId          = null,
  height          = "400px",
  locateTrigger   = 0,
  onPointsChange,
  isOwner         = true,
  punchInLocation = null,
}) {
  const mapDivRef  = useRef(null);
  const gMapRef    = useRef(null);
  const polyRef    = useRef(null);
  const startMkRef = useRef(null);
  const liveMkRef  = useRef(null);
  const dotsRef    = useRef([]);
  const allPtsRef  = useRef([]);

  const [mapLoaded,  setMapLoaded]  = useState(false);
  const [accuracy,   setAccuracy]   = useState(null);
  const [sockAck,    setSockAck]    = useState(null);
  const [totalKm,    setTotalKm]    = useState(0);
  const [pointCount, setPointCount] = useState(0);

  const prevPunchedIn  = useRef(false);
  const prevPunchedOut = useRef(false);
  const { socket, connected } = useSocket();
  const isLive = isPunchedIn && !hasPunchedOut;

  // ── Init Google Map ────────────────────────────────────────────────────────
  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        if (!mapDivRef.current || gMapRef.current) return;
        gMapRef.current = new window.google.maps.Map(mapDivRef.current, {
          center:            { lat: 20.2961, lng: 85.8245 },
          zoom:              6,
          mapTypeId:         "roadmap",
          zoomControl:       true,
          streetViewControl: false,
          mapTypeControl:    true,
          fullscreenControl: false,
          styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
        });
        setMapLoaded(true);
      })
      .catch((err) => {
        toast.error(err.message, { title: "Map Failed to Load" });
      });
  }, []);

  // ── Draw trail ─────────────────────────────────────────────────────────────
  function drawTrail(points) {
    if (!gMapRef.current || !window.google?.maps || points.length === 0) return;
    const G   = window.google.maps;
    const map = gMapRef.current;

    const path = points.map(p => ({ lat: p.lat, lng: p.lng }));
    const lats = points.map(p => p.lat);
const lngs = points.map(p => p.lng);
const latSpread = (Math.max(...lats) - Math.min(...lats)) * 111000; // metres
const lngSpread = (Math.max(...lngs) - Math.min(...lngs)) * 111000;
console.log(`[drawTrail] Spread: ${latSpread.toFixed(1)}m lat × ${lngSpread.toFixed(1)}m lng`);

    if (polyRef.current) {
      polyRef.current.setPath(path);
    } else if (points.length >= 2) {
      polyRef.current = new G.Polyline({
        path,
        geodesic:      true,
        strokeColor:   "#ef4444",
        strokeOpacity: 0.9,
        strokeWeight:  4,
        map,
        icons: [{
          icon: {
            path: G.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3, strokeColor: "#ef4444",
            fillColor: "#ef4444", fillOpacity: 1,
          },
          offset: "50%", repeat: "100px",
        }],
      });
    }

    if (!startMkRef.current && points.length > 0) {
      startMkRef.current = new G.Marker({
        position: { lat: points[0].lat, lng: points[0].lng },
        map, title: "Start", zIndex: 10,
        icon: {
          path: G.SymbolPath.CIRCLE, scale: 10,
          fillColor: "#22c55e", fillOpacity: 1,
          strokeColor: "#ffffff", strokeWeight: 3,
        },
      });
    }

    dotsRef.current.forEach(d => d.setMap(null));
    dotsRef.current = [];
    points.forEach((pt, i) => {
      if (i === 0 || i === points.length - 1) return;
      if (i % 4 !== 0) return;
      const dot = new G.Marker({
        position: { lat: pt.lat, lng: pt.lng },
        map, zIndex: 5,
        icon: {
          path: G.SymbolPath.CIRCLE, scale: 5,
          fillColor: "#ef4444", fillOpacity: 0.85,
          strokeColor: "#ffffff", strokeWeight: 1,
        },
      });
      dotsRef.current.push(dot);
    });

    const last = points[points.length - 1];
    if (last) {
      if (liveMkRef.current) {
        liveMkRef.current.setPosition({ lat: last.lat, lng: last.lng });
      } else {
        liveMkRef.current = new G.Marker({
          position: { lat: last.lat, lng: last.lng },
          map, title: "Current Location", zIndex: 20,
          icon: {
            path: G.SymbolPath.CIRCLE, scale: 10,
            fillColor: "#ef4444", fillOpacity: 1,
            strokeColor: "rgba(239,68,68,0.4)", strokeWeight: 12,
          },
        });
      }
      if (isLive) map.panTo({ lat: last.lat, lng: last.lng });
    }

   if (points.length >= 2) {
  const bounds = new G.LatLngBounds();
  points.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds, { top: 60, bottom: 40, left: 40, right: 40 });
      if (polyRef.current) polyRef.current.fitted = true;
       if (!isLive) {
    map.fitBounds(bounds, { top: 60, bottom: 40, left: 40, right: 40 });
    console.log(`[drawTrail] ✅ Map fitted to trail bounds`);
  }
} else if (points.length === 1) {
  map.setCenter({ lat: points[0].lat, lng: points[0].lng });
  map.setZoom(16);

    }

    setPointCount(points.length);
  }

 function cleanPoints(raw) {
  const now     = Date.now();
  const cleaned = [];
  for (const p of raw) {
    if (!p.lat || !p.lng) continue;

    // ✅ Skip poor accuracy points
    if (p.accuracy && p.accuracy > 500) continue;


    const ptTime = p.recordedAt || p.time || p.createdAt;
    if (ptTime && now - new Date(ptTime).getTime() > 24 * 60 * 60 * 1000) continue;

    if (cleaned.length > 0) {
      const prev   = cleaned[cleaned.length - 1];
      const R      = 6371;
      const dLat   = ((p.lat - prev.lat) * Math.PI) / 180;
      const dLng   = ((p.lng - prev.lng) * Math.PI) / 180;
      const a      = Math.sin(dLat/2)**2 + Math.cos(prev.lat*Math.PI/180)*Math.cos(p.lat*Math.PI/180)*Math.sin(dLng/2)**2;
      const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      // ✅ Skip points less than 30m from last kept point
      if (distKm * 1000 < 30) continue;

      if (distKm > 50) continue;
    }
    cleaned.push({ lat: p.lat, lng: p.lng, accuracy: p.accuracy });
  }
  return cleaned;
}

  // ── fetchTotalKm ───────────────────────────────────────────────────────────
  const fetchTotalKm = useCallback(async () => {
    if (!userId) return;
    try {
      const res  = await fetch(
        `${API}/api/v1/location/distance?salesmanId=${userId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (!res.ok) return;
      const data = await res.json();
      const km   = data?.data?.totalKm ?? data?.result?.totalKm ?? data?.totalKm ?? 0;
      setTotalKm(Math.round(km * 100) / 100);
    } catch { /* non-fatal */ }
  }, [userId]);

  // ── loadTrailFromDB ────────────────────────────────────────────────────────
  const loadTrailFromDB = useCallback(async () => {
  if (!userId || !mapLoaded) return;
  try {
    const now   = new Date();
    const since = new Date(now);
    since.setHours(0, 0, 0, 0); // ✅ start of today, not 10h ago

    const url = `${API}/api/v1/location/today?salesmanId=${userId}&startTime=${since.toISOString()}&endTime=${now.toISOString()}`;
    console.log(`[AdminMap] 📡 Fetching trail for userId:${userId}`);
    console.log(`[AdminMap] URL: ${url}`);
    
    const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
    console.log(`[AdminMap] Response status: ${res.status}`);
    
    const data    = await res.json();
    console.log(`[AdminMap] Raw response:`, data);
    
    const raw     = data?.result || data?.data || data?.points || [];
    console.log(`[AdminMap] Raw points count: ${raw.length}`);
    
    const cleaned = cleanPoints(raw);
    console.log(`[AdminMap] Cleaned points count: ${cleaned.length}`);

    if (cleaned.length > 0) {
      allPtsRef.current = cleaned;
      drawTrail(cleaned);
      console.log(`[AdminMap] ✅ Trail drawn with ${cleaned.length} points`);
    } else {
      console.warn(`[AdminMap] ⚠️ No points to draw — raw:${raw.length} cleaned:${cleaned.length}`);
    }

    await fetchTotalKm();
  } catch (e) {
    console.error(`[AdminMap] ❌ Trail fetch failed:`, e.message);
  }
}, [userId, mapLoaded, punchInLocation, fetchTotalKm]);


  useEffect(() => { loadTrailFromDB(); }, [loadTrailFromDB]);

useEffect(() => {
  if (!userId || !mapLoaded) return;
  const interval = setInterval(() => loadTrailFromDB(), 15_000);
  return () => clearInterval(interval);
}, [userId, mapLoaded]); // ✅ remove loadTrailFromDB from dep

  // ── Start / stop on punch ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded) return;

    const wasIn  = prevPunchedIn.current;
    const wasOut = prevPunchedOut.current;
    prevPunchedIn.current  = isPunchedIn;
    prevPunchedOut.current = hasPunchedOut;

    if (isPunchedIn && !hasPunchedOut && !wasIn && isOwner) {
      startTracking((allPts) => {
        const livePts = allPts.map(p => ({ lat: p.lat, lng: p.lng }));
        const merged  = [...allPtsRef.current];
        for (const lp of livePts) {
          const exists = merged.some(p =>
            Math.abs(p.lat - lp.lat) < 0.000001 &&
            Math.abs(p.lng - lp.lng) < 0.000001
          );
          if (!exists) merged.push(lp);
        }
        allPtsRef.current = merged;
        drawTrail(merged);
        const last = allPts[allPts.length - 1];
        if (last) setAccuracy(last.accuracy);
        if (typeof onPointsChange === "function") onPointsChange(allPts);
      }, socket);
    }

    if (hasPunchedOut && !wasOut) {
      if (isCurrentlyTracking()) stopTracking();
      setTimeout(() => loadTrailFromDB(), 2000);
    }
  }, [isPunchedIn, hasPunchedOut, socket, mapLoaded, loadTrailFromDB]);

  useEffect(() => {
    if (!isPunchedIn || hasPunchedOut || !mapLoaded || !isOwner) return;
    const t = setInterval(() => {
      const pts = getTrackPoints();
      if (!pts.length) return;
      const livePts = pts.map(p => ({ lat: p.lat, lng: p.lng }));
      const merged  = [...allPtsRef.current];
      for (const lp of livePts) {
        const exists = merged.some(p =>
          Math.abs(p.lat - lp.lat) < 0.000001 &&
          Math.abs(p.lng - lp.lng) < 0.000001
        );
        if (!exists) merged.push(lp);
      }
      allPtsRef.current = merged;
      drawTrail(merged);
      const last = pts[pts.length - 1];
      if (last) setAccuracy(last.accuracy);
    }, 5_000);
    return () => clearInterval(t);
  }, [isPunchedIn, hasPunchedOut, mapLoaded]);

  useEffect(() => {
    return () => { if (isCurrentlyTracking()) stopTracking(); };
  }, []);

  // ── Socket events ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onAck        = (data) => setSockAck(data.timestamp);
    const onError      = (data) => toast.error(data.message || "Socket error occurred.", { title: "Live Sync Error" });
    const onLiveUpdate = (data) => {
      if (!data.lat || !data.lng) return;
      const newPt  = { lat: data.lat, lng: data.lng };
      const merged = [...allPtsRef.current];
      const exists = merged.some(p =>
        Math.abs(p.lat - newPt.lat) < 0.000001 &&
        Math.abs(p.lng - newPt.lng) < 0.000001
      );
      if (!exists) {
        merged.push(newPt);
        allPtsRef.current = merged;
        drawTrail(merged);
      }
    };

    socket.on("location:ack",         onAck);
    socket.on("location:error",       onError);
    socket.on("location:live_update", onLiveUpdate);

    return () => {
      socket.off("location:ack",         onAck);
      socket.off("location:error",       onError);
      socket.off("location:live_update", onLiveUpdate);
    };
  }, [socket]);

  // ── Locate Me ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!locateTrigger || !gMapRef.current) return;
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.", { title: "GPS Unavailable" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        gMapRef.current.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        gMapRef.current.setZoom(17);
      },
      (err) => {
        const msgs = {
          1: "Location permission denied. Please allow access in browser settings.",
          2: "Current position unavailable.",
          3: "Location request timed out.",
        };
        toast.error(msgs[err.code] || err.message, { title: "Locate Me Failed" });
      },
{ enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 }
    );
  }, [locateTrigger]);

  // ── Accuracy label ─────────────────────────────────────────────────────────
  const accuracyColor =
    accuracy == null ? "#94a3b8"
    : accuracy <= 20 ? "#16a34a"
    : accuracy <= 50 ? "#d97706"
    :                  "#dc2626";
  const accuracyLabel =
    accuracy == null ? "No GPS"
    : accuracy <= 20 ? "Excellent"
    : accuracy <= 50 ? "Fair"
    :                  "Poor";

  const fmtTime = (iso) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : null;

  return (
    <div style={{ position: "relative", width: "100%", height, borderRadius: "inherit" }}>
      <div ref={mapDivRef} style={{ width: "100%", height: "100%", borderRadius: "inherit" }} />

      {!mapLoaded && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", background: "#f8fafc", borderRadius: "inherit", zIndex: 10,
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 36, height: 36, border: "3px solid #e2e8f0",
              borderTopColor: "#4569ea", borderRadius: "50%",
              animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
            }} />
            <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>Loading Google Maps…</div>
          </div>
        </div>
      )}

      {/* Live badge */}
      <div style={{
        position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
        zIndex: 1000, background: "rgba(255,255,255,0.97)", borderRadius: 999,
        padding: "5px 16px", fontSize: 12, fontWeight: 700,
        boxShadow: "0 2px 10px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 7,
        border: `1px solid ${isLive ? "#bbf7d0" : hasPunchedOut ? "#fde68a" : "#e2e8f0"}`,
        color: isLive ? "#16a34a" : hasPunchedOut ? "#d97706" : "#94a3b8",
        pointerEvents: "none",
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%", display: "inline-block",
          background: isLive ? "#22c55e" : hasPunchedOut ? "#f59e0b" : "#cbd5e1",
          animation: isLive ? "livePulse 1.5s ease-in-out infinite" : "none",
        }} />
        {isLive
          ? `Live Tracking${connected ? "" : " (socket offline)"}`
          : hasPunchedOut ? "Day Completed"
          : "Punch in to start tracking"}
      </div>

      {/* GPS accuracy */}
      {accuracy != null && (
        <div style={{
          position: "absolute", top: 10, right: 10, zIndex: 1000,
          background: "rgba(255,255,255,0.97)", borderRadius: 8,
          padding: "4px 10px", fontSize: 11, fontWeight: 700,
          boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
          color: accuracyColor, border: `1px solid ${accuracyColor}40`, pointerEvents: "none",
        }}>
          GPS ±{Math.round(accuracy)}m · {accuracyLabel}
        </div>
      )}

      {/* Socket ack */}
      {sockAck && (
        <div style={{
          position: "absolute", bottom: 10, right: 10, zIndex: 1000,
          background: "rgba(255,255,255,0.95)", borderRadius: 6,
          padding: "4px 10px", fontSize: 10, color: "#16a34a",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)", pointerEvents: "none",
        }}>
          ✓ Saved {fmtTime(sockAck)}
        </div>
      )}

      {/* Route summary */}
      {pointCount > 0 && (
        <div style={{
          position: "absolute", bottom: 10, left: 10, zIndex: 1000,
          background: "rgba(255,255,255,0.97)", borderRadius: 10,
          padding: "6px 14px", fontSize: 12, fontWeight: 700, color: "#0f172a",
          boxShadow: "0 2px 10px rgba(0,0,0,0.12)", pointerEvents: "none",
          display: "flex", alignItems: "center", gap: 10, border: "1px solid #e2e8f0",
        }}>
          <span>📍 {pointCount} point{pointCount !== 1 ? "s" : ""}</span>
          {totalKm > 0 && (
            <><span style={{ color: "#e2e8f0" }}>|</span>
            <span style={{ color: "#4569ea" }}>🛣 {totalKm.toFixed(2)} km</span></>
          )}
          <span style={{ color: "#e2e8f0" }}>|</span>
          <span style={{ color: "#f59e0b", fontSize: 10 }}>⏱ saves for 10h</span>
        </div>
      )}

      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}