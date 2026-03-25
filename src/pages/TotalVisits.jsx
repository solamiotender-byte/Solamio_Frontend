// pages/TotalVisitsPage.jsx (Bug-Free Version)
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Box,
  Typography,
  Card,
  Grid,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Alert,
  AlertTitle,
  CircularProgress,
  Button,
  Tooltip,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  useTheme,
  useMediaQuery,
  alpha,
  Avatar,
  Divider,
  Paper,
  LinearProgress,
  CardContent,
  Tab,
  Tabs,
  Skeleton,
  FormHelperText,
  Pagination,
  SwipeableDrawer,
  Badge,
  Fab,
  Zoom,
  Fade,
  Slide,
  Collapse,
  BottomNavigation,
  BottomNavigationAction,
} from "@mui/material";
import {
  Edit,
  Visibility,
  Close,
  CheckCircle,
  Search,
  FilterList,
  Clear,
  ArrowUpward,
  ArrowDownward,
  Phone,
  Email,
  Schedule,
  CheckCircleOutline,
  PendingActions,
  Cancel,
  Refresh,
  Tune,
  Download,
  People,
  TrendingUp,
  Warning,
  Info,
  LocationOn,
  Notes,
  CalendarToday,
  AccessTime,
  Person,
  HowToReg,
  SupervisorAccount,
  AdminPanelSettings,
  WorkspacePremium,
  Groups,
  ExpandMore,
  ExpandLess,
  Dashboard,
  FilterAlt,
  Sort,
  ViewList,
  ViewModule,
  DateRange,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  FiberManualRecord,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  format,
  isValid,
  parseISO,
  startOfDay,
  endOfDay,
  subDays,
  subWeeks,
  subMonths,
} from "date-fns";
import { useNavigate } from "react-router-dom";
import Save from "@mui/icons-material/Save";

// ========== CONSTANTS & CONFIGURATION ==========
const PRIMARY_COLOR = "#4569ea";
const SECONDARY_COLOR = "#1a237e";
const ERROR_COLOR = "#f44336";
const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_ITEMS_PER_PAGE = 20;

// All roles have access
const ALLOWED_ROLES = ["Head_office", "ZSM", "ASM", "TEAM"];
const hasAccess = (userRole) => ALLOWED_ROLES.includes(userRole);

// Enhanced Status Configuration
const STATUS_CONFIG = {
  "Not Assigned": {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    icon: <PendingActions sx={{ fontSize: 16 }} />,
    label: "Not Assigned",
    description: "Visit not yet assigned or scheduled",
    order: 1,
    progress: 0,
  },
  Scheduled: {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    icon: <Schedule sx={{ fontSize: 16 }} />,
    label: "Scheduled",
    description: "Visit scheduled for future date",
    order: 2,
    progress: 25,
  },
  Completed: {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    icon: <CheckCircleOutline sx={{ fontSize: 16 }} />,
    label: "Completed",
    description: "Visit successfully completed",
    order: 3,
    progress: 100,
  },
  Cancelled: {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    icon: <Cancel sx={{ fontSize: 16 }} />,
    label: "Cancelled",
    description: "Visit cancelled or postponed",
    order: 4,
    progress: 0,
  },
};

// Lead Status Configuration — now includes 'Other'
const LEAD_STATUS_CONFIG = {
  Visit: {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    icon: <Person sx={{ fontSize: 16 }} />,
    label: "Visit",
    description: "Visit scheduled or completed",
  },
  Registration: {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    icon: <HowToReg sx={{ fontSize: 16 }} />,
    label: "Registration",
    description: "Lead registered after visit",
  },
  "Missed Leads": {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    icon: <Warning sx={{ fontSize: 16 }} />,
    label: "Missed",
    description: "Lead missed or lost",
  },
  // ── NEW: 'Other' status for visits where isLeadCreated === 'other' ────────
  Other: {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    icon: <Info sx={{ fontSize: 16 }} />,
    label: "Other",
    description: "Other visit type — no lead created",
  },
};

// Role Configuration
const ROLE_CONFIG = {
  Head_office: {
    label: "Head Office",
    color: PRIMARY_COLOR,
    icon: <AdminPanelSettings sx={{ fontSize: 16 }} />,
  },
  ZSM: {
    label: "Zone Sales Manager",
    color: PRIMARY_COLOR,
    icon: <WorkspacePremium sx={{ fontSize: 16 }} />,
  },
  ASM: {
    label: "Area Sales Manager",
    color: PRIMARY_COLOR,
    icon: <SupervisorAccount sx={{ fontSize: 16 }} />,
  },
  TEAM: {
    label: "Team Member",
    color: PRIMARY_COLOR,
    icon: <Groups sx={{ fontSize: 16 }} />,
  },
};

// Period Options
const PERIOD_OPTIONS = [
  { value: "Today", label: "Today", icon: <CalendarToday /> },
  { value: "This Week", label: "This Week", icon: <DateRange /> },
  { value: "This Month", label: "This Month", icon: <DateRange /> },
  { value: "All", label: "All Time", icon: <DateRange /> },
];

// ========== HELPER FUNCTIONS ==========
const getStatusConfig = (status) => {
  return (
    STATUS_CONFIG[status] || {
      bg: alpha(PRIMARY_COLOR, 0.08),
      color: PRIMARY_COLOR,
      icon: <PendingActions sx={{ fontSize: 16 }} />,
      label: status || "Unknown",
      description: "Unknown status",
      order: 5,
      progress: 0,
    }
  );
};

const getLeadStatusConfig = (status) => {
  return (
    LEAD_STATUS_CONFIG[status] || {
      bg: alpha(PRIMARY_COLOR, 0.08),
      color: PRIMARY_COLOR,
      icon: <Info sx={{ fontSize: 16 }} />,
      label: status || "Unknown",
      description: "Unknown lead status",
    }
  );
};

const getRoleConfig = (role) => {
  return (
    ROLE_CONFIG[role] || {
      label: "Unknown",
      color: PRIMARY_COLOR,
      icon: <Person sx={{ fontSize: 16 }} />,
    }
  );
};

const formatDate = (dateString, formatStr = "dd MMM yyyy, hh:mm a") => {
  if (!dateString) return "Not set";
  try {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, formatStr) : "Invalid Date";
  } catch {
    return "Invalid Date";
  }
};

const formatTime = (timeString) => {
  if (!timeString) return "Not set";
  return timeString;
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return "";

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return format(date, "dd MMM yyyy");
  } catch {
    return "";
  }
};

const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
};

// ========== REUSABLE COMPONENTS ==========

// Mobile Filter Drawer
const MobileFilterDrawer = ({
  open,
  onClose,
  period,
  setPeriod,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  selectedStatuses,
  handleStatusCheckboxChange,
  handleClearFilters,
  dateFilterError,
  searchQuery,
  setSearchQuery,
  sortConfig,
  setSortConfig,
  viewMode,
  setViewMode,
  activeFilterCount,
}) => {
  const [expandedSection, setExpandedSection] = useState("search");

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
              Filter Visits
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
            {/* Search Section */}
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
                onClick={() => toggleSection("search")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Search sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Search
                  </Typography>
                </Stack>
                {expandedSection === "search" ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={expandedSection === "search"}>
                <Box sx={{ p: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by name, email, phone, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search
                            sx={{ color: "text.secondary", fontSize: 20 }}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: searchQuery && (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => setSearchQuery("")}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Collapse>
            </Paper>

            {/* Period Section */}
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
                onClick={() => toggleSection("period")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <DateRange sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Time Period
                  </Typography>
                </Stack>
                {expandedSection === "period" ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={expandedSection === "period"}>
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={1}>
                    {PERIOD_OPTIONS.map((option) => (
                      <Grid item xs={6} key={option.value}>
                        <Button
                          fullWidth
                          variant={
                            period === option.value ? "contained" : "outlined"
                          }
                          onClick={() => setPeriod(option.value)}
                          startIcon={option.icon}
                          size="small"
                          sx={{
                            bgcolor:
                              period === option.value
                                ? PRIMARY_COLOR
                                : "transparent",
                            color:
                              period === option.value ? "#fff" : PRIMARY_COLOR,
                            borderColor: PRIMARY_COLOR,
                            "&:hover": {
                              bgcolor:
                                period === option.value
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

            {/* Status Section */}
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
                onClick={() => toggleSection("status")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <FilterAlt sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Visit Status
                  </Typography>
                </Stack>
                {expandedSection === "status" ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={expandedSection === "status"}>
                <Box sx={{ p: 2 }}>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="All">All Statuses</MenuItem>
                      {Object.keys(STATUS_CONFIG).map((status) => (
                        <MenuItem key={status} value={status}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            {getStatusConfig(status).icon}
                            <span>{status}</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                  >
                    Or select multiple:
                  </Typography>
                  <Grid container spacing={1}>
                    {Object.keys(STATUS_CONFIG).map((status) => (
                      <Grid item xs={6} key={status}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedStatuses[status]}
                              onChange={() =>
                                handleStatusCheckboxChange(status)
                              }
                              size="small"
                              sx={{
                                color: PRIMARY_COLOR,
                                "&.Mui-checked": {
                                  color: PRIMARY_COLOR,
                                },
                              }}
                            />
                          }
                          label={
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={0.5}
                            >
                              {getStatusConfig(status).icon}
                              <Typography variant="caption">
                                {status}
                              </Typography>
                            </Stack>
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Collapse>
            </Paper>

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
                  <CalendarToday sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Custom Date Range
                  </Typography>
                </Stack>
                {expandedSection === "date" ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={expandedSection === "date"}>
                <Box sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <DatePicker
                      label="Start Date"
                      value={dateFilter.startDate}
                      onChange={(newValue) =>
                        setDateFilter((prev) => ({
                          ...prev,
                          startDate: newValue,
                        }))
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!dateFilterError,
                        },
                      }}
                    />
                    <DatePicker
                      label="End Date"
                      value={dateFilter.endDate}
                      onChange={(newValue) =>
                        setDateFilter((prev) => ({
                          ...prev,
                          endDate: newValue,
                        }))
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!dateFilterError,
                        },
                      }}
                    />
                    {dateFilterError && (
                      <Alert severity="error" sx={{ fontSize: "0.75rem" }}>
                        {dateFilterError}
                      </Alert>
                    )}
                  </Stack>
                </Box>
              </Collapse>
            </Paper>

            {/* Sort Section */}
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
                onClick={() => toggleSection("sort")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Sort sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Sort By
                  </Typography>
                </Stack>
                {expandedSection === "sort" ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={expandedSection === "sort"}>
                <Box sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    {[
                      { key: "firstName", label: "Name" },
                      { key: "visitDate", label: "Visit Date" },
                      { key: "visitStatus", label: "Status" },
                    ].map((option) => (
                      <Button
                        key={option.key}
                        fullWidth
                        variant={
                          sortConfig.key === option.key
                            ? "contained"
                            : "outlined"
                        }
                        onClick={() =>
                          setSortConfig((prev) => ({
                            key: option.key,
                            direction:
                              prev.key === option.key &&
                              prev.direction === "asc"
                                ? "desc"
                                : "asc",
                          }))
                        }
                        endIcon={
                          sortConfig.key === option.key &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUpward fontSize="small" />
                          ) : (
                            <ArrowDownward fontSize="small" />
                          ))
                        }
                        sx={{
                          justifyContent: "space-between",
                          bgcolor:
                            sortConfig.key === option.key
                              ? PRIMARY_COLOR
                              : "transparent",
                          color:
                            sortConfig.key === option.key
                              ? "#fff"
                              : PRIMARY_COLOR,
                          borderColor: PRIMARY_COLOR,
                        }}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </Stack>
                </Box>
              </Collapse>
            </Paper>

            {/* View Mode Section */}
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
                onClick={() => toggleSection("view")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  {viewMode === "card" ? <ViewModule /> : <ViewList />}
                  <Typography variant="subtitle2" fontWeight={600}>
                    View Mode
                  </Typography>
                </Stack>
                {expandedSection === "view" ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={expandedSection === "view"}>
                <Box sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      fullWidth
                      variant={viewMode === "card" ? "contained" : "outlined"}
                      onClick={() => setViewMode("card")}
                      startIcon={<ViewModule />}
                      sx={{
                        bgcolor:
                          viewMode === "card" ? PRIMARY_COLOR : "transparent",
                        color: viewMode === "card" ? "#fff" : PRIMARY_COLOR,
                        borderColor: PRIMARY_COLOR,
                      }}
                    >
                      Card View
                    </Button>
                    <Button
                      fullWidth
                      variant={viewMode === "table" ? "contained" : "outlined"}
                      onClick={() => setViewMode("table")}
                      startIcon={<ViewList />}
                      sx={{
                        bgcolor:
                          viewMode === "table" ? PRIMARY_COLOR : "transparent",
                        color: viewMode === "table" ? "#fff" : PRIMARY_COLOR,
                        borderColor: PRIMARY_COLOR,
                      }}
                    >
                      List View
                    </Button>
                  </Stack>
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

// Mobile Visit Card
const MobileVisitCard = ({ visit, onView, onEdit }) => {
  const [expanded, setExpanded] = useState(false);

  const visitStatusConfig = getStatusConfig(visit.visitStatus);
  const leadStatusConfig = getLeadStatusConfig(visit.status);
  const initials = getInitials(visit.firstName, visit.lastName);

  return (
    <Paper
      sx={{
        mb: 1.5,
        borderRadius: 3,
        border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
        overflow: "hidden",
      }}
    >
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
                bgcolor: PRIMARY_COLOR,
                color: "#fff",
                width: 48,
                height: 48,
                fontWeight: 600,
              }}
            >
              {initials}
            </Avatar>
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight="700"
                color={PRIMARY_COLOR}
              >
                {visit.firstName} {visit.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {visit._id?.slice(-8) || "N/A"}
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              transform: expanded ? "rotate(180deg)" : "none",
              transition: "transform 0.3s",
              bgcolor: alpha(PRIMARY_COLOR, 0.1),
            }}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        {/* Quick Info */}
        <Grid container spacing={1} sx={{ mb: 1.5 }}>
          <Grid item xs={6}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Phone sx={{ fontSize: 14, color: alpha(PRIMARY_COLOR, 0.6) }} />
              <Typography variant="caption" noWrap>
                {visit.phone || "No phone"}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={6}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Email sx={{ fontSize: 14, color: alpha(PRIMARY_COLOR, 0.6) }} />
              <Typography variant="caption" noWrap>
                {visit.email || "No email"}
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        {/* Visit Info */}
        <Box sx={{ mb: 1.5 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 0.5 }}
          >
            

<CalendarToday
  sx={{ fontSize: 14, color: alpha(PRIMARY_COLOR, 0.6) }}
/>
<Typography variant="body2" fontWeight={500}>
  {visit.visitDate
    ? formatDate(visit.visitDate, "dd MMM yyyy")
    : formatDate(visit.createdAt, "dd MMM yyyy")}
</Typography>
<FiberManualRecord sx={{ fontSize: 4, color: "text.disabled" }} />
<AccessTime
  sx={{ fontSize: 14, color: alpha(PRIMARY_COLOR, 0.6) }}
/>
<Typography variant="body2" fontWeight={500}>
  {visit.visitTime
    ? formatTime(visit.visitTime)
    : formatDate(visit.createdAt, "hh:mm a")}
</Typography>


          </Stack>
          {visit.visitLocation && (
            <Stack direction="row" spacing={0.5} alignItems="flex-start">
              <LocationOn
                sx={{ fontSize: 14, color: alpha(PRIMARY_COLOR, 0.6), mt: 0.3 }}
              />
              <Typography variant="caption" color="text.secondary" noWrap>
                {visit.visitLocation}
              </Typography>
            </Stack>
          )}
        </Box>

        {/* Status Chips */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Tooltip title={visitStatusConfig.description} arrow>
            <Chip
              label={visitStatusConfig.label}
              icon={visitStatusConfig.icon}
              size="small"
              sx={{
                bgcolor: visitStatusConfig.bg,
                color: visitStatusConfig.color,
                fontWeight: 600,
                height: 24,
                fontSize: "0.7rem",
                "& .MuiChip-icon": { fontSize: 14 },
              }}
            />
          </Tooltip>
          <Tooltip title={leadStatusConfig.description} arrow>
            <Chip
              label={leadStatusConfig.label}
              icon={leadStatusConfig.icon}
              size="small"
              sx={{
                bgcolor: leadStatusConfig.bg,
                color: leadStatusConfig.color,
                fontWeight: 600,
                height: 24,
                fontSize: "0.7rem",
                "& .MuiChip-icon": { fontSize: 14 },
              }}
            />
          </Tooltip>
        </Box>

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
            }}
          >
            {/* Additional Info */}
            <Grid container spacing={2}>
              {visit.visitNotes && (
                <Grid item xs={12}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {visit.status === "Other" ? "Description" : "Notes"}
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                    {visit.visitNotes}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={6}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Created
                </Typography>
                <Typography variant="body2">
                  {formatDate(visit.createdAt, "dd MMM yyyy")}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {formatDate(visit.updatedAt, "dd MMM yyyy")}
                </Typography>
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                fullWidth
                size="small"
                variant="contained"
                startIcon={<Visibility />}
                onClick={() => onView(visit)}
                sx={{
                  bgcolor: PRIMARY_COLOR,
                  "&:hover": { bgcolor: SECONDARY_COLOR },
                }}
              >
                View
              </Button>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => onEdit(visit)}
                sx={{
                  borderColor: PRIMARY_COLOR,
                  color: PRIMARY_COLOR,
                  "&:hover": { bgcolor: alpha(PRIMARY_COLOR, 0.1) },
                }}
              >
                Edit
              </Button>
            </Stack>
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
};

// View Details Modal
const ViewVisitModal = React.memo(
  ({ open, onClose, visit, userRole, showSnackbar }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [activeTab, setActiveTab] = useState(0);

    const userRoleConfig = useMemo(() => getRoleConfig(userRole), [userRole]);
    const visitStatusConfig = useMemo(
      () => getStatusConfig(visit?.visitStatus),
      [visit?.visitStatus],
    );
    const leadStatusConfig = useMemo(
      () => getLeadStatusConfig(visit?.status),
      [visit?.status],
    );

    const handleTabChange = (event, newValue) => {
      setActiveTab(newValue);
    };

    if (!visit) return null;

    // Determine label for notes tab based on status
    const notesLabel = visit.status === "Other" ? "Description" : "Visit Notes";

    const tabs = [
      {
        label: "Basic Info",
        icon: <Person />,
        content: (
          <Stack spacing={2.5}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: alpha(PRIMARY_COLOR, 0.02),
                border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2.5,
                  color: PRIMARY_COLOR,
                  fontWeight: 600,
                }}
              >
                <Person sx={{ fontSize: 20 }} /> Personal Information
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Full Name
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {visit.firstName} {visit.lastName}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                    {visit.email || "Not set"}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body2">
                    {visit.phone || "Not set"}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: alpha(PRIMARY_COLOR, 0.02),
                border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2.5,
                  color: PRIMARY_COLOR,
                  fontWeight: 600,
                }}
              >
                <CalendarToday sx={{ fontSize: 20 }} /> Visit Information
              </Typography>
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Visit Status
                  </Typography>
                  <Chip
                    label={visitStatusConfig.label}
                    icon={visitStatusConfig.icon}
                    size="small"
                    sx={{
                      bgcolor: visitStatusConfig.bg,
                      color: visitStatusConfig.color,
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Divider />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Lead Status
                  </Typography>
                  <Chip
                    label={leadStatusConfig.label}
                    icon={leadStatusConfig.icon}
                    size="small"
                    sx={{
                      bgcolor: leadStatusConfig.bg,
                      color: leadStatusConfig.color,
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Visit Date
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
  {visit.visitDate
    ? formatDate(visit.visitDate, "dd MMM yyyy")
    : formatDate(visit.createdAt, "dd MMM yyyy")}
</Typography>
<FiberManualRecord sx={{ fontSize: 4, color: "text.disabled" }} />
<AccessTime sx={{ fontSize: 14, color: alpha(PRIMARY_COLOR, 0.6) }} />
<Typography variant="body2" fontWeight={500}>
  {visit.visitTime
    ? formatTime(visit.visitTime)
    : formatDate(visit.createdAt, "hh:mm a")}
</Typography>

                  <Typography variant="body2" fontWeight={500}>
                    {formatTime(visit.visitTime)}
                  </Typography>
                
                </Box>
              </Stack>
            </Paper>
          </Stack>
        ),
      },
      {
        label: "Location & Notes",
        icon: <LocationOn />,
        content: (
          <Stack spacing={2.5}>
            {visit.visitLocation && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: alpha(PRIMARY_COLOR, 0.02),
                  border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2,
                    color: PRIMARY_COLOR,
                    fontWeight: 600,
                  }}
                >
                  <LocationOn sx={{ fontSize: 20 }} /> Visit Location
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                  {visit.visitLocation}
                </Typography>
              </Paper>
            )}
            {visit.visitNotes && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: alpha(PRIMARY_COLOR, 0.02),
                  border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2,
                    color: PRIMARY_COLOR,
                    fontWeight: 600,
                  }}
                >
                  <Notes sx={{ fontSize: 20 }} /> {notesLabel}
                </Typography>
                <Typography
                  variant="body2"
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {visit.visitNotes}
                </Typography>
              </Paper>
            )}
            {/* Show a hint when no notes/location for 'Other' type */}
            {visit.status === "Other" && !visit.visitNotes && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: alpha(PRIMARY_COLOR, 0.02),
                  border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  No description was provided for this visit.
                </Typography>
              </Paper>
            )}
          </Stack>
        ),
      },
      {
        label: "Timeline",
        icon: <AccessTime />,
        content: (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: alpha(PRIMARY_COLOR, 0.02),
              border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2.5,
                color: PRIMARY_COLOR,
                fontWeight: 600,
              }}
            >
              <AccessTime sx={{ fontSize: 20 }} /> Activity Timeline
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Stack alignItems="flex-end">
                  <Typography variant="body2" fontWeight={500}>
                    {formatDate(visit.createdAt, "dd MMM yyyy")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(visit.createdAt, "hh:mm a")}
                  </Typography>
                </Stack>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Stack alignItems="flex-end">
                  <Typography variant="body2" fontWeight={500}>
                    {formatDate(visit.updatedAt, "dd MMM yyyy")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(visit.updatedAt, "hh:mm a")}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Paper>
        ),
      },
    ];

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 4,
            maxHeight: isMobile ? "100%" : "90vh",
            margin: isMobile ? 0 : 24,
          },
        }}
        TransitionComponent={isMobile ? Slide : Fade}
        transitionDuration={300}
      >
        <DialogTitle
          sx={{
            bgcolor: PRIMARY_COLOR,
            color: "white",
            pb: 2,
            px: { xs: 2, sm: 3 },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                sx={{
                  bgcolor: "white",
                  color: PRIMARY_COLOR,
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  fontWeight: 600,
                }}
              >
                {getInitials(visit.firstName, visit.lastName)}
              </Avatar>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                >
                  {visit.firstName} {visit.lastName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.9,
                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                  }}
                >
                  Visit Details • ID: {visit._id?.slice(-8)}
                  {visit.status === "Other" && " • Other Visit"}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={onClose} size="small" sx={{ color: "white" }}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTab-root": {
                  minHeight: { xs: 48, sm: 56 },
                  py: 1,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                },
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={React.cloneElement(tab.icon, {
                    sx: { fontSize: { xs: 18, sm: 20 } },
                  })}
                  label={tab.label}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                />
              ))}
            </Tabs>
          </Box>

          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              maxHeight: { xs: "calc(100vh - 180px)", sm: "60vh" },
              overflow: "auto",
            }}
          >
            {tabs[activeTab].content}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: { xs: 2, sm: 3 },
            pt: { xs: 1.5, sm: 2 },
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            width="100%"
          >
            <Chip
              label={userRoleConfig.label}
              icon={userRoleConfig.icon}
              size="small"
              sx={{
                bgcolor: alpha(PRIMARY_COLOR, 0.1),
                color: PRIMARY_COLOR,
                fontWeight: 600,
                height: { xs: 24, sm: 28 },
                fontSize: { xs: "0.65rem", sm: "0.75rem" },
              }}
            />
            <Button
              onClick={onClose}
              variant="contained"
              size={isMobile ? "small" : "medium"}
              sx={{
                borderRadius: 2,
                bgcolor: PRIMARY_COLOR,
                "&:hover": { bgcolor: SECONDARY_COLOR },
              }}
            >
              Close
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    );
  },
);

ViewVisitModal.displayName = "ViewVisitModal";

// Edit Modal
const EditVisitModal = React.memo(
  ({ open, onClose, visit, onSave, userRole, showSnackbar, updating }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const { fetchAPI } = useAuth();

    const [editForm, setEditForm] = useState({
      visitStatus: "Not Assigned",
      visitDate: null,
      visitTime: "",
      visitLocation: "",
      status: "Visit",
      visitNotes: "",
      locationImage: null,
      locationImagePreview: null,
    });
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
      if (open && visit) {
        setEditForm({
          visitStatus: visit.visitStatus || "Not Assigned",
          visitDate:
            visit.visitDate && isValid(parseISO(visit.visitDate))
              ? parseISO(visit.visitDate)
              : null,
          visitTime: visit.visitTime || "",
          visitLocation: visit.visitLocation || "",
          status: visit.status || "Visit",
          visitNotes: visit.visitNotes || "",
          locationImage: null,
          locationImagePreview: visit.locationImageUrl || null,
        });
        setValidationErrors({});
      }
    }, [open, visit]);

    const handleLocationImageChange = useCallback((event) => {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar("Image must be under 5MB", "error");
        return;
      }
      if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
        showSnackbar("Only JPG and PNG images are allowed", "error");
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setEditForm((prev) => ({
        ...prev,
        locationImage: file,
        locationImagePreview: previewUrl,
      }));
    }, [showSnackbar]);

    const validateForm = useCallback(() => {
      const errors = {};

      if (!editForm.visitStatus) {
        errors.visitStatus = "Visit status is required";
      }

      if (editForm.visitStatus === "Scheduled" && !editForm.visitDate) {
        errors.visitDate = "Visit date is required for scheduled visits";
      }

      if (editForm.visitStatus === "Scheduled" && !editForm.visitTime) {
        errors.visitTime = "Visit time is required for scheduled visits";
      }

      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    }, [editForm]);

    const handleSubmit = useCallback(async () => {
      if (!validateForm()) {
        showSnackbar("Please fix the errors in the form", "error");
        return;
      }

      try {
        let body;
        let headers = { "Content-Type": "application/json" };

        const payload = {
          visitStatus: editForm.visitStatus,
          ...(editForm.visitDate && { visitDate: format(editForm.visitDate, "yyyy-MM-dd") }),
          ...(editForm.visitTime && { visitTime: editForm.visitTime.trim() }),
          ...(editForm.visitLocation && { visitLocation: editForm.visitLocation.trim() }),
          status: editForm.status,
          ...(editForm.visitNotes && { visitNotes: editForm.visitNotes.trim() }),
        };

        if (editForm.locationImage) {
          const formData = new FormData();
          Object.entries(payload).forEach(([k, v]) => formData.append(k, v));
          formData.append("locationImage", editForm.locationImage);
          body = formData;
          headers = {};
        } else {
          body = JSON.stringify(payload);
        }

        const response = await fetchAPI(`/lead/updateLead/${visit._id}`, {
          method: "PUT",
          headers,
          body,
        });

        if (response?.success) {
          showSnackbar("Visit updated successfully", "success");
          onSave(response.result);
          onClose();
        } else {
          throw new Error(response?.message || "Update failed");
        }
      } catch (error) {
        console.error("Update error:", error);
        showSnackbar(error.message || "Update failed", "error");
      }
    }, [editForm, validateForm, visit, fetchAPI, showSnackbar, onSave, onClose]);

    const handleChange = useCallback(
      (field) => (event) => {
        const value = event.target.value;
        setEditForm((prev) => ({ ...prev, [field]: value }));
        if (validationErrors[field]) {
          setValidationErrors((prev) => ({ ...prev, [field]: "" }));
        }
      },
      [validationErrors],
    );

    if (!visit) return null;

    // Determine notes label based on visit type
    const notesLabel = visit.status === "Other" ? "Description" : "Visit Notes";
    const notesPlaceholder = visit.status === "Other"
      ? "Add or update the description for this visit"
      : "Add any notes related to this visit";

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 4,
            margin: isMobile ? 0 : 24,
          },
        }}
        TransitionComponent={isMobile ? Slide : Fade}
        transitionDuration={300}
      >
        <DialogTitle
          sx={{
            bgcolor: alpha(PRIMARY_COLOR, 0.05),
            pb: 2,
            px: { xs: 2, sm: 3 },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  borderRadius: 2,
                  bgcolor: alpha(PRIMARY_COLOR, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: PRIMARY_COLOR,
                }}
              >
                <Edit sx={{ fontSize: { xs: 24, sm: 28 } }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                >
                  Edit Visit
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                >
                  {visit.firstName} {visit.lastName}
                  {visit.status === "Other" && " • Other Visit"}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl
              fullWidth
              size="small"
              error={!!validationErrors.visitStatus}
            >
              <InputLabel>Visit Status</InputLabel>
              <Select
                value={editForm.visitStatus}
                label="Visit Status"
                onChange={handleChange("visitStatus")}
              >
                {Object.keys(STATUS_CONFIG).map((status) => (
                  <MenuItem key={status} value={status}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      {getStatusConfig(status).icon}
                      <span>{status}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
              {validationErrors.visitStatus && (
                <FormHelperText>{validationErrors.visitStatus}</FormHelperText>
              )}
            </FormControl>

            <DatePicker
              label="Visit Date"
              value={editForm.visitDate}
              onChange={(newValue) =>
                setEditForm((prev) => ({ ...prev, visitDate: newValue }))
              }
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  error: !!validationErrors.visitDate,
                  helperText: validationErrors.visitDate,
                },
              }}
            />

            <TextField
              label="Visit Time"
              value={editForm.visitTime}
              onChange={handleChange("visitTime")}
              placeholder="HH:MM (e.g., 14:30)"
              fullWidth
              size="small"
              error={!!validationErrors.visitTime}
              helperText={validationErrors.visitTime}
            />

            <TextField
              label="Visit Location"
              value={editForm.visitLocation}
              onChange={handleChange("visitLocation")}
              multiline
              rows={isMobile ? 2 : 3}
              fullWidth
              size="small"
              placeholder="Enter visit location address"
            />

            <TextField
              label={notesLabel}
              value={editForm.visitNotes}
              onChange={handleChange("visitNotes")}
              multiline
              rows={isMobile ? 2 : 3}
              fullWidth
              size="small"
              placeholder={notesPlaceholder}
            />

            {editForm.visitStatus === "Completed" && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: PRIMARY_COLOR }}>
                  Location Image
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    (JPG/PNG, max 5MB)
                  </Typography>
                </Typography>

                {editForm.locationImagePreview ? (
                  <Box sx={{ width: "100%" }}>
                    <Box
                      component="img"
                      src={editForm.locationImagePreview}
                      alt="Location"
                      sx={{
                        width: "100%",
                        maxHeight: 200,
                        objectFit: "cover",
                        borderRadius: 2,
                        border: `1px solid ${alpha(PRIMARY_COLOR, 0.2)}`,
                        display: "block",
                      }}
                    />
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        component="label"
                        sx={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR, flex: 1 }}
                      >
                        Change Image
                        <input
                          type="file"
                          hidden
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handleLocationImageChange}
                        />
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          setEditForm((prev) => ({
                            ...prev,
                            locationImage: null,
                            locationImagePreview: null,
                          }))
                        }
                        sx={{ borderColor: "error.main", color: "error.main", flex: 1 }}
                      >
                        Remove
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <Box
                    component="label"
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      border: "2px dashed",
                      borderColor: alpha(PRIMARY_COLOR, 0.3),
                      borderRadius: 2,
                      p: 3,
                      cursor: "pointer",
                      bgcolor: alpha(PRIMARY_COLOR, 0.02),
                      "&:hover": {
                        bgcolor: alpha(PRIMARY_COLOR, 0.05),
                        borderColor: PRIMARY_COLOR,
                      },
                      transition: "all 0.2s",
                    }}
                  >
                    <input
                      type="file"
                      hidden
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleLocationImageChange}
                    />
                    <LocationOn sx={{ fontSize: 40, color: alpha(PRIMARY_COLOR, 0.5) }} />
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Click to upload location photo
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      JPG or PNG, max 5MB
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            <FormControl fullWidth size="small">
              <InputLabel>Lead Status</InputLabel>
              <Select
                value={editForm.status}
                label="Lead Status"
                onChange={handleChange("status")}
              >
                {Object.keys(LEAD_STATUS_CONFIG).map((status) => (
                  <MenuItem key={status} value={status}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      {getLeadStatusConfig(status).icon}
                      <span>{status}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            p: { xs: 2, sm: 3 },
            pt: { xs: 1.5, sm: 2 },
            borderTop: 1,
            borderColor: "divider",
            gap: 1.5,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Button
            onClick={onClose}
            variant="outlined"
            fullWidth={isMobile}
            size={isMobile ? "medium" : "large"}
            sx={{
              borderColor: PRIMARY_COLOR,
              color: PRIMARY_COLOR,
              "&:hover": { bgcolor: alpha(PRIMARY_COLOR, 0.05) },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            fullWidth={isMobile}
            size={isMobile ? "medium" : "large"}
            disabled={updating}
            startIcon={
              updating ? (
                <CircularProgress size={20} sx={{ color: "#fff" }} />
              ) : (
                <Save />
              )
            }
            sx={{
              bgcolor: PRIMARY_COLOR,
              "&:hover": { bgcolor: SECONDARY_COLOR },
            }}
          >
            {updating ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  },
);

EditVisitModal.displayName = "EditVisitModal";

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
const EmptyState = ({ onClearFilters, hasFilters }) => (
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
      <Search sx={{ fontSize: 48, color: PRIMARY_COLOR }} />
    </Box>
    <Typography variant="h6" fontWeight={600} gutterBottom>
      No visits found
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
    >
      {hasFilters
        ? "No visits match your current filters. Try adjusting your search criteria."
        : "No visits have been scheduled yet."}
    </Typography>
    {hasFilters && (
      <Button
        variant="contained"
        onClick={onClearFilters}
        startIcon={<Clear />}
        sx={{ bgcolor: PRIMARY_COLOR, "&:hover": { bgcolor: SECONDARY_COLOR } }}
      >
        Clear All Filters
      </Button>
    )}
  </Box>
);

// ========== MAIN COMPONENT ==========
export default function TotalVisitsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { fetchAPI, getUserRole } = useAuth();
  const userRole = getUserRole();

  // Media queries
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // State Management
  const [period, setPeriod] = useState("Today");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Data State
  const [allVisits, setAllVisits] = useState([]);
  const [summary, setSummary] = useState({
    totalVisits: 0,
    completedVisits: 0,
    scheduledVisits: 0,
    thisWeekVisits: 0,
    conversionRate: 0,
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const [dateFilterError, setDateFilterError] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState(
    Object.keys(STATUS_CONFIG).reduce((acc, status) => {
      acc[status] = true;
      return acc;
    }, {}),
  );

  // Sorting & Pagination
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(
    isMobile ? 10 : DEFAULT_ITEMS_PER_PAGE,
  );

  // Modal States
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [updating, setUpdating] = useState(false);

  // View Mode
  const [viewMode, setViewMode] = useState(isMobile ? "card" : "table");

  // Refs
  const containerRef = useRef(null);

  // Snackbar Handler
  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Fetch Data
  const fetchVisitsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      const today = new Date();

      if (period === "Today") {
        params.append("startDate", format(today, "yyyy-MM-dd"));
        params.append("endDate", format(today, "yyyy-MM-dd"));
      } else if (period === "This Week") {
        const weekAgo = subWeeks(today, 1);
        params.append("startDate", format(weekAgo, "yyyy-MM-dd"));
        params.append("endDate", format(today, "yyyy-MM-dd"));
      } else if (period === "This Month") {
        const monthAgo = subMonths(today, 1);
        params.append("startDate", format(monthAgo, "yyyy-MM-dd"));
        params.append("endDate", format(today, "yyyy-MM-dd"));
      }

      const response = await fetchAPI(
        `/lead/visitSummary?${params.toString()}`,
      );

      if (response?.success) {
        const visits = response.result?.visits || response.result || [];

        const totalVisits = visits.length;
        const completedVisits = visits.filter(
          (v) => v.visitStatus === "Completed",
        ).length;
        const scheduledVisits = visits.filter(
          (v) => v.visitStatus === "Scheduled",
        ).length;

        const weekAgo = subWeeks(new Date(), 1);
        weekAgo.setHours(0, 0, 0, 0);

        const thisWeekVisits = visits.filter((v) => {
          if (!v.visitDate) return false;
          try {
            const visitDate = parseISO(v.visitDate);
            return isValid(visitDate) && visitDate >= weekAgo;
          } catch {
            return false;
          }
        }).length;

        const conversionRate =
          totalVisits > 0
            ? Math.round((completedVisits / totalVisits) * 100)
            : 0;

        setAllVisits(visits);
        setSummary({
          totalVisits,
          completedVisits,
          scheduledVisits,
          thisWeekVisits,
          conversionRate,
        });
      } else {
        throw new Error(response?.message || "Failed to fetch visits");
      }
    } catch (err) {
      console.error("Error fetching visits:", err);
      setError(err.message || "Network error. Please try again.");
      showSnackbar(err.message || "Failed to fetch visits data", "error");
      setAllVisits([]);
      setSummary({
        totalVisits: 0,
        completedVisits: 0,
        scheduledVisits: 0,
        thisWeekVisits: 0,
        conversionRate: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [period, fetchAPI, showSnackbar]);

  // Apply Filters
  const applyFilters = useCallback(() => {
    try {
      let filtered = [...allVisits];

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (visit) =>
            (visit.firstName?.toLowerCase() || "").includes(query) ||
            (visit.lastName?.toLowerCase() || "").includes(query) ||
            (visit.email?.toLowerCase() || "").includes(query) ||
            (visit.phone || "").includes(query) ||
            (visit.visitLocation?.toLowerCase() || "").includes(query) ||
            // Also search in visitNotes so 'Other' visits are findable by description
            (visit.visitNotes?.toLowerCase() || "").includes(query),
        );
      }

      if (statusFilter !== "All") {
        filtered = filtered.filter(
          (visit) => visit.visitStatus === statusFilter,
        );
      }

      if (dateFilter.startDate && isValid(dateFilter.startDate)) {
        const start = startOfDay(new Date(dateFilter.startDate));
        filtered = filtered.filter((visit) => {
          if (!visit.visitDate) return false;
          try {
            const visitDate = parseISO(visit.visitDate);
            return isValid(visitDate) && visitDate >= start;
          } catch {
            return false;
          }
        });
      }

      if (dateFilter.endDate && isValid(dateFilter.endDate)) {
        const end = endOfDay(new Date(dateFilter.endDate));
        filtered = filtered.filter((visit) => {
          if (!visit.visitDate) return false;
          try {
            const visitDate = parseISO(visit.visitDate);
            return isValid(visitDate) && visitDate <= end;
          } catch {
            return false;
          }
        });
      }

      const activeStatuses = Object.keys(selectedStatuses).filter(
        (status) => selectedStatuses[status],
      );
      if (activeStatuses.length < Object.keys(STATUS_CONFIG).length) {
        filtered = filtered.filter((visit) =>
          activeStatuses.includes(visit.visitStatus || "Not Assigned"),
        );
      }

      if (sortConfig.key) {
        filtered.sort((a, b) => {
          let aVal = a[sortConfig.key];
          let bVal = b[sortConfig.key];

          if (sortConfig.key === "visitDate") {
            aVal = aVal ? parseISO(aVal) : new Date(0);
            bVal = bVal ? parseISO(bVal) : new Date(0);
          } else if (sortConfig.key === "firstName") {
            aVal = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
            bVal = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
          } else if (sortConfig.key === "visitStatus") {
            aVal = STATUS_CONFIG[aVal]?.order || 0;
            bVal = STATUS_CONFIG[bVal]?.order || 0;
          }

          if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        });
      }

      return filtered;
    } catch (err) {
      console.error("Filter error:", err);
      showSnackbar("Error applying filters", "error");
      return [];
    }
  }, [
    allVisits,
    searchQuery,
    statusFilter,
    dateFilter,
    selectedStatuses,
    sortConfig,
    showSnackbar,
  ]);

  // Memoized filtered visits
  const filteredVisits = useMemo(() => applyFilters(), [applyFilters]);

  // Paginated visits
  const paginatedVisits = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredVisits.slice(start, start + rowsPerPage);
  }, [filteredVisits, page, rowsPerPage]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (statusFilter !== "All") count++;
    if (dateFilter.startDate) count++;
    if (dateFilter.endDate) count++;
    if (Object.values(selectedStatuses).some((v) => !v)) count++;
    return count;
  }, [searchQuery, statusFilter, dateFilter, selectedStatuses]);

  // Effects
  useEffect(() => {
    if (hasAccess(userRole)) {
      fetchVisitsData();
    }
  }, [fetchVisitsData, userRole]);

  useEffect(() => {
    if (dateFilter.startDate && dateFilter.endDate) {
      const from = new Date(dateFilter.startDate);
      const to = new Date(dateFilter.endDate);
      const error = from > to ? "Start date cannot be after end date" : "";
      setDateFilterError(error);
    } else {
      setDateFilterError("");
    }
  }, [dateFilter.startDate, dateFilter.endDate]);

  useEffect(() => {
    setRowsPerPage(isMobile ? 10 : DEFAULT_ITEMS_PER_PAGE);
  }, [isMobile]);

  useEffect(() => {
    setViewMode(isMobile ? "card" : "table");
  }, [isMobile]);

  // Handlers
  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleViewClick = useCallback(
    (visit) => {
      if (!visit?._id) {
        showSnackbar("Invalid visit data", "error");
        return;
      }
      setSelectedVisit(visit);
      setViewModalOpen(true);
    },
    [showSnackbar],
  );

  const handleEditClick = useCallback(
    (visit) => {
      if (!visit?._id) {
        showSnackbar("Invalid visit data", "error");
        return;
      }
      setSelectedVisit(visit);
      setEditModalOpen(true);
    },
    [showSnackbar],
  );

  const handleVisitUpdate = useCallback(
    async (updatedVisit) => {
      try {
        await fetchVisitsData();
        showSnackbar("Visit updated successfully", "success");
      } catch (err) {
        console.error("Error after visit update:", err);
        showSnackbar("Failed to refresh data", "error");
      }
    },
    [fetchVisitsData, showSnackbar],
  );

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const handleStatusCheckboxChange = useCallback((status) => {
    setSelectedStatuses((prev) => ({ ...prev, [status]: !prev[status] }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("All");
    setDateFilter({ startDate: null, endDate: null });
    setDateFilterError("");
    setSelectedStatuses(
      Object.keys(STATUS_CONFIG).reduce((acc, status) => {
        acc[status] = true;
        return acc;
      }, {}),
    );
    setSortConfig({ key: null, direction: "asc" });
    setPage(0);
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage - 1);
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Summary Cards
  const summaryCards = useMemo(
    () => [
      {
        label: "Total Visits",
        value: summary.totalVisits,
        color: PRIMARY_COLOR,
        icon: <People />,
        subText: "All scheduled visits",
      },
      {
        label: "Completed",
        value: summary.completedVisits,
        color: PRIMARY_COLOR,
        icon: <CheckCircle />,
        subText: "Successfully completed",
      },
      {
        label: "Scheduled",
        value: summary.scheduledVisits,
        color: PRIMARY_COLOR,
        icon: <Schedule />,
        subText: "Upcoming visits",
      },
      {
        label: "This Week",
        value: summary.thisWeekVisits,
        color: PRIMARY_COLOR,
        icon: <TrendingUp />,
        subText: "Visits this week",
      },
    ],
    [summary],
  );

  // Access Check
  if (!hasAccess(userRole)) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: "center",
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 500, borderRadius: 3 }}>
          <AlertTitle>Access Denied</AlertTitle>
          You don't have permission to access this page.
          <Button
            sx={{ mt: 2 }}
            variant="contained"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </Button>
        </Alert>
      </Box>
    );
  }

  if (loading && allVisits.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error && allVisits.length === 0) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        <Alert
          severity="error"
          sx={{ borderRadius: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchVisitsData}>
              Retry
            </Button>
          }
        >
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* Modals */}
      <ViewVisitModal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        visit={selectedVisit}
        userRole={userRole}
        showSnackbar={showSnackbar}
      />
      <EditVisitModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        visit={selectedVisit}
        onSave={handleVisitUpdate}
        userRole={userRole}
        showSnackbar={showSnackbar}
        updating={updating}
      />

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        period={period}
        setPeriod={setPeriod}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        selectedStatuses={selectedStatuses}
        handleStatusCheckboxChange={handleStatusCheckboxChange}
        handleClearFilters={handleClearFilters}
        dateFilterError={dateFilterError}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeFilterCount={activeFilterCount}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{
          vertical: isMobile ? "top" : "bottom",
          horizontal: isMobile ? "center" : "right",
        }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2, color: "#fff" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Main Content */}
      <Box
        ref={containerRef}
        sx={{
          p: { xs: 1.5, sm: 2, md: 3 },
          minHeight: "100vh",
          pb: { xs: 8, sm: 3 },
          bgcolor: "#f8fafc",
        }}
      >
        {/* Header */}
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
                Visit Management
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              >
                Track and manage all visit activities and schedules
              </Typography>
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
                onClick={fetchVisitsData}
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
            </Box>
          </Stack>
        </Paper>

        {/* Summary Cards */}
        <Grid container spacing={isMobile ? 1.5 : 2} sx={{ mb: 3 }}>
          {summaryCards.map((card, index) => (
            <Grid item xs={6} sm={6} md={3} key={index}>
              <Fade in={true} timeout={500 + index * 100}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    borderRadius: 3,
                    border: `1px solid ${alpha(card.color, 0.1)}`,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <Stack spacing={1}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box
                        sx={{
                          width: { xs: 32, sm: 40, md: 48 },
                          height: { xs: 32, sm: 40, md: 48 },
                          borderRadius: { xs: 1.5, sm: 2 },
                          bgcolor: alpha(card.color, 0.1),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: card.color,
                        }}
                      >
                        {React.cloneElement(card.icon, {
                          sx: { fontSize: { xs: 16, sm: 20, md: 24 } },
                        })}
                      </Box>
                      <Typography
                        variant="h4"
                        fontWeight={700}
                        sx={{
                          color: card.color,
                          fontSize: { xs: "1.25rem", sm: "1.5rem", md: "2rem" },
                        }}
                      >
                        {card.value}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                      >
                        {card.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: { xs: "0.6rem", sm: "0.7rem" } }}
                      >
                        {card.subText}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Fade>
            </Grid>
          ))}
        </Grid>

        {/* Desktop Search and Filters */}
        {!isMobile && (
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by name, email, phone, location or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setSearchQuery("")}
                        >
                          <Close />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ maxWidth: 400 }}
                />

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Period</InputLabel>
                  <Select
                    value={period}
                    label="Period"
                    onChange={(e) => setPeriod(e.target.value)}
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

                <Button
                  variant="outlined"
                  startIcon={<Tune />}
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  sx={{
                    borderColor: PRIMARY_COLOR,
                    color: PRIMARY_COLOR,
                    "&:hover": { bgcolor: alpha(PRIMARY_COLOR, 0.05) },
                  }}
                >
                  {showFilterPanel ? "Hide Filters" : "More Filters"}
                </Button>

                {activeFilterCount > 0 && (
                  <Button
                    variant="text"
                    startIcon={<Clear />}
                    onClick={handleClearFilters}
                    sx={{ color: ERROR_COLOR }}
                  >
                    Clear All
                  </Button>
                )}
              </Stack>

              <Collapse in={showFilterPanel}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    borderColor: alpha(PRIMARY_COLOR, 0.2),
                    bgcolor: alpha(PRIMARY_COLOR, 0.02),
                  }}
                >
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        gutterBottom
                      >
                        Visit Status
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <MenuItem value="All">All Statuses</MenuItem>
                          {Object.keys(STATUS_CONFIG).map((status) => (
                            <MenuItem key={status} value={status}>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                              >
                                {getStatusConfig(status).icon}
                                <span>{status}</span>
                              </Stack>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        gutterBottom
                      >
                        Start Date
                      </Typography>
                      <DatePicker
                        value={dateFilter.startDate}
                        onChange={(newValue) =>
                          setDateFilter((prev) => ({
                            ...prev,
                            startDate: newValue,
                          }))
                        }
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                            error: !!dateFilterError,
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        gutterBottom
                      >
                        End Date
                      </Typography>
                      <DatePicker
                        value={dateFilter.endDate}
                        onChange={(newValue) =>
                          setDateFilter((prev) => ({
                            ...prev,
                            endDate: newValue,
                          }))
                        }
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                            error: !!dateFilterError,
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        gutterBottom
                      >
                        Multiple Status Selection
                      </Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        {Object.keys(STATUS_CONFIG).map((status) => (
                          <FormControlLabel
                            key={status}
                            control={
                              <Checkbox
                                checked={selectedStatuses[status]}
                                onChange={() =>
                                  handleStatusCheckboxChange(status)
                                }
                                size="small"
                                sx={{
                                  color: PRIMARY_COLOR,
                                  "&.Mui-checked": { color: PRIMARY_COLOR },
                                }}
                              />
                            }
                            label={
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.5}
                              >
                                {getStatusConfig(status).icon}
                                <Typography variant="body2">
                                  {status}
                                </Typography>
                              </Stack>
                            }
                          />
                        ))}
                      </Stack>
                    </Grid>
                  </Grid>

                  {dateFilterError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {dateFilterError}
                    </Alert>
                  )}
                </Paper>
              </Collapse>

              {activeFilterCount > 0 && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 1, display: "block" }}
                  >
                    Active Filters:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {searchQuery && (
                      <Chip
                        label={`Search: ${searchQuery}`}
                        size="small"
                        onDelete={() => setSearchQuery("")}
                        sx={{
                          bgcolor: alpha(PRIMARY_COLOR, 0.1),
                          color: PRIMARY_COLOR,
                        }}
                      />
                    )}
                    {statusFilter !== "All" && (
                      <Chip
                        label={`Status: ${statusFilter}`}
                        size="small"
                        onDelete={() => setStatusFilter("All")}
                        sx={{
                          bgcolor: alpha(PRIMARY_COLOR, 0.1),
                          color: PRIMARY_COLOR,
                        }}
                      />
                    )}
                    {dateFilter.startDate && (
                      <Chip
                        label={`From: ${format(dateFilter.startDate, "dd MMM yyyy")}`}
                        size="small"
                        onDelete={() =>
                          setDateFilter((prev) => ({
                            ...prev,
                            startDate: null,
                          }))
                        }
                        sx={{
                          bgcolor: alpha(PRIMARY_COLOR, 0.1),
                          color: PRIMARY_COLOR,
                        }}
                      />
                    )}
                    {dateFilter.endDate && (
                      <Chip
                        label={`To: ${format(dateFilter.endDate, "dd MMM yyyy")}`}
                        size="small"
                        onDelete={() =>
                          setDateFilter((prev) => ({ ...prev, endDate: null }))
                        }
                        sx={{
                          bgcolor: alpha(PRIMARY_COLOR, 0.1),
                          color: PRIMARY_COLOR,
                        }}
                      />
                    )}
                    {Object.values(selectedStatuses).some((v) => !v) && (
                      <Chip
                        label="Custom Status"
                        size="small"
                        onDelete={() =>
                          setSelectedStatuses(
                            Object.keys(STATUS_CONFIG).reduce((acc, status) => {
                              acc[status] = true;
                              return acc;
                            }, {}),
                          )
                        }
                        sx={{
                          bgcolor: alpha(PRIMARY_COLOR, 0.1),
                          color: PRIMARY_COLOR,
                        }}
                      />
                    )}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Paper>
        )}

        {/* Main Content */}
        <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
              bgcolor: "#fff",
            }}
          >
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
            >
              Visit Records
              <Chip
                label={`${filteredVisits.length} total`}
                size="small"
                sx={{
                  ml: 1,
                  bgcolor: alpha(PRIMARY_COLOR, 0.1),
                  color: PRIMARY_COLOR,
                }}
              />
            </Typography>

            {!isMobile && (
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Rows per page:
                </Typography>
                <Select
                  size="small"
                  value={rowsPerPage}
                  onChange={handleChangeRowsPerPage}
                  sx={{ minWidth: 80 }}
                >
                  {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            )}
          </Box>

          {viewMode === "table" && !isMobile ? (
            <TableContainer sx={{ maxHeight: "70vh", overflow: "auto" }}>
              {loading && allVisits.length > 0 && (
                <LinearProgress
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1,
                  }}
                />
              )}
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY_COLOR, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      Customer
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY_COLOR, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      Date & Time
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY_COLOR, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      Location
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY_COLOR, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      Description / Notes
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY_COLOR, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY_COLOR, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      Lead Status
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY_COLOR, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedVisits.length > 0 ? (
                    paginatedVisits.map((visit) => (
                      <TableRow key={visit._id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {visit.firstName} {visit.lastName}
                            </Typography>
                            {visit.status === "Other" && (
                              <Typography variant="caption" color="text.secondary">
                                (Other visit)
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                       <TableCell>
  {visit.visitDate
    ? formatDate(visit.visitDate, "dd MMM yyyy")
    : formatDate(visit.createdAt, "dd MMM yyyy")}
  <br />
  <small>
    {visit.visitTime
      ? formatTime(visit.visitTime)
      : formatDate(visit.createdAt, "hh:mm a")}
  </small>
</TableCell>
                        <TableCell>{visit.visitLocation || "—"}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {visit.visitNotes || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={visit.visitStatus}
                            size="small"
                            sx={{ background: "#4569ea", color: "#fff" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getLeadStatusConfig(visit.status).label}
                            icon={getLeadStatusConfig(visit.status).icon}
                            size="small"
                            sx={{
                              bgcolor: getLeadStatusConfig(visit.status).bg,
                              color: getLeadStatusConfig(visit.status).color,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              sx={{ background: "#4569ea", color: "#fff" }}
                              size="small"
                              onClick={() => handleViewClick(visit)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                            <IconButton
                              sx={{ background: "#4569ea", color: "#fff" }}
                              size="small"
                              onClick={() => handleEditClick(visit)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <EmptyState
                          onClearFilters={handleClearFilters}
                          hasFilters={activeFilterCount > 0}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {loading && allVisits.length > 0 && (
                <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />
              )}
              {paginatedVisits.length > 0 ? (
                paginatedVisits.map((visit) => (
                  <MobileVisitCard
                    key={visit._id}
                    visit={visit}
                    onView={handleViewClick}
                    onEdit={handleEditClick}
                  />
                ))
              ) : (
                <EmptyState
                  onClearFilters={handleClearFilters}
                  hasFilters={activeFilterCount > 0}
                />
              )}
            </Box>
          )}

          {filteredVisits.length > 0 && (
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
                bgcolor: "#fff",
              }}
            >
              <Typography variant="body2">
                Showing {page * rowsPerPage + 1} to{" "}
                {Math.min((page + 1) * rowsPerPage, filteredVisits.length)} of{" "}
                {filteredVisits.length}
              </Typography>
              <Pagination
                count={Math.ceil(filteredVisits.length / rowsPerPage)}
                page={page + 1}
                onChange={handleChangePage}
                color="primary"
                size={isMobile ? "small" : "medium"}
                sx={{
                  "& .MuiPaginationItem-root": {
                    borderRadius: 2,
                    "&.Mui-selected": { bgcolor: PRIMARY_COLOR, color: "#fff" },
                  },
                }}
              />
            </Box>
          )}
        </Paper>

        {/* Footer */}
        <Box
          sx={{
            mt: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Last updated: {format(new Date(), "dd MMM yyyy, hh:mm a")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {summary.totalVisits} total visits • {summary.conversionRate}%
            conversion rate
          </Typography>
        </Box>
      </Box>

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
    </LocalizationProvider>
  );
}