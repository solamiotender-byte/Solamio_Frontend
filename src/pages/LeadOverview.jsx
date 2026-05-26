// pages/LeadOverview.jsx (Updated Modals Design)

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Snackbar,
  useMediaQuery,
  Tabs,
  Tab,
  useTheme,
  Grid,
  Checkbox,
  Divider,
  Stack,
  FormHelperText,
  Card,
  CardContent,
  Skeleton,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  SwipeableDrawer,
  Collapse,
  Fab,
  Zoom,
  Fade,
  Slide,
  BottomNavigation,
  BottomNavigationAction,
  alpha,
  LinearProgress,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Person,
  Search,
  Visibility,
  Refresh,
  Clear,
  Close,
  Assignment,
  AssignmentInd,
  SupervisorAccount,
  Groups,
  Description,
  Save,
  DeleteForever,
  ArrowDropDown,
  ArrowDropUp,
  Email,
  Phone,
  CalendarToday,
  AccessTime,
  Business,
  AccountCircle,
  Security,
  AdminPanelSettings,
  WorkspacePremium,
  HowToReg,
  CheckCircle,
  Cancel,
  Pending,
  TableChart,
  GridView,
  ViewList,
  DateRange,
  Timeline,
  Send,
  SortByAlpha,
  Sort,
  ExpandMore,
  Home,
  LocationOn,
  FolderOpen,
  AccountBalance,
  ReceiptLong,
  Build,
  OpenInNew,
  CreditCard,
  PictureAsPdf,
  Money,
  Event,
  AttachFile,
  Note,
  LocalAtm,
  FilterAlt,
  Dashboard,
  Schedule,
  TrendingUp,
  Warning,
  Info,
  ExpandLess,
  ErrorOutline,
  PersonRemove,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { format, parseISO, isValid } from "date-fns";
import { useNavigate } from "react-router-dom";

// ========== CONSTANTS & UTILITIES ==========
const PRIMARY_COLOR = "#4569ea";
const SECONDARY_COLOR = "#1a237e";

const LEAD_STATUS_OPTIONS = [
  "Visit",
  "Registration",
  "Bank Loan Apply",
  "Document Submission",
  "Bank at Pending",
  "Disbursement",
  "Installation Completion",
  "Missed Leads",
  "New",
];

const PERIOD_OPTIONS = [
  { value: "Today", label: "Today", icon: <CalendarToday /> },
  { value: "This Week", label: "This Week", icon: <DateRange /> },
  { value: "This Month", label: "This Month", icon: <DateRange /> },
  { value: "All", label: "All Time", icon: <DateRange /> },
];

const ROLE_PERMISSIONS = {
  Head_office: {
    view: true, edit: true, assign: true, delete: true, bulkActions: true,
    export: true, settings: true, color: PRIMARY_COLOR,
    icon: <AdminPanelSettings />, label: "Head Office", level: 1, canAssignTo: ["ASM", "TEAM"],
  },
  ZSM: {
    view: true, edit: true, assign: true, delete: false, bulkActions: true,
    export: true, settings: false, color: PRIMARY_COLOR,
    icon: <WorkspacePremium />, label: "Zone Sales Manager", level: 2, canAssignTo: ["ASM", "TEAM"],
  },
  ASM: {
    view: true, edit: true, assign: true, delete: false, bulkActions: true,
    export: false, settings: false, color: PRIMARY_COLOR,
    icon: <SupervisorAccount />, label: "Area Sales Manager", level: 3, canAssignTo: ["TEAM"],
  },
  TEAM: {
    view: true, edit: true, assign: false, delete: false, bulkActions: false,
    export: false, settings: false, color: PRIMARY_COLOR,
    icon: <Groups />, label: "Team Member", level: 4, canAssignTo: [],
  },
};

const getStatusColor = (status) => {
  const colorMap = {
    Visit: { bg: alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR, icon: <Person /> },
    Registration: { bg: alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR, icon: <HowToReg /> },
    "Bank Loan Apply": { bg: alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR, icon: <Business /> },
    "Document Submission": { bg: alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR, icon: <Description /> },
    "Bank at Pending": { bg: alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR, icon: <Pending /> },
    Disbursement: { bg: alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR, icon: <Assignment /> },
    "Installation Completion": { bg: alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR, icon: <CheckCircle /> },
    "Missed Leads": { bg: alpha("#f44336", 0.08), color: "#f44336", icon: <Cancel /> },
    New: { bg: alpha("#4caf50", 0.08), color: "#4caf50", icon: <Add /> },
  };
  return colorMap[status] || { bg: alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR, icon: <Pending /> };
};

const getRoleColor = (role) => {
  const config = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.TEAM;
  return { bg: `${config.color}15`, color: config.color, icon: config.icon };
};

const formatDate = (dateString, formatStr = "MMM dd, yyyy hh:mm a") => {
  if (!dateString) return "Not set";
  try {
    const parsedDate = parseISO(dateString);
    return isValid(parsedDate) ? format(parsedDate, formatStr) : "Invalid date";
  } catch { return "Invalid date"; }
};

const getAssignedPerson = (lead) => {
  const person = lead?.assignedUser || lead?.assignedManager;
  if (!person) return null;

  if (typeof person === "string") {
    return {
      name: "Assigned",
      role: lead?.assignedUser ? "User" : "Manager",
      initial: "A",
    };
  }

  const name =
    `${person.firstName || ""} ${person.lastName || ""}`.trim() ||
    person.email ||
    person.phone ||
    "Assigned";

  return {
    name,
    role: person.role || (lead?.assignedUser ? "User" : "Manager"),
    initial: name.charAt(0),
  };
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^[0-9]{10}$/.test(phone.replace(/\D/g, ""));

const handleDownload = (url, filename) => {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.download = filename || "document";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// ========== SHARED MODAL HEADER ==========
const ModalHeader = ({ icon, title, subtitle, color = PRIMARY_COLOR, onClose }) => (
  <Box
    sx={{
      position: "relative",
      background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
      px: { xs: 2.5, sm: 3.5 },
      pt: { xs: 2.5, sm: 3 },
      pb: { xs: 3, sm: 3.5 },
      overflow: "hidden",
      "&::before": {
        content: '""', position: "absolute", top: -40, right: -40,
        width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.08)",
      },
      "&::after": {
        content: '""', position: "absolute", bottom: -20, left: "30%",
        width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)",
      },
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{
          width: { xs: 44, sm: 52 }, height: { xs: 44, sm: 52 }, borderRadius: 2.5,
          bgcolor: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.25)", flexShrink: 0,
        }}>
          {React.cloneElement(icon, { sx: { color: "#fff", fontSize: { xs: 22, sm: 26 } } })}
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700} color="#fff"
            sx={{ fontSize: { xs: "1rem", sm: "1.15rem" }, lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.78)", fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      <IconButton onClick={onClose} size="small" sx={{
        color: "rgba(255,255,255,0.85)", bgcolor: "rgba(255,255,255,0.12)",
        "&:hover": { bgcolor: "rgba(255,255,255,0.22)" }, width: 32, height: 32,
      }}>
        <Close fontSize="small" />
      </IconButton>
    </Box>
  </Box>
);

// ========== REUSABLE COMPONENTS ==========
const MobileFilterDrawer = ({
  open, onClose, period, setPeriod, statusFilter, setStatusFilter,
  handleClearFilters, searchQuery, setSearchQuery, activeFilterCount,
}) => {
  const [expandedSection, setExpandedSection] = useState("search");
  const toggleSection = (section) => setExpandedSection(expandedSection === section ? null : section);

  return (
    <SwipeableDrawer anchor="bottom" open={open} onClose={onClose} onOpen={() => {}}
      disableSwipeToOpen={false}
      PaperProps={{ sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90vh", overflow: "hidden" } }}>
      <Box sx={{ position: "relative" }}>
        <Box sx={{ width: 40, height: 4, bgcolor: "grey.300", borderRadius: 2, mx: "auto", my: 1.5 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, pb: 2, borderBottom: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}` }}>
          <Box>
            <Typography variant="h6" fontWeight="700" color={PRIMARY_COLOR}>Filter Leads</Typography>
            <Typography variant="caption" color="text.secondary">{activeFilterCount} active filter{activeFilterCount !== 1 && "s"}</Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ bgcolor: alpha(PRIMARY_COLOR, 0.1) }}><Close /></IconButton>
        </Box>
        <Box sx={{ maxHeight: "calc(90vh - 120px)", overflow: "auto", p: 3 }}>
          <Stack spacing={2.5}>
            {[
              { key: "search", label: "Search", icon: <Search sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />, content: (
                <TextField fullWidth size="small" placeholder="Search by name, email, phone..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: "text.secondary", fontSize: 20 }} /></InputAdornment>,
                    endAdornment: searchQuery && <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchQuery("")}><Close fontSize="small" /></IconButton></InputAdornment> }} />
              )},
              { key: "period", label: "Time Period", icon: <DateRange sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />, content: (
                <Grid container spacing={1}>
                  {PERIOD_OPTIONS.map((option) => (
                    <Grid item xs={6} key={option.value}>
                      <Button fullWidth variant={period === option.value ? "contained" : "outlined"} onClick={() => setPeriod(option.value)} startIcon={option.icon} size="small"
                        sx={{ bgcolor: period === option.value ? PRIMARY_COLOR : "transparent", color: period === option.value ? "#fff" : PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}>
                        {option.label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              )},
              { key: "status", label: "Lead Status", icon: <FilterAlt sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />, content: (
                <FormControl fullWidth size="small">
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} displayEmpty>
                    <MenuItem value="all">All Statuses</MenuItem>
                    {LEAD_STATUS_OPTIONS.map((status) => (
                      <MenuItem key={status} value={status}>
                        <Stack direction="row" alignItems="center" spacing={1}>{getStatusColor(status).icon}<span>{status}</span></Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )},
            ].map(({ key, label, icon, content }) => (
              <Paper key={key} elevation={0} sx={{ border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, borderRadius: 2, overflow: "hidden" }}>
                <Box sx={{ p: 2, bgcolor: alpha(PRIMARY_COLOR, 0.02), display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => toggleSection(key)}>
                  <Stack direction="row" spacing={1} alignItems="center">{icon}<Typography variant="subtitle2" fontWeight={600}>{label}</Typography></Stack>
                  {expandedSection === key ? <ExpandLess /> : <ExpandMore />}
                </Box>
                <Collapse in={expandedSection === key}><Box sx={{ p: 2 }}>{content}</Box></Collapse>
              </Paper>
            ))}
          </Stack>
        </Box>
        <Box sx={{ p: 3, borderTop: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, bgcolor: "#fff" }}>
          <Stack direction="row" spacing={2}>
            <Button fullWidth variant="outlined" onClick={() => { handleClearFilters(); onClose(); }} startIcon={<Clear />}
              sx={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}>Clear All</Button>
            <Button fullWidth variant="contained" onClick={onClose} sx={{ bgcolor: PRIMARY_COLOR, "&:hover": { bgcolor: SECONDARY_COLOR } }}>Apply Filters</Button>
          </Stack>
        </Box>
      </Box>
    </SwipeableDrawer>
  );
};

const LoadingSkeleton = ({ count = 5, isMobile = false }) => (
  <Box>{Array.from({ length: count }).map((_, index) => (
    <Skeleton key={index} variant="rectangular" height={isMobile ? 80 : 70} sx={{ mb: 2, borderRadius: 2 }} />
  ))}</Box>
);

const EmptyState = ({ title, description, icon: Icon = Person, action }) => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8} px={2}>
    <Box sx={{ width: 120, height: 120, borderRadius: "50%", bgcolor: alpha(PRIMARY_COLOR, 0.1), display: "flex", alignItems: "center", justifyContent: "center", mb: 3 }}>
      <Icon sx={{ fontSize: 60, color: PRIMARY_COLOR }} />
    </Box>
    <Typography variant="h6" color="text.secondary" gutterBottom align="center">{title}</Typography>
    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3, maxWidth: 400 }}>{description}</Typography>
    {action}
  </Box>
);

const RoleBadge = ({ role }) => {
  const config = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.TEAM;
  return (
    <Chip icon={config.icon} label={config.label} size="small"
      sx={{ bgcolor: alpha(config.color, 0.1), color: config.color, fontWeight: 600, "& .MuiChip-icon": { color: config.color } }} />
  );
};

const PermissionIndicator = ({ permission, label }) => (
  <Box display="flex" alignItems="center" gap={1}>
    {permission ? <CheckCircle sx={{ color: "#4caf50", fontSize: 16 }} /> : <Cancel sx={{ color: "#f44336", fontSize: 16 }} />}
    <Typography variant="caption" color="text.secondary">{label}</Typography>
  </Box>
);

const InfoRow = ({ label, value, icon, subValue, action, chip, chipColor }) => (
  <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
    <Box display="flex" alignItems="center" gap={2} flex={1}>
      <Box sx={{ color: "primary.main", minWidth: 24 }}>{icon}</Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        {chip ? (
          <Chip label={value} size="small" sx={{ bgcolor: chipColor?.bg, color: chipColor?.color, fontWeight: 600, mt: 0.5 }} />
        ) : (
          <Typography variant="body1" fontWeight={500}>{value}</Typography>
        )}
        {subValue && <Box sx={{ mt: 0.5 }}>{subValue}</Box>}
      </Box>
    </Box>
    {action && <Box>{action}</Box>}
  </Box>
);

const DocumentCard = ({ title, url, icon, filename }) => (
  <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
      {icon}<Typography variant="body2" fontWeight={600} noWrap>{title}</Typography>
    </Box>
    <Button fullWidth size="small" variant="outlined" startIcon={<OpenInNew />} onClick={() => handleDownload(url, filename || title)}>View Document</Button>
  </Card>
);

const MobileLeadCard = ({ lead, onView, onEdit, onAssign, onDelete, permissions }) => {
  const [expanded, setExpanded] = useState(false);
  const statusColor = getStatusColor(lead.status);
  const initials = `${lead.firstName?.[0] || ""}${lead.lastName?.[0] || ""}`;

  const handleDeleteClick = () => {
    if (window.confirm(`Are you sure you want to delete ${lead.firstName} ${lead.lastName}?`)) onDelete(lead._id);
  };

  return (
    <Paper sx={{ mb: 1.5, borderRadius: 3, border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, overflow: "hidden" }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Avatar sx={{ bgcolor: PRIMARY_COLOR, color: "#fff", width: 48, height: 48, fontWeight: 600 }}>{initials}</Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="700" color={PRIMARY_COLOR}>{lead.firstName} {lead.lastName}</Typography>
              <Typography variant="caption" color="text.secondary">ID: {lead._id?.slice(-8) || "N/A"}</Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setExpanded(!expanded)} sx={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.3s", bgcolor: alpha(PRIMARY_COLOR, 0.1) }}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        <Grid container spacing={1} sx={{ mb: 1.5 }}>
          <Grid item xs={6}><Stack direction="row" spacing={0.5} alignItems="center"><Phone sx={{ fontSize: 14, color: alpha(PRIMARY_COLOR, 0.6) }} /><Typography variant="caption" noWrap>{lead.phone || "No phone"}</Typography></Stack></Grid>
          <Grid item xs={6}><Stack direction="row" spacing={0.5} alignItems="center"><Email sx={{ fontSize: 14, color: alpha(PRIMARY_COLOR, 0.6) }} /><Typography variant="caption" noWrap>{lead.email || "No email"}</Typography></Stack></Grid>
        </Grid>
        <Box sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <CalendarToday sx={{ fontSize: 14, color: alpha(PRIMARY_COLOR, 0.6) }} />
            <Typography variant="body2" fontWeight={500}>{formatDate(lead.createdAt, "dd MMM yyyy")}</Typography>
          </Stack>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip label={lead.status} icon={statusColor.icon} size="small" sx={{ bgcolor: statusColor.bg, color: statusColor.color, fontWeight: 600, height: 24, fontSize: "0.7rem", "& .MuiChip-icon": { fontSize: 14 } }} />
        </Box>
        <Collapse in={expanded}>
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}` }}>
            {(() => {
              const assignedPerson = getAssignedPerson(lead);
              return assignedPerson ? (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">Assigned To</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{assignedPerson.initial}</Avatar>
                    <Typography variant="body2">{assignedPerson.name}</Typography>
                    <Typography variant="caption" color="text.secondary">({assignedPerson.role})</Typography>
                  </Box>
                </Box>
              ) : null;
            })()}
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
              <Button fullWidth size="small" variant="contained" startIcon={<Visibility sx={{ ml: 1 }} />} onClick={() => onView(lead)} sx={{ bgcolor: PRIMARY_COLOR, "&:hover": { bgcolor: SECONDARY_COLOR }, flex: 1 }} />
              {permissions.edit && (<Button fullWidth size="small" variant="outlined" startIcon={<Edit sx={{ ml: 1 }} />} onClick={() => onEdit(lead)} sx={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR, flex: 1 }} />)}
              {permissions.assign && (<Button fullWidth size="small" variant="outlined" startIcon={<AssignmentInd sx={{ ml: 1 }} />} onClick={() => onAssign(lead)} sx={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR, flex: 1 }} />)}
              {permissions.delete && (<Button fullWidth size="small" variant="outlined" color="error" startIcon={<Delete sx={{ ml: 1 }} />} onClick={handleDeleteClick} sx={{ borderColor: "#f44336", color: "#f44336", flex: 1 }} />)}
            </Stack>
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
};

// ========== REDESIGNED MODAL COMPONENTS ==========

// ---- VIEW LEAD MODAL ----
const ViewLeadModal = React.memo(({ open, onClose, lead, userRole }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { fetchAPI } = useAuth();

  const [loading, setLoading] = useState(false);
  const [leadDetails, setLeadDetails] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.TEAM;

  useEffect(() => {
    if (open && lead) { fetchLeadDetails(); }
    else { setLeadDetails(null); setError(null); setActiveTab(0); }
  }, [open, lead]);

  const fetchLeadDetails = async () => {
    if (!lead?._id) { setError("No lead selected"); return; }
    try {
      setLoading(true); setError(null);
      const response = await fetchAPI(`/lead/getLeadById/${lead._id}`);
      if (response.success) setLeadDetails(response.result);
      else throw new Error(response.message || "Failed to fetch lead details");
    } catch (error) {
      setError(error.message || "Failed to load lead details");
    } finally { setLoading(false); }
  };

  const availableTabs = [
    { label: "Basic Info", icon: <Person /> },
    { label: "Visit Info", icon: <CalendarToday /> },
    { label: "Registration", icon: <HowToReg /> },
    { label: "Loan Info", icon: <AccountBalance /> },
    { label: "Documents", icon: <FolderOpen /> },
    { label: "Bank", icon: <LocalAtm /> },
    { label: "Disbursement", icon: <AccountBalance /> },
    { label: "Installation", icon: <Build /> },
    { label: "Timeline", icon: <Timeline /> },
  ].filter((tab, i) => {
    if (userRole === "TEAM" && (i === 3 || i === 5)) return false;
    return true;
  });

  const tabKeys = ["basic", "visit", "registration", "loan", "documents", "bank", "disbursement", "installation", "timeline"]
    .filter((_, i) => !(userRole === "TEAM" && (i === 3 || i === 5)));

  const activeTabKey = tabKeys[activeTab] || "basic";

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: "hidden" } }}>
        <ModalHeader icon={<Visibility />} title="Lead Details" subtitle="Loading..." color={PRIMARY_COLOR} onClose={onClose} />
        <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress sx={{ color: PRIMARY_COLOR }} />
            <Typography variant="body2" color="text.secondary">Loading lead details...</Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: "hidden" } }}>
        <ModalHeader icon={<ErrorOutline />} title="Error" subtitle="Could not load lead" color="#c62828" onClose={onClose} />
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
          <Button onClick={fetchLeadDetails} variant="outlined" fullWidth sx={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}>Retry</Button>
        </DialogContent>
      </Dialog>
    );
  }

  if (!leadDetails) return null;

  const statusColor = getStatusColor(leadDetails.status);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, maxHeight: "92vh", overflow: "hidden", boxShadow: `0 24px 64px ${alpha(PRIMARY_COLOR, 0.18)}` } }}
      TransitionComponent={isMobile ? Slide : Fade} transitionDuration={300}>

      <ModalHeader
        icon={<Visibility />}
        title={`${leadDetails.firstName} ${leadDetails.lastName}`}
        subtitle={`${leadDetails.email || "No email"} · ID: ${leadDetails._id?.slice(-8)}`}
        color={PRIMARY_COLOR}
        onClose={onClose}
      />

      {/* Status strip */}
      <Box sx={{ px: 3, py: 1.5, bgcolor: "#fafbff", borderBottom: `1px solid ${alpha(PRIMARY_COLOR, 0.08)}`, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Chip label={leadDetails.status} icon={statusColor.icon} size="small"
          sx={{ bgcolor: statusColor.bg, color: statusColor.color, fontWeight: 700, fontSize: "0.75rem" }} />
        {leadDetails.assignedUser && (
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography variant="caption" color="text.secondary">Assigned to</Typography>
            <Avatar sx={{ width: 20, height: 20, fontSize: 10, bgcolor: PRIMARY_COLOR }}>{leadDetails.assignedUser.firstName?.[0]}</Avatar>
            <Typography variant="caption" fontWeight={600}>{leadDetails.assignedUser.firstName} {leadDetails.assignedUser.lastName}</Typography>
          </Stack>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
          Created {formatDate(leadDetails.createdAt, "dd MMM yyyy")}
        </Typography>
      </Box>

      <Box sx={{ borderBottom: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, bgcolor: "#fff" }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ "& .MuiTab-root": { minHeight: { xs: 44, sm: 52 }, fontSize: { xs: "0.72rem", sm: "0.8rem" }, fontWeight: 600, textTransform: "none" },
            "& .MuiTabs-indicator": { bgcolor: PRIMARY_COLOR, height: 3, borderRadius: "3px 3px 0 0" },
            "& .Mui-selected": { color: `${PRIMARY_COLOR} !important` } }}>
          {availableTabs.map((tab, i) => (
            <Tab key={i} icon={React.cloneElement(tab.icon, { sx: { fontSize: { xs: 16, sm: 18 } } })} label={tab.label} iconPosition="start" />
          ))}
        </Tabs>
      </Box>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#fafbff", maxHeight: { xs: "calc(100vh - 260px)", sm: "55vh" }, overflow: "auto" }}>
        {/* Basic */}
        {activeTabKey === "basic" && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, bgcolor: "#fff" }}>
                <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><Person fontSize="small" /> Personal Information</Typography>
                <Stack spacing={2}>
                  <InfoRow label="Full Name" value={`${leadDetails.firstName} ${leadDetails.lastName}`} icon={<AccountCircle sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                  <InfoRow label="Email" value={leadDetails.email || "Not set"} icon={<Email sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                  <InfoRow label="Phone" value={leadDetails.phone || "Not set"} icon={<Phone sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                  <InfoRow label="Address" value={leadDetails.address || "Not set"} icon={<Home sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                  <InfoRow label="Pincode" value={leadDetails.pincode || "Not set"} icon={<LocationOn sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                  <InfoRow label="Solar Requirement" value={leadDetails.solarRequirement || "Not set"} icon={<Build sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, bgcolor: "#fff" }}>
                <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><Timeline fontSize="small" /> Assignment & Status</Typography>
                <Stack spacing={2}>
                  <InfoRow label="Status" value={leadDetails.status} icon={statusColor.icon} chip chipColor={statusColor} />
                  <InfoRow label="Installation Status" value={leadDetails.installationStatus || "Not set"} icon={<Build sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                  {leadDetails.assignedManager && <InfoRow label="Assigned Manager" value={`${leadDetails.assignedManager.firstName} ${leadDetails.assignedManager.lastName}`} icon={<SupervisorAccount sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} subValue={<RoleBadge role={leadDetails.assignedManager.role} />} />}
                  {leadDetails.assignedUser && <InfoRow label="Assigned To" value={`${leadDetails.assignedUser.firstName} ${leadDetails.assignedUser.lastName}`} icon={<AssignmentInd sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} subValue={<RoleBadge role={leadDetails.assignedUser.role} />} />}
                  {leadDetails.createdBy && <InfoRow label="Created By" value={`${leadDetails.createdBy.firstName} ${leadDetails.createdBy.lastName}`} icon={<HowToReg sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} subValue={<RoleBadge role={leadDetails.createdBy.role} />} />}
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, bgcolor: "#fff" }}>
                <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}><Note fontSize="small" /> Notes</Typography>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(PRIMARY_COLOR, 0.03), border: `1px solid ${alpha(PRIMARY_COLOR, 0.08)}` }}>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: leadDetails.notes ? "text.primary" : "text.disabled" }}>
                    {leadDetails.notes || "No notes available"}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Visit */}
        {activeTabKey === "visit" && (
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, bgcolor: "#fff" }}>
            <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><CalendarToday fontSize="small" /> Visit Information</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}><Stack spacing={2}>
                <InfoRow label="Visit Status" value={leadDetails.visitStatus || "Not Scheduled"} icon={<CheckCircle sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Visit Date" value={formatDate(leadDetails.visitDate)} icon={<Event sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Visit Time" value={leadDetails.visitTime || "Not set"} icon={<AccessTime sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Visit Location" value={leadDetails.visitLocation || "Not set"} icon={<LocationOn sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
              </Stack></Grid>
              <Grid item xs={12} md={6}><InfoRow label="Visit Notes" value={leadDetails.visitNotes || "No notes available"} icon={<Note sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} /></Grid>
            </Grid>
          </Paper>
        )}

        {/* Registration */}
        {activeTabKey === "registration" && (
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, bgcolor: "#fff" }}>
            <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><HowToReg fontSize="small" /> Registration Information</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}><Stack spacing={2}>
                <InfoRow label="Registration Date" value={formatDate(leadDetails.dateOfRegistration)} icon={<Event sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Registration Status" value={leadDetails.registrationStatus || "Pending"} icon={<CheckCircle sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} chip chipColor={{ bg: alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR }} />
                {leadDetails.uploadDocument?.url && <InfoRow label="Registration Document" value="View Document" icon={<AttachFile sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} action={<Button size="small" variant="outlined" startIcon={<OpenInNew />} onClick={() => handleDownload(leadDetails.uploadDocument.url, "registration-document")}>View</Button>} />}
              </Stack></Grid>
              <Grid item xs={12} md={6}><InfoRow label="Registration Notes" value={leadDetails.registrationNotes || "No notes available"} icon={<Note sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} /></Grid>
            </Grid>
          </Paper>
        )}

        {/* Loan */}
        {activeTabKey === "loan" && (
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, bgcolor: "#fff" }}>
            <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><AccountBalance fontSize="small" /> Loan Information</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}><Stack spacing={2}>
                <InfoRow label="Loan Amount" value={leadDetails.loanAmount ? `₹${leadDetails.loanAmount.toLocaleString()}` : "Not set"} icon={<Money sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Bank" value={leadDetails.bank || "Not set"} icon={<AccountBalance sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Branch Name" value={leadDetails.branchName || "Not set"} icon={<AccountBalance sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Loan Status" value={leadDetails.loanStatus || "Not Applied"} icon={<CheckCircle sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} chip chipColor={{ bg: alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR }} />
              </Stack></Grid>
              <Grid item xs={12} md={6}><Stack spacing={2}>
                <InfoRow label="Loan Approval Date" value={formatDate(leadDetails.loanApprovalDate)} icon={<Event sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Loan Notes" value={leadDetails.loanNotes || "No notes available"} icon={<Note sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
              </Stack></Grid>
            </Grid>
          </Paper>
        )}

        {/* Documents */}
        {activeTabKey === "documents" && (
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, bgcolor: "#fff" }}>
            <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><FolderOpen fontSize="small" /> Documents</Typography>
            <Grid container spacing={2}>
              {leadDetails.aadhaar?.url && <Grid item xs={12} sm={6} md={4}><DocumentCard title="Aadhaar Card" url={leadDetails.aadhaar.url} icon={<PictureAsPdf sx={{ color: "#f57c00" }} />} filename="aadhaar-card" /></Grid>}
              {leadDetails.panCard?.url && <Grid item xs={12} sm={6} md={4}><DocumentCard title="PAN Card" url={leadDetails.panCard.url} icon={<CreditCard sx={{ color: PRIMARY_COLOR }} />} filename="pan-card" /></Grid>}
              {leadDetails.passbook?.url && <Grid item xs={12} sm={6} md={4}><DocumentCard title="Bank Passbook" url={leadDetails.passbook.url} icon={<ReceiptLong sx={{ color: "#388e3c" }} />} filename="passbook" /></Grid>}
              {leadDetails.otherDocuments?.map((doc, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}><DocumentCard title={doc.name || `Document ${i + 1}`} url={doc.url} icon={<PictureAsPdf sx={{ color: "#d32f2f" }} />} filename={doc.name} /></Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Stack spacing={2}>
                <InfoRow label="Document Status" value={leadDetails.documentStatus || "Pending"} icon={<CheckCircle sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} chip chipColor={{ bg: alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR }} />
                <InfoRow label="Document Submission Date" value={formatDate(leadDetails.documentSubmissionDate, "dd MMM yyyy, HH:mm:ss")} icon={<Event sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Document Notes" value={leadDetails.documentNotes || "No notes available"} icon={<Note sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
              </Stack>
            </Box>
          </Paper>
        )}

        {/* Bank */}
        {activeTabKey === "bank" && (
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, bgcolor: "#fff" }}>
            <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><Pending fontSize="small" /> Bank at Pending</Typography>
            <Stack spacing={2}>
              <InfoRow label="Status" value={leadDetails.bankAtPendingStatus || "Pending"} icon={<CheckCircle sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} chip chipColor={{ bg: alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR }} />
              <InfoRow label="Date" value={formatDate(leadDetails.bankAtPendingDate)} icon={<Event sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
              <InfoRow label="Reason" value={leadDetails.reason || "No reason provided"} icon={<Note sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
              <InfoRow label="Notes" value={leadDetails.bankAtPendingNotes || "No notes available"} icon={<Note sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
            </Stack>
          </Paper>
        )}

        {/* Disbursement */}
        {activeTabKey === "disbursement" && (
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, bgcolor: "#fff" }}>
            <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><LocalAtm fontSize="small" /> Disbursement Information</Typography>
            <Stack spacing={2}>
              <InfoRow label="Disbursement Amount" value={leadDetails.disbursementAmount ? `₹${leadDetails.disbursementAmount.toLocaleString()}` : "Not set"} icon={<Money sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
              <InfoRow label="Disbursement Date" value={formatDate(leadDetails.disbursementDate)} icon={<Event sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
              <InfoRow label="Disbursement Status" value={leadDetails.disbursementStatus || "Pending"} icon={<CheckCircle sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} chip chipColor={{ bg: alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR }} />
              {leadDetails.disbursementBankDetails && <>
                <InfoRow label="Disbursement Bank" value={leadDetails.disbursementBankDetails.bank || "Not set"} icon={<AccountBalance sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Disbursement Branch" value={leadDetails.disbursementBankDetails.branchName || "Not set"} icon={<AccountBalance sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
              </>}
              <InfoRow label="Disbursement Notes" value={leadDetails.disbursementNotes || "No notes available"} icon={<Note sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
            </Stack>
          </Paper>
        )}

        {/* Installation */}
        {activeTabKey === "installation" && (
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, bgcolor: "#fff" }}>
            <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><Build fontSize="small" /> Installation Information</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}><Stack spacing={2}>
                <InfoRow label="Installation Date" value={formatDate(leadDetails.installationDate)} icon={<Event sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Installation Status" value={leadDetails.installationStatus || "pending"} icon={<CheckCircle sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} chip chipColor={{ bg: alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR }} />
              </Stack></Grid>
              <Grid item xs={12} md={6}><InfoRow label="Installation Notes" value={leadDetails.installationNotes || "No notes available"} icon={<Note sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} /></Grid>
            </Grid>
          </Paper>
        )}

        {/* Timeline */}
        {activeTabKey === "timeline" && (
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, bgcolor: "#fff" }}>
            <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><Timeline fontSize="small" /> Lead Timeline ({leadDetails.stageTimeline?.length || 0} updates)</Typography>
            {leadDetails.stageTimeline?.length > 0 ? (
              <List sx={{ maxHeight: 420, overflow: "auto" }}>
                {[...leadDetails.stageTimeline].reverse().map((timeline, index) => {
                  const sc = getStatusColor(timeline.stage);
                  return (
                    <ListItem key={index} sx={{ px: 0, py: 1.5, borderBottom: `1px solid ${alpha(PRIMARY_COLOR, 0.06)}`, alignItems: "flex-start" }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: sc.bg, color: sc.color, width: 36, height: 36 }}>{React.cloneElement(sc.icon, { sx: { fontSize: 18 } })}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="body2" fontWeight={700}>{timeline.stage}</Typography>
                          <Typography variant="caption" color="text.secondary">{formatDate(timeline.updatedAt, "dd MMM, HH:mm")}</Typography>
                        </Box>}
                        secondary={<>
                          <Typography variant="body2" sx={{ mt: 0.5, color: "text.primary" }}>{timeline.notes}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>Updated by: {timeline.updatedRole} • {timeline.updatedBy?.firstName || "System"}</Typography>
                        </>}
                      />
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>No timeline data available</Typography>
            )}
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2, borderTop: `1px solid ${alpha(PRIMARY_COLOR, 0.08)}`, bgcolor: "#fff", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="caption" color="text.secondary">Viewing as: <Box component="span" sx={{ display: "inline-flex", ml: 0.5 }}><RoleBadge role={userRole} /></Box></Typography>
        <Button onClick={onClose} variant="contained" size={isMobile ? "small" : "medium"}
          sx={{ bgcolor: PRIMARY_COLOR, borderRadius: 2, fontWeight: 700, px: 3, boxShadow: `0 4px 14px ${alpha(PRIMARY_COLOR, 0.35)}`, "&:hover": { bgcolor: SECONDARY_COLOR } }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
});
ViewLeadModal.displayName = "ViewLeadModal";

// ---- EDIT LEAD MODAL ----
const EditLeadModal = React.memo(({ open, onClose, lead, onSave, userRole }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { fetchAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phone: "", status: "Visit" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (lead) { setFormData({ firstName: lead.firstName || "", lastName: lead.lastName || "", email: lead.email || "", phone: lead.phone || "", status: lead.status || "Visit" }); setErrors({}); }
  }, [lead]);

  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.TEAM;
  const canEdit = permissions.edit;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!validateEmail(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    else if (!validatePhone(formData.phone)) newErrors.phone = "Phone must be 10 digits";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await fetchAPI(`/lead/updateLead/${lead._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.success) {
        onSave(response.result);
        onClose();
      } else {
        throw new Error(response.message || "Failed to update lead");
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (field === "phone" && value) {
      const phoneDigits = value.replace(/\D/g, "");
      if (phoneDigits.length > 10) setFormData((prev) => ({ ...prev, phone: phoneDigits.slice(0, 10) }));
    }
  };

  if (!canEdit) {
    return (
      <Dialog open={open} onClose={onClose} fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: "hidden" } }}>
        <ModalHeader icon={<Security />} title="Access Denied" subtitle="Insufficient permissions" color="#c62828" onClose={onClose} />
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            <Typography variant="body1" fontWeight={600}>You do not have permission to edit leads</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Your role ({ROLE_PERMISSIONS[userRole]?.label}) only allows viewing leads.</Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}><Button onClick={onClose} variant="contained" sx={{ bgcolor: PRIMARY_COLOR }}>Close</Button></DialogActions>
      </Dialog>
    );
  }

  const fieldSx = {
    "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#f8fafd", "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: PRIMARY_COLOR }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: PRIMARY_COLOR } },
    "& .MuiInputLabel-root.Mui-focused": { color: PRIMARY_COLOR },
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: "hidden", boxShadow: `0 24px 64px ${alpha(PRIMARY_COLOR, 0.18)}` } }}
      TransitionComponent={isMobile ? Slide : Fade} transitionDuration={300}>

      <ModalHeader icon={<Edit />} title="Edit Lead" subtitle={lead ? `${lead.firstName} ${lead.lastName} · ${lead.status}` : ""} color={PRIMARY_COLOR} onClose={onClose} />
      {loading && <LinearProgress sx={{ height: 3, bgcolor: alpha(PRIMARY_COLOR, 0.1), "& .MuiLinearProgress-bar": { bgcolor: PRIMARY_COLOR } }} />}

      <DialogContent sx={{ py: 3, px: { xs: 2.5, sm: 3.5 }, bgcolor: "#fafbff" }}>
        {errors.submit && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} icon={<ErrorOutline />}>{errors.submit}</Alert>}
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="First Name" value={formData.firstName} onChange={handleChange("firstName")} error={!!errors.firstName} helperText={errors.firstName} required size={isMobile ? "small" : "medium"} sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Last Name" value={formData.lastName} onChange={handleChange("lastName")} error={!!errors.lastName} helperText={errors.lastName} required size={isMobile ? "small" : "medium"} sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" type="email" value={formData.email} onChange={handleChange("email")} error={!!errors.email} helperText={errors.email} required size={isMobile ? "small" : "medium"}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: alpha(PRIMARY_COLOR, 0.5), fontSize: 20 }} /></InputAdornment> }} sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" value={formData.phone} onChange={handleChange("phone")} error={!!errors.phone} helperText={errors.phone || "10 digits"} required size={isMobile ? "small" : "medium"} inputProps={{ maxLength: 10 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: alpha(PRIMARY_COLOR, 0.5), fontSize: 20 }} /></InputAdornment> }} sx={fieldSx} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"} error={!!errors.status} required>
                <InputLabel sx={{ "&.Mui-focused": { color: PRIMARY_COLOR } }}>Status</InputLabel>
                <Select value={formData.status} onChange={handleChange("status")} label="Status"
                  sx={{ borderRadius: 2, bgcolor: "#f8fafd", "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: PRIMARY_COLOR }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: PRIMARY_COLOR } }}>
                  {LEAD_STATUS_OPTIONS.map((status) => {
                    const sc = getStatusColor(status);
                    return (
                      <MenuItem key={status} value={status}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Box sx={{ color: sc.color, display: "flex" }}>{sc.icon}</Box>
                          <Typography variant="body2">{status}</Typography>
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
                {errors.status && <FormHelperText error>{errors.status}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2.5, borderTop: `1px solid ${alpha(PRIMARY_COLOR, 0.08)}`, bgcolor: "#fff", gap: 1.5, flexDirection: { xs: "column-reverse", sm: "row" } }}>
        <Button onClick={onClose} variant="outlined" fullWidth={isMobile} disabled={loading}
          sx={{ borderRadius: 2, borderColor: alpha(PRIMARY_COLOR, 0.35), color: PRIMARY_COLOR, fontWeight: 600, px: 3, "&:hover": { borderColor: PRIMARY_COLOR, bgcolor: alpha(PRIMARY_COLOR, 0.04) } }}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" fullWidth={isMobile} disabled={loading}
          startIcon={loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : <Save />}
          sx={{ bgcolor: PRIMARY_COLOR, borderRadius: 2, fontWeight: 700, px: 3, boxShadow: `0 4px 14px ${alpha(PRIMARY_COLOR, 0.4)}`, "&:hover": { bgcolor: SECONDARY_COLOR } }}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
EditLeadModal.displayName = "EditLeadModal";

// ---- ASSIGN LEAD MODAL ----
const AssignLeadModal = React.memo(({ open, onClose, lead, onAssign, userRole, isBulkAssign = false, bulkLeads = [], showSnackbar }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { fetchAPI, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [asmUsers, setAsmUsers] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [error, setError] = useState(null);
  const [assignToRole, setAssignToRole] = useState("");
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);

  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.TEAM;
  const canAssign = permissions.assign;

  useEffect(() => {
    if (open && canAssign) {
      resetModal();
      const roles = permissions.canAssignTo;
      setAvailableRoles(roles);
      if (roles.length > 1) { setShowRoleSelection(true); setAssignToRole(""); }
      else if (roles.length === 1) { setAssignToRole(roles[0]); setShowRoleSelection(false); fetchUsers(roles[0]); }
    } else { resetModal(); }
  }, [open, canAssign, permissions]);

  const resetModal = () => {
    setAsmUsers([]); setTeamUsers([]); setSelectedUserId(""); setError(null);
    setAssignToRole(""); setShowRoleSelection(false); setAvailableRoles([]);
  };

  const fetchUsers = async (roleToFetch = assignToRole) => {
    if (!canAssign || !roleToFetch) return;
    try {
      setFetchingUsers(true); setError(null);
      let endpoint = "", queryParams = "?page=1&limit=100";
      if (userRole === "Head_office" || userRole === "ZSM") {
        endpoint = roleToFetch === "ASM" ? "/user/managerList" : "/user/getManagerUnderUserList";
      } else if (userRole === "ASM" && roleToFetch === "TEAM") {
        endpoint = "/user/getManagerUnderUserList";
        queryParams = `?page=1&limit=100&supervisorId=${user._id}`;
      }
      if (!endpoint) { setError(`No endpoint configured for ${roleToFetch} from ${userRole}`); return; }
      const response = await fetchAPI(`${endpoint}${queryParams}`);
      if (response?.success) {
        let usersData = response.result?.users || (Array.isArray(response.result) ? response.result : response.result?.data || (response.result ? [response.result] : []));
        const filteredUsers = usersData.filter((u) => {
          const hasRole = u.role === roleToFetch, isActive = u.status === "active";
          let supervised = true;
          if (userRole === "ASM" && roleToFetch === "TEAM") supervised = u.supervisor?._id === user._id || u.supervisorId === user._id || u.supervisor === user._id;
          return hasRole && isActive && supervised;
        });
        if (roleToFetch === "ASM") setAsmUsers(filteredUsers);
        else if (roleToFetch === "TEAM") setTeamUsers(filteredUsers);
        if (filteredUsers.length === 0) setError(`No active ${roleToFetch === "ASM" ? "Area Sales Managers" : "team members"} available.`);
        else setError(null);
      } else setError(response?.message || `Failed to load ${roleToFetch} users.`);
    } catch (error) { setError(error.message || "Failed to load users. Please try again."); }
    finally { setFetchingUsers(false); }
  };

  const handleRoleChange = async (event) => {
    const role = event.target.value;
    setAssignToRole(role); setSelectedUserId("");
    if (role === "ASM") setAsmUsers([]); else if (role === "TEAM") setTeamUsers([]);
    setError(null); await fetchUsers(role);
  };

  const handleSubmit = async () => {
    if (!selectedUserId) { setError("Please select a user to assign"); return; }
    if (!assignToRole) { setError("Please select a role to assign to"); return; }
    setLoading(true);
    try {
      if (isBulkAssign) {
        const response = await fetchAPI("/lead/bulk-assign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadIds: bulkLeads.map((l) => l._id), targetId: selectedUserId, targetRole: assignToRole }) });
        if (response.success) { onAssign(response.result); onClose(); showSnackbar?.(`${bulkLeads.length} leads assigned successfully`, "success"); }
        else throw new Error(response.message || "Failed to bulk assign leads");
      } else {
        const assignData = { leadId: lead._id, targetId: selectedUserId, targetRole: assignToRole };
        if (assignToRole === "ASM") assignData.managerId = selectedUserId;
        else if (assignToRole === "TEAM") assignData.userId = selectedUserId;
        const response = await fetchAPI("/lead/assign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(assignData) });
        if (response.success) { onAssign(response.result); onClose(); showSnackbar?.("Lead assigned successfully", "success"); }
        else throw new Error(response.message || "Failed to assign lead");
      }
    } catch (error) { setError(error.message); showSnackbar?.(error.message || "Failed to assign lead", "error"); }
    finally { setLoading(false); }
  };

  const getAvailableUsers = () => assignToRole === "ASM" ? asmUsers : assignToRole === "TEAM" ? teamUsers : [];
  const getSelectedUser = () => getAvailableUsers().find((u) => u._id === selectedUserId);

  if (!canAssign) {
    return (
      <Dialog open={open} onClose={onClose} fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: "hidden" } }}>
        <ModalHeader icon={<Security />} title="Access Denied" subtitle="Insufficient permissions" color="#c62828" onClose={onClose} />
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            <Typography variant="body1" fontWeight={600}>You do not have permission to assign leads</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Your role ({permissions.label}) does not have assignment privileges.</Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}><Button onClick={onClose} variant="contained" sx={{ bgcolor: PRIMARY_COLOR }}>Close</Button></DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,188,212,0.15)" } }}
      TransitionComponent={isMobile ? Slide : Fade} transitionDuration={300}>

      <ModalHeader
        icon={<AssignmentInd />}
        title={isBulkAssign ? "Bulk Assign Leads" : "Assign Lead"}
        subtitle={isBulkAssign ? `${bulkLeads.length} leads selected` : (lead ? `${lead.firstName} ${lead.lastName}` : "")}
        color="#00838f"
        onClose={onClose}
      />

      <DialogContent sx={{ py: 3, px: { xs: 2.5, sm: 3.5 }, bgcolor: "#f5fdfe" }}>
        {/* Lead preview */}
        {isBulkAssign ? (
          <Box sx={{ p: 2, mb: 3, borderRadius: 2.5, border: `1.5px solid ${alpha("#00bcd4", 0.2)}`, bgcolor: "#fff" }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: "#00838f" }}>Bulk Assignment — {bulkLeads.length} leads</Typography>
            <Stack spacing={0.75} sx={{ maxHeight: 130, overflow: "auto" }}>
              {bulkLeads.slice(0, 5).map((l) => (
                <Box key={l._id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar sx={{ bgcolor: alpha("#00bcd4", 0.15), color: "#00838f", width: 24, height: 24, fontSize: 11, fontWeight: 700 }}>{l.firstName?.[0]}</Avatar>
                  <Typography variant="body2">{l.firstName} {l.lastName}</Typography>
                  <Chip label={l.status} size="small" sx={{ ml: "auto", height: 18, fontSize: "0.65rem", bgcolor: getStatusColor(l.status).bg, color: getStatusColor(l.status).color }} />
                </Box>
              ))}
              {bulkLeads.length > 5 && <Typography variant="caption" color="text.secondary" sx={{ pl: 4 }}>...and {bulkLeads.length - 5} more</Typography>}
            </Stack>
          </Box>
        ) : lead && (
          <Box sx={{ p: 2, mb: 3, borderRadius: 2.5, border: `1.5px solid ${alpha("#00bcd4", 0.2)}`, bgcolor: "#fff", display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: alpha("#00bcd4", 0.15), color: "#00838f", width: 48, height: 48, fontWeight: 700, fontSize: "1.1rem" }}>{lead.firstName?.[0]}{lead.lastName?.[0]}</Avatar>
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight={700}>{lead.firstName} {lead.lastName}</Typography>
              <Typography variant="caption" color="text.secondary">{lead.email} · {lead.phone}</Typography>
              <Box sx={{ mt: 0.5 }}><Chip label={lead.status} size="small" sx={{ bgcolor: getStatusColor(lead.status).bg, color: getStatusColor(lead.status).color, fontWeight: 600, fontSize: "0.65rem", height: 20 }} /></Box>
            </Box>
          </Box>
        )}

        {error && !fetchingUsers && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} action={<Button color="inherit" size="small" onClick={() => fetchUsers(assignToRole)}>Retry</Button>}>{error}</Alert>
        )}

        {fetchingUsers ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={4} gap={1.5}>
            <CircularProgress size={32} sx={{ color: "#00838f" }} />
            <Typography variant="body2" color="text.secondary">Loading available users...</Typography>
          </Box>
        ) : (
          <Stack spacing={2.5}>
            {showRoleSelection && (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>Assign To Role</Typography>
                <Stack direction="row" spacing={1.5}>
                  {availableRoles.map((role) => {
                    const users = role === "ASM" ? asmUsers : teamUsers;
                    const selected = assignToRole === role;
                    const icon = role === "ASM" ? <SupervisorAccount /> : <Groups />;
                    return (
                      <Box key={role} onClick={() => handleRoleChange({ target: { value: role } })}
                        sx={{ flex: 1, p: 1.5, borderRadius: 2, border: `2px solid ${selected ? "#00bcd4" : alpha("#00bcd4", 0.2)}`, bgcolor: selected ? alpha("#00bcd4", 0.06) : "#fff", cursor: "pointer", transition: "all 0.2s", "&:hover": { borderColor: alpha("#00bcd4", 0.5) } }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box sx={{ color: selected ? "#00838f" : "text.secondary", display: "flex" }}>{icon}</Box>
                          <Box>
                            <Typography variant="body2" fontWeight={selected ? 700 : 500}>{role === "ASM" ? "ASM" : "Team"}</Typography>
                            {users.length > 0 && <Typography variant="caption" color="text.secondary">{users.length} available</Typography>}
                          </Box>
                          {selected && <Box sx={{ ml: "auto", color: "#00838f", display: "flex" }}><CheckCircle fontSize="small" /></Box>}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {(assignToRole || !showRoleSelection) && (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
                  Select {assignToRole === "TEAM" ? "Team Member" : assignToRole || "User"}
                </Typography>
                {getAvailableUsers().length === 0 && !fetchingUsers && assignToRole ? (
                  <Box sx={{ p: 3, borderRadius: 2, border: `1.5px dashed ${alpha("#00bcd4", 0.3)}`, textAlign: "center" }}>
                    <Groups sx={{ color: alpha("#00bcd4", 0.4), fontSize: 36, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No {assignToRole === "TEAM" ? "team members" : "ASM users"} available</Typography>
                  </Box>
                ) : (
                  <Stack spacing={1} sx={{ maxHeight: 220, overflow: "auto" }}>
                    {getAvailableUsers().map((userData) => {
                      const selected = selectedUserId === userData._id;
                      const rc = getRoleColor(userData.role);
                      return (
                        <Box key={userData._id} onClick={() => setSelectedUserId(userData._id)}
                          sx={{ p: 1.5, borderRadius: 2, border: `2px solid ${selected ? "#00bcd4" : alpha("#00bcd4", 0.15)}`, bgcolor: selected ? alpha("#00bcd4", 0.06) : "#fff", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 1.5, "&:hover": { borderColor: alpha("#00bcd4", 0.5), bgcolor: alpha("#00bcd4", 0.04) } }}>
                          <Avatar sx={{ bgcolor: rc.color, width: 36, height: 36, fontWeight: 700, fontSize: "0.875rem" }}>{userData.firstName?.[0]}{userData.lastName?.[0]}</Avatar>
                          <Box flex={1}>
                            <Typography variant="body2" fontWeight={selected ? 700 : 500}>{userData.firstName} {userData.lastName}</Typography>
                            <Typography variant="caption" color="text.secondary">{userData.email}</Typography>
                          </Box>
                          <Box sx={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${selected ? "#00bcd4" : alpha("#00bcd4", 0.3)}`, bgcolor: selected ? "#00bcd4" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                            {selected && <CheckCircle sx={{ fontSize: 14, color: "#fff" }} />}
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            )}

            {selectedUserId && assignToRole && (
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha("#00bcd4", 0.06), border: `1px solid ${alpha("#00bcd4", 0.2)}`, display: "flex", gap: 1, alignItems: "flex-start" }}>
                <CheckCircle sx={{ color: "#00838f", fontSize: 18, flexShrink: 0, mt: 0.1 }} />
                <Typography variant="caption" color="#00838f">
                  {isBulkAssign ? `${bulkLeads.length} lead(s)` : "This lead"} will be assigned to <strong>{getSelectedUser()?.firstName} {getSelectedUser()?.lastName}</strong> ({assignToRole}).
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2.5, borderTop: `1px solid ${alpha("#00bcd4", 0.12)}`, bgcolor: "#fff", gap: 1.5, flexDirection: { xs: "column-reverse", sm: "row" } }}>
        <Button onClick={onClose} variant="outlined" fullWidth={isMobile} disabled={loading || fetchingUsers}
          sx={{ borderRadius: 2, borderColor: alpha("#00bcd4", 0.4), color: "#00838f", fontWeight: 600, px: 3, "&:hover": { borderColor: "#00bcd4", bgcolor: alpha("#00bcd4", 0.04) } }}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" fullWidth={isMobile}
          disabled={loading || fetchingUsers || !selectedUserId || !assignToRole || getAvailableUsers().length === 0}
          startIcon={loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : <AssignmentInd />}
          sx={{ bgcolor: "#00838f", borderRadius: 2, fontWeight: 700, px: 3, boxShadow: `0 4px 14px ${alpha("#00bcd4", 0.35)}`, "&:hover": { bgcolor: "#006064" }, "&.Mui-disabled": { bgcolor: alpha("#00bcd4", 0.3), color: "#fff" } }}>
          {loading ? "Assigning..." : isBulkAssign ? "Assign Leads" : "Assign Lead"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
AssignLeadModal.displayName = "AssignLeadModal";

// ---- DELETE CONFIRMATION DIALOG ----
const DeleteConfirmationDialog = React.memo(({ open, onClose, leadsToDelete, onDelete, userRole }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.TEAM;
  const canDelete = permissions.delete;
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isMultiple = leadsToDelete.length > 1;
  const isConfirmed = isMultiple
    ? confirmText === String(leadsToDelete.length)
    : confirmText.toLowerCase() === "delete";

  const handleClose = () => { setConfirmText(""); onClose(); };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
    setConfirmText("");
  };

  if (!canDelete) {
    return (
      <Dialog open={open} onClose={onClose} fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: "hidden" } }}>
        <ModalHeader icon={<Security />} title="Access Denied" subtitle="Delete permission required" color="#c62828" onClose={onClose} />
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            <Typography variant="body1" fontWeight={600}>Delete permission required</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Only Head Office administrators can delete leads. Your role ({permissions.label}) does not have delete privileges.</Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}><Button onClick={onClose} variant="contained" sx={{ bgcolor: PRIMARY_COLOR }}>Close</Button></DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: "hidden", boxShadow: "0 24px 64px rgba(244,67,54,0.18)" } }}
      TransitionComponent={isMobile ? Slide : Fade} transitionDuration={300}>

      <ModalHeader
        icon={<DeleteForever />}
        title={isMultiple ? `Delete ${leadsToDelete.length} Leads` : "Delete Lead"}
        subtitle="This action is permanent and cannot be undone"
        color="#c62828"
        onClose={handleClose}
      />

      <DialogContent sx={{ py: 3, px: { xs: 2.5, sm: 3 }, bgcolor: "#fff9f9" }}>
        <Stack spacing={2.5}>
          {/* Warning */}
          <Box sx={{ display: "flex", gap: 1.5, p: 2, borderRadius: 2, bgcolor: alpha("#f44336", 0.06), border: `1px solid ${alpha("#f44336", 0.2)}` }}>
            <ErrorOutline sx={{ color: "#c62828", fontSize: 20, flexShrink: 0, mt: 0.1 }} />
            <Typography variant="body2" color="#c62828" fontWeight={500}>
              {isMultiple
                ? `All ${leadsToDelete.length} selected leads and their associated data will be permanently erased.`
                : "All data associated with this lead will be permanently erased."}
            </Typography>
          </Box>

          {/* Lead count/summary card */}
          <Box sx={{ p: 2, borderRadius: 2.5, border: `1.5px solid ${alpha("#f44336", 0.2)}`, bgcolor: "#fff", display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: alpha("#f44336", 0.1), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <DeleteForever sx={{ color: "#c62828", fontSize: 24 }} />
            </Box>
            <Box>
              <Typography fontWeight={700} variant="subtitle1" color="#c62828">
                {isMultiple ? `${leadsToDelete.length} Leads` : "1 Lead"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isMultiple ? "Multiple leads will be permanently deleted" : "Will be permanently deleted"}
              </Typography>
            </Box>
          </Box>

          {/* Confirm input */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Type <strong style={{ color: "#c62828" }}>{isMultiple ? leadsToDelete.length : "delete"}</strong> to confirm:
            </Typography>
            <TextField
              fullWidth size="small"
              placeholder={isMultiple ? `Type "${leadsToDelete.length}" to confirm` : `Type "delete" to confirm`}
              value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
              error={confirmText.length > 0 && !isConfirmed}
              helperText={confirmText.length > 0 && !isConfirmed ? "Text doesn't match" : ""}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: isConfirmed ? "#4caf50" : "#f44336" } } }}
              InputProps={{ endAdornment: isConfirmed ? <InputAdornment position="end"><CheckCircle sx={{ color: "#4caf50" }} /></InputAdornment> : null }}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5, borderTop: `1px solid ${alpha("#f44336", 0.1)}`, bgcolor: "#fff", gap: 1.5, flexDirection: { xs: "column-reverse", sm: "row" } }}>
        <Button onClick={handleClose} variant="outlined" fullWidth={isMobile} disabled={deleting}
          sx={{ borderRadius: 2, borderColor: alpha("#f44336", 0.35), color: "#c62828", fontWeight: 600, px: 3, "&:hover": { borderColor: "#f44336", bgcolor: alpha("#f44336", 0.04) } }}>
          Cancel
        </Button>
        <Button onClick={handleDelete} variant="contained" fullWidth={isMobile}
          disabled={!isConfirmed || deleting}
          startIcon={deleting ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : <DeleteForever />}
          sx={{ bgcolor: "#c62828", borderRadius: 2, fontWeight: 700, px: 3, boxShadow: isConfirmed ? `0 4px 14px ${alpha("#f44336", 0.4)}` : "none", "&:hover": { bgcolor: "#b71c1c" }, "&.Mui-disabled": { bgcolor: alpha("#f44336", 0.3), color: "#fff" } }}>
          {deleting ? "Deleting..." : isMultiple ? `Delete ${leadsToDelete.length} Leads` : "Delete Lead"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
DeleteConfirmationDialog.displayName = "DeleteConfirmationDialog";

// ========== MAIN COMPONENT ==========
const LeadOverview = () => {
  const { fetchAPI, user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : isTablet ? 8 : 10);
  const [totalLeads, setTotalLeads] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState(isMobile ? "grid" : "table");
  const [showRoleInfo, setShowRoleInfo] = useState(false);
  const [period, setPeriod] = useState("Today");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadsToDelete, setLeadsToDelete] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [leadToAssign, setLeadToAssign] = useState(null);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [leadToView, setLeadToView] = useState(null);

  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const containerRef = useRef(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const hasFilters = useMemo(() => searchTerm || statusFilter !== "all", [searchTerm, statusFilter]);
  const selectedCount = useMemo(() => selectedLeads.length, [selectedLeads]);
  const userRole = user?.role || "TEAM";
  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.TEAM;
  const selectedLeadsData = useMemo(() => leads.filter((lead) => selectedLeads.includes(lead._id)), [leads, selectedLeads]);
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== "all") count++;
    if (period !== "Today") count++;
    return count;
  }, [searchTerm, statusFilter, period]);

  const addLeads = () => navigate("/add-lead");
  const showSnackbar = useCallback((message, severity = "success") => setSnackbar({ open: true, message, severity }), []);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: (page + 1).toString(), limit: rowsPerPage.toString(), sortBy, sortOrder });
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      const data = await fetchAPI(`/lead/getAll?${params.toString()}`);
      if (data.success) { setLeads(data.result.leads || []); setTotalLeads(data.result.pagination?.total || 0); }
      else showSnackbar(data.message || "Failed to fetch leads", "error");
    } catch (error) { showSnackbar(error.message || "Failed to fetch leads", "error"); setLeads([]); }
    finally { setLoading(false); }
  }, [fetchAPI, page, rowsPerPage, debouncedSearchTerm, statusFilter, sortBy, sortOrder, showSnackbar]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleAssignLead = useCallback(async () => { showSnackbar("Lead assigned successfully", "success"); await fetchLeads(); setSelectedLeads([]); setSelectAll(false); }, [fetchLeads, showSnackbar]);
  const handleBulkAssign = useCallback(async (assignData) => { showSnackbar(`${assignData.leadIds?.length || 0} leads assigned successfully`, "success"); setSelectedLeads([]); setSelectAll(false); await fetchLeads(); }, [fetchLeads, showSnackbar]);

  // ✅ FIXED: Use fetchAPI instead of hardcoded fetch URL
 const handleDeleteLeads = useCallback(async () => {
  try {
    if (!leadsToDelete || leadsToDelete.length === 0) {
      showSnackbar("No leads selected for deletion", "error");
      return;
    }
    for (const leadId of leadsToDelete) {
      await fetchAPI(`/lead/deleteLead/${leadId}`, { method: "DELETE" });
    }
    showSnackbar(`${leadsToDelete.length} lead(s) deleted successfully`, "success");
    setDeleteDialogOpen(false);
    setLeadsToDelete([]);
    setSelectedLeads([]);
    setSelectAll(false);
    await fetchLeads();
  } catch (error) {
    showSnackbar(error.message || "Failed to delete leads", "error");
  }
}, [fetchAPI, fetchLeads, showSnackbar, leadsToDelete]);

  // ✅ FIXED: Use fetchAPI instead of hardcoded fetch URL
  const handleDeleteSingleLead = useCallback(async (leadId) => {
  try {
    if (!leadId) { showSnackbar("Invalid lead ID", "error"); return; }
    const response = await fetchAPI(`/lead/deleteLead/${leadId}`, { method: "DELETE" });
    if (response.success) {
      showSnackbar("Lead deleted successfully", "success");
      await fetchLeads();
    } else {
      throw new Error(response.message || "Failed to delete lead");
    }
  } catch (error) {
    showSnackbar(error.message || "Failed to delete lead", "error");
  }
}, [fetchAPI, fetchLeads, showSnackbar]);

  const handleUpdateLead = useCallback(async () => { showSnackbar("Lead updated successfully", "success"); await fetchLeads(); }, [fetchLeads, showSnackbar]);

  const handleSelectAll = useCallback((event) => { const isChecked = event.target.checked; setSelectAll(isChecked); setSelectedLeads(isChecked ? leads.map((lead) => lead._id) : []); }, [leads]);
  const handleSelectLead = useCallback((leadId) => setSelectedLeads((prev) => prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]), []);
  const handleClearSelection = useCallback(() => { setSelectedLeads([]); setSelectAll(false); }, []);

  const openAssignDialog = useCallback((lead) => { setLeadToAssign(lead); setAssignDialogOpen(true); }, []);
  const openBulkAssignDialog = useCallback(() => setBulkAssignDialogOpen(true), []);
  const openEditDialog = useCallback((lead) => { setLeadToEdit(lead); setEditModalOpen(true); }, []);
  const openViewDialog = useCallback((lead) => { setLeadToView(lead); setViewModalOpen(true); }, []);
  const openDeleteDialog = useCallback(() => { setLeadsToDelete(selectedLeads); setDeleteDialogOpen(true); }, [selectedLeads]);

  const handleSort = useCallback((column) => { if (sortBy === column) setSortOrder(sortOrder === "asc" ? "desc" : "asc"); else { setSortBy(column); setSortOrder("asc"); } }, [sortBy, sortOrder]);
  const handleResetFilters = useCallback(() => { setSearchTerm(""); setStatusFilter("all"); setPeriod("Today"); setPage(0); setSelectedLeads([]); setSelectAll(false); }, []);
  const handleClearFiltersMobile = useCallback(() => { setSearchTerm(""); setStatusFilter("all"); setPeriod("Today"); }, []);

  const handleExport = useCallback(async () => {
    try {
      const params = new URLSearchParams({ sortBy, sortOrder });
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      const response = await fetchAPI(`/lead/export?${params.toString()}`);
      if (response.success && response.result?.url) {
        const link = document.createElement("a");
        link.href = response.result.url;
        link.download = `leads_${format(new Date(), "yyyy-MM-dd")}.csv`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        showSnackbar("Export completed successfully", "success");
      } else throw new Error(response.message || "Failed to export leads");
    } catch (error) { showSnackbar(error.message || "Failed to export leads", "error"); }
  }, [fetchAPI, showSnackbar, sortBy, sortOrder, debouncedSearchTerm, statusFilter]);

  const handleChangePage = (event, newPage) => { setPage(newPage); if (containerRef.current) containerRef.current.scrollIntoView({ behavior: "smooth" }); };

  const renderTableRow = useCallback((lead) => {
    const isSelected = selectedLeads.includes(lead._id);
    const statusColor = getStatusColor(lead.status);
    return (
      <TableRow key={lead._id} hover selected={isSelected} sx={{ "&:hover": { bgcolor: alpha(PRIMARY_COLOR, 0.02) }, "&.Mui-selected": { bgcolor: alpha(PRIMARY_COLOR, 0.08) } }}>
        <TableCell padding="checkbox">{permissions.bulkActions && <Checkbox checked={isSelected} onChange={() => handleSelectLead(lead._id)} sx={{ color: PRIMARY_COLOR, "&.Mui-checked": { color: PRIMARY_COLOR } }} />}</TableCell>
        <TableCell>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: PRIMARY_COLOR }}>{lead.firstName?.[0]}</Avatar>
            <Box><Typography variant="body1" fontWeight={600}>{lead.firstName} {lead.lastName}</Typography><Typography variant="caption" color="text.secondary">{lead.email}</Typography></Box>
          </Box>
        </TableCell>
        <TableCell><Box display="flex" alignItems="center" gap={1}><Phone fontSize="small" sx={{ color: "text.secondary" }} /><Typography variant="body2">{lead.phone || "Not set"}</Typography></Box></TableCell>
        <TableCell><Chip label={lead.status} icon={statusColor.icon} size="small" sx={{ bgcolor: statusColor.bg, color: statusColor.color, fontWeight: 600 }} /></TableCell>
        <TableCell>
          {(() => {
            const assignedPerson = getAssignedPerson(lead);
            return assignedPerson ? (
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: PRIMARY_COLOR }}>{assignedPerson.initial}</Avatar>
                <Box><Typography variant="body2">{assignedPerson.name}</Typography><Typography variant="caption" color="text.secondary">{assignedPerson.role}</Typography></Box>
              </Box>
            ) : <Typography variant="body2" color="text.secondary">Unassigned</Typography>;
          })()}
        </TableCell>
        <TableCell><Typography variant="caption">{formatDate(lead.createdAt, "MMM dd, yyyy")}</Typography></TableCell>
        <TableCell>
          <Box display="flex" gap={1}>
            <Tooltip title="View Details"><IconButton size="small" onClick={() => openViewDialog(lead)} sx={{ bgcolor: alpha(PRIMARY_COLOR, 0.1), color: PRIMARY_COLOR, "&:hover": { bgcolor: alpha(PRIMARY_COLOR, 0.2) } }}><Visibility fontSize="small" /></IconButton></Tooltip>
            {permissions.edit && <Tooltip title="Edit Lead"><IconButton size="small" onClick={() => openEditDialog(lead)} sx={{ bgcolor: alpha(PRIMARY_COLOR, 0.1), color: PRIMARY_COLOR, "&:hover": { bgcolor: alpha(PRIMARY_COLOR, 0.2) } }}><Edit fontSize="small" /></IconButton></Tooltip>}
            {permissions.assign && <Tooltip title="Assign Lead"><IconButton size="small" onClick={() => openAssignDialog(lead)} sx={{ bgcolor: alpha(PRIMARY_COLOR, 0.1), color: PRIMARY_COLOR, "&:hover": { bgcolor: alpha(PRIMARY_COLOR, 0.2) } }}><AssignmentInd fontSize="small" /></IconButton></Tooltip>}
            {permissions.delete && <Tooltip title="Delete Lead"><IconButton size="small" onClick={() => { if (window.confirm(`Delete ${lead.firstName} ${lead.lastName}?`)) handleDeleteSingleLead(lead._id); }} sx={{ bgcolor: alpha("#f44336", 0.1), color: "#f44336", "&:hover": { bgcolor: alpha("#f44336", 0.2) } }}><Delete fontSize="small" /></IconButton></Tooltip>}
          </Box>
        </TableCell>
      </TableRow>
    );
  }, [selectedLeads, permissions, handleSelectLead, handleDeleteSingleLead, openViewDialog, openEditDialog, openAssignDialog]);

  const renderCardView = useCallback(() => {
    if (loading) return <LoadingSkeleton count={6} isMobile={isMobile} />;
    if (leads.length === 0) return <EmptyState title={hasFilters ? "No matching leads found" : "No leads yet"} description={hasFilters ? "Try adjusting your filters" : "Get started by creating your first lead"} icon={hasFilters ? Search : Person} action={hasFilters && <Button onClick={handleResetFilters} variant="outlined" sx={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}>Clear Filters</Button>} />;
    return (
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {leads.map((lead) => <MobileLeadCard key={lead._id} lead={lead} onView={openViewDialog} onEdit={openEditDialog} onAssign={openAssignDialog} onDelete={handleDeleteSingleLead} permissions={permissions} />)}
      </Box>
    );
  }, [loading, leads, hasFilters, permissions, openViewDialog, openEditDialog, openAssignDialog, handleDeleteSingleLead, isMobile, handleResetFilters]);

  return (
    <Box ref={containerRef} sx={{ p: { xs: 1.5, sm: 2, md: 3 }, minHeight: "100vh", pb: { xs: 8, sm: 3 }, bgcolor: "#f8fafc" }}>
      <MobileFilterDrawer open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} period={period} setPeriod={setPeriod} statusFilter={statusFilter} setStatusFilter={setStatusFilter} handleClearFilters={handleClearFiltersMobile} searchQuery={searchTerm} setSearchQuery={setSearchTerm} activeFilterCount={activeFilterCount} />

      {/* Header */}
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3, background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`, color: "#fff" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff" }}><Groups /></Avatar>
            <Box>
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} gutterBottom>Lead Management</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Total {totalLeads} leads • {permissions.label} view</Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {isMobile && (
              <Button variant="contained" startIcon={<FilterAlt />} onClick={() => setMobileFilterOpen(true)} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }, position: "relative" }}>
                Filter
                {activeFilterCount > 0 && <Badge badgeContent={activeFilterCount} color="error" sx={{ position: "absolute", top: -8, right: -8, "& .MuiBadge-badge": { fontSize: "0.6rem", minWidth: 16, height: 16 } }} />}
              </Button>
            )}
            <Button variant="contained" startIcon={<Add />} onClick={addLeads} size={isMobile ? "small" : "medium"} sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}>Add Lead</Button>
          </Box>
        </Stack>
      </Paper>

      {/* Desktop Filters */}
      {!isMobile && (
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField fullWidth placeholder="Search leads by name, email, phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: "text.secondary" }} /></InputAdornment>, endAdornment: searchTerm && <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchTerm("")}><Close /></IconButton></InputAdornment> }}
                  size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Status</InputLabel>
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Filter by Status" sx={{ borderRadius: 2 }}>
                    <MenuItem value="all">All Status</MenuItem>
                    {LEAD_STATUS_OPTIONS.map((status) => <MenuItem key={status} value={status}><Box display="flex" alignItems="center" gap={1}>{getStatusColor(status).icon}{status}</Box></MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" gap={1} justifyContent="flex-end">
                  <Tooltip title="Grid View"><IconButton onClick={() => setViewMode("grid")} sx={{ bgcolor: viewMode === "grid" ? alpha(PRIMARY_COLOR, 0.1) : "transparent", color: viewMode === "grid" ? PRIMARY_COLOR : "text.secondary" }}><GridView /></IconButton></Tooltip>
                  <Tooltip title="Table View"><IconButton onClick={() => setViewMode("table")} sx={{ bgcolor: viewMode === "table" ? alpha(PRIMARY_COLOR, 0.1) : "transparent", color: viewMode === "table" ? PRIMARY_COLOR : "text.secondary" }}><TableChart /></IconButton></Tooltip>
                  <Divider orientation="vertical" flexItem />
                  <Tooltip title="Refresh"><IconButton onClick={fetchLeads} sx={{ color: "text.secondary" }}><Refresh /></IconButton></Tooltip>
                </Box>
              </Grid>
            </Grid>
            {activeFilterCount > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>Active Filters:</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {searchTerm && <Chip label={`Search: ${searchTerm}`} size="small" onDelete={() => setSearchTerm("")} sx={{ bgcolor: alpha(PRIMARY_COLOR, 0.1), color: PRIMARY_COLOR }} />}
                  {statusFilter !== "all" && <Chip label={`Status: ${statusFilter}`} size="small" onDelete={() => setStatusFilter("all")} sx={{ bgcolor: alpha(PRIMARY_COLOR, 0.1), color: PRIMARY_COLOR }} />}
                  <Chip label="Clear All" size="small" variant="outlined" onClick={handleResetFilters} onDelete={handleResetFilters} deleteIcon={<Close />} sx={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }} />
                </Stack>
              </Box>
            )}
            {selectedCount > 0 && (
              <Box sx={{ mt: 3, p: 2, bgcolor: alpha(PRIMARY_COLOR, 0.05), borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="body1" fontWeight={600}>{selectedCount} lead(s) selected</Typography>
                  <Button size="small" onClick={handleClearSelection} startIcon={<Clear />} sx={{ color: "text.secondary" }}>Clear</Button>
                </Box>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {permissions.assign && <Button variant="outlined" size="small" startIcon={<AssignmentInd />} onClick={openBulkAssignDialog} sx={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}>Assign Selected</Button>}
                  {permissions.export && <Button variant="outlined" size="small" startIcon={<Send />} onClick={handleExport} sx={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}>Export Selected</Button>}
                  {permissions.delete && <Button variant="contained" color="error" size="small" startIcon={<Delete />} onClick={openDeleteDialog}>Delete Selected</Button>}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mobile Search */}
      {isMobile && (
        <Box sx={{ mb: 2 }}>
          <TextField fullWidth size="small" placeholder="Search leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment>, endAdornment: searchTerm && <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchTerm("")}><Close /></IconButton></InputAdornment> }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "#fff" } }} />
        </Box>
      )}

      {/* Content */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, bgcolor: "#fff" }}>
          <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
            {viewMode === "table" ? "Lead List" : "Lead Cards"}
            <Chip label={`${totalLeads} total`} size="small" sx={{ ml: 1, bgcolor: alpha(PRIMARY_COLOR, 0.1), color: PRIMARY_COLOR }} />
          </Typography>
          {!isMobile && viewMode === "table" && (
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">Rows per page:</Typography>
              <Select size="small" value={rowsPerPage} onChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} sx={{ minWidth: 80 }}>
                {[5, 10, 25, 50].map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
              </Select>
            </Stack>
          )}
        </Box>

        {viewMode === "table" && !isMobile ? (
          <>
            <TableContainer>
              <Table >
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">{permissions.bulkActions && <Checkbox indeterminate={selectedCount > 0 && selectedCount < leads.length} checked={selectAll} onChange={handleSelectAll} sx={{ color: PRIMARY_COLOR, "&.Mui-checked": { color: PRIMARY_COLOR } }} />}</TableCell>
                    {[{ label: "Lead", key: "firstName", sortable: true }, { label: "Contact", sortable: false }, { label: "Status", key: "status", sortable: true }, { label: "Assigned To", key: "assignedUser", sortable: true }, { label: "Created Date", key: "createdAt", sortable: true }, { label: "Actions", sortable: false }].map((col) => (
                      <TableCell key={col.label}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2" fontWeight={600}>{col.label}</Typography>
                          {col.sortable && <IconButton size="small" onClick={() => handleSort(col.key)} sx={{ color: sortBy === col.key ? PRIMARY_COLOR : "inherit" }}><Sort /></IconButton>}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={7}><LoadingSkeleton count={rowsPerPage} /></TableCell></TableRow>
                    : leads.length === 0 ? <TableRow><TableCell colSpan={7}><EmptyState title={hasFilters ? "No matching leads found" : "No leads yet"} description={hasFilters ? "Try adjusting your filters" : "Get started by creating your first lead"} icon={hasFilters ? Search : Person} action={hasFilters && <Button onClick={handleResetFilters} variant="outlined" sx={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}>Clear Filters</Button>} /></TableCell></TableRow>
                    : leads.map(renderTableRow)}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={totalLeads} page={page} onPageChange={handleChangePage} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 25, 50]} sx={{ borderTop: 1, borderColor: "divider" }} />
          </>
        ) : renderCardView()}
      </Paper>

      {/* Role Info Button */}
      {!isMobile && (
        <Box sx={{ position: "fixed", bottom: 16, right: 16 }}>
          <Tooltip title="View Role Permissions">
            <Button variant="contained" onClick={() => setShowRoleInfo(true)} startIcon={<Security />} sx={{ borderRadius: 3, bgcolor: PRIMARY_COLOR, "&:hover": { bgcolor: SECONDARY_COLOR } }}>{permissions.label}</Button>
          </Tooltip>
        </Box>
      )}

      {/* Role Info Dialog */}
      <Dialog open={showRoleInfo} onClose={() => setShowRoleInfo(false)} maxWidth="sm" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: "hidden" } }}
        TransitionComponent={isMobile ? Slide : Fade} transitionDuration={300}>
        <ModalHeader icon={<Security />} title={`Your Permissions`} subtitle={permissions.label} color={PRIMARY_COLOR} onClose={() => setShowRoleInfo(false)} />
        <DialogContent sx={{ py: 3, px: { xs: 2.5, sm: 3.5 }, bgcolor: "#fafbff" }}>
          <Grid container spacing={2}>
            <Grid item xs={6}><PermissionIndicator permission={permissions.view} label="View Leads" /></Grid>
            <Grid item xs={6}><PermissionIndicator permission={permissions.edit} label="Edit Leads" /></Grid>
            <Grid item xs={6}><PermissionIndicator permission={permissions.assign} label="Assign Leads" /></Grid>
            <Grid item xs={6}><PermissionIndicator permission={permissions.delete} label="Delete Leads" /></Grid>
            <Grid item xs={6}><PermissionIndicator permission={permissions.bulkActions} label="Bulk Actions" /></Grid>
            <Grid item xs={6}><PermissionIndicator permission={permissions.export} label="Export" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2.5, borderTop: `1px solid ${alpha(PRIMARY_COLOR, 0.08)}`, bgcolor: "#fff" }}>
          <Button onClick={() => setShowRoleInfo(false)} variant="contained" sx={{ bgcolor: PRIMARY_COLOR, borderRadius: 2, fontWeight: 700, boxShadow: `0 4px 14px ${alpha(PRIMARY_COLOR, 0.35)}` }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Modals */}
      <ViewLeadModal open={viewModalOpen} onClose={() => setViewModalOpen(false)} lead={leadToView} userRole={userRole} />
      <EditLeadModal open={editModalOpen} onClose={() => setEditModalOpen(false)} lead={leadToEdit} onSave={handleUpdateLead} userRole={userRole} />
      <AssignLeadModal open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} lead={leadToAssign} onAssign={handleAssignLead} userRole={userRole} showSnackbar={showSnackbar} />
      <AssignLeadModal open={bulkAssignDialogOpen} onClose={() => setBulkAssignDialogOpen(false)} lead={null} onAssign={handleBulkAssign} userRole={userRole} isBulkAssign={true} bulkLeads={selectedLeadsData} showSnackbar={showSnackbar} />
      <DeleteConfirmationDialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} leadsToDelete={leadsToDelete} onDelete={handleDeleteLeads} userRole={userRole} />

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: isMobile ? "top" : "bottom", horizontal: isMobile ? "center" : "right" }}>
        <Alert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: "100%", borderRadius: 2, color: "#fff" }}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Mobile FAB */}
      {isMobile && (
        <Zoom in={true}>
          <Fab color="primary" aria-label="filter" onClick={() => setMobileFilterOpen(true)}
            sx={{ position: "fixed", bottom: 80, right: 16, zIndex: 1000, bgcolor: PRIMARY_COLOR, "&:hover": { bgcolor: SECONDARY_COLOR }, boxShadow: `0 4px 12px ${alpha(PRIMARY_COLOR, 0.3)}` }}>
            <Badge badgeContent={activeFilterCount} color="error" max={9} sx={{ "& .MuiBadge-badge": { fontSize: "0.6rem", minWidth: 16, height: 16 } }}><FilterAlt /></Badge>
          </Fab>
        </Zoom>
      )}
    </Box>
  );
};

export default LeadOverview;
