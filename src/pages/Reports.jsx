// pages/ReportsPage.jsx (Fixed with correct attendance report structure)
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Snackbar,
  Paper,
  alpha,
  Avatar,
  Tooltip,
  Badge,
  Fade,
  Zoom,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  SwipeableDrawer,
  Collapse,
  Fab,
  BottomNavigation,
  BottomNavigationAction,
  Slide,
} from "@mui/material";
import {
  BarChart,
  PieChart,
  Build,
  TrendingUp,
  Download,
  Visibility,
  Assessment,
  Close,
  CloudDownload,
  InsertDriveFile,
  Refresh,
  CheckCircle,
  Error,
  Downloading,
  People,
  ReceiptLong,
  AttachMoney,
  CalendarToday,
  Schedule,
  Info,
  FilterList,
  Search,
  Clear,
  ArrowUpward,
  ArrowDownward,
  Sort,
  DateRange,
  Category,
  Person,
  Email,
  Phone,
  Home,
  LocationOn,
  Business,
  Assignment,
  AssignmentInd,
  SupervisorAccount,
  Groups,
  AdminPanelSettings,
  WorkspacePremium,
  Receipt,
  Money,
  TrendingDown,
  TrendingFlat,
  FilterAlt,
  ExpandMore,
  ExpandLess,
  ViewList,
  ViewModule,
  Dashboard,
  FiberManualRecord,
  AccessTime,
  Login,
  Logout,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { format, parseISO, isValid, subDays, subMonths } from "date-fns";
import { useNavigate } from "react-router-dom";

const PRIMARY_COLOR = "#4569ea";
const SECONDARY_COLOR = "#1a237e";
const SUCCESS = "#22c55e";
const WARNING = "#f59e0b";
const DANGER = "#ef4444";

// Period Options
const PERIOD_OPTIONS = [
  { value: "today", label: "Today", icon: <CalendarToday /> },
  { value: "week", label: "This Week", icon: <DateRange /> },
  { value: "month", label: "This Month", icon: <DateRange /> },
  { value: "all", label: "All Time", icon: <DateRange /> },
];

// Status configuration for attendance
const ATTENDANCE_STATUS = {
  present: {
    label: "Present",
    color: SUCCESS,
    bgColor: alpha(SUCCESS, 0.1),
  },
  absent: {
    label: "Absent",
    color: DANGER,
    bgColor: alpha(DANGER, 0.1),
  },
  late: {
    label: "Late",
    color: WARNING,
    bgColor: alpha(WARNING, 0.1),
  },
  leave: {
    label: "Leave",
    color: "#a855f7",
    bgColor: alpha("#a855f7", 0.1),
  },
  holiday: {
    label: "Holiday",
    color: "#3b82f6",
    bgColor: alpha("#3b82f6", 0.1),
  },
};

// Role-based access control with proper visibility rules
const ROLE_ACCESS = {
  Head_office: {
    level: 1,
    label: "Head Office",
    icon: <AdminPanelSettings />,
    canAccess: ["leads", "installation", "expenses", "attendance"],
    visibility: "all",
    description: "View all reports across organization",
  },
  ZSM: {
    level: 2,
    label: "Zone Sales Manager",
    icon: <WorkspacePremium />,
    canAccess: ["leads", "installation", "expenses", "attendance"],
    visibility: "zone",
    description: "View zone-wide reports",
  },
  ASM: {
    level: 3,
    label: "Area Sales Manager",
    icon: <SupervisorAccount />,
    canAccess: ["leads", "installation", "expenses", "attendance"],
    visibility: "team",
    description: "View own and team members' data",
  },
  TEAM: {
    level: 4,
    label: "Team Member",
    icon: <Groups />,
    canAccess: ["leads", "installation", "expenses", "attendance"],
    visibility: "own",
    description: "View only own data",
  },
};

const REPORT_CONFIGS = [
  {
    key: "leads",
    title: "Leads Report",
    description: "Lead tracking and pipeline performance",
    icon: <TrendingUp />,
    endpoint: "/report/leads",
    color: PRIMARY_COLOR,
    bgColor: alpha(PRIMARY_COLOR, 0.1),
    columns: [
      { field: "firstName", label: "First Name", type: "string" },
      { field: "lastName", label: "Last Name", type: "string" },
      { field: "email", label: "Email", type: "email" },
      { field: "phone", label: "Phone", type: "phone" },
      { field: "status", label: "Lead Status", type: "status" },
      { field: "visitStatus", label: "Visit Status", type: "status" },
      { field: "city", label: "City", type: "string" },
      { field: "address", label: "Address", type: "string" },
      { field: "pincode", label: "Pincode", type: "string" },
      { field: "createdBy", label: "Created By", type: "user" },
      { field: "assignedManager", label: "Assigned Manager", type: "user" },
      { field: "assignedUser", label: "Assigned User", type: "user" },
      { field: "createdAt", label: "Created Date", type: "date" },
      { field: "updatedAt", label: "Updated Date", type: "date" },
      { field: "lastContactedAt", label: "Last Contact", type: "date" },
    ],
  },
  {
    key: "installation",
    title: "Installation Report",
    description: "Installation completion metrics and progress",
    icon: <Build />,
    endpoint: "/report/installations",
    color: "#4caf50",
    bgColor: alpha("#4caf50", 0.1),
    columns: [
      { field: "customerName", label: "Customer", type: "string" },
      { field: "status", label: "Status", type: "status" },
      { field: "installationDate", label: "Installation Date", type: "date" },
      {
        field: "installationStatus",
        label: "Installation Status",
        type: "status",
      },
      { field: "assignedTeam", label: "Assigned Team", type: "user" },
      { field: "completionDate", label: "Completion Date", type: "date" },
      { field: "address", label: "Address", type: "string" },
    ],
  },
  {
    key: "expenses",
    title: "Expenses Report",
    description: "Expense tracking and approval status",
    icon: <ReceiptLong />,
    endpoint: "/report/expenses",
    color: "#ff9800",
    bgColor: alpha("#ff9800", 0.1),
    columns: [
      { field: "title", label: "Title", type: "string" },
      { field: "amount", label: "Amount", type: "amount" },
      { field: "category", label: "Category", type: "string" },
      { field: "status", label: "Status", type: "status" },
      { field: "createdBy", label: "Created By", type: "user" },
      { field: "expenseDate", label: "Expense Date", type: "date" },
      { field: "approvedBy", label: "Approved By", type: "user" },
      { field: "approverRemarks", label: "Remarks", type: "string" },
      { field: "vehicleType", label: "Vehicle Type", type: "string" },
      { field: "fuelType", label: "Fuel Type", type: "string" },
      { field: "kilometersTraveled", label: "Distance", type: "number" },
    ],
  },
  {
    key: "attendance",
    title: "Attendance Report",
    description: "Attendance tracking and records",
    icon: <People />,
    endpoint: "/report/attendance",
    color: "#9c27b0",
    bgColor: alpha("#9c27b0", 0.1),
    columns: [
      { field: "employee", label: "Employee", type: "user" },
      { field: "date", label: "Date", type: "date" },
      { field: "punchInTime", label: "Punch In", type: "time" },
      { field: "punchOutTime", label: "Punch Out", type: "time" },
      { field: "workHours", label: "Work Hours", type: "hours" },
      { field: "status", label: "Status", type: "status" },
      { field: "punchInLocation", label: "Punch In Location", type: "location" },
      { field: "punchInAddress", label: "Punch In Address", type: "string" },
      { field: "punchOutLocation", label: "Punch Out Location", type: "location" },
      { field: "punchOutAddress", label: "Punch Out Address", type: "string" },
      { field: "overtime", label: "Overtime", type: "hours" },
      { field: "createdAt", label: "Created", type: "date" },
      { field: "updatedAt", label: "Updated", type: "date" },
    ],
  },
];

// ========== MOBILE FILTER DRAWER ==========
const MobileFilterDrawer = ({
  open,
  onClose,
  dateRange,
  setDateRange,
  handleClearFilters,
  activeFilterCount,
}) => {
  const [expandedSection, setExpandedSection] = useState("date");

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen={false}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: "90vh",
          overflow: "hidden",
        },
      }}
    >
      <Box sx={{ position: "relative" }}>
        {/* Drag Handle */}
        <Box
          sx={{
            width: 40,
            height: 4,
            bgcolor: "grey.300",
            borderRadius: 2,
            mx: "auto",
            my: 1.5,
          }}
        />

        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 3,
            pb: 2,
            borderBottom: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="700" color={PRIMARY_COLOR}>
              Filter Reports
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {activeFilterCount} active filter{activeFilterCount !== 1 && "s"}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ bgcolor: alpha(PRIMARY_COLOR, 0.1) }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Filter Content */}
        <Box sx={{ maxHeight: "calc(90vh - 120px)", overflow: "auto", p: 3 }}>
          <Stack spacing={2.5}>
            {/* Date Range Section */}
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bgcolor: alpha(PRIMARY_COLOR, 0.02),
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => toggleSection("date")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <DateRange sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Time Period
                  </Typography>
                </Stack>
                {expandedSection === "date" ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={expandedSection === "date"}>
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={1}>
                    {PERIOD_OPTIONS.map((option) => (
                      <Grid item xs={6} key={option.value}>
                        <Button
                          fullWidth
                          variant={
                            dateRange === option.value ? "contained" : "outlined"
                          }
                          onClick={() => setDateRange(option.value)}
                          startIcon={option.icon}
                          size="small"
                          sx={{
                            bgcolor:
                              dateRange === option.value
                                ? PRIMARY_COLOR
                                : "transparent",
                            color:
                              dateRange === option.value ? "#fff" : PRIMARY_COLOR,
                            borderColor: PRIMARY_COLOR,
                            "&:hover": {
                              bgcolor:
                                dateRange === option.value
                                  ? SECONDARY_COLOR
                                  : alpha(PRIMARY_COLOR, 0.1),
                            },
                          }}
                        >
                          {option.label}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Collapse>
            </Paper>
          </Stack>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            p: 3,
            borderTop: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
            bgcolor: "#fff",
          }}
        >
          <Stack direction="row" spacing={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                handleClearFilters();
                onClose();
              }}
              startIcon={<Clear />}
              sx={{
                borderColor: PRIMARY_COLOR,
                color: PRIMARY_COLOR,
                "&:hover": {
                  bgcolor: alpha(PRIMARY_COLOR, 0.05),
                },
              }}
            >
              Clear All
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={onClose}
              sx={{
                bgcolor: PRIMARY_COLOR,
                "&:hover": {
                  bgcolor: SECONDARY_COLOR,
                },
              }}
            >
              Apply Filters
            </Button>
          </Stack>
        </Box>
      </Box>
    </SwipeableDrawer>
  );
};

// ========== MOBILE REPORT CARD ==========
const MobileReportCard = ({
  report,
  data,
  stats,
  onView,
  onDownload,
  downloading,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Paper
      sx={{
        mb: 1.5,
        borderRadius: 3,
        border: `1px solid ${alpha(report.color, 0.2)}`,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {downloading && (
        <LinearProgress
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: alpha(report.color, 0.1),
            "& .MuiLinearProgress-bar": { bgcolor: report.color },
          }}
        />
      )}

      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Avatar
              sx={{
                bgcolor: report.bgColor,
                color: report.color,
                width: 48,
                height: 48,
              }}
            >
              {React.cloneElement(report.icon, { sx: { fontSize: 24 } })}
            </Avatar>
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight="700"
                color={PRIMARY_COLOR}
              >
                {report.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {report.description}
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              transform: expanded ? "rotate(180deg)" : "none",
              transition: "transform 0.3s",
              bgcolor: alpha(report.color, 0.1),
            }}
          >
            <ExpandMore />
          </IconButton>
        </Box>

        {/* Quick Stats */}
        <Box
          sx={{
            bgcolor: alpha(report.color, 0.05),
            borderRadius: 2,
            p: 1.5,
            mb: 1.5,
          }}
        >
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Records
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ color: report.color }}>
                {data?.length || 0}
              </Typography>
            </Grid>
            {stats && Object.entries(stats).filter(([key]) => key !== "role").slice(0, 3).map(([key, value]) => (
              <Grid item xs={6} key={key}>
                <Typography variant="caption" color="text.secondary">
                  {key}:
                </Typography>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {value}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Record Count & Role */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <InsertDriveFile sx={{ color: alpha(report.color, 0.5), fontSize: 16 }} />
            <Typography variant="body2" color="text.secondary">
              {data?.length || 0} records
            </Typography>
          </Box>
          <Chip
            label={stats?.role || ""}
            size="small"
            sx={{
              bgcolor: alpha(PRIMARY_COLOR, 0.1),
              color: PRIMARY_COLOR,
              height: 20,
              fontSize: "0.6rem",
            }}
          />
        </Box>

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: `1px solid ${alpha(report.color, 0.1)}`,
            }}
          >
            {/* Detailed Stats */}
            {stats && Object.entries(stats).filter(([key]) => key !== "role").map(([key, value]) => (
              <Box
                key={key}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {key}:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {value}
                </Typography>
              </Box>
            ))}

            {/* Action Buttons */}
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                fullWidth
                size="small"
                variant="contained"
                onClick={() => onDownload(report.key)}
                disabled={downloading || !data?.length}
                startIcon={downloading ? <CircularProgress size={16} /> : <Download />}
                sx={{
                  bgcolor: report.color,
                  borderRadius: 2,
                  "&:hover": { bgcolor: SECONDARY_COLOR },
                  "&:disabled": { bgcolor: alpha(report.color, 0.3) },
                }}
              >
                {downloading ? "..." : "Download"}
              </Button>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                onClick={() => onView(report.key)}
                disabled={!data?.length}
                startIcon={<Visibility />}
                sx={{
                  borderColor: report.color,
                  color: report.color,
                  borderRadius: 2,
                  "&:hover": {
                    borderColor: SECONDARY_COLOR,
                    bgcolor: alpha(report.color, 0.05),
                  },
                }}
              >
                View
              </Button>
            </Stack>
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
};

// Desktop Report Card
const DesktopReportCard = ({
  report,
  data,
  stats,
  onView,
  onDownload,
  downloading,
}) => {
  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        bgcolor: "white",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        border: `1px solid ${alpha(report.color, 0.1)}`,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          transform: "translateY(-2px)",
          borderColor: report.color,
        },
      }}
    >
      {downloading && (
        <LinearProgress
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            bgcolor: alpha(report.color, 0.1),
            "& .MuiLinearProgress-bar": { bgcolor: report.color },
          }}
        />
      )}

      <CardContent sx={{ p: 3 }}>
        {/* Header with Icon */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              bgcolor: report.bgColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: report.color,
            }}
          >
            {React.cloneElement(report.icon, { sx: { fontSize: 28 } })}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {report.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {report.description}
            </Typography>
          </Box>
        </Box>

        {/* Stats */}
        {stats && (
          <Box sx={{ mb: 2 }}>
            {Object.entries(stats).filter(([key]) => key !== "role").map(([key, value]) => (
              <Box
                key={key}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {key}:
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{ color: report.color }}
                >
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Record Count */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <InsertDriveFile
              sx={{ color: alpha(report.color, 0.5), fontSize: 20 }}
            />
            <Typography variant="body2" color="text.secondary">
              {data?.length || 0} records
            </Typography>
          </Box>
          <Chip
            label={stats?.role || ""}
            size="small"
            sx={{
              bgcolor: alpha(PRIMARY_COLOR, 0.1),
              color: PRIMARY_COLOR,
              fontSize: "0.7rem",
            }}
          />
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => onDownload(report.key)}
            disabled={downloading || !data?.length}
            startIcon={downloading ? <CircularProgress size={20} /> : <Download />}
            sx={{
              bgcolor: report.color,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { bgcolor: SECONDARY_COLOR },
              "&:disabled": { bgcolor: alpha(report.color, 0.3) },
            }}
          >
            {downloading ? "Downloading..." : "Download"}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => onView(report.key)}
            disabled={!data?.length}
            startIcon={<Visibility />}
            sx={{
              borderColor: report.color,
              color: report.color,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                borderColor: SECONDARY_COLOR,
                bgcolor: alpha(report.color, 0.05),
              },
            }}
          >
            View
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Report Details Modal
const ReportDetailsModal = ({ open, onClose, report, data, userRole }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    field: null,
    direction: "asc",
  });

  const filteredData = useMemo(() => {
    if (!data || !report) return [];
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === "object") {
          if (val.firstName) {
            return `${val.firstName} ${val.lastName || ""}`.toLowerCase().includes(term);
          }
          return JSON.stringify(val).toLowerCase().includes(term);
        }
        return val?.toString().toLowerCase().includes(term);
      }),
    );
  }, [data, searchTerm, report]);

  const sortedData = useMemo(() => {
    if (!sortConfig.field) return filteredData;
    return [...filteredData].sort((a, b) => {
      let aVal = a[sortConfig.field];
      let bVal = b[sortConfig.field];

      if (typeof aVal === "object" && aVal !== null) {
        if (aVal.firstName) {
          aVal = `${aVal.firstName} ${aVal.lastName || ""}`;
          bVal = `${bVal?.firstName || ""} ${bVal?.lastName || ""}`;
        } else {
          aVal = JSON.stringify(aVal);
          bVal = JSON.stringify(bVal);
        }
      }

      if (
        sortConfig.field.includes("Date") ||
        sortConfig.field.includes("At") ||
        sortConfig.field.includes("time")
      ) {
        aVal = aVal ? new Date(aVal) : new Date(0);
        bVal = bVal ? new Date(bVal) : new Date(0);
      }

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  if (!data || !report) return null;

  const paginatedData = sortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleSort = (field) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const formatCellValue = (value, column) => {
    if (!value && value !== 0) return "—";

    switch (column.type) {
      case "date":
        return formatDate(value);
      case "time":
        return value ? format(new Date(value), "hh:mm a") : "—";
      case "hours":
        if (value === 0) return "0 hrs";
        return value ? `${value} hrs` : "—";
      case "amount":
        return `₹${Number(value).toLocaleString()}`;
      case "user":
        if (typeof value === "object" && value !== null) {
          if (value.firstName) {
            return `${value.firstName} ${value.lastName || ""}`.trim() || "—";
          }
          return value.name || "—";
        }
        return value || "—";
      case "location":
        if (typeof value === "object" && value !== null) {
          return `${value.lat?.toFixed(4) || ""}, ${value.lng?.toFixed(4) || ""}`;
        }
        return value || "—";
      case "status":
        const statusConfig = ATTENDANCE_STATUS[value] || {
          label: value,
          color: PRIMARY_COLOR,
          bgColor: alpha(PRIMARY_COLOR, 0.1),
        };
        return (
          <Chip
            label={statusConfig.label}
            size="small"
            sx={{
              bgcolor: statusConfig.bgColor,
              color: statusConfig.color,
              fontSize: "0.7rem",
              height: 24,
              fontWeight: 600,
            }}
          />
        );
      default:
        return value || "—";
    }
  };

  // Transform attendance data for display
  const transformAttendanceData = (item) => {
    if (report.key !== "attendance") return item;
    
    return {
      ...item,
      employee: item.user || "—",
      punchInTime: item.punchIn?.time,
      punchOutTime: item.punchOut?.time,
      punchInLocation: item.punchIn?.location,
      punchInAddress: item.punchIn?.address,
      punchOutLocation: item.punchOut?.location,
      punchOutAddress: item.punchOut?.address,
      workHours: item.workHours,
      overtime: item.overtime,
    };
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          overflow: "hidden",
          height: isMobile ? "100%" : "auto",
        },
      }}
      TransitionComponent={isMobile ? Slide : Fade}
      TransitionProps={isMobile ? { direction: "up" } : undefined}
      transitionDuration={300}
    >
      <DialogTitle
        sx={{
          bgcolor: PRIMARY_COLOR,
          color: "white",
          py: 2,
          px: { xs: 2, sm: 3 },
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {React.cloneElement(report.icon, { sx: { color: "white", fontSize: { xs: 18, sm: 20 } } })}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                {report.title}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {filteredData.length} records • {userRole} view
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: "white" }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Search Bar */}
        <Box
          sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: "divider" }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Search in report..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <Close fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Table */}
        {paginatedData.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, px: 2 }}>
            <Assessment sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              {searchTerm ? "No matching records found" : "No data available"}
            </Typography>
            {searchTerm && (
              <Button
                variant="text"
                onClick={() => setSearchTerm("")}
                sx={{ mt: 2, color: PRIMARY_COLOR }}
              >
                Clear Search
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: { xs: "calc(100vh - 200px)", sm: "50vh" }, overflow: "auto" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {report.columns.map((col) => (
                    <TableCell
                      key={col.field}
                      sx={{
                        bgcolor: alpha(PRIMARY_COLOR, 0.05),
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      }}
                      onClick={() => handleSort(col.field)}
                    >
                      <Box display="flex" alignItems="center" gap={0.5}>
                        {col.label}
                        {sortConfig.field === col.field &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUpward sx={{ fontSize: 14 }} />
                          ) : (
                            <ArrowDownward sx={{ fontSize: 14 }} />
                          ))}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((row, index) => {
                  const displayRow = transformAttendanceData(row);
                  return (
                    <TableRow
                      key={index}
                      hover
                      sx={{
                        "&:hover": { bgcolor: alpha(PRIMARY_COLOR, 0.02) },
                      }}
                    >
                      {report.columns.map((col) => (
                        <TableCell
                          key={col.field}
                          sx={{
                            whiteSpace: "nowrap",
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          }}
                        >
                          {formatCellValue(displayRow[col.field], col)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {filteredData.length > 0 && (
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              borderTop: 1,
              borderColor: "divider",
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
              Showing {page * rowsPerPage + 1} to{" "}
              {Math.min((page + 1) * rowsPerPage, filteredData.length)} of{" "}
              {filteredData.length} entries
            </Typography>
            <TablePagination
              component="div"
              count={filteredData.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ m: 0 }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: "grey.50",
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth={isMobile}
          sx={{
            borderRadius: 2,
            px: 4,
            borderColor: PRIMARY_COLOR,
            color: PRIMARY_COLOR,
            "&:hover": {
              borderColor: SECONDARY_COLOR,
              bgcolor: alpha(PRIMARY_COLOR, 0.05),
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Loading Skeleton
const LoadingSkeleton = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Grid container spacing={isMobile ? 1.5 : 2} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={6} sm={6} md={3} key={item}>
            <Skeleton
              variant="rectangular"
              height={isMobile ? 90 : 120}
              sx={{ borderRadius: 3 }}
            />
          </Grid>
        ))}
      </Grid>
      {isMobile && (
        <Skeleton
          variant="rectangular"
          height={56}
          sx={{ borderRadius: 2, mb: 2 }}
        />
      )}
      <Skeleton
        variant="rectangular"
        height={isMobile ? 500 : 400}
        sx={{ borderRadius: 3, mb: 2 }}
      />
      <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
    </Box>
  );
};

// Empty State
const EmptyState = ({ onRefresh, hasFilters, onClearFilters }) => (
  <Box sx={{ textAlign: "center", py: 8, px: 2 }}>
    <Box
      sx={{
        width: 120,
        height: 120,
        borderRadius: "50%",
        bgcolor: alpha(PRIMARY_COLOR, 0.1),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mx: "auto",
        mb: 3,
      }}
    >
      <Info sx={{ fontSize: 48, color: PRIMARY_COLOR }} />
    </Box>
    <Typography variant="h6" fontWeight={600} gutterBottom>
      No data available
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
    >
      {hasFilters
        ? "No data matches your current filters. Try adjusting your date range."
        : "No data available for the selected period."}
    </Typography>
    {hasFilters ? (
      <Button
        variant="contained"
        onClick={onClearFilters}
        startIcon={<Clear />}
        sx={{ bgcolor: PRIMARY_COLOR, "&:hover": { bgcolor: SECONDARY_COLOR } }}
      >
        Clear Filters
      </Button>
    ) : (
      <Button
        variant="contained"
        onClick={onRefresh}
        startIcon={<Refresh />}
        sx={{ bgcolor: PRIMARY_COLOR, "&:hover": { bgcolor: SECONDARY_COLOR } }}
      >
        Refresh Data
      </Button>
    )}
  </Box>
);

// Utility function to format dates
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const parsedDate = parseISO(dateString);
    return isValid(parsedDate)
      ? format(parsedDate, "MMM dd, yyyy")
      : "Invalid date";
  } catch {
    return "Invalid date";
  }
};

export default function ReportsPage() {
  const { user, fetchAPI } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const userRole = user?.role || "TEAM";
  const roleConfig = ROLE_ACCESS[userRole] || ROLE_ACCESS.TEAM;

  // State management
  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState({});
  const [reportsStats, setReportsStats] = useState({});
  const [downloading, setDownloading] = useState({});
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [dateRange, setDateRange] = useState("all");
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [bottomNavValue, setBottomNavValue] = useState(1);

  // Refs
  const containerRef = useRef(null);

  // Filter reports based on role access
  const accessibleReports = useMemo(
    () => REPORT_CONFIGS.filter((report) => roleConfig.canAccess.includes(report.key)),
    [roleConfig],
  );

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (dateRange !== "all") count++;
    return count;
  }, [dateRange]);

  // Show snackbar message
  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Download CSV function
  const downloadCSV = useCallback(async (report, data) => {
    const headers = report.columns.map((col) => col.label);
    const rows = data.map((item) => {
      // Transform attendance data for CSV
      let displayItem = item;
      if (report.key === "attendance") {
        displayItem = {
          ...item,
          employee: item.user ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim() : "—",
          punchInTime: item.punchIn?.time ? format(new Date(item.punchIn.time), "hh:mm a") : "—",
          punchOutTime: item.punchOut?.time ? format(new Date(item.punchOut.time), "hh:mm a") : "—",
          workHours: item.workHours ? `${item.workHours} hrs` : "0 hrs",
          overtime: item.overtime ? `${item.overtime} hrs` : "0 hrs",
          punchInLocation: item.punchIn?.location ? 
            `${item.punchIn.location.lat?.toFixed(4) || ""}, ${item.punchIn.location.lng?.toFixed(4) || ""}` : "—",
          punchInAddress: item.punchIn?.address || "—",
          punchOutLocation: item.punchOut?.location ? 
            `${item.punchOut.location.lat?.toFixed(4) || ""}, ${item.punchOut.location.lng?.toFixed(4) || ""}` : "—",
          punchOutAddress: item.punchOut?.address || "—",
        };
      }

      return report.columns
        .map((col) => {
          let rawValue = displayItem[col.field];
          let displayValue;

          if (rawValue === null || rawValue === undefined) {
            displayValue = "";
          } else if (typeof rawValue === "object") {
            if (col.type === "user") {
              if (rawValue.firstName) {
                displayValue = `${rawValue.firstName || ""} ${rawValue.lastName || ""}`.trim();
              } else {
                displayValue = JSON.stringify(rawValue);
              }
            } else {
              displayValue = JSON.stringify(rawValue);
            }
          } else if (col.type === "date" && rawValue) {
            displayValue = formatDate(rawValue);
          } else if (col.type === "amount" && rawValue != null) {
            displayValue = `₹${rawValue}`;
          } else if (col.type === "hours" && rawValue != null) {
            displayValue = `${rawValue} hrs`;
          } else if (col.type === "time" && rawValue) {
            displayValue = format(new Date(rawValue), "hh:mm a");
          } else {
            displayValue = String(rawValue);
          }

          const strValue = String(displayValue);
          if (strValue.includes(",") || strValue.includes('"') || strValue.includes("\n")) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        })
        .join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.title.replace(/\s+/g, "_")}_${format(
      new Date(),
      "yyyy-MM-dd",
    )}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Fetch all reports
  const fetchAllReports = useCallback(async () => {
    setLoading(true);
    try {
      const results = {};
      const stats = {};

      for (const report of accessibleReports) {
        try {
          let endpoint = report.endpoint;
          const params = new URLSearchParams();

          if (dateRange === "today") {
            params.append("fromDate", format(new Date(), "yyyy-MM-dd"));
            params.append("toDate", format(new Date(), "yyyy-MM-dd"));
          } else if (dateRange === "week") {
            params.append(
              "fromDate",
              format(subDays(new Date(), 7), "yyyy-MM-dd"),
            );
            params.append("toDate", format(new Date(), "yyyy-MM-dd"));
          } else if (dateRange === "month") {
            params.append(
              "fromDate",
              format(subMonths(new Date(), 1), "yyyy-MM-dd"),
            );
            params.append("toDate", format(new Date(), "yyyy-MM-dd"));
          }

          const queryString = params.toString();
          if (queryString) {
            endpoint += `?${queryString}`;
          }

          const response = await fetchAPI(endpoint);

          if (response?.success) {
            const result = response.result || {};

            let data = [];
            if (report.key === "leads") {
              data = result.leads || [];
              stats[report.key] = {
                "Total Leads": result.totalLeads ?? data.length,
                "Active": data.filter(
                  (lead) =>
                    lead.status === "Visit" || lead.status === "Registration",
                ).length,
                "Converted": data.filter(
                  (lead) => lead.status === "Installation Completion",
                ).length,
                role: userRole,
              };
            } else if (report.key === "installation") {
              data = result.installations || [];
              stats[report.key] = {
                "Total": result.totalInstallations ?? data.length,
                "Completed": result.completed ?? 0,
                "Pending": result.pending ?? 0,
                role: userRole,
              };
            } else if (report.key === "expenses") {
              data = result.expenses || [];
              stats[report.key] = {
                "Total": result.totalExpenses ?? data.length,
                "Amount": result.totalAmount != null
                  ? `₹${Number(result.totalAmount).toLocaleString()}`
                  : "₹0",
                "Approved": data.filter((item) => item.status === "Approved").length,
                "Pending": data.filter((item) => item.status === "Pending").length,
                role: userRole,
              };
            } else if (report.key === "attendance") {
              data = result.attendance || [];
              const totalWorkHours = data.reduce((sum, item) => sum + (item.workHours || 0), 0);
              const avgWorkHours = data.length > 0 ? (totalWorkHours / data.length).toFixed(1) : 0;
              
              stats[report.key] = {
                "Total Records": result.totalRecords ?? data.length,
                "Present": result.presentCount ?? data.filter((item) => item.status === "present").length,
                "Total Hours": `${totalWorkHours.toFixed(1)} hrs`,
                "Avg Hours": `${avgWorkHours} hrs`,
                "Overtime": `${(result.totalOvertime || 0).toFixed(1)} hrs`,
                role: userRole,
              };
            }

            results[report.key] = data;
          } else {
            results[report.key] = [];
            console.error(
              `Failed to fetch ${report.title}:`,
              response?.message,
            );
          }
        } catch (error) {
          console.error(`Error fetching ${report.title}:`, error);
          results[report.key] = [];
        }
      }

      setReportsData(results);
      setReportsStats(stats);
    } catch (error) {
      console.error("Error fetching reports:", error);
      showSnackbar("Failed to load reports", "error");
    } finally {
      setLoading(false);
    }
  }, [accessibleReports, fetchAPI, dateRange, userRole, showSnackbar]);

  // Initial fetch
  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports, dateRange]);

  // Handle view report
  const handleView = useCallback(
    (reportKey) => {
      const report = accessibleReports.find((r) => r.key === reportKey);
      setSelectedReport({
        ...report,
        data: reportsData[reportKey] || [],
      });
      setViewModalOpen(true);
    },
    [accessibleReports, reportsData],
  );

  // Handle download
  const handleDownload = useCallback(
    async (reportKey) => {
      const report = accessibleReports.find((r) => r.key === reportKey);
      const data = reportsData[reportKey] || [];

      if (data.length === 0) {
        showSnackbar("No data available to download", "warning");
        return;
      }

      setDownloading((prev) => ({ ...prev, [reportKey]: true }));

      try {
        await downloadCSV(report, data);
        showSnackbar(`${report.title} downloaded successfully!`, "success");
      } catch (error) {
        console.error("Download failed:", error);
        showSnackbar(`Failed to download ${report.title}`, "error");
      } finally {
        setDownloading((prev) => ({ ...prev, [reportKey]: false }));
      }
    },
    [accessibleReports, reportsData, downloadCSV, showSnackbar],
  );

  // Handle bulk download
  const handleBulkDownload = useCallback(async () => {
    const reportsWithData = accessibleReports.filter(
      (r) => reportsData[r.key]?.length > 0,
    );

    if (reportsWithData.length === 0) {
      showSnackbar("No data available to download", "warning");
      return;
    }

    setAnchorEl(null);

    for (const report of reportsWithData) {
      await handleDownload(report.key);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    showSnackbar("All reports downloaded successfully!", "success");
  }, [accessibleReports, reportsData, handleDownload, showSnackbar]);

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setDateRange("all");
  };

  // Loading skeletons
  if (loading && !Object.keys(reportsData).length) {
    return <LoadingSkeleton />;
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        p: { xs: 1.5, sm: 2, md: 3 },
        minHeight: "100vh",
        pb: { xs: 8, sm: 3 },
        bgcolor: "#f8fafc",
      }}
    >
      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        dateRange={dateRange}
        setDateRange={setDateRange}
        handleClearFilters={handleClearFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Header with Gradient Background */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`,
          color: "#fff",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Box>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              fontWeight={700}
              gutterBottom
            >
              Reports Dashboard
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: "0.7rem", sm: "0.875rem" },
                }}
              >
                Viewing as:
              </Typography>
              <Chip
                icon={React.cloneElement(roleConfig.icon, { sx: { fontSize: 14 } })}
                label={roleConfig.label}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  fontWeight: 600,
                  height: { xs: 20, sm: 24 },
                  "& .MuiChip-icon": { color: "#fff" },
                }}
              />
            </Stack>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            {isMobile && (
              <Button
                variant="contained"
                startIcon={<FilterAlt />}
                onClick={() => setMobileFilterOpen(true)}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                  position: "relative",
                }}
              >
                Filter
                {activeFilterCount > 0 && (
                  <Badge
                    badgeContent={activeFilterCount}
                    color="error"
                    sx={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      "& .MuiBadge-badge": {
                        fontSize: "0.6rem",
                        minWidth: 16,
                        height: 16,
                      },
                    }}
                  />
                )}
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchAllReports}
              disabled={loading}
              size={isMobile ? "small" : "medium"}
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<CloudDownload />}
              onClick={handleBulkDownload}
              disabled={
                loading ||
                accessibleReports.every((r) => !reportsData[r.key]?.length)
              }
              size={isMobile ? "small" : "medium"}
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
              }}
            >
              {isMobile ? "Download" : "Download All"}
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Desktop Date Range Filter */}
      {!isMobile && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <DateRange sx={{ color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              Time Period:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                displayEmpty
                sx={{ borderRadius: 2 }}
              >
                {PERIOD_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {option.icon}
                      <span>{option.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {activeFilterCount > 0 && (
              <Button
                variant="text"
                startIcon={<Clear />}
                onClick={handleClearFilters}
                size="small"
                sx={{ color: "error.main" }}
              >
                Clear Filter
              </Button>
            )}
          </Stack>
        </Paper>
      )}

      {/* Reports Grid */}
      {accessibleReports.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Assessment
            sx={{ fontSize: 64, color: alpha(PRIMARY_COLOR, 0.3), mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No reports available for your role
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Contact your administrator for access.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={isMobile ? 1.5 : 3}>
          {accessibleReports.map((report) => (
            <Grid item xs={12} md={4} key={report.key}>
              {isMobile ? (
                <MobileReportCard
                  report={report}
                  data={reportsData[report.key]}
                  stats={reportsStats[report.key]}
                  onView={handleView}
                  onDownload={handleDownload}
                  downloading={downloading[report.key]}
                />
              ) : (
                <DesktopReportCard
                  report={report}
                  data={reportsData[report.key]}
                  stats={reportsStats[report.key]}
                  onView={handleView}
                  onDownload={handleDownload}
                  downloading={downloading[report.key]}
                />
              )}
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {!loading &&
        accessibleReports.length > 0 &&
        accessibleReports.every((r) => !reportsData[r.key]?.length) && (
          <Box sx={{ mt: 4 }}>
            <EmptyState
              onRefresh={fetchAllReports}
              hasFilters={activeFilterCount > 0}
              onClearFilters={handleClearFilters}
            />
          </Box>
        )}

      {/* View Details Modal */}
      <ReportDetailsModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
        data={selectedReport?.data || []}
        userRole={roleConfig.label}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{
          vertical: isMobile ? "top" : "bottom",
          horizontal: isMobile ? "center" : "right",
        }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 , color:"#fff"}}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Mobile FAB */}
      {isMobile && (
        <Zoom in={true}>
          <Fab
            color="primary"
            aria-label="filter"
            onClick={() => setMobileFilterOpen(true)}
            sx={{
              position: "fixed",
              bottom: 80,
              right: 16,
              zIndex: 1000,
              bgcolor: PRIMARY_COLOR,
              "&:hover": { bgcolor: SECONDARY_COLOR },
              boxShadow: `0 4px 12px ${alpha(PRIMARY_COLOR, 0.3)}`,
            }}
          >
            <Badge
              badgeContent={activeFilterCount}
              color="error"
              max={9}
              sx={{
                "& .MuiBadge-badge": {
                  fontSize: "0.6rem",
                  minWidth: 16,
                  height: 16,
                },
              }}
            >
              <FilterAlt />
            </Badge>
          </Fab>
        </Zoom>
      )}
    </Box>
  );
}