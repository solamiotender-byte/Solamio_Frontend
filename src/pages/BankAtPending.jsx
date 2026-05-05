// pages/BankAtPendingPage.jsx (Updated with Mobile View)
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
  DescriptionOutlined,
  Image as ImageIcon,
  AccountBalanceWallet,
  Money,
  AttachMoney,
  CreditScore,
  TrendingFlat,
  GppMaybe,
  ThumbUp,
  ThumbDown,
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

// Period Options
const PERIOD_OPTIONS = [
  { value: "Today", label: "Today", icon: <CalendarToday /> },
  { value: "This Week", label: "This Week", icon: <DateRange /> },
  { value: "This Month", label: "This Month", icon: <DateRange /> },
  { value: "All", label: "All Time", icon: <DateRange /> },
];

// Bank Status Configuration
const BANK_STATUS_OPTIONS = ["pending", "approved", "rejected"];

const BANK_STATUS_CONFIG = {
  pending: {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    icon: <PendingActions sx={{ fontSize: 16 }} />,
    label: "Pending",
    description: "Waiting for bank approval",
    order: 1,
  },
  approved: {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    icon: <CheckCircle sx={{ fontSize: 16 }} />,
    label: "Approved",
    description: "Bank approval received",
    order: 2,
  },
  rejected: {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    icon: <Cancel sx={{ fontSize: 16 }} />,
    label: "Rejected",
    description: "Bank rejected the application",
    order: 3,
  },
};

// Lead Status Configuration
const LEAD_STATUS_OPTIONS = ["Bank at Pending", "Disbursement", "Missed Leads"];

const LEAD_STATUS_CONFIG = {
  "Bank at Pending": {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    icon: <AccountBalanceWallet sx={{ fontSize: 16 }} />,
    description: "Awaiting bank approval",
  },
  Disbursement: {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
    icon: <Money sx={{ fontSize: 16 }} />,
    description: "Loan disbursement stage",
  },
  "Missed Leads": {
    bg: alpha(PRIMARY_COLOR, 0.08),
    color: PRIMARY_COLOR,
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
  "Federal Bank",
  "Other",
];

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
  canManage: ["Head_office", "ZSM", "ASM"].includes(userRole),
  canSeeAll: ["Head_office", "ZSM", "ASM"].includes(userRole),
  canSeeOwn: userRole === "TEAM",
  canUpdateStatus: ["Head_office", "ZSM", "ASM"].includes(userRole),
});

const getBankStatusConfig = (status) => {
  const normalizedStatus = status?.toLowerCase();
  return (
    BANK_STATUS_CONFIG[normalizedStatus] || {
      bg: alpha(PRIMARY_COLOR, 0.08),
      color: PRIMARY_COLOR,
      icon: <PendingActions sx={{ fontSize: 16 }} />,
      label: status || "Unknown",
      description: "Unknown status",
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

const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
};

// ========== MOBILE FILTER DRAWER ==========
const MobileFilterDrawer = ({
  open,
  onClose,
  period,
  setPeriod,
  bankStatusFilter,
  setBankStatusFilter,
  leadStatusFilter,
  setLeadStatusFilter,
  bankFilter,
  setBankFilter,
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
              Filter Bank Pending
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
                    placeholder="Search by name, email, phone, bank..."
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

            {/* Bank Status Section */}
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
                onClick={() => toggleSection("bankStatus")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccountBalanceWallet sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Bank Status
                  </Typography>
                </Stack>
                {expandedSection === "bankStatus" ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={expandedSection === "bankStatus"}>
                <Box sx={{ p: 2 }}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={bankStatusFilter}
                      onChange={(e) => setBankStatusFilter(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="All">All Statuses</MenuItem>
                      {BANK_STATUS_OPTIONS.map((status) => {
                        const config = getBankStatusConfig(status);
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

            {/* Bank Section */}
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
                onClick={() => toggleSection("bank")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccountBalance sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Bank
                  </Typography>
                </Stack>
                {expandedSection === "bank" ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={expandedSection === "bank"}>
                <Box sx={{ p: 2 }}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={bankFilter}
                      onChange={(e) => setBankFilter(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="All">All Banks</MenuItem>
                      {BANK_LIST.map((bank) => (
                        <MenuItem key={bank} value={bank}>
                          {bank}
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
                      { key: "loanAmount", label: "Loan Amount" },
                      { key: "bankAtPendingDate", label: "Pending Date" },
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

// ========== MOBILE BANK CARD ==========
const MobileBankCard = ({ lead, onView, onStatusUpdate, permissions }) => {
  const [expanded, setExpanded] = useState(false);

  const bankStatusConfig = getBankStatusConfig(lead.bankAtPendingStatus);
  const leadStatusConfig = getLeadStatusConfig(lead.status);
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
                {lead.firstName} {lead.lastName}
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

        {/* Bank Info */}
        <Box sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <AccountBalanceWallet
              sx={{ fontSize: 14, color: alpha(PRIMARY_COLOR, 0.6) }}
            />
            <Typography variant="body2" fontWeight={500} noWrap>
              {lead.bank || "Not specified"}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <AttachMoney
              sx={{ fontSize: 14, color: alpha(PRIMARY_COLOR, 0.6) }}
            />
            <Typography variant="body2" fontWeight={500}>
              {formatCurrency(lead.loanAmount)}
            </Typography>
            <FiberManualRecord sx={{ fontSize: 4, color: "text.disabled" }} />
            <CalendarToday
              sx={{ fontSize: 14, color: alpha(PRIMARY_COLOR, 0.6) }}
            />
            <Typography variant="body2" fontWeight={500}>
              {formatDate(lead.bankAtPendingDate, "dd MMM")}
            </Typography>
          </Stack>
        </Box>

        {/* Status Chips */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Tooltip title={bankStatusConfig.description} arrow>
            <Chip
              label={bankStatusConfig.label}
              icon={bankStatusConfig.icon}
              size="small"
              sx={{
                bgcolor: bankStatusConfig.bg,
                color: bankStatusConfig.color,
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
              {lead.branchName && (
                <Grid item xs={12}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Branch
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                    {lead.branchName}
                  </Typography>
                </Grid>
              )}
              {lead.loanApprovalDate && (
                <Grid item xs={12}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Approval Date
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(lead.loanApprovalDate, "dd MMM yyyy")}
                  </Typography>
                </Grid>
              )}
              {lead.bankAtPendingNotes && (
                <Grid item xs={12}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Notes
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                    {lead.bankAtPendingNotes}
                  </Typography>
                </Grid>
              )}
              {lead.reason && (
                <Grid item xs={12}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Reason
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                    {lead.reason}
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
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {formatDate(lead.updatedAt, "dd MMM yyyy")}
                </Typography>
              </Grid>
            </Grid>

            {/* Document Indicators */}
            {(lead.loanDocument?.url || 
              lead.aadhaar?.url || 
              lead.panCard?.url || 
              lead.passbook?.url) && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Documents Available:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {lead.loanDocument?.url && (
                    <Chip
                      icon={<Description fontSize="small" />}
                      label="Loan"
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem" }}
                    />
                  )}
                  {lead.aadhaar?.url && (
                    <Chip
                      icon={<BadgeIcon fontSize="small" />}
                      label="Aadhaar"
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem" }}
                    />
                  )}
                  {lead.panCard?.url && (
                    <Chip
                      icon={<CreditCard fontSize="small" />}
                      label="PAN"
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem" }}
                    />
                  )}
                  {lead.passbook?.url && (
                    <Chip
                      icon={<ReceiptLong fontSize="small" />}
                      label="Passbook"
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem" }}
                    />
                  )}
                </Stack>
              </Box>
            )}

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
              {permissions.canUpdateStatus && (
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<TrendingUp />}
                  onClick={() => onStatusUpdate(lead)}
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

  const isImage = useMemo(
    () => imageUrl && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(imageUrl),
    [imageUrl],
  );

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

// ========== BANK STATUS UPDATE MODAL ==========
const BankStatusUpdateModal = ({
  open,
  onClose,
  lead,
  onStatusUpdate,
  showSnackbar,
  userRole,
}) => {
  const { fetchAPI, user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(false);
  const [selectedBankStatus, setSelectedBankStatus] = useState("");
  const [selectedLeadStatus, setSelectedLeadStatus] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});

  const bankStatusConfig = useMemo(
    () => getBankStatusConfig(lead?.bankAtPendingStatus),
    [lead?.bankAtPendingStatus],
  );

  const leadStatusConfig = useMemo(
    () => getLeadStatusConfig(lead?.status),
    [lead?.status],
  );

  useEffect(() => {
    if (open && lead) {
      setSelectedBankStatus(lead.bankAtPendingStatus || "");
      setSelectedLeadStatus(lead.status || "Bank at Pending");
      setReason(lead.reason || "");
      setNotes(lead.bankAtPendingNotes || "");
      setErrors({});
    }
  }, [open, lead]);

  const handleSubmit = useCallback(async () => {
    if (!selectedBankStatus) {
      setErrors({ bankStatus: "Please select a bank status" });
      return;
    }

    if (!selectedLeadStatus) {
      setErrors({ leadStatus: "Please select a lead status" });
      return;
    }

    if (selectedBankStatus === "rejected" && !reason.trim()) {
      setErrors({ reason: "Reason is required for rejection" });
      return;
    }

    if (
      selectedBankStatus === lead?.bankAtPendingStatus &&
      selectedLeadStatus === lead?.status
    ) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        bankAtPendingStatus: selectedBankStatus,
        status: selectedLeadStatus,
        reason: selectedBankStatus === "rejected" ? reason : "",
        bankAtPendingNotes: notes,
        updatedBy: user?._id,
        updatedByRole: user?.role,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetchAPI(`/lead/updateLead/${lead._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.success) {
        showSnackbar("Bank status updated successfully", "success");
        onStatusUpdate(response.result);
        onClose();
      } else {
        throw new Error(response.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating bank status:", error);
      setErrors({ submit: error.message });
      showSnackbar(error.message || "Failed to update status", "error");
    } finally {
      setLoading(false);
    }
  }, [
    selectedBankStatus,
    selectedLeadStatus,
    reason,
    notes,
    lead,
    user,
    fetchAPI,
    showSnackbar,
    onStatusUpdate,
    onClose,
  ]);

  const handleClose = useCallback(() => {
    setSelectedBankStatus("");
    setSelectedLeadStatus("");
    setReason("");
    setNotes("");
    setErrors({});
    onClose();
  }, [onClose]);

  const availableBankStatuses = useMemo(
    () =>
      BANK_STATUS_OPTIONS.filter(
        (status) => status !== lead?.bankAtPendingStatus,
      ),
    [lead?.bankAtPendingStatus],
  );

  const getLeadStatusOptions = useMemo(() => {
    switch (selectedBankStatus) {
      case "approved":
        return ["Disbursement"];
      case "rejected":
        return ["Missed Leads"];
      case "pending":
        return ["Bank at Pending"];
      case "disbursed":
        return ["Disbursement"];
      default:
        return LEAD_STATUS_OPTIONS;
    }
  }, [selectedBankStatus]);

  if (!lead) return null;

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
              <AccountBalanceWallet sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                Update Bank Status
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                {lead.firstName} {lead.lastName}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small" disabled={loading}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
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
            >
              Current Bank Status
            </Typography>
            <Chip
              label={lead.bankAtPendingStatus || "Not set"}
              icon={bankStatusConfig.icon}
              sx={{
                bgcolor: bankStatusConfig.bg,
                color: bankStatusConfig.color,
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
              {bankStatusConfig.description}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Current Lead Status
            </Typography>
            <Chip
              label={lead.status || "Unknown"}
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
              New Bank Status *
            </Typography>
            <FormControl fullWidth size="small" error={!!errors.bankStatus}>
              <Select
                value={selectedBankStatus}
                onChange={(e) => {
                  setSelectedBankStatus(e.target.value);
                  switch (e.target.value) {
                    case "approved":
                      setSelectedLeadStatus("Disbursement");
                      break;
                    case "rejected":
                      setSelectedLeadStatus("Missed Leads");
                      break;
                    case "pending":
                      setSelectedLeadStatus("Bank at Pending");
                      break;
                    default:
                      setSelectedLeadStatus("Bank at Pending");
                  }
                }}
                displayEmpty
                disabled={loading}
              >
                <MenuItem value="" disabled>
                  Select bank status
                </MenuItem>
                {availableBankStatuses.map((status) => {
                  const config = getBankStatusConfig(status);
                  return (
                    <MenuItem key={status} value={status}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                      >
                        {config.icon}
                        <Box>
                          <Typography variant="body2">
                            {config.label}
                          </Typography>
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
              {errors.bankStatus && (
                <FormHelperText>{errors.bankStatus}</FormHelperText>
              )}
            </FormControl>
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Lead Status *
            </Typography>
            <FormControl fullWidth size="small" error={!!errors.leadStatus}>
              <Select
                value={selectedLeadStatus}
                onChange={(e) => setSelectedLeadStatus(e.target.value)}
                displayEmpty
                disabled={!selectedBankStatus || loading}
              >
                <MenuItem value="" disabled>
                  Select lead status
                </MenuItem>
                {getLeadStatusOptions.map((status) => {
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
              {errors.leadStatus && (
                <FormHelperText>{errors.leadStatus}</FormHelperText>
              )}
            </FormControl>
          </Box>

          {selectedBankStatus === "rejected" && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Reason for Rejection *
              </Typography>
              <TextField
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                fullWidth
                multiline
                rows={isMobile ? 2 : 3}
                placeholder="Enter the reason for rejection..."
                size="small"
                error={!!errors.reason}
                helperText={errors.reason}
                disabled={loading}
              />
            </Box>
          )}

          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Status Notes
            </Typography>
            <TextField
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              rows={isMobile ? 2 : 3}
              placeholder="Add notes about this status update..."
              size="small"
              disabled={loading}
            />
          </Box>

          {selectedBankStatus && (
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">
                {selectedBankStatus === "approved"
                  ? "When approved, lead will move to Disbursement stage."
                  : selectedBankStatus === "rejected"
                    ? "When rejected, lead will move to Missed Leads stage."
                    : selectedBankStatus === "pending"
                      ? "When pending, lead will stay in Bank at Pending stage."
                      : selectedBankStatus === "disbursed"
                        ? "When disbursed, lead will stay in Disbursement stage."
                        : ""}
              </Typography>
            </Alert>
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
            loading ||
            !selectedBankStatus ||
            !selectedLeadStatus ||
            (selectedBankStatus === lead?.bankAtPendingStatus &&
              selectedLeadStatus === lead?.status)
          }
          startIcon={
            loading ? (
              <CircularProgress size={20} sx={{ color: "#fff" }} />
            ) : (
              <Save />
            )
          }
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
      label: "Bank Info",
      icon: <AccountBalanceWallet />,
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
              <AccountBalanceWallet sx={{ fontSize: 20 }} /> Bank Information
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Bank
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {displayData.bank || "Not specified"}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Branch Name
                </Typography>
                <Typography variant="body2">
                  {displayData.branchName || "Not specified"}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Loan Amount
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatCurrency(displayData.loanAmount)}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Loan Approval Date
                </Typography>
                <Typography variant="body2">
                  {formatDate(displayData.loanApprovalDate)}
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
              <GppMaybe sx={{ fontSize: 20 }} /> Status Information
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
                  Bank Status
                </Typography>
                <Chip
                  label={getBankStatusConfig(displayData.bankAtPendingStatus).label}
                  icon={getBankStatusConfig(displayData.bankAtPendingStatus).icon}
                  size="small"
                  sx={{
                    bgcolor: getBankStatusConfig(displayData.bankAtPendingStatus).bg,
                    color: getBankStatusConfig(displayData.bankAtPendingStatus).color,
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
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Bank at Pending Date
                </Typography>
                <Typography variant="body2">
                  {formatDate(displayData.bankAtPendingDate)}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {formatDate(displayData.updatedAt)}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      ),
    },
    {
      label: "Customer",
      icon: <Person />,
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
            <Person sx={{ fontSize: 20 }} /> Customer Information
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Full Name
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {displayData.firstName} {displayData.lastName}
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                {displayData.email || "Not set"}
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Phone
              </Typography>
              <Typography variant="body2">
                {displayData.phone || "Not set"}
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Address
              </Typography>
              <Typography variant="body2">
                {displayData.address || "Not set"}
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                City
              </Typography>
              <Typography variant="body2">
                {displayData.city || "Not set"}
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Solar Requirement
              </Typography>
              <Typography variant="body2">
                {displayData.solarRequirement || "Not specified"}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      ),
    },
    {
      label: "Documents",
      icon: <FolderOpen />,
      content: (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ mb: 3, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Bank Documents
          </Typography>
          <Grid container spacing={2}>
            {displayData.loanDocument?.url && (
              <Grid item xs={12}>
                <DocumentCard
                  title="Loan Document"
                  url={displayData.loanDocument.url}
                  icon={<Description sx={{ color: PRIMARY_COLOR }} />}
                  filename="loan-document"
                  onView={handleViewDocument}
                  onDownload={handleDownload}
                />
              </Grid>
            )}
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
            {displayData.otherDocuments?.map((doc, index) => (
              <Grid item xs={12} key={index}>
                <DocumentCard
                  title={doc.name || `Document ${index + 1}`}
                  url={doc.url}
                  icon={<InsertDriveFile sx={{ color: PRIMARY_COLOR }} />}
                  filename={doc.name}
                  onView={handleViewDocument}
                  onDownload={handleDownload}
                />
              </Grid>
            ))}
          </Grid>
          {!displayData.loanDocument?.url &&
            !displayData.aadhaar?.url &&
            !displayData.panCard?.url &&
            !displayData.passbook?.url &&
            (!displayData.otherDocuments || displayData.otherDocuments.length === 0) && (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <FolderOpen sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Documents Uploaded
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No documents have been uploaded for this loan yet.
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
            <Note sx={{ fontSize: 20 }} /> Bank Pending Notes
          </Typography>
          {displayData.bankAtPendingNotes ? (
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {displayData.bankAtPendingNotes}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No notes available
            </Typography>
          )}
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
                Bank Pending Details • {formatCurrency(displayData.loanAmount)}
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
      <AccountBalanceWallet sx={{ fontSize: 48, color: PRIMARY_COLOR }} />
    </Box>
    <Typography variant="h6" fontWeight={600} gutterBottom>
      No bank pending leads found
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
    >
      {hasFilters
        ? "No leads match your current filters. Try adjusting your search criteria."
        : "No leads are currently pending bank approval."}
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
export default function BankAtPendingPage() {
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
  const [bankPendingData, setBankPendingData] = useState({
    leads: [],
    summary: {
      totalLeads: 0,
      pendingLeads: 0,
      approvedLeads: 0,
      rejectedLeads: 0,
      disbursedLeads: 0,
      totalLoanAmount: 0,
      avgLoanAmount: 0,
    },
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [bankStatusFilter, setBankStatusFilter] = useState("All");
  const [leadStatusFilter, setLeadStatusFilter] = useState("All");
  const [bankFilter, setBankFilter] = useState("All");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const [dateFilterError, setDateFilterError] = useState("");

  // Sorting & Pagination
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(
    isMobile ? 10 : DEFAULT_ITEMS_PER_PAGE,
  );

  // Modal States
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedActionLead, setSelectedActionLead] = useState(null);

  // Refs
  const containerRef = useRef(null);

  // Snackbar Handler
  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Fetch Data
  const fetchBankPendingData = useCallback(async () => {
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

      // Add status filter to only get bank pending leads
      params.append("status", "Bank at Pending");

      const response = await fetchAPI(
        `/lead/bankingAtPending?${params.toString()}`,
      );

      if (response?.success) {
        const data = response.result || {};
        const rawLeads = data.leads || [];

        let filteredLeads = rawLeads;
        if (userRole === "TEAM" && user?._id) {
          filteredLeads = rawLeads.filter(
            (lead) =>
              lead.assignedTo === user._id ||
              lead.assignedManager === user._id ||
              lead.assignedUser === user._id ||
              lead.assignedUser?._id === user._id ||
              lead.createdBy === user._id,
          );
        }

        const totalLeads = filteredLeads.length;
        const pendingLeads = filteredLeads.filter(
          (lead) => lead.bankAtPendingStatus?.toLowerCase() === "pending",
        ).length;
        const approvedLeads = filteredLeads.filter(
          (lead) => lead.bankAtPendingStatus?.toLowerCase() === "approved",
        ).length;
        const rejectedLeads = filteredLeads.filter(
          (lead) => lead.bankAtPendingStatus?.toLowerCase() === "rejected",
        ).length;
        const disbursedLeads = filteredLeads.filter(
          (lead) => lead.bankAtPendingStatus?.toLowerCase() === "disbursed",
        ).length;
        const totalLoanAmount = filteredLeads.reduce(
          (sum, lead) => sum + (parseFloat(lead.loanAmount) || 0),
          0,
        );
        const avgLoanAmount = totalLeads > 0 ? totalLoanAmount / totalLeads : 0;

        setBankPendingData({
          leads: filteredLeads,
          summary: {
            totalLeads,
            pendingLeads,
            approvedLeads,
            rejectedLeads,
            disbursedLeads,
            totalLoanAmount,
            avgLoanAmount,
          },
        });
      } else {
        throw new Error(response?.message || "Failed to fetch bank pending data");
      }
    } catch (err) {
      console.error("Error fetching bank pending data:", err);
      setError(err.message || "Network error. Please try again.");
      showSnackbar(err.message || "Failed to fetch bank pending data", "error");
      setBankPendingData({
        leads: [],
        summary: {
          totalLeads: 0,
          pendingLeads: 0,
          approvedLeads: 0,
          rejectedLeads: 0,
          disbursedLeads: 0,
          totalLoanAmount: 0,
          avgLoanAmount: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [period, fetchAPI, userRole, user, showSnackbar]);

  // Apply Filters
  const applyFilters = useCallback(() => {
    try {
      let filtered = [...bankPendingData.leads];

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (lead) =>
            (lead.firstName?.toLowerCase() || "").includes(query) ||
            (lead.lastName?.toLowerCase() || "").includes(query) ||
            (lead.email?.toLowerCase() || "").includes(query) ||
            (lead.phone || "").includes(query) ||
            (lead.bank?.toLowerCase() || "").includes(query) ||
            (lead.branchName?.toLowerCase() || "").includes(query),
        );
      }

      if (bankStatusFilter !== "All") {
        filtered = filtered.filter(
          (lead) => lead.bankAtPendingStatus === bankStatusFilter,
        );
      }

      if (leadStatusFilter !== "All") {
        filtered = filtered.filter((lead) => lead.status === leadStatusFilter);
      }

      if (bankFilter !== "All") {
        filtered = filtered.filter((lead) => lead.bank === bankFilter);
      }

      if (
        dateFilter.startDate &&
        isValid(dateFilter.startDate) &&
        dateFilter.endDate &&
        isValid(dateFilter.endDate)
      ) {
        const start = startOfDay(new Date(dateFilter.startDate));
        const end = endOfDay(new Date(dateFilter.endDate));

        filtered = filtered.filter((lead) => {
          try {
            const leadDate = lead.bankAtPendingDate
              ? parseISO(lead.bankAtPendingDate)
              : lead.loanApprovalDate
                ? parseISO(lead.loanApprovalDate)
                : lead.createdAt
                  ? parseISO(lead.createdAt)
                  : null;
            if (!leadDate || !isValid(leadDate)) return false;
            return isWithinInterval(leadDate, { start, end });
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
            sortConfig.key === "bankAtPendingDate" ||
            sortConfig.key === "loanApprovalDate" ||
            sortConfig.key === "createdAt"
          ) {
            aVal = aVal ? parseISO(aVal) : new Date(0);
            bVal = bVal ? parseISO(bVal) : new Date(0);
          } else if (sortConfig.key === "firstName") {
            aVal = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
            bVal = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
          } else if (sortConfig.key === "loanAmount") {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
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
      return bankPendingData.leads;
    }
  }, [
    bankPendingData.leads,
    searchQuery,
    bankStatusFilter,
    leadStatusFilter,
    bankFilter,
    dateFilter,
    sortConfig,
    showSnackbar,
  ]);

  // Effects
  useEffect(() => {
    if (hasAccess(userRole)) {
      fetchBankPendingData();
    }
  }, [fetchBankPendingData, userRole]);

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

  // Memoized Computed Values
  const filteredLeads = useMemo(() => applyFilters(), [applyFilters]);

  const paginatedLeads = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredLeads.slice(start, start + rowsPerPage);
  }, [filteredLeads, page, rowsPerPage]);

  const totalPages = useMemo(
    () => Math.ceil(filteredLeads.length / rowsPerPage),
    [filteredLeads.length, rowsPerPage],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (bankStatusFilter !== "All") count++;
    if (leadStatusFilter !== "All") count++;
    if (bankFilter !== "All") count++;
    if (dateFilter.startDate) count++;
    if (dateFilter.endDate) count++;
    return count;
  }, [searchQuery, bankStatusFilter, leadStatusFilter, bankFilter, dateFilter]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Total Pending",
        value: bankPendingData.summary.totalLeads,
        color: PRIMARY_COLOR,
        icon: <AccountBalanceWallet />,
        subText: "All bank pending leads",
      },
      {
        label: "Pending",
        value: bankPendingData.summary.pendingLeads,
        color: PRIMARY_COLOR,
        icon: <PendingActions />,
        subText: "Awaiting approval",
      },
      {
        label: "Approved",
        value: bankPendingData.summary.approvedLeads,
        color: PRIMARY_COLOR,
        icon: <CheckCircle />,
        subText: "Bank approved",
      },
      {
        label: "Rejected",
        value: bankPendingData.summary.rejectedLeads,
        color: PRIMARY_COLOR,
        icon: <Cancel />,
        subText: "Bank rejected",
      },
    ],
    [bankPendingData.summary],
  );

  // Handlers
  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleViewClick = useCallback(
    (lead) => {
      if (!lead?._id) {
        showSnackbar("Invalid lead data", "error");
        return;
      }
      setSelectedLead(lead);
      setViewModalOpen(true);
    },
    [showSnackbar],
  );

  const handleStatusUpdateClick = useCallback(
    (lead) => {
      if (!lead?._id) {
        showSnackbar("Invalid lead data", "error");
        return;
      }
      if (!userPermissions.canUpdateStatus) {
        showSnackbar(
          "You don't have permission to update bank status",
          "error",
        );
        return;
      }
      setSelectedLead(lead);
      setStatusUpdateModalOpen(true);
    },
    [userPermissions, showSnackbar],
  );

  const handleStatusUpdate = useCallback(
    async (updatedLead) => {
      try {
        await fetchBankPendingData();
        showSnackbar("Bank status updated successfully", "success");
      } catch (err) {
        console.error("Error after status update:", err);
        showSnackbar("Failed to refresh data", "error");
      }
    },
    [fetchBankPendingData, showSnackbar],
  );

  const handleActionMenuOpen = useCallback((event, lead) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedActionLead(lead);
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
    setBankStatusFilter("All");
    setLeadStatusFilter("All");
    setBankFilter("All");
    setDateFilter({ startDate: null, endDate: null });
    setDateFilterError("");
    setSortConfig({ key: null, direction: "asc" });
    setPage(0);
    if (showFilterPanel) setShowFilterPanel(false);
  }, [showFilterPanel]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
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

  if (loading && bankPendingData.leads.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error && bankPendingData.leads.length === 0) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        <Alert
          severity="error"
          sx={{ borderRadius: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={fetchBankPendingData}
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
        lead={selectedLead}
        userRole={userRole}
        showSnackbar={showSnackbar}
        handleViewDocument={handleViewDocument}
      />

      <BankStatusUpdateModal
        open={statusUpdateModalOpen}
        onClose={() => setStatusUpdateModalOpen(false)}
        lead={selectedLead}
        onStatusUpdate={handleStatusUpdate}
        showSnackbar={showSnackbar}
        userRole={userRole}
      />

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        period={period}
        setPeriod={setPeriod}
        bankStatusFilter={bankStatusFilter}
        setBankStatusFilter={setBankStatusFilter}
        leadStatusFilter={leadStatusFilter}
        setLeadStatusFilter={setLeadStatusFilter}
        bankFilter={bankFilter}
        setBankFilter={setBankFilter}
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
                Bank at Pending Management
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              >
                Track and manage all bank approval pending leads
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
                onClick={fetchBankPendingData}
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
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
              >
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

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Bank Status</InputLabel>
                  <Select
                    value={bankStatusFilter}
                    label="Bank Status"
                    onChange={(e) => setBankStatusFilter(e.target.value)}
                  >
                    <MenuItem value="All">All Status</MenuItem>
                    {BANK_STATUS_OPTIONS.map((status) => {
                      const config = getBankStatusConfig(status);
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
                        Bank
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={bankFilter}
                          onChange={(e) => setBankFilter(e.target.value)}
                          displayEmpty
                        >
                          <MenuItem value="All">All Banks</MenuItem>
                          {BANK_LIST.map((bank) => (
                            <MenuItem key={bank} value={bank}>
                              {bank}
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
                    {bankStatusFilter !== "All" && (
                      <Chip
                        label={`Bank Status: ${getBankStatusConfig(bankStatusFilter).label}`}
                        size="small"
                        onDelete={() => setBankStatusFilter("All")}
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
                    {bankFilter !== "All" && (
                      <Chip
                        label={`Bank: ${bankFilter}`}
                        size="small"
                        onDelete={() => setBankFilter("All")}
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
              Bank Pending Leads
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
              {loading && bankPendingData.leads.length > 0 && (
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
                      Customer
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
                        onClick={() => handleSort("bank")}
                        endIcon={
                          sortConfig.key === "bank" ? (
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
                        Bank
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
                        onClick={() => handleSort("loanAmount")}
                        endIcon={
                          sortConfig.key === "loanAmount" ? (
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
                        Loan Amount
                      </Button>
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: alpha(PRIMARY_COLOR, 0.05),
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      Bank Status
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
                      <Button
                        size="small"
                        onClick={() => handleSort("bankAtPendingDate")}
                        endIcon={
                          sortConfig.key === "bankAtPendingDate" ? (
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
                      Pending Date
                    </Button>
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
                  {paginatedLeads.length > 0 ? (
                    paginatedLeads.map((lead) => {
                      const bankStatusConfig = getBankStatusConfig(
                        lead.bankAtPendingStatus,
                      );
                      const leadStatusConfig = getLeadStatusConfig(
                        lead.status,
                      );

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
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: PRIMARY_COLOR,
                                  fontSize: '0.875rem',
                                }}
                              >
                                {getInitials(lead.firstName, lead.lastName)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {lead.firstName} {lead.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {lead.phone || 'No phone'}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {lead.bank || "Not specified"}
                              </Typography>
                              {lead.branchName && (
                                <Typography variant="caption" color="text.secondary">
                                  {lead.branchName}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {formatCurrency(lead.loanAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={bankStatusConfig.description} arrow>
                              <Chip
                                label={bankStatusConfig.label}
                                icon={bankStatusConfig.icon}
                                size="small"
                                sx={{
                                  bgcolor: bankStatusConfig.bg,
                                  color: bankStatusConfig.color,
                                  fontWeight: 600,
                                  minWidth: 80,
                                }}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={leadStatusConfig.description} arrow>
                              <Chip
                                label={lead.status || "Unknown"}
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
                            <Box>
                              <Typography variant="body2">
                                {formatDate(lead.bankAtPendingDate, "dd MMM yyyy")}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(lead.bankAtPendingDate, "hh:mm a")}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {lead.assignedUser || lead.assignedManager ? (
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {lead.assignedUser
                                    ? `${lead.assignedUser.firstName || ""} ${lead.assignedUser.lastName || ""}`.trim()
                                    : `${lead.assignedManager?.firstName || ""} ${lead.assignedManager?.lastName || ""}`.trim()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {lead.assignedUser
                                    ? lead.assignedUser.role || "Assigned User"
                                    : lead.assignedManager?.role || "Manager"}
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

                              {userPermissions.canUpdateStatus && (
                                <Tooltip title="Update Bank Status" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleStatusUpdateClick(lead)}
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
                      <TableCell colSpan={8}>
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
              {loading && bankPendingData.leads.length > 0 && (
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
                  <MobileBankCard
                    key={lead._id}
                    lead={lead}
                    onView={handleViewClick}
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
            {bankPendingData.summary.totalLeads} total leads • Total Loan: {formatCurrency(bankPendingData.summary.totalLoanAmount)}
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
