// components/BatteryPermissionDialog.jsx
import React from "react";
import {
  Dialog, DialogContent, DialogActions, Box, Typography,
  Button, Stack, CircularProgress, alpha, useMediaQuery, Zoom, Slide,
} from "@mui/material";
import { BatteryChargingFull, BatteryAlert } from "@mui/icons-material";

const PRIMARY = "#136dec";
const SUCCESS = "#22c55e";

export const BatteryPermissionDialog = ({ open, onAllow, onDeny, requesting, error }) => {
  const isMobile = useMediaQuery("(max-width:600px)");

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={isMobile ? Slide : Zoom}
      TransitionProps={isMobile ? { direction: "up" } : {}}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4, overflow: "hidden" } }}
    >
      <Box sx={{ height: 5, background: `linear-gradient(90deg, ${PRIMARY}, ${SUCCESS})` }} />

      <DialogContent sx={{ pt: 4, pb: 2, px: 3, textAlign: "center" }}>
        <Box sx={{
          width: 80, height: 80, borderRadius: "50%",
          bgcolor: alpha(SUCCESS, 0.1),
          display: "flex", alignItems: "center", justifyContent: "center",
          mx: "auto", mb: 2.5,
          border: `2px solid ${alpha(SUCCESS, 0.25)}`,
        }}>
          {requesting
            ? <CircularProgress size={36} sx={{ color: SUCCESS }} />
            : error
            ? <BatteryAlert sx={{ fontSize: 36, color: "#ef4444" }} />
            : <BatteryChargingFull sx={{ fontSize: 36, color: SUCCESS }} />}
        </Box>

        <Typography variant="h6" fontWeight={800} gutterBottom>
          {requesting ? "Reading Battery…" : error ? "Battery Access Failed" : "Allow Battery Access"}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {requesting
            ? "Please wait while we read your device battery level."
            : error
            ? error
            : "To track your battery status, we need permission to read your device's battery level. This helps your manager monitor device health."}
        </Typography>

        {!requesting && !error && (
          <Box sx={{ mt: 2.5, p: 1.5, borderRadius: 2, bgcolor: alpha(PRIMARY, 0.04), border: `1px solid ${alpha(PRIMARY, 0.1)}` }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <BatteryChargingFull sx={{ fontSize: 16, color: PRIMARY }} />
              <Typography variant="caption" color="primary" fontWeight={600}>
                Battery data is only shared with your manager
              </Typography>
            </Stack>
          </Box>
        )}
      </DialogContent>

      {!requesting && (
        <DialogActions sx={{
          px: 3, pb: 3, gap: 1.5,
          flexDirection: { xs: "column", sm: "row" },
        }}>
          <Button
            fullWidth={isMobile}
            variant="outlined"
            onClick={onDeny}
            sx={{ borderRadius: 2.5, borderColor: alpha(PRIMARY, 0.35), color: "text.secondary", order: isMobile ? 2 : 1 }}
          >
            {error ? "Close" : "Cancel"}
          </Button>
          {!error && (
            <Button
              fullWidth={isMobile}
              variant="contained"
              onClick={onAllow}
              startIcon={<BatteryChargingFull />}
              sx={{ borderRadius: 2.5, fontWeight: 700, bgcolor: SUCCESS, order: isMobile ? 1 : 2, "&:hover": { bgcolor: "#16a34a" } }}
            >
              Allow Battery Access
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
};