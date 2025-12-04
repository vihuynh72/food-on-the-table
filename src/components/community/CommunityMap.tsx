import React, { useEffect, useRef, useState } from "react";
import { CommunityPostWithUser } from "@/types/community";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";

interface CommunityMapProps {
  posts: CommunityPostWithUser[];
  selectedPostId?: string;
  onSelectPost: (post: CommunityPostWithUser) => void;
  userLocation?: { lat: number; lng: number } | null;
  onSearchArea?: (center: { lat: number; lng: number }, radius: number) => void;
}

export function CommunityMap({ 
  posts, 
  selectedPostId, 
  onSelectPost, 
  userLocation,
  onSearchArea 
}: CommunityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return;

    const initMap = () => {
      if (typeof window.google === "undefined") {
        // Retry if google is not yet loaded
        setTimeout(initMap, 100);
        return;
      }

      const defaultCenter = { lat: 40.7128, lng: -74.0060 }; // NYC default
      const center = userLocation || defaultCenter;

      googleMapRef.current = new window.google.maps.Map(mapRef.current!, {
        center,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      setIsMapLoaded(true);
    };

    initMap();
  }, [userLocation]);

  // Update Markers
  useEffect(() => {
    if (!googleMapRef.current || !isMapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    posts.forEach(post => {
      if (!post.location_lat || !post.location_lng) return;

      const marker = new window.google.maps.Marker({
        position: { lat: post.location_lat, lng: post.location_lng },
        map: googleMapRef.current,
        title: post.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: post.type === 'offer' ? "#16a34a" : "#f97316", // Green for offer, Orange for request
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => {
        onSelectPost(post);
      });

      markersRef.current.push(marker);
    });

  }, [posts, isMapLoaded, onSelectPost]);

  // Handle Search Area
  const handleSearchArea = () => {
    if (!googleMapRef.current || !onSearchArea) return;
    const center = googleMapRef.current.getCenter();
    if (center) {
      // Calculate radius based on bounds (approximate)
      const bounds = (googleMapRef.current as any).getBounds();
      let radius = 5000; // Default 5km
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        
        // Calculate distance manually if geometry library is not available
        const R = 6371e3; // metres
        const φ1 = ne.lat() * Math.PI/180;
        const φ2 = sw.lat() * Math.PI/180;
        const Δφ = (sw.lat()-ne.lat()) * Math.PI/180;
        const Δλ = (sw.lng()-ne.lng()) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        radius = distance / 2;
      }
      
      onSearchArea({ lat: center.lat(), lng: center.lng() }, radius);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-lg overflow-hidden border">
      <div ref={mapRef} className="w-full h-full" />
      
      {onSearchArea && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <Button 
            size="sm" 
            className="bg-background/90 text-foreground hover:bg-background shadow-md backdrop-blur-sm"
            onClick={handleSearchArea}
          >
            <Search className="w-4 h-4 mr-2" />
            Search this area
          </Button>
        </div>
      )}
    </div>
  );
}
