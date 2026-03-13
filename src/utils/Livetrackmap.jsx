// components/LiveTrackingMap.jsx
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import { useEffect, useState, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = ["token", "authToken", "accessToken"];
const getToken = () => TOKEN_KEY.map(k => localStorage.getItem(k)).find(Boolean) || "";

// ✅ FIX: MapContainer's `center` prop is NOT reactive after first render.
//         This child component calls map.setView() whenever the latest point changes.
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

export default function LiveTrackingMap() {
  const [points, setPoints] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const sendPoint = (lat, lng) => {
      const token = getToken();
      fetch(`${API}/api/v1/location/point`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ lat, lng, time: new Date().toISOString() }),
      }).catch((err) => console.warn("Failed to send location point:", err));
    };

    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          setPoints((prev) => {
            // Skip duplicate points (< 15 s apart handled server-side,
            // but avoid spamming the state with zero-movement updates)
            const last = prev[prev.length - 1];
            if (
              last &&
              Math.abs(last[0] - lat) < 0.00005 &&
              Math.abs(last[1] - lng) < 0.00005
            ) {
              return prev;
            }
            return [...prev, [lat, lng]];
          });

          sendPoint(lat, lng);
        },
        (err) => console.warn("GPS error:", err.message),
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
      );
    }, 30_000); // poll every 30 s

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Default center: India
  const defaultCenter = [20.2961, 85.8245];
  const lastPoint     = points.length ? points[points.length - 1] : null;

  return (
    <MapContainer
      center={lastPoint || defaultCenter}
      zoom={15}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* ✅ Keeps map centered on latest position */}
      {lastPoint && <RecenterMap lat={lastPoint[0]} lng={lastPoint[1]} />}

      {/* Start marker — green */}
      {points.length > 0 && (
        <Marker position={points[0]} />
      )}

      {/* Current position marker */}
      {lastPoint && points.length > 1 && (
        <Marker position={lastPoint} />
      )}

      {/* Red route polyline */}
      {points.length > 1 && (
        <Polyline positions={points} color="red" weight={4} opacity={0.8} />
      )}
    </MapContainer>
  );
}