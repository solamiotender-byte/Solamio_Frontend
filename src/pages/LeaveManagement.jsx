import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { CheckCircle, Cancel, EventBusy, Refresh } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

const statusColor = {
  pending: "warning",
  approved: "success",
  rejected: "error",
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateRange = (startDate, endDate) => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (start === "-" && end === "-") return "-";
  if (start === "-" || end === "-" || start === end) return start !== "-" ? start : end;

  return `${start} to ${end}`;
};

const getUserName = (user) => {
  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return name || user?.email || "User";
};

export default function LeaveManagement() {
  const { fetchAPI, user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [reviewNotes, setReviewNotes] = useState({});

  const isManager = useMemo(
    () => ["Head_office", "ZSM", "ASM"].includes(user?.role),
    [user?.role],
  );

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchAPI("/leave?limit=300");
      const result = response?.result || response?.data || response;
      setLeaves(Array.isArray(result?.leaves) ? result.leaves : []);
    } catch (err) {
      setError(err.message || "Unable to load leave requests");
    } finally {
      setLoading(false);
    }
  }, [fetchAPI]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const updateStatus = async (leaveId, status) => {
    setSavingId(leaveId);
    setError("");
    try {
      await fetchAPI(`/leave/${leaveId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          reviewNote: reviewNotes[leaveId] || "",
        }),
      });
      await loadLeaves();
    } catch (err) {
      setError(err.message || "Unable to update leave request");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f5f7fb", minHeight: "100vh" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2} mb={3}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: "#e9efff",
              color: "#4569ea",
              display: "grid",
              placeItems: "center",
            }}
          >
            <EventBusy />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Leave Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review leave requests and update attendance automatically.
            </Typography>
          </Box>
        </Stack>
        <Button startIcon={<Refresh />} variant="outlined" onClick={loadLeaves} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight={800}>
            Leave Requests
          </Typography>
          <Chip label={`${leaves.length} total`} color="primary" size="small" />
        </Box>
        <Divider />

        {loading ? (
          <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : leaves.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <Typography color="text.secondary">No leave requests found.</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead sx={{ bgcolor: "#f3f5fb" }}>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Leave Dates</TableCell>
                  <TableCell>Days</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Review Note</TableCell>
                  {isManager && <TableCell align="right">Action</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {leaves.map((leave) => (
                  <TableRow key={leave._id} hover>
                    <TableCell>
                      <Typography fontWeight={700}>{getUserName(leave.user)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {leave.user?.phoneNumber || leave.user?.email || ""}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {formatDateRange(leave.startDate, leave.endDate)}
                    </TableCell>
                    <TableCell>{leave.totalDays}</TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {leave.reason}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={leave.status}
                        color={statusColor[leave.status] || "default"}
                        size="small"
                        sx={{ textTransform: "capitalize", fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 190 }}>
                      {leave.status === "pending" && isManager ? (
                        <TextField
                          size="small"
                          placeholder="Optional note"
                          value={reviewNotes[leave._id] || ""}
                          onChange={(event) =>
                            setReviewNotes((prev) => ({
                              ...prev,
                              [leave._id]: event.target.value,
                            }))
                          }
                          fullWidth
                        />
                      ) : (
                        leave.reviewNote || "-"
                      )}
                    </TableCell>
                    {isManager && (
                      <TableCell align="right">
                        {leave.status === "pending" ? (
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              color="success"
                              variant="contained"
                              startIcon={<CheckCircle />}
                              disabled={savingId === leave._id}
                              onClick={() => updateStatus(leave._id, "approved")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              startIcon={<Cancel />}
                              disabled={savingId === leave._id}
                              onClick={() => updateStatus(leave._id, "rejected")}
                            >
                              Reject
                            </Button>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Reviewed by {getUserName(leave.reviewedBy)}
                          </Typography>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}
