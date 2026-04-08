// pages/MemberVisitHistory.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, Chip, IconButton, Tooltip, alpha,
  useTheme, useMediaQuery, CircularProgress, Alert, Skeleton,
  SwipeableDrawer, Badge, Checkbox, FormControlLabel,
} from "@mui/material";
import {
  LocationOn, Refresh, MyLocation, FilterList,
  CheckCircle, AccessTime, Route, Timer, Close,
  Fullscreen, FullscreenExit,
  Store, PhotoCamera,
  CalendarToday, GpsFixed,
  ArrowDownward, DirectionsCar, Schedule,
} from "@mui/icons-material";
import { useLocation, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { stopTracking, isCurrentlyTracking } from "../utils/Locationtracker.js";
import LiveTrackingMap from "../utils/Livetrackmap.jsx";

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "https://demo-admin-solar-backend.onrender.com/api/v1";

const PRIMARY = "#4569ea";
const SUCCESS = "#22c55e";
const WARNING = "#f59e0b";
const ERROR   = "#ef4444";

const apiFetch = async (path, params = {}, options = {}) => {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("accessToken");
  const url   = new URL(`${BASE_URL}${path}`);
  if (options.method !== "POST")
    Object.entries(params).forEach(([k, v]) => v != null && v !== "" && url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method:  options.method || "GET",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(options.method === "POST" ? { body: JSON.stringify(params) } : {}),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `HTTP ${res.status}`); }
  return res.json();
};

const fmt = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;

const getDateRange = (r) => {
  const now = new Date(), today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (r === "today")     return { startDate: today.toISOString(), endDate: now.toISOString() };
  if (r === "yesterday") { const y = new Date(today.getTime() - 86400000); return { startDate: y.toISOString(), endDate: new Date(today.getTime() - 1).toISOString() }; }
  if (r === "week")      { const w = new Date(today); w.setDate(today.getDate() - today.getDay()); return { startDate: w.toISOString(), endDate: now.toISOString() }; }
  if (r === "month")     return { startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(), endDate: now.toISOString() };
  return {};
};

// ─── Route Connector ──────────────────────────────────────────────────────────
// Shows the travel segment between two visits: distance + travel time
const RouteConnector = ({ visit }) => {
  const distKm      = visit?.distanceFromPreviousKm ?? visit?.distance ?? 0;
  const travelInfo  = visit?.travelInfo;
  const travelMins  = travelInfo?.durationMinutes ?? visit?.travelTimeMinutes ?? 0;
  const isEstimated = travelInfo?.isEstimated ?? true;

  // Only render if there was a previous visit (i.e., this is not the first stop)
  if (!distKm || distKm <= 0) return null;

  const distText = travelInfo?.distanceText || `${Number(distKm).toFixed(2)} km`;
  const timeText = travelInfo?.durationText
    || (travelMins > 0
      ? travelMins >= 60
        ? `${Math.floor(travelMins / 60)}h ${travelMins % 60}m`
        : `${travelMins} min`
      : null);

  return (
    <Box sx={{
      display: "flex",
      alignItems: "stretch",
      gap: 0,
      my: 0,
    }}>
      {/* Left — dashed connector line aligned with circle column */}
      <Box sx={{
        width: 40,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        {/* Dashed animated line */}
        <Box sx={{
          width: 2,
          flex: 1,
          minHeight: 56,
          background: `repeating-linear-gradient(
            to bottom,
            ${alpha(PRIMARY, 0.35)} 0px,
            ${alpha(PRIMARY, 0.35)} 6px,
            transparent 6px,
            transparent 12px
          )`,
          position: "relative",
        }}>
          {/* Animated travel dot */}
          <Box sx={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            width: 6,
            height: 6,
            borderRadius: "50%",
            bgcolor: PRIMARY,
            animation: "travelDot 2s ease-in-out infinite",
            "@keyframes travelDot": {
              "0%":   { top: "0%",   opacity: 1 },
              "80%":  { top: "85%",  opacity: 1 },
              "100%": { top: "85%",  opacity: 0 },
            },
          }} />
        </Box>
      </Box>

      {/* Right — route info pill */}
      <Box sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        pl: 2,
        py: 1,
      }}>
        <Box sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1.25,
          bgcolor: alpha(PRIMARY, 0.05),
          border: `1px dashed ${alpha(PRIMARY, 0.25)}`,
          borderRadius: "10px",
          px: 1.5,
          py: 0.6,
        }}>
          {/* Distance */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
            <DirectionsCar sx={{ fontSize: 13, color: PRIMARY }} />
            <Typography sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: PRIMARY,
              letterSpacing: "-0.2px",
            }}>
              {distText}
            </Typography>
          </Box>

          {/* Travel time */}
          {timeText && (
            <>
              <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: alpha(PRIMARY, 0.3) }} />
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <Schedule sx={{ fontSize: 12, color: "#64748b" }} />
                <Typography sx={{
                  fontSize: "0.68rem",
                  color: "#64748b",
                  fontWeight: 600,
                }}>
                  {timeText}
                </Typography>
              </Box>
            </>
          )}

          {/* Estimated badge */}
          {isEstimated && (
            <Chip
              label="est."
              size="small"
              sx={{
                height: 14,
                fontSize: "0.55rem",
                fontWeight: 700,
                bgcolor: alpha(WARNING, 0.12),
                color: WARNING,
                "& .MuiChip-label": { px: 0.75 },
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

// ─── Visit Card ───────────────────────────────────────────────────────────────
const VisitCard = ({ visit: v, index, isLast }) => {
  const cur = v.status === "InProgress";
  const [imgOpen, setImgOpen] = useState(false);

  const photoUrl = v.photos?.[0]?.url
    || (typeof v.photos?.[0] === "string" ? v.photos[0] : null)
    || v.photo
    || null;

  const address = (() => {
    if (!v.address) return "";
    if (typeof v.address === "string") return v.address.trim();
    return (v.address?.full || v.address?.short || "").trim();
  })();

  const displayTime = v.checkInTime
    ? fmt(v.checkInTime)
    : v.createdAt
    ? fmt(v.createdAt)
    : v.visitTime || null;

  const displayDate = v.visitDate
    ? new Date(v.visitDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : null;

  const distKm = v.distanceFromPreviousKm ?? v.distance ?? 0;

  return (
    <Box sx={{ display: "flex", gap: 2, position: "relative" }}>

      {/* Left — circle (no connector line here — RouteConnector handles that) */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: "50%",
          bgcolor: cur ? SUCCESS : PRIMARY,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, zIndex: 1,
          boxShadow: `0 2px 8px ${alpha(cur ? SUCCESS : PRIMARY, 0.3)}`,
          ...(cur && {
            animation: "pl 1.5s ease-in-out infinite",
            "@keyframes pl": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.6 } },
          }),
        }}>
          <Store sx={{ fontSize: 17, color: "#fff" }} />
        </Box>
      </Box>

      {/* Middle — details */}
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.25, pb: isLast ? 0 : 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.4 }}>
          <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem", lineHeight: 1.3 }}>
            {v.locationName || `Stop ${index + 1}`}
          </Typography>
          {(displayTime || displayDate) && (
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8", flexShrink: 0 }}>
              {displayDate && displayTime
                ? `${displayDate} · ${displayTime}`
                : displayTime || displayDate}
            </Typography>
          )}
        </Box>

        {cur && (
          <Chip label="In Progress" size="small"
            sx={{ bgcolor: alpha(SUCCESS, 0.1), color: SUCCESS, fontWeight: 700, fontSize: "0.6rem", height: 18, mb: 0.5 }} />
        )}

        {address && (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.4, mb: 0.5 }}>
            <LocationOn sx={{ fontSize: 12, color: PRIMARY, mt: "2px", flexShrink: 0 }} />
            <Typography sx={{
              color: "#475569", fontSize: "0.75rem", lineHeight: 1.4,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {address}
            </Typography>
          </Box>
        )}

        {v.remarks && (
          <Box sx={{ bgcolor: "#f8fafc", borderRadius: "8px", px: 1.5, py: 1, mt: 0.25, borderLeft: "3px solid #e2e8f0" }}>
            <Typography sx={{ color: "#64748b", fontSize: "0.73rem", fontStyle: "italic", lineHeight: 1.6 }}>
              "{v.remarks}"
            </Typography>
          </Box>
        )}

        {/* Tags row */}
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 0.5 }}>
          {v.timeSpentMinutes > 0 && (
            <Box sx={{
              display: "flex", alignItems: "center", gap: 0.4,
              bgcolor: alpha(WARNING, 0.07), borderRadius: "6px", px: 0.75, py: 0.3,
            }}>
              <Timer sx={{ fontSize: 11, color: WARNING }} />
              <Typography sx={{ fontSize: "0.68rem", color: WARNING, fontWeight: 600 }}>
                {v.timeSpentMinutes >= 60
                  ? `${Math.floor(v.timeSpentMinutes / 60)}h ${v.timeSpentMinutes % 60}m`
                  : `${v.timeSpentMinutes} min`}
              </Typography>
            </Box>
          )}

          {v.photos?.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
              <PhotoCamera sx={{ fontSize: 11, color: "#94a3b8" }} />
              <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                {v.photos.length} photo{v.photos.length > 1 ? "s" : ""}
              </Typography>
            </Box>
          )}
          {(v.isLeadCreate || v.isLeadCreated) && (
            <Chip label="Lead Created" size="small"
              sx={{ bgcolor: alpha(WARNING, 0.1), color: WARNING, fontWeight: 700, fontSize: "0.6rem", height: 18 }} />
          )}
        </Box>
      </Box>

      {/* Right — Photo thumbnail */}
      {photoUrl && (
        <>
          <Box
            onClick={() => setImgOpen(true)}
            sx={{
              width: 72, height: 72, borderRadius: "10px",
              overflow: "hidden", flexShrink: 0,
              border: "2px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              alignSelf: "flex-start", mt: 0.25,
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "scale(1.05)", boxShadow: "0 4px 16px rgba(0,0,0,0.18)", borderColor: PRIMARY },
            }}
          >
            <Box component="img" src={photoUrl} alt="Visit photo"
              sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Box>

          {imgOpen && (
            <Box onClick={() => setImgOpen(false)}
              sx={{
                position: "fixed", inset: 0, zIndex: 9999,
                bgcolor: "rgba(0,0,0,0.92)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "zoom-out", p: 2,
              }}
            >
              <Box sx={{
                position: "absolute", top: 16, right: 16,
                width: 36, height: 36, borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
              }}>
                <Close sx={{ color: "#fff", fontSize: 20 }} />
              </Box>
              {v.locationName && (
                <Box sx={{
                  position: "absolute", top: 16, left: 16,
                  bgcolor: "rgba(0,0,0,0.5)", borderRadius: "8px", px: 1.5, py: 0.75,
                }}>
                  <Typography sx={{ color: "#fff", fontSize: "0.82rem", fontWeight: 600 }}>
                    📍 {v.locationName}
                  </Typography>
                  {v.checkInTime && (
                    <Typography sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>{fmt(v.checkInTime)}</Typography>
                  )}
                </Box>
              )}
              <Box
                component="img" src={photoUrl} alt="Visit photo"
                onClick={(e) => e.stopPropagation()}
                sx={{ maxWidth: "95vw", maxHeight: "90vh", borderRadius: "12px", objectFit: "contain", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

// ─── Filter Drawer ────────────────────────────────────────────────────────────
const FilterDrawer = ({ open, onClose, filters, onApply }) => {
  const [local, setLocal] = useState(filters);
  return (
    <SwipeableDrawer anchor="bottom" open={open} onClose={onClose} onOpen={() => {}}
      PaperProps={{ sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80vh" } }}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ width: 36, height: 4, bgcolor: "#e2e8f0", borderRadius: 2, mx: "auto", mb: 2.5 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: PRIMARY }}>Filter Visits</Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>
        <Typography sx={{ fontWeight: 600, fontSize: "0.82rem", color: "#0f172a", mb: 1 }}>Date Range</Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
          {[
            { value: "today",     label: "Today" },
            { value: "yesterday", label: "Yesterday" },
            { value: "week",      label: "This Week" },
            { value: "month",     label: "This Month" },
          ].map(o => (
            <Chip key={o.value} label={o.label}
              onClick={() => setLocal(p => ({ ...p, dateRange: o.value }))}
              sx={{
                fontWeight: 600, fontSize: "0.78rem", cursor: "pointer",
                bgcolor: local.dateRange === o.value ? PRIMARY : "#f1f5f9",
                color:   local.dateRange === o.value ? "#fff"  : "#374151",
              }} />
          ))}
        </Box>
        <Typography sx={{ fontWeight: 600, fontSize: "0.82rem", color: "#0f172a", mb: 1 }}>Status</Typography>
        {["Completed", "InProgress", "Cancelled"].map(s => (
          <FormControlLabel key={s}
            label={<Typography sx={{ fontSize: "0.82rem" }}>{s}</Typography>}
            control={
              <Checkbox
                checked={local.statuses?.includes(s) || false}
                onChange={e => {
                  const a = local.statuses || [];
                  setLocal(p => ({ ...p, statuses: e.target.checked ? [...a, s] : a.filter(x => x !== s) }));
                }}
                sx={{ color: PRIMARY, "&.Mui-checked": { color: PRIMARY } }}
              />
            }
            sx={{ display: "flex", mb: 0.25 }} />
        ))}
        <Box sx={{ display: "flex", gap: 1.5, mt: 3 }}>
          <Button fullWidth variant="outlined" onClick={onClose}
            sx={{ borderColor: "#e2e8f0", color: "#374151", fontWeight: 600, borderRadius: "10px", py: 1.1 }}>
            Cancel
          </Button>
          <Button fullWidth variant="contained" onClick={() => { onApply(local); onClose(); }}
            sx={{ bgcolor: PRIMARY, fontWeight: 600, borderRadius: "10px", py: 1.1 }}>
            Apply
          </Button>
        </Box>
      </Box>
    </SwipeableDrawer>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MemberVisitHistory({ userId: propUserId }) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { userId: paramUserId } = useParams();
  useLocation();
  const { user: authUser } = useAuth();

  const userId      = paramUserId || propUserId || null;
  const isAdminView = !!paramUserId;

const targetUserId = userId || authUser?._id || authUser?.id || authUser?.userId
    || (() => {
      try {
        const u = JSON.parse(localStorage.getItem("user") || localStorage.getItem("userData") || "null");
        return u?._id || u?.id || u?.userId || null;
      } catch { return null; }
    })();

  const [visits,           setVisits]           = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [page,             setPage]             = useState(1);
  const [hasMore,          setHasMore]          = useState(false);
  const [loadingMore,      setLoadingMore]      = useState(false);
  const [isPunchedIn,      setIsPunchedIn]      = useState(false);
  const [hasPunchedOut,    setHasPunchedOut]    = useState(false);
  const [punchInLocation,  setPunchInLocation]  = useState(null);
  const [punchOutLocation, setPunchOutLocation] = useState(null);
  const [filters,          setFilters]          = useState({ dateRange: "today", statuses: [] });
  const [filterOpen,       setFilterOpen]       = useState(false);
  const [fullscreen,       setFullscreen]       = useState(false);
  const [lastUpdated,      setLastUpdated]      = useState(null);
  const [locateTrigger,    setLocateTrigger]    = useState(0);
  const [locating,         setLocating]         = useState(false);
  const [gpsDistance,      setGpsDistance]      = useState(null);
  const [autoVisitToast,   setAutoVisitToast]   = useState(null);
  const [dwellInfo,        setDwellInfo]        = useState(null);

  const handleLocateMe = () => {
    setLocating(true);
    setLocateTrigger(t => t + 1);
    setTimeout(() => setLocating(false), 1800);
  };

  useEffect(() => {
    const onCreated = (e) => {
      const { locationName, address, dwellMins } = e.detail;
      setAutoVisitToast({ locationName, address, dwellMins });
      setDwellInfo(null);
      setPage(1);
      setTimeout(() => setAutoVisitToast(null), 7000);
    };
    window.addEventListener("autoVisitCreated", onCreated);
    return () => window.removeEventListener("autoVisitCreated", onCreated);
  }, []);

  useEffect(() => {
    if (!isPunchedIn || hasPunchedOut) { setDwellInfo(null); return; }
    const interval = setInterval(() => window.dispatchEvent(new CustomEvent("requestDwellInfo")), 60_000);
    const onDwell  = (e) => setDwellInfo(e.detail);
    window.addEventListener("dwellInfoResponse", onDwell);
    return () => { clearInterval(interval); window.removeEventListener("dwellInfoResponse", onDwell); };
  }, [isPunchedIn, hasPunchedOut]);

  useEffect(() => { return () => { if (isCurrentlyTracking()) stopTracking(); }; }, []);

  const fetchPunchInStatus = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const res   = await apiFetch("/attendance", {
        startDate: today, endDate: today, limit: 1,
        ...(isAdminView ? { userId: targetUserId } : {}),
      });
      const list = res?.data?.attendances || res?.result?.attendances || res?.data || [];
      const att  = Array.isArray(list) ? list[0] : list;

      if (att?.punchIn?.time) {
        const out = !!att?.punchOut?.time;
        setIsPunchedIn(!out);
        setHasPunchedOut(out);
        setPunchInLocation({
          lat:     att.punchIn?.location?.lat  || att.punchIn?.location?.latitude  || null,
          lng:     att.punchIn?.location?.lng  || att.punchIn?.location?.longitude || null,
          address: att.punchIn?.address || null,
          time:    att.punchIn?.time    || null,
        });
        if (out && att.punchOut?.time) {
          setPunchOutLocation({
            lat:     att.punchOut?.location?.lat  || att.punchOut?.location?.latitude  || null,
            lng:     att.punchOut?.location?.lng  || att.punchOut?.location?.longitude || null,
            address: att.punchOut?.address || null,
            time:    att.punchOut?.time    || null,
          });
        } else {
          setPunchOutLocation(null);
        }
      } else {
        setIsPunchedIn(false);
        setHasPunchedOut(false);
        setPunchInLocation(null);
      }
    } catch (e) { console.warn("Punch-in status failed:", e.message); }
  }, [targetUserId, isAdminView]);

  const fetchVisits = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true); else setLoadingMore(true);
      setError(null);

      const res = await apiFetch("/visit", {
        page: pageNum, limit: 15,
        ...getDateRange(filters.dateRange),
        ...(isAdminView ? { userId: targetUserId } : {}),
        ...(filters.statuses?.length === 1 ? { status: filters.statuses[0] } : {}),
      });

      const fetchedVisits =
        res?.data?.visits    ||
        res?.result?.visits  ||
        res?.visits          ||
        (Array.isArray(res?.data)   ? res.data   : null) ||
        (Array.isArray(res?.result) ? res.result : null) ||
        [];

      const pagination = res?.data?.pagination || res?.result?.pagination || res?.pagination || null;

      setVisits(prev => append ? [...prev, ...fetchedVisits] : fetchedVisits);
      setHasMore(pagination ? pageNum < pagination.totalPages : false);
      setLastUpdated(new Date());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [filters, targetUserId, isAdminView]);

  const fetchStats = useCallback(async () => {
    try {
      await apiFetch("/visit/stats/overview", {
        ...getDateRange(filters.dateRange),
        ...(isAdminView ? { userId: targetUserId } : {}),
      });
    } catch {}
  }, [filters, targetUserId, isAdminView]);

  const fetchGpsDistance = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const res   = await apiFetch("/location/distance", { date: today, salesmanId: targetUserId });
      const data  = res?.data || res?.result || res;
      setGpsDistance({ totalKm: data?.totalKm ?? 0, totalPoints: data?.totalPoints ?? 0 });
    } catch (e) { console.warn("GPS distance fetch failed:", e.message); }
  }, [targetUserId]);

  const authUserId = authUser?._id || authUser?.id || authUser?.userId || null;
  useEffect(() => {
    if (!targetUserId) return;
    setPage(1);
    fetchVisits(1, false);
    fetchStats();
    fetchPunchInStatus();
    fetchGpsDistance();
  }, [filters, userId, authUserId, fetchVisits, fetchStats, fetchPunchInStatus, fetchGpsDistance]);

  const handleRefresh = () => {
    setPage(1);
    fetchVisits(1, false);
    fetchStats();
    fetchPunchInStatus();
    fetchGpsDistance();
  };

  useEffect(() => {
    if (!hasPunchedOut) return;
    const timer = setTimeout(() => { fetchVisits(1, false); fetchGpsDistance(); }, 2000);
    return () => clearTimeout(timer);
  }, [hasPunchedOut, fetchVisits, fetchGpsDistance]);

  useEffect(() => {
    if (!targetUserId) return;
    const interval = setInterval(() => {
      fetchVisits(1, false);
      fetchGpsDistance();
      fetchPunchInStatus();
    }, 12_000);
    return () => clearInterval(interval);
  }, [targetUserId, fetchVisits, fetchGpsDistance, fetchPunchInStatus]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalDist       = visits.reduce((s, v) => s + (v.distanceFromPreviousKm ?? v.distance ?? 0), 0);
  const avgTime         = visits.length
    ? Math.round(visits.reduce((s, v) => s + (v.timeSpentMinutes || 0), 0) / visits.length)
    : 0;
  const completedCount  = visits.filter(v => v.status === "Completed").length;
  const inProgressCount = visits.filter(v => v.status === "InProgress").length;
  const cancelledCount  = visits.filter(v => v.status === "Cancelled").length;
  const updatedLabel    = lastUpdated
    ? (() => { const m = Math.floor((Date.now() - lastUpdated) / 60000); return m < 1 ? "just now" : `${m}m ago`; })()
    : null;

  // ── Visits sorted oldest → newest for A→B→C display ──────────────────────
  // API returns newest first — reverse for timeline display
  const sortedVisits = [...visits].reverse();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6fb" }}>
      <FilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)} filters={filters} onApply={setFilters} />

      <Box sx={{ p: { xs: 2, sm: 3, lg: 4 }, maxWidth: 1400, mx: "auto" }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}
            action={<Button size="small" onClick={handleRefresh}>Retry</Button>}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 420px" }, gap: 3, alignItems: "start" }}>

          {/* ── LEFT ── */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

            {/* Auto-visit toast */}
            {autoVisitToast && (
              <Box sx={{
                bgcolor: "#0f172a", color: "#fff", borderRadius: "14px", px: 2.5, py: 1.75,
                display: "flex", alignItems: "center", gap: 2,
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                animation: "fadeSlideIn 0.35s ease",
                "@keyframes fadeSlideIn": { from: { opacity: 0, transform: "translateY(-10px)" }, to: { opacity: 1, transform: "translateY(0)" } },
              }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: SUCCESS, flexShrink: 0, animation: "avp 1.5s ease-in-out infinite", "@keyframes avp": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } } }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    📍 {autoVisitToast.locationName}
                  </Typography>
                  {autoVisitToast.address && (
                    <Typography sx={{ fontSize: "0.7rem", color: "#cbd5e1", mt: 0.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {autoVisitToast.address}
                    </Typography>
                  )}
                  <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8", mt: 0.2 }}>
                    Auto-visit · stopped {autoVisitToast.dwellMins} min
                  </Typography>
                </Box>
                <Box sx={{ px: 1.5, py: 0.5, bgcolor: alpha(SUCCESS, 0.15), borderRadius: "8px", border: `1px solid ${alpha(SUCCESS, 0.25)}`, flexShrink: 0 }}>
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: SUCCESS }}>{autoVisitToast.dwellMins} min</Typography>
                </Box>
              </Box>
            )}

            {/* Map */}
            <Box sx={{
              borderRadius: "16px", overflow: "hidden", border: "1px solid #e2e8f0",
              height: fullscreen ? "70vh" : { xs: 300, sm: 400, lg: 460 },
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)", transition: "height 0.3s ease",
              position: "relative",
            }}>
              <Tooltip title={fullscreen ? "Exit fullscreen" : "Fullscreen"} placement="left">
                <Box onClick={() => setFullscreen(p => !p)} sx={{ position: "absolute", top: 50, right: 10, zIndex: 1000, bgcolor: "#fff", borderRadius: "10px", p: 0.75, cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.12)", border: "1px solid #e2e8f0", display: "flex", "&:hover": { bgcolor: "#f8fafc" } }}>
                  {fullscreen ? <FullscreenExit sx={{ fontSize: 18, color: "#374151" }} /> : <Fullscreen sx={{ fontSize: 18, color: "#374151" }} />}
                </Box>
              </Tooltip>

              {dwellInfo && dwellInfo.mins >= 1 && (
                <Box sx={{ position: "absolute", bottom: 48, left: 10, zIndex: 1000, bgcolor: "rgba(255,255,255,0.95)", borderRadius: "10px", px: 1.5, py: 0.75, display: "flex", alignItems: "center", gap: 1, boxShadow: "0 2px 10px rgba(0,0,0,0.12)", border: "1px solid #e2e8f0" }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: WARNING, animation: "dp 1.5s ease-in-out infinite", "@keyframes dp": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } } }} />
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#0f172a" }}>Stopped {dwellInfo.mins} min</Typography>
                  {dwellInfo.mins < 10 && <Typography sx={{ fontSize: "0.65rem", color: "#94a3b8" }}>· visit in {10 - dwellInfo.mins} min</Typography>}
                </Box>
              )}

              <Tooltip title="Go to my location" placement="left">
                <Box onClick={handleLocateMe} sx={{ position: "absolute", top: 96, right: 10, zIndex: 1000, bgcolor: locating ? PRIMARY : "#fff", borderRadius: "10px", p: 0.75, cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.12)", border: `1px solid ${locating ? PRIMARY : "#e2e8f0"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", "&:hover": { bgcolor: locating ? PRIMARY : alpha(PRIMARY, 0.08), borderColor: PRIMARY } }}>
                  {locating ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : <GpsFixed sx={{ fontSize: 18, color: PRIMARY }} />}
                </Box>
              </Tooltip>
          


              <LiveTrackingMap
                isPunchedIn={isPunchedIn}
                hasPunchedOut={hasPunchedOut}
                // userId={targetUserId}
                   userId={targetUserId}        // ✅ must match socket.user.id on backend

                isOwner={!isAdminView}
                height="100%"
                locateTrigger={locateTrigger}
                punchInLocation={punchInLocation}
              />
            </Box>

            {/* Stats row */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
              <Box sx={{ bgcolor: "#fff", borderRadius: "14px", p: 2.5, border: "1px solid #e8edf2", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", "&:hover": { boxShadow: "0 4px 16px rgba(69,105,234,0.1)", borderColor: alpha(PRIMARY, 0.3) }, transition: "all 0.2s" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Route sx={{ fontSize: 20, color: PRIMARY }} />
                  <Typography sx={{ color: "#64748b", fontWeight: 500, fontSize: "0.78rem" }}>Distance</Typography>
                </Box>
                {loading ? <Skeleton width={60} height={32} /> : (
                  <>
                    <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px", lineHeight: 1 }}>
                      {totalDist.toFixed(2)}{" "}
                      <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 400, color: "#94a3b8" }}>km</Typography>
                    </Typography>
                    <Typography sx={{ fontSize: "0.65rem", color: "#94a3b8", mt: 0.5 }}>road distance</Typography>
                    {gpsDistance?.totalKm > 0 && (
                      <Typography sx={{ fontSize: "0.65rem", color: alpha(PRIMARY, 0.6), mt: 0.25 }}>
                        {gpsDistance.totalKm.toFixed(1)} km GPS
                      </Typography>
                    )}
                  </>
                )}
              </Box>

              <Box sx={{ bgcolor: "#fff", borderRadius: "14px", p: 2.5, border: "1px solid #e8edf2", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", "&:hover": { boxShadow: "0 4px 16px rgba(69,105,234,0.1)", borderColor: alpha(PRIMARY, 0.3) }, transition: "all 0.2s" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <LocationOn sx={{ fontSize: 20, color: PRIMARY }} />
                  <Typography sx={{ color: "#64748b", fontWeight: 500, fontSize: "0.78rem" }}>Visits</Typography>
                </Box>
                {loading ? <Skeleton width={60} height={32} /> : (
                  <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px", lineHeight: 1 }}>
                    {visits.length}{" "}
                    <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 400, color: "#94a3b8" }}>stops</Typography>
                  </Typography>
                )}
              </Box>

              <Box sx={{ bgcolor: "#fff", borderRadius: "14px", p: 2.5, border: "1px solid #e8edf2", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", "&:hover": { boxShadow: "0 4px 16px rgba(69,105,234,0.1)", borderColor: alpha(PRIMARY, 0.3) }, transition: "all 0.2s" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Timer sx={{ fontSize: 20, color: PRIMARY }} />
                  <Typography sx={{ color: "#64748b", fontWeight: 500, fontSize: "0.78rem" }}>Avg. Time</Typography>
                </Box>
                {loading ? <Skeleton width={60} height={32} /> : (
                  <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px", lineHeight: 1 }}>
                    {avgTime}{" "}
                    <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 400, color: "#94a3b8" }}>mins</Typography>
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Completion bar */}
            {!loading && visits.length > 0 && (
              <Box sx={{ bgcolor: "#fff", borderRadius: "14px", p: 2.5, border: "1px solid #e8edf2" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a" }}>Visit Completion</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: PRIMARY }}>
                    {Math.round((completedCount / visits.length) * 100)}%
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", height: 10, borderRadius: "999px", overflow: "hidden", bgcolor: "#f1f5f9", mb: 1.5 }}>
                  {completedCount  > 0 && <Box sx={{ width: `${(completedCount  / visits.length) * 100}%`, bgcolor: SUCCESS, transition: "width 0.6s" }} />}
                  {inProgressCount > 0 && <Box sx={{ width: `${(inProgressCount / visits.length) * 100}%`, bgcolor: PRIMARY, animation: "sh 1.5s ease-in-out infinite", "@keyframes sh": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.5 } } }} />}
                  {cancelledCount  > 0 && <Box sx={{ width: `${(cancelledCount  / visits.length) * 100}%`, bgcolor: ERROR, opacity: 0.45 }} />}
                </Box>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {[
                    { label: "Done",      count: completedCount,  color: SUCCESS },
                    { label: "Active",    count: inProgressCount, color: PRIMARY },
                    { label: "Cancelled", count: cancelledCount,  color: ERROR   },
                  ].map(s => (
                    <Box key={s.label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: s.color }} />
                      <Typography sx={{ fontSize: "0.72rem", color: "#64748b" }}>{s.label}</Typography>
                      <Box sx={{ px: 0.75, py: 0.1, borderRadius: "4px", bgcolor: alpha(s.color, 0.1) }}>
                        <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: s.color }}>
                          {s.count} · {Math.round((s.count / visits.length) * 100)}%
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* ── RIGHT — Visit Timeline ── */}
          <Box sx={{
            bgcolor: "#fff", borderRadius: "16px", border: "1px solid #e8edf2",
            boxShadow: "0 4px 24px rgba(0,0,0,0.05)", overflow: "hidden",
            display: "flex", flexDirection: "column",
            position: { lg: "sticky" }, top: { lg: 16 },
            maxHeight: { lg: "calc(100vh - 32px)" },
          }}>
            {/* Header */}
            <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid #f1f5f9" }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 0.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>Visit Timeline</Typography>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={handleRefresh}
                    sx={{ color: "#94a3b8", "&:hover": { color: PRIMARY, bgcolor: alpha(PRIMARY, 0.06) } }}>
                    <Refresh sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {!loading && totalDist > 0 && (
                <Chip
                  icon={<Route sx={{ fontSize: "13px !important" }} />}
                  label={`${totalDist.toFixed(2)} km travelled`}
                  size="small"
                  sx={{ mb: 0.75, bgcolor: alpha(PRIMARY, 0.08), color: PRIMARY, fontWeight: 700, fontSize: "0.7rem", height: 22, "& .MuiChip-icon": { color: PRIMARY } }}
                />
              )}

              {updatedLabel && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                  <AccessTime sx={{ fontSize: 12, color: "#94a3b8" }} />
                  <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>Updated {updatedLabel}</Typography>
                </Box>
              )}
            </Box>

            {/* Filter bar */}
            <Box sx={{ px: 3, py: 1.25, borderBottom: "1px solid #f1f5f9", bgcolor: "#fafbfc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarToday sx={{ fontSize: 13, color: PRIMARY }} />
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: PRIMARY }}>
                  {filters.dateRange.charAt(0).toUpperCase() + filters.dateRange.slice(1)}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                  · {loading ? "…" : `${visits.length} visit${visits.length !== 1 ? "s" : ""}`}
                </Typography>
              </Box>
              <Badge badgeContent={filters.statuses?.length || 0} color="primary"
                sx={{ "& .MuiBadge-badge": { fontSize: "0.6rem", height: 16, minWidth: 16 } }}>
                <Box onClick={() => setFilterOpen(true)} sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", px: 1, py: 0.4, borderRadius: "6px", "&:hover": { bgcolor: alpha(PRIMARY, 0.06) } }}>
                  <FilterList sx={{ fontSize: 15, color: PRIMARY }} />
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: PRIMARY }}>Filter</Typography>
                </Box>
              </Badge>
            </Box>

            {/* Scrollable visits */}
            <Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-track": { bgcolor: "#f8fafc" }, "&::-webkit-scrollbar-thumb": { bgcolor: "#e2e8f0", borderRadius: 2 } }}>
              {loading ? (
                <Box sx={{ p: 3 }}>
                  {[1, 2, 3].map(i => (
                    <Box key={i} sx={{ display: "flex", gap: 2, mb: 3 }}>
                      <Skeleton variant="circular" width={38} height={38} sx={{ flexShrink: 0 }} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton width="55%" height={20} />
                        <Skeleton width="80%" height={14} sx={{ mt: 0.5 }} />
                        <Skeleton width="40%" height={14} sx={{ mt: 0.5 }} />
                        <Skeleton variant="rounded" width="100%" height={40} sx={{ mt: 1 }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : visits.length === 0 ? (
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 3 }}>
                  {isPunchedIn && !hasPunchedOut ? (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: SUCCESS, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 4px ${alpha(SUCCESS, 0.2)}`, animation: "pl 1.5s ease-in-out infinite", "@keyframes pl": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.6 } } }}>
                          <MyLocation sx={{ fontSize: 18, color: "#fff" }} />
                        </Box>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.4 }}>
                          <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem" }}>Punched In</Typography>
                          {punchInLocation?.time && <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8" }}>{fmt(punchInLocation.time)}</Typography>}
                        </Box>
                        {punchInLocation?.address && (
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.4, mb: 0.5 }}>
                            <LocationOn sx={{ fontSize: 12, color: "#94a3b8", mt: "2px", flexShrink: 0 }} />
                            <Typography sx={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.5 }}>
                              {typeof punchInLocation.address === "string" ? punchInLocation.address : punchInLocation.address?.full || punchInLocation.address?.short || ""}
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: SUCCESS, animation: "dp 1.5s ease-in-out infinite", "@keyframes dp": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } } }} />
                          <Typography sx={{ fontSize: "0.7rem", color: SUCCESS, fontWeight: 600 }}>On Duty · No visits yet today</Typography>
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, minHeight: 200 }}>
                      <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
                        <MyLocation sx={{ fontSize: 22, color: "#cbd5e1" }} />
                      </Box>
                      <Typography sx={{ fontWeight: 600, color: "#94a3b8", fontSize: "0.88rem", mb: 0.4 }}>Not Punched In</Typography>
                      <Typography sx={{ color: "#cbd5e1", fontSize: "0.75rem", textAlign: "center" }}>Punch in to start tracking visits</Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ p: 3 }}>

                  {/* ── Punch In header ── */}
                  {punchInLocation?.address && (
                    <Box sx={{ mb: 0 }}>
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                          <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: SUCCESS, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 8px ${alpha(SUCCESS, 0.3)}` }}>
                            <MyLocation sx={{ fontSize: 18, color: "#fff" }} />
                          </Box>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0, pt: 0.5, pb: 0.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.4 }}>
                            <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem" }}>Punched In</Typography>
                            {punchInLocation.time && <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8" }}>{fmt(punchInLocation.time)}</Typography>}
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.4 }}>
                            <LocationOn sx={{ fontSize: 12, color: PRIMARY, mt: "2px", flexShrink: 0 }} />
                            <Typography sx={{ fontSize: "0.75rem", color: "#475569", lineHeight: 1.5 }}>
                              {typeof punchInLocation.address === "string" ? punchInLocation.address : punchInLocation.address?.full || punchInLocation.address?.short || ""}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Route connector from punch-in to first visit */}
                      {sortedVisits.length > 0 && sortedVisits[0].distanceFromPreviousKm > 0 && (
                        <RouteConnector visit={sortedVisits[0]} />
                      )}
                    </Box>
                  )}

                  {/* ── Visit cards with route connectors between them ── */}
                  {sortedVisits.map((v, i) => (
                    <Box key={v._id || i}>
                      <VisitCard
                        visit={v}
                        index={i}
                        isLast={i === sortedVisits.length - 1 && !hasPunchedOut}
                      />
                      {/* Route connector AFTER this visit, pointing to next visit */}
                      {i < sortedVisits.length - 1 && sortedVisits[i + 1]?.distanceFromPreviousKm > 0 && (
                        <RouteConnector visit={sortedVisits[i + 1]} />
                      )}
                    </Box>
                  ))}

                  {/* ── Punch Out footer ── */}
                  {hasPunchedOut && punchOutLocation?.time && (
                    <Box sx={{ display: "flex", gap: 2, mt: 0 }}>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: WARNING, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 8px ${alpha(WARNING, 0.3)}` }}>
                          <MyLocation sx={{ fontSize: 18, color: "#fff" }} />
                        </Box>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.4 }}>
                          <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem" }}>Punched Out</Typography>
                          <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8" }}>{fmt(punchOutLocation.time)}</Typography>
                        </Box>
                        {punchOutLocation?.address && (
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.4 }}>
                            <LocationOn sx={{ fontSize: 12, color: WARNING, mt: "2px", flexShrink: 0 }} />
                            <Typography sx={{ fontSize: "0.75rem", color: "#475569", lineHeight: 1.5 }}>
                              {typeof punchOutLocation.address === "string" ? punchOutLocation.address : punchOutLocation.address?.full || punchOutLocation.address?.short || ""}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            {/* Load more */}
            {(hasMore || loadingMore) && (
              <Box sx={{ px: 3, py: 2, borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
                <Button size="small" disabled={loadingMore}
                  startIcon={loadingMore ? <CircularProgress size={12} /> : null}
                  onClick={() => { const n = page + 1; setPage(n); fetchVisits(n, true); }}
                  sx={{ color: PRIMARY, fontWeight: 600, fontSize: "0.78rem", textTransform: "none" }}>
                  {loadingMore ? "Loading…" : "Load earlier visits"}
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}