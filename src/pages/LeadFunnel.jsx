// components/LeadFunnelDashboard.jsx (Updated with Mobile View)
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Stack,
  CircularProgress,Slide,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Paper,
  Avatar,
  Divider,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Pagination,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel,
  Skeleton,
  Fade,
  Zoom,
  Fab,
  BottomNavigation,
  BottomNavigationAction,
  SwipeableDrawer,
  Collapse,
  alpha,
} from "@mui/material";
import {
  Visibility,
  Close,
  Phone,
  Email,
  Business,
  CalendarToday,
  LocationOn,
  Notes,
  Person,
  ArrowForward,
  TrendingUp,
  Group,
  CheckCircle,
  Warning,
  MonetizationOn,
  Description,
  AssignmentInd,
  Search,
  FilterList,
  Sort,
  Download,
  Refresh,
  Timeline,
  PieChart,
  BarChart,
  ViewList,
  GridView,
  MoreVert,
  Speed,
  TableChart,
  NavigateNext,
  NavigateBefore,
  FirstPage,
  LastPage,
  ArrowUpward,
  ArrowDownward,
  Assessment,
  TrendingFlat,
  PlayCircle,
  StopCircle,
  PauseCircle,
  Edit,
  Delete,
  Share,
  FilterAlt,
  ExpandMore,
  ExpandLess,
  Dashboard,
  Schedule,
  DateRange,
  Clear,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const PRIMARY_COLOR = "#4569ea";
const SECONDARY_COLOR = "#1a237e";

// Period Options
const PERIOD_OPTIONS = [
  { value: "Today", label: "Today", icon: <CalendarToday /> },
  { value: "This Week", label: "This Week", icon: <DateRange /> },
  { value: "This Month", label: "This Month", icon: <DateRange /> },
  { value: "All", label: "All Time", icon: <DateRange /> },
];

const STAGE_CONFIG = {
  Visit: {
    color: PRIMARY_COLOR,
    icon: <Person />,
    description: "Initial contact and site visit scheduled",
    bgColor: alpha(PRIMARY_COLOR, 0.08),
    order: 1,
  },
  Registration: {
    color: PRIMARY_COLOR,
    icon: <AssignmentInd />,
    description: "Customer registration completed",
    bgColor: alpha(PRIMARY_COLOR, 0.08),
    order: 2,
  },
  "Bank Loan Apply": {
    color: PRIMARY_COLOR,
    icon: <MonetizationOn />,
    description: "Bank loan application submitted",
    bgColor: alpha(PRIMARY_COLOR, 0.08),
    order: 3,
  },
  "Document Submission": {
    color: PRIMARY_COLOR,
    icon: <Description />,
    description: "Required documents submitted",
    bgColor: alpha(PRIMARY_COLOR, 0.08),
    order: 4,
  },
  Disbursement: {
    color: PRIMARY_COLOR,
    icon: <TrendingUp />,
    description: "Loan disbursed to customer",
    bgColor: alpha(PRIMARY_COLOR, 0.08),
    order: 5,
  },
  "Installation Completion": {
    color: PRIMARY_COLOR,
    icon: <CheckCircle />,
    description: "Solar installation completed",
    bgColor: alpha(PRIMARY_COLOR, 0.08),
    order: 6,
  },
  "Missed Leads": {
    color: PRIMARY_COLOR,
    icon: <Warning />,
    description: "Lost or inactive leads",
    bgColor: alpha(PRIMARY_COLOR, 0.08),
    order: 7,
  },
};

const STAGE_ORDER = Object.keys(STAGE_CONFIG);

// ========== MOBILE FILTER DRAWER ==========
const MobileFilterDrawer = ({
  open,
  onClose,
  period,
  setPeriod,
  stageFilter,
  setStageFilter,
  handleClearFilters,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
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
              Filter Funnel
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
                          <Tooltip title="Clear Search">
                            <IconButton
                              size="small"
                              onClick={() => setSearchQuery("")}
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          </Tooltip>
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

            {/* Stage Section */}
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
                onClick={() => toggleSection("stage")}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Timeline sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Lead Stage
                  </Typography>
                </Stack>
                {expandedSection === "stage" ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={expandedSection === "stage"}>
                <Box sx={{ p: 2 }}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={stageFilter}
                      onChange={(e) => setStageFilter(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="all">All Stages</MenuItem>
                      {STAGE_ORDER.map((stage) => (
                        <MenuItem key={stage} value={stage}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {STAGE_CONFIG[stage].icon}
                            <span>{stage}</span>
                          </Stack>
                        </MenuItem>
                      ))}
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
                  <FormControl fullWidth size="small">
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="-createdAt">Newest First</MenuItem>
                      <MenuItem value="createdAt">Oldest First</MenuItem>
                      <MenuItem value="firstName">Name A-Z</MenuItem>
                      <MenuItem value="-firstName">Name Z-A</MenuItem>
                    </Select>
                  </FormControl>
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

// ========== SUMMARY CARD ==========
const SummaryCard = ({ title, value, icon, color, trend, trendDirection, index }) => (
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
          {trend && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: { xs: "0.6rem", sm: "0.7rem" },
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              {trendDirection === "up" && <ArrowUpward sx={{ fontSize: 12, color: "#4caf50" }} />}
              {trendDirection === "down" && <ArrowDownward sx={{ fontSize: 12, color: "#f44336" }} />}
              {trend}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  </Fade>
);

// ========== MOBILE STAGE CARD ==========
const MobileStageCard = ({ stage, config, isSelected, onClick, count, percentage }) => (
  <Paper
    onClick={onClick}
    sx={{
      p: 2,
      borderRadius: 2,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 2,
      transition: "all 0.2s",
      border: `2px solid ${isSelected ? config.color : "transparent"}`,
      bgcolor: isSelected ? alpha(config.color, 0.05) : "#fff",
      "&:hover": {
        bgcolor: alpha(config.color, 0.05),
        transform: "translateX(4px)",
      },
    }}
  >
    <Avatar
      sx={{ 
        bgcolor: config.color, 
        color: "#fff", 
        width: { xs: 40, sm: 48 }, 
        height: { xs: 40, sm: 48 } 
      }}
    >
      {config.icon}
    </Avatar>
    <Box sx={{ flex: 1 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>
        {stage}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {count} leads • {percentage}%
      </Typography>
    </Box>
    <NavigateNext sx={{ color: "text.secondary" }} />
  </Paper>
);

// ========== MOBILE LEAD CARD ==========
const MobileLeadCard = ({ lead, stageColor, onView, index }) => {
  const [expanded, setExpanded] = useState(false);
  const initials = `${lead.firstName?.[0] || ''}${lead.lastName?.[0] || ''}`;
  const assignedTo = lead.assignedUser
    ? `${lead.assignedUser.firstName || ""} ${lead.assignedUser.lastName || ""}`.trim()
    : lead.assignedManager
      ? `${lead.assignedManager.firstName || ""} ${lead.assignedManager.lastName || ""}`.trim()
      : "Unassigned";

  return (
    <Fade in={true} timeout={500 + index * 50}>
      <Paper
        sx={{
          mb: 1.5,
          borderRadius: 3,
          border: `1px solid ${alpha(stageColor, 0.1)}`,
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
                  bgcolor: stageColor,
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
                  color={stageColor}
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
                bgcolor: alpha(stageColor, 0.1),
              }}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>

          {/* Quick Info */}
          <Grid container spacing={1} sx={{ mb: 1.5 }}>
            <Grid item xs={6}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Phone sx={{ fontSize: 14, color: alpha(stageColor, 0.6) }} />
                <Typography variant="caption" noWrap>
                  {lead.phone || "No phone"}
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Email sx={{ fontSize: 14, color: alpha(stageColor, 0.6) }} />
                <Typography variant="caption" noWrap>
                  {lead.email || "No email"}
                </Typography>
              </Stack>
            </Grid>
          </Grid>

          {/* Lead Info */}
          <Box sx={{ mb: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <CalendarToday
                sx={{ fontSize: 14, color: alpha(stageColor, 0.6) }}
              />
              <Typography variant="body2" fontWeight={500}>
                {new Date(lead.createdAt).toLocaleDateString()}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Person sx={{ fontSize: 14, color: alpha(stageColor, 0.6) }} />
              <Typography variant="body2" fontWeight={500}>
                {assignedTo}
              </Typography>
            </Stack>
          </Box>

          {/* Expanded Details */}
          <Collapse in={expanded}>
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: `1px solid ${alpha(stageColor, 0.1)}`,
              }}
            >
              {/* Additional Info */}
              <Grid container spacing={2}>
                {lead.city && (
                  <Grid item xs={12}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      Location
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                      {lead.city}
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
                    {new Date(lead.createdAt).toLocaleDateString()}
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
                    {lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : "N/A"}
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
                    bgcolor: stageColor,
                    "&:hover": { bgcolor: SECONDARY_COLOR },
                  }}
                >
                  View
                </Button>
              </Stack>
            </Box>
          </Collapse>
        </Box>
      </Paper>
    </Fade>
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
const EmptyState = ({ stage, hasFilters, onClearFilters }) => (
  <Box textAlign="center" py={8} px={2}>
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
      {stage ? <Group sx={{ fontSize: 48, color: PRIMARY_COLOR }} /> : <Search sx={{ fontSize: 48, color: PRIMARY_COLOR }} />}
    </Box>
    <Typography variant="h6" fontWeight={600} gutterBottom>
      {stage ? `No leads in ${stage}` : "No matching leads found"}
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
    >
      {stage
        ? "Leads will appear here as they progress through the pipeline."
        : "Try adjusting your search criteria to find what you're looking for."}
    </Typography>
    {hasFilters && (
      <Button
        variant="contained"
        onClick={onClearFilters}
        startIcon={<Clear />}
        sx={{ bgcolor: PRIMARY_COLOR, "&:hover": { bgcolor: SECONDARY_COLOR } }}
      >
        Clear Filters
      </Button>
    )}
  </Box>
);

// ========== MAIN COMPONENT ==========
export default function LeadFunnelDashboard() {
  const { fetchAPI } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const [funnelData, setFunnelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStage, setSelectedStage] = useState("Visit");
  const [selectedLead, setSelectedLead] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewMode, setViewMode] = useState(isMobile ? "cards" : "table");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("-createdAt");
  const [showConversion, setShowConversion] = useState(true);
  const [period, setPeriod] = useState("Today");
  const [stageFilter, setStageFilter] = useState("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: isMobile ? 5 : 10,
    totalPages: 1,
    totalItems: 0,
  });

  // Refs
  const containerRef = useRef(null);

  // Fetch funnel data
  const fetchFunnelData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAPI("/lead/funnel");

      if (!response?.success) {
        throw new Error(response?.message || "Failed to load funnel data");
      }

      // Organize data with proper stage order
      const orderedFunnel = STAGE_ORDER.map((stageName) => {
        const stage = response.result.funnel.find((s) => s.stage === stageName);
        return (
          stage || {
            stage: stageName,
            count: 0,
            leads: [],
            percentage: "0.0",
          }
        );
      });

      setFunnelData({
        ...response.result,
        funnel: orderedFunnel,
      });
    } catch (err) {
      setError(err.message || "Failed to load funnel data");
      console.error("Funnel data error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchAPI]);

  useEffect(() => {
    fetchFunnelData();
  }, [fetchFunnelData]);

  // Get current stage data
  const currentStageData = funnelData?.funnel?.find(
    (s) => s.stage === selectedStage
  ) || {
    stage: selectedStage,
    count: 0,
    leads: [],
    percentage: "0",
  };

  const stageConfig = STAGE_CONFIG[selectedStage] || STAGE_CONFIG.Visit;

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    if (!currentStageData.leads) return [];

    let leads = [...currentStageData.leads];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      leads = leads.filter(
        (lead) =>
          lead.firstName?.toLowerCase().includes(query) ||
          lead.lastName?.toLowerCase().includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.phone?.includes(query) ||
          lead.source?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    leads.sort((a, b) => {
      switch (sortBy) {
        case "firstName":
          return (a.firstName || "").localeCompare(b.firstName || "");
        case "-firstName":
          return (b.firstName || "").localeCompare(a.firstName || "");
        case "createdAt":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "-createdAt":
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    return leads;
  }, [currentStageData.leads, searchQuery, sortBy]);

  // Paginate leads
  const paginatedLeads = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    return filteredLeads.slice(start, end);
  }, [filteredLeads, pagination.page, pagination.limit]);

  // Update pagination
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      totalPages: Math.ceil(filteredLeads.length / prev.limit),
      totalItems: filteredLeads.length,
      page:
        filteredLeads.length > 0
          ? Math.min(prev.page, Math.ceil(filteredLeads.length / prev.limit))
          : 1,
    }));
  }, [filteredLeads]);

  // Calculate conversion rates
  const calculateConversionRate = (fromStage, toStage) => {
    if (!funnelData) return { rate: "0%", value: 0 };

    const fromCount =
      funnelData.funnel.find((s) => s.stage === fromStage)?.count || 0;
    const toCount =
      funnelData.funnel.find((s) => s.stage === toStage)?.count || 0;

    if (fromCount === 0) return { rate: "0%", value: 0 };
    const rate = (toCount / fromCount) * 100;
    return { rate: `${rate.toFixed(1)}%`, value: rate };
  };

  // Get stage progression data
  const getStageProgression = () => {
    if (!funnelData) return [];

    const progression = [];
    for (let i = 0; i < STAGE_ORDER.length - 1; i++) {
      const fromStage = STAGE_ORDER[i];
      const toStage = STAGE_ORDER[i + 1];
      const conversion = calculateConversionRate(fromStage, toStage);
      progression.push({
        from: fromStage,
        to: toStage,
        ...conversion,
      });
    }
    return progression;
  };

  const stageProgression = getStageProgression();

  const handleViewLead = (lead) => {
    setSelectedLead(lead);
    setOpenDialog(true);
  };

  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLimitChange = (event) => {
    setPagination((prev) => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 1,
    }));
  };

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setStageFilter("all");
    setPeriod("Today");
    setSortBy("-createdAt");
    setSelectedStage("Visit");
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (stageFilter !== "all") count++;
    if (period !== "Today") count++;
    if (sortBy !== "-createdAt") count++;
    return count;
  }, [searchQuery, stageFilter, period, sortBy]);

  // Loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <Box p={3}>
        <Alert
          severity="error"
          sx={{ borderRadius: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchFunnelData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Empty state
  if (!funnelData) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No funnel data available
        </Typography>
        <Button variant="outlined" onClick={fetchFunnelData} sx={{ mt: 2 }}>
          Load Data
        </Button>
      </Box>
    );
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
        period={period}
        setPeriod={setPeriod}
        stageFilter={stageFilter}
        setStageFilter={setStageFilter}
        handleClearFilters={handleClearFilters}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
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
              Lead Funnel Dashboard
            </Typography>
            <Typography
              variant="body2"
              sx={{
                opacity: 0.9,
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              Track and manage leads through the entire sales pipeline
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
              onClick={fetchFunnelData}
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

      {/* Stats Overview Cards */}
      <Grid container spacing={isMobile ? 1.5 : 2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6} lg={3}>
          <SummaryCard
            title="Total Leads"
            value={funnelData.totalLeads || 0}
            icon={<Group />}
            color={PRIMARY_COLOR}
            trend="+12% from last month"
            trendDirection="up"
            index={0}
          />
        </Grid>
        <Grid item xs={6} sm={6} lg={3}>
          <SummaryCard
            title="Conversion Rate"
            value={stageProgression[0]?.rate || "0%"}
            icon={<TrendingUp />}
            color="#4caf50"
            trend={stageProgression[0]?.value > 50 ? "Excellent" : "Needs improvement"}
            index={1}
          />
        </Grid>
        <Grid item xs={6} sm={6} lg={3}>
          <SummaryCard
            title="Avg. Stage Time"
            value="3.2 days"
            icon={<Speed />}
            color="#ff9800"
            trend="-0.5 days from last week"
            trendDirection="down"
            index={2}
          />
        </Grid>
        <Grid item xs={6} sm={6} lg={3}>
          <SummaryCard
            title="Missed Leads"
            value={funnelData.funnel?.find((s) => s.stage === "Missed Leads")?.count || 0}
            icon={<Warning />}
            color="#f44336"
            trend="Requires attention"
            index={3}
          />
        </Grid>
      </Grid>

      {/* Mobile Search Bar */}
      {isMobile && (
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search leads..."
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
                  <Tooltip title="Clear Search">
                    <IconButton size="small" onClick={() => setSearchQuery("")}>
                      <Close />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                bgcolor: "#fff",
              },
            }}
          />
        </Box>
      )}

      {/* Main Dashboard Layout */}
      <Grid container spacing={3}>
        {/* Left Column - Stage Pipeline */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3, overflow: "hidden", height: "100%" }}>
            <Box sx={{ p: 3, bgcolor: PRIMARY_COLOR, color: "white" }}>
              <Typography variant="h6" fontWeight="bold">
                Lead Pipeline
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Stage progression overview
              </Typography>
            </Box>

            <Box sx={{ p: 3 }}>
              <Stack spacing={2}>
                {funnelData.funnel?.map((stage, index) => {
                  const config = STAGE_CONFIG[stage.stage];
                  const conversion =
                    index < STAGE_ORDER.length - 1
                      ? stageProgression[index]
                      : null;

                  return (
                    <React.Fragment key={stage.stage}>
                      {isMobile ? (
                        <MobileStageCard
                          stage={stage.stage}
                          config={config}
                          isSelected={selectedStage === stage.stage}
                          onClick={() => setSelectedStage(stage.stage)}
                          count={stage.count}
                          percentage={stage.percentage}
                        />
                      ) : (
                        <StageItem
                          stage={stage}
                          config={config}
                          isSelected={selectedStage === stage.stage}
                          onClick={() => setSelectedStage(stage.stage)}
                        />
                      )}

                      {showConversion && conversion && stage.count > 0 && !isMobile && (
                        <Box sx={{ ml: 4, mb: 1 }}>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={0.5}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              To {STAGE_ORDER[index + 1]}:
                            </Typography>
                            <Typography
                              variant="caption"
                              fontWeight={600}
                              color={
                                conversion.value > 30 ? "#4caf50" : "#ff9800"
                              }
                            >
                              {conversion.rate}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(conversion.value, 100)}
                            sx={{
                              height: 4,
                              borderRadius: 2,
                              bgcolor: "#e0e0e0",
                              "& .MuiLinearProgress-bar": {
                                bgcolor:
                                  conversion.value > 30 ? "#4caf50" : "#ff9800",
                                borderRadius: 2,
                              },
                            }}
                          />
                        </Box>
                      )}
                    </React.Fragment>
                  );
                })}
              </Stack>

              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showConversion}
                      onChange={(e) => setShowConversion(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label="Show conversion rates"
                />
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Right Column - Stage Details */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3, overflow: "hidden", height: "100%" }}>
            {/* Stage Header */}
            <Box
              sx={{
                p: { xs: 2, sm: 3 },
                bgcolor: alpha(stageConfig.color, 0.08),
                borderLeft: { xs: "none", sm: `4px solid ${stageConfig.color}` },
                borderTop: { xs: `4px solid ${stageConfig.color}`, sm: "none" },
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "flex-start" }}
                flexDirection={{ xs: "column", sm: "row" }}
                gap={2}
              >
                <Box>
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Avatar sx={{ bgcolor: stageConfig.color, color: "white" }}>
                      {stageConfig.icon}
                    </Avatar>
                    <Box>
                      <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                        {selectedStage}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {stageConfig.description}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={3} mt={2}>
                    <Box>
                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        color={stageConfig.color}
                        sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}
                      >
                        {currentStageData.count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Leads
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        color="text.primary"
                        sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}
                      >
                        {currentStageData.percentage}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        of Pipeline
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {!isMobile && (
                  <Box display="flex" gap={2}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="-createdAt">Newest</MenuItem>
                        <MenuItem value="createdAt">Oldest</MenuItem>
                        <MenuItem value="firstName">A to Z</MenuItem>
                        <MenuItem value="-firstName">Z to A</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Stage Content */}
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Mobile Controls Bar */}
              {isMobile && (
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="body2" color="text.secondary">
                    Showing {paginatedLeads.length} of {filteredLeads.length} leads
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="-createdAt">Newest</MenuItem>
                      <MenuItem value="createdAt">Oldest</MenuItem>
                      <MenuItem value="firstName">A-Z</MenuItem>
                      <MenuItem value="-firstName">Z-A</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Desktop Controls Bar */}
              {!isMobile && (
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={3}
                >
                  <Box display="flex" gap={2}>
                    <TextField
                      size="small"
                      placeholder="Search leads..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      sx={{ minWidth: 200 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Box display="flex" gap={1}>
                      <Tooltip title="Card View">
                        <IconButton
                          size="small"
                          onClick={() => setViewMode("cards")}
                          sx={{
                            bgcolor:
                              viewMode === "cards"
                                ? alpha(PRIMARY_COLOR, 0.1)
                                : "transparent",
                            color:
                              viewMode === "cards"
                                ? PRIMARY_COLOR
                                : "text.secondary",
                          }}
                        >
                          <GridView />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="List View">
                        <IconButton
                          size="small"
                          onClick={() => setViewMode("list")}
                          sx={{
                            bgcolor:
                              viewMode === "list"
                                ? alpha(PRIMARY_COLOR, 0.1)
                                : "transparent",
                            color:
                              viewMode === "list"
                                ? PRIMARY_COLOR
                                : "text.secondary",
                          }}
                        >
                          <ViewList />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Table View">
                        <IconButton
                          size="small"
                          onClick={() => setViewMode("table")}
                          sx={{
                            bgcolor:
                              viewMode === "table"
                                ? alpha(PRIMARY_COLOR, 0.1)
                                : "transparent",
                            color:
                              viewMode === "table"
                                ? PRIMARY_COLOR
                                : "text.secondary",
                          }}
                        >
                          <TableChart />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Showing {paginatedLeads.length} of {filteredLeads.length} leads
                  </Typography>
                </Box>
              )}

              {/* Leads Display */}
              {currentStageData.count === 0 ? (
                <EmptyState 
                  stage={selectedStage} 
                  hasFilters={activeFilterCount > 0}
                  onClearFilters={handleClearFilters}
                />
              ) : filteredLeads.length === 0 ? (
                <EmptyState 
                  hasFilters={true}
                  onClearFilters={handleClearFilters}
                />
              ) : (
                <>
                  {viewMode === "cards" && !isMobile && (
                    <LeadCards
                      leads={paginatedLeads}
                      stageColor={stageConfig.color}
                      onView={handleViewLead}
                    />
                  )}

                  {viewMode === "list" && !isMobile && (
                    <LeadList
                      leads={paginatedLeads}
                      stageColor={stageConfig.color}
                      onView={handleViewLead}
                    />
                  )}

                  {viewMode === "table" && !isMobile && (
                    <LeadTable
                      leads={paginatedLeads}
                      stageColor={stageConfig.color}
                      onView={handleViewLead}
                    />
                  )}

                  {isMobile && (
                    <Box sx={{ mt: 2 }}>
                      {paginatedLeads.map((lead, index) => (
                        <MobileLeadCard
                          key={lead._id}
                          lead={lead}
                          stageColor={stageConfig.color}
                          onView={handleViewLead}
                          index={index}
                        />
                      ))}
                    </Box>
                  )}

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <Box
                      sx={{
                        mt: 4,
                        pt: 3,
                        borderTop: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Box
                        display="flex"
                        flexDirection={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        alignItems="center"
                        gap={2}
                      >
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography variant="body2" color="text.secondary">
                            Rows per page:
                          </Typography>
                          <Select
                            size="small"
                            value={pagination.limit}
                            onChange={handleLimitChange}
                            sx={{ minWidth: 70 }}
                          >
                            <MenuItem value={5}>5</MenuItem>
                            <MenuItem value={10}>10</MenuItem>
                            <MenuItem value={20}>20</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                          </Select>
                          <Typography variant="body2" color="text.secondary">
                            {(pagination.page - 1) * pagination.limit + 1}-
                            {Math.min(
                              pagination.page * pagination.limit,
                              pagination.totalItems
                            )}{" "}
                            of {pagination.totalItems}
                          </Typography>
                        </Box>

                        <Pagination
                          count={pagination.totalPages}
                          page={pagination.page}
                          onChange={handlePageChange}
                          color="primary"
                          size={isMobile ? "small" : "medium"}
                          showFirstButton
                          showLastButton
                          siblingCount={isMobile ? 0 : 1}
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
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Lead Detail Dialog */}
      <LeadDetailDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        lead={selectedLead}
        stage={selectedStage}
        isMobile={isMobile}
        stageColor={stageConfig.color}
      />

      {/* Mobile FAB */}
      {isMobile && (
        <Zoom in={true}>
          <Tooltip title="Filters">
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
          </Tooltip>
        </Zoom>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <Paper
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            borderRadius: 0,
            borderTop: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
          }}
          elevation={3}
        >
          <BottomNavigation
            showLabels
            sx={{
              height: 64,
              "& .MuiBottomNavigationAction-root": {
                color: "text.secondary",
                "&.Mui-selected": { color: PRIMARY_COLOR },
              },
            }}
          >
            <BottomNavigationAction
              label="Dashboard"
              icon={<Dashboard />}
              onClick={() => navigate("/dashboard")}
            />
            <BottomNavigationAction
              label="Funnel"
              icon={<Timeline />}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            />
            <BottomNavigationAction
              label="Profile"
              icon={<Person />}
              onClick={() => navigate("/profile")}
            />
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}

// Component: Stage Item (Desktop)
const StageItem = ({ stage, config, isSelected, onClick }) => {
  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 2,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 2,
        transition: "all 0.2s",
        border: `2px solid ${isSelected ? config.color : "transparent"}`,
        bgcolor: isSelected ? alpha(config.color, 0.05) : "transparent",
        "&:hover": {
          bgcolor: alpha(config.color, 0.05),
          transform: "translateX(4px)",
        },
      }}
    >
      <Avatar
        sx={{ bgcolor: config.color, color: "white", width: 40, height: 40 }}
      >
        {config.icon}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {stage.stage}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {stage.count} leads • {stage.percentage}%
        </Typography>
      </Box>
      <NavigateNext sx={{ color: "text.secondary" }} />
    </Paper>
  );
};

// Component: Lead Cards (Grid View) - Desktop
const LeadCards = ({ leads, stageColor, onView }) => {
  return (
    <Grid container spacing={3}>
      {leads.map((lead) => {
        const assignedTo = lead.assignedUser
          ? `${lead.assignedUser.firstName || ""} ${lead.assignedUser.lastName || ""}`.trim()
          : lead.assignedManager
            ? `${lead.assignedManager.firstName || ""} ${lead.assignedManager.lastName || ""}`.trim()
            : "Unassigned";
        return (
        <Grid item xs={12} sm={6} lg={4} key={lead._id}>
          <Card
            sx={{
              borderRadius: 3,
              height: "100%",
              transition: "all 0.3s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar sx={{ bgcolor: stageColor, color: "white" }}>
                  {lead.firstName?.[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600} noWrap>
                    {lead.firstName} {lead.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {lead.email}
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={1.5} sx={{ mb: 3 }}>
                {lead.phone && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Phone fontSize="small" sx={{ color: "text.secondary" }} />
                    <Typography variant="body2">{lead.phone}</Typography>
                  </Box>
                )}
                {lead.source && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Business fontSize="small" sx={{ color: "text.secondary" }} />
                    <Typography variant="body2">{lead.source}</Typography>
                  </Box>
                )}
                <Box display="flex" alignItems="center" gap={1}>
                  <CalendarToday fontSize="small" sx={{ color: "text.secondary" }} />
                  <Typography variant="caption" color="text.secondary">
                    Added {new Date(lead.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Person fontSize="small" sx={{ color: "text.secondary" }} />
                  <Typography variant="body2">{assignedTo}</Typography>
                </Box>
              </Stack>

              <Button
                fullWidth
                variant="contained"
                onClick={() => onView(lead)}
                sx={{
                  bgcolor: stageColor,
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  "&:hover": {
                    bgcolor: stageColor,
                    opacity: 0.9,
                  },
                }}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        </Grid>
        );
      })}
    </Grid>
  );
};

// Component: Lead List (List View) - Desktop
const LeadList = ({ leads, stageColor, onView }) => {
  return (
    <Stack spacing={2}>
      {leads.map((lead) => {
        const assignedTo = lead.assignedUser
          ? `${lead.assignedUser.firstName || ""} ${lead.assignedUser.lastName || ""}`.trim()
          : lead.assignedManager
            ? `${lead.assignedManager.firstName || ""} ${lead.assignedManager.lastName || ""}`.trim()
            : "Unassigned";
        return (
        <Paper
          key={lead._id}
          sx={{
            p: 2,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            transition: "all 0.2s",
            "&:hover": {
              bgcolor: "action.hover",
              transform: "translateX(4px)",
            },
          }}
        >
          <Avatar sx={{ bgcolor: stageColor, color: "white" }}>
            {lead.firstName?.[0]}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {lead.firstName} {lead.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {lead.email} • {lead.phone}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Assigned To: {assignedTo}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            {lead.source && (
              <Chip label={lead.source} size="small" variant="outlined" />
            )}

            <Typography variant="caption" color="text.secondary">
              {new Date(lead.createdAt).toLocaleDateString()}
            </Typography>

            <Button
              variant="outlined"
              size="small"
              onClick={() => onView(lead)}
              sx={{
                borderRadius: 2,
                borderColor: stageColor,
                color: stageColor,
                "&:hover": {
                  borderColor: stageColor,
                  bgcolor: alpha(stageColor, 0.05),
                },
              }}
            >
              View
            </Button>
          </Box>
        </Paper>
        );
      })}
    </Stack>
  );
};

// Component: Lead Table (Table View) - Desktop
const LeadTable = ({ leads, stageColor, onView }) => {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: "#f5f5f5" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Lead</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Assigned To</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Date Added</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leads.map((lead) => (
            <TableRow
              key={lead._id}
              hover
              sx={{ "&:hover": { bgcolor: alpha(stageColor, 0.02) } }}
            >
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    sx={{
                      bgcolor: stageColor,
                      color: "white",
                      width: 32,
                      height: 32,
                    }}
                  >
                    {lead.firstName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {lead.firstName} {lead.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lead.email}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{lead.phone}</Typography>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {lead.assignedUser
                      ? `${lead.assignedUser.firstName || ""} ${lead.assignedUser.lastName || ""}`.trim()
                      : lead.assignedManager
                        ? `${lead.assignedManager.firstName || ""} ${lead.assignedManager.lastName || ""}`.trim()
                        : "Unassigned"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lead.assignedUser
                      ? lead.assignedUser.role || "Assigned User"
                      : lead.assignedManager
                        ? lead.assignedManager.role || "Manager"
                        : "No assignee"}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onView(lead)}
                  sx={{
                    borderRadius: 2,
                    borderColor: stageColor,
                    color: stageColor,
                    "&:hover": {
                      borderColor: stageColor,
                      bgcolor: alpha(stageColor, 0.05),
                    },
                  }}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Component: Lead Detail Dialog
const LeadDetailDialog = ({ open, onClose, lead, stage, isMobile, stageColor }) => {
  if (!lead) return null;

  const config = STAGE_CONFIG[stage] || STAGE_CONFIG.Visit;

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
              {lead.firstName?.[0] || "L"}
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                {lead.firstName} {lead.lastName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: "0.7rem", sm: "0.75rem" },
                }}
              >
                Lead Details • {stage}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: "white" }}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              {/* Contact Info */}
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Contact Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <InfoRow
                        icon={<Phone />}
                        label="Phone"
                        value={lead.phone}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoRow
                        icon={<Email />}
                        label="Email"
                        value={lead.email}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoRow
                        icon={<LocationOn />}
                        label="Location"
                        value={lead.city}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Stage History
                  </Typography>
                  <Stack spacing={1}>
                    <TimelineItem
                      stage={stage}
                      date={lead.createdAt}
                      isCurrent={true}
                      color={stageColor || config.color}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Status Card */}
              <Card
                sx={{
                  borderRadius: 2,
                  borderLeft: `4px solid ${config.color}`,
                }}
              >
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Current Status
                  </Typography>
                  <Chip
                    label={stage}
                    icon={config.icon}
                    sx={{
                      bgcolor: alpha(config.color, 0.08),
                      color: config.color,
                      fontWeight: 600,
                      mb: 2,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {config.description}
                  </Typography>
                </CardContent>
              </Card>

              {/* Actions Card */}
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Actions
                  </Typography>
                  <Stack spacing={1}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Edit />}
                      size="small"
                      sx={{ borderRadius: 2 }}
                    >
                      Edit Lead
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Phone />}
                      size="small"
                      sx={{ borderRadius: 2 }}
                    >
                      Call Lead
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Email />}
                      size="small"
                      sx={{ borderRadius: 2 }}
                    >
                      Send Email
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
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
          sx={{
            borderRadius: 2,
            borderColor: PRIMARY_COLOR,
            color: PRIMARY_COLOR,
          }}
        >
          Close
        </Button>
        <Button
          variant="contained"
          fullWidth={isMobile}
          sx={{
            bgcolor: PRIMARY_COLOR,
            borderRadius: 2,
            "&:hover": { bgcolor: SECONDARY_COLOR },
          }}
        >
          Move to Next Stage
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Component: Info Row
const InfoRow = ({ icon, label, value }) => (
  <Box display="flex" alignItems="center" gap={2}>
    <Box sx={{ color: PRIMARY_COLOR, minWidth: 24 }}>{icon}</Box>
    <Box sx={{ flex: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={500}>
        {value || "Not provided"}
      </Typography>
    </Box>
  </Box>
);

// Component: Timeline Item
const TimelineItem = ({ stage, date, isCurrent, color }) => {
  const config = STAGE_CONFIG[stage] || STAGE_CONFIG.Visit;

  return (
    <Box display="flex" alignItems="flex-start" gap={2}>
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: isCurrent ? color : "#e0e0e0",
          color: isCurrent ? "white" : "#9e9e9e",
        }}
      >
        {config.icon}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={600}>
          {stage}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {date
            ? new Date(date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Date not available"}
        </Typography>
      </Box>
    </Box>
  );
};
