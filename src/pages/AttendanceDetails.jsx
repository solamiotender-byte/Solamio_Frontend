// pages/AttendanceDetails.jsx
import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Stack,
  Grid,
  Paper,
  Chip,
  Avatar,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
  Slide,
  Fade,
  CircularProgress,
  alpha,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Close,
  LocationOn,
  Edit,
  Delete,
  Save,
  Cancel,
  Person,
  CalendarToday,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Login,
  Logout,
  FileDownload,
  Print,
  ContentCopy,
  ExpandMore,
} from "@mui/icons-material";
import { useAttendance } from "../hooks/useAttendance";
import { format } from "date-fns";

// ─── Constants ────────────────────────────────────────────────────────────────
const PRIMARY = "#4569ea";
const SECONDARY = "#1a237e";
const SUCCESS = "#22c55e";
const DANGER = "#ef4444";
const WARNING = "#f59e0b";

const STATUS_CONFIG = {
  present: { bg: alpha(SUCCESS, 0.1), color: SUCCESS, icon: <CheckCircle sx={{ fontSize: 15 }} />, label: "Present" },
  absent: { bg: alpha(DANGER, 0.1), color: DANGER, icon: <ErrorIcon sx={{ fontSize: 15 }} />, label: "Absent" },
  late: { bg: alpha(WARNING, 0.1), color: WARNING, icon: <Warning sx={{ fontSize: 15 }} />, label: "Late" },
  leave: { bg: alpha("#a855f7", 0.1), color: "#a855f7", icon: <Person sx={{ fontSize: 15 }} />, label: "Leave" },
  holiday: { bg: alpha("#3b82f6", 0.1), color: "#3b82f6", icon: <CalendarToday sx={{ fontSize: 15 }} />, label: "Holiday" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (ts) =>
  !ts ? "—" : new Date(ts).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

const fmtTime = (ts) =>
  !ts ? "—" : new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

const fmtShortDate = (ts) => !ts ? "N/A" : new Date(ts).toLocaleDateString();
const fmtShortTime = (ts) => !ts ? "N/A" : new Date(ts).toLocaleTimeString();
const fmtDateTime = (ts) => !ts ? "N/A" : new Date(ts).toLocaleString();

const resolveAddress = (addr) => {
  if (!addr) return "N/A";
  if (typeof addr === "string") return addr;
  return addr.full || addr.short || "N/A";
};

// ─── StatusChip ───────────────────────────────────────────────────────────────
const StatusChip = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.present;
  return (
    <Chip
      size="small"
      label={cfg.label}
      icon={cfg.icon}
      sx={{
        background: "#fff",
        color: cfg.color,
        fontWeight: 700,
        borderRadius: 1,
        border: `1px solid ${alpha(cfg.color, 0.3)}`,
        "& .MuiChip-icon": { color: cfg.color },
      }}
    />
  );
};

// ─── InfoRow ──────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, color }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      py: 1,
      borderBottom: `1px solid ${alpha(PRIMARY, 0.06)}`,
      "&:last-child": { border: "none", pb: 0 },
    }}
  >
    <Typography variant="caption" color="text.secondary" fontWeight={600}
      sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.68rem" }}
    >
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600} color={color || "text.primary"}>
      {value}
    </Typography>
  </Box>
);

// ─── PunchBlock ───────────────────────────────────────────────────────────────
const PunchBlock = ({ type, data }) => {
  const isPunchIn = type === "in";
  const color = isPunchIn ? SUCCESS : WARNING;
  const absent = !data;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: `1px solid ${alpha(color, absent ? 0.1 : 0.2)}`,
        bgcolor: alpha(color, absent ? 0.02 : 0.05),
        height: "100%",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 34, height: 34, borderRadius: "50%",
            bgcolor: alpha(color, 0.12),
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {isPunchIn ? <Login sx={{ fontSize: 18, color }} /> : <Logout sx={{ fontSize: 18, color }} />}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700}
            sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.68rem" }}
          >
            Punch {isPunchIn ? "In" : "Out"}
          </Typography>
          <Typography variant="h6" fontWeight={800} color={absent ? "text.disabled" : color} lineHeight={1.1}>
            {absent ? (isPunchIn ? "Not recorded" : "Not punched out") : fmtTime(data?.time)}
          </Typography>
        </Box>
      </Stack>

      {data?.address && (
        <Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ mb: 1 }}>
          <LocationOn sx={{ fontSize: 14, color: "text.secondary", mt: 0.2, flexShrink: 0 }} />
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
            {resolveAddress(data.address)}
          </Typography>
        </Stack>
      )}

      {data?.location && (
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
          {data.location.lat?.toFixed(5)}, {data.location.lng?.toFixed(5)}
        </Typography>
      )}

      {data?.remarks && (
        <Box sx={{ mt: 1, pt: 1, borderTop: `1px dashed ${alpha(color, 0.2)}` }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Note:</strong> {data.remarks}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

// ─── Export Utils ─────────────────────────────────────────────────────────────
export const generateCSV = (records) => {
  const list = Array.isArray(records) ? records : [records];

  const headers = [
    "Record ID", "Employee Name", "Employee ID", "Employee Email", "Employee Phone",
    "Date", "Status", "Work Hours", "Total Minutes",
    "Punch In Time", "Punch In Address", "Punch In Lat", "Punch In Lng",
    "Punch Out Time", "Punch Out Address", "Punch Out Lat", "Punch Out Lng",
    "Remarks", "Created At", "Updated At",
  ];

  const escape = (val) => {
    const s = val == null ? "" : String(val);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows = list.map((a) => [
    a._id || a.id || "",
    a.user?.name || "",
    a.user?.employeeId || "",
    a.user?.email || "",
    a.user?.phone || "",
    fmtShortDate(a.date),
    a.status || "",
    a.workHoursFormatted || "",
    a.workHours || "",
    fmtShortTime(a.punchIn?.time),
    resolveAddress(a.punchIn?.address),
    a.punchIn?.location?.lat || a.punchIn?.latitude || "",
    a.punchIn?.location?.lng || a.punchIn?.longitude || "",
    fmtShortTime(a.punchOut?.time),
    resolveAddress(a.punchOut?.address),
    a.punchOut?.location?.lat || a.punchOut?.latitude || "",
    a.punchOut?.location?.lng || a.punchOut?.longitude || "",
    a.remarks || "",
    fmtDateTime(a.createdAt),
    fmtDateTime(a.updatedAt),
  ]);

  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
};

export const generateJSON = (records) => {
  const list = Array.isArray(records) ? records : [records];
  const enriched = list.map((a) => {
    const clone = JSON.parse(JSON.stringify(a));
    if (clone.date) clone.date_formatted = fmtShortDate(a.date);
    if (clone.punchIn?.time) clone.punchIn.time_formatted = fmtDateTime(a.punchIn.time);
    if (clone.punchOut?.time) clone.punchOut.time_formatted = fmtDateTime(a.punchOut.time);
    if (clone.createdAt) clone.createdAt_formatted = fmtDateTime(a.createdAt);
    if (clone.updatedAt) clone.updatedAt_formatted = fmtDateTime(a.updatedAt);
    return clone;
  });
  return JSON.stringify(list.length === 1 ? enriched[0] : enriched, null, 2);
};

export const downloadFile = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const printRecord = (a) => {
  const win = window.open("", "_blank");
  if (!win) { alert("Please allow pop-ups to print"); return; }

  win.document.write(`
    <html>
      <head>
        <title>Attendance Record – ${a.user?.name || "Employee"}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; }
          h1 { font-size: 22px; color: #4569ea; margin-bottom: 4px; }
          .sub { color: #888; font-size: 13px; margin-bottom: 24px; }
          .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; }
          .card-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 10px; font-weight: 700; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .row:last-child { border-bottom: none; }
          .label { color: #64748b; font-weight: 600; }
          .value { font-weight: 600; text-align: right; max-width: 60%; }
          .punch-in { border-left: 4px solid #22c55e; }
          .punch-out { border-left: 4px solid #f59e0b; }
          .footer { margin-top: 24px; font-size: 11px; color: #aaa; }
        </style>
      </head>
      <body>
        <h1>Attendance Record</h1>
        <div class="sub">Exported on ${new Date().toLocaleString()}</div>

        <div class="card">
          <div class="card-title">Employee & Summary</div>
          <div class="row"><span class="label">Employee</span><span class="value">${a.user?.name || "N/A"}</span></div>
          <div class="row"><span class="label">Employee ID</span><span class="value">${a.user?.employeeId || "N/A"}</span></div>
          <div class="row"><span class="label">Email</span><span class="value">${a.user?.email || "N/A"}</span></div>
          <div class="row"><span class="label">Date</span><span class="value">${fmtDate(a.date)}</span></div>
          <div class="row"><span class="label">Status</span><span class="value">${a.status || "N/A"}</span></div>
          <div class="row"><span class="label">Work Hours</span><span class="value">${a.workHoursFormatted || "N/A"}</span></div>
        </div>

        <div class="card punch-in">
          <div class="card-title">Punch In</div>
          <div class="row"><span class="label">Time</span><span class="value">${fmtTime(a.punchIn?.time)}</span></div>
          <div class="row"><span class="label">Address</span><span class="value">${resolveAddress(a.punchIn?.address)}</span></div>
          ${a.punchIn?.location ? `<div class="row"><span class="label">Coordinates</span><span class="value">${a.punchIn.location.lat}, ${a.punchIn.location.lng}</span></div>` : ""}
        </div>

        <div class="card punch-out">
          <div class="card-title">Punch Out</div>
          <div class="row"><span class="label">Time</span><span class="value">${fmtTime(a.punchOut?.time)}</span></div>
          <div class="row"><span class="label">Address</span><span class="value">${resolveAddress(a.punchOut?.address)}</span></div>
          ${a.punchOut?.location ? `<div class="row"><span class="label">Coordinates</span><span class="value">${a.punchOut.location.lat}, ${a.punchOut.location.lng}</span></div>` : ""}
        </div>

        ${a.remarks ? `<div class="card"><div class="card-title">Remarks</div><p style="font-size:13px">${a.remarks}</p></div>` : ""}

        <div class="footer">
          Record ID: ${a._id || a.id || "N/A"} &nbsp;|&nbsp;
          Created: ${fmtDateTime(a.createdAt)} &nbsp;|&nbsp;
          Updated: ${fmtDateTime(a.updatedAt)}
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.print();
};

// ─── ActionExportMenu — used in DialogActions ─────────────────────────────────
const ActionExportMenu = ({ attendance, onSnack }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const ts = format(new Date(), "yyyyMMdd_HHmmss");
  const id = attendance?._id || attendance?.id || "record";

  const handle = (fn) => () => {
    fn();
    setAnchorEl(null);
  };

  const exportCSV = handle(() => {
    try {
      downloadFile(generateCSV(attendance), `attendance_${id}_${ts}.csv`, "text/csv");
      onSnack("Exported as CSV");
    } catch { onSnack("Export failed", "error"); }
  });

  const exportJSON = handle(() => {
    try {
      downloadFile(generateJSON(attendance), `attendance_${id}_${ts}.json`, "application/json");
      onSnack("Exported as JSON");
    } catch { onSnack("Export failed", "error"); }
  });

  const copyClip = handle(() => {
    try {
      navigator.clipboard.writeText(generateJSON(attendance));
      onSnack("Copied to clipboard");
    } catch { onSnack("Copy failed", "error"); }
  });

  const print = handle(() => {
    try {
      printRecord(attendance);
      onSnack("Print preview opened");
    } catch { onSnack("Print failed", "error"); }
  });

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<FileDownload />}
        endIcon={<ExpandMore sx={{ fontSize: 16 }} />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          borderRadius: 2,
          borderColor: alpha(PRIMARY, 0.35),
          color: PRIMARY,
          fontWeight: 600,
          "&:hover": { bgcolor: alpha(PRIMARY, 0.05) },
        }}
      >
        Export
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { mt: 1, borderRadius: 2.5, minWidth: 190, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" },
        }}
        transformOrigin={{ horizontal: "left", vertical: "bottom" }}
        anchorOrigin={{ horizontal: "left", vertical: "top" }}
      >
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}
            sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.65rem" }}
          >
            Export This Record
          </Typography>
        </Box>
        <MenuItem onClick={exportCSV} sx={{ py: 1.25 }}>
          <ListItemIcon><FileDownload fontSize="small" sx={{ color: SUCCESS }} /></ListItemIcon>
          <ListItemText primary="Export as CSV" primaryTypographyProps={{ variant: "body2", fontWeight: 600 }} />
        </MenuItem>
        <MenuItem onClick={exportJSON} sx={{ py: 1.25 }}>
          <ListItemIcon><FileDownload fontSize="small" sx={{ color: PRIMARY }} /></ListItemIcon>
          <ListItemText primary="Export as JSON" primaryTypographyProps={{ variant: "body2", fontWeight: 600 }} />
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={copyClip} sx={{ py: 1.25 }}>
          <ListItemIcon><ContentCopy fontSize="small" /></ListItemIcon>
          <ListItemText primary="Copy to Clipboard" primaryTypographyProps={{ variant: "body2", fontWeight: 600 }} />
        </MenuItem>
        <MenuItem onClick={print} sx={{ py: 1.25 }}>
          <ListItemIcon><Print fontSize="small" /></ListItemIcon>
          <ListItemText primary="Print" primaryTypographyProps={{ variant: "body2", fontWeight: 600 }} />
        </MenuItem>
      </Menu>
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AttendanceDetails({
  open,
  onClose,
  attendance,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { updateAttendance } = useAttendance();

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ status: "", remarks: "" });
  const [editLoad, setEditLoad] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [selPhoto, setSelPhoto] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showSnack = useCallback((message, severity = "success") =>
    setSnackbar({ open: true, message, severity }), []);

  if (!attendance) return null;

  const a = attendance;
  const statusCfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.present;
  const photos = [...(a.punchIn?.photos || []), ...(a.punchOut?.photos || [])];

  const handleEditStart = () => {
    setEditData({ status: a.status || "present", remarks: a.remarks || "" });
    setEditMode(true);
  };

  const handleEditSave = async () => {
    setEditLoad(true);
    try {
      const id = a._id || a.id;
      if (!id) { showSnack("Invalid record ID", "error"); return; }
      const res = await updateAttendance(id, editData);
      if (res?.success) {
        showSnack("Attendance updated successfully");
        setEditMode(false);
        if (onEdit) onEdit(res.data);
      } else {
        showSnack(res?.error || "Update failed", "error");
      }
    } catch {
      showSnack("An error occurred", "error");
    } finally {
      setEditLoad(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) { onDelete(a); onClose(); }
  };

  const handleClose = () => {
    setEditMode(false);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: isMobile ? 0 : 4, overflow: "hidden", maxHeight: isMobile ? "100%" : "92vh" },
        }}
        TransitionComponent={isMobile ? Slide : Fade}
        TransitionProps={isMobile ? { direction: "up" } : {}}
        transitionDuration={280}
      >
        {/* Top accent bar */}
        <Box sx={{ height: 5, background: `linear-gradient(90deg, ${statusCfg.color}, ${PRIMARY})` }} />

        {/* Header */}
        <DialogTitle sx={{ bgcolor: PRIMARY, color: "#fff", px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: "rgba(255,255,255,.15)", color: "#fff",
                  width: { xs: 38, sm: 44 }, height: { xs: 38, sm: 44 }, fontWeight: 700,
                }}
              >
                {a.user?.name?.charAt(0) || "A"}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: "1rem", sm: "1.15rem" } }}>
                  {a.user?.name || "Attendance Details"}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>{fmtDate(a.date)}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <StatusChip status={a.status || "present"} />
              {/* ← Export removed from header; moved to Actions */}
              <IconButton onClick={handleClose} size="small" sx={{ color: "#fff", ml: 0.5 }}>
                <Close />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>

        {/* Content */}
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 } }}>
          <Stack spacing={2.5}>
            {/* Summary chips */}
            <Grid container spacing={1.5}>
              {[
                { label: "Work Hours", value: a.workHoursFormatted || "—", color: PRIMARY },
                { label: "Phone", value: a.user?.phone || "—" },
                { label: "Email", value: a.user?.email || "—" },
              ].map((item) => (
                <Grid item xs={12} sm={4} key={item.label}>
                  <Paper
                    elevation={0}
                    sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha(PRIMARY, 0.04), border: `1px solid ${alpha(PRIMARY, 0.1)}` }}
                  >
                    <Typography variant="caption" color="text.secondary" fontWeight={600}
                      sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: 0.5 }}
                    >
                      {item.label}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color={item.color || "text.primary"} noWrap sx={{ mt: 0.25 }}>
                      {item.value}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Edit form */}
            {editMode && (
              <Paper
                elevation={0}
                sx={{ p: 2, borderRadius: 3, border: `1px solid ${alpha(WARNING, 0.25)}`, bgcolor: alpha(WARNING, 0.04) }}
              >
                <Typography variant="subtitle2" fontWeight={700} color={WARNING} sx={{ mb: 2 }}>
                  Edit Attendance
                </Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editData.status}
                      onChange={(e) => setEditData((p) => ({ ...p, status: e.target.value }))}
                      label="Status"
                      sx={{ borderRadius: 2 }}
                    >
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <MenuItem key={k} value={k}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{ color: v.color }}>{v.icon}</Box>
                            <span>{v.label}</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    label="Remarks"
                    multiline
                    rows={2}
                    fullWidth
                    value={editData.remarks}
                    onChange={(e) => setEditData((p) => ({ ...p, remarks: e.target.value }))}
                    inputProps={{ maxLength: 250 }}
                    helperText={`${editData.remarks.length}/250`}
                    FormHelperTextProps={{ sx: { textAlign: "right" } }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Stack>
              </Paper>
            )}

            {/* Punch blocks */}
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}><PunchBlock type="in" data={a.punchIn} /></Grid>
              <Grid item xs={12} sm={6}><PunchBlock type="out" data={a.punchOut} /></Grid>
            </Grid>

            {/* Remarks */}
            {a.remarks && !editMode && (
              <Paper
                elevation={0}
                sx={{ p: 2, borderRadius: 2.5, bgcolor: alpha(PRIMARY, 0.04), border: `1px solid ${alpha(PRIMARY, 0.1)}` }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={600}
                  sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: 0.5, display: "block", mb: 0.5 }}
                >
                  Remarks
                </Typography>
                <Typography variant="body2">{a.remarks}</Typography>
              </Paper>
            )}

            {/* Metadata */}
            <Paper
              elevation={0}
              sx={{ p: 2, borderRadius: 2.5, bgcolor: alpha(PRIMARY, 0.025), border: `1px solid ${alpha(PRIMARY, 0.08)}` }}
            >
              <InfoRow label="Record ID" value={(a._id || a.id || "—").slice(-10)} />
              <InfoRow label="Created" value={a.createdAt ? format(new Date(a.createdAt), "dd MMM yyyy, hh:mm a") : "—"} />
              <InfoRow label="Last Updated" value={a.updatedAt ? format(new Date(a.updatedAt), "dd MMM yyyy, hh:mm a") : "—"} />
            </Paper>

            {/* Photos */}
            {photos.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                  Photos ({photos.length})
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ overflowX: "auto", pb: 0.5 }}>
                  {photos.map((p, i) => (
                    <Box
                      key={i}
                      onClick={() => { setSelPhoto(p); setPhotoOpen(true); }}
                      sx={{
                        width: 80, height: 80, borderRadius: 2, overflow: "hidden",
                        border: `2px solid ${alpha(PRIMARY, 0.2)}`, flexShrink: 0, cursor: "pointer",
                        transition: "transform .2s",
                        "&:hover": { transform: "scale(1.06)", borderColor: PRIMARY },
                      }}
                    >
                      <img src={p.url} alt={`photo-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>

        {/* ─── Actions (Export always shown; Edit/Delete conditional) ─────── */}
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 2 },
            borderTop: `1px solid ${alpha(PRIMARY, 0.08)}`,
            flexWrap: "wrap",
            gap: 1,
            justifyContent: "space-between",
          }}
        >
          {editMode ? (
            /* ── Edit mode actions ── */
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: "100%" }}>
              <Button
                fullWidth={isMobile}
                variant="outlined"
                startIcon={<Cancel />}
                onClick={() => setEditMode(false)}
                disabled={editLoad}
                sx={{ borderRadius: 2, borderColor: alpha(PRIMARY, 0.3), color: PRIMARY }}
              >
                Cancel
              </Button>
              <Button
                fullWidth={isMobile}
                variant="contained"
                startIcon={editLoad ? <CircularProgress size={16} color="inherit" /> : <Save />}
                onClick={handleEditSave}
                disabled={editLoad}
                sx={{ borderRadius: 2, bgcolor: PRIMARY, "&:hover": { bgcolor: SECONDARY } }}
              >
                {editLoad ? "Saving…" : "Save Changes"}
              </Button>
            </Stack>
          ) : (
            <>
              {/* Left group: Export + Close */}
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {/* Export button with dropdown — always visible */}
                <ActionExportMenu attendance={a} onSnack={showSnack} />
                <Button
                  variant="outlined"
                  onClick={handleClose}
                  sx={{ borderRadius: 2, borderColor: alpha(PRIMARY, 0.3), color: PRIMARY }}
                >
                  Close
                </Button>
              </Stack>

              {/* Right group: Edit + Delete */}
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {canEdit && (
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={handleEditStart}
                    sx={{
                      borderRadius: 2, borderColor: WARNING, color: WARNING,
                      "&:hover": { bgcolor: alpha(WARNING, 0.06) },
                    }}
                  >
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleDelete}
                    sx={{ borderRadius: 2 }}
                  >
                    Delete
                  </Button>
                )}
              </Stack>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Photo lightbox */}
      <Dialog
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        maxWidth="lg"
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, bgcolor: "#000" } }}
      >
        <IconButton
          onClick={() => setPhotoOpen(false)}
          sx={{ position: "absolute", top: 8, right: 8, bgcolor: "rgba(0,0,0,.5)", color: "#fff", zIndex: 10 }}
        >
          <Close />
        </IconButton>
        {selPhoto?.url && (
          <img src={selPhoto.url} alt="attendance" style={{ width: "100%", maxHeight: "92vh", objectFit: "contain" }} />
        )}
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: isMobile ? "top" : "bottom", horizontal: isMobile ? "center" : "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2, color: "#fff", fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {/* ✅ Missed punch-out alert */}
{attendance?.missedPunchOut && (
  <Alert
    severity="warning"
    sx={{ borderRadius: 2, mb: 2, fontWeight: 600 }}
  >
    {attendance.punchOutMessage || "User did not punch out this day"}
    {attendance.punchOut?.isAutoPunchOut &&
      " — System auto punched out after 12 hours."}
  </Alert>
)}
    </>
  );
}