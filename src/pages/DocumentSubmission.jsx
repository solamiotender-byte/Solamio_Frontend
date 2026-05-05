// pages/DocumentSubmissionPage.jsx (Fixed - jsonData not defined)
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
  Badge,
  SwipeableDrawer,
  Collapse,
  Fab,
  Zoom,
  Fade,
  Slide,
  BottomNavigation,
  BottomNavigationAction,
  Tab,
  Tabs,
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
  Tune,
  ArrowUpward,
  ArrowDownward,
  Save,
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
  DateRange,
  FilterAlt,
  Sort,
  ViewList,
  ViewModule,
  Dashboard,
  ExpandMore,
  ExpandLess,
  InsertDriveFile,
  PictureAsPdfOutlined,
  DescriptionOutlined,
  Image as ImageIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
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
const PRIMARY_COLOR = "#4569ea";
const SECONDARY_COLOR = "#1a237e";
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50];
const DEFAULT_ITEMS_PER_PAGE = 10;
const ALLOWED_ROLES = ["Head_office", "ZSM", "ASM", "TEAM"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
];

const IMAGE_DOCUMENT_REGEX = /\.(jpg|jpeg|png|gif|bmp|webp)(\?.*)?$/i;
const PDF_DOCUMENT_REGEX = /\.pdf(\?.*)?$/i;

const isImageDocumentUrl = (url) =>
  Boolean(url && IMAGE_DOCUMENT_REGEX.test(url));

const isPdfDocumentUrl = (url) =>
  Boolean(url && PDF_DOCUMENT_REGEX.test(url));

// Period Options
const PERIOD_OPTIONS = [
  { value: "Today", label: "Today", icon: <CalendarToday /> },
  { value: "This Week", label: "This Week", icon: <DateRange /> },
  { value: "This Month", label: "This Month", icon: <DateRange /> },
  { value: "All", label: "All Time", icon: <DateRange /> },
];

// Lead Status Configuration for Document Submission Page
const LEAD_STATUS_OPTIONS = [
  "Document Submission",
  "Bank Loan Apply",
  "Missed Leads",
];

const LEAD_STATUS_CONFIG = {
  "Document Submission": {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    icon: <Description sx={{ fontSize: 16 }} />,
    description: "Documents submitted for verification",
  },
  "Bank Loan Apply": {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    icon: <PendingActions sx={{ fontSize: 16 }} />,
    description: "Waiting for bank approval",
  },
  "Missed Leads": {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    icon: <Cancel sx={{ fontSize: 16 }} />,
    description: "Lead lost or not converted",
  },
};

// Document Status Configuration
const DOCUMENT_STATUS_CONFIG = {
  submitted: {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    label: "Submitted",
    icon: <CheckCircle sx={{ fontSize: 16 }} />,
    order: 1,
  },
  pending: {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    label: "Pending",
    icon: <PendingActions sx={{ fontSize: 16 }} />,
    order: 2,
  },
  rejected: {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    label: "Rejected",
    icon: <Cancel sx={{ fontSize: 16 }} />,
    order: 3,
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

// ========== HELPER FUNCTIONS ==========
const hasAccess = (userRole) => ALLOWED_ROLES.includes(userRole);

const getUserPermissions = (userRole) => ({
  canView: ["Head_office", "ZSM", "ASM", "TEAM"].includes(userRole),
  canEdit: ["Head_office", "ZSM", "ASM", "TEAM"].includes(userRole),
  canDelete: userRole === "Head_office",
  canManage: ["Head_office", "ZSM", "ASM", "TEAM"].includes(userRole),
  canSeeAll: ["Head_office", "ZSM", "ASM"].includes(userRole),
  canSeeOwn: userRole === "TEAM",
  canUpdateStatus: ["Head_office", "ZSM", "ASM", "TEAM"].includes(userRole),
});

// Helper: safely compare an id field that may be a string OR a populated object
const matchesUserId = (field, userId) => {
  if (!field || !userId) return false;
  if (typeof field === "string") return field === userId;
  if (typeof field === "object" && field._id) return field._id === userId || field._id?.toString() === userId?.toString();
  return field?.toString() === userId?.toString();
};

const getDocumentStatusConfig = (status) => {
  const normalizedStatus = status?.toLowerCase();
  return (
    DOCUMENT_STATUS_CONFIG[normalizedStatus] || {
      bg: alpha(PRIMARY_COLOR, 0.08),
      color: PRIMARY_COLOR,
      label: "Not Submitted",
      icon: <PendingActions sx={{ fontSize: 16 }} />,
      order: 0,
    }
  );
};

const getLeadStatusConfig = (status) => {
  return (
    LEAD_STATUS_CONFIG[status] || {
      bg: alpha(PRIMARY_COLOR, 0.08),
      color: PRIMARY_COLOR,
      icon: <Warning sx={{ fontSize: 16 }} />,
      description: "Unknown status",
      label: status || "Unknown",
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

// ========== MOBILE FILTER DRAWER ==========
const MobileFilterDrawer = ({
  open,
  onClose,
  period,
  setPeriod,
  statusFilter,
  setStatusFilter,
  leadStatusFilter,
  setLeadStatusFilter,
  dateFilter,
  setDateFilter,
  handleClearFilters,
  dateFilterError,
  searchQuery,
  setSearchQuery,
  sortConfig,
  setSortConfig,
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
              Filter Documents
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
                    placeholder="Search by name, email, phone..."
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

            {/* Document Status Section */}
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
                onClick={() => toggleSection("docStatus")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Description sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Document Status
                  </Typography>
                </Stack>
                {expandedSection === "docStatus" ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={expandedSection === "docStatus"}>
                <Box sx={{ p: 2 }}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="All">All Statuses</MenuItem>
                      <MenuItem value="submitted">Submitted</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Collapse>
            </Paper>

            {/* Lead Status Section */}
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
                onClick={() => toggleSection("leadStatus")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <TrendingUp sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />
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
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
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
                      { key: "documentSubmissionDate", label: "Submission Date" },
                      { key: "documentStatus", label: "Document Status" },
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

// ========== MOBILE DOCUMENT CARD ==========
const MobileDocumentCard = ({ document, onView, onEdit, onStatusUpdate, permissions }) => {
  const [expanded, setExpanded] = useState(false);

  const docStatusConfig = getDocumentStatusConfig(document.documentStatus);
  const leadStatusConfig = getLeadStatusConfig(document.status);
  const initials = getInitials(document.firstName, document.lastName);

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
                {document.firstName} {document.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {document._id?.slice(-8) || "N/A"}
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
              <Email sx={{ fontSize: 14, color: alpha(PRIMARY_COLOR, 0.6) }} />
              <Typography variant="caption" noWrap>
                {document.email || "No email"}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={6}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Phone sx={{ fontSize: 14, color: alpha(PRIMARY_COLOR, 0.6) }} />
              <Typography variant="caption" noWrap>
                {document.phone || "No phone"}
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        {/* Submission Info */}
        <Box sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarToday
              sx={{ fontSize: 14, color: alpha(PRIMARY_COLOR, 0.6) }}
            />
            <Typography variant="body2" fontWeight={500}>
              {formatDate(document.documentSubmissionDate, "dd MMM yyyy")}
            </Typography>
          </Stack>
        </Box>

        {/* Status Chips */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Tooltip title={`Document Status: ${docStatusConfig.label}`} arrow>
            <Chip
              label={docStatusConfig.label}
              icon={docStatusConfig.icon}
              size="small"
              sx={{
                bgcolor: docStatusConfig.bg,
                color: docStatusConfig.color,
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
            {/* Documents Count */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={4}>
                <Paper
                  sx={{
                    p: 1,
                    textAlign: "center",
                    bgcolor: alpha(PRIMARY_COLOR, 0.05),
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Aadhaar
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {document.aadhaar?.url ? "✓" : "—"}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper
                  sx={{
                    p: 1,
                    textAlign: "center",
                    bgcolor: alpha(PRIMARY_COLOR, 0.05),
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    PAN
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {document.panCard?.url ? "✓" : "—"}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper
                  sx={{
                    p: 1,
                    textAlign: "center",
                    bgcolor: alpha(PRIMARY_COLOR, 0.05),
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Passbook
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {document.passbook?.url ? "✓" : "—"}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Additional Info */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Created
                </Typography>
                <Typography variant="body2">
                  {formatDate(document.createdAt, "dd MMM yyyy")}
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
                  {formatDate(document.updatedAt, "dd MMM yyyy")}
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
                onClick={() => onView(document)}
                sx={{
                  bgcolor: PRIMARY_COLOR,
                  "&:hover": { bgcolor: SECONDARY_COLOR },
                }}
              >
                View
              </Button>
              {permissions.canEdit && (
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={() => onEdit(document)}
                  sx={{
                    borderColor: PRIMARY_COLOR,
                    color: PRIMARY_COLOR,
                    "&:hover": { bgcolor: alpha(PRIMARY_COLOR, 0.1) },
                  }}
                >
                  Upload
                </Button>
              )}
              {permissions.canUpdateStatus && (
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<TrendingUp />}
                  onClick={() => onStatusUpdate(document)}
                  sx={{
                    borderColor: PRIMARY_COLOR,
                    color: PRIMARY_COLOR,
                    "&:hover": { bgcolor: alpha(PRIMARY_COLOR, 0.1) },
                  }}
                >
                  Status
                </Button>
              )}
            </Stack>
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
};

// ========== FILE UPLOAD FIELD COMPONENT ==========
const FileUploadField = ({
  label,
  field,
  value,
  onFileChange,
  onRemove,
  validationErrors,
}) => {
  const fileInputRef = useRef(null);
  const previewUrl = isImageDocumentUrl(value?.preview)
    ? value.preview
    : null;
  const existingUrl = value?.url || "";
  const hasDocument = Boolean(previewUrl || existingUrl);
  const isExistingImage = isImageDocumentUrl(existingUrl);
  const isExistingPdf = isPdfDocumentUrl(existingUrl);

  const handleBoxClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (event) => {
      onFileChange(field, event);
    },
    [field, onFileChange],
  );

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
        {label}
      </Typography>
      {hasDocument ? (
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              border: "1px solid",
              borderColor: validationErrors[field] ? "error.main" : "#e0e0e0",
              borderRadius: 2,
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "#f9f9f9",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{ flex: 1 }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: "cover",
                    borderRadius: 4,
                  }}
                />
              ) : isExistingPdf ? (
                <PictureAsPdfOutlined sx={{ color: PRIMARY_COLOR, fontSize: 40 }} />
              ) : isExistingImage ? (
                <ImageIcon sx={{ color: PRIMARY_COLOR, fontSize: 40 }} />
              ) : existingUrl ? (
                <DescriptionOutlined sx={{ color: PRIMARY_COLOR, fontSize: 40 }} />
              ) : (
                <ImageIcon sx={{ color: PRIMARY_COLOR, fontSize: 40 }} />
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap>
                  {value.file?.name ||
                    (existingUrl ? label : "No file selected")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {value.file
                    ? formatFileSize(value.file.size)
                    : existingUrl
                      ? "Existing document"
                      : "Click to upload"}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Remove">
                <IconButton
                  size="small"
                  onClick={() => onRemove(field)}
                  color="error"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
          {validationErrors[field] && (
            <FormHelperText error>{validationErrors[field]}</FormHelperText>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            border: "2px dashed",
            borderColor: validationErrors[field] ? "error.main" : "#e0e0e0",
            borderRadius: 2,
            p: 3,
            textAlign: "center",
            bgcolor: "#f9f9f9",
            cursor: "pointer",
            transition: "all 0.2s",
            "&:hover": {
              borderColor: PRIMARY_COLOR,
              bgcolor: alpha(PRIMARY_COLOR, 0.05),
            },
          }}
          onClick={handleBoxClick}
        >
          <CloudUpload sx={{ fontSize: 48, color: "#bdbdbd", mb: 1 }} />
          <Typography color="text.secondary">
            Click to upload {label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Supports JPG, PNG, PDF (Max 5MB)
          </Typography>
        </Box>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />
    </Box>
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

  const isImage = useMemo(() => isImageDocumentUrl(imageUrl), [imageUrl]);
  const isPdf = useMemo(() => isPdfDocumentUrl(imageUrl), [imageUrl]);

  const handleDownload = useCallback(() => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `document_${Date.now()}`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageUrl]);

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
          bgcolor: alpha(PRIMARY_COLOR, 0.05),
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
              src={imageUrl}
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
        ) : isPdf ? (
          <Box
            sx={{
              width: "100%",
              height: fullscreen || isMobile ? "calc(100vh - 64px)" : "70vh",
              bgcolor: "#fff",
            }}
          >
            <iframe
              src={imageUrl}
              title={title || "Document Viewer"}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          </Box>
        ) : (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <DescriptionOutlined
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
              sx={{
                mt: 2,
                bgcolor: PRIMARY_COLOR,
                "&:hover": { bgcolor: SECONDARY_COLOR },
              }}
            >
              Download Document
            </Button>
          </Box>
        )}
      </DialogContent>
      {(isImage || isPdf) && (
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
          {isImage && (
            <>
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
            </>
          )}
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
      <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
        <Button
          fullWidth
          size="small"
          variant="outlined"
          startIcon={<Visibility />}
          onClick={handleView}
          sx={{
            borderColor: PRIMARY_COLOR,
            color: PRIMARY_COLOR,
            "&:hover": {
              borderColor: PRIMARY_COLOR,
              bgcolor: alpha(PRIMARY_COLOR, 0.05),
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
          sx={{ bgcolor: PRIMARY_COLOR, "&:hover": { bgcolor: SECONDARY_COLOR } }}
        >
          Download
        </Button>
      </Stack>
    </Card>
  );
};

// ========== LEAD STATUS UPDATE MODAL ==========
const LeadStatusUpdateModal = ({
  open,
  onClose,
  lead,
  onStatusUpdate,
  showSnackbar,
}) => {
  const { fetchAPI, user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [errors, setErrors] = useState({});

  const leadStatusConfig = useMemo(
    () => getLeadStatusConfig(lead?.status),
    [lead?.status],
  );

  useEffect(() => {
    if (open && lead) {
      setSelectedStatus(lead.status || "");
      setErrors({});
    }
  }, [open, lead]);

  const handleSubmit = useCallback(async () => {
    if (!selectedStatus) {
      setErrors({ status: "Please select a status" });
      return;
    }

    if (selectedStatus === lead?.status) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        status: selectedStatus,
        updatedBy: user?._id,
        updatedByRole: user?.role,
      };

      const response = await fetchAPI(`/lead/updateLead/${lead._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.success) {
        showSnackbar("Lead status updated successfully", "success");
        onStatusUpdate(response.result);
        onClose();
      } else {
        throw new Error(response.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating lead status:", error);
      setErrors({ submit: error.message });
      showSnackbar(error.message || "Failed to update status", "error");
    } finally {
      setLoading(false);
    }
  }, [
    selectedStatus,
    lead,
    user,
    fetchAPI,
    showSnackbar,
    onStatusUpdate,
    onClose,
  ]);

  const handleClose = useCallback(() => {
    setSelectedStatus("");
    setErrors({});
    onClose();
  }, [onClose]);

  const availableStatuses = useMemo(
    () => LEAD_STATUS_OPTIONS.filter((status) => status !== lead?.status),
    [lead?.status],
  );

  if (!lead) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: 3 } }}
      TransitionComponent={isMobile ? Slide : Fade}
      transitionDuration={300}
    >
      <DialogTitle sx={{ bgcolor: alpha(PRIMARY_COLOR, 0.05), pb: 2 }}>
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
                bgcolor: `${PRIMARY_COLOR}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: PRIMARY_COLOR,
              }}
            >
              <TrendingUp sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Update Lead Status
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {lead?.firstName} {lead?.lastName}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="medium">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ py: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          {errors.submit && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {errors.submit}
            </Alert>
          )}

          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={600}
              gutterBottom
              sx={{ mt: 2 }}
            >
              Current Status
            </Typography>
            <Chip
              label={lead?.status || "Unknown"}
              icon={leadStatusConfig.icon}
              sx={{
                bgcolor: leadStatusConfig.bg,
                color: leadStatusConfig.color,
                fontWeight: 600,
                fontSize: "0.875rem",
                px: 1,
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              {leadStatusConfig.description}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              New Status *
            </Typography>
            <FormControl fullWidth size="small" error={!!errors.status}>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Select new status
                </MenuItem>
                {availableStatuses.map((status) => {
                  const config = getLeadStatusConfig(status);
                  return (
                    <MenuItem key={status} value={status}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                      >
                        {config.icon}
                        <Box>
                          <Typography variant="body2">{status}</Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {config.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  );
                })}
              </Select>
              {errors.status && (
                <FormHelperText>{errors.status}</FormHelperText>
              )}
            </FormControl>
          </Box>
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
          disabled={loading}
          sx={{
            borderColor: PRIMARY_COLOR,
            color: PRIMARY_COLOR,
            "&:hover": {
              borderColor: PRIMARY_COLOR,
              bgcolor: alpha(PRIMARY_COLOR, 0.05),
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          fullWidth={isMobile}
          size={isMobile ? "medium" : "large"}
          disabled={
            loading || !selectedStatus || selectedStatus === lead?.status
          }
          startIcon={loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : <Save />}
          sx={{
            bgcolor: PRIMARY_COLOR,
            px: 4,
            "&:hover": { bgcolor: SECONDARY_COLOR },
            "&.Mui-disabled": {
              bgcolor: "#ccc",
            },
          }}
        >
          {loading ? "Updating..." : "Update Status"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ========== VIEW LEAD MODAL ==========
const ViewLeadModal = ({
  open,
  onClose,
  lead,
  userRole,
  showSnackbar,
  handleViewDocument,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [activeTab, setActiveTab] = useState(0);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [leadDetails, setLeadDetails] = useState(null);

  const userRoleConfig = useMemo(() => getRoleConfig(userRole), [userRole]);

  useEffect(() => {
    if (open && lead?._id) {
      setLeadDetails(lead);
    }
  }, [open, lead]);

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

  if (!lead) return null;

  const displayData = leadDetails || lead;

  const tabs = [
    {
      label: "Basic Info",
      icon: <Person />,
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    marginBottom: "20px",
                    color: PRIMARY_COLOR,
                  }}
                >
                  <Person /> Personal Information
                </Typography>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Full Name
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {displayData.firstName} {displayData.lastName}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {displayData.email || "Not set"}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body1">
                      {displayData.phone || "Not set"}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body1">
                      {displayData.address || "Not set"}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      City
                    </Typography>
                    <Typography variant="body1">
                      {displayData.city || "Not set"}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    marginBottom: "20px",
                    color: PRIMARY_COLOR,
                  }}
                >
                  <Description /> Document Information
                </Typography>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Document Status
                    </Typography>
                    <Chip
                      label={
                        getDocumentStatusConfig(displayData.documentStatus)
                          .label
                      }
                      icon={
                        getDocumentStatusConfig(displayData.documentStatus)
                          .icon
                      }
                      size="small"
                      sx={{
                        bgcolor: getDocumentStatusConfig(
                          displayData.documentStatus,
                        ).bg,
                        color: getDocumentStatusConfig(
                          displayData.documentStatus,
                        ).color,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Divider />
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Lead Status
                    </Typography>
                    <Chip
                      label={displayData.status || "Unknown"}
                      icon={getLeadStatusConfig(displayData.status).icon}
                      size="small"
                      sx={{
                        bgcolor: getLeadStatusConfig(displayData.status).bg,
                        color: getLeadStatusConfig(displayData.status).color,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Divider />
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Submission Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(displayData.documentSubmissionDate)}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Created Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(displayData.createdAt)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ),
    },
    {
      label: "Documents",
      icon: <FolderOpen />,
      content: (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Uploaded Documents
          </Typography>
          <Grid container spacing={2}>
            {displayData.aadhaar?.url && (
              <Grid item xs={12}>
                <DocumentCard
                  title="Aadhaar Card"
                  url={displayData.aadhaar.url}
                  icon={<BadgeIcon sx={{ color: PRIMARY_COLOR }} />}
                  filename="aadhaar-card"
                  onView={handleViewDocument}
                  onDownload={handleDownload}
                />
              </Grid>
            )}
            {displayData.panCard?.url && (
              <Grid item xs={12}>
                <DocumentCard
                  title="PAN Card"
                  url={displayData.panCard.url}
                  icon={<CreditCard sx={{ color: PRIMARY_COLOR }} />}
                  filename="pan-card"
                  onView={handleViewDocument}
                  onDownload={handleDownload}
                />
              </Grid>
            )}
            {displayData.passbook?.url && (
              <Grid item xs={12}>
                <DocumentCard
                  title="Bank Passbook"
                  url={displayData.passbook.url}
                  icon={<ReceiptLong sx={{ color: PRIMARY_COLOR }} />}
                  filename="passbook"
                  onView={handleViewDocument}
                  onDownload={handleDownload}
                />
              </Grid>
            )}
            {displayData.uploadDocument?.url && (
              <Grid item xs={12}>
                <DocumentCard
                  title="Registration Document"
                  url={displayData.uploadDocument.url}
                  icon={<Description sx={{ color: PRIMARY_COLOR }} />}
                  filename="registration-document"
                  onView={handleViewDocument}
                  onDownload={handleDownload}
                />
              </Grid>
            )}
            {displayData.otherDocuments?.map((doc, index) => (
              <Grid item xs={12} key={index}>
                <DocumentCard
                  title={doc.name || `Other Document ${index + 1}`}
                  url={doc.url}
                  icon={<InsertDriveFile sx={{ color: PRIMARY_COLOR }} />}
                  filename={doc.name}
                  onView={handleViewDocument}
                  onDownload={handleDownload}
                />
              </Grid>
            ))}
          </Grid>
          {!displayData.aadhaar?.url &&
            !displayData.panCard?.url &&
            !displayData.passbook?.url &&
            !displayData.uploadDocument?.url &&
            (!displayData.otherDocuments || displayData.otherDocuments.length === 0) && (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <FolderOpen sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Documents Uploaded
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No documents have been uploaded for this lead yet.
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
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Document Notes
            </Typography>
            {displayData.documentNotes ? (
              <Paper
                sx={{
                  p: 3,
                  bgcolor: "grey.50",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "grey.300",
                }}
              >
                <Typography
                  variant="body1"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {displayData.documentNotes}
                </Typography>
              </Paper>
            ) : (
              <Typography color="text.secondary" sx={{ py: 4 }}>
                No notes available
              </Typography>
            )}
          </CardContent>
        </Card>
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
              {getInitials(displayData.firstName, displayData.lastName)}
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                {displayData.firstName} {displayData.lastName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: "0.7rem", sm: "0.75rem" },
                }}
              >
                Document Details • ID: {displayData._id?.slice(-8)}
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
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight={200}
            >
              <CircularProgress sx={{ color: PRIMARY_COLOR }} />
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
};

// ========== EDIT LEAD MODAL ==========
const EditLeadModal = ({
  open,
  onClose,
  lead,
  onSave,
  userRole,
  showSnackbar,
}) => {
  const { fetchAPI } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    documentStatus: "pending",
    aadhaar: { file: null, url: "", preview: null },
    panCard: { file: null, url: "", preview: null },
    passbook: { file: null, url: "", preview: null },
    otherDocuments: [],
    documentSubmissionDate: null,
    documentNotes: "",
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (open && lead) {
      setFormData({
        documentStatus: lead.documentStatus || "pending",
        aadhaar: {
          file: null,
          url: lead.aadhaar?.url || "",
          preview: isImageDocumentUrl(lead.aadhaar?.url) ? lead.aadhaar.url : null,
        },
        panCard: {
          file: null,
          url: lead.panCard?.url || "",
          preview: isImageDocumentUrl(lead.panCard?.url) ? lead.panCard.url : null,
        },
        passbook: {
          file: null,
          url: lead.passbook?.url || "",
          preview: isImageDocumentUrl(lead.passbook?.url) ? lead.passbook.url : null,
        },
        otherDocuments: (lead.otherDocuments || []).map((doc) => ({
          ...doc,
          preview: isImageDocumentUrl(doc?.url) ? doc.url : null,
        })),
        documentSubmissionDate: lead.documentSubmissionDate
          ? parseISO(lead.documentSubmissionDate)
          : null,
        documentNotes: lead.documentNotes || "",
      });
      setValidationErrors({});
      setUploadProgress(0);
    }
  }, [open, lead]);

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      return "File size should be less than 5MB";
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "Only JPG, PNG and PDF files are allowed";
    }
    return "";
  };

  const handleFileChange = useCallback(
    (field, event) => {
      const file = event.target.files[0];
      if (!file) return;

      const error = validateFile(file);
      if (error) {
        showSnackbar(error, "error");
        return;
      }

      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null;

      setFormData((prev) => ({
        ...prev,
        [field]: { ...prev[field], file, preview },
      }));

      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    },
    [showSnackbar],
  );

  const handleRemoveFile = useCallback((field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: { file: null, url: "", preview: null },
    }));
  }, []);

  const handleAddOtherDocument = useCallback(
    (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const error = validateFile(file);
      if (error) {
        showSnackbar(error, "error");
        return;
      }

      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null;
      const newDoc = { file, name: file.name, url: "", preview };

      setFormData((prev) => ({
        ...prev,
        otherDocuments: [...prev.otherDocuments, newDoc],
      }));
    },
    [showSnackbar],
  );

  const handleRemoveOtherDocument = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      otherDocuments: prev.otherDocuments.filter((_, i) => i !== index),
    }));
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.documentStatus) {
      errors.documentStatus = "Document status is required";
    }

    if (formData.aadhaar.file) {
      const error = validateFile(formData.aadhaar.file);
      if (error) errors.aadhaar = error;
    }
    if (formData.panCard.file) {
      const error = validateFile(formData.panCard.file);
      if (error) errors.panCard = error;
    }
    if (formData.passbook.file) {
      const error = validateFile(formData.passbook.file);
      if (error) errors.passbook = error;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      showSnackbar("Please fix the errors in the form", "error");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const formDataToSend = new FormData();
      
      // ✅ FIXED: jsonData is now properly defined
      const jsonData = {};

      if (formData.documentNotes) {
        jsonData.documentNotes = formData.documentNotes;
      }

      if (formData.documentStatus) {
        jsonData.documentStatus = formData.documentStatus;
      }

      if (formData.documentSubmissionDate) {
        jsonData.documentSubmissionDate = format(
          formData.documentSubmissionDate,
          "yyyy-MM-dd",
        );
      }

      // Append files to FormData
      if (formData.aadhaar.file) {
        formDataToSend.append("aadhaar", formData.aadhaar.file);
      }
      if (formData.panCard.file) {
        formDataToSend.append("panCard", formData.panCard.file);
      }
      if (formData.passbook.file) {
        formDataToSend.append("passbook", formData.passbook.file);
      }

      formData.otherDocuments.forEach((doc) => {
        if (doc.file) {
          formDataToSend.append("otherDocuments", doc.file);
        }
      });

      // Append JSON data as string
      formDataToSend.append("data", JSON.stringify(jsonData));

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetchAPI(
        `/lead/upload/${lead._id}/upload-documents`,
        {
          method: "PUT",
          body: formDataToSend,
        },
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response?.success) {
        showSnackbar("Documents uploaded successfully", "success");
        onSave(response.result);
        setTimeout(() => onClose(), 500);
      } else {
        throw new Error(response?.message || "Failed to upload documents");
      }
    } catch (error) {
      console.error("Error uploading documents:", error);
      showSnackbar(error.message || "Failed to upload documents", "error");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }, [formData, validateForm, lead, fetchAPI, showSnackbar, onSave, onClose]);

  useEffect(() => {
    return () => {
      if (
        formData.aadhaar.preview &&
        formData.aadhaar.preview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(formData.aadhaar.preview);
      }
      if (
        formData.panCard.preview &&
        formData.panCard.preview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(formData.panCard.preview);
      }
      if (
        formData.passbook.preview &&
        formData.passbook.preview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(formData.passbook.preview);
      }
      formData.otherDocuments.forEach((doc) => {
        if (doc.preview && doc.preview.startsWith("blob:")) {
          URL.revokeObjectURL(doc.preview);
        }
      });
    };
  }, [formData]);

  if (!lead) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: 3 } }}
      TransitionComponent={isMobile ? Slide : Fade}
      transitionDuration={300}
    >
      <DialogTitle sx={{ bgcolor: alpha(PRIMARY_COLOR, 0.05), pb: 2 }}>
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
                bgcolor: `${PRIMARY_COLOR}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: PRIMARY_COLOR,
              }}
            >
              <CloudUpload sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Upload Documents
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {lead.firstName} {lead.lastName}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="medium" disabled={loading}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ py: { xs: 2, sm: 3 } }}>
        <Stack spacing={4} sx={{ mt: 2 }}>
          {loading && uploadProgress > 0 && (
            <Box sx={{ width: "100%", mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Uploading: {uploadProgress}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  "& .MuiLinearProgress-bar": {
                    bgcolor: PRIMARY_COLOR,
                  },
                }}
              />
            </Box>
          )}

          <FormControl
            fullWidth
            size="small"
            error={!!validationErrors.documentStatus}
          >
            <InputLabel>Document Status</InputLabel>
            <Select
              value={formData.documentStatus}
              label="Document Status"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  documentStatus: e.target.value,
                }))
              }
              disabled={loading}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
            {validationErrors.documentStatus && (
              <FormHelperText>
                {validationErrors.documentStatus}
              </FormHelperText>
            )}
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Document Submission Date"
              value={formData.documentSubmissionDate}
              onChange={(newValue) =>
                setFormData((prev) => ({
                  ...prev,
                  documentSubmissionDate: newValue,
                }))
              }
              disabled={loading}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                },
              }}
            />
          </LocalizationProvider>

          <Typography variant="subtitle1" fontWeight={600}>
            Required Documents
          </Typography>
          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12}>
              <FileUploadField
                label="Aadhaar Card"
                field="aadhaar"
                value={formData.aadhaar}
                onFileChange={handleFileChange}
                onRemove={handleRemoveFile}
                validationErrors={validationErrors}
              />
            </Grid>
            <Grid item xs={12}>
              <FileUploadField
                label="PAN Card"
                field="panCard"
                value={formData.panCard}
                onFileChange={handleFileChange}
                onRemove={handleRemoveFile}
                validationErrors={validationErrors}
              />
            </Grid>
            <Grid item xs={12}>
              <FileUploadField
                label="Passbook"
                field="passbook"
                value={formData.passbook}
                onFileChange={handleFileChange}
                onRemove={handleRemoveFile}
                validationErrors={validationErrors}
              />
            </Grid>
          </Grid>

          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Other Documents ({formData.otherDocuments.length})
            </Typography>
            {formData.otherDocuments.length > 0 && (
              <Stack spacing={2} sx={{ mb: 3 }}>
                {formData.otherDocuments.map((doc, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: "grey.300",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      {doc.preview ? (
                        <img
                          src={doc.preview}
                          alt={doc.name}
                          style={{
                            width: 40,
                            height: 40,
                            objectFit: "cover",
                            borderRadius: 4,
                          }}
                        />
                      ) : doc.url ? (
                        <DescriptionOutlined
                          sx={{ color: PRIMARY_COLOR, fontSize: 40 }}
                        />
                      ) : (
                        <ImageIcon sx={{ color: PRIMARY_COLOR, fontSize: 40 }} />
                      )}
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          noWrap
                          sx={{ maxWidth: 200 }}
                        >
                          {doc.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {doc.file
                            ? formatFileSize(doc.file.size)
                            : "Existing document"}
                        </Typography>
                      </Box>
                    </Stack>
                    <IconButton
                      onClick={() => handleRemoveOtherDocument(index)}
                      color="error"
                      size="small"
                      disabled={loading}
                    >
                      <Delete />
                    </IconButton>
                  </Paper>
                ))}
              </Stack>
            )}
            <Button
              variant="outlined"
              startIcon={<AddPhotoAlternate />}
              onClick={() =>
                document.getElementById("other-docs-file").click()
              }
              fullWidth
              disabled={loading}
              sx={{
                py: 2,
                borderColor: PRIMARY_COLOR,
                color: PRIMARY_COLOR,
                "&:hover": {
                  borderColor: PRIMARY_COLOR,
                  bgcolor: alpha(PRIMARY_COLOR, 0.05),
                },
              }}
            >
              Add More Documents
            </Button>
            <input
              type="file"
              id="other-docs-file"
              accept="image/*,application/pdf"
              style={{ display: "none" }}
              onChange={handleAddOtherDocument}
              multiple
            />
          </Box>

          <TextField
            label="Document Notes"
            value={formData.documentNotes}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                documentNotes: e.target.value,
              }))
            }
            fullWidth
            multiline
            rows={4}
            placeholder="Add any comments or notes..."
            variant="outlined"
            disabled={loading}
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
          disabled={loading}
          sx={{
            borderColor: PRIMARY_COLOR,
            color: PRIMARY_COLOR,
            "&:hover": {
              borderColor: PRIMARY_COLOR,
              bgcolor: alpha(PRIMARY_COLOR, 0.05),
            },
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
            loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : <CloudUpload />
          }
          sx={{
            bgcolor: PRIMARY_COLOR,
            px: 4,
            "&:hover": {
              bgcolor: SECONDARY_COLOR,
            },
            "&.Mui-disabled": {
              bgcolor: "#ccc",
            },
          }}
        >
          {loading ? "Uploading..." : "Upload Documents"}
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
        bgcolor: alpha(PRIMARY_COLOR, 0.1),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mx: "auto",
        mb: 3,
      }}
    >
      <Description sx={{ fontSize: 48, color: PRIMARY_COLOR }} />
    </Box>
    <Typography variant="h6" fontWeight={600} gutterBottom>
      No documents found
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
    >
      {hasFilters
        ? "No documents match your current filters. Try adjusting your search criteria."
        : "No documents have been submitted yet."}
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
export default function DocumentSubmissionPage() {
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
  const [period, setPeriod] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Data State
  const [documentsData, setDocumentsData] = useState({
    documents: [],
    summary: {
      totalDocuments: 0,
      submittedDocuments: 0,
      pendingDocuments: 0,
      rejectedDocuments: 0,
    },
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [leadStatusFilter, setLeadStatusFilter] = useState("All");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const [dateFilterError, setDateFilterError] = useState("");

  // Sorting & Pagination
  const [sortConfig, setSortConfig] = useState({
    key: "documentSubmissionDate",
    direction: "desc",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(
    isMobile ? 10 : DEFAULT_ITEMS_PER_PAGE,
  );

  // Modal States
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedActionLead, setSelectedActionLead] = useState(null);

  // Refs
  const containerRef = useRef(null);

  // Snackbar Handler
  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Fetch documents data with proper populated-object ID comparison
  const fetchDocumentsData = useCallback(async () => {
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
        `/lead/DocumentSummary${params.toString() ? `?${params.toString()}` : ""}`,
      );

      //console.log("document data...", response);

      if (response?.success) {
        const data = response.result || {};
        let rawDocuments = data.documents || [];

        // Role-based filtering using matchesUserId helper
        // This handles both plain string IDs and Mongoose populated objects
        if (userRole === "TEAM" && user?._id) {
          const uid = user._id?.toString();
          rawDocuments = rawDocuments.filter(
            (doc) =>
              matchesUserId(doc.createdBy, uid) ||
              matchesUserId(doc.assignedTo, uid) ||
              matchesUserId(doc.assignedManager, uid) ||
              matchesUserId(doc.assignedUser, uid) ||
              matchesUserId(doc.teamMember, uid),
          );
        } else if (userRole === "ASM" && user?._id) {
          const uid = user._id?.toString();
          rawDocuments = rawDocuments.filter(
            (doc) =>
              matchesUserId(doc.createdBy, uid) ||
              matchesUserId(doc.assignedManager, uid) ||
              matchesUserId(doc.assignedTo, uid) ||
              matchesUserId(doc.assignedUser, uid) ||
              matchesUserId(doc.areaManager, uid),
          );
        } else if (userRole === "ZSM" && user?._id) {
          const uid = user._id?.toString();
          rawDocuments = rawDocuments.filter(
            (doc) =>
              matchesUserId(doc.createdBy, uid) ||
              matchesUserId(doc.assignedManager, uid) ||
              matchesUserId(doc.zoneManager, uid) ||
              matchesUserId(doc.assignedUser, uid),
          );
        }
        // Head_office sees all — no filter applied

        

        const totalDocuments = rawDocuments.length;
        const submittedDocuments = rawDocuments.filter(
          (doc) => doc.documentStatus?.toLowerCase() === "submitted",
        ).length;
        const pendingDocuments = rawDocuments.filter(
          (doc) => doc.documentStatus?.toLowerCase() === "pending",
        ).length;
        const rejectedDocuments = rawDocuments.filter(
          (doc) => doc.documentStatus?.toLowerCase() === "rejected",
        ).length;

        setDocumentsData({
          documents: rawDocuments,
          summary: {
            totalDocuments,
            submittedDocuments,
            pendingDocuments,
            rejectedDocuments,
          },
        });
      } else {
        throw new Error(response?.message || "Failed to fetch documents data");
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError(err.message || "Network error. Please try again.");
      showSnackbar(err.message || "Failed to fetch documents data", "error");
      setDocumentsData({
        documents: [],
        summary: {
          totalDocuments: 0,
          submittedDocuments: 0,
          pendingDocuments: 0,
          rejectedDocuments: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [period, fetchAPI, userRole, user, showSnackbar]);

  // Apply Filters
  const applyFilters = useCallback(() => {
    try {
      let filtered = [...documentsData.documents];

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (doc) =>
            (doc.firstName?.toLowerCase() || "").includes(query) ||
            (doc.lastName?.toLowerCase() || "").includes(query) ||
            (doc.email?.toLowerCase() || "").includes(query) ||
            (doc.phone || "").includes(query),
        );
      }

      if (statusFilter !== "All") {
        filtered = filtered.filter(
          (doc) =>
            (doc.documentStatus?.toLowerCase() || "") ===
            statusFilter.toLowerCase(),
        );
      }

      if (leadStatusFilter !== "All") {
        filtered = filtered.filter(
          (doc) => (doc.status || "") === leadStatusFilter,
        );
      }

      if (
        dateFilter.startDate &&
        isValid(dateFilter.startDate) &&
        dateFilter.endDate &&
        isValid(dateFilter.endDate)
      ) {
        const start = startOfDay(new Date(dateFilter.startDate));
        const end = endOfDay(new Date(dateFilter.endDate));

        filtered = filtered.filter((doc) => {
          try {
            const docDate = doc.documentSubmissionDate
              ? parseISO(doc.documentSubmissionDate)
              : doc.createdAt
                ? parseISO(doc.createdAt)
                : null;
            if (!docDate || !isValid(docDate)) return false;
            return isWithinInterval(docDate, { start, end });
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
            sortConfig.key === "documentSubmissionDate" ||
            sortConfig.key === "createdAt"
          ) {
            aVal = aVal ? new Date(aVal) : new Date(0);
            bVal = bVal ? new Date(bVal) : new Date(0);
          } else if (sortConfig.key === "firstName") {
            aVal = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
            bVal = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
          } else if (sortConfig.key === "documentStatus") {
            aVal = getDocumentStatusConfig(a.documentStatus).order || 0;
            bVal = getDocumentStatusConfig(b.documentStatus).order || 0;
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
      return documentsData.documents;
    }
  }, [
    documentsData.documents,
    searchQuery,
    statusFilter,
    leadStatusFilter,
    dateFilter,
    sortConfig,
    showSnackbar,
  ]);

  // Effects
  useEffect(() => {
    if (hasAccess(userRole)) {
      fetchDocumentsData();
    }
  }, [fetchDocumentsData, userRole]);

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
    //console.log("Current documents count:", documentsData.documents.length);
  }, [documentsData.documents]);

  // Memoized Computed Values
  const filteredDocuments = useMemo(() => applyFilters(), [applyFilters]);

  const paginatedDocuments = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredDocuments.slice(start, start + rowsPerPage);
  }, [filteredDocuments, page, rowsPerPage]);

  const totalPages = useMemo(
    () => Math.ceil(filteredDocuments.length / rowsPerPage),
    [filteredDocuments.length, rowsPerPage],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (statusFilter !== "All") count++;
    if (leadStatusFilter !== "All") count++;
    if (dateFilter.startDate) count++;
    if (dateFilter.endDate) count++;
    return count;
  }, [searchQuery, statusFilter, leadStatusFilter, dateFilter]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Total Documents",
        value: documentsData.summary.totalDocuments,
        color: PRIMARY_COLOR,
        icon: <DescriptionOutlined />,
        subText: "All submitted documents",
      },
      {
        label: "Submitted",
        value: documentsData.summary.submittedDocuments,
        color: PRIMARY_COLOR,
        icon: <CheckCircle />,
        subText: "Successfully submitted",
      },
      {
        label: "Pending",
        value: documentsData.summary.pendingDocuments,
        color: PRIMARY_COLOR,
        icon: <PendingActions />,
        subText: "Awaiting verification",
      },
      {
        label: "Rejected",
        value: documentsData.summary.rejectedDocuments,
        color: PRIMARY_COLOR,
        icon: <Cancel />,
        subText: "Documents rejected",
      },
    ],
    [documentsData.summary],
  );

  // Handlers
  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleViewClick = useCallback(
    (document) => {
      if (!document?._id) {
        showSnackbar("Invalid document data", "error");
        return;
      }
      setSelectedDocument(document);
      setViewModalOpen(true);
    },
    [showSnackbar],
  );

  const handleEditClick = useCallback(
    (document) => {
      if (!document?._id) {
        showSnackbar("Invalid document data", "error");
        return;
      }
      if (!userPermissions.canEdit) {
        showSnackbar(
          "You don't have permission to edit this document",
          "error",
        );
        return;
      }
      setSelectedDocument(document);
      setEditModalOpen(true);
    },
    [userPermissions, showSnackbar],
  );

  const handleStatusUpdateClick = useCallback(
    (document) => {
      if (!document?._id) {
        showSnackbar("Invalid document data", "error");
        return;
      }
      if (!userPermissions.canUpdateStatus) {
        showSnackbar(
          "You don't have permission to update lead status",
          "error",
        );
        return;
      }
      setSelectedDocument(document);
      setStatusUpdateModalOpen(true);
    },
    [userPermissions, showSnackbar],
  );

  const handleStatusUpdate = useCallback(
    async (updatedLead) => {
      try {
        await fetchDocumentsData();
        showSnackbar("Lead status updated successfully", "success");
      } catch (err) {
        console.error("Error after status update:", err);
        showSnackbar("Failed to refresh data", "error");
      }
    },
    [fetchDocumentsData, showSnackbar],
  );

  const handleLeadUpdate = useCallback(
    async (updatedLead) => {
      try {
        await fetchDocumentsData();
        showSnackbar("Documents uploaded successfully", "success");
      } catch (err) {
        console.error("Error after document upload:", err);
        showSnackbar("Failed to refresh data", "error");
      }
    },
    [fetchDocumentsData, showSnackbar],
  );

  const handleActionMenuOpen = useCallback((event, document) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedActionLead(document);
  }, []);

  const handleActionMenuClose = useCallback(() => {
    setActionMenuAnchor(null);
    setSelectedActionLead(null);
  }, []);

  const handleActionSelect = useCallback(
    (action) => {
      if (!selectedActionLead) return;

      switch (action) {
        case "view":
          handleViewClick(selectedActionLead);
          break;
        case "edit":
          handleEditClick(selectedActionLead);
          break;
        case "update_status":
          handleStatusUpdateClick(selectedActionLead);
          break;
        default:
          break;
      }

      handleActionMenuClose();
    },
    [
      selectedActionLead,
      handleViewClick,
      handleEditClick,
      handleStatusUpdateClick,
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
    setStatusFilter("All");
    setLeadStatusFilter("All");
    setDateFilter({ startDate: null, endDate: null });
    setDateFilterError("");
    setSortConfig({ key: "documentSubmissionDate", direction: "desc" });
    setPage(0);
    if (showFilterPanel) setShowFilterPanel(false);
  }, [showFilterPanel]);

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

  if (loading && documentsData.documents.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error && documentsData.documents.length === 0) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        <Alert
          severity="error"
          sx={{ borderRadius: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={fetchDocumentsData}
              sx={{ color: PRIMARY_COLOR }}
            >
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

      <ViewLeadModal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        lead={selectedDocument}
        userRole={userRole}
        showSnackbar={showSnackbar}
        handleViewDocument={handleViewDocument}
      />

      <EditLeadModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        lead={selectedDocument}
        onSave={handleLeadUpdate}
        userRole={userRole}
        showSnackbar={showSnackbar}
      />

      <LeadStatusUpdateModal
        open={statusUpdateModalOpen}
        onClose={() => setStatusUpdateModalOpen(false)}
        lead={selectedDocument}
        onStatusUpdate={handleStatusUpdate}
        showSnackbar={showSnackbar}
      />

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        period={period}
        setPeriod={setPeriod}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        leadStatusFilter={leadStatusFilter}
        setLeadStatusFilter={setLeadStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        handleClearFilters={handleClearFilters}
        dateFilterError={dateFilterError}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
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
              <CloudUpload fontSize="small" />
            </ListItemIcon>
            <ListItemText>Upload Documents</ListItemText>
          </MenuItem>
        )}
        {userPermissions.canUpdateStatus && (
          <MenuItem onClick={() => handleActionSelect("update_status")}>
            <ListItemIcon>
              <TrendingUp fontSize="small" />
            </ListItemIcon>
            <ListItemText>Update Status</ListItemText>
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
                Document Submission Management
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              >
                Track and manage all document submissions and their status
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
                onClick={fetchDocumentsData}
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
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by name, email, phone..."
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

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Document Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Document Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="All">All Status</MenuItem>
                    <MenuItem value="submitted">Submitted</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
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
                        Lead Status
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={leadStatusFilter}
                          onChange={(e) => setLeadStatusFilter(e.target.value)}
                          displayEmpty
                        >
                          <MenuItem value="All">All Statuses</MenuItem>
                          {LEAD_STATUS_OPTIONS.map((status) => (
                            <MenuItem key={status} value={status}>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                              >
                                {getLeadStatusConfig(status).icon}
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
                        label={`Doc Status: ${statusFilter}`}
                        size="small"
                        onDelete={() => setStatusFilter("All")}
                        sx={{
                          bgcolor: alpha(PRIMARY_COLOR, 0.1),
                          color: PRIMARY_COLOR,
                        }}
                      />
                    )}
                    {leadStatusFilter !== "All" && (
                      <Chip
                        label={`Lead Status: ${leadStatusFilter}`}
                        size="small"
                        onDelete={() => setLeadStatusFilter("All")}
                        sx={{
                          bgcolor: alpha(PRIMARY_COLOR, 0.1),
                          color: PRIMARY_COLOR,
                        }}
                      />
                    )}
                    {dateFilter.startDate && (
                      <Chip
                        label={`From: ${format(
                          dateFilter.startDate,
                          "dd MMM yyyy",
                        )}`}
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
                        label={`To: ${format(
                          dateFilter.endDate,
                          "dd MMM yyyy",
                        )}`}
                        size="small"
                        onDelete={() =>
                          setDateFilter((prev) => ({
                            ...prev,
                            endDate: null,
                          }))
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
              Document Submissions
              <Chip
                label={`${filteredDocuments.length} total`}
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

          {!isMobile ? (
            <TableContainer
              sx={{ maxHeight: "70vh", overflow: "auto", position: "relative" }}
            >
              {loading && documentsData.documents.length > 0 && (
                <LinearProgress
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    "& .MuiLinearProgress-bar": {
                      bgcolor: PRIMARY_COLOR,
                    },
                  }}
                />
              )}

              <Table stickyHeader size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY_COLOR, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      Lead Details
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY_COLOR, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      <Button
                        size="small"
                        onClick={() => handleSort("documentSubmissionDate")}
                        endIcon={
                          sortConfig.key === "documentSubmissionDate" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUpward fontSize="small" />
                            ) : (
                              <ArrowDownward fontSize="small" />
                            )
                          ) : null
                        }
                        sx={{
                          justifyContent: "flex-start",
                          fontWeight: 600,
                          color: "inherit",
                          "&:hover": {
                            bgcolor: "transparent",
                          },
                        }}
                      >
                        Submission Date
                      </Button>
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY_COLOR, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      Document Status
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
                      Assigned To
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
                  {paginatedDocuments.length > 0 ? (
                    paginatedDocuments.map((document) => {
                      const docStatusConfig = getDocumentStatusConfig(
                        document.documentStatus,
                      );
                      const leadStatusConfig = getLeadStatusConfig(
                        document.status,
                      );

                      return (
                        <TableRow
                          key={document._id}
                          hover
                          sx={{
                            "&:hover": {
                              bgcolor: alpha(PRIMARY_COLOR, 0.02),
                            },
                          }}
                        >
                          <TableCell>
                            <Stack spacing={1}>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {document.firstName} {document.lastName}
                              </Typography>
                              <Stack spacing={0.5}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    color: "text.secondary",
                                  }}
                                >
                                  <Email fontSize="inherit" />
                                  {document.email || "No email"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    color: "text.secondary",
                                  }}
                                >
                                  <Phone fontSize="inherit" />
                                  {document.phone || "No phone"}
                                </Typography>
                              </Stack>
                            </Stack>
                          </TableCell>

                          <TableCell>
                            <Stack spacing={0.5}>
                              <Typography variant="body2">
                                {formatDate(document.documentSubmissionDate)}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatDate(document.createdAt, "dd MMM yyyy")}
                              </Typography>
                            </Stack>
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={docStatusConfig.label}
                              icon={docStatusConfig.icon}
                              size="small"
                              sx={{
                                bgcolor: docStatusConfig.bg,
                                color: docStatusConfig.color,
                                fontWeight: 600,
                                minWidth: 100,
                              }}
                            />
                          </TableCell>

                          <TableCell>
                            <Tooltip
                              title={leadStatusConfig.description}
                              arrow
                              placement="top"
                            >
                              <Chip
                                label={document.status || "Unknown"}
                                icon={leadStatusConfig.icon}
                                size="small"
                                sx={{
                                  bgcolor: leadStatusConfig.bg,
                                  color: leadStatusConfig.color,
                                  fontWeight: 600,
                                  minWidth: 120,
                                  cursor: "pointer",
                                }}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {document.assignedUser || document.assignedManager ? (
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {document.assignedUser
                                    ? `${document.assignedUser.firstName || ""} ${document.assignedUser.lastName || ""}`.trim()
                                    : `${document.assignedManager?.firstName || ""} ${document.assignedManager?.lastName || ""}`.trim()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {document.assignedUser
                                    ? document.assignedUser.role || "Assigned User"
                                    : document.assignedManager?.role || "Manager"}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Unassigned
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="View Details" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewClick(document)}
                                  sx={{
                                    bgcolor: alpha(PRIMARY_COLOR, 0.1),
                                    color: PRIMARY_COLOR,
                                    "&:hover": {
                                      bgcolor: alpha(PRIMARY_COLOR, 0.2),
                                    },
                                  }}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              {userPermissions.canEdit && (
                                <Tooltip title="Upload Documents" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditClick(document)}
                                    sx={{
                                      bgcolor: alpha(PRIMARY_COLOR, 0.1),
                                      color: PRIMARY_COLOR,
                                      "&:hover": {
                                        bgcolor: alpha(PRIMARY_COLOR, 0.2),
                                      },
                                    }}
                                  >
                                    <CloudUpload fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {userPermissions.canUpdateStatus && (
                                <Tooltip title="Update Status" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleStatusUpdateClick(document)
                                    }
                                    sx={{
                                      bgcolor: alpha(PRIMARY_COLOR, 0.1),
                                      color: PRIMARY_COLOR,
                                      "&:hover": {
                                        bgcolor: alpha(PRIMARY_COLOR, 0.2),
                                      },
                                    }}
                                  >
                                    <TrendingUp fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6}>
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
              {loading && documentsData.documents.length > 0 && (
                <LinearProgress
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    "& .MuiLinearProgress-bar": {
                      bgcolor: PRIMARY_COLOR,
                    },
                  }}
                />
              )}
              {paginatedDocuments.length > 0 ? (
                paginatedDocuments.map((document) => (
                  <MobileDocumentCard
                    key={document._id}
                    document={document}
                    onView={handleViewClick}
                    onEdit={handleEditClick}
                    onStatusUpdate={handleStatusUpdateClick}
                    permissions={userPermissions}
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

          {filteredDocuments.length > 0 && (
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
                {Math.min(
                  (page + 1) * rowsPerPage,
                  filteredDocuments.length,
                )}{" "}
                of {filteredDocuments.length}
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
                    "&.Mui-selected": {
                      bgcolor: PRIMARY_COLOR,
                      color: "#fff",
                    },
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
            {documentsData.summary.totalDocuments} total documents •{" "}
            {documentsData.summary.submittedDocuments} submitted
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
