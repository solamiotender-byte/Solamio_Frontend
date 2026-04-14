// layouts/MainLayout.jsx
import React, { useState, useEffect } from "react";
import { Box, useTheme, useMediaQuery, Fab, Tooltip } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import '../MainLayout.css';

const MainLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarWidth = 280;
  const collapsedWidth = 70;

  // Handle responsive behavior
  useEffect(() => {
    if (!isMobile) {
      setDrawerOpen(true);
      setMobileOpen(false);
    } else {
      setDrawerOpen(false);
      setMobileOpen(false);
    }
  }, [isMobile]);

  const toggleDrawer = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setDrawerOpen(!drawerOpen);
    }
  };

  const handleDrawerClose = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Calculate margin based on device and drawer state
  const getContentMargin = () => {
    if (isMobile) return 0;
    if (isTablet) {
      return drawerOpen ? `${sidebarWidth}px` : `${collapsedWidth}px`;
    }
    return drawerOpen ? `${sidebarWidth}px` : `${collapsedWidth}px`;
  };

  // Calculate width based on device and drawer state
  const getContentWidth = () => {
    if (isMobile) return "100%";
    if (isTablet) {
      return drawerOpen ? `calc(100% - ${sidebarWidth}px)` : `calc(100% - ${collapsedWidth}px)`;
    }
    return drawerOpen ? `calc(100% - ${sidebarWidth}px)` : `calc(100% - ${collapsedWidth}px)`;
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#f8f9fa",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Topbar Component */}
      <Topbar 
        toggleDrawer={toggleDrawer} 
        isMobile={isMobile} 
        isTablet={isTablet}
        drawerOpen={isMobile ? mobileOpen : drawerOpen}
        sidebarWidth={sidebarWidth}
        collapsedWidth={collapsedWidth}
      />
      
      {/* Sidebar Component */}
      <Sidebar
        open={isMobile ? mobileOpen : drawerOpen}
        toggleDrawer={toggleDrawer}
        onClose={handleDrawerClose}
        isMobile={isMobile}
        isTablet={isTablet}
      />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          minHeight: "100vh",
          transition: theme.transitions.create(["margin", "width"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: getContentMargin(),
          width: getContentWidth(),
          pt: {
            xs: "56px", // Mobile topbar height
            sm: "64px", // Tablet/Desktop topbar height
          },
          position: "relative",
          overflowY: "auto",
          overflowX: "hidden",
          height: "100vh",
          bgcolor: "#f8f9fa",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {/* Content Wrapper - Centered */}
        <Box
          className="main-content-wrapper"
          sx={{
            width: "100%",
            maxWidth: {
              xs: "100%",
              sm: "100%",
              md: "calc(100% - 32px)",
              lg: "1400px",
              xl: "1600px",
            },
            margin: "0 auto",
            px: {
              xs: 1,
              sm: 2,
              md: 3,
              lg: 4,
            },
            py: {
              xs: 1,
              sm: 2,
              md: 3,
            },
            boxSizing: "border-box",
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Mobile FAB for quick navigation when drawer is closed */}
      {isMobile && !mobileOpen && (
        <Tooltip title="Open Menu" arrow>
          <Fab
            color="primary"
            aria-label="menu"
            onClick={toggleDrawer}
            sx={{
              position: "fixed",
              bottom: 80,
              right: 16,
              zIndex: 1100,
              display: { xs: "flex", sm: "none" },
              bgcolor: "#4569ea",
              "&:hover": {
                bgcolor: "#3a5ac8",
              },
              boxShadow: "0 4px 12px rgba(69, 105, 234, 0.3)",
            }}
          >
            <MenuIcon />
          </Fab>
        </Tooltip>
      )}

      {/* Overlay for mobile when drawer is open */}
      {isMobile && mobileOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1199,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            transition: "all 0.3s ease",
            animation: "fadeIn 0.3s ease",
            "@keyframes fadeIn": {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
          }}
          onClick={handleDrawerClose}
        />
      )}
    </Box>
  );
};

export default MainLayout;
