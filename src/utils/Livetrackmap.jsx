// utils/LiveTrackingMap.jsx
// USER side — Google Maps showing the GPS red trail after punch-in.
// NO LEAFLET — pure Google Maps JavaScript API.
//
// HOW IT WORKS:
//   • On mount → loads today's saved red marks from DB (10h TTL window)
//   • On punch-in → starts GPS tracking, draws live red trail on map
//   • Every new GPS point → red dot + extends red polyline on map
//   • On punch-out → stops tracking, reloads final trail from DB
//   • Admin can see full red trail any time within the 10-hour window
//   • locateTrigger prop → flies map to current device GPS position

import { useEffect, useRef, useState } from "react";
import {
  startTracking,
  stopTracking,
  getTrackPoints,
  isCurrentlyTracking,
} from "./Locationtracker";
import { useSocket } from "./Usesocket.js";

const API    = import.meta.env.VITE_API_URL || "https://solar-backend-4bsb.onrender.com";
const GKEY   = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyCqM7uF9c0ZMQjdssHqSMJJ3mBcmz5RNS0";
const TTL_MS = 10 * 60 * 60 * 1000; // 10 hours — matches backend TTL

const getToken = () =>
  localStorage.getItem("token")      ||
  localStorage.getItem("authToken")  ||
  localStorage.getItem("accessToken") || "";

// ── Load Google Maps script once (singleton) ──────────────────────────────────
let gmapsPromise = null;
function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve();
  if (gmapsPromise) return gmapsPromise;
  gmapsPromise = new Promise((resolve, reject) => {
    const script   = document.createElement("script");
    script.src     = `https://maps.googleapis.com/maps/api/js?key=${GKEY}`;
    script.async   = true;
    script.onload  = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return gmapsPromise;
}

/**
 * LiveTrackingMap — Google Maps version
 *
 * Props:
 *   isPunchedIn    {boolean}  true while user is on duty
 *   hasPunchedOut  {boolean}  true once user ended the day
 *   userId         {string}   user's _id (to load today's red trail from DB)
 *   height         {string}   CSS height (default "400px")
 *   locateTrigger  {number}   increment to fly map to current GPS position
 *   onPointsChange {Function} optional callback(allPoints[]) on each new point
 */
export default function LiveTrackingMap({
  isPunchedIn    = false,
  hasPunchedOut  = false,
  userId         = null,
  height         = "400px",
  locateTrigger  = 0,
  onPointsChange,
}) {
  const mapDivRef   = useRef(null);  // DOM div for Google Map
  const gMapRef     = useRef(null);  // google.maps.Map instance
  const polyRef     = useRef(null);  // red Polyline
  const startMarker = useRef(null);  // green start marker
  const liveMarker  = useRef(null);  // red pulsing current-position marker
  const dotsRef     = useRef([]);    // intermediate red CircleMarkers (dots)
  const savedPtsRef = useRef([]);    // { lat, lng }[] loaded from DB
  const mapReady    = useRef(false);

  const [mapLoaded,  setMapLoaded]  = useState(false);
  const [accuracy,   setAccuracy]   = useState(null);
  const [sockAck,    setSockAck]    = useState(null);
  const [error,      setError]      = useState(null);
  const [totalKm,    setTotalKm]    = useState(0);
  const [pointCount, setPointCount] = useState(0);

  const prevPunchedIn  = useRef(false);
  const prevPunchedOut = useRef(false);

  const { socket, connected } = useSocket();

  const isLive = isPunchedIn && !hasPunchedOut;

  // ── Initialize Google Map ────────────────────────────────────────────────────
  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        if (!mapDivRef.current || gMapRef.current) return;

        const map = new window.google.maps.Map(mapDivRef.current, {
          center:           { lat: 20.2961, lng: 85.8245 }, // Bhubaneswar default
          zoom:             6,
          mapTypeId:        "roadmap",
          disableDefaultUI: false,
          zoomControl:      true,
          streetViewControl: false,
          mapTypeControl:   true,
          fullscreenControl: false,
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
          ],
        });

        gMapRef.current = map;
        mapReady.current = true;
        setMapLoaded(true);
      })
      .catch((e) => {
        console.error("[LiveTrackingMap] Google Maps load failed:", e);
        setError("Google Maps failed to load. Check your API key.");
      });
  }, []);

  // ── Helper: draw full trail on Google Map ────────────────────────────────────
  // Called whenever points change (new live point or DB reload).
  function drawTrail(points) {
    if (!gMapRef.current || !mapReady.current) return;
    const G = window.google.maps;

    // ── Red polyline ──────────────────────────────────────────────────────────
    if (polyRef.current) {
      polyRef.current.setMap(null);
    }
    if (points.length >= 2) {
      polyRef.current = new G.Polyline({
        path:          points.map(p => ({ lat: p.lat, lng: p.lng })),
        geodesic:      true,
        strokeColor:   "#ef4444",   // red
        strokeOpacity: 0.9,
        strokeWeight:  4,
        map:           gMapRef.current,
        // Direction arrows on the trail
        icons: [{
          icon: {
            path:        G.SymbolPath.FORWARD_CLOSED_ARROW,
            scale:       3,
            strokeColor: "#ef4444",
            fillColor:   "#ef4444",
            fillOpacity: 1,
          },
          offset: "50%",
          repeat: "100px",
        }],
      });
    }

    // ── Green start marker ────────────────────────────────────────────────────
    if (startMarker.current) startMarker.current.setMap(null);
    if (points.length > 0) {
      startMarker.current = new G.Marker({
        position: { lat: points[0].lat, lng: points[0].lng },
        map:      gMapRef.current,
        title:    "Start",
        zIndex:   10,
        icon: {
          path:        G.SymbolPath.CIRCLE,
          scale:       10,
          fillColor:   "#22c55e",   // green
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
    }

    // ── Intermediate red dots (every 4th point) ───────────────────────────────
    // These are the individual "red marks" the admin sees on the trail.
    dotsRef.current.forEach(d => d.setMap(null));
    dotsRef.current = [];
    points.forEach((pt, i) => {
      if (i === 0 || i === points.length - 1) return; // skip start & end
      if (i % 4 !== 0) return; // every 4th point
      const dot = new G.Marker({
        position: { lat: pt.lat, lng: pt.lng },
        map:      gMapRef.current,
        zIndex:   5,
        icon: {
          path:        G.SymbolPath.CIRCLE,
          scale:       5,
          fillColor:   "#ef4444",
          fillOpacity: 0.85,
          strokeColor: "#ffffff",
          strokeWeight: 1,
        },
      });
      dotsRef.current.push(dot);
    });

    // ── Live pulsing marker (current position) ────────────────────────────────
    if (liveMarker.current) liveMarker.current.setMap(null);
    const last = points[points.length - 1];
    if (last && isLive) {
      liveMarker.current = new G.Marker({
        position: { lat: last.lat, lng: last.lng },
        map:      gMapRef.current,
        title:    "Current Location",
        zIndex:   20,
        icon: {
          path:        G.SymbolPath.CIRCLE,
          scale:       10,
          fillColor:   "#ef4444",
          fillOpacity: 1,
          strokeColor: "rgba(239,68,68,0.4)",
          strokeWeight: 12,
        },
      });

      // Show info window briefly
      const info = new G.InfoWindow({
        content:        `<div style="font-family:sans-serif;font-size:12px;font-weight:700;color:#0f172a;padding:2px 6px">📍 Current Location</div>`,
        disableAutoPan: true,
      });
      info.open(gMapRef.current, liveMarker.current);
      setTimeout(() => info.close(), 3000);
    }

    // ── Fit map bounds to show all points ─────────────────────────────────────
    if (points.length >= 2) {
      const bounds = new G.LatLngBounds();
      points.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      gMapRef.current.fitBounds(bounds, { top: 60, bottom: 40, left: 40, right: 40 });
    } else if (points.length === 1) {
      gMapRef.current.setCenter({ lat: points[0].lat, lng: points[0].lng });
      gMapRef.current.setZoom(16);
    }

    setPointCount(points.length);
  }

  // ── Helper: clean trail points (remove expired + bad GPS) ────────────────────
  function cleanPoints(raw) {
    const now     = Date.now();
    const cleaned = [];

    for (const p of raw) {
      if (!p.lat || !p.lng) continue;
      if (p.accuracy && p.accuracy > 500) continue;

      // Skip points older than 10 hours (matches backend TTL)
      const ptTime = p.recordedAt || p.time || p.createdAt || p.timestamp;
      if (ptTime && now - new Date(ptTime).getTime() > TTL_MS) continue;

      // Skip impossible GPS jumps > 5 km
      if (cleaned.length > 0) {
        const prev   = cleaned[cleaned.length - 1];
        const R      = 6371;
        const dLat   = ((p.lat - prev.lat) * Math.PI) / 180;
        const dLng   = ((p.lng - prev.lng) * Math.PI) / 180;
        const a      = Math.sin(dLat/2)**2 + Math.cos(prev.lat*Math.PI/180)*Math.cos(p.lat*Math.PI/180)*Math.sin(dLng/2)**2;
        const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        if (distKm > 5) continue;
      }

      cleaned.push({ lat: p.lat, lng: p.lng });
    }

    return cleaned;
  }

  // ── Fetch total km from backend ───────────────────────────────────────────────
  async function fetchTotalKm() {
    if (!userId) return;
    try {
      const res = await fetch(
        `${API}/api/v1/location/distance?salesmanId=${userId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (!res.ok) return;
      const data = await res.json();
      const km   = data?.data?.totalKm ?? data?.result?.totalKm ?? data?.totalKm ?? 0;
      setTotalKm(Math.round(km * 100) / 100);
    } catch { /* non-fatal */ }
  }

  // ── Load saved red trail from DB on mount ─────────────────────────────────────
  // Uses 10-hour window to exactly match the backend TTL.
  useEffect(() => {
    if (!userId || !mapLoaded) return;

    const fetchTrail = async () => {
      try {
        const now   = new Date();
        const since = new Date(now.getTime() - TTL_MS); // 10h window

        const url = `${API}/api/v1/location/today?salesmanId=${userId}&startTime=${since.toISOString()}&endTime=${now.toISOString()}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
        if (!res.ok) return;

        const data = await res.json();
        const raw  = data?.result || data?.data || data?.points || [];
        if (!raw.length) return;

        const cleaned = cleanPoints(raw);
        savedPtsRef.current = cleaned;
        drawTrail(cleaned);
        //console.log(`[LiveTrackingMap] ✅ Loaded ${cleaned.length} red marks from DB`);

        await fetchTotalKm();
      } catch (e) {
        console.warn("[LiveTrackingMap] Trail load failed:", e.message);
      }
    };

    fetchTrail();
  }, [userId, mapLoaded]);

  // ── Start / stop tracking on punch-in / punch-out ────────────────────────────
  useEffect(() => {
    if (!mapLoaded) return;

    const wasIn  = prevPunchedIn.current;
    const wasOut = prevPunchedOut.current;
    prevPunchedIn.current  = isPunchedIn;
    prevPunchedOut.current = hasPunchedOut;

    // Just punched in — start GPS tracking
    if (isPunchedIn && !hasPunchedOut && !wasIn) {
      startTracking((allPts) => {
        // Merge saved DB trail + new live points → continuous red line
        const livePts = allPts.map(p => ({ lat: p.lat, lng: p.lng }));
        const merged  = [...savedPtsRef.current, ...livePts];

        // Deduplicate adjacent identical points
        const deduped = merged.filter((pt, i) =>
          i === 0 || pt.lat !== merged[i-1].lat || pt.lng !== merged[i-1].lng
        );

        drawTrail(deduped);

        const last = allPts[allPts.length - 1];
        if (last) setAccuracy(last.accuracy);

        // Live running km calculation
        let liveKm = 0;
        for (let i = 1; i < allPts.length; i++) {
          const p  = allPts[i], pr = allPts[i-1];
          const R  = 6371;
          const dL = ((p.lat - pr.lat) * Math.PI) / 180;
          const dG = ((p.lng - pr.lng) * Math.PI) / 180;
          const a  = Math.sin(dL/2)**2 + Math.cos(pr.lat*Math.PI/180)*Math.cos(p.lat*Math.PI/180)*Math.sin(dG/2)**2;
          const d  = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          if (d <= 5) liveKm += d;
        }
        setTotalKm(Math.round(liveKm * 100) / 100);

        if (typeof onPointsChange === "function") onPointsChange(allPts);
      }, socket);
    }

    // Just punched out — stop tracking, reload final trail from DB
    if (hasPunchedOut && !wasOut) {
      if (isCurrentlyTracking()) stopTracking();

      // Wait 2s for final flush to reach DB
      setTimeout(async () => {
        if (!userId) return;
        try {
          const now   = new Date();
          const since = new Date(now.getTime() - TTL_MS);
          const url   = `${API}/api/v1/location/today?salesmanId=${userId}&startTime=${since.toISOString()}&endTime=${now.toISOString()}`;
          const res   = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
          if (!res.ok) return;

          const data    = await res.json();
          const raw     = data?.result || data?.data || data?.points || [];
          const cleaned = cleanPoints(raw);

          if (cleaned.length) {
            savedPtsRef.current = cleaned;
            drawTrail(cleaned);
            //console.log(`[LiveTrackingMap] ✅ Reloaded ${cleaned.length} red marks after punch-out`);
          }

          await fetchTotalKm();
        } catch (e) {
          console.warn("[LiveTrackingMap] Reload after punch-out failed:", e.message);
        }
      }, 2000);
    }
  }, [isPunchedIn, hasPunchedOut, socket, mapLoaded]);

  // ── Poll local tracker every 5s during live tracking ─────────────────────────
  useEffect(() => {
    if (!isPunchedIn || hasPunchedOut || !mapLoaded) return;
    const t = setInterval(() => {
      const pts = getTrackPoints();
      if (!pts.length) return;

      const livePts = pts.map(p => ({ lat: p.lat, lng: p.lng }));
      const merged  = [...savedPtsRef.current, ...livePts];
      const deduped = merged.filter((pt, i) =>
        i === 0 || pt.lat !== merged[i-1].lat || pt.lng !== merged[i-1].lng
      );
      drawTrail(deduped);

      const last = pts[pts.length - 1];
      if (last) setAccuracy(last.accuracy);
    }, 5_000);
    return () => clearInterval(t);
  }, [isPunchedIn, hasPunchedOut, mapLoaded]);

  // ── Stop tracking on unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => { if (isCurrentlyTracking()) stopTracking(); };
  }, []);

  // ── Socket events ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const onAck   = (data) => setSockAck(data.timestamp);
    const onError = (data) => setError(data.message);
    socket.on("location:ack",   onAck);
    socket.on("location:error", onError);
    return () => {
      socket.off("location:ack",   onAck);
      socket.off("location:error", onError);
    };
  }, [socket]);

  // ── Locate Me — fly map to current device GPS ─────────────────────────────────
  useEffect(() => {
    if (!locateTrigger || !gMapRef.current) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        gMapRef.current.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        gMapRef.current.setZoom(17);
      },
      (err) => console.warn("[LocateMe] GPS error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [locateTrigger]);

  // ── Accuracy helpers ──────────────────────────────────────────────────────────
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
    iso
      ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      : null;

  return (
    <div style={{ position: "relative", width: "100%", height, borderRadius: "inherit" }}>

      {/* ── Map container ─────────────────────────────────────────────────── */}
      <div
        ref={mapDivRef}
        style={{ width: "100%", height: "100%", borderRadius: "inherit" }}
      />

      {/* ── Loading overlay ───────────────────────────────────────────────── */}
      {!mapLoaded && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", background: "#f8fafc", borderRadius: "inherit",
          zIndex: 10,
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 36, height: 36, border: "3px solid #e2e8f0",
              borderTopColor: "#4569ea", borderRadius: "50%",
              animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
            }} />
            <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>
              Loading Google Maps…
            </div>
          </div>
        </div>
      )}

      {/* ── Live / status badge (top-center) ─────────────────────────────── */}
      <div style={{
        position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
        zIndex: 1000, background: "rgba(255,255,255,0.97)",
        borderRadius: 999, padding: "5px 16px",
        fontSize: 12, fontWeight: 700,
        boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
        display: "flex", alignItems: "center", gap: 7,
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
          : hasPunchedOut
          ? "Day Completed"
          : "Punch in to start tracking"}
      </div>

      {/* ── GPS accuracy (top-right) ──────────────────────────────────────── */}
      {accuracy != null && (
        <div style={{
          position: "absolute", top: 10, right: 10, zIndex: 1000,
          background: "rgba(255,255,255,0.97)", borderRadius: 8,
          padding: "4px 10px", fontSize: 11, fontWeight: 700,
          boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
          color: accuracyColor, border: `1px solid ${accuracyColor}40`,
          pointerEvents: "none",
        }}>
          GPS ±{Math.round(accuracy)}m · {accuracyLabel}
        </div>
      )}

      {/* ── Socket ack (bottom-right) ─────────────────────────────────────── */}
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

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          position: "absolute", bottom: 40, left: 10, right: 10, zIndex: 1000,
          background: "#fee2e2", border: "1px solid #fecaca",
          borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#dc2626",
        }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Route summary (bottom-left) ───────────────────────────────────── */}
      {pointCount > 0 && (
        <div style={{
          position: "absolute", bottom: 10, left: 10, zIndex: 1000,
          background: "rgba(255,255,255,0.97)", borderRadius: 10,
          padding: "6px 14px", fontSize: 12, fontWeight: 700, color: "#0f172a",
          boxShadow: "0 2px 10px rgba(0,0,0,0.12)", pointerEvents: "none",
          display: "flex", alignItems: "center", gap: 10,
          border: "1px solid #e2e8f0",
        }}>
          <span>📍 {pointCount} red mark{pointCount !== 1 ? "s" : ""}</span>
          {totalKm > 0 && (
            <>
              <span style={{ color: "#e2e8f0" }}>|</span>
              <span style={{ color: "#4569ea" }}>🛣 {totalKm.toFixed(2)} km</span>
            </>
          )}
          <span style={{ color: "#e2e8f0" }}>|</span>
          <span style={{ color: "#f59e0b", fontSize: 10 }}>⏱ saves for 10h</span>
        </div>
      )}

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}