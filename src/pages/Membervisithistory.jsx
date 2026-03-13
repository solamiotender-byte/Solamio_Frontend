// pages/MemberVisitHistory.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Typography, Button, Paper, Grid, Stack, Chip, IconButton,
  Tooltip, alpha, SwipeableDrawer, Badge, useTheme,
  useMediaQuery, Menu, MenuItem, ListItemIcon, Checkbox,
  ListItemText, FormControlLabel, CircularProgress, Alert,
  Skeleton, BottomNavigation, BottomNavigationAction, Fab, Zoom,
} from "@mui/material";
import {
  CalendarToday, ExpandMore, Mail, Download, Route, LocationOn,
  Timer, Refresh, Add, Store, MyLocation, Login,
  Logout, FilterList, Dashboard, History,
  Person, Close, Layers, Fullscreen, FullscreenExit,
  Map, Satellite, PhotoCamera, VerifiedUser,
} from "@mui/icons-material";
import { useLocation, useParams } from "react-router-dom";

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "http://localhost:9001/api/v1";

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  import.meta.env.REACT_APP_GOOGLE_MAPS_API_KEY ||
  "AIzaSyCqM7uF9c0ZMQjdssHqSMJJ3mBcmz5RNS0";

const PRIMARY = "#136dec";
const SUCCESS = "#22c55e";
const WARNING = "#f59e0b";
const ERROR   = "#ef4444";

// ─── API Helper ───────────────────────────────────────────────────────────────
const apiFetch = async (path, params = {}, options = {}) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  const url = new URL(`${BASE_URL}${path}`);
  if (options.method !== "POST") {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }

  const res = await fetch(url.toString(), {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(options.method === "POST" ? { body: JSON.stringify(params) } : {}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
};

// ─── Format helpers ───────────────────────────────────────────────────────────
const fmt = (date) =>
  date ? new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;

const statusColor = (s) =>
  ({ Completed: SUCCESS, InProgress: PRIMARY, Cancelled: ERROR }[s] || "#94a3b8");

const statusBg = (s) =>
  ({ Completed: "#dcfce7", InProgress: alpha(PRIMARY, 0.1), Cancelled: "#fee2e2" }[s] || "#f1f5f9");

// ─── Date helpers ─────────────────────────────────────────────────────────────
const getDateRange = (range) => {
  const now   = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (range === "today")
    return { startDate: today.toISOString(), endDate: new Date(today.getTime() + 86400000 - 1).toISOString() };
  if (range === "yesterday") {
    const y = new Date(today.getTime() - 86400000);
    return { startDate: y.toISOString(), endDate: new Date(today.getTime() - 1).toISOString() };
  }
  if (range === "week") {
    const w = new Date(today); w.setDate(today.getDate() - today.getDay());
    return { startDate: w.toISOString(), endDate: now.toISOString() };
  }
  if (range === "month") {
    const m = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: m.toISOString(), endDate: now.toISOString() };
  }
  return {};
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const TimelineSkeleton = () => (
  <Stack spacing={3} sx={{ p: 2.5 }}>
    {[1, 2, 3].map((i) => (
      <Box key={i} sx={{ display: "flex", gap: 2 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={16} sx={{ mt: 0.5 }} />
          <Skeleton variant="rounded" width="100%" height={60} sx={{ mt: 1 }} />
        </Box>
      </Box>
    ))}
  </Stack>
);

// ─── Timeline Item ────────────────────────────────────────────────────────────
const TimelineItem = ({ visit, isMobile }) => {
  const [expanded, setExpanded] = useState(false);
  const isCurrent = visit.status === "InProgress";
  const isFirst   = visit.locationName === "Start Location";
  const iconBg    = isFirst ? "#64748b" : isCurrent ? SUCCESS : statusColor(visit.status);

  return (
    <Box sx={{ position: "relative", display: "flex", gap: isMobile ? 1.5 : 2 }}>
      <Box sx={{
        zIndex: 1, width: isMobile ? 36 : 40, height: isMobile ? 36 : 40,
        flexShrink: 0, borderRadius: "50%", bgcolor: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 0 4px #fff",
        ...(isCurrent && {
          animation: "pulse 1.5s ease-in-out infinite",
          "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.6 } },
        }),
      }}>
        {isFirst || isCurrent
          ? <MyLocation sx={{ fontSize: 18, color: "#fff" }} />
          : <Store sx={{ fontSize: 18, color: "#fff" }} />}
      </Box>

      <Box sx={{
        flex: 1, border: isCurrent ? "1px solid #bbf7d0" : "1px solid #f1f5f9",
        bgcolor: isCurrent ? alpha(SUCCESS, 0.03) : "#fff",
        borderRadius: "0.75rem", p: isMobile ? 1.5 : 2,
      }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          mb: 0.5, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 0.5 : 0 }}>
          <Typography variant="body2" fontWeight={700}
            sx={{ color: "#1e293b", fontSize: isMobile ? "0.8rem" : "0.82rem", wordBreak: "break-word" }}>
            {visit.locationName}
          </Typography>
          <Chip label={visit.status} size="small"
            sx={{ bgcolor: statusBg(visit.status), color: statusColor(visit.status), fontWeight: 700,
              fontSize: "0.6rem", height: 20, borderRadius: "0.25rem", letterSpacing: "0.04em",
              alignSelf: isMobile ? "flex-start" : "auto" }} />
        </Box>

        {visit.address && (
          <Stack direction="row" alignItems="center" spacing={0.25} sx={{ mb: 1 }}>
            <LocationOn sx={{ fontSize: 13, color: "#94a3b8" }} />
            <Typography variant="caption"
              sx={{ color: "#64748b", fontSize: isMobile ? "0.68rem" : "0.7rem", wordBreak: "break-word" }}>
              {visit.address}
            </Typography>
          </Stack>
        )}

        {visit.checkInTime && (
          <Stack direction={isMobile ? "column" : "row"} spacing={isMobile ? 0.5 : 3} sx={{ mb: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.4}>
              <Login sx={{ fontSize: 13, color: "#94a3b8" }} />
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, fontSize: isMobile ? "0.65rem" : "0.68rem" }}>
                In: {fmt(visit.checkInTime)}
              </Typography>
            </Stack>
            {visit.checkOutTime && (
              <Stack direction="row" alignItems="center" spacing={0.4}>
                <Logout sx={{ fontSize: 13, color: "#94a3b8" }} />
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, fontSize: isMobile ? "0.65rem" : "0.68rem" }}>
                  Out: {fmt(visit.checkOutTime)}
                </Typography>
              </Stack>
            )}
            {visit.timeSpentMinutes > 0 && (
              <Stack direction="row" alignItems="center" spacing={0.4}>
                <Timer sx={{ fontSize: 13, color: "#94a3b8" }} />
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, fontSize: isMobile ? "0.65rem" : "0.68rem" }}>
                  {visit.timeSpentMinutes} min
                </Typography>
              </Stack>
            )}
          </Stack>
        )}

        {visit.distanceFromPreviousKm > 0 && (
          <Stack direction="row" alignItems="center" spacing={0.4} sx={{ mb: 0.5 }}>
            <Route sx={{ fontSize: 13, color: "#94a3b8" }} />
            <Typography variant="caption" sx={{ color: "#64748b", fontSize: isMobile ? "0.65rem" : "0.68rem" }}>
              {visit.distanceFromPreviousKm.toFixed(2)} km from previous
            </Typography>
          </Stack>
        )}

        {visit.contactPerson && (
          <Stack direction="row" alignItems="center" spacing={0.4} sx={{ mb: 0.5 }}>
            <Person sx={{ fontSize: 13, color: "#94a3b8" }} />
            <Typography variant="caption" sx={{ color: "#64748b", fontSize: isMobile ? "0.65rem" : "0.68rem" }}>
              {visit.contactPerson}{visit.phone ? ` · ${visit.phone}` : ""}
            </Typography>
          </Stack>
        )}

        {visit.photos?.length > 0 && (
          <Stack direction="row" alignItems="center" spacing={0.4} sx={{ mb: 0.5 }}>
            <PhotoCamera sx={{ fontSize: 13, color: "#94a3b8" }} />
            <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.65rem" }}>
              {visit.photos.length} photo{visit.photos.length > 1 ? "s" : ""}
            </Typography>
          </Stack>
        )}

        {visit.verified && (
          <Stack direction="row" alignItems="center" spacing={0.4} sx={{ mb: 0.5 }}>
            <VerifiedUser sx={{ fontSize: 13, color: SUCCESS }} />
            <Typography variant="caption" sx={{ color: SUCCESS, fontSize: "0.65rem", fontWeight: 600 }}>
              Verified
            </Typography>
          </Stack>
        )}

        {visit.remarks && (
          isMobile && !expanded
            ? <Button size="small" onClick={() => setExpanded(true)}
                sx={{ mt: 0.5, p: 0, color: PRIMARY, fontSize: "0.65rem", textTransform: "none", fontWeight: 600 }}>
                Show Notes
              </Button>
            : <Box sx={{ bgcolor: "#f8fafc", borderLeft: `2px solid ${alpha(PRIMARY, 0.3)}`,
                borderRadius: "0 0.5rem 0.5rem 0", p: 1.25, mt: 0.5 }}>
                <Typography variant="caption"
                  sx={{ color: "#475569", fontSize: isMobile ? "0.7rem" : "0.72rem", fontStyle: "italic", wordBreak: "break-word" }}>
                  "{visit.remarks}"
                </Typography>
                {isMobile && (
                  <Button size="small" onClick={() => setExpanded(false)}
                    sx={{ mt: 0.5, p: 0, color: PRIMARY, fontSize: "0.65rem", textTransform: "none", fontWeight: 600 }}>
                    Hide
                  </Button>
                )}
              </Box>
        )}

        {visit.isLeadCreate && (
          <Chip label="Lead Created" size="small"
            sx={{ mt: 1, bgcolor: alpha(WARNING, 0.1), color: WARNING, fontWeight: 700, fontSize: "0.6rem", height: 20 }} />
        )}
      </Box>
    </Box>
  );
};

// ─── Filter Drawer ────────────────────────────────────────────────────────────
const FilterDrawer = ({ open, onClose, filters, onApply }) => {
  const [local, setLocal] = useState(filters);
  return (
    <SwipeableDrawer anchor="bottom" open={open} onClose={onClose} onOpen={() => {}}
      PaperProps={{ sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80vh" } }}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ width: 40, height: 4, bgcolor: "grey.300", borderRadius: 2, mx: "auto", mb: 2 }} />
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={700} color={PRIMARY}>Filter Visits</Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Stack>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Date Range</Typography>
            <Stack spacing={1}>
              {[
                { value: "today",     label: "Today"      },
                { value: "yesterday", label: "Yesterday"  },
                { value: "week",      label: "This Week"  },
                { value: "month",     label: "This Month" },
              ].map((opt) => (
                <Button key={opt.value} fullWidth
                  variant={local.dateRange === opt.value ? "contained" : "outlined"}
                  onClick={() => setLocal(p => ({ ...p, dateRange: opt.value }))}
                  sx={{ justifyContent: "flex-start", borderRadius: 2, borderColor: PRIMARY,
                    color: local.dateRange === opt.value ? "#fff" : PRIMARY,
                    bgcolor: local.dateRange === opt.value ? PRIMARY : "transparent" }}>
                  {opt.label}
                </Button>
              ))}
            </Stack>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Status</Typography>
            <Stack spacing={0.5}>
              {["Completed", "InProgress", "Cancelled"].map((s) => (
                <FormControlLabel key={s}
                  control={
                    <Checkbox checked={local.statuses?.includes(s) || false}
                      onChange={(e) => {
                        const arr = local.statuses || [];
                        setLocal(p => ({ ...p, statuses: e.target.checked ? [...arr, s] : arr.filter(x => x !== s) }));
                      }}
                      sx={{ color: PRIMARY, "&.Mui-checked": { color: PRIMARY } }} />
                  }
                  label={s} />
              ))}
            </Stack>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button fullWidth variant="outlined" onClick={onClose}
              sx={{ borderColor: PRIMARY, color: PRIMARY, borderRadius: 2 }}>Cancel</Button>
            <Button fullWidth variant="contained" onClick={() => { onApply(local); onClose(); }}
              sx={{ bgcolor: PRIMARY, borderRadius: 2, "&:hover": { bgcolor: "#0f5fd4" } }}>Apply</Button>
          </Stack>
        </Stack>
      </Box>
    </SwipeableDrawer>
  );
};

// ─── Resolve address helper ───────────────────────────────────────────────────
const resolveAddress = (addr) => {
  if (!addr) return null;
  if (typeof addr === "string") return addr;
  return addr.short || addr.full?.split(",")[0] || null;
};

// ─── Load Google Maps JS API once ────────────────────────────────────────────
let gmapsPromise = null;
const loadGoogleMaps = () => {
  if (window.google?.maps) return Promise.resolve();
  if (gmapsPromise) return gmapsPromise;
  gmapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.onload  = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return gmapsPromise;
};

// ─── LiveTrackingMap ──────────────────────────────────────────────────────────
// Shows real-time red route line as user moves throughout the day.
// trackPoints = [{ lat, lng, time }] — grows while punched in
const LiveTrackingMap = ({
  punchInLocation, visits, mapStyle, loading,
  totalDistance, filters, isPunchedIn, hasPunchedOut,
  trackPoints,
}) => {
  const mapRef        = useRef(null);   // DOM div
  const gMapRef       = useRef(null);   // google.maps.Map instance
  const polylineRef   = useRef(null);   // red route polyline
  const markersRef    = useRef([]);     // all markers (for cleanup)
  const pulseRef      = useRef(null);   // current-location pulsing dot
  const [gmReady, setGmReady] = useState(false);

  // ── Load Google Maps JS ───────────────────────────────────────────────────
  useEffect(() => {
    loadGoogleMaps().then(() => setGmReady(true)).catch(console.error);
  }, []);

  // ── Init map once SDK is ready ────────────────────────────────────────────
  useEffect(() => {
    if (!gmReady || !mapRef.current) return;
    if (gMapRef.current) return; // already init'd

    const mapTypeId =
      mapStyle === "satellite" ? "satellite"
      : mapStyle === "terrain"  ? "terrain"
      : "roadmap";

    gMapRef.current = new window.google.maps.Map(mapRef.current, {
      center:    punchInLocation?.lat
        ? { lat: punchInLocation.lat, lng: punchInLocation.lng }
        : { lat: 20.5937, lng: 78.9629 },
      zoom:      punchInLocation?.lat ? 15 : 5,
      mapTypeId,
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      ],
    });
  }, [gmReady]);

  // ── Update map type when style changes ────────────────────────────────────
  useEffect(() => {
    if (!gMapRef.current) return;
    const mapTypeId =
      mapStyle === "satellite" ? "satellite"
      : mapStyle === "terrain"  ? "terrain"
      : "roadmap";
    gMapRef.current.setMapTypeId(mapTypeId);
  }, [mapStyle]);

  // ── Draw / update everything when trackPoints or visits change ────────────
  useEffect(() => {
    if (!gMapRef.current || !gmReady) return;
    const map = gMapRef.current;
    const G   = window.google.maps;

    // ── Clear old overlays ────────────────────────────────────────────────
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
    if (pulseRef.current)    { pulseRef.current.setMap(null);    pulseRef.current    = null; }

    const allPoints = [...trackPoints];

    // ── Red route polyline ────────────────────────────────────────────────
    if (allPoints.length >= 2) {
      polylineRef.current = new G.Polyline({
        path:          allPoints.map(p => ({ lat: p.lat, lng: p.lng })),
        geodesic:      true,
        strokeColor:   "#ef4444",   // red
        strokeOpacity: 0.85,
        strokeWeight:  4,
        map,
        icons: [{
          icon: {
            path:         G.SymbolPath.FORWARD_CLOSED_ARROW,
            scale:        3,
            strokeColor:  "#ef4444",
            fillColor:    "#ef4444",
            fillOpacity:  1,
          },
          offset: "50%",
          repeat: "120px",
        }],
      });
    }

    // ── Green START marker ────────────────────────────────────────────────
    if (punchInLocation?.lat) {
      const startMarker = new G.Marker({
        position: { lat: punchInLocation.lat, lng: punchInLocation.lng },
        map,
        title: "Start: " + (resolveAddress(punchInLocation.address) || "Punch-in location"),
        icon: {
          path:        G.SymbolPath.CIRCLE,
          scale:       10,
          fillColor:   "#22c55e",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 3,
        },
        zIndex: 10,
      });
      markersRef.current.push(startMarker);
    }

    // ── Visit stop markers (blue pins) ────────────────────────────────────
    const visitCoords = visits.filter(v => v.latitude && v.longitude);
    visitCoords.forEach((v, i) => {
      const marker = new G.Marker({
        position: { lat: v.latitude, lng: v.longitude },
        map,
        title: v.locationName || `Visit ${i + 1}`,
        label: {
          text:      String(i + 1),
          color:     "#fff",
          fontSize:  "11px",
          fontWeight: "700",
        },
        icon: {
          path:        G.SymbolPath.CIRCLE,
          scale:       14,
          fillColor:   "#136dec",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
        zIndex: 8,
      });
      markersRef.current.push(marker);
    });

    // ── Current location pulsing dot ──────────────────────────────────────
    const lastPoint = allPoints[allPoints.length - 1];
    if (lastPoint && isPunchedIn && !hasPunchedOut) {
      pulseRef.current = new G.Marker({
        position: { lat: lastPoint.lat, lng: lastPoint.lng },
        map,
        title: "Current location",
        icon: {
          path:        G.SymbolPath.CIRCLE,
          scale:       8,
          fillColor:   "#ef4444",
          fillOpacity: 1,
          strokeColor: "rgba(239,68,68,0.3)",
          strokeWeight: 8,
        },
        zIndex: 20,
        animation: G.Animation.BOUNCE,
      });
      // Stop bouncing after 2s
      setTimeout(() => {
        if (pulseRef.current) pulseRef.current.setAnimation(null);
      }, 2000);
    }

    // ── Auto-fit bounds if we have points ────────────────────────────────
    const allCoords = [
      ...(punchInLocation?.lat ? [{ lat: punchInLocation.lat, lng: punchInLocation.lng }] : []),
      ...allPoints.map(p => ({ lat: p.lat, lng: p.lng })),
      ...visitCoords.map(v => ({ lat: v.latitude, lng: v.longitude })),
    ];
    if (allCoords.length >= 2) {
      const bounds = new G.LatLngBounds();
      allCoords.forEach(c => bounds.extend(c));
      map.fitBounds(bounds, { top: 60, bottom: 40, left: 40, right: 40 });
    } else if (allCoords.length === 1) {
      map.setCenter(allCoords[0]);
      map.setZoom(16);
    }

  }, [gmReady, trackPoints, visits, isPunchedIn, hasPunchedOut, punchInLocation]);

  const hasCoords = !!(punchInLocation?.lat && punchInLocation?.lng);

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      {/* ── Map container ── */}
      {loading && !gmReady ? (
        <Skeleton variant="rectangular" width="100%" height="100%"
          sx={{ position: "absolute", inset: 0, borderRadius: "0.75rem" }} />
      ) : (
        <Box
          ref={mapRef}
          sx={{ width: "100%", height: "100%", borderRadius: "0.75rem", overflow: "hidden" }}
        />
      )}

      {/* ── Status badge ── */}
      {hasCoords && (
        <Box sx={{
          position: "absolute", top: 52, left: 12, zIndex: 10,
          bgcolor: "rgba(255,255,255,0.97)", backdropFilter: "blur(4px)",
          px: 1.25, py: 0.6, borderRadius: "999px",
          border: `1px solid ${alpha(isPunchedIn && !hasPunchedOut ? SUCCESS : "#94a3b8", 0.4)}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          display: "flex", alignItems: "center", gap: 0.75,
          maxWidth: "calc(100% - 60px)",
        }}>
          <Box sx={{
            width: 8, height: 8, borderRadius: "50%",
            bgcolor: isPunchedIn && !hasPunchedOut ? SUCCESS : "#94a3b8",
            flexShrink: 0,
            ...(isPunchedIn && !hasPunchedOut && {
              animation: "liveDot 1.5s ease-in-out infinite",
              "@keyframes liveDot": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.2 } },
            }),
          }} />
          <Typography sx={{
            fontSize: "0.65rem", fontWeight: 700,
            color: isPunchedIn && !hasPunchedOut ? "#064e3b" : "#475569",
            whiteSpace: "nowrap",
          }}>
            {isPunchedIn && !hasPunchedOut ? "Live Tracking" : "Punched Out"}
          </Typography>
          {trackPoints.length > 0 && (
            <Typography sx={{ fontSize: "0.62rem", color: "#64748b", whiteSpace: "nowrap" }}>
              · {trackPoints.length} point{trackPoints.length !== 1 ? "s" : ""}
            </Typography>
          )}
        </Box>
      )}

      {/* ── Legend ── */}
      {(hasCoords || visits.some(v => v.latitude)) && (
        <Box sx={{
          position: "absolute", top: 52, right: 12, zIndex: 10,
          bgcolor: "rgba(255,255,255,0.95)", backdropFilter: "blur(4px)",
          px: 1.25, py: 0.75, borderRadius: "0.5rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          display: "flex", flexDirection: "column", gap: 0.5,
        }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#22c55e", border: "2px solid #fff", boxShadow: "0 0 0 1px #22c55e" }} />
            <Typography sx={{ fontSize: "0.6rem", color: "#374151", fontWeight: 600 }}>Start</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Box sx={{ width: 24, height: 3, bgcolor: "#ef4444", borderRadius: 1 }} />
            <Typography sx={{ fontSize: "0.6rem", color: "#374151", fontWeight: 600 }}>Route</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#136dec", border: "2px solid #fff" }} />
            <Typography sx={{ fontSize: "0.6rem", color: "#374151", fontWeight: 600 }}>Visit</Typography>
          </Stack>
        </Box>
      )}

      {/* ── Distance badge ── */}
      <Box sx={{
        position: "absolute", bottom: 12, left: 12, zIndex: 10,
        bgcolor: "rgba(255,255,255,0.95)", backdropFilter: "blur(4px)",
        px: 1.5, py: 0.75, borderRadius: "0.5rem",
        boxShadow: "0 1px 6px rgba(0,0,0,0.12)",
        pointerEvents: "none",
      }}>
        {loading
          ? <Skeleton width={120} height={16} />
          : <Typography variant="caption" fontWeight={600} sx={{ fontSize: "0.72rem", color: "#0f172a" }}>
              {filters.dateRange === "today" ? "Today's Route" : "Route"}: {totalDistance.toFixed(1)} km
            </Typography>
        }
      </Box>
    </Box>
  );
};

// ─── Punch Status Card ────────────────────────────────────────────────────────
// Only shown when isAdminView = false (i.e. the user viewing their own page)
const PunchStatusCard = ({
  isPunchedIn, hasPunchedOut, punchInLocation, punchLoading,
  punchError, onPunchIn, onPunchOut,
}) => {
  const resolveAddress = (addr) => {
    if (!addr) return null;
    if (typeof addr === "string") return addr;
    return addr.short || addr.full?.split(",")[0] || null;
  };

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: "0.75rem", border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
      {punchError && (
        <Alert severity="warning" onClose={() => {}} sx={{ mb: 1.5, borderRadius: 1, py: 0.5 }}>
          {punchError}
        </Alert>
      )}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
            {/* Pulsing dot only when actively on duty */}
            {isPunchedIn && !hasPunchedOut && (
              <Box sx={{
                width: 8, height: 8, borderRadius: "50%", bgcolor: SUCCESS, flexShrink: 0,
                animation: "dot 1.5s ease-in-out infinite",
                "@keyframes dot": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.2 } },
              }} />
            )}
            <Typography variant="body2" fontWeight={700} sx={{ color: "#0f172a" }}>
              {/* ✅ Fix 2: correct status text based on both punch states */}
              {!isPunchedIn && !hasPunchedOut
                ? "Not Punched In"
                : isPunchedIn && !hasPunchedOut
                ? "Currently On Duty"
                : "Day Complete"}
            </Typography>
          </Stack>

          {punchInLocation?.address && (
            <Stack direction="row" alignItems="flex-start" spacing={0.4} sx={{ mt: 0.25 }}>
              <LocationOn sx={{ fontSize: 13, color: PRIMARY, mt: "1px", flexShrink: 0 }} />
              <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                {resolveAddress(punchInLocation.address)}
              </Typography>
            </Stack>
          )}

          {punchInLocation?.time && (
            <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.68rem", display: "block", mt: 0.25 }}>
              {hasPunchedOut ? "Punched in at" : "Since"} {fmt(punchInLocation.time)}
            </Typography>
          )}

          {!isPunchedIn && !hasPunchedOut && (
            <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>
              Tap "Punch In" — your location will appear on the map instantly
            </Typography>
          )}
        </Box>

        {/* ✅ Fix 1 + Fix 2: show correct button based on both punch states */}
        {!isPunchedIn && !hasPunchedOut && (
          // Not punched in at all → show Punch In
          <Button variant="contained"
            startIcon={punchLoading
              ? <CircularProgress size={16} color="inherit" />
              : <MyLocation sx={{ fontSize: 18 }} />}
            disabled={punchLoading}
            onClick={onPunchIn}
            sx={{
              bgcolor: SUCCESS, color: "#fff", fontWeight: 700, fontSize: "0.82rem",
              textTransform: "none", borderRadius: "0.5rem", px: 2.5, py: 1.1,
              whiteSpace: "nowrap", boxShadow: `0 2px 8px ${alpha(SUCCESS, 0.35)}`,
              "&:hover": { bgcolor: "#16a34a" },
              "&:disabled": { bgcolor: alpha(SUCCESS, 0.5), color: "#fff" },
            }}>
            {punchLoading ? "Getting location…" : "Punch In"}
          </Button>
        )}

        {isPunchedIn && !hasPunchedOut && (
          // Punched in but not yet punched out → show Punch Out
          <Button variant="outlined"
            startIcon={punchLoading
              ? <CircularProgress size={16} />
              : <Logout sx={{ fontSize: 18 }} />}
            disabled={punchLoading}
            onClick={onPunchOut}
            sx={{
              borderColor: ERROR, color: ERROR, fontWeight: 700, fontSize: "0.82rem",
              textTransform: "none", borderRadius: "0.5rem", px: 2.5, py: 1.1,
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: alpha(ERROR, 0.06), borderColor: ERROR },
            }}>
            {punchLoading ? "Punching out…" : "Punch Out"}
          </Button>
        )}

        {hasPunchedOut && (
          // Already punched out → show disabled "Day Complete"
          <Chip
            label="Day Complete"
            sx={{
              bgcolor: alpha(SUCCESS, 0.1), color: SUCCESS,
              fontWeight: 700, fontSize: "0.78rem", px: 1,
              border: `1px solid ${alpha(SUCCESS, 0.3)}`,
            }}
          />
        )}
      </Stack>
    </Paper>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MemberVisitHistory({ userId: propUserId }) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ── Detect if this is admin viewing a member ──────────────────────────────
  // TeamTracking navigates to /member-history/:userId with state.fromTeam = true
  const { userId: paramUserId } = useParams();
  const routeLocation           = useLocation();
  const memberInfo              = routeLocation?.state || {};

  // userId to query — from route param or prop
  const userId      = paramUserId || propUserId || null;
  // ✅ Admin view = there is a userId in the URL (admin viewing someone else)
  const isAdminView = !!paramUserId;

  // ── Data state ────────────────────────────────────────────────────────────
  const [visits,       setVisits]       = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error,        setError]        = useState(null);
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(false);
  const [loadingMore,  setLoadingMore]  = useState(false);

  // ── Punch state ───────────────────────────────────────────────────────────
  // punchInLocation = { lat, lng, address, time } | null
  const [punchInLocation, setPunchInLocation] = useState(null);
  const [isPunchedIn,     setIsPunchedIn]     = useState(false);
  const [hasPunchedOut,   setHasPunchedOut]   = useState(false); // ✅ NEW
  const [punchLoading,    setPunchLoading]    = useState(false);
  const [punchError,      setPunchError]      = useState(null);
  // Live GPS tracking — grows while user is punched in
  const [trackPoints,     setTrackPoints]     = useState([]);
  const trackIntervalRef  = useRef(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [filters,          setFilters]          = useState({ dateRange: "today", statuses: [] });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [bottomNav,        setBottomNav]        = useState(0);
  const [mapStyleAnchor,   setMapStyleAnchor]   = useState(null);
  const [mapStyle,         setMapStyle]         = useState("roadmap");
  const [fullscreenMap,    setFullscreenMap]    = useState(false);

  // ── Fetch punch-in status from attendance API ─────────────────────────────
  const fetchPunchInStatus = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res   = await apiFetch("/attendance", {
        startDate: today, endDate: today,
        ...(userId ? { userId } : {}),
        limit: 1,
      });

      const list = res?.data?.attendances || res?.result?.attendances || res?.data || [];
      const att  = Array.isArray(list) ? list[0] : list;

      if (att?.punchIn?.time) {
        // ✅ Fix 2: check punchOut FIRST — if already punched out, don't show "On Duty"
        const alreadyPunchedOut = !!att?.punchOut?.time;

        setIsPunchedIn(!alreadyPunchedOut); // true only if still clocked in
        setHasPunchedOut(alreadyPunchedOut);

        // Always save punch-in location so map shows where they started
        setPunchInLocation({
          lat:     att.punchIn?.location?.lat      || att.punchIn?.location?.latitude  || null,
          lng:     att.punchIn?.location?.lng      || att.punchIn?.location?.longitude || null,
          address: att.punchIn?.address            || null,
          time:    att.punchIn?.time               || null,
        });
      } else {
        // No punch-in at all today
        setIsPunchedIn(false);
        setHasPunchedOut(false);
        setPunchInLocation(null);
      }
    } catch (e) {
      console.warn("Could not fetch punch-in status:", e.message);
    }
  }, [userId]);

  // ── Punch In ──────────────────────────────────────────────────────────────
  const handlePunchIn = useCallback(() => {
    if (!navigator.geolocation) {
      setPunchError("Geolocation is not supported by your browser.");
      return;
    }
    setPunchLoading(true);
    setPunchError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;

        let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        try {
          const geoRes  = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`);
          const geoData = await geoRes.json();
          if (geoData.results?.[0]?.formatted_address)
            address = geoData.results[0].formatted_address;
        } catch { /* use coords as fallback */ }

        const startPoint = { lat, lng, time: new Date().toISOString() };

        // Update map immediately with first point
        setPunchInLocation({ lat, lng, address, accuracy, time: startPoint.time });
        setTrackPoints([startPoint]);
        setIsPunchedIn(true);
        setHasPunchedOut(false);

        // Start GPS polling every 30 seconds
        if (trackIntervalRef.current) clearInterval(trackIntervalRef.current);
        trackIntervalRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (p) => {
              setTrackPoints(prev => [
                ...prev,
                { lat: p.coords.latitude, lng: p.coords.longitude, time: new Date().toISOString() },
              ]);
            },
            () => {}, // silent fail — keep old points
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
          );
        }, 30000); // every 30 seconds

        try {
          await apiFetch("/attendance/punch-in", { location: { lat, lng }, address }, { method: "POST" });
        } catch (e) {
          console.warn("Punch-in API call failed:", e.message);
        }

        setPunchLoading(false);
      },
      (err) => {
        const msg =
          err.code === 1 ? "Location permission denied. Please allow location access."
          : err.code === 2 ? "Unable to get location. Check GPS settings."
          : "Location request timed out. Please try again.";
        setPunchError(msg);
        setPunchLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, []);

  // ── Punch Out ─────────────────────────────────────────────────────────────
  const handlePunchOut = useCallback(async () => {
    // Stop GPS polling
    if (trackIntervalRef.current) {
      clearInterval(trackIntervalRef.current);
      trackIntervalRef.current = null;
    }
    try {
      setPunchLoading(true);
      await apiFetch("/attendance/punch-out", {}, { method: "POST" });
      setIsPunchedIn(false);
      setHasPunchedOut(true); // keep location on map, stop the live dot
    } catch (e) {
      setPunchError("Punch out failed: " + e.message);
    } finally {
      setPunchLoading(false);
    }
  }, []);

  // ── Cleanup polling on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (trackIntervalRef.current) clearInterval(trackIntervalRef.current);
    };
  }, []);

  // ── Fetch Visits ──────────────────────────────────────────────────────────
  const fetchVisits = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true); else setLoadingMore(true);
      setError(null);
      const dateParams = getDateRange(filters.dateRange);
      const params = {
        page: pageNum, limit: 10, ...dateParams,
        ...(userId ? { userId } : {}),
        ...(filters.statuses?.length === 1 ? { status: filters.statuses[0] } : {}),
      };
      const res       = await apiFetch("/visit", params);
      const data      = res.data || res;
      const newVisits = data.visits || data.data || [];
      setVisits(prev => append ? [...prev, ...newVisits] : newVisits);
      setHasMore(data.pagination ? pageNum < data.pagination.totalPages : false);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [filters, userId]);

  // ── Fetch Stats ───────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const dateParams = getDateRange(filters.dateRange);
      const res = await apiFetch("/visit/stats", { ...dateParams, ...(userId ? { userId } : {}) });
      setStats(res.data || res);
    } catch { /* optional */ }
    finally { setStatsLoading(false); }
  }, [filters, userId]);

  useEffect(() => {
    setPage(1);
    fetchVisits(1, false);
    fetchStats();
    fetchPunchInStatus();
  }, [filters, userId]);

  const handleLoadMore = () => { const n = page + 1; setPage(n); fetchVisits(n, true); };
  const handleRefresh  = () => {
    setPage(1);
    fetchVisits(1, false);
    fetchStats();
    fetchPunchInStatus();
  };

  // Metrics
  const totalDistance    = visits.reduce((s, v) => s + (v.distanceFromPreviousKm || 0), 0);
  const completedVisits  = visits.filter(v => v.status === "Completed").length;
  const inProgressVisits = visits.filter(v => v.status === "InProgress").length;
  const avgTime = visits.length
    ? Math.round(visits.reduce((s, v) => s + (v.timeSpentMinutes || 0), 0) / visits.length) : 0;

  const METRICS = [
    { icon: <Route />,      label: "Distance",  value: totalDistance.toFixed(1), unit: "km"    },
    { icon: <LocationOn />, label: "Visits",    value: visits.length,            unit: "stops" },
    { icon: <Timer />,      label: "Avg. Time", value: avgTime,                  unit: "mins"  },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f7f8", fontFamily: "'Inter', sans-serif", pb: isMobile ? 7 : 0 }}>
      <FilterDrawer open={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)}
        filters={filters} onApply={setFilters} />

      <Menu anchorEl={mapStyleAnchor} open={Boolean(mapStyleAnchor)} onClose={() => setMapStyleAnchor(null)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 180, mt: 1 } }}>
        {[{ value: "roadmap",   label: "Road Map",  icon: <Map fontSize="small" />       },
          { value: "satellite", label: "Satellite", icon: <Satellite fontSize="small" /> },
          { value: "terrain",   label: "Terrain",   icon: <Layers fontSize="small" />    },
        ].map(opt => (
          <MenuItem key={opt.value} onClick={() => { setMapStyle(opt.value); setMapStyleAnchor(null); }}>
            <ListItemIcon>{opt.icon}</ListItemIcon>
            <ListItemText>{opt.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      <Box component="main" sx={{ p: { xs: 2, sm: 3, lg: 5 }, maxWidth: 1280, mx: "auto", width: "100%" }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}
            action={<Button size="small" onClick={handleRefresh}>Retry</Button>}>{error}</Alert>
        )}

        <Grid container spacing={isMobile ? 2 : 4}>

          {/* LEFT */}
          <Grid item xs={12} lg={7}>
            <Stack spacing={isMobile ? 2 : 3}>

              {/* ✅ Fix 1: Punch card ONLY for non-admin (own view) */}
              {!isAdminView && (
                <PunchStatusCard
                  isPunchedIn={isPunchedIn}
                  hasPunchedOut={hasPunchedOut}
                  punchInLocation={punchInLocation}
                  punchLoading={punchLoading}
                  punchError={punchError}
                  onPunchIn={handlePunchIn}
                  onPunchOut={handlePunchOut}
                />
              )}

              {/* Map */}
              <Paper elevation={0} sx={{
                position: "relative", overflow: "hidden", borderRadius: "0.75rem",
                border: "1px solid #e2e8f0", height: { xs: 280, sm: 380, lg: 460 },
              }}>
                {/* Style selector */}
                <Box onClick={(e) => setMapStyleAnchor(e.currentTarget)} sx={{
                  position: "absolute", top: 12, left: 12, zIndex: 10,
                  bgcolor: "rgba(255,255,255,0.95)", backdropFilter: "blur(4px)",
                  borderRadius: "0.5rem", px: 1.5, py: 0.75,
                  display: "flex", alignItems: "center", gap: 1, cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}>
                  <Layers sx={{ fontSize: 16, color: PRIMARY }} />
                  <Typography variant="caption" fontWeight={600}
                    sx={{ color: "#1e293b", textTransform: "capitalize" }}>{mapStyle}</Typography>
                  <ExpandMore sx={{ fontSize: 16, color: "#64748b" }} />
                </Box>

                {/* Fullscreen toggle */}
                <Box sx={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
                  <Paper elevation={3} onClick={() => setFullscreenMap(p => !p)}
                    sx={{ width: 34, height: 34, display: "flex", alignItems: "center",
                      justifyContent: "center", borderRadius: "0.5rem", cursor: "pointer",
                      "&:hover": { bgcolor: "#f8fafc" } }}>
                    {fullscreenMap ? <FullscreenExit sx={{ fontSize: 18 }} /> : <Fullscreen sx={{ fontSize: 18 }} />}
                  </Paper>
                </Box>

                <LiveTrackingMap
                  punchInLocation={punchInLocation}
                  visits={visits}
                  mapStyle={mapStyle}
                  loading={loading}
                  totalDistance={totalDistance}
                  filters={filters}
                  isPunchedIn={isPunchedIn}
                  hasPunchedOut={hasPunchedOut}
                  trackPoints={trackPoints}
                />
              </Paper>

              {/* Metrics */}
              <Box sx={{ overflowX: isMobile ? "auto" : "visible", pb: isMobile ? 1 : 0 }}>
                <Grid container spacing={isMobile ? 1.5 : 2}
                  sx={{ minWidth: isMobile ? 600 : "auto", flexWrap: isMobile ? "nowrap" : "wrap" }}>
                  {METRICS.map((m, i) => (
                    <Grid item key={i} sx={{ flex: isMobile ? "0 0 auto" : 1, width: isMobile ? 200 : "auto" }}>
                      <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: "0.75rem",
                        border: "1px solid #e2e8f0", bgcolor: "#fff",
                        "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }, transition: "box-shadow 0.2s" }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          {React.cloneElement(m.icon, { sx: { fontSize: 20, color: PRIMARY } })}
                          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, fontSize: "0.78rem" }}>
                            {m.label}
                          </Typography>
                        </Stack>
                        {loading ? <Skeleton width={60} height={32} /> : (
                          <Typography variant="h5" fontWeight={700}
                            sx={{ color: "#0f172a", letterSpacing: "-0.5px", fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
                            {m.value}{" "}
                            <Typography component="span" variant="body2"
                              sx={{ color: "#94a3b8", fontWeight: 400, fontSize: "0.78rem" }}>{m.unit}</Typography>
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {stats && !statsLoading && (
                <Paper elevation={0} sx={{ p: 2, borderRadius: "0.75rem", border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: "#0f172a" }}>
                    Performance Summary
                  </Typography>
                  <Grid container spacing={2}>
                    {[
                      { label: "Total Visits",  value: stats.totalVisits     ?? visits.length,        color: PRIMARY   },
                      { label: "Completed",      value: stats.completedVisits ?? completedVisits,      color: SUCCESS   },
                      { label: "In Progress",    value: stats.inProgressVisits ?? inProgressVisits,   color: WARNING   },
                      { label: "Total Distance", value: `${(stats.totalDistance ?? totalDistance).toFixed(1)} km`, color: "#6366f1" },
                    ].map((s, i) => (
                      <Grid item xs={6} key={i}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="body2" color="text.secondary" fontSize="0.75rem">{s.label}</Typography>
                          <Typography variant="body2" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              )}
            </Stack>
          </Grid>

          {/* RIGHT */}
          <Grid item xs={12} lg={5}>
            <Stack spacing={isMobile ? 2 : 3}>
              <Stack direction={isMobile ? "column" : "row"} spacing={isMobile ? 1 : 1.5}>
                <Button fullWidth startIcon={<Mail sx={{ fontSize: 18 }} />}
                  sx={{ bgcolor: PRIMARY, color: "#fff", fontWeight: 700, fontSize: "0.8rem",
                    textTransform: "none", borderRadius: "0.5rem", py: 1.25,
                    boxShadow: `0 1px 3px ${alpha(PRIMARY, 0.3)}`, "&:hover": { bgcolor: "#0f5fd4" } }}>
                  Contact Member
                </Button>
                <Button fullWidth variant="outlined" startIcon={<Download sx={{ fontSize: 18 }} />}
                  sx={{ borderColor: "#e2e8f0", color: "#1e293b", fontWeight: 700, fontSize: "0.8rem",
                    textTransform: "none", borderRadius: "0.5rem", py: 1.25,
                    bgcolor: "#fff", "&:hover": { bgcolor: "#f8fafc" } }}>
                  Export Report
                </Button>
              </Stack>

              <Paper elevation={0} sx={{ borderRadius: "0.75rem", border: "1px solid #e2e8f0", bgcolor: "#fff", overflow: "hidden" }}>
                <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.5, sm: 2 }, borderBottom: "1px solid #f1f5f9",
                  display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography variant={isMobile ? "body1" : "subtitle1"} fontWeight={700}
                    sx={{ color: "#0f172a", mr: "auto" }}>Visit Timeline</Typography>
                  <Chip
                    label={filters.dateRange.charAt(0).toUpperCase() + filters.dateRange.slice(1)}
                    size="small" icon={<CalendarToday sx={{ fontSize: "12px !important" }} />}
                    sx={{ fontSize: "0.65rem", height: 22, bgcolor: alpha(PRIMARY, 0.08), color: PRIMARY, fontWeight: 600 }}
                  />
                  <Tooltip title="Refresh">
                    <IconButton size="small" onClick={handleRefresh}
                      sx={{ color: "#94a3b8", borderRadius: "0.375rem", "&:hover": { bgcolor: "#f8fafc" } }}>
                      <Refresh sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 1, borderBottom: "1px solid #f1f5f9",
                  display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#f8fafc" }}>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    {loading ? "Loading…" : `${visits.length} visit${visits.length !== 1 ? "s" : ""} found`}
                  </Typography>
                  <Badge badgeContent={filters.statuses?.length || 0} color="primary"
                    sx={{ "& .MuiBadge-badge": { fontSize: "0.6rem", height: 16, minWidth: 16 } }}>
                    <Box onClick={() => setFilterDrawerOpen(true)}
                      sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }}>
                      <FilterList sx={{ fontSize: 16, color: PRIMARY }} />
                      <Typography variant="caption" fontWeight={600} sx={{ color: PRIMARY, fontSize: "0.7rem" }}>Filter</Typography>
                    </Box>
                  </Badge>
                </Box>

                <Box sx={{ p: { xs: 2, sm: 2.5 }, position: "relative" }}>
                  <Box sx={{ position: "absolute", left: { xs: "calc(2rem + 8px)", sm: "calc(2.25rem + 10px)" },
                    top: 40, bottom: 40, width: 2, bgcolor: "#f1f5f9", zIndex: 0,
                    display: { xs: "none", sm: "block" } }} />
                  {loading
                    ? <TimelineSkeleton />
                    : visits.length === 0
                    ? (
                      <Box sx={{ textAlign: "center", py: 4 }}>
                        <LocationOn sx={{ fontSize: 40, color: "#e2e8f0", mb: 1 }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>No visits found</Typography>
                        <Typography variant="caption" color="text.secondary">Try changing the date range or filters</Typography>
                      </Box>
                    ) : (
                      <Stack spacing={isMobile ? 3 : 4}>
                        {visits.map((visit) => (
                          <TimelineItem key={visit._id} visit={visit} isMobile={isMobile} />
                        ))}
                      </Stack>
                    )}
                </Box>

                <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 }, bgcolor: "#f8fafc",
                  textAlign: "center", borderTop: "1px solid #f1f5f9" }}>
                  {hasMore ? (
                    <Button size="small" onClick={handleLoadMore} disabled={loadingMore}
                      startIcon={loadingMore ? <CircularProgress size={12} /> : null}
                      sx={{ color: PRIMARY, fontWeight: 600, fontSize: "0.78rem", textTransform: "none" }}>
                      {loadingMore ? "Loading…" : "Load earlier visits"}
                    </Button>
                  ) : (
                    <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.72rem" }}>
                      {visits.length > 0 ? "All visits loaded" : ""}
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {isMobile && (
        <Paper sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000,
          borderRadius: 0, borderTop: `1px solid ${alpha(PRIMARY, 0.1)}` }} elevation={3}>
          <BottomNavigation showLabels value={bottomNav} onChange={(e, v) => setBottomNav(v)}
            sx={{ height: 56, "& .MuiBottomNavigationAction-root": { color: "#64748b",
              "&.Mui-selected": { color: PRIMARY }, minWidth: 0, py: 0.5 } }}>
            <BottomNavigationAction label="Dashboard" icon={<Dashboard sx={{ fontSize: 20 }} />} />
            <BottomNavigationAction label="Timeline"  icon={<History   sx={{ fontSize: 20 }} />} />
            <BottomNavigationAction label="Profile"   icon={<Person    sx={{ fontSize: 20 }} />} />
          </BottomNavigation>
        </Paper>
      )}

      {isMobile && (
        <Zoom in>
          <Fab color="primary" aria-label="add"
            sx={{ position: "fixed", bottom: 72, right: 16, zIndex: 1000,
              bgcolor: PRIMARY, "&:hover": { bgcolor: "#0f5fd4" },
              boxShadow: `0 4px 12px ${alpha(PRIMARY, 0.3)}` }}>
            <Add />
          </Fab>
        </Zoom>
      )}
    </Box>
  );
}