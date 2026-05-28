// utils/LiveTrackingMap.jsx
//
// FIXES applied
// ─────────────────────────────────────────────────────────────────────────────
// 1. useSocket() now destructures socketRef (stable React ref) in addition to
//    socket and connected. socketRef is passed to startTracking() so the tracker
//    always reads the live socket, even after a reconnect.
//
// 2. startTracking(callback, socketRef, userId) — was passing `socket` (raw,
//    potentially stale). Now passes socketRef so safeEmit() in Locationtracker
//    reads socketRef.current on every emit.
//
// 3. All other logic (geofence, drawing manager, trail, markers) is unchanged.

import { useEffect, useRef, useState, useCallback } from "react";
import {
  startTracking,
  stopTracking,
  getTrackPoints,
  isCurrentlyTracking,
} from "./Locationtracker";
import { useSocket } from "./Usesocket.js";
import { toast } from "../components/useToast.jsx";

const API  = "https://solamio-backend.onrender.com";
const GKEY = "AIzaSyCqM7uF9c0ZMQjdssHqSMJJ3mBcmz5RNS0";

const MIN_MOVE_METRES = 35;
const SNAP_TO_ROADS_MAX_POINTS = 100;
const SNAP_TO_ROADS_MAX_GAP_METRES = 300;
const ROUTE_BRIDGE_MAX_GAP_METRES = 5000;
const DIRECTIONS_MAX_WAYPOINTS = 23;

function getGpsNoiseRadiusMetres(currentAccuracy = 0, previousAccuracy = 0) {
  const current = Number(currentAccuracy) || 0;
  const previous = Number(previousAccuracy) || 0;
  return Math.max(35, Math.max(current, previous) * 1.1);
}

function getEffectiveMoveThreshold(currentAccuracy = 0, previousAccuracy = 0) {
  const current = Number(currentAccuracy) || 0;
  const previous = Number(previousAccuracy) || 0;
  const maxAccuracy = Math.max(current, previous);

  return Math.min(
    90,
    Math.max(
      MIN_MOVE_METRES,
      (current + previous) * 0.75,
      maxAccuracy * 1.2
    )
  );
}

const getToken = () =>
  localStorage.getItem("token")       ||
  localStorage.getItem("authToken")   ||
  localStorage.getItem("accessToken") || "";

function calcKm(points) {
  if (!points || points.length < 2) return 0;
  const R = 6371;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dLat = ((curr.lat - prev.lat) * Math.PI) / 180;
    const dLng = ((curr.lng - prev.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((prev.lat * Math.PI) / 180) *
      Math.cos((curr.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return Math.round(total * 1000) / 1000;
}

function calcFilteredKm(points) {
  if (!points || points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const distM = distMetres(prev.lat, prev.lng, curr.lat, curr.lng);
    const requiredMove = getEffectiveMoveThreshold(curr.accuracy, prev.accuracy);
    const gpsNoiseRadius = getGpsNoiseRadiusMetres(curr.accuracy, prev.accuracy);
    if (distM >= requiredMove && distM >= gpsNoiseRadius) total += distM / 1000;
  }
  return Math.round(total * 1000) / 1000;
}

function hasConfirmedMovement(points) {
  if (!Array.isArray(points) || points.length < 2) return false;

   let significantSegments = 0;
   let travelledMetres = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const distM = distMetres(prev.lat, prev.lng, curr.lat, curr.lng);
    const minMoveRequired = getEffectiveMoveThreshold(curr.accuracy, prev.accuracy);
    const gpsNoiseRadius = getGpsNoiseRadiusMetres(curr.accuracy, prev.accuracy);
    if (distM >= minMoveRequired && distM >= gpsNoiseRadius) {
      significantSegments += 1;
      travelledMetres += distM;
    }
  }

  return significantSegments >= 2 || travelledMetres >= 80;
}

function distMetres(lat1, lng1, lat2, lng2) {
  return calcKm([{ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 }]) * 1000;
}

let gmapsPromise = null;
function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve();
  if (gmapsPromise) return gmapsPromise;
  gmapsPromise = new Promise((resolve, reject) => {
    const s   = document.createElement("script");
    s.src     = `https://maps.googleapis.com/maps/api/js?key=${GKEY}&libraries=drawing`;
    s.async   = true;
    s.onload  = resolve;
    s.onerror = () => reject(new Error("Google Maps failed to load. Check your API key."));
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
  onDistanceChange,
  isOwner         = true,
  punchInLocation = null,
  selectedDate    = null, 
  visits          = [],
  
}) {
  const mapDivRef  = useRef(null);
  const gMapRef    = useRef(null);
  const polyRef    = useRef({ casing: null, main: null });
  const startMkRef = useRef(null);
  const liveMkRef  = useRef(null);
  const dotsRef    = useRef([]);
  const auditPolyRef = useRef([]);
  const auditPathCacheRef = useRef({});
  const auditDrawSeqRef = useRef(0);
  const allPtsRef  = useRef([]);
  const snappedTrailCacheRef = useRef({ key: "", path: [] });
  const drawRequestSeqRef = useRef(0);
const visitMkRef = useRef([]);
  const userAdjustedViewportRef = useRef(false);
  const suppressViewportEventsRef = useRef(false);
  const [mapLoaded,  setMapLoaded]  = useState(false);
  const [accuracy,   setAccuracy]   = useState(null);
  const [sockAck,    setSockAck]    = useState(null);
  const [totalKm,    setTotalKm]    = useState(0);
  const [pointCount, setPointCount] = useState(0);
  const [verifiedDistance, setVerifiedDistance] = useState(null);

  const prevPunchedIn  = useRef(false);
  const prevPunchedOut = useRef(false);

  // ✅ FIX: destructure socketRef — a stable ref that always points to the live socket
  const { socket, socketRef, connected } = useSocket();

  const [geofences,      setGeofences]      = useState([]);
  const [geofenceAlerts, setGeofenceAlerts] = useState([]);
  const fenceLayersRef = useRef({});
  const drawingMgrRef  = useRef(null);

  const isLive = isPunchedIn && !hasPunchedOut;
  const isTodaySelected =
    !selectedDate || selectedDate === new Date().toISOString().split("T")[0];

  const updateDistanceStats = useCallback((km, points = 0) => {
    const normalizedKm = Number.isFinite(Number(km)) ? Number(km) : 0;
    const normalizedPoints = Number.isFinite(Number(points)) ? Number(points) : 0;
    setTotalKm(normalizedKm);
    setPointCount(normalizedPoints);
    if (typeof onDistanceChange === "function") {
      onDistanceChange({ totalKm: normalizedKm, totalPoints: normalizedPoints });
    }
  }, [onDistanceChange]);

  const withProgrammaticViewport = useCallback((fn) => {
    suppressViewportEventsRef.current = true;
    fn();
    window.setTimeout(() => {
      suppressViewportEventsRef.current = false;
    }, 0);
  }, []);

  // ── Init Google Map ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        if (!mapDivRef.current || gMapRef.current) return;
        gMapRef.current = new window.google.maps.Map(mapDivRef.current, {
          center:            { lat: 20.2961, lng: 85.8245 },
          zoom:              13,
          mapTypeId:         "roadmap",
          zoomControl:       true,
          streetViewControl: false,
          mapTypeControl:    true,
          fullscreenControl: false,
          styles: [{
            featureType: "poi",
            elementType: "labels",
            stylers:     [{ visibility: "off" }],
          }],
        });

        gMapRef.current.addListener("dragstart", () => {
          if (!suppressViewportEventsRef.current) userAdjustedViewportRef.current = true;
        });
        gMapRef.current.addListener("zoom_changed", () => {
          if (!suppressViewportEventsRef.current) userAdjustedViewportRef.current = true;
        });
        setMapLoaded(true);
      })
      .catch((err) => toast.error(err.message, { title: "Map Failed to Load" }));
  }, []);

  // ── Place green punch-in marker ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !punchInLocation?.lat || !punchInLocation?.lng) return;
    if (!gMapRef.current || !window.google?.maps) return;

    const G   = window.google.maps;
    const map = gMapRef.current;
    const pos = { lat: punchInLocation.lat, lng: punchInLocation.lng };

    if (!userAdjustedViewportRef.current) {
      withProgrammaticViewport(() => {
        map.setCenter(pos);
        map.setZoom(15);
      });
    }

    if (!startMkRef.current) {
      startMkRef.current = new G.Marker({
        position: pos,
        map,
        title:  "Punch-in Location",
        zIndex: 10,
        icon: {
          path:         G.SymbolPath.CIRCLE,
          scale:        10,
          fillColor:    "#2563eb",
          fillOpacity:  1,
          strokeColor:  "#ffffff",
          strokeWeight: 3,
        },
      });
    } else {
      startMkRef.current.setPosition(pos);
    }

    console.log(`[PunchIn] ✅ Marker placed at ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`);
  }, [mapLoaded, punchInLocation]);

 // ── Draw visit markers ──────────────────────────────────────────────────────
useEffect(() => {
  if (!mapLoaded || !window.google?.maps) return;
  const G   = window.google.maps;
  const map = gMapRef.current;

  // Clear old visit markers
  visitMkRef.current.forEach((m) => m.setMap(null));
  visitMkRef.current = [];

  visits.forEach((v, i) => {
    if ((v.locationName || "").trim().toLowerCase() === "start location") return;

    const lat = Number(
      v.coordinates?.lat ??
      v.location?.lat ??
      v.location?.latitude ??
      v.lat ??
      v.latitude
    );
    const lng = Number(
      v.coordinates?.lng ??
      v.coordinates?.longitude ??
      v.location?.lng ??
      v.location?.longitude ??
      v.lng ??
      v.longitude
    );
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const isInProgress = v.status === "InProgress";
    const isAutoStop = v.autoDetected || v.status === "Auto Stop";
    const fillColor = isAutoStop ? "#0ea5e9" : isInProgress ? "#22c55e" : "#4569ea";
    const label        = v.locationName || `Stop ${i + 1}`;

    // Custom SVG store pin
    const svgPin = `
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.25)"/>
          </filter>
        </defs>
        <!-- Pin body -->
        <path d="M18 0C10.268 0 4 6.268 4 14c0 9.941 14 28 14 28S32 23.941 32 14C32 6.268 25.732 0 18 0z"
              fill="${fillColor}" filter="url(#shadow)"/>
        <!-- White circle inside -->
        <circle cx="18" cy="14" r="8" fill="white"/>
        <!-- Store icon (simplified) -->
        <rect x="12" y="11" width="12" height="8" rx="1" fill="${fillColor}"/>
        <rect x="14" y="14" width="3" height="5" fill="white"/>
        <rect x="19" y="14" width="3" height="5" fill="white"/>
        <path d="M11 11 L18 8 L25 11" stroke="${fillColor}" stroke-width="1.5" fill="none"/>
      </svg>`;

    const marker = new G.Marker({
      position: { lat, lng },
      map,
      title:  label,
      zIndex: 30,
      icon: {
        url:    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgPin)}`,
        size:         new G.Size(36, 44),
        anchor:       new G.Point(18, 44),
        scaledSize:   new G.Size(36, 44),
      },
      animation: G.Animation.DROP,
    });

    // Info window on click
    const infoWindow = new G.InfoWindow({
      content: `
        <div style="font-family:'Inter',sans-serif;padding:8px 10px;min-width:160px">
          <div style="font-weight:700;font-size:13px;color:#0f172a;margin-bottom:4px">
            ${label}
          </div>
          ${v.address
            ? `<div style="font-size:11px;color:#64748b;margin-bottom:4px">
                📍 ${typeof v.address === "string" ? v.address : v.address?.full || v.address?.short || ""}
               </div>`
            : ""}
          ${v.checkInTime
            ? `<div style="font-size:11px;color:#94a3b8">
                🕐 ${new Date(v.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
               </div>`
            : ""}
          <div style="margin-top:5px;display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;
                background:${isInProgress ? "rgba(34,197,94,0.1)" : "rgba(69,105,234,0.1)"};
                color:${fillColor}">
            ${isAutoStop ? `Stopped ${v.dwellMinutes || 15} min` : isInProgress ? "In Progress" : v.status || "Visited"}
          </div>
        </div>`,
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });

    visitMkRef.current.push(marker);
  });
}, [mapLoaded, visits]);
  

  // ── Drawing Manager ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || isOwner || !window.google?.maps?.drawing) return;

    const G   = window.google.maps;
    const map = gMapRef.current;

    const dm = new G.drawing.DrawingManager({
      drawingMode:    null,
      drawingControl: true,
      drawingControlOptions: {
        position:     G.ControlPosition.TOP_RIGHT,
        drawingModes: [G.drawing.OverlayType.CIRCLE, G.drawing.OverlayType.POLYGON],
      },
      circleOptions: {
        strokeColor:   "#FF6B35",
        strokeWeight:  2,
        fillColor:     "#FF6B35",
        fillOpacity:   0.12,
        editable:      true,
      },
      polygonOptions: {
        strokeColor:   "#FF6B35",
        strokeWeight:  2,
        fillColor:     "#FF6B35",
        fillOpacity:   0.12,
        editable:      true,
      },
    });

    dm.setMap(map);
    drawingMgrRef.current = dm;

    G.event.addListener(dm, "circlecomplete", async (circle) => {
      dm.setDrawingMode(null);
      const name = window.prompt("Name this geofence:");
      if (!name) { circle.setMap(null); return; }

      const payload = {
        name,
        type:   "circle",
        center: { lat: circle.getCenter().lat(), lng: circle.getCenter().lng() },
        radius: circle.getRadius(),
      };

      try {
        const res  = await fetch(`${API}/api/v1/location/geofences`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body:    JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          fenceLayersRef.current[data.data._id] = circle;
          setGeofences((prev) => [...prev, data.data]);
          toast.success(`Geofence "${name}" saved.`);
        }
      } catch {
        circle.setMap(null);
        toast.error("Failed to save geofence.");
      }
    });

    G.event.addListener(dm, "polygoncomplete", async (polygon) => {
      dm.setDrawingMode(null);
      const name = window.prompt("Name this geofence:");
      if (!name) { polygon.setMap(null); return; }

      const coords = polygon.getPath().getArray().map((ll) => ({ lat: ll.lat(), lng: ll.lng() }));

      try {
        const res  = await fetch(`${API}/api/v1/location/geofences`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body:    JSON.stringify({ name, type: "polygon", coordinates: coords }),
        });
        const data = await res.json();
        if (data.success) {
          fenceLayersRef.current[data.data._id] = polygon;
          setGeofences((prev) => [...prev, data.data]);
          toast.success(`Geofence "${name}" saved.`);
        }
      } catch {
        polygon.setMap(null);
        toast.error("Failed to save geofence.");
      }
    });

    return () => {
      if (drawingMgrRef.current) {
        drawingMgrRef.current.setMap(null);
        drawingMgrRef.current = null;
      }
    };
  }, [mapLoaded, isOwner]);

  // ── drawTrail ───────────────────────────────────────────────────────────────
  function buildSnapBatchKey(points) {
    return points
      .map((p) => `${Number(p.lat).toFixed(6)},${Number(p.lng).toFixed(6)}`)
      .join("|");
  }

  async function fetchSnappedBatch(batch) {
    if (!Array.isArray(batch) || batch.length < 2) {
      return batch.map((point) => ({ lat: point.lat, lng: point.lng }));
    }

    const path = batch
      .map((point) => `${Number(point.lat).toFixed(6)},${Number(point.lng).toFixed(6)}`)
      .join("|");

    const url =
      `https://roads.googleapis.com/v1/snapToRoads?interpolate=true&path=${encodeURIComponent(path)}&key=${GKEY}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Snap to Roads failed with status ${res.status}`);
    }

    const data = await res.json();
    const snapped = Array.isArray(data?.snappedPoints)
      ? data.snappedPoints
          .map((point) => ({
            lat: Number(point?.location?.latitude),
            lng: Number(point?.location?.longitude),
          }))
          .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
      : [];

    return snapped.length
      ? snapped
      : batch.map((point) => ({ lat: point.lat, lng: point.lng }));
  }

  async function fetchRoadBridge(from, to) {
    if (!window.google?.maps?.DirectionsService) return [];
    if (!from || !to) return [];

    const gapMetres = distMetres(from.lat, from.lng, to.lat, to.lng);
    if (gapMetres < 35 || gapMetres > ROUTE_BRIDGE_MAX_GAP_METRES) return [];

    const service = new window.google.maps.DirectionsService();

    try {
      const result = await service.route({
        origin: { lat: from.lat, lng: from.lng },
        destination: { lat: to.lat, lng: to.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      });

      const overviewPath = Array.isArray(result?.routes?.[0]?.overview_path)
        ? result.routes[0].overview_path
        : [];

      return overviewPath
        .map((point) => ({
          lat: Number(typeof point?.lat === "function" ? point.lat() : point?.lat),
          lng: Number(typeof point?.lng === "function" ? point.lng() : point?.lng),
        }))
        .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
    } catch (error) {
      console.warn("[DirectionsBridge] Falling back to segmented path:", error?.message || error);
      return [];
    }
  }

  function dedupePath(path = []) {
    const deduped = [];
    for (const point of path) {
      const last = deduped[deduped.length - 1];
      if (
        last &&
        Math.abs(last.lat - point.lat) < 0.000001 &&
        Math.abs(last.lng - point.lng) < 0.000001
      ) {
        continue;
      }
      deduped.push(point);
    }
    return deduped;
  }

  function buildRouteAnchors(points = []) {
    if (!Array.isArray(points) || points.length < 2) return points;

    const anchors = [points[0]];
    let lastAnchor = points[0];

    for (let i = 1; i < points.length - 1; i++) {
      const point = points[i];
      const gapMetres = distMetres(lastAnchor.lat, lastAnchor.lng, point.lat, point.lng);
      if (gapMetres >= 120) {
        anchors.push(point);
        lastAnchor = point;
      }
    }

    anchors.push(points[points.length - 1]);
    return dedupePath(anchors);
  }

  async function fetchDirectionsPath(points) {
    if (!window.google?.maps?.DirectionsService || !Array.isArray(points) || points.length < 2) {
      return [];
    }

    const anchors = buildRouteAnchors(points);
    if (anchors.length < 2) return [];

    const service = new window.google.maps.DirectionsService();
    const routedPath = [];

    for (let startIndex = 0; startIndex < anchors.length - 1; startIndex += DIRECTIONS_MAX_WAYPOINTS) {
      const chunk = anchors.slice(startIndex, startIndex + DIRECTIONS_MAX_WAYPOINTS + 1);
      if (chunk.length < 2) continue;

      try {
        const result = await service.route({
          origin: { lat: chunk[0].lat, lng: chunk[0].lng },
          destination: { lat: chunk[chunk.length - 1].lat, lng: chunk[chunk.length - 1].lng },
          waypoints: chunk.slice(1, -1).map((point) => ({
            location: { lat: point.lat, lng: point.lng },
            stopover: false,
          })),
          optimizeWaypoints: false,
          travelMode: window.google.maps.TravelMode.DRIVING,
        });

        const overviewPath = Array.isArray(result?.routes?.[0]?.overview_path)
          ? result.routes[0].overview_path
          : [];

        const normalizedChunk = overviewPath
          .map((point) => ({
            lat: Number(typeof point?.lat === "function" ? point.lat() : point?.lat),
            lng: Number(typeof point?.lng === "function" ? point.lng() : point?.lng),
          }))
          .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));

        if (!normalizedChunk.length) continue;

        if (routedPath.length > 0) {
          const last = routedPath[routedPath.length - 1];
          const first = normalizedChunk[0];
          const duplicate =
            Math.abs(last.lat - first.lat) < 0.000001 &&
            Math.abs(last.lng - first.lng) < 0.000001;
          routedPath.push(...(duplicate ? normalizedChunk.slice(1) : normalizedChunk));
        } else {
          routedPath.push(...normalizedChunk);
        }
      } catch (error) {
        console.warn("[DirectionsRoute] Falling back to snap-to-roads:", error?.message || error);
        return [];
      }
    }

    return dedupePath(routedPath);
  }

  async function getRoadPath(points) {
    if (!Array.isArray(points) || points.length < 2) {
      return points.map((point) => ({ lat: point.lat, lng: point.lng }));
    }

    const cacheKey = buildSnapBatchKey(points);
    if (snappedTrailCacheRef.current.key === cacheKey) {
      return snappedTrailCacheRef.current.path;
    }

    const directionsPath = await fetchDirectionsPath(points);
    if (directionsPath.length >= 2) {
      snappedTrailCacheRef.current = { key: cacheKey, path: directionsPath };
      return directionsPath;
    }

    const batches = [];
    let currentBatch = [points[0]];

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const gapMetres = distMetres(prev.lat, prev.lng, curr.lat, curr.lng);

      if (
        gapMetres > SNAP_TO_ROADS_MAX_GAP_METRES ||
        currentBatch.length >= SNAP_TO_ROADS_MAX_POINTS
      ) {
        if (currentBatch.length >= 2) {
          batches.push(currentBatch);
        }
        currentBatch = gapMetres > SNAP_TO_ROADS_MAX_GAP_METRES ? [curr] : [prev, curr];
        continue;
      }

      currentBatch.push(curr);
    }

    if (currentBatch.length >= 2) {
      batches.push(currentBatch);
    }

    if (!batches.length) {
      return points.map((point) => ({ lat: point.lat, lng: point.lng }));
    }

    const snappedPath = [];
    let previousBatchLastPoint = null;

    for (const batch of batches) {
      const snappedBatch = await fetchSnappedBatch(batch);
      if (!snappedBatch.length) continue;

      const currentBatchFirstPoint = snappedBatch[0];

      if (previousBatchLastPoint && currentBatchFirstPoint) {
        const bridgePath = await fetchRoadBridge(previousBatchLastPoint, currentBatchFirstPoint);
        if (bridgePath.length > 1) {
          const last = snappedPath[snappedPath.length - 1];
          const duplicateAtStart =
            last &&
            Math.abs(bridgePath[0].lat - last.lat) < 0.000001 &&
            Math.abs(bridgePath[0].lng - last.lng) < 0.000001;
          snappedPath.push(...(duplicateAtStart ? bridgePath.slice(1) : bridgePath));
        }
      }

      if (snappedPath.length > 0) {
        const first = snappedBatch[0];
        const last = snappedPath[snappedPath.length - 1];
        const duplicate =
          Math.abs(first.lat - last.lat) < 0.000001 &&
          Math.abs(first.lng - last.lng) < 0.000001;
        snappedPath.push(...(duplicate ? snappedBatch.slice(1) : snappedBatch));
      } else {
        snappedPath.push(...snappedBatch);
      }

      previousBatchLastPoint = snappedBatch[snappedBatch.length - 1];
    }

    const finalPath = snappedPath.length
      ? snappedPath
      : points.map((point) => ({ lat: point.lat, lng: point.lng }));

    snappedTrailCacheRef.current = { key: cacheKey, path: finalPath };
    return finalPath;
  }

  function clearAuditPolylines() {
    auditDrawSeqRef.current += 1;
    auditPolyRef.current.forEach((line) => line.setMap(null));
    auditPolyRef.current = [];
  }

  function clearBaseTrailPolyline() {
    polyRef.current.casing?.setMap(null);
    polyRef.current.main?.setMap(null);
    polyRef.current = { casing: null, main: null };
  }

  function getAuditColor(status) {
    return "#16a34a";
  }

  function getAuditSegmentCacheKey(segment) {
    const from = segment?.from;
    const to = segment?.to;
    return [
      Number(from?.lat).toFixed(6),
      Number(from?.lng).toFixed(6),
      Number(to?.lat).toFixed(6),
      Number(to?.lng).toFixed(6),
    ].join("|");
  }

  async function getSnappedPathForAuditSegment(segment) {
    const cacheKey = getAuditSegmentCacheKey(segment);
    if (auditPathCacheRef.current[cacheKey]) return auditPathCacheRef.current[cacheKey];

    const from = segment.from;
    const to = segment.to;
    const fallbackPath = [
      { lat: Number(from.lat), lng: Number(from.lng) },
      { lat: Number(to.lat), lng: Number(to.lng) },
    ];

    const gapMetres = distMetres(fallbackPath[0].lat, fallbackPath[0].lng, fallbackPath[1].lat, fallbackPath[1].lng);
    if (gapMetres > SNAP_TO_ROADS_MAX_GAP_METRES) {
      const bridgedPath = await fetchRoadBridge(fallbackPath[0], fallbackPath[1]);
      if (bridgedPath.length >= 2) {
        auditPathCacheRef.current[cacheKey] = bridgedPath;
        return bridgedPath;
      }
      auditPathCacheRef.current[cacheKey] = null;
      return null;
    }

    try {
      const bridgedPath = await fetchRoadBridge(fallbackPath[0], fallbackPath[1]);
      if (bridgedPath.length >= 2) {
        auditPathCacheRef.current[cacheKey] = bridgedPath;
        return bridgedPath;
      }

      const snappedPath = await fetchSnappedBatch(fallbackPath);
      if (snappedPath.length >= 2) {
        auditPathCacheRef.current[cacheKey] = snappedPath;
        return snappedPath;
      }
    } catch (error) {
      console.warn("[AuditRoute] Snap fallback:", error?.message || error);
    }

    auditPathCacheRef.current[cacheKey] = fallbackPath;
    return fallbackPath;
  }

  async function drawAuditSegments(segments = []) {
    clearAuditPolylines();
    if (!gMapRef.current || !window.google?.maps || !Array.isArray(segments) || segments.length === 0) return;

    clearBaseTrailPolyline();

    const G = window.google.maps;
    const map = gMapRef.current;
    const requestSeq = ++auditDrawSeqRef.current;

    for (const segment of segments) {
      if (segment?.status === "rejected") continue;

      const from = segment?.from;
      const to = segment?.to;
      if (!Number.isFinite(Number(from?.lat)) || !Number.isFinite(Number(from?.lng))) continue;
      if (!Number.isFinite(Number(to?.lat)) || !Number.isFinite(Number(to?.lng))) continue;

      const path = await getSnappedPathForAuditSegment(segment);
      if (requestSeq !== auditDrawSeqRef.current) return;
      if (!Array.isArray(path) || path.length < 2) continue;

      auditPolyRef.current.push(
        new G.Polyline({
          path,
          geodesic: true,
          strokeColor: "#ffffff",
          strokeOpacity: 0.9,
          strokeWeight: 9,
          map,
          zIndex: 8,
        }),
        new G.Polyline({
          path,
          geodesic: true,
          strokeColor: getAuditColor(segment.status),
          strokeOpacity: segment.status === "rejected" ? 0.95 : 0.9,
          strokeWeight: 5,
          map,
          zIndex: 9,
        })
      );
    }
  }

  async function drawTrail(points, options = {}) {
    const { autoFit = false, autoPanLive = false } = options;
    if (!gMapRef.current || !window.google?.maps || points.length === 0) return;
    const G   = window.google.maps;
    const map = gMapRef.current;
    const shouldDrawLine = points.length >= 2 && hasConfirmedMovement(points);
    const requestSeq = ++drawRequestSeqRef.current;

    let path = points.map((p) => ({ lat: p.lat, lng: p.lng }));
    if (shouldDrawLine) {
      try {
        path = await getRoadPath(points);
      } catch (error) {
        console.warn("[SnapToRoads] Falling back to raw path:", error?.message || error);
      }
    }

    if (requestSeq !== drawRequestSeqRef.current) return;

    if (shouldDrawLine) {
      if (polyRef.current.casing && polyRef.current.main) {
        polyRef.current.casing.setPath(path);
        polyRef.current.main.setPath(path);
      } else {
        polyRef.current = {
          casing: new G.Polyline({
            path,
            geodesic: true,
            strokeColor: "#ffffff",
            strokeOpacity: 0.95,
            strokeWeight: 8,
            map,
            zIndex: 6,
          }),
          main: new G.Polyline({
            path,
            geodesic: true,
            strokeColor: "#16a34a",
            strokeOpacity: 0.65,
            strokeWeight: 4,
            map,
            zIndex: 7,
          }),
        };
      }
    } else {
      polyRef.current.casing?.setMap(null);
      polyRef.current.main?.setMap(null);
      polyRef.current = { casing: null, main: null };
    }

    dotsRef.current.forEach((d) => d.setMap(null));
    dotsRef.current = [];
    points.forEach((pt, i) => {
      if (shouldDrawLine) {
        if (i === 0 || i === points.length - 1 || i % 6 !== 0) return;
      } else if (i === points.length - 1) {
        return;
      }
      dotsRef.current.push(
        new G.Marker({
          position: { lat: pt.lat, lng: pt.lng },
          map,
          zIndex: 5,
          icon: {
            path:         G.SymbolPath.CIRCLE,
            scale:        3,
            fillColor:    "#b91c1c",
            fillOpacity:  0.8,
            strokeColor:  "#ffffff",
            strokeWeight: 1,
          },
        })
      );
    });

    const last = points[points.length - 1];
    if (last) {
      if (liveMkRef.current) {
        liveMkRef.current.setPosition({ lat: last.lat, lng: last.lng });
      } else {
        liveMkRef.current = new G.Marker({
          position: { lat: last.lat, lng: last.lng },
          map,
          title:  "Current Position",
          zIndex: 20,
          icon: {
            path:         G.SymbolPath.CIRCLE,
            scale:        10,
            fillColor:    "#ef4444",
            fillOpacity:  1,
            strokeColor:  "rgba(239,68,68,0.4)",
            strokeWeight: 12,
          },
        });
      }
      if (isLive && autoPanLive && !userAdjustedViewportRef.current) {
        withProgrammaticViewport(() => {
          map.panTo({ lat: last.lat, lng: last.lng });
        });
      }
    }

    if (shouldDrawLine && !isLive && autoFit && !userAdjustedViewportRef.current) {
      const bounds = new G.LatLngBounds();
      path.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      withProgrammaticViewport(() => {
        map.fitBounds(bounds, { top: 60, bottom: 40, left: 40, right: 40 });
      });
    }

    const km = calcFilteredKm(points);
    updateDistanceStats(km, points.length);
    console.log(`[drawTrail] ${points.length} points — ${km.toFixed(3)} km`);
  }

  function simplifyTrailPoints(points) {
    if (!Array.isArray(points) || points.length <= 2) return points;

    const simplified = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
      const prev = simplified[simplified.length - 1];
      const curr = points[i];
      const next = points[i + 1];

      const stepFromPrev = distMetres(prev.lat, prev.lng, curr.lat, curr.lng);
      const stepToNext = distMetres(curr.lat, curr.lng, next.lat, next.lng);
      const directStep = distMetres(prev.lat, prev.lng, next.lat, next.lng);
      const maxAccuracy = Math.max(
        Number(prev.accuracy) || 0,
        Number(curr.accuracy) || 0,
        Number(next.accuracy) || 0
      );
      const stationaryThreshold = Math.max(30, Math.min(55, maxAccuracy * 0.9));

      if (stepFromPrev < stationaryThreshold && stepToNext < stationaryThreshold) {
        continue;
      }

      if (Math.abs((stepFromPrev + stepToNext) - directStep) < 8) {
        continue;
      }

      simplified.push(curr);
    }

    simplified.push(points[points.length - 1]);
    return simplified;
  }

  function cleanPoints(raw) {
    const cleaned = [];
    for (const p of raw) {
      const lat = Number(p.lat);
      const lng = Number(p.lng);
      const accuracy = Number(p.accuracy ?? 0);
      const distanceFromPrevious = Number(p.distanceFromPrevious ?? 0);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (accuracy && accuracy > 60) continue;

      if (cleaned.length === 0) {
        cleaned.push({ lat, lng, accuracy, distanceFromPrevious });
        continue;
      }

      const prev = cleaned[cleaned.length - 1];
      const distM = distMetres(prev.lat, prev.lng, lat, lng);
      const requiredMove = Math.max(
        getEffectiveMoveThreshold(accuracy, prev.accuracy),
        distanceFromPrevious > 0 ? 28 : 40
      );
      const gpsNoiseRadius = getGpsNoiseRadiusMetres(accuracy, prev.accuracy);

      if (distanceFromPrevious <= 0 && distM < 30) continue;
      if (distM < requiredMove) continue;
      if (distM < gpsNoiseRadius) continue;
      if (distM > 2000) continue;

      cleaned.push({ lat, lng, accuracy, distanceFromPrevious });
    }

    return simplifyTrailPoints(cleaned);
  }

  const fetchTotalKm = useCallback(async () => {
    if (!userId) return;
    try {
       const dateParam = selectedDate && selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)
        ? selectedDate
        : new Date().toISOString().split("T")[0];

      const verifiedRes = await fetch(
        `${API}/api/v1/location/verified-distance?salesmanId=${userId}&date=${dateParam}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      if (verifiedRes.ok) {
        const verifiedData = await verifiedRes.json();
        const verified = verifiedData?.data ?? verifiedData?.result ?? verifiedData;
        const payableKm = Number(verified?.payableKm ?? 0);
        const acceptedPoints = Number(verified?.acceptedPoints ?? verified?.totalPoints ?? 0);
        setVerifiedDistance(verified);
        updateDistanceStats(Math.round(payableKm * 1000) / 1000, acceptedPoints);
        return;
      }

      const res = await fetch(
        `${API}/api/v1/location/distance?salesmanId=${userId}&date=${dateParam}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      if (!res.ok) return;
      const data = await res.json();
      const dbKm = data?.data?.totalKm ?? data?.result?.totalKm ?? data?.totalKm ?? 0;
      const dbPoints = data?.data?.totalPoints ?? data?.result?.totalPoints ?? data?.totalPoints ?? 0;
      setVerifiedDistance(null);
      if (allPtsRef.current.length < 2) {
        updateDistanceStats(Math.round(dbKm * 1000) / 1000, dbPoints);
      }
    } catch {
      if (allPtsRef.current.length >= 2) {
        setVerifiedDistance(null);
        updateDistanceStats(calcFilteredKm(allPtsRef.current), allPtsRef.current.length);
      }
    }
  }, [userId, selectedDate, updateDistanceStats]);

  const loadTrailFromDB = useCallback(async (options = {}) => {
    const { autoFit = false } = options;
    if (!userId || !mapLoaded) return;
     try {
      // ✅ Use selectedDate if provided, otherwise fall back to today
      let since, until;
      if (selectedDate && selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [yyyy, mm, dd] = selectedDate.split("-").map(Number);
        since = new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);
        until = new Date(yyyy, mm - 1, dd, 23, 59, 59, 999);
      } else {
        const now = new Date();
        since = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        until = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      }

      const url = `${API}/api/v1/location/today?salesmanId=${userId}&startTime=${since.toISOString()}&endTime=${until.toISOString()}`;

      console.log(`[AdminMap] 📡 Fetching trail for userId:${userId}`);

      const res     = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data    = await res.json();
      console.log("[AdminMap] Full response:", JSON.stringify(data).slice(0, 300));

      const raw     = data?.result || data?.data || data?.points || [];
      const cleaned = cleanPoints(raw);

      console.log(`[AdminMap] DB points: raw=${raw.length} cleaned=${cleaned.length}`);

      if (cleaned.length > 0) {
        const merged = [...cleaned];
        if (isLive && isTodaySelected) {
          for (const lp of allPtsRef.current) {
            const alreadyIn = merged.some(
              (p) => Math.abs(p.lat - lp.lat) < 0.00001 && Math.abs(p.lng - lp.lng) < 0.00001
            );
            if (!alreadyIn) merged.push(lp);
          }
        }
        const finalTrail = cleanPoints(merged);
        allPtsRef.current = finalTrail;
        drawTrail(finalTrail, { autoFit, autoPanLive: false });
        console.log(`[AdminMap] ✅ Trail: ${finalTrail.length} points — ${calcKm(finalTrail).toFixed(3)} km`);
      } else {
        if (allPtsRef.current.length > 0) drawTrail(allPtsRef.current, { autoFit, autoPanLive: false });
        console.warn(`[AdminMap] ⚠️ No DB points — raw:${raw.length}`);
      }

      await fetchTotalKm();
    } catch (e) {
      console.error("[AdminMap] ❌ Trail fetch failed:", e.message);
    }
  }, [userId, mapLoaded, fetchTotalKm, selectedDate, isLive, isTodaySelected]);

  useEffect(() => {
    if (!mapLoaded) return;
    const segments = verifiedDistance?.auditSegments;
    if (Array.isArray(segments) && segments.length > 0) {
      drawAuditSegments(segments);
    } else {
      clearAuditPolylines();
      if (allPtsRef.current.length > 0) {
        drawTrail(allPtsRef.current, { autoFit: false, autoPanLive: false });
      }
    }
  }, [mapLoaded, verifiedDistance]);

  useEffect(() => {
    // ✅ Clear old trail and re-fetch whenever selectedDate changes
    clearBaseTrailPolyline();
    dotsRef.current.forEach(d => d.setMap(null));
    dotsRef.current = [];
    clearAuditPolylines();
    if (liveMkRef.current) { liveMkRef.current.setMap(null); liveMkRef.current = null; }
    allPtsRef.current = [];
    snappedTrailCacheRef.current = { key: "", path: [] };
    auditPathCacheRef.current = {};
    drawRequestSeqRef.current += 1;
    userAdjustedViewportRef.current = false;
    setVerifiedDistance(null);
    updateDistanceStats(0, 0);
    loadTrailFromDB({ autoFit: true });
  }, [loadTrailFromDB, updateDistanceStats]);

  useEffect(() => {
    if (!userId || !mapLoaded || !isLive || !isTodaySelected) return;
    const id = setInterval(() => loadTrailFromDB({ autoFit: false }), 30_000);
    return () => clearInterval(id);
  }, [userId, mapLoaded, loadTrailFromDB, isLive, isTodaySelected]);

  // ── Start / stop tracking on punch ─────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded) return;

    const wasIn  = prevPunchedIn.current;
    const wasOut = prevPunchedOut.current;
    prevPunchedIn.current  = isPunchedIn;
    prevPunchedOut.current = hasPunchedOut;

    if (isPunchedIn && !hasPunchedOut && !wasIn && isOwner) {
      // ✅ FIX: pass socketRef (stable ref) instead of socket (raw, potentially stale)
      startTracking(
        (allPts) => {
          if (!allPts.length) return;
          const newPts = allPts.map((p) => ({ lat: p.lat, lng: p.lng }));
          const merged = [...allPtsRef.current];
          for (const np of newPts) {
            const alreadyIn = merged.some(
              (p) => Math.abs(p.lat - np.lat) < 0.00001 && Math.abs(p.lng - np.lng) < 0.00001
            );
            if (!alreadyIn) merged.push(np);
            }
            const finalTrail = cleanPoints(merged);
            allPtsRef.current = finalTrail;
            drawTrail(finalTrail, { autoFit: false, autoPanLive: false });
            const last = allPts[allPts.length - 1];
            if (last) setAccuracy(last.accuracy);
            if (typeof onPointsChange === "function") onPointsChange(allPts);
        },
        socketRef,  // ✅ FIX: stable ref, not raw socket
        userId,
      );
    }

    if (hasPunchedOut && !wasOut) {
      if (isCurrentlyTracking()) stopTracking();
      setTimeout(() => loadTrailFromDB({ autoFit: false }), 2000);
    }
  }, [isPunchedIn, hasPunchedOut, socketRef, mapLoaded, loadTrailFromDB, userId]);

  // ── Live dot every 30 s ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOwner || !isPunchedIn || hasPunchedOut || !mapLoaded || !gMapRef.current) return;
    if (!window.google?.maps) return;

    const G = window.google.maps;

    const updateDot = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = pos.coords.accuracy ?? 0;

          if (acc > 150) return;

          if (liveMkRef.current) {
            liveMkRef.current.setPosition({ lat, lng });
          } else if (gMapRef.current) {
            liveMkRef.current = new G.Marker({
              position: { lat, lng },
              map:      gMapRef.current,
              title:    "Current Location",
              zIndex:   20,
              icon: {
                path:         G.SymbolPath.CIRCLE,
                scale:        10,
                fillColor:    "#ef4444",
                fillOpacity:  1,
                strokeColor:  "rgba(239,68,68,0.4)",
                strokeWeight: 12,
              },
            });
          }

          const lastTrailPt = allPtsRef.current[allPtsRef.current.length - 1];
          if (lastTrailPt) {
            const moved = distMetres(lastTrailPt.lat, lastTrailPt.lng, lat, lng);
            const minMoveRequired = getEffectiveMoveThreshold(acc, lastTrailPt.accuracy);
            if (moved >= minMoveRequired) {
              const merged = [...allPtsRef.current, { lat, lng, accuracy: acc }];
              const finalTrail = cleanPoints(merged);
              allPtsRef.current = finalTrail;
              drawTrail(finalTrail, { autoFit: false, autoPanLive: false });
              console.log(`[LiveDot] ✅ ${moved.toFixed(0)} m real movement — trail updated`);
            } else {
              console.log(`[LiveDot] ⏭ ${moved.toFixed(0)} m jitter — dot moved, trail unchanged`);
              if (isLive && gMapRef.current && !userAdjustedViewportRef.current) {
                withProgrammaticViewport(() => {
                  gMapRef.current.panTo({ lat, lng });
                });
              }
            }
          } else {
            if (gMapRef.current && !userAdjustedViewportRef.current) {
              withProgrammaticViewport(() => {
                gMapRef.current.panTo({ lat, lng });
              });
            }
          }
        },
        (err) => console.warn("[LiveDot] GPS failed:", err.message),
        { enableHighAccuracy: true, timeout: 20_000, maximumAge: 5_000 }
      );
    };

    updateDot();
    const id = setInterval(updateDot, 30_000);
    return () => clearInterval(id);
  }, [isOwner, isPunchedIn, hasPunchedOut, mapLoaded]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => { if (isCurrentlyTracking()) stopTracking(); };
  }, []);

  // ── Socket events ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onAck   = (data) => setSockAck(data.timestamp);
    const onError = (data) => toast.error(data.message || "Socket error.", { title: "Live Sync Error" });

    const onGeofenceAlert = (data) => {
      const msg = `${data.event === "entered" ? "🟠 Entered" : "⚪ Exited"} "${data.name}"`;
      toast[data.event === "entered" ? "warn" : "info"](msg, { title: "Geofence Alert" });
      setGeofenceAlerts((prev) => [{ ...data, id: Date.now() }, ...prev.slice(0, 19)]);
    };

    const onLiveUpdate = (data) => {
      if (data.userId && userId && String(data.userId) !== String(userId)) return;
      if (!data.lat || !data.lng) return;
      const last = allPtsRef.current[allPtsRef.current.length - 1];
      if (last) {
        const dist = distMetres(last.lat, last.lng, data.lat, data.lng);
        const minMoveRequired = getEffectiveMoveThreshold(data.accuracy, last.accuracy);
        if (dist < minMoveRequired) {
          console.log(`[Socket] ⏭ ${dist.toFixed(0)} m jitter — skipped`);
          if (liveMkRef.current) {
            liveMkRef.current.setPosition({ lat: data.lat, lng: data.lng });
          }
          return;
        }
      }
      const merged = [...allPtsRef.current, { lat: data.lat, lng: data.lng, accuracy: data.accuracy }];
      const finalTrail = cleanPoints(merged);
      allPtsRef.current = finalTrail;
      drawTrail(finalTrail, { autoFit: false, autoPanLive: false });
    };

    socket.on("location:ack",         onAck);
    socket.on("location:error",       onError);
    socket.on("location:live_update", onLiveUpdate);
    socket.on("geofence:alert",       onGeofenceAlert);

    return () => {
      socket.off("location:ack",         onAck);
      socket.off("location:error",       onError);
      socket.off("location:live_update", onLiveUpdate);
      socket.off("geofence:alert",       onGeofenceAlert);
    };
  }, [socket, userId]);

  useEffect(() => {
    if (!socket || !userId || isOwner) return;
    socket.emit("location:watch_user", { userId });
    console.log(`[AdminMap] 👁 Watching userId: ${userId}`);
  }, [socket, userId, isOwner]);

  // ── Locate Me ───────────────────────────────────────────────────────────────
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
          1: "Location permission denied.",
          2: "Current position unavailable.",
          3: "Location request timed out.",
        };
        toast.error(msgs[err.code] || err.message, { title: "Locate Me Failed" });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 }
    );
  }, [locateTrigger]);

  const accuracyColor =
    accuracy == null ? "#94a3b8"
    : accuracy <= 20  ? "#16a34a"
    : accuracy <= 50  ? "#d97706"
    :                   "#dc2626";

  const accuracyLabel =
    accuracy == null ? "No GPS"
    : accuracy <= 20  ? "Excellent"
    : accuracy <= 50  ? "Fair"
    :                   "Poor";

  const fmtTime = (iso) =>
    iso
      ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      : null;

  const reviewFlagCount = Array.isArray(verifiedDistance?.flags) ? verifiedDistance.flags.length : 0;
  const rawKm = Number(verifiedDistance?.rawKm ?? 0);
  const hasVerifiedDistance = !!verifiedDistance;
  const auditSegments = Array.isArray(verifiedDistance?.auditSegments) ? verifiedDistance.auditSegments : [];
  const auditCounts = auditSegments.reduce((acc, segment) => {
    const status = segment?.status || "rejected";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

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
          : hasPunchedOut
          ? "Day Completed"
          : "Punch in to start tracking"}
      </div>

      {geofenceAlerts.length > 0 && (
        <div style={{
          position: "absolute", top: 50, left: 10, zIndex: 1000,
          maxHeight: 120, overflowY: "auto", display: "flex",
          flexDirection: "column", gap: 4, pointerEvents: "none",
        }}>
          {geofenceAlerts.slice(0, 4).map((a) => (
            <div key={a.id} style={{
              background: "rgba(255,255,255,0.96)", borderRadius: 7,
              padding: "4px 10px", fontSize: 11, fontWeight: 600,
              boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
              color:   a.event === "entered" ? "#c2410c" : "#64748b",
              border: `1px solid ${a.event === "entered" ? "#fed7aa" : "#e2e8f0"}`,
            }}>
              {a.event === "entered" ? "🟠" : "⚪"} {a.name}
            </div>
          ))}
        </div>
      )}

      {accuracy != null && (
        <div style={{
          position: "absolute", top: 10, right: 10, zIndex: 1000,
          background: "rgba(255,255,255,0.97)", borderRadius: 8,
          padding: "4px 10px", fontSize: 11, fontWeight: 700,
          boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
          color: accuracyColor, border: `1px solid ${accuracyColor}40`, pointerEvents: "none",
        }}>
          GPS ±{Math.round(accuracy)} m · {accuracyLabel}
        </div>
      )}

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

      <div style={{
        position: "absolute", bottom: 10, left: 10, zIndex: 1000,
        background: "rgba(255,255,255,0.97)", borderRadius: 10,
        padding: "6px 14px", fontSize: 12, fontWeight: 700, color: "#0f172a",
        boxShadow: "0 2px 10px rgba(0,0,0,0.12)", pointerEvents: "none",
        display: "flex", alignItems: "center", gap: 10, border: "1px solid #e2e8f0",
        flexWrap: "wrap", maxWidth: 520,
      }}>
        {pointCount > 0
          ? <span>Points: {pointCount}</span>
          : <span style={{ color: "#94a3b8" }}>Waiting for movement...</span>}
        <span style={{ color: "#e2e8f0" }}>|</span>
        <span style={{ color: totalKm > 0 ? "#4569ea" : "#94a3b8", fontSize: 13, fontWeight: 800 }}>
          {hasVerifiedDistance ? "Payable" : "Distance"}: {totalKm.toFixed(2)} km
        </span>
        {hasVerifiedDistance && (
          <>
            <span style={{ color: "#e2e8f0" }}>|</span>
            <span style={{ color: "#64748b", fontSize: 11 }}>
              Raw: {rawKm.toFixed(2)} km
            </span>
          </>
        )}
        {reviewFlagCount > 0 && (
          <>
            <span style={{ color: "#e2e8f0" }}>|</span>
            <span style={{ color: "#16a34a", fontSize: 11, fontWeight: 800 }}>
              Review: {reviewFlagCount} flag{reviewFlagCount !== 1 ? "s" : ""}
            </span>
          </>
        )}
        {isLive && (
          <>
            <span style={{ color: "#e2e8f0" }}>|</span>
            <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 700 }}>● live</span>
          </>
        )}
      </div>

      {auditSegments.length > 0 && (
        <div style={{
          position: "absolute", bottom: 52, left: 10, zIndex: 1000,
          background: "rgba(255,255,255,0.97)", borderRadius: 10,
          padding: "6px 12px", fontSize: 11, fontWeight: 800, color: "#334155",
          boxShadow: "0 2px 10px rgba(0,0,0,0.10)", pointerEvents: "none",
          display: "flex", alignItems: "center", gap: 10, border: "1px solid #e2e8f0",
          flexWrap: "wrap", maxWidth: 520,
        }}>
          <span><b style={{ color: "#16a34a" }}>Green</b>: Payable {auditCounts.payable || 0}</span>
          <span><b style={{ color: "#16a34a" }}>Green</b>: Review {auditCounts.review || 0}</span>
          <span><b style={{ color: "#64748b" }}>Untrusted hidden</b>: {auditCounts.rejected || 0}</span>
        </div>
      )}

      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
