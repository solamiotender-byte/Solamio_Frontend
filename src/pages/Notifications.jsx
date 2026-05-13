import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  Button,
  Divider,
  IconButton,
  alpha,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  MarkEmailRead as MarkEmailReadIcon,
  FiberManualRecord as FiberManualRecordIcon,
} from "@mui/icons-material";

const PRIMARY = "#4569ea";
const API = "  https://vanurtech-solar-backend-1.onrender.com/api/v1";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  "";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const token = getToken();
        if (!token) return;

        const res = await fetch(`${API}/notifications?limit=50`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) return;
        const payload = await res.json();
        const data = payload?.data || payload?.result || {};
        const list = data?.notifications || [];
        setNotifications(
          list.map((item) => ({
            id: item._id || item.id,
            title: item.title,
            message: item.message,
            time: item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN") : "Just now",
            category: item.type ? item.type.replace(/_/g, " ") : "General",
            read: Boolean(item.read),
          }))
        );
      } catch (error) {
        console.error("Notifications load failed:", error.message);
      }
    };

    loadNotifications();
  }, []);

  const handleMarkAllRead = () => {
    const token = getToken();
    fetch(`${API}/notifications/read-all`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).catch((error) => console.error("Mark all notifications failed:", error.message));

    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleMarkRead = (id) => {
    const token = getToken();
    fetch(`${API}/notifications/${id}/read`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).catch((error) => console.error("Mark notification failed:", error.message));

    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 4,
          border: "1px solid #e2e8f0",
          background:
            "linear-gradient(135deg, rgba(69,105,234,0.08) 0%, rgba(255,255,255,1) 55%)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography sx={{ fontSize: { xs: "1.2rem", md: "1.5rem" }, fontWeight: 800, color: "#0f172a" }}>
              Notifications
            </Typography>
            <Typography sx={{ mt: 0.6, color: "#64748b", fontSize: "0.92rem" }}>
              Track alerts, reminders, lead updates, and important admin activity in one place.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={<NotificationsIcon />}
              label={`${unreadCount} unread`}
              sx={{
                bgcolor: alpha(PRIMARY, 0.1),
                color: PRIMARY,
                border: `1px solid ${alpha(PRIMARY, 0.18)}`,
                fontWeight: 700,
              }}
            />
            <Button
              variant="contained"
              startIcon={<MarkEmailReadIcon />}
              onClick={handleMarkAllRead}
              sx={{
                bgcolor: PRIMARY,
                borderRadius: 2.5,
                fontWeight: 700,
                "&:hover": { bgcolor: "#3a5ac8" },
              }}
            >
              Mark All Read
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {notifications.map((item, index) => (
          <React.Fragment key={item.id}>
            <Box
              sx={{
                px: { xs: 2, md: 3 },
                py: 2.2,
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                bgcolor: item.read ? "#ffffff" : alpha(PRIMARY, 0.04),
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "14px",
                  bgcolor: item.read ? "#f8fafc" : alpha(PRIMARY, 0.12),
                  color: item.read ? "#64748b" : PRIMARY,
                  border: `1px solid ${item.read ? "#e2e8f0" : alpha(PRIMARY, 0.16)}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <NotificationsIcon />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                  sx={{ mb: 0.6 }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography sx={{ fontSize: "0.98rem", fontWeight: 800, color: "#0f172a" }}>
                      {item.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={item.category}
                      sx={{
                        height: 22,
                        bgcolor: "#f8fafc",
                        color: "#475569",
                        border: "1px solid #e2e8f0",
                        fontWeight: 700,
                      }}
                    />
                    {!item.read && (
                      <FiberManualRecordIcon sx={{ fontSize: 10, color: PRIMARY }} />
                    )}
                  </Stack>

                  <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8", flexShrink: 0 }}>
                    {item.time}
                  </Typography>
                </Stack>

                <Typography sx={{ color: "#475569", lineHeight: 1.6, fontSize: "0.9rem" }}>
                  {item.message}
                </Typography>
              </Box>

              {!item.read && (
                <IconButton
                  onClick={() => handleMarkRead(item.id)}
                  sx={{
                    color: PRIMARY,
                    border: `1px solid ${alpha(PRIMARY, 0.18)}`,
                    bgcolor: alpha(PRIMARY, 0.06),
                    "&:hover": { bgcolor: alpha(PRIMARY, 0.12) },
                  }}
                >
                  <MarkEmailReadIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            {index < notifications.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Paper>
    </Box>
  );
}
