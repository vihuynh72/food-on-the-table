import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export type DonationLocationType = "food_bank" | "community_fridge" | "pantry" | "shelter";

export interface DonationPolicy {
  accepts: string[];
  notAccepted?: string[];
  notes?: string;
}

export interface DonationLocation {
  id: string;
  name: string;
  type: DonationLocationType;
  placeId?: string;
  lat: number;
  lng: number;
  address: string;
  accepts: string[];
  hours?: string;
  phone?: string;
  website?: string;
  distanceLabel?: string;
  policy?: DonationPolicy;
  description?: string;
}

export interface DonationMapProps {
  locations: DonationLocation[];
  activeTypeFilter: DonationLocationType | "all";
  selectedLocationId?: string;
  onSelectLocation?: (id: string) => Promise<void> | void;
  userPosition?: google.maps.LatLngLiteral | null;
  onSearchArea?: (center: google.maps.LatLngLiteral) => void;
  isSearching?: boolean;
}

const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: 39.8283, lng: -98.5795 };

function calculateMapDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

let googleMapsPromise: Promise<typeof google.maps> | null = null;

function loadGoogleMaps(apiKey: string) {
  if (typeof window === "undefined") return Promise.reject(new Error("No window object"));
  if (window.google?.maps && 'places' in window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.onload = () => {
        if (window.google?.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error("Google Maps failed to load"));
        }
      };
      script.onerror = () => reject(new Error("Google Maps script could not be loaded"));
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
}

export function DonationMap({
  locations,
  activeTypeFilter,
  selectedLocationId,
  onSelectLocation,
  userPosition,
  onSearchArea,
  isSearching = false,
}: DonationMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [mapMoved, setMapMoved] = useState(false);
  const initialCenterRef = useRef<google.maps.LatLngLiteral | null>(null);

  const visibleLocations = useMemo(
    () =>
      activeTypeFilter === "all"
        ? locations
        : locations.filter((loc) => loc.type === activeTypeFilter),
    [activeTypeFilter, locations],
  );

  useEffect(() => {
    if (!apiKey) {
      setLoadError(
        "Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your environment.",
      );
      return;
    }

    let isMounted = true;

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (!mapContainerRef.current || !isMounted) return;
        const center = userPosition ?? DEFAULT_CENTER;
        initialCenterRef.current = center;
        mapRef.current = new maps.Map(mapContainerRef.current, {
          center,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#eef2e5" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#dfe5cf" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "water", stylers: [{ color: "#c6d6c3" }] },
          ],
        });

        // Listen for map movement
        if (mapRef.current) {
          const googleMap = mapRef.current;
          googleMap.addListener("idle", () => {
            if (!googleMap || !initialCenterRef.current) return;
            const currentCenter = googleMap.getCenter();
            if (!currentCenter) return;

            const movedDistance = calculateMapDistance(
              initialCenterRef.current.lat,
              initialCenterRef.current.lng,
              currentCenter.lat(),
              currentCenter.lng()
            );

            // Show button if moved more than 0.5 miles
            if (movedDistance > 0.5 && !mapMoved) {
              setShowSearchButton(true);
              setMapMoved(true);
            }
          });
        }

        setIsReady(true);
      })
      .catch((err) => {
        setLoadError(err.message || "Unable to load Google Maps");
      });

    return () => {
      isMounted = false;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      mapRef.current = null;
    };
  }, [apiKey]);

  useEffect(() => {
    if (!mapRef.current || !userPosition) return;
    mapRef.current.panTo(userPosition);
    mapRef.current.setZoom(13);
  }, [userPosition]);

  useEffect(() => {
    if (!mapRef.current || !isReady) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const maps = window.google.maps;

    visibleLocations.forEach((location) => {
      const isSelected = location.id === selectedLocationId;
      const marker = new maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: mapRef.current!,
        title: location.name,
        icon: {
          path: maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: isSelected ? 6 : 5,
          fillColor: isSelected ? "#44562f" : "#83934d",
          fillOpacity: 1,
          strokeWeight: 1,
          strokeColor: "#ffffff",
        },
      });

      marker.addListener("click", () => {
        void Promise.resolve(onSelectLocation?.(location.id)).catch((error) => {
          console.error("Failed to handle marker selection", error);
        });
      });
      markersRef.current.push(marker);
    });

    if (visibleLocations.length > 0) {
      const bounds = new maps.LatLngBounds();
      visibleLocations.forEach((loc) => bounds.extend({ lat: loc.lat, lng: loc.lng }));
      if (userPosition) bounds.extend(userPosition);
      mapRef.current.fitBounds(bounds, 64);
    } else {
      mapRef.current.setCenter(userPosition ?? DEFAULT_CENTER);
      mapRef.current.setZoom(11);
    }
  }, [visibleLocations, selectedLocationId, onSelectLocation, userPosition, isReady]);

  if (loadError) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-muted px-6 text-center text-sm text-muted-foreground">
        {loadError}
      </div>
    );
  }

  const handleSearchArea = () => {
    if (!mapRef.current || !onSearchArea) return;
    const googleMap = mapRef.current;
    const center = googleMap.getCenter();
    if (center) {
      initialCenterRef.current = { lat: center.lat(), lng: center.lng() };
      setShowSearchButton(false);
      setMapMoved(false);
      onSearchArea({ lat: center.lat(), lng: center.lng() });
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border bg-background shadow-inner">
      {!isReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/60 text-sm text-muted-foreground">
          Loading map...
        </div>
      )}
      
      {showSearchButton && onSearchArea && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-fade-in">
          <Button
            onClick={handleSearchArea}
            disabled={isSearching}
            className="shadow-lg hover:shadow-xl transition-all bg-woodland text-primary-foreground hover:bg-woodland/90"
            size="sm"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              "Search this area"
            )}
          </Button>
        </div>
      )}
      
      <div
        ref={mapContainerRef}
        className="h-full w-full focus:outline-none"
        tabIndex={0}
        aria-label="Map of nearby donation locations"
      />
    </div>
  );
}
