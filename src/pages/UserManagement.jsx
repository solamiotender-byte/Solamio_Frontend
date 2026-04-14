// pages/UserManagement.jsx
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
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  TablePagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Grid,
  Stack,
  Badge,
  SwipeableDrawer,
  Collapse,
  Fab,
  Zoom,
  Fade,
  Slide,
  alpha,
  Skeleton,
  LinearProgress,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Person,
  Search,
  Refresh,
  CheckCircle,
  Block,
  Clear,
  Phone,
  Email,
  PersonAdd,
  Check,
  Close,
  Group,
  SupervisorAccount,
  AdminPanelSettings,
  People,
  Lock,
  LockOpen,
  Visibility,
  ContentCopy,
  FilterAlt,
  Sort,
  ExpandMore,
  ExpandLess,
  DateRange,
  CalendarToday,
  ArrowUpward,
  ArrowDownward,
  ViewList,
  ViewModule,
  Key,
  ManageAccounts,
  AssignmentInd,
  Shield,
  VerifiedUser,
  PersonRemove,
  ErrorOutline,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../components/useToast.jsx";

const PRIMARY_COLOR = "#4569ea";
const SECONDARY_COLOR = "#1a237e";

const PERIOD_OPTIONS = [
  { value: "Today", label: "Today", icon: <CalendarToday /> },
  { value: "This Week", label: "This Week", icon: <DateRange /> },
  { value: "This Month", label: "This Month", icon: <DateRange /> },
  { value: "All", label: "All Time", icon: <DateRange /> },
];

const ROLE_CONFIG = {
  Head_office: {
    color: PRIMARY_COLOR,
    bg: alpha(PRIMARY_COLOR, 0.08),
    icon: <AdminPanelSettings fontSize="small" />,
    label: "Head Office",
    level: 1,
  },
  ZSM: {
    color: PRIMARY_COLOR,
    bg: alpha(PRIMARY_COLOR, 0.08),
    icon: <SupervisorAccount fontSize="small" />,
    label: "Zonal Sales Manager",
    level: 2,
  },
  ASM: {
    color: PRIMARY_COLOR,
    bg: alpha(PRIMARY_COLOR, 0.08),
    icon: <SupervisorAccount fontSize="small" />,
    label: "Area Sales Manager",
    level: 3,
  },
  TEAM: {
    color: PRIMARY_COLOR,
    bg: alpha(PRIMARY_COLOR, 0.08),
    icon: <Group fontSize="small" />,
    label: "Team Member",
    level: 4,
  },
};

const STATUS_CONFIG = {
  active: {
    color: "#4caf50",
    bg: alpha("#4caf50", 0.08),
    icon: <CheckCircle fontSize="small" />,
    label: "Active",
  },
  inactive: {
    color: "#f44336",
    bg: alpha("#f44336", 0.08),
    icon: <Block fontSize="small" />,
    label: "Inactive",
  },
};

// ========== SHARED MODAL HEADER ==========
const ModalHeader = ({ icon, title, subtitle, color = PRIMARY_COLOR, onClose, isMobile }) => (
  <Box
    sx={{
      position: "relative",
      background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
      px: { xs: 2.5, sm: 3.5 },
      pt: { xs: 2.5, sm: 3 },
      pb: { xs: 3, sm: 3.5 },
      overflow: "hidden",
      "&::before": {
        content: '""',
        position: "absolute",
        top: -40,
        right: -40,
        width: 140,
        height: 140,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.08)",
      },
      "&::after": {
        content: '""',
        position: "absolute",
        bottom: -20,
        left: "30%",
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.05)",
      },
    }}
  >
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        position: "relative",
        zIndex: 1,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: { xs: 44, sm: 52 },
            height: { xs: 44, sm: 52 },
            borderRadius: 2.5,
            bgcolor: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.25)",
            flexShrink: 0,
          }}
        >
          {React.cloneElement(icon, {
            sx: { color: "#fff", fontSize: { xs: 22, sm: 26 } },
          })}
        </Box>
        <Box>
          <Typography
            variant="h6"
            fontWeight={700}
            color="#fff"
            sx={{ fontSize: { xs: "1rem", sm: "1.15rem" }, lineHeight: 1.2 }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.78)",
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      <IconButton
        onClick={onClose}
        size="small"
        sx={{
          color: "rgba(255,255,255,0.85)",
          bgcolor: "rgba(255,255,255,0.12)",
          "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
          width: 32,
          height: 32,
        }}
      >
        <Close fontSize="small" />
      </IconButton>
    </Box>
  </Box>
);

// ========== MOBILE FILTER DRAWER ==========
const MobileFilterDrawer = ({
  open,
  onClose,
  period,
  setPeriod,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  handleClearFilters,
  searchQuery,
  setSearchQuery,
  sortConfig,
  setSortConfig,
  viewMode,
  setViewMode,
  activeFilterCount,
  roleOptions,
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
              Filter Users
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
                          variant={period === option.value ? "contained" : "outlined"}
                          onClick={() => setPeriod(option.value)}
                          startIcon={option.icon}
                          size="small"
                          sx={{
                            bgcolor: period === option.value ? PRIMARY_COLOR : "transparent",
                            color: period === option.value ? "#fff" : PRIMARY_COLOR,
                            borderColor: PRIMARY_COLOR,
                            "&:hover": {
                              bgcolor: period === option.value ? SECONDARY_COLOR : alpha(PRIMARY_COLOR, 0.1),
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

            {/* Role Section */}
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
                onClick={() => toggleSection("role")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <SupervisorAccount sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Role
                  </Typography>
                </Stack>
                {expandedSection === "role" ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={expandedSection === "role"}>
                <Box sx={{ p: 2 }}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="all">All Roles</MenuItem>
                      {roleOptions
                        .filter((opt) => opt.value !== "all")
                        .map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              {option.icon}
                              <span>{option.label}</span>
                            </Stack>
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
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
                  <CheckCircle sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Status
                  </Typography>
                </Stack>
                {expandedSection === "status" ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={expandedSection === "status"}>
                <Box sx={{ p: 2 }}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="active">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CheckCircle sx={{ color: "#4caf50" }} />
                          <span>Active</span>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="inactive">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Block sx={{ color: "#f44336" }} />
                          <span>Inactive</span>
                        </Stack>
                      </MenuItem>
                    </Select>
                  </FormControl>
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
                      { key: "role", label: "Role" },
                      { key: "status", label: "Status" },
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
                          bgcolor: sortConfig.key === option.key ? PRIMARY_COLOR : "transparent",
                          color: sortConfig.key === option.key ? "#fff" : PRIMARY_COLOR,
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
                        bgcolor: viewMode === "card" ? PRIMARY_COLOR : "transparent",
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
                        bgcolor: viewMode === "table" ? PRIMARY_COLOR : "transparent",
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
                "&:hover": { bgcolor: alpha(PRIMARY_COLOR, 0.05) },
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
                "&:hover": { bgcolor: SECONDARY_COLOR },
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

// ========== STAT CARD ==========
const StatCard = ({ title, value, icon, color, subtext, index }) => (
  <Fade in={true} timeout={500 + index * 100}>
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2, md: 2.5 },
        borderRadius: 3,
        border: `1px solid ${alpha(color, 0.1)}`,
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
              bgcolor: alpha(color, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: color,
            }}
          >
            {React.cloneElement(icon, {
              sx: { fontSize: { xs: 16, sm: 20, md: 24 } },
            })}
          </Box>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              color: color,
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "2rem" },
            }}
          >
            {value}
          </Typography>
        </Box>
        <Box>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
          >
            {title}
          </Typography>
          {subtext && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: { xs: "0.6rem", sm: "0.7rem" } }}
            >
              {subtext}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  </Fade>
);

// ========== MOBILE USER CARD ==========
const MobileUserCard = ({
  user,
  onEdit,
  onToggleStatus,
  onAssign,
  onViewPassword,
  onDelete,
  currentUserRole,
  currentUserId,
  statusLoading,
}) => {
  const [expanded, setExpanded] = useState(false);
  const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.TEAM;
  const statusConfig = STATUS_CONFIG[user.status] || STATUS_CONFIG.active;
  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`;

  const canEdit = useMemo(() => {
    if (!currentUserRole || !user) return false;
    if (user._id === currentUserId) return true;
    if (currentUserRole === "Head_office") return true;
    const userRoleLevel = ROLE_CONFIG[user.role]?.level || 999;
    const currentRoleLevel = ROLE_CONFIG[currentUserRole]?.level || 0;
    if (currentUserRole === "ZSM") return userRoleLevel > currentRoleLevel;
    if (currentUserRole === "ASM") return user.role === "TEAM";
    return false;
  }, [currentUserRole, user, currentUserId]);

  const canToggleStatus = canEdit;
  const canAssign =
    user.role === "TEAM" &&
    ["ZSM", "ASM", "Head_office"].includes(currentUserRole) &&
    !user.supervisor;
  const canViewPassword = currentUserRole === "Head_office";
  const canDelete =
    currentUserRole === "Head_office" && user.role !== "Head_office";

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
                bgcolor: roleConfig.color,
                color: "#fff",
                width: 48,
                height: 48,
                fontWeight: 600,
              }}
            >
              {initials}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="700" color={PRIMARY_COLOR}>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {user._id?.slice(-8) || "N/A"}
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
                {user.email || "No email"}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={6}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Phone sx={{ fontSize: 14, color: alpha(PRIMARY_COLOR, 0.6) }} />
              <Typography variant="caption" noWrap>
                {user.phoneNumber || "No phone"}
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        {/* Role and Status Chips */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
          <Chip
            label={roleConfig.label}
            size="small"
            icon={roleConfig.icon}
            sx={{
              bgcolor: roleConfig.bg,
              color: roleConfig.color,
              fontWeight: 600,
              height: 24,
              fontSize: "0.7rem",
              "& .MuiChip-icon": { fontSize: 14 },
            }}
          />
          <Chip
            label={statusConfig.label}
            size="small"
            icon={statusConfig.icon}
            sx={{
              bgcolor: statusConfig.bg,
              color: statusConfig.color,
              fontWeight: 600,
              height: 24,
              fontSize: "0.7rem",
              "& .MuiChip-icon": { fontSize: 14 },
            }}
          />
        </Box>

        {/* Manager Info */}
        {user.supervisor && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Manager
            </Typography>
            <Typography variant="body2">
              {user.supervisor.firstName} {user.supervisor.lastName}
            </Typography>
          </Box>
        )}

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
            }}
          >
            <Grid container spacing={2}>
              {user.zone && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Zone
                  </Typography>
                  <Typography variant="body2">{user.zone}</Typography>
                </Grid>
              )}
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Created
                </Typography>
                <Typography variant="body2">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "N/A"}
                </Typography>
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
              {canEdit && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Edit sx={{ ml: 1 }} />}
                  onClick={() => onEdit(user)}
                  sx={{
                    flex: 1,
                    bgcolor: PRIMARY_COLOR,
                    "&:hover": { bgcolor: SECONDARY_COLOR },
                    fontSize: "0.7rem",
                  }}
                />
              )}
              {canToggleStatus && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={
                    user.status === "active" ? (
                      <Lock sx={{ ml: 1 }} />
                    ) : (
                      <LockOpen sx={{ ml: 1 }} />
                    )
                  }
                  onClick={() => onToggleStatus(user)}
                  disabled={statusLoading[user._id]}
                  sx={{
                    flex: 1,
                    borderColor: user.status === "active" ? "#f44336" : "#4caf50",
                    color: user.status === "active" ? "#f44336" : "#4caf50",
                    fontSize: "0.7rem",
                  }}
                />
              )}
              {canAssign && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PersonAdd sx={{ ml: 1 }} />}
                  onClick={() => onAssign(user)}
                  sx={{
                    flex: 1,
                    borderColor: "#00bcd4",
                    color: "#00bcd4",
                    fontSize: "0.7rem",
                  }}
                />
              )}
              {canViewPassword && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Visibility sx={{ ml: 1 }} />}
                  onClick={() => onViewPassword(user)}
                  sx={{
                    flex: 1,
                    borderColor: "#ff9800",
                    color: "#ff9800",
                    fontSize: "0.7rem",
                  }}
                />
              )}
            </Stack>

            {canDelete && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => onDelete(user)}
                sx={{
                  flex: 1,
                  borderColor: "#f44336",
                  color: "#f44336",
                  fontSize: "0.7rem",
                  mt: 1,
                }}
              >
                Delete
              </Button>
            )}
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
};

// ========== LOADING SKELETON ==========
const LoadingSkeleton = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Grid container spacing={isMobile ? 1.5 : 2} sx={{ mb: 3 }}>
        {[1, 2, 3].map((item) => (
          <Grid item xs={6} sm={6} md={4} key={item}>
            <Skeleton
              variant="rectangular"
              height={isMobile ? 90 : 120}
              sx={{ borderRadius: 3 }}
            />
          </Grid>
        ))}
      </Grid>
      {isMobile && (
        <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2, mb: 2 }} />
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
const EmptyState = ({ onClearFilters, hasFilters, canAddUser, onAddUser }) => (
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
      <Person sx={{ fontSize: 48, color: PRIMARY_COLOR }} />
    </Box>
    <Typography variant="h6" fontWeight={600} gutterBottom>
      No users found
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
    >
      {hasFilters
        ? "No users match your current filters. Try adjusting your search criteria."
        : canAddUser
        ? "Add your first user to get started"
        : "No users available"}
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
    {!hasFilters && canAddUser && (
      <Button
        variant="contained"
        onClick={onAddUser}
        startIcon={<Add />}
        sx={{ bgcolor: PRIMARY_COLOR, "&:hover": { bgcolor: SECONDARY_COLOR } }}
      >
        Add First User
      </Button>
    )}
  </Box>
);

// ========== EDIT USER MODAL ==========
const EditUserModal = ({ open, onClose, user, onSave, currentUserRole, currentUser }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { safeFetchAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "",
    status: "active",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        role: user.role || "",
        status: user.status || "active",
      });
    }
  }, [user]);

  const getAvailableRoles = useMemo(() => {
    const currentRoleLevel = ROLE_CONFIG[currentUserRole]?.level || 0;
    return Object.entries(ROLE_CONFIG)
      .filter(([roleKey, config]) => {
        if (currentUserRole === "Head_office") return true;
        return config.level > currentRoleLevel;
      })
      .map(([value, config]) => ({
        value,
        label: config.label,
        icon: config.icon,
        level: config.level,
      }))
      .sort((a, b) => a.level - b.level);
  }, [currentUserRole]);

  const canEditRole = useMemo(() => {
    if (!user || !currentUserRole) return false;
    if (currentUserRole === "Head_office") return true;
    if (user._id === currentUser?._id) return false;
    const userRoleLevel = ROLE_CONFIG[user.role]?.level || 0;
    const currentRoleLevel = ROLE_CONFIG[currentUserRole]?.level || 0;
    return userRoleLevel > currentRoleLevel;
  }, [user, currentUserRole, currentUser]);

  const canEditStatus = useMemo(() => {
    if (!user || !currentUserRole) return false;
    if (currentUserRole === "Head_office") return true;
    if (user._id === currentUser?._id) return true;
    const userRoleLevel = ROLE_CONFIG[user.role]?.level || 0;
    const currentRoleLevel = ROLE_CONFIG[currentUserRole]?.level || 0;
    return userRoleLevel > currentRoleLevel;
  }, [user, currentUserRole, currentUser]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (formData.phoneNumber && !/^[0-9+\-\s]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Invalid phone number";
    }
    if (!formData.role && canEditRole) newErrors.role = "Role is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
      };
      if (canEditRole) updateData.role = formData.role;
      if (canEditStatus) updateData.status = formData.status;

      const response = await safeFetchAPI(`/user/update/${user._id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      if (!response.success) {
        if (response.type === "PERMISSION_DENIED") {
          setErrors({
            submit: response.message || "You don't have permission to update this user",
          });
        } else {
          setErrors({ submit: response.message || "Failed to update user" });
        }
        return;
      }
      if (response.result) {
        onSave(response.result);
        onClose();
      } else {
        onSave(response);
        onClose();
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setErrors({
        submit: error.message || "An error occurred while updating the user",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const roleConfig = user ? ROLE_CONFIG[user.role] || ROLE_CONFIG.TEAM : null;

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      bgcolor: "#f8fafd",
      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: PRIMARY_COLOR },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: PRIMARY_COLOR },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: PRIMARY_COLOR },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          margin: isMobile ? 0 : 3,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(69,105,234,0.18)",
        },
      }}
      TransitionComponent={isMobile ? Slide : Fade}
      transitionDuration={300}
    >
      <ModalHeader
        icon={<ManageAccounts />}
        title="Edit User"
        subtitle={user ? `${user.firstName} ${user.lastName} • ${roleConfig?.label}` : ""}
        color={PRIMARY_COLOR}
        onClose={onClose}
        isMobile={isMobile}
      />

      {loading && (
        <LinearProgress
          sx={{
            height: 3,
            bgcolor: alpha(PRIMARY_COLOR, 0.1),
            "& .MuiLinearProgress-bar": { bgcolor: PRIMARY_COLOR },
          }}
        />
      )}

      <DialogContent sx={{ py: 3, px: { xs: 2.5, sm: 3.5 }, bgcolor: "#fafbff" }}>
        {errors.submit && (
          <Alert
            severity="error"
            sx={{
              mb: 2.5,
              borderRadius: 2,
              border: `1px solid ${alpha("#f44336", 0.2)}`,
            }}
            icon={<ErrorOutline />}
          >
            {errors.submit}
          </Alert>
        )}

        <Stack spacing={2.5}>
          {/* Name Row */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={handleChange("firstName")}
                error={!!errors.firstName}
                helperText={errors.firstName}
                required
                size={isMobile ? "small" : "medium"}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange("lastName")}
                error={!!errors.lastName}
                helperText={errors.lastName}
                required
                size={isMobile ? "small" : "medium"}
                sx={fieldSx}
              />
            </Grid>
          </Grid>

          {/* Email */}
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange("email")}
            error={!!errors.email}
            helperText={errors.email}
            required
            size={isMobile ? "small" : "medium"}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: alpha(PRIMARY_COLOR, 0.5), fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={fieldSx}
          />

          {/* Phone */}
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phoneNumber}
            onChange={handleChange("phoneNumber")}
            error={!!errors.phoneNumber}
            helperText={errors.phoneNumber}
            size={isMobile ? "small" : "medium"}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Phone sx={{ color: alpha(PRIMARY_COLOR, 0.5), fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={fieldSx}
          />

          {/* Role */}
          {canEditRole && (
            <FormControl
              fullWidth
              size={isMobile ? "small" : "medium"}
              error={!!errors.role}
              required
            >
              <InputLabel sx={{ "&.Mui-focused": { color: PRIMARY_COLOR } }}>
                Role
              </InputLabel>
              <Select
                value={formData.role}
                onChange={handleChange("role")}
                label="Role"
                sx={{
                  borderRadius: 2,
                  bgcolor: "#f8fafd",
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: PRIMARY_COLOR },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: PRIMARY_COLOR },
                }}
              >
                {getAvailableRoles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box sx={{ color: PRIMARY_COLOR, display: "flex" }}>{role.icon}</Box>
                      <Typography>{role.label}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
              {errors.role && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors.role}
                </Typography>
              )}
            </FormControl>
          )}

          {/* Status */}
          {canEditStatus && (
            <Box
              sx={{
                borderRadius: 2.5,
                border: `1.5px solid ${alpha(PRIMARY_COLOR, 0.15)}`,
                bgcolor: "#f8fafd",
                overflow: "hidden",
              }}
            >
              <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary" gutterBottom>
                  Account Status
                </Typography>
              </Box>
              <Grid container sx={{ px: 1.5, pb: 1.5 }} spacing={1.5}>
                {["active", "inactive"].map((statusVal) => {
                  const sc = STATUS_CONFIG[statusVal];
                  const selected = formData.status === statusVal;
                  return (
                    <Grid item xs={6} key={statusVal}>
                      <Box
                        onClick={() => setFormData((p) => ({ ...p, status: statusVal }))}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: `2px solid ${selected ? sc.color : alpha(sc.color, 0.2)}`,
                          bgcolor: selected ? sc.bg : "transparent",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          "&:hover": { bgcolor: sc.bg, borderColor: sc.color },
                        }}
                      >
                        <Box sx={{ color: sc.color, display: "flex" }}>{sc.icon}</Box>
                        <Typography
                          variant="body2"
                          fontWeight={selected ? 700 : 500}
                          color={selected ? sc.color : "text.primary"}
                        >
                          {sc.label}
                        </Typography>
                        {selected && (
                          <Box sx={{ ml: "auto", color: sc.color, display: "flex" }}>
                            <Check fontSize="small" />
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 3.5 },
          py: 2.5,
          borderTop: `1px solid ${alpha(PRIMARY_COLOR, 0.08)}`,
          bgcolor: "#fff",
          gap: 1.5,
          flexDirection: { xs: "column-reverse", sm: "row" },
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth={isMobile}
          disabled={loading}
          sx={{
            borderRadius: 2,
            borderColor: alpha(PRIMARY_COLOR, 0.35),
            color: PRIMARY_COLOR,
            fontWeight: 600,
            px: 3,
            "&:hover": { borderColor: PRIMARY_COLOR, bgcolor: alpha(PRIMARY_COLOR, 0.04) },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          fullWidth={isMobile}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : <Check />
          }
          sx={{
            bgcolor: PRIMARY_COLOR,
            borderRadius: 2,
            fontWeight: 700,
            px: 3,
            boxShadow: `0 4px 14px ${alpha(PRIMARY_COLOR, 0.4)}`,
            "&:hover": {
              bgcolor: SECONDARY_COLOR,
              boxShadow: `0 6px 20px ${alpha(PRIMARY_COLOR, 0.5)}`,
            },
          }}
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ========== PASSWORD VIEW DIALOG ==========
const PasswordViewDialog = ({ open, onClose, user, fetchAPI }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (open && user) {
      setRevealed(false);
      fetchPassword();
    }
  }, [open, user]);

  const fetchPassword = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const data = await fetchAPI(`/user/getViewPassword/${user._id}`);
      if (data.success) {
        setPassword(data.result?.viewPassword || "No password available");
      } else {
        setPassword("Unable to fetch password");
        toast.error("Unable to fetch password for this user.", { title: "Password Error" });
      }
    } catch (error) {
      setPassword("Error loading password");
      toast.error("Error loading password. Please try again.", { title: "Password Error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (password && !password.includes("Unable") && !password.includes("Error")) {
      navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success("Password copied to clipboard.", { title: "Copied" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isError = password.includes("Unable") || password.includes("Error");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          margin: isMobile ? 0 : 3,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(255,152,0,0.15)",
        },
      }}
      TransitionComponent={isMobile ? Slide : Fade}
      transitionDuration={300}
    >
      <ModalHeader
        icon={<Key />}
        title="View Password"
        subtitle={user ? `${user.firstName} ${user.lastName}` : ""}
        color="#e65100"
        onClose={onClose}
        isMobile={isMobile}
      />

      <DialogContent sx={{ py: 3, px: { xs: 2.5, sm: 3 }, bgcolor: "#fffaf5" }}>
        <Stack spacing={2.5}>
          {/* Security notice */}
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              p: 2,
              borderRadius: 2,
              bgcolor: alpha("#ff9800", 0.08),
              border: `1px solid ${alpha("#ff9800", 0.2)}`,
            }}
          >
            <Shield sx={{ color: "#e65100", fontSize: 20, flexShrink: 0, mt: 0.1 }} />
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#e65100">
                Confidential Access
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Visible to Head Office only. Handle with care and do not share.
              </Typography>
            </Box>
          </Box>

          {/* Password display */}
          {loading ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: 4,
                gap: 1.5,
              }}
            >
              <CircularProgress size={32} sx={{ color: "#e65100" }} />
              <Typography variant="body2" color="text.secondary">
                Fetching credentials...
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                borderRadius: 2.5,
                border: `1.5px solid ${isError ? alpha("#f44336", 0.3) : alpha("#ff9800", 0.25)}`,
                bgcolor: isError ? alpha("#f44336", 0.04) : "#fff",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  bgcolor: isError ? alpha("#f44336", 0.07) : alpha("#ff9800", 0.07),
                  borderBottom: `1px solid ${
                    isError ? alpha("#f44336", 0.15) : alpha("#ff9800", 0.15)
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color={isError ? "#f44336" : "#e65100"}
                  letterSpacing={0.5}
                >
                  {isError ? "ERROR" : "PASSWORD"}
                </Typography>
                {!isError && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setRevealed((v) => !v)}
                    startIcon={<Visibility sx={{ fontSize: 14 }} />}
                    sx={{ color: "#e65100", fontSize: "0.7rem", py: 0, minWidth: 0 }}
                  >
                    {revealed ? "Hide" : "Reveal"}
                  </Button>
                )}
              </Box>

              <Box
                sx={{
                  px: 2.5,
                  py: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "monospace",
                    fontSize: { xs: "1rem", sm: "1.15rem" },
                    fontWeight: 600,
                    letterSpacing: revealed ? "0.05em" : "0.2em",
                    color: isError ? "#f44336" : "text.primary",
                    filter: revealed || isError ? "none" : "blur(5px)",
                    userSelect: revealed ? "auto" : "none",
                    transition: "filter 0.3s",
                    wordBreak: "break-all",
                    flex: 1,
                  }}
                >
                  {password}
                </Typography>
                {!isError && (
                  <Tooltip title={copied ? "Copied!" : "Copy password"}>
                    <IconButton
                      size="small"
                      onClick={handleCopyPassword}
                      sx={{
                        color: copied ? "#4caf50" : "#e65100",
                        bgcolor: copied ? alpha("#4caf50", 0.1) : alpha("#ff9800", 0.1),
                        transition: "all 0.2s",
                        flexShrink: 0,
                      }}
                    >
                      {copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          )}

          {/* User info card */}
          {user && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(PRIMARY_COLOR, 0.04),
                border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: PRIMARY_COLOR,
                  width: 36,
                  height: 36,
                  fontSize: "0.875rem",
                  fontWeight: 700,
                }}
              >
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
              <Box sx={{ ml: "auto" }}>
                <Chip
                  label={ROLE_CONFIG[user.role]?.label || user.role}
                  size="small"
                  sx={{
                    bgcolor: alpha(PRIMARY_COLOR, 0.1),
                    color: PRIMARY_COLOR,
                    fontWeight: 600,
                    fontSize: "0.65rem",
                  }}
                />
              </Box>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2.5,
          borderTop: `1px solid ${alpha("#ff9800", 0.12)}`,
          bgcolor: "#fff",
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          sx={{
            bgcolor: "#e65100",
            borderRadius: 2,
            fontWeight: 700,
            boxShadow: `0 4px 14px ${alpha("#ff9800", 0.35)}`,
            "&:hover": { bgcolor: "#bf360c" },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ========== DELETE USER DIALOG ==========
const DeleteUserDialog = ({ open, onClose, user, onConfirm }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const expectedText = user?.firstName || "";
  const isConfirmed = confirmText.toLowerCase() === expectedText.toLowerCase();

  const handleConfirm = async () => {
    setConfirming(true);
    await onConfirm();
    setConfirming(false);
    setConfirmText("");
  };

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          margin: isMobile ? 0 : 3,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(244,67,54,0.18)",
        },
      }}
      TransitionComponent={isMobile ? Slide : Fade}
      transitionDuration={300}
    >
      <ModalHeader
        icon={<PersonRemove />}
        title="Delete User"
        subtitle="This action is permanent and cannot be undone"
        color="#c62828"
        onClose={handleClose}
        isMobile={isMobile}
      />

      <DialogContent sx={{ py: 3, px: { xs: 2.5, sm: 3 }, bgcolor: "#fff9f9" }}>
        {user && (
          <Stack spacing={2.5}>
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha("#f44336", 0.06),
                border: `1px solid ${alpha("#f44336", 0.2)}`,
              }}
            >
              <ErrorOutline
                sx={{ color: "#c62828", fontSize: 20, flexShrink: 0, mt: 0.1 }}
              />
              <Typography variant="body2" color="#c62828" fontWeight={500}>
                All data associated with this account will be permanently erased.
              </Typography>
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: `1.5px solid ${alpha("#f44336", 0.2)}`,
                bgcolor: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: alpha("#f44336", 0.12),
                  color: "#c62828",
                  width: 52,
                  height: 52,
                  fontWeight: 700,
                  fontSize: "1.1rem",
                }}
              >
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </Avatar>
              <Box flex={1}>
                <Typography fontWeight={700} variant="subtitle1">
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {user.email}
                </Typography>
                <Chip
                  label={ROLE_CONFIG[user.role]?.label || user.role}
                  size="small"
                  sx={{
                    mt: 0.5,
                    bgcolor: alpha(PRIMARY_COLOR, 0.1),
                    color: PRIMARY_COLOR,
                    fontWeight: 600,
                    fontSize: "0.65rem",
                    height: 20,
                  }}
                />
              </Box>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Type{" "}
                <strong style={{ color: "#c62828" }}>{expectedText}</strong> to
                confirm deletion:
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder={`Type "${expectedText}" to confirm`}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                error={confirmText.length > 0 && !isConfirmed}
                helperText={
                  confirmText.length > 0 && !isConfirmed
                    ? "Name doesn't match"
                    : ""
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: isConfirmed ? "#4caf50" : "#f44336",
                    },
                  },
                }}
                InputProps={{
                  endAdornment: isConfirmed ? (
                    <InputAdornment position="end">
                      <Check sx={{ color: "#4caf50" }} />
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2.5,
          borderTop: `1px solid ${alpha("#f44336", 0.1)}`,
          bgcolor: "#fff",
          gap: 1.5,
          flexDirection: { xs: "column-reverse", sm: "row" },
        }}
      >
        <Button
          onClick={handleClose}
          variant="outlined"
          fullWidth={isMobile}
          disabled={confirming}
          sx={{
            borderRadius: 2,
            borderColor: alpha("#f44336", 0.35),
            color: "#c62828",
            fontWeight: 600,
            px: 3,
            "&:hover": { borderColor: "#f44336", bgcolor: alpha("#f44336", 0.04) },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          fullWidth={isMobile}
          disabled={!isConfirmed || confirming}
          startIcon={
            confirming ? (
              <CircularProgress size={18} sx={{ color: "#fff" }} />
            ) : (
              <Delete />
            )
          }
          sx={{
            bgcolor: "#c62828",
            borderRadius: 2,
            fontWeight: 700,
            px: 3,
            boxShadow: isConfirmed ? `0 4px 14px ${alpha("#f44336", 0.4)}` : "none",
            "&:hover": { bgcolor: "#b71c1c" },
            "&.Mui-disabled": { bgcolor: alpha("#f44336", 0.3), color: "#fff" },
          }}
        >
          {confirming ? "Deleting..." : "Delete User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ========== ASSIGN MANAGER DIALOG ==========
const AssignManagerDialog = ({
  open,
  onClose,
  userToAssign,
  managers,
  selectedManager,
  setSelectedManager,
  onAssign,
  assignLoading,
  userRole,
  currentUser,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          margin: isMobile ? 0 : 3,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,188,212,0.15)",
        },
      }}
      TransitionComponent={isMobile ? Slide : Fade}
      transitionDuration={300}
    >
      <ModalHeader
        icon={<AssignmentInd />}
        title="Assign Manager"
        subtitle={
          userToAssign
            ? `Assigning ${userToAssign.firstName} ${userToAssign.lastName}`
            : ""
        }
        color="#00838f"
        onClose={onClose}
        isMobile={isMobile}
      />

      <DialogContent sx={{ py: 3, px: { xs: 2.5, sm: 3.5 }, bgcolor: "#f5fdfe" }}>
        {userToAssign && (
          <Stack spacing={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: `1.5px solid ${alpha("#00bcd4", 0.2)}`,
                bgcolor: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: alpha("#00bcd4", 0.15),
                  color: "#00838f",
                  width: 48,
                  height: 48,
                  fontWeight: 700,
                }}
              >
                {userToAssign.firstName?.[0]}
                {userToAssign.lastName?.[0]}
              </Avatar>
              <Box flex={1}>
                <Typography fontWeight={700}>
                  {userToAssign.firstName} {userToAssign.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {ROLE_CONFIG[userToAssign.role]?.label} · {userToAssign.email}
                </Typography>
              </Box>
              <Chip
                label="Unassigned"
                size="small"
                sx={{
                  bgcolor: alpha("#ff9800", 0.1),
                  color: "#e65100",
                  fontWeight: 600,
                  fontSize: "0.65rem",
                }}
              />
            </Box>

            <Box>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                color="text.primary"
                sx={{ mb: 1.5 }}
              >
                Select a Manager
              </Typography>

              {managers.length === 0 ? (
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: `1.5px dashed ${alpha("#00bcd4", 0.3)}`,
                    textAlign: "center",
                  }}
                >
                  <People
                    sx={{ color: alpha("#00bcd4", 0.4), fontSize: 36, mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    No active managers found
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Ensure there are active ZSM or ASM users
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {managers.map((manager) => {
                    const selected = selectedManager === manager._id;
                    const rc = ROLE_CONFIG[manager.role] || ROLE_CONFIG.TEAM;
                    return (
                      <Box
                        key={manager._id}
                        onClick={() => setSelectedManager(manager._id)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: `2px solid ${
                            selected ? "#00bcd4" : alpha("#00bcd4", 0.15)
                          }`,
                          bgcolor: selected ? alpha("#00bcd4", 0.06) : "#fff",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          "&:hover": {
                            bgcolor: alpha("#00bcd4", 0.05),
                            borderColor: alpha("#00bcd4", 0.5),
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: rc.color,
                            width: 38,
                            height: 38,
                            fontWeight: 700,
                            fontSize: "0.875rem",
                          }}
                        >
                          {manager.firstName?.[0]}
                          {manager.lastName?.[0]}
                        </Avatar>
                        <Box flex={1}>
                          <Typography
                            variant="body2"
                            fontWeight={selected ? 700 : 500}
                          >
                            {manager.firstName} {manager.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rc.label}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            border: `2px solid ${
                              selected ? "#00bcd4" : alpha("#00bcd4", 0.3)
                            }`,
                            bgcolor: selected ? "#00bcd4" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "all 0.2s",
                          }}
                        >
                          {selected && (
                            <Check sx={{ fontSize: 14, color: "#fff" }} />
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>

            {userRole === "ASM" && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha("#00bcd4", 0.06),
                  border: `1px solid ${alpha("#00bcd4", 0.2)}`,
                  display: "flex",
                  gap: 1,
                  alignItems: "flex-start",
                }}
              >
                <VerifiedUser
                  sx={{ color: "#00838f", fontSize: 18, flexShrink: 0, mt: 0.1 }}
                />
                <Typography variant="caption" color="#00838f">
                  As an ASM, you can only assign team members to yourself.
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 3.5 },
          py: 2.5,
          borderTop: `1px solid ${alpha("#00bcd4", 0.12)}`,
          bgcolor: "#fff",
          gap: 1.5,
          flexDirection: { xs: "column-reverse", sm: "row" },
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth={isMobile}
          disabled={assignLoading}
          sx={{
            borderRadius: 2,
            borderColor: alpha("#00bcd4", 0.4),
            color: "#00838f",
            fontWeight: 600,
            px: 3,
            "&:hover": { borderColor: "#00bcd4", bgcolor: alpha("#00bcd4", 0.04) },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onAssign}
          variant="contained"
          fullWidth={isMobile}
          disabled={!selectedManager || assignLoading || managers.length === 0}
          startIcon={
            assignLoading ? (
              <CircularProgress size={18} sx={{ color: "#fff" }} />
            ) : (
              <AssignmentInd />
            )
          }
          sx={{
            bgcolor: "#00838f",
            borderRadius: 2,
            fontWeight: 700,
            px: 3,
            boxShadow: `0 4px 14px ${alpha("#00bcd4", 0.35)}`,
            "&:hover": { bgcolor: "#006064" },
            "&.Mui-disabled": { bgcolor: alpha("#00bcd4", 0.3), color: "#fff" },
          }}
        >
          {assignLoading ? "Assigning..." : "Assign Manager"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ========== MAIN COMPONENT ==========
const UserManagement = () => {
  const navigate = useNavigate();
  const { safeFetchAPI, user: currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // State
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [period, setPeriod] = useState("All");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState(isMobile ? "card" : "table");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [userToAssign, setUserToAssign] = useState(null);
  const [selectedManager, setSelectedManager] = useState("");
  const [managers, setManagers] = useState([]);

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [userToViewPassword, setUserToViewPassword] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Loading states
  const [statusLoading, setStatusLoading] = useState({});
  const [assignLoading, setAssignLoading] = useState(false);

  // Statistics
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  const containerRef = useRef(null);

  // Role-based permissions
  const userRole = currentUser?.role || "";
  const canAddUser = ["Head_office", "ZSM", "ASM", "TEAM"].includes(userRole);
  const canViewPassword = userRole === "Head_office";
  const canDeleteUsers = userRole === "Head_office";

  // Filter options based on role
  const roleOptions = useMemo(() => {
    const allRoles = [
      { value: "all", label: "All Roles", icon: <People /> },
      ...Object.entries(ROLE_CONFIG).map(([value, config]) => ({
        value,
        label: config.label,
        icon: config.icon,
      })),
    ];
    if (userRole === "ASM") {
      return allRoles.filter(
        (role) => role.value === "all" || role.value === "TEAM"
      );
    }
    if (userRole === "ZSM") {
      return allRoles.filter(
        (role) =>
          role.value === "all" || ["ASM", "TEAM"].includes(role.value)
      );
    }
    return allRoles;
  }, [userRole]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (roleFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (period !== "All") count++;
    return count;
  }, [searchTerm, roleFilter, statusFilter, period]);

  // ── Fetch users ──────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: "1", limit: "100" });
      if (searchTerm) params.append("search", searchTerm);

      const data = await safeFetchAPI(`/user/getAllUsers?${params.toString()}`);

      if (data.type === "PERMISSION_DENIED") {
        toast.warn(data.error || "You don't have permission to view users", {
          title: "Access Denied",
        });
        setUsers([]);
        setFilteredUsers([]);
        return;
      }

      if (data.success) {
        let fetchedUsers = data.result?.users || [];

        if (userRole === "Head_office") {
          fetchedUsers = fetchedUsers.filter((u) => u.role !== "Head_office");
        } else if (userRole === "ZSM") {
          fetchedUsers = fetchedUsers.filter((u) =>
            ["ASM", "TEAM"].includes(u.role)
          );
        } else if (userRole === "ASM") {
          fetchedUsers = fetchedUsers.filter((u) => u.role === "TEAM");
        }

        setUsers(fetchedUsers);
        const total = fetchedUsers.length;
        const active = fetchedUsers.filter((u) => u.status === "active").length;
        const inactive = fetchedUsers.filter((u) => u.status === "inactive").length;
        setStats({ total, active, inactive });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(error.message || "Failed to fetch users", {
        title: "Fetch Error",
      });
    } finally {
      setLoading(false);
    }
  }, [safeFetchAPI, searchTerm, userRole]);

  // ── Fetch managers ───────────────────────────────────────────────────────────
  const fetchManagers = useCallback(async () => {
    try {
      let allManagers = [];

      if (userRole === "ASM") {
        const params = new URLSearchParams({
          page: "1",
          limit: "100",
          _id: currentUser?._id,
        });
        const data = await safeFetchAPI(`/user/getAllUsers?${params.toString()}`);
        if (data.success) allManagers = data.result?.users || [];
      } else {
        const zsmParams = new URLSearchParams({ page: "1", limit: "100", role: "ZSM" });
        const zsmData = await safeFetchAPI(`/user/getAllUsers?${zsmParams.toString()}`);
        if (zsmData.success) allManagers = [...(zsmData.result?.users || [])];

        if (userRole === "Head_office") {
          const asmParams = new URLSearchParams({ page: "1", limit: "100", role: "ASM" });
          const asmData = await safeFetchAPI(`/user/getAllUsers?${asmParams.toString()}`);
          if (asmData.success)
            allManagers = [...allManagers, ...(asmData.result?.users || [])];
        }
      }

      const uniqueManagers = allManagers
        .filter(
          (manager) =>
            manager.status === "active" && manager._id !== currentUser?._id
        )
        .filter(
          (manager, index, self) =>
            index === self.findIndex((m) => m._id === manager._id)
        );

      setManagers(uniqueManagers);
    } catch (error) {
      console.error("Error fetching managers:", error);
      toast.error("Failed to load managers. Please try again.", {
        title: "Load Error",
      });
    }
  }, [safeFetchAPI, userRole, currentUser?._id]);

  // Initial fetch
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Fetch managers when assign dialog opens
  useEffect(() => {
    if (assignDialogOpen) fetchManagers();
  }, [assignDialogOpen, fetchManagers]);

  // ── Filter and sort ──────────────────────────────────────────────────────────
  useEffect(() => {
    let filtered = [...users];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.phoneNumber?.includes(searchTerm)
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === "firstName") {
          aVal = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
          bVal = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
        } else if (sortConfig.key === "role") {
          aVal = ROLE_CONFIG[a.role]?.level || 0;
          bVal = ROLE_CONFIG[b.role]?.level || 0;
        } else if (sortConfig.key === "status") {
          aVal = a.status || "";
          bVal = b.status || "";
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredUsers(filtered);
    setPage(0);
  }, [users, searchTerm, roleFilter, statusFilter, sortConfig]);

  // ── Permission helpers ───────────────────────────────────────────────────────
  const canEditUser = (user) => {
    if (!user || !currentUser) return false;
    if (user._id === currentUser._id) return true;
    if (currentUser.role === "Head_office") return true;
    const userRoleLevel = ROLE_CONFIG[user.role]?.level || 999;
    const currentRoleLevel = ROLE_CONFIG[currentUser.role]?.level || 0;
    if (currentUser.role === "ZSM") return userRoleLevel > currentRoleLevel;
    if (currentUser.role === "ASM") return user.role === "TEAM";
    return false;
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleEditUser = (user) => {
    if (!canEditUser(user)) {
      toast.error("You don't have permission to edit this user.", {
        title: "Permission Denied",
      });
      return;
    }
    setUserToEdit(user);
    setEditModalOpen(true);
  };

  const handleSaveEditedUser = (updatedUser) => {
    setUsers((prev) =>
      prev.map((user) => (user._id === updatedUser._id ? updatedUser : user))
    );
    toast.success("User updated successfully.", { title: "User Updated" });
  };

  const handleViewPassword = (user) => {
    if (!canViewPassword) {
      toast.error("Only Head Office can view passwords.", {
        title: "Permission Denied",
      });
      return;
    }
    setUserToViewPassword(user);
    setPasswordDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || !canDeleteUsers) {
      toast.error("Only Head Office can delete users.", {
        title: "Permission Denied",
      });
      return;
    }

    if (userToDelete.role === "Head_office") {
      toast.error("Head Office users cannot be deleted.", {
        title: "Action Not Allowed",
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      return;
    }

    try {
      const response = await safeFetchAPI(`/user/delete/${userToDelete._id}`, {
        method: "DELETE",
      });

      if (response.type === "PERMISSION_DENIED") {
        toast.error(
          response.error || "You don't have permission to delete this user.",
          { title: "Permission Denied" }
        );
        return;
      }

      toast.success(
        `${userToDelete.firstName} ${userToDelete.lastName} has been deleted.`,
        { title: "User Deleted" }
      );
      setUsers((prev) => prev.filter((user) => user._id !== userToDelete._id));
    } catch (error) {
      toast.error(error.message || "Failed to delete user. Please try again.", {
        title: "Delete Failed",
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleAssignManager = async () => {
    if (!userToAssign || !selectedManager) {
      toast.error("Please select a manager before assigning.", {
        title: "No Manager Selected",
      });
      return;
    }

    if (userRole === "ASM" && selectedManager !== currentUser?._id) {
      toast.error("As an ASM, you can only assign team members to yourself.", {
        title: "Assignment Restricted",
      });
      return;
    }

    setAssignLoading(true);
    try {
      const response = await safeFetchAPI("/user/asignUserToManager", {
        method: "POST",
        body: JSON.stringify({
          userId: userToAssign._id,
          managerId: selectedManager,
        }),
      });

      if (response.type === "PERMISSION_DENIED") {
        toast.error(
          response.error || "You don't have permission to assign this user.",
          { title: "Permission Denied" }
        );
        return;
      }

      if (response.success) {
        toast.success(
          `${userToAssign.firstName} has been assigned to a manager.`,
          { title: "Assigned Successfully" }
        );
        setUsers((prev) =>
          prev.map((user) =>
            user._id === userToAssign._id
              ? { ...user, supervisor: selectedManager }
              : user
          )
        );
      } else {
        toast.error(response.message || "Failed to assign manager.", {
          title: "Assignment Failed",
        });
      }
    } catch (error) {
      console.error("Error assigning manager:", error);
      toast.error(error.message || "Failed to assign manager. Please try again.", {
        title: "Assignment Failed",
      });
    } finally {
      setAssignLoading(false);
      setAssignDialogOpen(false);
      setUserToAssign(null);
      setSelectedManager("");
    }
  };

  const handleToggleStatus = async (user) => {
    if (!user?._id) return;

    if (!canEditUser(user)) {
      toast.error("You don't have permission to change this user's status.", {
        title: "Permission Denied",
      });
      return;
    }

    setStatusLoading((prev) => ({ ...prev, [user._id]: true }));

    try {
      const newStatus = user.status === "active" ? "inactive" : "active";
      const response = await safeFetchAPI(`/user/update/${user._id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.type === "PERMISSION_DENIED") {
        toast.error(
          response.error || "You can only update users in your zone.",
          { title: "Permission Denied" }
        );
        return;
      }

      if (response.success) {
        toast.success(
          `${user.firstName} ${user.lastName} has been ${
            newStatus === "active" ? "activated" : "deactivated"
          }.`,
          { title: `User ${newStatus === "active" ? "Activated" : "Deactivated"}` }
        );
        setUsers((prev) =>
          prev.map((u) =>
            u._id === user._id ? { ...u, status: newStatus } : u
          )
        );
      } else {
        toast.error(response.message || "Failed to update user status.", {
          title: "Update Failed",
        });
      }
    } catch (error) {
      toast.error(error.message || "Failed to update user status. Please try again.", {
        title: "Update Failed",
      });
    } finally {
      setStatusLoading((prev) => ({ ...prev, [user._id]: false }));
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
    setPeriod("All");
    setSortConfig({ key: null, direction: "asc" });
  };

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

  if (loading && users.length === 0) return <LoadingSkeleton />;

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
        period={period}
        setPeriod={setPeriod}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        handleClearFilters={handleClearFilters}
        searchQuery={searchTerm}
        setSearchQuery={setSearchTerm}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeFilterCount={activeFilterCount}
        roleOptions={roleOptions}
      />

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
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} gutterBottom>
              User Management
            </Typography>
            <Typography
              variant="body2"
              sx={{ opacity: 0.9, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
            >
              {userRole === "ASM"
                ? "Manage your team members"
                : userRole === "ZSM"
                ? "Manage ASM and TEAM members in your zone"
                : "Manage users in your head office only"}
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
                      "& .MuiBadge-badge": { fontSize: "0.6rem", minWidth: 16, height: 16 },
                    }}
                  />
                )}
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchUsers}
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
            {canAddUser && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate("/add-user")}
                size={isMobile ? "small" : "medium"}
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                }}
              >
                Add User
              </Button>
            )}
          </Box>
        </Stack>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={isMobile ? 1.5 : 2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6} md={4}>
          <StatCard
            title="Total Users"
            value={stats.total}
            icon={<People />}
            color={PRIMARY_COLOR}
            subtext={`${userRole} View`}
            index={0}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={4}>
          <StatCard
            title="Active Users"
            value={stats.active}
            icon={<CheckCircle />}
            color="#4caf50"
            subtext={`${((stats.active / stats.total) * 100 || 0).toFixed(1)}% of total`}
            index={1}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={4}>
          <StatCard
            title="Inactive Users"
            value={stats.inactive}
            icon={<Block />}
            color="#f44336"
            subtext={`${((stats.inactive / stats.total) * 100 || 0).toFixed(1)}% of total`}
            index={2}
          />
        </Grid>
      </Grid>

      {/* Desktop Search and Filters */}
      {!isMobile && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Stack spacing={2.5}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search users by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchTerm("")}>
                          <Close />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Role Filter</InputLabel>
                  <Select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    label="Role Filter"
                    sx={{ borderRadius: 2 }}
                  >
                    {roleOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {option.icon}
                          <span>{option.label}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Status Filter"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CheckCircle sx={{ color: "#4caf50" }} />
                        <span>Active</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="inactive">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Block sx={{ color: "#f44336" }} />
                        <span>Inactive</span>
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

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
                  {searchTerm && (
                    <Chip
                      label={`Search: ${searchTerm}`}
                      size="small"
                      onDelete={() => setSearchTerm("")}
                      sx={{ bgcolor: alpha(PRIMARY_COLOR, 0.1), color: PRIMARY_COLOR }}
                    />
                  )}
                  {roleFilter !== "all" && (
                    <Chip
                      label={`Role: ${roleOptions.find((opt) => opt.value === roleFilter)?.label || roleFilter}`}
                      size="small"
                      onDelete={() => setRoleFilter("all")}
                      sx={{ bgcolor: alpha(PRIMARY_COLOR, 0.1), color: PRIMARY_COLOR }}
                    />
                  )}
                  {statusFilter !== "all" && (
                    <Chip
                      label={`Status: ${statusFilter === "active" ? "Active" : "Inactive"}`}
                      size="small"
                      onDelete={() => setStatusFilter("all")}
                      sx={{ bgcolor: alpha(PRIMARY_COLOR, 0.1), color: PRIMARY_COLOR }}
                    />
                  )}
                  <Chip
                    label="Clear All"
                    size="small"
                    variant="outlined"
                    onClick={handleClearFilters}
                    deleteIcon={<Close />}
                    onDelete={handleClearFilters}
                    sx={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
                  />
                </Stack>
              </Box>
            )}
          </Stack>
        </Paper>
      )}

      {/* Mobile Search Bar */}
      {isMobile && (
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <Close />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "#fff" } }}
          />
        </Box>
      )}

      {/* Content */}
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
            Users
            <Chip
              label={`${filteredUsers.length} total`}
              size="small"
              sx={{ ml: 1, bgcolor: alpha(PRIMARY_COLOR, 0.1), color: PRIMARY_COLOR }}
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
                {[5, 10, 25, 50].map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          )}
        </Box>

        {!isMobile ? (
          // Desktop Table View
          filteredUsers.length === 0 ? (
            <Box sx={{ p: 4 }}>
              <EmptyState
                onClearFilters={handleClearFilters}
                hasFilters={activeFilterCount > 0}
                canAddUser={canAddUser}
                onAddUser={() => navigate("/add-user")}
              />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: alpha(PRIMARY_COLOR, 0.05) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Manager</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((user) => {
                        const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.TEAM;
                        const statusConfig = STATUS_CONFIG[user.status] || STATUS_CONFIG.active;
                        const canEdit = canEditUser(user);
                        const canAssign =
                          user.role === "TEAM" &&
                          ["ZSM", "ASM", "Head_office"].includes(userRole) &&
                          !user.supervisor;
                        const canView = canViewPassword;
                        const canDelete = canDeleteUsers && user.role !== "Head_office";

                        return (
                          <TableRow key={user._id} hover>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ bgcolor: roleConfig.color, width: 40, height: 40 }}>
                                  {user.firstName?.[0]}
                                </Avatar>
                                <Box>
                                  <Typography fontWeight={600} variant="subtitle2">
                                    {user.firstName} {user.lastName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    ID: {user._id?.slice(-6)}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2">{user.email}</Typography>
                                {user.phoneNumber && (
                                  <Typography variant="body2" color="text.secondary">
                                    {user.phoneNumber}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={roleConfig.label}
                                size="small"
                                icon={roleConfig.icon}
                                sx={{
                                  bgcolor: roleConfig.bg,
                                  color: roleConfig.color,
                                  fontWeight: 600,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Chip
                                  label={statusConfig.label}
                                  size="small"
                                  icon={statusConfig.icon}
                                  sx={{
                                    bgcolor: statusConfig.bg,
                                    color: statusConfig.color,
                                    fontWeight: 600,
                                  }}
                                />
                                {canEdit && (
                                  <Tooltip
                                    title={
                                      user.status === "active" ? "Deactivate" : "Activate"
                                    }
                                  >
                                    <IconButton
                                      size="small"
                                      onClick={() => handleToggleStatus(user)}
                                      disabled={statusLoading[user._id]}
                                    >
                                      {statusLoading[user._id] ? (
                                        <CircularProgress size={20} />
                                      ) : user.status === "active" ? (
                                        <Lock fontSize="small" sx={{ color: "#f44336" }} />
                                      ) : (
                                        <LockOpen fontSize="small" sx={{ color: "#4caf50" }} />
                                      )}
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell>
                              {user.supervisor ? (
                                <Chip
                                  label="Assigned"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              ) : canAssign ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<PersonAdd />}
                                  onClick={() => {
                                    setUserToAssign(user);
                                    setAssignDialogOpen(true);
                                  }}
                                  sx={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
                                >
                                  Assign
                                </Button>
                              ) : (
                                <Typography variant="caption" color="text.disabled">
                                  N/A
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={1} justifyContent="center">
                                {canView && (
                                  <Tooltip title="View Password">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleViewPassword(user)}
                                      sx={{ bgcolor: alpha("#ff9800", 0.1), color: "#ff9800" }}
                                    >
                                      <Visibility fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {canEdit && (
                                  <Tooltip title="Edit User">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditUser(user)}
                                      sx={{
                                        bgcolor: alpha(PRIMARY_COLOR, 0.1),
                                        color: PRIMARY_COLOR,
                                      }}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {canDelete && (
                                  <Tooltip title="Delete User">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setUserToDelete(user);
                                        setDeleteDialogOpen(true);
                                      }}
                                      sx={{ bgcolor: alpha("#f44336", 0.1), color: "#f44336" }}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredUsers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )
        ) : (
          // Mobile Card View
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : filteredUsers.length === 0 ? (
              <EmptyState
                onClearFilters={handleClearFilters}
                hasFilters={activeFilterCount > 0}
                canAddUser={canAddUser}
                onAddUser={() => navigate("/add-user")}
              />
            ) : (
              <>
                {filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <MobileUserCard
                      key={user._id}
                      user={user}
                      onEdit={handleEditUser}
                      onToggleStatus={handleToggleStatus}
                      onAssign={(user) => {
                        setUserToAssign(user);
                        setAssignDialogOpen(true);
                      }}
                      onViewPassword={handleViewPassword}
                      onDelete={(user) => {
                        setUserToDelete(user);
                        setDeleteDialogOpen(true);
                      }}
                      currentUserRole={userRole}
                      currentUserId={currentUser?._id}
                      statusLoading={statusLoading}
                    />
                  ))}
                <Box display="flex" justifyContent="center" mt={2}>
                  <TablePagination
                    component="div"
                    count={filteredUsers.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                  />
                </Box>
              </>
            )}
          </Box>
        )}
      </Paper>

      {/* Edit User Modal */}
      <EditUserModal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setUserToEdit(null); }}
        user={userToEdit}
        onSave={handleSaveEditedUser}
        currentUserRole={userRole}
        currentUser={currentUser}
      />

      {/* Password View Dialog */}
      <PasswordViewDialog
        open={passwordDialogOpen}
        onClose={() => { setPasswordDialogOpen(false); setUserToViewPassword(null); }}
        user={userToViewPassword}
        fetchAPI={safeFetchAPI}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteUserDialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setUserToDelete(null); }}
        user={userToDelete}
        onConfirm={handleDeleteUser}
      />

      {/* Assign Manager Dialog */}
      <AssignManagerDialog
        open={assignDialogOpen}
        onClose={() => {
          setAssignDialogOpen(false);
          setUserToAssign(null);
          setSelectedManager("");
        }}
        userToAssign={userToAssign}
        managers={managers}
        selectedManager={selectedManager}
        setSelectedManager={setSelectedManager}
        onAssign={handleAssignManager}
        assignLoading={assignLoading}
        userRole={userRole}
        currentUser={currentUser}
      />

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
                "& .MuiBadge-badge": { fontSize: "0.6rem", minWidth: 16, height: 16 },
              }}
            >
              <FilterAlt />
            </Badge>
          </Fab>
        </Zoom>
      )}
    </Box>
  );
};

export default UserManagement;
