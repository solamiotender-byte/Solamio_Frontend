// pages/TeamAttendance.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Typography, Paper, Avatar, Chip, IconButton,
  TextField, InputAdornment, Stack, Card, CardContent,
  Grid, Button, CircularProgress, useTheme, useMediaQuery,
  Skeleton, Fade, Collapse, alpha, Snackbar, Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Search, History, Group, Close, ExpandMore,
  Clear, Refresh,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useAttendance } from "../hooks/useAttendance";
import { useNavigate } from "react-router-dom";

// ─── Constants ─────────────────────────────────────────────────────────────
const PRIMARY = "#4569ea";
const SECONDARY = "#1a237e";

// ─── Styled ────────────────────────────────────────────────────────────────
const MemberCard = styled(Card)(() => ({
  borderRadius: 16,
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  border: `1px solid ${alpha(PRIMARY, 0.1)}`,
  transition: "transform .2s, box-shadow .2s",
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: `0 8px 24px ${alpha(PRIMARY, 0.12)}`,
  },
}));

// ─── Loading Skeleton ───────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <Box sx={{ p: { xs: 2, sm: 3 } }}>
    <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3, mb: 3 }} />
    <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2, mb: 3 }} />
    <Grid container spacing={2}>
      {[1, 2, 3, 4].map((i) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
        </Grid>
      ))}
    </Grid>
  </Box>
);

// ─── Mobile Member Card ─────────────────────────────────────────────────────
const MobileTeamCard = ({ member, onViewAttendance, index }) => {
  const [exp, setExp] = useState(false);
  return (
    <Fade in timeout={400 + index * 50}>
      <Paper
        sx={{
          mb: 1.5, borderRadius: 3,
          border: `1px solid ${alpha(PRIMARY, 0.1)}`,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: PRIMARY, color: "#fff", width: 48, height: 48, fontWeight: 700 }}>
                {member.firstName?.charAt(0) || "U"}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color={PRIMARY}>
                  {member.firstName} {member.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {member.phoneNumber || member.email || "N/A"}
                </Typography>
              </Box>
            </Stack>
            <IconButton
              size="small"
              onClick={() => setExp(!exp)}
              sx={{ bgcolor: alpha(PRIMARY, 0.08), transform: exp ? "rotate(180deg)" : "none", transition: "transform .25s" }}
            >
              <ExpandMore />
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Chip size="small" label={member.role || "TEAM"} sx={{ bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY, fontSize: "0.7rem" }} />
            {member.email && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ mt: 0.3 }}>{member.email}</Typography>
            )}
          </Stack>

          <Collapse in={exp}>
            <Box sx={{ mt: 2, pt: 2, borderTop: `1px dashed ${alpha(PRIMARY, 0.12)}` }}>
              <Button
                fullWidth size="small" variant="contained" startIcon={<History />}
                onClick={() => onViewAttendance(member)}
                sx={{ bgcolor: PRIMARY, borderRadius: 2, "&:hover": { bgcolor: SECONDARY } }}
              >
                View Attendance
              </Button>
            </Box>
          </Collapse>
        </Box>
      </Paper>
    </Fade>
  );
};

// ─── Empty State ────────────────────────────────────────────────────────────
const EmptyState = ({ onClear, hasFilters }) => (
  <Box sx={{ textAlign: "center", py: 8, px: 2 }}>
    <Box sx={{ width: 80, height: 80, borderRadius: "50%", bgcolor: alpha(PRIMARY, 0.08), display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
      <Group sx={{ fontSize: 36, color: PRIMARY }} />
    </Box>
    <Typography variant="h6" fontWeight={600} gutterBottom>No team members found</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: hasFilters ? 2.5 : 0 }}>
      {hasFilters ? "Try adjusting your search." : "Your team members will appear here."}
    </Typography>
    {hasFilters && (
      <Button variant="contained" startIcon={<Clear />} onClick={onClear} sx={{ bgcolor: PRIMARY, borderRadius: 2 }}>
        Clear Search
      </Button>
    )}
  </Box>
);

// ─── Main Component ─────────────────────────────────────────────────────────
export default function TeamAttendance() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { getTeamMembers } = useAttendance();

  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });

  const showSnack = useCallback((msg, sev = "error") => setSnackbar({ open: true, message: msg, severity: sev }), []);

  const loadTeamMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const members = await getTeamMembers();
      setTeamMembers(members || []);
    } catch {
      showSnack("Failed to load team members");
    } finally {
      setLoadingMembers(false);
    }
  }, [getTeamMembers, showSnack]);

  useEffect(() => { loadTeamMembers(); }, [loadTeamMembers]);

  // ── Navigate to the full Attendance page for this member ────────────────
  const handleViewAttendance = useCallback((member) => {
    const id = member._id || member.id;
    if (!id) { showSnack("Invalid member"); return; }
    // Pass member info via location state so Attandance.jsx can show their name
    navigate(`/attendance/${id}`, {
      state: {
        memberName: `${member.firstName} ${member.lastName}`,
        memberRole: member.role,
        memberPhone: member.phoneNumber,
        memberEmail: member.email,
        fromTeam: true,
      },
    });
  }, [navigate, showSnack]);

  const filteredMembers = useMemo(() => {
    if (!searchTerm) return teamMembers;
    const s = searchTerm.toLowerCase();
    return teamMembers.filter((m) =>
      m.firstName?.toLowerCase().includes(s) ||
      m.lastName?.toLowerCase().includes(s) ||
      m.email?.toLowerCase().includes(s) ||
      m.employeeId?.toLowerCase().includes(s),
    );
  }, [teamMembers, searchTerm]);

  if (loadingMembers && !teamMembers.length) return <LoadingSkeleton />;

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f4f6fb" }}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3,
          background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
          color: "#fff", position: "relative", overflow: "hidden",
        }}
      >
        {[{ w: 200, h: 200, t: -70, r: -50 }, { w: 120, h: 120, t: 20, r: 100 }].map((b, i) => (
          <Box key={i} sx={{ position: "absolute", width: b.w, height: b.h, borderRadius: "50%", bgcolor: "#fff", opacity: i === 0 ? 0.05 : 0.04, top: b.t, right: b.r, pointerEvents: "none" }} />
        ))}
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
          <Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={800}>Team Attendance</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {loadingMembers ? "Loading…" : `${teamMembers.length} team member${teamMembers.length !== 1 ? "s" : ""}`}
            </Typography>
          </Box>
          <Button
            variant="contained" startIcon={<Refresh />}
            onClick={loadTeamMembers} disabled={loadingMembers}
            size={isMobile ? "small" : "medium"}
            sx={{ bgcolor: "rgba(255,255,255,.15)", color: "#fff", borderRadius: 2.5, "&:hover": { bgcolor: "rgba(255,255,255,.25)" } }}
          >
            Refresh
          </Button>
        </Stack>
      </Paper>

      {/* ── Search ────────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, border: `1px solid ${alpha(PRIMARY, 0.08)}` }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search team members…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            sx={{ maxWidth: 400 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ color: "text.secondary" }} /></InputAdornment>,
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}><Close fontSize="small" /></IconButton>
                </InputAdornment>
              ),
              sx: { borderRadius: 2 },
            }}
          />
          {searchTerm && (
            <Button variant="text" startIcon={<Clear />} onClick={() => setSearchTerm("")} sx={{ color: "#ef4444", flexShrink: 0 }}>
              Clear
            </Button>
          )}
        </Stack>
      </Paper>

      {/* ── Member Grid ───────────────────────────────────────────────── */}
      {loadingMembers ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress sx={{ color: PRIMARY }} />
        </Box>
      ) : filteredMembers.length > 0 ? (
        <Grid container spacing={isMobile ? 1.5 : 2.5}>
          {filteredMembers.map((member, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={member._id || member.id}>
              {isMobile ? (
                <MobileTeamCard member={member} onViewAttendance={handleViewAttendance} index={index} />
              ) : (
                <MemberCard>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack spacing={2}>
                      {/* Avatar + name */}
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: PRIMARY, width: 52, height: 52, fontWeight: 800, fontSize: "1.2rem" }}>
                          {member.firstName?.charAt(0)}
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                          <Typography variant="subtitle1" fontWeight={700} noWrap>
                            {member.firstName} {member.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {member.phoneNumber || "No phone"}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Email */}
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: "0.8rem" }}>
                        {member.email || "—"}
                      </Typography>

                      {/* Role chip */}
                      <Chip
                        label={member.role || "TEAM"} size="small"
                        sx={{ bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY, alignSelf: "flex-start", fontWeight: 600 }}
                      />

                      {/* CTA — navigates to full Attendance page */}
                      <Button
                        fullWidth variant="contained" startIcon={<History />}
                        onClick={() => handleViewAttendance(member)}
                        sx={{
                          borderRadius: 2, bgcolor: PRIMARY, fontWeight: 700,
                          "&:hover": { bgcolor: SECONDARY },
                          boxShadow: `0 4px 12px ${alpha(PRIMARY, 0.3)}`,
                        }}
                      >
                        View Attendance
                      </Button>
                    </Stack>
                  </CardContent>
                </MemberCard>
              )}
            </Grid>
          ))}
        </Grid>
      ) : (
        <EmptyState onClear={() => setSearchTerm("")} hasFilters={!!searchTerm} />
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}