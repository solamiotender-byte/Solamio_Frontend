// pages/TeamAttendance.jsx
// NOTE: This page is for the MANAGER view — it shows team member cards.
// It does NOT do any GPS tracking itself. Tracking only happens in
// locationTracker.js (used by MemberVisitHistory when a user punches in).
// The LiveTrackMap dialog is a read-only view of a member's stored track points.

import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Avatar, Chip, TextField, InputAdornment, Button,
  IconButton, Tooltip, LinearProgress, Divider, CircularProgress,
  Dialog, DialogContent,
} from "@mui/material";
import {
  Search, Refresh, AccessTime, CheckCircle, Cancel, LocationOn, Person,
  BatteryChargingFull, BatteryAlert, Battery20, Battery50, Battery80,
  CalendarToday,
} from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LiveTrackMap from "../utils/Livetrackmap";

const API = import.meta.env.VITE_API_URL || "https://vanurtech-solar-backend.onrender.com";

const avatarColors = [
  "#4569ea", "#7c3aed", "#0ea5e9", "#f59e0b",
  "#10b981", "#f43f5e", "#8b5cf6", "#06b6d4",
];
const getColor = (name = "") => avatarColors[name.charCodeAt(0) % avatarColors.length];

const formatTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true,
      })
    : null;

const formatHours = (hours) => {
  if (!hours) return null;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

const getTodayDateInput = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatSelectedDateLabel = (value) => {
  if (!value) return "";
  const [yyyy, mm, dd] = value.split("-").map(Number);
  return new Date(yyyy, mm - 1, dd).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ── Battery helpers ───────────────────────────────────────────────────────────
const getBatteryStyle = (pct) => {
  if (pct === null || pct === undefined) return null;
  if (pct > 60)
    return { color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0", track: "#bbf7d0", fill: "#22c55e" };
  if (pct > 20)
    return { color: "#d97706", bg: "#fef3c7", border: "#fde68a", track: "#fde68a", fill: "#f59e0b" };
  return { color: "#dc2626", bg: "#fee2e2", border: "#fecaca", track: "#fecaca", fill: "#ef4444" };
};

const getBatteryIcon = (pct, isCharging) => {
  if (isCharging) return <BatteryChargingFull sx={{ fontSize: "0.85rem" }} />;
  if (pct === null || pct === undefined) return <BatteryAlert sx={{ fontSize: "0.85rem" }} />;
  if (pct <= 20) return <Battery20 sx={{ fontSize: "0.85rem" }} />;
  if (pct <= 50) return <Battery50 sx={{ fontSize: "0.85rem" }} />;
  return <Battery80 sx={{ fontSize: "0.85rem" }} />;
};

// ── Battery Bar ───────────────────────────────────────────────────────────────
const BatteryBar = ({ percentage, isCharging }) => {
  const style = getBatteryStyle(percentage);

  if (percentage === null || percentage === undefined) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
        <BatteryAlert sx={{ fontSize: "0.9rem", color: "#cbd5e1" }} />
        <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8" }}>
          Battery data unavailable
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
      <Box sx={{ color: style.color, display: "flex", alignItems: "center", flexShrink: 0 }}>
        {getBatteryIcon(percentage, isCharging)}
      </Box>
      <Box sx={{ flex: 1, position: "relative" }}>
        <Box sx={{ height: 6, borderRadius: "999px", bgcolor: style.track, overflow: "hidden" }}>
          <Box
            sx={{
              height: "100%",
              width: `${percentage}%`,
              bgcolor: style.fill,
              borderRadius: "999px",
              transition: "width 0.6s ease",
              ...(isCharging && {
                animation: "chargePulse 1.5s ease-in-out infinite",
                "@keyframes chargePulse": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.6 },
                },
              }),
            }}
          />
        </Box>
      </Box>
      <Typography
        sx={{ fontSize: "0.78rem", fontWeight: 700, color: style.color, flexShrink: 0, minWidth: 32 }}
      >
        {percentage}%
      </Typography>
      {isCharging && (
        <Typography sx={{ fontSize: "0.68rem", color: "#d97706", fontWeight: 600, flexShrink: 0 }}>
          ⚡
        </Typography>
      )}
    </Box>
  );
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ member }) => {
  if (member.punchedIn && !member.punchOutTime) {
    return (
      <Chip
        icon={<CheckCircle sx={{ fontSize: "0.8rem !important" }} />}
        label="Punched In"
        size="small"
        sx={{
          bgcolor: "#dcfce7", color: "#16a34a", fontWeight: 700, fontSize: "0.7rem", height: 24,
          "& .MuiChip-icon": { color: "#16a34a" },
        }}
      />
    );
  }
  if (member.punchOutTime) {
    return (
      <Chip
        icon={<CheckCircle sx={{ fontSize: "0.8rem !important" }} />}
        label="Punched Out"
        size="small"
        sx={{
          bgcolor: "#fef3c7", color: "#d97706", fontWeight: 700, fontSize: "0.7rem", height: 24,
          "& .MuiChip-icon": { color: "#d97706" },
        }}
      />
    );
  }
  return (
    <Chip
      icon={<Cancel sx={{ fontSize: "0.8rem !important" }} />}
      label="Not Punched In"
      size="small"
      sx={{
        bgcolor: "#fee2e2", color: "#dc2626", fontWeight: 700, fontSize: "0.7rem", height: 24,
        "& .MuiChip-icon": { color: "#dc2626" },
      }}
    />
  );
};

const MemberTrailDialog = ({ member, open, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(getTodayDateInput());
  const [mapState, setMapState] = useState({
    loading: false,
    isPunchedIn: false,
    hasPunchedOut: false,
    punchInLocation: null,
    visits: [],
  });

  useEffect(() => {
    if (!open) return;
    setSelectedDate(getTodayDateInput());
  }, [open, member.id]);

  useEffect(() => {
    if (!open || !member?.id || !selectedDate) return;

    let cancelled = false;

      const loadAttendanceForDate = async () => {
      setMapState((prev) => ({ ...prev, loading: true }));
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const [attendanceRes, visitsRes] = await Promise.all([
          axios.get(`${API}/api/v1/attendance`, {
            headers,
            params: {
              userId: member.id,
              startDate: selectedDate,
              endDate: selectedDate,
              limit: 1,
            },
          }),
          axios.get(`${API}/api/v1/visit`, {
            headers,
            params: {
              userId: member.id,
              startDate: selectedDate,
              endDate: selectedDate,
              page: 1,
              limit: 200,
            },
          }),
        ]);

        if (cancelled) return;

        const attendance = attendanceRes.data?.result?.attendances?.[0] || null;
        const visits = visitsRes.data?.result?.visits || [];
        setMapState({
          loading: false,
          isPunchedIn: !!attendance?.punchIn?.time,
          hasPunchedOut: !!attendance?.punchOut?.time,
          punchInLocation: attendance?.punchIn
            ? {
                ...attendance.punchIn.location,
                address: attendance.punchIn.address,
                time: attendance.punchIn.time,
              }
            : null,
          visits,
        });
      } catch (error) {
        if (cancelled) return;
        console.error("Trail attendance fetch error:", error.message);
        setMapState({
          loading: false,
          isPunchedIn: false,
          hasPunchedOut: false,
          punchInLocation: null,
          visits: [],
        });
      }
    };

    loadAttendanceForDate();
    return () => {
      cancelled = true;
    };
  }, [open, member.id, selectedDate]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden", m: 2 } }}
    >
      <DialogContent sx={{ p: 0, bgcolor: "#f8fafc" }}>
        <Box
          sx={{
            px: 3,
            py: 2,
            bgcolor: "#fff",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1rem" }}>
              {member.firstName} {member.lastName} Map Trail
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "#64748b", mt: 0.25 }}>
              Stored GPS route for {formatSelectedDateLabel(selectedDate)}
            </Typography>
          </Box>

          <TextField
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            inputProps={{ max: getTodayDateInput() }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarToday sx={{ fontSize: "1rem", color: "#64748b" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: { xs: "100%", sm: 210 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                bgcolor: "#fff",
              },
            }}
          />
        </Box>

        <Box sx={{ p: 2 }}>
          {mapState.loading && (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 420 }}>
              <CircularProgress sx={{ color: "#4569ea" }} />
            </Box>
          )}

          {!mapState.loading && (
            <>
              {!mapState.isPunchedIn && (
                <Box
                  sx={{
                    mb: 1.5,
                    px: 1.5,
                    py: 1,
                    borderRadius: "10px",
                    bgcolor: "#fff7ed",
                    border: "1px solid #fdba74",
                  }}
                >
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#c2410c" }}>
                    No punch-in found for {formatSelectedDateLabel(selectedDate)}.
                  </Typography>
                  <Typography sx={{ fontSize: "0.74rem", color: "#9a3412", mt: 0.25 }}>
                    If GPS points exist in the database for that date, the route line will still load on the map.
                  </Typography>
                </Box>
              )}

              <LiveTrackMap
                isPunchedIn={mapState.isPunchedIn}
                hasPunchedOut={mapState.hasPunchedOut}
                userId={member.id}
                isOwner={false}
                height="520px"
                punchInLocation={mapState.punchInLocation}
                selectedDate={selectedDate}
                visits={mapState.visits}
              />
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// ── Member Card ───────────────────────────────────────────────────────────────
const MemberCard = ({ member }) => {
  const navigate = useNavigate();
  const [showMap, setShowMap] = useState(false);

  const isActive = member.punchedIn && !member.punchOutTime;
  const isPunchedOut = !!member.punchOutTime;
  const battStyle = getBatteryStyle(member.batteryPercentage);

  return (
    <>
      <Box
        sx={{
          bgcolor: "#fff",
          borderRadius: "16px",
          p: 2.5,
          boxShadow: "0 1px 8px rgba(0,0,0,0.07)",
          border: isActive
            ? "1.5px solid #bbf7d0"
            : isPunchedOut
            ? "1.5px solid #fde68a"
            : "1.5px solid #fecaca",
          transition: "box-shadow 0.2s",
          position: "relative",
          overflow: "hidden",
          "&:hover": { boxShadow: "0 4px 20px rgba(69,105,234,0.13)" },
        }}
      >
        {/* Live pulse dot */}
        {isActive && (
          <Box
            sx={{
              position: "absolute", top: 14, right: 14,
              width: 10, height: 10, borderRadius: "50%",
              bgcolor: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.25)",
              animation: "pulse 2s infinite",
              "@keyframes pulse": {
                "0%": { boxShadow: "0 0 0 0 rgba(34,197,94,0.4)" },
                "70%": { boxShadow: "0 0 0 8px rgba(34,197,94,0)" },
                "100%": { boxShadow: "0 0 0 0 rgba(34,197,94,0)" },
              },
            }}
          />
        )}

        {/* Avatar + Name + Phone + Email */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
          <Avatar
            sx={{
              width: 44, height: 44, bgcolor: member.color,
              fontWeight: 700, fontSize: "1rem", flexShrink: 0,
            }}
          >
            {member.avatar}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: "#1e293b", lineHeight: 1.3 }}>
              {member.firstName} {member.lastName}
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "#64748b", mt: 0.2 }}>
              {member.phoneNumber}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.72rem", color: "#94a3b8", mt: 0.1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {member.email}
            </Typography>
          </Box>
        </Box>

        {/* Role + Status */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
          <Chip
            label={member.role}
            size="small"
            sx={{
              bgcolor: "#eff6ff", color: "#4569ea", fontWeight: 700,
              fontSize: "0.68rem", height: 22, border: "1px solid #bfdbfe",
            }}
          />
          <StatusBadge member={member} />
        </Box>

        <Divider sx={{ mb: 1.5, borderColor: "#f1f5f9" }} />

        {/* Punch info */}
        {member.punchedIn ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <AccessTime sx={{ fontSize: "0.9rem", color: "#22c55e" }} />
              <Typography sx={{ fontSize: "0.78rem", color: "#475569" }}>
                <b>In:</b>{" "}
                <span style={{ color: "#16a34a", fontWeight: 600 }}>{member.punchInTime}</span>
              </Typography>
              {member.punchOutTime && (
                <>
                  <Box sx={{ mx: 0.5, color: "#cbd5e1" }}>•</Box>
                  <AccessTime sx={{ fontSize: "0.9rem", color: "#f59e0b" }} />
                  <Typography sx={{ fontSize: "0.78rem", color: "#475569" }}>
                    <b>Out:</b>{" "}
                    <span style={{ color: "#d97706", fontWeight: 600 }}>{member.punchOutTime}</span>
                  </Typography>
                </>
              )}
            </Box>

            {member.totalHours && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <AccessTime sx={{ fontSize: "0.9rem", color: "#4569ea" }} />
                <Typography sx={{ fontSize: "0.78rem", color: "#475569" }}>
                  <b>Duration:</b>{" "}
                  <span style={{ color: "#4569ea", fontWeight: 600 }}>{member.totalHours}</span>
                </Typography>
              </Box>
            )}

            {member.location && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <LocationOn sx={{ fontSize: "0.9rem", color: "#f43f5e" }} />
                <Typography
                  sx={{
                    fontSize: "0.78rem", color: "#475569",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}
                >
                  {member.location}
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex", alignItems: "center", gap: 1,
              bgcolor: "#fef2f2", borderRadius: "8px", px: 1.5, py: 1,
            }}
          >
            <Cancel sx={{ fontSize: "1rem", color: "#ef4444" }} />
            <Typography sx={{ fontSize: "0.78rem", color: "#dc2626", fontWeight: 500 }}>
              Not yet punched in today
            </Typography>
          </Box>
        )}

        {/* Battery */}
        <Box
          sx={{
            mt: 1.5, p: 1.25, borderRadius: "10px",
            bgcolor: battStyle ? battStyle.bg : "#f8fafc",
            border: `1px solid ${battStyle ? battStyle.border : "#e2e8f0"}`,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8",
              textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.75,
            }}
          >
            Device Battery
          </Typography>
          <BatteryBar percentage={member.batteryPercentage} isCharging={member.isCharging} />
        </Box>

        {/* Buttons */}
        <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
          {/* View Attendance */}
          <Button
            fullWidth
            variant="contained"
            size="small"
            onClick={() =>
              navigate(`/attendance/${member.id}`, {
                state: {
                  memberName: `${member.firstName} ${member.lastName}`,
                  memberRole: member.role,
                  memberPhone: member.phoneNumber,
                  memberEmail: member.email,
                  fromTeam: true,
                },
              })
            }
            startIcon={<AccessTime sx={{ fontSize: "1rem" }} />}
            sx={{
              borderRadius: "10px", py: 1, fontSize: "0.78rem", fontWeight: 700,
              textTransform: "none",
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              boxShadow: "0 3px 12px rgba(249,115,22,0.35)",
              "&:hover": { background: "linear-gradient(135deg, #ea580c, #c2410c)" },
            }}
          >
            Attendance
          </Button>

      {/* Live Track button — only shown when member has punched in */}
          <Tooltip title={isActive ? "View live location and older dates" : "View stored map trail by date"}>
            <Button
              variant="contained"
              size="small"
              onClick={() => setShowMap(true)}
              startIcon={<LocationOn sx={{ fontSize: "1rem" }} />}
              sx={{
                borderRadius: "10px", py: 1, fontSize: "0.78rem", fontWeight: 700,
                textTransform: "none", flexShrink: 0,
                background: isActive
                  ? "linear-gradient(135deg, #22c55e, #16a34a)"
                  : "linear-gradient(135deg, #3b82f6, #2563eb)",
                boxShadow: isActive
                  ? "0 3px 12px rgba(34,197,94,0.35)"
                  : "0 3px 12px rgba(59,130,246,0.35)",
                "&:hover": {
                  background: isActive
                    ? "linear-gradient(135deg, #16a34a, #15803d)"
                    : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                },
              }}
            >
              {isActive ? "Live Map" : "Map Trail"}
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <MemberTrailDialog member={member} open={showMap} onClose={() => setShowMap(false)} />
    </>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const TeamAttendance = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showSpinner = true) => {
  if (showSpinner) setLoading(true);
  else setRefreshing(true);

    try {
    const today = new Date().toISOString().split("T")[0];
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    // Step 1: Fetch team users (backend now filters by role — ASM sees only their team)
    let rawUsers = [];
    try {
      const usersRes = await axios.get(`${API}/api/v1/user/getManagerUnderUserList`, {
        headers, params: { limit: 200 },
      });
      rawUsers = usersRes.data?.result?.users || [];
    } catch (e) {
      console.error("Users API failed:", e.message);
    }

    // ✅ Step 2: Fetch attendance ONLY for the fetched user IDs
    // This prevents ASM from seeing attendance of users outside their team
    let attendances = [];
    try {
      const userIds = rawUsers.map((u) => String(u._id || u.id)).filter(Boolean);

      if (userIds.length > 0) {
        const attRes = await axios.get(`${API}/api/v1/attendance`, {
          headers,
          params: {
            startDate: today,
            endDate: today,
            limit: 200,
            // ✅ Backend role filter handles scoping automatically
            // No need to pass userIds — backend returns only what this role can see
          },
        });
        const allAtt = attRes.data?.result?.attendances || [];

        // ✅ Filter attendance to ONLY users returned from getManagerUnderUserList
        // Double safety: even if backend leaks extra records, we filter here too
        const allowedIdSet = new Set(userIds);
        attendances = allAtt.filter((a) => {
          const uid = String(a.user?.id || a.user?._id || "");
          return allowedIdSet.has(uid);
        });
      }
    } catch (e) {
      console.error("Attendance API failed:", e.message);
    }



      // Step 3: Fetch battery for all users
       let batteryMap = {};
    try {
      const userIds = rawUsers.map((u) => String(u._id || u.id)).filter(Boolean);
      if (userIds.length > 0) {
        const battRes = await axios.get(`${API}/api/v1/battery/all-latest`, {
          headers,
          params: { userIds: userIds.join(",") },
        });
        const batteryLogs = battRes.data?.data || battRes.data?.result || [];

        batteryLogs.forEach((b) => {
          // ✅ Fixed: use userId field, NOT b._id (b._id is the battery log's own ID)
          const key = String(b.userId || b.user?._id || b.user || "");
          if (key) {
            batteryMap[key] = {
              percentage: typeof b.percentage === "number" ? b.percentage : null,
              isCharging: b.isCharging ?? false,
            };
          }
        });
      }
    } catch (e) {
      console.error("Battery fetch failed:", e.message);
    }


      // Step 4: Map attendance by userId
      const attMap = {};
    attendances.forEach((a) => {
      const uid = String(a.user?.id || a.user?._id || "");
      if (uid) attMap[uid] = a;
    });

    // Step 5: Merge users + attendance + battery
    const merged = rawUsers.map((u) => {
      const uid = String(u._id || u.id || "");
      const att = attMap[uid] || null;
      const punchedIn = !!att?.punchIn?.time;
      const punchOutTime = att?.punchOut?.time ? formatTime(att.punchOut.time) : null;

      return {
        id: uid,
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        phoneNumber: u.phoneNumber || "",
        email: u.email || "",
        role: u.role || "TEAM",
        avatar: (u.firstName?.[0] || "").toUpperCase(),
        color: getColor(u.firstName || ""),
        punchedIn,
        punchInTime: punchedIn ? formatTime(att.punchIn.time) : null,
        punchOutTime,
        location: att?.punchIn?.address || att?.punchOut?.address || null,
        totalHours: att?.workHours ? formatHours(att.workHours) : null,
        // ✅ Fixed battery key lookup
        batteryPercentage: batteryMap[uid]?.percentage ?? null,
        isCharging: batteryMap[uid]?.isCharging ?? false,
      };
    });

    setTeam(merged);
    setLastRefreshed(new Date());
  } catch (err) {
    console.error("TeamAttendance fetch error:", err.message);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const t = setInterval(() => fetchData(false), 60000);
    return () => clearInterval(t);
  }, [fetchData]);

  const filtered = team.filter((m) => {
    const matchSearch = `${m.firstName} ${m.lastName} ${m.phoneNumber} ${m.email}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchFilter =
      filter === "all"
        ? true
        : filter === "in"
        ? m.punchedIn && !m.punchOutTime
        : filter === "out"
        ? !!m.punchOutTime
        : filter === "low"
        ? m.batteryPercentage !== null && m.batteryPercentage <= 20
        : !m.punchedIn;
    return matchSearch && matchFilter;
  });

  const punchedInCount = team.filter((m) => m.punchedIn && !m.punchOutTime).length;
  const punchedOutCount = team.filter((m) => !!m.punchOutTime).length;
  const absentCount = team.filter((m) => !m.punchedIn).length;
  const lowBatteryCount = team.filter(
    (m) => m.batteryPercentage !== null && m.batteryPercentage <= 20
  ).length;

  const filterBtns = [
    { key: "all", label: "All", count: team.length, color: "#4569ea" },
    { key: "in", label: "Active", count: punchedInCount, color: "#22c55e" },
    { key: "out", label: "Punched Out", count: punchedOutCount, color: "#f59e0b" },
    { key: "absent", label: "Absent", count: absentCount, color: "#ef4444" },
    { key: "low", label: "Low Battery", count: lowBatteryCount, color: "#dc2626" },
  ];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#4569ea" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: "auto" }}>

      {/* Header banner */}
      <Box
        sx={{
          background: "linear-gradient(120deg, #4569ea 0%, #3a5ac8 60%, #6d28d9 100%)",
          borderRadius: "18px", p: { xs: 2.5, sm: 3 }, mb: 3,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 2, position: "relative", overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute", right: -40, top: -40, width: 180, height: 180,
            borderRadius: "50%", bgcolor: "rgba(255,255,255,0.07)",
          }}
        />
        <Box
          sx={{
            position: "absolute", right: 60, bottom: -60, width: 140, height: 140,
            borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)",
          }}
        />

        <Box sx={{ position: "relative" }}>
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 800, mb: 0.3 }}>
            Team Attendance
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>
            {team.length} team members ·{" "}
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long", day: "numeric", month: "long",
            })}
          </Typography>
          <Box sx={{ mt: 1.5, width: { xs: "100%", sm: 280 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.72rem" }}>
                Attendance rate
              </Typography>
              <Typography sx={{ color: "#fff", fontSize: "0.72rem", fontWeight: 700 }}>
                {team.length
                  ? Math.round(((punchedInCount + punchedOutCount) / team.length) * 100)
                  : 0}
                %
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={
                team.length ? ((punchedInCount + punchedOutCount) / team.length) * 100 : 0
              }
              sx={{
                height: 6, borderRadius: 4, bgcolor: "rgba(255,255,255,0.2)",
                "& .MuiLinearProgress-bar": { bgcolor: "#4ade80", borderRadius: 4 },
              }}
            />
          </Box>
        </Box>

        <Tooltip title="Refresh attendance">
          <IconButton
            onClick={() => fetchData(false)}
            sx={{
              bgcolor: "rgba(255,255,255,0.15)", color: "#fff",
              borderRadius: "12px", width: 44, height: 44,
              "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
            }}
          >
            <Refresh
              sx={{
                animation: refreshing ? "spin 0.8s linear infinite" : "none",
                "@keyframes spin": {
                  from: { transform: "rotate(0deg)" },
                  to: { transform: "rotate(360deg)" },
                },
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 2, mb: 3,
        }}
      >
        {[
          { label: "Total", value: team.length, color: "#4569ea", bg: "#eff6ff" },
          { label: "Active Now", value: punchedInCount, color: "#16a34a", bg: "#f0fdf4" },
          { label: "Punched Out", value: punchedOutCount, color: "#d97706", bg: "#fffbeb" },
          { label: "Absent", value: absentCount, color: "#dc2626", bg: "#fef2f2" },
          { label: "Low Battery", value: lowBatteryCount, color: "#b45309", bg: "#fefce8" },
        ].map((stat) => (
          <Box
            key={stat.label}
            sx={{
              bgcolor: stat.bg, borderRadius: "14px", p: 2, textAlign: "center",
              border: `1.5px solid ${stat.color}22`,
            }}
          >
            <Typography
              sx={{ fontSize: "1.6rem", fontWeight: 800, color: stat.color, lineHeight: 1 }}
            >
              {stat.value}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "#64748b", mt: 0.4, fontWeight: 500 }}>
              {stat.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Search + Filter */}
      <Box
        sx={{ display: "flex", gap: 1.5, mb: 2.5, flexWrap: "wrap", alignItems: "center" }}
      >
        <TextField
          placeholder="Search team members..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: "1rem", color: "#94a3b8" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1, minWidth: 200,
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px", bgcolor: "#fff",
              "& fieldset": { borderColor: "#e2e8f0" },
            },
          }}
        />
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {filterBtns.map((btn) => (
            <Box
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              sx={{
                px: 1.5, py: 0.6, borderRadius: "8px", cursor: "pointer",
                fontSize: "0.78rem", fontWeight: 600,
                border: `1.5px solid ${filter === btn.key ? btn.color : "#e2e8f0"}`,
                bgcolor: filter === btn.key ? `${btn.color}15` : "#fff",
                color: filter === btn.key ? btn.color : "#64748b",
                transition: "all 0.15s", userSelect: "none",
                display: "flex", alignItems: "center", gap: 0.5,
                "&:hover": { borderColor: btn.color, color: btn.color },
              }}
            >
              {btn.label}
              <Box
                sx={{
                  bgcolor: filter === btn.key ? btn.color : "#e2e8f0",
                  color: filter === btn.key ? "#fff" : "#64748b",
                  borderRadius: "5px", px: 0.6, py: 0.1,
                  fontSize: "0.65rem", fontWeight: 700, lineHeight: 1.6,
                }}
              >
                {btn.count}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8", mb: 2 }}>
        Auto-refreshes every 60s · Last updated:{" "}
        {lastRefreshed.toLocaleTimeString("en-IN", {
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        })}
      </Typography>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, color: "#94a3b8" }}>
          <Person sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
          <Typography>No members found</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr", sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          {filtered.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TeamAttendance;
