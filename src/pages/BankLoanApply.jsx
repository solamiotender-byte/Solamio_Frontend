// pages/BankLoanApply.jsx (Bug-Free Version)
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
  ButtonGroup,
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
  SwipeableDrawer,
  BottomNavigation,
  BottomNavigationAction,
  Fab,
  Zoom,
  Badge,
  Collapse,
  Fade,
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
  DescriptionOutlined,
  GetApp,
  AccountBalance,
  Badge as BadgeIcon,
  CloudUpload,
  Delete,
  CreditCard,
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
  Description,
  Save,
  MoreVert,
  TrendingUp,
  HowToReg,
  ReceiptLong,
  AccessTime,
  Security,
  SupervisorAccount,
  Groups,
  AdminPanelSettings,
  WorkspacePremium,
  CurrencyRupee,
  AccountBalanceWallet,
  Send,
  HourglassEmpty,
  AttachMoney,
  VerifiedUser,
  Apps,
  ViewList,
  FilterAlt,
  Sort,
  CheckCircleOutline,
  ExpandMore,
  ExpandLess,
  Dashboard,
  FiberManualRecord,
  DateRange,
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
const PRIMARY = "#4569ea";
const SECONDARY = "#1a237e";
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50];
const DEFAULT_ITEMS_PER_PAGE = 10;
const ALLOWED_ROLES = ["Head_office", "ZSM", "ASM", "TEAM"];

// Period Options
const PERIOD_OPTIONS = [
  { value: "Today", label: "Today", icon: <CalendarToday /> },
  { value: "This Week", label: "This Week", icon: <DateRange /> },
  { value: "This Month", label: "This Month", icon: <DateRange /> },
  { value: "All", label: "All Time", icon: <DateRange /> },
];

// Loan Status Configuration
const LOAN_STATUS_OPTIONS = ["pending", "submitted"];

const LOAN_STATUS_CONFIG = {
  pending: {
    bg: alpha(PRIMARY, 0.08),
    color: PRIMARY,
    icon: <HourglassEmpty sx={{ fontSize: 16 }} />,
    label: "Pending",
    description: "Loan application is pending submission",
    order: 1,
  },
  submitted: {
    bg: alpha(PRIMARY, 0.08),
    color: PRIMARY,
    icon: <Send sx={{ fontSize: 16 }} />,
    label: "Submitted",
    description: "Loan application submitted to bank",
    order: 2,
  },
};

// Lead Status Configuration
const LEAD_STATUS_OPTIONS = [
  "Bank Loan Apply",
  "Bank at Pending",
  "Missed Leads",
];

const LEAD_STATUS_CONFIG = {
  "Bank Loan Apply": {
    bg: alpha(PRIMARY, 0.08),
    color: PRIMARY,
    icon: <AccountBalanceWallet sx={{ fontSize: 16 }} />,
    description: "Bank loan application in progress",
  },
  "Bank at Pending": {
    bg: alpha(PRIMARY, 0.08),
    color: PRIMARY,
    icon: <Description sx={{ fontSize: 16 }} />,
    description: "Documents submitted for verification",
  },
  "Missed Leads": {
    bg: alpha(PRIMARY, 0.08),
    color: PRIMARY,
    icon: <Cancel sx={{ fontSize: 16 }} />,
    description: "Lead lost or not converted",
  },
};

// Bank List
const BANK_LIST = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "Bank of India",
  "IndusInd Bank",
  "Kotak Mahindra Bank",
  "Yes Bank",
  "IDFC First Bank",
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

// ========== HELPER FUNCTIONS ==========
const hasAccess = (userRole) => ALLOWED_ROLES.includes(userRole);

const getUserPermissions = (userRole) => ({
  canView: true,
  canEdit:  ["Head_office", "ZSM"].includes(userRole),
  canDelete: userRole === "Head_office",
  canManage: ["Head_office", "ZSM", "ASM"].includes(userRole),
  canSeeAll: ["Head_office", "ZSM", "ASM"].includes(userRole),
  canSeeOwn: userRole === "TEAM",
  canUpdateStatus: ["Head_office", "ZSM", "ASM"].includes(userRole),
});

const getLoanStatusColor = (status) => {
  const normalizedStatus = status?.toLowerCase();
  return (
    LOAN_STATUS_CONFIG[normalizedStatus] || {
      bg: alpha(PRIMARY, 0.08),
      color: PRIMARY,
      label: "Unknown",
      icon: <Warning sx={{ fontSize: 16 }} />,
      description: "Status unknown",
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

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "₹0";
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return "₹0";

  if (numAmount >= 10000000) {
    return `₹${(numAmount / 10000000).toFixed(1)}Cr`;
  }
  if (numAmount >= 100000) {
    return `₹${(numAmount / 100000).toFixed(1)}L`;
  }
  if (numAmount >= 1000) {
    return `₹${(numAmount / 1000).toFixed(1)}K`;
  }
  return `₹${numAmount.toLocaleString("en-IN")}`;
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

const formatDateShort = (dateString) => {
  if (!dateString) return "Not set";
  try {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, "dd MMM yyyy") : "Invalid Date";
  } catch {
    return "Invalid Date";
  }
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return "";
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
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
const MobileFilterDrawer = React.memo(
  ({
    open,
    onClose,
    period,
    setPeriod,
    loanStatusFilter,
    setLoanStatusFilter,
    leadStatusFilter,
    setLeadStatusFilter,
    dateFilter,
    setDateFilter,
    searchQuery,
    setSearchQuery,
    sortConfig,
    setSortConfig,
    viewMode,
    setViewMode,
    dateFilterError,
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
                Filter Loans
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
                      placeholder="Search by name, email, phone, bank..."
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

              {/* Loan Status Section */}
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
                  onClick={() => toggleSection("loanStatus")}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <FilterAlt sx={{ color: PRIMARY, fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Loan Status
                    </Typography>
                  </Stack>
                  {expandedSection === "loanStatus" ? <ExpandLess /> : <ExpandMore />}
                </Box>
                <Collapse in={expandedSection === "loanStatus"}>
                  <Box sx={{ p: 2 }}>
                    <FormControl fullWidth size="small">
                      <Select
                        value={loanStatusFilter}
                        onChange={(e) => setLoanStatusFilter(e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="All">All Statuses</MenuItem>
                        {LOAN_STATUS_OPTIONS.map((status) => {
                          const config = getLoanStatusColor(status);
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
                        {LEAD_STATUS_OPTIONS.map((status) => {
                          const config = getLeadStatusConfig(status);
                          return (
                            <MenuItem key={status} value={status}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                {config.icon}
                                <span>{status}</span>
                              </Stack>
                            </MenuItem>
                          );
                        })}
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
                        { key: "loanApprovalDate", label: "Date" },
                        { key: "loanAmount", label: "Amount" },
                        { key: "loanStatus", label: "Status" },
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
                    {viewMode === "card" ? <ViewList /> : <Apps />}
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
                        startIcon={<ViewList />}
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
                        variant={viewMode === "grid" ? "contained" : "outlined"}
                        onClick={() => setViewMode("grid")}
                        startIcon={<Apps />}
                        sx={{
                          bgcolor: viewMode === "grid" ? PRIMARY : "transparent",
                          color: viewMode === "grid" ? "#fff" : PRIMARY,
                          borderColor: PRIMARY,
                        }}
                      >
                        Grid View
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
  }
);

MobileFilterDrawer.displayName = "MobileFilterDrawer";

// Mobile Loan Card
const MobileLoanCard = React.memo(
  ({ loan, onView, onEdit, userPermissions }) => {
    const [expanded, setExpanded] = useState(false);
    
    const loanStatusConfig = getLoanStatusColor(loan.loanStatus);
    const leadStatusConfig = getLeadStatusConfig(loan.status);
    const initials = getInitials(loan.firstName, loan.lastName);

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
                  {loan.firstName} {loan.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ID: {loan._id?.slice(-8) || "N/A"}
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
                  {loan.phone || "No phone"}
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Email sx={{ fontSize: 14, color: alpha(PRIMARY, 0.6) }} />
                <Typography variant="caption" noWrap>
                  {loan.email || "No email"}
                </Typography>
              </Stack>
            </Grid>
          </Grid>

          {/* Bank and Amount */}
          <Box sx={{ mb: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <AccountBalance sx={{ fontSize: 14, color: alpha(PRIMARY, 0.6) }} />
              <Typography variant="body2" fontWeight={500} noWrap>
                {loan.bank || "No bank"}
              </Typography>
              <FiberManualRecord sx={{ fontSize: 4, color: "text.disabled" }} />
              <CurrencyRupee sx={{ fontSize: 14, color: alpha(PRIMARY, 0.6) }} />
              <Typography variant="body2" fontWeight={700} color={PRIMARY}>
                {formatCurrency(loan.loanAmount)}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <CalendarToday sx={{ fontSize: 14, color: alpha(PRIMARY, 0.6) }} />
              <Typography variant="body2" fontWeight={500}>
                {formatDateShort(loan.loanApprovalDate)}
              </Typography>
            </Stack>
          </Box>

          {/* Status Chips */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Tooltip title={loanStatusConfig.description} arrow>
              <Chip
                label={loanStatusConfig.label}
                icon={loanStatusConfig.icon}
                size="small"
                sx={{
                  bgcolor: loanStatusConfig.bg,
                  color: loanStatusConfig.color,
                  fontWeight: 600,
                  height: 24,
                  fontSize: "0.7rem",
                  "& .MuiChip-icon": { fontSize: 14 },
                }}
              />
            </Tooltip>
            <Tooltip title={leadStatusConfig.description} arrow>
              <Chip
                label={loan.status || "Unknown"}
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
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Branch
                  </Typography>
                  <Typography variant="body2">
                    {loan.branchName || "Not specified"}
                  </Typography>
                </Grid>
                {loan.loanNotes && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Notes
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                      {loan.loanNotes}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {formatRelativeTime(loan.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {formatRelativeTime(loan.updatedAt)}
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
                  onClick={() => onView(loan)}
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
                    onClick={() => onEdit(loan)}
                    sx={{
                      borderColor: PRIMARY,
                      color: PRIMARY,
                      "&:hover": { bgcolor: alpha(PRIMARY, 0.1) },
                    }}
                  >
                    Edit
                  </Button>
                )}
              </Stack>
            </Box>
          </Collapse>
        </Box>
      </Paper>
    );
  }
);

MobileLoanCard.displayName = "MobileLoanCard";

// Mobile Grid Card
const MobileGridCard = React.memo(({ loan, onView }) => {
  const loanStatusConfig = getLoanStatusColor(loan.loanStatus);
  const initials = getInitials(loan.firstName, loan.lastName);

  return (
    <Paper
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha(PRIMARY, 0.1)}`,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 8px 24px ${alpha(PRIMARY, 0.15)}`,
        },
      }}
      onClick={() => onView(loan)}
    >
      <Box sx={{ p: 1.5 }}>
        <Stack spacing={1} alignItems="center" textAlign="center">
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
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {loan.firstName} {loan.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {loan.bank || "No bank"}
            </Typography>
          </Box>
          <Typography variant="body1" fontWeight={700} color={PRIMARY}>
            {formatCurrency(loan.loanAmount)}
          </Typography>
          <Chip
            label={loanStatusConfig.label}
            size="small"
            sx={{
              bgcolor: loanStatusConfig.bg,
              color: loanStatusConfig.color,
              fontWeight: 600,
              fontSize: "0.7rem",
              height: 24,
            }}
          />
        </Stack>
      </Box>
    </Paper>
  );
});

MobileGridCard.displayName = "MobileGridCard";

// View Loan Modal with Tabs
const ViewLoanModal = React.memo(
  ({ open, onClose, loan, userRole, showSnackbar }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [activeTab, setActiveTab] = useState(0);

    const userRoleConfig = useMemo(() => getRoleConfig(userRole), [userRole]);
    const loanStatusConfig = useMemo(
      () => getLoanStatusColor(loan?.loanStatus),
      [loan?.loanStatus],
    );
    const leadStatusConfig = useMemo(
      () => getLeadStatusConfig(loan?.status),
      [loan?.status],
    );

    const handleTabChange = (event, newValue) => {
      setActiveTab(newValue);
    };

    if (!loan) return null;

    const tabs = [
      {
        label: "Loan Info",
        icon: <AccountBalanceWallet />,
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
                <AccountBalanceWallet sx={{ fontSize: 20 }} /> Loan Details
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Loan Amount
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(loan.loanAmount)}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Bank
                  </Typography>
                  <Typography variant="body2">{loan.bank || "Not set"}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Branch
                  </Typography>
                  <Typography variant="body2">{loan.branchName || "Not set"}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Approval Date
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(loan.loanApprovalDate, "dd MMM yyyy")}
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
                <Person sx={{ fontSize: 20 }} /> Customer Information
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Full Name
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {loan.firstName} {loan.lastName}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                    {loan.email || "Not set"}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body2">{loan.phone || "Not set"}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        ),
      },
      {
        label: "Status",
        icon: <CheckCircleOutline />,
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
                <CheckCircleOutline sx={{ fontSize: 20 }} /> Status Information
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
                    Loan Status
                  </Typography>
                  <Chip
                    label={loanStatusConfig.label}
                    icon={loanStatusConfig.icon}
                    size="small"
                    sx={{
                      bgcolor: loanStatusConfig.bg,
                      color: loanStatusConfig.color,
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
                    label={loan.status || "Unknown"}
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
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(loan.createdAt, "dd MMM yyyy")}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(loan.updatedAt, "dd MMM yyyy")}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {loan.loanNotes && (
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
                  <Note sx={{ fontSize: 20 }} /> Loan Notes
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {loan.loanNotes}
                </Typography>
              </Paper>
            )}
          </Stack>
        ),
      },
    ];

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 4,
            maxHeight: isMobile ? "100%" : "90vh",
            margin: isMobile ? 0 : 24,
          },
        }}
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
                {getInitials(loan.firstName, loan.lastName)}
              </Avatar>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                >
                  {loan.firstName} {loan.lastName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.9,
                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                  }}
                >
                  Loan Application • ID: {loan._id?.slice(-8)}
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
  },
);

ViewLoanModal.displayName = "ViewLoanModal";

// Edit Loan Modal
const EditLoanModal = React.memo(
  ({ open, onClose, loan, onSave, userRole, showSnackbar }) => {
    const { fetchAPI } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
      loanAmount: "",
      bank: "",
      branchName: "",
      loanStatus: "pending",
      loanApprovalDate: null,
      loanNotes: "",
      status: "Bank Loan Apply",
    });
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
      if (open && loan) {
        setFormData({
          loanAmount: loan.loanAmount ? loan.loanAmount.toString() : "",
          bank: loan.bank || "",
          branchName: loan.branchName || "",
          loanStatus: loan.loanStatus || "pending",
          loanApprovalDate: loan.loanApprovalDate
            ? parseISO(loan.loanApprovalDate)
            : null,
          loanNotes: loan.loanNotes || "",
          status: loan.status || "Bank Loan Apply",
        });
        setValidationErrors({});
      }
    }, [open, loan]);

    const validateForm = useCallback(() => {
      const errors = {};
      if (!formData.loanAmount) errors.loanAmount = "Loan amount is required";
      if (!formData.bank) errors.bank = "Bank name is required";
      if (!formData.branchName) errors.branchName = "Branch name is required";

      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    }, [formData]);

    const handleSubmit = useCallback(async () => {
      if (!validateForm()) {
        showSnackbar("Please fix the errors in the form", "error");
        return;
      }

      setLoading(true);
      try {
        const payload = {
          loanAmount: parseFloat(formData.loanAmount),
          bank: formData.bank.trim(),
          branchName: formData.branchName.trim(),
          loanStatus: formData.loanStatus,
          loanNotes: formData.loanNotes.trim(),
          status: formData.status,
        };

        if (formData.loanApprovalDate && isValid(formData.loanApprovalDate)) {
          payload.loanApprovalDate = format(
            formData.loanApprovalDate,
            "yyyy-MM-dd",
          );
        }

        const response = await fetchAPI(`/lead/updateLead/${loan._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response?.success) {
          showSnackbar("Loan application updated successfully", "success");
          onSave(response.result);
          onClose();
        } else {
          throw new Error(
            response?.message || "Failed to update loan application",
          );
        }
      } catch (error) {
        console.error("Error updating loan application:", error);
        showSnackbar(
          error.message || "Failed to update loan application",
          "error",
        );
      } finally {
        setLoading(false);
      }
    }, [formData, validateForm, loan, fetchAPI, showSnackbar, onSave, onClose]);

    if (!loan) return null;

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
                  Edit Loan Application
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                >
                  {loan.firstName} {loan.lastName}
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
              label="Loan Amount"
              value={formData.loanAmount}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, loanAmount: e.target.value }))
              }
              fullWidth
              size="small"
              error={!!validationErrors.loanAmount}
              helperText={validationErrors.loanAmount}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CurrencyRupee fontSize="small" />
                  </InputAdornment>
                ),
              }}
              inputProps={{ type: "number" }}
            />

            <FormControl fullWidth size="small" error={!!validationErrors.bank}>
              <InputLabel>Bank</InputLabel>
              <Select
                value={formData.bank}
                label="Bank"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bank: e.target.value }))
                }
              >
                <MenuItem value="">
                  <em>Select Bank</em>
                </MenuItem>
                {BANK_LIST.map((bank) => (
                  <MenuItem key={bank} value={bank}>
                    {bank}
                  </MenuItem>
                ))}
              </Select>
              {validationErrors.bank && (
                <FormHelperText>{validationErrors.bank}</FormHelperText>
              )}
            </FormControl>

            <TextField
              label="Branch Name"
              value={formData.branchName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  branchName: e.target.value,
                }))
              }
              fullWidth
              size="small"
              error={!!validationErrors.branchName}
              helperText={validationErrors.branchName}
              required
            />

            <FormControl fullWidth size="small">
              <InputLabel>Loan Status</InputLabel>
              <Select
                value={formData.loanStatus}
                label="Loan Status"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    loanStatus: e.target.value,
                  }))
                }
              >
                {LOAN_STATUS_OPTIONS.map((status) => {
                  const config = getLoanStatusColor(status);
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
                {LEAD_STATUS_OPTIONS.map((status) => {
                  const config = getLeadStatusConfig(status);
                  return (
                    <MenuItem key={status} value={status}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {config.icon}
                        <span>{status}</span>
                      </Stack>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <DatePicker
              label="Loan Approval Date"
              value={formData.loanApprovalDate}
              onChange={(newValue) =>
                setFormData((prev) => ({
                  ...prev,
                  loanApprovalDate: newValue,
                }))
              }
              slotProps={{
                textField: { fullWidth: true, size: "small" },
              }}
            />

            <TextField
              label="Loan Notes"
              value={formData.loanNotes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, loanNotes: e.target.value }))
              }
              fullWidth
              multiline
              rows={isMobile ? 3 : 4}
              placeholder="Add any comments or notes about this loan application..."
              size="small"
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
                <Save />
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
  },
);

EditLoanModal.displayName = "EditLoanModal";

// Summary Card Component
const SummaryCard = React.memo(({ card, index }) => (
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
));

SummaryCard.displayName = "SummaryCard";

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

// Empty State Component
const EmptyState = React.memo(({ onClearFilters, hasFilters }) => (
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
      <AccountBalanceWallet sx={{ fontSize: 48, color: PRIMARY }} />
    </Box>
    <Typography variant="h6" fontWeight={600} gutterBottom>
      No loan applications found
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
    >
      {hasFilters
        ? "No applications match your current filters. Try adjusting your search criteria."
        : "No loan applications have been submitted yet."}
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
));

EmptyState.displayName = "EmptyState";

// ========== MAIN COMPONENT ==========
export default function BankLoanApply() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { fetchAPI, user, getUserRole } = useAuth();
  const userRole = getUserRole();
  const userPermissions = useMemo(
    () => getUserPermissions(userRole),
    [userRole],
  );

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

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
  const [loansData, setLoansData] = useState({
    loans: [],
    summary: {
      totalLoans: 0,
      pendingLoans: 0,
      submittedLoans: 0,
      totalLoanAmount: 0,
      avgLoanAmount: 0,
    },
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [loanStatusFilter, setLoanStatusFilter] = useState("All");
  const [leadStatusFilter, setLeadStatusFilter] = useState("All");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const [dateFilterError, setDateFilterError] = useState("");

  // Sorting & Pagination
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

  // View Mode for Mobile
  const [viewMode, setViewMode] = useState("card");

  // Modal States
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedActionLoan, setSelectedActionLoan] = useState(null);

  // Refs
  const containerRef = useRef(null);

  // Snackbar Handler
  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Fetch Data
  const fetchLoansData = useCallback(async () => {
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
        `/lead/bankLoanSummary?${params.toString()}`,
      );

      if (response?.success) {
        const data = response.result || {};
        const rawLoans = data.bankLoans || [];

        let filteredLoans = rawLoans;
        if (userRole === "TEAM" && user?._id) {
          filteredLoans = rawLoans.filter(
            (loan) =>
              loan.assignedTo === user._id ||
              loan.assignedManager === user._id ||
              loan.assignedUser === user._id ||
              loan.assignedUser?._id === user._id ||
              loan.createdBy === user._id,
          );
        }

        const totalLoans = filteredLoans.length;
        const pendingLoans = filteredLoans.filter(
          (loan) => loan.loanStatus?.toLowerCase() === "pending",
        ).length;
        const submittedLoans = filteredLoans.filter(
          (loan) => loan.loanStatus?.toLowerCase() === "submitted",
        ).length;
        const totalLoanAmount = filteredLoans.reduce(
          (sum, loan) => sum + (parseFloat(loan.loanAmount) || 0),
          0,
        );
        const avgLoanAmount = totalLoans > 0 ? totalLoanAmount / totalLoans : 0;

        setLoansData({
          loans: filteredLoans,
          summary: {
            totalLoans,
            pendingLoans,
            submittedLoans,
            totalLoanAmount,
            avgLoanAmount,
          },
        });
      } else {
        throw new Error(response?.message || "Failed to fetch loan data");
      }
    } catch (err) {
      console.error("Error fetching loans:", err);
      setError(err.message || "Network error. Please try again.");
      showSnackbar(err.message || "Failed to fetch loan data", "error");
    } finally {
      setLoading(false);
    }
  }, [period, fetchAPI, userRole, user, showSnackbar]);

  // Apply Filters
  const applyFilters = useCallback(() => {
    try {
      let filtered = [...loansData.loans];

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (loan) =>
            (loan.firstName?.toLowerCase() || "").includes(query) ||
            (loan.lastName?.toLowerCase() || "").includes(query) ||
            (loan.email?.toLowerCase() || "").includes(query) ||
            (loan.phone || "").includes(query) ||
            (loan.bank?.toLowerCase() || "").includes(query) ||
            (loan.branchName?.toLowerCase() || "").includes(query),
        );
      }

      if (loanStatusFilter !== "All") {
        filtered = filtered.filter(
          (loan) => loan.loanStatus === loanStatusFilter,
        );
      }

      if (leadStatusFilter !== "All") {
        filtered = filtered.filter((loan) => loan.status === leadStatusFilter);
      }

      if (
        dateFilter.startDate &&
        isValid(dateFilter.startDate) &&
        dateFilter.endDate &&
        isValid(dateFilter.endDate)
      ) {
        const start = startOfDay(new Date(dateFilter.startDate));
        const end = endOfDay(new Date(dateFilter.endDate));

        filtered = filtered.filter((loan) => {
          try {
            const loanDate = loan.loanApprovalDate
              ? parseISO(loan.loanApprovalDate)
              : loan.createdAt
                ? parseISO(loan.createdAt)
                : null;
            if (!loanDate || !isValid(loanDate)) return false;
            return isWithinInterval(loanDate, { start, end });
          } catch {
            return false;
          }
        });
      }

      if (sortConfig.key) {
        filtered.sort((a, b) => {
          let aVal = a[sortConfig.key];
          let bVal = b[sortConfig.key];

          if (sortConfig.key === "loanApprovalDate" || sortConfig.key === "createdAt") {
            aVal = aVal ? parseISO(aVal) : new Date(0);
            bVal = bVal ? parseISO(bVal) : new Date(0);
          } else if (sortConfig.key === "firstName") {
            aVal = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
            bVal = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
          } else if (sortConfig.key === "loanAmount") {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
          } else if (sortConfig.key === "loanStatus") {
            aVal = getLoanStatusColor(aVal)?.order || 0;
            bVal = getLoanStatusColor(bVal)?.order || 0;
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
      return loansData.loans;
    }
  }, [
    loansData.loans,
    searchQuery,
    loanStatusFilter,
    leadStatusFilter,
    dateFilter,
    sortConfig,
    showSnackbar,
  ]);

  // Memoized Computed Values
  const filteredLoans = useMemo(() => applyFilters(), [applyFilters]);

  const paginatedLoans = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredLoans.slice(start, start + rowsPerPage);
  }, [filteredLoans, page, rowsPerPage]);

  const totalPages = useMemo(
    () => Math.ceil(filteredLoans.length / rowsPerPage),
    [filteredLoans.length, rowsPerPage],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (loanStatusFilter !== "All") count++;
    if (leadStatusFilter !== "All") count++;
    if (dateFilter.startDate) count++;
    if (dateFilter.endDate) count++;
    return count;
  }, [searchQuery, loanStatusFilter, leadStatusFilter, dateFilter]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Total Loans",
        value: loansData.summary.totalLoans,
        color: PRIMARY,
        icon: <AccountBalanceWallet />,
        subText: "All applications",
      },
      {
        label: "Pending",
        value: loansData.summary.pendingLoans,
        color: PRIMARY,
        icon: <HourglassEmpty />,
        subText: "Awaiting submission",
      },
      {
        label: "Submitted",
        value: loansData.summary.submittedLoans,
        color: PRIMARY,
        icon: <Send />,
        subText: "Sent to bank",
      },
      {
        label: "Total Amount",
        value: formatCurrency(loansData.summary.totalLoanAmount),
        color: PRIMARY,
        icon: <CurrencyRupee />,
        subText: "Total loan value",
      },
    ],
    [loansData.summary],
  );

  // Effects
  useEffect(() => {
    if (hasAccess(userRole)) {
      fetchLoansData();
    }
  }, [fetchLoansData, userRole]);

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
    setViewMode(isMobile ? "card" : "grid");
  }, [isMobile]);

  // Handlers
  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleViewClick = useCallback(
    (loan) => {
      if (!loan?._id) {
        showSnackbar("Invalid loan data", "error");
        return;
      }
      setSelectedLoan(loan);
      setViewModalOpen(true);
    },
    [showSnackbar],
  );

  const handleEditClick = useCallback(
    (loan) => {
      if (!loan?._id) {
        showSnackbar("Invalid loan data", "error");
        return;
      }
      if (!userPermissions.canEdit) {
        showSnackbar("You don't have permission to edit this loan", "error");
        return;
      }
      setSelectedLoan(loan);
      setEditModalOpen(true);
    },
    [userPermissions, showSnackbar],
  );

  const handleLoanUpdate = useCallback(
    async (updatedLoan) => {
      try {
        await fetchLoansData();
        showSnackbar("Loan updated successfully", "success");
      } catch (err) {
        console.error("Error after loan update:", err);
        showSnackbar("Failed to refresh data", "error");
      }
    },
    [fetchLoansData, showSnackbar],
  );

  const handleActionMenuOpen = useCallback((event, loan) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedActionLoan(loan);
  }, []);

  const handleActionMenuClose = useCallback(() => {
    setActionMenuAnchor(null);
    setSelectedActionLoan(null);
  }, []);

  const handleActionSelect = useCallback(
    (action) => {
      if (!selectedActionLoan) return;

      switch (action) {
        case "view":
          handleViewClick(selectedActionLoan);
          break;
        case "edit":
          handleEditClick(selectedActionLoan);
          break;
        default:
          break;
      }

      handleActionMenuClose();
    },
    [
      selectedActionLoan,
      handleViewClick,
      handleEditClick,
      handleActionMenuClose,
    ],
  );

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setLoanStatusFilter("All");
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

  if (loading && loansData.loans.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error && loansData.loans.length === 0) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        <Alert
          severity="error"
          sx={{ borderRadius: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchLoansData}>
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
      <ViewLoanModal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        loan={selectedLoan}
        userRole={userRole}
        showSnackbar={showSnackbar}
      />

      <EditLoanModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        loan={selectedLoan}
        onSave={handleLoanUpdate}
        userRole={userRole}
        showSnackbar={showSnackbar}
      />

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={showMobileFilter}
        onClose={() => setShowMobileFilter(false)}
        period={period}
        setPeriod={setPeriod}
        loanStatusFilter={loanStatusFilter}
        setLoanStatusFilter={setLoanStatusFilter}
        leadStatusFilter={leadStatusFilter}
        setLeadStatusFilter={setLeadStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        viewMode={viewMode}
        setViewMode={setViewMode}
        dateFilterError={dateFilterError}
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
          sx={{ width: "100%", borderRadius: 2 , color:"#fff" }}
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
                Bank Loan Applications
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              >
                Track and manage all loan applications
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              {isMobile && (
                <Button
                  variant="contained"
                  startIcon={<FilterAlt />}
                  onClick={() => setShowMobileFilter(true)}
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
                onClick={fetchLoansData}
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
              placeholder="Search by name, email, phone, bank..."
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
                  placeholder="Search by name, email, phone, bank..."
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
                    sx={{ color: PRIMARY }}
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
                        Loan Status
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={loanStatusFilter}
                          onChange={(e) => setLoanStatusFilter(e.target.value)}
                        >
                          <MenuItem value="All">All Statuses</MenuItem>
                          {LOAN_STATUS_OPTIONS.map((status) => {
                            const config = getLoanStatusColor(status);
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
                          {LEAD_STATUS_OPTIONS.map((status) => {
                            const config = getLeadStatusConfig(status);
                            return (
                              <MenuItem key={status} value={status}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  {config.icon}
                                  <span>{status}</span>
                                </Stack>
                              </MenuItem>
                            );
                          })}
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
                    {loanStatusFilter !== "All" && (
                      <Chip
                        label={`Loan Status: ${getLoanStatusColor(loanStatusFilter).label}`}
                        size="small"
                        onDelete={() => setLoanStatusFilter("All")}
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
              Loan Applications
              <Chip
                label={`${filteredLoans.length} total`}
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

            {isMobile && (
              <Stack direction="row" spacing={1}>
                <ButtonGroup size="small" variant="outlined">
                  <Button
                    onClick={() => setViewMode("card")}
                    variant={viewMode === "card" ? "contained" : "outlined"}
                    sx={{
                      bgcolor: viewMode === "card" ? PRIMARY : "transparent",
                      color: viewMode === "card" ? "#fff" : PRIMARY,
                      borderColor: PRIMARY,
                    }}
                  >
                    <ViewList fontSize="small" />
                  </Button>
                  <Button
                    onClick={() => setViewMode("grid")}
                    variant={viewMode === "grid" ? "contained" : "outlined"}
                    sx={{
                      bgcolor: viewMode === "grid" ? PRIMARY : "transparent",
                      color: viewMode === "grid" ? "#fff" : PRIMARY,
                      borderColor: PRIMARY,
                    }}
                  >
                    <Apps fontSize="small" />
                  </Button>
                </ButtonGroup>
              </Stack>
            )}
          </Box>

          {isMobile ? (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {loading && loansData.loans.length > 0 && (
                <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />
              )}
              {paginatedLoans.length > 0 ? (
                viewMode === "card" ? (
                  paginatedLoans.map((loan) => (
                    <MobileLoanCard
                      key={loan._id}
                      loan={loan}
                      onView={handleViewClick}
                      onEdit={handleEditClick}
                      userPermissions={userPermissions}
                    />
                  ))
                ) : (
                  <Grid container spacing={1.5}>
                    {paginatedLoans.map((loan) => (
                      <Grid item xs={6} key={loan._id}>
                        <MobileGridCard loan={loan} onView={handleViewClick} />
                      </Grid>
                    ))}
                  </Grid>
                )
              ) : (
                <EmptyState
                  onClearFilters={handleClearFilters}
                  hasFilters={activeFilterCount > 0}
                />
              )}
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: "70vh", overflow: "auto" }}>
              {loading && loansData.loans.length > 0 && (
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
                        sx={{ textTransform: "none", fontWeight: 600 }}
                      >
                        Customer
                        {sortConfig.key === "firstName" &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUpward fontSize="small" />
                          ) : (
                            <ArrowDownward fontSize="small" />
                          ))}
                      </Button>
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      Bank
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
                        onClick={() => handleSort("loanAmount")}
                        sx={{ textTransform: "none", fontWeight: 600 }}
                      >
                        Amount
                        {sortConfig.key === "loanAmount" &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUpward fontSize="small" />
                          ) : (
                            <ArrowDownward fontSize="small" />
                          ))}
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
                        onClick={() => handleSort("loanApprovalDate")}
                        sx={{ textTransform: "none", fontWeight: 600 }}
                      >
                        Date
                        {sortConfig.key === "loanApprovalDate" &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUpward fontSize="small" />
                          ) : (
                            <ArrowDownward fontSize="small" />
                          ))}
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
                        onClick={() => handleSort("loanStatus")}
                        sx={{ textTransform: "none", fontWeight: 600 }}
                      >
                        Status
                        {sortConfig.key === "loanStatus" &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUpward fontSize="small" />
                          ) : (
                            <ArrowDownward fontSize="small" />
                          ))}
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
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedLoans.length > 0 ? (
                    paginatedLoans.map((loan) => {
                      const loanStatusConfig = getLoanStatusColor(loan.loanStatus);
                      const leadStatusConfig = getLeadStatusConfig(loan.status);

                      return (
                        <TableRow key={loan._id} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: PRIMARY,
                                  fontSize: "0.875rem",
                                }}
                              >
                                {getInitials(loan.firstName, loan.lastName)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {loan.firstName} {loan.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {loan.phone || "No phone"}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {loan.bank || "—"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {loan.branchName || "No branch"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} color={PRIMARY}>
                              {formatCurrency(loan.loanAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDateShort(loan.loanApprovalDate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={loanStatusConfig.description} arrow>
                              <Chip
                                label={loanStatusConfig.label}
                                icon={loanStatusConfig.icon}
                                size="small"
                                sx={{
                                  bgcolor: loanStatusConfig.bg,
                                  color: loanStatusConfig.color,
                                  fontWeight: 600,
                                  minWidth: 80,
                                }}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={leadStatusConfig.description} arrow>
                              <Chip
                                label={loan.status || "Unknown"}
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
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                size="small"
                                onClick={() => handleViewClick(loan)}
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
                                  onClick={() => handleEditClick(loan)}
                                  sx={{
                                    bgcolor: alpha(PRIMARY, 0.1),
                                    color: PRIMARY,
                                  }}
                                >
                                  <Edit fontSize="small" />
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
          )}

          {filteredLoans.length > 0 && (
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
                {Math.min((page + 1) * rowsPerPage, filteredLoans.length)} of{" "}
                {filteredLoans.length}
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
            Total Amount: {formatCurrency(loansData.summary.totalLoanAmount)} • Avg:{" "}
            {formatCurrency(loansData.summary.avgLoanAmount)}
          </Typography>
        </Box>
      </Box>

      {/* Mobile FAB */}
      {isMobile && (
        <Zoom in={true}>
          <Fab
            color="primary"
            aria-label="filter"
            onClick={() => setShowMobileFilter(true)}
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