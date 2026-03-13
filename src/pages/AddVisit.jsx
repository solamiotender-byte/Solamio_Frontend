// components/VisitDetails.jsx — Fixed: uses native geolocation, no AuthContext location deps
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Grid, Stack,
  IconButton, LinearProgress, Alert, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  useTheme, useMediaQuery, Fade, Zoom, Slide, Card, CardContent,
  InputAdornment, FormHelperText, BottomNavigation, BottomNavigationAction,
  Fab, Badge, FormControlLabel, Radio, RadioGroup, FormControl,
} from '@mui/material';
import {
  AddAPhoto, PhotoCamera, Route, LocationOn, AccessTime,
  Cancel, GpsFixed, CheckCircle, ArrowBack, Business, Notes,
  Person, Phone, Email, Save, MyLocation, GpsOff, Wifi, WifiOff,
  Dashboard, History, CameraAlt, Delete, Refresh, Fullscreen,
  Close, PersonAdd,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:9001/api/v1';
const PRIMARY   = '#4569ea';
const SECONDARY = '#1a237e';
const SUCCESS   = '#4caf50';
const ERROR_COL = '#f44336';
const WARNING   = '#ff9800';

// ─── API helper ───────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('authToken') ||
  localStorage.getItem('accessToken') || '';

// ─── Styled components ────────────────────────────────────────────────────────
const UploadArea = styled(Box)(({ theme }) => ({
  border: `2px dashed ${alpha(PRIMARY, 0.3)}`,
  borderRadius: 16,
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s',
  backgroundColor: alpha(PRIMARY, 0.02),
  minHeight: 200,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    borderColor: PRIMARY,
    backgroundColor: alpha(PRIMARY, 0.05),
    transform: 'scale(1.02)',
  },
}));

const FormSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: 16,
  backgroundColor: '#fff',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('sm')]: { padding: theme.spacing(2) },
}));

const ImagePreview = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: 250,
  borderRadius: 16,
  overflow: 'hidden',
  '& img': { width: '100%', height: '100%', objectFit: 'cover' },
  '& .overlay': {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: theme.spacing(2),
    opacity: 0,
    transition: 'opacity 0.2s',
    [theme.breakpoints.down('sm')]: { opacity: 1 },
    '&:hover': { opacity: 1 },
  },
}));

// ─── Accuracy helpers ─────────────────────────────────────────────────────────
const accuracyLevel = (acc) => {
  if (!acc) return 'unknown';
  if (acc <= 20) return 'good';
  if (acc <= 50) return 'fair';
  return 'poor';
};

const accuracyColor = (level) =>
  ({ good: SUCCESS, fair: WARNING, poor: ERROR_COL, unknown: '#94a3b8' }[level]);

// ─── Success Dialog ───────────────────────────────────────────────────────────
const SuccessDialog = ({ open, visitData, onClose }) => {
  const navigate = useNavigate();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open} onClose={onClose} maxWidth="sm" fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4 } }}
      TransitionComponent={isMobile ? Slide : Zoom}
      transitionDuration={300}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
        <Zoom in={open}>
          <Box sx={{
            width: 80, height: 80, borderRadius: '50%',
            bgcolor: alpha(SUCCESS, 0.1),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2,
          }}>
            <CheckCircle sx={{ fontSize: 48, color: SUCCESS }} />
          </Box>
        </Zoom>
        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={800}>
          Visit Created Successfully!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Your visit has been recorded and synced
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
            {visitData?.photos?.[0]?.url && (
              <Box component="img" src={visitData.photos[0].url} alt="Visit"
                sx={{ width: '100%', height: 200, objectFit: 'cover' }} />
            )}
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {visitData?.locationName}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, bgcolor: alpha(PRIMARY, 0.05), borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Latitude</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {visitData?.coordinates?.lat?.toFixed(6)}°
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, bgcolor: alpha(PRIMARY, 0.05), borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Longitude</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {visitData?.coordinates?.lng?.toFixed(6)}°
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              {visitData?.distanceFromPreviousKm > 0 && (
                <Chip icon={<Route />}
                  label={`${visitData.distanceFromPreviousKm.toFixed(2)} km from previous`}
                  size="small" sx={{ mt: 2 }} />
              )}
            </CardContent>
          </Card>
        </Stack>
      </DialogContent>

      <DialogActions sx={{
        p: 3, justifyContent: 'center', gap: 2,
        flexDirection: isMobile ? 'column' : 'row',
      }}>
        <Button fullWidth={isMobile} variant="outlined" onClick={onClose}
          sx={{ borderRadius: 2, px: 4, borderColor: PRIMARY, color: PRIMARY }}>
          Close
        </Button>
        <Button fullWidth={isMobile} variant="contained"
          onClick={() => { onClose(); navigate('/total-visits'); }}
          sx={{ borderRadius: 2, px: 4, bgcolor: PRIMARY, '&:hover': { bgcolor: SECONDARY } }}>
          View All Visits
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VisitDetails({ onClose, onSave }) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const cameraInputRef    = useRef(null);
  const locationWatchRef  = useRef(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [loading,          setLoading]          = useState(false);
  const [location,         setLocation]         = useState(null);
  const [locationLoading,  setLocationLoading]  = useState(true);
  const [locationAttempts, setLocationAttempts] = useState(0);
  const [imageFile,        setImageFile]        = useState(null);
  const [preview,          setPreview]          = useState(null);
  const [formData,         setFormData]         = useState({
    locationName: '', remarks: '', contactPerson: '', phone: '', email: '',
  });
  const [isLeadCreated,    setIsLeadCreated]    = useState('no');
  const [error,            setError]            = useState(null);
  const [success,          setSuccess]          = useState(false);
  const [createdVisit,     setCreatedVisit]     = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [bottomNav,        setBottomNav]        = useState(0);
  const [fullscreenImage,  setFullscreenImage]  = useState(false);
  const [isOnline,         setIsOnline]         = useState(navigator.onLine);

  // ── Online/offline listener ───────────────────────────────────────────────
  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ── Geolocation (native browser API) ─────────────────────────────────────
  const getCurrentLocation = useCallback((highAccuracy = true, attempt = 0) => {
    setLocationLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat:      pos.coords.latitude,
          lng:      pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocationAttempts(0);
        setLocationLoading(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);

        // Timeout → retry with low accuracy
        if (err.code === err.TIMEOUT || err.code === 3) {
          if (highAccuracy && attempt < 1) {
            setError('High accuracy timeout, retrying with low accuracy…');
            setLocationAttempts(attempt + 1);
            setTimeout(() => getCurrentLocation(false, attempt + 1), 1000);
            return;
          }
          if (attempt < 2) {
            setError(`Location timeout — retrying (${attempt + 1}/3)…`);
            setLocationAttempts(attempt + 1);
            setTimeout(() => getCurrentLocation(highAccuracy, attempt + 1), 2000);
            return;
          }
        }

        // Permission denied
        if (err.code === err.PERMISSION_DENIED || err.code === 1) {
          setError('Location permission denied. Please enable GPS and try again.');
        } else {
          setError(err.message || 'Failed to get location');
        }
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout:            15000,
        maximumAge:         0,
      }
    );
  }, []);

  // Initial location fetch
  useEffect(() => {
    getCurrentLocation();
    return () => {
      if (locationWatchRef.current) navigator.geolocation.clearWatch(locationWatchRef.current);
    };
  }, []);

  // ── Camera ─────────────────────────────────────────────────────────────────
  const handleCameraCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10 MB'); return; }
    if (!file.type.startsWith('image/')) { setError('Please capture a valid image'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setImageFile(null);
    setPreview(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // ── Form helpers ───────────────────────────────────────────────────────────
  const handleChange = (field) => (e) => {
    setFormData(p => ({ ...p, [field]: e.target.value }));
    if (validationErrors[field]) setValidationErrors(p => ({ ...p, [field]: '' }));
  };

  const handleLeadToggle = (e) => {
    setIsLeadCreated(e.target.value);
    if (e.target.value === 'no') {
      setFormData(p => ({ ...p, contactPerson: '', phone: '', email: '' }));
    }
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errors = {};
    if (!imageFile)                    errors.photo        = 'Please capture a photo';
    if (!formData.locationName.trim()) errors.locationName = 'Location name is required';
    if (!location)                     errors.location     = 'Location coordinates are required';
    if (isLeadCreated === 'yes') {
      if (!formData.contactPerson.trim()) errors.contactPerson = 'Contact person is required';
      if (formData.phone && !/^[0-9+\-\s()]{10,15}$/.test(formData.phone))
        errors.phone = 'Please enter a valid phone number';
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        errors.email = 'Please enter a valid email';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) { setError('Please fill all required fields correctly'); return; }

    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('latitude',       location.lat.toString());
      fd.append('longitude',      location.lng.toString());
      fd.append('locationName',   formData.locationName.trim());
      fd.append('isLeadCreated',  isLeadCreated);
      if (formData.remarks.trim())         fd.append('remarks',       formData.remarks.trim());
      if (isLeadCreated === 'yes') {
        if (formData.contactPerson.trim()) fd.append('contactPerson', formData.contactPerson.trim());
        if (formData.phone.trim())         fd.append('phone',         formData.phone.trim());
        if (formData.email.trim())         fd.append('email',         formData.email.trim());
      }
      fd.append('photos', imageFile);

      const res = await fetch(`${BASE_URL}/visit/create`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body:    fd,
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);

      const visitData = json.data || json;
      setCreatedVisit(visitData);
      setSuccess(true);
      if (onSave) onSave(visitData);

      // Reset form
      setImageFile(null);
      setPreview(null);
      setFormData({ locationName: '', remarks: '', contactPerson: '', phone: '', email: '' });
      setIsLeadCreated('no');

    } catch (err) {
      console.error('Visit creation error:', err);
      setError(err.message || 'Failed to create visit');
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const accLevel  = accuracyLevel(location?.accuracy);
  const accColor  = accuracyColor(accLevel);
  const canSubmit = !loading && !!location && !!imageFile && !!formData.locationName.trim();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: isMobile ? 8 : 4 }}>

      {/* Hidden camera input */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
        onChange={handleCameraCapture} style={{ display: 'none' }} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Paper sx={{
        p: isMobile ? 2 : 3, borderRadius: 0,
        background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
        color: 'white', position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)', mb: 3,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => onClose ? onClose() : navigate(-1)} sx={{ color: 'white' }}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700}>Create New Visit</Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </Typography>
            </Box>
          </Box>

          {/* Online status */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            px: 1.5, py: 0.5, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2,
          }}>
            {isOnline
              ? <><Wifi sx={{ fontSize: 16 }} /><Typography variant="caption">Connected</Typography></>
              : <><WifiOff sx={{ fontSize: 16 }} /><Typography variant="caption">Offline</Typography></>}
          </Box>
        </Box>
      </Paper>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <Box sx={{ px: isMobile ? 2 : 3, maxWidth: 1200, mx: 'auto' }}>
        <Grid container spacing={isMobile ? 2 : 3}>

          {/* Left column */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>

              {/* Camera section */}
              <FormSection>
                <Typography variant="subtitle1" fontWeight={700}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, color: PRIMARY, mb: 2 }}>
                  <CameraAlt /> Site Photo
                  <Chip label="Required" size="small"
                    color={imageFile ? 'success' : 'error'} sx={{ ml: 'auto', height: 24 }} />
                </Typography>

                <AnimatePresence mode="wait">
                  {preview ? (
                    <motion.div key="preview" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                      <ImagePreview>
                        <img src={preview} alt="Preview" onClick={() => setFullscreenImage(true)} />
                        <Box className="overlay">
                          <Button size="small" variant="contained" startIcon={<Fullscreen />}
                            onClick={() => setFullscreenImage(true)}
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(5px)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                            View
                          </Button>
                          <IconButton onClick={handleRemovePhoto}
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(5px)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                            <Delete />
                          </IconButton>
                        </Box>
                      </ImagePreview>
                    </motion.div>
                  ) : (
                    <motion.div key="upload" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                      <UploadArea onClick={() => cameraInputRef.current?.click()} role="button" tabIndex={0}>
                        <CameraAlt sx={{ fontSize: isMobile ? 40 : 48, color: alpha(PRIMARY, 0.5), mb: 2 }} />
                        <Typography variant={isMobile ? 'body1' : 'h6'} fontWeight={600} color={PRIMARY}>
                          Tap to open camera
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                          Take a photo of the site · Max 10 MB
                        </Typography>
                        <Button variant="contained" size={isMobile ? 'small' : 'medium'} startIcon={<PhotoCamera />}
                          onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                          sx={{ mt: 2, borderRadius: 2, bgcolor: PRIMARY, '&:hover': { bgcolor: SECONDARY } }}>
                          Open Camera
                        </Button>
                      </UploadArea>
                    </motion.div>
                  )}
                </AnimatePresence>

                {validationErrors.photo && (
                  <FormHelperText error sx={{ mt: 1 }}>{validationErrors.photo}</FormHelperText>
                )}
              </FormSection>

              {/* Location name */}
              <FormSection>
                <Typography variant="subtitle1" fontWeight={700}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, color: PRIMARY, mb: 2 }}>
                  <Business /> Location Details
                </Typography>
                <TextField fullWidth label="Location / Business Name *"
                  placeholder="e.g., Client Office, Store Name"
                  value={formData.locationName} onChange={handleChange('locationName')}
                  error={!!validationErrors.locationName} helperText={validationErrors.locationName}
                  disabled={loading} size={isMobile ? 'small' : 'medium'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ color: alpha(PRIMARY, 0.5) }} />
                      </InputAdornment>
                    ),
                  }} />
              </FormSection>
            </Stack>
          </Grid>

          {/* Right column */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>

              {/* Lead toggle */}
              <FormSection>
                <Typography variant="subtitle1" fontWeight={700}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, color: PRIMARY, mb: 2 }}>
                  <PersonAdd /> Lead Created?
                </Typography>
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup row value={isLeadCreated} onChange={handleLeadToggle}
                    sx={{ justifyContent: 'space-around', bgcolor: alpha(PRIMARY, 0.05), borderRadius: 2, p: 1 }}>
                    <FormControlLabel value="yes" control={<Radio sx={{ color: PRIMARY }} />} label="Yes" />
                    <FormControlLabel value="no"  control={<Radio sx={{ color: PRIMARY }} />} label="No"  />
                  </RadioGroup>
                </FormControl>
              </FormSection>

              {/* Contact info — only if lead created */}
              {isLeadCreated === 'yes' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <FormSection>
                    <Typography variant="subtitle1" fontWeight={700}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, color: PRIMARY, mb: 2 }}>
                      <Person /> Contact Information
                      <Chip label="Lead Created" size="small" color="success" sx={{ ml: 'auto', height: 24 }} />
                    </Typography>
                    <Stack spacing={2}>
                      <TextField fullWidth label="Contact Person *" placeholder="Enter contact name"
                        value={formData.contactPerson} onChange={handleChange('contactPerson')}
                        error={!!validationErrors.contactPerson} helperText={validationErrors.contactPerson}
                        disabled={loading} size={isMobile ? 'small' : 'medium'}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: alpha(PRIMARY, 0.5) }} /></InputAdornment> }} />
                      <TextField fullWidth label="Phone Number" placeholder="Enter phone number"
                        value={formData.phone} onChange={handleChange('phone')}
                        error={!!validationErrors.phone} helperText={validationErrors.phone}
                        disabled={loading} size={isMobile ? 'small' : 'medium'}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: alpha(PRIMARY, 0.5) }} /></InputAdornment> }} />
                      <TextField fullWidth label="Email Address" placeholder="Enter email" type="email"
                        value={formData.email} onChange={handleChange('email')}
                        error={!!validationErrors.email} helperText={validationErrors.email}
                        disabled={loading} size={isMobile ? 'small' : 'medium'}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: alpha(PRIMARY, 0.5) }} /></InputAdornment> }} />
                    </Stack>
                  </FormSection>
                </motion.div>
              )}

              {/* GPS status */}
              <FormSection>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, color: PRIMARY }}>
                    <GpsFixed /> Location Coordinates
                  </Typography>
                  <Button size="small" startIcon={<Refresh />}
                    onClick={() => getCurrentLocation()} disabled={locationLoading}
                    sx={{ color: PRIMARY, width: isMobile ? '100%' : 'auto' }}>
                    Refresh
                  </Button>
                </Box>

                {locationLoading ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={isMobile ? 32 : 40} sx={{ color: PRIMARY, mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      {locationAttempts > 0 ? `Attempt ${locationAttempts}/3…` : 'Getting your location…'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Please ensure GPS is enabled
                    </Typography>
                    {locationAttempts > 0 && (
                      <LinearProgress sx={{ mt: 2, borderRadius: 2 }} variant="determinate"
                        value={Math.min(locationAttempts * 33, 99)} />
                    )}
                  </Box>
                ) : location ? (
                  <Paper sx={{
                    p: 2, borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(accColor, 0.1)}, #fff)`,
                    border: `1px solid ${alpha(accColor, 0.3)}`,
                  }}>
                    <Stack spacing={2}>
                      {/* Accuracy row */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {accLevel === 'good'    && <GpsFixed   sx={{ color: SUCCESS  }} />}
                          {accLevel === 'fair'    && <MyLocation sx={{ color: WARNING  }} />}
                          {accLevel === 'poor'    && <GpsOff     sx={{ color: ERROR_COL }} />}
                          {accLevel === 'unknown' && <LocationOn  sx={{ color: '#94a3b8' }} />}
                          <Typography variant="body2">Accuracy: ±{location.accuracy?.toFixed(0)}m</Typography>
                        </Box>
                        <Chip label={accLevel.toUpperCase()} size="small"
                          sx={{ bgcolor: alpha(accColor, 0.1), color: accColor, fontWeight: 600, height: 24 }} />
                      </Box>

                      {/* Coords display */}
                      <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Current Position</Typography>
                        <Typography variant="body2" fontFamily="monospace" fontWeight={600}
                          sx={{ fontSize: isMobile ? '0.8rem' : '0.9rem', wordBreak: 'break-all', mt: 0.5 }}>
                          {location.lat.toFixed(6)}° N, {location.lng.toFixed(6)}° E
                        </Typography>
                      </Box>

                      <Grid container spacing={isMobile ? 1 : 2}>
                        {[
                          { label: 'Latitude',  value: `${location.lat.toFixed(6)}°` },
                          { label: 'Longitude', value: `${location.lng.toFixed(6)}°` },
                        ].map(({ label, value }) => (
                          <Grid item xs={6} key={label}>
                            <Paper sx={{ p: 1.5, bgcolor: alpha(PRIMARY, 0.05), borderRadius: 2 }}>
                              <Typography variant="caption" color="text.secondary">{label}</Typography>
                              <Typography variant="body2" fontWeight={600}
                                sx={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>{value}</Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Stack>
                  </Paper>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <GpsOff sx={{ fontSize: 48, color: ERROR_COL, mb: 2 }} />
                    <Typography color="error" gutterBottom>{error || 'Failed to get location'}</Typography>
                    <Button variant="contained" onClick={() => getCurrentLocation()} fullWidth={isMobile}
                      sx={{ mt: 2, borderRadius: 2, bgcolor: PRIMARY, '&:hover': { bgcolor: SECONDARY } }}>
                      Retry Location
                    </Button>
                  </Box>
                )}
                {validationErrors.location && (
                  <FormHelperText error sx={{ mt: 1 }}>{validationErrors.location}</FormHelperText>
                )}
              </FormSection>

              {/* Remarks */}
              <FormSection>
                <Typography variant="subtitle1" fontWeight={700}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, color: PRIMARY, mb: 2 }}>
                  <Notes /> Visit Notes
                </Typography>
                <TextField fullWidth multiline rows={isMobile ? 3 : 4}
                  placeholder="Enter any additional notes about the visit…"
                  value={formData.remarks} onChange={handleChange('remarks')} disabled={loading}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'action.hover' } }} />
              </FormSection>
            </Stack>
          </Grid>
        </Grid>

        {/* Error alert */}
        <AnimatePresence>
          {error && !locationLoading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Alert severity={error.includes('timeout') ? 'warning' : 'error'}
                sx={{ mt: 3, borderRadius: 2 }} onClose={() => setError(null)}
                action={
                  error.toLowerCase().includes('location') && (
                    <Button color="inherit" size="small" onClick={() => getCurrentLocation()}>Retry</Button>
                  )
                }>
                {error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, mb: isMobile ? 2 : 0, flexDirection: isMobile ? 'column' : 'row' }}>
          <Button fullWidth={isMobile} variant="outlined"
            onClick={() => onClose ? onClose() : navigate(-1)} disabled={loading}
            sx={{ px: 4, py: 1.5, borderRadius: 2, borderColor: PRIMARY, color: PRIMARY,
              '&:hover': { bgcolor: alpha(PRIMARY, 0.05) }, order: isMobile ? 2 : 1 }}>
            Cancel
          </Button>
          <Button fullWidth={isMobile} variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={handleSubmit} disabled={!canSubmit}
            sx={{ px: 4, py: 1.5, borderRadius: 2, bgcolor: PRIMARY,
              '&:hover': { bgcolor: SECONDARY },
              '&.Mui-disabled': { bgcolor: alpha(PRIMARY, 0.3) },
              order: isMobile ? 1 : 2 }}>
            {loading ? 'Creating Visit…' : 'Create Visit'}
          </Button>
        </Box>
      </Box>

      {/* Success dialog */}
      <SuccessDialog open={success} visitData={createdVisit}
        onClose={() => { setSuccess(false); onClose?.(); }} />

      {/* Fullscreen image */}
      <Dialog open={fullscreenImage} onClose={() => setFullscreenImage(false)}
        maxWidth="lg" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { bgcolor: 'black', borderRadius: isMobile ? 0 : 2 } }}>
        <DialogContent sx={{ p: 0, position: 'relative', height: isMobile ? '100vh' : 'auto' }}>
          <IconButton onClick={() => setFullscreenImage(false)}
            sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'rgba(255,255,255,0.2)', color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, zIndex: 1 }}>
            <Close />
          </IconButton>
          <Box component="img" src={preview} alt="Full preview"
            sx={{ width: '100%', height: isMobile ? '100%' : 'auto', objectFit: 'contain' }} />
        </DialogContent>
      </Dialog>

      {/* Bottom nav (mobile) */}
      {isMobile && (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, borderRadius: 0 }} elevation={3}>
          <BottomNavigation showLabels value={bottomNav} onChange={(_, v) => setBottomNav(v)}
            sx={{ height: 64,
              '& .MuiBottomNavigationAction-root': { color: 'text.secondary', '&.Mui-selected': { color: PRIMARY } },
            }}>
            <BottomNavigationAction label="Dashboard" icon={<Dashboard />} onClick={() => navigate('/dashboard')} />
            <BottomNavigationAction label="Visits"    icon={<History />}   onClick={() => navigate('/total-visits')} />
            <BottomNavigationAction label="New Visit" icon={<AddAPhoto />} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          </BottomNavigation>
        </Paper>
      )}

      {/* FAB — refresh location */}
      {isMobile && (
        <Zoom in>
          <Fab color="primary" aria-label="refresh location" onClick={() => getCurrentLocation()}
            disabled={locationLoading}
            sx={{ position: 'fixed', bottom: 80, right: 16, zIndex: 1000,
              bgcolor: PRIMARY, '&:hover': { bgcolor: SECONDARY },
              boxShadow: `0 4px 12px ${alpha(PRIMARY, 0.3)}` }}>
            <Badge variant="dot" color={location ? 'success' : 'error'} overlap="circular">
              <MyLocation />
            </Badge>
          </Fab>
        </Zoom>
      )}
    </Box>
  );
}