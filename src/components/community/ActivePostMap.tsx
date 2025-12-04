import React, { useEffect, useRef, useState } from "react";
import { CommunityPostWithUser } from "@/types/community";
import { Loader2, MapPin } from "lucide-react";
import { loadGoogleMaps } from "@/lib/googleMaps";

interface ActivePostMapProps {
  post: CommunityPostWithUser | null;
}

export function ActivePostMap({ post }: ActivePostMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Map
  useEffect(() => {
    // If map is already initialized, do nothing
    if (googleMapRef.current) return;
    
    // If the container is not yet available (e.g. post is null), we can't init
    if (!mapRef.current) return;

    const initMap = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          console.error("Google Maps API key is missing");
          setError("Map configuration missing");
          return;
        }

        await loadGoogleMaps(apiKey);

        // Check ref again after await
        if (!mapRef.current) return;

        googleMapRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: post?.location_lat || 40.7128, lng: post?.location_lng || -74.0060 }, // Use post location or Default
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });
        
        setIsMapReady(true);
      } catch (err) {
        console.error("Failed to load Google Maps:", err);
        setError("Failed to load map");
      }
    };

    initMap();
  }, [post]); // Retry initialization when post changes (and thus mapRef might become available)

  // Update Map when post changes
  useEffect(() => {
    if (!googleMapRef.current || !post || !isMapReady) return;

    const updateMap = async () => {
      setIsLoading(true);
      setError(null);

      // Clear existing
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }

      let lat = post.location_lat;
      let lng = post.location_lng;

      // If no coordinates, try to geocode the location label (Zip Code)
      if ((!lat || !lng) && post.location_label) {
        try {
          const geocoder = new window.google.maps.Geocoder();
          const result = await geocoder.geocode({ address: post.location_label });
          if (result.results[0]) {
            lat = result.results[0].geometry.location.lat();
            lng = result.results[0].geometry.location.lng();
          }
        } catch (e) {
          console.error("Geocoding failed", e);
          setError("Could not locate this area.");
        }
      }

      if (lat && lng) {
        const center = { lat, lng };
        googleMapRef.current?.panTo(center);
        googleMapRef.current?.setZoom(14);

        if (post.type === 'offer') {
          // Offer: Specific Location Marker
          markerRef.current = new window.google.maps.Marker({
            position: center,
            map: googleMapRef.current,
            animation: window.google.maps.Animation.DROP,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#16a34a", // Green
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          } as any);
        } else {
          // Request: General Area Circle
          circleRef.current = new window.google.maps.Circle({
            strokeColor: "#f97316", // Orange
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#f97316",
            fillOpacity: 0.35,
            map: googleMapRef.current,
            center: center,
            radius: 800, // ~800 meters radius for general area
          } as any);
          googleMapRef.current?.setZoom(13);
        }
      } else {
        setError("Location data unavailable.");
      }
      
      setIsLoading(false);
    };

    updateMap();
  }, [post, isMapReady]);

  if (!post) {
    return (
      <div className="w-full h-full bg-muted/20 flex items-center justify-center text-muted-foreground rounded-xl border">
        <div className="text-center p-6">
          <MapPin className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p>Swipe to see location</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border bg-muted/10">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Overlay Info */}
      <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-md p-3 rounded-lg border shadow-sm z-10">
        <h3 className="font-semibold text-sm truncate">{post.title}</h3>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {post.location_label || "Unknown Location"}
        </p>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20 p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
