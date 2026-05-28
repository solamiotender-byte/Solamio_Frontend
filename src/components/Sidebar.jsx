import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  SwipeableDrawer,
  Avatar,
  useTheme,
  useMediaQuery,
  Badge,
  AppBar,
  Toolbar,
} from "@mui/material";
import {
  Dashboard,
  Groups,
  PersonAdd,
  AccountBalance,
  Description,
  ReceiptLong,
  TaskAlt,
  Warning,
  CloudUpload,
  CalendarMonth,
  FilterAlt,
  Paid,
  AdminPanelSettings,
  PendingActions,
  Insights,
  AccountTree,
  Notifications,
  Logout,
  EventBusy,
  ChevronLeft,
  ChevronRight,
  Menu as MenuIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useAuth } from "../contexts/AuthContext";
import SunergyTechLogo from "../assets/solamio-logo.png";
import BrandSquareIcon from "../assets/solar_crm_icon_square.png";

// ─── Color Constants ──────────────────────────────────────────────────────────
const PRIMARY_COLOR = "#4569ea";
const PRIMARY_DARK = "#3a5ac8";
const TEXT_COLOR = "#ffffff";
const HOVER_BG = "rgba(255,255,255,0.15)";
const ACTIVE_BG = "rgba(255,255,255,0.25)";
const BORDER_COLOR = "rgba(255,255,255,0.18)";
const SIDEBAR_BG = `linear-gradient(170deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_DARK} 100%)`;

// ─── Width Constants ──────────────────────────────────────────────────────────
const SIDEBAR_WIDTH = 268;
const COLLAPSED_WIDTH = 68;
const MOBILE_WIDTH = 272;

// ─── Sidebar Component ────────────────────────────────────────────────────────
const Sidebar = ({ open, toggleDrawer, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const navigate = useNavigate();
  const location = useLocation();

  // ── Collapsed state (desktop only) ────────────────────────────────────────
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (!isMobile && !isTablet) {
      localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, isMobile, isTablet]);

  const effectiveCollapsed = isCollapsed && !isMobile && !isTablet;

  const { user } = useAuth();

  // ── Flat menu items in requested order ────────────────────────────────────
  const menuItems = useMemo(
    () => [
      {
        text: "Dashboard",
        icon: <Dashboard />,
        path: "/dashboard",
        roles: ["Head_office", "ZSM", "ASM", "TEAM"],
      },
      {
        text: "Lead Funnel",
        icon: <AccountTree />,
        path: "/lead-funnel",
        roles: ["Head_office", "ZSM", "ASM", "TEAM"],
      },
      {
        text: "All Leads",
        icon: <FilterAlt />,
        path: "/all-leads",
        roles: ["Head_office", "ZSM", "ASM", "TEAM"],
      },
      {
        text: "Total Visits",
        icon: <Groups />,
        path: "/total-visits",
        roles: ["Head_office", "ZSM", "ASM", "TEAM"],
      },
      {
        text: "Registration",
        icon: <PersonAdd />,
        path: "/registration",
        roles: ["Head_office", "ZSM", "ASM", "TEAM"],
      },
      {
        text: "Document",
        icon: <Description />,
        path: "/document-submission",
        roles: ["Head_office", "ZSM", "ASM", "TEAM"],
      },
      {
        text: "Bank Loan",
        icon: <AccountBalance />,
        path: "/bank-loan-apply",
        roles: ["Head_office", "ZSM", "ASM", "TEAM"],
      },
      {
        text: "Loan Pending",
        icon: <PendingActions />,
        path: "/bank-at-pending",
        roles: ["Head_office", "ZSM", "ASM", "TEAM"],
      },
      {
        text: "Disbursement",
        icon: <ReceiptLong />,
        path: "/disbursement",
        roles: ["Head_office", "ZSM", "ASM", "TEAM"],
      },
      {
        text: "Installation",
        icon: <TaskAlt />,
        path: "/installation-completion",
        roles: ["Head_office", "ZSM", "ASM", "TEAM"],
      },
      {
        text: "Missed Leads",
        icon: <Warning />,
        path: "/missed-leads",
        roles: ["Head_office", "ZSM", "ASM", "TEAM"],
      },
      {
        text: "Attendance",
        icon: <CalendarMonth />,
        path: ["Head_office", "ZSM", "ASM"].includes(user?.role)
          ? "/team-attendance"
          : "/attendance",
        roles: ["Head_office", "ZSM", "ASM", "TEAM"],
      },
      {
        text: "Leave Management",
        icon: <EventBusy />,
        path: "/leave-management",
        roles: ["Head_office", "ZSM", "ASM", "TEAM"],
      },
      {
  text: "Location Visit",
  icon: <LocationOnIcon />,
path: user?.role === "TEAM" ? "/add-visit" : "/team-tracking",
  roles: ["Head_office", "ZSM", "ASM", "TEAM"],
}
    ,  {
        text: "Expense",
        icon: <Paid />,
        path: "/expense",
        roles: ["Head_office", "ZSM", "ASM", "TEAM"],
      },
      // Management items (restricted roles)
      {
        text: "Import Leads",
        icon: <CloudUpload />,
        path: "/import-leads",
        roles: ["Head_office", "ZSM"],
      },
      {
        text: "Users",
        icon: <AdminPanelSettings />,
        path: "/user-management",
        roles: ["Head_office", "ZSM", "ASM"],
      },
      {
        text: "Reports",
        icon: <Insights />,
        path: "/reports",
        roles: ["Head_office", "ZSM", "ASM"],
      },
      {
        text: "Notifications",
        icon: <Notifications />,
        path: "/notifications",
        roles: ["Head_office", "ZSM", "ASM", "TEAM"],
      },
    ],
    [user?.role],
  );

  const filteredItems = useMemo(
    () => menuItems.filter((item) => item.roles.includes(user?.role)),
    [menuItems, user?.role],
  );

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isActive = (path) => location.pathname === path;

  const handleNavigate = useCallback(
    (path) => {
      navigate(path);
      if (isMobile || isTablet) onClose?.();
    },
    [navigate, isMobile, isTablet, onClose],
  );

  const handleLogout = () => navigate("/login");

  const getUserInitials = () =>
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";

  // ── Item button styles ─────────────────────────────────────────────────────
  const itemBtnSx = (active) => ({
    pl: effectiveCollapsed ? 0 : 2,
    justifyContent: effectiveCollapsed ? "center" : "flex-start",
    borderRadius: "10px",
    mx: effectiveCollapsed ? 0.5 : 1,
    my: 0.3,
    bgcolor: active ? ACTIVE_BG : "transparent",
    color: TEXT_COLOR,
    minHeight: isMobile ? 52 : 44,
    py: isMobile ? 1.3 : 0.9,
    transition: "all 0.2s ease",
    "&:hover": {
      bgcolor: HOVER_BG,
      transform: isMobile ? "none" : "translateX(3px)",
    },
  });

  // ── Render single menu item ────────────────────────────────────────────────
  const renderMenuItem = (item) => {
    const active = isActive(item.path);

    const btn = (
      <ListItemButton
        key={item.path}
        onClick={() => handleNavigate(item.path)}
        sx={itemBtnSx(active)}
      >
        <ListItemIcon
          sx={{
            minWidth: effectiveCollapsed ? "auto" : 40,
            color: active ? "#fff" : "rgba(255,255,255,0.85)",
            "& svg": { fontSize: isMobile ? "1.35rem" : "1.25rem" },
          }}
        >
          {item.badge ? (
            <Badge badgeContent={item.badge} color="error" variant="dot">
              {item.icon}
            </Badge>
          ) : (
            item.icon
          )}
        </ListItemIcon>

        {!effectiveCollapsed && (
          <ListItemText
            primary={item.text}
            primaryTypographyProps={{
              fontSize: isMobile ? "0.92rem" : "0.875rem",
              fontWeight: active ? 700 : 400,
              letterSpacing: "0.01em",
              noWrap: true,
            }}
          />
        )}

        {item.badge && !effectiveCollapsed && (
          <Box
            sx={{
              bgcolor: "error.main",
              color: "#fff",
              borderRadius: "10px",
              px: 0.9,
              py: 0.2,
              fontSize: "0.68rem",
              fontWeight: "bold",
              flexShrink: 0,
            }}
          >
            {item.badge}
          </Box>
        )}
      </ListItemButton>
    );

    return effectiveCollapsed ? (
      <Tooltip key={item.path} title={item.text} placement="right" arrow>
        {btn}
      </Tooltip>
    ) : (
      <React.Fragment key={item.path}>{btn}</React.Fragment>
    );
  };

  // ── Scroll area ────────────────────────────────────────────────────────────
  const scrollArea = (
    <Box
      sx={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        py: 1.5,
        px: 0.5,
        "&::-webkit-scrollbar": { width: "3px" },
        "&::-webkit-scrollbar-thumb": {
          background: "rgba(255,255,255,0.2)",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-track": { background: "transparent" },
      }}
    >
      {filteredItems.map((item) => renderMenuItem(item))}
    </Box>
  );

  // ── Logo bar ───────────────────────────────────────────────────────────────
  const logoBar = (
    <Box
      sx={{
        px: effectiveCollapsed ? 1 : 2.5,
        py: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: effectiveCollapsed ? "center" : "flex-start",
        gap: 1.5,
        borderBottom: `1px solid ${BORDER_COLOR}`,
        minHeight: 68,
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          width: effectiveCollapsed ? 38 : 52,
          height: effectiveCollapsed ? 38 : 52,
          borderRadius: effectiveCollapsed ? "10px" : "14px",
          bgcolor: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.34)",
          boxShadow: "0 8px 18px rgba(0,0,0,0.16)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src={effectiveCollapsed ? BrandSquareIcon : SunergyTechLogo}
          alt="SOLAMIO logo"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: effectiveCollapsed ? "cover" : "contain",
            p: effectiveCollapsed ? 0 : 0.55,
          }}
        />
      </Box>
      {!effectiveCollapsed && (
        <Box sx={{ overflow: "hidden", minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            color={TEXT_COLOR}
            fontWeight={800}
            sx={{ lineHeight: 1.05, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}
          >
            SOLAMIO
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.78)",
              fontSize: "0.68rem",
              whiteSpace: "nowrap",
            }}
          >
            Solar Management
          </Typography>
        </Box>
      )}
    </Box>
  );

  // ── Mobile header (with close button) ─────────────────────────────────────
  const mobileHeader = (
    <Box
      sx={{
        px: 2.5,
        py: 1.8,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${BORDER_COLOR}`,
        flexShrink: 0,
        minHeight: 68,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "14px",
            bgcolor: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.34)",
            boxShadow: "0 8px 18px rgba(0,0,0,0.16)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <Box component="img" src={SunergyTechLogo} alt="SOLAMIO logo" sx={{ width: "100%", height: "100%", objectFit: "contain", p: 0.55 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            color={TEXT_COLOR}
            fontWeight={800}
            sx={{ lineHeight: 1.05, whiteSpace: "nowrap" }}
          >
            SOLAMIO
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.78)",
              fontSize: "0.66rem",
              whiteSpace: "nowrap",
            }}
          >
            Solar Management
          </Typography>
        </Box>
      </Box>
      <Tooltip title="Close Sidebar" arrow>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: TEXT_COLOR,
            bgcolor: "rgba(255,255,255,0.12)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
            width: 34,
            height: 34,
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footer = (
    <Box
      sx={{
        p: effectiveCollapsed ? 1.5 : 2,
        borderTop: `1px solid ${BORDER_COLOR}`,
        flexShrink: 0,
      }}
    >
      {/* Collapse toggle — desktop only */}
      {!isMobile && !isTablet && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: effectiveCollapsed ? 1 : 1.5 }}>
          <Tooltip
            title={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            placement="right"
            arrow
          >
            <IconButton
              onClick={() => setIsCollapsed((v) => !v)}
              size="small"
              sx={{
                color: TEXT_COLOR,
                bgcolor: "rgba(255,255,255,0.12)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                width: 34,
                height: 34,
              }}
            >
              {effectiveCollapsed ? (
                <ChevronRight fontSize="small" />
              ) : (
                <ChevronLeft fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: effectiveCollapsed ? "center" : "space-between",
          alignItems: "center",
          gap: 1,
        }}
      >
        {!effectiveCollapsed && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, overflow: "hidden", flex: 1 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "rgba(255,255,255,0.22)",
                fontSize: "0.75rem",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {getUserInitials()}
            </Avatar>
            <Box sx={{ overflow: "hidden" }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#fff",
                  fontWeight: 600,
                  display: "block",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.firstName} {user.lastName}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.63rem" }}
              >
                v2.2.0
              </Typography>
            </Box>
          </Box>
        )}
        <Tooltip
          title="Logout"
          placement={effectiveCollapsed ? "right" : "top"}
          arrow
        >
          <IconButton
            size="small"
            onClick={handleLogout}
            sx={{
              color: TEXT_COLOR,
              bgcolor: "rgba(255,255,255,0.12)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
              width: 34,
              height: 34,
              flexShrink: 0,
            }}
          >
            <Logout fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  // ── Desktop / Tablet drawer content ───────────────────────────────────────
  const DesktopContent = (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: SIDEBAR_BG,
        boxShadow: "2px 0 20px rgba(69,105,234,0.2)",
      }}
    >
      {logoBar}
      {scrollArea}
      {footer}
    </Box>
  );

  // ── Mobile swipeable drawer content ───────────────────────────────────────
  const MobileContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: SIDEBAR_BG,
        width: MOBILE_WIDTH,
      }}
    >
      {mobileHeader}
      {scrollArea}
      {footer}
    </Box>
  );

  return (
    <>
      {/* ── Desktop permanent drawer ─────────────────────────────────────── */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            width: effectiveCollapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: effectiveCollapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH,
              boxSizing: "border-box",
              overflowX: "hidden",
              transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
              backgroundColor: "transparent",
              border: "none",
              boxShadow: "none",
            },
          }}
        >
          {DesktopContent}
        </Drawer>
      )}

      {/* ── Mobile swipeable drawer ──────────────────────────────────────── */}
      {isMobile && (
        <SwipeableDrawer
          anchor="left"
          open={open}
          onClose={onClose}
          onOpen={toggleDrawer}
          swipeAreaWidth={28}
          disableSwipeToOpen={false}
          ModalProps={{ keepMounted: true }}
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 2,
            "& .MuiDrawer-paper": {
              width: MOBILE_WIDTH,
              maxWidth: "88vw",
              backgroundColor: "transparent",
              border: "none",
              boxShadow: "8px 0 32px rgba(0,0,0,0.28)",
            },
          }}
        >
          {MobileContent}
        </SwipeableDrawer>
      )}
    </>
  );
};

// ─── Mobile Top AppBar ─────────────────────────────────────────────────────────
export const MobileTopBar = ({ onMenuClick, title = "Dashboard" }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (!isMobile) return null;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: `linear-gradient(90deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_DARK} 100%)`,
        borderBottom: `1px solid ${BORDER_COLOR}`,
        zIndex: theme.zIndex.drawer + 1,
        backdropFilter: "blur(8px)",
      }}
    >
      <Toolbar
        sx={{
          minHeight: "60px !important",
          px: { xs: 1.5, sm: 2 },
          gap: 1,
        }}
      >
        <Tooltip title="Open Menu" arrow>
          <IconButton
            edge="start"
            onClick={onMenuClick}
            sx={{
              color: "#fff",
              mr: 0.5,
              bgcolor: "rgba(255,255,255,0.1)",
              borderRadius: "10px",
              width: 40,
              height: 40,
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
            }}
            size="medium"
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.28)",
              boxShadow: "0 6px 14px rgba(0,0,0,0.16)",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <Box component="img" src={SunergyTechLogo} alt="SOLAMIO logo" sx={{ width: "100%", height: "100%", objectFit: "contain", p: 0.45 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                color: "#fff",
                fontWeight: 800,
                letterSpacing: "-0.01em",
                fontSize: "1rem",
                lineHeight: 1.05,
                whiteSpace: "nowrap",
              }}
            >
              SOLAMIO
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.78)",
                fontSize: "0.66rem",
                whiteSpace: "nowrap",
              }}
            >
              Solar Management
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: "rgba(255,255,255,0.8)",
            fontSize: "0.72rem",
            fontWeight: 500,
            bgcolor: "rgba(255,255,255,0.12)",
            px: 1.2,
            py: 0.5,
            borderRadius: "8px",
            letterSpacing: "0.02em",
            display: { xs: "none", sm: "block" },
          }}
        >
          {title}
        </Typography>

        <Avatar
          sx={{
            width: 34,
            height: 34,
            bgcolor: "rgba(255,255,255,0.22)",
            fontSize: "0.75rem",
            fontWeight: 700,
            border: "2px solid rgba(255,255,255,0.3)",
          }}
        >
          JD
        </Avatar>
      </Toolbar>
    </AppBar>
  );
};

// ─── Layout Wrapper ────────────────────────────────────────────────────────────
export const AppLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const [mobileOpen, setMobileOpen] = useState(false);

  const [isCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const s = localStorage.getItem("sidebarCollapsed");
    return s ? JSON.parse(s) : false;
  });

  const effectiveCollapsed = isCollapsed && !isMobile && !isTablet;
  const sidebarW = isMobile ? 0 : effectiveCollapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f6fb" }}>
      <MobileTopBar onMenuClick={() => setMobileOpen(true)} />

      <Sidebar
        open={mobileOpen}
        toggleDrawer={() => setMobileOpen(true)}
        onClose={() => setMobileOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flex: 1,
          ml: { xs: 0, sm: `${sidebarW}px` },
          mt: { xs: "60px", sm: 0 },
          minHeight: "100vh",
          transition: "margin-left 0.3s cubic-bezier(0.4,0,0.2,1)",
          overflow: "auto",
          pb: { xs: "env(safe-area-inset-bottom)", sm: 0 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Sidebar;

