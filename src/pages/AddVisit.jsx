// components/VisitDetails.jsx
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

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE_URL  = 'https://solar-backend-1-4szm.onrender.com/api/v1';
const PRIMARY   = '#4569ea';
const SECONDARY = '#1a237e';
const SUCCESS   = '#4caf50';
const ERROR_COL = '#f44336';
const WARNING   = '#ff9800';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

const getToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('authToken') ||
  localStorage.getItem('accessToken') || '';

// ─── Haversine distance (km) — defined at module level, reused anywhere ───────
const GKEY = 'AIzaSyCqM7uF9c0ZMQjdssHqSMJJ3mBcmz5RNS0';

async function getRoadDistanceKm(lat1, lng1, lat2, lng2) {
  try {
    const res  = await fetch(
      `${BASE_URL}/location/route-distance?originLat=${lat1}&originLng=${lng1}&destLat=${lat2}&destLng=${lng2}`,
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    const data = await res.json();
    if (data?.distanceKm != null) return data.distanceKm;
    console.warn('[Distance] route-distance API returned:', data);
    return 0;
  } catch (e) {
    console.warn('[Distance] getRoadDistanceKm failed:', e.message);
    return 0;
  }
}

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
  overflow: 'hidden',
  isolation: 'isolate',
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

function FlyToLocation({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], 17, { duration: 1.2 });
  }, [coords, map]);
  return null;
}

// ─── Success Dialog ───────────────────────────────────────────────────────────
const SuccessDialog = ({ open, visitData, onClose }) => {
  const navigate = useNavigate();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4 } }}
      TransitionComponent={isMobile ? Slide : Zoom} transitionDuration={300}>
      <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
        <Zoom in={open}>
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: alpha(SUCCESS, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <CheckCircle sx={{ fontSize: 48, color: SUCCESS }} />
          </Box>
        </Zoom>
        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={800}>Visit Created Successfully!</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Your visit has been recorded and synced</Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
            {visitData?.photos?.[0]?.url && (
              <Box component="img" src={visitData.photos[0].url} alt="Visit" sx={{ width: '100%', height: 200, objectFit: 'cover' }} />
            )}
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>{visitData?.locationName}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, bgcolor: alpha(PRIMARY, 0.05), borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Latitude</Typography>
                    <Typography variant="body2" fontWeight={600}>{visitData?.coordinates?.lat?.toFixed(6)}°</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, bgcolor: alpha(PRIMARY, 0.05), borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Longitude</Typography>
                    <Typography variant="body2" fontWeight={600}>{visitData?.coordinates?.lng?.toFixed(6)}°</Typography>
                  </Paper>
                </Grid>
              </Grid>
              {visitData?.distanceFromPreviousKm > 0 && (
                <Chip
                  icon={<Route />}
                  label={`${Number(visitData.distanceFromPreviousKm).toFixed(2)} km from previous location`}
                  size="small"
                  sx={{ mt: 2, bgcolor: alpha(PRIMARY, 0.08), color: PRIMARY, fontWeight: 700 }}
                />
              )}
            </CardContent>
          </Card>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
        <Button fullWidth={isMobile} variant="outlined" onClick={onClose} sx={{ borderRadius: 2, px: 4, borderColor: PRIMARY, color: PRIMARY }}>Close</Button>
        <Button fullWidth={isMobile} variant="contained" onClick={() => { onClose(); navigate('/total-visits'); }}
          sx={{ borderRadius: 2, px: 4, bgcolor: PRIMARY, '&:hover': { bgcolor: SECONDARY } }}>View All Visits</Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VisitDetails({ onClose, onSave }) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const cameraInputRef = useRef(null);

  const [loading,          setLoading]          = useState(false);
  const [location,         setLocation]         = useState(null);
  const [locationLoading,  setLocationLoading]  = useState(true);
  const [locationAttempts, setLocationAttempts] = useState(0);
  const [geocoding,        setGeocoding]        = useState(false);
  const [imageFile,        setImageFile]        = useState(null);
  const [preview,          setPreview]          = useState(null);
  const [formData,         setFormData]         = useState({
    locationName: '', remarks: '', contactPerson: '', phone: '', email: '',
  });

  // ── Previous location for distance chain A→B→C→D ─────────────────────────
  const [prevLocation, setPrevLocation] = useState(null); // { lat, lng, label }
const [roadDistanceKm,      setRoadDistanceKm]      = useState(null);
const [roadDistanceLoading, setRoadDistanceLoading] = useState(false);
  // 'yes' | 'no' | 'other'
  const [isLeadCreated,    setIsLeadCreated]    = useState('no');

  const [error,            setError]            = useState(null);
  const [success,          setSuccess]          = useState(false);
  const [createdVisit,     setCreatedVisit]     = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [bottomNav,        setBottomNav]        = useState(0);
  const [fullscreenImage,  setFullscreenImage]  = useState(false);
  const [isOnline,         setIsOnline]         = useState(navigator.onLine);

  // autocomplete
  const [suggestions,     setSuggestions]     = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingLeads,  setSearchingLeads]  = useState(false);

  // punch-in
  const [punchInAddress, setPunchInAddress] = useState(null);
  const [punchInTime,    setPunchInTime]    = useState(null);
  // store punch-in coords so fetchPrevLocation can fall back to them
  const [punchInCoords,  setPunchInCoords]  = useState(null);

  // ── online listener ───────────────────────────────────────────────────────
  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);



useEffect(() => {
  if (!prevLocation || !location) { setRoadDistanceKm(null); return; }
  let cancelled = false;
  setRoadDistanceLoading(true);
  getRoadDistanceKm(prevLocation.lat, prevLocation.lng, location.lat, location.lng)
    .then(km => { if (!cancelled) setRoadDistanceKm(km); })
    .finally(() => { if (!cancelled) setRoadDistanceLoading(false); });
  return () => { cancelled = true; };
}, [prevLocation, location]);
  // ── Punch-in fetch — also saves coords for distance fallback ─────────────
  useEffect(() => {
    const fetchPunchIn = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res   = await fetch(
          `${BASE_URL}/attendance?startDate=${today}&endDate=${today}&limit=1`,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        if (!res.ok) return;
        const data = await res.json();
        const list = data?.data?.attendances || data?.result?.attendances || data?.data || [];
        const att  = Array.isArray(list) ? list[0] : list;
        if (att?.punchIn?.time && !att?.punchOut?.time) {
          const addr = att.punchIn?.address;
          setPunchInAddress(typeof addr === 'string' ? addr : addr?.full || addr?.short || null);
          setPunchInTime(att.punchIn.time);

          // ✅ Save punch-in coords — used as fallback "previous" location
          const piLat = att.punchIn?.latitude  ?? att.punchIn?.lat;
          const piLng = att.punchIn?.longitude ?? att.punchIn?.lng;
          if (piLat && piLng) {
            setPunchInCoords({ lat: parseFloat(piLat), lng: parseFloat(piLng) });
          }
        }
      } catch (e) { console.warn('Punch-in fetch failed:', e.message); }
    };
    fetchPunchIn();
  }, []);

  // ── Fetch previous location for distance chain ────────────────────────────
  // Runs after punchInCoords is ready (dep array includes it).
  // Priority: last visit of today → punch-in coords → null (no distance)
  useEffect(() => {
    const fetchPrevLocation = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res   = await fetch(
          `${BASE_URL}/visit?startDate=${today}&endDate=${today}&limit=1&sort=-createdAt`,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        const data   = await res.json();
        const visits = data?.result?.visits || data?.data?.visits || data?.data || [];
        const last   = Array.isArray(visits) ? visits[0] : null;

        if (last?.coordinates?.lat && last?.coordinates?.lng) {
  setPrevLocation({
    lat:   parseFloat(last.coordinates.lat),
    lng:   parseFloat(last.coordinates.lng),
            label: last.locationName || 'Previous visit',
          });
          console.log('[Distance] Previous = last visit:', last.locationName);
        } else if (punchInCoords) {
          // ✅ No visits yet today — fall back to punch-in location (A→B)
          setPrevLocation({ ...punchInCoords, label: 'Punch-in location' });
          console.log('[Distance] Previous = punch-in location');
        } else {
          // No previous reference available — distance will be 0
          setPrevLocation(null);
          console.log('[Distance] No previous location found');
        }
      } catch (e) {
        console.warn('[Distance] fetchPrevLocation failed:', e.message);
        // Still fall back to punch-in coords if the visit fetch fails
        if (punchInCoords) {
          setPrevLocation({ ...punchInCoords, label: 'Punch-in location' });
        }
      }
    };
    fetchPrevLocation();
  }, [punchInCoords]); // re-runs once punchInCoords is populated

  // ── reverse geocode ───────────────────────────────────────────────────────
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      setGeocoding(true);
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data?.display_name) {
        const a = data.address || {};
        const label =
          a.shop || a.amenity || a.building ||
          [a.road, a.suburb || a.neighbourhood, a.city || a.town || a.village]
            .filter(Boolean).join(', ');
        return label || data.display_name;
      }
    } catch (e) { console.warn('Reverse geocode failed:', e); }
    finally     { setGeocoding(false); }
    return null;
  }, []);

  // ── geolocation ───────────────────────────────────────────────────────────
  const getCurrentLocation = useCallback((highAccuracy = true, attempt = 0) => {
    setLocationLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng, accuracy: pos.coords.accuracy });
        setLocationAttempts(0);
        setLocationLoading(false);
        const name = await reverseGeocode(lat, lng);
        if (name) setFormData(prev => ({
          ...prev,
          locationName: prev.locationName.trim() === '' ? name : prev.locationName,
        }));
      },
      (err) => {
        if ((err.code === err.TIMEOUT || err.code === 3) && highAccuracy && attempt < 1) {
          setError('High accuracy timeout, retrying…');
          setLocationAttempts(attempt + 1);
          setTimeout(() => getCurrentLocation(false, attempt + 1), 1000);
          return;
        }
        if ((err.code === err.TIMEOUT || err.code === 3) && attempt < 2) {
          setError(`Location timeout — retrying (${attempt + 1}/3)…`);
          setLocationAttempts(attempt + 1);
          setTimeout(() => getCurrentLocation(highAccuracy, attempt + 1), 2000);
          return;
        }
        setError(err.code === 1 ? 'Location permission denied.' : err.message || 'Failed to get location');
        setLocationLoading(false);
      },
      { enableHighAccuracy: highAccuracy, timeout: 15000, maximumAge: 0 }
    );
  }, [reverseGeocode]);

  useEffect(() => { getCurrentLocation(); }, []);

  // ── lead autocomplete ─────────────────────────────────────────────────────
  const searchLeads = useCallback(async (query) => {
    if (!query || query.trim().length < 1) { setSuggestions([]); setShowSuggestions(false); return; }
    try {
      setSearchingLeads(true);
      const res  = await fetch(
        `${BASE_URL}/lead/getAll?search=${encodeURIComponent(query)}&limit=5`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const data = await res.json();
      const leads = data?.result?.leads || data?.result || [];
      setSuggestions(leads);
      setShowSuggestions(leads.length > 0);
    } catch (e) { console.warn('Lead search failed:', e); }
    finally { setSearchingLeads(false); }
  }, []);

  const handleSelectSuggestion = (lead) => {
    setFormData(prev => ({
      ...prev,
      contactPerson: `${lead.firstName} ${lead.lastName}`.trim(),
      phone: lead.phone || '',
      email: lead.email || '',
    }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // ── camera ────────────────────────────────────────────────────────────────
  const handleCameraCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10 MB'); return; }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, WebP, HEIC, and HEIF images are supported');
      return;
    }
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

  // ── form helpers ──────────────────────────────────────────────────────────
  const handleChange = (field) => (e) => {
    setFormData(p => ({ ...p, [field]: e.target.value }));
    if (validationErrors[field]) setValidationErrors(p => ({ ...p, [field]: '' }));
  };

  const handleLeadToggle = (e) => {
    setIsLeadCreated(e.target.value);
    if (e.target.value === 'yes') { setSuggestions([]); setShowSuggestions(false); }
  };

  // ── validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errors = {};
    if (!imageFile)                    errors.photo        = 'Please capture a photo';
    if (!formData.locationName.trim()) errors.locationName = 'Location name is required';
    if (!location)                     errors.location     = 'Location coordinates are required';
    const leadOptionCreatesLead = isLeadCreated === 'yes' || isLeadCreated === 'no';
    if (leadOptionCreatesLead) {
      if (
        !formData.contactPerson.trim() &&
        !formData.phone.trim() &&
        !formData.email.trim()
      ) {
        errors.contactPerson = 'Enter at least one contact detail';
      }
      if (formData.phone && !/^[0-9+\-\s()]{10,15}$/.test(formData.phone)) errors.phone = 'Please enter a valid phone number';
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Please enter a valid email';
    }
    if (isLeadCreated === 'other' && !formData.remarks.trim()) {
      errors.remarks = 'Description is required for Other';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── submit ────────────────────────────────────────────────────────────────
const handleSubmit = async () => {
  if (!validate()) { setError('Please fill all required fields correctly'); return; }
  setLoading(true);
  setError(null);

  const now       = new Date();
  const visitDate = now.toISOString().split('T')[0];
  const visitTime = now.toTimeString().slice(0, 5);

  const distanceKm = roadDistanceKm ?? 0;

  try {
    const fd = new FormData();

    fd.append('latitude',               location.lat.toString());
    fd.append('longitude',              location.lng.toString());
    fd.append('locationName',           formData.locationName.trim());
    fd.append('isLeadCreated',          isLeadCreated);
    fd.append('visitDate',              visitDate);
    fd.append('visitTime',              visitTime);
    fd.append('visitStatus',            'Completed');
    fd.append('distanceFromPreviousKm', distanceKm.toFixed(3));

    if (formData.remarks.trim()) fd.append('remarks', formData.remarks.trim());

    // ✅ Send contact fields only for 'yes' and 'no' — not for 'other'
    if (isLeadCreated === 'yes' || isLeadCreated === 'no') {
      if (formData.contactPerson.trim()) fd.append('contactPerson', formData.contactPerson.trim());
      if (formData.phone.trim())         fd.append('phone',         formData.phone.trim());
      if (formData.email.trim())         fd.append('email',         formData.email.trim());
    }

    fd.append('photos', imageFile);

    // ✅ Single API call — backend handles visit + lead creation based on isLeadCreated
    const visitRes  = await fetch(`${BASE_URL}/visit`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body:    fd,
    });
    const visitJson = await visitRes.json();
    if (!visitRes.ok) throw new Error(visitJson.message || `HTTP ${visitRes.status}`);

    // Update prevLocation for next visit in same session
    setPrevLocation({
      lat:   location.lat,
      lng:   location.lng,
      label: formData.locationName.trim(),
    });

    const visitResult = visitJson?.result ?? visitJson?.data ?? visitJson;
    const visitData = visitResult?.visit ?? visitResult;
    const createdLead = visitResult?.lead ?? visitData?.leadCreated ?? null;
    const createdLeadId =
      createdLead?._id ||
      (typeof createdLead === 'string' ? createdLead : null) ||
      visitData?.leadCreated?._id ||
      (typeof visitData?.leadCreated === 'string' ? visitData.leadCreated : null);

    if (!visitData?._id) {
      throw new Error(visitJson?.message || visitResult?.message || 'Visit was created, but the app could not read the response');
    }

    if ((isLeadCreated === 'yes' || isLeadCreated === 'no') && !createdLeadId) {
      throw new Error('Visit was saved, but lead was not created. Please check backend lead creation.');
    }

    setCreatedVisit(visitData);
    setSuccess(true);
    if (onSave) onSave(visitData);

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

  const requiresContact = isLeadCreated === 'yes' || isLeadCreated === 'no';
  const canSubmit  =
    !loading &&
    !!location &&
    
    !!formData.locationName.trim() &&
    (
      !requiresContact ||
      !!formData.contactPerson.trim() ||
      !!formData.phone.trim() ||
      !!formData.email.trim()
    );
  const mapCenter  = location ? [location.lat, location.lng] : [22.5726, 88.3639];

  // ── Computed distance preview (shown on map section) ─────────────────────

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: isMobile ? 8 : 4 }}>

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
        onChange={handleCameraCapture} style={{ display: 'none' }} />

      {/* Header */}
      <Paper sx={{ p: isMobile ? 2 : 3, borderRadius: 0, background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`, color: 'white', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => onClose ? onClose() : navigate(-1)} sx={{ color: 'white' }}><ArrowBack /></IconButton>
            <Box>
              <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700}>Create New Visit</Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
            {isOnline
              ? <><Wifi sx={{ fontSize: 16 }} /><Typography variant="caption">Connected</Typography></>
              : <><WifiOff sx={{ fontSize: 16 }} /><Typography variant="caption">Offline</Typography></>}
          </Box>
        </Box>
      </Paper>

      <Box sx={{ px: isMobile ? 2 : 3, maxWidth: 1200, mx: 'auto' }}>

        {/* Punch-in banner */}
        {punchInAddress && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 3, px: 2, py: 1.25, mb: 2.5 }}>
            <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#22c55e', flexShrink: 0, animation: 'gp 1.5s ease-in-out infinite', '@keyframes gp': { '0%,100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: 0.4, transform: 'scale(0.75)' } } }} />
            <LocationOn sx={{ fontSize: 15, color: '#16a34a', flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#14532d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{punchInAddress}</Typography>
              {punchInTime && <Typography sx={{ fontSize: '0.68rem', color: '#16a34a', mt: 0.15 }}>On duty since {new Date(punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>}
            </Box>
            <Chip label="On Duty" size="small" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 800, bgcolor: 'transparent', border: '1px solid #86efac', color: '#16a34a', flexShrink: 0 }} />
          </Box>
        )}

        {/* ✅ Distance preview banner — shows live A→B distance while user fills form */}
{prevLocation && location && (
  <Box sx={{ display:'flex', alignItems:'center', gap:1.5, bgcolor:alpha(PRIMARY,0.06), border:`1px solid ${alpha(PRIMARY,0.2)}`, borderRadius:3, px:2, py:1.25, mb:2.5 }}>
    <Route sx={{ fontSize:16, color:PRIMARY, flexShrink:0 }} />
    <Box sx={{ flex:1, minWidth:0 }}>
      <Typography sx={{ fontSize:'0.78rem', fontWeight:700, color:PRIMARY }}>
        Road distance from {prevLocation.label}
      </Typography>
      <Typography sx={{ fontSize:'0.68rem', color:PRIMARY, opacity:0.8, mt:0.15 }}>
        Via road · driving route
      </Typography>
    </Box>
    {roadDistanceLoading ? (
      <CircularProgress size={16} sx={{ color:PRIMARY }} />
    ) : roadDistanceKm !== null ? (
      <Chip
        label={`${roadDistanceKm.toFixed(2)} km`}
        size="small"
        sx={{ height:24, fontSize:'0.72rem', fontWeight:800, bgcolor:PRIMARY, color:'#fff', flexShrink:0 }}
      />
    ) : null}
  </Box>
)}
        <Grid container spacing={isMobile ? 2 : 3}>

          {/* Left column */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>

              {/* Camera */}
              <FormSection>
                <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: PRIMARY, mb: 2 }}>
                  <CameraAlt /> Site Photo
                  <Chip label="Required" size="small" color={imageFile ? 'success' : 'error'} sx={{ ml: 'auto', height: 24 }} />
                </Typography>
                <AnimatePresence mode="wait">
                  {preview ? (
                    <motion.div key="preview" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                      <ImagePreview>
                        <img src={preview} alt="Preview" onClick={() => setFullscreenImage(true)} />
                        <Box className="overlay">
                          <Button size="small" variant="contained" startIcon={<Fullscreen />} onClick={() => setFullscreenImage(true)} sx={{ bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(5px)' }}>View</Button>
                          <IconButton onClick={handleRemovePhoto} sx={{ bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(5px)' }}><Delete /></IconButton>
                        </Box>
                      </ImagePreview>
                    </motion.div>
                  ) : (
                    <motion.div key="upload" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                      <UploadArea onClick={() => cameraInputRef.current?.click()} role="button" tabIndex={0}>
                        <CameraAlt sx={{ fontSize: isMobile ? 40 : 48, color: alpha(PRIMARY, 0.5), mb: 2 }} />
                        <Typography variant={isMobile ? 'body1' : 'h6'} fontWeight={600} color={PRIMARY}>Tap to open camera</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>Take a photo of the site · Max 10 MB</Typography>
                        <Button variant="contained" size={isMobile ? 'small' : 'medium'} startIcon={<PhotoCamera />}
                          onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                          sx={{ mt: 2, borderRadius: 2, bgcolor: PRIMARY, '&:hover': { bgcolor: SECONDARY } }}>Open Camera</Button>
                      </UploadArea>
                    </motion.div>
                  )}
                </AnimatePresence>
                {validationErrors.photo && <FormHelperText error sx={{ mt: 1 }}>{validationErrors.photo}</FormHelperText>}
              </FormSection>

              {/* Location name */}
              <FormSection>
                <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: PRIMARY, mb: 2 }}><Business /> Location Details</Typography>
                <TextField fullWidth label="Location / Business Name *" placeholder="e.g., Client Office, Store Name"
                  value={formData.locationName} onChange={handleChange('locationName')}
                  error={!!validationErrors.locationName} helperText={validationErrors.locationName}
                  disabled={loading} size={isMobile ? 'small' : 'medium'}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">
                      {geocoding ? <CircularProgress size={16} sx={{ color: PRIMARY }} /> : <LocationOn sx={{ color: alpha(PRIMARY, 0.5) }} />}
                    </InputAdornment>,
                    endAdornment: geocoding
                      ? <InputAdornment position="end"><Typography variant="caption" color="text.secondary">detecting…</Typography></InputAdornment>
                      : null,
                  }} />
              </FormSection>
            </Stack>
          </Grid>

          {/* Right column */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>

              {/* Lead toggle */}
              <FormSection>
                <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: PRIMARY, mb: 2 }}>
                  <PersonAdd /> New Lead Created?
                </Typography>
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup row value={isLeadCreated} onChange={handleLeadToggle}
                    sx={{ justifyContent: 'space-around', bgcolor: alpha(PRIMARY, 0.05), borderRadius: 2, p: 1 }}>
                    <FormControlLabel value="yes"   control={<Radio sx={{ color: PRIMARY }} />} label="Yes"   />
                    <FormControlLabel value="no"    control={<Radio sx={{ color: PRIMARY }} />} label="No"    />
                    <FormControlLabel value="other" control={<Radio sx={{ color: PRIMARY }} />} label="Other (Save Description Only)" />
                  </RadioGroup>
                </FormControl>
              </FormSection>

              {/* Contact Information */}
              {isLeadCreated !== 'other' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <FormSection>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: PRIMARY, mb: 2 }}>
                      <Person /> Contact Information
                      {isLeadCreated === 'yes' && <Chip label="Lead Created" size="small" color="success" sx={{ ml: 'auto', height: 24 }} />}
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ position: 'relative' }}>
                        <TextField
                          fullWidth
                          label={isLeadCreated === 'yes' ? 'Contact Person *' : 'Contact Person'}
                          placeholder="Enter contact name"
                          value={formData.contactPerson}
                          onChange={(e) => {
                            handleChange('contactPerson')(e);
                            if (isLeadCreated === 'no') searchLeads(e.target.value);
                          }}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          onFocus={() => { if (isLeadCreated === 'no' && formData.contactPerson && suggestions.length > 0) setShowSuggestions(true); }}
                          error={!!validationErrors.contactPerson}
                          helperText={validationErrors.contactPerson}
                          disabled={loading}
                          size={isMobile ? 'small' : 'medium'}
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><Person sx={{ color: alpha(PRIMARY, 0.5) }} /></InputAdornment>,
                            endAdornment: searchingLeads && isLeadCreated === 'no'
                              ? <InputAdornment position="end"><CircularProgress size={16} sx={{ color: PRIMARY }} /></InputAdornment>
                              : null,
                          }}
                        />
                        {isLeadCreated === 'no' && showSuggestions && suggestions.length > 0 && (
                          <Paper elevation={8} sx={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, borderRadius: 2, overflow: 'hidden', border: `1px solid ${alpha(PRIMARY, 0.2)}`, mt: 0.5 }}>
                            {suggestions.map((lead, index) => (
                              <Box key={lead._id} onMouseDown={() => handleSelectSuggestion(lead)}
                                sx={{ px: 2, py: 1.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.5,
                                  borderBottom: index < suggestions.length - 1 ? `1px solid ${alpha(PRIMARY, 0.08)}` : 'none',
                                  '&:hover': { bgcolor: alpha(PRIMARY, 0.06) }, transition: 'background 0.15s' }}>
                                <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: alpha(PRIMARY, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Typography variant="caption" fontWeight={700} color={PRIMARY}>{lead.firstName?.[0]}{lead.lastName?.[0]}</Typography>
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" fontWeight={700} noWrap>{lead.firstName} {lead.lastName}</Typography>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    {lead.phone && <Typography variant="caption" color="text.secondary" noWrap>📞 {lead.phone}</Typography>}
                                    {lead.email && <Typography variant="caption" color="text.secondary" noWrap>✉ {lead.email}</Typography>}
                                  </Stack>
                                </Box>
                                {lead.status && <Chip label={lead.status} size="small" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY, flexShrink: 0 }} />}
                              </Box>
                            ))}
                          </Paper>
                        )}
                      </Box>

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

              {/* MAP */}
              <FormSection sx={{ padding: '0 !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, px: 2.5, pt: 2.5, pb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: PRIMARY }}><GpsFixed /> Your Location</Typography>
                  <Button size="small" startIcon={locationLoading ? <CircularProgress size={14} /> : <Refresh />}
                    onClick={() => getCurrentLocation()} disabled={locationLoading}
                    sx={{ color: PRIMARY, width: isMobile ? '100%' : 'auto' }}>
                    {locationLoading ? 'Locating…' : 'Refresh'}
                  </Button>
                </Box>
                <Box sx={{ height: 280, position: 'relative' }}>
                  {locationLoading && !location && (
                    <Box sx={{ position: 'absolute', inset: 0, zIndex: 1000, bgcolor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <CircularProgress size={36} sx={{ color: PRIMARY }} />
                      <Typography variant="caption" color="text.secondary">
                        {locationAttempts > 0 ? `Attempt ${locationAttempts}/3…` : 'Getting your location…'}
                      </Typography>
                      {locationAttempts > 0 && <LinearProgress sx={{ width: 120, borderRadius: 2 }} variant="determinate" value={Math.min(locationAttempts * 33, 99)} />}
                    </Box>
                  )}
                  {!locationLoading && !location && (
                    <Box sx={{ position: 'absolute', inset: 0, zIndex: 1000, bgcolor: 'rgba(255,255,255,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, p: 2 }}>
                      <GpsOff sx={{ fontSize: 40, color: ERROR_COL }} />
                      <Typography color="error" textAlign="center" variant="body2">{error || 'Failed to get location'}</Typography>
                      <Button variant="contained" size="small" onClick={() => getCurrentLocation()} sx={{ mt: 1, borderRadius: 2, bgcolor: PRIMARY }}>Retry</Button>
                    </Box>
                  )}
                  <MapContainer center={mapCenter} zoom={location ? 17 : 13} style={{ height: '100%', width: '100%' }} zoomControl scrollWheelZoom={false}>
                    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
                    {location && <FlyToLocation coords={location} />}
                    {location && (
                      <Marker position={[location.lat, location.lng]}>
                        <Popup>
                          <Box sx={{ minWidth: 160 }}>
                            <Typography variant="caption" fontWeight={700} display="block">📍 You are here</Typography>
                            <Typography variant="caption" color="text.secondary">{location.lat.toFixed(6)}°, {location.lng.toFixed(6)}°</Typography>
                            {location.accuracy && <Typography variant="caption" color="text.secondary" display="block">Accuracy: ±{location.accuracy.toFixed(0)} m</Typography>}
                          </Box>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </Box>
                <Box sx={{ px: 2.5, pt: 1.5, pb: 2 }}>
                  {location && (
                    <Box sx={{ px: 2, py: 1, bgcolor: alpha(PRIMARY, 0.04), borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <CheckCircle sx={{ fontSize: 16, color: SUCCESS }} />
                        <Typography variant="caption" fontFamily="monospace" fontWeight={600} color="text.primary">
                          {location.lat.toFixed(5)}°, {location.lng.toFixed(5)}°
                        </Typography>
                      </Box>
                      {location.accuracy && (
                        <Chip size="small" label={`±${location.accuracy.toFixed(0)} m`}
                          sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700,
                            bgcolor: location.accuracy <= 20 ? alpha(SUCCESS, 0.12) : location.accuracy <= 50 ? alpha(WARNING, 0.12) : alpha(ERROR_COL, 0.12),
                            color:  location.accuracy <= 20 ? SUCCESS : location.accuracy <= 50 ? WARNING : ERROR_COL }} />
                      )}
                    </Box>
                  )}
                  {validationErrors.location && <FormHelperText error sx={{ mt: 1 }}>{validationErrors.location}</FormHelperText>}
                </Box>
              </FormSection>

              {/* Remarks */}
              <FormSection>
                <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: PRIMARY, mb: 2 }}><Notes /> Visit Notes</Typography>
                <TextField fullWidth multiline rows={isMobile ? 3 : 4} placeholder="Enter any additional notes about the visit…"
                  label={isLeadCreated === 'other' ? 'Description *' : 'Visit Notes'}
                  value={formData.remarks} onChange={handleChange('remarks')} disabled={loading}
                  error={!!validationErrors.remarks} helperText={validationErrors.remarks}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'action.hover' } }} />
              </FormSection>
            </Stack>
          </Grid>
        </Grid>

        {/* Error alert */}
        <AnimatePresence>
          {error && !locationLoading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Alert severity={error.includes('timeout') ? 'warning' : 'error'} sx={{ mt: 3, borderRadius: 2 }} onClose={() => setError(null)}
                action={error.toLowerCase().includes('location') && <Button color="inherit" size="small" onClick={() => getCurrentLocation()}>Retry</Button>}>
                {error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, mb: isMobile ? 2 : 0, flexDirection: isMobile ? 'column' : 'row' }}>
          <Button fullWidth={isMobile} variant="outlined" onClick={() => onClose ? onClose() : navigate(-1)} disabled={loading}
            sx={{ px: 4, py: 1.5, borderRadius: 2, borderColor: PRIMARY, color: PRIMARY, '&:hover': { bgcolor: alpha(PRIMARY, 0.05) }, order: isMobile ? 2 : 1 }}>Cancel</Button>
          <Button fullWidth={isMobile} variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={handleSubmit} disabled={!canSubmit}
            sx={{ px: 4, py: 1.5, borderRadius: 2, bgcolor: PRIMARY, '&:hover': { bgcolor: SECONDARY }, '&.Mui-disabled': { bgcolor: alpha(PRIMARY, 0.3) }, order: isMobile ? 1 : 2 }}>
            {loading ? 'Creating Visit…' : 'Create Visit'}
          </Button>
        </Box>
      </Box>

      <SuccessDialog open={success} visitData={createdVisit} onClose={() => { setSuccess(false); onClose?.(); }} />

      {/* Fullscreen image */}
      <Dialog open={fullscreenImage} onClose={() => setFullscreenImage(false)} maxWidth="lg" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { bgcolor: 'black', borderRadius: isMobile ? 0 : 2 } }}>
        <DialogContent sx={{ p: 0, position: 'relative', height: isMobile ? '100vh' : 'auto' }}>
          <IconButton onClick={() => setFullscreenImage(false)} sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', zIndex: 1 }}><Close /></IconButton>
          <Box component="img" src={preview} alt="Full preview" sx={{ width: '100%', height: isMobile ? '100%' : 'auto', objectFit: 'contain' }} />
        </DialogContent>
      </Dialog>

      {/* Bottom nav */}
      {isMobile && (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, borderRadius: 0 }} elevation={3}>
          <BottomNavigation showLabels value={bottomNav} onChange={(_, v) => setBottomNav(v)}
            sx={{ height: 64, '& .MuiBottomNavigationAction-root': { color: 'text.secondary', '&.Mui-selected': { color: PRIMARY } } }}>
            <BottomNavigationAction label="Dashboard" icon={<Dashboard />} onClick={() => navigate('/dashboard')} />
            <BottomNavigationAction label="Visits"    icon={<History />}   onClick={() => navigate('/total-visits')} />
            <BottomNavigationAction label="New Visit" icon={<AddAPhoto />} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          </BottomNavigation>
        </Paper>
      )}

      {/* FAB */}
      {isMobile && (
        <Zoom in>
          <Fab color="primary" onClick={() => getCurrentLocation()} disabled={locationLoading}
            sx={{ position: 'fixed', bottom: 80, right: 16, zIndex: 1000, bgcolor: PRIMARY, '&:hover': { bgcolor: SECONDARY }, boxShadow: `0 4px 12px ${alpha(PRIMARY, 0.3)}` }}>
            <Badge variant="dot" color={location ? 'success' : 'error'} overlap="circular"><MyLocation /></Badge>
          </Fab>
        </Zoom>
      )}
    </Box>
  );
}
