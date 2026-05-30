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

const MIN_MOVE_METRES = 12;
const SNAP_TO_ROADS_MAX_POINTS = 100;
const SNAP_TO_ROADS_MAX_GAP_METRES = 500;
const MAX_COUNTED_SEGMENT_METRES = 1000;
const MAX_COUNTED_SPEED_KMH = 100;
const ROUTE_MODE_RAW = "raw";
const ROUTE_MODE_ROAD = "road";
const MAX_VISIBLE_GPS_DOTS = 1000;

function getGpsNoiseRadiusMetres(currentAccuracy = 0, previousAccuracy = 0) {
  const current = Number(currentAccuracy) || 0;
  const previous = Number(previousAccuracy) || 0;
  return Math.max(12, Math.max(current, previous) * 0.8);
}

function getEffectiveMoveThreshold(currentAccuracy = 0, previousAccuracy = 0) {
  const current = Number(currentAccuracy) || 0;
  const previous = Number(previousAccuracy) || 0;
  const maxAccuracy = Math.max(current, previous);

  return Math.min(
    45,
    Math.max(
      MIN_MOVE_METRES,
      (current + previous) * 0.45,
      maxAccuracy * 0.8
    )
  );
}

const getToken = () =>
  localStorage.getItem("token")       ||
  localStorage.getItem("authToken")   ||
  localStorage.getItem("accessToken") || "";

const getLocalDateString = (value = null) => {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().split("T")[0];
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const extractLocationPoints = (payload) => {
  const candidates = [
    payload?.result,
    payload?.data,
    payload?.points,
    payload?.path,
    payload?.locations,
    payload?.result?.points,
    payload?.result?.path,
    payload?.result?.locations,
    payload?.data?.points,
    payload?.data?.path,
    payload?.data?.locations,
  ];

  return candidates.find(Array.isArray) || [];
};

const filterPointsFromPunchInTime = (points = [], punchInTime = null) => {
  if (!Array.isArray(points) || !points.length || !punchInTime) return points;

  const punchInMs = new Date(punchInTime).getTime();
  if (!Number.isFinite(punchInMs)) return points;

  return points.filter((point) => {
    const pointMs = new Date(point?.recordedAt || point?.time || 0).getTime();
    return !Number.isFinite(pointMs) || pointMs >= punchInMs;
  });
};

const extractVisitTrailPoints = (visits = [], punchInLocation = null) => {
  const points = [];
  const seen = new Set();

  const pushPoint = (latValue, lngValue, extra = {}) => {
    const lat = Number(latValue);
    const lng = Number(lngValue);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    if (seen.has(key)) return;
    seen.add(key);
    points.push({ lat, lng, ...extra });
  };

  if (punchInLocation) {
    pushPoint(punchInLocation.lat, punchInLocation.lng, { source: "punch-in" });
  }

  [...visits]
    .filter(Boolean)
    .sort((a, b) => {
      const timeA = new Date(a?.checkInTime || a?.createdAt || a?.visitDate || 0).getTime();
      const timeB = new Date(b?.checkInTime || b?.createdAt || b?.visitDate || 0).getTime();
      return timeA - timeB;
    })
    .forEach((visit) => {
      pushPoint(
        visit.coordinates?.lat ??
          visit.location?.lat ??
          visit.location?.latitude ??
          visit.lat ??
          visit.latitude,
        visit.coordinates?.lng ??
          visit.coordinates?.longitude ??
          visit.location?.lng ??
          visit.location?.longitude ??
          visit.lng ??
          visit.longitude,
        { source: "visit" }
      );
    });

  return points;
};

const ensureTrailStartsAtPunchIn = (points = [], punchInLocation = null) => {
  if (!punchInLocation?.lat || !punchInLocation?.lng) return points;
  const punchPoint = {
    lat: Number(punchInLocation.lat),
    lng: Number(punchInLocation.lng),
    accuracy: Number(punchInLocation.accuracy ?? 0),
    source: "punch-in",
  };

  if (!Number.isFinite(punchPoint.lat) || !Number.isFinite(punchPoint.lng)) {
    return points;
  }

  const first = points[0];
  if (
    first &&
    Math.abs(Number(first.lat) - punchPoint.lat) < 0.00001 &&
    Math.abs(Number(first.lng) - punchPoint.lng) < 0.00001
  ) {
    return points;
  }

  return [punchPoint, ...points];
};

function appendSequentialPoint(points, point, minDuplicateMetres = 2) {
  const lat = Number(point?.lat);
  const lng = Number(point?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return points;

  const normalized = {
    ...point,
    lat,
    lng,
    accuracy: Number(point?.accuracy ?? 0),
  };
  const last = points[points.length - 1];
  if (last && distMetres(last.lat, last.lng, lat, lng) < minDuplicateMetres) {
    return points;
  }

  points.push(normalized);
  return points;
}

function getPointTimestamp(point) {
  const timestamp = new Date(point?.recordedAt || point?.time || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function orderPointsByTime(points = []) {
  return points
    .map((point, index) => ({ point, index, timestamp: getPointTimestamp(point) }))
    .sort((a, b) => {
      if (a.timestamp !== null && b.timestamp !== null && a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      if (a.timestamp !== null && b.timestamp === null) return -1;
      if (a.timestamp === null && b.timestamp !== null) return 1;
      return a.index - b.index;
    })
    .map(({ point }) => point);
}

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
    const prevTime = new Date(prev.recordedAt || prev.time || 0).getTime();
    const currTime = new Date(curr.recordedAt || curr.time || 0).getTime();
    const elapsedHours =
      Number.isFinite(prevTime) && Number.isFinite(currTime) && currTime > prevTime
        ? (currTime - prevTime) / 3600000
        : null;
    const maxBySpeed = elapsedHours
      ? Math.max(150, elapsedHours * MAX_COUNTED_SPEED_KMH * 1000)
      : MAX_COUNTED_SEGMENT_METRES;
    const requiredMove = getEffectiveMoveThreshold(curr.accuracy, prev.accuracy);
    const gpsNoiseRadius = getGpsNoiseRadiusMetres(curr.accuracy, prev.accuracy);
    if (distM > Math.min(MAX_COUNTED_SEGMENT_METRES, maxBySpeed)) continue;
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

function resolvePunchInMarkerPosition(punchInLocation, trailPoints = []) {
  if (!punchInLocation?.lat || !punchInLocation?.lng) return null;

  const trailStart = Array.isArray(trailPoints) && trailPoints.length > 0 ? trailPoints[0] : null;
  if (!trailStart?.lat || !trailStart?.lng) return punchInLocation;

  const mismatchMetres = distMetres(
    punchInLocation.lat,
    punchInLocation.lng,
    trailStart.lat,
    trailStart.lng
  );

  // If the saved punch-in point is clearly off, prefer the first confirmed trail point.
  if (mismatchMetres >= 60) {
    return {
      ...punchInLocation,
      lat: trailStart.lat,
      lng: trailStart.lng,
    };
  }

  return punchInLocation;
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
  punchOutLocation = null,
  selectedDate    = null, 
  visits          = [],
  preferVisitTrail = false,
  
}) {
  const mapDivRef  = useRef(null);
  const gMapRef    = useRef(null);
  const polyRef    = useRef({ casing: null, main: null });
  const startMkRef = useRef(null);
  const liveMkRef  = useRef(null);
  const endMkRef   = useRef(null);
  const dotsRef    = useRef([]);
  const allPtsRef  = useRef([]);
  const rawPtsRef  = useRef([]);
  const visitsRef = useRef(visits);
  const punchInLocationRef = useRef(punchInLocation);
  const punchOutLocationRef = useRef(punchOutLocation);
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
  const [gpsDotCount, setGpsDotCount] = useState(0);
  const [routeMode, setRouteMode] = useState(ROUTE_MODE_ROAD);
  const [roadTravel, setRoadTravel] = useState({
    totalKm: null,
    segmentCount: 0,
    loading: false,
  });

  const prevPunchedIn  = useRef(false);
  const prevPunchedOut = useRef(false);

  // ✅ FIX: destructure socketRef — a stable ref that always points to the live socket
  const { socket, socketRef, connected } = useSocket();

  const [geofences,      setGeofences]      = useState([]);
  const [geofenceAlerts, setGeofenceAlerts] = useState([]);
  const fenceLayersRef = useRef({});
  const drawingMgrRef  = useRef(null);

  const syncStartMarker = useCallback((points = allPtsRef.current) => {
    if (!mapLoaded || !gMapRef.current || !window.google?.maps) return;

    const resolvedPunchIn = resolvePunchInMarkerPosition(
      punchInLocationRef.current,
      points
    );

    if (!resolvedPunchIn?.lat || !resolvedPunchIn?.lng) {
      if (startMkRef.current) {
        startMkRef.current.setMap(null);
        startMkRef.current = null;
      }
      return;
    }

    const G = window.google.maps;
    const map = gMapRef.current;
    const pos = { lat: resolvedPunchIn.lat, lng: resolvedPunchIn.lng };

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
        title: "Punch-in Location",
        zIndex: 10,
        icon: {
          path: G.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
    } else {
      startMkRef.current.setPosition(pos);
    }
  }, [mapLoaded]);

  const isTodaySelected =
    !selectedDate || selectedDate === new Date().toISOString().split("T")[0];
  const isLive = isPunchedIn && !hasPunchedOut && isTodaySelected;

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

  useEffect(() => {
    visitsRef.current = visits;
  }, [visits]);

  useEffect(() => {
    punchInLocationRef.current = punchInLocation;
  }, [punchInLocation]);

  useEffect(() => {
    punchOutLocationRef.current = punchOutLocation;
  }, [punchOutLocation]);

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

  // ── Place punch-in marker ───────────────────────────────────────────────────
  useEffect(() => {
    syncStartMarker();
  }, [mapLoaded, punchInLocation, syncStartMarker]);

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
    const fillColor    = isInProgress ? "#22c55e" : "#4569ea";
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
            ${isInProgress ? "In Progress" : v.status || "Visited"}
          </div>
        </div>`,
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });

    visitMkRef.current.push(marker);
  });
}, [mapLoaded, visits]);

  const syncEndMarker = useCallback((points = allPtsRef.current) => {
    if (!mapLoaded || !gMapRef.current || !window.google?.maps) return;

    const G = window.google.maps;
    const explicitEnd =
      punchOutLocationRef.current?.lat && punchOutLocationRef.current?.lng
        ? { lat: punchOutLocationRef.current.lat, lng: punchOutLocationRef.current.lng }
        : null;
    const trailEnd = points?.length ? points[points.length - 1] : null;
    const markerPos = explicitEnd || (!isLive ? trailEnd : null);

    if (!markerPos) {
      if (endMkRef.current) {
        endMkRef.current.setMap(null);
        endMkRef.current = null;
      }
      return;
    }

    if (endMkRef.current) {
      endMkRef.current.setPosition({ lat: markerPos.lat, lng: markerPos.lng });
    } else {
      endMkRef.current = new G.Marker({
        position: { lat: markerPos.lat, lng: markerPos.lng },
        map: gMapRef.current,
        title: explicitEnd ? "Punch-out Location" : "Tracking Stopped",
        zIndex: 18,
        icon: {
          path: G.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#111827",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
    }
  }, [mapLoaded, isLive]);
  

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

  function appendPath(target, path) {
    for (const point of path) {
      if (!point || !Number.isFinite(Number(point.lat)) || !Number.isFinite(Number(point.lng))) continue;
      const normalized = { lat: Number(point.lat), lng: Number(point.lng) };
      const last = target[target.length - 1];
      if (
        last &&
        Math.abs(last.lat - normalized.lat) < 0.000001 &&
        Math.abs(last.lng - normalized.lng) < 0.000001
      ) {
        continue;
      }
      target.push(normalized);
    }
  }

  async function getRoadPath(points) {
    if (!Array.isArray(points) || points.length < 2) {
      return points.map((point) => ({ lat: point.lat, lng: point.lng }));
    }

    const cacheKey = buildSnapBatchKey(points);
    if (snappedTrailCacheRef.current.key === cacheKey) {
      return snappedTrailCacheRef.current.path;
    }

    const snappedPath = [];
    let currentBatch = [points[0]];

    const flushCurrentBatch = async () => {
      if (currentBatch.length < 2) return;
      const snappedBatch = await fetchSnappedBatch(currentBatch);
      appendPath(snappedPath, snappedBatch);
    };

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const gapMetres = distMetres(prev.lat, prev.lng, curr.lat, curr.lng);

      if (
        gapMetres > SNAP_TO_ROADS_MAX_GAP_METRES ||
        currentBatch.length >= SNAP_TO_ROADS_MAX_POINTS
      ) {
        await flushCurrentBatch();

        if (gapMetres > SNAP_TO_ROADS_MAX_GAP_METRES) {
          appendPath(snappedPath, [
            { lat: prev.lat, lng: prev.lng },
            { lat: curr.lat, lng: curr.lng },
          ]);
          currentBatch = [curr];
        } else {
          currentBatch = [prev, curr];
        }
        continue;
      }

      currentBatch.push(curr);
    }

    await flushCurrentBatch();

    const finalPath = snappedPath.length
      ? snappedPath
      : points.map((point) => ({ lat: point.lat, lng: point.lng }));

    snappedTrailCacheRef.current = { key: cacheKey, path: finalPath };
    return finalPath;
  }

  function clearGpsDots() {
    dotsRef.current.forEach((d) => d.setMap(null));
    dotsRef.current = [];
    setGpsDotCount(0);
  }

  function getGpsDotColor(accuracyValue = 0) {
    const value = Number(accuracyValue) || 0;
    if (!value || value <= 20) return "#16a34a";
    if (value <= 50) return "#d97706";
    return "#dc2626";
  }

  function getLineStyle(mode) {
    if (mode === ROUTE_MODE_RAW) {
      return {
        casingColor: "#ffffff",
        casingWeight: 8,
        mainColor: "#ef4444",
        mainWeight: 4,
        mainOpacity: 0.9,
      };
    }

    return {
      casingColor: "#ffffff",
      casingWeight: 10,
      mainColor: "#ef4444",
      mainWeight: 6,
      mainOpacity: 1,
    };
  }

  function drawGpsDots(rawPoints = []) {
    if (!gMapRef.current || !window.google?.maps) return;
    const G = window.google.maps;
    const map = gMapRef.current;

    dotsRef.current.forEach((d) => d.setMap(null));
    dotsRef.current = [];

    const dotPoints = (Array.isArray(rawPoints) ? rawPoints : [])
      .map((point) => ({
        lat: Number(point?.lat),
        lng: Number(point?.lng),
        accuracy: Number(point?.accuracy ?? 0),
        recordedAt: point?.recordedAt || point?.time || null,
      }))
      .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));

    setGpsDotCount(dotPoints.length);
    if (!dotPoints.length || routeMode !== ROUTE_MODE_RAW) return;

    const step = Math.max(1, Math.ceil(dotPoints.length / MAX_VISIBLE_GPS_DOTS));
    dotPoints.forEach((point, index) => {
      if (index % step !== 0) return;
      const marker = new G.Marker({
        position: { lat: point.lat, lng: point.lng },
        map,
        title: [
          `GPS point ${index + 1}`,
          point.accuracy ? `accuracy +/-${Math.round(point.accuracy)} m` : null,
          point.recordedAt ? new Date(point.recordedAt).toLocaleTimeString() : null,
        ].filter(Boolean).join(" | "),
        zIndex: 12,
        icon: {
          path: G.SymbolPath.CIRCLE,
          scale: routeMode === ROUTE_MODE_RAW ? 4 : 3,
          fillColor: getGpsDotColor(point.accuracy),
          fillOpacity: 0.95,
          strokeColor: "#ffffff",
          strokeOpacity: 1,
          strokeWeight: 1.5,
        },
      });
      dotsRef.current.push(marker);
    });
  }

  async function drawTrail(points, options = {}) {
    const { autoFit = false, autoPanLive = false, rawPoints = points } = options;
    if (!gMapRef.current || !window.google?.maps) return;
    const G   = window.google.maps;
    const map = gMapRef.current;
    if (!Array.isArray(points) || points.length === 0) {
      polyRef.current.casing?.setMap(null);
      polyRef.current.main?.setMap(null);
      polyRef.current = { casing: null, main: null };
      clearGpsDots();
      syncEndMarker([]);
      syncStartMarker([]);
      updateDistanceStats(0, 0);
      return;
    }
    const shouldDrawLine = points.length >= 2 && routeMode !== ROUTE_MODE_RAW;
    const requestSeq = ++drawRequestSeqRef.current;
    const lineStyle = getLineStyle(routeMode);

    let path = points.map((p) => ({ lat: p.lat, lng: p.lng }));
    if (shouldDrawLine && routeMode === ROUTE_MODE_ROAD) {
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
            strokeColor: lineStyle.casingColor,
            strokeOpacity: 1,
            strokeWeight: lineStyle.casingWeight,
            map,
            zIndex: 1000,
          }),
          main: new G.Polyline({
            path,
            geodesic: true,
            strokeColor: lineStyle.mainColor,
            strokeOpacity: lineStyle.mainOpacity,
            strokeWeight: lineStyle.mainWeight,
            map,
            zIndex: 1001,
          }),
        };
      }
      polyRef.current.casing?.setOptions({
        strokeColor: lineStyle.casingColor,
        strokeWeight: lineStyle.casingWeight,
      });
      polyRef.current.main?.setOptions({
        strokeColor: lineStyle.mainColor,
        strokeOpacity: lineStyle.mainOpacity,
        strokeWeight: lineStyle.mainWeight,
      });
    } else {
      polyRef.current.casing?.setMap(null);
      polyRef.current.main?.setMap(null);
      polyRef.current = { casing: null, main: null };
    }

    drawGpsDots(rawPoints);

    const last = points[points.length - 1];
    if (last) {
      if (isLive) {
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
      } else if (liveMkRef.current) {
        liveMkRef.current.setMap(null);
        liveMkRef.current = null;
      }
      if (isLive && autoPanLive && !userAdjustedViewportRef.current) {
        withProgrammaticViewport(() => {
          map.panTo({ lat: last.lat, lng: last.lng });
        });
      }
    }

    syncEndMarker(points);
    syncStartMarker(points);

    if (shouldDrawLine && !isLive && autoFit && !userAdjustedViewportRef.current) {
      const bounds = new G.LatLngBounds();
      path.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      withProgrammaticViewport(() => {
        map.fitBounds(bounds, { top: 60, bottom: 40, left: 40, right: 40 });
      });
    }

    const filteredKm = calcFilteredKm(points);
    const km = filteredKm > 0 ? filteredKm : calcKm(points);
    updateDistanceStats(km, points.length);
    console.log(`[drawTrail] ${points.length} points — ${km.toFixed(3)} km`);
  }

  function cleanPoints(raw, options = {}) {
    const { allowSparse = false, preserveDetail = false } = options;
    if (!Array.isArray(raw)) return [];
    const cleaned = [];
    for (const p of orderPointsByTime(raw)) {
      const lat = Number(p.lat);
      const lng = Number(p.lng);
      const accuracy = Number(p.accuracy ?? 0);
      const distanceFromPrevious = Number(p.distanceFromPrevious ?? 0);
      const recordedAt = p.recordedAt || p.time || null;
      const accuracyLimit = allowSparse ? 150 : preserveDetail ? 100 : 80;

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (accuracy && accuracy > accuracyLimit) continue;

      if (cleaned.length === 0) {
        cleaned.push({ lat, lng, accuracy, distanceFromPrevious, recordedAt });
        continue;
      }

      const prev = cleaned[cleaned.length - 1];
      const distM = distMetres(prev.lat, prev.lng, lat, lng);
      const requiredMove = allowSparse
        ? Math.max(5, Math.min(getEffectiveMoveThreshold(accuracy, prev.accuracy), 18))
        : preserveDetail
          ? Math.max(3, Math.min(getEffectiveMoveThreshold(accuracy, prev.accuracy), 12))
        : Math.max(
            getEffectiveMoveThreshold(accuracy, prev.accuracy),
            distanceFromPrevious > 0 ? 10 : 14
          );
      const gpsNoiseRadius = allowSparse
        ? Math.max(5, Math.min(getGpsNoiseRadiusMetres(accuracy, prev.accuracy), 18))
        : preserveDetail
          ? 0
        : getGpsNoiseRadiusMetres(accuracy, prev.accuracy);

      if (distanceFromPrevious <= 0 && distM < (allowSparse ? 5 : preserveDetail ? 3 : 8)) continue;
      if (distM < requiredMove && distanceFromPrevious <= 0) continue;
      if (!allowSparse && !preserveDetail && distM < gpsNoiseRadius) continue;
      const prevTime = new Date(prev.recordedAt || prev.time || 0).getTime();
      const currTime = new Date(recordedAt || 0).getTime();
      const elapsedHours =
        Number.isFinite(prevTime) && Number.isFinite(currTime) && currTime > prevTime
          ? (currTime - prevTime) / 3600000
          : null;
      const maxBySpeed = elapsedHours
        ? Math.max(150, elapsedHours * MAX_COUNTED_SPEED_KMH * 1000)
        : MAX_COUNTED_SEGMENT_METRES;
      if (!allowSparse && distM > Math.min(MAX_COUNTED_SEGMENT_METRES, maxBySpeed)) continue;

      cleaned.push({ lat, lng, accuracy, distanceFromPrevious, recordedAt });
    }

    return cleaned;
  }

  const fetchRoadTravelDistance = useCallback(async () => {
    if (!userId) return;
    setRoadTravel((prev) => ({ ...prev, loading: true }));
    try {
      const dateParam = getLocalDateString(selectedDate);
      const res = await fetch(
        `${API}/api/v1/location/travel-distance?salesmanId=${userId}&date=${dateParam}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      if (!res.ok) {
        setRoadTravel({ totalKm: null, segmentCount: 0, loading: false });
        return;
      }

      const data = await res.json();
      const result = data?.data || data?.result || data || {};
      const roadKm = Number(result.totalKm);
      setRoadTravel({
        totalKm: Number.isFinite(roadKm) ? roadKm : null,
        segmentCount: Number(result.segmentCount || result.segments?.length || 0),
        loading: false,
      });
    } catch {
      setRoadTravel({ totalKm: null, segmentCount: 0, loading: false });
    }
  }, [userId, selectedDate]);

  const fetchTotalKm = useCallback(async () => {
    if (!userId) return;
    try {
       const dateParam = getLocalDateString(selectedDate);
      const res = await fetch(
        `${API}/api/v1/location/distance?salesmanId=${userId}&date=${dateParam}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      if (!res.ok) {
        if (allPtsRef.current.length >= 2) {
          updateDistanceStats(calcFilteredKm(allPtsRef.current) || calcKm(allPtsRef.current), allPtsRef.current.length);
        }
        return;
      }
      const data = await res.json();
      const dbKm = data?.data?.totalKm ?? data?.result?.totalKm ?? data?.totalKm ?? 0;
      const dbPoints = data?.data?.totalPoints ?? data?.result?.totalPoints ?? data?.totalPoints ?? 0;
      if (Number(dbKm) > 0 || Number(dbPoints) > 0) {
        updateDistanceStats(Math.round(Number(dbKm) * 1000) / 1000, Number(dbPoints) || allPtsRef.current.length);
      } else if (allPtsRef.current.length >= 2) {
        updateDistanceStats(calcFilteredKm(allPtsRef.current) || calcKm(allPtsRef.current), allPtsRef.current.length);
      }
    } catch { /* non-fatal */ }
  }, [userId, selectedDate, updateDistanceStats]);

  const loadTrailFromDB = useCallback(async (options = {}) => {
    const { autoFit = false } = options;
    if (!userId || !mapLoaded) return;
    if (preferVisitTrail) return;
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

      const raw = extractLocationPoints(data);
      const rawAfterPunchIn = filterPointsFromPunchInTime(
        raw,
        punchInLocationRef.current?.time || null
      );
      rawPtsRef.current = rawAfterPunchIn;
      const preserveDetail = routeMode === ROUTE_MODE_RAW;
      const cleaned = cleanPoints(rawAfterPunchIn, { preserveDetail });
      const sparseCleaned = cleaned.length >= 2
        ? cleaned
        : cleanPoints(rawAfterPunchIn, { allowSparse: true, preserveDetail });
      const visitFallbackTrail = extractVisitTrailPoints(
        visitsRef.current,
        punchInLocationRef.current
      );

      console.log(
        `[AdminMap] DB points: raw=${raw.length} afterPunchIn=${rawAfterPunchIn.length} cleaned=${cleaned.length} sparse=${sparseCleaned.length} visitFallback=${visitFallbackTrail.length}`
      );

      const shouldUseVisitFallback =
        sparseCleaned.length < 2 && visitFallbackTrail.length >= 2;

      const baseTrail = shouldUseVisitFallback
        ? visitFallbackTrail
        : sparseCleaned.length > 0
          ? sparseCleaned
          : visitFallbackTrail;

      if (baseTrail.length > 0) {
        const merged = ensureTrailStartsAtPunchIn(
          [...baseTrail],
          punchInLocationRef.current
        );
        if (isLive && isTodaySelected) {
          for (const lp of allPtsRef.current) {
            appendSequentialPoint(merged, lp);
          }
        }
        const finalTrail = cleanPoints(merged, {
          allowSparse: shouldUseVisitFallback,
          preserveDetail: preserveDetail && !shouldUseVisitFallback,
        });
        allPtsRef.current = finalTrail;
        drawTrail(finalTrail, { autoFit, autoPanLive: false, rawPoints: rawAfterPunchIn });
        console.log(`[AdminMap] ✅ Trail: ${finalTrail.length} points — ${calcKm(finalTrail).toFixed(3)} km`);
      } else {
        if (allPtsRef.current.length > 0) {
          drawTrail(allPtsRef.current, { autoFit, autoPanLive: false, rawPoints: rawAfterPunchIn });
        }
        console.warn(`[AdminMap] ⚠️ No DB points — raw:${raw.length} afterPunchIn:${rawAfterPunchIn.length}`);
      }

      await fetchTotalKm();
      await fetchRoadTravelDistance();
    } catch (e) {
      console.error("[AdminMap] ❌ Trail fetch failed:", e.message);
    }
  }, [userId, mapLoaded, fetchTotalKm, fetchRoadTravelDistance, selectedDate, isLive, isTodaySelected, preferVisitTrail, routeMode]);

  useEffect(() => {
    // ✅ Clear old trail and re-fetch whenever selectedDate changes
    polyRef.current.casing?.setMap(null);
    polyRef.current.main?.setMap(null);
    polyRef.current = { casing: null, main: null };
    dotsRef.current.forEach(d => d.setMap(null));
    dotsRef.current = [];
    if (liveMkRef.current) { liveMkRef.current.setMap(null); liveMkRef.current = null; }
    if (endMkRef.current) { endMkRef.current.setMap(null); endMkRef.current = null; }
    allPtsRef.current = [];
    rawPtsRef.current = [];
    snappedTrailCacheRef.current = { key: "", path: [] };
    drawRequestSeqRef.current += 1;
    userAdjustedViewportRef.current = false;
    setGpsDotCount(0);
    updateDistanceStats(0, 0);
    if (!preferVisitTrail) {
      loadTrailFromDB({ autoFit: true });
    }
  }, [loadTrailFromDB, updateDistanceStats, preferVisitTrail]);

  useEffect(() => {
    if (!mapLoaded || isLive) return;

    const visitFallbackTrail = extractVisitTrailPoints(visits, punchInLocation);
    if (allPtsRef.current.length >= 2 || visitFallbackTrail.length < 2) {
      syncEndMarker(allPtsRef.current);
      return;
    }

      const finalTrail = cleanPoints(
        ensureTrailStartsAtPunchIn(visitFallbackTrail, punchInLocation),
        { allowSparse: true }
      );
    if (finalTrail.length >= 2) {
      allPtsRef.current = finalTrail;
      drawTrail(finalTrail, { autoFit: true, autoPanLive: false });
      updateDistanceStats(calcKm(finalTrail), finalTrail.length);
    } else {
      syncEndMarker(finalTrail);
    }
  }, [mapLoaded, isLive, visits, punchInLocation, syncEndMarker, updateDistanceStats]);

  useEffect(() => {
    if (!mapLoaded || !preferVisitTrail) return;

    const visitTrail = extractVisitTrailPoints(visits, punchInLocation);
    const finalTrail = cleanPoints(
      ensureTrailStartsAtPunchIn(visitTrail, punchInLocation),
      { allowSparse: true }
    );

    if (finalTrail.length >= 2) {
      allPtsRef.current = finalTrail;
      drawTrail(finalTrail, { autoFit: true, autoPanLive: false });
      updateDistanceStats(calcKm(finalTrail), finalTrail.length);
      return;
    }

    if (finalTrail.length === 1) {
      allPtsRef.current = finalTrail;
      syncStartMarker(finalTrail);
      syncEndMarker(finalTrail);
      updateDistanceStats(0, finalTrail.length);
      return;
    }

    allPtsRef.current = [];
    syncStartMarker([]);
    syncEndMarker([]);
    updateDistanceStats(0, 0);
  }, [mapLoaded, preferVisitTrail, visits, punchInLocation, syncEndMarker, syncStartMarker, updateDistanceStats]);

  useEffect(() => {
    syncEndMarker(allPtsRef.current);
  }, [punchOutLocation, syncEndMarker]);

  useEffect(() => {
    if (preferVisitTrail) return;
    if (!userId || !mapLoaded || !isLive || !isTodaySelected) return;
    const id = setInterval(() => loadTrailFromDB({ autoFit: false }), 10_000);
    return () => clearInterval(id);
  }, [userId, mapLoaded, loadTrailFromDB, isLive, isTodaySelected, preferVisitTrail]);

  useEffect(() => {
    if (!mapLoaded || allPtsRef.current.length === 0) return;
    drawTrail(allPtsRef.current, {
      autoFit: false,
      autoPanLive: false,
      rawPoints: rawPtsRef.current.length ? rawPtsRef.current : allPtsRef.current,
    });
  }, [mapLoaded, routeMode]);

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
          const newPts = allPts.map((p) => ({ lat: p.lat, lng: p.lng, accuracy: p.accuracy }));
          rawPtsRef.current = newPts;
          const merged = [...allPtsRef.current];
          for (const np of newPts) {
            appendSequentialPoint(merged, np);
            }
            const finalTrail = cleanPoints(merged, { preserveDetail: routeMode === ROUTE_MODE_RAW });
            allPtsRef.current = finalTrail;
            drawTrail(finalTrail, { autoFit: false, autoPanLive: false, rawPoints: rawPtsRef.current });
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
  }, [isPunchedIn, hasPunchedOut, socketRef, mapLoaded, loadTrailFromDB, userId, routeMode]);

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

          const livePoint = { lat, lng, accuracy: acc };
          const rawMerged = [...rawPtsRef.current];
          appendSequentialPoint(rawMerged, livePoint, 1);
          rawPtsRef.current = rawMerged;

          const lastTrailPt = allPtsRef.current[allPtsRef.current.length - 1];
          if (lastTrailPt) {
            const moved = distMetres(lastTrailPt.lat, lastTrailPt.lng, lat, lng);
            const minMoveRequired = routeMode === ROUTE_MODE_RAW
              ? 3
              : getEffectiveMoveThreshold(acc, lastTrailPt.accuracy);
            if (moved >= minMoveRequired) {
              const merged = [...allPtsRef.current, livePoint];
              const finalTrail = cleanPoints(merged, { preserveDetail: routeMode === ROUTE_MODE_RAW });
              allPtsRef.current = finalTrail;
              drawTrail(finalTrail, { autoFit: false, autoPanLive: false, rawPoints: rawPtsRef.current });
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
    const id = setInterval(updateDot, 10_000);
    return () => clearInterval(id);
  }, [isOwner, isPunchedIn, hasPunchedOut, mapLoaded, routeMode]);

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
      const livePoint = { lat: data.lat, lng: data.lng, accuracy: data.accuracy };
      const rawMerged = [...rawPtsRef.current];
      appendSequentialPoint(rawMerged, livePoint, 1);
      rawPtsRef.current = rawMerged;

      const last = allPtsRef.current[allPtsRef.current.length - 1];
      if (last) {
        const dist = distMetres(last.lat, last.lng, data.lat, data.lng);
        const minMoveRequired = routeMode === ROUTE_MODE_RAW
          ? 3
          : getEffectiveMoveThreshold(data.accuracy, last.accuracy);
        if (dist < minMoveRequired) {
          console.log(`[Socket] ⏭ ${dist.toFixed(0)} m jitter — skipped`);
          if (liveMkRef.current) {
            liveMkRef.current.setPosition({ lat: data.lat, lng: data.lng });
          }
          return;
        }
      }
      const merged = [...allPtsRef.current, livePoint];
      const finalTrail = cleanPoints(merged, { preserveDetail: routeMode === ROUTE_MODE_RAW });
      allPtsRef.current = finalTrail;
      drawTrail(finalTrail, { autoFit: false, autoPanLive: false, rawPoints: rawPtsRef.current });
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
  }, [socket, userId, routeMode]);

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

      <div style={{
        position: "absolute", top: accuracy != null ? 44 : 10, right: 10, zIndex: 1000,
        background: "rgba(255,255,255,0.97)", borderRadius: 8,
        padding: 3, boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
        border: "1px solid #e2e8f0", display: "flex", gap: 3,
      }}>
        {[
          { value: ROUTE_MODE_ROAD, label: "Road Route" },
          { value: ROUTE_MODE_RAW, label: "Raw GPS" },
        ].map((mode) => {
          const active = routeMode === mode.value;
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => setRouteMode(mode.value)}
              style={{
                border: 0,
                borderRadius: 6,
                padding: "5px 8px",
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
                color: active ? "#ffffff" : "#475569",
                background: active ? "#ef4444" : "transparent",
                whiteSpace: "nowrap",
              }}
            >
              {mode.label}
            </button>
          );
        })}
      </div>

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
        padding: "8px 12px", fontSize: 12, fontWeight: 700, color: "#0f172a",
        boxShadow: "0 2px 10px rgba(0,0,0,0.12)", pointerEvents: "none",
        display: "flex", alignItems: "center", gap: 10, border: "1px solid #e2e8f0",
      }}>
        {routeMode === ROUTE_MODE_RAW ? (
          <>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#16a34a",
                border: "2px solid #ffffff",
                boxSizing: "border-box",
              }} />
              GPS points
            </span>
            <span style={{ color: "#e2e8f0" }}>|</span>
            {(gpsDotCount || pointCount) > 0
              ? <span>{gpsDotCount || pointCount} point{(gpsDotCount || pointCount) !== 1 ? "s" : ""}</span>
              : <span style={{ color: "#94a3b8" }}>Waiting for movement...</span>}
          </>
        ) : (
          <>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{
                width: 18,
                height: 0,
                borderTop: "4px solid #ef4444",
                borderRadius: 999,
              }} />
              Route
            </span>
            <span style={{ color: "#e2e8f0" }}>|</span>
            <span style={{ color: "#475569", fontSize: 11 }}>
              Clean road view
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

      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
