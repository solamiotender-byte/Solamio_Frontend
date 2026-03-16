// pages/Attendance.jsx  (handles both own view and admin /attendance/:userId view)
import React, {
  useState, useEffect, useCallback, useMemo, useRef,
} from "react";
import {
  Box, Grid, Paper, Typography, Chip, IconButton, Stack,
  Card, CardContent, Button, useTheme, useMediaQuery,
  Skeleton, Dialog, Slide, Alert, Snackbar, TextField,
  MenuItem, FormControl, InputLabel, Select, Pagination,
  Fade, Zoom, Badge, DialogTitle, DialogContent,
  CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Collapse, Fab,
  SwipeableDrawer, BottomNavigation, BottomNavigationAction,
  InputAdornment, DialogActions, Tooltip, alpha,
  Checkbox, Menu, ListItemIcon, ListItemText, Divider, Avatar,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  CalendarToday, ChevronLeft, ChevronRight, AccessTime,
  Person, CheckCircle, Warning, Error as ErrorIcon,
  Visibility, Delete, Login, Logout, LocationOn, Close,
  Dashboard, ExpandMore, Search, FilterAlt, Clear,
  Refresh, GpsFixed, GpsNotFixed, Timer, PlayArrow, Home,
  Business, MyLocation, FileDownload, Print, ContentCopy,
  Deselect, ArrowBack, Phone, Email,
} from "@mui/icons-material";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useAttendance } from "../hooks/useAttendance";
import { useGeo } from "../hooks/useGeo";
import AttendanceDetails, {
  generateCSV, generateJSON, downloadFile, printRecord,
} from "./AttendanceDetails";
import { format, differenceInSeconds } from "date-fns";
import { useNavigate, useParams, useLocation } from "react-router-dom";

// ─── Constants ────────────────────────────────────────────────────────────────
const API       = import.meta.env.VITE_API_URL || "https://solar-backend-4bsb.onrender.com";
const PRIMARY   = "#4569ea";
const SECONDARY = "#1a237e";
const SUCCESS   = "#22c55e";
const DANGER    = "#ef4444";
const WARNING   = "#f59e0b";

const MANAGER_ROLES = ["Head_office", "ZSM", "ASM"];

const PERIOD_OPTIONS = [
  { value: "Today",      label: "Today"      },
  { value: "This Week",  label: "This Week"  },
  { value: "This Month", label: "This Month" },
  { value: "All",        label: "All Time"   },
];

const STATUS_CONFIG = {
  present: { bg: alpha(SUCCESS, 0.1), color: SUCCESS,      icon: <CheckCircle sx={{ fontSize: 14 }} />, label: "Present" },
  absent:  { bg: alpha(DANGER,  0.1), color: DANGER,       icon: <ErrorIcon   sx={{ fontSize: 14 }} />, label: "Absent"  },
  late:    { bg: alpha(WARNING, 0.1), color: WARNING,      icon: <Warning     sx={{ fontSize: 14 }} />, label: "Late"    },
  leave:   { bg: alpha("#a855f7", 0.1), color: "#a855f7",  icon: <Person      sx={{ fontSize: 14 }} />, label: "Leave"   },
  holiday: { bg: alpha("#3b82f6", 0.1), color: "#3b82f6",  icon: <CalendarToday sx={{ fontSize: 14 }} />, label: "Holiday" },
};

// ─── useWorkTimer ─────────────────────────────────────────────────────────────
function useWorkTimer() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime]           = useState(null);
  const [isActive, setIsActive]             = useState(false);
  const timerRef = useRef(null);
  const pad        = (n) => String(n).padStart(2, "0");
  const formatTime = useCallback(
    (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`, [],
  );
  const start = useCallback((ts = new Date()) => { setStartTime(ts); setIsActive(true); }, []);
  const stop  = useCallback(() => {
    setIsActive(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);
  const reset = useCallback(() => {
    setElapsedSeconds(0); setStartTime(null); setIsActive(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);
  useEffect(() => {
    if (isActive && startTime) {
      timerRef.current = setInterval(
        () => setElapsedSeconds(differenceInSeconds(new Date(), new Date(startTime))), 1000,
      );
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, startTime]);
  return { elapsedSeconds, formattedTime: formatTime(elapsedSeconds), isActive, start, stop, reset };
}

// ─── Styled ───────────────────────────────────────────────────────────────────
const GlassCard = styled(Card)(() => ({
  background: "rgba(255,255,255,0.97)",
  backdropFilter: "blur(12px)",
  border: `1px solid ${alpha(PRIMARY, 0.08)}`,
  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  borderRadius: 20,
}));

const PulsingDot = styled(Box)(({ dotcolor }) => ({
  width: 9, height: 9, borderRadius: "50%",
  backgroundColor: dotcolor, flexShrink: 0,
  animation: "pulseAnim 2s ease-in-out infinite",
  "@keyframes pulseAnim": {
    "0%, 100%": { boxShadow: `0 0 0 0px ${dotcolor}55` },
    "50%":       { boxShadow: `0 0 0 6px ${dotcolor}00` },
  },
}));

const TimerDisplay = styled(Box)(({ theme, isrunning }) => ({
  background: `linear-gradient(135deg, ${alpha(PRIMARY, 0.1)} 0%, ${alpha(SECONDARY, 0.1)} 100%)`,
  borderRadius: 16, padding: theme.spacing(2, 3),
  border: `1px solid ${alpha(isrunning === "true" ? SUCCESS : PRIMARY, 0.2)}`,
  boxShadow: `0 4px 12px ${alpha(isrunning === "true" ? SUCCESS : PRIMARY, 0.1)}`,
}));

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status, size = "small" }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.present;
  return (
    <Chip size={size} label={cfg.label} icon={cfg.icon}
      sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, "& .MuiChip-icon": { color: cfg.color } }}
    />
  );
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color = PRIMARY, sub, loading, index }) => (
  <Fade in timeout={300 + index * 80}>
    <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, borderRadius: 3, height: "100%", border: `1px solid ${alpha(color, 0.12)}`, background: `linear-gradient(140deg, #fff 55%, ${alpha(color, 0.05)})`, transition: "transform .2s, box-shadow .2s", "&:hover": { transform: "translateY(-3px)", boxShadow: `0 8px 24px ${alpha(color, 0.14)}` } }}>
      {loading ? (
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
      ) : (
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ width: { xs: 34, sm: 42 }, height: { xs: 34, sm: 42 }, borderRadius: 2, bgcolor: alpha(color, 0.1), display: "flex", alignItems: "center", justifyContent: "center", color }}>
              <Icon sx={{ fontSize: { xs: 18, sm: 22 } }} />
            </Box>
            <Typography variant="h5" fontWeight={800} color={color} sx={{ fontSize: { xs: "1.2rem", sm: "1.6rem" } }}>{value}</Typography>
          </Stack>
          <Box>
            <Typography variant="body2" fontWeight={700} sx={{ fontSize: { xs: "0.72rem", sm: "0.82rem" } }}>{label}</Typography>
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
          </Box>
        </Stack>
      )}
    </Paper>
  </Fade>
);

// ─── CalCell ──────────────────────────────────────────────────────────────────
const CalCell = ({ day, isSelected, isToday, isWeekend, status, onClick, isPrev }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <Box onClick={onClick} sx={{ height: { xs: 36, sm: 44 }, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2, cursor: isPrev ? "default" : "pointer", fontSize: { xs: "0.7rem", sm: "0.8rem" }, fontWeight: 600, transition: "all .18s ease", opacity: isPrev ? 0.2 : 1, userSelect: "none", bgcolor: isSelected ? PRIMARY : isToday ? alpha(PRIMARY, 0.12) : cfg ? cfg.bg : "transparent", color: isSelected ? "#fff" : isToday ? PRIMARY : cfg ? cfg.color : isWeekend ? alpha("#000", 0.3) : "text.primary", border: isToday && !isSelected ? `2px solid ${PRIMARY}` : "2px solid transparent", "&:hover": !isPrev ? { bgcolor: isSelected ? PRIMARY : alpha(PRIMARY, 0.1), transform: "scale(1.08)" } : {} }}>
      {day}
    </Box>
  );
};

// ─── LiveTimer ────────────────────────────────────────────────────────────────
const LiveTimer = ({ startTime, isRunning }) => {
  const [now, setNow] = useState(new Date());
  const ref = useRef(null);
  useEffect(() => {
    if (isRunning) ref.current = setInterval(() => setNow(new Date()), 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [isRunning]);
  if (!startTime || !isRunning) return null;
  const ms = now - new Date(startTime);
  const p  = (n) => String(n).padStart(2, "0");
  const f  = `${p(Math.floor(ms / 3600000))}:${p(Math.floor((ms % 3600000) / 60000))}:${p(Math.floor((ms % 60000) / 1000))}`;
  return (
    <TimerDisplay isrunning="true">
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: alpha(SUCCESS, 0.15), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Timer sx={{ color: SUCCESS }} />
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>Current Session Duration</Typography>
          <Typography variant="h4" fontWeight={800} color={SUCCESS}>{f}</Typography>
        </Box>
        <Box sx={{ flex: 1, textAlign: "right" }}>
          <Chip icon={<PlayArrow />} label="LIVE" size="small" sx={{ bgcolor: alpha(SUCCESS, 0.15), color: SUCCESS, fontWeight: 700, animation: "pulse 1.5s infinite", "@keyframes pulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.5 } } }} />
        </Box>
      </Stack>
    </TimerDisplay>
  );
};

// ─── LocationPermissionDialog ─────────────────────────────────────────────────
const LocationPermissionDialog = ({ open, mode, onAllow, onDeny, requesting }) => {
  const isPunchIn   = mode === "in";
  const accentColor = isPunchIn ? SUCCESS : DANGER;
  const isMobile    = useMediaQuery("(max-width:600px)");
  return (
    <Dialog open={open} maxWidth="xs" fullWidth fullScreen={isMobile} TransitionComponent={isMobile ? Slide : Zoom} TransitionProps={isMobile ? { direction: "up" } : {}} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4, overflow: "hidden" } }}>
      <Box sx={{ height: 5, background: `linear-gradient(90deg, ${PRIMARY}, ${accentColor})` }} />
      <DialogContent sx={{ pt: 4, pb: 2, px: 3, textAlign: "center" }}>
        <Box sx={{ width: 80, height: 80, borderRadius: "50%", bgcolor: alpha(accentColor, 0.1), display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2.5, border: `2px solid ${alpha(accentColor, 0.25)}` }}>
          {requesting ? <CircularProgress size={36} sx={{ color: accentColor }} /> : <MyLocation sx={{ fontSize: 36, color: accentColor }} />}
        </Box>
        <Typography variant="h6" fontWeight={800} gutterBottom>{requesting ? "Getting your location…" : "Allow Location Access"}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {requesting ? "Please wait while we detect your current location." : `To ${isPunchIn ? "punch in" : "punch out"}, we need your current location to verify attendance.`}
        </Typography>
        {!requesting && (
          <Box sx={{ mt: 2.5, p: 1.5, borderRadius: 2, bgcolor: alpha(PRIMARY, 0.04), border: `1px solid ${alpha(PRIMARY, 0.1)}` }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <LocationOn sx={{ fontSize: 16, color: PRIMARY }} />
              <Typography variant="caption" color="primary" fontWeight={600}>GPS location required for attendance verification</Typography>
            </Stack>
          </Box>
        )}
      </DialogContent>
      {!requesting && (
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5, flexDirection: { xs: "column", sm: "row" } }}>
          <Button fullWidth={isMobile} variant="outlined" onClick={onDeny} sx={{ borderRadius: 2.5, borderColor: alpha(PRIMARY, 0.35), color: "text.secondary", order: isMobile ? 2 : 1 }}>Cancel</Button>
          <Button fullWidth={isMobile} variant="contained" onClick={onAllow} startIcon={<GpsFixed />} sx={{ borderRadius: 2.5, fontWeight: 700, bgcolor: accentColor, order: isMobile ? 1 : 2, "&:hover": { bgcolor: isPunchIn ? "#16a34a" : "#dc2626" } }}>Allow Location</Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

// ─── PunchModal ───────────────────────────────────────────────────────────────
const PunchModal = ({ open, mode, onClose, onConfirm, punchLoading, geo, timer }) => {
  const theme       = useTheme();
  const isMobile    = useMediaQuery(theme.breakpoints.down("sm"));
  const isPunchIn   = mode === "in";
  const accentColor = isPunchIn ? SUCCESS : DANGER;
  const [tick, setTick]                     = useState(new Date());
  const [showFullAddress, setShowFullAddress] = useState(false);
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setTick(new Date()), 1000);
    return () => clearInterval(t);
  }, [open]);
  const showTimer = !isPunchIn && timer?.isActive && timer?.formattedTime;
  return (
    <Dialog open={open} onClose={punchLoading ? undefined : onClose} maxWidth="xs" fullWidth fullScreen={isMobile} TransitionComponent={isMobile ? Slide : Zoom} TransitionProps={isMobile ? { direction: "up" } : {}} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4, overflow: "hidden" } }}>
      <Box sx={{ height: 5, background: `linear-gradient(90deg, ${PRIMARY}, ${accentColor})` }} />
      <DialogTitle sx={{ pb: 1, pt: 2.5, px: { xs: 2, sm: 3 }, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 46, height: 46, borderRadius: "50%", bgcolor: alpha(accentColor, 0.12), display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isPunchIn ? <Login sx={{ color: accentColor, fontSize: 24 }} /> : <Logout sx={{ color: accentColor, fontSize: 24 }} />}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1.2}>{isPunchIn ? "Punch In" : "Punch Out"}</Typography>
            <Typography variant="caption" color="text.secondary">{format(tick, "EEEE, dd MMM yyyy")}</Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} disabled={punchLoading} size="small" sx={{ bgcolor: alpha("#000", 0.05) }}><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 3 }, pt: 1.5, pb: 2 }}>
        <Stack spacing={2.5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, textAlign: "center", background: `linear-gradient(135deg, ${alpha(accentColor, 0.07)}, ${alpha(PRIMARY, 0.04)})`, border: `1px solid ${alpha(accentColor, 0.15)}` }}>
            <Typography variant="h2" fontWeight={900} lineHeight={1} sx={{ color: accentColor, fontSize: { xs: "2.8rem", sm: "3.5rem" }, letterSpacing: -2 }}>
              {format(tick, "hh:mm")}
              <Typography component="span" variant="h5" fontWeight={600} color="text.secondary" sx={{ ml: 0.75, letterSpacing: 0 }}>{format(tick, "ss")}</Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{format(tick, "a")} · Current Time</Typography>
          </Paper>
          {showTimer && (
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: alpha(SUCCESS, 0.08), border: `1px solid ${alpha(SUCCESS, 0.2)}` }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: alpha(SUCCESS, 0.15), display: "flex", alignItems: "center", justifyContent: "center" }}><Timer sx={{ color: SUCCESS, fontSize: 20 }} /></Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Current Session</Typography>
                  <Typography variant="h5" fontWeight={800} color={SUCCESS}>{timer.formattedTime}</Typography>
                </Box>
                <Chip size="small" label="LIVE" sx={{ bgcolor: alpha(SUCCESS, 0.2), color: SUCCESS, fontWeight: 700, ml: "auto" }} />
              </Stack>
            </Paper>
          )}
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: `1px solid ${alpha(geo.loading ? PRIMARY : geo.error ? DANGER : geo.latitude ? SUCCESS : "#000", 0.25)}`, bgcolor: alpha(geo.loading ? PRIMARY : geo.error ? DANGER : geo.latitude ? SUCCESS : "#000", 0.04) }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box sx={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, bgcolor: alpha(geo.loading ? PRIMARY : geo.error ? DANGER : geo.latitude ? SUCCESS : "#000", 0.1), display: "flex", alignItems: "center", justifyContent: "center" }}>
                {geo.loading ? <CircularProgress size={18} sx={{ color: PRIMARY }} /> : geo.error ? <GpsNotFixed sx={{ fontSize: 18, color: DANGER }} /> : geo.latitude ? <GpsFixed sx={{ fontSize: 18, color: SUCCESS }} /> : <LocationOn sx={{ fontSize: 18, color: "text.secondary" }} />}
              </Box>
              <Box flex={1} minWidth={0}>
                <Typography variant="body2" fontWeight={700}>{geo.loading ? "Detecting your location…" : geo.error ? "Location unavailable" : geo.latitude ? geo.address?.short || "Location acquired" : "Location not fetched"}</Typography>
                {geo.address?.full && (
                  <Box sx={{ mt: 0.5 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ cursor: "pointer" }} onClick={() => setShowFullAddress((v) => !v)}>
                      <Home sx={{ fontSize: 14, color: "text.secondary" }} />
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3, ...(!showFullAddress && { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }) }}>
                        {showFullAddress ? geo.address.full : geo.address.full.split(",")[0]}
                      </Typography>
                      <ExpandMore sx={{ fontSize: 14, color: "text.secondary", transform: showFullAddress ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                    </Stack>
                    {showFullAddress && geo.address.city && (
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5, ml: 2.5 }}>
                        <Business sx={{ fontSize: 12, color: "text.disabled" }} />
                        <Typography variant="caption" color="text.disabled">{[geo.address.city, geo.address.state, geo.address.country].filter(Boolean).join(", ")}</Typography>
                      </Stack>
                    )}
                  </Box>
                )}
                {geo.latitude && !geo.error && !geo.address && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>📍 {geo.latitude.toFixed(5)}, {geo.longitude.toFixed(5)}{geo.accuracy && ` (±${Math.round(geo.accuracy)}m)`}</Typography>}
                {geo.error && <Typography variant="caption" color="error" sx={{ display: "block", lineHeight: 1.3, mt: 0.25 }}>{geo.error}</Typography>}
              </Box>
              {(geo.error || !geo.latitude) && !geo.loading && (
                <IconButton size="small" onClick={() => geo.fetchLocation(true)} sx={{ bgcolor: alpha(PRIMARY, 0.08), flexShrink: 0 }}><Refresh fontSize="small" sx={{ color: PRIMARY }} /></IconButton>
              )}
            </Stack>
          </Paper>
          {geo.error && <Alert severity="error" sx={{ borderRadius: 2, py: 0.75 }}>Location is required to punch in/out. Please allow access and tap retry.</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 }, gap: 1.5, flexDirection: { xs: "column", sm: "row" }, borderTop: `1px solid ${alpha(PRIMARY, 0.08)}` }}>
        <Button fullWidth={isMobile} variant="outlined" onClick={onClose} disabled={punchLoading} sx={{ borderRadius: 2.5, px: 3, borderColor: alpha(PRIMARY, 0.35), color: PRIMARY }}>Cancel</Button>
        <Button fullWidth={isMobile} variant="contained" onClick={onConfirm} disabled={punchLoading || geo.loading || !geo.latitude} startIcon={punchLoading ? <CircularProgress size={16} color="inherit" /> : isPunchIn ? <Login /> : <Logout />} sx={{ borderRadius: 2.5, px: 3, fontWeight: 700, bgcolor: accentColor, "&:hover": { bgcolor: isPunchIn ? "#16a34a" : "#dc2626" } }}>
          {punchLoading ? "Processing…" : isPunchIn ? "Confirm Punch In" : "Confirm Punch Out"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── BulkExportMenu ───────────────────────────────────────────────────────────
const BulkExportMenu = ({ selectedRecords, allRecords, onSnack, size = "small" }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open         = Boolean(anchorEl);
  const ts           = format(new Date(), "yyyyMMdd_HHmmss");
  const hasSelection = selectedRecords.length > 0;
  const exportTarget = hasSelection ? selectedRecords : allRecords;
  const count        = exportTarget.length;
  const act = (fn) => () => {
    try { fn(); onSnack(`Exported ${count} record${count !== 1 ? "s" : ""} successfully`); }
    catch { onSnack("Export failed", "error"); }
    setAnchorEl(null);
  };
  return (
    <>
      <Button variant="contained" size={size} startIcon={<FileDownload />} endIcon={<ExpandMore sx={{ fontSize: 15 }} />} onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ bgcolor: "rgba(255,255,255,.15)", color: "#fff", borderRadius: 2.5, fontWeight: 600, "&:hover": { bgcolor: "rgba(255,255,255,.25)" } }}>
        Export{hasSelection ? ` (${selectedRecords.length})` : ""}
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { mt: 1.5, borderRadius: 2.5, minWidth: 230, boxShadow: "0 8px 24px rgba(0,0,0,0.13)" } }} transformOrigin={{ horizontal: "right", vertical: "top" }} anchorOrigin={{ horizontal: "right", vertical: "bottom" }}>
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.65rem" }}>
            {hasSelection ? `${count} selected record${count !== 1 ? "s" : ""}` : `All ${count} record${count !== 1 ? "s" : ""} on this page`}
          </Typography>
        </Box>
        <MenuItem onClick={act(() => downloadFile(generateCSV(exportTarget), `attendance_${ts}.csv`, "text/csv"))} sx={{ py: 1.25 }}>
          <ListItemIcon><FileDownload fontSize="small" sx={{ color: SUCCESS }} /></ListItemIcon>
          <ListItemText primary="Export as CSV" secondary={`${count} record${count !== 1 ? "s" : ""}`} primaryTypographyProps={{ variant: "body2", fontWeight: 600 }} secondaryTypographyProps={{ variant: "caption" }} />
        </MenuItem>
        <MenuItem onClick={act(() => downloadFile(generateJSON(exportTarget), `attendance_${ts}.json`, "application/json"))} sx={{ py: 1.25 }}>
          <ListItemIcon><FileDownload fontSize="small" sx={{ color: PRIMARY }} /></ListItemIcon>
          <ListItemText primary="Export as JSON" secondary={`${count} record${count !== 1 ? "s" : ""}`} primaryTypographyProps={{ variant: "body2", fontWeight: 600 }} secondaryTypographyProps={{ variant: "caption" }} />
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => { try { navigator.clipboard.writeText(generateJSON(exportTarget)); onSnack("Copied to clipboard"); } catch { onSnack("Copy failed", "error"); } setAnchorEl(null); }} sx={{ py: 1.25 }}>
          <ListItemIcon><ContentCopy fontSize="small" /></ListItemIcon>
          <ListItemText primary="Copy to Clipboard" primaryTypographyProps={{ variant: "body2", fontWeight: 600 }} />
        </MenuItem>
        {count === 1 && (
          <MenuItem onClick={() => { try { printRecord(exportTarget[0]); onSnack("Print preview opened"); } catch { onSnack("Print failed", "error"); } setAnchorEl(null); }} sx={{ py: 1.25 }}>
            <ListItemIcon><Print fontSize="small" /></ListItemIcon>
            <ListItemText primary="Print" primaryTypographyProps={{ variant: "body2", fontWeight: 600 }} />
          </MenuItem>
        )}
        {hasSelection && (<><Divider sx={{ my: 0.5 }} /><Box sx={{ px: 2, pt: 0.5, pb: 1 }}><Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.68rem" }}>Deselect all to export the whole page</Typography></Box></>)}
      </Menu>
    </>
  );
};

// ─── MobileLogCard ────────────────────────────────────────────────────────────
const MobileLogCard = ({ entry, onView, onDelete, canDelete, index }) => {
  const [exp, setExp] = useState(false);
  const cfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.present;
  const d   = new Date(entry.date);
  const ft  = (ts) => ts ? new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—";
  const resolveAddr = (addr) => !addr ? null : typeof addr === "string" ? addr : addr.short || addr.full?.split(",")[0] || null;
  return (
    <Fade in timeout={350 + index * 50}>
      <Paper sx={{ mb: 1.5, borderRadius: 3, border: `1px solid ${alpha(cfg.color, 0.2)}`, overflow: "hidden" }}>
        <Box sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ bgcolor: cfg.bg, borderRadius: 2, px: 1.25, py: 0.75, textAlign: "center", minWidth: 52 }}>
                <Typography variant="caption" fontWeight={800} color={cfg.color} sx={{ display: "block", lineHeight: 1, fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: 0.5 }}>{d.toLocaleString("default", { month: "short" })}</Typography>
                <Typography variant="h6" fontWeight={900} lineHeight={1.1} color={cfg.color}>{d.getDate()}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>{d.toLocaleDateString("en-US", { weekday: "long" })}</Typography>
                <StatusBadge status={entry.status || "present"} />
              </Box>
            </Stack>
            <IconButton size="small" onClick={() => setExp(!exp)} sx={{ bgcolor: alpha(cfg.color, 0.08), transform: exp ? "rotate(180deg)" : "none", transition: "transform .25s" }}><ExpandMore fontSize="small" /></IconButton>
          </Stack>
          <Grid container spacing={1} sx={{ mb: 1.5 }}>
            {[["Punch In", ft(entry.punchIn?.time), SUCCESS], ["Punch Out", entry.punchOut ? ft(entry.punchOut.time) : "Ongoing", entry.punchOut ? WARNING : PRIMARY], ["Hours", entry.workHoursFormatted || "—", PRIMARY]].map(([l, v, c]) => (
              <Grid item xs={4} key={l}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25, fontSize: "0.68rem" }}>{l}</Typography>
                <Typography variant="body2" fontWeight={700} color={c}>{v}</Typography>
              </Grid>
            ))}
          </Grid>
          {resolveAddr(entry.punchIn?.address) && <Stack direction="row" spacing={0.5} alignItems="flex-start" sx={{ mb: 0.5 }}><LocationOn sx={{ fontSize: 13, color: "text.disabled", mt: 0.2 }} /><Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}><strong>In:</strong> {resolveAddr(entry.punchIn.address)}</Typography></Stack>}
          {resolveAddr(entry.punchOut?.address) && <Stack direction="row" spacing={0.5} alignItems="flex-start" sx={{ mb: 0.5 }}><LocationOn sx={{ fontSize: 13, color: "text.disabled", mt: 0.2 }} /><Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}><strong>Out:</strong> {resolveAddr(entry.punchOut.address)}</Typography></Stack>}
          <Collapse in={exp}>
            <Stack direction="row" spacing={1} sx={{ mt: 2, pt: 2, borderTop: `1px dashed ${alpha(cfg.color, 0.2)}` }}>
              <Button fullWidth size="small" variant="contained" startIcon={<Visibility />} onClick={() => onView(entry)} sx={{ borderRadius: 2, bgcolor: PRIMARY, "&:hover": { bgcolor: SECONDARY } }}>View</Button>
              {canDelete && <Button fullWidth size="small" variant="outlined" color="error" startIcon={<Delete />} onClick={() => onDelete(entry)} sx={{ borderRadius: 2 }}>Delete</Button>}
            </Stack>
          </Collapse>
        </Box>
      </Paper>
    </Fade>
  );
};

// ─── LoadingSkeleton ──────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <Box sx={{ p: { xs: 2, sm: 3 } }}>
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {[1, 2, 3, 4].map((i) => <Grid item xs={6} sm={3} key={i}><Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3 }} /></Grid>)}
    </Grid>
    <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2, mb: 2 }} />
    <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
  </Box>
);

// ─── getPeriodDates ───────────────────────────────────────────────────────────
const getPeriodDates = (period) => {
  const now = new Date();
  if (period === "Today") {
    const s = new Date(now); s.setHours(0, 0, 0, 0);
    const e = new Date(now); e.setHours(23, 59, 59, 999);
    return { startDate: s.toISOString().split("T")[0], endDate: e.toISOString().split("T")[0] };
  }
  if (period === "This Week") {
    const day = now.getDay();
    const s = new Date(now); s.setDate(now.getDate() - day); s.setHours(0, 0, 0, 0);
    const e = new Date(now); e.setHours(23, 59, 59, 999);
    return { startDate: s.toISOString().split("T")[0], endDate: e.toISOString().split("T")[0] };
  }
  if (period === "This Month") {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    const e = new Date(now); e.setHours(23, 59, 59, 999);
    return { startDate: s.toISOString().split("T")[0], endDate: e.toISOString().split("T")[0] };
  }
  return {};
};



// ─── Battery Helper ───────────────────────────────────────────────────────────

// ─── Battery Helper ─────────────────────────────────────────────────────────
// MUST return { percentage, isCharging } so callers can update state
const saveBattery = async (userId, token) => {
  try {
    if (!("getBattery" in navigator)) return null;

    const battery    = await navigator.getBattery();
    const percentage = Math.round(battery.level * 100);
    const isCharging = battery.charging;

    console.log("💾 saveBattery — userId:", userId, "| %:", percentage, "| charging:", isCharging);

    await axios.post(
      `${API}/api/v1/battery/log`,
      { userId, percentage, isCharging },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("✅ Battery saved successfully");
    return { percentage, isCharging }; // ← CRITICAL: must return this
  } catch (e) {
    console.error("❌ Battery save error:", e.message);
    return null;
  }
};




// ─── Main Component ───────────────────────────────────────────────────────────
export default function Attendance() {
  const theme    = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
const [batteryInfo, setBatteryInfo] = useState({ percentage: null, isCharging: false });
  const { userId: paramUserId } = useParams();
  const location                = useLocation();
  const memberInfo              = location.state || {};
  const isAdminView             = !!paramUserId;

  const { user, getUserRole } = useAuth();
  const {
    attendances, loading, error, success, pagination, summary,
    fetchAttendances, punchIn, punchOut, deleteAttendance, clearMessages,
  } = useAttendance();
  const geo   = useGeo();
  const timer = useWorkTimer();

  const userRole      = getUserRole();
  const isTeam        = userRole === "TEAM";
  const canManage     = MANAGER_ROLES.includes(userRole);
  const canDelete     = userRole === "Head_office";
  const isManagerRole = MANAGER_ROLES.includes(userRole);

  const showPunchControls = !isAdminView && !isManagerRole;

  const [todayAtt, setTodayAtt] = useState(null);
  useEffect(() => {
    const ts    = new Date().toDateString();
    const found = attendances?.find((a) => new Date(a.date).toDateString() === ts) || null;
    setTodayAtt(found);
    if (!isAdminView) {
      if (found?.punchIn && !found?.punchOut) timer.start(found.punchIn.time);
      else if (found?.punchOut) timer.stop();
      else timer.reset();
    }
    // eslint-disable-next-line
  }, [attendances]);

  const hasPunchedIn  = !!todayAtt?.punchIn;
  const hasPunchedOut = !!todayAtt?.punchOut;

  const [period,       setPeriod]       = useState("This Month");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filters,      setFilters]      = useState({ page: 1, limit: 10, status: "", search: "" });
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [snackbar,     setSnackbar]     = useState({ open: false, message: "", severity: "success" });
  const [selLog,       setSelLog]       = useState(null);
  const [logOpen,      setLogOpen]      = useState(false);
  const [deleteOpen,   setDeleteOpen]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [navValue,     setNavValue]     = useState(0);
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchState,   setPunchState]   = useState({ stage: null, mode: "in" });
  const [locationRequesting, setLocationRequesting] = useState(false);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const selectedRecords = useMemo(() => (attendances || []).filter((a) => selectedIds.has(a._id || a.id)), [attendances, selectedIds]);
  const allPageIds      = useMemo(() => (attendances || []).map((a) => a._id || a.id), [attendances]);
  const allSelected     = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const someSelected    = selectedIds.size > 0;
  const toggleRow       = (id) => setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll       = () => setSelectedIds(allSelected ? new Set() : new Set(allPageIds));
  useEffect(() => { setSelectedIds(new Set()); }, [filters.page, period]);

  const containerRef = useRef(null);
  const showSnack    = useCallback((msg, sev = "success") => setSnackbar({ open: true, message: msg, severity: sev }), []);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.search) n++;
    if (filters.status) n++;
    if (period !== "This Month") n++;
    return n;
  }, [filters, period]);

  const loadData = useCallback(async () => {
    const dates = getPeriodDates(period);
    const q = {
      page:  filters.page,
      limit: filters.limit,
      ...(filters.status && { status: filters.status }),
      ...(filters.search && { search: filters.search }),
      ...(paramUserId
        ? { userId: paramUserId }
        : isTeam && user?._id
        ? { userId: user._id }
        : {}),
      ...dates,
    };
    await fetchAttendances(q);
  }, [filters, period, isTeam, user, fetchAttendances, paramUserId]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    if (error)   showSnack(error,   "error");
    if (success) showSnack(success, "success");
  }, [error, success, showSnack]);


useEffect(() => {
  if (!("getBattery" in navigator)) return;
  let battery = null;

  const update = () => {
    if (!battery) return;
    setBatteryInfo({
      percentage: Math.round(battery.level * 100),
      isCharging: battery.charging,
    });
  };

  navigator.getBattery().then((b) => {
    battery = b;
    update(); // set immediately on mount
    b.addEventListener("levelchange",    update);
    b.addEventListener("chargingchange", update);
  });

  return () => {
    if (battery) {
      battery.removeEventListener("levelchange",    update);
      battery.removeEventListener("chargingchange", update);
    }
  };
}, []);




  // ── Periodic battery sync while on duty (every 5 min) ────────────────────
useEffect(() => {
  if (!user?._id || !hasPunchedIn || hasPunchedOut) return;
  if (!("getBattery" in navigator)) return;

  const token = localStorage.getItem("token");

  // Save immediately on mount (covers page refresh while on duty)
  saveBattery(user._id, token).then((res) => {
    if (res) setBatteryInfo(res);
  });

  const interval = setInterval(async () => {
    const res = await saveBattery(user._id, token);
    if (res) setBatteryInfo(res);
  }, 5 * 60 * 1000);

  return () => clearInterval(interval);
}, [hasPunchedIn, hasPunchedOut, user?._id]);




  const openPunchModal = useCallback((mode) => {
    if (mode === "in" && hasPunchedIn) {
      showSnack(hasPunchedOut ? "Attendance complete for today. See you tomorrow!" : "Already punched in. Use Punch Out when done.", "warning");
      return;
    }
    if (mode === "out" && hasPunchedOut) { showSnack("Already punched out for today.", "info"); return; }
    setPunchState({ stage: "permission", mode });
  }, [hasPunchedIn, hasPunchedOut, showSnack]);

  const handleAllowLocation = useCallback(async () => {
    setLocationRequesting(true);
    try { await geo.fetchLocation(true); } catch { /* shown in confirm modal */ }
    finally { setLocationRequesting(false); setPunchState((s) => ({ ...s, stage: "confirm" })); }
  }, [geo]);

  const handleDenyLocation = useCallback(() => { setPunchState({ stage: null, mode: "in" }); geo.reset(); }, [geo]);

  // ── Punch confirm — clean single version ─────────────────────────────────
  const handlePunchConfirm = useCallback(async () => {
    const mode = punchState.mode;
    if (mode === "in"  && hasPunchedIn)  { showSnack("Already punched in.",  "warning"); setPunchState({ stage: null, mode: "in" }); return; }
    if (mode === "out" && hasPunchedOut) { showSnack("Already punched out.", "info");    setPunchState({ stage: null, mode: "in" }); return; }
    if (!geo.latitude || !geo.longitude) { showSnack("Could not get valid location. Please retry.", "error"); return; }

    setPunchLoading(true);
    try {
      const fn     = mode === "in" ? punchIn : punchOut;
      const result = await fn({
        latitude:  parseFloat(geo.latitude.toFixed(6)),
        longitude: parseFloat(geo.longitude.toFixed(6)),
        accuracy:  geo.accuracy,
        address:   geo.address,
      });

      if (result?.success) {
        showSnack(`Punch ${mode} successful!`);
        setPunchState({ stage: null, mode: "in" });
        await loadData();

        if (mode === "in") {
          timer.start(new Date());

          // // ── Save battery immediately on punch-in ──────────────────
          const token = localStorage.getItem("token");
          await saveBattery(user._id, token);

          // ── Live listeners: update battery on level/charging change ─
          if ("getBattery" in navigator) {
            const battery = await navigator.getBattery();
            battery.addEventListener("levelchange",  () => saveBattery(user._id, token));
            battery.addEventListener("chargingchange", () => saveBattery(user._id, token));
          }
        }
      } else {
        showSnack(result?.error || `Punch ${mode} failed`, "error");
      }
    } catch (e) {
      showSnack(e.message || "Punch failed", "error");
    } finally {
      setPunchLoading(false);
    }
  }, [geo, punchState.mode, hasPunchedIn, hasPunchedOut, punchIn, punchOut, loadData, timer, showSnack, user]);

  const handleCloseConfirm = useCallback(() => { if (!punchLoading) { setPunchState({ stage: null, mode: "in" }); geo.reset(); } }, [punchLoading, geo]);

  const calendarDays = useMemo(() => {
    const y = currentMonth.getFullYear(), m = currentMonth.getMonth();
    const firstDay = new Date(y, m, 1).getDay(), daysInMonth = new Date(y, m + 1, 0).getDate();
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) { const d = new Date(y, m, -i); days.push({ day: d.getDate(), date: d, isPrev: true }); }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(y, m, i);
      const att  = attendances?.find((a) => new Date(a.date).toDateString() === date.toDateString());
      days.push({ day: i, date, status: att?.status, att });
    }
    return days;
  }, [currentMonth, attendances]);

  const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const handleDateSelect    = useCallback((d) => {
    setSelectedDate(d);
    const att = attendances?.find((a) => new Date(a.date).toDateString() === d.toDateString());
    if (att) { setSelLog(att); setLogOpen(true); }
  }, [attendances]);
  const handleDeleteOpen    = useCallback((att) => { setDeleteTarget(att); setDeleteOpen(true); }, []);
  const handleDeleteConfirm = useCallback(async () => {
    const id = deleteTarget?._id || deleteTarget?.id;
    if (!id) { setDeleteOpen(false); return; }
    const res = await deleteAttendance(id);
    if (res?.success) await loadData();
    setDeleteOpen(false); setDeleteTarget(null);
  }, [deleteTarget, deleteAttendance, loadData]);
  const clearFilters = useCallback(() => { setFilters({ page: 1, limit: 10, status: "", search: "" }); setPeriod("This Month"); }, []);
  const setFilter    = (key) => (val) => setFilters((prev) => ({ ...prev, [key]: val, page: 1 }));
  const fmtDate      = (ts) => !ts ? "—" : new Date(ts).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  const fmtTime      = (ts) => !ts ? "—" : new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  if (loading && !attendances?.length) return <LoadingSkeleton />;

  return (
    <Box ref={containerRef} sx={{ p: { xs: 1.5, sm: 2, md: 3 }, minHeight: "100vh", pb: { xs: 9, sm: 3 }, bgcolor: "#f4f6fb" }}>
      {showPunchControls && (
        <>
          <LocationPermissionDialog open={punchState.stage === "permission"} mode={punchState.mode} onAllow={handleAllowLocation} onDeny={handleDenyLocation} requesting={locationRequesting} />
          <PunchModal open={punchState.stage === "confirm"} mode={punchState.mode} onClose={handleCloseConfirm} onConfirm={handlePunchConfirm} punchLoading={punchLoading} geo={geo} timer={timer} />
        </>
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3, background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`, color: "#fff", position: "relative", overflow: "hidden" }}>
        {[{ w: 200, h: 200, t: -70, r: -50 }, { w: 120, h: 120, t: 20, r: 100 }].map((b, i) => (
          <Box key={i} sx={{ position: "absolute", width: b.w, height: b.h, borderRadius: "50%", bgcolor: "#fff", opacity: i === 0 ? 0.05 : 0.04, top: b.t, right: b.r, pointerEvents: "none" }} />
        ))}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            {isAdminView && (
              <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" }, flexShrink: 0 }}>
                <ArrowBack />
              </IconButton>
            )}
            <Box>
              {isAdminView && memberInfo.fromTeam && (
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" sx={{ opacity: 0.7, cursor: "pointer", "&:hover": { opacity: 1 } }} onClick={() => navigate("/team-attendance")}>Team</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.5 }}>›</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 600 }}>{memberInfo.memberName}</Typography>
                </Stack>
              )}
              {isAdminView ? (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)", width: isMobile ? 38 : 46, height: isMobile ? 38 : 46, fontWeight: 800, fontSize: isMobile ? "0.95rem" : "1.1rem" }}>
                    {memberInfo.memberName?.charAt(0) || "?"}
                  </Avatar>
                  <Box>
                    <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight={800} lineHeight={1.2}>
                      {memberInfo.memberName || "Team Member"}
                    </Typography>
                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                      {memberInfo.memberRole && <Chip size="small" label={memberInfo.memberRole} sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700, height: 20, fontSize: "0.68rem" }} />}
                      {memberInfo.memberPhone && (
                        <Stack direction="row" spacing={0.4} alignItems="center">
                          <Phone sx={{ fontSize: 12, opacity: 0.7 }} />
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>{memberInfo.memberPhone}</Typography>
                        </Stack>
                      )}
                      {memberInfo.memberEmail && !isMobile && (
                        <Stack direction="row" spacing={0.4} alignItems="center">
                          <Email sx={{ fontSize: 12, opacity: 0.7 }} />
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>{memberInfo.memberEmail}</Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              ) : (
                <>
                  <Typography variant={isMobile ? "h6" : "h5"} fontWeight={800}>Attendance Dashboard</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <PulsingDot dotcolor={!isManagerRole && hasPunchedIn && !hasPunchedOut ? SUCCESS : "rgba(255,255,255,0.5)"} />
                    <Typography variant="caption" sx={{ opacity: 0.85 }}>
                      {isManagerRole ? `Managing as ${userRole}` : hasPunchedIn && !hasPunchedOut ? "Currently clocked in" : hasPunchedOut ? "Clocked out for today" : "Not clocked in today"}
                    </Typography>
                  </Stack>
                </>
              )}
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            {showPunchControls && (
              <>
                {!hasPunchedIn && <Button variant="contained" startIcon={<Login />} onClick={() => openPunchModal("in")} size={isMobile ? "small" : "medium"} sx={{ bgcolor: SUCCESS, fontWeight: 700, borderRadius: 2.5, "&:hover": { bgcolor: "#16a34a" }, boxShadow: `0 4px 12px ${alpha(SUCCESS, 0.4)}` }}>Punch In</Button>}
                {hasPunchedIn && !hasPunchedOut && <Button variant="contained" startIcon={<Logout />} onClick={() => openPunchModal("out")} size={isMobile ? "small" : "medium"} sx={{ bgcolor: DANGER, fontWeight: 700, borderRadius: 2.5, "&:hover": { bgcolor: "#dc2626" }, boxShadow: `0 4px 12px ${alpha(DANGER, 0.4)}` }}>Punch Out</Button>}
                {hasPunchedIn && hasPunchedOut && <Tooltip title="Attendance complete for today" arrow><span><Button variant="contained" startIcon={<CheckCircle />} disabled size={isMobile ? "small" : "medium"} sx={{ fontWeight: 700, borderRadius: 2.5, bgcolor: "rgba(255,255,255,.15) !important", color: "rgba(255,255,255,.6) !important" }}>Day Complete</Button></span></Tooltip>}
              </>
            )}
            {!isMobile && attendances?.length > 0 && <BulkExportMenu selectedRecords={selectedRecords} allRecords={attendances || []} onSnack={showSnack} />}
            <Button variant="contained" startIcon={<Refresh />} onClick={loadData} disabled={loading} size={isMobile ? "small" : "medium"} sx={{ bgcolor: "rgba(255,255,255,.15)", color: "#fff", borderRadius: 2.5, "&:hover": { bgcolor: "rgba(255,255,255,.25)" } }}>Refresh</Button>
            {isMobile && <Button variant="contained" startIcon={<FilterAlt />} onClick={() => setDrawerOpen(true)} size="small" sx={{ bgcolor: "rgba(255,255,255,.15)", color: "#fff", borderRadius: 2.5, "&:hover": { bgcolor: "rgba(255,255,255,.25)" }, position: "relative" }}>Filter{activeFilterCount > 0 && <Badge badgeContent={activeFilterCount} color="error" sx={{ position: "absolute", top: -8, right: -8 }} />}</Button>}
          </Stack>
        </Stack>

        {showPunchControls && hasPunchedIn && !hasPunchedOut && <Box sx={{ mt: 2 }}><LiveTimer startTime={todayAtt?.punchIn?.time} isRunning={true} /></Box>}

        {!isAdminView && !isManagerRole && (hasPunchedIn || hasPunchedOut) && (
          <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(255,255,255,.15)" }}>
            <Stack direction="row" spacing={3} flexWrap="wrap">
              {[
                todayAtt?.punchIn  && ["Punch In",   fmtTime(todayAtt.punchIn.time)],
                todayAtt?.punchOut && ["Punch Out",  fmtTime(todayAtt.punchOut.time)],
                todayAtt?.workHoursFormatted && ["Work Hours", todayAtt.workHoursFormatted],
                todayAtt?.status && ["Status", todayAtt.status.charAt(0).toUpperCase() + todayAtt.status.slice(1)],
              ].filter(Boolean).map(([label, value]) => (
                <Box key={label}>
                  <Typography variant="caption" sx={{ opacity: 0.7, display: "block" }}>{label}</Typography>
                  <Typography variant="body2" fontWeight={700}>{value}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {isAdminView && pagination?.totalItems > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(255,255,255,.15)" }}>
            <Stack direction="row" spacing={3} flexWrap="wrap">
              <Box><Typography variant="caption" sx={{ opacity: 0.7, display: "block" }}>Total Records</Typography><Typography variant="body2" fontWeight={700}>{pagination.totalItems}</Typography></Box>
              <Box><Typography variant="caption" sx={{ opacity: 0.7, display: "block" }}>Period</Typography><Typography variant="body2" fontWeight={700}>{period}</Typography></Box>
            </Stack>
          </Box>
        )}
      </Paper>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <Grid container spacing={isMobile ? 1.5 : 2} sx={{ mb: 3 }}>
        {[
          { icon: CalendarToday, label: "Total Days",    value: pagination?.totalItems || 0,                              color: PRIMARY,   sub: "All records",  index: 0 },
          { icon: AccessTime,    label: "Work Hours",    value: `${(summary?.totalWorkHours || 0).toFixed(1)}h`,          color: "#3b82f6", sub: "Total logged",  index: 1 },
          { icon: CheckCircle,   label: "Present",       value: summary?.presentCount || 0,                               color: SUCCESS,   sub: "On time",      index: 2 },
          { icon: Warning,       label: "Late / Absent", value: `${summary?.lateCount || 0}/${summary?.absentCount || 0}`,color: WARNING,   sub: "Needs review", index: 3 },
        ].map((props) => (
          <Grid item xs={6} sm={3} key={props.label}><StatCard {...props} loading={loading} /></Grid>
        ))}
      </Grid>

      {isMobile && (
        <Box sx={{ mb: 2 }}>
          <TextField fullWidth size="small" placeholder="Search records…" value={filters.search} onChange={(e) => setFilter("search")(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment>, endAdornment: filters.search && <InputAdornment position="end"><IconButton size="small" onClick={() => setFilter("search")("")}><Close fontSize="small" /></IconButton></InputAdornment>, sx: { borderRadius: 3, bgcolor: "#fff" } }}
          />
        </Box>
      )}

      {!isMobile && (
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, border: `1px solid ${alpha(PRIMARY, 0.08)}` }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField size="small" placeholder="Search records…" value={filters.search} onChange={(e) => setFilter("search")(e.target.value)} sx={{ minWidth: 240 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: "text.secondary", fontSize: 18 }} /></InputAdornment>, endAdornment: filters.search && <InputAdornment position="end"><IconButton size="small" onClick={() => setFilter("search")("")}><Close fontSize="small" /></IconButton></InputAdornment>, sx: { borderRadius: 2 } }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select value={filters.status} label="Status" sx={{ borderRadius: 2 }} onChange={(e) => setFilter("status")(e.target.value)}>
                <MenuItem value="">All Statuses</MenuItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Period</InputLabel>
              <Select value={period} label="Period" sx={{ borderRadius: 2 }} onChange={(e) => setPeriod(e.target.value)}>
                {PERIOD_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
            {activeFilterCount > 0 && <Button variant="text" startIcon={<Clear />} onClick={clearFilters} sx={{ color: DANGER, fontWeight: 600 }}>Clear All</Button>}
          </Stack>
          {activeFilterCount > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
              {filters.search      && <Chip size="small" label={`Search: "${filters.search}"`} onDelete={() => setFilter("search")("")}  sx={{ bgcolor: alpha(PRIMARY, 0.08), color: PRIMARY }} />}
              {filters.status      && <Chip size="small" label={`Status: ${filters.status}`}   onDelete={() => setFilter("status")("")}  sx={{ bgcolor: alpha(PRIMARY, 0.08), color: PRIMARY }} />}
              {period !== "This Month" && <Chip size="small" label={`Period: ${period}`}        onDelete={() => setPeriod("This Month")} sx={{ bgcolor: alpha(PRIMARY, 0.08), color: PRIMARY }} />}
            </Stack>
          )}
        </Paper>
      )}

      <Grid container spacing={isMobile ? 2 : 3}>
        {/* Calendar */}
        <Grid item xs={12} md={5} lg={4}>
          <GlassCard>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                <Typography variant="h6" fontWeight={700}>{currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</Typography>
                <Stack direction="row" spacing={0.5}>
                  {[{ icon: <ChevronLeft fontSize="small" />, dir: -1 }, { icon: <ChevronRight fontSize="small" />, dir: 1 }].map(({ icon, dir }) => (
                    <IconButton key={dir} size="small" onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1))} sx={{ bgcolor: alpha(PRIMARY, 0.07), "&:hover": { bgcolor: alpha(PRIMARY, 0.14) } }}>{icon}</IconButton>
                  ))}
                </Stack>
              </Stack>
              <Grid container columns={7} spacing={0.25} sx={{ mb: 0.5 }}>
                {DOW.map((d) => <Grid item xs={1} key={d}><Typography align="center" variant="caption" fontWeight={700} color="text.disabled" sx={{ display: "block", fontSize: "0.6rem" }}>{d}</Typography></Grid>)}
              </Grid>
              <Grid container columns={7} spacing={0.25}>
                {calendarDays.map((c, i) => (
                  <Grid item xs={1} key={i}>
                    <CalCell day={c.day} isPrev={c.isPrev} isSelected={c.date?.toDateString() === selectedDate.toDateString()} isToday={c.date?.toDateString() === new Date().toDateString()} isWeekend={c.date && [0, 6].includes(c.date.getDay())} status={c.status} onClick={() => !c.isPrev && c.date && handleDateSelect(c.date)} />
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px solid ${alpha(PRIMARY, 0.08)}` }}>
                <Grid container spacing={1}>
                  {[["Present", SUCCESS], ["Late", WARNING], ["Absent", DANGER], ["Holiday", "#3b82f6"]].map(([l, c]) => (
                    <Grid item xs={6} key={l}>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: c, flexShrink: 0 }} />
                        <Typography variant="caption" color="text.secondary">{l}</Typography>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </CardContent>
          </GlassCard>
        </Grid>

        {/* Log */}
        <Grid item xs={12} md={7} lg={8}>
          <GlassCard sx={{ height: "100%" }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Attendance Log</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">{pagination?.totalItems || 0} total records</Typography>
                    {someSelected && !isMobile && <Chip size="small" label={`${selectedIds.size} selected`} onDelete={() => setSelectedIds(new Set())} sx={{ bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY, fontWeight: 700, height: 20, fontSize: "0.68rem" }} />}
                  </Stack>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  {isMobile && attendances?.length > 0 && <BulkExportMenu selectedRecords={selectedRecords} allRecords={attendances || []} onSnack={showSnack} />}
                  {loading && <CircularProgress size={20} sx={{ color: PRIMARY }} />}
                </Stack>
              </Stack>

              {attendances?.length > 0 ? (
                <>
                  {isMobile ? (
                    <Box>
                      {attendances.map((a, i) => (
                        <MobileLogCard key={a._id || a.id} entry={a} onView={(e) => { setSelLog(e); setLogOpen(true); }} onDelete={handleDeleteOpen} canDelete={canDelete} index={i} />
                      ))}
                    </Box>
                  ) : (
                    <TableContainer sx={{ maxHeight: 460 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox" sx={{ bgcolor: alpha(PRIMARY, 0.04), borderBottom: `2px solid ${alpha(PRIMARY, 0.1)}` }}>
                              <Tooltip title={allSelected ? "Deselect all" : "Select all on this page"}>
                                <Checkbox size="small" indeterminate={someSelected && !allSelected} checked={allSelected} onChange={toggleAll} sx={{ color: alpha(PRIMARY, 0.4), "&.Mui-checked": { color: PRIMARY }, "&.MuiCheckbox-indeterminate": { color: PRIMARY } }} />
                              </Tooltip>
                            </TableCell>
                            {["Date", "Punch In", "Punch Out", "Hours", "Status", "Actions"].map((h) => (
                              <TableCell key={h} sx={{ bgcolor: alpha(PRIMARY, 0.04), fontWeight: 700, fontSize: "0.76rem", borderBottom: `2px solid ${alpha(PRIMARY, 0.1)}` }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {attendances.map((a) => {
                            const id        = a._id || a.id;
                            const isChecked = selectedIds.has(id);
                            return (
                              <TableRow key={id} hover selected={isChecked} sx={{ "&:hover": { bgcolor: alpha(PRIMARY, 0.02) }, "&.Mui-selected": { bgcolor: alpha(PRIMARY, 0.04) }, "&.Mui-selected:hover": { bgcolor: alpha(PRIMARY, 0.06) } }}>
                                <TableCell padding="checkbox"><Checkbox size="small" checked={isChecked} onChange={() => toggleRow(id)} sx={{ color: alpha(PRIMARY, 0.3), "&.Mui-checked": { color: PRIMARY } }} /></TableCell>
                                <TableCell><Typography variant="body2" fontWeight={600}>{fmtDate(a.date)}</Typography></TableCell>
                                <TableCell>{a.punchIn ? <Chip label={fmtTime(a.punchIn.time)} size="small" sx={{ bgcolor: alpha(SUCCESS, 0.1), color: SUCCESS, fontWeight: 700, fontSize: "0.72rem" }} /> : <Typography variant="body2" color="text.disabled">—</Typography>}</TableCell>
                                <TableCell>{a.punchOut ? <Chip label={fmtTime(a.punchOut.time)} size="small" sx={{ bgcolor: alpha(WARNING, 0.1), color: WARNING, fontWeight: 700, fontSize: "0.72rem" }} /> : a.punchIn ? <Chip label="Ongoing" size="small" variant="outlined" sx={{ color: PRIMARY, borderColor: PRIMARY, fontWeight: 700 }} /> : <Typography variant="body2" color="text.disabled">—</Typography>}</TableCell>
                                <TableCell><Typography variant="body2" fontWeight={700} color={PRIMARY}>{a.workHoursFormatted || "—"}</Typography></TableCell>
                                <TableCell><StatusBadge status={a.status || "present"} /></TableCell>
                                <TableCell>
                                  <Stack direction="row" spacing={0.5}>
                                    <Tooltip title="View Details"><IconButton size="small" onClick={() => { setSelLog(a); setLogOpen(true); }} sx={{ color: PRIMARY, "&:hover": { bgcolor: alpha(PRIMARY, 0.08) } }}><Visibility fontSize="small" /></IconButton></Tooltip>
                                    {canDelete && <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDeleteOpen(a)} sx={{ color: DANGER, "&:hover": { bgcolor: alpha(DANGER, 0.08) } }}><Delete fontSize="small" /></IconButton></Tooltip>}
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {someSelected && !isMobile && (
                    <Fade in>
                      <Paper elevation={0} sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: alpha(PRIMARY, 0.04), border: `1px solid ${alpha(PRIMARY, 0.12)}` }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip size="small" label={`${selectedIds.size} row${selectedIds.size !== 1 ? "s" : ""} selected`} sx={{ bgcolor: PRIMARY, color: "#fff", fontWeight: 700 }} />
                            <Button size="small" startIcon={<Deselect sx={{ fontSize: 14 }} />} onClick={() => setSelectedIds(new Set())} sx={{ color: "text.secondary", fontSize: "0.75rem" }}>Clear</Button>
                          </Stack>
                          <Stack direction="row" spacing={1}>
                            <Button size="small" variant="outlined" startIcon={<FileDownload sx={{ fontSize: 14 }} />} onClick={() => { try { downloadFile(generateCSV(selectedRecords), `att_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`, "text/csv"); showSnack(`Exported ${selectedIds.size} records as CSV`); } catch { showSnack("Export failed", "error"); } }} sx={{ borderRadius: 2, borderColor: alpha(SUCCESS, 0.5), color: SUCCESS, fontSize: "0.75rem" }}>CSV</Button>
                            <Button size="small" variant="outlined" startIcon={<FileDownload sx={{ fontSize: 14 }} />} onClick={() => { try { downloadFile(generateJSON(selectedRecords), `att_${format(new Date(), "yyyyMMdd_HHmmss")}.json`, "application/json"); showSnack(`Exported ${selectedIds.size} records as JSON`); } catch { showSnack("Export failed", "error"); } }} sx={{ borderRadius: 2, borderColor: alpha(PRIMARY, 0.5), color: PRIMARY, fontSize: "0.75rem" }}>JSON</Button>
                          </Stack>
                        </Stack>
                      </Paper>
                    </Fade>
                  )}

                  {pagination?.totalPages > 1 && (
                    <Box display="flex" justifyContent="center" sx={{ mt: 2.5 }}>
                      <Pagination count={pagination.totalPages} page={filters.page} onChange={(_, v) => { setFilters((p) => ({ ...p, page: v })); containerRef.current?.scrollIntoView({ behavior: "smooth" }); }} color="primary" shape="rounded" size={isMobile ? "small" : "medium"} sx={{ "& .MuiPaginationItem-root.Mui-selected": { bgcolor: PRIMARY, color: "#fff" } }} />
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: "center", py: 7 }}>
                  <Box sx={{ width: 80, height: 80, borderRadius: "50%", bgcolor: alpha(PRIMARY, 0.08), display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                    <CalendarToday sx={{ fontSize: 36, color: PRIMARY }} />
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>No records found</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: activeFilterCount ? 2.5 : 0 }}>
                    {activeFilterCount ? "No records match your current filters." : "Attendance records will appear here."}
                  </Typography>
                  {activeFilterCount > 0 && <Button variant="contained" startIcon={<Clear />} onClick={clearFilters} sx={{ bgcolor: PRIMARY, borderRadius: 2 }}>Clear Filters</Button>}
                </Box>
              )}
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Filter Drawer */}
      <SwipeableDrawer anchor="bottom" open={drawerOpen} onClose={() => setDrawerOpen(false)} onOpen={() => {}} PaperProps={{ sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24 } }}>
        <Box sx={{ width: 40, height: 4, bgcolor: "grey.300", borderRadius: 2, mx: "auto", my: 1.5 }} />
        <Box sx={{ px: 3, pb: 3 }}>
          <Typography variant="h6" fontWeight={700} color={PRIMARY} sx={{ mb: 2.5 }}>Filter Attendance</Typography>
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={filters.status} label="Status" sx={{ borderRadius: 2 }} onChange={(e) => setFilter("status")(e.target.value)}>
                <MenuItem value="">All Statuses</MenuItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Period</InputLabel>
              <Select value={period} label="Period" sx={{ borderRadius: 2 }} onChange={(e) => setPeriod(e.target.value)}>
                {PERIOD_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1.5}>
              <Button fullWidth variant="outlined" startIcon={<Clear />} onClick={() => { clearFilters(); setDrawerOpen(false); }} sx={{ borderRadius: 2, borderColor: alpha(PRIMARY, 0.35), color: PRIMARY }}>Clear</Button>
              <Button fullWidth variant="contained" onClick={() => setDrawerOpen(false)} sx={{ borderRadius: 2, bgcolor: PRIMARY }}>Apply</Button>
            </Stack>
          </Stack>
        </Box>
      </SwipeableDrawer>

      {isMobile && (
        <Zoom in>
          <Fab size="medium" onClick={() => setDrawerOpen(true)} sx={{ position: "fixed", bottom: 80, right: 16, zIndex: 1000, bgcolor: PRIMARY, color: "#fff", boxShadow: `0 4px 16px ${alpha(PRIMARY, 0.38)}`, "&:hover": { bgcolor: SECONDARY } }}>
            <Badge badgeContent={activeFilterCount} color="error"><FilterAlt /></Badge>
          </Fab>
        </Zoom>
      )}

      {isMobile && (
        <Paper sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000, borderRadius: 0, borderTop: `1px solid ${alpha(PRIMARY, 0.1)}` }} elevation={3}>
          <BottomNavigation showLabels value={navValue}
            onChange={(_, v) => {
              setNavValue(v);
              if (v === 0) isAdminView ? navigate(-1) : window.scrollTo({ top: 0, behavior: "smooth" });
              else if (v === 1) navigate("/dashboard");
            }}
            sx={{ height: 60, "& .Mui-selected": { color: PRIMARY } }}
          >
            <BottomNavigationAction label={isAdminView ? "Back" : "Attendance"} icon={isAdminView ? <ArrowBack /> : <CalendarToday />} />
            <BottomNavigationAction label="Dashboard" icon={<Dashboard />} />
          </BottomNavigation>
        </Paper>
      )}

      <AttendanceDetails open={logOpen} onClose={() => setLogOpen(false)} attendance={selLog} canEdit={canManage} canDelete={canDelete} onDelete={handleDeleteOpen} />

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}>
        <Box sx={{ height: 5, bgcolor: DANGER }} />
        <DialogTitle sx={{ pt: 2.5, pb: 1 }}><Typography variant="h6" fontWeight={700}>Confirm Delete</Typography></DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>This action cannot be undone.</Alert>
          {deleteTarget && (
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: alpha(DANGER, 0.04), border: `1px solid ${alpha(DANGER, 0.12)}` }}>
              <Typography variant="body2"><strong>Date:</strong> {fmtDate(deleteTarget.date)}<br /><strong>Status:</strong> {deleteTarget.status}</Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5, borderTop: `1px solid ${alpha(DANGER, 0.08)}` }}>
          <Button variant="outlined" onClick={() => setDeleteOpen(false)} sx={{ borderRadius: 2, borderColor: alpha(PRIMARY, 0.35), color: PRIMARY }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} sx={{ borderRadius: 2 }}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={() => { setSnackbar((s) => ({ ...s, open: false })); clearMessages(); }} anchorOrigin={{ vertical: isMobile ? "top" : "bottom", horizontal: isMobile ? "center" : "right" }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2, color: "#fff", fontWeight: 600 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}