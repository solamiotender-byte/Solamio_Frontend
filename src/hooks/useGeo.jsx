// hooks/useGeo.js
import { useState, useCallback, useRef } from "react";

// ✅ FIX: API key must never be hardcoded in frontend source —
//         it would be visible to anyone who inspects the bundle.
//         Store it in your .env file as VITE_GOOGLE_MAPS_API_KEY.
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export const useGeo = () => {
  const [state, setState] = useState({
    latitude:  null,
    longitude: null,
    accuracy:  null,
    address:   null,
    error:     null,
    loading:   false,
  });

  // Keep a ref to avoid stale closures in async callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  /* ==============================
     GOOGLE REVERSE GEOCODING
  ============================== */
  const fetchAddress = useCallback(async (latitude, longitude) => {
    if (!GOOGLE_API_KEY) {
      console.warn("useGeo: VITE_GOOGLE_MAPS_API_KEY is not set");
      return null;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Geocode request failed");

      const data = await response.json();
      if (!data.results?.length) return null;

      const result     = data.results[0];
      const components = result.address_components || [];

      const getComp = (type) =>
        components.find((c) => c.types.includes(type))?.long_name || "";

      return {
        full:        result.formatted_address,
        short:       result.formatted_address.split(",")[0].trim(),
        road:        getComp("route"),
        houseNumber: getComp("street_number"),
        city:
          getComp("locality") || getComp("administrative_area_level_2"),
        state:       getComp("administrative_area_level_1"),
        country:     getComp("country"),
        postcode:    getComp("postal_code"),
      };
    } catch (err) {
      console.error("Google reverse geocode error:", err);
      return null;
    }
  }, []);

  /* ==============================
     REFRESH ADDRESS for current coords
  ============================== */
  const refreshAddress = useCallback(async () => {
    const { latitude, longitude } = stateRef.current;
    if (!latitude || !longitude) return null;
    const address = await fetchAddress(latitude, longitude);
    if (address) {
      setState((s) => ({ ...s, address }));
    }
    return address;
  }, [fetchAddress]);

  /* ==============================
     GET CURRENT LOCATION
  ============================== */
  const fetchLocation = useCallback(
    async (includeAddress = true) => {
      if (!navigator.geolocation) {
        setState((s) => ({
          ...s,
          error:   "Geolocation is not supported by your browser",
          loading: false,
        }));
        return null;
      }

      setState((s) => ({ ...s, loading: true, error: null }));

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const coords = {
              latitude:  pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy:  pos.coords.accuracy,
            };

            let address = null;
            if (includeAddress) {
              address = await fetchAddress(coords.latitude, coords.longitude);
            }

            const newState = { ...coords, address, loading: false, error: null };
            setState(newState);
            resolve(newState);
          },
          (err) => {
            const msg =
              err.code === 1
                ? "Location permission denied. Please allow location access."
                : err.code === 2
                ? "Location unavailable. Please check your GPS settings."
                : "Location request timed out. Please try again.";

            setState((s) => ({ ...s, loading: false, error: msg }));
            reject(new Error(msg));
          },
          {
            enableHighAccuracy: true,
            timeout:            20_000,
            maximumAge:         0,
          }
        );
      });
    },
    [fetchAddress]
  );

  /* ==============================
     RESET
  ============================== */
  const reset = useCallback(() => {
    setState({
      latitude:  null,
      longitude: null,
      accuracy:  null,
      address:   null,
      error:     null,
      loading:   false,
    });
  }, []);

  return { ...state, fetchLocation, refreshAddress, reset };
};