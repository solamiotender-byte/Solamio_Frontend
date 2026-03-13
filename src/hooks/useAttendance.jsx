// hooks/useAttendance.js
import { useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

export const useAttendance = () => {
  const {
    user,
    fetchAPI,
    punchIn: authPunchIn,
    punchOut: authPunchOut,
  } = useAuth();

  const [attendances, setAttendances] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [summary, setSummary] = useState({
    totalWorkHours: 0,
    avgWorkHours: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    leaveCount: 0,
    holidayCount: 0,
  });

  // ── helpers ────────────────────────────────────────────────────────────────
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const handleError = useCallback((err, fallback = "An error occurred") => {
    const msg = err?.message || fallback;
    setError(msg);
    console.error(fallback, err);
    return msg;
  }, []);

  // ── fetchAttendances ───────────────────────────────────────────────────────
  // FIX: params were being built but never appended to the URL.
  // Now we build a query string and pass it to fetchAPI.
  const fetchAttendances = useCallback(
    async (filters = {}) => {
      setLoading(true);
      setError(null);
      try {
        // Build query string from filters (skip empty values)
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") params.append(k, v);
        });
        const qs = params.toString();
        const url = `/attendance/${qs ? `?${qs}` : ""}`;   // ← FIX: actually use the params

        const res = await fetchAPI(url);

        if (res?.success && res?.result) {
          const {
            attendances: list = [],
            pagination: pg,
            summary: sm,
          } = res.result;

          setAttendances(list);
          setPagination(
            pg || {
              currentPage: 1,
              totalPages: 1,
              totalItems: list.length,
              itemsPerPage: 10,
            }
          );
          setSummary(sm || {});

          const todayStr = new Date().toDateString();
          const today =
            list.find((a) => new Date(a.date).toDateString() === todayStr) || null;
          setTodayAttendance(today);

          return res.result;
        }
        return null;
      } catch (err) {
        handleError(err, "Failed to fetch attendance records");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchAPI, handleError]
  );

  // ── getMyAttendanceHistory ─────────────────────────────────────────────────
  const getMyAttendanceHistory = useCallback(
    async (filters = {}) => {
      if (!user?._id) return null;
      return fetchAttendances({ ...filters, userId: user._id });
    },
    [user, fetchAttendances]
  );

  // ── getTeamMembers ─────────────────────────────────────────────────────────
  // FIX: was calling /user/getAllUsers (missing 's'), now /users/getAllUsers
  const getTeamMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI("/users/getAllUsers?role=TEAM&limit=200"); // ← FIX
      if (res?.success) {
        // Handle various response shapes
        const list =
          res.result?.users ||
          res.result?.data?.users ||
          res.result?.data ||
          res.result ||
          [];
        return Array.isArray(list) ? list : [];
      }
      return [];
    } catch (err) {
      handleError(err, "Failed to fetch team members");
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchAPI, handleError]);

  // ── getAttendanceById ──────────────────────────────────────────────────────
  const getAttendanceById = useCallback(
    async (id) => {
      if (!id) {
        setError("Attendance ID is required");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAPI(`/attendance/${id}`);
        return res?.success ? res.result : null;
      } catch (err) {
        handleError(err, "Failed to fetch attendance details");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchAPI, handleError]
  );

  // ── punchIn ────────────────────────────────────────────────────────────────
  const punchIn = useCallback(
    async (locationData) => {
      if (!authPunchIn) {
        const msg = "Punch in function not available";
        setError(msg);
        return { success: false, error: msg };
      }
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const result = await authPunchIn({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          address: locationData.address,
        });
        if (result?.success) {
          setSuccess(result.message || "Punch in successful");
          await fetchAttendances();
        } else {
          setError(result?.error || "Punch in failed");
        }
        return result;
      } catch (err) {
        const msg = handleError(err, "Punch in failed");
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [authPunchIn, fetchAttendances, handleError]
  );

  // ── punchOut ───────────────────────────────────────────────────────────────
  const punchOut = useCallback(
    async (locationData) => {
      if (!authPunchOut) {
        const msg = "Punch out function not available";
        setError(msg);
        return { success: false, error: msg };
      }
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const result = await authPunchOut({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          address: locationData.address,
        });
        if (result?.success) {
          setSuccess(result.message || "Punch out successful");
          await fetchAttendances();
        } else {
          setError(result?.error || "Punch out failed");
        }
        return result;
      } catch (err) {
        const msg = handleError(err, "Punch out failed");
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [authPunchOut, fetchAttendances, handleError]
  );

  // ── updateAttendance ───────────────────────────────────────────────────────
  const updateAttendance = useCallback(
    async (id, data) => {
      if (!id) {
        const msg = "Attendance ID is required";
        setError(msg);
        return { success: false, error: msg };
      }
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const res = await fetchAPI(`/attendance/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res?.success) {
          setSuccess(res.message || "Attendance updated successfully");
          await fetchAttendances();
          return { success: true, data: res.result };
        }
        return { success: false, error: res?.message || "Update failed" };
      } catch (err) {
        const msg = handleError(err, "Failed to update attendance");
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [fetchAPI, fetchAttendances, handleError]
  );

  // ── deleteAttendance ───────────────────────────────────────────────────────
  const deleteAttendance = useCallback(
    async (id) => {
      if (!id) {
        const msg = "Attendance ID is required";
        setError(msg);
        return { success: false, error: msg };
      }
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const res = await fetchAPI(`/attendance/${id}`, { method: "DELETE" });
        if (res?.success) {
          setSuccess(res.message || "Attendance deleted");
          await fetchAttendances();
          return { success: true };
        }
        return { success: false, error: res?.message || "Delete failed" };
      } catch (err) {
        const msg = handleError(err, "Failed to delete attendance");
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [fetchAPI, fetchAttendances, handleError]
  );

  return {
    // state
    attendances,
    todayAttendance,
    loading,
    error,
    success,
    pagination,
    summary,
    // methods
    fetchAttendances,
    getMyAttendanceHistory,
    getTeamMembers,
    getAttendanceById,
    punchIn,
    punchOut,
    updateAttendance,
    deleteAttendance,
    clearMessages,
  };
};