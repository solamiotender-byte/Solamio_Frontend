// hooks/useLiveBattery.js
// Reads the real device battery (phone or laptop) using the Web Battery API.
// Automatically syncs to backend on punch-in and whenever level/charging changes.
// Browser support: Chrome, Edge, Samsung Internet. NOT supported on Safari/iOS/Firefox.

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:9001";

export const useLiveBattery = (userId, token) => {
  const [percentage, setPercentage]   = useState(null);   // 0–100 or null if unavailable
  const [isCharging, setIsCharging]   = useState(false);
  const [supported,  setSupported]    = useState(null);   // null=unknown, true, false
  const [syncing,    setSyncing]      = useState(false);
  const batteryRef  = useRef(null);   // holds the BatteryManager object
  const intervalRef = useRef(null);   // holds the periodic sync interval

  // ── Save to backend ────────────────────────────────────────────────────────
  const saveToBackend = useCallback(async (pct, charging) => {
    if (!userId || !token) return;
    try {
      setSyncing(true);
      const deviceInfo = navigator.userAgent.split(")")[0].split("(")[1] || "Browser";
      await axios.post(
        `${API}/api/v1/battery/log`,
        { userId, percentage: pct, isCharging: charging, deviceInfo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      //console.log(`🔋 Battery synced: ${pct}% | Charging: ${charging}`);
    } catch (e) {
      console.warn("🔋 Battery sync failed (non-critical):", e.message);
    } finally {
      setSyncing(false);
    }
  }, [userId, token]);

  // ── Initialize Battery API ─────────────────────────────────────────────────
  const initBattery = useCallback(async () => {
    if (!("getBattery" in navigator)) {
      setSupported(false);
      //console.log("🔋 Battery API not supported on this browser/device");
      return;
    }

    try {
      const battery = await navigator.getBattery();
      batteryRef.current = battery;
      setSupported(true);

      const pct      = Math.round(battery.level * 100);
      const charging = battery.charging;
      setPercentage(pct);
      setIsCharging(charging);

      // Save immediately on init
      await saveToBackend(pct, charging);

      // ── Live listeners ──────────────────────────────────────────────────
      battery.onlevelchange = async () => {
        const newPct = Math.round(battery.level * 100);
        setPercentage(newPct);
        await saveToBackend(newPct, battery.charging);
        //console.log(`🔋 Level changed: ${newPct}%`);
      };

      battery.onchargingchange = async () => {
        const newPct = Math.round(battery.level * 100);
        setIsCharging(battery.charging);
        setPercentage(newPct);
        await saveToBackend(newPct, battery.charging);
        //console.log(`🔋 Charging changed: ${battery.charging}`);
      };

    } catch (e) {
      setSupported(false);
      console.warn("🔋 Battery init failed:", e.message);
    }
  }, [saveToBackend]);

  // ── Start: call this when user punches in ──────────────────────────────────
  const startTracking = useCallback(async () => {
    await initBattery();

    // Periodic sync every 5 minutes
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      if (!batteryRef.current) return;
      const pct      = Math.round(batteryRef.current.level * 100);
      const charging = batteryRef.current.charging;
      setPercentage(pct);
      setIsCharging(charging);
      await saveToBackend(pct, charging);
    }, 5 * 60 * 1000);

  }, [initBattery, saveToBackend]);

  // ── Stop: call this when user punches out ─────────────────────────────────
  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (batteryRef.current) {
      batteryRef.current.onlevelchange   = null;
      batteryRef.current.onchargingchange = null;
      batteryRef.current = null;
    }
    //console.log("🔋 Battery tracking stopped");
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => stopTracking();
  }, [stopTracking]);

  return {
    percentage,   // number (0-100) or null
    isCharging,   // boolean
    supported,    // true = Battery API works, false = not supported
    syncing,      // true while saving to backend
    startTracking, // call on punch-in
    stopTracking,  // call on punch-out
  };
};