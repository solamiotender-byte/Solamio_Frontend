// pages/MissedLeadsPage.jsx (Bug-Free Version)
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
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Grid,
  Avatar,
  LinearProgress,
  Tooltip,
  useTheme,
  useMediaQuery,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Paper,
  AlertTitle,
  CardContent,
  Tab,
  Tabs,
  Skeleton,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  alpha,
  SwipeableDrawer,
  Collapse,
  Fab,
  Zoom,
  Fade,
  Slide,
  BottomNavigation,
  BottomNavigationAction,
  ListItemAvatar,
} from "@mui/material";
import {
  Search,
  Visibility,
  Close,
  Refresh,
  Warning,
  TrendingDown,
  AccessTime,
  Restore,
  PriorityHigh,
  Schedule,
  ArrowForward,
  CalendarToday,
  Phone,
  Email,
  Person,
  Timeline,
  FilterList,
  ArrowDropDown,
  ArrowDropUp,
  Info,
  CheckCircle,
  Error,
  Home,
  LocationOn,
  Description,
  AccountBalance,
  ReceiptLong,
  Build,
  ExpandMore,
  AttachFile,
  Note,
  Paid,
  LocalAtm,
  History,
  Download,
  OpenInNew,
  AccountBalanceWallet,
  Badge as BadgeIcon,
  CreditCard,
  PictureAsPdf,
  Image,
  FolderOpen,
  Money,
  Event,
  Tune,
  Clear,
  ArrowUpward,
  ArrowDownward,
  People,
  DateRange,
  FirstPage,
  LastPage,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  HowToReg,
  SupervisorAccount,
  AdminPanelSettings,
  WorkspacePremium,
  Groups,
  FilterAlt,
  Sort,
  ViewList,
  ViewModule,
  Dashboard,
  ExpandLess,
  FiberManualRecord,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import {
  format,
  isValid,
  parseISO,
  startOfDay,
  endOfDay,
  subWeeks,
  subMonths,
} from "date-fns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useNavigate } from "react-router-dom";

// ========== CONSTANTS & CONFIGURATION ==========
const PRIMARY_COLOR = "#4569ea";
const SECONDARY_COLOR = "#1a237e";
const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_ITEMS_PER_PAGE = 20;

// Period Options
const PERIOD_OPTIONS = [
  { value: "Today", label: "Today", icon: <CalendarToday /> },
  { value: "This Week", label: "This Week", icon: <DateRange /> },
  { value: "This Month", label: "This Month", icon: <DateRange /> },
  { value: "All", label: "All Time", icon: <DateRange /> },
];

// Priority Configuration
const PRIORITY_CONFIG = {
  High: {
    label: "High",
    color: "#f44336",
    bgcolor: alpha("#f44336", 0.1),
    icon: <PriorityHigh sx={{ fontSize: 16 }} />,
    daysThreshold: 30,
    description: "Inactive for 30+ days - Immediate action required",
    order: 1,
  },
  Medium: {
    label: "Medium",
    color: "#ff9800",
    bgcolor: alpha("#ff9800", 0.1),
    icon: <Warning sx={{ fontSize: 16 }} />,
    daysThreshold: 15,
    description: "Inactive for 15-29 days - Follow up needed",
    order: 2,
  },
  Low: {
    label: "Low",
    color: "#4caf50",
    bgcolor: alpha("#4caf50", 0.1),
    icon: <CheckCircle sx={{ fontSize: 16 }} />,
    daysThreshold: 0,
    description: "Inactive for less than 15 days - Monitor",
    order: 3,
  },
};

// Stage Configuration
const STAGE_CONFIG = {
  "Installation Completion": {
    label: "Installation",
    color: PRIMARY_COLOR,
    bgcolor: alpha(PRIMARY_COLOR, 0.1),
    icon: <Build sx={{ fontSize: 16 }} />,
  },
  Missed: {
    label: "Missed Lead",
    color: "#f44336",
    bgcolor: alpha("#f44336", 0.1),
    icon: <Warning sx={{ fontSize: 16 }} />,
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
const getPriorityConfig = (daysInactive) => {
  if (daysInactive >= 30) return PRIORITY_CONFIG.High;
  if (daysInactive >= 15) return PRIORITY_CONFIG.Medium;
  return PRIORITY_CONFIG.Low;
};

const getStageConfig = (status) => {
  return (
    STAGE_CONFIG[status] || {
      label: status || "New",
      color: "#757575",
      bgcolor: alpha("#757575", 0.1),
      icon: <Info sx={{ fontSize: 16 }} />,
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

const formatDate = (dateString, formatStr = "dd MMM yyyy") => {
  if (!dateString) return "Not Available";
  try {
    const date =
      typeof dateString === "string" ? parseISO(dateString) : dateString;
    return isValid(date) ? format(date, formatStr) : "Invalid Date";
  } catch (err) {
    return "Invalid Date";
  }
};

const formatDisplayName = (user) => {
  if (!user) return "Not Assigned";
  if (typeof user === "string") return user;
  if (user.firstName || user.lastName) {
    return (
      `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown User"
    );
  }
  return "Unknown User";
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
  priorityFilter,
  setPriorityFilter,
  dateFilter,
  setDateFilter,
  selectedPriorities,
  handlePriorityCheckboxChange,
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
              Filter Missed Leads
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

            {/* Priority Section */}
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
                onClick={() => toggleSection("priority")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <PriorityHigh sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Priority
                  </Typography>
                </Stack>
                {expandedSection === "priority" ? (
                  <ExpandLess />
                ) : (
                  <ExpandMore />
                )}
              </Box>
              <Collapse in={expandedSection === "priority"}>
                <Box sx={{ p: 2 }}>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <Select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">All Priorities</MenuItem>
                      {Object.keys(PRIORITY_CONFIG).map((priority) => (
                        <MenuItem key={priority} value={priority}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            {PRIORITY_CONFIG[priority].icon}
                            <span>{priority}</span>
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
                    {Object.keys(PRIORITY_CONFIG).map((priority) => (
                      <Grid item xs={6} key={priority}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedPriorities[priority]}
                              onChange={() =>
                                handlePriorityCheckboxChange(priority)
                              }
                              size="small"
                              sx={{
                                color: PRIORITY_CONFIG[priority].color,
                                "&.Mui-checked": {
                                  color: PRIORITY_CONFIG[priority].color,
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
                              {PRIORITY_CONFIG[priority].icon}
                              <Typography variant="caption">
                                {priority}
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
                      { key: "fullName", label: "Name" },
                      { key: "createdAt", label: "Created Date" },
                      { key: "daysInactive", label: "Days Inactive" },
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

// ========== MOBILE LEAD CARD ==========
const MobileLeadCard = ({ lead, onView, onReopen }) => {
  const [expanded, setExpanded] = useState(false);
  const priorityConfig = getPriorityConfig(lead.daysInactive || 0);
  const stageConfig = getStageConfig(lead.status);
  const initials = getInitials(lead.firstName, lead.lastName);

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
                {`${lead.firstName || ""} ${lead.lastName || ""}`.trim() ||
                  "Unnamed Lead"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {lead._id?.slice(-8) || "N/A"}
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
                {lead.phone || "No phone"}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={6}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Email sx={{ fontSize: 14, color: alpha(PRIMARY_COLOR, 0.6) }} />
              <Typography variant="caption" noWrap>
                {lead.email || "No email"}
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        {/* Lead Info */}
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
              {formatDate(lead.createdAt, "dd MMM yyyy")}
            </Typography>
            <FiberManualRecord sx={{ fontSize: 4, color: "text.disabled" }} />
            <AccessTime
              sx={{ fontSize: 14, color: alpha(PRIMARY_COLOR, 0.6) }}
            />
            <Typography variant="body2" fontWeight={500}>
              {lead.daysInactive || 0} days
            </Typography>
          </Stack>
        </Box>

        {/* Status Chips */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Tooltip title={priorityConfig.description} arrow>
            <Chip
              label={priorityConfig.label}
              icon={priorityConfig.icon}
              size="small"
              sx={{
                bgcolor: priorityConfig.bgcolor,
                color: priorityConfig.color,
                fontWeight: 600,
                height: 24,
                fontSize: "0.7rem",
                "& .MuiChip-icon": { fontSize: 14 },
              }}
            />
          </Tooltip>
          <Tooltip title="Current stage" arrow>
            <Chip
              label={stageConfig.label}
              icon={stageConfig.icon}
              size="small"
              sx={{
                bgcolor: stageConfig.bgcolor,
                color: stageConfig.color,
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
              {lead.address && (
                <Grid item xs={12}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Address
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                    {lead.address}
                  </Typography>
                </Grid>
              )}
              {lead.notes && (
                <Grid item xs={12}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Notes
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                    {lead.notes}
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
                  {formatDate(lead.createdAt, "dd MMM yyyy")}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Last Contact
                </Typography>
                <Typography variant="body2">
                  {formatDate(lead.lastContactedAt, "dd MMM yyyy")}
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
                onClick={() => onView(lead)}
                sx={{
                  bgcolor: PRIMARY_COLOR,
                  "&:hover": { bgcolor: SECONDARY_COLOR },
                }}
              >
                View
              </Button>
              {lead.canReopen !== false && (
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<Restore />}
                  onClick={() => onReopen(lead)}
                  sx={{
                    borderColor: "#4caf50",
                    color: "#4caf50",
                    "&:hover": { bgcolor: alpha("#4caf50", 0.1) },
                  }}
                >
                  Reopen
                </Button>
              )}
            </Stack>
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
};

// ========== PRIORITY CHIP COMPONENT ==========
const PriorityChip = React.memo(({ daysInactive }) => {
  const config = getPriorityConfig(daysInactive);
  return (
    <Chip
      label={config.label}
      size="small"
      icon={config.icon}
      sx={{
        bgcolor: config.bgcolor,
        color: config.color,
        fontWeight: 600,
        fontSize: "0.75rem",
        height: 28,
        "& .MuiChip-icon": {
          color: config.color,
          fontSize: 16,
        },
      }}
    />
  );
});

PriorityChip.displayName = "PriorityChip";

// ========== STAGE CHIP COMPONENT ==========
const StageChip = React.memo(({ status }) => {
  const config = getStageConfig(status);
  return (
    <Chip
      label={config.label}
      size="small"
      icon={config.icon}
      sx={{
        bgcolor: config.bgcolor,
        color: config.color,
        fontWeight: 600,
        fontSize: "0.75rem",
        height: 28,
        "& .MuiChip-icon": {
          color: config.color,
          fontSize: 16,
        },
      }}
    />
  );
});

StageChip.displayName = "StageChip";

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
      <TrendingDown sx={{ fontSize: 48, color: PRIMARY_COLOR }} />
    </Box>
    <Typography variant="h6" fontWeight={600} gutterBottom>
      No missed leads found
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
    >
      {hasFilters
        ? "No missed leads match your current filters. Try adjusting your search criteria."
        : "Great! You have no missed leads to recover."}
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
export default function MissedLeadsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const { fetchAPI, getUserRole } = useAuth();
  const userRole = getUserRole();

  // State Management
  const [period, setPeriod] = useState("Today");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [missedLeads, setMissedLeads] = useState([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const [dateFilterError, setDateFilterError] = useState("");
  const [selectedPriorities, setSelectedPriorities] = useState({
    High: true,
    Medium: true,
    Low: true,
  });

  // Sorting & Pagination
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(
    isMobile ? 10 : DEFAULT_ITEMS_PER_PAGE,
  );

  // View Mode
  const [viewMode, setViewMode] = useState(isMobile ? "card" : "table");

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadDetails, setLeadDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Refs
  const containerRef = useRef(null);

  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    avgInactiveDays: 0,
    reopenable: 0,
  });

  // Snackbar Handler
  const showSnackbar = useCallback((message, severity = "success") => {
    if (severity === "success") {
      setSuccess(message);
    } else {
      setError(message);
    }
  }, []);

  // Fetch missed leads
  const fetchMissedLeads = useCallback(async () => {
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

      const response = await fetchAPI(`/lead/missed?${params.toString()}`);

      if (response?.success) {
        const leads = response.result.missedLeads || [];
        setMissedLeads(leads);
        calculateSummaryStats(leads);
      } else {
        throw new Error(response?.message || "Failed to fetch missed leads");
      }
    } catch (err) {
      console.error("Error fetching missed leads:", err);
      setError(err.message || "Failed to load missed leads. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [period, fetchAPI]);

  // Calculate summary statistics
  const calculateSummaryStats = (leads) => {
    const high = leads.filter((lead) => (lead.daysInactive || 0) >= 30).length;
    const medium = leads.filter(
      (lead) => (lead.daysInactive || 0) >= 15 && (lead.daysInactive || 0) < 30,
    ).length;
    const low = leads.filter((lead) => (lead.daysInactive || 0) < 15).length;
    const avgDays =
      leads.length > 0
        ? Math.round(
            leads.reduce((sum, lead) => sum + (lead.daysInactive || 0), 0) /
              leads.length,
          )
        : 0;
    const reopenable = leads.filter((lead) => lead.canReopen !== false).length;

    setSummaryStats({
      total: leads.length,
      highPriority: high,
      mediumPriority: medium,
      lowPriority: low,
      avgInactiveDays: avgDays,
      reopenable: reopenable,
    });
  };

  // Apply Filters
  const applyFilters = useCallback(() => {
    try {
      let filtered = [...missedLeads];

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (lead) =>
            (lead.firstName?.toLowerCase() || "").includes(query) ||
            (lead.lastName?.toLowerCase() || "").includes(query) ||
            (lead.email?.toLowerCase() || "").includes(query) ||
            (lead.phone || "").includes(query),
        );
      }

      // Priority filter
      if (priorityFilter) {
        if (priorityFilter === "High") {
          filtered = filtered.filter((lead) => (lead.daysInactive || 0) >= 30);
        } else if (priorityFilter === "Medium") {
          filtered = filtered.filter(
            (lead) =>
              (lead.daysInactive || 0) >= 15 && (lead.daysInactive || 0) < 30,
          );
        } else if (priorityFilter === "Low") {
          filtered = filtered.filter((lead) => (lead.daysInactive || 0) < 15);
        }
      }

      // Priority checkboxes
      const activePriorities = Object.keys(selectedPriorities).filter(
        (priority) => selectedPriorities[priority],
      );

      if (activePriorities.length < 3) {
        filtered = filtered.filter((lead) => {
          const days = lead.daysInactive || 0;
          if (days >= 30) return activePriorities.includes("High");
          if (days >= 15) return activePriorities.includes("Medium");
          return activePriorities.includes("Low");
        });
      }

      // Date filter
      if (dateFilter.startDate && isValid(dateFilter.startDate)) {
        const start = startOfDay(new Date(dateFilter.startDate));
        filtered = filtered.filter((lead) => {
          if (!lead.createdAt) return false;
          try {
            const createdDate = parseISO(lead.createdAt);
            return isValid(createdDate) && createdDate >= start;
          } catch {
            return false;
          }
        });
      }

      if (dateFilter.endDate && isValid(dateFilter.endDate)) {
        const end = endOfDay(new Date(dateFilter.endDate));
        filtered = filtered.filter((lead) => {
          if (!lead.createdAt) return false;
          try {
            const createdDate = parseISO(lead.createdAt);
            return isValid(createdDate) && createdDate <= end;
          } catch {
            return false;
          }
        });
      }

      // Sorting
      if (sortConfig.key) {
        filtered.sort((a, b) => {
          let aVal = a[sortConfig.key];
          let bVal = b[sortConfig.key];

          if (
            sortConfig.key === "createdAt" ||
            sortConfig.key === "lastContactedAt"
          ) {
            aVal = aVal ? parseISO(aVal) : new Date(0);
            bVal = bVal ? parseISO(bVal) : new Date(0);
          } else if (sortConfig.key === "fullName") {
            aVal = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
            bVal = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
          } else if (sortConfig.key === "daysInactive") {
            aVal = aVal || 0;
            bVal = bVal || 0;
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
    missedLeads,
    searchQuery,
    priorityFilter,
    dateFilter,
    selectedPriorities,
    sortConfig,
    showSnackbar,
  ]);

  // Memoized filtered leads
  const filteredLeads = useMemo(() => applyFilters(), [applyFilters]);

  // Paginated leads
  const paginatedLeads = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredLeads.slice(start, start + rowsPerPage);
  }, [filteredLeads, page, rowsPerPage]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (priorityFilter) count++;
    if (dateFilter.startDate) count++;
    if (dateFilter.endDate) count++;
    if (Object.values(selectedPriorities).some((v) => !v)) count++;
    return count;
  }, [searchQuery, priorityFilter, dateFilter, selectedPriorities]);

  // Handle view lead details
  const handleViewClick = useCallback(
    async (lead) => {
      setSelectedLead(lead);
      setDetailsLoading(true);
      setViewDialogOpen(true);

      try {
        const response = await fetchAPI(`/lead/getLeadById/${lead._id}`);
        if (response.success) {
          setLeadDetails(response.result);
        } else {
          throw new Error(response.message || "Failed to load lead details");
        }
      } catch (err) {
        console.error("Error loading lead details:", err);
        setError("Failed to load lead details: " + err.message);
      } finally {
        setDetailsLoading(false);
      }
    },
    [fetchAPI],
  );

  // Handle reopen lead
  const handleReopenClick = useCallback(
    async (lead) => {
      try {
        const response = await fetchAPI(`/lead/updateLead/${lead._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Visit",
            lastContactedAt: new Date().toISOString(),
            notes: lead.notes
              ? `${lead.notes}\n[${new Date().toLocaleDateString()}] Lead reopened from Missed status`
              : `[${new Date().toLocaleDateString()}] Lead reopened from Missed status`,
          }),
        });

        if (response?.success) {
          setSuccess("Lead reopened successfully and marked as New!");

          const updatedLeads = missedLeads.filter(
            (item) => item._id !== lead._id,
          );
          setMissedLeads(updatedLeads);
          calculateSummaryStats(updatedLeads);

          setTimeout(() => {
            fetchMissedLeads();
          }, 1000);
        } else {
          throw new Error(response?.message || "Failed to reopen lead");
        }
      } catch (err) {
        console.error("Error reopening lead:", err);
        setError("Failed to reopen lead: " + err.message);
      }
    },
    [missedLeads, fetchAPI, fetchMissedLeads],
  );

  // Handle pagination change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle sort
  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  // Handle priority checkbox change
  const handlePriorityCheckboxChange = useCallback((priority) => {
    setSelectedPriorities((prev) => ({
      ...prev,
      [priority]: !prev[priority],
    }));
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setPriorityFilter("");
    setPeriod("Today");
    setDateFilter({ startDate: null, endDate: null });
    setDateFilterError("");
    setSelectedPriorities({
      High: true,
      Medium: true,
      Low: true,
    });
    setSortConfig({ key: null, direction: "asc" });
    setPage(0);
  }, []);

  // Validate date range
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

  // Download document function
  const handleDownload = useCallback((url, filename) => {
    if (!url) {
      setError("No document URL provided");
      return;
    }
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = filename || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMissedLeads();
  }, [fetchMissedLeads]);

  // Summary cards data
  const summaryCards = useMemo(
    () => [
      {
        label: "Total Missed",
        value: summaryStats.total,
        icon: <TrendingDown />,
        color: "#4569ea",
        subText: "Leads lost",
      },
      {
        label: "High Priority",
        value: summaryStats.highPriority,
        icon: <PriorityHigh />,
        color: "#4569ea",
        subText: "30+ days inactive",
      },
      {
        label: "Avg Inactive Days",
        value: summaryStats.avgInactiveDays,
        icon: <AccessTime />,
        color: "#4569ea",
        subText: "Days without contact",
      },
      {
        label: "Can Reopen",
        value: summaryStats.reopenable,
        icon: <Restore />,
        color: "#4569ea",
        subText: "Ready for recovery",
      },
    ],
    [summaryStats],
  );

  // Loading state
  if (loading && missedLeads.length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* View Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            overflow: "hidden",
            maxHeight: "90vh",
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
              <Avatar sx={{ bgcolor: "white", color: PRIMARY_COLOR }}>
                {selectedLead?.firstName?.[0] || "L"}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {selectedLead
                    ? `${selectedLead.firstName || ""} ${selectedLead.lastName || ""}`.trim()
                    : "Lead Details"}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Complete Information
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setViewDialogOpen(false)}
              size="small"
              sx={{ color: "white" }}
            >
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {detailsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{ p: { xs: 2, sm: 3 }, maxHeight: "60vh", overflow: "auto" }}
            >
              {/* Basic Information */}
              <Accordion defaultExpanded sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Person sx={{ color: PRIMARY_COLOR }} />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Basic Information
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <Person />
                          </ListItemIcon>
                          <ListItemText
                            primary="Full Name"
                            secondary={
                              selectedLead
                                ? `${selectedLead.firstName || ""} ${selectedLead.lastName || ""}`.trim() ||
                                  "Not Available"
                                : "Not Available"
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Email />
                          </ListItemIcon>
                          <ListItemText
                            primary="Email"
                            secondary={selectedLead?.email || "Not Available"}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Phone />
                          </ListItemIcon>
                          <ListItemText
                            primary="Phone"
                            secondary={selectedLead?.phone || "Not Available"}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Home />
                          </ListItemIcon>
                          <ListItemText
                            primary="Address"
                            secondary={selectedLead?.address || "Not Available"}
                          />
                        </ListItem>
                      </List>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <LocationOn />
                          </ListItemIcon>
                          <ListItemText
                            primary="City"
                            secondary={selectedLead?.city || "Not Available"}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <LocationOn />
                          </ListItemIcon>
                          <ListItemText
                            primary="Pincode"
                            secondary={selectedLead?.pincode || "Not Available"}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Build />
                          </ListItemIcon>
                          <ListItemText
                            primary="Solar Requirement"
                            secondary={
                              selectedLead?.solarRequirement || "Not Available"
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CalendarToday />
                          </ListItemIcon>
                          <ListItemText
                            primary="Created Date"
                            secondary={formatDate(
                              selectedLead?.createdAt,
                              "dd MMM yyyy, HH:mm:ss",
                            )}
                          />
                        </ListItem>
                      </List>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Current Status */}
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Timeline sx={{ color: PRIMARY_COLOR }} />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Current Status & Timeline
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Current Status
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: 2,
                            flexWrap: "wrap",
                          }}
                        >
                          <StageChip status={selectedLead?.status} />
                          <PriorityChip
                            daysInactive={selectedLead?.daysInactive || 0}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Last Contacted:{" "}
                          {formatDate(
                            selectedLead?.lastContactedAt,
                            "dd MMM yyyy, HH:mm:ss",
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Days Inactive: {selectedLead?.daysInactive || 0} days
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          System Information
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemIcon>
                              <Person />
                            </ListItemIcon>
                            <ListItemText
                              primary="Assigned Manager"
                              secondary={
                                selectedLead?.assignedManager
                                  ? formatDisplayName(
                                      selectedLead.assignedManager,
                                    )
                                  : "Not Assigned"
                              }
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <Person />
                            </ListItemIcon>
                            <ListItemText
                              primary="Assigned User"
                              secondary={
                                selectedLead?.assignedUser
                                  ? formatDisplayName(selectedLead.assignedUser)
                                  : "Not Assigned"
                              }
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <Event />
                            </ListItemIcon>
                            <ListItemText
                              primary="Updated At"
                              secondary={formatDate(
                                selectedLead?.updatedAt,
                                "dd MMM yyyy, HH:mm:ss",
                              )}
                            />
                          </ListItem>
                        </List>
                      </Card>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Document Information */}
              {(selectedLead?.aadhaar?.url ||
                selectedLead?.panCard?.url ||
                selectedLead?.passbook?.url) && (
                <Accordion sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <FolderOpen sx={{ color: "#d32f2f" }} />
                      <Typography variant="subtitle1" fontWeight={600}>
                        Document Information
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {selectedLead?.aadhaar?.url && (
                        <Grid item xs={12} sm={6} md={4}>
                          <Card
                            variant="outlined"
                            sx={{ p: 2, borderRadius: 2 }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                mb: 1,
                              }}
                            >
                              <BadgeIcon sx={{ color: "#f57c00" }} />
                              <Typography variant="body2" fontWeight={600}>
                                Aadhaar Card
                              </Typography>
                            </Box>
                            <Button
                              fullWidth
                              size="small"
                              variant="outlined"
                              startIcon={<OpenInNew />}
                              onClick={() =>
                                handleDownload(
                                  selectedLead.aadhaar.url,
                                  "aadhaar-card",
                                )
                              }
                            >
                              View Document
                            </Button>
                          </Card>
                        </Grid>
                      )}
                      {selectedLead?.panCard?.url && (
                        <Grid item xs={12} sm={6} md={4}>
                          <Card
                            variant="outlined"
                            sx={{ p: 2, borderRadius: 2 }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                mb: 1,
                              }}
                            >
                              <CreditCard sx={{ color: "#1976d2" }} />
                              <Typography variant="body2" fontWeight={600}>
                                PAN Card
                              </Typography>
                            </Box>
                            <Button
                              fullWidth
                              size="small"
                              variant="outlined"
                              startIcon={<OpenInNew />}
                              onClick={() =>
                                handleDownload(
                                  selectedLead.panCard.url,
                                  "pan-card",
                                )
                              }
                            >
                              View Document
                            </Button>
                          </Card>
                        </Grid>
                      )}
                      {selectedLead?.passbook?.url && (
                        <Grid item xs={12} sm={6} md={4}>
                          <Card
                            variant="outlined"
                            sx={{ p: 2, borderRadius: 2 }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                mb: 1,
                              }}
                            >
                              <ReceiptLong sx={{ color: "#388e3c" }} />
                              <Typography variant="body2" fontWeight={600}>
                                Bank Passbook
                              </Typography>
                            </Box>
                            <Button
                              fullWidth
                              size="small"
                              variant="outlined"
                              startIcon={<OpenInNew />}
                              onClick={() =>
                                handleDownload(
                                  selectedLead.passbook.url,
                                  "passbook",
                                )
                              }
                            >
                              View Document
                            </Button>
                          </Card>
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Notes */}
              {selectedLead?.notes && (
                <Accordion sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Note sx={{ color: "#757575" }} />
                      <Typography variant="subtitle1" fontWeight={600}>
                        Notes
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Paper sx={{ p: 3, bgcolor: "grey.50", borderRadius: 2 }}>
                      <Typography
                        variant="body1"
                        style={{ whiteSpace: "pre-wrap" }}
                      >
                        {selectedLead.notes}
                      </Typography>
                    </Paper>
                  </AccordionDetails>
                </Accordion>
              )}
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
            onClick={() => setViewDialogOpen(false)}
            variant="outlined"
            sx={{
              borderRadius: 2,
              px: 3,
              borderColor: PRIMARY_COLOR,
              color: PRIMARY_COLOR,
            }}
          >
            Close
          </Button>
          {selectedLead?.canReopen !== false && (
            <Button
              variant="contained"
              startIcon={<Restore />}
              onClick={() => {
                handleReopenClick(selectedLead);
                setViewDialogOpen(false);
              }}
              sx={{
                bgcolor: "#4caf50",
                borderRadius: 2,
                px: 4,
                fontWeight: 600,
                "&:hover": {
                  bgcolor: "#388e3c",
                },
              }}
            >
              Reopen Lead
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        period={period}
        setPeriod={setPeriod}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        selectedPriorities={selectedPriorities}
        handlePriorityCheckboxChange={handlePriorityCheckboxChange}
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

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{
            borderRadius: 2,
            color: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
          variant="filled"
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Error />
            <Typography fontWeight={600}>{error}</Typography>
          </Box>
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSuccess(null)}
          severity="success"
          sx={{
            borderRadius: 2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
          variant="filled"
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircle />
            <Typography fontWeight={600}>{success}</Typography>
          </Box>
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
                Missed Leads Recovery
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              >
                Track and recover lost opportunities with action plans
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
                onClick={fetchMissedLeads}
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
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={priorityFilter}
                    label="Priority"
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <MenuItem value="">All Priorities</MenuItem>
                    {Object.keys(PRIORITY_CONFIG).map((priority) => (
                      <MenuItem key={priority} value={priority}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {PRIORITY_CONFIG[priority].icon}
                          <span>{priority}</span>
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
                        Priority
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={priorityFilter}
                          onChange={(e) => setPriorityFilter(e.target.value)}
                          displayEmpty
                        >
                          <MenuItem value="">All Priorities</MenuItem>
                          {Object.keys(PRIORITY_CONFIG).map((priority) => (
                            <MenuItem key={priority} value={priority}>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                              >
                                {PRIORITY_CONFIG[priority].icon}
                                <span>{priority}</span>
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
                        Multiple Priority Selection
                      </Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        {Object.keys(PRIORITY_CONFIG).map((priority) => (
                          <FormControlLabel
                            key={priority}
                            control={
                              <Checkbox
                                checked={selectedPriorities[priority]}
                                onChange={() =>
                                  handlePriorityCheckboxChange(priority)
                                }
                                size="small"
                                sx={{
                                  color: PRIORITY_CONFIG[priority].color,
                                  "&.Mui-checked": {
                                    color: PRIORITY_CONFIG[priority].color,
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
                                {PRIORITY_CONFIG[priority].icon}
                                <Typography variant="body2">
                                  {priority}
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
                    {priorityFilter && (
                      <Chip
                        label={`Priority: ${priorityFilter}`}
                        size="small"
                        onDelete={() => setPriorityFilter("")}
                        sx={{
                          bgcolor: alpha(
                            PRIORITY_CONFIG[priorityFilter]?.color ||
                              PRIMARY_COLOR,
                            0.1,
                          ),
                          color:
                            PRIORITY_CONFIG[priorityFilter]?.color ||
                            PRIMARY_COLOR,
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
                    {Object.keys(selectedPriorities).some(
                      (priority) => !selectedPriorities[priority],
                    ) && (
                      <Chip
                        label="Custom Priority"
                        size="small"
                        onDelete={() =>
                          setSelectedPriorities({
                            High: true,
                            Medium: true,
                            Low: true,
                          })
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

        {/* Missed Leads List */}
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
              Missed Leads
              <Chip
                label={`${filteredLeads.length} total`}
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
              {loading && missedLeads.length > 0 && (
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

              <Table  size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY_COLOR, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      <Button
                        size="small"
                        onClick={() => handleSort("fullName")}
                        endIcon={
                          sortConfig.key === "fullName" ? (
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
                        Customer
                      </Button>
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
                        onClick={() => handleSort("createdAt")}
                        endIcon={
                          sortConfig.key === "createdAt" ? (
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
                        Created Date
                      </Button>
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
                        onClick={() => handleSort("lastContactedAt")}
                        endIcon={
                          sortConfig.key === "lastContactedAt" ? (
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
                        Last Contact
                      </Button>
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
                        onClick={() => handleSort("daysInactive")}
                        endIcon={
                          sortConfig.key === "daysInactive" ? (
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
                        Priority
                      </Button>
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY_COLOR, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      Stage
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
                  {paginatedLeads.length > 0 ? (
                    paginatedLeads.map((lead) => {
                      const priorityConfig = getPriorityConfig(
                        lead.daysInactive || 0,
                      );
                      const stageConfig = getStageConfig(lead.status);

                      return (
                        <TableRow
                          key={lead._id}
                          hover
                          sx={{
                            "&:hover": {
                              bgcolor: alpha(PRIMARY_COLOR, 0.02),
                            },
                          }}
                        >
                          <TableCell>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: PRIMARY_COLOR,
                                  fontSize: "0.875rem",
                                }}
                              >
                                {getInitials(lead.firstName, lead.lastName)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {`${lead.firstName || ""} ${lead.lastName || ""}`.trim() ||
                                    "Unnamed Lead"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {lead.phone || "No phone"}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(lead.createdAt, "dd MMM yyyy")}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {formatDate(
                                  lead.lastContactedAt,
                                  "dd MMM yyyy",
                                )}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {lead.daysInactive || 0} days ago
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={priorityConfig.description} arrow>
                              <Chip
                                label={priorityConfig.label}
                                icon={priorityConfig.icon}
                                size="small"
                                sx={{
                                  bgcolor: priorityConfig.bgcolor,
                                  color: priorityConfig.color,
                                  fontWeight: 600,
                                  minWidth: 80,
                                }}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={stageConfig.label}
                              icon={stageConfig.icon}
                              size="small"
                              sx={{
                                bgcolor: stageConfig.bgcolor,
                                color: stageConfig.color,
                                fontWeight: 600,
                                minWidth: 100,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="View Details" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewClick(lead)}
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

                              {lead.canReopen !== false && (
                                <Tooltip title="Reopen Lead" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleReopenClick(lead)}
                                    sx={{
                                      bgcolor: alpha("#4caf50", 0.1),
                                      color: "#4caf50",
                                      "&:hover": {
                                        bgcolor: alpha("#4caf50", 0.2),
                                      },
                                    }}
                                  >
                                    <Restore fontSize="small" />
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
              {loading && missedLeads.length > 0 && (
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
              {paginatedLeads.length > 0 ? (
                paginatedLeads.map((lead) => (
                  <MobileLeadCard
                    key={lead._id}
                    lead={lead}
                    onView={handleViewClick}
                    onReopen={handleReopenClick}
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

          {filteredLeads.length > 0 && (
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
                {Math.min((page + 1) * rowsPerPage, filteredLeads.length)} of{" "}
                {filteredLeads.length}
              </Typography>
              <Pagination
                count={Math.ceil(filteredLeads.length / rowsPerPage)}
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
            {summaryStats.total} missed leads • {summaryStats.reopenable} can be
            reopened
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
