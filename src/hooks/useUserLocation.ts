import { useCallback, useEffect, useState } from "react";

export interface UseUserLocationState {
  position: { lat: number; lng: number } | null;
  status: "idle" | "locating" | "success" | "error" | "denied";
  errorMessage?: string;
  requestLocation: () => void;
}

/**
 * Attempts to fetch the user's current location using the browser Geolocation API.
 * Handles permission errors gracefully and exposes a request function for retries.
 */
export function useUserLocation(): UseUserLocationState {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<UseUserLocationState["status"]>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setErrorMessage("Geolocation is not supported in this browser.");
      return;
    }

    setStatus("locating");
    setErrorMessage(undefined);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("success");
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED;
        setStatus(denied ? "denied" : "error");
        setErrorMessage(denied ? "Location permission denied." : err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return {
    position,
    status,
    errorMessage,
    requestLocation,
  };
}
