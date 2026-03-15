// components/LiveTrackingMap.jsx
// USER side — Leaflet map that tracks their own GPS trail.
// • Starts / stops tracking based on isPunchedIn prop
// • Sends live points via socket → location:update (admin sees instantly)
// • Flushes to REST /api/v1/location/track/bulk every 30 s (offline backup)
// • Loads today's existing trail from GET /api/v1/location/today on mount
// • locateTrigger prop: increment it from parent to fly+zoom to current GPS position

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  startTracking,
  stopTracking,
  getTrackPoints,
  isCurrentlyTracking,
} from "../utils/Locationtracker";
import { useSocket } from "../utils/Usesocket.js";

const API = "https://solar-backend-4bsb.onrender.com";
const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") || "";

// ── Fix Leaflet marker icons broken by Vite/Webpack ────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const greenIcon = new L.Icon({
  iconUrl:     "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:   "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize:    [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl:     "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:   "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize:    [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

// ── Smoothly pan map to latest GPS fix (used during live tracking) ──────────
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null)
      map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

// ── Fly AND zoom to current device GPS position when trigger increments ──────
// This is what the "Locate Me" button in MemberVisitHistory triggers.
// It always fetches a fresh GPS fix and flies to it at zoom level 17.
function FlyToCurrentLocation({ trigger }) {
  const map = useMap();
  useEffect(() => {
    if (!trigger) return;           // skip on initial mount (trigger starts at 0)
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo(
          [pos.coords.latitude, pos.coords.longitude],
          17,                       // zoom level 17 = street level, no manual zoom needed
          { duration: 1.5, easeLinearity: 0.25 }
        );
      },
      (err) => console.warn("[LocateMe] GPS error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [trigger]);                    // re-runs every time locateTrigger increments
  return null;
}

/**
 * LiveTrackingMap — USER side
 *
 * Props:
 *   isPunchedIn    {boolean}    true while user is on duty
 *   hasPunchedOut  {boolean}    true once user has ended the day
 *   userId         {string}     current user's _id (to load today's trail)
 *   height         {string}     CSS height  (default "400px")
 *   locateTrigger  {number}     increment this from the parent to fly+zoom to current location
 *   onPointsChange {Function}   optional callback(allPoints[])
 */
export default function LiveTrackingMap({
  isPunchedIn    = false,
  hasPunchedOut  = false,
  userId         = null,
  height         = "400px",
  locateTrigger  = 0,
  onPointsChange,
}) {
  const [points,   setPoints]   = useState([]); // [[lat, lng], ...]
  const [accuracy, setAccuracy] = useState(null);
  const [error,    setError]    = useState(null);
  const [sockAck,  setSockAck]  = useState(null);
  const { socket, connected }   = useSocket();
  const prevPunchedIn           = useRef(false);
  const prevPunchedOut          = useRef(false);

  // ── Load today's saved trail from DB on mount ──────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const fetchToday = async () => {
      try {
        const res = await fetch(
          `${API}/api/v1/location/today${userId ? `?salesmanId=${userId}` : ""}`,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        if (!res.ok) return;
        const data = await res.json();
        const pts  = data?.result || data?.data || [];
        if (pts.length) {
          setPoints(pts.map((p) => [p.lat, p.lng]));
        }
      } catch (e) {
        console.warn("[LiveTrackingMap] Could not load today's trail:", e.message);
      }
    };
    fetchToday();
  }, [userId]);

  // ── Start tracking when user punches in ────────────────────────────────────
  useEffect(() => {
    const wasIn  = prevPunchedIn.current;
    const wasOut = prevPunchedOut.current;
    prevPunchedIn.current  = isPunchedIn;
    prevPunchedOut.current = hasPunchedOut;

    // Just punched in
    if (isPunchedIn && !hasPunchedOut && !wasIn) {
      startTracking((allPts) => {
        const mapped = allPts.map((p) => [p.lat, p.lng]);
        setPoints(mapped);
        const last = allPts[allPts.length - 1];
        if (last) setAccuracy(last.accuracy);
        if (typeof onPointsChange === "function") onPointsChange(allPts);
      }, socket);
    }

    // Just punched out
    if (hasPunchedOut && !wasOut && isCurrentlyTracking()) {
      stopTracking();
    }
  }, [isPunchedIn, hasPunchedOut, socket]);

  // ── Poll local tracker every 5 s to keep map in sync ──────────────────────
  useEffect(() => {
    if (!isPunchedIn || hasPunchedOut) return;
    const t = setInterval(() => {
      const pts = getTrackPoints();
      if (pts.length) {
        setPoints(pts.map((p) => [p.lat, p.lng]));
        const last = pts[pts.length - 1];
        if (last) setAccuracy(last.accuracy);
      }
    }, 5_000);
    return () => clearInterval(t);
  }, [isPunchedIn, hasPunchedOut]);

  // ── Stop tracking if component unmounts while still active ─────────────────
  useEffect(() => {
    return () => {
      if (isCurrentlyTracking()) stopTracking();
    };
  }, []);

  // ── Listen for socket events from server ───────────────────────────────────
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

  // ── Derived values ─────────────────────────────────────────────────────────
  const defaultCenter = [20.2961, 85.8245]; // Bhubaneswar
  const lastPoint     = points.length ? points[points.length - 1] : null;
  const isLive        = isPunchedIn && !hasPunchedOut;

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

      {/* ── Live / Offline badge (top-center) ────────────────────────────── */}
      <div style={{
        position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
        zIndex: 1000, background: "rgba(255,255,255,0.97)",
        borderRadius: 999, padding: "4px 14px",
        fontSize: 12, fontWeight: 700,
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        display: "flex", alignItems: "center", gap: 6,
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
          : "Not Tracking — Punch in to start"}
      </div>

      {/* ── GPS accuracy badge (top-right) ───────────────────────────────── */}
      {accuracy != null && (
        <div style={{
          position: "absolute", top: 10, right: 10, zIndex: 1000,
          background: "rgba(255,255,255,0.97)", borderRadius: 8,
          padding: "4px 10px", fontSize: 11, fontWeight: 700,
          boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
          color: accuracyColor,
          border: `1px solid ${accuracyColor}40`,
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
          borderRadius: 8, padding: "8px 12px",
          fontSize: 12, color: "#dc2626",
        }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Points count (bottom-left) ───────────────────────────────────── */}
      {points.length > 0 && (
        <div style={{
          position: "absolute", bottom: 10, left: 10, zIndex: 1000,
          background: "rgba(255,255,255,0.95)", borderRadius: 8,
          padding: "5px 12px", fontSize: 12, fontWeight: 700, color: "#0f172a",
          boxShadow: "0 1px 6px rgba(0,0,0,0.1)", pointerEvents: "none",
        }}>
          {points.length} GPS point{points.length !== 1 ? "s" : ""} recorded today
        </div>
      )}

      {/* ── Map ──────────────────────────────────────────────────────────── */}
      <MapContainer
        center={lastPoint || defaultCenter}
        zoom={lastPoint ? 15 : 6}
        style={{ height: "100%", width: "100%", borderRadius: "inherit" }}
        zoomControl
      >
        {/* CartoDB Voyager — shows buildings, small lanes, footpaths, house detail */}
        <TileLayer
          attribution='\&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors \&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={20}
          subdomains="abcd"
        />

        {/* Keep map centered on latest point while live tracking */}
        {isLive && lastPoint && (
          <RecenterMap lat={lastPoint[0]} lng={lastPoint[1]} />
        )}

        {/* ── Locate Me — flies to current GPS + zooms to level 17 ───────── */}
        <FlyToCurrentLocation trigger={locateTrigger} />

        {/* Start marker — green */}
        {points.length > 0 && (
          <Marker position={points[0]} icon={greenIcon}>
            <Popup>
              <strong>Start Point</strong>
              <br />
              {points[0][0].toFixed(5)}, {points[0][1].toFixed(5)}
            </Popup>
          </Marker>
        )}

        {/* Current position — red (only if moved from start) */}
        {lastPoint && points.length > 1 && (
          <Marker position={lastPoint} icon={redIcon}>
            <Popup>
              <strong>{isLive ? "Current Location" : "Last Known Location"}</strong>
              <br />
              {lastPoint[0].toFixed(5)}, {lastPoint[1].toFixed(5)}
              {accuracy != null && <><br />Accuracy: ±{Math.round(accuracy)}m</>}
            </Popup>
          </Marker>
        )}

        {/* Red route polyline */}
        {points.length > 1 && (
          <Polyline positions={points} color="#ef4444" weight={4} opacity={0.85} />
        )}
      </MapContainer>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}