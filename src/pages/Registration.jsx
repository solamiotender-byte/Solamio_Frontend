// pages/RegistrationPage.jsx (Bug-Free Version)
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
  Button,
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
  CircularProgress,
  CardContent,
  Tooltip,
  InputAdornment,
  Pagination,
  Avatar,
  alpha,
  useTheme,
  useMediaQuery,
  Paper,
  Divider,
  LinearProgress,
  FormHelperText,
  Menu,
  Skeleton,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  Fab,
  Badge,
  Slide,
  Fade,
  Collapse,
  BottomNavigation,
  BottomNavigationAction,
  SwipeableDrawer,
} from "@mui/material";
import {
  Search,
  Edit,
  Visibility,
  Close,
  CheckCircle,
  Clear,
  Refresh,
  Cancel,
  PendingActions,
  Verified,
  FolderOpen,
  Description,
  GetApp,
  AccountBalance,
  Badge as BadgeIcon,
  CloudUpload,
  Delete,
  CreditCard,
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  Fullscreen,
  FullscreenExit,
  Person,
  CalendarToday,
  Email,
  Phone,
  LocationOn,
  Note,
  Warning,
  FilterList,
  Tune,
  ArrowUpward,
  ArrowDownward,
  Save as SaveIcon,
  MoreVert,
  TrendingUp,
  HowToReg,
  ReceiptLong,
  AccessTime,
  SupervisorAccount,
  Groups,
  AdminPanelSettings,
  WorkspacePremium,
  AddPhotoAlternate,
  SolarPower,
  FilterAlt,
  Sort,
  ViewList,
  ViewModule,
  Dashboard,
  ExpandMore,
  ExpandLess,
  FiberManualRecord,
  DateRange,
  InsertDriveFile,
  PictureAsPdfOutlined,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import Zoom from "@mui/material/Zoom";
import {
  format,
  isValid,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
  subWeeks,
  subMonths,
} from "date-fns";
import { useNavigate } from "react-router-dom";
import AlertTitle from "@mui/material/AlertTitle";

// ========== CONSTANTS & CONFIGURATION ==========
const PRIMARY = "#4569ea";
const SECONDARY = "#1a237e";
const DOCUMENT_BASE_URL = "https://solar-backend-2-r6k9.onrender.com";
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50];
const DEFAULT_ITEMS_PER_PAGE = 10;

const normalizeHostedDocumentUrl = (url) => {
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      if (
        ["backend.sunergytechsolar.com", "localhost", "127.0.0.1"].includes(parsed.hostname) ||
        parsed.hostname.endsWith(".local")
      ) {
        return `${DOCUMENT_BASE_URL}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      return url;
    }
    return url;
  }

  if (url.startsWith("/")) return `${DOCUMENT_BASE_URL}${url}`;

  return `${DOCUMENT_BASE_URL}/public/${url.replace(/^public\//i, "")}`;
};
const ALLOWED_ROLES = ["Head_office", "ZSM", "ASM", "TEAM"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for registration documents
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

// Registration Status Configuration
const REGISTRATION_STATUS_OPTIONS = [
  "pending",
  "completed",
  "inProgress"
];

const REGISTRATION_STATUS_CONFIG = {
  "inProgress": {           // ✅ key matches the option value exactly
    bg: alpha(PRIMARY, 0.08),
    color: PRIMARY,
    icon: <AccessTime sx={{ fontSize: 16 }} />,
    label: "In Progress",
    description: "Registration is in progress",
    order: 3,
  },
  pending: {
    bg: alpha(PRIMARY, 0.08),
    color: PRIMARY,
    icon: <PendingActions sx={{ fontSize: 16 }} />,
    label: "Pending",
    description: "Registration is pending review",
    order: 1,
  },
  completed: {
    bg: alpha(PRIMARY, 0.08),
    color: PRIMARY,
    icon: <CheckCircle sx={{ fontSize: 16 }} />,
    label: "Completed",
    description: "Registration completed successfully",
    order: 2,
  },
};

// Lead Status Configuration
const LEAD_STATUS_OPTIONS = ["Registration", "Document Submission", "Missed Leads"];

const LEAD_STATUS_CONFIG = {
  Registration: {
    bg: alpha(PRIMARY, 0.08),
    color: PRIMARY,
    icon: <HowToReg sx={{ fontSize: 16 }} />,
    description: "Customer registration process",
  },
  "Document Submission": {
    bg: alpha(PRIMARY, 0.08),
    color: PRIMARY,
    icon: <AccountBalance sx={{ fontSize: 16 }} />,
    description: "Documents submitted for verification",
  },
  "Missed Leads": {
    bg: alpha(PRIMARY, 0.08),
    color: PRIMARY,
    icon: <Cancel sx={{ fontSize: 16 }} />,
    description: "Lead was not converted",
  },
};

// Solar Requirement Types
const SOLAR_REQUIREMENT_TYPES = [
  "Residential (1-5 kW)",
  "Commercial (5-50 kW)",
  "Industrial (50+ kW)",
  "Agricultural",
  "Government/Institutional",
  "Other",
];

// Role Configuration
const ROLE_CONFIG = {
  Head_office: {
    label: "Head Office",
    color: PRIMARY,
    icon: <AdminPanelSettings sx={{ fontSize: 16 }} />,
  },
  ZSM: {
    label: "Zone Sales Manager",
    color: PRIMARY,
    icon: <WorkspacePremium sx={{ fontSize: 16 }} />,
  },
  ASM: {
    label: "Area Sales Manager",
    color: PRIMARY,
    icon: <SupervisorAccount sx={{ fontSize: 16 }} />,
  },
  TEAM: {
    label: "Team Member",
    color: PRIMARY,
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
const hasAccess = (userRole) => ALLOWED_ROLES.includes(userRole);

const getUserPermissions = (userRole) => ({
  canView: true,
  canEdit: true,
  canDelete: userRole === "Head_office",
  canManage: ["Head_office", "ZSM", "ASM"].includes(userRole),
  canSeeAll: ["Head_office", "ZSM", "ASM"].includes(userRole),
  canSeeOwn: userRole === "TEAM",
  canUpdateStatus: ["Head_office", "ZSM", "ASM"].includes(userRole),
  canUploadDocs: ["Head_office", "ZSM", "ASM", "TEAM"].includes(userRole),
});

const getRegistrationStatusConfig = (status) => {
  // const normalizedStatus = status?.toLowerCase();
  return (
    REGISTRATION_STATUS_CONFIG[status] || {
      bg: alpha(PRIMARY, 0.08),
      color: PRIMARY,
      icon: <Warning sx={{ fontSize: 16 }} />,
      label: status || "Unknown",
      description: "Unknown status",
      order: 0,
    }
  );
};

const getLeadStatusConfig = (status) => {
  return (
    LEAD_STATUS_CONFIG[status] || {
      bg: alpha(PRIMARY, 0.08),
      color: PRIMARY,
      icon: <Warning sx={{ fontSize: 16 }} />,
      description: "Unknown status",
    }
  );
};

const getRoleConfig = (role) => {
  return (
    ROLE_CONFIG[role] || {
      label: "Unknown",
      color: PRIMARY,
      icon: <Person sx={{ fontSize: 16 }} />,
    }
  );
};

const validateRequiredField = (value, fieldName) => {
  if (!value?.toString().trim()) return `${fieldName} is required`;
  return "";
};

const validatePincode = (pincode) => {
  if (!pincode?.toString().trim()) return "Pincode is required";
  if (!/^\d{6}$/.test(pincode.toString().trim()))
    return "Pincode must be 6 digits";
  return "";
};

const validateFile = (file) => {
  if (!file) return "";
  if (file.size > MAX_FILE_SIZE) return "File size should be less than 10MB";
  if (!ALLOWED_FILE_TYPES.includes(file.type))
    return "Only PDF, DOC, DOCX, JPG, PNG files are allowed";
  return "";
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
};

const getAssignedPerson = (record) => {
  const person = record?.assignedUser || record?.assignedManager;
  if (!person) return null;

  if (typeof person === "string") {
    return {
      name: "Assigned",
      role: record?.assignedUser ? "User" : "Manager",
    };
  }

  const name =
    `${person.firstName || ""} ${person.lastName || ""}`.trim() ||
    person.email ||
    person.phone ||
    "Assigned";

  return {
    name,
    role: person.role || (record?.assignedUser ? "User" : "Manager"),
  };
};

const getRegistrationDateValue = (registration) =>
  registration?.dateOfRegistration ||
  registration?.registrationDate ||
  registration?.createdAt ||
  null;

// ========== MOBILE FILTER DRAWER ==========
const MobileFilterDrawer = ({
  open,
  onClose,
  period,
  setPeriod,
  registrationStatusFilter,
  setRegistrationStatusFilter,
  leadStatusFilter,
  setLeadStatusFilter,
  dateFilter,
  setDateFilter,
  dateFilterError,
  searchQuery,
  setSearchQuery,
  sortConfig,
  setSortConfig,
  viewMode,
  setViewMode,
  activeFilterCount,
  onClear,
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
            borderBottom: `1px solid ${alpha(PRIMARY, 0.1)}`,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="700" color={PRIMARY}>
              Filter Registrations
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {activeFilterCount} active filter{activeFilterCount !== 1 && "s"}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ bgcolor: alpha(PRIMARY, 0.1) }}
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
                border: `1px solid ${alpha(PRIMARY, 0.1)}`,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bgcolor: alpha(PRIMARY, 0.02),
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => toggleSection("search")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Search sx={{ color: PRIMARY, fontSize: 20 }} />
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
                          <Search sx={{ color: "text.secondary", fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: searchQuery && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchQuery("")}>
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
                border: `1px solid ${alpha(PRIMARY, 0.1)}`,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bgcolor: alpha(PRIMARY, 0.02),
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => toggleSection("period")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <DateRange sx={{ color: PRIMARY, fontSize: 20 }} />
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
                          variant={period === option.value ? "contained" : "outlined"}
                          onClick={() => setPeriod(option.value)}
                          startIcon={option.icon}
                          size="small"
                          sx={{
                            bgcolor: period === option.value ? PRIMARY : "transparent",
                            color: period === option.value ? "#fff" : PRIMARY,
                            borderColor: PRIMARY,
                            "&:hover": {
                              bgcolor: period === option.value ? SECONDARY : alpha(PRIMARY, 0.1),
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

            {/* Registration Status Section */}
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${alpha(PRIMARY, 0.1)}`,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bgcolor: alpha(PRIMARY, 0.02),
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => toggleSection("regStatus")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <FilterList sx={{ color: PRIMARY, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Registration Status
                  </Typography>
                </Stack>
                {expandedSection === "regStatus" ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={expandedSection === "regStatus"}>
                <Box sx={{ p: 2 }}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={registrationStatusFilter}
                      onChange={(e) => setRegistrationStatusFilter(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="All">All Statuses</MenuItem>
                      {REGISTRATION_STATUS_OPTIONS.map((status) => {
                        const config = getRegistrationStatusConfig(status);
                        return (
                          <MenuItem key={status} value={status}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              {config.icon}
                              <span>{config.label}</span>
                            </Stack>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Box>
              </Collapse>
            </Paper>

            {/* Lead Status Section */}
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${alpha(PRIMARY, 0.1)}`,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bgcolor: alpha(PRIMARY, 0.02),
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => toggleSection("leadStatus")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <TrendingUp sx={{ color: PRIMARY, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Lead Status
                  </Typography>
                </Stack>
                {expandedSection === "leadStatus" ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={expandedSection === "leadStatus"}>
                <Box sx={{ p: 2 }}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={leadStatusFilter}
                      onChange={(e) => setLeadStatusFilter(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="All">All Statuses</MenuItem>
                      {LEAD_STATUS_OPTIONS.map((status) => (
                        <MenuItem key={status} value={status}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {getLeadStatusConfig(status).icon}
                            <span>{status}</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Collapse>
            </Paper>

            {/* Date Range Section */}
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${alpha(PRIMARY, 0.1)}`,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bgcolor: alpha(PRIMARY, 0.02),
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => toggleSection("date")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarToday sx={{ color: PRIMARY, fontSize: 20 }} />
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
                border: `1px solid ${alpha(PRIMARY, 0.1)}`,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bgcolor: alpha(PRIMARY, 0.02),
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => toggleSection("sort")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Sort sx={{ color: PRIMARY, fontSize: 20 }} />
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
                      { key: "dateOfRegistration", label: "Registration Date" },
                      { key: "registrationStatus", label: "Status" },
                    ].map((option) => (
                      <Button
                        key={option.key}
                        fullWidth
                        variant={sortConfig.key === option.key ? "contained" : "outlined"}
                        onClick={() =>
                          setSortConfig((prev) => ({
                            key: option.key,
                            direction:
                              prev.key === option.key && prev.direction === "asc"
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
                          bgcolor: sortConfig.key === option.key ? PRIMARY : "transparent",
                          color: sortConfig.key === option.key ? "#fff" : PRIMARY,
                          borderColor: PRIMARY,
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
                border: `1px solid ${alpha(PRIMARY, 0.1)}`,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bgcolor: alpha(PRIMARY, 0.02),
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
                        bgcolor: viewMode === "card" ? PRIMARY : "transparent",
                        color: viewMode === "card" ? "#fff" : PRIMARY,
                        borderColor: PRIMARY,
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
                        bgcolor: viewMode === "table" ? PRIMARY : "transparent",
                        color: viewMode === "table" ? "#fff" : PRIMARY,
                        borderColor: PRIMARY,
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
            borderTop: `1px solid ${alpha(PRIMARY, 0.1)}`,
            bgcolor: "#fff",
          }}
        >
          <Stack direction="row" spacing={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                onClear();
                onClose();
              }}
              startIcon={<Clear />}
              sx={{
                borderColor: PRIMARY,
                color: PRIMARY,
                "&:hover": { bgcolor: alpha(PRIMARY, 0.05) },
              }}
            >
              Clear All
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={onClose}
              sx={{
                bgcolor: PRIMARY,
                "&:hover": { bgcolor: SECONDARY },
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

// ========== MOBILE REGISTRATION CARD ==========
const MobileRegistrationCard = ({
  registration,
  onView,
  onEdit,
  onUpload,
  userPermissions,
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const regStatusConfig = getRegistrationStatusConfig(registration.registrationStatus);
  const leadStatusConfig = getLeadStatusConfig(registration.status);
  const initials = getInitials(registration.firstName, registration.lastName);

  return (
    <Paper
      sx={{
        mb: 1.5,
        borderRadius: 3,
        border: `1px solid ${alpha(PRIMARY, 0.1)}`,
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
                bgcolor: PRIMARY,
                color: "#fff",
                width: 48,
                height: 48,
                fontWeight: 600,
              }}
            >
              {initials}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="700" color={PRIMARY}>
                {registration.firstName} {registration.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {registration._id?.slice(-8) || "N/A"}
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              transform: expanded ? "rotate(180deg)" : "none",
              transition: "transform 0.3s",
              bgcolor: alpha(PRIMARY, 0.1),
            }}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        {/* Quick Info */}
        <Grid container spacing={1} sx={{ mb: 1.5 }}>
          <Grid item xs={6}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Phone sx={{ fontSize: 14, color: alpha(PRIMARY, 0.6) }} />
              <Typography variant="caption" noWrap>
                {registration.phone || "No phone"}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={6}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Email sx={{ fontSize: 14, color: alpha(PRIMARY, 0.6) }} />
              <Typography variant="caption" noWrap>
                {registration.email || "No email"}
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        {/* Registration Info */}
        <Box sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <CalendarToday sx={{ fontSize: 14, color: alpha(PRIMARY, 0.6) }} />
            <Typography variant="body2" fontWeight={500}>
              {formatDate(getRegistrationDateValue(registration), "dd MMM yyyy")}
            </Typography>
            <FiberManualRecord sx={{ fontSize: 4, color: "text.disabled" }} />
            <SolarPower sx={{ fontSize: 14, color: alpha(PRIMARY, 0.6) }} />
            <Typography variant="body2" fontWeight={500} noWrap>
              {registration.solarRequirement || "Not specified"}
            </Typography>
          </Stack>
          {registration.city && (
            <Stack direction="row" spacing={0.5} alignItems="flex-start">
              <LocationOn sx={{ fontSize: 14, color: alpha(PRIMARY, 0.6), mt: 0.3 }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {registration.city}, {registration.state || ""}
              </Typography>
            </Stack>
          )}
        </Box>

        {/* Status Chips */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Tooltip title={regStatusConfig.description} arrow>
            <Chip
              label={regStatusConfig.label}
              icon={regStatusConfig.icon}
              size="small"
              sx={{
                bgcolor: regStatusConfig.bg,
                color: regStatusConfig.color,
                fontWeight: 600,
                height: 24,
                fontSize: "0.7rem",
                "& .MuiChip-icon": { fontSize: 14 },
              }}
            />
          </Tooltip>
          <Tooltip title={leadStatusConfig.description} arrow>
            <Chip
              label={registration.status || "Unknown"}
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
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(PRIMARY, 0.1)}` }}>
            {/* Additional Info */}
            <Grid container spacing={2}>
              {registration.address && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Address
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                    {registration.address}
                  </Typography>
                </Grid>
              )}
              {registration.registrationNotes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Notes
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                    {registration.registrationNotes}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Created
                </Typography>
                <Typography variant="body2">
                  {formatDate(registration.createdAt, "dd MMM yyyy")}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {formatDate(registration.updatedAt, "dd MMM yyyy")}
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
                onClick={() => onView(registration)}
                sx={{
                  bgcolor: PRIMARY,
                  "&:hover": { bgcolor: SECONDARY },
                }}
              >
                View
              </Button>
              {userPermissions.canEdit && (
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => onEdit(registration)}
                  sx={{
                    borderColor: PRIMARY,
                    color: PRIMARY,
                    "&:hover": { bgcolor: alpha(PRIMARY, 0.1) },
                  }}
                >
                  Edit
                </Button>
              )}
              {userPermissions.canUploadDocs && (
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={() => onUpload(registration)}
                  sx={{
                    borderColor: PRIMARY,
                    color: PRIMARY,
                    "&:hover": { bgcolor: alpha(PRIMARY, 0.1) },
                  }}
                >
                  Upload
                </Button>
              )}
            </Stack>
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
};

// ========== IMAGE VIEWER MODAL ==========
const ImageViewerModal = ({ open, onClose, imageUrl, title }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleZoomIn = useCallback(
    () => setZoom((prev) => Math.min(prev + 0.25, 3)),
    [],
  );
  const handleZoomOut = useCallback(
    () => setZoom((prev) => Math.max(prev - 0.25, 0.5)),
    [],
  );
  const handleRotateRight = useCallback(
    () => setRotation((prev) => (prev + 90) % 360),
    [],
  );
  const handleRotateLeft = useCallback(
    () => setRotation((prev) => (prev - 90 + 360) % 360),
    [],
  );
  const handleReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const resolvedImageUrl = useMemo(
    () => normalizeHostedDocumentUrl(imageUrl),
    [imageUrl],
  );
  const isImage = useMemo(
    () => resolvedImageUrl && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(resolvedImageUrl),
    [resolvedImageUrl],
  );

  const handleDownload = useCallback(() => {
    if (!resolvedImageUrl) return;
    const link = document.createElement("a");
    link.href = resolvedImageUrl;
    link.download = `document_${Date.now()}`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [resolvedImageUrl]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={fullscreen ? false : "lg"}
      fullWidth
      fullScreen={fullscreen || isMobile}
      PaperProps={fullscreen || isMobile ? { style: { margin: 0, height: "100vh" } } : {}}
      TransitionComponent={isMobile ? Slide : Fade}
      transitionDuration={300}
    >
      <DialogTitle
        sx={{
          bgcolor: alpha(PRIMARY, 0.05),
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pr: 2,
          py: 1.5,
        }}
      >
        <Typography variant="h6" fontWeight={600} noWrap sx={{ maxWidth: '70%' }}>
          {title || "Document Viewer"}
        </Typography>
        <Box display="flex" gap={1}>
          {!isMobile && (
            <Tooltip title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <IconButton onClick={() => setFullscreen(!fullscreen)} size="small">
                {fullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Download">
            <IconButton onClick={handleDownload} size="small">
              <GetApp />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          p: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: fullscreen || isMobile ? "#000" : "transparent",
          minHeight: fullscreen || isMobile ? "calc(100vh - 64px)" : 400,
        }}
      >
        {isImage ? (
          <Box
            sx={{
              position: "relative",
              overflow: "auto",
              maxWidth: "100%",
              maxHeight: fullscreen || isMobile ? "100vh" : "70vh",
              p: fullscreen || isMobile ? 0 : 2,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={resolvedImageUrl}
              alt="Document"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: "transform 0.3s ease",
                maxWidth: "100%",
                maxHeight: fullscreen || isMobile ? "100vh" : "70vh",
                display: "block",
                margin: "0 auto",
                objectFit: 'contain',
              }}
            />
          </Box>
        ) : (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Description
              sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Document Preview Not Available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This file type cannot be previewed. Please download to view.
            </Typography>
            <Button
              variant="contained"
              startIcon={<GetApp />}
              onClick={handleDownload}
              sx={{ mt: 2, bgcolor: PRIMARY }}
            >
              Download Document
            </Button>
          </Box>
        )}
      </DialogContent>
      {isImage && (
        <DialogActions
          sx={{
            bgcolor: "background.paper",
            borderTop: 1,
            borderColor: "divider",
            justifyContent: "center",
            gap: 1,
            py: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn} size="small">
              <ZoomIn />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut} size="small">
              <ZoomOut />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rotate Right">
            <IconButton onClick={handleRotateRight} size="small">
              <RotateRight />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rotate Left">
            <IconButton onClick={handleRotateLeft} size="small">
              <RotateLeft />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset">
            <IconButton onClick={handleReset} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" sx={{ ml: { sm: 2 }, color: "text.secondary" }}>
            {Math.round(zoom * 100)}% • {rotation}°
          </Typography>
        </DialogActions>
      )}
    </Dialog>
  );
};

// ========== DOCUMENT CARD COMPONENT ==========
const DocumentCard = ({
  title,
  url,
  icon,
  filename,
  onView,
  onDownload,
}) => {
  const handleView = useCallback(() => {
    if (onView) onView(url, title);
  }, [onView, url, title]);

  const handleDownload = useCallback(() => {
    if (onDownload) onDownload(url, filename);
  }, [onDownload, url, filename]);

  return (
    <Card
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        {icon}
        <Typography variant="body2" fontWeight={600} noWrap>
          {title}
        </Typography>
      </Box>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={1} 
        sx={{ mt: "auto" }}
      >
        <Button
          fullWidth
          size="small"
          variant="outlined"
          startIcon={<Visibility />}
          onClick={handleView}
          sx={{
            borderColor: PRIMARY,
            color: PRIMARY,
            "&:hover": {
              borderColor: PRIMARY,
              bgcolor: alpha(PRIMARY, 0.05),
            },
          }}
        >
          View
        </Button>
        <Button
          fullWidth
          size="small"
          variant="contained"
          startIcon={<GetApp />}
          onClick={handleDownload}
          sx={{ bgcolor: PRIMARY, "&:hover": { bgcolor: SECONDARY } }}
        >
          Download
        </Button>
      </Stack>
    </Card>
  );
};

// ========== VIEW REGISTRATION MODAL ==========
const ViewRegistrationModal = ({
  open,
  onClose,
  registration,
  userRole,
  showSnackbar,
  handleViewDocument,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [activeTab, setActiveTab] = useState(0);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const userRoleConfig = useMemo(() => getRoleConfig(userRole), [userRole]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDownload = (url, filename) => {
    if (!url) {
      showSnackbar("No document available to download", "error");
      return;
    }
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "document";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!registration) return null;

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
              bgcolor: alpha(PRIMARY, 0.02),
              border: `1px solid ${alpha(PRIMARY, 0.1)}`,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2.5,
                color: PRIMARY,
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
                  {registration.firstName} {registration.lastName}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                  {registration.email || "Not set"}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body2">
                  {registration.phone || "Not set"}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: alpha(PRIMARY, 0.02),
              border: `1px solid ${alpha(PRIMARY, 0.1)}`,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2.5,
                color: PRIMARY,
                fontWeight: 600,
              }}
            >
              <SolarPower sx={{ fontSize: 20 }} /> Registration Information
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
                  Registration Status
                </Typography>
                <Chip
                  label={getRegistrationStatusConfig(registration.registrationStatus).label}
                  icon={getRegistrationStatusConfig(registration.registrationStatus).icon}
                  size="small"
                  sx={{
                    bgcolor: getRegistrationStatusConfig(registration.registrationStatus).bg,
                    color: getRegistrationStatusConfig(registration.registrationStatus).color,
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
                  label={registration.status || "Unknown"}
                  icon={getLeadStatusConfig(registration.status).icon}
                  size="small"
                  sx={{
                    bgcolor: getLeadStatusConfig(registration.status).bg,
                    color: getLeadStatusConfig(registration.status).color,
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Registration Date
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatDate(getRegistrationDateValue(registration), "dd MMM yyyy")}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Solar Requirement
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {registration.solarRequirement || "Not specified"}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: alpha(PRIMARY, 0.02),
              border: `1px solid ${alpha(PRIMARY, 0.1)}`,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2.5,
                color: PRIMARY,
                fontWeight: 600,
              }}
            >
              <LocationOn sx={{ fontSize: 20 }} /> Address Information
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body2">
                  {registration.address || "Not set"}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  City
                </Typography>
                <Typography variant="body2">
                  {registration.city || "Not set"}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  State
                </Typography>
                <Typography variant="body2">
                  {registration.state || "Not set"}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Pincode
                </Typography>
                <Typography variant="body2">
                  {registration.pincode || "Not set"}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      ),
    },
    {
      label: "Documents",
      icon: <FolderOpen />,
      content: (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ mb: 3, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Uploaded Documents
          </Typography>
          <Grid container spacing={2}>
            {registration.uploadDocument?.url && (
              <Grid item xs={12} sm={6} md={4}>
                <DocumentCard
                  title="Registration Document"
                  url={registration.uploadDocument.url}
                  icon={<Description sx={{ color: PRIMARY }} />}
                  filename="registration-document"
                  onView={handleViewDocument}
                  onDownload={handleDownload}
                />
              </Grid>
            )}
            {registration.aadhaar?.url && (
              <Grid item xs={12} sm={6} md={4}>
                <DocumentCard
                  title="Aadhaar Card"
                  url={registration.aadhaar.url}
                  icon={<BadgeIcon sx={{ color: PRIMARY }} />}
                  filename="aadhaar-card"
                  onView={handleViewDocument}
                  onDownload={handleDownload}
                />
              </Grid>
            )}
            {registration.panCard?.url && (
              <Grid item xs={12} sm={6} md={4}>
                <DocumentCard
                  title="PAN Card"
                  url={registration.panCard.url}
                  icon={<CreditCard sx={{ color: PRIMARY }} />}
                  filename="pan-card"
                  onView={handleViewDocument}
                  onDownload={handleDownload}
                />
              </Grid>
            )}
            {registration.passbook?.url && (
              <Grid item xs={12} sm={6} md={4}>
                <DocumentCard
                  title="Bank Passbook"
                  url={registration.passbook.url}
                  icon={<ReceiptLong sx={{ color: PRIMARY }} />}
                  filename="passbook"
                  onView={handleViewDocument}
                  onDownload={handleDownload}
                />
              </Grid>
            )}
            {registration.otherDocuments?.map((doc, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <DocumentCard
                  title={doc.name || `Document ${index + 1}`}
                  url={doc.url}
                  icon={<InsertDriveFile sx={{ color: PRIMARY }} />}
                  filename={doc.name}
                  onView={handleViewDocument}
                  onDownload={handleDownload}
                />
              </Grid>
            ))}
          </Grid>
          {!registration.uploadDocument?.url &&
            !registration.aadhaar?.url &&
            !registration.panCard?.url &&
            !registration.passbook?.url &&
            (!registration.otherDocuments || registration.otherDocuments.length === 0) && (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <FolderOpen sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Documents Uploaded
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No documents have been uploaded for this registration yet.
                </Typography>
              </Box>
            )}
        </Box>
      ),
    },
    {
      label: "Notes",
      icon: <Note />,
      content: (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: alpha(PRIMARY, 0.02),
            border: `1px solid ${alpha(PRIMARY, 0.1)}`,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 2.5,
              color: PRIMARY,
              fontWeight: 600,
            }}
          >
            <Note sx={{ fontSize: 20 }} /> Registration Notes
          </Typography>
          {registration.registrationNotes ? (
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {registration.registrationNotes}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No notes available
            </Typography>
          )}
        </Paper>
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
            bgcolor: alpha(PRIMARY, 0.02),
            border: `1px solid ${alpha(PRIMARY, 0.1)}`,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 2.5,
              color: PRIMARY,
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
                  {formatDate(registration.createdAt, "dd MMM yyyy")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(registration.createdAt, "hh:mm a")}
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
                  {formatDate(registration.updatedAt, "dd MMM yyyy")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(registration.updatedAt, "hh:mm a")}
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
          bgcolor: PRIMARY,
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
                color: PRIMARY,
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                fontWeight: 600,
              }}
            >
              {getInitials(registration.firstName, registration.lastName)}
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                {registration.firstName} {registration.lastName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: "0.7rem", sm: "0.75rem" },
                }}
              >
                Registration Details • ID: {registration._id?.slice(-8)}
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
          {loadingDetails ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress sx={{ color: PRIMARY }} />
            </Box>
          ) : (
            tabs[activeTab].content
          )}
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
              bgcolor: alpha(PRIMARY, 0.1),
              color: PRIMARY,
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
              bgcolor: PRIMARY,
              "&:hover": { bgcolor: SECONDARY },
            }}
          >
            Close
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

// ========== EDIT REGISTRATION MODAL ==========
const EditRegistrationModal = ({
  open,
  onClose,
  registration,
  onSave,
  userRole,
  showSnackbar,
}) => {
  const { fetchAPI } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    pincode: "",
    solarRequirement: "",
    dateOfRegistration: null,
    registrationStatus: "In progress",
    registrationNotes: "",
    status: "Registration",
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (open && registration) {
      setFormData({
        address: registration.address || "",
        city: registration.city || "",
        pincode: registration.pincode || "",
        solarRequirement: registration.solarRequirement || "",
        dateOfRegistration: registration.dateOfRegistration
          ? parseISO(registration.dateOfRegistration)
          : registration.createdAt
            ? parseISO(registration.createdAt)
            : null,
        registrationStatus: registration.registrationStatus || "inProgress",
        registrationNotes: registration.registrationNotes || "",
        status: registration.status || "Registration",
      });
      setValidationErrors({});
    }
  }, [open, registration]);

  const validateForm = useCallback(() => {
    const errors = {
      address: validateRequiredField(formData.address, "Address"),
      city: validateRequiredField(formData.city, "City"),
      pincode: validatePincode(formData.pincode),
      solarRequirement: validateRequiredField(
        formData.solarRequirement,
        "Solar requirement",
      ),
    };

    setValidationErrors(errors);
    return Object.values(errors).every((error) => error === "");
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      showSnackbar("Please fix the errors in the form", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        address: formData.address.trim(),
        city: formData.city.trim(),
        pincode: formData.pincode.trim(),
        solarRequirement: formData.solarRequirement.trim(),
        registrationStatus: formData.registrationStatus,
        registrationNotes: formData.registrationNotes.trim(),
        status: formData.status,
      };

      if (formData.dateOfRegistration && isValid(formData.dateOfRegistration)) {
        payload.dateOfRegistration = format(
          formData.dateOfRegistration,
          "yyyy-MM-dd",
        );
      }

      const response = await fetchAPI(
        `/lead/updateLead/${registration._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (response?.success) {
        showSnackbar("Registration updated successfully", "success");
        onSave(response.result);
        onClose();
      } else {
        throw new Error(response?.message || "Failed to update registration");
      }
    } catch (error) {
      console.error("Error updating registration:", error);
      showSnackbar(error.message || "Failed to update registration", "error");
    } finally {
      setLoading(false);
    }
  }, [
    formData,
    validateForm,
    registration,
    fetchAPI,
    showSnackbar,
    onSave,
    onClose,
  ]);

  if (!registration) return null;

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
          bgcolor: alpha(PRIMARY, 0.05),
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
                bgcolor: alpha(PRIMARY, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: PRIMARY,
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
                Edit Registration
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                {registration.firstName} {registration.lastName}
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
          <TextField
            label="Address *"
            value={formData.address}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                address: e.target.value,
              }))
            }
            fullWidth
            multiline
            rows={isMobile ? 2 : 3}
            size="small"
            error={!!validationErrors.address}
            helperText={validationErrors.address}
            required
          />

          <TextField
            label="City *"
            value={formData.city}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, city: e.target.value }))
            }
            fullWidth
            size="small"
            error={!!validationErrors.city}
            helperText={validationErrors.city}
            required
          />

          <TextField
            label="Pincode *"
            value={formData.pincode}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                pincode: e.target.value,
              }))
            }
            fullWidth
            size="small"
            error={!!validationErrors.pincode}
            helperText={validationErrors.pincode}
            required
            inputProps={{ maxLength: 6 }}
          />

          <FormControl fullWidth size="small" error={!!validationErrors.solarRequirement}>
            <InputLabel>Solar Requirement *</InputLabel>
            <Select
              value={formData.solarRequirement}
              label="Solar Requirement *"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  solarRequirement: e.target.value,
                }))
              }
            >
              <MenuItem value="">
                <em>Select requirement</em>
              </MenuItem>
              {SOLAR_REQUIREMENT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
            {validationErrors.solarRequirement && (
              <FormHelperText>{validationErrors.solarRequirement}</FormHelperText>
            )}
          </FormControl>

          <DatePicker
            label="Registration Date"
            value={formData.dateOfRegistration}
            onChange={(newValue) =>
              setFormData((prev) => ({
                ...prev,
                dateOfRegistration: newValue,
              }))
            }
            slotProps={{
              textField: { 
                fullWidth: true, 
                size: "small",
              },
            }}
          />

          <FormControl fullWidth size="small">
            <InputLabel>Registration Status</InputLabel>
            <Select
              value={formData.registrationStatus}
              label="Registration Status"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  registrationStatus: e.target.value,
                }))
              }
            >
              {REGISTRATION_STATUS_OPTIONS.map((status) => {
                const config = getRegistrationStatusConfig(status);
                return (
                  <MenuItem key={status} value={status}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {config.icon}
                      <span>{config.label}</span>
                    </Stack>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Lead Status</InputLabel>
            <Select
              value={formData.status}
              label="Lead Status"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
            >
              {LEAD_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status} value={status}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {getLeadStatusConfig(status).icon}
                    <span>{status}</span>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Registration Notes"
            value={formData.registrationNotes}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                registrationNotes: e.target.value,
              }))
            }
            fullWidth
            multiline
            rows={isMobile ? 2 : 3}
            size="small"
            placeholder="Add any comments or notes about this registration..."
          />
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
            borderColor: PRIMARY,
            color: PRIMARY,
            "&:hover": { bgcolor: alpha(PRIMARY, 0.05) },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          fullWidth={isMobile}
          size={isMobile ? "medium" : "large"}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={20} sx={{ color: "#fff" }} />
            ) : (
              <SaveIcon />
            )
          }
          sx={{
            bgcolor: PRIMARY,
            "&:hover": { bgcolor: SECONDARY },
          }}
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ========== DOCUMENT UPLOAD MODAL ==========
const DocumentUploadModal = ({
  open,
  onClose,
  registration,
  onUpload,
  userRole,
  showSnackbar,
}) => {
  const { fetchAPI } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentType, setDocumentType] = useState("registration");
  const [validationErrors, setValidationErrors] = useState({});

  const documentTypes = [
    {
      value: "registration",
      label: "Registration Document",
      icon: <Description />,
    },
    { value: "aadhaar", label: "Aadhaar Card", icon: <BadgeIcon /> },
    { value: "panCard", label: "PAN Card", icon: <CreditCard /> },
    { value: "passbook", label: "Bank Passbook", icon: <ReceiptLong /> },
    { value: "other", label: "Other Document", icon: <InsertDriveFile /> },
  ];

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        showSnackbar(error, "error");
        return;
      }
      setDocumentFile(file);
      setValidationErrors({});
    }
  };

  const handleRemoveFile = () => {
    setDocumentFile(null);
    setUploadProgress(0);
  };

  const handleSubmit = async () => {
    if (!documentFile) {
      setValidationErrors({ document: "Please select a file to upload" });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("document", documentFile);
      formData.append("documentType", documentType);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetchAPI(
        `/lead/registration/${registration._id}/document-upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response?.success) {
        showSnackbar("Document uploaded successfully", "success");
        onUpload(response.result);
        setTimeout(() => onClose(), 500);
      } else {
        throw new Error(response?.message || "Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      showSnackbar(error.message || "Failed to upload document", "error");
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setDocumentFile(null);
    }
  };

  const handleClose = () => {
    setDocumentFile(null);
    setUploadProgress(0);
    setDocumentType("registration");
    setValidationErrors({});
    onClose();
  };

  if (!registration) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
          bgcolor: alpha(PRIMARY, 0.05),
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
                bgcolor: alpha(PRIMARY, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: PRIMARY,
              }}
            >
              <CloudUpload sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                Upload Document
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                {registration.firstName} {registration.lastName}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 }}}>
        <Stack spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Document Type</InputLabel>
            <Select
              value={documentType}
              label="Document Type"
              onChange={(e) => setDocumentType(e.target.value)}
            >
              {documentTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {type.icon}
                    <span>{type.label}</span>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box
            sx={{
              border: "2px dashed",
              borderColor: documentFile ? "success.main" : "divider",
              borderRadius: 2,
              p: { xs: 3, sm: 4 },
              textAlign: "center",
              bgcolor: documentFile ? alpha("#4caf50", 0.05) : "transparent",
              cursor: "pointer",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: alpha(PRIMARY, 0.05),
              },
            }}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
            {documentFile ? (
              <Stack spacing={2} alignItems="center">
                <Description sx={{ fontSize: 48, color: "success.main" }} />
                <Typography variant="body1" fontWeight={500} sx={{ wordBreak: 'break-word' }}>
                  {documentFile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatFileSize(documentFile.size)}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Delete />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  disabled={loading}
                  sx={{
                    borderColor: "error.main",
                    color: "error.main",
                  }}
                >
                  Remove File
                </Button>
              </Stack>
            ) : (
              <Stack spacing={2} alignItems="center">
                <CloudUpload sx={{ fontSize: 48, color: "text.secondary" }} />
                <Typography variant="body1">
                  Click to select a document
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supports PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                </Typography>
              </Stack>
            )}
          </Box>

          {validationErrors.document && (
            <Alert severity="error" sx={{ mt: 1 }}>
              <Typography variant="body2">
                {validationErrors.document}
              </Typography>
            </Alert>
          )}

          {loading && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Uploading document... {uploadProgress}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
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
          onClick={handleClose}
          variant="outlined"
          fullWidth={isMobile}
          size={isMobile ? "medium" : "large"}
          sx={{
            borderColor: PRIMARY,
            color: PRIMARY,
            "&:hover": { bgcolor: alpha(PRIMARY, 0.05) },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          fullWidth={isMobile}
          size={isMobile ? "medium" : "large"}
          disabled={loading || !documentFile}
          startIcon={
            loading ? (
              <CircularProgress size={20} sx={{ color: "#fff" }} />
            ) : (
              <CloudUpload />
            )
          }
          sx={{
            bgcolor: PRIMARY,
            "&:hover": { bgcolor: SECONDARY },
          }}
        >
          {loading ? "Uploading..." : "Upload Document"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ========== LOADING SKELETON ==========
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

// ========== EMPTY STATE ==========
const EmptyState = ({ onClearFilters, hasFilters }) => (
  <Box sx={{ textAlign: "center", py: 8, px: 2 }}>
    <Box
      sx={{
        width: 120,
        height: 120,
        borderRadius: "50%",
        bgcolor: alpha(PRIMARY, 0.1),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mx: "auto",
        mb: 3,
      }}
    >
      <HowToReg sx={{ fontSize: 48, color: PRIMARY }} />
    </Box>
    <Typography variant="h6" fontWeight={600} gutterBottom>
      No registrations found
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
    >
      {hasFilters
        ? "No registrations match your current filters. Try adjusting your search criteria."
        : "No registrations have been submitted yet."}
    </Typography>
    {hasFilters && (
      <Button
        variant="contained"
        onClick={onClearFilters}
        startIcon={<Clear />}
        sx={{ bgcolor: PRIMARY, "&:hover": { bgcolor: SECONDARY } }}
      >
        Clear All Filters
      </Button>
    )}
  </Box>
);

// ========== SUMMARY CARD ==========
const SummaryCard = ({ card, index }) => (
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
);

// ========== MAIN COMPONENT ==========
export default function RegistrationPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { fetchAPI, user, getUserRole } = useAuth();
  const userRole = getUserRole();
  const userPermissions = useMemo(
    () => getUserPermissions(userRole),
    [userRole],
  );

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
  const [registrationsData, setRegistrationsData] = useState({
    registrations: [],
    summary: {
      totalRegistrations: 0,
      pendingRegistrations: 0,
      completedRegistrations: 0,
      inProgressRegistrations: 0,
      approvedRegistrations: 0,
      rejectedRegistrations: 0,
    },
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [registrationStatusFilter, setRegistrationStatusFilter] =
    useState("All");
  const [leadStatusFilter, setLeadStatusFilter] = useState("All");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const [dateFilterError, setDateFilterError] = useState("");

  // View Mode
  const [viewMode, setViewMode] = useState(isMobile ? "card" : "table");

  // Sorting & Pagination
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

  // Modal States
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [documentUploadModalOpen, setDocumentUploadModalOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedActionRegistration, setSelectedActionRegistration] =
    useState(null);

  // Refs
  const containerRef = useRef(null);

  // Snackbar Handler
  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Fetch Data
  const fetchRegistrationsData = useCallback(async () => {
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
        `/lead/registrationSummary?${params.toString()}`,
      );

      if (response?.success) {
        const data = response.result || {};
        const rawRegistrations = data.registrations || [];

        let filteredRegs = rawRegistrations;
        if (userRole === "TEAM" && user?._id) {
          filteredRegs = rawRegistrations.filter(
            (reg) =>
              reg.assignedTo === user._id ||
              reg.assignedManager === user._id ||
              reg.assignedUser === user._id ||
              reg.assignedUser?._id === user._id ||
              reg.createdBy === user._id,
          );
        }

        const totalRegistrations = filteredRegs.length;
        const pendingRegistrations = filteredRegs.filter(
          (reg) => reg.registrationStatus?.toLowerCase() === "pending",
        ).length;
        const completedRegistrations = filteredRegs.filter(
          (reg) => reg.registrationStatus?.toLowerCase() === "completed",
        ).length;
        const inProgressRegistrations = filteredRegs.filter(
          (reg) => reg.registrationStatus?.toLowerCase() === "in_progress",
        ).length;
        const approvedRegistrations = filteredRegs.filter(
          (reg) => reg.registrationStatus?.toLowerCase() === "approved",
        ).length;
        const rejectedRegistrations = filteredRegs.filter(
          (reg) => reg.registrationStatus?.toLowerCase() === "rejected",
        ).length;

        setRegistrationsData({
          registrations: filteredRegs,
          summary: {
            totalRegistrations,
            pendingRegistrations,
            completedRegistrations,
            inProgressRegistrations,
            approvedRegistrations,
            rejectedRegistrations,
          },
        });
      } else {
        throw new Error(
          response?.message || "Failed to fetch registrations data",
        );
      }
    } catch (err) {
      console.error("Error fetching registrations:", err);
      setError(err.message || "Network error. Please try again.");
      showSnackbar(
        err.message || "Failed to fetch registrations data",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [period, fetchAPI, userRole, user, showSnackbar]);

  // Apply Filters
  const applyFilters = useCallback(() => {
    try {
      let filtered = [...registrationsData.registrations];

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (reg) =>
            (reg.firstName?.toLowerCase() || "").includes(query) ||
            (reg.lastName?.toLowerCase() || "").includes(query) ||
            (reg.email?.toLowerCase() || "").includes(query) ||
            (reg.phone || "").includes(query) ||
            (reg.address?.toLowerCase() || "").includes(query) ||
            (reg.city?.toLowerCase() || "").includes(query),
        );
      }

      if (registrationStatusFilter !== "All") {
        filtered = filtered.filter(
          (reg) => reg.registrationStatus === registrationStatusFilter,
        );
      }

      if (leadStatusFilter !== "All") {
        filtered = filtered.filter((reg) => reg.status === leadStatusFilter);
      }

      if (
        dateFilter.startDate &&
        isValid(dateFilter.startDate) &&
        dateFilter.endDate &&
        isValid(dateFilter.endDate)
      ) {
        const start = startOfDay(new Date(dateFilter.startDate));
        const end = endOfDay(new Date(dateFilter.endDate));

        filtered = filtered.filter((reg) => {
          try {
            const registrationDateValue = getRegistrationDateValue(reg);
            const regDate = registrationDateValue
              ? parseISO(registrationDateValue)
              : null;
            if (!regDate || !isValid(regDate)) return false;
            return isWithinInterval(regDate, { start, end });
          } catch {
            return false;
          }
        });
      }

      if (sortConfig.key) {
        filtered.sort((a, b) => {
          let aVal = a[sortConfig.key];
          let bVal = b[sortConfig.key];

          if (
            sortConfig.key === "dateOfRegistration" ||
            sortConfig.key === "createdAt"
          ) {
            if (sortConfig.key === "dateOfRegistration") {
              aVal = getRegistrationDateValue(a);
              bVal = getRegistrationDateValue(b);
            }
            aVal = aVal ? parseISO(aVal) : new Date(0);
            bVal = bVal ? parseISO(bVal) : new Date(0);
          } else if (sortConfig.key === "firstName") {
            aVal = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
            bVal = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
          } else if (sortConfig.key === "registrationStatus") {
            aVal = getRegistrationStatusConfig(aVal)?.order || 0;
            bVal = getRegistrationStatusConfig(bVal)?.order || 0;
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
      return registrationsData.registrations;
    }
  }, [
    registrationsData.registrations,
    searchQuery,
    registrationStatusFilter,
    leadStatusFilter,
    dateFilter,
    sortConfig,
    showSnackbar,
  ]);

  // Memoized Computed Values
  const filteredRegistrations = useMemo(() => applyFilters(), [applyFilters]);

  const paginatedRegistrations = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRegistrations.slice(start, start + rowsPerPage);
  }, [filteredRegistrations, page, rowsPerPage]);

  const totalPages = useMemo(
    () => Math.ceil(filteredRegistrations.length / rowsPerPage),
    [filteredRegistrations.length, rowsPerPage],
  );

  const summaryCards = useMemo(
    () => [
      {
        label: "Total",
        value: registrationsData.summary.totalRegistrations,
        color: PRIMARY,
        icon: <HowToReg />,
        subText: "All registrations",
      },
      {
        label: "Pending",
        value: registrationsData.summary.pendingRegistrations,
        color: PRIMARY,
        icon: <PendingActions />,
        subText: "Pending review",
      },
      {
        label: "Completed",
        value: registrationsData.summary.completedRegistrations,
        color: PRIMARY,
        icon: <CheckCircle />,
        subText: "Completed",
      },
      {
        label: "Approved",
        value: registrationsData.summary.approvedRegistrations,
        color: PRIMARY,
        icon: <Verified />,
        subText: "Approved",
      },
    ],
    [registrationsData.summary],
  );

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (registrationStatusFilter !== "All") count++;
    if (leadStatusFilter !== "All") count++;
    if (dateFilter.startDate) count++;
    if (dateFilter.endDate) count++;
    return count;
  }, [searchQuery, registrationStatusFilter, leadStatusFilter, dateFilter]);

  // Effects
  useEffect(() => {
    if (hasAccess(userRole)) {
      fetchRegistrationsData();
    }
  }, [fetchRegistrationsData, userRole]);

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
    (registration) => {
      if (!registration?._id) {
        showSnackbar("Invalid registration data", "error");
        return;
      }
      setSelectedRegistration(registration);
      setViewModalOpen(true);
    },
    [showSnackbar],
  );

  const handleEditClick = useCallback(
    (registration) => {
      if (!registration?._id) {
        showSnackbar("Invalid registration data", "error");
        return;
      }
      if (!userPermissions.canEdit) {
        showSnackbar(
          "You don't have permission to edit this registration",
          "error",
        );
        return;
      }
      setSelectedRegistration(registration);
      setEditModalOpen(true);
    },
    [userPermissions, showSnackbar],
  );

  const handleDocumentUploadClick = useCallback(
    (registration) => {
      if (!registration?._id) {
        showSnackbar("Invalid registration data", "error");
        return;
      }
      if (!userPermissions.canUploadDocs) {
        showSnackbar("You don't have permission to upload documents", "error");
        return;
      }
      setSelectedRegistration(registration);
      setDocumentUploadModalOpen(true);
    },
    [userPermissions, showSnackbar],
  );

  const handleRegistrationUpdate = useCallback(
    async (updatedRegistration) => {
      try {
        await fetchRegistrationsData();
        showSnackbar("Registration updated successfully", "success");
      } catch (err) {
        console.error("Error after registration update:", err);
        showSnackbar("Failed to refresh data", "error");
      }
    },
    [fetchRegistrationsData, showSnackbar],
  );

  const handleDocumentUpload = useCallback(
    async (updatedRegistration) => {
      try {
        await fetchRegistrationsData();
        showSnackbar("Document uploaded successfully", "success");
      } catch (err) {
        console.error("Error after document upload:", err);
        showSnackbar("Failed to refresh data", "error");
      }
    },
    [fetchRegistrationsData, showSnackbar],
  );

  const handleActionMenuOpen = useCallback((event, registration) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedActionRegistration(registration);
  }, []);

  const handleActionMenuClose = useCallback(() => {
    setActionMenuAnchor(null);
    setSelectedActionRegistration(null);
  }, []);

  const handleActionSelect = useCallback(
    (action) => {
      if (!selectedActionRegistration) return;

      switch (action) {
        case "view":
          handleViewClick(selectedActionRegistration);
          break;
        case "edit":
          handleEditClick(selectedActionRegistration);
          break;
        case "upload_document":
          handleDocumentUploadClick(selectedActionRegistration);
          break;
        default:
          break;
      }

      handleActionMenuClose();
    },
    [
      selectedActionRegistration,
      handleViewClick,
      handleEditClick,
      handleDocumentUploadClick,
      handleActionMenuClose,
    ],
  );

  const handleViewDocument = useCallback(
    (documentUrl, documentName = "Document") => {
      if (!documentUrl) {
        showSnackbar("No document available to view", "error");
        return;
      }
      setCurrentImageUrl(documentUrl);
      setImageViewerOpen(true);
    },
    [showSnackbar],
  );

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setRegistrationStatusFilter("All");
    setLeadStatusFilter("All");
    setDateFilter({ startDate: null, endDate: null });
    setDateFilterError("");
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

  if (loading && registrationsData.registrations.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error && registrationsData.registrations.length === 0) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        <Alert
          severity="error"
          sx={{ borderRadius: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchRegistrationsData}>
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
      <ImageViewerModal
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={currentImageUrl}
        title="Document Preview"
      />

      <ViewRegistrationModal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        registration={selectedRegistration}
        userRole={userRole}
        showSnackbar={showSnackbar}
        handleViewDocument={handleViewDocument}
      />

      <EditRegistrationModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        registration={selectedRegistration}
        onSave={handleRegistrationUpdate}
        userRole={userRole}
        showSnackbar={showSnackbar}
      />

      <DocumentUploadModal
        open={documentUploadModalOpen}
        onClose={() => setDocumentUploadModalOpen(false)}
        registration={selectedRegistration}
        onUpload={handleDocumentUpload}
        userRole={userRole}
        showSnackbar={showSnackbar}
      />

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        period={period}
        setPeriod={setPeriod}
        registrationStatusFilter={registrationStatusFilter}
        setRegistrationStatusFilter={setRegistrationStatusFilter}
        leadStatusFilter={leadStatusFilter}
        setLeadStatusFilter={setLeadStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        dateFilterError={dateFilterError}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeFilterCount={activeFilterCount}
        onClear={handleClearFilters}
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
          sx={{ width: "100%", borderRadius: 2 , color:"#fff"}}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            minWidth: 200,
          },
        }}
      >
        <MenuItem onClick={() => handleActionSelect("view")}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        {userPermissions.canEdit && (
          <MenuItem onClick={() => handleActionSelect("edit")}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        {userPermissions.canUploadDocs && (
          <MenuItem onClick={() => handleActionSelect("upload_document")}>
            <ListItemIcon>
              <CloudUpload fontSize="small" />
            </ListItemIcon>
            <ListItemText>Upload Document</ListItemText>
          </MenuItem>
        )}
      </Menu>

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
        {/* Header with Gradient Background */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
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
                Registration Management
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              >
                Track and manage all customer registrations
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
                onClick={fetchRegistrationsData}
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
            <Grid item xs={6} sm={6} md={3} key={card.label}>
              <SummaryCard card={card} index={index} />
            </Grid>
          ))}
        </Grid>

        {/* Mobile Search Bar */}
        {isMobile && (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery("")}>
                      <Close />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}

        {/* Desktop Search and Filters */}
        {!isMobile && (
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by name, email, phone or location..."
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
                    borderColor: PRIMARY,
                    color: PRIMARY,
                    "&:hover": { bgcolor: alpha(PRIMARY, 0.05) },
                  }}
                >
                  {showFilterPanel ? "Hide Filters" : "More Filters"}
                </Button>

                {activeFilterCount > 0 && (
                  <Button
                    variant="text"
                    startIcon={<Clear />}
                    onClick={handleClearFilters}
                    sx={{ color: "error.main" }}
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
                    borderColor: alpha(PRIMARY, 0.2),
                    bgcolor: alpha(PRIMARY, 0.02),
                  }}
                >
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Registration Status
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={registrationStatusFilter}
                          onChange={(e) => setRegistrationStatusFilter(e.target.value)}
                        >
                          <MenuItem value="All">All Statuses</MenuItem>
                          {REGISTRATION_STATUS_OPTIONS.map((status) => {
                            const config = getRegistrationStatusConfig(status);
                            return (
                              <MenuItem key={status} value={status}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  {config.icon}
                                  <span>{config.label}</span>
                                </Stack>
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Lead Status
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={leadStatusFilter}
                          onChange={(e) => setLeadStatusFilter(e.target.value)}
                        >
                          <MenuItem value="All">All Statuses</MenuItem>
                          {LEAD_STATUS_OPTIONS.map((status) => (
                            <MenuItem key={status} value={status}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                {getLeadStatusConfig(status).icon}
                                <span>{status}</span>
                              </Stack>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
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
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
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
                          bgcolor: alpha(PRIMARY, 0.1),
                          color: PRIMARY,
                        }}
                      />
                    )}
                    {registrationStatusFilter !== "All" && (
                      <Chip
                        label={`Reg Status: ${getRegistrationStatusConfig(registrationStatusFilter).label}`}
                        size="small"
                        onDelete={() => setRegistrationStatusFilter("All")}
                        sx={{
                          bgcolor: alpha(PRIMARY, 0.1),
                          color: PRIMARY,
                        }}
                      />
                    )}
                    {leadStatusFilter !== "All" && (
                      <Chip
                        label={`Lead Status: ${leadStatusFilter}`}
                        size="small"
                        onDelete={() => setLeadStatusFilter("All")}
                        sx={{
                          bgcolor: alpha(PRIMARY, 0.1),
                          color: PRIMARY,
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
                          bgcolor: alpha(PRIMARY, 0.1),
                          color: PRIMARY,
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
                          bgcolor: alpha(PRIMARY, 0.1),
                          color: PRIMARY,
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
              Registrations
              <Chip
                label={`${filteredRegistrations.length} total`}
                size="small"
                sx={{
                  ml: 1,
                  bgcolor: alpha(PRIMARY, 0.1),
                  color: PRIMARY,
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
              {loading && registrationsData.registrations.length > 0 && (
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
                        bgcolor: alpha(PRIMARY, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      <Button
                        size="small"
                        onClick={() => handleSort("firstName")}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Customer
                        {sortConfig.key === "firstName" && (
                          sortConfig.direction === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      <Button
                        size="small"
                        onClick={() => handleSort("dateOfRegistration")}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Date
                        {sortConfig.key === "dateOfRegistration" && (
                          sortConfig.direction === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      Solar Requirement
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      <Button
                        size="small"
                        onClick={() => handleSort("registrationStatus")}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Status
                        {sortConfig.key === "registrationStatus" && (
                          sortConfig.direction === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      Lead Status
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      Assigned To
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRegistrations.length > 0 ? (
                    paginatedRegistrations.map((registration) => {
                      const regStatusConfig = getRegistrationStatusConfig(
                        registration.registrationStatus,
                      );
                      const leadStatusConfig = getLeadStatusConfig(
                        registration.status,
                      );

                      return (
                        <TableRow key={registration._id} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: PRIMARY,
                                  fontSize: '0.875rem',
                                }}
                              >
                                {getInitials(registration.firstName, registration.lastName)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {registration.firstName} {registration.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {registration.phone || 'No phone'}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            {formatDate(getRegistrationDateValue(registration), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <SolarPower fontSize="small" sx={{ color: PRIMARY }} />
                              <Typography variant="body2">
                                {registration.solarRequirement || "—"}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={regStatusConfig.description} arrow>
                              <Chip
                                label={regStatusConfig.label}
                                icon={regStatusConfig.icon}
                                size="small"
                                sx={{
                                  bgcolor: regStatusConfig.bg,
                                  color: regStatusConfig.color,
                                  fontWeight: 600,
                                  minWidth: 80,
                                }}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={leadStatusConfig.description} arrow>
                              <Chip
                                label={registration.status || "Unknown"}
                                icon={leadStatusConfig.icon}
                                size="small"
                                sx={{
                                  bgcolor: leadStatusConfig.bg,
                                  color: leadStatusConfig.color,
                                  fontWeight: 600,
                                  minWidth: 80,
                                }}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const assignedPerson = getAssignedPerson(registration);

                              return assignedPerson ? (
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    {assignedPerson.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {assignedPerson.role}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  Unassigned
                                </Typography>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                size="small"
                                onClick={() => handleViewClick(registration)}
                                sx={{
                                  bgcolor: alpha(PRIMARY, 0.1),
                                  color: PRIMARY,
                                }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                              {userPermissions.canEdit && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditClick(registration)}
                                  sx={{
                                    bgcolor: alpha(PRIMARY, 0.1),
                                    color: PRIMARY,
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              )}
                              {userPermissions.canUploadDocs && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleDocumentUploadClick(registration)}
                                  sx={{
                                    bgcolor: alpha(PRIMARY, 0.1),
                                    color: PRIMARY,
                                  }}
                                >
                                  <CloudUpload fontSize="small" />
                                </IconButton>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
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
              {loading && registrationsData.registrations.length > 0 && (
                <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />
              )}
              {paginatedRegistrations.length > 0 ? (
                paginatedRegistrations.map((registration) => (
                  <MobileRegistrationCard
                    key={registration._id}
                    registration={registration}
                    onView={handleViewClick}
                    onEdit={handleEditClick}
                    onUpload={handleDocumentUploadClick}
                    userPermissions={userPermissions}
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

          {filteredRegistrations.length > 0 && (
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
                {Math.min((page + 1) * rowsPerPage, filteredRegistrations.length)} of{" "}
                {filteredRegistrations.length}
              </Typography>
              <Pagination
                count={totalPages}
                page={page + 1}
                onChange={handleChangePage}
                color="primary"
                size={isMobile ? "small" : "medium"}
                sx={{
                  "& .MuiPaginationItem-root": {
                    borderRadius: 2,
                    "&.Mui-selected": { bgcolor: PRIMARY, color: "#fff" },
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
            {registrationsData.summary.totalRegistrations} total registrations
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
              bgcolor: PRIMARY,
              "&:hover": { bgcolor: SECONDARY },
              boxShadow: `0 4px 12px ${alpha(PRIMARY, 0.3)}`,
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
