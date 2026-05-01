// components/Topbar.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  alpha,
  Badge,
  InputBase,
  Divider,
  CircularProgress,
  SwipeableDrawer,
  Button,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Help as HelpIcon,
  Dashboard as DashboardIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/AuthContext";

const API = "https://solar-backend-29z1.onrender.com/api/v1";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  "";

const Topbar = ({ 
  toggleDrawer, 
  isMobile, 
  isTablet, 
  drawerOpen, 
  sidebarWidth = 280,
  collapsedWidth = 70 
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const { user, logout } = useAuth()
  //console.log("users11...", user)

  const fetchNotifications = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API}/notifications?limit=8`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;
      const payload = await res.json();
      const data = payload?.data || payload?.result || {};
      const list = data?.notifications || [];

      setNotifications(
        list.map((item) => ({
          id: item._id || item.id,
          title: item.title,
          message: item.message,
          time: item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN") : "Just now",
          read: Boolean(item.read),
          type: item.type || "general",
        }))
      );
    } catch (error) {
      console.error("Notification fetch failed:", error.message);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleProfileMenu = useCallback((event) => setAnchorEl(event.currentTarget), []);
  const handleNotificationMenu = useCallback((event) => setNotificationAnchor(event.currentTarget), []);
  const handleNotificationCenter = useCallback(() => {
    setNotificationAnchor(null);
    navigate('/notifications');
  }, [navigate]);
  
  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setNotificationAnchor(null);
  }, []);
  
  const handleLogout = useCallback(async () => {
    try {
      setLoggingOut(true);
      handleClose();
      // Add logout logic here
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }, [navigate, handleClose]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      if (isMobile) {
        setMobileSearchOpen(false);
      }
    }
  }, [navigate, searchQuery, isMobile]);

  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      const token = getToken();
      await fetch(`${API}/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error("Mark notification read failed:", error.message);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    const token = getToken();
    fetch(`${API}/notifications/read-all`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).catch((error) => console.error("Mark all read failed:", error.message));

    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  }, []);

  // User information
  const userInitials = useMemo(() => {
    if (!user) return 'U';
    return `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U';
  }, [user]);

  const displayName = useMemo(() => {
    if (!user) return 'Team';
    return user?.firstName || 'Team';
  }, [user]);

  const fullName = useMemo(() => {
    if (!user) return 'User';
    return `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';
  }, [user]);

  const userRole = useMemo(() => {
    if (!user?.role) return 'User';
    const roleMap = {
      'Head_office': 'Head Office',
      'ZSM': 'Zonal Manager',
      'ASM': 'Area Manager',
      'TEAM': 'Field Executive'
    };
    return roleMap[user.role] || user.role;
  }, [user]);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length
  , [notifications]);

  // Calculate AppBar width
  const getAppBarWidth = useMemo(() => {
    if (isMobile) return "100%";
    if (isTablet) {
      return drawerOpen ? `calc(100% - ${sidebarWidth}px)` : `calc(100% - ${collapsedWidth}px)`;
    }
    return drawerOpen ? `calc(100% - ${sidebarWidth}px)` : `calc(100% - ${collapsedWidth}px)`;
  }, [isMobile, isTablet, drawerOpen, sidebarWidth, collapsedWidth]);

  // Mobile Search Drawer
  const MobileSearchDrawer = (
    <SwipeableDrawer
      anchor="top"
      open={mobileSearchOpen}
      onClose={() => setMobileSearchOpen(false)}
      onOpen={() => setMobileSearchOpen(true)}
      sx={{
        '& .MuiDrawer-paper': {
          top: 0,
          width: '100%',
          height: 'auto',
          backgroundColor: '#ffffff',
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Tooltip title="Back" arrow>
            <IconButton onClick={() => setMobileSearchOpen(false)}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" fontWeight={600}>Search</Typography>
        </Box>
        <Paper
          component="form"
          onSubmit={handleSearch}
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1,
            bgcolor: '#f5f5f5',
            borderRadius: 2,
            border: '1px solid #e0e0e0',
          }}
        >
          <SearchIcon sx={{ color: '#999', mx: 1 }} />
          <InputBase
            placeholder="Search leads, customers, reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            fullWidth
            sx={{ fontSize: '0.95rem' }}
          />
          {searchQuery && (
            <Tooltip title="Clear Search" arrow>
              <IconButton size="small" onClick={() => setSearchQuery('')}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Paper>
        
        {/* Recent Searches */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="#666" gutterBottom>
            Recent Searches
          </Typography>
          {['John Doe', 'Loan Application', 'Bangalore Leads'].map((item, index) => (
            <MenuItem
              key={index}
              onClick={() => {
                setSearchQuery(item);
                handleSearch({ preventDefault: () => {} });
              }}
              sx={{ borderRadius: 1, my: 0.5 }}
            >
              <ListItemIcon>
                <SearchIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item} />
            </MenuItem>
          ))}
        </Box>
      </Box>
    </SwipeableDrawer>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
          width: getAppBarWidth,
          ml: isMobile ? 0 : (drawerOpen ? `${sidebarWidth}px` : `${collapsedWidth}px`),
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: 'all 0.3s ease',
        }}
      >
        <Toolbar sx={{
          justifyContent: 'space-between',
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 1.5, sm: 2, md: 3 },
        }}>
          {/* Left Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            {(isMobile || isTablet) && (
              <Tooltip title="Menu" arrow>
                <IconButton 
                  onClick={toggleDrawer} 
                  sx={{ 
                    color: '#4569ea',
                    '&:hover': { bgcolor: alpha('#4569ea', 0.1) },
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {/* Search Bar - Hidden on mobile */}
            {!isMobile && (
              <Box
                component="form"
                onSubmit={handleSearch}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  borderRadius: 2,
                  px: 2,
                  py: 0.5,
                  width: { sm: 250, md: 300 },
                  ml: { sm: 2, md: 4 },
                  border: '1px solid #e0e0e0',
                  '&:hover': { bgcolor: '#f0f0f0' },
                  '&:focus-within': {
                    borderColor: '#4569ea',
                    boxShadow: `0 0 0 2px ${alpha('#4569ea', 0.2)}`,
                  },
                }}
              >
                <SearchIcon sx={{ color: '#999', mr: 1, fontSize: 20 }} />
                <InputBase
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    flex: 1,
                    fontSize: '0.9rem',
                    '& input::placeholder': { color: '#999', opacity: 1 },
                  }}
                />
              </Box>
            )}
          </Box>

          {/* Right Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            {/* Mobile Search Icon */}
            {isMobile && (
              <Tooltip title="Search" arrow>
                <IconButton
                  sx={{
                    color: '#666',
                    '&:hover': { bgcolor: alpha('#4569ea', 0.05) },
                  }}
                  onClick={() => setMobileSearchOpen(true)}
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Notifications" arrow>
              <IconButton
                onClick={handleNotificationMenu}
                sx={{
                  color: '#4569ea',
                  border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff',
                  '&:hover': { bgcolor: alpha('#4569ea', 0.06) },
                }}
              >
                <Badge badgeContent={unreadCount} color="error" overlap="circular">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User Profile */}
            <Tooltip title="Profile" arrow>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: '8px',
                  '&:hover': { bgcolor: alpha('#4569ea', 0.05) },
                }}
                onClick={handleProfileMenu}
              >
                <Avatar
                  src={user?.avatar}
                  sx={{
                    bgcolor: user?.avatar ? 'transparent' : '#4569ea',
                    width: { xs: 32, sm: 36 },
                    height: { xs: 32, sm: 36 },
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    fontWeight: 600,
                    color: '#ffffff',
                  }}
                >
                  {!user?.avatar && userInitials}
                </Avatar>
                {!isMobile && (
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <Typography 
                      fontSize="0.9rem"
                      fontWeight={500}
                      color="#333333"
                      sx={{ lineHeight: 1.2 }}
                    >
                      {displayName}
                    </Typography>
                    <Typography 
                      fontSize="0.75rem" 
                      color="#666666"
                      sx={{ lineHeight: 1.2 }}
                    >
                      {userRole}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Tooltip>
          </Box>
        </Toolbar>

        {/* Mobile Bottom Border Indicator */}
        {isMobile && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_LIGHT} 100%)`,
            }}
          />
        )}
      </AppBar>
       
      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ 
          sx: { 
            width: { xs: '100%', sm: 280 },
            maxWidth: { xs: '100%', sm: 280 },
            mt: 1,
            borderRadius: { xs: 0, sm: '8px' },
            border: { xs: 'none', sm: '1px solid #e0e0e0' },
            boxShadow: { xs: 'none', sm: '0 4px 12px rgba(0, 0, 0, 0.08)' },
            position: { xs: 'fixed', sm: 'absolute' },
            top: { xs: '56px', sm: 'auto' },
            left: { xs: 0, sm: 'auto' },
            right: { xs: 0, sm: 'auto' },
          } 
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={user?.avatar}
              sx={{
                bgcolor: user?.avatar ? 'transparent' : '#4569ea',
                color: '#ffffff',
                width: 48,
                height: 48,
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              {!user?.avatar && userInitials}
            </Avatar>
            <Box>
              <Typography fontWeight={600} fontSize="0.95rem" color="#333333">
                {fullName}
              </Typography>
              <Typography fontSize="0.8rem" color="#666666" mb={0.5}>
                {userRole}
              </Typography>
              <Typography fontSize="0.75rem" color="#999">
                {user?.email || ''}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* Menu Items */}
        <Box sx={{ py: 0.5 }}>
          <MenuItem 
            onClick={handleLogout} 
            sx={{ 
              color: '#ff4444',
              '&:hover': { bgcolor: alpha('#ff4444', 0.05) }
            }}
            disabled={loggingOut}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              {loggingOut ? <CircularProgress size={20} color="inherit" /> : <LogoutIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText 
              primary={loggingOut ? "Logging out..." : "Logout"} 
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </MenuItem>
        </Box>
      </Menu>

      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: { xs: 'calc(100vw - 24px)', sm: 360 },
            maxWidth: 360,
            mt: 1,
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.14)',
            overflow: 'hidden',
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography fontWeight={700} fontSize="0.95rem" color="#0f172a">
              Notifications
            </Typography>
            <Typography fontSize="0.76rem" color="#64748b">
              {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up'}
            </Typography>
          </Box>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllAsRead} sx={{ color: '#4569ea', fontWeight: 700 }}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />
        <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
              <NotificationsIcon sx={{ color: '#cbd5e1', fontSize: 28, mb: 1 }} />
              <Typography fontSize="0.88rem" fontWeight={600} color="#334155">
                No notifications yet
              </Typography>
              <Typography fontSize="0.78rem" color="#94a3b8">
                New alerts will appear here.
              </Typography>
            </Box>
          ) : (
            notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleMarkAsRead(notification.id)}
                sx={{
                  alignItems: 'flex-start',
                  gap: 1.25,
                  px: 2,
                  py: 1.5,
                  whiteSpace: 'normal',
                  bgcolor: notification.read ? '#ffffff' : alpha('#4569ea', 0.045),
                  borderLeft: notification.read ? '3px solid transparent' : '3px solid #4569ea',
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mt: 0.35, color: notification.read ? '#94a3b8' : '#4569ea' }}>
                  <NotificationsIcon fontSize="small" />
                </ListItemIcon>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontSize="0.85rem" fontWeight={700} color="#0f172a" sx={{ mb: 0.25 }}>
                    {notification.title}
                  </Typography>
                  <Typography fontSize="0.78rem" color="#475569" sx={{ lineHeight: 1.5 }}>
                    {notification.message}
                  </Typography>
                  <Typography fontSize="0.72rem" color="#94a3b8" sx={{ mt: 0.6 }}>
                    {notification.time}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Box>
        <Divider />
        <Box sx={{ p: 1.25 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleNotificationCenter}
            sx={{
              bgcolor: '#4569ea',
              borderRadius: 2.5,
              fontWeight: 700,
              '&:hover': { bgcolor: '#3a5ac8' },
            }}
          >
            View All Notifications
          </Button>
        </Box>
      </Menu>

      {/* Mobile Search Drawer */}
      {MobileSearchDrawer}

      {/* Spacer for fixed AppBar */}
      <Box sx={{ height: { xs: 56, sm: 64 } }} />
    </>
  );
};

// Color constants for mobile border
const PRIMARY_COLOR = "#4569ea";
const PRIMARY_LIGHT = "#5c7cec";

export default Topbar;
